import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WindowTransport, parseRelayMessage, RELAYED_TYPES, isRelayAvailable, type WindowMessage } from './windowTransport';

/** Pont Electron factice : enregistre ce qui est publié, permet d'injecter des messages. */
function installFakeRelay() {
    const published: string[] = [];
    let listener: ((message: string) => void) | null = null;
    const detach = vi.fn(() => { listener = null; });

    (window as any).appBridge = {
        relay: {
            publish: (message: string) => published.push(message),
            onMessage: (callback: (message: string) => void) => {
                listener = callback;
                return detach;
            },
        },
    };

    return {
        published,
        detach,
        deliver: (raw: string) => listener?.(raw),
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
            expect([...RELAYED_TYPES]).toEqual(['clock', 'combat']);
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

        it('sérialise avant d\'émettre, jamais un objet', () => {
            // Condition de performance mesurée le 2026-08-06 : le relais refuse
            // les objets, et c'est l'appelant qui doit sérialiser.
            const relay = installFakeRelay();
            transport = new WindowTransport('canal-test-2', (m) => received.push(m));

            transport.publish({ type: 'clock', payload: { tensions: [{ id: 't1' }] }, senderId: 'abc' });

            expect(typeof relay.published[0]).toBe('string');
        });

        it('laisse les flux non bascules sur le BroadcastChannel', () => {
            const relay = installFakeRelay();
            const listener = new BroadcastChannel('canal-test-3');
            const seen: WindowMessage[] = [];
            listener.onmessage = (e) => seen.push(e.data);

            transport = new WindowTransport('canal-test-3', (m) => received.push(m));
            transport.publish({ type: 'whiteboard', payload: { paths: [] }, senderId: 'abc' });

            expect(relay.published).toHaveLength(0);
            listener.close();
        });

        it('retombe sur le BroadcastChannel quand le relais n\'existe pas', () => {
            // Cas de la tablette en PWA et du navigateur de développement :
            // aucun process principal, tout doit continuer de fonctionner.
            transport = new WindowTransport('canal-test-4', (m) => received.push(m));

            expect(() => transport.publish({ type: 'clock', payload: {}, senderId: 'abc' })).not.toThrow();
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
