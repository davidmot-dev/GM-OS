import { describe, it, expect } from 'vitest';
import { retirerLesRenvoisDuCarnet, compterLesRenvois } from './renvoisDuCarnet';

/**
 * Ce que ces tests protègent : **une fiche ne porte pas de citations qui n'en
 * sont pas**.
 *
 * **Constaté sur la charge réelle du 2026-08-15**, l'inventaire de « Le secret
 * de Milo » : le carnet a truffé sa réponse de ses numéros de référence internes
 * malgré la consigne. Ils numérotent ses sources *dans la conversation qui vient
 * d'avoir lieu*, et cette numérotation change d'une requête à l'autre — c'est le
 * défaut exact des numéros de page, qui a valu au corpus de règles neuf fiches
 * citant au-delà de la dernière page du livre.
 */

describe('retirerLesRenvoisDuCarnet', () => {
    it('retire les formes que le carnet a réellement produites', () => {
        // Extraits littéraux de l'inventaire du 2026-08-15.
        expect(retirerLesRenvoisDuCarnet('un collectionneur amnésique, Milo Torricelli [1-4].'))
            .toBe('un collectionneur amnésique, Milo Torricelli.');
        expect(retirerLesRenvoisDuCarnet('affronter la divinité sur les ruines de Babylone [3, 5, 6].'))
            .toBe('affronter la divinité sur les ruines de Babylone.');
        expect(retirerLesRenvoisDuCarnet('une agente d\'infiltration [9, 47-51].'))
            .toBe("une agente d'infiltration.");
    });

    it('ne laisse pas d\'espace avant la ponctuation', () => {
        expect(retirerLesRenvoisDuCarnet('Rome [1] ; puis Tivoli [2].')).toBe('Rome; puis Tivoli.');
    });

    it('laisse en place tout crochet contenant une lettre', () => {
        /**
         * **Volontairement étroit.** Le corpus est plein de markdown légitime, et
         * *retirer trop est pire que retirer trop peu* : la perte, elle, est
         * muette. Un crochet avec la moindre lettre reste.
         */
        expect(retirerLesRenvoisDuCarnet('voir [la section 3]')).toBe('voir [la section 3]');
        expect(retirerLesRenvoisDuCarnet('[Fichier Markdown: x]')).toBe('[Fichier Markdown: x]');
        expect(retirerLesRenvoisDuCarnet('- [ ] à faire')).toBe('- [ ] à faire');
    });

    it('ne touche pas un lien markdown', () => {
        expect(retirerLesRenvoisDuCarnet('[Babylone](babylone.md)')).toBe('[Babylone](babylone.md)');
    });

    it('un texte sans renvoi ressort intact', () => {
        const propre = 'La campagne se joue en trois scénarios.\n\nLe premier est romain.';
        expect(retirerLesRenvoisDuCarnet(propre)).toBe(propre);
    });
});

describe('compterLesRenvois — pour le dire, pas pour agir en silence', () => {
    it('compte ce qui sera retiré', () => {
        expect(compterLesRenvois('a [1-4] b [3, 5, 6] c')).toBe(2);
        expect(compterLesRenvois('rien à signaler')).toBe(0);
    });
});
