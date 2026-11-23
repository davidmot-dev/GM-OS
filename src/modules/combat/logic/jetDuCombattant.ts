import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { lireLeCombatAlien } from '../../dice/systemes/combatAlien';

/**
 * **Ce que vaut le coup d'un adversaire, selon le jeu** — registre § 267, T0 (22/11/2026), à la
 * demande de David (« Commence »). Le § 263 donnait à **tout** jet compté en réussites la règle de
 * Year Zero, « arme + succès − 1 » : juste pour Blade Runner et Alien, faux ailleurs (Vampire : marge
 * + arme ; Shadowrun : VD + succès nets ; Degenesis : arme + déclencheurs). Chaque jeu la déclare ici :
 *
 * - `arme-plus-succes` : les dégâts de l'arme plus un par succès au-delà du premier (Year Zero) ;
 * - `porte-du-jeu` : le coup s'applique par le geste propre au jeu (Dune : la tâche de défaite ;
 *   Cthulhu Hack : la riposte), jamais par « Appliquer à [cible] » ;
 * - `marge-plus-arme` : la marge de réussites plus le bonus de l'arme (Vampire V5, p. 126, 303) ;
 * - `de-de-l-arme` : le dé de l'arme lancé, plus la Vigueur ou sa moitié (Barbarians of Lemuria, p. 62-63) ;
 * - `montant` : le jeu ne dit pas encore ses dégâts, le meneur saisit le montant. C'est la règle
 *   de tout jeu absent de la table : on ne devine pas les dégâts d'un jeu.
 */
export type RegleDesDegatsDuJeu = 'arme-plus-succes' | 'marge-plus-arme' | 'de-de-l-arme' | 'vd-plus-nets' | 'porte-du-jeu' | 'montant';

/** Un jeu ouvert au combat des adversaires : comment le reconnaître, son geste, ses dégâts. */
export interface JeuDuCombat {
    jeu: string;
    /** Le pilote est-il celui de ce jeu ? Lu sur sa mécanique de jet, pas sur son nom. */
    reconnaitre: (driver: Pick<GameDriver, 'jet'> & Partial<Pick<GameDriver, 'combat'>>) => boolean;
    /**
     * Le geste de la carte : `attaquer` ouvre le jet de l'adversaire sur sa cible ; `riposte`, le
     * coup d'un adversaire qui ne lance pas (le meneur n'y lance jamais) ; `fiche`, le jet seulement
     * depuis « Fiche », sans bouton sur la carte.
     */
    geste: 'attaquer' | 'riposte' | 'fiche' | 'affrontement';
    degats: RegleDesDegatsDuJeu;
}

/**
 * **La table des jeux ouverts** (§ 267, T0). Elle remplace la chaîne de booléens qui s'allongeait à
 * chaque jeu ; un jeu s'y ajoute quand son jet d'adversaire et ses dégâts sont vérifiés au livre.
 */
