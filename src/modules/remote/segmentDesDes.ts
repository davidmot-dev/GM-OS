import { type RemoteSyncData } from './types/remote.types';

/**
 * **Ce que le meneur envoie du pupitre de dés — et il l'envoie en entier.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-17, David après avoir reçu le choix de matière des dés en 3D :
 * *« je ne vois aucune différence entre résine / verre / métal »*.
 *
 * Il avait raison, et ce n'était pas une affaire de matériau : **le Player Hub
 * n'a jamais reçu le réglage.** Le segment `dice` était construit dans un
 * littéral anonyme — **et il l'était deux fois**, aux deux endroits du
 * synchroniseur — et il ne portait que trois champs :
 *
 * ```ts
 * payload.dice = { lastRoll: s.lastRoll, isDiceProjected: s.isDiceProjected, projectionTrigger: s.projectionTrigger };
 * ```
 *
 * Ni `enable3D` ni `styleDesDes` ne partaient. Le hub gardait donc la valeur
 * qu'il avait lue dans `localStorage` **à son démarrage**, et rien ne pouvait la
 * changer tant qu'il restait ouvert.
 *
 * ⚠️ **`enable3D` était dans ce cas depuis toujours** : la case « Rendu 3D » du
 * pupitre ne faisait rien sur un hub déjà ouvert. Le choix de matière n'a pas
 * créé le défaut, *il l'a rendu visible.*
 *
 * ⭐ ***Un réglage qui ne voyage pas jusqu'à l'écran qui l'applique n'est pas un
 * réglage : c'est un bouton.*** C'est la même famille que les six « le chemin
 * s'arrête avant le moteur » du pupitre, et que les trois champs manquants du
 * segment du tableau blanc le 2026-09-05.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LE REMÈDE EST LE TYPE DE RETOUR, PAS UN ESSAI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un littéral anonyme n'oblige à rien. Une fonction qui promet
 * `RemoteSyncData['dice']` **ne compile pas** s'il lui manque un champ : le jour
 * où un sixième s'ajoute au contrat, `tsc -b` vient le réclamer **ici**, et à un
 * seul endroit.
 *
 * *Une asymétrie entre celui qui écrit et celui qui lit est indétectable par
 * construction tant qu'ils ne partagent pas le type.* Même geste que
 * `segmentDuTableau`, `horlogesPourLaTable` et `jaugesVuesParLesJoueurs`.
 */
export function segmentDesDes(
    magasin: NonNullable<RemoteSyncData['dice']>,
): NonNullable<RemoteSyncData['dice']> {
    return {
        lastRoll: magasin.lastRoll,
        isDiceProjected: magasin.isDiceProjected,
        projectionTrigger: magasin.projectionTrigger,
        enable3D: magasin.enable3D,
        styleDesDes: magasin.styleDesDes,
    };
}
