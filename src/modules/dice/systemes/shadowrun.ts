import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet de Shadowrun : Anarchy 2.0** — 31/10/2026, à la demande de David (« finir le
 * pilote », livre de base `sran2_01anarchyv2_web_v1`, pages **imprimées** : PDF − 2).
 *
 * Le pilote forgé additionnait la compétence et l'attribut en un SEUIL par dé (9 sur un
 * d6), ne lançait aucun dé et exigeait trois réussites : tout échouait. Le livre :
 * - la **réserve** vaut Compétence + Attribut, +2 dés avec la spécialisation ; *« aucune
 *   circonstance ne peut faire changer ce nombre de dés »* (p. 64) ;
 * - chaque **5 ou 6** est un succès ; un **avantage** fait compter les 4, un
 *   **désavantage** ne laisse que les 6 ; ils se cumulent sans dépasser un (p. 65) ;
 * - le test réussit si les succès atteignent le **seuil** (2 facile … 8 extrême) ; au-delà,
 *   des **succès nets**, et quatre nets font une réussite exceptionnelle (p. 64) ;
 * - le joueur remplace des dés par des **dés de risque** : leurs succès comptent double,
 *   leurs 1 font une complication mineure (un), critique (deux) ou un **désastre** (trois
 *   et plus), qui fait échouer le test ; la **réduction du risque** (RR, au plus 3) ignore
 *   autant de 1 (p. 70-71) ;
 * - une complication critique rapporte 1 point d'Anarchy, un désastre 2 (p. 77) ;
 * - la **règle de risque alternative** (p. 72) remplace les dés de risque par un dé spécial
 *   par niveau de RR, ajouté à la réserve, qui vaut −1 à 3 succès.
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de jet
 * lance les dés et écrit sur la fiche, jamais ce module.
 */

/** Ce que le pilote nomme pour Shadowrun (`jet.shadowrun`). */
export interface RegleDeShadowrun {
    /** SR-A1/A2/A3 — capacités explicites du pilote, jamais reconnues par son nom. */
    suivi?: RegleDuMoniteurShadowrun;
    derives?: import('./suiviDeShadowrun').RegleDesDerivesShadowrun;
    matrice?: import('./matriceDeShadowrun').RegleMatriceShadowrun;
    /** Les points d'Anarchy du personnage : relancer, obtenir un avantage (p. 77). */
    anarchy?: string;
    /** L'Essence : elle annule des succès aux tests de magie (p. 60). */
    essence?: string;
    /** Le moniteur d'état : une blessure grave impose un désavantage (p. 68). */
    blessures?: { legeres: string; graves: string; incapacitantes: string };
    /**
     * La réduction du risque écrite sur la ligne de chaque compétence : compétence → champ
     * de sa RR. Elle se propose au jet ; le joueur la corrige si l'atout ne s'applique pas.
     */
    rrDesCompetences?: Record<string, string>;
    /** La règle de risque alternative (p. 72) : des dés spéciaux au lieu des dés de risque. */
    risqueAlternatif?: boolean;
}

/** Contrat pur partagé par le pilote, les dégâts et le suivi ; aucun magasin dans les types. */
export interface RegleDuMoniteurShadowrun {
    mecanique: 'shadowrun'; suivi?: boolean;
    legeres: string; graves: string; incapacitantes: string; sante?: string;
    capacites?: { legeres?: string; graves?: string };
    seuils?: Partial<Record<'principale' | 'secondaire' | 'sans_armure' | 'mental', Partial<Record<'legere' | 'grave' | 'incapacitante', string>>>>;
    force?: string; volonte?: string;
}

/** L'échelle de difficulté du livre : le seuil, en succès (p. 64). */
export const DIFFICULTES_DE_SHADOWRUN = [
    { seuil: 2, label: 'Facile' },
    { seuil: 3, label: 'Normale' },
    { seuil: 4, label: 'Difficile' },
    { seuil: 6, label: 'Ardue' },
    { seuil: 8, label: 'Extrême' },
] as const;

export type NiveauDeRisque = 'faible' | 'normal' | 'fort' | 'extreme';

export const LIBELLES_DU_RISQUE: Record<NiveauDeRisque, string> = {
    faible: 'Précautionneuse',
    normal: 'Normale',
    fort: 'Risquée',
    extreme: 'Suicidaire',
};