export const JEUX_DU_COMBAT: readonly JeuDuCombat[] = [
    // § 263, T10 et T12 : un xénomorphe tire son attaque au D6 (`combat.alien` suffit) ; un humain
    // ou un synthétique lance son jet, quand le pilote déclare aussi `jet.alien`.
    { jeu: 'Alien', reconnaitre: d => !!d.combat?.alien, geste: 'attaquer', degats: 'arme-plus-succes' },
    // § 263, T9 : les dés échelonnés de Blade Runner, « RÉUSSITES MULTIPLES ».
    { jeu: 'Blade Runner', reconnaitre: d => !!d.jet?.bladeRunner && !!d.jet.desEchelonnes, geste: 'attaquer', degats: 'arme-plus-succes' },
    // § 263, T18 : pas de points de vie, l'attaque réussie s'applique par la tâche de défaite.
    { jeu: 'Dune', reconnaitre: d => !!d.jet?.dune, geste: 'attaquer', degats: 'porte-du-jeu' },
    // § 263, T16 : le meneur ne lance jamais (livre, p. 45-48).
    { jeu: 'Cthulhu Hack', reconnaitre: d => !!d.jet?.cthulhuHack, geste: 'riposte', degats: 'porte-du-jeu' },
    /*
      § 267, T1 (22/11) : « Attaquer » sur la carte (décision Q2 de David du 20/11) ; le vainqueur
      inflige sa marge plus le bonus de l'arme, de +0 à +4 (p. 126, 303). Le jet d'un adversaire depuis
      « Fiche » existait depuis le 17/11.
    */
    { jeu: 'Vampire', reconnaitre: d => !!d.jet?.vampire, geste: 'attaquer', degats: 'marge-plus-arme' },
    /*
      § 267, T2 (23/11) : COC a son panneau (`PanneauDeCoc`) et ses dommages (`DommagesCoc` : dés de l'arme,
      RD, échelle de santé) ; « Attaquer » ouvre le même jet depuis la carte, la cible choisie d'emblée comme
      défenseur et comme cible des DM. Les dégâts passent par la porte du jeu, pas par « Appliquer à ».
    */
    { jeu: 'COC', reconnaitre: d => !!d.jet?.coc, geste: 'attaquer', degats: 'porte-du-jeu' },
    /*
      § 267, T3 (23/11) : Delta Green a sa carte de dégâts (`DommagesDeltaGreen` : létalité ou dés de
      l'arme, critique doublé, protection, couvert ; p. 44, 52, 57-60). « Attaquer » ouvre le jet de la
      compétence de l'arme ; après le jet, cette même carte suit, l'arme, la cible et le critique réglés.
    */
    { jeu: 'Delta Green', reconnaitre: d => !!d.jet?.deltaGreen, geste: 'attaquer', degats: 'porte-du-jeu' },
    /*
      § 267, T4 (23/11) : Barbarians of Lemuria — le jet à somme contre 9 (`jet.barbarians`), puis le dé de
      l'arme (d3, d6M, d6, d6B) plus la Vigueur, ou sa moitié à distance et à mains nues, moins l'armure ;
      +6 pour un Coup dévastateur sur un succès héroïque (p. 49-53, 56-60, 62-63).
    */
    { jeu: 'Barbarians of Lemuria', reconnaitre: d => !!d.jet?.barbarians, geste: 'attaquer', degats: 'de-de-l-arme' },
    /*
      § 267, T5 (23/11) : Star Trek Adventures — la tâche d'attaque en 2d20 (`jet.starTrek`), payée en Menace
      par un PNJ (p. 255, 265) ; pas de points de vie : la blessure se porte sur la cible depuis les suites
      de la tâche, évitée par le Stress ou encaissée (p. 290-292).
    */
    { jeu: 'Star Trek', reconnaitre: d => !!d.jet?.starTrek, geste: 'attaquer', degats: 'porte-du-jeu' },
    /*
      § 267, T6 (23/11) : Symbaroum — le meneur ne lance jamais (p. 178) : « Riposte », comme Cthulhu Hack. Le
      joueur teste la Défense de son PJ contre la Précision du PNJ ; raté, les dégâts fixes moins la protection
      qu'il lance (p. 164, 167, 178).
    */
    { jeu: 'Symbaroum', reconnaitre: d => !!d.jet?.symbaroum, geste: 'riposte', degats: 'porte-du-jeu' },
    /*
      § 267, T7 (23/11) : Argyropée — l'attaque est un test simple, sans opposition (p. 48) ; ses dégâts se
      lancent dans sa carte, la protection X/Y de la cible absorbe et s'use (p. 49, 52).
    */
    { jeu: 'Argyropée', reconnaitre: d => !!d.jet?.argyropee, geste: 'attaquer', degats: 'porte-du-jeu' },
    /*
      § 267, T8 (23/11) : Degenesis — l'attaque du panneau (`AttaqueDegenesis`) mène déjà jusqu'aux dégâts : la
      défense passive ou active de la cible, l'armure, les pistes de santé (p. 102-106).
    */
    { jeu: 'Degenesis', reconnaitre: d => !!d.jet?.degenesis?.combat, geste: 'attaquer', degats: 'porte-du-jeu' },
    /*
      § 267, T9 (23/11) : RuneQuest — les suites du jet mènent déjà au coup : dégâts de l'arme, défense,
      localisation, puis « Porter le coup » par l'armure et la zone (`porterUnCoupLocalise`, p. 146-148).
    */
    { jeu: 'RuneQuest', reconnaitre: d => !!d.jet?.runequest, geste: 'attaquer', degats: 'porte-du-jeu' },
    /*
      § 267, T10 (23/11) : Shadowrun : Anarchy — VD de l'arme + succès nets (p. 66-67), appliquée avec son
      type : le moniteur de la cible la compare à ses seuils (`moniteurSelonLeJeu`, p. 68).
    */
    { jeu: 'Shadowrun : Anarchy', reconnaitre: d => !!d.jet?.shadowrun, geste: 'attaquer', degats: 'vd-plus-nets' },
    /*
      § 267, T17 (22/11) : le Psycholune ne lance jamais (p. 40-45). « Affronter » ouvre
      `AffrontementDePenombre` : l'attaque d'une Éminence grise retire sa résilience, l'action adverse
      réussit d'office et coûte des jetons, la dissonance et l'opéra harmonique.
    */
    { jeu: 'Pénombre', reconnaitre: d => !!d.jet?.penombre, geste: 'affrontement', degats: 'porte-du-jeu' },
];

/** Le jeu du pilote dans la table, ou `null` : un jeu qui n'est pas ouvert au combat des adversaires. */
export function jeuDuCombat(
    driver: (Pick<GameDriver, 'jet'> & Partial<Pick<GameDriver, 'combat'>>) | null | undefined,
): JeuDuCombat | null {
    if (!driver) return null;
    return JEUX_DU_COMBAT.find(j => j.reconnaitre(driver)) ?? null;
}

