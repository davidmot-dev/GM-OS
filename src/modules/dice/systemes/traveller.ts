import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';
import { deuxDesGardes } from './barbarians';

/**
 * **Le test de Traveller** — 26/11/2026, à la demande de David (« finir le pilote », livre de règles
 * français v2.2, pages **imprimées** ; PDF = imprimée + 1).
 *
 * Le pilote forgé comptait des réussites : chaque d6 comparé à la valeur brute de la
 * caractéristique (une DEX de 9 « réussissait » sur 1 à 9), et huit réussites exigées sur deux
 * dés — tout jet échouait. Le livre additionne : **2D + MD de la caractéristique + niveau de
 * compétence + autres MD, réussi sur le nombre cible, 8+ pour une tâche Moyenne** (p. 5, 59-60).
 * Le MD vient du niveau de la caractéristique (table p. 9) ; sans la compétence, MD−3, réduit par
 * Polyvalent (p. 58, 69). La marge est l'**Effet** (total − cible), lu sur six résultats (p. 61).
 * Un Coup de pouce lance un dé de plus et garde les deux meilleurs, un Coup du sort les deux pires ;
 * ils s'annulent et ne se cumulent jamais (p. 61).
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de jet lance
 * les dés et écrit sur la fiche ; la porte des dégâts appelle `encaisserTraveller`.
 */

/** Une ligne de compétence de la fiche : son niveau (vide = non formé) et son domaine. */
export interface LigneDeCompetenceDeTraveller {
    /** Le champ du niveau : vide, le Voyageur n'est pas formé ; 0, il l'est sans bonus (p. 58). */
    niveau: string;
    /** Le domaine (« Aéronef ») : une spécialité apprise ouvre les autres au niveau 0 (p. 58). */
    domaine: string;
    /** Le champ de la spécialité saisie (« Avion »), pour la dire. */
    specialite?: string;
}

/** Ce que le pilote nomme pour Traveller (`jet.traveller`). */
export interface RegleDeTraveller {
    /** Les champs des caractéristiques : leur niveau (0 à 15) donne le MD (p. 9). */
    caracteristiques: string[];
    /** Le champ du MD de chaque caractéristique, que la porte des dégâts recalcule (p. 74). */
    md?: Record<string, string>;
    /** Les lignes de compétence de la fiche. */
    competences: LigneDeCompetenceDeTraveller[];
    /** Le champ du niveau de Polyvalent (p. 69). */
    polyvalent?: string;
    /** Le nombre cible d'une tâche Moyenne : 8 (p. 5). */
    cible?: number;
}

/** La table des Modificateurs de caractéristiques (p. 9). */
export function mdDeCaracteristique(niveau: number): number {
    const n = Math.trunc(niveau);
    if (n <= 0) return -3;
    if (n <= 2) return -2;
    if (n <= 5) return -1;
    if (n <= 8) return 0;
    if (n <= 11) return 1;
    if (n <= 14) return 2;
    return 3;
}

/** Les Difficultés des tâches (p. 60). */
export const DIFFICULTES_DE_TRAVELLER = [
    { cible: 2, label: 'Simple' },
    { cible: 4, label: 'Facile' },
    { cible: 6, label: 'Routine' },
    { cible: 8, label: 'Moyenne' },
    { cible: 10, label: 'Difficile' },
    { cible: 12, label: 'Très Difficile' },
    { cible: 14, label: 'Extraordinaire' },
    { cible: 16, label: 'Impossible' },
] as const;

/** La pénalité de manque de compétence (p. 58). */
export const MANQUE_DE_COMPETENCE = -3;

/** Polyvalent réduit la pénalité d'un point par niveau, jusqu'à l'annuler au niveau 3 (p. 69). */
export function penaliteDeManque(polyvalent: number): number {
    const p = Math.max(0, Math.min(3, Math.trunc(polyvalent) || 0));
    return MANQUE_DE_COMPETENCE + p;
}

