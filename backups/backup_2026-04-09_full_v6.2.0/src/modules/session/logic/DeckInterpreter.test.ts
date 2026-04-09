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
});
