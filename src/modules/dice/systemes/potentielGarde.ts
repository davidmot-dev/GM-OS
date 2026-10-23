import type { DegreDeReussite } from '../degresDeReussite';
import type { DieResult, RollResult } from '../DiceEngine';

/**
 * **Potentiel GARDE Compétence** — Crimes, C1 de l'audit (2026-10-22), livre
 * *Crimes 2 — Manuel de l'Enquêteur*, p. 385 et 409–411.
 *
 * On lance autant de d10 que le **Potentiel** ; on en **garde** autant que la
 * **Compétence** (1 sans elle, au seuil de base — Rachel Attar, p. 411). Le
 * seuil par dé vaut 9, 8 si le personnage est compétent, 7 avec une
 * spécialisation appropriée. **Tous les 1 sont gardés**, et chacun prend la
 * place d'une réussite ; le joueur peut aussi garder de mauvais dés pour
 * échouer volontairement.
 *
 * **Quatre bilans** (p. 385), et pas cinq : le « succès important » — au moins
 * trois réussites gardées — est une réussite qui fait baisser la Névrose
 * (p. 409), pas un bilan à part. Le contre-exemple de l'audit : Physique 5,
 * Traque 2, seuil 8, `[1, 3, 4, 6, 8]` → on garde `[1, 8]`, réussite mitigée.
 *
 * Tout ici est pur : le panneau lance, ce module garde et juge.
 */

export type BilanDeLaGarde = 'echec-critique' | 'echec' | 'reussite-mitigee' | 'reussite';

/** Ce que le pilote déclare : le seuil de base et ce que la compétence et la spécialisation en retirent. */
export interface RegleDeLaGarde {
    /** 9 chez Crimes. */
    seuil: number;
    /** Ce que retire une compétence (1) — un personnage « compétent ». */
    competent?: number;
    /** Ce que retire une spécialisation appropriée (2) — à la place du point de la compétence. */
    specialise?: number;
}

export const LIBELLES_DES_BILANS: Record<BilanDeLaGarde, string> = {
    'echec-critique': 'Échec critique',
    echec: 'Échec',
    'reussite-mitigee': 'Réussite mitigée',
    reussite: 'Réussite',
};

/** Combien de dés se gardent : le niveau de la compétence, un seul sans elle. */
export function quotaDeLaGarde(niveau: number): number {
    return Math.max(1, Math.floor(Number.isFinite(niveau) ? niveau : 0));
}

/**
 * Le seuil de chaque dé. La spécialisation suppose la compétence : sans elle,
 * le seuil reste celui de base.
 */
export function seuilDeLaGarde(regle: RegleDeLaGarde, niveau: number, specialise: boolean): number {
    if (niveau <= 0) return regle.seuil;
    return regle.seuil - (specialise ? (regle.specialise ?? 2) : (regle.competent ?? 1));
}

/**
 * Les dés gardés, par leur position dans le jet. **Tous les 1 d'abord**, même
 * au-delà du quota — ils sont gardés d'office ; puis les dés choisis par le
 * joueur (`voulus`, pour échouer volontairement), ou à défaut les meilleurs.
 */
export function garderLesDes(des: readonly number[], quota: number, voulus?: readonly number[]): number[] {
    const uns = des.map((v, i) => (v === 1 ? i : -1)).filter(i => i >= 0);
    const place = Math.max(0, quota - uns.length);
    const candidats = voulus
        ? voulus.filter(i => i >= 0 && i < des.length && des[i] !== 1)
        : des.map((v, i) => ({ v, i })).filter(d => d.v !== 1).sort((a, b) => b.v - a.v || a.i - b.i).map(d => d.i);
    return [...uns, ...[...new Set(candidats)].slice(0, place)];
}

/** Le bilan des dés gardés : les réussites, les 1, et ce que le livre en dit. */
export function bilanDeLaGarde(gardes: readonly number[], seuil: number): {
    reussites: number;
    uns: number;
    bilan: BilanDeLaGarde;
    /** Au moins trois réussites gardées sur une réussite : la Névrose baisse d'un point (p. 409). */
    succesImportant: boolean;
} {
    const reussites = gardes.filter(v => v !== 1 && v >= seuil).length;
    const uns = gardes.filter(v => v === 1).length;
    const bilan: BilanDeLaGarde = uns > reussites ? 'echec-critique'
        : reussites === 0 ? 'echec'
            : uns === reussites ? 'reussite-mitigee'
                : 'reussite';
    return { reussites, uns, bilan, succesImportant: bilan === 'reussite' && reussites >= 3 };
}

/** Le degré du moteur où se range un bilan — le libellé du livre, lui, voyage à part. */
export function degreDuBilan(bilan: BilanDeLaGarde, succesImportant: boolean): DegreDeReussite {
    if (bilan === 'echec-critique') return 'echec-total';
    if (bilan === 'echec') return 'echec-normal';
    return succesImportant ? 'reussite-significative' : 'reussite-normale';
}

/** Le jet résolu : les dés lancés, gardés et écartés, le bilan et ses effets sur la Névrose. */
export interface JetGarde extends RollResult {
    garde: {
        seuil: number;
        quota: number;
        /** Les positions des dés gardés. */
        gardes: number[];
        bilan: BilanDeLaGarde;
        libelle: string;
        reussites: number;
        uns: number;
        succesImportant: boolean;
        /** Des réussites n'ont pas pu être gardées : +1 Névrose (p. 409). */
        reussitesNonGardees: number;
        /** Les réussites gardées en plus par le dépassement (C3) : autant de fatigue sur le Potentiel. */
        depassement: number;
    };
}

