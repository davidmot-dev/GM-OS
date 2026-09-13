import { describe, it, expect } from 'vitest';
import {
    imagesDuDiaporama, indexSuivant, cadenceDuDiaporama, peutTourner,
    CADENCE_MINIMALE_MS, CADENCE_PAR_DEFAUT_MS,
} from './deroulementDuDiaporama';
import type { Diaporama, ImageMedia } from '../types';

/**
 * **Ce qui décide du déroulement d'un diaporama.**
 *
 * Demandé par David le 2026-09-13. Ces essais gardent les **décisions** ;
 * l'horloge et la projection vivent dans le magasin, et le fondu dans les
 * écrans. *Trois endroits, trois responsabilités — et c'est ici qu'on peut
 * répondre sans démarrer quoi que ce soit.*
 */

const media = (id: string): ImageMedia => ({
    id, name: id, path: `m-${id}`, isFavorite: false,
});

const diaporama = (imageIds: string[], dureeParImageMs = CADENCE_PAR_DEFAUT_MS): Diaporama =>
    ({ id: 'd-1', nom: 'Le voyage', imageIds, dureeParImageMs });

describe('les images d’un diaporama', () => {
    it('les rend dans l’ordre du diaporama, pas dans celui de la bibliothèque', () => {
        const bibliotheque = [media('a'), media('b'), media('c')];

        const images = imagesDuDiaporama(diaporama(['c', 'a', 'b']), bibliotheque);

        expect(images.map(m => m.id)).toEqual(['c', 'a', 'b']);
    });

    /**
     * ⚠️ **Le test qui garde la décision la plus lourde de conséquences.** Un
     * ménage fait hors séance ne doit pas arrêter un diaporama en pleine scène
     * — et le meneur n'aurait aucun moyen de rattacher l'un à l'autre.
     */
    it('saute une image supprimée de la bibliothèque au lieu de s’arrêter', () => {
        const images = imagesDuDiaporama(diaporama(['a', 'disparue', 'b']), [media('a'), media('b')]);

        expect(images.map(m => m.id)).toEqual(['a', 'b']);
    });

    /** Une même image deux fois est un geste de montage, pas une erreur à corriger. */
    it('garde un doublon voulu', () => {
        const images = imagesDuDiaporama(diaporama(['a', 'b', 'a']), [media('a'), media('b')]);

        expect(images.map(m => m.id)).toEqual(['a', 'b', 'a']);
    });

    it('rend une liste vide quand plus rien n’existe', () => {
        expect(imagesDuDiaporama(diaporama(['x']), [])).toEqual([]);
    });
});

describe('l’index suivant', () => {
    it('avance', () => {
        expect(indexSuivant(0, 3)).toBe(1);
    });

    /** **Il boucle** — tranché par David : la table ne doit pas voir la fin. */
    it('revient au début après la dernière', () => {
        expect(indexSuivant(2, 3)).toBe(0);
    });

    it('revient à la dernière quand on recule depuis la première', () => {
        expect(indexSuivant(0, 3, -1)).toBe(2);
    });

    /** Une liste vidée sous les pieds du feuilletage ne doit pas rendre `NaN`. */
    it('rend zéro sur une liste vide', () => {
        expect(indexSuivant(4, 0)).toBe(0);
    });
});

describe('la cadence', () => {
    it('rend la durée voulue', () => {
        expect(cadenceDuDiaporama({ dureeParImageMs: 8000 })).toBe(8000);
    });

    /**
     * ⛔ **Plus court que le fondu, l'image repartirait avant d'être entrée** :
     * la table ne verrait qu'un battement trouble. La borne vit à la lecture,
     * parce qu'un diaporama peut arriver d'un import ou d'une sauvegarde.
     */
    it('refuse une cadence plus courte que le fondu', () => {
        expect(cadenceDuDiaporama({ dureeParImageMs: 200 })).toBe(CADENCE_MINIMALE_MS);
    });

    it.each([
        ['absente', undefined],
        ['illisible', Number.NaN],
        ['infinie', Number.POSITIVE_INFINITY],
    ])('retombe sur la valeur par défaut quand elle est %s', (_nom, valeur) => {
        expect(cadenceDuDiaporama({ dureeParImageMs: valeur as number })).toBe(CADENCE_PAR_DEFAUT_MS);
    });
});

describe('ce qui peut tourner', () => {
    /**
     * ⛔ **Une seule image ne tourne pas.** La reprojeter en boucle rejouerait
     * son fondu d'entrée toutes les six secondes : *un décor fixe qui clignote.*
     */
    it('refuse une seule image', () => {
        expect(peutTourner([media('a')])).toBe(false);
    });

    it('refuse une liste vide', () => {
        expect(peutTourner([])).toBe(false);
    });

    it('accepte deux images', () => {
        expect(peutTourner([media('a'), media('b')])).toBe(true);
    });
});
