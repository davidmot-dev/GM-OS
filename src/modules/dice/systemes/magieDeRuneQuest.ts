import type { NiveauDeRuneQuest } from './runequest';

/**
 * **La magie de RuneQuest : ce qu'un sort coûte, et comment les points reviennent** —
 * RQ-A6, 03/11/2026, à la demande de David (« on va faire RQ-A5 et RQ-A6 »). Choix de
 * David du même jour : le sort se **saisit au lancement** (type, nom, coût, culte) ; les
 * listes de sorts restent en texte libre sur la fiche.
 *
 * Pages imprimées du livre de base (PDF − 1), relues en image :
 *
 * - **magie spirituelle** (p. 254) : sous POU×5 ; en cas de réussite, les PM du sort sont
 *   dépensés, et ceux qu'on a ajoutés pour percer une défense ; en cas d'échec, aucun.
 *   Le livre ne prévoit rien de particulier pour l'échec critique : il ne coûte rien non plus ;
 * - **magie runique** (p. 314) : sous l'affinité runique du sort ; une réussite dépense
 *   les points de Rune **du culte du sort** — jamais ceux d'un autre culte (p. 313) — et
 *   les PM ajoutés ; **une réussite critique ne coûte aucun point de Rune** ; un échec n'en
 *   coûte aucun, mais 1 PM si le sort était renforcé ; un échec critique dépense les points
 *   de Rune. Le livre ne dit rien des PM ajoutés sur un échec critique : on en compte 1,
 *   comme sur un échec, et le détail le dit ;
 * - **sorcellerie** (p. 381-386, corpus relu le 30/10) : le coût total (Runes, techniques,
 *   intensité) est dépensé sur une réussite ; **un seul** PM sur une réussite critique ou un
 *   échec ; tout, sur un échec critique.
 *
 * Récupération : les PM au quart du POU toutes les six heures, entièrement en 24 heures
 * (p. 54) ; les points de Rune au jour saint, par un test de Vénération et au moins 2 PM
 * dépensés, selon l'importance du jour et le statut du fidèle (p. 315).
 *
 * Tout est pur : le panneau lance les dés et écrit ce qui lui est rendu.
 */

export type GenreDeMagie = 'spirituelle' | 'runique' | 'sorcellerie';

export const LIBELLES_DES_MAGIES: Record<GenreDeMagie, string> = {
    spirituelle: 'Magie spirituelle', runique: 'Magie runique', sorcellerie: 'Sorcellerie',
};

/** Un culte de la fiche : sa réserve de points de Rune et sa Vénération. */
export interface CulteDeRuneQuest {
    /** Le champ du nom du culte (« Orlanth »). */
    nom: string;
    /** Le champ du rang (« initié », « prêtre runique ») : il décide de la récupération au jour saint. */
    rang?: string;
    /** Les points de Rune actuels du culte. */
    pr: string;
    prMax?: string;
    /** La compétence Vénération de ce culte. */
    veneration?: string;
}

/** Ce que le pilote nomme pour la magie (`jet.runequest.magie`, pilote 2.3.0). */
export interface RegleDeLaMagie {
    pm: string;
    pmMax?: string;
    pou: string;
    cultes: CulteDeRuneQuest[];
}

export interface CoutDuSort {
    pm: number;
    pr: number;
    /** La phrase qui dit pourquoi, avec la page. */
    explication: string;
}

const reussi = (n: NiveauDeRuneQuest) => n !== 'echec' && n !== 'echec-critique';
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/**
 * Le coût d'un sort selon le niveau du jet. `cout` est le coût du sort (points de magie
 * ou de Rune, ou le total d'une sorcellerie) ; `pmEnPlus`, les PM ajoutés à un sort
 * spirituel ou runique pour percer une défense.
 */
