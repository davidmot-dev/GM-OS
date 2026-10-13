import { useOrdreDuTourStore } from './useOrdreDuTourStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { carteDecrite, effetsDuCamp, ligneActive } from './logic/paquetDAction';
import type { Camp } from './logic/OrdreDuTour';
import type { EffetDeConflit } from '../../types/deck.types';

/**
 * **Ce que la carte d'Action du round donne à un camp** — Torg, 2026-10-13.
 * Lu par le panneau de jet (Déstabilisés, « Un de plus ! ») : rien tant qu'aucun
 * round n'est ouvert sur une carte décrite.
 *
 * ⚠ L'ordre du tour ne part pas vers les tablettes (`useOrdreDuTourStore`) : un
 * jet lancé depuis une tablette ne voit pas la carte. Le panneau du meneur, si.
 */
export function useEffetsDuRound(camp: Camp): EffetDeConflit[] {
    const tour = useOrdreDuTourStore(s => s.tour);
    const carte = useOrdreDuTourStore(s => s.carte);
    const enAttente = useOrdreDuTourStore(s => s.carteEnAttente);
    const scene = useOrdreDuTourStore(s => s.scene);
    const deck = useSessionOSStore(s => (carte ? s.decks.find(d => d.id === carte.deckId) : undefined));
    if (!tour || !carte || enAttente) return [];
    const decrite = carteDecrite(deck, carte.index);
    return decrite ? effetsDuCamp(ligneActive(decrite, scene), camp) : [];
}
