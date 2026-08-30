import { describe, it, expect } from 'vitest';
import { LARGEUR } from './defileDesQuarts';
import {
    barreDeSegments,
    composerCompteARebours,
    COULEURS_DU_COMPTE,
    nomPourLaMatrice,
    CARACTERES_TENUS,
} from './compteARebours';

/**
 * **Le premier miroir de l'afficheur — étape B, le 2026-08-30.**
 *
 * Jusqu'ici l'objet ne reflétait rien : le défilé des Quarts est un
 * *instrument*, poussé à la main. Une horloge de tension reflète un moteur, et
 * cela change la nature de ce qu'un défaut coûte : **s'il ment, c'est un bug**,
 * et il ment de façon crédible.
 *
 * Ces tests tiennent donc deux choses : que la barre dit le bon compte, et que
 * ce qui ne tient pas sur 32 pixels est **coupé plutôt que déformé**.
 */

const couleurs = (barres: { df: [number, number, number, number, string] }[]) =>
    barres.map(b => b.df[4]);

describe('le nom sur la matrice', () => {
    /** L'appareil force les majuscules ; sa fonte ne garantit pas les accents. */
    it('retire les accents plutôt que de risquer une case vide', () => {
        expect(nomPourLaMatrice('Réplicants')).toBe('REPLICA');
        expect(nomPourLaMatrice('Épuisé')).toBe('EPUISE');
    });

    /**
     * ⚠️ **Une perte assumée.** Sept caractères, et pas de défilement — *un
     * texte qui défile n'est pas consultable d'un coup d'œil.* Deux horloges
     * dont les sept premières lettres se ressemblent seront indistinguables.
     */
    it('coupe à ce que la largeur tient', () => {
        // Coupé à sept, puis débarrassé de l'espace sur lequel la coupe tombe :
        // « Alerte Gardes » donne « ALERTE », six caractères et non sept.
        expect(nomPourLaMatrice('Alerte Gardes')).toBe('ALERTE');
        expect(nomPourLaMatrice('Replicants')).toBe('REPLICA');
        expect(nomPourLaMatrice('Replicants')).toHaveLength(CARACTERES_TENUS);
    });

    it('ne laisse pas d’espace en fin de troncature', () => {
        expect(nomPourLaMatrice('Nuit  ')).toBe('NUIT');
    });
});

describe('la barre de segments', () => {
    it('dessine une case par segment, remplies d’abord', () => {
        expect(couleurs(barreDeSegments(2, 4, '#00C853'))).toEqual([
            '#00C853', '#00C853', COULEURS_DU_COMPTE.vide, COULEURS_DU_COMPTE.vide,
        ]);
    });

    it('s’adapte au nombre de segments, sans déborder de la matrice', () => {
        for (const total of [4, 6, 8, 10, 12]) {
            const barres = barreDeSegments(1, total, '#fff');
            expect(barres, `total ${total}`).toHaveLength(total);
            for (const { df: [x, , l] } of barres) {
                expect(x + l, `total ${total} déborde`).toBeLessThanOrEqual(LARGEUR);
            }
        }
    });

    /** Sans interstice, une barre pleine devient un trait et l'on ne compte plus. */
    it('laisse un pixel entre deux segments voisins', () => {
        const barres = barreDeSegments(4, 4, '#fff');
        const [premier, second] = barres;
        expect(premier.df[0] + premier.df[2]).toBeLessThan(second.df[0]);
    });

    /**
     * *Une barre dont on ne peut pas compter les cases ment sur ce qu'elle est.*
     * Au-delà de seize segments, on cesse de prétendre les dénombrer.
     */
    it('bascule en jauge continue quand les cases ne sont plus séparables', () => {
        const barres = barreDeSegments(10, 20, '#fff');

        expect(barres).toHaveLength(2); // le fond, puis la portion pleine
        expect(barres[1].df[2]).toBe(LARGEUR / 2);
    });

    it('ne dessine rien pour une horloge sans segment', () => {
        expect(barreDeSegments(0, 0, '#fff')).toEqual([]);
    });
});

describe('l’horloge composée', () => {
    it('prend la couleur de l’horloge quand elle en porte une', () => {
        const charge = composerCompteARebours({ nom: 'Alerte', remplis: 1, total: 4, couleur: '#00C853' });
        expect(charge.color).toBe('#00C853');
    });

    /**
     * **Pleine, elle passe au rouge quelle que soit sa couleur.** C'est la seule
     * chose que la table doit voir de l'autre bout de la pièce : *ce qui était
     * annoncé arrive.* La couleur propre sert à distinguer, pas à masquer.
     */
    it('passe au rouge une fois pleine, même colorée', () => {
        const charge = composerCompteARebours({ nom: 'Alerte', remplis: 4, total: 4, couleur: '#00C853' });

        expect(charge.color).toBe(COULEURS_DU_COMPTE.pleine);
        expect(couleurs(charge.draw).every(c => c === COULEURS_DU_COMPTE.pleine)).toBe(true);
    });

    /** Un état incohérent ne doit pas dessiner plus de cases qu'il n'y en a. */
    it('borne les segments remplis au total', () => {
        const charge = composerCompteARebours({ nom: 'X', remplis: 99, total: 4 });
        expect(charge.draw).toHaveLength(4);
    });

    it('ne défile jamais', () => {
        expect(composerCompteARebours({ nom: 'Alerte Gardes', remplis: 1, total: 6 }).noScroll).toBe(true);
    });
});