export function coutDuSort(genre: GenreDeMagie, niveau: NiveauDeRuneQuest, cout: number, pmEnPlus = 0): CoutDuSort {
    const c = Math.max(0, Math.trunc(cout));
    const plus = Math.max(0, Math.trunc(pmEnPlus));
    if (genre === 'spirituelle') {
        if (!reussi(niveau)) return { pm: 0, pr: 0, explication: 'Un sort spirituel raté ne coûte aucun point de magie ; on peut le retenter au round suivant (p. 254).' };
        return { pm: c + plus, pr: 0, explication: `Réussi : ${pluriel(c + plus, 'point')} de magie dépensés${plus ? `, dont ${plus} ajoutés` : ''}, même si la cible résiste (p. 254).` };
    }
    if (genre === 'runique') {
        switch (niveau) {
            case 'reussite-critique':
                return { pm: plus, pr: 0, explication: `Réussite critique : le sort ne coûte aucun point de Rune (p. 314)${plus ? ` ; ${plus} PM ajoutés dépensés` : ''}.` };
            case 'reussite-speciale':
            case 'reussite':
                return { pm: plus, pr: c, explication: `Réussi : ${pluriel(c, 'point')} de Rune dépensés${plus ? ` et ${plus} PM ajoutés` : ''} (p. 314).` };
            case 'echec':
                return { pm: plus ? 1 : 0, pr: 0, explication: `Échec : aucun point de Rune${plus ? ' ; renforcé, il coûte tout de même 1 PM' : ''} (p. 314).` };
            case 'echec-critique':
                return { pm: plus ? 1 : 0, pr: c, explication: `Échec critique : le sort est raté et dépense ses ${pluriel(c, 'point')} de Rune (p. 314)${plus ? ' ; le livre ne dit rien des PM ajoutés, 1 est compté comme sur un échec' : ''}.` };
        }
    }
    switch (niveau) {
        case 'reussite-critique': return { pm: Math.min(1, c), pr: 0, explication: 'Réussite critique : un seul point de magie est dépensé (sorcellerie).' };
        case 'reussite-speciale':
        case 'reussite': return { pm: c, pr: 0, explication: `Réussi : les ${pluriel(c, 'point')} de magie investis sont dépensés (sorcellerie).` };
        case 'echec': return { pm: Math.min(1, c), pr: 0, explication: 'Échec : le sorcier ne perd qu’un point de magie (sorcellerie).' };
        case 'echec-critique': return { pm: c, pr: 0, explication: `Échec critique : les ${pluriel(c, 'point')} de magie investis sont perdus (sorcellerie).` };
    }
}

const nombre = (v: unknown, defaut = 0) => {
    const n = Number(String(v ?? '').replace(',', '.'));
    return String(v ?? '').trim() !== '' && Number.isFinite(n) ? n : defaut;
};
const texte = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

/** Le nom d'un culte, lu sur la fiche ; « Culte 2 » s'il n'est pas saisi. */
export const nomDuCulte = (regle: RegleDeLaMagie, valeurs: Record<string, unknown>, i: number) =>
    texte(valeurs[regle.cultes[i]?.nom ?? '']) || `Culte ${i + 1}`;

export interface Paiement {
    /** Ce qui s'écrit sur la fiche ; vide si le paiement est refusé. */
    maj: Record<string, unknown>;
    /** Les valeurs d'avant, pour annuler. */
    avant: Record<string, unknown>;
    /** Pourquoi on ne peut pas payer. */
    refus?: string;
    /** Ce que la meneuse doit savoir : PM à 0, inconscience. */
    alertes: string[];
    /** La ligne du journal. */
    ligne: string;
}

/**
 * Paie le coût sur la fiche du lanceur. Un sort runique **exige** assez de points de
 * Rune dans le culte du sort (p. 314) ; un lanceur à court de PM ne lance pas. À 0 PM,
 * l'aventurier sombre dans l'inconscience (p. 54).
 */
