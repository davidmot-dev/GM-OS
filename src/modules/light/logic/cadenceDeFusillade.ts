/**
 * **Le rythme d'une fusillade — et pourquoi c'est un problème de budget avant
 * d'être un problème d'ambiance.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA CONTRAINTE, D'ABORD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le pont Hue tient de l'ordre de **dix commandes par seconde, toutes lampes
 * confondues**. Le plancher de cadence (`CADENCE_PLANCHER_MS = 100`) protège le
 * pont d'**une** lampe emballée — il ne protège de rien quand elles sont
 * quatre : quatre boucles à 100 ms en demandent **quarante**.
 *
 * Une fusillade est l'effet qui réveille ce plafond, parce que c'est le seul qui
 * veuille battre vite *et* longtemps.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QUI LA SAUVE : UNE FUSILLADE EST SURTOUT DU SILENCE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Des rafales courtes, des pauses longues. Le débit **moyen** reste donc bas
 * même quand la pointe est haute — et c'est ce qui permet de tenir le budget
 * sans renoncer au crépitement.
 *
 * Un coup de feu occupe **deux battements** : l'éclair, puis le noir. À 100 ms
 * par battement — le plancher — cela fait 200 ms par coup, soit environ trois
 * cents coups/minute. Moins qu'une arme réelle, assez pour que l'œil lise une
 * rafale.
 *
 * **Chaque lampe ne peut occuper qu'un `L`-ième du budget**, et la pause qui suit
 * une rafale est le prix qu'elle paie pour l'avoir dépassé pendant sa rafale. Le
 * calcul exact vit dans {@link plancherDePause}.
 *
 * ⛔ **La première version prenait une rafale « de référence » à trois coups pour
 * ce calcul.** L'essai de budget l'a réfutée : **11,9 commandes par seconde à six
 * lampes**, pour un pont qui en tient dix. Les rafales vont de deux à cinq coups,
 * et *une moyenne n'acquitte pas les cas au-dessus d'elle.* La pause se calcule
 * donc sur la longueur **réelle** de la rafale qu'elle suit — une rafale de cinq
 * coups coûte plus cher qu'une rafale de deux.
 *
 * Deux lampes ça crépite, six lampes ça crépite autant — *chacune tire moins
 * souvent, mais elles ne tirent pas ensemble.*
 *
 * ⭐ **Le budget devient un réglage au lieu d'être un mur.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET AUCUN CHEF D'ORCHESTRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Chaque lampe a sa propre boucle et son propre hasard : elles se décalent
 * toutes seules dès la première pause. *L'œil lit des tirs croisés là où il n'y
 * a que de l'indépendance.* Un coordinateur central coûterait un état partagé,
 * une resynchronisation à chaque lampe qui entre ou sort — pour un résultat
 * moins vivant.
 */

import { BUDGET_DU_PONT } from './budgetDuPont';

/** Le battement le plus court qu'on s'autorise : le plancher du pont. */
export const BATTEMENT_MS = 100;

/** Une rafale tient entre deux et cinq coups. */
export const COUPS_MIN = 2;
export const COUPS_MAX = 5;

/** La pause entre deux rafales, avant la correction par le nombre de lampes. */
export const PAUSE_MIN_MS = 400;
export const PAUSE_MAX_MS = 1800;

/*
  ⛔ Ce fichier déclarait sa propre `BUDGET_DU_PONT = 10`, et `solistesDeLEffet`
  la sienne, le même jour. *Une seconde déclaration de la même vérité dérive
  toujours.* Elle vit désormais dans `budgetDuPont`.
*/

export interface Battement {
    /** Ce battement est-il un éclair de bouche ? Sinon, c'est le noir d'après. */
    eclair: boolean;
    /** L'attente avant le battement suivant. */
    attenteMs: number;
    /** Ce que le battement suivant devra recevoir. */
    etat: EtatDeRafale;
}

