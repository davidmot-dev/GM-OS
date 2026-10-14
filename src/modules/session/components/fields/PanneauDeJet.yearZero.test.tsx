import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Forcer le jet depuis la fiche** — Alien et Blade Runner, 2026-10-14
 * (`dice/systemes/yearZero.ts`). Le Stress d'Alien monte avant la relance et
 * ajoute son dé ; une Panique interdit de forcer et se joue ; les 1 de Blade
 * Runner se paient en Santé ou en Sang-froid, et le réplicant force deux fois.
 */

let de: ReturnType<typeof vi.spyOn>;
/** Les dés rendent ces faces, dans l'ordre. */
const faces = (...f: number[]) => de.mockImplementation(() => {
    const v = f.shift();
    if (v === undefined) throw new Error('plus de faces prévues');
    return v;
});
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); });

const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const forcer = () => fireEvent.click(screen.getByText(/^Forcer le jet/));
const boutonForcer = () => screen.getByText(/^Forcer le jet/).closest('button')!;

describe('Alien — le Stress et la Panique', () => {
    const JET: DescripteurDeJet = {
        sens: 'superieur-ou-egal',
        reserve: {
            base: 0, max: 10, faces: 6,
            composantes: [
                { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
                { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            ],
            secondaire: {
                label: 'Stress', libelleDuUn: 'Panique',
                composantes: [{ id: 'stress', label: 'Stress', sectionId: 'jauges' }],
            },
        },
        forcer: {
            garde: 'reussites', bloqueParLaSeconde: true, monteeDeLaSeconde: 1,
            interdit: [{ si: { champ: 'androide', coche: true }, raison: 'Un androïde ne force jamais.' }],
        },
        panique: { faces: 6, champ: 'panique_en_cours', seuil: 7 },
        reussiteDepensee: { champ: 'points_de_recit', label: 'Point de Récit' },
    };
    const DICE = { defaultDice: 'd6', logic: 'count-success', engine: 'yze', successThreshold: 6 } as unknown as DiceConfig;
    const FICHE = {
        id: 'tpl-alien', name: 'Alien', emoji: '👽',
        sections: [
            { id: 'identite', label: 'Identité', fields: [{ id: 'type_personnage', label: 'Type', type: 'text', defaultValue: '' }] },
            { id: 'attributs', label: 'Attributs', fields: [{ id: 'force', label: 'Force', type: 'number', defaultValue: 0 }] },
            { id: 'competences', label: 'Compétences', fields: [{ id: 'combat', label: 'Combat rapproché', type: 'number', defaultValue: 0 }] },
            { id: 'jauges', label: 'Jauges', fields: [{ id: 'niveau_de_stress', label: 'Niveau de Stress', type: 'number', defaultValue: 0 }] },
        ],
    } as unknown as SheetTemplate;

    const monter = (valeurs: Record<string, unknown> = {}) => {
        const ecrire = vi.fn();
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE}
            valeurs={{ force: 3, combat: 2, niveau_de_stress: 1, type_personnage: 'Humain', points_de_recit: 2, panique_en_cours: 0, ...valeurs }} ecrireSurLaFiche={ecrire} />);
        const [attribut, competence, stress] = screen.getAllByRole('combobox');
        fireEvent.change(attribut, { target: { value: 'force' } });
        fireEvent.change(competence, { target: { value: 'combat' } });
        fireEvent.change(stress, { target: { value: 'niveau_de_stress' } });
        return ecrire;
    };

    it('forcer monte le Stress d’un point, et le nouveau dé de Stress entre dans la relance', () => {
        const ecrire = monter();
        faces(6, 3, 3, 2, 2, 4);
        lancer();
        expect(screen.getByText(/1 réussite/)).toBeTruthy();

        faces(6, 6, 2, 2, 3, 5);
        forcer();
        expect(ecrire).toHaveBeenCalledWith({ niveau_de_stress: 2 });
        expect(screen.getByText(/3 réussites/)).toBeTruthy();
        expect(screen.getByText('Stress +1 → 2')).toBeTruthy();
        expect(screen.getByText('Jet forcé : 1 dé gardé, 6 relancés')).toBeTruthy();
        expect(boutonForcer().disabled).toBe(true);
        expect(screen.getByText('Ce jet a déjà été forcé.')).toBeTruthy();
    });

    it('une Panique au premier lancer interdit de forcer, et se joue : 1D6 + Stress', () => {
        const ecrire = monter({ niveau_de_stress: 1 });
        faces(2, 2, 2, 2, 2, 1);
        lancer();
        expect(boutonForcer().disabled).toBe(true);
        expect(screen.getByText(/^Panique : un 1 sur la seconde réserve/)).toBeTruthy();

        faces(4);
        fireEvent.click(screen.getByText('Test de Panique'));
        expect(screen.getByText(/Test de Panique : 4 \+ 1 = 5/)).toBeTruthy();
        expect(ecrire).not.toHaveBeenCalled();
    });

    it('après un forçage, la Panique compte le Stress monté', () => {
        monter({ niveau_de_stress: 2 });
        faces(3, 3, 3, 3, 3, 4, 4);
        lancer();
        faces(2, 2, 2, 2, 2, 3, 3, 1);
        forcer();
        faces(5);
        fireEvent.click(screen.getByText('Test de Panique'));
        expect(screen.getByText(/Test de Panique : 5 \+ 3 = 8/)).toBeTruthy();
    });

    it('un Point de Récit ajoute un 6 au jet et se décompte', () => {
        const ecrire = monter();
        faces(2, 2, 2, 2, 2, 4);
        lancer();
        expect(screen.getByText(/^0 réussite/)).toBeTruthy();
        fireEvent.click(screen.getByText('Dépenser un Point de Récit (2)'));
        expect(ecrire).toHaveBeenCalledWith({ points_de_recit: 1 });
        expect(screen.getByText(/^1 réussite/)).toBeTruthy();
        expect(screen.getByText('Point de Récit −1 → 1 : un 6 ajouté')).toBeTruthy();
        expect(screen.getByText('Dépenser un Point de Récit (1)')).toBeTruthy();
    });

    it('le 6 du Point de Récit reste sur la table quand on force', () => {
        monter();
        faces(2, 2, 2, 2, 2, 4);
        lancer();
        fireEvent.click(screen.getByText('Dépenser un Point de Récit (2)'));
        faces(3, 3, 3, 3, 3, 3, 3);
        forcer();
        expect(screen.getByText('Jet forcé : 1 dé gardé, 7 relancés')).toBeTruthy();
        expect(screen.getByText(/^1 réussite/)).toBeTruthy();
    });

    it('une panique s’inscrit sur la fiche ; déjà en panique, un total plus bas monte d’un cran', () => {
        const ecrire = monter({ niveau_de_stress: 1, panique_en_cours: 9 });
        faces(2, 2, 2, 2, 2, 1);
        lancer();
        faces(1);
        fireEvent.click(screen.getByText('Test de Panique'));
        expect(screen.getByText(/1 \+ 1 = 2 ; déjà en panique \(9\) : 10/)).toBeTruthy();
        expect(ecrire).toHaveBeenCalledWith({ panique_en_cours: 10 });
    });

    it('un androïde ne force jamais', () => {
        monter({ androide: true, niveau_de_stress: 0 });
        faces(3, 3, 3, 3, 3);
        lancer();
        expect(boutonForcer().disabled).toBe(true);
        expect(screen.getByText('Un androïde ne force jamais.')).toBeTruthy();
    });
});

