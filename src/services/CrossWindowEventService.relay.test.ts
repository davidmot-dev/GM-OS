import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installWindowRelay, type RelayTarget } from '../../electron/WindowRelay';
import type { RelayRole } from '../../electron/relayPolicy';

/**
 * Harnais à deux fenêtres, pour reproduire la panne du tableau blanc sur le
 * Player Hub (bascule `1ae1936`, annulée par `79610ac`).
 *
 * **Pourquoi un harnais et pas un test ordinaire.** Deux fenêtres doivent avoir
 * des stores *indépendants*, or les stores Zustand sont des singletons de module.
 * Chaque « fenêtre » est donc un graphe de modules chargé séparément
 * (`vi.resetModules()` + import dynamique), avec son propre service et ses
 * propres stores.
 *
 * **Fidélité.** La livraison passe par le vrai `relayToOthers` du process
 * principal — même exclusion de l'émetteur qu'en production — et reste
 * asynchrone, comme l'IPC.
 *
 * **Pourquoi le transport est tout de même sous-classé.** Les deux graphes de
 * modules partagent le `window` de jsdom, donc le même `window.appBridge`. Le
 * vrai `WindowTransport` relit ce pont à chaque `publish` : après le chargement
 * de la seconde fenêtre, la première publierait sous l'identité de la seconde et
 * le relais ne l'exclurait plus. La sous-classe fige le pont au chargement, ce
 * qu'un process de rendu distinct fait naturellement en production. Elle ne
 * change ni l'aiguillage ni l'encodage.
 */

/**
 * Persistance neutralisée pour tout le fichier.
 *
 * Les deux graphes de modules partagent le `localStorage` de jsdom, donc la même
 * clé de persistance : leurs écritures se disputaient, et la réhydratation de la
 * seconde fenêtre récupérait ce que la première venait d'écrire. Ce harnais porte
 * sur le protocole de synchronisation, pas sur la persistance.
 */
vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => { /* rien */ },
    removeItem: () => { /* rien */ },
    clear: () => { /* rien */ },
    key: () => null,
    length: 0,
});

/**
 * Relais partagé : route les messages entre les fenêtres enregistrées.
 *
 * La publication passe par le **vrai** `installWindowRelay`, branché sur un
 * `ipcMain` factice — donc par la politique de rôle, comme en production. Un
 * message refusé n'atteint personne, et le refus est consultable dans `denials`.
 */
function createRelayHub(roleOf: (windowId: number) => RelayRole = () => 'gm') {
    const subscribers = new Map<number, Set<(message: string, senderRole?: string) => void>>();
    // Les services d'un test précédent restent vivants — rien ne les arrête — et
    // le `relayTimer` de 50 ms du maître se déclenche pendant le test suivant,
    // publiant l'état d'avant dans les nouvelles fenêtres. Une génération rend
    // les anciens ponts inertes.
    let generation = 0;

    const denials: Array<{ role: RelayRole; type: string; detail: string }> = [];

    const targets = (): RelayTarget[] =>
        [...subscribers.keys()].map(id => ({
            id,
            isDestroyed: () => false,
            send: (_channel: string, message: string, senderRole: RelayRole) => {
                // L'IPC est asynchrone : livrer de façon synchrone créerait une
                // réentrance qui n'existe pas en production.
                queueMicrotask(() => subscribers.get(id)?.forEach(cb => cb(message, senderRole)));
            },
        }));

    let handler: ((event: { sender: { id: number } }, type: unknown, message: unknown) => void) | null = null;

    installWindowRelay(
        { on: (_channel: string, listener: typeof handler) => { handler = listener; } },
        targets,
        {
            resolveRole: roleOf,
            onDenied: (role, type, detail) => denials.push({ role, type, detail }),
        },
    );

    return {
        denials,
        bridgeFor(windowId: number) {
            const myGeneration = generation;
            if (!subscribers.has(windowId)) subscribers.set(windowId, new Set());
            return {
                relay: {
                    publish: (type: string, message: string) => {
                        if (myGeneration !== generation) return;
                        handler?.({ sender: { id: windowId } }, type, message);
                    },
                    onMessage: (cb: (message: string, senderRole?: string) => void) => {
                        const set = subscribers.get(windowId)!;
                        set.add(cb);
                        return () => set.delete(cb);
                    },
                },
            };
        },
        reset() {
            generation += 1;
            subscribers.clear();
            denials.length = 0;
        },
    };
}

