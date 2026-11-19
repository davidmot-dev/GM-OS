import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCombatStore } from './useCombatStore';

/**
 * **La dernière attaque d'un combattant** — registre § 263, T6 (19/11/2026), décision D4 de David :
 * « Oui, retenue sur le combattant ». Elle vit sur le plateau, survit au redémarrage avec lui, et
 * ne part jamais vers la fiche de campagne.
 */

const ATTAQUE = { champs: { attribut: 'agilite', competence: 'armesAFeu' }, libelle: 'Agilité + Armes à feu' };

describe('derniereAttaque', () => {
    const updateEntity = vi.fn();
    const updateEntityHP = vi.fn();

    beforeEach(() => {
        useCombatStore.getState().reset();
        vi.clearAllMocks();
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({ players: [], entities: [{ id: 'npc-1' }], updateEntity, updateEntityHP }),
        };
        useCombatStore.getState().addCombatant({
            name: 'Agent du LAPD', init: 8, hp: 4, hpMax: 4, isPlayer: false, faction: 'enemy', statuses: [], sourceEntityId: 'npc-1',
        });
    });
    afterEach(() => { delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore; });

    const agent = () => useCombatStore.getState().combatants[0];

    it('se retient sur le combattant du plateau', () => {
        useCombatStore.getState().retenirLAttaque(agent().id, ATTAQUE);
        expect(agent().derniereAttaque).toEqual(ATTAQUE);
    });

    it('fait partie de ce que le plateau persiste (`gmos-combat-storage`)', () => {
        useCombatStore.getState().retenirLAttaque(agent().id, ATTAQUE);
        const persiste = useCombatStore.persist.getOptions().partialize!(useCombatStore.getState()) as { combatants: { derniereAttaque?: unknown }[] };
        expect(persiste.combatants[0].derniereAttaque).toEqual(ATTAQUE);
    });

    it('n’est jamais recopiée sur la fiche de campagne', () => {
        useCombatStore.getState().retenirLAttaque(agent().id, ATTAQUE);
        expect(updateEntity).not.toHaveBeenCalled();
        // Même quand une autre écriture du combattant synchronise la fiche ensuite.
        useCombatStore.getState().updateCombatant(agent().id, { roleplayingNotes: 'Tire depuis la voiture' });
        for (const [, maj] of updateEntity.mock.calls) expect(maj).not.toHaveProperty('derniereAttaque');
        expect(updateEntity).toHaveBeenCalled();
    });

    it('disparaît avec le combattant', () => {
        useCombatStore.getState().retenirLAttaque(agent().id, ATTAQUE);
        useCombatStore.getState().removeCombatant(agent().id);
        expect(useCombatStore.getState().combatants).toHaveLength(0);
    });

    it('une autre attaque remplace la précédente, sans partager ses champs', () => {
        useCombatStore.getState().retenirLAttaque(agent().id, ATTAQUE);
        const melee = { champs: { attribut: 'vigueur', competence: 'corpsACorps' }, libelle: 'Vigueur + Corps à corps' };
        useCombatStore.getState().retenirLAttaque(agent().id, melee);
        melee.champs.attribut = 'modifie-apres-coup';
        expect(agent().derniereAttaque).toEqual({ champs: { attribut: 'vigueur', competence: 'corpsACorps' }, libelle: 'Vigueur + Corps à corps' });
    });
});
