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
    const LIVRE_MUET = false;
    const LIVRE_EN_PARLE = true;

    /**
     * **Les deux conditions du plan** : *« à défaut d'une fiche ET à défaut du
     * livre »*. Le code n'en tenait aucune — il tenait un substitut, « aucune
     * source retenue », qui a cessé d'être atteignable le jour où le corpus
     * s'est enfin résolu.
     */
    it('juge quand ni le corpus ni le livre ne couvrent la question', () => {
        expect(doitJuger('rien', LIVRE_MUET)).toBe(true);
        expect(doitJuger('fiche-hors-sujet', LIVRE_MUET)).toBe(true);
        expect(doitJuger('document', LIVRE_MUET)).toBe(true);
    });

    /**
     * **Une fiche qui répond ferme la question**, que le livre en parle ou non :
     * c'est la réponse pleine, elle porte ses sources.
     */
    it('ne juge jamais quand une fiche répond', () => {
        expect(doitJuger('fiche', LIVRE_MUET)).toBe(false);
        expect(doitJuger('fiche', LIVRE_EN_PARLE)).toBe(false);
    });

    /**
     * **Le livre est ce qui rend la règle sûre.** Sans lui, on apposerait « pas
     * la règle officielle » sur une réponse qu'une fiche voisine couvrait
     * peut-être dans son corps de texte — *se calomnier*.
     */
    it('se tait dès que le livre en parle', () => {
        expect(doitJuger('fiche-hors-sujet', LIVRE_EN_PARLE)).toBe(false);
        expect(doitJuger('document', LIVRE_EN_PARLE)).toBe(false);
        expect(doitJuger('rien', LIVRE_EN_PARLE)).toBe(false);
    });

    /**
     * *L'étiquette doit rester rare pour rester lue.* Deux conditions la gardent
     * plus rare qu'un seuil qu'il faudrait régler : **le livre suffit à la faire
     * taire sur les quatre états.**
     */
    it('reste rare : le livre la fait taire partout', () => {
        expect(ATTEINTES.filter(a => doitJuger(a, LIVRE_EN_PARLE))).toEqual([]);
        expect(ATTEINTES.filter(a => doitJuger(a, LIVRE_MUET)))
            .toEqual(['fiche-hors-sujet', 'document', 'rien']);
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
