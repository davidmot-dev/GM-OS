import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Le test de Chroniques Oubliées Contemporain au panneau** (2026-10-31) : le jet du
 * pilote 2.0.0, sur les exemples du livre de règles (pages imprimées). Le pilote forgé
 * faisait échouer tous les tests.
 */
const ATTAQUES = ['attaque_au_contact', 'arme1_attaque'];
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [{ id: 'caracteristique', label: 'Caractéristique ou attaque', sectionId: 'caracteristiques', sectionsSupplementaires: ['attaques', 'armes'],
        motif: '^(agilite|perception|volonte|attaque_au_contact|arme1_attaque)$' }],
    reserve: { base: 1, max: 1, faces: 20 },
    coc: {
        sante: 'echelle_de_sante', physiques: ['agilite', ...ATTAQUES], attaques: ATTAQUES,
        evolution: { champ: 'echelle_evolution', modele: 'modele_evolution' }, volonte: 'volonte',
    },
};
const DICE = { defaultDice: '1d20', logic: 'sum', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-coc', name: 'COC 2', emoji: '🎭',
    sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [
            { id: 'agilite', label: 'Agilité (AGI)', type: 'number', defaultValue: 0 },
            { id: 'perception', label: 'Perception (PER)', type: 'number', defaultValue: 0 },
            { id: 'volonte', label: 'Volonté (VOL)', type: 'number', defaultValue: 0 },
        ] },
        { id: 'attaques', label: 'Attaques', fields: [{ id: 'attaque_au_contact', label: 'Attaque au contact', type: 'number', defaultValue: 0 }] },
        { id: 'armes', label: 'Armes', fields: [
            { id: 'arme1', label: 'Arme 1', type: 'textarea', defaultValue: '' },
            { id: 'arme1_attaque', label: 'Arme 1 — bonus', type: 'number', defaultValue: 0, libelleSur: 'arme1' },
            { id: 'arme1_bc', label: 'Arme 1 — bonus critique', type: 'number', defaultValue: 0 },
        ] },
        { id: 'echelles', label: 'Échelles', fields: [
            { id: 'echelle_de_sante', label: 'Échelle de santé', type: 'number', defaultValue: 0 },
            { id: 'modele_evolution', label: 'Modèle', type: 'select', defaultValue: 'Héros', options: ['Héros', 'Blues'] },
            { id: 'echelle_evolution', label: "Échelle d'évolution", type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const AMELIA = { agilite: 2, perception: 2, volonte: 1, attaque_au_contact: 1, arme1: 'Couteau', arme1_attaque: 2, arme1_bc: 6,
    echelle_de_sante: 0, modele_evolution: 'Héros', echelle_evolution: 0 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = AMELIA, champ = 'agilite', ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: champ } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const consigne = () => consigner.mock.calls.at(-1)![0] as { titre: string; tagSuccess: boolean; totalDisplay: string };

describe('le test de COC au panneau', () => {
    it('le menu propose les caractéristiques, les attaques et l’arme sous son nom, pas ses DM ni son bonus critique', () => {
        monter();
        const options = [...screen.getAllByRole('combobox')[0].querySelectorAll('option')].map(o => o.textContent);
        expect(options).toEqual(expect.arrayContaining(['Agilité (AGI) (2)', 'Attaque au contact (1)', 'Couteau (2)']));
        expect(options.some(o => /critique/.test(o ?? ''))).toBe(false);
    });

    it('saute la haie : 8 au d20 + AGI 2 atteint Facile 10, réussi — égal suffit ; un seul d20 lancé (p. 8, 57-58)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByText('Facile 10'));
        expect(panneau.querySelector('[data-composition-coc]')!.textContent).toContain('1d20 + 2 = + 2 au dé, contre 10');
        faces(8);
        lancer();
        expect(de).toHaveBeenCalledTimes(1);
        expect(de).toHaveBeenCalledWith(20);
        expect(consigne().tagSuccess).toBe(true);
        expect(consigne().totalDisplay).toBe('Réussite — 8 + 2 = 10 contre 10');
    });

    it('7 au d20 + AGI 2 contre 10 : échec', () => {
        monter();
        fireEvent.click(screen.getByText('Facile 10'));
        faces(7);
        lancer();
        expect(consigne().tagSuccess).toBe(false);
        expect(screen.getAllByText('Échec').length).toBeGreaterThan(0);
    });

    it('un 20 naturel au couteau contre la DEF : réussite critique, et le bonus critique de l’arme se rappelle (p. 88)', () => {
        const { panneau } = monter(AMELIA, 'arme1_attaque');
        expect(screen.getByText('DEF de la cible')).toBeTruthy();
        faces(20);
        lancer();
        expect(screen.getAllByText('Réussite critique').length).toBeGreaterThan(0);
        expect(panneau.querySelector('[data-suites-coc]')!.textContent).toContain('bonus critique de l’arme');
        expect(consigne().titre).toBe('Couteau');
    });

    it('le dé bonus lance deux d20 et garde le meilleur (p. 59)', () => {
        monter();
        fireEvent.change(screen.getByLabelText('Dés bonus'), { target: { value: '1' } });
        faces(3, 17);
        lancer();
        expect(de).toHaveBeenCalledTimes(2);
        expect(consigne().totalDisplay).toBe('Réussite — 17 + 2 = 19 contre 15');
    });

    it('Blessé, l’action physique perd 5, la Perception rien (p. 72)', () => {
        const blesse = { ...AMELIA, echelle_de_sante: 16 };
        const { panneau } = monter(blesse);
        expect(panneau.querySelector('[data-composition-coc]')!.textContent).toContain('− 5 (Blessé)');
        cleanup();
        const per = monter(blesse, 'perception');
        expect(per.panneau.querySelector('[data-composition-coc]')!.textContent).not.toContain('Blessé');
    });

    it('l’échelle du héros : un échelon pour +2 au test qui vient d’échouer, retiré de la fiche (p. 82)', () => {
        const { ecrire } = monter({ ...AMELIA, echelle_evolution: 3 });
        faces(12);
        lancer();
        expect(consigne().tagSuccess).toBe(false);
        fireEvent.click(screen.getByText('+2 (1 échelon)'));
        expect(ecrire).toHaveBeenCalledWith({ echelle_evolution: 2 });
        expect(consigne().totalDisplay).toBe('Réussite — 12 + 2 + 2 (héros) = 16 contre 15');
    });

    it('un critique fait gagner un échelon de héros, une fois (p. 81)', () => {
        const { ecrire } = monter({ ...AMELIA, echelle_evolution: 3 });
        faces(1);
        lancer();
        fireEvent.click(screen.getByText('+1 échelon (critique)'));
        expect(ecrire).toHaveBeenCalledWith({ echelle_evolution: 4 });
        expect(screen.getByText('Échelon gagné')).toBeTruthy();
    });

    it('le blues aide la VOL : Déstabilisé, +3 (p. 84)', () => {
        const { panneau } = monter({ ...AMELIA, modele_evolution: 'Blues', echelle_evolution: 11 }, 'volonte');
        expect(panneau.querySelector('[data-composition-coc]')!.textContent).toContain('+ 3 (Blues : Déstabilisé)');
        expect(screen.queryByText(/échelon\)/)).toBeNull();
    });

    it('prendre son temps : 10 sans dé (p. 59)', () => {
        monter();
        fireEvent.click(screen.getByLabelText('Prendre son temps'));
        lancer();
        expect(de).not.toHaveBeenCalled();
        expect(consigne().totalDisplay).toBe('Échec — 10 (pris son temps) + 2 = 12 contre 15');
    });
});
