import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_STAR_TREK } from '../../../dice/systemes/starTrekRegles';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Star Trek au panneau** — 23/10/2026 : la tâche complète (nature, marge,
 * assistants, Détermination), ses suites et la carte Stress et blessures. Une fiche
 * faite comme celle du pilote.
 */
const nombre = (id: string, label = id) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl-st', name: 'Star Trek', emoji: '🖖',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [nombre('maitrise', 'Maîtrise'), nombre('forme', 'Forme'), nombre('audace', 'Audace')] },
        { id: 'fonctions', label: 'Fonctions', fields: [nombre('securite', 'Sécurité'), nombre('ingenierie', 'Ingénierie')] },
        { id: 'jauges', label: 'Jauges', fields: [nombre('stress', 'Stress'), nombre('determination', 'Détermination'), nombre('reputation', 'Réputation'), nombre('stress_max'), nombre('resistance', 'Résistance')] },
    ],
} as unknown as SheetTemplate;
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }, { id: 'fonction', label: 'Fonction', sectionId: 'fonctions' }],
    reserve: { base: 2, max: 5, faces: 20, cout: [1, 2, 3] },
    critique: 1, complication: 20, difficulte: { min: 0, max: 5, defaut: 1 },
    specialisation: { label: 'Spécialisation', composante: 'fonction' },
    starTrek: {
        attributs: ['maitrise', 'forme', 'audace'], fonctions: ['securite', 'ingenierie'], forme: 'forme',
        stress: { courant: 'stress', maximum: 'stress_max' }, protection: 'resistance', determination: 'determination', reputation: 'reputation',
    },
};
const DICE = { defaultDice: '2d20', logic: 'count-success', engine: '2d20' } as unknown as DiceConfig;
const WORF = { maitrise: 10, forme: 11, audace: 12, securite: 5, ingenierie: 2, stress: 0, determination: 1, reputation: 3, resistance: 1 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 10);
const ecrire = vi.fn();
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); ecrire.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = () => render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={WORF} ecrireSurLaFiche={ecrire} />).container;
const selects = (c: HTMLElement) => [...c.querySelectorAll('[data-panneau-de-jet] select')] as HTMLSelectElement[];
const composer = (c: HTMLElement, attribut: string, fonction: string) => {
    const [a, f] = selects(c);
    fireEvent.change(a, { target: { value: attribut } });
    fireEvent.change(f, { target: { value: fonction } });
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const ecrit = () => Object.assign({}, ...ecrire.mock.calls.map(c => c[0]));

describe('Star Trek au panneau de jet', () => {
    it('l’attaque au corps à corps prend Audace + Sécurité, difficulté 1 (p. 290)', () => {
        const c = monter();
        fireEvent.click(screen.getByRole('radio', { name: 'Attaque au corps à corps' }));
        const [a, f] = selects(c);
        expect([a.value, f.value]).toEqual(['audace', 'securite']);
        faces(6, 19);
        lancer();
        expect(screen.getByText('1 réussite / difficulté 1')).toBeTruthy();
        expect(c.querySelector('[data-blessure-infligee]')).toBeTruthy();
    });

    it('l’assistant ne compte que si le personnage réussit (p. 256)', () => {
        const c = monter();
        composer(c, 'maitrise', 'ingenierie');
        const prep = c.querySelector('[data-preparation-star-trek]') as HTMLElement;
        fireEvent.change(within(prep).getByLabelText('Nom de l’assistant'), { target: { value: 'Rom' } });
        fireEvent.change(within(prep).getByLabelText('Seuil de l’assistant'), { target: { value: '13' } });
        fireEvent.click(within(prep).getByText('Ajouter'));
        faces(18, 17, 3);
        lancer();
        expect(screen.getByText(/0 réussite \/ difficulté 1 \(l’aide ne compte pas/)).toBeTruthy();
        faces(5, 17, 3);
        lancer();
        expect(screen.getByText('2 réussites / difficulté 1 (dont 1 de l’aide)')).toBeTruthy();
    });

    it('la marge de complication 3 fait compliquer un 18 (p. 258)', () => {
        const c = monter();
        composer(c, 'maitrise', 'ingenierie');
        fireEvent.change(c.querySelector('[data-marge-de-complication]')!, { target: { value: '3' } });
        faces(18, 4);
        lancer();
        expect(screen.getByText('1 complication')).toBeTruthy();
        expect(screen.getByText('Repousser une complication (+2 Menace)')).toBeTruthy();
    });

    it('l’Occasion parfaite fait un 1 d’un dé et coûte un point de Détermination (p. 262)', () => {
        const c = monter();
        composer(c, 'maitrise', 'ingenierie');
        fireEvent.click(screen.getByLabelText(/Un idéal ou une directive s’aligne/));
        fireEvent.click(screen.getByLabelText(/Occasion parfaite/));
        faces(19, 18);
        lancer();
        expect(screen.getByText('2 réussites / difficulté 1')).toBeTruthy();
        expect(ecrit().determination).toBe(0);
    });

    it('l’Éclair d’inspiration relance les dés choisis ; le nouveau résultat remplace l’ancien', () => {
        const c = monter();
        composer(c, 'maitrise', 'ingenierie');
        fireEvent.click(screen.getByLabelText(/Un idéal ou une directive s’aligne/));
        faces(19, 18);
        lancer();
        expect(screen.getByText('0 réussite / difficulté 1')).toBeTruthy();
        const suites = c.querySelector('[data-suites-star-trek]') as HTMLElement;
        fireEvent.click(within(suites).getAllByRole('checkbox')[0]);
        faces(3);
        fireEvent.click(within(suites).getByText('Éclair d’inspiration (1 Détermination)'));
        expect(screen.getByText('1 réussite / difficulté 1')).toBeTruthy();
        expect(ecrit().determination).toBe(0);
    });

    it('Stress et blessures : éviter une blessure prend du Stress ; encaisser rend vaincu (p. 292)', () => {
        const c = monter();
        const carte = c.querySelector('[data-stress-star-trek]') as HTMLElement;
        expect(within(carte).getByText('0 / 11')).toBeTruthy();
        fireEvent.change(within(carte).getByLabelText('Stress ou gravité'), { target: { value: '3' } });
        fireEvent.click(within(carte).getByText('Éviter une blessure de cette gravité'));
        expect(ecrit().stress).toBe(3);
        fireEvent.click(within(carte).getByText('Encaisser la blessure'));
        expect(ecrit()[CLE_STAR_TREK]).toMatchObject({ vaincu: true, blessures: [{ nom: 'Brûlure', gravite: 2, letale: false }] });
    });
});