/**
 * Ce qu'une lampe garde d'un battement à l'autre.
 *
 * ⚠️ **`coups` est là et pas ailleurs.** La pause qui suit une rafale se calcule
 * depuis sa **longueur réelle** — une rafale de cinq coups doit être payée plus
 * cher qu'une rafale de deux. Une première version prenait une rafale « de
 * référence » à trois coups : *l'essai de budget a montré 11,9 commandes par
 * seconde à six lampes, pour un pont qui en tient dix.* **Une moyenne n'acquitte
 * pas les cas au-dessus d'elle.**
 */
export interface EtatDeRafale {
    /** Battements restants dans la rafale. Zéro = il faut en ouvrir une. */
    restants: number;
    /** Coups de la rafale en cours — ce qui décide du prix de sa pause. */
    coups: number;
}

export const RAFALE_AU_REPOS: EtatDeRafale = { restants: 0, coups: 0 };

/**
 * **Le plancher de pause d'une rafale de `coups` coups, quand `lampes` tirent.**
 *
 * Une rafale de `n` coups occupe `2n` battements : `2n − 1` séparés du plancher
 * `B`, puis celui qui porte la pause `P`. Sur un cycle complet, une lampe émet
 * donc `2n` commandes en `(2n − 1)B + P` millisecondes. Pour que `L` lampes
 * tiennent ensemble sous le débit `D` du pont :
 *
 * ```text
 *   L × 2n / ((2n − 1)B + P)  ≤  D / 1000
 *   ⇒  P  ≥  (1000 × L × 2n / D) − (2n − 1)B
 * ```
 *
 * Avec `B = 100` et `D = 10`, cela se lit simplement : **200 n (L − 1) + 100**.
 * Une lampe seule ne doit donc que 100 ms — *rien ne la concurrence.*
 */
export const plancherDePause = (coups: number, lampes: number): number => {
    const n = Number.isFinite(coups) && coups > 0 ? coups : COUPS_MIN;
    const L = Number.isFinite(lampes) && lampes > 0 ? Math.floor(lampes) : 1;
    const battements = 2 * n;
    return Math.max(
        0,
        Math.ceil((1000 * L * battements) / BUDGET_DU_PONT - (battements - 1) * BATTEMENT_MS),
    );
};

/**
 * Le battement suivant d'une lampe en fusillade.
 *
 * @param etat ce que le battement précédent a laissé (`RAFALE_AU_REPOS` au départ)
 * @param lampes combien de lampes jouent la fusillade en ce moment
 * @param hasard injecté pour les essais — `Math.random` en vrai
 */
export const prochainBattement = (
    etat: EtatDeRafale,
    lampes: number,
    hasard: () => number = Math.random,
): Battement => {
    /* Une rafale commence : le premier battement est toujours un éclair. */
    if (etat.restants <= 0) {
        const coups = COUPS_MIN + Math.floor(hasard() * (COUPS_MAX - COUPS_MIN + 1));
        return {
            eclair: true,
            attenteMs: BATTEMENT_MS,
            etat: { restants: coups * 2 - 1, coups },
        };
    }

    /*
      La rafale court. Les battements alternent, et la parité dit lequel : après
      l'éclair d'ouverture il reste un nombre **impair**, donc impair = noir.
    */
    const eclair = etat.restants % 2 === 0;
    const restants = etat.restants - 1;

    /* Le dernier battement d'une rafale est un noir, et c'est lui qui ouvre la
       pause — *on ne laisse jamais la pièce en pleine lumière pendant le
       silence.* */
    if (restants === 0) {
        const tiree = PAUSE_MIN_MS + hasard() * (PAUSE_MAX_MS - PAUSE_MIN_MS);
        const attenteMs = Math.round(Math.max(tiree, plancherDePause(etat.coups, lampes)));
        return { eclair, attenteMs, etat: RAFALE_AU_REPOS };
    }

    return { eclair, attenteMs: BATTEMENT_MS, etat: { restants, coups: etat.coups } };
};
