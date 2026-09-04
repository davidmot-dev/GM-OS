import { type RemoteSyncData } from './types/remote.types';

/**
 * **Ce que le meneur envoie du tableau blanc — et il l'envoie en entier.**
 *
 * Écrit le 2026-09-05, après un défaut qui a duré : le segment était construit
 * dans un littéral anonyme au milieu de `useNexusSynchronizer`, et il portait
 * **quatre** des sept champs que `RemoteSyncData.whiteboard` déclare. Les trois
 * absents — outil, couleur, épaisseur — restaient donc à leur valeur de départ
 * sur la tablette, pour toujours.
 *
 * Ce n'était pas un affichage faux : `RemoteDrawingCanvas` recopie ces trois
 * champs dans **chaque tracé qu'il émet**. Tout ce qui était dessiné depuis une
 * tablette partait en crayon blanc d'épaisseur 3, quel que soit le bouton
 * touché, et **la gomme dessinait au lieu d'effacer**.
 *
 * ⭐ **Le remède est le type de retour, pas un test.** Un littéral anonyme
 * n'oblige à rien ; une fonction qui promet `RemoteSyncData['whiteboard']`
 * **ne compile pas** s'il lui manque un champ. Le jour où un huitième champ
 * s'ajoute au contrat, `tsc -b` vient le réclamer ici — *une asymétrie entre
 * celui qui écrit et celui qui lit est indétectable par construction tant
 * qu'ils ne partagent pas le type*, la règle que l'en-tête de `remote.types.ts`
 * énonçait déjà pour les combattants.
 *
 * C'est le même geste que `horlogesPourLaTable` et `jaugesVuesParLesJoueurs` :
 * *ce qui est caché dans un crochet n'est couvert par rien.*
 */
export function segmentDuTableau(
    magasin: RemoteSyncData['whiteboard'],
): RemoteSyncData['whiteboard'] {
    return {
        paths: magasin.paths,
        activePath: magasin.activePath,
        laserPointer: magasin.laserPointer,
        backgroundMode: magasin.backgroundMode,
        currentTool: magasin.currentTool,
        currentColor: magasin.currentColor,
        currentWidth: magasin.currentWidth,
    };
}
