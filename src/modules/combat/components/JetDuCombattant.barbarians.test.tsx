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
 * **« Attaquer » un adversaire de Barbarians of Lemuria** (registre § 267, T4, 23/11/2026) : Vigueur +
 * Mêlée lancés contre 9, puis le dé de l'arme plus la Vigueur, moins l'armure de la cible. Le jet du
 * pilote 2.0.0 (export du 21/11 : 2d6 + attribut + aptitude, 9 ou plus, p. 8, 62-63).
 */
const PILOTE = {
    id: 'bol', templateId: 'tpl',
    dice: { defaultDice: '2d6', logic: 'sum', engine: 'standard' },
    jet: {
        seuil: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'action', label: 'Carrière ou aptitude de combat', sectionId: 'carrieres', sectionsSupplementaires: ['aptitudes_combat'], facultative: true },
        ],
        reserve: { base: 2, max: 2, faces: 6 }, sens: 'superieur-ou-egal',
        barbarians: { heroisme: 'points_heroisme', cible: 9 },
    },
} as unknown as GameDriver;
const FICHE = {
    id: 'tpl', name: 'Barbarians', sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'vigueur', label: 'Vigueur', type: 'number', defaultValue: 0 },
            { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 0 },
        ] },
        { id: 'carrieres', label: 'Carrières', fields: [] },
        { id: 'aptitudes_combat', label: 'Aptitudes de combat', fields: [
            { id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 0 },
            { id: 'tir', label: 'Tir', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const PILLARD = { vigueur: 2, agilite: 0, melee: 1, tir: 0, arme1: 'Hache', arme1_degats: 'd6B' };
const pillard = { id: 'p', name: 'Pillard', isPlayer: false, faction: 'enemy', statuses: [], init: 0, sheetData: PILLARD, targetId: 'heros' } as unknown as Combatant;
const heros = { id: 'heros', name: 'Krom', isPlayer: true, faction: 'player', statuses: [], init: 0, hp: 10, hpMax: 10, sheetData: {} } as unknown as Combatant;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    useCombatStore.setState({ combatants: [pillard, heros] });
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });

describe('« Attaquer » un adversaire de Barbarians of Lemuria (T4)', () => {
    it('Vigueur + Mêlée proposées ; 4 + 3 + 3 = 10 touche, la hache se lance, la carte dit le calcul', () => {
        render(<JetDuCombattant combattant={pillard} driver={PILOTE} gabarit={FICHE} valeurs={PILLARD} cible={heros} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], PILLARD)} />);
        expect(document.querySelector('[data-attaque-par-defaut]')!.textContent).toContain('Vigueur');
        de.mockReturnValueOnce(4).mockReturnValueOnce(3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeTruthy();
        expect((screen.getByLabelText('Dé de l’arme') as HTMLInputElement).value).toBe('d6B');
        de.mockReturnValueOnce(2).mockReturnValueOnce(6);
        fireEvent.click(screen.getByText('Lancer les dégâts'));
        expect(document.querySelector('[data-degats-lances-bol]')!.textContent).toContain('d6B (2, 6 → 6) + Vigueur 2 = 8');
        expect(screen.getByText('Appliquer 8 à Krom')).toBeTruthy();
    });

    it('un échec (2 + 1 + 3 = 6) : rien à lancer, rien à appliquer', () => {
        render(<JetDuCombattant combattant={pillard} driver={PILOTE} gabarit={FICHE} valeurs={PILLARD} cible={heros} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], PILLARD)} />);
        de.mockReturnValueOnce(2).mockReturnValueOnce(1);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.queryByText('Lancer les dégâts')).toBeNull();
        expect(document.querySelector('[data-coup-nul]')).toBeTruthy();
    });
});
