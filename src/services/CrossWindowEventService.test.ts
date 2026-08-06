import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Le service s'abonne à cinq stores et parle sur un BroadcastChannel. On
 * substitue les deux : ce qui est testé ici est le protocole — verrous de
 * jetons, filtrage des messages, garde anti-boucle — pas le contenu des stores.
 */
const channels = vi.hoisted(() => [] as any[]);

class FakeBroadcastChannel {
    public onmessage: ((event: { data: any }) => void) | null = null;
    public posted: any[] = [];
    public name: string;
    constructor(name: string) {
        this.name = name;
        channels.push(this);
    }
    postMessage(data: any) { this.posted.push(data); }
    close() { /* rien */ }
    addEventListener() { /* rien */ }
    removeEventListener() { /* rien */ }
}

vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);

const makeStore = vi.hoisted(() => () => {
    let state: any = {};
    return {
        getState: () => state,
        setState: (updater: any) => {
            state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
        },
        subscribe: vi.fn(),
    };
});

const stores = vi.hoisted(() => ({
    map: null as any,
    mapUI: null as any,
    whiteboard: null as any,
    clock: null as any,
    combat: null as any,
}));
stores.map = makeStore();
stores.mapUI = makeStore();
stores.whiteboard = makeStore();
stores.clock = makeStore();
stores.combat = makeStore();

vi.mock('../modules/map/useMapStore', () => ({ useMapStore: stores.map }));
vi.mock('../modules/map/useMapUIStore', () => ({ useMapUIStore: stores.mapUI }));
vi.mock('../modules/whiteboard/useWhiteboardStore', () => ({ useWhiteboardStore: stores.whiteboard }));
vi.mock('../store/useClockStore', () => ({ useClockStore: stores.clock }));
vi.mock('../modules/combat/useCombatStore', () => ({ useCombatStore: stores.combat }));

const { crossWindowSync, stripProjectionTarget } = await import('./CrossWindowEventService');

/** Le canal créé par le singleton à l'import. */
const channel = () => channels[0] as FakeBroadcastChannel;

/** Identifiant d'instance, déduit du premier message émis. */
function ownInstanceId(): string {
    crossWindowSync.broadcast('sonde', {});
    const msg = channel().posted.pop();
    return msg.senderId;
}

/** Simule l'arrivée d'un message venu d'une autre fenêtre. */
function receive(type: string, payload: any, senderId = 'autre-fenetre') {
    channel().onmessage?.({ data: { type, payload, senderId } });
}

beforeEach(() => {
    // Rôle explicite à chaque test. Une fenêtre secondaire n'émet pas tant
    // qu'elle n'a pas reçu l'état partagé (voir « garde de démarrage » plus bas) ;
    // les tests de protocole ci-dessous portent sur l'émission, pas sur cette
    // garde, et doivent donc partir d'une instance maître.
    crossWindowSync.init(true);
    channel().posted.length = 0;
    stores.map.setState({});
    stores.mapUI.setState({});
});

afterEach(() => {
    vi.useRealTimers();
});

describe('stripProjectionTarget', () => {
    it('retire la cible de projection', () => {
        expect(stripProjectionTarget({ paths: [], projectionTarget: null }))
            .toEqual({ paths: [] });
    });

    it('ne modifie pas le payload d\'origine', () => {
        // Le payload reçu peut être partagé avec d'autres destinataires.
        const original = { paths: [], projectionTarget: 'hub' };
        stripProjectionTarget(original);
        expect(original.projectionTarget).toBe('hub');
    });

    it('laisse intact un payload qui n\'en porte pas', () => {
        const payload = { paths: [] };
        expect(stripProjectionTarget(payload)).toBe(payload);
    });

    it('tolère l\'absence de payload', () => {
        expect(stripProjectionTarget(undefined)).toBeUndefined();
        expect(stripProjectionTarget(null)).toBeNull();
        expect(stripProjectionTarget('texte')).toBe('texte');
    });

    it('retire même une cible valide — la décision appartient au MJ', () => {
        expect(stripProjectionTarget({ projectionTarget: 'monitor' })).toEqual({});
    });
});

describe('broadcast', () => {
    it('émet le type, le payload et son identifiant d\'émetteur', () => {
        crossWindowSync.broadcast('map', { projectionTarget: 'hub' });

        expect(channel().posted).toHaveLength(1);
        expect(channel().posted[0]).toMatchObject({
            type: 'map',
            payload: { projectionTarget: 'hub' },
        });
        expect(typeof channel().posted[0].senderId).toBe('string');
    });
});

describe('verrous de jetons', () => {
    it('accorde un verrou libre et l\'annonce', () => {
        expect(crossWindowSync.requestLock('jeton-1')).toBe(true);
        expect(channel().posted.at(-1)).toMatchObject({ type: 'map:lock', payload: { tokenId: 'jeton-1' } });
    });

    it('ne considère pas comme verrouillé un jeton qu\'on détient soi-même', () => {
        crossWindowSync.requestLock('jeton-2');
        expect(crossWindowSync.isTokenLocked('jeton-2')).toBe(false);
    });

    it('refuse un jeton verrouillé par une autre fenêtre', () => {
        receive('map:lock', { tokenId: 'jeton-3' });

        expect(crossWindowSync.isTokenLocked('jeton-3')).toBe(true);
        expect(crossWindowSync.requestLock('jeton-3')).toBe(false);
    });

    it('libère un jeton sur annonce de déverrouillage', () => {
        receive('map:lock', { tokenId: 'jeton-4' });
        expect(crossWindowSync.isTokenLocked('jeton-4')).toBe(true);

        receive('map:unlock', { tokenId: 'jeton-4' });
        expect(crossWindowSync.isTokenLocked('jeton-4')).toBe(false);
    });

    it('reprend un verrou étranger périmé au bout de cinq secondes', () => {
        // Sans cette expiration, une fenêtre fermée en cours de glisser-déposer
        // immobiliserait le jeton définitivement.
        vi.useFakeTimers();
        receive('map:lock', { tokenId: 'jeton-5' });
        expect(crossWindowSync.requestLock('jeton-5')).toBe(false);

        vi.advanceTimersByTime(5001);

        expect(crossWindowSync.isTokenLocked('jeton-5')).toBe(false);
        expect(crossWindowSync.requestLock('jeton-5')).toBe(true);
    });

    it('relâche son propre verrou et l\'annonce', () => {
        crossWindowSync.requestLock('jeton-6');
        crossWindowSync.releaseLock('jeton-6');

        expect(channel().posted.at(-1)).toMatchObject({ type: 'map:unlock', payload: { tokenId: 'jeton-6' } });
        expect(crossWindowSync.isTokenLocked('jeton-6')).toBe(false);
    });
});