/**
 * « Combien prendre de dés de risque ? » (p. 71), par réduction du risque. Le tiret du
 * livre (RR 3, suicidaire) est `null` : aucun nombre ne l'atteint. La table est
 * indicative : le joueur prend librement de 0 à toute sa réserve.
 */
export const DES_DE_RISQUE_CONSEILLES: Record<0 | 1 | 2 | 3, Record<NiveauDeRisque, number | null>> = {
    0: { faible: 1, normal: 2, fort: 4, extreme: 6 },
    1: { faible: 3, normal: 5, fort: 7, extreme: 10 },
    2: { faible: 5, normal: 8, fort: 11, extreme: 13 },
    3: { faible: 8, normal: 12, fort: 15, extreme: null },
};

/** La RR se cumule, sans dépasser 3 (p. 71). */
export const RR_MAXIMALE = 3;

const entier = (n: unknown) => Math.trunc(Number(n) || 0);
const borne = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const rrBornee = (rr: unknown) => borne(entier(rr), 0, RR_MAXIMALE) as 0 | 1 | 2 | 3;

/** Le nombre de dés de risque d'une action normale, sans dépasser la réserve. */
export function desDeRisqueConseilles(rr: unknown, niveau: NiveauDeRisque, reserve: number): number {
    const n = DES_DE_RISQUE_CONSEILLES[rrBornee(rr)][niveau];
    return borne(n ?? reserve, 0, Math.max(0, reserve));
}

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeShadowrun {
    /** La spécialisation s'applique : +2 dés (p. 52). */
    specialisation: boolean;
    /**
     * Les dés de la réserve remplacés par des dés de risque. Absent : ceux d'une action
     * **normale**, qui est l'action par défaut du livre (p. 71).
     */
    desDeRisque?: number;
    /** La réduction du risque des atouts qui s'appliquent, 0 à 3. Absente : celle de la ligne de la compétence. */
    rr?: number;
    /** Les conditions jugées par le meneur : −1 désavantage, 0, +1 avantage. */
    situation: number;
    /** Un point d'Anarchy dépensé pour obtenir un avantage, déclaré avant le jet (p. 77). */
    anarchyPourAvantage: boolean;
    /** Une blessure légère encaissée depuis la dernière narration du personnage (p. 68). */
    blessureLegereRecente: boolean;
    /** Un test lié à la magie : l'Essence perdue y annule des succès (p. 60). */
    magie: boolean;
    drain?: boolean;
    social?: boolean;
    matrice?: import('./matriceDeShadowrun').ContexteMatriceShadowrun;
}

export const CHOIX_DE_SHADOWRUN: ChoixDeShadowrun = {
    specialisation: false, situation: 0, anarchyPourAvantage: false, blessureLegereRecente: false, magie: false,
};

/** Les succès que l'Essence annule aux tests de magie : un à 5 ou moins, deux à 3 ou moins (p. 60). */
export function succesAnnulesParLEssence(essence: number | undefined): number {
    if (essence === undefined || !Number.isFinite(essence)) return 0;
    return (essence <= 5 ? 1 : 0) + (essence <= 3 ? 1 : 0);
}

/** Les succès supplémentaires qu'exige un soin sur ce personnage : un à 4 ou moins, deux à 2 ou moins (p. 60). */
export function seuilDeSoinRelevePar(essence: number | undefined): number {
    if (essence === undefined || !Number.isFinite(essence)) return 0;
    return (essence <= 4 ? 1 : 0) + (essence <= 2 ? 1 : 0);
}

/** La réserve d'une action et ce qui la module. */
export interface ReserveDeShadowrun {
    /** Compétence + Attribut. */
    base: number;
    specialisation: number;
    /** Les dés lancés. */
    des: number;
    /** Dont dés de risque (règle standard) ; zéro sous la règle alternative. */
    risque: number;
    /** Ceux d'une action normale à cette RR (p. 71) : la valeur par défaut, et le repère du panneau. */
    risqueNormal: number;
    /** Les dés spéciaux de la règle alternative : un par niveau de RR (p. 72). */
    speciaux: number;
    rr: 0 | 1 | 2 | 3;
    /** −1 désavantage, 0, +1 avantage : la somme des sources, bornée (p. 65). */
    avantage: -1 | 0 | 1;
    /** La valeur que chaque dé doit atteindre : 4, 5 ou 6. */
    valeurDuSucces: 4 | 5 | 6;
    /** Ce qui a donné l'avantage ou le désavantage, pour le dire. */
    sources: string[];
    /** Les succès annulés par l'Essence, sur un test de magie. */
    annules: number;
    alternatif: boolean;
}

