import { useOrdreDuTourStore } from './useOrdreDuTourStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { effetsDuRound } from './logic/paquetDAction';
import type { Camp } from './logic/OrdreDuTour';
import type { EffetDeConflit } from '../../types/deck.types';

/**
 * **Ce que la carte d'Action du round donne à un camp** — Torg, 2026-10-13.
 * Lu par le panneau de jet (Déstabilisés, « Un de plus ! ») : rien tant qu'aucun
 * round n'est ouvert sur une carte décrite.
 *
 * Chez le meneur, calculé depuis l'ordre du tour. **Sur la tablette, reçu avec
 * la séance** (`effetsDuRound`, ceux des Héros) : l'ordre du tour n'y existe
 * pas. Jusqu'au 16/10, il n'y était pas envoyé, et un jet lancé depuis une
 * tablette ignorait la carte — Déstabilisés n'y retirait rien.
 */
const AUCUN: EffetDeConflit[] = [];

export function useEffetsDuRound(camp: Camp): EffetDeConflit[] {
    const tour = useOrdreDuTourStore(s => s.tour);
    const carte = useOrdreDuTourStore(s => s.carte);
    const carteEnAttente = useOrdreDuTourStore(s => s.carteEnAttente);
    const scene = useOrdreDuTourStore(s => s.scene);
    const deck = useSessionOSStore(s => (carte ? s.decks.find(d => d.id === carte.deckId) : undefined));
    const recus = useSessionOSStore(s => s.effetsDuRound);
    if (recus) return camp === 'joueurs' ? recus : AUCUN;
    return effetsDuRound({ tour, carte, carteEnAttente, scene }, deck, camp);
}
