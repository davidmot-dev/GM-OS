/** RdD 2.3.1, p. 50–51, 88–90, 93 et 162 : R1 demandé par David le 18/10/2026.
 * Les segments sont transcrits, pas déduits d'un arrondi. Aucun repos d'endurance,
 * soin ou passage du temps n'est déclenché par une lecture de la fiche.
 */
export const CLE_SUIVI_FATIGUE = '__rddFatigue231';
export type DonneesDeFatigue = Record<string, unknown>;
const SEGMENTS: Readonly<Record<number, readonly number[]>> = {
    16: [2,3,3,2,3,3,2,3,3,2,3,3], 17: [2,3,3,3,3,3,2,3,3,3,3,3],
    18: [3,3,3,3,3,3,3,3,3,3,3,3], 19: [3,3,3,3,3,4,3,3,3,3,3,4],
    20: [3,3,4,3,3,4,3,3,4,3,3,4], 21: [3,3,4,3,4,4,3,3,4,3,4,4],
    22: [3,4,4,3,4,4,3,4,4,3,4,4], 23: [3,4,4,4,4,4,3,4,4,4,4,4],
    24: [4,4,4,4,4,4,4,4,4,4,4,4], 25: [4,4,4,4,4,5,4,4,4,4,4,5],
    26: [4,4,5,4,4,5,4,4,5,4,4,5], 27: [4,4,5,4,5,5,4,4,5,4,5,5],
    28: [4,5,5,4,5,5,4,5,5,4,5,5], 29: [4,5,5,5,5,5,4,5,5,5,5,5],
    30: [5,5,5,5,5,5,5,5,5,5,5,5],
};
const LIGNES = [0,0,0,-1,-1,-1,-2,-3,-4,-5,-6,-7];
export const suiviFatigueActif = (d: DonneesDeFatigue) => d[CLE_SUIVI_FATIGUE] === 1;
const nombre = (d: DonneesDeFatigue, cle: string, defaut = 0): number => {
    const v = d[cle] ?? defaut;
    if (v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v))) throw new Error(`« ${cle} » doit contenir un nombre.`);
    return Number(v);
};
const entier = (d: DonneesDeFatigue, cle: string, minimum = 0, maximum = Infinity, defaut = 0) => {
    const v = nombre(d, cle, defaut);
    if (!Number.isInteger(v) || v < minimum || v > maximum) throw new Error(`« ${cle} » doit être un entier entre ${minimum} et ${maximum === Infinity ? 'le maximum admis' : maximum}.`);
    return v;
};
export function segmentsDeFatigue(endurance: number): readonly number[] | null {
    if (!Number.isInteger(endurance) || endurance <= 0) return null;
    return SEGMENTS[endurance] ?? (endurance % 6 === 0 ? Array<number>(12).fill(endurance / 6) : null);
}
export interface EtatDuVoyageur {
    segments: {taille: number; cochees: number; ligne: number}[];
    fatigue: number; maximum: number; endurance: number; enduranceMax: number;
    fatigueMalus: number; vieMalus: number; ethylismeMalus: number; encombrementMalus: number;
    total: number; assomme: boolean; avertissements: string[];
}
export function etatDuVoyageur(d: DonneesDeFatigue): EtatDuVoyageur {
    const enduranceMax = entier(d, 'endurance_max', 1);
    const tailles = segmentsDeFatigue(enduranceMax);
    if (!tailles) throw new Error(`Endurance ${enduranceMax} : répartition absente de la table 16–30 et non multiple de 6. Le suivi reste manuel.`);
    const fatigue = entier(d, 'fatigue');
    const endurance = entier(d, 'endurance');
    const vieMax = entier(d, 'vie_max', 1);
    const vie = entier(d, 'vie', -Infinity);
    const ethylisme = entier(d, 'ethylisme', 0, 7);
    const encombrement = entier(d, 'surencombrement');
    let debut = 0;
    const segments = tailles.map((taille, i) => {
        const cochees = Math.max(0, Math.min(taille, fatigue - debut));debut += taille;
        return {taille, cochees, ligne: LIGNES[i]};
    });
    const fatigueMalus = Math.min(0, ...segments.filter(s => s.cochees > 0).map(s => s.ligne));
    const vieMalus = -Math.max(0, vieMax - vie);
    const avertissements: string[] = [];
    if (fatigue > debut) avertissements.push(`Fatigue ${fatigue} supérieure aux ${debut} cases : saisie conservée, à vérifier.`);
    if (endurance > enduranceMax) avertissements.push('Endurance courante supérieure au maximum : saisie conservée, à vérifier.');
    if (fatigue < Math.max(0, enduranceMax - endurance)) avertissements.push('Des points d’endurance manquent sans fatigue correspondante : vérifier la saisie ou la fatigue différée.');
    if (endurance === 0) avertissements.push(d.__rddSante231 ? 'Endurance nulle : consulter le suivi des blessures et de l’inconscience.'
        : 'Endurance nulle : vérifier l’inconscience et la perte de vie, ou activer le suivi des blessures.');
    return {segments, fatigue, maximum: debut, endurance, enduranceMax, fatigueMalus, vieMalus,
        ethylismeMalus: -ethylisme, encombrementMalus: -encombrement,
        total: fatigueMalus + vieMalus - ethylisme - encombrement,
        assomme: fatigue >= debut || (typeof d.__rddFatigueReveil === 'number' && fatigue > d.__rddFatigueReveil), avertissements};
}