/** Laisse le temps aux livraisons asynchrones de s'effectuer. */
const settle = async (turns = 6) => {
    for (let i = 0; i < turns; i++) await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Attend au-delà des 50 ms du `relayTimer` du maître, qui reprogramme un
 * `broadcastFullState()` après chaque message reçu d'une fenêtre secondaire.
 * Sans cette attente, tout le chemin de rediffusion reste inexercé.
 */
const settleWithRelayTimer = async () => {
    await new Promise(resolve => setTimeout(resolve, 120));
    await settle();
};

describe('relais — deux fenêtres, tableau blanc', () => {
    // La fenêtre 1 est le MJ, la fenêtre 2 le Player Hub : la politique de rôle
    // s'applique donc ici comme en production.
    const hub = createRelayHub((id) => (id === 1 ? 'gm' : 'hub'));

    let gm: any;
    let hubWin: any;
    let wbGm: any;
    let wbHub: any;

    /** Charge un graphe de modules complet pour une fenêtre. */
    async function loadWindow(windowId: number) {
        vi.resetModules();
        (window as any).appBridge = hub.bridgeFor(windowId);

        vi.doMock('./windowTransport', async (importOriginal) => {
            const actual = await importOriginal<typeof import('./windowTransport')>();
            const capturedRelay = (window as any).appBridge?.relay;

            class HarnessTransport extends actual.WindowTransport {
                publish(message: import('./windowTransport').WindowMessage) {
                    if (capturedRelay && actual.RELAYED_TYPES.has(message.type)) {
                        capturedRelay.publish(message.type, JSON.stringify(message));
                        return;
                    }
                    super.publish(message);
                }
            }

            return { ...actual, WindowTransport: HarnessTransport };
        });

        const service = (await import('./CrossWindowEventService')).crossWindowSync;
        const store = (await import('../modules/whiteboard/useWhiteboardStore')).useWhiteboardStore;
        return { service, store };
    }

    beforeEach(async () => {
        hub.reset();

        const a = await loadWindow(1);
        gm = a.service;
        wbGm = a.store;

        const b = await loadWindow(2);
        hubWin = b.service;
        wbHub = b.store;

        gm.init(true);       // fenêtre MJ — maître
        hubWin.init(false);  // Player Hub — esclave
        await settle();
    });

    afterEach(() => {
        vi.doUnmock('./windowTransport');
        delete (window as any).appBridge;
    });

    it('les deux fenêtres ont bien des stores indépendants', () => {
        // Garde-fou du harnais lui-même : sans cela, tout le reste ne prouverait rien.
        wbGm.setState({ version: 111 });
        expect(wbHub.getState().version).not.toBe(111);
    });

    it('le MJ projette vers le hub : le hub reçoit la cible et les tracés', async () => {
        wbGm.getState().addPath({
            id: 'p1', points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }],
            color: '#fff', width: 4, tool: 'brush',
        });
        wbGm.setState({ projectionTarget: 'hub' });
        await settle();

        expect(wbHub.getState().projectionTarget).toBe('hub');
        expect(wbHub.getState().paths.map((p: any) => p.id)).toContain('p1');
    });

    it('le hub dessine à son tour : la projection ne doit pas s\'éteindre', async () => {
        // C'est la topologie propre au tableau blanc — le Player Hub est le seul
        // flux basculé dont la fenêtre secondaire est aussi ÉMETTRICE.
        wbGm.setState({ projectionTarget: 'hub' });
        await settle();
        expect(wbHub.getState().projectionTarget).toBe('hub');

        wbHub.getState().setActivePath({
            id: 'active', points: [{ x: 0.3, y: 0.3 }, { x: 0.4, y: 0.4 }],
            color: '#f00', width: 2, tool: 'brush',
        }, 'dessinateur-hub');
        await settle();

        expect(wbGm.getState().activePath?.id).toBe('active');
        expect(wbHub.getState().projectionTarget).toBe('hub');
        expect(wbGm.getState().projectionTarget).toBe('hub');
    });

    it('le hub termine son tracé : les deux fenêtres convergent', async () => {
        wbGm.setState({ projectionTarget: 'hub' });
        await settle();

        wbHub.getState().finishDrawing({
            id: 'trace-hub', points: [{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.6 }],
            color: '#0f0', width: 3, tool: 'brush',
        });
        await settle();

        expect(wbGm.getState().paths.map((p: any) => p.id)).toContain('trace-hub');
        expect(wbHub.getState().paths.map((p: any) => p.id)).toContain('trace-hub');
        expect(wbHub.getState().projectionTarget).toBe('hub');
    });

    it('le hub s\'annonce : le maître lui envoie l\'état complet', async () => {
        // Chemin de synchronisation initiale : le hub publie `hub:ready`, le
        // maître répond par broadcastFullState(). Depuis la bascule de ce type,
        // l'annonce et la réponse empruntent le même canal — c'est la propriété
        // recherchée : l'annonce ne peut plus doubler l'état qu'elle déclenche.
        wbGm.getState().addPath({
            id: 'deja-la', points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }],
            color: '#fff', width: 4, tool: 'brush',
        });
        wbGm.setState({ projectionTarget: 'hub' });
        wbHub.setState({ paths: [], projectionTarget: null });
        await settle();

        hubWin.notifyReady();
        await settleWithRelayTimer();

        expect(wbHub.getState().projectionTarget).toBe('hub');
        expect(wbHub.getState().paths.map((p: any) => p.id)).toContain('deja-la');
    });

    it('la rediffusion du maître n\'efface pas le tracé en cours du hub', async () => {
        // Le maître reprogramme un broadcastFullState() 50 ms après chaque
        // message reçu. Si sa vue est en retard, elle peut écraser celle du hub.
        wbGm.setState({ projectionTarget: 'hub' });
        await settle();

        wbHub.getState().finishDrawing({
            id: 'trace-hub', points: [{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.6 }],
            color: '#0f0', width: 3, tool: 'brush',
        });
        await settleWithRelayTimer();

        expect(wbHub.getState().paths.map((p: any) => p.id)).toContain('trace-hub');
        expect(wbGm.getState().paths.map((p: any) => p.id)).toContain('trace-hub');
        expect(wbHub.getState().projectionTarget).toBe('hub');
    });

    it('une fenêtre secondaire n\'émet rien avant d\'avoir reçu l\'état partagé', async () => {
        // La garde de démarrage. Elle est testée ici plutôt que dans les tests de
        // protocole parce qu'elle ne vaut qu'une fois par instance : il faut un
        // service neuf, donc un graphe de modules neuf.
        const vuParLeMaitre: string[] = [];
        wbGm.subscribe((s: any) => vuParLeMaitre.push(...s.paths.map((p: any) => p.id)));

        wbHub.getState().addPath({
            id: 'avant-sync', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            color: '#fff', width: 2, tool: 'brush',
        });
        await settleWithRelayTimer();

        expect(vuParLeMaitre).not.toContain('avant-sync');
        expect(wbGm.getState().paths.map((p: any) => p.id)).not.toContain('avant-sync');
    });

    it('elle émet dès qu\'elle a reçu l\'état partagé', async () => {
        wbGm.setState({ projectionTarget: 'hub' });
        await settle();

        wbHub.getState().addPath({
            id: 'apres-sync', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            color: '#fff', width: 2, tool: 'brush',
        });
        await settle();

        expect(wbGm.getState().paths.map((p: any) => p.id)).toContain('apres-sync');
    });

    it('les verrous échappent à la garde de démarrage', async () => {
        // Les retenir laisserait un jeton saisissable deux fois pendant les
        // premières secondes d'une fenêtre.
        expect(hubWin.requestLock('jeton-1')).toBe(true);
        await settle();

        expect(gm.isTokenLocked('jeton-1')).toBe(true);
    });

    it('les échanges se stabilisent au lieu de boucler', async () => {
        wbGm.setState({ projectionTarget: 'hub' });
        await settle();

        wbHub.getState().finishDrawing({
            id: 't1', points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }],
            color: '#fff', width: 3, tool: 'brush',
        });
        await settle(30);

        const versionApres = wbGm.getState().version;
        await settle(30);

        // Si les deux fenêtres se renvoyaient indéfiniment leurs mises à jour,
        // la version continuerait de grimper sans que personne n'agisse.
        expect(wbGm.getState().version).toBe(versionApres);
    });
});
