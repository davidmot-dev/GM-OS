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
} from './voightKampff';

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

/** Les pics sont les rectangles qui montent au-dessus de la ligne de base. */
const pics = (draw: { df: [number, number, number, number, string] }[]) =>
    draw.filter(r => r.df[3] > 1);
const ligne = (draw: { df: [number, number, number, number, string] }[]) =>
    draw.filter(r => r.df[3] === 1);

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
    it('dessine autant de pics que le niveau', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            expect(pics(traceDuSignal(n)), `niveau ${n}`).toHaveLength(n);
        }
    });

    /** Sans ligne de base, des pics isolés se liraient comme des barres. */
    it('porte une ligne de base d’un bord à l’autre', () => {
        const base = ligne(traceDuSignal(3));
        expect(base).toHaveLength(1);
        expect(base[0].df[2]).toBe(LARGEUR);
    });

    it('ne déborde jamais de la matrice', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            for (let phase = 0; phase < 40; phase++) {
                for (const { df: [x, y, l, h] } of traceDuSignal(n, phase)) {
                    expect(x + l, `niveau ${n}, phase ${phase}`).toBeLessThanOrEqual(LARGEUR);
                    expect(y, `niveau ${n}`).toBeGreaterThanOrEqual(0);
                    expect(y + h).toBeLessThanOrEqual(8);
                }
            }
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

    /** Une phase négative ne doit pas produire de pic hors de l'écran. */
    it('supporte une phase négative', () => {
        for (const { df: [x] } of traceDuSignal(3, -5)) {
            expect(x).toBeGreaterThanOrEqual(0);
        }
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

    /** Une colonne par seconde : la machine tourne, et ça se voit. */
    it('dérive avec le temps', () => {
        const a = composerVoightKampff({ niveau: 3 }, 0);
        const b = composerVoightKampff({ niveau: 3 }, 1000);

        expect(b.draw).not.toEqual(a.draw);
    });

    it('ne dérive pas en deçà de la seconde', () => {
        expect(composerVoightKampff({ niveau: 3 }, 400).draw)
            .toEqual(composerVoightKampff({ niveau: 3 }, 0).draw);
    });
});
