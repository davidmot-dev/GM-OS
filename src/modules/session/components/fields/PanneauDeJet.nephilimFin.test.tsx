import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * **Finir Nephilim, au panneau** — 23/10/2026 (N1 à N9). Une fiche faite comme
 * celle du pilote ; les options du jet, ses suites et les cartes de la fiche.
 */
const nombre = (id: string, label = id) => ({ id, label, type: 'number', defaultValue: 0 });
const caseACocher = (id: string, label = id) => ({ id, label, type: 'checkbox', defaultValue: false });
const FICHE = {
    id: 'tpl-nephilim', name: 'Nephilim', emoji: '✨',
    sections: [
        { id: 'les_vecus', label: 'Les Vécus', fields: [
            { id: 'pastlives_0_name', label: 'Vécu passé 1', type: 'text', defaultValue: '' },
            { id: 'pastlives_0_degree', label: 'Degré du Vécu passé 1', type: 'number', defaultValue: 0, libelleSur: 'pastlives_0_name' },
        ] },
        { id: 'arts_magie', label: 'Magie — cercles', fields: [nombre('occult_magic_first', 'Basse Magie')] },
        { id: 'arts_kabbale', label: 'Kabbale — Sephiroth', fields: [nombre('occult_kabbalah_hod', 'Hod')] },
        { id: 'le_pentacle', label: 'Le Pentacle', fields: [nombre('ka_fire', 'Ka-Feu'), nombre('ka_water', 'Ka-Eau'), nombre('ka_earth', 'Ka-Terre')] },
        { id: 'ka_dominant', label: 'Ka dominant', fields: [{ id: 'ka_dominant', label: 'Ka dominant', type: 'select', options: ['Feu', 'Eau'] }, nombre('ka_dominant_degre', 'Degré du Ka dominant')] },
        { id: 'magie_sorts', label: 'Magie — sortilèges', fields: [
            { id: 'magic_spells_0_name', label: 'Sort 1 — nom', type: 'text', defaultValue: '' },
            { id: 'magic_spells_0_degree', label: 'Sort 1 — degré', type: 'number', defaultValue: 0, libelleSur: 'magic_spells_0_name' },
        ] },
        { id: 'kabbale_invocations', label: 'Kabbale — invocations', fields: [
            { id: 'kabbalah_invocations_0_name', label: 'Invocation 1 — nom', type: 'text', defaultValue: '' },
            nombre('kabbalah_invocations_0_degree', 'Invocation 1 — degré'),
        ] },
        { id: 'sante', label: 'Santé', fields: [
            nombre('health_physical'), caseACocher('health_physical_case_1'), caseACocher('health_physical_case_2'), caseACocher('health_physical_case_3'),
            caseACocher('consequences_physical_minor_active'), caseACocher('consequences_physical_serious_active'), caseACocher('consequences_physical_severe_active'),
        ] },
        { id: 'les_chutes', label: 'Les Chutes', fields: [nombre('falls_khaiba'), nombre('falls_shadow'), nombre('falls_narcosis'), nombre('falls_khaiba_misenjeu')] },
        { id: 'stase_et_sapience', label: 'Stase et Sapience', fields: [nombre('resources_sapience', 'Points de Sapience'), nombre('resources_sapience_chute'), nombre('stasis_degree')] },
    ],
} as unknown as SheetTemplate;
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    cible: {
        mecanique: 'nephilim',
        caracteristique: { id: 'vecu', label: 'Vécu ou Art occulte', sectionId: 'les_vecus', sectionsSupplementaires: ['arts_magie', 'arts_kabbale'] },
        ajustement: [
            { id: 'approche', label: 'Approche (Ka)', sectionId: 'le_pentacle', facultative: true },
            { id: 'sort', label: 'Sort (Magie)', sectionId: 'magie_sorts', facultative: true, soustraire: true, motif: '^magic_spells_[0-9]+_degree$' },
        ],
    },
    reserve: { base: 1, max: 1, faces: 100 },
    suitesDesCritiques: [{ quand: 'critique', label: 'Critique en Science occulte', sections: ['arts_magie', 'arts_kabbale'], ajouter: { champ: 'resources_sapience' } }],
    nephilim: {
        composantes: { vecu: 'vecu', approche: 'approche', sort: 'sort' },
        arts: { magie: ['arts_magie'], kabbale: ['arts_kabbale'] },
        vecusPasses: ['les_vecus'], kaDominant: { choix: 'ka_dominant', degre: 'ka_dominant_degre' }, kaTerre: 'ka_earth',
        sapience: 'resources_sapience', stase: 'stasis_degree',
        chutes: { khaiba: 'falls_khaiba', ombre: 'falls_shadow', narcose: 'falls_narcosis', misesEnJeu: { khaiba: 'falls_khaiba_misenjeu' }, sapienceDeChute: 'resources_sapience_chute' },
        sante: { physique: {
            cases: [{ champ: 'health_physical_case_1', valeur: 1 }, { champ: 'health_physical_case_2', valeur: 2 }, { champ: 'health_physical_case_3', valeur: 3 }],
            consequences: [{ champ: 'consequences_physical_minor_active', label: 'Mineure', absorbe: 2 }, { champ: 'consequences_physical_serious_active', label: 'Sérieuse', absorbe: 4 }, { champ: 'consequences_physical_severe_active', label: 'Grave', absorbe: 6 }],
            compte: 'health_physical' } },
        pacte: { motif: '^kabbalah_invocations_[0-9]+_degree$' },
    },
};
const DICE = { defaultDice: '1d100', logic: 'd100-low' as const, engine: 'standard' as const };
const VALEURS = {
    pastlives_0_name: 'Templier', pastlives_0_degree: 4, occult_magic_first: 5, occult_kabbalah_hod: 4,
    ka_fire: 5, ka_water: 3, ka_earth: 4, ka_dominant: 'Feu', ka_dominant_degre: 5,
    magic_spells_0_name: 'Brume noire', magic_spells_0_degree: 3, kabbalah_invocations_0_name: 'Les lutins au dos de nacre', kabbalah_invocations_0_degree: 2,
    resources_sapience: 6, resources_sapience_chute: 0, stasis_degree: 2, falls_khaiba: 3,
};

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = (valeurs: Record<string, unknown> = VALEURS) => {
    const ecrire = vi.fn();
    render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />);
    const [vecu, approche, sort] = screen.getAllByRole('combobox');
    return { ecrire, vecu, approche, sort };
};
/** Un d100 en deux d10 : dizaines puis unités. */
const des = (...faces: number[]) => { const de = vi.spyOn(Math, 'random'); for (const f of faces) de.mockReturnValueOnce(f / 10 + 0.05); };

