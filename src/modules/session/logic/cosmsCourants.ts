import type { CosmDuJeu, LoiDuMonde, MecaniqueDeLoi } from '../../../types/drivers';
import type { Scene } from '../../../types/trame.types';
import { etatDeLaScene } from './trame';

/**
 * **Le cosm courant, et ses Lois du Monde** — Torg, 2026-10-14.
 *
 * David : le cosm se règle **sur la scène**, avec un défaut sur la campagne. Deux
 * cosms font une zone mixte, et les Lois des deux s'y appliquent : *« les Lois
 * d'un Monde ne s'appliquent que dans les zones où ce cosm est Pur, Mixte, ou
 * s'il est la réalité dominante »* (carnet « Torg », livre p. 25 et suivantes).
 * Elles touchent tout le monde dans la zone, quelle que soit sa réalité d'origine.
 */

/**
 * Les identifiants des cosms qui s'appliquent : ceux d'une scène en cours de la
 * campagne qui en déclare, sinon ceux de la campagne.
 */
export function idsDesCosmsCourants(
    campagne: { id: string; cosmsParDefaut?: string[] } | undefined,
    scenes: readonly Scene[],
): string[] {
    if (!campagne) return [];
    const scene = scenes.find(s => s.campaignId === campagne.id && etatDeLaScene(s) === 'en-cours' && (s.cosms?.length ?? 0) > 0);
    return scene?.cosms ?? campagne.cosmsParDefaut ?? [];
}

/** Les cosms du pilote désignés par ces identifiants, dans l'ordre donné ; un inconnu est ignoré. */
export function cosmsDesIds(cosmsDuJeu: readonly CosmDuJeu[] | undefined, ids: readonly string[]): CosmDuJeu[] {
    return ids.map(id => cosmsDuJeu?.find(c => c.id === id)).filter((c): c is CosmDuJeu => !!c);
}

/** La Loi en vigueur qui porte cette mécanique, s'il y en a une. */
export function loiEnVigueur(cosms: readonly CosmDuJeu[], mecanique: MecaniqueDeLoi): LoiDuMonde | undefined {
    for (const cosm of cosms) {
        const loi = cosm.lois.find(l => l.mecanique === mecanique);
        if (loi) return loi;
    }
    return undefined;
}

/** La taille de la main : +1 sous la Loi de l'Héroïsme (« cinq cartes au lieu de quatre »). */
export function tailleDeLaMain(base: number, cosms: readonly CosmDuJeu[]): number {
    return base + (loiEnVigueur(cosms, 'heroisme') ? 1 : 0);
}