export function payerLeSort(regle: RegleDeLaMagie, valeurs: Record<string, unknown>, cout: CoutDuSort, culte: number, sort: string): Paiement {
    const avant: Record<string, unknown> = {};
    const maj: Record<string, unknown> = {};
    const alertes: string[] = [];
    const nomDuSort = sort.trim() || 'le sort';
    const pm = nombre(valeurs[regle.pm]);
    if (cout.pm > pm) return { maj: {}, avant: {}, alertes, refus: `Il faudrait ${cout.pm} PM ; il en reste ${pm}.`, ligne: '' };
    const parts: string[] = [];
    if (cout.pr > 0) {
        const c = regle.cultes[culte];
        if (!c) return { maj: {}, avant: {}, alertes, refus: 'Aucun culte ne paie ce sort.', ligne: '' };
        const pr = nombre(valeurs[c.pr]);
        const nom = nomDuCulte(regle, valeurs, culte);
        if (cout.pr > pr) return { maj: {}, avant: {}, alertes, refus: `Il faudrait ${cout.pr} points de Rune du culte ${nom} ; il en reste ${pr} (p. 314).`, ligne: '' };
        avant[c.pr] = valeurs[c.pr];
        maj[c.pr] = pr - cout.pr;
        parts.push(`${cout.pr} PR (${nom}, reste ${pr - cout.pr})`);
    }
    if (cout.pm > 0) {
        avant[regle.pm] = valeurs[regle.pm];
        maj[regle.pm] = pm - cout.pm;
        parts.push(`${cout.pm} PM (reste ${pm - cout.pm})`);
        if (pm - cout.pm === 0) alertes.push('Plus aucun point de magie : l’aventurier sombre dans l’inconscience jusqu’à en regagner un (p. 54).');
    }
    return { maj, avant, alertes, ligne: parts.length ? `${nomDuSort} : payé ${parts.join(' et ')}.` : `${nomDuSort} : rien à payer.` };
}

// ---- La récupération ----------------------------------------------------------

/**
 * Six heures de repos : le quart du POU, arrondi au plus proche (Vasana, POU 15, en
 * regagne 3,75 : 4), sans dépasser le maximum (p. 54).
 */
export function reposDeSixHeures(regle: RegleDeLaMagie, valeurs: Record<string, unknown>): { maj: Record<string, unknown>; gain: number; ligne: string } {
    const pou = nombre(valeurs[regle.pou]);
    const pm = nombre(valeurs[regle.pm]);
    const max = regle.pmMax ? nombre(valeurs[regle.pmMax], pou) : pou;
    const apres = Math.min(max, pm + Math.round(pou / 4));
    return { maj: apres === pm ? {} : { [regle.pm]: apres }, gain: apres - pm, ligne: `Repos de 6 h : +${apres - pm} PM (¼ du POU ${pou}, p. 54) — ${apres} / ${max}.` };
}

/** Une journée entière : tous les points de magie reviennent (p. 54). */
export function journeeEntiere(regle: RegleDeLaMagie, valeurs: Record<string, unknown>): { maj: Record<string, unknown>; ligne: string } {
    const pou = nombre(valeurs[regle.pou]);
    const max = regle.pmMax ? nombre(valeurs[regle.pmMax], pou) : pou;
    return { maj: nombre(valeurs[regle.pm]) === max ? {} : { [regle.pm]: max }, ligne: `Journée entière : PM au maximum (${max}, p. 54).` };
}

export type ImportanceDuJourSaint = 'temps-sacre' | 'tres-saint' | 'saisonnier' | 'mineur' | 'culte-associe' | 'lieu-sacre';

export const LIBELLES_DES_JOURS_SAINTS: Record<ImportanceDuJourSaint, string> = {
    'temps-sacre': 'Temps sacré',
    'tres-saint': 'Jour très saint',
    saisonnier: 'Jour saint saisonnier',
    mineur: 'Jour saint mineur',
    'culte-associe': 'Jour très saint ou saisonnier d’un culte associé',
    'lieu-sacre': 'Lieu sacré entretenu une saison',
};

/** Initié, ou Chantre sacré, Prêtre runique, Seigneur runique (p. 315). */
export type StatutDuFidele = 'initie' | 'maitre';