export interface EtatDuPersonnage {
    graves?: number;
    incapacitantes?: number;
    essence?: number;
    legereRecente?: boolean;
    drainMineur?: boolean;
    avantageMatrice?: boolean;
}

/** Réserve = Compétence (+2 spécialisation) + Attribut ; l'avantage se borne à un (p. 64-65). */
export function reserveDeShadowrun(
    base: number, choix: Partial<ChoixDeShadowrun>, etat: EtatDuPersonnage = {}, alternatif = false,
): ReserveDeShadowrun {
    const specialisation = choix.specialisation ? 2 : 0;
    const des = Math.max(0, entier(base) + specialisation);
    const rr = rrBornee(choix.rr);
    const risqueNormal = desDeRisqueConseilles(rr, 'normal', des);
    const sources: string[] = [];
    let somme = 0;
    const situation = borne(entier(choix.situation), -1, 1);
    if (situation > 0) { somme += 1; sources.push('avantage de situation'); }
    if (situation < 0) { somme -= 1; sources.push('désavantage de situation'); }
    if (choix.anarchyPourAvantage) { somme += 1; sources.push("point d'Anarchy"); }
    if (entier(etat.graves) > 0) { somme -= 1; sources.push('blessure grave'); }
    if (choix.blessureLegereRecente || etat.legereRecente) { somme -= 1; sources.push('blessure légère récente'); }
    if (choix.magie && etat.drainMineur) { somme -= 1; sources.push('drain jusqu’à la fin de la prochaine narration'); }
    if (choix.social && etat.essence !== undefined && etat.essence <= 1) { somme -= 1; sources.push('Essence : test social'); }
    if (etat.avantageMatrice) { somme += 1; sources.push('cybercombat en RV hot-sim'); }
    const avantage = borne(somme, -1, 1) as -1 | 0 | 1;
    return {
        base: entier(base), specialisation, des,
        risque: alternatif ? 0 : choix.desDeRisque === undefined ? risqueNormal : borne(entier(choix.desDeRisque), 0, des),
        risqueNormal,
        speciaux: alternatif ? rr : 0,
        rr, avantage, valeurDuSucces: avantage > 0 ? 4 : avantage < 0 ? 6 : 5,
        sources, annules: choix.magie ? succesAnnulesParLEssence(etat.essence) : 0, alternatif,
    };
}

export type Complication = 'aucune' | 'mineure' | 'critique' | 'desastre';

export const LIBELLES_DES_COMPLICATIONS: Record<Complication, string> = {
    aucune: '',
    mineure: 'Complication mineure',
    critique: 'Complication critique',
    desastre: 'Désastre',
};

/** Ce que les complications rapportent en points d'Anarchy (p. 77). */
export const ANARCHY_DES_COMPLICATIONS: Record<Complication, number> = { aucune: 0, mineure: 0, critique: 1, desastre: 2 };

/** Le nombre de 1 restants après la RR décide de la complication (p. 70). */
export function complicationDe(uns: number): Complication {
    return uns >= 3 ? 'desastre' : uns === 2 ? 'critique' : uns === 1 ? 'mineure' : 'aucune';
}

/** Ce que vaut un dé spécial de la règle alternative (p. 72). */
export const VALEURS_DU_DE_SPECIAL = [-1, 0, 1, 2, 2, 3] as const;

/** Deux 1 consécutifs : complication critique ; trois : désastre — jamais de mineure (p. 72). */
export function complicationDesSpeciaux(speciaux: readonly number[]): Complication {
    let suite = 0, pire = 0;
    for (const v of speciaux) { suite = v === 1 ? suite + 1 : 0; pire = Math.max(pire, suite); }
    return pire >= 3 ? 'desastre' : pire === 2 ? 'critique' : 'aucune';
}

