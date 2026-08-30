import { describe, it, expect } from 'vitest';
import {
    composerMinuteur,
    COULEURS_DU_MINUTEUR,
    enMinutesSecondes,
    ilYAUnMinuteur,
    LARGEUR_DE_LA_MATRICE,
    SECONDES_CRITIQUES,
} from './minuteur';

/**
 * **Le minuteur sur les 32 × 8 — le widget que le § 8.1 classait premier.**
 *
 * David a tranché le 2026-08-30 : **MM:SS en permanence**. C'est le plus lisible
 * pour la table, et c'est aussi celui qui a forcé le battement de l'afficheur à
 * ne republier que ce qui a changé — un compte à rebours rafraîchi toutes les
 * trente secondes est faux vingt-neuf secondes sur trente.
 */

const couleurs = (barres: { df: [number, number, number, number, string] }[]) =>
    barres.map(b => b.df[4]);

describe('MM:SS', () => {
    /**
     * **Toujours cinq caractères.** Une largeur qui change saute à l'œil sur une
     * matrice, et l'on croit que quelque chose s'est passé.
     */
    it('garde la même largeur quelle que soit la durée', () => {
        for (const s of [0, 7, 59, 60, 599, 3599]) {
            expect(enMinutesSecondes(s), `${s} s`).toHaveLength(5);
        }
    });

    it('compte les minutes et les secondes', () => {
        expect(enMinutesSecondes(0)).toBe('00:00');
        expect(enMinutesSecondes(7)).toBe('00:07');
        expect(enMinutesSecondes(754)).toBe('12:34');
    });

    /** Un minuteur de plus d'une heure trente n'est plus un compte à rebours de table. */
    it('plafonne à 99 minutes plutôt que de déborder', () => {
        expect(enMinutesSecondes(99 * 60 + 59)).toBe('99:59');
        expect(enMinutesSecondes(500 * 60)).toBe('99:00');
    });

    it('ne descend jamais sous zéro', () => {
        expect(enMinutesSecondes(-30)).toBe('00:00');
    });
});

describe('le minuteur composé', () => {
    it('affiche le temps restant et une barre', () => {
        const charge = composerMinuteur({ restant: 754, duree: 900 });

        expect(charge.text).toBe('12:34');
        expect(charge.draw.length).toBeGreaterThan(0);
        expect(charge.noScroll).toBe(true);
    });

    /**
     * **La barre se vide en avançant.** Une barre qui se remplit à mesure que le
     * temps passe dirait l'inverse du chiffre — et l'œil croit la barre avant de
     * lire le chiffre.
     */
    it('la barre décroît avec le temps restant', () => {
        const large = composerMinuteur({ restant: 900, duree: 900 });
        const etroite = composerMinuteur({ restant: 90, duree: 900 });

        const pleine = (c: typeof large) => c.draw[c.draw.length - 1].df[2];
        expect(pleine(etroite)).toBeLessThan(pleine(large));
    });

    it('ne déborde jamais de la matrice', () => {
        for (const restant of [0, 1, 450, 900]) {
            for (const { df: [x, , l] } of composerMinuteur({ restant, duree: 900 }).draw) {
                expect(x + l, `${restant} s`).toBeLessThanOrEqual(LARGEUR_DE_LA_MATRICE);
            }
        }
    });

    it('passe à la couleur critique dans les dernières secondes', () => {
        expect(composerMinuteur({ restant: SECONDES_CRITIQUES, duree: 900 }).color)
            .toBe(COULEURS_DU_MINUTEUR.critique);
        expect(composerMinuteur({ restant: SECONDES_CRITIQUES + 1, duree: 900 }).color)
            .toBe(COULEURS_DU_MINUTEUR.encours);
    });

    /**
     * À zéro la barre est **vide** — il ne reste rien, et une barre qui garderait
     * une trace de couleur mentirait. C'est le chiffre qui porte le rouge.
     */
    it('passe au rouge à zéro, et vide la barre', () => {
        const charge = composerMinuteur({ restant: 0, duree: 900 });

        expect(charge.text).toBe('00:00');
        expect(charge.color).toBe(COULEURS_DU_MINUTEUR.fini);
        expect(couleurs(charge.draw)).not.toContain(COULEURS_DU_MINUTEUR.fini);
    });

    /** Sans durée, il n'y a pas de proportion à dessiner — et rien à inventer. */
    it('ne dessine pas de barre sans durée', () => {
        expect(composerMinuteur({ restant: 0, duree: 0 }).draw).toEqual([]);
    });
});

describe('y a-t-il un minuteur à montrer', () => {
    /** Pousser un `00:00` permanent occuperait un tour de rotation pour rien. */
    it('non quand aucun minuteur n’est posé', () => {
        expect(ilYAUnMinuteur({})).toBe(false);
        expect(ilYAUnMinuteur({ timerDuration: 0 })).toBe(false);
    });

    /** *C'est précisément le moment qu'on attend* — il ne part qu'à la remise à zéro. */
    it('oui quand il est arrivé à zéro', () => {
        expect(ilYAUnMinuteur({ timerDuration: 900 })).toBe(true);
    });
});