/** Profession : chaque spécialité s'apprend à part, sans ouvrir les autres au niveau 0 (p. 69). */
const PROFESSION = /^profession$/i;

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeTraveller {
    /** Le nombre cible fixé par l'Arbitre (p. 60). */
    difficulte: number;
    /** +1 : Coup de pouce ; −1 : Coup du sort ; 0 : aucun ou les deux, qui s'annulent (p. 61). */
    pouceOuSort: -1 | 0 | 1;
    /** Monter d'un cran sur la table des Durées : −1 (plus vite, MD−2) ; descendre : +1 (MD+2) (p. 62). */
    duree: -1 | 0 | 1;
    /** Les actions menées en même temps : chacune monte la difficulté d'un niveau (p. 62). */
    tachesSupplementaires: number;
    /** Le MD de la tâche précédente, dans une chaîne de tâches (p. 63). */
    chaine: number;
    /** Les autres MD que les règles listent : viser, portée, couvert… (p. 72). */
    autre: number;
}

export const CHOIX_DE_TRAVELLER: ChoixDeTraveller = { difficulte: 8, pouceOuSort: 0, duree: 0, tachesSupplementaires: 0, chaine: 0, autre: 0 };

/** Au-delà, un réglage ne décrit plus aucun test du livre : la relecture le refuse. */
const ACTIONS_AU_PLUS = 10;
const AUTRES_MD_AU_PLUS = 20;

/**
 * **Relire une préparation venue du réseau** (TRV-A1, 27/11/2026) — la demande de jet du meneur la
 * porte jusqu'à la tablette. *On ne croit que la forme qu'on attend* : une difficulté du livre
 * (2+ à 16+, p. 60), un Coup de pouce ou du sort et une durée entre −1 et +1, au plus dix actions
 * simultanées, une chaîne de −3 à +3 (p. 63) et des autres MD bornés. Une valeur hors de ces bornes
 * rend `undefined` : la tablette retombe alors sur sa préparation par défaut, sans rien inventer.
 */
export function lireLeChoixDeTraveller(v: unknown): ChoixDeTraveller | undefined {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
    const c = v as Record<string, unknown>;
    const entierEntre = (x: unknown, min: number, max: number): number | undefined =>
        typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max ? x : undefined;
    const difficulte = DIFFICULTES_DE_TRAVELLER.some(d => d.cible === c.difficulte) ? c.difficulte as number : undefined;
    const pouce = entierEntre(c.pouceOuSort, -1, 1);
    const duree = entierEntre(c.duree, -1, 1);
    const taches = entierEntre(c.tachesSupplementaires, 0, ACTIONS_AU_PLUS);
    const chaine = entierEntre(c.chaine, -3, 3);
    const autre = entierEntre(c.autre, -AUTRES_MD_AU_PLUS, AUTRES_MD_AU_PLUS);
    if (difficulte === undefined || pouce === undefined || duree === undefined || taches === undefined
        || chaine === undefined || autre === undefined) return undefined;
    return {
        difficulte, pouceOuSort: pouce as -1 | 0 | 1, duree: duree as -1 | 0 | 1,
        tachesSupplementaires: taches, chaine, autre,
    };
}

/** La cible effective : chaque action supplémentaire monte d'un niveau, soit +2 (p. 60, 62). */
export function cibleDeTraveller(choix: Pick<ChoixDeTraveller, 'difficulte' | 'tachesSupplementaires'>): number {
    return Math.trunc(choix.difficulte) + 2 * Math.max(0, Math.trunc(choix.tachesSupplementaires) || 0);
}

/** Ce que les réglages ajoutent au MD de la fiche : la durée (±2, p. 62), la chaîne et les autres MD. */
export function modificateursDeTraveller(mdDeLaFiche: number, choix: Pick<ChoixDeTraveller, 'duree' | 'chaine' | 'autre'>): number {
    return mdDeLaFiche + 2 * choix.duree + (Math.trunc(choix.chaine) || 0) + (Math.trunc(choix.autre) || 0);
}

// ─── Composer le jet depuis la fiche ────────────────────────────────────────

