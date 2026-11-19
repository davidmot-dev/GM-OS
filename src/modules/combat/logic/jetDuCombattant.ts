import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { lireLeCombatAlien } from '../../dice/systemes/combatAlien';

/**
 * **Qui peut lancer un test depuis la fiche d'un combattant** (`components/JetDuCombattant.tsx`,
 * 17/11/2026). Réservé aux adversaires d'un pilote Vampire : un joueur lance depuis sa fiche ou sa
 * tablette, et les autres jeux ont leur propre geste (COC : « Lancer un test » de `PanneauDeCoc`).
 * L'étendre à un autre jeu demande d'y vérifier d'abord ce que son panneau suppose d'un personnage.
 */
export function jetDuCombattantPossible(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: (Pick<GameDriver, 'jet'> & Partial<Pick<GameDriver, 'combat'>>) | null | undefined,
    gabarit: SheetTemplate | null,
    valeurs: Record<string, unknown> = {},
): boolean {
    if (combattant.isPlayer || !gabarit) return false;
    /*
      **Alien** (registre § 263, T12, 19/11/2026) : un humain ou un synthétique, pas un xénomorphe
      (il tire son attaque au D6, T10). Vérifié avant de l'ouvrir : le panneau lit ses armes sur sa
      fiche (`equipementsAlien`) et prépare le tir (`preparerLeTir`) ; ses dés de Stress viennent de
      sa fiche (zéro sans valeur) ; la Panique, les munitions et le suivi du jet s'écrivent par
      `ecrireLaFicheDuCombattant`. Le coup qu'il porte se prépare sur la cible (`CoupAlien`).
    */
    if (driver?.jet?.alien && driver.combat?.alien) return !lireLeCombatAlien(valeurs).xenomorphe;
    /*
      **Blade Runner** (registre § 263, T9, 19/11/2026), vérifié avant de l'ouvrir : le panneau
      n'offre le souvenir clé que si la fiche en porte un (jamais un adversaire du livre) ; le
      forçage paie sa Santé ou son Sang-froid par `ecrireLaFicheDuCombattant`, qui déplace aussi ses
      points de vie (T20) ; le suivi des blessures ne s'écrit que sur un geste. Les adversaires du
      livre portent leurs attributs et compétences sur leur fiche depuis le pilote 2.1.0 (T8).
    */
    const bladeRunner = !!driver?.jet?.bladeRunner && !!driver.jet.desEchelonnes;
    /*
      **Dune** (registre § 263, T18, 19/11/2026), vérifié avant de l'ouvrir : le seuil d'un PNJ est sa
      compétence plus sa valeur de principe, sans maxime (PNJ mineur, livre p. 327) — le panneau
      compose les deux depuis sa fiche ; « PNJ ennemi » y est coché d'emblée (Menace, p. 240) ; la
      Détermination et le suivi Dune s'écrivent par `ecrireLaFicheDuCombattant`. Dune n'a pas de
      points de vie : une attaque réussie s'applique par `AttaqueDune` (tâche de défaite).
    */
    return !!driver?.jet?.vampire || bladeRunner || !!driver?.jet?.dune;
}

/**
 * **Le bouton « Attaquer » de la carte** — chantier § 263, T5 (19/11/2026), décision D2 de David :
 * « Fenêtre Fiche, ouverte sur le jet ». Il ouvre la fenêtre « Fiche » du combattant sur son jet,
 * la cible de la carte en tête.
 *
 * Il ne paraît que là où le jet d'un adversaire existe (`jetDuCombattantPossible`), **et pas pour
 * Vampire** : le chantier vise Blade Runner, Alien, Dune et Cthulhu Hack, et sa règle C10 veut que
 * rien ne bouge sur la carte d'un jeu qu'il ne vise pas. Vampire garde son jet dans « Fiche ».
 * Chaque jeu du chantier s'ouvre ici quand son jet est vérifié : Blade Runner (T9), Alien (T12),
 * Dune (T18) ; Cthulhu Hack a « Riposte » (T16), le meneur n'y lançant pas.
 */
export function attaqueSurLaCarte(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: Pick<GameDriver, 'jet' | 'combat'> | null | undefined,
    gabarit: SheetTemplate | null,
    valeurs: Record<string, unknown> = {},
): boolean {
    if (driver?.jet?.vampire) return false;
    return jetDuCombattantPossible(combattant, driver, gabarit, valeurs) || attaqueDeCreaturePossible(combattant, driver, valeurs)
        || ripostePossible(combattant, driver);
}

/**
 * **La riposte d'un adversaire de Cthulhu Hack** (registre § 263, T16, 19/11/2026) : le meneur n'y
 * lance jamais de dé (livre, p. 45-48). Le bouton de la carte s'appelle « Riposte » et ouvre
 * `RiposteDeCthulhuHack` : l'attaque choisie inflige ses dégâts fixes au PJ ciblé, moins son Armure.
 */
export function ripostePossible(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: Pick<GameDriver, 'jet'> | null | undefined,
): boolean {
    return !combattant.isPlayer && !!driver?.jet?.cthulhuHack;
}

/**
 * **Une créature d'Alien qui a des attaques** (registre § 263, T10, 19/11/2026) : un xénomorphe
 * (ou toute créature déclarée telle) dont l'espèce porte ses lignes d'attaques (bestiaire du pilote)
 * ou sa table du jeu. Elle n'a pas les attributs d'un humain : « Attaquer » ouvre son tirage au D6
 * (`AttaqueDeCreature`), pas le panneau de jet d'un personnage.
 */
export function attaqueDeCreaturePossible(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: Pick<GameDriver, 'combat'> | null | undefined,
    valeurs: Record<string, unknown>,
): boolean {
    if (combattant.isPlayer || !driver?.combat?.alien) return false;
    const x = lireLeCombatAlien(valeurs).xenomorphe;
    return !!x && (!!x.lignes?.length || !!x.table?.trim());
}

/**
 * **Le libellé d'une attaque retenue** (§ 263, T6) : les champs composés, dans leur ordre, sous le
 * nom que la fiche leur donne — « Agilité + Armes à feu ». Un champ qui prend son nom d'un autre
 * (`libelleSur`, les groupements d'un adversaire de Vampire) le reprend ; un champ inconnu de la
 * fiche garde son identifiant, plutôt que de disparaître.
 */
export function libelleDeLAttaque(
    champs: Record<string, string>,
    gabarit: Pick<SheetTemplate, 'sections'>,
    valeurs: Record<string, unknown>,
): string {
    const tous = gabarit.sections.flatMap(s => s.fields) as { id: string; label: string; libelleSur?: string }[];
    return Object.values(champs).filter(Boolean).map(id => {
        const champ = tous.find(f => f.id === id);
        const nomPorte = champ?.libelleSur ? String(valeurs[champ.libelleSur] ?? '').trim() : '';
        return nomPorte || champ?.label || id;
    }).join(' + ');
}

/**
 * **La cible d'une attaque** : celle que la carte vise, si elle est encore sur le plateau. La même
 * règle que « Calculer » (`ciblesDuCalculateur`) et que les boutons de la console (décision de
 * David du 2026-08-29), sans le repli sur le porteur : on ne s'attaque pas soi-même.
 */
export function cibleDeLAttaque<C extends Pick<Combatant, 'id'>>(
    attaquant: Pick<Combatant, 'id' | 'targetId'>,
    combattants: readonly C[],
): C | null {
    if (!attaquant.targetId || attaquant.targetId === attaquant.id) return null;
    return combattants.find(c => c.id === attaquant.targetId) ?? null;
}