/**
 * Résout un jet déjà lancé. `voulus` : les dés que le joueur choisit de garder,
 * hors les 1. `depassement` : combien de réussites restées hors de la garde le
 * personnage garde **en plus** en se dépassant (p. 385, 409) — les meilleures.
 */
export function resoudreLaGarde(
    des: readonly number[], quota: number, seuil: number, voulus?: readonly number[], depassement = 0,
): JetGarde {
    const dansLaGarde = garderLesDes(des, quota, voulus);
    const enPlus = des.map((v, i) => ({ v, i }))
        .filter(d => !dansLaGarde.includes(d.i) && d.v !== 1 && d.v >= seuil)
        .sort((a, b) => b.v - a.v || a.i - b.i)
        .slice(0, Math.max(0, depassement))
        .map(d => d.i);
    const gardes = [...dansLaGarde, ...enPlus];
    const gardees = gardes.map(i => des[i]);
    const b = bilanDeLaGarde(gardees, seuil);
    const reussitesNonGardees = des.filter((v, i) => !gardes.includes(i) && v !== 1 && v >= seuil).length;
    const rolls: DieResult[] = des.map((v, i) => {
        const garde = gardes.includes(i);
        return { val: v, sides: 10, isDropped: !garde, isCritMax: garde && v !== 1 && v >= seuil, isCritMin: garde && v === 1 };
    });
    const libelle = b.succesImportant ? `${LIBELLES_DES_BILANS[b.bilan]} — succès important` : LIBELLES_DES_BILANS[b.bilan];
    const dit = enPlus.length > 0 ? `, dont ${enPlus.length} par dépassement` : '';
    const reussi = b.bilan === 'reussite' || b.bilan === 'reussite-mitigee';
    return {
        total: b.reussites,
        rolls,
        modifier: 0,
        successes: b.reussites,
        fails: b.uns,
        tagSuccess: reussi,
        degre: degreDuBilan(b.bilan, b.succesImportant),
        totalDisplay: `${libelle} — gardés ${gardees.join(', ') || 'aucun'} (seuil ${seuil}${dit})`,
        garde: {
            seuil, quota, gardes, bilan: b.bilan, libelle, reussites: b.reussites, uns: b.uns,
            succesImportant: b.succesImportant, reussitesNonGardees, depassement: enPlus.length,
        },
    };
}

/** Ce que le jet fait à la Névrose, dit au meneur (C4 l'écrira) : p. 409. */
export function effetsSurLaNevrose(jet: JetGarde['garde']): string[] {
    const dits: string[] = [];
    if (jet.bilan === 'echec' || jet.bilan === 'echec-critique') dits.push('Échec : +1 Névrose.');
    if (jet.reussitesNonGardees > 0) dits.push(`${jet.reussitesNonGardees} réussite${jet.reussitesNonGardees > 1 ? 's' : ''} non gardée${jet.reussitesNonGardees > 1 ? 's' : ''} : +1 Névrose.`);
    if (jet.succesImportant) dits.push('Succès important : −1 Névrose.');
    return dits;
}

/*
  ---- Les atteintes (C2, livre p. 395–396) ---------------------------------------

  Les Potentiels sont des jauges : la valeur de départ ne bouge pas, le jet se
  fait avec la valeur **actuelle**. Trois marques la font baisser — la fatigue
  (un trait, effacée en fin de scène), l'épuisement (une croix, une par bonne
  nuit) et la blessure (une étoile, au soin). Une marque plus grave **prend la
  place** d'une marque moindre déjà notée : deux fatigues sociales et une
  croix d'épuisement font une fatigue et une croix (exemple p. 395).
*/

export type Atteinte = 'fatigue' | 'epuisement' | 'blessures';

export interface MarquesDuPotentiel { fatigue: number; epuisement: number; blessures: number }

export const LIBELLES_DES_ATTEINTES: Record<Atteinte, string> = {
    fatigue: 'Fatigue', epuisement: 'Épuisement', blessures: 'Blessure',
};

/** Une marque de plus, posée à la place d'une marque moindre s'il y en a une. */
export function poserUneAtteinte(m: MarquesDuPotentiel, atteinte: Atteinte): MarquesDuPotentiel {
    const n = { ...m };
    if (atteinte === 'epuisement' && n.fatigue > 0) n.fatigue -= 1;
    if (atteinte === 'blessures') {
        if (n.epuisement > 0) n.epuisement -= 1;
        else if (n.fatigue > 0) n.fatigue -= 1;
    }
    n[atteinte] += 1;
    return n;
}

/** Le Potentiel actuel : la valeur de départ moins toutes les marques. Il peut passer sous zéro. */
export function potentielActuel(base: number, m: MarquesDuPotentiel): number {
    return base - m.fatigue - m.epuisement - m.blessures;
}

/**
 * Ce que le Physique actuel dit du personnage : hors de combat à 0 (p. 395),
 * blessure grave en dessous de −1 (p. 396). **Aucune mort automatique** : le
 * livre n'en fixe pas.
 */
export function etatDuPhysique(actuel: number): string | null {
    if (actuel < -1) {
        return 'Blessure grave (p. 396) : Physique de départ −1 jusqu’à une chirurgie réussie, +1 Psychose, '
            + 'autant de Névrose que de blessures subies, et un test psychotique à un seul dé.';
    }
    if (actuel <= 0) return 'Hors de combat : à bout de souffle ou terrassé par la douleur (p. 395).';
    return null;
}
