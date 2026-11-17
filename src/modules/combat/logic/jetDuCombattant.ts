import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Qui peut lancer un test depuis la fiche d'un combattant** (`components/JetDuCombattant.tsx`,
 * 17/11/2026). Réservé aux adversaires d'un pilote Vampire : un joueur lance depuis sa fiche ou sa
 * tablette, et les autres jeux ont leur propre geste (COC : « Lancer un test » de `PanneauDeCoc`).
 * L'étendre à un autre jeu demande d'y vérifier d'abord ce que son panneau suppose d'un personnage.
 */
export function jetDuCombattantPossible(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: Pick<GameDriver, 'jet'> | null | undefined,
    gabarit: SheetTemplate | null,
): boolean {
    return !combattant.isPlayer && !!driver?.jet?.vampire && !!gabarit;
}
