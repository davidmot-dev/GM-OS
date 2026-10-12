import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatStore } from './useCombatStore';

/**
 * **Invoquer une rencontre préparée : seuls les PJ cochés entrent.**
 *
 * Décision de David (12/10) : *« je veux pouvoir mettre les PJ au moment de
 * commencer le combat »*. Le piège : `addCombatant` rattache tout seul un
 * plateau vide à la scène en cours **et y fait entrer tous ses PJ** — un PJ
 * décoché serait donc entré quand même par cette porte-là.
 */

interface Scene { id: string; campaignId: string; titre: string; personnagesIds?: string[]; passages?: { debut: string; fin?: string }[] }

const sceneEnCours = (id: string, personnagesIds: string[]): Scene =>
    ({ id, campaignId: 'c-1', titre: id, personnagesIds, passages: [{ debut: new Date().toISOString() }] });

const poserLeMagasinDeSeance = (scenes: Scene[]) => {
    (window as unknown as { useSessionOSStore: { getState: () => unknown } }).useSessionOSStore = {
        getState: () => ({
            activeCampaignId: 'c-1',
            sessions: [{ id: 's-1', campaignId: 'c-1', status: 'active', acteId: 'a-1' }],
            scenes,
            players: [{ characters: [
                { id: 'ripley', name: 'Ripley', campaignId: 'c-1' },
                { id: 'dallas', name: 'Dallas', campaignId: 'c-1' },
            ] }],
        }),
    };
};

const store = () => useCombatStore.getState();
const noms = () => store().combatants.map(c => c.name).sort();
const goule = (name = 'Goule') => ({ name, init: 0, isPlayer: false, faction: 'enemy' as const, statuses: [] });
const RIPLEY = { id: 'ripley', name: 'Ripley' };

beforeEach(() => {
    store().reset();
    useCombatStore.setState({ combatsGares: {} });
    poserLeMagasinDeSeance([sceneEnCours('scene-A', ['ripley', 'dallas']), sceneEnCours('scene-B', ['dallas'])]);
});

afterEach(() => {
    delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
});

describe('invoquerLaRencontre', () => {
    it('⛔ rattache la scène et ne fait entrer QUE les PJ cochés', () => {
        store().invoquerLaRencontre({ sceneId: 'scene-A', adversaires: [goule()], pjs: [RIPLEY] });

        expect(store().sceneId).toBe('scene-A');
        expect(noms(), 'Dallas, décoché, est entré par le rattachement automatique').toEqual(['Goule', 'Ripley']);
    });

    it('une rencontre libre sur un plateau vide rejoint la scène en cours, sans ses PJ', () => {
        poserLeMagasinDeSeance([sceneEnCours('scene-A', ['ripley', 'dallas'])]);

        store().invoquerLaRencontre({ sceneId: null, adversaires: [goule()], pjs: [] });

        expect(store().sceneId).toBe('scene-A');
        expect(noms()).toEqual(['Goule']);
    });

    it('les renforts s’ajoutent, et un PJ déjà engagé n’entre pas deux fois', () => {
        store().invoquerLaRencontre({ sceneId: 'scene-A', adversaires: [goule('Goule 1')], pjs: [RIPLEY] });
        store().invoquerLaRencontre({ sceneId: 'scene-A', adversaires: [goule('Goule 2')], pjs: [RIPLEY] });

        expect(noms()).toEqual(['Goule 1', 'Goule 2', 'Ripley']);
    });

    it('invoquer dans une autre scène gare le plateau en cours, sans faire entrer ses PJ', () => {
        store().invoquerLaRencontre({ sceneId: 'scene-A', adversaires: [goule('Goule A')], pjs: [RIPLEY] });
        store().invoquerLaRencontre({ sceneId: 'scene-B', adversaires: [goule('Goule B')], pjs: [] });

        expect(store().sceneId).toBe('scene-B');
        expect(noms(), 'Dallas, présent dans la scène B, est entré sans être coché').toEqual(['Goule B']);
        expect(store().combatsGares['scene-A']?.combatants.map(c => c.name).sort()).toEqual(['Goule A', 'Ripley']);
    });

    it('ne tire pas l’initiative', () => {
        store().invoquerLaRencontre({ sceneId: 'scene-A', adversaires: [goule()], pjs: [RIPLEY] });
        expect(store().combatants.every(c => c.init === 0)).toBe(true);
        expect(store().round).toBe(1);
    });
});
