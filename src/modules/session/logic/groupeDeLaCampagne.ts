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

/**
 * **La campagne dont un joueur voit le groupe** — celle de son personnage,
 * sinon la campagne ouverte. La même règle sur la tablette et chez le meneur :
 * c'est elle qui décide où une écriture venue d'un joueur atterrit, et le
 * meneur ne croit pas la campagne qu'un message annoncerait.
 */
export function campagneDuGroupe<C extends Pick<Campaign, 'id'>>(
    personnage: { campaignId?: string | null },
    campagnes: C[],
    campagneOuverteId: string | null | undefined,
): C | undefined {
    const id = personnage.campaignId ?? campagneOuverteId;
    return id ? campagnes.find(c => c.id === id) : undefined;
}

/** Une valeur qu'une fiche peut écrire — rien qui porte une structure. */
export type ValeurDeFiche = string | number | boolean | null;

/**
 * **Ce qu'une tablette demande d'écrire dans la fiche du groupe**, relu champ
 * par champ.
 *
 * Seules les valeurs simples passent : une fiche n'écrit que des textes, des
 * nombres et des cases. Un objet glissé dans un message fabriqué ne devient
 * pas une donnée de la campagne.
 */
export function lireLEcritureDuGroupe(
    payload: unknown,
): { characterId: string; sheetData: Record<string, ValeurDeFiche> } | null {
    if (!payload || typeof payload !== 'object') return null;
    const { characterId, sheetData } = payload as { characterId?: unknown; sheetData?: unknown };
    if (typeof characterId !== 'string' || !characterId) return null;
    if (!sheetData || typeof sheetData !== 'object' || Array.isArray(sheetData)) return null;

    const valeurs: Record<string, ValeurDeFiche> = {};
    for (const [cle, valeur] of Object.entries(sheetData)) {
        if (valeur === null || typeof valeur === 'string' || typeof valeur === 'boolean'
            || (typeof valeur === 'number' && Number.isFinite(valeur))) {
            valeurs[cle] = valeur;
        }
    }
    return Object.keys(valeurs).length > 0 ? { characterId, sheetData: valeurs } : null;
}
