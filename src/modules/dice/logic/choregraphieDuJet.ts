/**
 * **Le déroulé d'un jet à l'écran : les dés roulent, puis s'effacent, et le
 * résultat reste.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE DAVID A DEMANDÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-17 : *« les dés doivent disparaître et le résultat doit rester
 * affiché 5 secondes supplémentaires après »*.
 *
 * L'ancien déroulé n'avait qu'une durée : **tout** disparaissait cinq secondes
 * après le lancer. Or en 3D le panneau n'apparaît qu'après 1,5 s — *il restait
 * donc trois secondes et demie pour lire un résultat*, pendant que les dés
 * finissaient de rouler par-dessus.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LA POSE EST UN ÉVÉNEMENT, PAS UNE DURÉE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Combien de temps met un jet à se poser ? *Ça dépend* — du nombre de dés, des
 * rebonds, du hasard des vitesses initiales. Une durée fixe couperait les dés en
 * plein vol, ou les laisserait posés à ne rien faire.
 *
 * C'est donc la scène 3D qui **signale** quand tout est posé, et le compte de
 * cinq secondes part de là.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ UN SIGNAL QU'ON ATTEND DOIT TOUJOURS AVOIR UNE ÉCHÉANCE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Attendre un événement sans filet, c'est un écran figé le jour où l'événement
 * ne vient pas — *un destinataire sans expéditeur ne lève aucune erreur : il
 * attend.* Ce dépôt l'a déjà payé sur la tablette, qui guettait un `dice:result`
 * que personne n'émettait.
 *
 * Il y a donc **deux filets, et ils dégradent tous les deux vers ce qui existait
 * avant** :
 *
 * 1. **Dans la scène** : passé {@link PLAFOND_DE_CHUTE_MS}, les dés sont déclarés
 *    posés même s'ils remuent encore.
 * 2. **Dans le hub** : le compte de cinq secondes démarre **dès le lancer**, et
 *    le signal de pose ne fait que le *redémarrer*. Si personne ne signale
 *    jamais — la tablette n'a pas de 3D, et c'est normal — la fenêtre reste
 *    exactement celle d'aujourd'hui.
 *
 * ⭐ ***Un filet qui dégrade vers le comportement existant ne peut pas
 * surprendre*** : au pire, on retrouve ce qu'on avait.
 */

/**
 * Combien de temps les dés **restent visibles une fois posés**, avant de
 * s'effacer.
 *
 * Demandé par David le 2026-09-17 : *« est-ce que tu peux les laisser visibles 2
 * secondes de plus ? »*. ⭐ *Se poser et disparaître dans le même instant ne
 * laisse pas voir ce qu'on vient de lancer* — le dé doit exister posé, pas
 * seulement en vol.
 */
export const DUREE_DE_MAINTIEN_MS = 2000;

/** Combien de temps le résultat reste lisible **une fois les dés effacés**. */
export const DUREE_DU_RESULTAT_MS = 5000;

/**
 * Au-delà, les dés sont déclarés posés quoi qu'ils fassent.
 *
 * ⚠️ Il ne s'agit pas d'être patient : *un dé qui micro-rebondit indéfiniment ne
 * doit pas retenir le résultat en otage.*
 */
export const PLAFOND_DE_CHUTE_MS = 4000;

/** Le temps que met la disparition des dés, pour que le fondu ait sa place. */
export const DUREE_DE_DISPARITION_MS = 700;

/**
 * La durée totale d'un jet à l'écran, du lancer à l'effacement complet.
 *
 * *Elle se lit en une ligne* — c'est tout l'intérêt de la sortir du milieu d'un
 * `setTimeout` : la question « combien de temps un joueur voit-il son jet ? »
 * avait une réponse qui n'existait nulle part.
 */
export const dureeTotaleDuJet = (dureeDeChuteMs: number): number =>
    Math.min(dureeDeChuteMs, PLAFOND_DE_CHUTE_MS)
    + DUREE_DE_MAINTIEN_MS
    + DUREE_DU_RESULTAT_MS;
