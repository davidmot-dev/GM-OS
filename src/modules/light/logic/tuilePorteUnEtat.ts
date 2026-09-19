/**
 * **Ce que cette fonction exige d'une tuile, et rien de plus.**
 *
 * Volontairement plus lâche que `LightScene` : elle est appelée sur le magasin,
 * où tout est garanti, **et sur le contenu d'un fichier de sauvegarde**, où rien
 * ne l'est. *Une fonction qui juge des données venues du disque ne peut pas
 * exiger qu'elles soient bien formées — c'est précisément ce qu'elle vérifie.*
 */
export interface TuileLisible {
    lightStates?: Record<string, unknown> | null;
}

/**
 * **Une tuile porte-t-elle du travail ?**
 *
 * Les dix-huit tuiles de Light-OS **existent toujours** : `createDefaultScenes`
 * les fabrique au premier lancement et elles ne disparaissent jamais. Compter
 * les tuiles ne dit donc rien — une base neuve en a dix-huit comme une base
 * remplie. Ce qui distingue les deux, c'est qu'une tuile au moins tienne
 * l'état d'une lampe.
 *
 * ⛔ **C'est ce qui rend le contrôle « un instantané vide n'en remplace jamais
 * un plein » piégeux ici.** Le `?.length` qui protège les playlists de Music-OS
 * et les gabarits du bestiaire compte les éléments d'une liste ; posé sur cet
 * enregistrement il vaudrait **18 quoi qu'il arrive**, et laisserait un râtelier
 * neuf écraser une soirée de captures. *Un contrôle qui se croit posé et ne
 * refuse rien est pire qu'un contrôle absent.*
 *
 * ⚠️ Trois écrans calculent déjà ce même verdict à la main — la grille
 * (`hasData`), le sélecteur partagé et la barre latérale. Ils n'ont pas été
 * ramenés ici : ils marchent, et les toucher dépassait le sujet du jour. *Mais
 * ce sont bien quatre endroits qui répondent à une seule question.*
 */
export const tuilePorteUnEtat = (scene: TuileLisible | undefined | null): boolean =>
    Object.keys(scene?.lightStates ?? {}).length > 0;

/**
 * Les tuiles d'un râtelier qui portent du travail.
 *
 * @param scenes l'enregistrement des tuiles, tel qu'il vit dans le magasin ou
 *               tel qu'une sauvegarde le rend — `undefined` compris, parce
 *               qu'une sauvegarde d'avant le 2026-09-19 n'a pas de clé `light`.
 */
export const tuilesQuiPortentUnEtat = <T extends TuileLisible>(
    scenes: Record<string, T> | undefined | null,
): T[] => Object.values(scenes ?? {}).filter(tuilePorteUnEtat);
