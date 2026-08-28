import type { Divergence } from './rapprochementDeLaFiche';

/**
 * **Le journal des valeurs écrasées.**
 *
 * Demandé par David en même temps que la règle d'arbitrage, le 2026-08-28 :
 * *« c'est la tablette qui gagne, mais il faut garder un log si possible »*. La
 * règle est simple ; **c'est son coût qui doit rester visible**. Un champ écrasé
 * par une resynchro se découvre en séance, et sans trace on ne peut plus dire ce
 * qu'il contenait.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OÙ ÇA ÉCRIT, ET POURQUOI PAS AILLEURS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `window.appBridge.logger` → `log:message` → `electron-log` → **`main.log`**.
 * Ce chemin existait déjà de bout en bout : aucun IPC nouveau. Et c'est le seul
 * qui survive à la fermeture — *rien ne collecte la sortie standard du renderer*,
 * exactement le constat qui avait fait naître `electron/auditLog.ts`.
 *
 * On n'emprunte pas `auditNotice` lui-même : il vit dans le process principal,
 * porte le préfixe `[Sécurité]`, et une donnée écrasée n'est pas un incident de
 * sécurité. Deux sujets sous un même préfixe rendent les deux illisibles.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IL TOURNE, PARCE QU'UNE FICHE SE SAISIT À LA FRAPPE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `electron-log` fait tourner `main.log` tout seul. Ce qu'il ne fait pas, c'est
 * empêcher un lot de mille lignes : on plafonne donc **par lot**, et on dit
 * combien on a tu. Un journal qu'on ne peut pas lire ne vaut pas mieux qu'un
 * journal absent.
 */

/** Au-delà, on résume : un lot énorme vient d'un import, pas d'une frappe. */
const PLAFOND_PAR_LOT = 20;

/** De quoi la divergence parle — sans ça, une ligne de journal ne sert à rien. */
export interface SujetDuJournal {
    /** Le nom du PJ, tel que le meneur le reconnaîtra. */
    personnage: string;
    /** L'identifiant du gabarit de fiche, pour retrouver la table en cause. */
    gabarit: string;
}

/** Rend une valeur lisible dans une ligne de journal, sans la laisser s'étaler. */
function lisible(valeur: unknown): string {
    if (valeur === undefined) return '∅';
    const texte = typeof valeur === 'string' ? valeur : JSON.stringify(valeur);
    const propre = String(texte ?? '').replace(/\s+/g, ' ').trim();
    if (propre === '') return '∅';
    return propre.length > 120 ? `${propre.slice(0, 117)}…` : propre;
}

/** La ligne telle qu'elle apparaît dans `main.log`. */
export function ligneDeDivergence(sujet: SujetDuJournal, d: Divergence): string {
    return `[Fiche] « ${sujet.personnage} » (${sujet.gabarit}) — la fiche fait foi sur `
        + `« ${d.cle} » : ${lisible(d.ancienne)} → ${lisible(d.nouvelle)}`;
}

/**
 * Écrit les divergences d'un rapprochement.
 *
 * Silencieuse quand il n'y en a pas — et c'est le cas normal. *Un absent
 * silencieux, un incident bruyant.*
 *
 * Rend les lignes écrites, pour que les tests éprouvent ce qui est dit et pas
 * seulement le fait qu'on ait parlé.
 */
export function journaliserLesDivergences(sujet: SujetDuJournal, divergences: Divergence[]): string[] {
    if (divergences.length === 0) return [];

    const lignes = divergences.slice(0, PLAFOND_PAR_LOT).map(d => ligneDeDivergence(sujet, d));
    const tues = divergences.length - lignes.length;
    if (tues > 0) {
        lignes.push(`[Fiche] « ${sujet.personnage} » (${sujet.gabarit}) — et ${tues} autre(s) valeur(s) écrasée(s), non détaillées.`);
    }

    const pont = typeof window === 'undefined' ? undefined : window.appBridge?.logger;
    for (const ligne of lignes) {
        // Les deux : le fichier survit à la fermeture, la console sert pendant
        // qu'on développe. Hors Electron, la console reste préférable au silence.
        if (pont) pont.warn(ligne); else console.warn(ligne);
    }

    return lignes;
}
