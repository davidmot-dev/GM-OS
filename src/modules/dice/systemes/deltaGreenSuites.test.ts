import { describe, it, expect, vi } from 'vitest';
import { calculerPerteSAN, subirPerteSAN, lireSuiviDG, cocherExperienceDG, ameliorerCompetencesDG, opposerDeltaGreen, resoudreLetalite } from './deltaGreenSuites';
import type { RegleDeDeltaGreen } from './deltaGreen';

export const REGLE_DG: RegleDeDeltaGreen = { caracteristiques: ['FOR', 'CON', 'DEX', 'INT', 'POU', 'CHA'], sante: 'PV', san: 'SAN', pouvoir: 'POU', charisme: 'CHA', seuilRupture: 'SR', inconcevable: 'inconcevable', experience: { armes_a_feu: 'experience_armes_a_feu' } };
const fiche = { SAN: 55, SR: 48, POU: 12, CHA: 13, VOL: 12, PV: 10, attache1: 13, armes_a_feu: 50 };

describe('SAN : Manuel de l’Agent p. 66–74', () => {
    it('accepte la perte directe saisie par David : -5, moins typographique, montant et dé seuls', () => {
        const de = vi.fn(() => 3);
        for (const perte of ['-5', '−5', '5', '+5']) expect(calculerPerteSAN(perte, 'echec-normal', de)).toBe(5);
        expect(calculerPerteSAN('1D6', 'echec-normal', de)).toBe(3);
        expect(calculerPerteSAN('--5', 'echec-normal', de)).toBeNull();
        expect(de).toHaveBeenCalledTimes(1);
    });
    it('lit réussite / échec, minimum et maximum critiques, sans tirer les dés des extrêmes', () => {
        const de = vi.fn(() => 3);
        expect(calculerPerteSAN('1D4/1D10', 'reussite-normale', de)).toBe(3);
        expect(calculerPerteSAN('1D4/1D10', 'reussite-particuliere', de)).toBe(1);
        expect(calculerPerteSAN('1D4/1D10', 'echec-total', de)).toBe(10);
        expect(de).toHaveBeenCalledTimes(1);
        expect(calculerPerteSAN('0/process.exit()', 'reussite-normale', de)).toBeNull();
        expect(calculerPerteSAN('0/50D6', 'echec-normal', de)).toBeNull();
    });
    it('exemple de Daryl : 55 → 49, puis 48 : un trouble et nouveau SR 36', () => {
        const a = subirPerteSAN(REGLE_DG, fiche, 6, 'violence', 'a', () => 3)!;
        expect(a.maj).toMatchObject({ SAN: 49, progression_violence: 0 });
        expect(lireSuiviDG(a.maj).folieTemporaire).toBe(true);
        const b = subirPerteSAN(REGLE_DG, { ...fiche, ...a.maj }, 1, 'violence', 'b', () => 3)!;
        expect(b.maj).toMatchObject({ SAN: 48, SR: 36 });
        expect(lireSuiviDG(b.maj).troubles).toBe(1);
        expect(subirPerteSAN(REGLE_DG, { ...fiche, ...b.maj }, 1, 'violence', 'b', () => 3)).toBeNull();
    });
    it('une perte dépassant le seuil ne déclenche qu’un trouble, avec SAN finale moins POU', () => {
        const r = subirPerteSAN(REGLE_DG, fiche, 30, 'inconcevable', 'x', () => 3)!;
        expect(r.maj).toMatchObject({ SAN: 25, SR: 13 });
        expect(lireSuiviDG(r.maj).troubles).toBe(1);
    });
    it('trois pertes sans folie : même D6 pour le CHA et toutes les Attaches, une seule fois', () => {
        let f: Record<string, unknown> = { ...fiche, SR: 10, attache2: 2 };
        const de = vi.fn(() => 4);
        for (const id of ['a', 'b', 'c']) f = { ...f, ...subirPerteSAN(REGLE_DG, f, 1, 'violence', id, de)!.maj };
        expect(f).toMatchObject({ SAN: 52, CHA: 9, attache1: 9, attache2: 0, accoutumance_violence: true, progression_violence: 3 });
        expect(de).toHaveBeenCalledTimes(1);
        const d = subirPerteSAN(REGLE_DG, f, 1, 'violence', 'd', de)!;
        expect(d.maj.SAN).toBe(51); // Accoutumé : la branche réussite peut encore coûter de la SAN.
        expect(de).toHaveBeenCalledTimes(1);
    });
    it('la crise efface la seule catégorie concernée ; l’Inconcevable ne progresse pas', () => {
        const avant = { ...fiche, __deltaGreen: { violence: 2, impuissance: 1, troubles: 0, pertesTraitees: [] } };
        const r = subirPerteSAN(REGLE_DG, avant, 5, 'violence', 'a', () => 2)!;
        expect(lireSuiviDG(r.maj)).toMatchObject({ violence: 0, impuissance: 1 });
        const s = subirPerteSAN(REGLE_DG, avant, 1, 'inconcevable', 'a', () => 2)!;
        expect(lireSuiviDG(s.maj)).toMatchObject({ violence: 2, impuissance: 1 });
    });
    it('0 SAN : borne, folie permanente, pas de nouveau traitement sur l’Agent perdu', () => {
        const r = subirPerteSAN(REGLE_DG, { ...fiche, SAN: 3 }, 6, 'impuissance', 'x', () => 2)!;
        expect(r.maj.SAN).toBe(0);
        expect(lireSuiviDG(r.maj).foliePermanente).toBe(true);
        expect(subirPerteSAN(REGLE_DG, { ...fiche, ...r.maj }, 1, 'impuissance', 'y', () => 2)).toBeNull();
    });
    it('accoutumance à l’impuissance : réduit POU et borne la VOL', () => {
        const r = subirPerteSAN(REGLE_DG, { ...fiche, SR: 10, __deltaGreen: { impuissance: 2 } }, 1, 'impuissance', 'x', () => 4)!;
        expect(r.maj).toMatchObject({ POU: 8, VOL: 8, accoutumance_impuissance: true });
    });
});
describe('opposition p. 45', () => {
    it('la plus haute réussite gagne ; un critique la dépasse', () => {
        expect(opposerDeltaGreen({ de: 40, chances: 60 }, { de: 30, chances: 50 })).toContain('L’Agent');
        expect(opposerDeltaGreen({ de: 40, chances: 60 }, { de: 22, chances: 50 })).toContain('L’adversaire');
        expect(opposerDeltaGreen({ de: 11, chances: 60 }, { de: 22, chances: 50 })).toContain('L’adversaire');
    });
    it('exemple Daryl : 67/60 contre 49/40, le plus petit échec l’emporte si choisi', () => {
        expect(opposerDeltaGreen({ de: 67, chances: 60 }, { de: 49, chances: 40 })).toContain('personne');
        expect(opposerDeltaGreen({ de: 67, chances: 60 }, { de: 49, chances: 40 }, true)).toContain('L’adversaire');
        expect(opposerDeltaGreen({ de: 22, chances: 60 }, { de: 22, chances: 40 })).toContain('Égalité');
        expect(opposerDeltaGreen({ de: 55, chances: 50 }, { de: 67, chances: 40 }, true)).toBe('L’adversaire l’emporte — compte double en poursuite');
    });
});
describe('létalité p. 57', () => {
    it('15 % : 15 tue, 80 inflige 8 + 10, 00 inflige 20 sans critique', () => {
        expect(resoudreLetalite(15, 15)).toMatchObject({ tue: true });
        expect(resoudreLetalite(15, 80)).toMatchObject({ tue: false, degats: 18 });
        expect(resoudreLetalite(15, 100)).toMatchObject({ tue: false, degats: 20 });
    });
    it('critique à l’attaque : double les deux effets ; ne borne pas fictivement à 99 %', () => {
        expect(resoudreLetalite(15, 25, true)).toMatchObject({ tue: true, seuil: 30 });
        expect(resoudreLetalite(15, 80, true)).toMatchObject({ tue: false, degats: 36 });
        expect(resoudreLetalite(50, 100, true)).toMatchObject({ tue: true, seuil: 100 });
        expect(resoudreLetalite(15, NaN)).toBeNull();
    });
});
describe('amélioration p. 29', () => {
    it('un échec coche seulement une compétence acquise ; succès, SAN et Inconcevable exclus', () => {
        expect(cocherExperienceDG(REGLE_DG, fiche, 'armes_a_feu', 'echec-total')).toEqual({ experience_armes_a_feu: true });
        for (const champ of ['SAN', 'FOR', 'inconcevable']) expect(cocherExperienceDG(REGLE_DG, fiche, champ, 'echec-normal')).toEqual({});
        expect(cocherExperienceDG(REGLE_DG, { armes_a_feu: 0 }, 'armes_a_feu', 'echec-normal')).toEqual({});
        expect(cocherExperienceDG(REGLE_DG, fiche, 'armes_a_feu', 'reussite-normale')).toEqual({});
    });
    it('fin de partie : un D4 par case, plafond 99, cases effacées ; relecture sans gain', () => {
        const r = ameliorerCompetencesDG(REGLE_DG, { ...fiche, armes_a_feu: 98, experience_armes_a_feu: true }, () => 4);
        expect(r.maj).toEqual({ armes_a_feu: 99, experience_armes_a_feu: false });
        expect(ameliorerCompetencesDG(REGLE_DG, { ...fiche, ...r.maj }, () => 4).maj).toEqual({});
    });
});
