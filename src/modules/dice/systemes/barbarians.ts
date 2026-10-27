import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet de Barbarians of Lemuria** — 27/10/2026, à la demande de David (« finir le
 * pilote », livre français Mythic, pages **imprimées**).
 *
 * Le pilote forgé comparait chaque d6 à « attribut + carrière + aptitude » et
 * n'exigeait aucune réussite : tout jet réussissait d'office. Le livre additionne :
 * **2d6 + attribut + carrière (hors combat) ou aptitude de combat (en combat) +
 * difficulté − défense de la cible, réussi sur 9 ou plus** (p. 10, 56, 62). Un double 6
 * réussit toujours et vaut un succès héroïque ; un double 1 échoue toujours (p. 56-57).
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de
 * jet lance les dés et écrit sur la fiche, jamais ce module.
 */

/** Ce que le pilote nomme pour Barbarians (`jet.barbarians`). */
export interface RegleDeBarbarians {
    /** Le champ des points d'héroïsme, que dépensent la Faveur divine et les succès (p. 58-59). */
    heroisme?: string;
    /** Le seuil de réussite : 9 dans le livre (p. 10). */
    cible?: number;
}

/** L'échelle de difficulté du livre, et sa portée de tir équivalente (p. 57). */
export const DIFFICULTES_DE_BARBARIANS = [
    { modificateur: 2, label: 'Très facile' },
    { modificateur: 1, label: 'Facile', portee: 'Bout portant' },
    { modificateur: 0, label: 'Moyenne', portee: 'Courte' },
    { modificateur: -1, label: 'Ardue', portee: 'Moyenne' },
    { modificateur: -2, label: 'Difficile', portee: 'Longue' },
    { modificateur: -4, label: 'Très difficile', portee: 'Très longue' },
    { modificateur: -6, label: 'Impossible', portee: 'Extrême' },
    { modificateur: -8, label: 'Héroïque', portee: 'Maximale' },
] as const;

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeBarbarians {
    /** Le modificateur de difficulté, lu sur l'échelle (p. 57). */
    difficulte: number;
    /** La Défense de la cible au jet d'attaque, la plus haute Initiative adverse au jet de réaction (p. 60, 62). */
    opposition: number;
    /** Les autres modificateurs du MJ : posture, portée hors de l'échelle, horde… */
    autre: number;
    /** Dés de bonus (avantages) et de malus (désavantages) : ils s'annulent un à un (p. 16-17). */
    bonus: number;
    malus: number;
    /** Le jet de réaction place le héros dans l'ordre du combat (p. 60). */
    reaction: boolean;
}

export const CHOIX_DE_BARBARIANS: ChoixDeBarbarians = { difficulte: 0, opposition: 0, autre: 0, bonus: 0, malus: 0, reaction: false };

export type BilanDeBarbarians =
    | 'succes-legendaire' | 'succes-heroique' | 'reussite'
    | 'echec' | 'echec-automatique' | 'echec-critique';

export const LIBELLES_DE_BARBARIANS: Record<BilanDeBarbarians, string> = {
    'succes-legendaire': 'Succès légendaire',
    'succes-heroique': 'Succès héroïque',
    reussite: 'Réussite',
    echec: 'Échec',
    'echec-automatique': 'Échec automatique',
    'echec-critique': 'Échec critique',
};

const DEGRES: Record<BilanDeBarbarians, DegreDeReussite> = {
    'succes-legendaire': 'reussite-particuliere',
    'succes-heroique': 'reussite-significative',
    reussite: 'reussite-normale',
    echec: 'echec-normal',
    'echec-automatique': 'echec-particulier',
    'echec-critique': 'echec-total',
};

/** La place du héros dans l'ordre de réaction, selon son jet (p. 60). */
export const ORDRE_DE_REACTION: Record<BilanDeBarbarians, string> = {
    'succes-legendaire': '1er : avant tout le monde, +1 aux jets d’attaque pour tout le combat ; coriaces et piétaille perdent le premier round',
    'succes-heroique': '2e : avant tout le monde ; coriaces et piétaille perdent le premier round',
    reussite: '3e : avant les rivaux, les coriaces et la piétaille',
    echec: '6e : après les rivaux et les coriaces, avant la piétaille',
    'echec-automatique': '6e : après les rivaux et les coriaces, avant la piétaille',
    'echec-critique': 'Dernier pendant tout le combat, interdit au premier round, sans bonus de bouclier',
};

export interface JetDeBarbarians extends RollResult {
    barbarians: {
        des: number[];
        /** Les positions des deux dés gardés. */
        gardes: number[];
        /** La somme des deux dés gardés. */
        naturel: number;
        modificateurs: number;
        resultat: number;
        cible: number;
        bilan: BilanDeBarbarians;
        libelle: string;
        /** Le double 6 sur une action qui ne pouvait réussir qu'ainsi : réussite, sans succès héroïque (p. 56). */
        seulementSurDoubleSix: boolean;
        doubleSix: boolean;
        doubleUn: boolean;
    };
}

/** Le solde des dés de bonus et de malus : positif, des bonus ; négatif, des malus (p. 17). */
export function soldeDesDes(bonus: number, malus: number): number {
    return Math.max(0, Math.trunc(bonus) || 0) - Math.max(0, Math.trunc(malus) || 0);
}

/** Combien de d6 lancer : deux, plus un par dé de bonus ou de malus restant (p. 8). */
export function nombreDeDesDeBarbarians(bonus: number, malus: number): number {
    return 2 + Math.abs(soldeDesDes(bonus, malus));
}