describe('filtrage des messages', () => {
    it('ignore ses propres messages', () => {
        // Garde essentielle : sans elle, chaque diffusion se réappliquerait
        // localement et relancerait une diffusion.
        const self = ownInstanceId();
        channel().posted.length = 0;

        receive('map:lock', { tokenId: 'jeton-echo' }, self);

        expect(crossWindowSync.isTokenLocked('jeton-echo')).toBe(false);
    });

    it('applique la mise à jour d\'une autre fenêtre', () => {
        crossWindowSync.init(false); // fenêtre secondaire
        receive('clock', { timerRemaining: 42 });

        expect(stores.clock.getState().timerRemaining).toBe(42);
    });
});

describe('flux du tableau blanc — volume du payload', () => {
    /**
     * Abonné réel du store, récupéré depuis le `subscribe` substitué.
     * `init()` en réenregistre un à chaque test ; le dernier est celui de
     * l'instance dans son état courant.
     */
    const subscriber = () => stores.whiteboard.subscribe.mock.calls.at(-1)![0] as (s: any) => void;

    /** État de tableau blanc minimal, hors tracé en cours pour éviter l'étranglement. */
    const wbState = (paths: any[], extra: Record<string, unknown> = {}) => ({
        paths,
        activePath: null,
        laserPointer: null,
        activeDrawerId: null,
        version: 1,
        projectionTarget: 'hub',
        ...extra,
    });

    const lastWhiteboard = () => channel().posted.filter(m => m.type === 'whiteboard').at(-1);

    beforeEach(() => {
        // Le service est un singleton partagé par tout le fichier, et les tests
        // précédents ont pu lever sa garde de démarrage. On repart d'un état
        // connu, sinon l'ordre d'exécution déciderait du résultat.
        (crossWindowSync as any).hasReceivedSharedState = false;
        (crossWindowSync as any).lastBroadcastPaths = null;
    });

    it('envoie les tracés au premier passage', () => {
        const paths = [{ id: 'p1' }];
        subscriber()(wbState(paths));

        expect(lastWhiteboard().payload.paths).toBe(paths);
    });

    it('les omet tant qu\'ils n\'ont pas changé', () => {
        // Le cas courant : c'est `activePath` ou `laserPointer` qui bouge, pas
        // les tracés. Les renvoyer coûtait 106 Ko par mise à jour.
        const paths = [{ id: 'p1' }];
        subscriber()(wbState(paths));
        subscriber()(wbState(paths, { laserPointer: { x: 0.5, y: 0.5 } }));

        const sent = lastWhiteboard().payload;
        expect(sent).not.toHaveProperty('paths');
        expect(sent.laserPointer).toEqual({ x: 0.5, y: 0.5 });
    });

    it('les renvoie dès que le tableau change', () => {
        const paths = [{ id: 'p1' }];
        subscriber()(wbState(paths));
        const suivants = [{ id: 'p1' }, { id: 'p2' }];
        subscriber()(wbState(suivants));

        expect(lastWhiteboard().payload.paths).toBe(suivants);
    });

    it('renvoie aussi un tableau vidé — la référence change', () => {
        // Effacer le tableau produit un nouveau tableau vide. Sans cela, un
        // effacement serait le seul changement jamais transmis.
        subscriber()(wbState([{ id: 'p1' }]));
        subscriber()(wbState([]));

        expect(lastWhiteboard().payload.paths).toEqual([]);
    });

    it('ne considère pas comme envoyés des tracés retenus par la garde de démarrage', () => {
        // Une fenêtre secondaire n'émet rien avant d'avoir reçu l'état partagé.
        // Si elle notait quand même ce qu'elle « a envoyé », les tracés
        // manqueraient définitivement une fois la garde levée.
        crossWindowSync.init(false);
        channel().posted.length = 0;

        const paths = [{ id: 'p1' }];
        subscriber()(wbState(paths));
        expect(channel().posted).toHaveLength(0);

        receive('clock', { timerRemaining: 1 }); // lève la garde
        subscriber()(wbState(paths));

        expect(lastWhiteboard().payload.paths).toBe(paths);
    });
});

describe('garde anti-boucle', () => {
    it('signale une synchronisation en cours pendant l\'application', () => {
        crossWindowSync.init(false);

        // isSyncing doit être vrai *pendant* l'application, pour que les
        // abonnés aux stores n'en rediffusent pas l'effet.
        let seenDuringApply: boolean | null = null;
        stores.combat.setState = (updater: any) => {
            seenDuringApply = crossWindowSync.isSyncing();
            void updater;
        };

        receive('combat', { round: 3 });

        expect(seenDuringApply).toBe(true);
        expect(crossWindowSync.isSyncing()).toBe(false);
    });
});
