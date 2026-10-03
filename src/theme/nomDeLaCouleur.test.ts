import { describe, it, expect } from 'vitest';
import { nomDeLaCouleur } from './nomDeLaCouleur';
import { themeDeBase } from './themeDeLInterface';

describe("le nom d'une couleur d'accent", () => {
    it('nomme les teintes franches', () => {
        expect(nomDeLaCouleur('#06b6d4')).toBe('Cyan');
        expect(nomDeLaCouleur('#8b5cf6')).toBe('Violet');
        expect(nomDeLaCouleur('#ec4899')).toBe('Rose');
        expect(nomDeLaCouleur('#f59e0b')).toBe('Ambre');
        expect(nomDeLaCouleur('#ef4444')).toBe('Rouge');
        expect(nomDeLaCouleur('#3b82f6')).toBe('Bleu');
        expect(nomDeLaCouleur('#14b8a6')).toBe('Sarcelle');
        expect(nomDeLaCouleur('#64748b')).toBe('Ardoise');
    });

    it('rend une saisie illisible telle quelle', () => {
        expect(nomDeLaCouleur('rebeccapurple')).toBe('rebeccapurple');
    });

    /*
      Deux pastilles d'un même thème portant le même nom se liraient comme un
      doublon. Les palettes sont courtes : on vérifie qu'elles se distinguent.
    */
    it.each([false, true])('les pastilles d’un thème ont des noms distincts (personnalités : %s)', (personnalites) => {
        for (const theme of ['cyberpunk', 'medieval', 'modern', 'claire']) {
            const noms = themeDeBase(theme, personnalites).palettes.map(nomDeLaCouleur);
            expect(new Set(noms).size, `${theme} : ${noms.join(', ')}`).toBe(noms.length);
        }
    });
});
