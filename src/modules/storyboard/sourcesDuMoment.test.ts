import { describe, it, expect } from 'vitest';
import { SOURCES_DU_MOMENT, momentVoisin, type CleDeSource } from './sourcesDuMoment';
import type { StoryboardMoment } from './useStoryboardStore';

const moment = (champs: Partial<StoryboardMoment>): StoryboardMoment => ({
    id: 'm', name: 'Moment', description: '', color: '', icon: 'Zap', campaignId: 'c', ...champs,
} as StoryboardMoment);

const touchees = (m: StoryboardMoment): CleDeSource[] =>
    SOURCES_DU_MOMENT.filter(s => s.touche(m)).map(s => s.cle);

describe('les sources d’un moment', () => {
    it('un moment vide ne touche rien — ses sept colonnes restent éteintes', () => {
        expect(touchees(moment({}))).toEqual([]);
    });

    it('le diaporama s’allume dans la colonne de l’image', () => {
        expect(touchees(moment({ diaporamaId: 'd1' }))).toEqual(['image']);
    });

    it('un volume à zéro touche la source : c’est « coupe », pas « rien »', () => {
        expect(touchees(moment({ musicVolume: 0, soundVolume: 0, ambientVolume: 0 })))
            .toEqual(['musique', 'ambiance', 'bruitage']);
    });

    it('un titre fait de blancs n’est pas un titre', () => {
        expect(touchees(moment({ titre: '   ' }))).toEqual([]);
        expect(touchees(moment({ titre: 'Los Angeles, 2019' }))).toEqual(['titre']);
    });
});

describe('le moment voisin', () => {
    const ids = ['a', 'b', 'c'];

    it('sans moment en cours, « suivant » part du premier et « précédent » ne rend rien', () => {
        expect(momentVoisin(ids, null, 1)).toBe('a');
        expect(momentVoisin(ids, null, -1)).toBeNull();
    });

    it('enchaîne dans l’ordre du tableau', () => {
        expect(momentVoisin(ids, 'b', 1)).toBe('c');
        expect(momentVoisin(ids, 'b', -1)).toBe('a');
    });

    it('ne boucle pas aux deux bouts', () => {
        expect(momentVoisin(ids, 'c', 1)).toBeNull();
        expect(momentVoisin(ids, 'a', -1)).toBeNull();
    });

    it('un moment en cours d’une autre campagne compte comme aucun', () => {
        expect(momentVoisin(ids, 'z', 1)).toBe('a');
    });

    it('un tableau vide ne rend rien', () => {
        expect(momentVoisin([], null, 1)).toBeNull();
    });
});
