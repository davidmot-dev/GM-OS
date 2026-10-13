import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { preparerLeJet, type DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * **Le jet de Torg depuis la fiche** — 2026-10-13.
 *
 * Le niveau vaut attribut + compétence ; la compétence est facultative (test
 * non entraîné, sur l'attribut seul) ; le Niveau de Difficulté se règle avant
 * de lancer. Et sous un verdict, l'écran dit le calcul — plus « 0 réussite ».
 */
const JET_TORG: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    tableDeBonus: 'torg',
    seuil: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences', facultative: true },
    ],
    reserve: { base: 1, max: 1, faces: 20 },
    difficulte: { min: 0, max: 30, defaut: 10 },
};
const DICE = { defaultDice: '1d20', logic: 'sum' as const, engine: 'standard' as const };
const FICHE = {
    id: 'tpl-torg', name: 'Chevalier des Tempêtes', emoji: '⚡',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [{ id: 'dexterite', label: 'Dextérité', type: 'number', defaultValue: 0 }] },
        { id: 'competences', label: 'Compétences', fields: [{ id: 'esquive', label: 'Esquive', type: 'number', defaultValue: 0 }] },
    ],
} as unknown as SheetTemplate;

let torg: ReturnType<typeof vi.spyOn>;
beforeEach(() => { torg = vi.spyOn(DiceEngine, 'rollTorg'); });
afterEach(() => { cleanup(); torg.mockRestore(); });

const monter = () => render(
    <PanneauDeJet descripteur={JET_TORG} dice={DICE} template={FICHE} valeurs={{ dexterite: 9, esquive: 2 }} />,
);

describe('le jet de Torg', () => {
    it('le niveau vaut attribut + compétence, contre le Niveau de Difficulté', () => {
        monter();
        const [attribut, competence] = screen.getAllByRole('combobox');
        fireEvent.change(attribut, { target: { value: 'dexterite' } });
        fireEvent.change(competence, { target: { value: 'esquive' } });
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(torg).toHaveBeenCalledWith(11, 10);
    });

    it('sans compétence, le test se fait sur l’attribut seul', () => {
        monter();
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'dexterite' } });
        const lancer = screen.getByText('Lancer', { exact: true });
        expect((lancer as HTMLButtonElement).disabled).toBe(false);
        fireEvent.click(lancer);
        expect(torg).toHaveBeenCalledWith(9, 10);
    });

    it('le résultat dit le calcul, pas un compte de réussites', () => {
        torg.mockReturnValue({
            total: 11, rolls: [{ val: 13, sides: 20 }], modifier: 1, successes: 1, fails: 0, tagSuccess: true,
            degre: 'reussite-normale',
            totalDisplay: "Succès Simple — dé 13 → bonus +1 ; total d'action 10 (niveau 9) contre ND 10, marge +0",
        });
        monter();
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'dexterite' } });
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.getByText(/Succès Simple — dé 13/)).toBeTruthy();
        expect(screen.queryByText(/réussite \//)).toBeNull();
    });

    it('pas d’Avantage : le dé de Torg explose, il ne se double pas', () => {
        monter();
        expect(screen.queryByText('Tirage')).toBeNull();
    });
});

describe('une composante facultative', () => {
    it('non retenue, elle ne compte pour rien et ne bloque pas', () => {
        const jet = preparerLeJet(JET_TORG, { dexterite: 9, esquive: 2 }, { champs: { attribut: 'dexterite' } });
        expect(jet.seuil).toBe(9);
        expect(jet.avertissements).toEqual([]);
    });
});

describe('le 10 de NOC', () => {
    it('le moteur « pool_explode » relance la face maximale, depuis le panneau aussi', () => {
        const faces = [10, 3, 8];
        const de = vi.spyOn(DiceEngine, 'roll').mockImplementation(() => faces.shift() ?? 1);
        try {
            const res = DiceEngine.rollFromConfig(
                { defaultDice: '1d10', logic: 'count-success', engine: 'pool_explode', successThreshold: 8 },
                { baseCount: 2 },
            );
            // 10 (réussite, relancé) → 3 ; puis 8 (réussite) : trois dés, deux réussites.
            expect(res.rolls.map(r => r.val)).toEqual([10, 3, 8]);
            expect(res.successes).toBe(2);
        } finally {
            de.mockRestore();
        }
    });
});
