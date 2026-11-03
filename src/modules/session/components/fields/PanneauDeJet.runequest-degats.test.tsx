import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: vi.fn() }));
const porter = vi.fn();
vi.mock('../../../combat/coupsLocalises', () => ({ porterUnCoupLocalise: (...a: unknown[]) => porter(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { useCombatStore } from '../../../combat/useCombatStore';
import type { Combatant } from '../../../combat/types';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **RQ-A3 — du résultat d'attaque jusqu'au coup** (03/11/2026) : l'arme de la feuille, le
 * bonus, les dégâts spéciaux, la défense, puis le coup porté avec ce qui passe.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'aptitude', label: 'Aptitude', sectionId: 'armes' }],
    reserve: { base: 1, max: 1, faces: 100 },
    runequest: {
        caracteristiques: ['con'], localisations: { poitrine: 'pv_poitrine' },
        armes: [
            { score: 'arme1', nom: 'arme1_nom', degats: 'arme1_degats', durabilite: 'arme1_durabilite', genre: 'melee' },
            { score: 'tir1', nom: 'tir1_nom', degats: 'tir1_degats', genre: 'distance' },
        ],
        bonusAuxDegats: 'bonus_degats', con: 'con',
    },
};
const DICE = { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-rq', name: 'RuneQuest', emoji: '🏺',
    sections: [{ id: 'armes', label: 'Armes', fields: [
        { id: 'arme1_nom', label: 'Arme 1 — nom', type: 'text' },
        { id: 'arme1', label: 'Arme de mêlée 1', type: 'number', libelleSur: 'arme1_nom' },
        { id: 'tir1_nom', label: 'Tir 1 — nom', type: 'text' },
        { id: 'tir1', label: 'Arme à distance 1', type: 'number', libelleSur: 'tir1_nom' },
    ] }],
} as unknown as SheetTemplate;
const VALEURS = {
    arme1: 65, arme1_nom: 'Épée large', arme1_degats: '1D8+1', tir1: 45, tir1_nom: 'Arc composite', tir1_degats: '1D8+1',
    bonus_degats: '+1D4', con: 12,
};

let hasard: ReturnType<typeof vi.spyOn>;
const file: number[] = [];
const d100 = (n: number) => { const v = n % 100; file.push(Math.floor(v / 10) / 10 + 0.001, (v % 10) / 10 + 0.001); };
const de = (faces: number, n: number) => file.push((n - 1) / faces + 0.001);
beforeEach(() => { file.length = 0; hasard = vi.spyOn(Math, 'random').mockImplementation(() => file.shift() ?? 0.5); porter.mockClear(); });
afterEach(() => { cleanup(); hasard.mockRestore(); });

const broo = { id: 'broo', name: 'Broo', isPlayer: false, hp: 12, hpMax: 12, statuses: [], sheetData: { pv_poitrine: 5, con: 11 } } as unknown as Combatant;
const vasana = { id: 'vasana', name: 'Vasana', isPlayer: true, hp: 12, hpMax: 12, statuses: [], targetId: 'broo', sheetData: {} } as unknown as Combatant;
const combat = useCombatStore.getState();
beforeEach(() => useCombatStore.setState({ combatants: [vasana, broo], currentTurnIdx: 0 }));
afterEach(() => useCombatStore.setState(combat, true));

const attaquer = (aptitude: string, d: number, valeurs: Record<string, unknown> = VALEURS) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: aptitude } });
    file.length = 0; d100(d);
    fireEvent.click(screen.getByText('Lancer', { exact: true }));
    return panneau;
};
const formule = (p: HTMLElement) => p.querySelector('[data-formule-runequest]')?.textContent;
const issue = (p: HTMLElement) => p.querySelector('[data-issue-runequest]')?.textContent;

