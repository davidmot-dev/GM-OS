import { describe, expect, it } from 'vitest';
import type { DeckSessionState } from '../../../types/deck.types';
import { echangerLesCartesTorg } from './echangesDeTorg';

const etat = (enRounds = false): DeckSessionState => ({ deckId: 'destin', remainingIndices: [3], discardedIndices: [], currentCardIndex: null,
    torgEnRounds: enRounds, enMain: [
        { index: 1, porteur: 'a', face: 'revelee', enReserve: enRounds },
        { index: 2, porteur: 'b', face: 'revelee', enReserve: enRounds },
    ] });

describe('Torg, échanges une pour une (p. 113)', () => {
    it.each([false, true])('échange les deux propriétaires ensemble, sans modifier les tas ; rounds=%s', rounds => {
        const avant = etat(rounds), r = echangerLesCartesTorg(avant, 1, 2, 'a', 'b');
        expect(r.refus).toBeUndefined();
        expect(r.etat.enMain?.map(c => c.porteur)).toEqual(['b', 'a']);
        expect(r.etat.remainingIndices).toEqual([3]);
        expect(avant.enMain?.map(c => c.porteur)).toEqual(['a', 'b']);
        expect(echangerLesCartesTorg(r.etat, 1, 2, 'a', 'b').etat).toBe(r.etat);
    });
    it('refuse si la contrepartie est jouée entre proposition et acceptation', () => {
        const avant = etat(); avant.enMain = avant.enMain!.slice(0, 1);
        expect(echangerLesCartesTorg(avant, 1, 2, 'a', 'b').etat).toBe(avant);
    });
    it('refuse une carte de main en combat, même si la carte offerte est en Réserve', () => {
        const avant = etat(true); avant.enMain![1].enReserve = false;
        expect(echangerLesCartesTorg(avant, 1, 2, 'a', 'b').refus).toMatch(/Réserves/);
    });
});
