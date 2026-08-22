/**
 * L'échelle ordonnée des degrés de réussite — **et le seul endroit qui les
 * nomme.**
 *
 * **Pourquoi ce fichier existe.** Jusqu'au 2026-08-22, le résultat d'un jet
 * était un booléen : `RollResult.tagSuccess`. Six écrans le rendaient chacun à
 * leur façon, en trois vocabulaires — « Réussite » en dur dans `TabletHub`,
 * « Succès » en dur dans `RemoteDiceResultOverlay`, deux clés i18n ailleurs, et
 * `PanneauDeJet` qui le rechiffrait en `successes: 1|0`, conversion avec perte.
 *
 * *Ils ne divergeaient pas encore uniquement parce qu'un booléen n'a que deux
 * valeurs.* Ajoutes-en six et ils divergent le jour même : la tablette des
 * joueurs dirait « Succès » quand l'écran du meneur dirait « Réussite
 * significative ». **C'est le motif du projet — plusieurs écrivains pour une
 * même vérité — et le remède est celui du journal de séance : une échelle, un
 * seul endroit qui la nomme.**
 *
 * **Elle n'appartient pas à Rêves de Dragons.** L'Appel de Cthulhu et RuneQuest
 * graduent exactement pareil, en fractions du pourcentage ; Dune porte déjà
 * `critique` et `complication`, deux champs ad hoc qui sont en vérité deux
 * degrés qui ne disent pas leur nom ; Alien distingue réussite et surplus mais
 * l'écrase dans le même booléen. **Chaque jeu apporte ses NOMBRES ; l'échelle,
 * elle, est commune.**
 */

/**
 * Les six degrés, du meilleur au pire.
 *
 * **L'ordre de ce tableau est la donnée** : `rangDuDegre` s'en sert pour
 * comparer, et l'interface pour trier. Le réordonner change le sens du jeu, pas
 * seulement l'affichage.
 */
export const DEGRES_DE_REUSSITE = [
    'reussite-particuliere',
    'reussite-significative',
    'reussite-normale',
    'echec-normal',
    'echec-particulier',
    'echec-total',
] as const;

export type DegreDeReussite = typeof DEGRES_DE_REUSSITE[number];

/**
 * Le rang d'un degré sur l'échelle : 0 pour le meilleur, 5 pour le pire.
 *
 * **Comparer par rang et jamais par nom.** Un `switch` sur les six noms, recopié
 * chez deux appelants, est exactement la forme qui a produit les trois
 * vocabulaires que ce fichier supprime.
 */
export function rangDuDegre(degre: DegreDeReussite): number {
    return DEGRES_DE_REUSSITE.indexOf(degre);
}

/** Les trois degrés qui sont des réussites. Tout le reste est un échec. */
export function estUneReussite(degre: DegreDeReussite): boolean {
    return rangDuDegre(degre) <= rangDuDegre('reussite-normale');
}

/**
 * La clé i18n d'un degré — **la seule façon autorisée de l'écrire à l'écran.**
 *
 * Aucun composant ne compose ce libellé lui-même : c'est ainsi qu'on a obtenu
 * « Réussite » d'un côté de la table et « Succès » de l'autre, pour le même jet,
 * sous les yeux des mêmes joueurs.
 */
export function cleI18nDuDegre(degre: DegreDeReussite): string {
    return `dice.degres.${degre}`;
}

/**
 * Le degré équivalent à l'ancien booléen, pour les jeux qui ne graduent pas.
 *
 * **Un jeu sans degrés n'en gagne pas par notre faute.** Alien, Dune et les
 * jeux à réserve rendent une réussite normale ou un échec normal, et rien
 * d'autre : les quatre degrés extrêmes n'existent pas chez eux, et les
 * fabriquer ferait dire au journal qu'un jet fut spectaculaire alors que le jeu
 * ne le sait pas.
 */
export function degreDepuisLeBooleen(reussi: boolean): DegreDeReussite {
    return reussi ? 'reussite-normale' : 'echec-normal';
}