describe('Blade Runner — les crânes se paient', () => {
    const JET: DescripteurDeJet = {
        sens: 'superieur-ou-egal',
        desEchelonnes: {
            echelle: 'yze-lettres',
            composantes: [
                { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
                { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            ],
        },
        forcer: {
            garde: 'reussites-et-uns',
            foisSi: [{ si: { champ: 'nature', contient: ['réplicant'] }, fois: 2 }],
            prixDesUns: {
                champ: 'sante', label: 'Santé',
                si: [
                    { si: { champ: 'nature', contient: ['réplicant'] }, champ: 'sangFroid', label: 'Sang-froid' },
                    { si: { composante: 'attribut', parmi: ['intelligence', 'empathie'] }, champ: 'sangFroid', label: 'Sang-froid' },
                ],
            },
        },
    };
    const DICE = { defaultDice: '1d6', logic: 'count-success', engine: 'yze' } as unknown as DiceConfig;
    const FICHE = {
        id: 'tpl-br', name: 'Blade Runner', emoji: '🌃',
        sections: [
            { id: 'attributs', label: 'Attributs', fields: [
                { id: 'vigueur', label: 'Vigueur', type: 'text', defaultValue: '' },
                { id: 'empathie', label: 'Empathie', type: 'text', defaultValue: '' },
            ] },
            { id: 'competences', label: 'Compétences', fields: [{ id: 'corpsACorps', label: 'Corps à corps', type: 'text', defaultValue: '' }] },
        ],
    } as unknown as SheetTemplate;

    const monter = (attribut: string, valeurs: Record<string, unknown> = {}) => {
        const ecrire = vi.fn();
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE}
            valeurs={{ vigueur: 'B', empathie: 'A', corpsACorps: 'C', nature: 'Humain', sante: 4, sangFroid: 3, ...valeurs }}
            ecrireSurLaFiche={ecrire} />);
        const [a, c] = screen.getAllByRole('combobox');
        fireEvent.change(a, { target: { value: attribut } });
        fireEvent.change(c, { target: { value: 'corpsACorps' } });
        return ecrire;
    };

    it('le 1 reste, l’autre dé se relance, et chaque 1 coûte un point de Santé', () => {
        const ecrire = monter('vigueur');
        faces(1, 4);
        lancer();
        faces(1);
        forcer();
        expect(de).toHaveBeenLastCalledWith(8);
        expect(ecrire).toHaveBeenCalledWith({ sante: 2 });
        expect(screen.getByText('Santé −2 (2 dés sur 1) → 2')).toBeTruthy();
        expect(screen.getByText('Ce jet a déjà été forcé.')).toBeTruthy();
    });

    it('un jet d’Empathie se paie en Sang-froid', () => {
        const ecrire = monter('empathie');
        faces(1, 4);
        lancer();
        faces(7);
        forcer();
        expect(ecrire).toHaveBeenCalledWith({ sangFroid: 2 });
    });

    it('le réplicant force deux fois, en Sang-froid, sans repayer un crâne', () => {
        const ecrire = monter('vigueur', { nature: 'Réplicant' });
        faces(1, 4);
        lancer();
        faces(3);
        forcer();
        expect(ecrire).toHaveBeenLastCalledWith({ sangFroid: 2 });
        faces(1);
        forcer();
        expect(ecrire).toHaveBeenLastCalledWith({ sangFroid: 1 });
        expect(screen.getByText('Ce jet a déjà été forcé 2 fois.')).toBeTruthy();
    });

    it('Brisé par le stress : le rappel, le dé d’Empathie, et un 1 coûte un point de Sang-froid maximal à vie', () => {
        const brise = {
            ...JET,
            brise: [
                { champ: 'sante', label: 'Brisé par les dégâts', rappel: 'Il s’effondre.' },
                { champ: 'sangFroid', label: 'Brisé par le stress', rappel: 'Effet de stress critique.', de: 'empathie',
                    table: { univers: 'Blade Runner', table: 'effets_de_stress_critiques_humain' }, perteDuMaximum: 'sangFroidMax' },
            ],
        };
        const ecrire = vi.fn();
        render(<PanneauDeJet descripteur={brise} dice={DICE} template={FICHE}
            valeurs={{ vigueur: 'B', empathie: 'A', corpsACorps: 'C', nature: 'Réplicant', sante: 4, sangFroid: 1, sangFroidMax: 3 }}
            ecrireSurLaFiche={ecrire} />);
        const [a, c] = screen.getAllByRole('combobox');
        fireEvent.change(a, { target: { value: 'vigueur' } });
        fireEvent.change(c, { target: { value: 'corpsACorps' } });
        faces(1, 4);
        lancer();
        faces(3);
        forcer();
        expect(screen.getByText('Brisé par le stress')).toBeTruthy();
        expect(screen.queryByText('Brisé par les dégâts')).toBeNull();
        faces(1);
        fireEvent.click(screen.getByText('Lancer l’effet critique (Empathie)'));
        expect(de).toHaveBeenLastCalledWith(12);
        expect(ecrire).toHaveBeenLastCalledWith({ sangFroidMax: 2 });
        expect(screen.getByText('sangFroidMax −1 à vie → 2')).toBeTruthy();
    });

    it('sans forçage, les 1 ne coûtent rien', () => {
        const ecrire = monter('vigueur');
        faces(1, 1);
        lancer();
        expect(ecrire).not.toHaveBeenCalled();
    });
});
