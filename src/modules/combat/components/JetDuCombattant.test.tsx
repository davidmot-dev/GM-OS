// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));
const ecrire = vi.fn();
vi.mock('../ficheDesCombattants', () => ({ ecrireLaFicheDuCombattant: (...a: unknown[]) => ecrire(...a) }));

import { JetDuCombattant } from './JetDuCombattant';
import { jetDuCombattantPossible } from '../logic/jetDuCombattant';
import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Lancer un test pour un adversaire de Vampire** (17/11/2026) : le lieutenant de police du livre
 * (p. 371) lance « Armes à feu 5 » seul, et sa relance par la Volonté s'écrit sur SA fiche.
 */
const PILOTE = {
    id: 'vampire', templateId: 'tpl',
    dice: { defaultDice: '1d10', logic: 'count-success', engine: 'standard', successThreshold: 6 },
    jet: {
        sens: 'superieur-ou-egal',
        reserve: { base: 0, max: 30, sansPlafond: true, faces: 10, composantes: [
            { id: 'attribut', label: 'Attribut ou jauge', sectionId: 'attributs', sectionsSupplementaires: ['antagoniste'] },
            { id: 'competence', label: 'Compétence', sectionId: 'competences', facultative: true },
        ] },
        difficulte: { min: 1, max: 10, defaut: 3 },
        vampire: { soif: 'soif', volonte: 'volonte', degats: { sante: 'sante_degats', volonte: 'volonte_degats', jaugeDeSante: 'sante' } },
    },
} as unknown as GameDriver;
const FICHE = {
    id: 'tpl', name: 'Vampire', sections: [
        { id: 'attributs', label: 'Attributs', fields: [{ id: 'dexterite', label: 'Dextérité', type: 'number', defaultValue: 1 }] },
        { id: 'competences', label: 'Compétences', fields: [{ id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 0 }] },
        { id: 'antagoniste', label: 'Antagoniste', fields: [
            { id: 'groupement_1_nom', label: 'Groupement 1 — nom', type: 'text', defaultValue: '' },
            { id: 'groupement_1', label: 'Groupement 1', type: 'number', defaultValue: 0, libelleSur: 'groupement_1_nom' },
            { id: 'groupement_4_nom', label: 'Groupement 4 — nom', type: 'text', defaultValue: '' },
            { id: 'groupement_4', label: 'Groupement 4', type: 'number', defaultValue: 0, libelleSur: 'groupement_4_nom' },
        ] },
        { id: 'jauges', label: 'Jauges', fields: [
            { id: 'soif', label: 'Soif', type: 'number', defaultValue: 0 },
            { id: 'volonte', label: 'Volonté', type: 'number', defaultValue: 0 },
            { id: 'volonte_degats', label: 'Dégâts de Volonté', type: 'text', defaultValue: '' },
        ] },
    ],
} as unknown as SheetTemplate;
const LIEUTENANT = { groupement_1_nom: 'Physique', groupement_1: 4, groupement_4_nom: 'Armes à feu', groupement_4: 5, sante: 6, volonte: 5, volonte_degats: '' };
const combattant = { id: 'c1', name: 'Lieutenant de police 1', isPlayer: false, faction: 'enemy', statuses: [], init: 0, sheetData: LIEUTENANT } as unknown as Combatant;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { ecrire.mockReset(); de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); });

describe('Lancer un test pour un adversaire de Vampire', () => {
    it('réservé aux adversaires d’un pilote Vampire qui a une fiche', () => {
        expect(jetDuCombattantPossible(combattant, PILOTE, FICHE)).toBe(true);
        expect(jetDuCombattantPossible({ isPlayer: true }, PILOTE, FICHE)).toBe(false);
        expect(jetDuCombattantPossible(combattant, { jet: {} } as GameDriver, FICHE)).toBe(false);
        expect(jetDuCombattantPossible(combattant, PILOTE, null)).toBe(false);
    });

    it('« Armes à feu 5 » seul : cinq dés ; la relance par la Volonté s’écrit sur la fiche du combattant', () => {
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} />);
        expect(screen.getByText('Lancer un test pour Lieutenant de police 1')).toBeTruthy();
        const [attribut] = screen.getAllByRole('combobox');
        expect(screen.getByRole('option', { name: 'Armes à feu (5)' })).toBeTruthy();
        expect(screen.getByRole('option', { name: 'Physique (4)' })).toBeTruthy();
        fireEvent.change(attribut, { target: { value: 'groupement_4' } });
        // Le nom du groupement n'est pas rappelé comme une spécialité.
        expect(document.querySelector('[data-preparation-vampire]')!.textContent).not.toContain('— Armes à feu');
        const faces = [2, 3, 8, 6, 7];
        de.mockImplementation(() => faces.shift() ?? 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(de).toHaveBeenCalledTimes(5);
        fireEvent.click(screen.getByText(/Relancer 2 dés/));
        expect(ecrire).toHaveBeenCalledWith(combattant, { volonte_degats: '/', volonte: 5 });
    });
});