/** Le jet de la fiche, avant les réglages : d'où vient chaque MD. */
export interface CompositionDeTraveller {
    caracteristique?: { champ: string; label: string; niveau: number; md: number };
    competence?: {
        champ: string;
        label: string;
        /** Le niveau compté : celui de la ligne, 0 par une autre spécialité, ou la pénalité. */
        md: number;
        /** `null` : la ligne est vide. */
        niveau: number | null;
        formee: boolean;
        /** La ligne vide est couverte par une spécialité du même domaine (p. 58). */
        parUneAutreSpecialite?: boolean;
    };
    /** Le MD total de la fiche : caractéristique + compétence. */
    md: number;
    avertissements: string[];
    remarques: string[];
}

/** Un niveau saisi : un nombre, ou `null` pour une case vide (non formé). */
function niveauSaisi(v: unknown): number | null {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
}

const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/**
 * Compose le MD d'un test depuis la fiche : la caractéristique retenue (son niveau donne le MD) et
 * la compétence retenue (son niveau, 0 par une autre spécialité du domaine, ou MD−3 réduit par
 * Polyvalent). L'une et l'autre sont facultatives : un test de caractéristique n'a pas de
 * compétence, et certains tests de compétence se font sans caractéristique (p. 58-59).
 */
export function composerLeJetDeTraveller(
    regle: RegleDeTraveller,
    valeurs: Record<string, unknown>,
    champs: { caracteristique?: string; competence?: string },
    libelles: Record<string, string> = {},
): CompositionDeTraveller {
    const avertissements: string[] = [];
    const remarques: string[] = [];
    let caracteristique: CompositionDeTraveller['caracteristique'];
    let competence: CompositionDeTraveller['competence'];

    if (champs.caracteristique) {
        const niveau = niveauSaisi(valeurs[champs.caracteristique]);
        const label = libelles[champs.caracteristique] ?? champs.caracteristique;
        if (niveau === null) avertissements.push(`${label} : aucun niveau sur la fiche.`);
        else caracteristique = { champ: champs.caracteristique, label, niveau, md: mdDeCaracteristique(niveau) };
    }

    if (champs.competence) {
        const ligne = regle.competences.find(c => c.niveau === champs.competence);
        const specialite = ligne?.specialite ? String(valeurs[ligne.specialite] ?? '').trim() : '';
        const label = `${libelles[champs.competence] ?? ligne?.domaine ?? champs.competence}${specialite ? ` (${specialite})` : ''}`;
        const niveau = niveauSaisi(valeurs[champs.competence]);
        if (niveau !== null) {
            competence = { champ: champs.competence, label, md: niveau, niveau, formee: true };
        } else {
            // Une autre spécialité du même domaine ouvre celle-ci au niveau 0 — sauf Profession (p. 58, 69).
            const domaine = ligne?.domaine ?? '';
            const voisine = domaine && !PROFESSION.test(domaine)
                ? regle.competences.find(c => c !== ligne && c.domaine === domaine && niveauSaisi(valeurs[c.niveau]) !== null)
                : undefined;
            if (voisine) {
                competence = { champ: champs.competence, label, md: 0, niveau: null, formee: true, parUneAutreSpecialite: true };
                remarques.push(`${label} : une autre spécialité de ${domaine} est apprise, ce test se fait au niveau 0 (p. 58).`);
            } else {
                const polyvalent = regle.polyvalent ? niveauSaisi(valeurs[regle.polyvalent]) ?? 0 : 0;
                const md = penaliteDeManque(polyvalent);
                competence = { champ: champs.competence, label, md, niveau: null, formee: false };
                remarques.push(polyvalent > 0
                    ? `${label} : non formé, MD−3 réduit à MD${signe(md)} par Polyvalent ${Math.min(3, polyvalent)} (p. 69).`
                    : `${label} : non formé, MD−3 pour manque de compétence (p. 58).`);
            }
        }
    }

    return { caracteristique, competence, md: (caracteristique?.md ?? 0) + (competence?.md ?? 0), avertissements, remarques };
}

// ─── Lancer et lire l'Effet ─────────────────────────────────────────────────

export type BilanDeTraveller =
    | 'succes-exceptionnel' | 'succes-moyen' | 'succes-marginal'
    | 'echec-marginal' | 'echec-moyen' | 'echec-exceptionnel';

