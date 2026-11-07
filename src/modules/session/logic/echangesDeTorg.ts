import type { DeckSessionState } from '../../../types/deck.types';

/** Livre p. 113 : une pour une dans les deux modes ; en rounds, Réserve à Réserve. */
export function echangerLesCartesTorg(
    etat: DeckSessionState, offerte: number, retour: number, deQui: string, versQui: string,
): { etat: DeckSessionState; refus?: string } {
    const a = etat.enMain?.find(c => c.index === offerte && c.porteur === deQui);
    const b = etat.enMain?.find(c => c.index === retour && c.porteur === versQui);
    if (deQui === versQui || offerte === retour || !a || !b) return { etat, refus: 'Les deux cartes doivent encore être tenues par leurs porteurs.' };
    if (etat.torgEnRounds && (!a.enReserve || !b.enReserve)) return { etat, refus: 'En rounds, seules les cartes des deux Réserves peuvent être échangées.' };
    if (!etat.torgEnRounds && (a.enReserve || b.enReserve)) return { etat, refus: 'Hors rounds, échangez les cartes des deux mains.' };
    return { etat: { ...etat, enMain: etat.enMain!.map(c => c.index === offerte
        ? { ...c, porteur: versQui } : c.index === retour ? { ...c, porteur: deQui } : c) } };
}
