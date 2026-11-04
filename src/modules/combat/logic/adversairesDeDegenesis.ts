import type { Combatant } from '../types';
import type { RegleDesMaximaDeDegenesis } from '../../dice/systemes/maximaDeDegenesis';
import { pistesDeSanteSelonLeJeu, type RegleDesPistesDeSante } from './pistesDeDegenesis';
import { maximumDeLaJauge } from './SanteDuCombattant';

/**
 * **L'adversaire sans fiche de Degenesis, à deux pistes** — DEG-A6, 04/11/2026, à la demande
 * de David (« on va finir DEG-A5 et DEG-A6 ») ; choix du même jour : PHY, Résistance, PSY et
 * Égo saisis au panneau du round, dessiné dans Stitch (`stitch/degenesis-adversaire/`) et validé.
 *
 * Un combattant du plateau sans fiche de campagne perdait ses PV d'un bloc. Préparé, il porte
 * sur sa fiche de plateau les mêmes champs qu'un PJ : ses maxima se calculent par les formules
 * du pilote, et ses coups passent par la **même porte** (`pistesDeSanteSelonLeJeu`) — Blessures
 * superficielles, puis Traumatismes, « mortel » droit aux Traumatismes, « mental » sur l'Égo.
 * Non préparé, on ne prétend pas calculer ses pistes : le coup reste en PV, et on le dit.
 */

type Stats = readonly { fieldId: string; max?: string; isMainHP?: boolean }[] | undefined;

export const estUnAdversaireAutonome = (c: Pick<Combatant, 'sourcePlayerId' | 'sourceEntityId'>) => !c.sourcePlayerId && !c.sourceEntityId;

const entier = (v: unknown) => Math.max(0, Math.trunc(Number(v) || 0));

/** Les champs à saisir : ceux des maxima de Blessures et de Traumatismes (PHY, Résistance, PSY). */
export function champsAPreparer(maxima: RegleDesMaximaDeDegenesis): string[] {
    return [...new Set([...(maxima.blessures?.champs ?? []), ...(maxima.traumatismes?.champs ?? [])])];
}

export interface PistesDeLAdversaire {
    blessures: number; maxBlessures: number;
    traumatismes: number; maxTraumatismes: number;
    ego?: number; maxEgo?: number;
}

/** Ses pistes, s'il est préparé ; `null` sinon. */
export function pistesDeLAdversaire(pistes: RegleDesPistesDeSante, stats: Stats, fiche: Record<string, unknown> | undefined): PistesDeLAdversaire | null {
    const maxB = maximumDeLaJauge(pistes.blessures, stats, fiche);
    const maxT = maximumDeLaJauge(pistes.traumatismes, stats, fiche);
    if (maxB === null || maxT === null) return null;
    const ego = pistes.ego && fiche?.[pistes.ego] !== undefined ? entier(fiche[pistes.ego]) : undefined;
    return {
        blessures: entier(fiche?.[pistes.blessures]), maxBlessures: maxB,
        traumatismes: entier(fiche?.[pistes.traumatismes]), maxTraumatismes: maxT,
        ...(ego !== undefined && pistes.ego ? { ego, maxEgo: maximumDeLaJauge(pistes.ego, stats, fiche) ?? ego } : {}),
    };
}

/**
 * **Préparer** : écrit PHY, Résistance, PSY et l'Égo sur sa fiche de plateau, pistes à zéro ;
 * sa santé vaut ce que les deux pistes peuvent encaisser.
 */
export function preparerLAdversaire(
    maxima: RegleDesMaximaDeDegenesis, pistes: RegleDesPistesDeSante, stats: Stats,
    fiche: Record<string, unknown> | undefined, saisie: Record<string, number>, ego: number,
): { sheetData: Record<string, unknown>; hp: number; hpMax: number } | null {
    const sheetData: Record<string, unknown> = { ...fiche };
    for (const c of champsAPreparer(maxima)) sheetData[c] = entier(saisie[c]);
    sheetData[pistes.blessures] = 0;
    sheetData[pistes.traumatismes] = 0;
    sheetData[maxima.ego.champ] = entier(ego);
    if (maxima.ego.jauge) sheetData[maxima.ego.jauge] = entier(ego);
    const p = pistesDeLAdversaire(pistes, stats, sheetData);
    if (!p) return null;
    const total = p.maxBlessures + p.maxTraumatismes;
    return { sheetData, hp: total, hpMax: total };
}

/**
 * **Un coup sur l'adversaire préparé** : la même porte que pour un PJ. `montant` est signé
 * comme dans `applyDamage` (négatif : un soin). Rend ce que la santé du plateau perd, les
 * pistes à écrire et le texte du journal — ou `'a-preparer'`.
 */
export function coupSurLAdversaire(
    pistes: RegleDesPistesDeSante, stats: Stats, fiche: Record<string, unknown> | undefined, montant: number, type: string,
): { montant: number; fiche: Record<string, number>; texte: string } | 'a-preparer' {
    if (!pistesDeLAdversaire(pistes, stats, fiche)) return 'a-preparer';
    const r = pistesDeSanteSelonLeJeu(pistes, fiche, { value: Math.abs(montant), type, isRecovery: montant < 0 }, stats);
    if (!r) return 'a-preparer';
    return { montant: r.impact.isRecovery ? -r.impact.value : r.impact.value, fiche: r.fiche, texte: r.texte };
}
