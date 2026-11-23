// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Delta Green** (registre § 267, T3, 23/11/2026) : le jet de la
 * compétence de son arme, puis sa carte de dégâts, réglée d'avance — l'arme, la réussite, le critique.
 * Le jet du pilote 2.1.0 (d100 sous la compétence, p. 18, 43-44).
 */
const PILOTE = {
    id: 'dg', templateId: 'tpl',
    dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
    jet: {
        seuil: [{ id: 'competence', label: 'Compétence ou caractéristique', sectionId: 'competences', sectionsSupplementaires: ['caracteristiques'] }],
        reserve: { base: 1, max: 1, faces: 100 }, sens: 'sous-ou-egal',
        deltaGreen: { caracteristiques: ['FOR', 'CON', 'DEX', 'INT', 'POU', 'CHA'], sante: 'PV' },
    },
} as unknown as GameDriver;
const FICHE = {
    id: 'tpl', name: 'Delta Green', sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [{ id: 'DEX', label: 'DEX', type: 'number', defaultValue: 10 }] },
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'armes_a_feu', label: 'Armes à feu', type: 'number', defaultValue: 20 },
            { id: 'combat_a_mains_nues', label: 'Combat à mains nues', type: 'number', defaultValue: 40 },
        ] },
    ],
} as unknown as SheetTemplate;
const GARDE = { PV: 10, DEX: 12, armes_a_feu: 50, combat_a_mains_nues: 40, arme1: 'Glock 17', arme1_competence: 'Armes à feu', arme1_degats: '1D10' };
const garde = { id: 'g', name: 'Garde', isPlayer: false, faction: 'enemy', statuses: [], init: 0, sheetData: GARDE, targetId: 'agent' } as unknown as Combatant;
const agent = { id: 'agent', name: 'Agent Daryl', isPlayer: true, faction: 'player', statuses: [], init: 0, hp: 10, hpMax: 10, sheetData: { PV: 10 } } as unknown as Combatant;

let de: ReturnType<typeof vi.spyOn>;
let hasard: ReturnType<typeof vi.spyOn>;
/** Le chiffre des dizaines, puis celui des unités : `rollStandard` tire le d100 par `Math.random`. */
const d100 = (dizaine: number, unite: number) => hasard.mockReturnValueOnce((dizaine + 0.5) / 10).mockReturnValueOnce((unite + 0.5) / 10);
beforeEach(() => {
    useCombatStore.setState({ combatants: [garde, agent] });
    de = vi.spyOn(DiceEngine, 'roll');
    hasard = vi.spyOn(Math, 'random');
});
afterEach(() => { cleanup(); de.mockRestore(); hasard.mockRestore(); });

describe('« Attaquer » un adversaire de Delta Green (T3)', () => {
    it('Armes à feu proposée ; un 11 sous 50 est critique (double), la carte suit : Glock, réussite et critique cochés', () => {
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={agent} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
        expect(document.querySelector('[data-attaque-par-defaut]')!.textContent).toContain('Armes à feu');
        // Le d100 se tire en dizaines puis unités (`rollStandard`) : 1 et 1 font 11, un double réussi.
        d100(1, 1);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-apres-l-attaque]')).toBeTruthy();
        expect((screen.getByLabelText('Arme Delta Green') as HTMLSelectElement).value).toBe('1');
        expect((screen.getByRole('checkbox', { name: 'Attaque réussie confirmée' }) as HTMLInputElement).checked).toBe(true);
        expect((screen.getByRole('checkbox', { name: /Réussite critique/ }) as HTMLInputElement).checked).toBe(true);
        expect(document.querySelector('[data-appliquer-a-la-cible]'), 'pas de « Appliquer à » : Delta Green a sa porte').toBeNull();
    });

    it('un échec (87 sous 50) : la carte suit, rien de coché', () => {
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={agent} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
        d100(8, 7);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect((screen.getByRole('checkbox', { name: 'Attaque réussie confirmée' }) as HTMLInputElement).checked).toBe(false);
    });
});
