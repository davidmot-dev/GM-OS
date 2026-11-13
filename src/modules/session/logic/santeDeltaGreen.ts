import type { GameDriver } from '../../../types/drivers';
import type { HealthSystem } from '../useSessionOSStore';
import { santeAlignee, santePrincipaleDeLaFiche } from '../../combat/logic/SanteDuCombattant';

/** La fiche, y compris une saisie HTML ou tablette, fait autorité pour les PV (13/11/2026). */
export function alignerSanteDG<T extends { hp?: number; maxHp?: number; healthSystem?: HealthSystem; sheetData?: Record<string, unknown> }>(
    porteur: T, pilote: GameDriver | null | undefined,
): T {
    if (!pilote?.jet?.deltaGreen?.sante) return porteur;
    const principale = santePrincipaleDeLaFiche(pilote, porteur.sheetData);
    if (!principale) return porteur;
    return { ...porteur, hp: principale.courant, maxHp: principale.max,
        healthSystem: santeAlignee(porteur.healthSystem, principale),
        ...('status' in porteur ? { status: principale.courant <= 0 ? 'dead' : principale.courant <= 2 ? 'injured' : 'alive' } : {}) };
}

/** Une ancienne fiche HTML ne peut effacer les reçus, compteurs et complications qu’elle ignore. */
export function conserverSuiviDG(avant: Record<string, unknown> | undefined, prochain: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!avant || !prochain) return {};
    return Object.fromEntries(Object.entries(avant).filter(([cle]) => /^(?:__deltaGreen|distraction_dg|complication_dg|progression_(?:violence|impuissance)|arme[1-7]_enrayee)$/.test(cle) && !Object.hasOwn(prochain, cle)));
}
