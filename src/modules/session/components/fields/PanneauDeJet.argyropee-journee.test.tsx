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
 * **La journée d'Argyropée au panneau** — 09/11/2026, à la demande de David (« l'Exubérance,
 * la Faveur divine, la Guigne, la magie et le dé de compétence des PNJ ») : le pilote 2.1.0,
 * livre 2, pages imprimées.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
    reserve: { base: 1, max: 1, faces: 10 },
    argyropee: {
        panache: 'panache', metiers: [], nom: 'nom', panacheBonus: 'panache_bonus', sante: 'points_de_sante',
        faveur: { competence: 'sciences_religieuses', prieres: 'faveur_divine' },
        magie: { sorts: ['sort1', 'sort2'], domaines: ['humeur1_domaine', 'humeur2_domaine'], combat: 'magie_du_combat', silenciada: 'silenciada' },
        guigne: { depense: 'guigne_depense', offert: 'guigne_offerte' },
    },
};
const DICE = { defaultDice: '1d10', logic: 'sum', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-argy', name: 'Argyropée', emoji: '🏰',
    sections: [
        { id: 'identite', label: 'Identité', fields: [{ id: 'nom', label: 'Nom', type: 'text', defaultValue: '' }] },
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'commerce', label: 'Commerce', type: 'number', defaultValue: 0 },
            { id: 'sciences_religieuses', label: 'Sciences religieuses', type: 'number', defaultValue: 0 },
        ] },
        { id: 'jauges', label: 'Jauges', fields: [
            { id: 'panache', label: 'Panache', type: 'number', defaultValue: 0 },
            { id: 'panache_bonus', label: 'Bonus', type: 'number', defaultValue: 0 },
            { id: 'points_de_sante', label: 'Santé', type: 'number', defaultValue: 0 },
            { id: 'faveur_divine', label: 'Prières', type: 'number', defaultValue: 0 },
            { id: 'magie_du_combat', label: 'Magie du combat', type: 'number', defaultValue: 0 },
            { id: 'silenciada', label: 'Silenciada', type: 'checkbox', defaultValue: false },
            { id: 'guigne_depense', label: 'Guigne', type: 'number', defaultValue: 0 },
            { id: 'guigne_offerte', label: 'Offrande', type: 'number', defaultValue: 0 },
        ] },
        { id: 'sorts', label: 'Sorts', fields: [
            { id: 'sort1', label: 'Sort 1', type: 'text', defaultValue: '' },
            { id: 'sort2', label: 'Sort 2', type: 'text', defaultValue: '' },
            { id: 'humeur1_domaine', label: 'Domaine 1', type: 'text', defaultValue: '' },
            { id: 'humeur2_domaine', label: 'Domaine 2', type: 'text', defaultValue: '' },
        ] },
    ],
} as unknown as SheetTemplate;
const VALEURS = {
    nom: 'Vanille', commerce: 3, sciences_religieuses: 2, panache: 12, panache_bonus: 1, points_de_sante: 6,
    faveur_divine: 0, magie_du_combat: 0, silenciada: false, guigne_depense: 0, guigne_offerte: 0,
    sort1: 'Ami des bêtes', sort2: '', humeur1_domaine: 'Faune', humeur2_domaine: 'Verre',
};

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = VALEURS) => {
    const ecrire = vi.fn();
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'commerce' } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const dernier = () => consigner.mock.calls.at(-1)![0] as { titre: string; totalDisplay: string };
/** La fusion de toutes les écritures sur la fiche. */
const ecrit = (ecrire: ReturnType<typeof vi.fn>) => Object.assign({}, ...ecrire.mock.calls.map(c => c[0]));

describe('la Faveur divine (p. 81)', () => {
    it('deux d10, le meilleur gardé ; la prière est comptée et la case se décoche', () => {
        const { panneau, ecrire } = monter();
        const faveur = panneau.querySelector('[data-faveur-argyropee]')!;
        expect(faveur.textContent).toContain('2 sur 2 aujourd’hui');
        fireEvent.click(faveur.querySelector('input')!);
        expect(panneau.querySelector('[data-composition-argyropee]')!.textContent).toContain('2d10, le meilleur');
        faces(3, 8);
        lancer();
        expect(screen.getAllByText(/dé 8 \(Faveur divine : 3 et 8\) \+ compétence 3 = 11/).length).toBeGreaterThan(0);
        expect(ecrire).toHaveBeenCalledWith({ faveur_divine: 1 });
        expect(dernier().titre).toContain('Faveur divine');
        expect((faveur.querySelector('input') as HTMLInputElement).checked).toBe(false);
    });

    it('ne se propose plus quand les prières du jour sont dites', () => {
        const { panneau } = monter({ ...VALEURS, faveur_divine: 2 });
        expect((panneau.querySelector('[data-faveur-argyropee] input') as HTMLInputElement).disabled).toBe(true);
    });
});

