import { describe, it, expect } from 'vitest';
import { LARGEUR } from './defileDesQuarts';
import {
    accelerer,
    calmer,
    composerVoightKampff,
    couleurDuNiveau,
    NIVEAU_MAX,
    NIVEAU_MIN,
    SIGNAL_INITIAL,
    traceDuSignal,
    CADENCE_DU_SIGNAL_MS,
    type LigneTracee,
} from './voightKampff';
import { CADENCE_RAPIDE_MS } from '../useBattementUlanzi';

/**
 * **Le signal du Voight-Kampff — demandé par David le 2026-08-31.**
 *
 * *« Une sorte de signal électro »*, puis *« quand j'appuie sur un bouton le
 * rythme s'accélère »*.
 *
 * Ce que ces tests gardent : **le rythme se lit à la densité**. La cadence de
 * publication est d'une seconde ; animer le battement lui-même aurait donné un
 * hoquet, pas un signal. Deux pics au repos, six au bout — une accélération se
 * voit d'un coup d'œil, ce que le § 1 exige.
 */

/** Une montée est un segment dont le second point est plus haut que le premier. */
const montees = (draw: LigneTracee[]) => draw.filter(l => l.dl[3] < l.dl[1]);
const descentes = (draw: LigneTracee[]) => draw.filter(l => l.dl[3] > l.dl[1]);

describe('le rythme', () => {
    it('part au repos et s’accélère d’un cran par appui', () => {
        expect(SIGNAL_INITIAL.niveau).toBe(NIVEAU_MIN);
        expect(accelerer(SIGNAL_INITIAL).niveau).toBe(NIVEAU_MIN + 1);
    });

    /** Six pics sur trente-deux colonnes : au-delà on ne les distinguerait plus. */
    it('ne dépasse pas le maximum, ni ne descend sous le repos', () => {
        let etat = SIGNAL_INITIAL;
        for (let i = 0; i < 20; i++) etat = accelerer(etat);
        expect(etat.niveau).toBe(NIVEAU_MAX);

        for (let i = 0; i < 20; i++) etat = calmer(etat);
        expect(etat.niveau).toBe(NIVEAU_MIN);
    });
});

describe('le tracé', () => {
    /**
     * **Une onde triangulaire : ça monte, puis ça descend, linéairement.**
     * Autant de cycles que le niveau — plus un de chaque côté, pour que le
     * décalage ne laisse pas de blanc au bord.
     */
    it('alterne montées et descentes, autant que le niveau', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            const trace = traceDuSignal(n);
            expect(montees(trace).length, `niveau ${n}`).toBeGreaterThanOrEqual(n);
            expect(descentes(trace).length).toBe(montees(trace).length);
        }
    });

    /** Plus le niveau monte, plus les cycles se resserrent : c'est le rythme. */
    it('resserre les cycles quand le rythme s’accélère', () => {
        const periodeDe = (n: number) => {
            const t = traceDuSignal(n);
            return t[2].dl[0] - t[0].dl[0];
        };
        expect(periodeDe(NIVEAU_MAX)).toBeLessThan(periodeDe(NIVEAU_MIN));
    });

    /**
     * ⚠️ **Douze commandes, pas trente-deux.** Mesuré sur l'appareil : un
     * rectangle par colonne coûtait 802 ms et échouait deux fois sur vingt ;
     * les segments coûtent 401 ms et ne ratent pas. *Un dessin trop lourd ne se
     * voit pas dans le code, il se voit sur le fil.*
     */
    it('reste sous une poignée de commandes', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            expect(traceDuSignal(n).length, `niveau ${n}`).toBeLessThanOrEqual(16);
        }
    });

    it('reste dans la hauteur de la matrice', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            for (let phase = 0; phase < 40; phase++) {
                for (const { dl: [, y0, , y1] } of traceDuSignal(n, phase)) {
                    for (const y of [y0, y1]) {
                        expect(y, `niveau ${n}`).toBeGreaterThanOrEqual(0);
                        expect(y).toBeLessThan(8);
                    }
                }
            }
        }
    });

    /**
     * **Le tracé couvre les deux bords, quelle que soit la phase.** Sans le
     * cycle qui démarre avant la colonne zéro, le décalage laisserait un blanc
     * d'un côté à chaque image — et l'œil lirait un tracé qui se recompose
     * plutôt qu'un tracé qui glisse.
     */
    it('déborde volontairement des deux côtés', () => {
        for (let phase = 0; phase < 12; phase++) {
            const trace = traceDuSignal(4, phase);
            expect(trace[0].dl[0], `phase ${phase}`).toBeLessThanOrEqual(0);
            expect(trace[trace.length - 1].dl[2]).toBeGreaterThanOrEqual(LARGEUR);
        }
    });

    /**
     * **La dérive glisse, elle ne saute pas.** La phase est prise modulo
     * l'écart entre deux pics : le motif se répète à cet intervalle-là, et un
     * décalage plus grand ferait sauter le tracé.
     */
    it('revient sur lui-même au bout d’un écart entre deux pics', () => {
        const ecart = Math.floor(LARGEUR / 4);
        expect(traceDuSignal(4, 0)).toEqual(traceDuSignal(4, ecart));
        expect(traceDuSignal(4, 1)).not.toEqual(traceDuSignal(4, 0));
    });

    it('supporte une phase négative sans se replier', () => {
        expect(traceDuSignal(3, -5)).toEqual(traceDuSignal(3, -5 + Math.floor(32 / 3)));
    });
});