/** La table des Résultats des effets (p. 61). */
export const LIBELLES_DE_TRAVELLER: Record<BilanDeTraveller, string> = {
    'succes-exceptionnel': 'Succès exceptionnel',
    'succes-moyen': 'Succès moyen',
    'succes-marginal': 'Succès marginal',
    'echec-marginal': 'Échec marginal',
    'echec-moyen': 'Échec moyen',
    'echec-exceptionnel': 'Échec exceptionnel',
};

/** Ce que l'Arbitre peut en faire (p. 61). */
export const SENS_DES_EFFETS: Record<BilanDeTraveller, string> = {
    'succes-exceptionnel': 'le Voyageur réussit de manière impressionnante et élégante',
    'succes-moyen': 'le Voyageur réussit normalement',
    'succes-marginal': 'il réussit à peine, et peut devoir accepter une condition à sa réussite',
    'echec-marginal': 'il a presque réussi : l’Arbitre peut lui accorder le succès contre une conséquence importante',
    'echec-moyen': 'le Voyageur a échoué dans sa tâche',
    'echec-exceptionnel': 'il échoue de la pire façon possible : la situation empire',
};

const DEGRES: Record<BilanDeTraveller, DegreDeReussite> = {
    'succes-exceptionnel': 'reussite-particuliere',
    'succes-moyen': 'reussite-significative',
    'succes-marginal': 'reussite-normale',
    'echec-marginal': 'echec-normal',
    'echec-moyen': 'echec-particulier',
    'echec-exceptionnel': 'echec-total',
};

/** Le résultat lu sur l'Effet (p. 61). */
export function bilanDeLEffet(effet: number): BilanDeTraveller {
    if (effet >= 6) return 'succes-exceptionnel';
    if (effet >= 1) return 'succes-moyen';
    if (effet === 0) return 'succes-marginal';
    if (effet === -1) return 'echec-marginal';
    if (effet >= -5) return 'echec-moyen';
    return 'echec-exceptionnel';
}

/** La table des Chaînes de tâches : le MD que ce test donne au suivant (p. 63). */
export function mdPourLaTacheSuivante(effet: number): number {
    if (effet <= -6) return -3;
    if (effet <= -2) return -2;
    if (effet === -1) return -1;
    if (effet === 0) return 1;
    if (effet <= 5) return 2;
    return 3;
}

export interface JetDeTraveller extends RollResult {
    traveller: {
        des: number[];
        /** Les positions des deux dés gardés. */
        gardes: number[];
        /** La somme des deux dés gardés : le résultat « naturel » (p. 6). */
        naturel: number;
        modificateurs: number;
        resultat: number;
        cible: number;
        effet: number;
        bilan: BilanDeTraveller;
        libelle: string;
        /** +1 Coup de pouce, −1 Coup du sort. */
        pouceOuSort: -1 | 0 | 1;
    };
}

/** Le Coup de pouce et le Coup du sort s'annulent, et ne se cumulent jamais (p. 61). */
export function pouceOuSort(pouces: number, sorts: number): -1 | 0 | 1 {
    const p = pouces > 0 ? 1 : 0, s = sorts > 0 ? 1 : 0;
    return (p - s) as -1 | 0 | 1;
}

/** Résout un jet déjà lancé : deux dés, ou trois sous un Coup de pouce ou du sort. */
export function resoudreTraveller(des: readonly number[], solde: -1 | 0 | 1, modificateurs: number, cible: number): JetDeTraveller {
    const gardes = deuxDesGardes(des, solde);
    const naturel = gardes.reduce((t, i) => t + des[i], 0);
    const resultat = naturel + modificateurs;
    const effet = resultat - cible;
    const bilan = bilanDeLEffet(effet);
    const libelle = LIBELLES_DE_TRAVELLER[bilan];
    const reussi = effet >= 0;
    const rolls: DieResult[] = des.map((v, i) => ({ val: v, sides: 6, isDropped: !gardes.includes(i) }));
    return {
        total: resultat,
        rolls,
        modifier: modificateurs,
        successes: reussi ? 1 : 0,
        fails: 0,
        tagSuccess: reussi,
        degre: DEGRES[bilan],
        totalDisplay: `${libelle} (Effet ${signe(effet)}) — ${naturel} ${modificateurs < 0 ? `− ${-modificateurs}` : `+ ${modificateurs}`} = ${resultat} (${cible}+ pour réussir)`,
        traveller: { des: [...des], gardes, naturel, modificateurs, resultat, cible, effet, bilan, libelle, pouceOuSort: solde },
    };
}

