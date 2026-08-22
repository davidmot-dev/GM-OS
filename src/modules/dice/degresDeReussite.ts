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
 * Les quatre bornes qui découpent un jet en pourcentage.
 *
 * **Elles sont des BORNES et non des bandes**, parce que c'est ainsi que les
 * livres les impriment : `particuliere` et `significative` sont des plafonds, le
 * dé leur est inférieur ou égal ; `echecParticulier` et `echecTotal` sont des
 * planchers. `null` signifie que **le degré n'existe pas** à ce niveau de
 * chances — ce que les tables impriment « — ». *Zéro aurait voulu dire « la
 * bande commence à zéro », ce qui est faux et se verrait au premier jet.*
 *
 * **Les nombres viennent de chaque jeu ; le découpage, lui, est commun.**
 */
export interface EchelleDuJet {
    /** Le pourcentage à ne pas dépasser au dé. */
    chances: number;
    particuliere: number | null;
    significative: number | null;
    echecParticulier: number | null;
    echecTotal: number | null;
}

/**
 * Qualifie un résultat de dé sur l'échelle d'un jet.
 *
 * **L'ordre des comparaisons est la règle**, et il se lit du meilleur au pire
 * puis du pire au moins pire : une particulière est aussi sous le plafond de la
 * significative, et un échec total est aussi au-dessus du plancher du
 * particulier. *Inverser deux lignes rendrait un degré toujours plausible et
 * toujours faux* — le genre de défaut qui ne se voit pas en séance.
 */
export function degreDuDe(de: number, echelle: EchelleDuJet, facesDuDe = 100): DegreDeReussite {
    const { chances, particuliere, significative, echecParticulier, echecTotal } = echelle;

    /*
      **LE « 00 » NE RÉUSSIT JAMAIS.** C'est la convention du d100, et la table
      de Rêves de Dragons l'impose sans le dire : à 96-100 % de chances, tout
      résultat est inférieur ou égal aux chances, et pourtant la ligne porte
      encore un échec total à 00. Cette colonne n'a de sens que si le double zéro
      échoue quelles que soient les chances. L'Appel de Cthulhu et RuneQuest
      disent la même chose en toutes lettres.
    */
    const cestUnDoubleZero = de >= facesDuDe;

    if (!cestUnDoubleZero && de <= chances) {
        if (particuliere !== null && de <= particuliere) return 'reussite-particuliere';
        if (significative !== null && de <= significative) return 'reussite-significative';
        return 'reussite-normale';
    }

    /*
      **Au-dessus de cent pour cent, le seul échec possible est NORMAL.** La
      réussite particulière, elle, survit — les tables impriment encore ses
      paliers au-delà de cent —, et c'est pourquoi ce retour vient APRÈS le bloc
      de réussite et non avant.
    */
    if (chances > facesDuDe) return 'echec-normal';

    if (echecTotal !== null && de >= echecTotal) return 'echec-total';
    if (echecParticulier !== null && de >= echecParticulier) return 'echec-particulier';
    return 'echec-normal';
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

/**
 * Le degré d'un résultat, **quelle que soit son ancienneté**.
 *
 * `degre` est né le 2026-08-22 ; `tagSuccess` a des mois. Un jet relu dans une
 * séance enregistrée avant ce jour-là, ou reçu d'une tablette qui n'a pas
 * encore la mise à jour, ne porte que le booléen — et un écran qui n'afficherait
 * alors plus rien se lirait comme un jet qui n'a pas eu lieu.
 *
 * Rend `null` quand il n'y a **ni l'un ni l'autre** : le jet ne se prononce pas,
 * et il ne faut surtout pas trancher à sa place. C'est le cas d'une somme
 * ordinaire — un 2d6 de dégâts n'est ni réussi ni raté.
 */
export function degreOuBooleen(
    degre: DegreDeReussite | undefined,
    reussi: boolean | undefined,
): DegreDeReussite | null {
    if (degre) return degre;
    if (reussi === undefined) return null;
    return degreDepuisLeBooleen(reussi);
}
