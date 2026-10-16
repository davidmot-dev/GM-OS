import { describe, it, expect } from 'vitest';
import {
    bonusDesActionsCombinees, casesPourLaLimite, coupSurLaHorde, malusDesCiblesMultiples, nouvelleHorde, prochainKO,
    estUnSbire, issueDesSbires, malusDesCases,
} from './sbiresEtHordes';
import type { CasesDeSante } from '../../../types/drivers';

/** Torg Eternity, livre p. 70, 117, 119, 122, 263, 264 (carnet « Torg », réponses citées). */
const BLESSURES: CasesDeSante = {
    libelle: 'Blessures', nombre: 4, champ: 'blessures',
    seuils: [
        { aPartirDe: 1, label: 'Blessé', etat: 'wounded' },
        { aPartirDe: 3, label: 'Grièvement blessé', etat: 'critical' },
        { aPartirDe: 4, label: 'Vaincu', etat: 'dead' },
    ],
};

describe('la limite de Blessures d’un adversaire', () => {
    it('un sbire (« — ») : une seule case, et c’est la défaite', () => {
        expect(casesPourLaLimite(BLESSURES, 0)).toMatchObject({ nombre: 1, seuils: [{ aPartirDe: 1, label: 'Vaincu', etat: 'dead' }] });
    });
    it('un aguerri (1) : Blessé, puis vaincu à la deuxième', () => {
        expect(casesPourLaLimite(BLESSURES, 1).seuils).toEqual([
            { aPartirDe: 1, label: 'Blessé', etat: 'wounded' }, { aPartirDe: 2, label: 'Vaincu', etat: 'dead' },
        ]);
    });
    it('chargé en possibilités (3) : les quatre cases du Chevalier des Tempêtes', () => {
        expect(casesPourLaLimite(BLESSURES, 3)).toEqual(BLESSURES);
    });
});

describe('la Table des Actions combinées', () => {
    it.each([[1, 0], [2, 1], [3, 2], [4, 3], [5, 3], [6, 4], [9, 4], [10, 5], [14, 5], [15, 6], [24, 6], [25, 7], [40, 8], [60, 9], [100, 10], [149, 10]])(
        '%i participants : +%i', (n, bonus) => expect(bonusDesActionsCombinees(n)).toBe(bonus),
    );
});

describe('les Cibles multiples', () => {
    it('−2 par cible supplémentaire : trois cibles, −4', () => {
        expect([1, 2, 3].map(malusDesCiblesMultiples)).toEqual([0, 2, 4]);
    });
});

describe('une horde', () => {
    it('le Choc commun : huit thralls d’Esprit 7, un KO tous les 8 points', () => {
        let h = nouvelleHorde(8, 7, 10);
        expect(prochainKO(h)).toBe(8);
        // 10 contre 10 : 2 Choc, quatre fois → 8 Choc, un KO.
        for (let i = 0; i < 4; i++) h = coupSurLaHorde(h, 10).horde;
        expect(h).toMatchObject({ choc: 8, debout: 7, koParLeChoc: 1 });
        expect(prochainKO(h)).toBe(16);
    });

    it('une Blessure élimine un membre, sans toucher au Choc commun', () => {
        const h = { ...nouvelleHorde(8, 7, 10), choc: 5 };
        const coup = coupSurLaHorde(h, 15);
        expect(coup.horde).toMatchObject({ debout: 7, choc: 5 });
        expect(coup.texte).toMatch(/un membre éliminé — 7\/8 debout/);
    });

    it('trop faible : aucun effet ; défaite : plus rien ne change', () => {
        expect(coupSurLaHorde(nouvelleHorde(3, 7, 10), 3).texte).toMatch(/aucun effet/);
        const vaincue = { ...nouvelleHorde(1, 7, 10), debout: 0 };
        expect(coupSurLaHorde(vaincue, 30).horde).toBe(vaincue);
    });
});

describe('la capacité « Sbires » (p. 265, 2026-10-16)', () => {
    const cases = (n: number, cochees: number) => ({ type: 'boxes', data: { boxes: Array.from({ length: n }, (_, i) => ({ filled: i < cochees })) } });

    it('réussi, l’attaque passe à un sbire ; échoué, le vilain encaisse', () => {
        expect(issueDesSbires(true)).toContain('sbire proche');
        expect(issueDesSbires(false)).toBe("le vilain encaisse l'attaque");
    });

    it('un sbire (une seule case) n’a pas de sbires à lui', () => {
        expect(estUnSbire(cases(1, 0))).toBe(true);
        expect(estUnSbire(cases(2, 0))).toBe(false);
        expect(estUnSbire(undefined)).toBe(false);
    });

    it('le malus des Blessures plafonne à −3', () => {
        expect(malusDesCases(cases(4, 0))).toBe(0);
        expect(malusDesCases(cases(6, 2))).toBe(2);
        expect(malusDesCases(cases(6, 5))).toBe(3);
        expect(malusDesCases({ type: 'hp', data: {} })).toBe(0);
    });
});
