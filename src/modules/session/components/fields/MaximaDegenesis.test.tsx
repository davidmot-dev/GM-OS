import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MaximaDegenesis } from './MaximaDegenesis';
import { CLE_DEGENESIS, type RegleDesMaximaDeDegenesis } from '../../../dice/systemes/maximaDeDegenesis';

/** **La carte « Maxima » de Degenesis** — DEG-A3 (2026-11-04), p. 26 et 94. */
const REGLE: RegleDesMaximaDeDegenesis = {
    ego: { champ: 'ego_max', jauge: 'ego_jauge', branches: [
        { cle: 'concentration', libelle: 'Concentration', attribut: 'intellect', competence: 'concentration' },
        { cle: 'pulsions', libelle: 'Pulsions', attribut: 'instinct', competence: 'pulsions' },
    ] },
    sporulations: { jauge: 'sporulations_jauge', branches: [
        { cle: 'foi', libelle: 'Foi', attribut: 'psyche', competence: 'foi' },
        { cle: 'volonte', libelle: 'Volonté', attribut: 'psyche', competence: 'volonte' },
    ] },
    blessures: { jauge: 'blessures_superficielles', champs: ['physique', 'resistance'] },
    traumatismes: { jauge: 'traumatismes', champs: ['physique', 'psyche'] },
    abreviations: { intellect: 'INT', instinct: 'INS', psyche: 'PSY', physique: 'PHY', resistance: 'Résistance' },
};
const JAUGES = [
    { fieldId: 'ego_jauge', max: 'ego_max' },
    { fieldId: 'sporulations_jauge', max: '(psyche + foi + volonte) * 2' },
    { fieldId: 'blessures_superficielles', max: '(physique + resistance) * 2' },
    { fieldId: 'traumatismes', max: 'physique + psyche' },
];
const FICHE = { intellect: 3, concentration: 2, instinct: 2, pulsions: 0, psyche: 2, foi: 2, volonte: 0, physique: 3, resistance: 2, ego_max: 8, ego_jauge: 6 };

afterEach(cleanup);
const monter = (valeurs: Record<string, unknown>) => {
    const appliquer = vi.fn();
    const consigner = vi.fn();
    const carte = render(<MaximaDegenesis regle={REGLE} valeurs={valeurs} jauges={JAUGES} appliquer={appliquer} consigner={consigner} />).container;
    return { carte, appliquer, consigner };
};

describe('la carte « Maxima » de Degenesis (DEG-A3)', () => {
    it('INT 3 + Concentration 2 : Égo max 8 → 10 appliqué sans remplir la jauge ; le reste est identique', () => {
        const { carte, appliquer, consigner } = monter(FICHE);
        const ligne = (cle: string) => carte.querySelector(`[data-maximum="${cle}"]`)!.textContent;
        expect(ligne('ego')).toContain('(INT 3 + Concentration 2) × 2');
        expect(ligne('sporulations')).toContain('identique');
        expect(ligne('blessures')).toContain('identique');
        expect(ligne('traumatismes')).toContain('PHY 3 + PSY 2');
        expect(screen.getByText('déduite de la fiche', { selector: '[data-branche-degenesis="ego"] span' })).toBeTruthy();
        fireEvent.click(screen.getByText('Appliquer tout (1)'));
        expect(appliquer).toHaveBeenCalledWith({ ego_max: 10 });
        expect(consigner).toHaveBeenCalledWith(expect.stringContaining('Égo maximal 8 → 10'));
    });

    it('Concentration et Pulsions remplies : la branche se choisit, la contradiction se dit et se corrige', () => {
        const { carte, appliquer } = monter({ ...FICHE, pulsions: 1 });
        expect(carte.querySelector('[data-maximum="ego"]')!.textContent).toContain('branche à choisir');
        fireEvent.click(screen.getByLabelText(/^Pulsions/));
        expect(appliquer).toHaveBeenCalledWith({ [CLE_DEGENESIS]: { version: 1, brancheEgo: 'pulsions' } });
        cleanup();

        const declare = monter({ ...FICHE, pulsions: 1, [CLE_DEGENESIS]: { version: 1, brancheEgo: 'concentration' } });
        expect(declare.carte.querySelector('[data-contradiction-degenesis="ego"]')!.textContent).toContain('elles s’excluent (p. 26)');
        fireEvent.click(screen.getByText('Mettre Pulsions à 0'));
        expect(declare.appliquer).toHaveBeenCalledWith({ pulsions: 0 });
    });
});
