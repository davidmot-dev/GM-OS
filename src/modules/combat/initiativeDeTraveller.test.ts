import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useInitiativeDeTravellerStore } from './useInitiativeDeTravellerStore';
import { DiceEngine } from '../dice/DiceEngine';
import { campDeTraveller, finDeLEmbuscade, initiativeDeTraveller, mdDInitiative, PREPARATION_D_INITIATIVE } from './logic/initiativeDeTraveller';

/**
 * **TRV-A4 — l'initiative de Traveller** (27/11/2026, spécification
 * `2026-11-27-traveller-fiche-initiative-psi-rads.md`, C4 à C6), livre p. 71.
 */
describe('la règle pure (p. 71)', () => {
    it('C4 · le meilleur MD entre DEX et INT ; sans l’un ni l’autre (un animal), aucun', () => {
        const lire = (fiche: Record<string, number>) => (c: string) => fiche[c];
        expect(mdDInitiative(lire({ dexterite: 10, intellect: 12 }))).toEqual({ md: 2, source: 'INT' });
        expect(mdDInitiative(lire({ dexterite: 10, intellect: 7 }))).toEqual({ md: 1, source: 'DEX' });
        expect(mdDInitiative(lire({ dexterite_md: -1 }))).toEqual({ md: -1, source: 'DEX' });
        expect(mdDInitiative(lire({}))).toEqual({ md: 0, source: null });
    });

    it('C4-C6 · Effet de 2D + MD contre 8, plus la Tactique du camp, plus ou moins 6 d’embuscade', () => {
        const md = { md: 1, source: 'DEX' as const };
        expect(initiativeDeTraveller({ des: [4, 5], md, camp: 'voyageurs', preparation: PREPARATION_D_INITIATIVE }))
            .toEqual({ init: 2, embuscade: 0, detail: '2D 9, MD DEX +1, − 8' });
        const preparation = { tactique: { voyageurs: 2, adversaires: 0 }, embuscade: 'adversaires' as const };
        expect(initiativeDeTraveller({ des: [4, 5], md, camp: 'voyageurs', preparation }))
            .toEqual({ init: -2, embuscade: -6, detail: '2D 9, MD DEX +1, − 8, Tactique +2, embuscade −6' });
        expect(initiativeDeTraveller({ des: [4, 5], md, camp: 'adversaires', preparation }).init).toBe(8);
        // Un neutre n'est d'aucun camp.
        expect(initiativeDeTraveller({ des: [4, 5], md, camp: null, preparation }).init).toBe(2);
    });

    it('les camps : joueurs et alliés contre ennemis', () => {
        expect([campDeTraveller('player'), campDeTraveller('ally'), campDeTraveller('enemy'), campDeTraveller('neutral'), campDeTraveller('enemy', true)])
            .toEqual(['voyageurs', 'voyageurs', 'adversaires', null, 'voyageurs']);
    });

    it('C6 · la fin de l’embuscade retire le bonus et refait l’ordre', () => {
        expect(finDeLEmbuscade([{ init: 2 }])).toBeNull();
        expect(finDeLEmbuscade([{ init: 9, bonusDEmbuscade: 6 }, { init: 4 }, { init: -4, bonusDEmbuscade: -6 }]))
            .toEqual([{ init: 4 }, { init: 3 }, { init: 2 }]);
    });
});

describe('le jet d’initiative de Combat-OS, pour Traveller', () => {
    let de: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
        useCombatStore.getState().reset();
        useInitiativeDeTravellerStore.getState().reinitialiser();
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({ players: [], entities: [], getActiveDriver: () => ({ id: 'trav', jet: { traveller: {} }, combat: { initiativeSort: 'desc' } }) }),
        };
        useCombatStore.getState().addCombatant({ name: 'Kathya', init: 0, isPlayer: false, faction: 'player', statuses: [], sheetData: { dexterite: 10, intellect: 9 } } as never);
        useCombatStore.getState().addCombatant({ name: 'Pirate', init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { dexterite: 7, intellect: 12 } } as never);
        de = vi.spyOn(DiceEngine, 'roll');
    });
    afterEach(() => {
        de.mockRestore();
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
    });
    const resolver = (champ: string, c: { sheetData?: Record<string, unknown> }) => Number(c.sheetData?.[champ] ?? 0);
    const etat = () => Object.fromEntries(useCombatStore.getState().combatants.map(c => [c.name, c.init]));

    it('C5 et C6 · Tactique +2 aux Voyageurs, embuscade des pirates ; au round 2, l’embuscade s’en va', () => {
        useInitiativeDeTravellerStore.getState().poserLaTactique('voyageurs', 2);
        useInitiativeDeTravellerStore.getState().poserLEmbuscade('adversaires');
        let n = 0; de.mockImplementation(() => [4, 4, 3, 3][n++]);
        useCombatStore.getState().rollAutoInitiative({ formula: '2d6 + dexterite_md - 8', resolver, sortOrder: 'desc' });
        // Kathya : 8 + 1 (DEX) − 8 + 2 − 6 = −3 ; Pirate : 6 + 2 (INT) − 8 + 6 = 6.
        expect(etat()).toEqual({ Pirate: 6, Kathya: -3 });
        expect(useCombatStore.getState().combatants.map(c => c.name)).toEqual(['Pirate', 'Kathya']);
        useCombatStore.getState().nextTurn();
        useCombatStore.getState().nextTurn();
        expect(useCombatStore.getState().round).toBe(2);
        expect(etat()).toEqual({ Kathya: 3, Pirate: 0 });
        expect(useCombatStore.getState().combatants.map(c => c.name)).toEqual(['Kathya', 'Pirate']);
        expect(useCombatStore.getState().currentTurnIdx).toBe(0);
    });
});
