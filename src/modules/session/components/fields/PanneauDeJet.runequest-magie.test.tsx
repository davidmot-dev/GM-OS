import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: vi.fn() }));

import PanneauDeJet from './PanneauDeJet';
import { AttributsCalculesRuneQuest, MagieEtProgressionRuneQuest } from './CartesRuneQuest';
import { CLE_ETAT_RUNEQUEST, lireLEtat } from '../../../dice/systemes/progressionDeRuneQuest';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';
import type { RegleDeRuneQuest } from '../../../dice/systemes/runequest';

/**
 * **RQ-A5 et RQ-A6** (03/11/2026) : les attributs calculés, le sort payé selon le jet,
 * l'inspiration qui tient la situation, la coche d'expérience et la fin de saison.
 */
const RQ: RegleDeRuneQuest = {
    caracteristiques: ['for', 'con', 'tai', 'dex', 'int', 'pou', 'cha'],
    derives: {
        caracteristiques: { for: 'for', con: 'con', tai: 'tai', dex: 'dex', int: 'int', pou: 'pou', cha: 'cha' },
        pvMax: 'pv_max', pv: 'points_de_vie', pmMax: 'pm_max', pm: 'points_de_magie', encMax: 'enc_max',
        modificateurs: { communication: 'mod_communication', manipulation: 'mod_manipulation' },
    },
    magie: {
        pm: 'points_de_magie', pmMax: 'pm_max', pou: 'pou',
        cultes: [{ nom: 'culte', rang: 'culte_rang', pr: 'points_de_rune', prMax: 'pr_max', veneration: 'veneration' }],
    },
    progression: {
        runes: ['rune_air'], opposees: [], passions: ['passion1'],
        categories: { competences: 'mod_manipulation' },
    },
};
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'aptitude', label: 'Aptitude', sectionId: 'competences', sectionsSupplementaires: ['runes', 'passions'] }],
    reserve: { base: 1, max: 1, faces: 100 },
    runequest: RQ,
};
const DICE = { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-rq', name: 'RuneQuest', emoji: '🏺',
    sections: [
        { id: 'competences', label: 'Compétences', fields: [{ id: 'epee_large', label: 'Épée large', type: 'number' }, { id: 'esquive', label: 'Esquive', type: 'number' }] },
        { id: 'runes', label: 'Runes', fields: [{ id: 'rune_air', label: 'Air', type: 'number' }] },
        { id: 'passions', label: 'Passions', fields: [
            { id: 'passion1_nom', label: 'Passion 1 — nature', type: 'text' },
            { id: 'passion1', label: 'Passion 1', type: 'number', libelleSur: 'passion1_nom' },
        ] },
    ],
} as unknown as SheetTemplate;
const VASANA = {
    for: 16, con: 12, tai: 10, dex: 11, int: 15, pou: 15, cha: 19, pv_max: 12, points_de_vie: 12, pm_max: 10, points_de_magie: 6, enc_max: 14,
    mod_communication: 0, mod_manipulation: 5, culte: 'Orlanth', culte_rang: 'initié', points_de_rune: 3, pr_max: 4, veneration: 60,
    epee_large: 65, esquive: 35, rune_air: 75, passion1: 70, passion1_nom: 'Haine', passion1_sujet: 'Empire lunar',
};

let hasard: ReturnType<typeof vi.spyOn>;
const file: number[] = [];
const d100 = (n: number) => { const v = n % 100; file.push(Math.floor(v / 10) / 10 + 0.001, (v % 10) / 10 + 0.001); };
beforeEach(() => { file.length = 0; hasard = vi.spyOn(Math, 'random').mockImplementation(() => file.shift() ?? 0.5); });
afterEach(() => { cleanup(); hasard.mockRestore(); });

const lancer = (aptitude: string, d: number, valeurs: Record<string, unknown>, ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: aptitude } });
    file.length = 0; d100(d);
    fireEvent.click(screen.getByText('Lancer', { exact: true }));
    return { panneau, ecrire };
};

describe('le sort payé selon le jet (RQ-A6)', () => {
    it('une affinité runique ouvre la magie runique, et la réussite paie les PR du culte', () => {
        const { panneau, ecrire } = lancer('rune_air', 30, VASANA);
        expect(panneau.querySelector('[data-magie-runequest]')).not.toBeNull();
        fireEvent.change(screen.getByLabelText('Coût du sort'), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'Vent tempétueux' } });
        expect(panneau.querySelector('[data-cout-runequest]')!.textContent).toMatch(/2 points de Rune dépensés/);
        fireEvent.click(screen.getByText('Payer le sort'));
        expect(ecrire).toHaveBeenCalledWith({ points_de_rune: 1 });
        expect(panneau.querySelector('[data-paiement-runequest]')!.textContent).toMatch(/Vent tempétueux : payé 2 PR \(Orlanth, reste 1\)/);
        fireEvent.click(screen.getByText('Annuler le paiement'));
        expect(ecrire).toHaveBeenLastCalledWith({ points_de_rune: 3 });
    });

    it('une réussite critique en magie runique ne coûte rien (p. 314)', () => {
        const { panneau } = lancer('rune_air', 2, VASANA);
        expect(panneau.querySelector('[data-cout-runequest]')!.textContent).toMatch(/aucun point de Rune/);
        expect(screen.queryByText('Payer le sort')).toBeNull();
    });

    it('une compétence ordinaire ne propose le sort que sur demande', () => {
        const { panneau } = lancer('epee_large', 30, VASANA);
        expect(panneau.querySelector('[data-magie-runequest]')).toBeNull();
        fireEvent.click(screen.getByText('Ce jet lance un sort…'));
        expect(panneau.querySelector('[data-magie-runequest]')).not.toBeNull();
    });
});

