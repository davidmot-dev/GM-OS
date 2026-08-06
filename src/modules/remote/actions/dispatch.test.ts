import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * On substitue aux vrais handlers des espions : ce qui est testé ici est la
 * répartition — quel type atteint quel handler, et quand la synchronisation de
 * fin de traitement est déclenchée — indépendamment de ce que font les stores.
 */
const spies = vi.hoisted(() => ({
    roll: vi.fn(),
    laser: vi.fn(),
    nextTurn: vi.fn(),
    boom: vi.fn(() => { throw new Error('handler cassé'); }),
}));

vi.mock('./diceActions', () => ({
    diceActions: { 'dice:roll': spies.roll, 'remote:dice:roll': spies.roll },
}));
vi.mock('./audioActions', () => ({ audioActions: {} }));
vi.mock('./combatActions', () => ({
    combatActions: { 'combat:next-turn': spies.nextTurn, 'combat:explose': spies.boom },
}));
vi.mock('./sessionActions', () => ({ sessionActions: {} }));
vi.mock('./whiteboardActions', () => ({
    whiteboardActions: { 'whiteboard:set-laser-pointer': spies.laser },
}));
vi.mock('./sceneActions', () => ({ sceneActions: {} }));

const { dispatchRemoteAction, isKnownActionType } = await import('./index');

const sync = vi.fn();
const ctx = { activeCampaignId: 'camp-1', sync };

beforeEach(() => {
    vi.clearAllMocks();
});

describe('dispatchRemoteAction — routage', () => {
    it('achemine une action vers son handler avec le payload et le contexte', () => {
        expect(dispatchRemoteAction({ type: 'dice:roll', payload: { sides: 20 } }, ctx)).toBe(true);

        expect(spies.roll).toHaveBeenCalledTimes(1);
        expect(spies.roll).toHaveBeenCalledWith({ sides: 20 }, ctx);
    });

    it('fait converger les alias vers le même handler', () => {
        dispatchRemoteAction({ type: 'dice:roll' }, ctx);
        dispatchRemoteAction({ type: 'remote:dice:roll' }, ctx);

        expect(spies.roll).toHaveBeenCalledTimes(2);
    });

    it('n\'appelle qu\'un seul handler par action', () => {
        dispatchRemoteAction({ type: 'combat:next-turn' }, ctx);

        expect(spies.nextTurn).toHaveBeenCalledTimes(1);
        expect(spies.roll).not.toHaveBeenCalled();
    });
});

describe('dispatchRemoteAction — types refusés', () => {
    it('ignore un type inconnu sans rien synchroniser', () => {
        expect(dispatchRemoteAction({ type: 'combat:supprimer-tout' }, ctx)).toBe(false);
        expect(sync).not.toHaveBeenCalled();
    });

    it('ignore une action sans type', () => {
        expect(dispatchRemoteAction({ type: '' }, ctx)).toBe(false);
        expect(dispatchRemoteAction({} as any, ctx)).toBe(false);
        expect(dispatchRemoteAction(null as any, ctx)).toBe(false);
        expect(sync).not.toHaveBeenCalled();
    });

    it('ignore un type non textuel', () => {
        expect(dispatchRemoteAction({ type: 42 as any }, ctx)).toBe(false);
    });

    it('résiste aux noms hérités du prototype', () => {
        // Sans hasOwnProperty, registry["constructor"] renverrait une fonction
        // et un client du réseau pourrait la faire appeler.
        for (const type of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
            expect(isKnownActionType(type)).toBe(false);
            expect(dispatchRemoteAction({ type }, ctx)).toBe(false);
        }
        expect(sync).not.toHaveBeenCalled();
    });
});

describe('dispatchRemoteAction — synchronisation de fin de traitement', () => {
    it('diffuse une fois après une action reconnue', () => {
        dispatchRemoteAction({ type: 'combat:next-turn' }, ctx);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(sync).toHaveBeenCalledWith(true);
    });

    it('ne diffuse pas pour les actions à haute fréquence', () => {
        dispatchRemoteAction({ type: 'whiteboard:set-laser-pointer', payload: { x: 1, y: 2 } }, ctx);

        expect(spies.laser).toHaveBeenCalledTimes(1);
        expect(sync).not.toHaveBeenCalled();
    });
});

describe('dispatchRemoteAction — robustesse', () => {
    it('absorbe l\'échec d\'un handler sans propager l\'exception', () => {
        expect(() => dispatchRemoteAction({ type: 'combat:explose' }, ctx)).not.toThrow();
        expect(dispatchRemoteAction({ type: 'combat:explose' }, ctx)).toBe(false);
    });

    it('ne diffuse pas quand le handler a échoué', () => {
        dispatchRemoteAction({ type: 'combat:explose' }, ctx);

        expect(sync).not.toHaveBeenCalled();
    });

    it('continue de traiter les actions suivantes après un échec', () => {
        dispatchRemoteAction({ type: 'combat:explose' }, ctx);
        expect(dispatchRemoteAction({ type: 'combat:next-turn' }, ctx)).toBe(true);
    });
});
