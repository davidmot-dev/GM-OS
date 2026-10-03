import { describe, it, expect } from 'vitest';
import { longueurEnCases, libelleDeMesure, outilDeTrait, couleurSurLePapier, TAILLE_DE_CASE } from './dessinerUnTrace';

/** La règle et les outils posés — refonte, L6 (2026-10-03). */
describe('la règle du tableau blanc', () => {
    it('compte en cases de la grille', () => {
        // Dix cases à l'horizontale sur un écran de 480 px.
        const largeur = 480;
        const fin = { x: (10 * TAILLE_DE_CASE) / largeur, y: 0 };
        expect(longueurEnCases({ x: 0, y: 0 }, fin, largeur, 300)).toBeCloseTo(10);
    });

    it('rapporte chaque axe à sa propre dimension', () => {
        // 3 cases en x, 4 en y : 5 cases en diagonale, sur un écran non carré.
        const [l, h] = [600, 240];
        const fin = { x: (3 * TAILLE_DE_CASE) / l, y: (4 * TAILLE_DE_CASE) / h };
        expect(longueurEnCases({ x: 0, y: 0 }, fin, l, h)).toBeCloseTo(5);
    });

    it('écrit une décimale et le mot du pilote, « unités » à défaut', () => {
        expect(libelleDeMesure(8.46, 'mètres')).toBe('8,5 mètres');
        expect(libelleDeMesure(3, 'zones')).toBe('3 zones');
        expect(libelleDeMesure(2.04, undefined)).toBe('2 unités');
        expect(libelleDeMesure(2, '  ')).toBe('2 unités');
    });
});

describe("l'outil d'un joueur", () => {
    it('reste un trait quand le meneur tient un pion, une cible ou la règle', () => {
        expect(outilDeTrait('pion')).toBe('brush');
        expect(outilDeTrait('cible')).toBe('brush');
        expect(outilDeTrait('regle')).toBe('brush');
        expect(outilDeTrait('eraser')).toBe('eraser');
        expect(outilDeTrait('laser')).toBe('laser');
    });
});

describe('le blanc et le noir suivent le papier', () => {
    it('un trait blanc se lit en noir sur le papier clair, et inversement', () => {
        expect(couleurSurLePapier('#ffffff', 'light')).toBe('#000000');
        expect(couleurSurLePapier('#000000', 'dark')).toBe('#ffffff');
        expect(couleurSurLePapier('#ffffff', 'dark')).toBe('#ffffff');
        expect(couleurSurLePapier('#ef4444', 'light')).toBe('#ef4444');
    });
});
