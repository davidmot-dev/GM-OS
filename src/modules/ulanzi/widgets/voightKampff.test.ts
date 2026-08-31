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
    formeDuBattement,
    BUDGET_DE_SEGMENTS,
    CADENCE_DU_SIGNAL_MS,
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
 * hoquet, pas un signal. Un battement au repos, six au bout — une accélération
 * se voit d'un coup d'œil, ce que le § 1 exige.
 *
 * **Et le budget de segments dessine.** *Mesuré, pas choisi* : douze segments
 * coûtent 401 ms sans jamais rater, trente-deux en coûtent 802 et échouent deux
 * fois sur vingt. Six complexes détaillés en demanderaient plus de quarante — le
 * détail diminue donc quand le rythme monte.
 */

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
     * **Une ligne de repos, ponctuée de battements.** C'est elle qui distingue
     * l'électro de l'onde triangulaire qu'il remplace — et elle ne coûte qu'un
     * segment pour toute la largeur, ce qui est exactement ce qui rend le
     * dessin payable.
     */
    it('pose une ligne de repos d’un bord à l’autre', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            const [{ dl: [x0, y0, x1, y1] }] = traceDuSignal(n);
            expect([x0, x1], `niveau ${n}`).toEqual([0, LARGEUR - 1]);
            expect(y0, 'plate, donc de même hauteur aux deux bouts').toBe(y1);
        }
    });

    /** Le pic monte au-dessus de la ligne, à chaque niveau. */
    it('bat au-dessus de la ligne de repos', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            const trace = traceDuSignal(n);
            const ligne = trace[0].dl[1];
            const plusHaut = Math.min(...trace.flatMap(({ dl: [, y0, , y1] }) => [y0, y1]));
            expect(plusHaut, `niveau ${n}`).toBeLessThan(ligne);
        }
    });

    /** Plus le niveau monte, plus les battements se resserrent : c'est le rythme. */
    it('resserre les battements quand le rythme s’accélère', () => {
        const debuts = (n: number) => traceDuSignal(n).slice(1).map(l => l.dl[0]);
        const ecart = (n: number) => Math.max(...debuts(n)) - Math.min(...debuts(n));
        // À rythme égal on couvre la même largeur ; c'est le NOMBRE de
        // battements qui change, donc le compte de segments qui monte.
        expect(traceDuSignal(NIVEAU_MAX).length).toBeGreaterThan(traceDuSignal(NIVEAU_MIN).length);
        expect(ecart(NIVEAU_MAX)).toBeGreaterThan(0);
    });

    /**
     * **Le budget mesuré choisit la forme du battement.**
     *
     * On ne peut pas afficher six complexes détaillés sur trente-deux
     * colonnes : il en faudrait plus de quarante segments. Le détail diminue
     * donc quand le rythme monte — *ce qui est aussi ce que fait un vrai
     * moniteur à vitesse de défilement constante.*
     */
    it('garde le battement le plus riche que le budget autorise', () => {
        // Au repos, un battement tous les trente-deux pixels : la place existe.
        expect(formeDuBattement(LARGEUR).nom).toBe('qrs-et-t');
        // Au bout, un tous les cinq : il ne reste que le pic.
        expect(formeDuBattement(Math.floor(LARGEUR / NIVEAU_MAX)).nom).toBe('pic');
    });

    /**
     * ⚠️ **Douze commandes, pas trente-deux.** Mesuré sur l'appareil : un
     * rectangle par colonne coûtait 802 ms et échouait deux fois sur vingt ;
     * les segments coûtent 401 ms et ne ratent pas. *Un dessin trop lourd ne se
     * voit pas dans le code, il se voit sur le fil.*
     */
    it('reste sous une poignée de commandes', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            for (let phase = 0; phase < 40; phase++) {
                expect(traceDuSignal(n, phase).length, `niveau ${n}, phase ${phase}`)
                    .toBeLessThanOrEqual(BUDGET_DE_SEGMENTS);
            }
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
    it('fait ENTRER les battements par la gauche au lieu de les faire apparaître', () => {
        // Un battement qui naîtrait entier au bord se lirait comme un
        // clignotement. On en dessine donc un avant la colonne zéro, tant
        // qu'une part de lui se voit.
        const aCheval = Array.from({ length: 16 }, (_, phase) =>
            traceDuSignal(4, phase).slice(1).some(({ dl: [x0, , x1] }) => x0 < 0 && x1 >= 0));
        expect(aCheval.some(Boolean), 'aucun battement n’entre par le bord').toBe(true);
    });

    /**
     * **Et un battement entièrement hors matrice ne coûte rien.** C'est ce qui a
     * ramené le tracé dans son budget : le premier rendu en dessinait un que
     * personne ne voyait, et dépassait de moitié.
     */
    it('ne dépense aucun segment pour ce qui ne se voit pas', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            for (let phase = 0; phase < 40; phase++) {
                for (const { dl: [x0, , x1] } of traceDuSignal(n, phase)) {
                    expect(Math.max(x0, x1), `niveau ${n}, phase ${phase}`).toBeGreaterThanOrEqual(0);
                    expect(Math.min(x0, x1)).toBeLessThan(LARGEUR);
                }
            }
        }
    });

    /**
     * **La dérive glisse, elle ne saute pas.** La phase est prise modulo
     * l'écart entre deux pics : le motif se répète à cet intervalle-là, et un
     * décalage plus grand ferait sauter le tracé.
     */
    it('revient sur lui-même au bout d’un écart entre deux battements', () => {
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
