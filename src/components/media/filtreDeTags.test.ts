import { describe, it, expect } from 'vitest';
import { analyserLaRecherche, passeLeFiltreDeTags } from './filtreDeTags';

/**
 * Ce que ces essais protègent : **on peut enfin dire « pas ça », et la barre de
 * recherche ne devient pas un piège pour autant.**
 */

describe('lire une recherche', () => {
    it('laisse le texte ordinaire tel quel', () => {
        expect(analyserLaRecherche('taverne nuit')).toEqual({
            texte: 'taverne nuit', inclus: [], exclus: [],
        });
    });

    it('reconnaît une étiquette exigée', () => {
        expect(analyserLaRecherche('#taverne pluie').inclus).toEqual(['taverne']);
        expect(analyserLaRecherche('#taverne pluie').texte).toBe('pluie');
    });

    it('reconnaît un refus, avec ou sans dièse', () => {
        expect(analyserLaRecherche('-combat').exclus).toEqual(['combat']);
        expect(analyserLaRecherche('-#combat').exclus).toEqual(['combat']);
    });

    it('mêle les trois', () => {
        const lue = analyserLaRecherche('#taverne -combat pluie');

        expect(lue).toEqual({ texte: 'pluie', inclus: ['taverne'], exclus: ['combat'] });
    });

    /**
     * ⚠️ *Un fichier peut s'appeler `plan-B.jpg`* — et un tiret isolé qui
     * mangerait la recherche ferait de la barre un piège.
     */
    it('laisse un tiret ou un dièse seul au texte', () => {
        expect(analyserLaRecherche('-').texte).toBe('-');
        expect(analyserLaRecherche('#').texte).toBe('#');
        expect(analyserLaRecherche('plan-b').texte, 'le tiret est AU MILIEU du mot')
            .toBe('plan-b');
    });

    it('supporte le vide', () => {
        expect(analyserLaRecherche('')).toEqual({ texte: '', inclus: [], exclus: [] });
    });
});

describe('le filtre d’étiquettes', () => {
    const TAGS = ['taverne', 'nuit'];

    it('laisse tout passer quand rien n’est exigé', () => {
        expect(passeLeFiltreDeTags(TAGS, {})).toBe(true);
    });

    it('exige en OU par défaut', () => {
        expect(passeLeFiltreDeTags(TAGS, { inclus: ['taverne', 'donjon'] })).toBe(true);
    });

    it('exige tout en ET', () => {
        expect(passeLeFiltreDeTags(TAGS, { inclus: ['taverne', 'nuit'], logique: 'ET' }))
            .toBe(true);
        expect(passeLeFiltreDeTags(TAGS, { inclus: ['taverne', 'donjon'], logique: 'ET' }))
            .toBe(false);
    });

    it('compare sans se laisser arrêter par la casse ou le pluriel', () => {
        expect(passeLeFiltreDeTags(['Tavernes'], { inclus: ['taverne'] })).toBe(true);
    });

    /**
     * ⛔ **Un refus ne se négocie pas.** *Dire « sauf les combats » en mode OU
     * et voir quand même des combats serait un réglage qui ment.*
     */
    it('refuse malgré une exigence satisfaite, et même en OU', () => {
        expect(passeLeFiltreDeTags(['taverne', 'combat'], {
            inclus: ['taverne'], exclus: ['combat'], logique: 'OU',
        })).toBe(false);
    });

    it('refuse aussi quand rien n’est exigé', () => {
        expect(passeLeFiltreDeTags(TAGS, { exclus: ['nuit'] })).toBe(false);
    });

    it('supporte un média sans étiquette', () => {
        expect(passeLeFiltreDeTags([], { exclus: ['combat'] })).toBe(true);
        expect(passeLeFiltreDeTags([], { inclus: ['combat'] })).toBe(false);
    });
});
