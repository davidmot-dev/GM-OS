import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCombatStore } from '../useCombatStore';
import { exemplairesDeLaCreature } from './invocationDeRencontre';
import type { BestiaireDuJeu } from '../../../types/drivers';

/**
 * **Les créatures du livre de Vampire au plateau** (17/11/2026, bestiaire relu contre le livre,
 * p. 370-377) : un lieutenant de police (Santé 6, sans Vigueur) entrait à 10 / 10 ; une Harpie
 * (Vigueur 2) doit entrer à 5 ; les coups suivent les cases « / » et « X ».
 */
const PILOTE = {
    combat: {
        santeDeDepart: 'vigueur + 3',
        statsToTrack: [
            { fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'vigueur + 3' },
            { fieldId: 'volonte', label: 'Volonté', max: 'resolution + sang_froid' },
        ],
    },
    jet: { vampire: { soif: 'soif', volonte: 'volonte', degats: { sante: 'sante_degats', volonte: 'volonte_degats', jaugeDeSante: 'sante' } } },
};
const BESTIAIRE: BestiaireDuJeu = {
    colonnes: [
        { id: 'physique', libelle: 'Physique', nature: 'nombre', champ: 'physique' },
        { id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' },
        { id: 'volonte', libelle: 'Volonté', nature: 'nombre', champ: 'volonte' },
        { id: 'vigueur', libelle: 'Vigueur', nature: 'nombre', champ: 'vigueur' },
    ],
    creatures: [
        { id: 'lieutenant', nom: 'Lieutenant de police', valeurs: { physique: 4, sante: 6, volonte: 5 } },
        { id: 'harpie', nom: 'Harpie de l’Elysium', valeurs: { vigueur: 2, sante: 5, volonte: 6 } },
    ],
};

describe('Vampire — une créature du livre entre avec sa Santé', () => {
    const fenetre = window as unknown as { useSessionOSStore?: unknown };
    const avant = fenetre.useSessionOSStore;
    const combat = useCombatStore.getState();
    beforeEach(() => {
        fenetre.useSessionOSStore = { getState: () => ({ getActiveDriver: () => PILOTE, players: [], entities: [] }) };
        useCombatStore.setState({ combatants: [], consignerLOuvertureDuCombat: () => {}, syncCombatantToSession: () => {}, broadcastSync: () => {} });
    });
    afterEach(() => { fenetre.useSessionOSStore = avant; useCombatStore.setState(combat, true); });

    const invoquer = (id: string) => {
        const creature = BESTIAIRE.creatures.find(c => c.id === id)!;
        const [nouveau] = exemplairesDeLaCreature({ bestiaire: BESTIAIRE, creature, nombre: 1, typeDeSante: 'hp' });
        useCombatStore.getState().addCombatant(nouveau);
        return useCombatStore.getState().combatants.at(-1)!;
    };

    it('le lieutenant de police, sans Vigueur : Santé 6 / 6, celle de sa fiche (p. 371)', () => {
        const c = invoquer('lieutenant');
        expect([c.hp, c.hpMax]).toEqual([6, 6]);
        expect(c.healthSystem?.data).toMatchObject({ current: 6, max: 6 });
    });

    it('la Harpie : Vigueur 2 + 3 = 5 (p. 119, 374)', () => {
        const c = invoquer('harpie');
        expect([c.hp, c.hpMax]).toEqual([5, 5]);
    });

    it('sept aggravés sur le lieutenant : six « X », hors de combat (p. 126-127)', () => {
        const c = invoquer('lieutenant');
        useCombatStore.getState().applyDamage(7, 'Aggravés', [c.id]);
        const apres = useCombatStore.getState().combatants.find(x => x.id === c.id)!;
        expect(apres.sheetData).toMatchObject({ sante_degats: 'XXXXXX' });
        expect(apres.hp).toBe(0);
    });

    it('cinq superficiels en font trois « / » ; la Santé (cases sans « X ») ne bouge pas', () => {
        const c = invoquer('lieutenant');
        useCombatStore.getState().applyDamage(5, 'Superficiels', [c.id]);
        const apres = useCombatStore.getState().combatants.find(x => x.id === c.id)!;
        expect(apres.sheetData).toMatchObject({ sante_degats: '///' });
        expect(apres.hp).toBe(6);
    });
});