export interface JetDeShadowrun extends RollResult {
    shadowrun: {
        normaux: number[];
        risque: number[];
        speciaux: number[];
        valeurDuSucces: 4 | 5 | 6;
        succes: number;
        /** Les 1 des dés de risque avant la RR, puis ceux qui restent. */
        uns: number;
        unsRestants: number;
        rr: number;
        annules: number;
        seuil: number;
        nets: number;
        reussi: boolean;
        exceptionnelle: boolean;
        complication: Complication;
        /** Les points d'Anarchy que la complication rapporte. */
        anarchyGagnee: number;
        /** Le jet a été relancé : la complication est celle du premier (p. 77). */
        relance: boolean;
        libelle: string;
    };
}

function degreDe(reussi: boolean, exceptionnelle: boolean, complication: Complication): DegreDeReussite {
    if (complication === 'desastre') return 'echec-total';
    if (!reussi) return 'echec-normal';
    return exceptionnelle ? 'reussite-particuliere' : 'reussite-normale';
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/**
 * Résout un jet déjà lancé. `complicationImposee` sert à la relance : *« une complication
 * restera une complication après avoir relancé les dés […] relancer un jet n'ayant donné
 * aucune complication ne risque pas d'en provoquer une »* (p. 77).
 */
export function resoudreShadowrun(
    des: { normaux: readonly number[]; risque?: readonly number[]; speciaux?: readonly number[] },
    reserve: Pick<ReserveDeShadowrun, 'valeurDuSucces' | 'rr' | 'annules'>,
    seuil: number,
    complicationImposee?: Complication,
): JetDeShadowrun {
    const normaux = [...des.normaux], risque = [...(des.risque ?? [])], speciaux = [...(des.speciaux ?? [])];
    const v = reserve.valeurDuSucces;
    const bruts = normaux.filter(d => d >= v).length
        + 2 * risque.filter(d => d >= v).length
        // Les (dés)avantages n'ont pas d'effet sur les dés spéciaux (p. 72).
        + speciaux.reduce((s, d) => s + (VALEURS_DU_DE_SPECIAL[d - 1] ?? 0), 0);
    const succes = Math.max(0, bruts - Math.max(0, reserve.annules));
    const uns = risque.filter(d => d === 1).length;
    const unsRestants = Math.max(0, uns - reserve.rr);
    const tiree = speciaux.length > 0 ? complicationDesSpeciaux(speciaux) : complicationDe(unsRestants);
    const complication = complicationImposee ?? tiree;
    // Sauf exception, le désastre fait échouer le test (p. 70) ; le meneur peut forcer l'échec sur une critique.
    const reussi = succes >= seuil && complication !== 'desastre';
    const nets = Math.max(0, succes - seuil);
    const exceptionnelle = reussi && nets >= 4;
    const relance = complicationImposee !== undefined;
    // Relancer ne rapporte rien de plus : l'Anarchy de la complication a été gagnée au premier jet.
    const anarchyGagnee = relance ? 0 : ANARCHY_DES_COMPLICATIONS[complication];
    const libelle = (reussi ? (exceptionnelle ? 'Réussite exceptionnelle' : 'Réussite') : 'Échec')
        + (complication !== 'aucune' ? ` — ${LIBELLES_DES_COMPLICATIONS[complication].toLowerCase()}` : '');
    const rolls: DieResult[] = [
        ...normaux.map(d => ({ val: d, sides: 6, isCritMax: d >= v, isCritMin: false })),
        ...risque.map(d => ({ val: d, sides: 6, isCritMax: d >= v, isCritMin: d === 1 })),
        ...speciaux.map(d => ({ val: d, sides: 6, isCritMax: d === 6, isCritMin: d === 1 })),
    ];
    const detail = [
        `${succes} succès`,
        reussi && nets > 0 ? pluriel(nets, 'net') : '',
        reserve.annules > 0 ? `${reserve.annules} annulé${reserve.annules > 1 ? 's' : ''} par l'Essence` : '',
        uns > 0 && reserve.rr > 0 ? `${pluriel(uns, 'un')} de risque, RR ${reserve.rr}` : '',
        anarchyGagnee > 0 ? `+${anarchyGagnee} Anarchy` : '',
    ].filter(Boolean).join(', ');
    return {
        total: succes,
        rolls,
        modifier: 0,
        successes: succes,
        fails: unsRestants,
        tagSuccess: reussi,
        degre: degreDe(reussi, exceptionnelle, complication),
        totalDisplay: `${libelle} — ${detail} (seuil ${seuil})`,
        shadowrun: {
            normaux, risque, speciaux, valeurDuSucces: v, succes, uns, unsRestants, rr: reserve.rr,
            annules: reserve.annules, seuil, nets, reussi, exceptionnelle, complication, anarchyGagnee, relance, libelle,
        },
    };
}

/** Lance et résout : `de` rend un d6 (le panneau lui passe le moteur). */
export function lancerShadowrun(
    reserve: Pick<ReserveDeShadowrun, 'des' | 'risque' | 'speciaux' | 'valeurDuSucces' | 'rr' | 'annules'>,
    seuil: number, de: () => number, complicationImposee?: Complication,
): JetDeShadowrun {
    const lancer = (n: number) => Array.from({ length: Math.max(0, n) }, de);
    return resoudreShadowrun(
        { normaux: lancer(reserve.des - reserve.risque), risque: lancer(reserve.risque), speciaux: lancer(reserve.speciaux) },
        reserve, seuil, complicationImposee,
    );
}

// ---- Les blessures (p. 68-69) ----

export type Gravite = 'legere' | 'grave' | 'incapacitante';

export const LIBELLES_DES_GRAVITES: Record<Gravite, string> = {
    legere: 'Blessure légère', grave: 'Blessure grave', incapacitante: 'Blessure incapacitante',
};

export const EFFETS_DES_GRAVITES: Record<Gravite, string> = {
    legere: 'désavantage à tous les tests jusqu’à la fin de sa prochaine narration',
    grave: 'désavantage à tous les tests jusqu’à ce que les blessures graves soient soignées',
    incapacitante: 'ni action ni déplacement ; s’il est mourant, il faut le stabiliser au plus vite',
};

/** Les seuils de blessure : FOR/VOL/FW + protection, +3, +6 (p. 68-69). */
export function seuilsDeBlessure(resistance: number, protection = 0): Record<Gravite, number> {
    const base = entier(resistance) + Math.max(0, entier(protection));
    return { legere: base, grave: base + 3, incapacitante: base + 6 };
}

/** La gravité d'une VD : il faut DÉPASSER le seuil ; une attaque n'inflige qu'une blessure (p. 68). */
export function graviteDe(vd: number, seuils: Record<Gravite, number>): Gravite | null {
    if (vd > seuils.incapacitante) return 'incapacitante';
    if (vd > seuils.grave) return 'grave';
    if (vd > seuils.legere) return 'legere';
    return null;
}

export interface Moniteur { legeres: number; graves: number; incapacitantes: number }

/** Deux cases légères (trois par un atout), une grave (deux), une incapacitante (p. 68). */
export const CAPACITES_DU_MONITEUR: Moniteur = { legeres: 2, graves: 1, incapacitantes: 1 };

/**
 * Coche la blessure ; si ses cases sont pleines, elle s'aggrave d'un degré : la troisième
 * légère devient grave, la quatrième incapacitante (p. 69).
 */
export function encaisserShadowrun(
    gravite: Gravite, moniteur: Moniteur, capacites: Moniteur = CAPACITES_DU_MONITEUR,
): { moniteur: Moniteur; cochee: Gravite; aggravee: boolean } {
    const ordre: Gravite[] = ['legere', 'grave', 'incapacitante'];
    const cle: Record<Gravite, keyof Moniteur> = { legere: 'legeres', grave: 'graves', incapacitante: 'incapacitantes' };
    const apres = { ...moniteur };
    for (const g of ordre.slice(ordre.indexOf(gravite))) {
        if (apres[cle[g]] < capacites[cle[g]] || g === 'incapacitante') {
            apres[cle[g]] = Math.min(capacites[cle[g]], apres[cle[g]] + 1);
            return { moniteur: apres, cochee: g, aggravee: g !== gravite };
        }
    }
    return { moniteur: apres, cochee: 'incapacitante', aggravee: gravite !== 'incapacitante' };
}

/** Les seuils des soins, premiers soins ou sort (p. 69), relevés par l'Essence du blessé (p. 60). */
export function seuilDeSoin(gravite: Gravite | 'stabiliser', essence?: number): number {
    const base = { legere: 3, grave: 5, incapacitante: 6, stabiliser: 3 }[gravite];
    return base + seuilDeSoinRelevePar(essence);
}