describe('N1 · les Conséquences au jet', () => {
    it('une Conséquence physique cochée retire son malus au Vécu d’une action physique, puis l’approche s’ajoute', () => {
        const { vecu, approche } = ouvrir({ ...VALEURS, consequences_physical_minor_active: true });
        fireEvent.change(vecu, { target: { value: 'pastlives_0_degree' } });
        fireEvent.change(approche, { target: { value: 'ka_fire' } });
        const physique = screen.getByLabelText(/Action physique : Conséquences physiques −2/) as HTMLInputElement;
        expect(physique.checked).toBe(true);
        expect(screen.getAllByText(/\(2 \+ 5\) × 10 = 70 %/).length).toBeGreaterThan(0);
        fireEvent.click(physique);
        expect(screen.getAllByText(/\(4 \+ 5\) × 10 = 90 %/).length).toBeGreaterThan(0);
    });
});

describe('N6 · le Sacrifice', () => {
    it('5 PS : le sort réussit d’office, même sur un double raté', () => {
        const { ecrire, vecu, approche, sort } = ouvrir();
        fireEvent.change(vecu, { target: { value: 'occult_magic_first' } });
        fireEvent.change(approche, { target: { value: 'ka_fire' } });
        fireEvent.change(sort, { target: { value: 'magic_spells_0_degree' } });
        expect(screen.getAllByText(/\(5 \+ 2\) × 10 = 70 %/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByLabelText(/Sacrifice : 5 PS/));
        des(9, 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.getAllByText(/réussi d’office \(Sacrifice, 5 PS\)/).length).toBeGreaterThan(0);
        expect(ecrire).toHaveBeenCalledWith({ resources_sapience: 1 });
    });
});

describe('N4 · le pacte de Kabbale', () => {
    it('une invocation réussie propose de nouer le pacte, en opposition contre son degré', () => {
        const { vecu, approche } = ouvrir();
        fireEvent.change(vecu, { target: { value: 'occult_kabbalah_hod' } });
        fireEvent.change(approche, { target: { value: 'ka_water' } });
        des(3, 4);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.getByLabelText('Invocation du pacte')).toBeTruthy();
        // Le kabbaliste (70 %) tire 42, la créature (20 %) tire 73 : pacte noué.
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.415).mockReturnValueOnce(0.725);
        fireEvent.click(screen.getByText('Nouer le pacte'));
        expect(screen.getByText(/Les lutins au dos de nacre \(degré 2\) : 70 % contre 20 % — Pacte noué/)).toBeTruthy();
    });
});

describe('les cartes de la fiche', () => {
    it('N2 · encaisser 2 degrés physiques propose la case de 2, et la coche avec le compte', () => {
        const { ecrire } = ouvrir();
        fireEvent.change(screen.getByLabelText('Dommages physique reçus'), { target: { value: '2' } });
        fireEvent.click(screen.getByText('Proposer'));
        fireEvent.click(screen.getByText('Cocher la case de 2'));
        expect(ecrire).toHaveBeenCalledWith({ health_physical_case_2: true, health_physical: 1 });
    });
    it('N3 · mettre en jeu un Khaïba de 3 donne 3 PS de Chute, une fois par séance', () => {
        const { ecrire } = ouvrir();
        fireEvent.click(screen.getByText('Mettre en jeu (+3 PS)'));
        expect(ecrire).toHaveBeenCalledWith({ falls_khaiba_misenjeu: 1, resources_sapience_chute: 3 });
    });
    it('N5 · quitter la stase la remplit jusqu’au Ka dominant', () => {
        const { ecrire } = ouvrir();
        fireEvent.click(screen.getByText('Quitter la stase : pleine'));
        expect(ecrire).toHaveBeenCalledWith({ stasis_degree: 5 });
    });
});