describe('les dégâts de l’attaque (RQ-A3)', () => {
    it('une réussite : l’arme et le bonus, armure retirée', () => {
        const p = attaquer('arme1', 40);
        expect(formule(p)).toBe('1D8+1 + 1D4');
        expect(issue(p)).toBe('Dégâts normaux ; armure retirée (p. 200).');
    });

    it('une spéciale à l’épée large : empalement par défaut, 2D8+2 + 1D4 (p. 203)', () => {
        const p = attaquer('arme1', 9);
        expect((screen.getByLabelText('Dégâts spéciaux') as HTMLSelectElement).value).toBe('empalement');
        expect(formule(p)).toBe('2D8+2 + 1D4');
        fireEvent.change(screen.getByLabelText('Dégâts spéciaux'), { target: { value: 'laceration' } });
        expect(formule(p)).toBe('2D8+2 + 1D4');
    });

    it('un arc : aucun bonus (p. 85, 212)', () => {
        const p = attaquer('tir1', 30);
        expect((screen.getByLabelText('Bonus aux dégâts') as HTMLSelectElement).value).toBe('aucun');
        expect(formule(p)).toBe('1D8+1');
    });

    it('le bonus déjà compris dans les dégâts de l’arme n’est compté qu’une fois', () => {
        const p = attaquer('arme1', 40, { ...VALEURS, arme1_degats: '1D8+1+1D4' });
        expect(formule(p)).toBe('1D8+1 + 1D4');
        expect(p.textContent).toContain('Le bonus +1D4 était compris dans les dégâts de l’arme');
    });

    it('à dégâts et zone identiques, le critique ignore l’armure ; l’attaque ordinaire la retire', () => {
        const p = attaquer('arme1', 2);
        expect(formule(p)).toBe('max 2D8+2 (18) + 1D4');
        expect(issue(p)).toBe('Maximum des dégâts spéciaux ; sans tenir compte de l’armure (p. 200).');
        de(4, 3);
        fireEvent.click(screen.getByText('Lancer les dégâts'));
        expect(p.querySelector('[data-degats-lances]')!.textContent).toBe('Dégâts (Épée large) : 21 (max 2D8+2 (18) : 18 · 1D4 : 3), armure ignorée.');
        de(20, 12);
        fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
        expect((screen.getByLabelText('Dégâts portés') as HTMLInputElement).value).toBe('21');
        expect(screen.getByText('armure ignorée')).toBeTruthy();
        fireEvent.click(screen.getByText('Porter le coup'));
        expect(porter).toHaveBeenCalledWith(expect.objectContaining({ id: 'broo' }), 'poitrine', 21, false, true);
        // Porté une fois : le champ se vide, le bouton attend d'autres dégâts.
        expect((screen.getByText('Porter le coup') as HTMLButtonElement).disabled).toBe(true);
        expect(porter).toHaveBeenCalledTimes(1);
    });

    it('une attaque ordinaire portée garde l’armure', () => {
        attaquer('arme1', 40);
        de(8, 5); de(4, 2);
        fireEvent.click(screen.getByText('Lancer les dégâts'));
        de(20, 12);
        fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
        expect(screen.getByText('armure retirée')).toBeTruthy();
        fireEvent.click(screen.getByText('Porter le coup'));
        expect(porter).toHaveBeenCalledWith(expect.objectContaining({ id: 'broo' }), 'poitrine', 8, false, false);
    });

    it('une parade normale contre une spéciale : la durabilité bloque, l’excédent va à une zone adjacente (p. 199)', () => {
        const p = attaquer('arme1', 9);
        fireEvent.change(screen.getByLabelText('Défense'), { target: { value: 'parade' } });
        fireEvent.change(screen.getByLabelText('Niveau de la défense'), { target: { value: 'reussite' } });
        fireEvent.change(screen.getByLabelText('Durabilité de l’arme qui pare'), { target: { value: '12' } });
        expect(issue(p)).toMatch(/localisation adjacente/);
        de(8, 6); de(8, 6); de(4, 3);
        fireEvent.click(screen.getByText('Lancer les dégâts'));
        expect(p.querySelector('[data-degats-lances]')!.textContent).toContain('17 (2D8+2 : 14 · 1D4 : 3) − 12 durabilité = 5 passent');
        de(20, 12);
        fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
        expect((screen.getByLabelText('Dégâts portés') as HTMLInputElement).value).toBe('5');
        expect(screen.getByText('L’excédent va à une localisation adjacente : choisir la zone.')).toBeTruthy();
    });

    it('une esquive réussie contre une réussite : aucun dégât à lancer (p. 201)', () => {
        const p = attaquer('arme1', 40);
        fireEvent.change(screen.getByLabelText('Défense'), { target: { value: 'esquive' } });
        expect(issue(p)).toBe('Attaque esquivée ou manquée (p. 201).');
        expect(screen.queryByText('Lancer les dégâts')).toBeNull();
    });

    it('une lacération qui égale les PV de la zone appelle le test de (CON − dégâts) ×5 (p. 204)', () => {
        attaquer('arme1', 9);
        fireEvent.change(screen.getByLabelText('Dégâts spéciaux'), { target: { value: 'laceration' } });
        de(8, 1); de(8, 1); de(4, 1);
        fireEvent.click(screen.getByText('Lancer les dégâts'));
        de(20, 12);
        fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
        expect(screen.getByText('Lacération : test de (CON 11 − 5) ×5 = 30 % pour rester conscient (p. 204).')).toBeTruthy();
    });

    it('ne prépare pas de dégâts pour une aptitude qui n’est pas une arme déclarée', () => {
        const sansArmes = { ...JET, runequest: { ...JET.runequest!, armes: undefined } };
        render(<PanneauDeJet descripteur={sansArmes} dice={DICE} template={FICHE} valeurs={VALEURS} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'arme1' } });
        file.length = 0; d100(9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.queryByText('Lancer les dégâts')).toBeNull();
    });
});
