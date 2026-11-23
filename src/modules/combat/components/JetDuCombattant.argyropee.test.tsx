// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { armesDArgyropee, attaqueDArgyropee, attaqueParDefaut, coupDArgyropee, protectionsDArgyropee } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire d'Argyropée** (registre § 267, T7, 23/11/2026) : un test simple de Combat
 * rapproché, à distance ou de Rixe (p. 48), puis le dé de l'arme, à travers la protection X/Y de la cible —
 * bouclier d'abord, chaque pièce atteinte usée d'un point (p. 49, 52). Le jet du pilote 2.1.0 (1d10 +
 * compétence : 8 partielle, 10 réussite, 15 critique).
 */
const PILOTE = {
    id: 'argy', templateId: 'tpl',
    dice: { defaultDice: '1d10', logic: 'sum', engine: 'standard' },
    jet: {
        seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
        reserve: { base: 1, max: 1, faces: 10 }, sens: 'superieur-ou-egal',
        argyropee: { panache: 'panache', nom: 'nom', sante: 'points_de_sante' },
    },
    combat: { damageTypes: ['solide', 'élémentaire', 'environnemental'], statsToTrack: [{ fieldId: 'points_de_sante', label: 'Points de santé', isMainHP: true }] },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'Argyropée', sections: [
        { id: 'competences', label: 'Compétences', fields: [nombre('combat_rapproche', 'Combat rapproché'), nombre('combat_a_distance', 'Combat à distance'), nombre('rixe', 'Rixe')] },
    ],
} as unknown as SheetTemplate;
const RUFFIAN = { combat_rapproche: 2, rixe: 1, arme1_nom: 'Dague', arme1_degats: '1d4' };
const VANILLE = { points_de_sante: 6, protection1_nom: 'Gilet renforcé', protection1_valeur: '1/5', protection2_nom: 'Bouclier', protection2_valeur: '2/4' };

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Vanille', init: 8, hp: 6, hpMax: 6, isPlayer: true, faction: 'player', statuses: [], sheetData: VANILLE } as never);
    useCombatStore.getState().addCombatant({ name: 'Ruffian', init: 17, isPlayer: false, faction: 'enemy', statuses: [], sheetData: RUFFIAN } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });
const plateau = () => {
    const [vanille, ruffian] = useCombatStore.getState().combatants;
    return { vanille: vanille as Combatant, ruffian: { ...ruffian, targetId: vanille.id } as Combatant };
};
const vanilleApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Vanille')!;

describe('Argyropée : l’arme, la compétence et la protection (T7)', () => {
    it('la table : Argyropée attaque, ses dégâts passent par sa carte', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Argyropée', geste: 'attaquer', degats: 'porte-du-jeu' });
    });

    it('la compétence suit l’arme : dague, Combat rapproché ; arquebuse, à distance ; poings, Rixe à 1d4 ; sans arme, Rixe', () => {
        expect(armesDArgyropee({ arme1_nom: 'Dague', arme1_degats: '1d4', arme2_nom: 'Arquebuse', arme2_degats: '1d6', arme3_nom: 'Poings' })).toEqual([
            { index: 1, libelle: 'Dague', formule: '1d4', competence: 'combat_rapproche' },
            { index: 2, libelle: 'Arquebuse', formule: '1d6', competence: 'combat_a_distance' },
            { index: 3, libelle: 'Poings', formule: '1d4', competence: 'rixe' },
        ]);
        expect(attaqueDArgyropee({}).champs).toEqual({ competence: 'rixe' });
        expect(attaqueParDefaut(PILOTE, [], RUFFIAN)).toEqual({ competence: 'combat_rapproche' });
    });

    it('le bouclier absorbe d’abord, puis l’armure ; chaque pièce atteinte perd 1 de Y (p. 52)', () => {
        const pieces = protectionsDArgyropee(VANILLE);
        expect(coupDArgyropee(4, pieces, { solide: true, naturel: false })).toMatchObject({
            nets: 1, usures: [{ index: 2, y: 3 }, { index: 1, y: 4 }],
        });
        // Le bouclier prend tout : l'armure n'est pas atteinte.
        expect(coupDArgyropee(2, pieces, { solide: true, naturel: false })).toMatchObject({ nets: 0, usures: [{ index: 2, y: 3 }] });
        // Le feu passe X mais use Y ; un coup de poing n'use rien.
        expect(coupDArgyropee(3, pieces, { solide: false, naturel: false }).nets).toBe(3);
        expect(coupDArgyropee(3, pieces, { solide: true, naturel: true }).usures).toEqual([]);
    });
});

describe('« Attaquer » un adversaire d’Argyropée (T7)', () => {
    it('Combat rapproché proposé ; 9 + 2 = 11 touche ; la dague fait 4 : bouclier 2, gilet 1, 1 dégât, les deux pièces usées', () => {
        const { vanille, ruffian } = plateau();
        render(<JetDuCombattant combattant={ruffian} driver={PILOTE} gabarit={FICHE} valeurs={RUFFIAN} cible={vanille} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], RUFFIAN)} />);
        de.mockReturnValueOnce(9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
        de.mockReturnValueOnce(4);
        fireEvent.click(screen.getByText('Lancer 1d4'));
        expect(document.querySelector('[data-calcul-argyropee]')!.textContent).toContain('= 1 dégât');
        fireEvent.click(screen.getByText(/^Appliquer 1 à Vanille/));
        expect(vanilleApres().hp).toBe(5);
        expect(vanilleApres().sheetData).toMatchObject({ protection1_valeur: '1/4', protection2_valeur: '2/3' });
    });

    it('un échec (2 + 2 = 4) : pas de dégâts ; une parade réussie annule la blessure', () => {
        const { vanille, ruffian } = plateau();
        render(<JetDuCombattant combattant={ruffian} driver={PILOTE} gabarit={FICHE} valeurs={RUFFIAN} cible={vanille} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], RUFFIAN)} />);
        de.mockReturnValueOnce(2);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-argyropee][data-coup-nul]')).toBeTruthy();
        de.mockReturnValueOnce(9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        fireEvent.click(screen.getByRole('checkbox', { name: /Vanille pare/ }));
        expect(document.querySelector('[data-parade-reussie]')).toBeTruthy();
        expect(screen.queryByText(/^Lancer 1d4/)).toBeNull();
    });
});
