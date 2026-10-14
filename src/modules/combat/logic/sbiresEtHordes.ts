import type { CasesDeSante } from '../../../types/drivers';
import { dommagesDeTorg } from './dommagesDeTorg';

/**
 * **Les sbires et les hordes de Torg Eternity** — 2026-10-14, relus dans le
 * carnet NotebookLM « Torg » (réponses citées, livre p. 70, 117, 119, 264).
 */

/**
 * **La limite de Blessures d'un adversaire** : *« un personnage ne peut subir
 * plus de Blessures que son maximum »* ; une Blessure de plus et il est vaincu.
 * Humain : « — » (la première Blessure l'élimine) ; aguerri : 1 ; chargé en
 * possibilités : 3, comme un Chevalier des Tempêtes (p. 263).
 *
 * Les cases du jeu se recoupent : une de plus que la limite, la dernière portant
 * l'état de la défaite ; les seuils intermédiaires qui tiennent encore restent.
 */
export function casesPourLaLimite(cases: CasesDeSante, blessuresMax: number): CasesDeSante {
    const nombre = Math.max(0, Math.floor(blessuresMax)) + 1;
    const seuils = [...(cases.seuils ?? [])].sort((a, b) => a.aPartirDe - b.aPartirDe);
    const defaite = seuils[seuils.length - 1];
    const gardes = seuils.filter(s => s !== defaite && s.aPartirDe < nombre);
    return { ...cases, nombre, seuils: defaite ? [...gardes, { ...defaite, aPartirDe: nombre }] : gardes };
}

/**
 * **La Table des Actions combinées** (p. 119) : le bonus de plusieurs
 * personnages qui agissent ensemble. Au-delà de 149, le livre renvoie à la Table
 * des Valeurs (p. 275) ; on s'arrête à +10, et on le dit.
 */
export const TABLE_DES_ACTIONS_COMBINEES: readonly { aPartirDe: number; bonus: number }[] = [
    { aPartirDe: 1, bonus: 0 },
    { aPartirDe: 2, bonus: 1 },
    { aPartirDe: 3, bonus: 2 },
    { aPartirDe: 4, bonus: 3 },
    { aPartirDe: 6, bonus: 4 },
    { aPartirDe: 10, bonus: 5 },
    { aPartirDe: 15, bonus: 6 },
    { aPartirDe: 25, bonus: 7 },
    { aPartirDe: 40, bonus: 8 },
    { aPartirDe: 60, bonus: 9 },
    { aPartirDe: 100, bonus: 10 },
];

export function bonusDesActionsCombinees(participants: number): number {
    let bonus = 0;
    for (const ligne of TABLE_DES_ACTIONS_COMBINEES) if (participants >= ligne.aPartirDe) bonus = ligne.bonus;
    return bonus;
}

/** Le malus des Cibles multiples (p. 122) : −2 par cible supplémentaire. */
export const malusDesCiblesMultiples = (cibles: number) => 2 * Math.max(0, Math.floor(cibles) - 1);

/**
 * **Une horde** (règle optionnelle, p. 264) : *« au lieu de gérer le Choc pour
 * chaque individu, il faut le faire pour l'ensemble du groupe. À chaque fois que
 * le Choc excède la limite d'un membre du groupe d'adversaires, l'un d'eux est
 * mis KO »* — huit thralls d'Esprit 7 : un KO tous les 8 points. *« Quand des
 * Blessures éliminent des membres de la horde, retirez-les sans ajuster les
 * points de Choc. »* Ses membres sont des sbires : une Blessure en élimine un.
 */
export interface Horde {
    /** Combien elle comptait. */
    membres: number;
    /** Combien tiennent encore debout. */
    debout: number;
    /** Le Choc commun accumulé. */
    choc: number;
    /** Combien le Choc a déjà mis KO — pour ne compter que les nouveaux. */
    koParLeChoc: number;
    /** L'Esprit d'un membre : la limite de Choc. */
    esprit: number;
    /** La Résistance d'un membre, contre les dommages. */
    resistance: number;
}

export function nouvelleHorde(membres: number, esprit: number, resistance: number): Horde {
    const n = Math.max(1, Math.floor(membres));
    return { membres: n, debout: n, choc: 0, koParLeChoc: 0, esprit: Math.max(0, esprit), resistance: Math.max(0, resistance) };
}

/** Un coup sur la horde : la Table des Dommages, puis une élimination ou du Choc commun. */
export function coupSurLaHorde(h: Horde, degats: number): { horde: Horde; texte: string } {
    const d = dommagesDeTorg(degats, h.resistance);
    if (h.debout === 0) return { horde: h, texte: 'la horde est déjà défaite' };
    if (d.blessures > 0) {
        const horde = { ...h, debout: h.debout - 1 };
        return { horde, texte: `${degats} contre Résistance ${h.resistance} : un membre éliminé — ${horde.debout}/${h.membres} debout` };
    }
    if (d.choc === 0) return { horde: h, texte: `${degats} contre Résistance ${h.resistance} : aucun effet` };
    const choc = h.choc + d.choc;
    const koTotal = Math.floor(choc / (h.esprit + 1));
    const nouveaux = Math.min(h.debout, koTotal - h.koParLeChoc);
    const horde = { ...h, choc, koParLeChoc: koTotal, debout: h.debout - nouveaux };
    return {
        horde,
        texte: `${degats} contre Résistance ${h.resistance} : ${d.choc} Choc commun (${choc})`
            + (nouveaux > 0 ? ` — ${nouveaux} membre${nouveaux > 1 ? 's' : ''} KO` : '')
            + ` — ${horde.debout}/${h.membres} debout`,
    };
}

/** Le prochain KO par le Choc : à combien de Choc commun il tombera. */
export const prochainKO = (h: Horde) => (h.koParLeChoc + 1) * (h.esprit + 1);