/**
 * **La couleur monte avec le rythme, et elle n'est pas réglable.**
 * *On ne rend pas réglable ce qui dit quelque chose.*
 */
describe('la couleur', () => {
    it('va du vert au rouge', () => {
        expect(couleurDuNiveau(NIVEAU_MIN)).toBe('#00C853');
        expect(couleurDuNiveau(NIVEAU_MAX)).toBe('#FF1744');
    });

    it('donne une couleur à chaque niveau, et borne le reste', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            expect(couleurDuNiveau(n), `niveau ${n}`).toMatch(/^#[0-9A-F]{6}$/);
        }
        expect(couleurDuNiveau(99)).toBe(couleurDuNiveau(NIVEAU_MAX));
        expect(couleurDuNiveau(-4)).toBe(couleurDuNiveau(NIVEAU_MIN));
    });
});

describe('ce qui part vers l’appareil', () => {
    /**
     * **Aucun texte, et c'est délibéré.** « VK » dirait aux joueurs ce qu'ils
     * regardent, et le § 4 veut l'inverse : *ils voient le rythme monter et ne
     * savent pas pourquoi.* Nommé, le tracé devient un score.
     */
    it('n’écrit rien — le tracé seul ne se nomme pas', () => {
        expect(composerVoightKampff({ niveau: 3 }, 0).text).toBe('');
    });

    it('ne défile pas', () => {
        expect(composerVoightKampff({ niveau: 3 }, 0).noScroll).toBe(true);
    });

    it('dérive avec le temps', () => {
        const a = composerVoightKampff({ niveau: 3 }, 0);
        const b = composerVoightKampff({ niveau: 3 }, CADENCE_DU_SIGNAL_MS);

        expect(b.draw).not.toEqual(a.draw);
    });

    it('ne dérive pas entre deux images', () => {
        expect(composerVoightKampff({ niveau: 3 }, CADENCE_DU_SIGNAL_MS - 1).draw)
            .toEqual(composerVoightKampff({ niveau: 3 }, 0).draw);
    });

    /**
     * **Les deux cadences doivent rester égales.** Le battement décide *quand*
     * on publie, le compositeur calcule l'image de ce moment-là. Si elles
     * divergeaient, le tracé sauterait ou se figerait — et rien ne le dirait,
     * puisque chaque moitié serait juste de son côté.
     */
    it('calcule ses images à la cadence à laquelle le battement publie', () => {
        expect(CADENCE_DU_SIGNAL_MS).toBe(CADENCE_RAPIDE_MS);
    });
});