describe('l’inspiration et l’expérience au jet (RQ-A6)', () => {
    it('une Passion réussie inspire l’aptitude choisie, et le jet suivant l’ajoute', () => {
        const { panneau, ecrire } = lancer('passion1', 12, VASANA);
        fireEvent.change(screen.getByLabelText('Aptitude inspirée'), { target: { value: 'epee_large' } });
        fireEvent.click(screen.getByText('Inspirer'));
        const etat = lireLEtat(ecrire.mock.calls[0][0]);
        expect(etat.inspiration).toMatchObject({ aptitude: 'epee_large', bonus: 30, sourceLibelle: 'Haine (Empire lunar)' });
        expect(etat.coches).toEqual(['passion1']);
        expect(panneau.querySelector('[data-inspiration-faite]')!.textContent).toMatch(/\+30 % à Épée large/);
        // Le jet suivant, sur l'épée, lit l'inspiration écrite.
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'epee_large' } });
        expect(panneau.querySelector('[data-composition-runequest]')!.textContent).toMatch(/Épée large 65 % \+ 30 inspiration \(Haine \(Empire lunar\)\) = 95 %/);
    });

    it('une Passion ratée propose le découragement, appliqué sur un geste', () => {
        const { ecrire } = lancer('passion1', 80, VASANA);
        expect(screen.getByText(/Découragé : −10 % à tous les tests suivants/)).toBeTruthy();
        fireEvent.click(screen.getByText('Appliquer'));
        expect(lireLEtat(ecrire.mock.calls[0][0]).malusDeSituation).toMatchObject({ valeur: -10 });
    });

    it('refuse une seconde inspiration dans la même situation', () => {
        const etat = { version: 1, situationTentee: true, malusDesRunes: {}, runesInspirees: [], coches: [] };
        lancer('rune_air', 12, { ...VASANA, [CLE_ETAT_RUNEQUEST]: etat });
        expect(screen.getByText(/Une seule tentative d’inspiration par situation/)).toBeTruthy();
        expect(screen.queryByText('Inspirer')).toBeNull();
    });

    it('coche l’expérience d’une compétence réussie', () => {
        const { ecrire } = lancer('esquive', 20, VASANA);
        fireEvent.click(screen.getByText('Cocher l’expérience — Esquive'));
        expect(lireLEtat(ecrire.mock.calls[0][0]).coches).toEqual(['esquive']);
    });
});

describe('les cartes de la fiche (RQ-A5, RQ-A6)', () => {
    it('propose les attributs de Vasana et n’applique que ce qui diffère', () => {
        const appliquer = vi.fn();
        const { container } = render(<AttributsCalculesRuneQuest regle={RQ.derives!} valeurs={VASANA} appliquer={appliquer} consigner={vi.fn()} />);
        expect(container.querySelector('[data-derive="pv-max"]')!.textContent).toMatch(/identique/);
        expect(container.querySelector('[data-derive="categorie-communication"]')!.textContent).toMatch(/ne sont pas modifiées/);
        fireEvent.click(screen.getByText('Appliquer tout (2)'));
        expect(appliquer).toHaveBeenCalledWith({ pm_max: 15, points_de_magie: 11, mod_communication: 10 });
    });

    it('rend 4 PM après six heures de repos, et l’annule', () => {
        const appliquer = vi.fn();
        render(<MagieEtProgressionRuneQuest regle={RQ} sections={FICHE.sections} valeurs={{ ...VASANA, pm_max: 15 }} appliquer={appliquer} consigner={vi.fn()} />);
        fireEvent.click(screen.getByText(/Repos de 6 h/));
        expect(appliquer).toHaveBeenCalledWith({ points_de_magie: 10 });
        fireEvent.click(screen.getByText('Annuler'));
        expect(appliquer).toHaveBeenLastCalledWith({ points_de_magie: 6 });
    });

    it('lance les tests de fin de saison et n’écrit qu’après « Confirmer »', () => {
        const appliquer = vi.fn();
        const etat = { version: 1, malusDesRunes: {}, runesInspirees: [], coches: ['epee_large'] };
        render(<MagieEtProgressionRuneQuest regle={RQ} sections={FICHE.sections} valeurs={{ ...VASANA, [CLE_ETAT_RUNEQUEST]: etat }}
            appliquer={appliquer} consigner={vi.fn()} de={f => (f === 100 ? 71 : 4)} />);
        fireEvent.click(screen.getByText('Lancer les tests (1)'));
        expect(appliquer).not.toHaveBeenCalled();
        expect(screen.getByText('71 + 5 = 76')).toBeTruthy();
        fireEvent.click(screen.getByText('Confirmer'));
        const maj = appliquer.mock.calls[0][0];
        expect(maj.epee_large).toBe(69);
        expect(lireLEtat(maj).coches).toEqual([]);
    });
});
