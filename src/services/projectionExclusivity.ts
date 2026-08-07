import { useMapStore } from '../modules/map/useMapStore';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';

/**
 * La carte et le tableau blanc ne sont jamais projetés en même temps.
 *
 * Ils se disputent la même surface — le Hub, ou un moniteur — et rien ne les en
 * empêchait. Les mentions « Exclusivity » qui existaient dans les deux modales
 * ne réglaient que Hub-contre-moniteur **au sein d'un même module** : projeter
 * le tableau sur le Hub fermait les écrans physiques, mais laissait la carte
 * projetée dessous.
 *
 * L'exclusion est **globale**, pas par surface : la carte sur le Hub et le
 * tableau sur un moniteur restent deux projections simultanées, et le but est
 * qu'il n'y en ait qu'une. La règle se dit en une phrase, ce qui compte quand on
 * la subit en pleine partie.
 *
 * **Bascule, pas refus.** Réclamer une surface éteint l'autre projection au lieu
 * de refuser la demande : un refus obligerait à couper explicitement avant de
 * projeter, pour un geste qui doit rester immédiat.
 *
 * Le module vit ici plutôt que dans l'un des deux stores : chacun devrait sinon
 * importer l'autre, et le cycle qui en résulterait vaut bien un fichier.
 */

export type ProjectedModule = 'map' | 'whiteboard';

/**
 * Annonce qu'un module prend la projection, et libère l'autre.
 *
 * À appeler **avant** d'établir la nouvelle projection : l'ordre inverse ferait
 * partir une diffusion d'état intermédiaire où les deux sont actifs.
 *
 * @returns le module qui a été libéré, ou `null` si rien ne l'était.
 */
export function claimProjection(claimant: ProjectedModule): ProjectedModule | null {
    if (claimant === 'map') {
        if (useWhiteboardStore.getState().projectionTarget === null) return null;

        // Nettoie la cible et rien d'autre : les tracés survivent, et le tableau
        // revient tel quel à la prochaine projection.
        useWhiteboardStore.getState().clearProjectedState();
        return 'whiteboard';
    }

    if (useMapStore.getState().projectionTarget === null) return null;

    useMapStore.getState().clearProjectedState();
    return 'map';
}
