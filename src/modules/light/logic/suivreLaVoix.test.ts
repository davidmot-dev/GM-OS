import { describe, it, expect } from 'vitest';
import {
    BRILLANCE_MAX,
    CADENCE_MS,
    ECART_MINIMAL,
    PLANCHER_PAR_DEFAUT,
    brillanceDeLaVoix,
    doitEnvoyer,
    lisser,
} from './suivreLaVoix';

/**
 * Ce que ces tests protègent : **la lumière suit la voix sans noyer le pont, et
 * sans jamais éteindre la table.**
 *
 * Les deux défauts qu'on ne verrait qu'à la table, et trop tard : un pont Hue
 * saturé, qui rend une lumière en retard sur la voix ; et une pièce qui tombe
 * dans le noir entre deux phrases.
 */

describe('la brillance que demande la voix', () => {
    it('laisse la pénombre au silence, jamais le noir', () => {
        expect(brillanceDeLaVoix(0)).toBe(PLANCHER_PAR_DEFAUT);
        // *Un mode d'ambiance ne doit pas rendre la table inutilisable.*
        expect(brillanceDeLaVoix(0)).toBeGreaterThan(1);
    });

    it('donne la pleine brillance au niveau maximum', () => {
        expect(brillanceDeLaVoix(1)).toBe(BRILLANCE_MAX);
    });

    /**
     * `VoiceEngine` met le RMS à l'échelle (`rms * 5`) : sur un cri, la valeur
     * dépasse le 0-1 qu'elle annonce. **Une entrée hors bornes ne doit pas
     * produire une commande hors bornes** — le pont refuserait la requête, et
     * la lumière se figerait sans que rien ne le dise.
     */
    it('borne une entrée qui sort de l’intervalle annoncé', () => {
        expect(brillanceDeLaVoix(4)).toBe(BRILLANCE_MAX);
        expect(brillanceDeLaVoix(-2)).toBe(PLANCHER_PAR_DEFAUT);
    });

    it('respecte un plancher choisi par le meneur', () => {
        expect(brillanceDeLaVoix(0, 200)).toBe(200);
        expect(brillanceDeLaVoix(1, 200)).toBe(BRILLANCE_MAX);
    });
});

describe('le lissage', () => {
    /**
     * Le patron du *noise gate* de `VoiceEngine` : ouverture rapide, fermeture
     * lente. Une attaque doit se voir quand elle est dite ; une coupure au
     * premier silence entre deux mots ferait clignoter la pièce.
     */
    it('monte plus vite qu’il ne descend', () => {
        const montee = lisser(0, 1) - 0;
        const descente = 1 - lisser(1, 0);
        expect(montee).toBeGreaterThan(descente);
    });

    it('converge vers la mesure sans la dépasser', () => {
        let niveau = 0;
        for (let i = 0; i < 40; i++) niveau = lisser(niveau, 0.8);
        expect(niveau).toBeGreaterThan(0.79);
        expect(niveau).toBeLessThanOrEqual(0.8);
    });

    /** Un silence prolongé doit finir par ramener la pièce à son plancher. */
    it('redescend jusqu’au silence si on le laisse faire', () => {
        let niveau = 1;
        for (let i = 0; i < 200; i++) niveau = lisser(niveau, 0);
        expect(brillanceDeLaVoix(niveau)).toBe(PLANCHER_PAR_DEFAUT);
    });
});

describe('ce qu’on envoie au pont', () => {
    /**
     * **La contrainte qui décide de tout.** Le pont tient une dizaine de
     * commandes par seconde ; le niveau se rafraîchit soixante fois. *Un
     * correctif qui arrive en retard sur un signal temps réel décrit le passé.*
     */
    it('tient la cadence sous la limite du pont', () => {
        expect(1000 / CADENCE_MS).toBeLessThanOrEqual(10);
    });

    it('envoie toujours la première valeur', () => {
        // Sans quoi un mode qu'on vient d'activer resterait muet jusqu'à ce
        // que quelqu'un parle fort.
        expect(doitEnvoyer(PLANCHER_PAR_DEFAUT, null)).toBe(true);
    });

    it('se tait quand l’écart ne se verrait pas', () => {
        expect(doitEnvoyer(100, 100 + ECART_MINIMAL - 1)).toBe(false);
        expect(doitEnvoyer(100, 100 - ECART_MINIMAL + 1)).toBe(false);
    });

    it('parle dès que l’écart se voit, dans les deux sens', () => {
        expect(doitEnvoyer(100, 100 + ECART_MINIMAL)).toBe(true);
        expect(doitEnvoyer(100, 100 - ECART_MINIMAL)).toBe(true);
    });
});
