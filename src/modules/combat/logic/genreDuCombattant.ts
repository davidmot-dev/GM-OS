import type { Combatant } from '../types';
import type { Entity } from '../../../types/entity.types';
import { campDuRole } from './invocationDeRencontre';

/**
 * **Un combattant dont le personnage vient de changer de genre** (§ 268, 21/11/2026).
 *
 * David : « je voudrais pouvoir transformer un PNJ en Personnage Joueur, et
 * vice-versa ». Le personnage garde son identifiant ; seul le combattant du
 * plateau le nomme **avec son genre** : `isPlayer`, et l'un des deux liens
 * `sourcePlayerId` (PJ) ou `sourceEntityId` (PNJ). Sans cette réécriture, la
 * santé, les fiches et la carte chercheraient Marta, devenue PJ, parmi les PNJ.
 *
 * Le camp suit : `player` pour un PJ, celui du rôle choisi pour un PNJ (la
 * règle de l'entrée au combat, `campDuRole`). L'identifiant du combattant ne
 * bouge pas : Map-OS (`linkedCombatantId`) et les cibles le retrouvent.
 *
 * Rend le même combattant, par référence, quand il n'est pas concerné.
 */
export function combattantAuNouveauGenre(
    combattant: Combatant,
    personnageId: string,
    versPersonnage: boolean,
    role?: Entity['role'],
): Combatant {
    const lui = combattant.sourcePlayerId === personnageId || combattant.sourceEntityId === personnageId;
    if (!lui || combattant.isPlayer === versPersonnage) return combattant;
    return versPersonnage
        ? { ...combattant, isPlayer: true, sourcePlayerId: personnageId, sourceEntityId: undefined, faction: 'player' }
        : { ...combattant, isPlayer: false, sourceEntityId: personnageId, sourcePlayerId: undefined, faction: campDuRole(role) };
}