/** Lance et résout : `de` rend un d6 (le panneau lui passe le moteur). */
export function lancerTraveller(solde: -1 | 0 | 1, modificateurs: number, de: () => number, cible: number): JetDeTraveller {
    const des = Array.from({ length: 2 + Math.abs(solde) }, de);
    return resoudreTraveller(des, solde, modificateurs, cible);
}

// ─── Les dégâts sur les caractéristiques physiques ─────────────────────────

export interface PhysiqueDeTraveller {
    endurance: number;
    force: number;
    dexterite: number;
}

export type EtatPhysiqueDeTraveller = 'debout' | 'inconscient' | 'mort';

export interface EncaissementDeTraveller extends PhysiqueDeTraveller {
    etat: EtatPhysiqueDeTraveller;
    /** Ce que chaque caractéristique a perdu, dans l'ordre où elles l'ont perdu. */
    pertes: { champ: keyof PhysiqueDeTraveller; points: number }[];
}

/** L'état d'un Voyageur : FOR ou DEX à 0, inconscient ; les trois à 0, tué (p. 74). */
export function etatPhysique(p: PhysiqueDeTraveller): EtatPhysiqueDeTraveller {
    if (p.endurance <= 0 && p.force <= 0 && p.dexterite <= 0) return 'mort';
    if (p.force <= 0 || p.dexterite <= 0) return 'inconscient';
    return 'debout';
}

/**
 * Les dégâts frappent d'abord l'END ; à 0, l'excédent va à la FOR ou à la DEX, au choix de la
 * cible ; quand l'une des deux tombe à 0, le reste va à la dernière (p. 74).
 */
export function encaisserTraveller(avant: PhysiqueDeTraveller, degats: number, excedentVers: 'force' | 'dexterite'): EncaissementDeTraveller {
    let reste = Math.max(0, Math.trunc(degats) || 0);
    const apres: PhysiqueDeTraveller = {
        endurance: Math.max(0, Math.trunc(avant.endurance) || 0),
        force: Math.max(0, Math.trunc(avant.force) || 0),
        dexterite: Math.max(0, Math.trunc(avant.dexterite) || 0),
    };
    const pertes: EncaissementDeTraveller['pertes'] = [];
    const autre = excedentVers === 'force' ? 'dexterite' : 'force';
    for (const champ of ['endurance', excedentVers, autre] as const) {
        const points = Math.min(reste, apres[champ]);
        if (points > 0) { apres[champ] -= points; reste -= points; pertes.push({ champ, points }); }
    }
    return { ...apres, etat: etatPhysique(apres), pertes };
}

/**
 * Les points rendus par un soin, « répartis équitablement entre toutes les caractéristiques
 * endommagées » comme les soins médicaux (p. 79), un point à la fois, sans dépasser le niveau
 * d'avant les blessures. Les premiers soins se répartissent au choix : le meneur corrige la fiche.
 */
export function soignerTraveller(avant: PhysiqueDeTraveller, maximum: PhysiqueDeTraveller, points: number): PhysiqueDeTraveller & { rendus: number } {
    const apres = { ...avant };
    let reste = Math.max(0, Math.trunc(points) || 0), rendus = 0;
    const ordre = ['endurance', 'force', 'dexterite'] as const;
    while (reste > 0) {
        const blessees = ordre.filter(c => apres[c] < maximum[c]);
        if (blessees.length === 0) break;
        for (const c of blessees) {
            if (reste === 0) break;
            apres[c] += 1; reste -= 1; rendus += 1;
        }
    }
    return { ...apres, rendus };
}
