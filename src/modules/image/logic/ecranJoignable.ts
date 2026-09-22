import type { DisplayInfo } from '../types';

/**
 * **L'écran visé existe-t-il encore ?**
 *
 * ⛔ **Écrit le 2026-09-22, après une soirée passée à chercher pourquoi une
 * vidéo « ne se lance pas à partir du Master Storyboard ».** Elle partait bien :
 * les deux gestes — celui d'Image-OS et celui du moment — envoient un ordre
 * *identique au caractère près*. Seulement, l'écran visé n'existait plus, et
 * **personne ne le disait** :
 *
 * ```js
 * const targetDisplay = displays.find(d => d.id.toString() === target);
 * if (!targetDisplay) { console.error(...); return; }   // et rien d'autre
 * ```
 *
 * Le processus principal jetait l'ordre dans une console que personne ne
 * regarde, aucune fenêtre n'était créée, et le meneur voyait **son fond d'écran
 * Windows**. *Une projection qui échoue sans le dire ressemble à une
 * fonctionnalité cassée.*
 *
 * ⚠️ **Pourquoi ça arrive, et ce n'est pas rare** : les identifiants d'écran
 * viennent de Windows et **changent** au rebranchement comme au redémarrage.
 * C'est déjà pour cette raison que les alias d'écrans et de sorties audio sont
 * rangés **par signature** depuis le 2026-09-12.
 */

/** Ce que l'écran courant désigne quand il ne désigne aucun moniteur. */
export const ECRAN_DU_HUB = 'hub';

export type VerdictDEcran =
    /** On peut envoyer : le hub, ou un moniteur reconnu. */
    | { joignable: true }
    /** Le recensement n'a pas encore eu lieu — on ne refuse pas sur une ignorance. */
    | { joignable: true; sousReserve: true }
    /** L'identifiant ne correspond à aucun écran branché. */
    | { joignable: false };

/**
 * ⛔ **Une liste vide ne veut pas dire « aucun écran », elle veut dire « je ne
 * sais pas encore ».**
 *
 * `fetchDisplays` est asynchrone et n'a pas forcément tourné : refuser sur une
 * liste vide bloquerait **toute** projection au démarrage. *Une garde qui refuse
 * tout ressemble à une garde qui marche* — la leçon du profil vide qui affichait
 * « The Eternal Quest ».
 */
export function ecranJoignable(
    cible: string | null | undefined,
    ecrans: readonly DisplayInfo[] | undefined,
): VerdictDEcran {
    if (!cible || cible === ECRAN_DU_HUB) return { joignable: true };
    if (!ecrans || ecrans.length === 0) return { joignable: true, sousReserve: true };
    return ecrans.some(ecran => ecran.id === cible) ? { joignable: true } : { joignable: false };
}

/**
 * L'écran enregistré a-t-il disparu depuis la dernière fois ?
 *
 * ⭐ **Image-OS se protège déjà de ça — en silence, et c'était le second
 * silence.** Quand son écran courant n'est plus là, il retombe sur le Player Hub
 * sans un mot : le meneur déclenche alors un moment réglé sur « écran courant »,
 * la vidéo part au hub, et **son moniteur ne reçoit rien**. Il n'a aucun moyen de
 * relier le symptôme à un rebranchement d'il y a trois jours.
 *
 * *Un repli qui ne s'annonce pas est un mensonge par omission.*
 */
export function leRepliEstNecessaire(
    cible: string | null | undefined,
    ecrans: readonly DisplayInfo[] | undefined,
): boolean {
    return ecranJoignable(cible, ecrans).joignable === false;
}