/** Le statut se lit dans le rang saisi ; à défaut, un initié. */
export const statutDuRang = (rang: string): StatutDuFidele =>
    /chantre|pr[eê]tre|seigneur|ma[iî]tre/i.test(rang) ? 'maitre' : 'initie';

/** Ce que rend le jour saint : « tout », une formule de dés, ou rien (p. 315). */
export function gainDuJourSaint(importance: ImportanceDuJourSaint, statut: StatutDuFidele, reussite: boolean): 'tout' | string | null {
    switch (importance) {
        case 'temps-sacre':
        case 'tres-saint': return reussite ? 'tout' : '2D6';
        case 'saisonnier': return reussite ? (statut === 'maitre' ? 'tout' : '2D6') : (statut === 'maitre' ? '1D6' : '1D3');
        case 'mineur':
        case 'culte-associe': return reussite ? (statut === 'maitre' ? '1D6+1' : '1D6') : null;
        case 'lieu-sacre': return reussite ? '1D3' : '1';
    }
}

/** Lance une formule simple du jour saint (« 2D6 », « 1D6+1 », « 1 »). */
export function lancerLeGain(formule: string, de: (faces: number) => number): { total: number; detail: string } {
    const m = /^(\d+)D(\d+)(?:\+(\d+))?$/.exec(formule);
    if (!m) { const n = Number(formule) || 0; return { total: n, detail: String(n) }; }
    const des = Array.from({ length: Number(m[1]) }, () => de(Number(m[2])));
    const plus = Number(m[3] ?? 0);
    const total = des.reduce((s, d) => s + d, 0) + plus;
    return { total, detail: `${formule} = ${des.join(' + ')}${plus ? ` + ${plus}` : ''} = ${total}` };
}

/**
 * Le jour saint, après le test de Vénération : les PR regagnés, plafonnés au maximum du
 * culte (Sorala, p. 315 : 2D6 = 5 pour un maximum de 3, l'excédent est perdu), et les
 * 2 PM que la cérémonie demande au moins.
 */
export function jourSaint(
    regle: RegleDeLaMagie, valeurs: Record<string, unknown>, culte: number,
    importance: ImportanceDuJourSaint, statut: StatutDuFidele, niveau: NiveauDeRuneQuest, de: (faces: number) => number,
): { maj: Record<string, unknown>; avant: Record<string, unknown>; ligne: string; refus?: string } {
    const c = regle.cultes[culte];
    if (!c) return { maj: {}, avant: {}, ligne: '', refus: 'Aucun culte choisi.' };
    const pm = nombre(valeurs[regle.pm]);
    if (pm < 2) return { maj: {}, avant: {}, ligne: '', refus: `La cérémonie demande au moins 2 points de magie ; il en reste ${pm} (p. 315).` };
    const nom = nomDuCulte(regle, valeurs, culte);
    const pr = nombre(valeurs[c.pr]);
    const max = c.prMax ? nombre(valeurs[c.prMax], pr) : pr;
    const gain = gainDuJourSaint(importance, statut, reussi(niveau));
    let apres = pr;
    let detail = 'aucun point';
    if (gain === 'tout') { apres = max; detail = 'tous les points'; }
    else if (gain) { const l = lancerLeGain(gain, de); apres = Math.min(max, pr + l.total); detail = l.detail; }
    const avant = { [regle.pm]: valeurs[regle.pm], [c.pr]: valeurs[c.pr] };
    return {
        maj: { [regle.pm]: pm - 2, ...(apres !== pr ? { [c.pr]: apres } : {}) },
        avant,
        ligne: `${LIBELLES_DES_JOURS_SAINTS[importance]} (${nom}, ${statut === 'maitre' ? 'maître des Runes' : 'initié'}) — Vénération ${reussi(niveau) ? 'réussie' : 'ratée'} : ${detail} → PR ${apres} / ${max} ; 2 PM dépensés (p. 315).`,
    };
}