export type NatureDeJetVoyageur = 'action' | 'chance' | 'guerison' | 'stress' | 'resistance' | 'ethylisme';
export function malusDuJetVoyageur(etat: EtatDuVoyageur, nature: NatureDeJetVoyageur, champ: string): number {
    if (champ === 'chance' || ['chance','guerison','stress','resistance'].includes(nature)) return 0;
    return nature === 'ethylisme' ? etat.fatigueMalus + etat.vieMalus : etat.total;
}

/** Les écritures absolues/rejouées ne débitent rien une seconde fois. Les opérations
 * validées portent leur identifiant et ont déjà calculé leur propre fatigue.
 */
export function suivrePerteDEndurance(avant: DonneesDeFatigue, apres: DonneesDeFatigue): DonneesDeFatigue {
    if (!suiviFatigueActif(apres)) return apres;
    try {
        let resultat = apres;
        const perte = entier(avant, 'endurance') - entier(apres, 'endurance');
        const etat = etatDuVoyageur(apres);
        if (suiviFatigueActif(avant) && avant.__rddOperationFatigue === apres.__rddOperationFatigue
            && perte > 0 && Number(avant.fatigue ?? 0) === Number(apres.fatigue ?? 0)) {
            resultat = {...apres, fatigue: Math.max(etat.fatigue, Math.min(etat.maximum, etat.fatigue + perte))};
        }
        const courant = etatDuVoyageur(resultat);
        const seuil = courant.fatigue >= courant.maximum ? courant.maximum - courant.segments.at(-1)!.taille
            : typeof resultat.__rddFatigueReveil === 'number' ? resultat.__rddFatigueReveil : null;
        return {...resultat, __rddFatigueReveil: seuil !== null && courant.fatigue > seuil ? seuil : null};
    } catch { return apres; }
}

export type EffortDuVoyageur = 'intellectuel' | 'veille' | 'physique' | 'extenuant' | 'tmr' | 'libre' | 'endurance' | 'alcool' | 'differee' | 'sommeil';
export const EFFORTS_DU_VOYAGEUR: Record<EffortDuVoyageur, string> = {
    intellectuel: 'Travail intellectuel (heures draconiques)', veille: 'Veille vigilante (heures draconiques)',
    physique: 'Travail physique moyen (heures draconiques)', extenuant: 'Travail exténuant (heures draconiques)',
    tmr: 'TMR (rounds ou cases)', libre: 'Fatigue décidée par le gardien', endurance: 'Perte d’endurance',
    alcool: 'Perte d’endurance due à l’alcool', differee: 'Inscrire la fatigue différée',
    sommeil: 'Sommeil : fatigue seule (heures de 120 min)',
};
export interface PropositionDeFatigue { maj: DonneesDeFatigue; motif: string; avant: number; apres: number; enduranceAvant: number; enduranceApres: number; }
export function proposerFatigue(d: DonneesDeFatigue, effort: EffortDuVoyageur, quantite: number, taux = 2): PropositionDeFatigue {
    const etat = etatDuVoyageur(d);
    if (etat.fatigue > etat.maximum) throw new Error('Vérifier la fatigue supérieure à la piste avant de proposer un mouvement.');
    if (!Number.isInteger(quantite) || quantite < 1 || quantite > 10000) throw new Error('Choisir une quantité entière de 1 à 10 000.');
    if (effort === 'extenuant' && (!Number.isInteger(taux) || taux < 2 || taux > 6)) throw new Error('Le gardien choisit de 2 à 6 cases par heure exténuante.');
    let fatigue = etat.fatigue, endurance = etat.endurance;
    let differee = entier(d, 'fatigue_differee');
    if (effort === 'sommeil') {
        const plancher = Math.max(0, etat.enduranceMax - endurance);
        for (let h = 0; h < quantite; h++) {
            let debut = 0;
            const occupes = etat.segments.map(s => {const v = {debut, taille: s.taille};debut += s.taille;return v;}).filter(s => s.debut < fatigue);
            const dernier = occupes.at(-1);
            if (!dernier) break;
            const marques = fatigue - dernier.debut;
            let cible = dernier.debut;
            if (marques * 2 < dernier.taille && occupes.length > 1) cible = occupes[occupes.length - 2].debut;
            fatigue = Math.min(fatigue, Math.max(plancher, cible));
        }
    } else {
        let ajout = quantite * (effort === 'physique' ? 2 : effort === 'extenuant' ? taux : 1);
        if (effort === 'endurance' || effort === 'alcool') {
            ajout = Math.min(quantite, endurance);endurance -= ajout;
            const degre = -etat.ethylismeMalus;
            if (effort === 'alcool' && degre >= 1 && degre <= 3) {differee += ajout;ajout = 0;}
            else if (effort === 'alcool' && degre >= 4) {ajout += differee;differee = 0;}
        }
        if (effort === 'differee') {ajout = differee;differee = 0;}
        fatigue = Math.max(fatigue, Math.min(etat.maximum, fatigue + ajout));
    }
    return {maj: {fatigue, endurance, fatigue_differee: differee}, motif: `${EFFORTS_DU_VOYAGEUR[effort]} ×${quantite}`,
        avant: etat.fatigue, apres: fatigue, enduranceAvant: etat.endurance, enduranceApres: endurance};
}
