import { describe, it, expect } from 'vitest';
import {
    debitDuSouffle,
    imageDuSouffle,
    imagesDuSouffle,
    periodeDuSouffle,
    SOUFFLES,
    type Souffle,
} from './souffle';

/**
 * **Ce que ces essais protègent : qu'une respiration dure le temps d'un souffle.**
 *
 * ⛔ Défaut trouvé par David à l'écran le 2026-09-17 : *« je ne suis pas
 * convaincu par tous, par exemple respiration »*. Période mesurée dans
 * l'ancien code : **41,9 secondes**, contre 4 à 5 pour un souffle humain.
 *
 * ⚠️ **Aucun essai ne pouvait le voir**, et c'est le vrai enseignement : la
 * période était écrite `Math.sin(tick * 0.3)` et multipliée par un `interval`
 * posé vingt lignes plus bas. *Rien dans ce code ne ressemblait à une durée*,
 * donc rien ne pouvait en vérifier une. La correction n'est pas un réglage,
 * c'est un changement de vocabulaire : quatre durées en millisecondes.
 */

describe('la forme d’un souffle', () => {
    const s: Souffle = { bas: 50, haut: 200, inspire: 1500, apnee: 300, expire: 2500, repos: 700 };

    it('tient en deux commandes par cycle', () => {
        expect(imagesDuSouffle(s)).toHaveLength(2);
    });

    it('monte jusqu’au haut puis redescend jusqu’au bas', () => {
        const [montee, descente] = imagesDuSouffle(s);
        expect(montee.bri).toBe(200);
        expect(descente.bri).toBe(50);
    });

    /** L'apnée et le repos sont des attentes, pas des commandes. */
    it('facture l’apnée et le repos à l’attente, pas au pont', () => {
        const [montee, descente] = imagesDuSouffle(s);
        expect(montee.interval).toBe(1500 + 300);
        expect(descente.interval).toBe(2500 + 700);
    });

    it('dit sa période en clair', () => {
        expect(periodeDuSouffle(s)).toBe(5000);
    });

    it('alterne, et supporte un tour négatif', () => {
        expect(imageDuSouffle(s, 0).bri).toBe(200);
        expect(imageDuSouffle(s, 1).bri).toBe(50);
        expect(imageDuSouffle(s, 2).bri).toBe(200);
        expect(imageDuSouffle(s, -1).bri).toBe(50);
    });
});

/**
 * ⭐ **La règle qui vaut pour tout le module.**
 *
 * Un fondu plus long que le battement qui le suit **n'est jamais vu** : la
 * commande suivante arrive avant qu'il soit fini, et la lampe se contente de
 * suivre. Ce défaut a été payé sur `fantome` en septembre, et l'audit du
 * 2026-09-17 l'a retrouvé sur `trou-noir`.
 *
 * Ici il est rendu **impossible par construction** — `decisecondes` arrondit
 * vers le bas — et cet essai garde la construction.
 */
describe('un souffle ne fond jamais plus longtemps qu’il n’attend', () => {
    const cas: Souffle[] = [
        ...Object.values(SOUFFLES),
        /* Les durées piégeuses : celles qui ne tombent pas juste en décisecondes. */
        { bas: 10, haut: 250, inspire: 1650, apnee: 0, expire: 999, repos: 0 },
        { bas: 10, haut: 250, inspire: 99, apnee: 0, expire: 1, repos: 0 },
    ];

    it.each(cas.map((s, i) => [i, s] as const))('cas %i', (_i, s) => {
        imagesDuSouffle(s).forEach(image => {
            expect(image.transitiontime * 100).toBeLessThanOrEqual(image.interval);
        });
    });
});

/**
 * Les souffles du catalogue, jugés sur ce qu'ils prétendent être.
 *
 * ⚠️ Ces bornes ne sont pas des goûts : ce sont les **ordres de grandeur** qui
 * séparent un souffle d'une marée. Les resserrer serait figer un réglage ;
 * les retirer laisserait revenir les 41,9 secondes.
 */
describe('les souffles du catalogue', () => {
    it('la respiration dure le temps d’un souffle humain', () => {
        const p = periodeDuSouffle(SOUFFLES.respiration) / 1000;
        expect(p).toBeGreaterThan(3);
        expect(p).toBeLessThan(8);
    });

    /** *Aucun être vivant ne monte et descend au même rythme.* */
    it('l’expire est plus long que l’inspire', () => {
        expect(SOUFFLES.respiration.expire).toBeGreaterThan(SOUFFLES.respiration.inspire);
        expect(SOUFFLES.arcane.expire).toBeGreaterThan(SOUFFLES.arcane.inspire);
    });

    /** La houle ne s'arrête pas — c'est ce qui la sépare d'un souffle. */
    it('la houle n’a ni apnée ni repos, et elle est la plus lente', () => {
        expect(SOUFFLES.underwater.apnee).toBe(0);
        expect(SOUFFLES.underwater.repos).toBe(0);
        expect(periodeDuSouffle(SOUFFLES.underwater))
            .toBeGreaterThan(periodeDuSouffle(SOUFFLES.arcane));
    });

    it('chacun garde sa bande dans la plage du matériel', () => {
        Object.values(SOUFFLES).forEach(s => {
            expect(s.bas).toBeGreaterThanOrEqual(1);
            expect(s.haut).toBeLessThanOrEqual(254);
            expect(s.haut).toBeGreaterThan(s.bas);
        });
    });

    /**
     * ⛔ Le pont tient **dix commandes par seconde toutes lampes confondues**.
     * Un souffle est un effet d'ambiance : il doit pouvoir tourner sur toutes
     * les lampes de la pièce sans manger le budget d'un effet vif.
     */
    it('coûte assez peu pour que toute la pièce respire ensemble', () => {
        Object.entries(SOUFFLES).forEach(([nom, s]) => {
            expect(debitDuSouffle(s), nom).toBeLessThan(0.7);
        });
    });
});
