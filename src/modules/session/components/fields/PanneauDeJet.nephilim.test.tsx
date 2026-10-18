import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * **Le jet de Nephilim, au panneau** — 2026-10-17. Le joueur choisit un Vécu
 * (passé ou contemporain) par son NOM, puis, s'il le veut, le Ka de son
 * approche ; la cible vaut (Vécu + Ka) × 10.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    cible: {
        mecanique: 'nephilim',
        caracteristique: { id: 'vecu', label: 'Vécu', sectionId: 'vecus' },
        ajustement: [{ id: 'approche', label: 'Approche', sectionId: 'pentacle', facultative: true }],
    },
    reserve: { base: 1, max: 1, faces: 100 },
};
const DICE = { defaultDice: '1d100', logic: 'd100-low' as const, engine: 'standard' as const };
const FICHE = {
    id: 'tpl-nephilim', name: 'Nephilim', emoji: '✨',
    sections: [
        { id: 'vecus', label: 'Vécus', fields: [
            { id: 'simulacrum.experience', label: 'Vécu du simulacre', type: 'text', defaultValue: '' },
            { id: 'simulacrum.experience.degree', label: 'Degré de vécu du simulacre', type: 'number', defaultValue: 0, libelleSur: 'simulacrum.experience' },
            { id: 'pastlives.0.name', label: 'Vécu passé 1', type: 'text', defaultValue: '' },
            { id: 'pastlives.0.degree', label: 'Degré du vécu passé 1', type: 'number', defaultValue: 0, libelleSur: 'pastlives.0.name' },
            { id: 'pastlives.1.name', label: 'Vécu passé 2', type: 'text', defaultValue: '' },
            { id: 'pastlives.1.degree', label: 'Degré du vécu passé 2', type: 'number', defaultValue: 0, libelleSur: 'pastlives.1.name' },
        ] },
        { id: 'pentacle', label: 'Pentacle', fields: [
            { id: 'ka.fire', label: 'Ka-Feu', type: 'number', defaultValue: 0 },
            { id: 'ka.water', label: 'Ka-Eau', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const VALEURS = {
    'simulacrum.experience': 'Infirmière', 'simulacrum.experience.degree': 5,
    'pastlives.0.name': 'Templier', 'pastlives.0.degree': 4,
    // Le Vécu 2 n'est pas écrit : il n'a rien à proposer.
    'pastlives.1.name': '', 'pastlives.1.degree': 0,
    'ka.fire': 5, 'ka.water': 3,
};

afterEach(cleanup);

describe('le jet de Nephilim au panneau', () => {
    it('le menu des Vécus porte leurs noms, sans les champs de nom ni les lignes vides', () => {
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} />);
        const [vecu] = screen.getAllByRole('combobox');
        const options = within(vecu).getAllByRole('option').map(o => o.textContent);
        expect(options).toEqual(['— choisir —', 'Infirmière (5)', 'Templier (4)']);
    });

    it('Templier 4 avec l’approche du Feu 5 : 90 %, et le d100 dit sa marge', () => {
        const lancer = vi.spyOn(Math, 'random');
        lancer.mockReturnValueOnce(0.35).mockReturnValueOnce(0.75);
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} />);
        const [vecu, approche] = screen.getAllByRole('combobox');
        fireEvent.change(vecu, { target: { value: 'pastlives.0.degree' } });
        fireEvent.change(approche, { target: { value: 'ka.fire' } });
        expect(screen.getAllByText(/\(4 \+ 5\) × 10 = 90 %/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.getAllByText(/37 vs 90 — marge 3/).length).toBeGreaterThan(0);
        lancer.mockRestore();
    });
});

/**
 * **Les suites d'une maladresse ou d'un critique** — 2026-10-18 : la jauge qui
 * monte dépend de ce qui a été lancé, et le meneur la note d'un clic.
 */
describe('les suites des critiques au panneau', () => {
    const SUITES: DescripteurDeJet = {
        ...JET,
        cible: { ...JET.cible!, caracteristique: { ...JET.cible!.caracteristique, sectionsSupplementaires: ['arts'] } },
        suitesDesCritiques: [
            { quand: 'maladresse', label: 'Maladresse du Vécu contemporain', rappel: '+1 degré d’Ombre.', champs: ['simulacrum.experience.degree'], ajouter: { champ: 'falls.shadow' } },
            { quand: 'critique', label: 'Critique de Magie', sections: ['arts'], ajouter: { champ: 'resources.sapience' } },
        ],
    };
    const AVEC_CHUTES = {
        ...FICHE,
        sections: [
            ...FICHE.sections,
            { id: 'arts', label: 'Magie', fields: [{ id: 'occult.magic.first', label: 'Basse Magie', type: 'number', defaultValue: 0 }] },
            { id: 'chutes', label: 'Chutes', fields: [
                { id: 'falls.shadow', label: 'Ombre', type: 'gauge', defaultValue: 0, max: 10 },
                { id: 'resources.sapience', label: 'Sapience', type: 'number', defaultValue: 0 },
            ] },
        ],
    } as unknown as SheetTemplate;
    const AVEC_VALEURS = { ...VALEURS, 'occult.magic.first': 5, 'falls.shadow': 2, 'resources.sapience': 1 };

    /** Un d100 en deux d10 : dizaines puis unités. */
    const lancerAvec = (choix: string, dizaines: number, unites: number) => {
        const ecrire = vi.fn();
        const de = vi.spyOn(Math, 'random');
        de.mockReturnValueOnce(dizaines / 10 + 0.05).mockReturnValueOnce(unites / 10 + 0.05);
        render(<PanneauDeJet descripteur={SUITES} dice={DICE} template={AVEC_CHUTES} valeurs={AVEC_VALEURS} ecrireSurLaFiche={ecrire} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: choix } });
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        de.mockRestore();
        return ecrire;
    };

    it('une maladresse sur le Vécu contemporain propose +1 Ombre, et la note d’un clic', () => {
        const ecrire = lancerAvec('simulacrum.experience.degree', 7, 7);
        expect(screen.getByText('Maladresse du Vécu contemporain')).toBeTruthy();
        fireEvent.click(screen.getByText('Noter +1 Ombre'));
        expect(ecrire).toHaveBeenCalledWith({ 'falls.shadow': 3 });
        expect(screen.getByText('Ombre : 2 → 3')).toBeTruthy();
        expect(screen.queryByText('Noter +1 Ombre')).toBeNull();
    });

    it('une maladresse sur un Vécu passé ne propose rien', () => {
        lancerAvec('pastlives.0.degree', 7, 7);
        expect(screen.queryByText(/Noter/)).toBeNull();
    });

    it('un critique en Magie propose le Point de Sapience', () => {
        const ecrire = lancerAvec('occult.magic.first', 2, 2);
        fireEvent.click(screen.getByText('Noter +1 Sapience'));
        expect(ecrire).toHaveBeenCalledWith({ 'resources.sapience': 2 });
    });
});
