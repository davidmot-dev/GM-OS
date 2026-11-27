import { mdDeCaracteristique } from '../../dice/systemes/traveller';
import type { Combatant } from '../types';

/**
 * **L'initiative de Traveller** — TRV-A4, 27/11/2026 (spécification
 * `2026-11-27-traveller-fiche-initiative-psi-rads.md`, C4 à C6 ; David : « Tactique + embuscade »).
 *
 * Livre de règles v2.2, p. 71 :
 * - « chaque Voyageur fait un Test de DEX ou d'INT » : 2D + le MD **le plus haut** des deux contre
 *   8 ; « l'Effet de ce test est son Initiative pour la durée du combat » ;
 * - **Tactique** : « l'Effet de ce test est alors appliqué à l'Initiative de tous ceux qui se
 *   trouvent dans le même camp » ;
 * - **embuscade** : le camp qui surprend gagne MD+6, l'autre subit MD−6, « pour le premier round
 *   seulement » — le bonus est retenu sur le combattant et retiré au round 2.
 *
 * Un animal n'a ni DEX ni INT : son test se fait sans MD (le livre n'en donne pas).
 */

export type CampDeTraveller = 'voyageurs' | 'adversaires';

/** Les Voyageurs (joueurs et alliés) contre les adversaires ; un neutre n'est d'aucun camp. */
export function campDeTraveller(faction: Combatant['faction'] | undefined, isPlayer?: boolean): CampDeTraveller | null {
    if (isPlayer || faction === 'player' || faction === 'ally') return 'voyageurs';
    if (faction === 'enemy') return 'adversaires';
    return null;
}

/** Ce que le meneur prépare avant le jet : les Effets de Tactique et le camp qui surprend. */
export interface PreparationDInitiative {
    tactique: Record<CampDeTraveller, number>;
    embuscade: CampDeTraveller | null;
}

export const PREPARATION_D_INITIATIVE: PreparationDInitiative = { tactique: { voyageurs: 0, adversaires: 0 }, embuscade: null };

/** Le meilleur MD entre DEX et INT ; une caractéristique absente ne compte pas, et sans les deux, 0. */
export function mdDInitiative(lire: (champ: string) => number | undefined): { md: number; source: 'DEX' | 'INT' | null } {
    const md = (valeur: string, champMd: string) => {
        const niveau = lire(valeur);
        if (niveau !== undefined && niveau > 0) return mdDeCaracteristique(niveau);
        return lire(champMd);
    };
    const dex = md('dexterite', 'dexterite_md');
    const int = md('intellect', 'intellect_md');
    if (dex === undefined && int === undefined) return { md: 0, source: null };
    if (int === undefined || (dex !== undefined && dex >= int)) return { md: dex!, source: 'DEX' };
    return { md: int, source: 'INT' };
}

/** L'Initiative d'un combattant, et ce qui la compose. */
export interface InitiativeDeTraveller {
    init: number;
    /** Le bonus d'embuscade compris dans `init`, à retirer au round 2. */
    embuscade: number;
    detail: string;
}

const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

export function initiativeDeTraveller(entree: {
    des: readonly [number, number];
    md: { md: number; source: 'DEX' | 'INT' | null };
    camp: CampDeTraveller | null;
    preparation: PreparationDInitiative;
}): InitiativeDeTraveller {
    const { des, md, camp, preparation } = entree;
    const tactique = camp ? Math.trunc(preparation.tactique[camp]) || 0 : 0;
    const embuscade = camp && preparation.embuscade ? (preparation.embuscade === camp ? 6 : -6) : 0;
    const effet = des[0] + des[1] + md.md - 8;
    const parts = [`2D ${des[0] + des[1]}`, md.source ? `MD ${md.source} ${signe(md.md)}` : 'sans MD', '− 8'];
    if (tactique) parts.push(`Tactique ${signe(tactique)}`);
    if (embuscade) parts.push(`embuscade ${signe(embuscade)}`);
    return { init: effet + tactique + embuscade, embuscade, detail: parts.join(', ') };
}

/**
 * **Le round 2 commence** : le bonus d'embuscade s'en va, et l'ordre se refait sur l'Effet seul.
 * Rend `null` quand personne n'en portait.
 */
export function finDeLEmbuscade<C extends Pick<Combatant, 'init'> & { bonusDEmbuscade?: number }>(combattants: readonly C[]): C[] | null {
    if (!combattants.some(c => c.bonusDEmbuscade)) return null;
    return combattants
        .map(c => {
            if (!c.bonusDEmbuscade) return c;
            const { bonusDEmbuscade, ...reste } = c;
            return { ...reste, init: (c.init ?? 0) - bonusDEmbuscade } as C;
        })
        .sort((a, b) => (b.init ?? 0) - (a.init ?? 0));
}
