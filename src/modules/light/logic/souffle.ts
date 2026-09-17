/**
 * **Un souffle — quatre durées lisibles, deux commandes par cycle.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David après avoir essayé tout le catalogue : *« je ne suis
 * pas convaincu par tous, par exemple respiration »*. La respiration s'écrivait
 * `baseBri + Math.sin(tick * 0.3) * 100`, un point toutes les 2 s. Période
 * réelle : **41,9 secondes**. Un souffle humain en dure 4 à 5. *À l'œil, la
 * lampe ne faisait rien.*
 *
 * Quatre autres effets partageaient la formule — 18,8 s pour `radiation` et
 * `arcane`, **62,8 s** pour `underwater`. Aucun n'était réglé : tous étaient
 * écrits de la même façon, et **la façon d'écrire cachait la durée**.
 *
 * ⭐ ***Une pulsation dont la période s'écrit en radians par tour ne peut pas
 * être relue.*** `0,3` ne ressemble pas à quarante secondes. Ici les quatre
 * durées sont en millisecondes : une erreur d'un facteur dix se voit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ POURQUOI DES IMAGES-CLÉS ET NON UNE COURBE ÉCHANTILLONNÉE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Le pont Hue est médiocre en stroboscopie et excellent en rampe.* Échantillonner
 * une sinusoïde, c'est payer une commande par point pour refaire à la main ce que
 * `transitiontime` fait tout seul, et mieux. Un souffle coûte ici **deux
 * commandes par cycle** — la montée et la descente — au lieu de vingt.
 *
 * Sur un pont qui tient **dix commandes par seconde toutes lampes confondues**,
 * un souffle de 5 s revient à 0,4 cmd/s : vingt lampes peuvent respirer ensemble.
 * L'ancienne version en coûtait 0,5 pour un résultat invisible.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ L'EFFET POSSÈDE SA FORME, LE CURSEUR POSSÈDE SON NIVEAU
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ L'ancienne respiration partait de `baseBri`, **la brillance courante de la
 * lampe** — que le pied de page n'amorce jamais (il pose la couleur, pas la
 * brillance). Conséquence mesurée :
 *
 * | Lampe à | Part du cycle passée collée au plafond |
 * | --- | --- |
 * | 150 | 0 % |
 * | 200 | **31,8 %** |
 * | 254 | **50 %** |
 *
 * *Un effet qui part de la brillance courante n'a pas une forme, il en a autant
 * qu'il y a de lampes* — et sur une lampe déjà vive, la moitié de sa course est
 * amputée par le plafond. Un souffle déclare donc **sa propre bande**. Le niveau
 * reste l'affaire des curseurs : `brillanceEffective` applique par-dessus
 * l'intensité de la tuile et la brillance globale.
 */

/** Les quatre temps d'un souffle, en millisecondes, plus sa bande. */
export interface Souffle {
    /** Brillance au creux (1–254). */
    bas: number;
    /** Brillance au sommet (1–254). */
    haut: number;
    /** Durée de la montée. */
    inspire: number;
    /** Temps passé au sommet avant de redescendre. */
    apnee: number;
    /** Durée de la descente. */
    expire: number;
    /** Temps passé au creux avant de repartir. */
    repos: number;
}

/** Une commande du souffle : où aller, en combien de temps, et quand reprendre. */
export interface ImageDuSouffle {
    bri: number;
    /** En **décisecondes** — c'est l'unité du pont, pas la nôtre. */
    transitiontime: number;
    /** Attente avant la commande suivante, en millisecondes. */
    interval: number;
}

/**
 * Convertit des millisecondes en décisecondes **par défaut vers le bas**.
 *
 * ⚠️ `Math.floor` et non `Math.round`, et c'est le point délicat : arrondir au
 * plus proche peut rendre un fondu **plus long que le battement qui le suit**.
 * La commande suivante arriverait alors avant la fin du fondu — *le fondu ne
 * serait jamais vu, la lampe se contenterait de suivre.* Ce défaut a déjà été
 * payé une fois sur `fantome`, et l'audit du catalogue vient de le retrouver
 * sur `trou-noir`. Ici il est **impossible par construction**, et un essai le
 * vérifie sur tous les souffles déclarés.
 */
const decisecondes = (ms: number): number => Math.max(0, Math.floor(ms / 100));

/**
 * Les deux images d'un cycle.
 *
 * L'apnée et le repos ne coûtent **aucune commande** : ils s'ajoutent à
 * l'attente de l'image qui précède. *La lampe est déjà arrivée, elle n'a rien à
 * faire de plus que rester là.*
 */
export const imagesDuSouffle = (s: Souffle): ImageDuSouffle[] => [
    { bri: s.haut, transitiontime: decisecondes(s.inspire), interval: s.inspire + s.apnee },
    { bri: s.bas, transitiontime: decisecondes(s.expire), interval: s.expire + s.repos },
];

/** L'image que joue ce tour de boucle. */
export const imageDuSouffle = (s: Souffle, tick: number): ImageDuSouffle => {
    const images = imagesDuSouffle(s);
    return images[((tick % images.length) + images.length) % images.length];
};

/** La durée d'un cycle complet, en millisecondes. **Lisible, et c'est le but.** */
export const periodeDuSouffle = (s: Souffle): number =>
    s.inspire + s.apnee + s.expire + s.repos;

/** Ce que ce souffle coûte au pont, par lampe, en commandes par seconde. */
export const debitDuSouffle = (s: Souffle): number =>
    (imagesDuSouffle(s).length * 1000) / periodeDuSouffle(s);

/**
 * Les souffles du catalogue.
 *
 * Chacun est un **geste**, pas un réglage : *feu de camp, bougie et incendie ne
 * sont pas la même chose*, et une respiration humaine n'est pas une houle.
 *
 * | | Période | Ce qu'on reconnaît |
 * | --- | --- | --- |
 * | `respiration` | 5,3 s | un dormeur — l'expire est **plus long** que l'inspire, et il y a un temps mort après |
 * | `arcane` | 7,2 s | une chose qui respire **lentement et fort**, avec une apnée qui inquiète |
 * | `underwater` | 9,0 s | la houle — elle ne s'arrête jamais, donc **ni apnée ni repos** |
 * | `zen` | 12,2 s | le souffle d'une méditation : **long, et il s'arrête** aux deux bouts |
 *
 * ⭐ L'asymétrie inspire/expire est ce qui distingue un souffle d'une sinusoïde.
 * Une sinusoïde monte et descend au même rythme ; *aucun être vivant ne fait ça.*
 */
export const SOUFFLES: Record<'respiration' | 'arcane' | 'underwater' | 'zen', Souffle> = {
    respiration: { bas: 55, haut: 215, inspire: 1500, apnee: 300, expire: 2600, repos: 900 },
    arcane: { bas: 70, haut: 235, inspire: 2200, apnee: 800, expire: 3300, repos: 900 },
    underwater: { bas: 90, haut: 195, inspire: 4000, apnee: 0, expire: 5000, repos: 0 },
    /*
      ⚠️ **`zen` ne faisait rien du tout.** Mesuré : 100 ± 30 de brillance sur une
      période de **377 secondes**, soit une pente maximale de 0,5 point par
      seconde. L'œil s'adapte plus vite que ça — c'était un blanc fixe qui se
      croyait un effet. *Lent est une intention ; imperceptible est une panne.*
    */
    zen: { bas: 70, haut: 150, inspire: 4000, apnee: 1200, expire: 5500, repos: 1500 },
};