describe('le Panache de la journée (p. 84-85, 177)', () => {
    it('le réveil : 1d10 (0 à 9) + 10 + bonus + l’offrande de la Guigne, et un nouveau jour', () => {
        const { ecrire } = monter({ ...VALEURS, guigne_offerte: 3, faveur_divine: 2, guigne_depense: 7, magie_du_combat: 4 });
        faces(6);
        fireEvent.click(screen.getByText('Réveil'));
        expect(ecrit(ecrire)).toMatchObject({ panache: 20, faveur_divine: 0, guigne_depense: 0, guigne_offerte: 0, magie_du_combat: 0 });
        expect(dernier().titre).toBe('Vanille · Réveil');
        expect(dernier().totalDisplay).toContain('1d10 = 6 + 10 + bonus 1 + Guigne 3 = 20');
    });

    it('un repas rend 3 points, une collation 1', () => {
        const { ecrire } = monter();
        fireEvent.click(screen.getByText('Repas +3'));
        expect(ecrire).toHaveBeenCalledWith({ panache: 15 });
        fireEvent.click(screen.getByText('Collation +1'));
        expect(ecrire).toHaveBeenLastCalledWith({ panache: 16 });
    });

    it('le Panache qui rehausse un test entre au repère de la Guigne', () => {
        const { ecrire } = monter();
        faces(1);
        lancer();
        fireEvent.click(screen.getByText('Réussite partielle (4)'));
        expect(ecrire).toHaveBeenCalledWith({ panache: 8, guigne_depense: 4 });
    });
});

describe('l’Exubérance (p. 85-86)', () => {
    it('sacrifie tout le Panache, après confirmation', () => {
        const { ecrire } = monter();
        fireEvent.click(screen.getByText('Exubérance'));
        expect(ecrire).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Sacrifier 12 points'));
        expect(ecrire).toHaveBeenCalledWith({ panache: 0 });
        expect(dernier().titre).toBe('Vanille · Exubérance');
    });

    it('impossible sous 3 points ou inconscient', () => {
        monter({ ...VALEURS, panache: 2 });
        expect((screen.getByText('Exubérance') as HTMLButtonElement).disabled).toBe(true);
        cleanup();
        monter({ ...VALEURS, points_de_sante: -1 });
        expect((screen.getByText('Exubérance') as HTMLButtonElement).disabled).toBe(true);
    });
});

describe('la magie et la silenciada (p. 127, 135-136)', () => {
    it('un sort sans lueur coûte 2 points et entre au Panache magique du combat', () => {
        const { panneau, ecrire } = monter();
        const magie = panneau.querySelector('[data-magie-argyropee]')!;
        expect(magie.querySelectorAll('option')).toHaveLength(1);
        fireEvent.click(screen.getByLabelText('Sans lueur'));
        fireEvent.click(screen.getByText('Exprimer (2 Panache)'));
        expect(ecrire).toHaveBeenCalledWith({ panache: 10, magie_du_combat: 2 });
        expect(dernier().titre).toBe('Vanille · Sort : Ami des bêtes');
    });

    it('une double humeur lance discret pour 1 point (p. 136)', () => {
        monter({ ...VALEURS, humeur2_domaine: 'faune' });
        fireEvent.click(screen.getByLabelText('Sans lueur'));
        expect(screen.getByText('Exprimer (1 Panache)')).toBeTruthy();
    });

    it('au sort qui atteint 7 points dans le combat, les 20 % se tirent une fois (décision du 09/11)', () => {
        const { ecrire } = monter({ ...VALEURS, magie_du_combat: 6 });
        faces(14);
        fireEvent.click(screen.getByText('Exprimer (1 Panache)'));
        expect(ecrire).toHaveBeenCalledWith({ panache: 11, magie_du_combat: 7, silenciada: true });
        expect(dernier().totalDisplay).toContain('d100 = 14');
        cleanup();
        const second = monter({ ...VALEURS, magie_du_combat: 6 });
        faces(55);
        fireEvent.click(screen.getByText('Exprimer (1 Panache)'));
        expect(second.ecrire).toHaveBeenCalledWith({ panache: 11, magie_du_combat: 7 });
        expect(dernier().totalDisplay).toContain('pas de silenciada');
    });

    it('« Fin du combat » remet le compte à zéro', () => {
        const { ecrire } = monter({ ...VALEURS, magie_du_combat: 3 });
        fireEvent.click(screen.getByText('Fin du combat'));
        expect(ecrire).toHaveBeenCalledWith({ magie_du_combat: 0 });
    });
});

describe('l’adversaire PNJ d’une opposition (p. 185)', () => {
    it('tire le d6 de sa compétence à chaque manche, divisé par deux si elle n’est pas privilégiée', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText('Test en opposition'));
        fireEvent.click(screen.getByLabelText('Adversaire PNJ'));
        fireEvent.change(screen.getByLabelText('Score de l’adversaire'), { target: { value: '1' } });
        fireEvent.click(screen.getByLabelText('Compétence privilégiée du PNJ'));
        // Joueur : 7 + 3 = 10 ; PNJ : d10 = 5, d6 = 5 → 2, + carrière 1 = 8.
        faces(7, 5, 5);
        lancer();
        expect(panneau.querySelector('[data-suite-opposition-argyropee]')!.textContent).toContain('Opposition : 1 – 1');
        expect(dernier().totalDisplay).toContain('1d6 = 5, divisé par 2');
        expect(dernier().titre).toContain('opposition contre un PNJ (1d6 ÷ 2 + 1)');
    });
});
