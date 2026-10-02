import type { GameDriver } from '../../../types/drivers';
import { rangDepuisLeSommet } from '../logic/vocabulaireDuButin';

/**
 * **La rareté en couleur**, comptée depuis le sommet de l'échelle du jeu : les
 * trois paliers du haut se colorent (or, violet, cyan), le reste reste neutre.
 *
 * Elle vivait dans l'historique seul ; le pool en a besoin aussi (refonte, L5,
 * étape 2). *Deux palettes pour la même rareté finiraient par se contredire.*
 */
const ETIQUETTES = [
    'bg-gm-gold/15 text-gm-gold border border-gm-gold/40',
    'bg-gm-violet/15 text-gm-violet border border-gm-violet/40',
    'bg-gm-cyan/15 text-gm-cyan border border-gm-cyan/40',
];
const LISERES = ['border-l-gm-gold', 'border-l-gm-violet', 'border-l-gm-cyan'];

export function couleurDeRarete(driver: GameDriver | null | undefined, rarete?: string): { etiquette: string; lisere: string } {
    const rang = rangDepuisLeSommet(driver, rarete);
    return {
        etiquette: ETIQUETTES[rang] ?? 'bg-app-text/5 text-app-muted border border-app-border',
        lisere: LISERES[rang] ?? 'border-l-app-border',
    };
}
