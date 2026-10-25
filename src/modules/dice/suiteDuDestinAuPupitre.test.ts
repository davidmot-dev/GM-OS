import { expect, it } from 'vitest';
import { resultatDestinAuPupitre, desDuDixDisponibles } from './suiteDuDestinAuPupitre';
import type { RollRecord } from '../../stores/useDiceStore';
const jet = { id: 'j', title: 'Destin', timestamp: new Date(), modifier: 0, total: 0, totalDisplay: '', rolls: [{ val: 8, sides: 10 }, { val: 1, sides: 10 }] } as RollRecord;
it('au pupitre, les 1 ne sont jamais retranchés aux succès de NOC', () => {
    expect(resultatDestinAuPupitre(jet)).toMatchObject({ total: 1, successes: 1, fails: 0, tagSuccess: true });
});
it('un 10 offre un dé ; un dé déjà ajouté consomme ce droit, sauf son propre 10', () => {
    expect(desDuDixDisponibles({ ...jet, rolls: [{ val: 10, sides: 10 }, { val: 10, sides: 10, isExploded: true }, { val: 3, sides: 10, isExploded: true }] })).toBe(0);
    expect(desDuDixDisponibles({ ...jet, rolls: [{ val: 10, sides: 10 }, { val: 10, sides: 10, isExploded: true }] })).toBe(1);
    expect(desDuDixDisponibles({ ...jet, rolls: [{ val: 10, sides: 20 }] })).toBe(0);
});
