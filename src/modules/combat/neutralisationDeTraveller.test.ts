import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatStore } from './useCombatStore';

/**
 * **TRV-A6 — neutralisé par une arme Incapacitante** (27/11/2026, spécification
 * `2026-11-27-traveller-depenses-et-durees.md`, C6, C7) : l'END à 0, dégâts − END rounds sans agir
 * (p. 76) ; l'état se décompte à chaque tour, les dégâts se retiennent pour l'heure de repos.
 */
const REGLE = {
    mecanique: 'traveller', endurance: 'endurance', force: 'force', dexterite: 'dexterite',
    maximum: { endurance: 'endurance_max', force: 'force_max', dexterite: 'dexterite_max' }, incapacitants: 'degats_incapacitants',
};
describe('un bâton incapacitant dans Combat-OS', () => {
    beforeEach(() => {
        useCombatStore.getState().reset();
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({ players: [], entities: [], getActiveDriver: () => ({ id: 'trav', jet: { traveller: {} }, combat: { physiqueTraveller: REGLE, statsToTrack: [] } }) }),
        };
        useCombatStore.getState().addCombatant({ name: 'Garde', init: 5, isPlayer: false, faction: 'enemy', statuses: [],
            sheetData: { endurance: 6, force: 7, dexterite: 7, endurance_max: 6, force_max: 7, dexterite_max: 7 } } as never);
    });
    afterEach(() => { delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore; });
    const garde = () => useCombatStore.getState().combatants[0]!;

    it('9 dégâts incapacitants sur une END de 6 : « Neutralisé » 3 rounds, l’END à 0, 6 points retenus', () => {
        useCombatStore.getState().applyDamage(9, 'Incapacitante', [garde().id]);
        expect(garde().statuses).toEqual([expect.objectContaining({ name: 'Neutralisé', duration: 3 })]);
        expect(garde().sheetData).toMatchObject({ endurance: 0, force: 7, degats_incapacitants: 6 });
    });

    it('un coup qui laisse de l’END ne neutralise pas ; un coup ordinaire non plus', () => {
        useCombatStore.getState().applyDamage(4, 'Incapacitante', [garde().id]);
        useCombatStore.getState().applyDamage(9, 'Dégâts', [garde().id]);
        expect(garde().statuses).toEqual([]);
    });
});
