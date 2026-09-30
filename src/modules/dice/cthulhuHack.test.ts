import { describe, it, expect, vi, afterEach } from 'vitest';
import { DiceEngine } from './DiceEngine';
import { deDUnCranPlusBas, faitDescendre, DES_D_USURE } from './desDUsure';

/**
 * **Cthulhu Hack au pupitre** — demandé par David le 2026-09-30 : *« un
 * système D20 pour les jets de sauvegarde (avec avantage et désavantage) et
 * des jets de ressources D4 à D12, où un 1 ou un 2 fait baisser le dé ».*
 *
 * On impose les faces tirées : un jet aléatoire ne prouve rien, et ce sont les
 * bornes — 1, 2, 3, 20 — qui portent les règles.
 */
const tirer = (...faces: number[]) => {
    const suite = [...faces];
    vi.spyOn(DiceEngine, 'roll').mockImplementation(() => suite.shift()!);
};

afterEach(() => vi.restoreAllMocks());

describe("l'échelle des dés de ressource", () => {
    it('descend d’un cran : d12 → d10 → d8 → d6 → d4', () => {
        expect(deDUnCranPlusBas(12)).toBe(10);
        expect(deDUnCranPlusBas(10)).toBe(8);
        expect(deDUnCranPlusBas(8)).toBe(6);
        expect(deDUnCranPlusBas(6)).toBe(4);
    });

    it('le Matériel peut partir du d20, qui descend au d12', () => {
        expect(deDUnCranPlusBas(20)).toBe(12);
    });

    it('sous le d4, la ressource s’épuise', () => {
        expect(deDUnCranPlusBas(4)).toBe(null);
    });

    it('un dé hors de l’échelle ne s’invente pas de cran', () => {
        expect(deDUnCranPlusBas(100)).toBe(null);
    });

    it('seuls un 1 et un 2 font descendre', () => {
        expect([1, 2, 3].map(faitDescendre)).toEqual([true, true, false]);
    });

    it('offre les dés du plus petit au plus grand', () => {
        expect(DES_D_USURE).toEqual([4, 6, 8, 10, 12, 20]);
    });
});

describe('le jet de ressource', () => {
    it('tient sur un 3 ou plus', () => {
        tirer(3);
        const r = DiceEngine.rollUsure(8);
        expect(r.usure).toEqual({ avant: 8, apres: 8 });
        expect(r.totalDisplay).toBe('3 — tient');
    });

    it('descend sur un 2', () => {
        tirer(2);
        const r = DiceEngine.rollUsure(8);
        expect(r.usure).toEqual({ avant: 8, apres: 6 });
        expect(r.totalDisplay).toBe('2 — descend au d6');
    });

    it('s’épuise sur un 1 au d4', () => {
        tirer(1);
        const r = DiceEngine.rollUsure(4);
        expect(r.usure).toEqual({ avant: 4, apres: null });
        expect(r.totalDisplay).toBe('1 — épuisée');
    });

    it('ne porte aucun verdict : l’enquête avance toujours', () => {
        tirer(1);
        const r = DiceEngine.rollUsure(6);
        expect(r.tagSuccess).toBeUndefined();
        expect(r.degre).toBeUndefined();
    });
});

describe('la Sauvegarde, d20 sous la caractéristique', () => {
    it('réussit à égalité, échoue au-dessus', () => {
        tirer(12);
        expect(DiceEngine.rollSauvegarde(12).tagSuccess).toBe(true);
        tirer(13);
        expect(DiceEngine.rollSauvegarde(12).tagSuccess).toBe(false);
    });

    it('à l’avantage, garde le plus BAS des deux', () => {
        tirer(15, 4);
        const r = DiceEngine.rollSauvegarde(10, 'avantage');
        expect(r.total).toBe(4);
        expect(r.tagSuccess).toBe(true);
        expect(r.rolls[1]).toMatchObject({ val: 15, isDropped: true });
    });

    it('au désavantage, garde le plus HAUT', () => {
        tirer(15, 4);
        const r = DiceEngine.rollSauvegarde(10, 'desavantage');
        expect(r.total).toBe(15);
        expect(r.tagSuccess).toBe(false);
    });

    it('un 1 naturel est une réussite critique', () => {
        tirer(1);
        expect(DiceEngine.rollSauvegarde(8).totalDisplay).toBe('1 / 8 — réussite critique');
    });

    it('un 20 naturel est un échec critique', () => {
        tirer(20);
        expect(DiceEngine.rollSauvegarde(8).totalDisplay).toBe('20 / 8 — échec critique');
    });

    it('le critique se lit sur le dé naturel, pas sur le total', () => {
        tirer(2);
        const r = DiceEngine.rollSauvegarde(8, 'aucun', -1);
        expect(r.total).toBe(1);
        expect(r.totalDisplay).toBe('1 / 8');
    });

    it('un pilote la lance aussi, avec la caractéristique de l’appelant', () => {
        tirer(9);
        const r = DiceEngine.rollFromConfig(
            { defaultDice: '1d20', logic: 'sum', engine: 'sauvegarde' },
            { targetOverwrite: 11 },
        );
        expect(r.totalDisplay).toBe('9 / 11');
        expect(r.tagSuccess).toBe(true);
    });
});
