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
 * **Le test d'Argyropée au panneau** (2026-11-08) : le jet du pilote 2.0.0, sur les
 * exemples du livre 2 (pages imprimées). Le pilote forgé échouait à chaque test.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
    reserve: { base: 1, max: 1, faces: 10 },
    argyropee: {
        panache: 'panache',
        metiers: [{ nom: 'metier1_nom', bonus: 'metier1_bonus' }, { nom: 'metier2_nom', bonus: 'metier2_bonus' }],
    },
};
const DICE = { defaultDice: '1d10', logic: 'sum', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-argy', name: 'Argyropée', emoji: '🏰',
    sections: [
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'serrurerie', label: 'Serrurerie', type: 'number', defaultValue: 0 },
            { id: 'commerce', label: 'Commerce', type: 'number', defaultValue: 0 },
        ] },
        { id: 'metiers', label: 'Métiers', fields: [
            { id: 'metier1_nom', label: 'Métier 1', type: 'text', defaultValue: '' },
            { id: 'metier1_bonus', label: 'Bonus du métier 1', type: 'number', defaultValue: 0 },
            { id: 'metier2_nom', label: 'Métier 2', type: 'text', defaultValue: '' },
            { id: 'metier2_bonus', label: 'Bonus du métier 2', type: 'number', defaultValue: 0 },
        ] },
        { id: 'jauges', label: 'Jauges', fields: [{ id: 'panache', label: 'Panache', type: 'number', defaultValue: 15 }] },
    ],
} as unknown as SheetTemplate;
const VALEURS = { serrurerie: 3, commerce: 3, metier1_nom: 'Malandrin', metier1_bonus: 2, metier2_nom: '', metier2_bonus: 0, panache: 12 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (competence = 'serrurerie', ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} ecrireSurLaFiche={ecrire} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: competence } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('le test d’Argyropée au panneau', () => {
    it('Vanille crochète la lucarne : dé 7 + Serrurerie 3 + Malandrin 2 = 12, réussite (p. 45)', () => {
        const { panneau } = monter();
        fireEvent.change(screen.getByLabelText('Métier'), { target: { value: '0' } });
        expect(panneau.querySelector('[data-composition-argyropee]')!.textContent).toContain('1d10 (0 à 9) + 5');
        faces(7);
        lancer();
        expect(screen.getAllByText(/Réussite — dé 7 \+ compétence 3 \+ métier 2 = 12/).length).toBeGreaterThan(0);
        const entree = consigner.mock.calls[0][0] as { titre: string; tagSuccess: boolean };
        expect(entree.tagSuccess).toBe(true);
        expect(entree.titre).toContain('Serrurerie 3 · Malandrin +2');
    });

    it('le métier ne s’ajoute pas tant qu’il n’est pas choisi, et seul celui qui a un nom ou un bonus est proposé', () => {
        monter();
        expect(screen.getByRole('option', { name: 'Malandrin (+2)' })).toBeTruthy();
        expect(screen.queryByRole('option', { name: /Métier 2/ })).toBeNull();
        faces(4);
        lancer();
        expect(screen.getAllByText(/Échec — dé 4 \+ compétence 3 = 7/).length).toBeGreaterThan(0);
        expect((consigner.mock.calls[0][0] as { tagSuccess: boolean }).tagSuccess).toBe(false);
    });

    it('le 10 du moteur est le zéro du dé : sous un malus, échec critique (décision du 08/11)', () => {
        monter();
        fireEvent.change(screen.getByLabelText('Modificateur'), { target: { value: '-4' } });
        faces(10);
        lancer();
        expect(screen.getAllByText(/Échec critique — dé 0 \+ compétence 3 − 4 = -1/).length).toBeGreaterThan(0);
    });

    it('le Panache de Vanille : Commerce 3, dé 1, 4 points pour une réussite partielle, écrits sur la fiche (p. 85)', () => {
        const { ecrire } = monter('commerce');
        faces(1);
        lancer();
        expect(screen.getAllByText(/Échec — dé 1 \+ compétence 3 = 4/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Réussite partielle (4)'));
        expect(ecrire).toHaveBeenCalledWith({ panache: 8 });
        expect(screen.getAllByText(/Réussite partielle — dé 1 \+ 4 Panache \+ compétence 3 = 8/).length).toBeGreaterThan(0);
        const dernier = consigner.mock.calls.at(-1)![0] as { titre: string };
        expect(dernier.titre).toContain('(4 Panache)');
    });

    it('l’action complexe : Serrurerie 3 et Commerce 3 font une moyenne de 3 ; un échec se relit avec la meilleure (p. 46)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText(/Commerce 3/));
        expect(panneau.querySelector('[data-action-complexe]')!.textContent).toContain('moyenne 3');
        faces(5);
        lancer();
        // 5 + 3 = 8 : un succès, même partiel, accomplit l'action.
        expect(screen.getAllByText(/Action complexe réussie — dé 5 \+ moyenne 3 \(3, 3\) = 8/).length).toBeGreaterThan(0);
        expect((consigner.mock.calls[0][0] as { titre: string }).titre).toContain('action complexe');
    });

    it('le test en opposition compte les succès des deux camps jusqu’à 5 (p. 46)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText('Test en opposition'));
        fireEvent.change(screen.getByLabelText('Score de l’adversaire'), { target: { value: '4' } });
        // Joueur : 9 + 3 = 12 (1 succès) ; adversaire : 10 → 0 + 4 = 4 (aucun).
        faces(9, 10);
        lancer();
        const suite = () => panneau.querySelector('[data-suite-opposition-argyropee]')!.textContent;
        expect(suite()).toContain('Opposition : 1 – 0');
        // Quatre manches de plus : joueur critique (2) au premier, puis réussites.
        faces(9, 10, 9, 10, 9, 10);
        lancer(); lancer(); lancer();
        expect(suite()).toContain('Opposition : 4 – 0');
        faces(9, 10);
        lancer();
        expect(suite()).toContain('Le personnage l’emporte');
        const dernier = consigner.mock.calls.at(-1)![0] as { titre: string; totalDisplay: string };
        expect(dernier.titre).toContain('opposition');
        expect(dernier.totalDisplay).toContain('succès 5 contre 0');
        fireEvent.click(screen.getByText('Nouvelle opposition'));
        expect(panneau.querySelector('[data-suite-opposition-argyropee]')).toBeNull();
    });

    it('le Panache dépensé en opposition relève le compte de la manche', () => {
        const { panneau } = monter('commerce');
        fireEvent.click(screen.getByLabelText('Test en opposition'));
        faces(1, 10); // joueur 1 + 3 = 4, échec ; adversaire 0.
        lancer();
        expect(panneau.querySelector('[data-suite-opposition-argyropee]')!.textContent).toContain('Opposition : 0 – 0');
        fireEvent.click(screen.getByText('Réussite partielle (4)'));
        expect(panneau.querySelector('[data-suite-opposition-argyropee]')!.textContent).toContain('Opposition : 1 – 0');
    });

    it('le Panache ne porte jamais le dé au-delà de 9 (p. 85)', () => {
        monter();
        faces(9);
        lancer();
        expect(screen.getByText(/Le dé est à 9/)).toBeTruthy();
        expect(screen.queryByText('+1')).toBeNull();
    });
});
