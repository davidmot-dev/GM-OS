import { describe, it, expect } from 'vitest';
import { CONSIGNE_DE_JUGEMENT, ETIQUETTE_DU_JUGEMENT, doitJuger } from './jugementDeTable';
import { ATTEINTES } from './atteinteDeLaRecherche';

/**
 * Ce que ces tests protègent : **une réponse sans source s'annonce comme telle,
 * et reste courte.**
 *
 * Étage 3 de l'axe M. Quatre exigences qui ne se négocient pas, et chacune porte
 * sa raison — *la longueur est le signal*, *l'absence de source EST
 * l'information*, *placée après, l'étiquette arrive quand le meneur a déjà
 * adopté la réponse*.
 */

describe('quand faut-il juger', () => {
    /**
     * **Seulement quand la recherche n'a RIEN atteint.** Un document non
     * vérifié a beau être faible, il est une source : annoncer sa réponse comme
     * un jugement de table serait se calomnier.
     */
    it('juge quand aucune source n’a répondu', () => {
        expect(doitJuger('rien')).toBe(true);
    });

    it('ne juge pas quand quelque chose a répondu', () => {
        expect(doitJuger('fiche')).toBe(false);
        expect(doitJuger('document')).toBe(false);
    });

    /**
     * *L'étiquette doit rester rare pour rester lue* — apposée sur tout ce qui
     * n'est pas une fiche, elle deviendrait un ornement que l'œil saute.
     */
    it('reste rare : un seul des trois états la déclenche', () => {
        expect(ATTEINTES.filter(doitJuger)).toEqual(['rien']);
    });
});

describe('la consigne envoyée au modèle', () => {
    /** **La longueur est le signal** : courte, elle se lit comme une proposition. */
    it('impose deux lignes', () => {
        expect(CONSIGNE_DE_JUGEMENT).toContain('DEUX LIGNES MAXIMUM');
    });

    /**
     * **Un ruling qui cite a l'apparence d'une règle.** Et l'absence de source
     * *est* l'information : c'est elle qui dit au meneur que c'est lui qui
     * décide.
     */
    it('interdit toute citation et tout numéro de page', () => {
        expect(CONSIGNE_DE_JUGEMENT).toContain('NE CITE AUCUNE SOURCE');
        expect(CONSIGNE_DE_JUGEMENT).toContain('aucun numéro de page');
    });

    /**
     * **L'étiquette appartient à l'écran, pas au modèle.** Lui demander de
     * l'écrire lui-même reviendrait à confier un placement à qui peut l'oublier
     * — et l'oubli produirait exactement le défaut que l'exigence empêche.
     */
    it('laisse l’étiquette à l’application', () => {
        expect(CONSIGNE_DE_JUGEMENT).toContain("l'application le dit déjà");
        expect(CONSIGNE_DE_JUGEMENT.toLowerCase())
            .not.toContain(ETIQUETTE_DU_JUGEMENT.toLowerCase());
    });

    /** Elle-même doit rester brève : elle part dans le budget de la question. */
    it('tient en quelques lignes', () => {
        expect(CONSIGNE_DE_JUGEMENT.length).toBeLessThan(500);
    });
});

describe('l’étiquette', () => {
    it('dit ce que c’est, et surtout ce que ce n’est pas', () => {
        expect(ETIQUETTE_DU_JUGEMENT).toContain('Jugement de table');
        expect(ETIQUETTE_DU_JUGEMENT).toContain('pas la règle');
    });
});
