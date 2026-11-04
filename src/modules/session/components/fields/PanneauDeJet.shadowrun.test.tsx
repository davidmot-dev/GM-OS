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
 * **Le test de Shadowrun : Anarchy 2.0 au panneau** (2026-10-31) : le jet du pilote 2.0.0, sur
 * les exemples du livre de base (pages imprimées). Le pilote forgé faisait échouer tous les tests.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 16, sansPlafond: true, faces: 6, composantes: [
        { id: 'competence', label: 'Compétence', sectionId: 'competences', motif: '^competence_\\d+$', facultative: true },
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
    ] },
    difficulte: { min: 0, max: 12, defaut: 3 },
    shadowrun: {
        anarchy: 'anarchy', essence: 'essence',
        blessures: { legeres: 'blessures_legeres', graves: 'blessures_graves', incapacitantes: 'blessures_incapacitantes' },
        rrDesCompetences: { competence_1: 'competence_1_rr' },
    },
};
const DICE = { defaultDice: '6d6', logic: 'count-success', engine: 'pool', successThreshold: 5 } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-sr', name: 'Shadowrun', emoji: '🕶️',
    sections: [
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'competence_1_nom', label: 'Compétence 1 — libellé', type: 'text', defaultValue: '' },
            { id: 'competence_1', label: 'Compétence 1', type: 'number', defaultValue: 0, libelleSur: 'competence_1_nom' },
            { id: 'competence_1_rr', label: 'Compétence 1 — réduction du risque', type: 'number', defaultValue: 0 },
        ] },
        { id: 'attributs', label: 'Attributs', fields: [{ id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 1 }] },
        { id: 'jauges', label: 'Jauges', fields: [
            { id: 'anarchy', label: "Points d'Anarchy", type: 'number', defaultValue: 4 },
            { id: 'essence', label: 'Essence', type: 'number', defaultValue: 6 },
            { id: 'blessures_legeres', label: 'Blessures légères', type: 'number', defaultValue: 0 },
            { id: 'blessures_graves', label: 'Blessures graves', type: 'number', defaultValue: 0 },
            { id: 'blessures_incapacitantes', label: 'Blessure incapacitante', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
// Iron et son Ares Predator VI : Armes à distance (pistolets) 7, Agilité 4, RR 1 (p. 72).
const IRON = { competence_1_nom: 'Armes à distance (pistolets)', competence_1: 7, competence_1_rr: 1, agilite: 4, anarchy: 3, essence: 3.5,
    blessures_legeres: 0, blessures_graves: 0, blessures_incapacitantes: 0 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 2);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = IRON, ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'competence_1' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'agilite' } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const consigne = () => consigner.mock.calls.at(-1)![0] as { titre: string; tagSuccess: boolean; totalDisplay: string };

describe('le test de Shadowrun au panneau', () => {
    it('la compétence se propose sous son libellé ; la RR de la ligne et le risque normal viennent d’eux-mêmes', () => {
        const { panneau } = monter();
        const options = [...screen.getAllByRole('combobox')[0].querySelectorAll('option')].map(o => o.textContent);
        expect(options).toContain('Armes à distance (pistolets) (7)');
        expect(options.some(o => /réduction du risque/.test(o ?? ''))).toBe(false);
        expect(panneau.querySelector('[data-composition-shadowrun]')!.textContent).toContain('11 dés, dont 5 de risque (action normale : 5)');
    });

    it('la rafale d’Iron : 11 dés dont 7 de risque, 6 succès, un 1 annulé par la RR 1 — réussite, complication mineure (p. 72)', () => {
        monter();
        fireEvent.click(screen.getByText('Risquée (7)'));
        faces(5, 6, 2, 3, /* risque */ 5, 6, 1, 1, 2, 3, 4);
        lancer();
        expect(de).toHaveBeenCalledTimes(11);
        const c = consigne();
        expect(c.titre).toContain('Armes à distance (pistolets) + Agilité (11 dés, 7 de risque, RR 1)');
        expect(c.tagSuccess).toBe(true);
        expect(c.totalDisplay).toBe('Réussite — complication mineure — 6 succès, 3 nets, 2 uns de risque, RR 1 (seuil 3)');
    });

    it('un désastre échoue et rapporte deux points d’Anarchy ; la relance en coûte un et garde le désastre (p. 70, 77)', () => {
        const { ecrire } = monter({ ...IRON, competence_1_rr: 0 });
        fireEvent.click(screen.getByText('Suicidaire (6)'));
        faces(6, 6, 6, 6, 6, /* risque */ 1, 1, 1, 6, 6, 6);
        lancer();
        expect(consigne().tagSuccess).toBe(false);
        expect(ecrire).toHaveBeenCalledWith({ anarchy: 5 });
        faces(6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6);
        fireEvent.click(screen.getByText("Relancer — 1 point d'Anarchy"));
        expect(ecrire).toHaveBeenLastCalledWith({ anarchy: 4 });
        expect(consigne().titre).toMatch(/· relance$/);
        expect(consigne().totalDisplay).toMatch(/^Échec — désastre/);
    });

    it('une blessure grave impose le désavantage : seuls les 6 réussissent ; l’avantage payé l’annule (p. 65, 68, 77)', () => {
        const { panneau, ecrire } = monter({ ...IRON, blessures_graves: 1 });
        const composition = () => panneau.querySelector('[data-composition-shadowrun]')!.textContent;
        expect(composition()).toContain('succès sur 6 seulement (blessure grave)');
        fireEvent.click(screen.getByLabelText(/1 point d'Anarchy : avantage/));
        expect(composition()).toContain("succès sur 5 ou 6 (point d'Anarchy, blessure grave)");
        lancer();
        expect(ecrire).toHaveBeenCalledWith({ anarchy: 2 });
    });

    it('la spécialisation ajoute deux dés ; le test de magie perd un succès à Essence 3,5 (p. 52, 60)', () => {
        const { panneau } = monter();
        fireEvent.click(screen.getByLabelText(/Spécialisation/));
        fireEvent.click(screen.getByLabelText(/Test de magie/));
        expect(panneau.querySelector('[data-composition-shadowrun]')!.textContent).toContain('Réserve 11 +2 de spécialisation = 13 dés');
        expect(screen.getByText(/Essence : 1 succès annulé sur ce test de magie/)).toBeTruthy();
    });

    it('SR-A2 : une complication critique fait passer Anarchy de 99 à 100 sans plafond', () => {
        const { ecrire } = monter({ ...IRON, anarchy: 99, competence_1_rr: 0 });
        faces(2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1);
        lancer();
        expect(ecrire).toHaveBeenCalledWith({ anarchy: 100 });
    });

    it('SR-A1 : drain confirmé une fois, relance comprise ; les choix suivants ne changent pas son origine', () => {
        const suivi = { mecanique: 'shadowrun' as const, suivi: true, legeres: 'blessures_legeres', graves: 'blessures_graves',
            incapacitantes: 'blessures_incapacitantes', sante: 'moniteur' };
        const ecrire = vi.fn();
        render(<PanneauDeJet descripteur={{ ...JET, shadowrun: { ...JET.shadowrun, suivi } }} dice={DICE} template={FICHE}
            valeurs={{ ...IRON, competence_1_rr: 0 }} ecrireSurLaFiche={ecrire} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'competence_1' } });
        fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'agilite' } });
        fireEvent.click(screen.getByLabelText('Test de magie'));
        fireEvent.click(screen.getByLabelText(/Action soumise au drain/));
        faces(2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1);
        lancer();
        fireEvent.click(screen.getByText("Relancer — 1 point d'Anarchy"));
        const confirmation = screen.getByText('Confirmer les conséquences drain / Matrice');
        fireEvent.click(confirmation);
        expect(ecrire.mock.calls.at(-1)![0]).toMatchObject({ blessures_legeres: 1, __shadowrun: { blessures: [{ origine: 'drain' }] } });
        const compte = ecrire.mock.calls.length;
        fireEvent.click(screen.getByText('Conséquences appliquées'));
        expect(ecrire.mock.calls).toHaveLength(compte);
    });
});
