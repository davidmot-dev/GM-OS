import type { Acte, Scene } from '../../../types/trame.types';

/**
 * La lecture de la trame : ordonner, mesurer, et dire ce qu'une suppression
 * emporte.
 *
 * **Pourquoi des fonctions pures et non des méthodes du store.** L'écran de
 * trame, la Forge de campagne et — plus tard — la capture en séance liront tous
 * cette structure. Trois lectures écrites séparément finiraient par ne plus
 * ranger les scènes dans le même ordre, et c'est le genre d'écart qu'on ne voit
 * qu'en pleine partie. Même raison que `piloteDuPersonnage`.
 */

/** Les actes d'une campagne, dans leur ordre. */
export function actesOrdonnes(actes: readonly Acte[], campaignId: string | null | undefined): Acte[] {
    if (!campaignId) return [];
    return actes.filter(a => a.campaignId === campaignId).sort((a, b) => a.ordre - b.ordre);
}

/** Les scènes d'un acte, dans leur ordre. */
export function scenesOrdonnees(scenes: readonly Scene[], acteId: string | null | undefined): Scene[] {
    if (!acteId) return [];
    return scenes.filter(s => s.acteId === acteId).sort((a, b) => a.ordre - b.ordre);
}

/** Le rang qu'occuperait un nouvel élément à la fin de la liste. */
export function prochainOrdre(elements: readonly { ordre: number }[]): number {
    return elements.length === 0 ? 0 : Math.max(...elements.map(e => e.ordre)) + 1;
}

/**
 * Échange un élément avec son voisin, dans le sens demandé.
 *
 * Rend les couples `{ id, ordre }` à écrire — **jamais la liste entière**.
 * Réécrire tous les rangs à chaque déplacement ferait diverger deux campagnes
 * qui partagent le même tableau plat, et rendrait un `git diff` de sauvegarde
 * illisible.
 *
 * Aux extrémités, rien ne bouge et rien n'est signalé : monter le premier acte
 * n'est pas une erreur, c'est un geste sans effet.
 */
export function deplacer<T extends { id: string; ordre: number }>(
    ordonnes: readonly T[],
    id: string,
    sens: 'haut' | 'bas',
): { id: string; ordre: number }[] {
    const index = ordonnes.findIndex(e => e.id === id);
    if (index === -1) return [];

    const voisin = sens === 'haut' ? index - 1 : index + 1;
    if (voisin < 0 || voisin >= ordonnes.length) return [];

    return [
        { id: ordonnes[index].id, ordre: ordonnes[voisin].ordre },
        { id: ordonnes[voisin].id, ordre: ordonnes[index].ordre },
    ];
}

/**
 * Ce qu'une scène porte déjà, entre 0 et 1.
 *
 * **C'est lui qui distingue une scène préparée d'une scène improvisée**, plutôt
 * qu'un second type d'objet. Une scène née d'un combat lancé à la volée n'a
 * qu'un titre ; celle qu'on a préparée porte son résumé, son lieu, ses PNJ.
 *
 * Cinq critères de même poids — le résumé, le lieu, au moins un PNJ, au moins
 * un indice, une ambiance. **Aucun n'est obligatoire** : une scène de dialogue
 * n'a pas d'indice à porter, et l'écran doit l'annoncer comme incomplète sans
 * jamais la refuser. *L'outil suit l'état, il n'arbitre pas.*
 */
export function remplissageDeLaScene(scene: Scene): number {
    const criteres = [
        scene.resume.trim().length > 0,
        !!scene.lieuId,
        scene.entiteIds.length > 0,
        scene.indiceIds.length > 0,
        !!scene.momentDeStoryboardId,
    ];
    return criteres.filter(Boolean).length / criteres.length;
}

/**
 * Ce que la suppression d'un acte emporterait avec lui.
 *
 * **Une scène orpheline serait pire qu'une scène supprimée** : plus rattachée à
 * aucun acte, elle n'apparaîtrait sur aucun écran tout en pesant dans la base.
 * La suppression est donc en cascade — mais le nombre se demande **avant**, pour
 * que la confirmation dise ce qu'elle coûte au lieu de demander un accord à
 * l'aveugle.
 */
export function scenesEmportees(scenes: readonly Scene[], acteId: string): Scene[] {
    return scenes.filter(s => s.acteId === acteId);
}
