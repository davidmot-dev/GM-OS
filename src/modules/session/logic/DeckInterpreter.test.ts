import { describe, it, expect } from 'vitest';
import { DeckInterpreter } from './DeckInterpreter';

describe('DeckInterpreter', () => {
    describe('calculateAspectRatio', () => {
        it('should return correct portrait poker ratio', () => {
            expect(DeckInterpreter.calculateAspectRatio('poker', 'portrait')).toBe(`${2.5 / 3.5}`);
        });

        it('should return correct landscape poker ratio', () => {
            expect(DeckInterpreter.calculateAspectRatio('poker', 'landscape')).toBe(`${3.5 / 2.5}`);
        });

        it('should return correct tarot ratio', () => {
            expect(DeckInterpreter.calculateAspectRatio('tarot', 'portrait')).toBe(`${2.75 / 4.75}`);
        });
    });

    describe('initializeIndices', () => {
        it('should create a shuffled array of indices', () => {
            const manifest = { cardCount: 54, startAtZero: false } as Parameters<typeof DeckInterpreter.initializeIndices>[0];
            const indices = DeckInterpreter.initializeIndices(manifest);
            expect(indices).toHaveLength(54);
            expect(indices).toContain(1);
            expect(indices).toContain(54);
            // Non-deterministic check (statistically unlikely to be sorted)
            const sorted = Array.from({ length: 54 }, (_, i) => i + 1);
            expect(indices).not.toEqual(sorted);
        });
    });

    describe('draw', () => {
        it('should draw the first card and return the rest', () => {
            const remaining = [5, 12, 8];
            const result = DeckInterpreter.draw(remaining);
            expect(result.card).toBe(5);
            expect(result.newRemaining).toEqual([12, 8]);
        });

        it('should return null if no cards left', () => {
            const result = DeckInterpreter.draw([]);
            expect(result.card).toBeNull();
            expect(result.newRemaining).toEqual([]);
        });
    });

    /** Les Menaces de Torg, rangées par `outils/torg/ranger-recto-verso.mjs` (08/11/2026). */
    describe('le verso propre à chaque carte', () => {
        const menaces = {
            folderPath: 'assets/decks/torg/menaces-cyberpapaute', extension: '.jpg',
            filenamePattern: 'recto/{n}', versoPattern: 'verso/{n}', padding: 2,
        } as Parameters<typeof DeckInterpreter.getVersoImage>[0];

        it('le recto et le verso d’une même carte suivent chacun leur motif', () => {
            expect(DeckInterpreter.getCardImage(menaces, 5)).toBe('assets/decks/torg/menaces-cyberpapaute/recto/05.jpg');
            expect(DeckInterpreter.getVersoImage(menaces, 5)).toBe('assets/decks/torg/menaces-cyberpapaute/verso/05.jpg');
        });

        it('un paquet à dos commun n’a pas de verso par carte', () => {
            expect(DeckInterpreter.getVersoImage({ ...menaces, versoPattern: undefined }, 5)).toBeNull();
            expect(DeckInterpreter.getVersoImage({ ...menaces, versoPattern: '  ' }, 5)).toBeNull();
        });
    });
});
