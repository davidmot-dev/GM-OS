import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WindowTransport, parseRelayMessage, RELAYED_TYPES, isRelayAvailable, type WindowMessage } from './windowTransport';

/** Pont Electron factice : enregistre ce qui est publié, permet d'injecter des messages. */
function installFakeRelay() {
    const published: string[] = [];
    /** Le type annoncé à côté du corps, sur lequel le process principal arbitre. */
    const publishedTypes: string[] = [];
    let listener: ((message: string, senderRole?: string) => void) | null = null;
    const detach = vi.fn(() => { listener = null; });

    (window as any).appBridge = {
        relay: {
            publish: (type: string, message: string) => {
                publishedTypes.push(type);
                published.push(message);
            },
            onMessage: (callback: (message: string, senderRole?: string) => void) => {
                listener = callback;
                return detach;
            },
        },
    };

    return {
        published,
        publishedTypes,
        detach,
        deliver: (raw: string, senderRole?: string) => listener?.(raw, senderRole),
        get attached() { return listener !== null; },
    };
}

describe('windowTransport', () => {
    afterEach(() => {
        delete (window as any).appBridge;
        vi.restoreAllMocks();
    });

    describe('RELAYED_TYPES', () => {
        it('ne contient que les flux dont la bascule est faite', () => {
            // Garde-fou volontaire : ajouter un type ici doit être un geste
            // délibéré, vérifié contre l'aller-retour JSON (voir le commentaire
            // de RELAYED_TYPES). Ce test échouera à la prochaine bascule — c'est
            // le rappel de refaire cette vérification.
            expect([...RELAYED_TYPES]).toEqual([
                'clock', 'combat', 'hub:ready', 'map', 'map:lock', 'map:unlock', 'whiteboard',
            ]);
        });
    });

    describe('isRelayAvailable', () => {
        it('est faux sans pont Electron', () => {
            expect(isRelayAvailable()).toBe(false);
        });

        it('est vrai quand le pont expose le relais', () => {
            installFakeRelay();
            expect(isRelayAvailable()).toBe(true);
        });
    });

    describe('aiguillage à l\'émission', () => {
        let received: WindowMessage[];
        let transport: WindowTransport;

        beforeEach(() => {
            received = [];
        });

        afterEach(() => {
            transport?.close();
        });

        it('envoie un flux relayé par le process principal', () => {
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-1', (m) => received.push(m));

            transport.publish({ type: 'clock', payload: { timestamp: 42 }, senderId: 'abc' });

            expect(relay.published).toHaveLength(1);
            expect(JSON.parse(relay.published[0])).toEqual({
                type: 'clock', payload: { timestamp: 42 }, senderId: 'abc',
            });
        });

        it('envoie combat par le process principal', () => {
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-combat', (m) => received.push(m));

            transport.publish({
                type: 'combat',
                payload: { combatants: [{ id: 'c1', statuses: [] }], round: 2, currentTurnIdx: 0, isCombatProjected: true },
                senderId: 'abc',
            });

            expect(relay.published).toHaveLength(1);
            expect(JSON.parse(relay.published[0]).payload.round).toBe(2);
        });

        it('envoie le flux carte par le process principal, brouillard compris', () => {
            // Le brouillard est le plus gros payload de ce flux, mais c'est une
            // seule longue chaîne : la mesure du 2026-08-06 l'a montré quasi
            // gratuit à relayer, contrairement aux graphes d'objets.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-carte', (m) => received.push(m));

            transport.publish({
                type: 'map',
                payload: {
                    projectionTarget: 'hub',
                    projectedTokens: [{ id: 'tok-1', x: 10, y: 20, size: 1 }],
                    projectedFogDataUrl: 'data:image/png;base64,AAAA',
                    projectedPings: [],
                },
                senderId: 'abc',
            });

            expect(relay.published).toHaveLength(1);
            const sent = JSON.parse(relay.published[0]);
            expect(sent.payload.projectedTokens[0].x).toBe(10);
            expect(sent.payload.projectedFogDataUrl).toBe('data:image/png;base64,AAAA');
        });

        it('préserve un null du flux carte, que JSON distingue d\'un absent', () => {
            // projectedFogDataUrl est `string | null` : effacer le brouillard
            // se transmet en envoyant null, et null survit à JSON — undefined non.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-carte-null', (m) => received.push(m));

            transport.publish({ type: 'map', payload: { projectedFogDataUrl: null }, senderId: 'abc' });

            const sent = JSON.parse(relay.published[0]);
            expect(sent.payload).toHaveProperty('projectedFogDataUrl');
            expect(sent.payload.projectedFogDataUrl).toBeNull();
        });

        it('envoie les verrous de jetons par le process principal', () => {
            // C'est ce passage qui permet au registre du main d'observer qui
            // détient quoi, et donc de libérer à la fermeture d'une fenêtre.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-verrous', (m) => received.push(m));

            transport.publish({ type: 'map:lock', payload: { tokenId: 'jeton-1' }, senderId: 'abc' });
            transport.publish({ type: 'map:unlock', payload: { tokenId: 'jeton-1' }, senderId: 'abc' });

            expect(relay.published.map(m => JSON.parse(m).type)).toEqual(['map:lock', 'map:unlock']);
        });

        it('sérialise avant d\'émettre, jamais un objet', () => {
            // Condition de performance mesurée le 2026-08-06 : le relais refuse
            // les objets, et c'est l'appelant qui doit sérialiser.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-2', (m) => received.push(m));

            transport.publish({ type: 'clock', payload: { tensions: [{ id: 't1' }] }, senderId: 'abc' });

            expect(typeof relay.published[0]).toBe('string');
        });

        it('envoie hub:ready par le process principal, sans payload', () => {
            // Dernier type passé de l'autre côté. L'enjeu n'est pas la
            // performance — l'enveloppe est vide — mais l'ordre d'arrivée : tant
            // que ce signal doublait par le canal rapide l'état qu'il déclenche,
            // le maître pouvait répondre avant que le demandeur soit à jour.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-annonce', (m) => received.push(m));

            transport.publish({ type: 'hub:ready', senderId: 'abc' });

            expect(relay.published).toHaveLength(1);
            expect(JSON.parse(relay.published[0])).toEqual({ type: 'hub:ready', senderId: 'abc' });
        });

        it('laisse un type inconnu sur le BroadcastChannel', () => {
            // Plus aucun type de l'application n'emprunte l'ancien chemin dans
            // l'app de bureau : ce test garde l'aiguillage lui-même, pour qu'un
            // type ajouté sans passer par RELAYED_TYPES continue d'être livré.
            const relay = installFakeRelay();
            const listener = new BroadcastChannel('canal-test-3');
            const seen: WindowMessage[] = [];
            listener.onmessage = (e) => seen.push(e.data);

            transport = new WindowTransport('canal-test-3', (m) => received.push(m));
            transport.publish({ type: 'type:jamais-bascule', senderId: 'abc' });

            expect(relay.published).toHaveLength(0);
            listener.close();
        });

        it('envoie le tableau blanc par le process principal', () => {
            // C'est le flux que l'étape 1 avait mesuré à +19 ms sous sa forme
            // objet ; la pré-sérialisation du relais annule cet écart.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-tableau', (m) => received.push(m));

            transport.publish({
                type: 'whiteboard',
                payload: {
                    paths: [{ id: 'p1', color: '#fff', width: 4, tool: 'brush', points: [{ x: 1, y: 2 }] }],
                    activePath: null,
                    version: 3,
                },
                senderId: 'abc',
            });

            expect(relay.published).toHaveLength(1);
            const sent = JSON.parse(relay.published[0]);
            expect(sent.payload.paths[0].points[0]).toEqual({ x: 1, y: 2 });
            expect(sent.payload.activePath).toBeNull();
        });

        it('retombe sur le BroadcastChannel quand le relais n\'existe pas', async () => {
            // Cas de la tablette en PWA et du navigateur de développement :
            // aucun process principal, tout doit continuer de fonctionner. La
            // tablette émet `hub:ready` comme les autres fenêtres secondaires,
            // et c'est justement un type relayé — l'absence de relais doit donc
            // le ramener sur l'ancien chemin, pas le faire disparaître.
            const listener = new BroadcastChannel('canal-test-4');
            const seen: WindowMessage[] = [];
            listener.onmessage = (e) => seen.push(e.data);

            transport = new WindowTransport('canal-test-4', (m) => received.push(m));
            transport.publish({ type: 'hub:ready', senderId: 'abc' });

            // Le BroadcastChannel ne livre pas dans le tour de boucle courant.
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(seen).toEqual([{ type: 'hub:ready', senderId: 'abc' }]);
            listener.close();
        });
    });

    describe('réception', () => {
        let received: WindowMessage[];
        let transport: WindowTransport;

        beforeEach(() => { received = []; });
        afterEach(() => { transport?.close(); });

        it('remonte un message venu du relais, décodé', () => {
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-5', (m) => received.push(m));

            relay.deliver(JSON.stringify({ type: 'clock', payload: { timestamp: 7 }, senderId: 'autre' }));

            expect(received).toEqual([{ type: 'clock', payload: { timestamp: 7 }, senderId: 'autre' }]);
        });

        it('ignore un JSON illisible sans lever', () => {
            // Un message perdu vaut mieux qu'une fenêtre qui cesse d'écouter.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-6', (m) => received.push(m));

            expect(() => relay.deliver('{ceci n\'est pas du json')).not.toThrow();
            expect(received).toHaveLength(0);
        });

        it('ignore un message sans type', () => {
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-7', (m) => received.push(m));

            relay.deliver(JSON.stringify({ payload: {}, senderId: 'autre' }));

            expect(received).toHaveLength(0);
        });

        it('détache l\'écoute du relais à la fermeture', () => {
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-8', (m) => received.push(m));

            expect(relay.attached).toBe(true);
            transport.close();

            expect(relay.detach).toHaveBeenCalled();
        });
    });

    describe('parseRelayMessage', () => {
        it('décode une enveloppe valide', () => {
            expect(parseRelayMessage('{"type":"clock","senderId":"x"}'))
                .toEqual({ type: 'clock', senderId: 'x' });
        });

        it('rejette ce qui n\'est pas une chaîne', () => {
            expect(parseRelayMessage({ type: 'clock' })).toBeNull();
            expect(parseRelayMessage(42)).toBeNull();
            expect(parseRelayMessage(null)).toBeNull();
            expect(parseRelayMessage(undefined)).toBeNull();
        });

        it('rejette un JSON valide mais qui n\'est pas une enveloppe', () => {
            expect(parseRelayMessage('null')).toBeNull();
            expect(parseRelayMessage('"une chaine"')).toBeNull();
            expect(parseRelayMessage('42')).toBeNull();
            expect(parseRelayMessage('{"payload":{}}')).toBeNull();
        });

        it('rejette un JSON tronqué', () => {
            expect(parseRelayMessage('{"type":"clo')).toBeNull();
        });
    });
});
