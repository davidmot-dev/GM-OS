import type { Campaign, GroupeDeCampagne } from '../../../types/campaign.types';
import type { CorrespondanceDeFiche } from '../../fiches/correspondanceDeFiche';
import type { PersonnageDeLHote } from '../../fiches/FicheHote';
import type { Rapprochement } from '../../fiches/rapprochementDeLaFiche';

/**
 * **Le groupe d'une campagne, vu par l'hôte des fiches** — la Cabale de NOC,
 * 2026-10-13.
 *
 * L'hôte (`FicheHote`) ne connaît pas les joueurs : il lui faut un identifiant,
 * un nom, une fiche et des valeurs. Le groupe les fournit, et tout le reste —
 * le semis, la fiche qui fait foi, la poussée de GM-OS, le journal des écarts —
 * se réutilise tel quel. *Une seconde mécanique aurait fini par diverger.*
 *
 * Tout ici est pur : c'est la vue qui écrit, par `updateCampaign`.
 */

/** Le groupe d'une campagne qui n'en a pas encore : vide, prêt à être semé. */
export const GROUPE_VIERGE: GroupeDeCampagne = { sheetData: {} };

/** L'identifiant que l'hôte voit — distinct de tout personnage. */
export const idDuGroupe = (campagneId: string) => `groupe:${campagneId}`;

/**
 * **Le nom du groupe : celui que porte sa fiche**, sinon le mot du jeu.
 *
 * La feuille de Cabale a son champ « Nom » (`identity.name`, la convention du
 * cahier des charges). Le recopier dans un second champ de GM-OS ferait deux
 * noms à tenir d'accord ; on le lit donc là où la fiche l'écrit.
 */
export function nomDuGroupe(
    groupe: GroupeDeCampagne | undefined,
    table: CorrespondanceDeFiche | null,
    libelle: string,
): string {
    const champ = table?.champs.find(c => c.fiche === 'identity.name');
    const valeur = champ ? groupe?.sheetData[champ.gmos] : undefined;
    return typeof valeur === 'string' && valeur.trim() ? valeur.trim() : libelle;
}

/** Ce que l'hôte reçoit pour afficher la fiche du groupe. */
export function groupePourLHote(
    campagne: Pick<Campaign, 'id'>,
    groupe: GroupeDeCampagne | undefined,
    nom: string,
): PersonnageDeLHote {
    const g = groupe ?? GROUPE_VIERGE;
    return {
        id: idDuGroupe(campagne.id),
        name: nom,
        ficheId: g.ficheId,
        donneesModifieesLe: g.donneesModifieesLe,
        sheetData: g.sheetData,
    };
}

/**
 * Ce que la fiche impose, appliqué au groupe.
 *
 * Seul `sheetData` compte : un groupe n'a ni notes de joueur ni inventaire, et
 * sa correspondance ne vise que des champs. L'horodatage suit, comme pour un
 * personnage — c'est lui qui arbitre à la prochaine ouverture.
 */
export function appliquerAuGroupe(
    groupe: GroupeDeCampagne | undefined,
    releve: Pick<Rapprochement, 'aEcrire'>,
    maintenant = Date.now(),
): GroupeDeCampagne {
    const g = groupe ?? GROUPE_VIERGE;
    return {
        ...g,
        sheetData: { ...g.sheetData, ...releve.aEcrire },
        donneesModifieesLe: maintenant,
    };
}

/** Le groupe lié à une fiche du moteur. */
export function lierLeGroupe(groupe: GroupeDeCampagne | undefined, ficheId: string): GroupeDeCampagne {
    return { ...(groupe ?? GROUPE_VIERGE), ficheId };
}
