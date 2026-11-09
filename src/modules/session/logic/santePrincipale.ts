import { resolveSheetTemplate } from './templateResolver';
import { DEFAULT_SHEET_TEMPLATES, type SheetTemplate } from '../../../data/defaultSheetTemplates';
import { champDeSantePrincipale, santePrincipaleDeLaFiche } from '../../combat/logic/SanteDuCombattant';
import { lireLeCombatAlien, suitLaSanteAlien } from '../../dice/systemes/combatAlien';
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

/**
 * **La santé principale d'un PNJ, lue sur sa fiche** — 09/11/2026. Seul Alien la fait suivre à un
 * PNJ : humain (déclaré ou par défaut) ou synthétique, sa Santé plafonnée à sa Force. Le
 * xénomorphe garde sa projection (`alignerJaugeXeno`, qui connaît la ruse). Deux lecteurs : la
 * console de dommage (`HealthManager`) et la carte de la galerie (`NpcGallery`) — David : « Webb
 * 10/10 qui est faux ».
 */
export function santePrincipaleDuPnj(
    entite: { sheetData?: Record<string, unknown> } | undefined,
    pilote: GameDriver | null | undefined,
): { champ: string; courant: number; max: number } | null {
    const alien = pilote?.combat?.alien, fiche = entite?.sheetData ?? {};
    if (!entite || !alien || lireLeCombatAlien(fiche).xenomorphe || !suitLaSanteAlien(alien, fiche)) return null;
    return santePrincipaleDeLaFiche(pilote, fiche);
}