/**
 * **La cible COC d'un combattant** (§ 267, T2) : la clé du menu de `useSourcesCoc` — `pc:` pour un
 * combattant tiré d'un PJ, `npc:` pour un PNJ de la campagne, `combatant:` pour un combattant du plateau.
 */
export function cleCocDuCombattant(c: Pick<Combatant, 'id'> & Partial<Pick<Combatant, 'sourcePlayerId' | 'sourceEntityId'>>): string {
    if (c.sourcePlayerId) return `pc:${c.sourcePlayerId}`;
    if (c.sourceEntityId) return `npc:${c.sourceEntityId}`;
    return `combatant:${c.id}`;
}

/** La règle des dégâts du pilote ; `montant` pour un jeu absent de la table. */
export function regleDesDegats(
    driver: (Pick<GameDriver, 'jet'> & Partial<Pick<GameDriver, 'combat'>>) | null | undefined,
): RegleDesDegatsDuJeu {
    return jeuDuCombat(driver)?.degats ?? 'montant';
}

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
    const jeu = jeuDuCombat(driver);
    /*
      **Alien** (registre § 263, T12, 19/11/2026) : un humain ou un synthétique, pas un xénomorphe
      (il tire son attaque au D6, T10). Vérifié avant de l'ouvrir : le panneau lit ses armes sur sa
      fiche (`equipementsAlien`) et prépare le tir (`preparerLeTir`) ; ses dés de Stress viennent de
      sa fiche (zéro sans valeur) ; la Panique, les munitions et le suivi du jet s'écrivent par
      `ecrireLaFicheDuCombattant`. Le coup qu'il porte se prépare sur la cible (`CoupAlien`).
    */
    if (jeu?.jeu === 'Alien') return !!driver?.jet?.alien && !lireLeCombatAlien(valeurs).xenomorphe;
    /*
      **Blade Runner** (registre § 263, T9, 19/11/2026), vérifié avant de l'ouvrir : le panneau
      n'offre le souvenir clé que si la fiche en porte un (jamais un adversaire du livre) ; le
      forçage paie sa Santé ou son Sang-froid par `ecrireLaFicheDuCombattant`, qui déplace aussi ses
      points de vie (T20) ; le suivi des blessures ne s'écrit que sur un geste. Les adversaires du
      livre portent leurs attributs et compétences sur leur fiche depuis le pilote 2.1.0 (T8).

      **Dune** (registre § 263, T18, 19/11/2026), vérifié avant de l'ouvrir : le seuil d'un PNJ est sa
      compétence plus sa valeur de principe, sans maxime (PNJ mineur, livre p. 327) — le panneau
      compose les deux depuis sa fiche ; « PNJ ennemi » y est coché d'emblée (Menace, p. 240) ; la
      Détermination et le suivi Dune s'écrivent par `ecrireLaFicheDuCombattant`. Dune n'a pas de
      points de vie : une attaque réussie s'applique par `AttaqueDune` (tâche de défaite).

      Un jeu à « Riposte » ou à affrontement n'a pas de jet d'adversaire : le meneur n'y lance pas.
    */
    return !!jeu && jeu.geste !== 'riposte' && jeu.geste !== 'affrontement';
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
    if (jeuDuCombat(driver)?.geste === 'fiche') return false;
    return jetDuCombattantPossible(combattant, driver, gabarit, valeurs) || attaqueDeCreaturePossible(combattant, driver, valeurs)
        || ripostePossible(combattant, driver) || affrontementPossible(combattant, driver);
}

/**
 * **L'affrontement d'un adversaire de Pénombre** (registre § 267, T17, 22/11/2026) : le bouton de la
 * carte s'appelle « Affronter » et ouvre `AffrontementDePenombre`.
 */
export function affrontementPossible(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: (Pick<GameDriver, 'jet'> & Partial<Pick<GameDriver, 'combat'>>) | null | undefined,
): boolean {
    return !combattant.isPlayer && jeuDuCombat(driver)?.geste === 'affrontement';
}

/**
 * **La riposte d'un adversaire de Cthulhu Hack** (registre § 263, T16, 19/11/2026) : le meneur n'y
 * lance jamais de dé (livre, p. 45-48). Le bouton de la carte s'appelle « Riposte » et ouvre
 * `RiposteDeCthulhuHack` : l'attaque choisie inflige ses dégâts fixes au PJ ciblé, moins son Armure.
 */
export function ripostePossible(
    combattant: Pick<Combatant, 'isPlayer'>,
    driver: (Pick<GameDriver, 'jet'> & Partial<Pick<GameDriver, 'combat'>>) | null | undefined,
): boolean {
    return !combattant.isPlayer && jeuDuCombat(driver)?.geste === 'riposte';
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
