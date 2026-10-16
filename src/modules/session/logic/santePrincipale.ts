import { resolveSheetTemplate } from './templateResolver';
import { DEFAULT_SHEET_TEMPLATES, type SheetTemplate } from '../../../data/defaultSheetTemplates';
import { champDeSantePrincipale, santePrincipaleDeLaFiche } from '../../combat/logic/SanteDuCombattant';
import type { Campaign, PlayerCharacter } from '../store/types';
import type { GameDriver } from '../../../types/drivers';

/**
 * **La santé principale d'un personnage, lue sur sa fiche** — 2026-10-16.
 *
 * Une seule lecture pour les quatre endroits qui en parlent : le coup porté
 * (`handleApplyImpact`), la barre de santé (`HealthManager`), le changement de
 * moteur de santé, et le panneau du Hors Jeu. Le maximum par défaut est la valeur
 * par défaut du champ sur la fiche du jeu — les PV de Cthulhu Hack n'ont pas de
 * champ « maximum ». Voir `santePrincipaleDeLaFiche`.
 */
export function santePrincipaleDuPersonnage(
    personnage: PlayerCharacter | undefined,
    pilote: GameDriver | null | undefined,
    campagnes: Campaign[],
    fichesPersonnalisees: SheetTemplate[] = [],
): { champ: string; courant: number; max: number } | null {
    const champ = champDeSantePrincipale(pilote);
    if (!personnage || !champ) return null;
    const gabarit = resolveSheetTemplate(personnage, campagnes, [...DEFAULT_SHEET_TEMPLATES, ...fichesPersonnalisees]);
    const defaut = Number(gabarit?.sections.flatMap(s => s.fields).find(f => f.id === champ)?.defaultValue);
    return santePrincipaleDeLaFiche(pilote, personnage.sheetData, Number.isFinite(defaut) && defaut > 0 ? defaut : undefined);
}
