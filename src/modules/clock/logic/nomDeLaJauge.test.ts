import { describe, it, expect } from 'vitest';
import { nomDeLaJauge, SEGMENTS_PAR_DEFAUT, SEGMENTS_PROPOSES } from './nomDeLaJauge';

/**
 * **Le nom saisi gagne — signalé par David le 2026-08-30.**
 *
 * *« Quand j'ajoute une jauge, son nom est toujours Jauge 6, alors que je l'ai
 * déclarée Impulsion. »* Le champ était non contrôlé et n'agissait que sur
 * `Entrée` ; les boutons `+4 / +6 / +8…` ne l'avaient jamais lu.
 *
 * *Deux chemins pour un même geste, et un seul lisait ce que l'utilisateur avait
 * écrit.*
 */

const DEFAUT = 'Jauge 6 seg';

describe('le nom d’une nouvelle jauge', () => {
    /** **Le test qui garde le défaut de David.** */
    it('retient ce qui a été saisi', () => {
        expect(nomDeLaJauge('Impulsion', DEFAUT)).toBe('Impulsion');
    });

    /**
     * Le repli n'est pas un détail : un champ vide est le cas le plus courant,
     * et une jauge sans nom ne se distingue d'aucune autre dans la grille.
     */
    it('retombe sur le libellé par défaut quand rien n’est saisi', () => {
        expect(nomDeLaJauge('', DEFAUT)).toBe(DEFAUT);
        expect(nomDeLaJauge('   ', DEFAUT)).toBe(DEFAUT);
    });

    it('ne garde pas les espaces autour du nom', () => {
        expect(nomDeLaJauge('  Impulsion  ', DEFAUT)).toBe('Impulsion');
    });
});

describe('ce que le pupitre propose', () => {
    /**
     * *Réparer une divergence ne doit pas changer le geste qui marchait* :
     * `Entrée` créait six segments avant ce correctif, et continue.
     */
    it('la touche Entrée crée toujours six segments', () => {
        expect(SEGMENTS_PAR_DEFAUT).toBe(6);
        expect(SEGMENTS_PROPOSES).toContain(SEGMENTS_PAR_DEFAUT);
    });

    it('propose les mêmes tailles qu’avant', () => {
        expect([...SEGMENTS_PROPOSES]).toEqual([4, 6, 8, 10, 12]);
    });
});