/** Les deux dés gardés : les meilleurs avec des bonus, les pires avec des malus (p. 8). */
export function deuxDesGardes(des: readonly number[], solde: number): number[] {
    const ordre = des.map((v, i) => ({ v, i }));
    if (solde > 0) ordre.sort((a, b) => b.v - a.v || a.i - b.i);
    else if (solde < 0) ordre.sort((a, b) => a.v - b.v || a.i - b.i);
    return ordre.slice(0, 2).map(d => d.i).sort((a, b) => a - b);
}

const signe = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);

function rendre(base: Omit<JetDeBarbarians['barbarians'], 'libelle'>, rolls: DieResult[]): JetDeBarbarians {
    const libelle = LIBELLES_DE_BARBARIANS[base.bilan];
    const reussi = base.bilan === 'reussite' || base.bilan === 'succes-heroique' || base.bilan === 'succes-legendaire';
    const naturelDit = base.doubleSix ? 'double 6' : base.doubleUn ? 'double 1' : `${base.naturel}`;
    return {
        total: base.resultat,
        rolls,
        modifier: base.modificateurs,
        successes: reussi ? 1 : 0,
        fails: 0,
        tagSuccess: reussi,
        degre: DEGRES[base.bilan],
        totalDisplay: `${libelle} — ${naturelDit} ${signe(base.modificateurs)} = ${base.resultat} (${base.cible} ou plus pour réussir)`,
        barbarians: { ...base, libelle },
    };
}

/**
 * Résout un jet déjà lancé. `modificateurs` : tout ce qui s'ajoute aux deux dés gardés —
 * attribut, carrière ou aptitude, difficulté, moins la défense ou l'Initiative adverse.
 */
export function resoudreBarbarians(des: readonly number[], solde: number, modificateurs: number, cible = 9): JetDeBarbarians {
    const gardes = deuxDesGardes(des, solde);
    const [a, b] = gardes.map(i => des[i]);
    const naturel = a + b;
    const doubleSix = a === 6 && b === 6;
    const doubleUn = a === 1 && b === 1;
    const resultat = naturel + modificateurs;
    // Sans le double 6, le meilleur jet possible (11) n'atteindrait pas la cible.
    const seulementSurDoubleSix = 11 + modificateurs < cible;
    const bilan: BilanDeBarbarians = doubleUn ? 'echec-automatique'
        : doubleSix ? (seulementSurDoubleSix ? 'reussite' : 'succes-heroique')
        : resultat >= cible ? 'reussite' : 'echec';
    const rolls: DieResult[] = des.map((v, i) => {
        const garde = gardes.includes(i);
        return { val: v, sides: 6, isDropped: !garde, isCritMax: garde && doubleSix, isCritMin: garde && doubleUn };
    });
    return rendre({ des: [...des], gardes, naturel, modificateurs, resultat, cible, bilan, seulementSurDoubleSix, doubleSix, doubleUn }, rolls);
}

/** Lance et résout : `de` rend un d6 (le panneau lui passe le moteur). */
export function lancerBarbarians(solde: number, modificateurs: number, de: () => number, cible = 9): JetDeBarbarians {
    const des = Array.from({ length: 2 + Math.abs(solde) }, de);
    return resoudreBarbarians(des, solde, modificateurs, cible);
}

/** Ce que la somme des composantes et les réglages du joueur ajoutent aux dés. */
export function modificateursDeBarbarians(seuil: number, choix: ChoixDeBarbarians): number {
    return seuil + choix.difficulte + choix.autre - choix.opposition;
}

/** Une dépense ou un geste après le jet (p. 57-59). */
export type GesteDeBarbarians = 'heroique' | 'legendaire' | 'critique';

/** Le geste est-il offert sur ce résultat ? */
export function gesteOffert(jet: JetDeBarbarians['barbarians'], geste: GesteDeBarbarians): boolean {
    if (geste === 'heroique') return jet.bilan === 'reussite' && !jet.doubleSix;
    // Seul un double 6 qui est un succès héroïque devient légendaire ; pas une réussite achetée (p. 59).
    if (geste === 'legendaire') return jet.bilan === 'succes-heroique' && jet.doubleSix;
    return jet.bilan === 'echec-automatique';
}

/**
 * Applique le geste : 1 point d'héroïsme rend un succès héroïque d'une réussite, ou
 * légendaire d'un succès héroïque sur double 6 ; l'échec critique se choisit sur un
 * double 1, et le MJ peut alors accorder un point d'héroïsme (p. 57, 59).
 */
export function appliquerLeGeste(jet: JetDeBarbarians, geste: GesteDeBarbarians): JetDeBarbarians {
    if (!gesteOffert(jet.barbarians, geste)) return jet;
    const bilan: BilanDeBarbarians = geste === 'heroique' ? 'succes-heroique' : geste === 'legendaire' ? 'succes-legendaire' : 'echec-critique';
    const b = jet.barbarians;
    return rendre({
        des: b.des, gardes: b.gardes, naturel: b.naturel, modificateurs: b.modificateurs, resultat: b.resultat, cible: b.cible,
        bilan, seulementSurDoubleSix: b.seulementSurDoubleSix, doubleSix: b.doubleSix, doubleUn: b.doubleUn,
    }, jet.rolls);
}

/** Le nombre de points d'héroïsme lu sur la fiche, jamais négatif. */
export function heroismeDeLaFiche(valeur: unknown): number {
    const n = Math.trunc(Number(valeur));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
}
