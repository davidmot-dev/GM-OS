import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { PlayerCharacter } from '../../../types/player.types';
import { tousLesPilotes } from '../store/tousLesPilotes';
import { piloteDuPersonnage, type CampagneDeJeu, type PersonnageDeJeu } from './piloteDuPersonnage';
import { ficheNeuve } from './ficheNeuve';
import { horlogeDeDefaite } from '../../combat/logic/TacheDeDefaite';
import { champDeSantePrincipale, santeDeDepart, valeurDuChamp } from '../../combat/logic/SanteDuCombattant';
import { HealthInterpreter } from './HealthInterpreter';

/**
 * **Ce qu'un personnage reçoit en naissant dans un jeu** : sa fiche remplie de
 * ses champs, et sa santé selon le modèle du pilote.
 *
 * Extrait de `AddCharacterForm` le 2026-10-13, pour que **passer un personnage
 * au jeu de sa campagne** le fasse naître exactement comme à la création — deux
 * copies de cette règle auraient fini par diverger. Les raisons de chaque choix
 * (la santé de départ lue sur la fiche, pas de points de vie pour un jeu qui
 * n'en compte pas, l'horloge de défaite dimensionnée par la fiche) sont
 * restées là où elles ont été écrites, dans le formulaire.
 */
export function naissanceDansLeJeu(
    pilote: GameDriver | undefined,
    gabarit: Pick<SheetTemplate, 'sections'> | undefined,
): Pick<PlayerCharacter, 'sheetData' | 'healthSystem' | 'hp' | 'maxHp'> {
    const valeurs = ficheNeuve(gabarit);
    const lue = santeDeDepart(
        pilote?.combat?.santeDeDepart,
        champ => valeurDuChamp(valeurs, champ),
    );
    const depart = lue ?? 10;

    const modele = pilote?.combat?.defaultHealthType ?? 'hp';
    /*
      **La fiche naît pleine, elle aussi** (S2 de l'audit de Symbaroum,
      2026-10-22). L'Endurance actuelle valait sa valeur par défaut, zéro, alors
      que la santé du combat partait de l'Endurance maximale : marquée jauge
      principale, elle aurait fait naître chaque personnage hors de combat. Seule
      une santé de départ réellement lue l'écrit — jamais le dix de secours — et
      seulement à la naissance : un personnage blessé n'est jamais remis à neuf.
    */
    const champDeSante = modele === 'hp' ? champDeSantePrincipale(pilote) : null;
    if (champDeSante && lue !== null && lue !== undefined) valeurs[champDeSante] = lue;
    const tache = pilote?.combat?.tacheDeDefaite;
    const sante = tache
        ? horlogeDeDefaite(tache, valeurs).sante
        : HealthInterpreter.createDefault(modele, { cases: pilote?.combat?.casesDeSante });

    return {
        sheetData: valeurs,
        healthSystem: modele === 'hp'
            ? { ...sante, data: { ...sante.data, current: depart, max: depart } }
            : sante,
        hp: modele === 'hp' ? depart : undefined,
        maxHp: modele === 'hp' ? depart : undefined,
    };
}

/** Le jeu que suit un personnage, quand ce n'est pas celui de sa campagne. */
export interface EcartDeJeu {
    jeuDuPersonnage: GameDriver | null;
    jeuDeLaCampagne: GameDriver;
}

/**
 * **Le personnage suit-il un autre jeu que celui de sa campagne ?**
 *
 * Relevé par David le 2026-10-13 : « TEst NOC », lié à la campagne TEST NOC qui
 * joue NOC, n'avait pas de panneau de jet. Il déclarait Within et portait sa
 * fiche — et `piloteDuPersonnage` fait passer le jeu du personnage avant celui
 * de la campagne, à raison (§ son en-tête). **Rien ne montrait l'écart** : la
 * carte n'affiche que la campagne.
 *
 * Ne compare qu'à la campagne **du personnage**, jamais à celle qui est ouverte :
 * c'est précisément la confusion que `piloteDuPersonnage` a été écrit pour
 * éviter. Sans campagne, ou sans jeu déclaré par la campagne, pas d'écart.
 */
export function ecartDeJeu(
    personnage: PersonnageDeJeu | null | undefined,
    campagnes: readonly CampagneDeJeu[],
    pilotesPersonnalises: readonly GameDriver[] = [],
): EcartDeJeu | null {
    if (!personnage?.campaignId) return null;
    const campagne = campagnes.find(c => c.id === personnage.campaignId);
    if (!campagne?.system || campagne.system === 'generic') return null;

    const jeuDeLaCampagne = tousLesPilotes(pilotesPersonnalises).find(d => d.id === campagne.system);
    if (!jeuDeLaCampagne) return null;

    const jeuDuPersonnage = piloteDuPersonnage(personnage, campagnes, pilotesPersonnalises);
    if (jeuDuPersonnage?.id === jeuDeLaCampagne.id) return null;
    return { jeuDuPersonnage, jeuDeLaCampagne };
}

/** Une valeur qui dit quelque chose — ce qu'on préviendrait de perdre. */
function estRemplie(valeur: unknown): boolean {
    return valeur !== undefined && valeur !== null && valeur !== '' && valeur !== 0 && valeur !== false;
}

/**
 * **Faire passer un personnage dans un autre jeu** : il reçoit le pilote, la
 * fiche et la santé de ce jeu, comme s'il y naissait.
 *
 * Ce qui reste : tout ce qui n'est pas la fiche — nom, portrait, campagne,
 * notes, inventaire, fiche HTML liée. Les valeurs d'un champ **du même
 * identifiant** dans la nouvelle fiche sont reprises ; les autres sont rendues
 * dans `perdus`, pour que l'écran le dise **avant** d'agir.
 */
export function passerAuJeu(
    personnage: Pick<PlayerCharacter, 'sheetData'>,
    pilote: GameDriver,
    gabarits: readonly SheetTemplate[],
): { changements: Partial<PlayerCharacter>; perdus: string[] } {
    const gabarit = gabarits.find(t => t.id === pilote.templateId);
    const naissance = naissanceDansLeJeu(pilote, gabarit);
    const ancienne = personnage.sheetData ?? {};

    const sheetData = { ...naissance.sheetData };
    for (const [champ, valeur] of Object.entries(ancienne)) {
        if (champ in sheetData && estRemplie(valeur)) sheetData[champ] = valeur;
    }
    const perdus = Object.entries(ancienne)
        .filter(([champ, valeur]) => !(champ in sheetData) && estRemplie(valeur))
        .map(([champ]) => champ);

    return {
        changements: {
            ...naissance,
            sheetData,
            systemId: pilote.id,
            templateId: gabarit ? gabarit.id : pilote.templateId,
        },
        perdus,
    };
}

/**
 * **Lier un personnage à une campagne d'un autre jeu se confirme** — demandé par
 * David le 2026-10-16. Jusque-là, le lien se faisait sans un mot, et seul le
 * bandeau `EcartDeJeuDuPersonnage` le disait après coup. L'écart qu'aurait le
 * personnage s'il rejoignait `campaignId` ; `null` : rien à confirmer (même jeu,
 * campagne générique, ou déliaison).
 */
export function ecartAuLien(
    personnage: PersonnageDeJeu | null | undefined,
    campaignId: string | null,
    campagnes: readonly CampagneDeJeu[],
    pilotesPersonnalises: readonly GameDriver[] = [],
): EcartDeJeu | null {
    if (!personnage || !campaignId || personnage.campaignId === campaignId) return null;
    return ecartDeJeu({ ...personnage, campaignId }, campagnes, pilotesPersonnalises);
}
