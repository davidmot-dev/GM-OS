// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));
const ecrire = vi.fn();
vi.mock('../ficheDesCombattants', () => ({ ecrireLaFicheDuCombattant: (...a: unknown[]) => ecrire(...a) }));

import { JetDuCombattant } from './JetDuCombattant';
import { attaqueSurLaCarte, cibleDeLAttaque, jetDuCombattantPossible, libelleDeLAttaque } from '../logic/jetDuCombattant';
import { useCombatStore } from '../useCombatStore';
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

/*
  « Attaquer » sur la carte (chantier § 263, T5, 19/11/2026 ; décision D2 de David : « Fenêtre Fiche,
  ouverte sur le jet »).
*/
describe('« Attaquer » : la règle du bouton et la cible', () => {
    it('Vampire a « Attaquer » depuis le § 267, T1 (décision Q2 de David, 20/11 : C10 levé pour lui) ; jamais pour un PJ', () => {
        expect(jetDuCombattantPossible(combattant, PILOTE, FICHE), 'Vampire garde son jet dans « Fiche »').toBe(true);
        expect(attaqueSurLaCarte(combattant, PILOTE, FICHE)).toBe(true);
        expect(attaqueSurLaCarte({ isPlayer: true }, { jet: {} } as GameDriver, FICHE)).toBe(false);
        expect(attaqueSurLaCarte(combattant, { jet: {} } as GameDriver, FICHE), 'aucun jet d’adversaire déclaré').toBe(false);
    });

    it('la cible est celle que vise la carte, si elle est encore là — jamais soi-même', () => {
        const plateau = [{ id: 'c1', name: 'Lieutenant' }, { id: 'rachel', name: 'Rachel' }];
        expect(cibleDeLAttaque({ id: 'c1', targetId: 'rachel' }, plateau)?.name).toBe('Rachel');
        expect(cibleDeLAttaque({ id: 'c1', targetId: undefined }, plateau)).toBeNull();
        expect(cibleDeLAttaque({ id: 'c1', targetId: 'c1' }, plateau)).toBeNull();
        expect(cibleDeLAttaque({ id: 'c1', targetId: 'parti' }, plateau)).toBeNull();
    });

    it('ouvert par « Attaquer », le jet dit qui attaque qui, et passe au premier plan', () => {
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT}
            cible={{ id: 'rachel', name: 'Rachel' }} auPremierPlan />);
        expect(screen.getByText('Lieutenant de police 1 attaque Rachel')).toBeTruthy();
        expect(document.querySelector('[data-cible-de-l-attaque="rachel"]')).toBeTruthy();
        expect(document.querySelector('[data-ouvert-sur-le-jet]')).toBeTruthy();
    });

    it('T6 : ouvert par « Attaquer », le jet retient l’attaque composée au lancer', () => {
        useCombatStore.setState({ combatants: [combattant] });
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} auPremierPlan />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'groupement_4' } });
        de.mockImplementation(() => 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(useCombatStore.getState().combatants[0].derniereAttaque)
            .toEqual({ champs: { attribut: 'groupement_4' }, libelle: 'Armes à feu' });
    });

    it('T6 : rouvert par « Attaquer », la dernière attaque est proposée d’emblée', () => {
        const retenu = { ...combattant, derniereAttaque: { champs: { attribut: 'groupement_4' }, libelle: 'Armes à feu' } } as Combatant;
        render(<JetDuCombattant combattant={retenu} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} auPremierPlan />);
        expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('groupement_4');
        expect(document.querySelector('[data-derniere-attaque="proposee"]')?.textContent).toContain('Armes à feu');
    });

    it('T6 : une attaque qui ne se lit plus sur la fiche est signalée, pas préremplie', () => {
        const retenu = { ...combattant, derniereAttaque: { champs: { attribut: 'disparu' }, libelle: 'Champ disparu' } } as Combatant;
        render(<JetDuCombattant combattant={retenu} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} auPremierPlan />);
        expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).not.toBe('disparu');
        expect(document.querySelector('[data-derniere-attaque="perimee"]')?.textContent).toContain('Champ disparu');
    });

    it('T6 : ouvert par « Fiche », rien n’est retenu ni proposé (Vampire inchangé)', () => {
        const retenu = { ...combattant, derniereAttaque: { champs: { attribut: 'groupement_4' }, libelle: 'Armes à feu' } } as Combatant;
        useCombatStore.setState({ combatants: [combattant] });
        render(<JetDuCombattant combattant={retenu} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} />);
        expect(document.querySelector('[data-derniere-attaque]')).toBeNull();
        expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).not.toBe('groupement_4');
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'groupement_1' } });
        de.mockImplementation(() => 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(useCombatStore.getState().combatants[0].derniereAttaque).toBeUndefined();
    });

    it('T7 : après le jet ouvert par « Attaquer », « Appliquer à [cible] » paraît ; pas avant', () => {
        useCombatStore.setState({ combatants: [combattant] });
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT}
            cible={{ id: 'rachel', name: 'Rachel' }} auPremierPlan />);
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'groupement_4' } });
        de.mockImplementation(() => 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible="rachel"]')).toBeTruthy();
    });

    it('§ 267, T1 : « Attaquer » propose « Armes à feu 5 », puis la marge plus l’arme — 2 + 3 = 5 (p. 126, 303)', () => {
        useCombatStore.setState({ combatants: [combattant] });
        const armes = [{ libelle: 'À feu moyenne (pistolet 9 mm)', degats: 3 }];
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT}
            cible={{ id: 'rachel', name: 'Rachel' }} auPremierPlan armes={armes} attaqueProposee={{ attribut: 'groupement_4' }} />);
        expect(document.querySelector('[data-attaque-par-defaut]')!.textContent).toContain('Armes à feu');
        // Cinq dés à 9 contre la difficulté 3 : cinq réussites, marge 2.
        de.mockImplementation(() => 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toBe('marge 2 + arme 3 = 5');
        expect(screen.getByRole('button', { name: 'Appliquer 5 à Rachel' })).toBeTruthy();
    });

    it('T7 : ouvert par « Fiche », jamais de « Appliquer à »', () => {
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'groupement_4' } });
        de.mockImplementation(() => 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
    });

    it('le libellé reprend le nom porté par la fiche, sinon le libellé du champ', () => {
        expect(libelleDeLAttaque({ attribut: 'groupement_4', competence: 'melee' }, FICHE, LIEUTENANT)).toBe('Armes à feu + Mêlée');
        expect(libelleDeLAttaque({ attribut: 'inconnu' }, FICHE, LIEUTENANT)).toBe('inconnu');
    });

    it('ouvert par « Fiche », rien ne change : ni cible, ni premier plan', () => {
        render(<JetDuCombattant combattant={combattant} driver={PILOTE} gabarit={FICHE} valeurs={LIEUTENANT} />);
        expect(screen.getByText('Lancer un test pour Lieutenant de police 1')).toBeTruthy();
        expect(document.querySelector('[data-cible-de-l-attaque]')).toBeNull();
        expect(document.querySelector('[data-ouvert-sur-le-jet]')).toBeNull();
    });
});
