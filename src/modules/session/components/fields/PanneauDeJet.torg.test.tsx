import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { preparerLeJet, type DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * **Le jet de Torg depuis la fiche** — 2026-10-13, relu contre le carnet
 * NotebookLM « Torg ».
 *
 * Le niveau vaut attribut + compétence ; sans compétence, le 20 n'explose pas ;
 * les Blessures retirent au total d'action ; après le premier dé, la
 * Possibilité (un 1 à 9 vaut 10), « Un de plus ! » et la relance favorisée.
 */
const JET_TORG: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    tableDeBonus: 'torg',
    torg: { blessures: 'blessures', possibilites: 'possibilites', annulation: { attribut: 'esprit', competence: 'realite' } },
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

let de: ReturnType<typeof vi.spyOn>;
/** Le d20 rend ces faces, dans l'ordre. */
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 11);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = {}, ecrire = vi.fn()) => {
    render(<PanneauDeJet descripteur={JET_TORG} dice={DICE} template={FICHE}
        valeurs={{ dexterite: 9, esquive: 2, ...valeurs }} ecrireSurLaFiche={ecrire} />);
    return ecrire;
};
const retenir = (avecCompetence = true) => {
    const [attribut, competence] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'dexterite' } });
    if (avecCompetence) fireEvent.change(competence, { target: { value: 'esquive' } });
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const ligne = () => screen.getByText(/contre ND|Échec critique —/).textContent ?? '';

describe('le jet de Torg', () => {
    it('le niveau vaut attribut + compétence, contre le Niveau de Difficulté', () => {
        faces(13);
        monter();
        retenir();
        lancer();
        expect(ligne()).toBe("Succès Simple — dé 13 → bonus +1 ; total d'action 12 (niveau 11) contre ND 10, marge +2");
    });

    it('sans compétence : l’attribut seul, et le 20 n’explose pas', () => {
        faces(20, 5);
        monter();
        retenir(false);
        expect(screen.getByText(/seul le 10 explose/)).toBeTruthy();
        lancer();
        expect(ligne()).toMatch(/^Succès Supérieur — dé 20 → bonus \+7 ; total d'action 16 \(niveau 9\)/);
    });

    it('les Blessures retirent au total d’action, jusqu’à −3', () => {
        faces(13);
        monter({ blessures: 4 });
        retenir();
        expect(screen.getByText(/Malus : −3 au total d'action — 3 Blessures/)).toBeTruthy();
        lancer();
        expect(ligne()).toMatch(/total d'action 9 \(niveau 11, −3 Blessures\)/);
    });

    it('la plage d’échec critique se règle avant de lancer', () => {
        faces(2);
        monter();
        retenir();
        fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } });
        lancer();
        expect(ligne()).toMatch(/^Échec critique — premier dé 2/);
        expect(screen.queryByText('Un de plus !')).toBeNull();
    });

    it('pas d’Avantage : le dé de Torg explose, il ne se double pas', () => {
        monter();
        expect(screen.queryByText('Tirage')).toBeNull();
    });
});

describe('compléter le test, après le premier dé', () => {
    it('la Possibilité : un 3 vaut 10, s’ajoute au dé avant la table, et se décompte', () => {
        faces(7, 3);
        const ecrire = monter({ possibilites: 3 });
        retenir();
        lancer();
        fireEvent.click(screen.getByText('Dépenser une Possibilité (3)'));
        // Le livre : 7 puis 3 porté à 10, total 17, bonus +4.
        expect(ligne()).toMatch(/dé 7 \+ Possibilité 10 = 17 → bonus \+4 ; total d'action 15/);
        expect(ecrire).toHaveBeenCalledWith({ possibilites: 2 });
        expect(screen.queryByText(/Dépenser une Possibilité/)).toBeNull();
    });

    it('« Un de plus ! » n’a pas le minimum de 10', () => {
        faces(7, 3);
        monter();
        retenir();
        lancer();
        fireEvent.click(screen.getByText('Un de plus !'));
        expect(ligne()).toMatch(/dé 7 \+ Un de plus 3 = 10 → bonus -1/);
    });

    it('la relance favorisée remplace le premier dé, une seule fois, et seulement avant le reste', () => {
        faces(5, 16);
        monter();
        retenir();
        lancer();
        fireEvent.click(screen.getByText('Relancer (compétence favorisée)'));
        expect(ligne()).toMatch(/^Succès Simple — dé 16 → bonus \+3/);
        expect(screen.queryByText('Relancer (compétence favorisée)')).toBeNull();
    });
});

describe('l’Annulation des dommages', () => {
    it('une Possibilité, un test de Réalité contre ND 10, et ce qu’il annule', () => {
        faces(17);
        const ecrire = monter({ possibilites: 2, esprit: 9, realite: 3 });
        fireEvent.click(screen.getByText('Annulation des dommages (2)'));
        // Niveau 12, dé 17 → +4 : total 16, marge 6 — Succès Supérieur.
        expect(screen.getByText(/^Annulation des dommages : annule 2 Blessures et tout le Choc de l'attaque — Succès Supérieur/)).toBeTruthy();
        expect(ecrire).toHaveBeenCalledWith({ possibilites: 1 });
    });

    it('sans Possibilité, on ne peut pas la tenter', () => {
        monter({ possibilites: 0 });
        expect((screen.getByText('Annulation des dommages (0)') as HTMLButtonElement).disabled).toBe(true);
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
        faces(10, 3, 8);
        const res = DiceEngine.rollFromConfig(
            { defaultDice: '1d10', logic: 'count-success', engine: 'pool_explode', successThreshold: 8 },
            { baseCount: 2 },
        );
        expect(res.rolls.map(r => r.val)).toEqual([10, 3, 8]);
        expect(res.successes).toBe(2);
    });
});
