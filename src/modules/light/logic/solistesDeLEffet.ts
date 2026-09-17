/**
 * **Combien de lampes peuvent jouer un effet rapide — et lesquelles.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PROBLÈME, MESURÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le pont Hue tient de l'ordre de **dix commandes par seconde, toutes lampes
 * confondues**. `CADENCE_PLANCHER_MS` protège d'**une** lampe emballée ; il ne
 * protège de rien quand elles sont quatre.
 *
 * Relevé le 2026-09-17 sur le catalogue : **douze effets à cadence soutenue
 * dépassent le budget dès quatre lampes**, et les trois plus rapides le
 * dépassent d'un facteur **quatre**.
 *
 * ⚠️ **Ces effets sont donc déjà dégradés aujourd'hui.** Un stroboscope sur
 * quatre lampes envoie quarante commandes par seconde à un pont qui en tient
 * dix : il accumule du retard, *et ce retard ne se voit pas à l'écran — il se
 * voit dans la pièce, une demi-minute plus tard.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LE REMÈDE : DES SOLISTES, PAS UN RALENTISSEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * On pourrait ralentir tout le monde — un plancher qui monterait avec le nombre
 * de lampes. Mais un stroboscope ralenti **cesse d'être un stroboscope** : sa
 * nature *est* sa vitesse.
 *
 * On préfère donc en faire jouer **moins, à la bonne vitesse**. Les autres
 * gardent la couleur que la scène leur a posée — *elles ne font rien, et ne
 * rien faire ne coûte aucune commande.*
 *
 * Décision de David : *« je pencherais pour le soliste »*.
 *
 * **Combien ?** Cela se déduit, cela ne se choisit pas :
 *
 * ```text
 *   solistes = intervalle × budget / 1000
 *
 *   100 ms → 1 lampe    (stroboscope : il mange le budget à lui seul)
 *   200 ms → 2 lampes
 *   300 ms → 3 lampes   (un gyrophare qui rebondit sur trois lampes,
 *                        c'est mieux que sur une)
 * ```
 */

/*
  Le budget vit dans `budgetDuPont` — il était déclaré ici ET dans
  `cadenceDeFusillade`. On le ré-exporte pour les appelants qui le lisaient ici.
*/
export { BUDGET_DU_PONT } from './budgetDuPont';
import { BUDGET_DU_PONT } from './budgetDuPont';

/**
 * **La cadence soutenue des effets qui doivent se rationner.**
 *
 * ⚠️ N'y figurent que ceux dont l'attente est **unique** — ceux qui battent
 * pareil à chaque tour. Un effet qui alterne rafale et repos (`neon`, `sonar`,
 * `panne`…) a un *pic* haut mais une demande moyenne basse : *le pic n'est pas
 * la demande.*
 *
 * ⚠️ Et n'y figurent que ceux qui **dépassent** le budget à quatre lampes. Les
 * autres n'ont rien à se rationner.
 *
 * ⛔ **Cette table recopie des valeurs qui vivent dans `HueEngine`.** Une
 * seconde déclaration de la même vérité dérive toujours — c'est le motif que ce
 * dépôt a payé cinq fois le 2026-08-24. Un essai relit donc le moteur et exige
 * l'accord, *pour que la dérive rougisse au lieu de se taire.*
 */
export const CADENCE_NOMINALE: Record<string, number> = {
    hyperspace: 100,
    stroboscope: 100,
    terminal: 100,
    'cyber-night': 150,
    reacteur: 150,
    tv: 200,
    warp: 200,
    /*
      ⛔ `candle` et `glitch` **partagent le corps** de leur voisin dans le
      `switch` du moteur (`case 'candle': case 'fire':`). Ils avaient été
      oubliés ici, et l'essai de dérive ne les voyait pas non plus — il
      s'arrêtait à l'absence de `break;`. *Deux angles morts qui se
      couvraient l'un l'autre.*
    */
    candle: 250,
    fire: 250,
    glitch: 200,
    lightning: 250,
    disco: 300,
    police: 300,
};

/**
 * **Les effets qui s'arrangent tout seuls, et qu'on ne doit pas rationner deux
 * fois.**
 *
 * ⭐ La `fusillade` en est : son principe **est** le tir croisé sur toutes les
 * lampes, et elle allonge déjà ses pauses selon leur nombre. Lui imposer un
 * soliste par-dessus l'étoufferait deux fois — *et il n'y a pas de tir croisé à
 * une lampe.*
 */
export const EFFETS_ADAPTATIFS = new Set(['fusillade', 'incendie']);

/**
 * Combien de lampes peuvent jouer cet effet à sa vraie vitesse.
 *
 * `null` = aucune limite : l'effet est assez lent pour que tout le monde joue,
 * ou il se rationne lui-même.
 */
export const solistesAdmis = (
    effet: string,
    budget: number = BUDGET_DU_PONT,
): number | null => {
    if (EFFETS_ADAPTATIFS.has(effet)) return null;

    const cadence = CADENCE_NOMINALE[effet];
    if (!cadence) return null;

    /* Au moins une : *un effet qui ne joue sur aucune lampe n'est pas un
       rationnement, c'est une panne.* */
    return Math.max(1, Math.floor((cadence * budget) / 1000));
};

/**
 * **Cette lampe est-elle soliste ?**
 *
 * Le choix se refait à **chaque battement**, jamais au démarrage : les lampes
 * d'une scène partent l'une après l'autre, et celle qui commence ne sait pas
 * encore combien la rejoindront. *Une part calculée une fois ment dès que le
 * nombre de convives change.*
 *
 * ⚠️ **Le tri est ce qui rend le choix stable.** Les premiers identifiants
 * restent les premiers quand d'autres lampes s'ajoutent : les solistes ne
 * changent donc pas en cours de route, et celles qui sont en trop s'arrêtent une
 * fois pour toutes. *Un choix instable ferait osciller les lampes entre les deux
 * rôles, ce qui coûterait précisément les commandes qu'on veut économiser.*
 */
export const estSoliste = (
    id: string,
    idsDeLEffet: string[],
    admis: number | null,
): boolean => {
    if (admis === null) return true;
    const rang = [...idsDeLEffet].sort().indexOf(id);
    /* Inconnue de la liste : on la laisse jouer plutôt que de l'éteindre sur un
       doute. *Une garde qui se trompe est pire qu'une garde absente.* */
    if (rang < 0) return true;
    return rang < admis;
};
