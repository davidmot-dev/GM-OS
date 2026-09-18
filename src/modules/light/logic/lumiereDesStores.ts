/**
 * **La lumière qui passe à travers des stores.**
 *
 * Demandé par David le 2026-09-18, avec une prudence qui méritait d'être
 * relevée : *« sur 2 ou 3 lumières ? Si ce n'est pas possible ce n'est pas
 * grave. »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI N'EST PAS POSSIBLE, ET CE QUI L'EST
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Une lampe ne sait pas faire de rayures.** Elle éclaire uniformément : il n'y
 * a ni lame, ni ombre portée, ni géométrie. Un effet de stores rendu sur une
 * seule ampoule ne serait qu'une pulsation de plus — *et ce dépôt a déjà payé
 * deux effets qui n'étaient qu'un seul corps.*
 *
 * ⭐ **Ce qui est possible tient à ce que David a écrit sans le souligner : « sur
 * 2 ou 3 lumières ».** Les lames ne vivent pas dans une lampe, elles vivent
 * **entre** les lampes. Chacune se place à un endroit différent du motif : l'une
 * dans une bande claire, l'autre dans l'ombre, la troisième au bord. La pièce
 * devient inégale, et c'est exactement ce que font des stores. *L'illusion n'est
 * pas dans l'ampoule, elle est dans l'écart entre les ampoules.*
 *
 * Le motif **dérive** ensuite, très lentement — le soleil qui tourne, la lame
 * qui bouge. C'est ce glissement qui empêche la pièce de ressembler à trois
 * lampes mal réglées.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN DÉCALAGE CALCULÉ, ET NON TIRÉ AU SORT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `fusillade` décorrèle ses lampes par le hasard, et c'est juste pour elle : une
 * fusillade désordonnée est une bonne fusillade. **Des stores, non.** Leurs
 * lames sont régulières, et surtout elles ne bougent pas quand on rallume : une
 * lampe doit retrouver *sa* bande, sinon le motif se recompose différemment à
 * chaque scène.
 *
 * Le décalage vient donc de l'identifiant de la lampe, par un calcul stable —
 * *deux lampes ont toujours le même écart, et il survit à un redémarrage.*
 */

/** Le nombre d'or, pour étaler les phases sans les agglutiner. */
const OR = 0.618033988749895;

/**
 * La place d'une lampe dans le motif, entre 0 et 1.
 *
 * ⚠️ **Étalée par le nombre d'or, et pas par un simple modulo.** Des
 * identifiants voisins — `1`, `2`, `3`, ce que rend un pont Hue — donneraient
 * des phases voisines, donc trois lampes presque dans la même bande : le motif
 * n'existerait pas. La multiplication par l'or écarte les valeurs proches, et
 * c'est sa propriété connue.
 */
export function phaseDeLaLampe(id: string): number {
    let somme = 0;
    for (let i = 0; i < id.length; i++) {
        somme = (somme * 31 + id.charCodeAt(i)) % 100000;
    }
    return (somme * OR) % 1;
}

/** Ce qu'une lampe doit rendre à un instant donné du motif. */
export interface ImageDesStores {
    /** La brillance, dans la bande absolue de l'effet. */
    bri: number;
    /**
     * Où l'on est dans la lame, de 0 (pleine ombre) à 1 (plein jour).
     *
     * L'appelant s'en sert pour la teinte : la lumière qui rase une lame se
     * réchauffe, celle qui passe tout droit reste franche.
     */
    part: number;
}

/** Brillance de l'ombre entre deux lames. Jamais noir : une pièce garde son jour. */
export const BRI_OMBRE = 70;
/** Brillance d'une bande en plein jour. */
export const BRI_BANDE = 235;

/**
 * Le motif à un instant, pour une lampe donnée.
 *
 * ⭐ **La courbe est une sinusoïde DURCIE, et c'est ce qui fait la lame.** Une
 * sinusoïde pure donne une respiration — le sommet et le creux n'y durent qu'un
 * instant. Des stores, c'est l'inverse : de larges bandes franches et des
 * transitions courtes. On écrase donc la courbe vers ses extrêmes, ce qui
 * allonge les plateaux sans introduire de marche d'escalier.
 *
 * @param tick Le battement de la lampe, qui part de zéro.
 * @param phase Sa place dans le motif — voir {@link phaseDeLaLampe}.
 * @param pasParTour De combien le motif dérive à chaque battement, en tours.
 */
export function imageDesStores(tick: number, phase: number, pasParTour = 0.012): ImageDesStores {
    const angle = (phase + tick * pasParTour) * Math.PI * 2;

    /* De -1..1 vers 0..1, puis durcissement : `x³` garde les extrêmes et creuse
       le milieu, donc les transitions se resserrent et les bandes s'élargissent. */
    const doux = (Math.sin(angle) + 1) / 2;
    const dur = doux < 0.5
        ? 4 * doux * doux * doux
        : 1 - 4 * (1 - doux) * (1 - doux) * (1 - doux);

    return {
        bri: Math.round(BRI_OMBRE + (BRI_BANDE - BRI_OMBRE) * dur),
        part: dur,
    };
}
