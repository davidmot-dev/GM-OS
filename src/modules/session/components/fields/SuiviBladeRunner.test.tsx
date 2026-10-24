import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_BLADE_RUNNER, lireLaBlessure, lireLeSuivi, type RegleBladeRunner } from '../../../dice/systemes/bladeRunner';
import type { RegleDuForcage } from '../../../dice/systemes/yearZero';
import SuiviBladeRunner from './SuiviBladeRunner';

/**
 * Le suivi des blessures de Blade Runner, sur la fiche ou la carte de combat
 * (B3–B7, 2026-10-24) : les gestes écrivent la fiche, le joueur ne fait que lire.
 */
const REGLE: RegleBladeRunner = {
    endurance: ['vigueur', 'endurance'], assistanceMedicale: ['intelligence', 'assistanceMedicale'], manipulation: ['empathie', 'manipulation'],
    sante: 'sante', santeMax: 'santeMax', sangFroid: 'sangFroid', sangFroidMax: 'sangFroidMax', blessures: 'blessuresCritiques',
    souvenirCle: 'souvenirCle', objetFetiche: 'objetFetiche',
};
const FORCER: RegleDuForcage = {
    garde: 'reussites-et-uns', foisSi: [{ si: { champ: 'nature', contient: ['réplicant'] }, fois: 2 }],
    prixDesUns: { champ: 'sante', label: 'Santé', si: [{ si: { champ: 'nature', contient: ['réplicant'] }, champ: 'sangFroid', label: 'Sang-froid' }] },
};
const PLAIE = lireLaBlessure({ title: 'Plaie au ventre', effect: 'Mortel : Oui (Limite : Quart). Durée de guérison : Une semaine. Les jets de MOBILITÉ rouvrent la plaie.' }, 'b1', { table: 'Perforant', de: 5 });
const fiche = (extra: Record<string, unknown> = {}) => ({
    nature: 'Humain', vigueur: 'B', endurance: 'C', intelligence: 'C', assistanceMedicale: 'B', empathie: 'C', manipulation: 'D',
    sante: 3, santeMax: 6, sangFroid: 4, sangFroidMax: 5, objetFetiche: 'Une photo',
    [CLE_BLADE_RUNNER]: { blessures: [PLAIE] }, ...extra,
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('le suivi des blessures critiques', () => {
    it('une sauvegarde réussie garde la blessure menaçante et compte la survie', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(7);
        let f: Record<string, unknown> = fiche();
        render(<SuiviBladeRunner regle={REGLE} forcer={FORCER} valeurs={f} nom="Jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        fireEvent.click(screen.getByText('Sauvegarde contre la mort (Endurance)'));
        expect(lireLeSuivi(f).blessures[0]).toMatchObject({ etat: 'menace', survies: 1 });
        expect(f.blessuresCritiques).toContain('Plaie au ventre (Perforant) — mortelle');
    });

    it('ratée et forcée (pas Brisé) : chaque 1 coûte la Santé ; ratée encore, il succombe', () => {
        const des = [3, 2, 1, 4];
        vi.spyOn(DiceEngine, 'roll').mockImplementation(() => des.shift() ?? 2);
        let f: Record<string, unknown> = fiche();
        const vue = render(<SuiviBladeRunner regle={REGLE} forcer={FORCER} valeurs={f} nom="Jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        fireEvent.click(screen.getByText('Sauvegarde contre la mort (Endurance)'));
        vue.rerender(<SuiviBladeRunner regle={REGLE} forcer={FORCER} valeurs={f} nom="Jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        fireEvent.click(screen.getByText('Forcer la sauvegarde'));
        expect(f.sante).toBe(2);
        expect(lireLeSuivi(f).blessures[0].etat).toBe('fatale');
    });

    it('Brisé, la sauvegarde ratée ne se force pas', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(2);
        let f: Record<string, unknown> = fiche({ sante: 0 });
        render(<SuiviBladeRunner regle={REGLE} forcer={FORCER} valeurs={f} nom="Jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        fireEvent.click(screen.getByText('Sauvegarde contre la mort (Endurance)'));
        expect(screen.queryByText('Forcer la sauvegarde')).toBeNull();
        expect(lireLeSuivi(f).blessures[0].etat).toBe('fatale');
    });

    it('une stabilisation reportée « Réussi » met une blessure d’un Quart hors de danger', () => {
        let f: Record<string, unknown> = fiche();
        render(<SuiviBladeRunner regle={REGLE} valeurs={f} nom="Jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        fireEvent.click(screen.getAllByText('Réussi')[0]);
        expect(lireLeSuivi(f).blessures[0].etat).toBe('a-soigner');
    });

    it('premiers secours sur un Brisé : autant de Santé que de réussites', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(7);
        let f: Record<string, unknown> = fiche({ sante: 0, [CLE_BLADE_RUNNER]: { blessures: [] } });
        render(<SuiviBladeRunner regle={REGLE} valeurs={f} nom="Jane" personnageId="jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        // Personne d'autre dans le groupe : un PNJ C/C lance deux D8, chacun à 7 — deux réussites.
        fireEvent.click(screen.getAllByText('Lancer')[0]);
        expect(f.sante).toBe(2);
    });

    it('l’objet fétiche rend un point de Sang-froid, une fois par séance', () => {
        let f: Record<string, unknown> = fiche({ [CLE_BLADE_RUNNER]: { blessures: [] } });
        const vue = render(<SuiviBladeRunner regle={REGLE} valeurs={f} nom="Jane" ecrire={maj => { f = { ...f, ...maj }; }} />);
        fireEvent.click(screen.getByText('Objet fétiche (Une photo) : +1 Sang-froid'));
        expect(f.sangFroid).toBe(5);
        vue.rerender(<SuiviBladeRunner regle={REGLE} valeurs={{ ...f, sangFroid: 4 }} nom="Jane" ecrire={vi.fn()} />);
        expect(screen.queryByText(/Objet fétiche/)).toBeNull();
    });

    it('la tablette lit les blessures, sans un seul bouton', () => {
        render(<SuiviBladeRunner regle={REGLE} valeurs={fiche()} nom="" ecrire={vi.fn()} joueur />);
        expect(screen.getByText('Plaie au ventre')).toBeTruthy();
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
});
