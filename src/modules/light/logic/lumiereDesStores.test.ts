import { describe, it, expect } from 'vitest';
import {
    phaseDeLaLampe, imageDesStores, BRI_OMBRE, BRI_BANDE,
} from './lumiereDesStores';

/**
 * **Ce qui fait que trois lampes dessinent des stores, et non trois pulsations.**
 *
 * L'illusion n'est pas dans l'ampoule — une lampe éclaire uniformément — elle
 * est dans **l'écart entre les ampoules**. Ces essais gardent cet écart, parce
 * que c'est la seule chose qui distingue cet effet d'une respiration de plus.
 */

describe('la place d’une lampe dans le motif', () => {
    it('est stable : la même lampe retrouve toujours sa bande', () => {
        // Sans ça, le motif se recomposerait autrement à chaque scène.
        expect(phaseDeLaLampe('3')).toBe(phaseDeLaLampe('3'));
        expect(phaseDeLaLampe('salon-gauche')).toBe(phaseDeLaLampe('salon-gauche'));
    });

    it('reste entre 0 et 1', () => {
        for (const id of ['1', '2', '3', '17', 'a', 'lampe-du-fond', '']) {
            const p = phaseDeLaLampe(id);
            expect(p, id).toBeGreaterThanOrEqual(0);
            expect(p, id).toBeLessThan(1);
        }
    });

    /**
     * ⛔ **Le cas qui justifie le nombre d'or.**
     *
     * Un pont Hue numérote ses lampes `1`, `2`, `3`. Un simple modulo leur
     * donnerait des phases voisines — donc trois lampes presque dans la même
     * bande, et **aucun motif**. L'or écarte les valeurs proches, c'est sa
     * propriété connue, et c'est tout ce qu'on lui demande.
     */
    it('écarte franchement des identifiants voisins', () => {
        const phases = ['1', '2', '3'].map(phaseDeLaLampe).sort((a, b) => a - b);
        expect(phases[1] - phases[0]).toBeGreaterThan(0.15);
        expect(phases[2] - phases[1]).toBeGreaterThan(0.15);
    });
});

describe('le motif des lames', () => {
    it('reste dans la bande annoncée, jamais éteint', () => {
        /* Une pièce sous des stores garde son jour : l'ombre entre deux lames
           n'est pas du noir, et `bri: 0` n'éteint de toute façon pas une Hue. */
        for (let t = 0; t < 200; t++) {
            const { bri } = imageDesStores(t, 0.3);
            expect(bri).toBeGreaterThanOrEqual(BRI_OMBRE);
            expect(bri).toBeLessThanOrEqual(BRI_BANDE);
        }
    });

    /**
     * ⭐ **La courbe est durcie, et ce test le mesure.**
     *
     * Une sinusoïde pure passe la moitié de son temps dans le tiers médian. Des
     * stores, non : ce sont de larges bandes franches et des transitions
     * courtes. Sans ce durcissement, l'effet ne serait qu'une respiration.
     */
    it('passe l’essentiel du temps dans une bande ou dans l’ombre, pas entre les deux', () => {
        let auxExtremes = 0;
        const tours = 500;
        for (let t = 0; t < tours; t++) {
            const { part } = imageDesStores(t, 0.1);
            if (part < 0.25 || part > 0.75) auxExtremes++;
        }
        expect(auxExtremes / tours).toBeGreaterThan(0.6);
    });

    it('dérive : une même lampe ne reste pas figée dans sa bande', () => {
        const debut = imageDesStores(0, 0.25).bri;
        const plusTard = imageDesStores(40, 0.25).bri;
        expect(Math.abs(plusTard - debut)).toBeGreaterThan(40);
    });

    /**
     * ⭐ **Le cœur de l'effet : au même instant, les lampes ne sont pas au même
     * endroit du motif.** Si elles l'étaient, on aurait trois lampes qui
     * pulsent ensemble — exactement ce que l'effet n'est pas.
     */
    it('place trois lampes à des endroits différents au même instant', () => {
        const trois = ['1', '2', '3'].map(id => imageDesStores(0, phaseDeLaLampe(id)).bri);
        const ecart = Math.max(...trois) - Math.min(...trois);
        expect(ecart).toBeGreaterThan(50);
    });
});
