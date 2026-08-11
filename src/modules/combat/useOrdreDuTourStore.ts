import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCombatStore } from './useCombatStore';
import {
    ouvrirLeRound,
    ouvrirLeRoundSuivant,
    agir,
    passerLaMain,
    conserverLaMain,
    type Camp,
    type EtatDuTour,
} from './logic/OrdreDuTour';

/**
 * L'état de l'alternance, quand le pilote la déclare.
 *
 * **Pourquoi un store à part.** `useCombatStore` porte un contrat vérifié : son
 * `partialize` est exactement les quatre champs qu'il diffuse aux écrans
 * secondaires (`src/services/windowTransport.ts`). Y greffer un cinquième champ
 * romprait cette égalité, qui est le seul contrôle bon marché dont on dispose
 * sur la compatibilité du transport. L'alternance vit donc à côté, et ne touche
 * à `useCombatStore` que par une action publique.
 *
 * **Ce qu'il ne fait pas** : payer. Conserver la main coûte deux points, et
 * c'est l'écran qui les prélève sur les réserves de table — le module d'ordre du
 * tour ne connaît pas les monnaies, et les mêler aurait rendu chacun
 * intestable sans l'autre.
 *
 * Comme les réserves de table, cet état ne part pas vers la tablette : ce serait
 * un nouveau flux dans le relais, et c'est un chantier à part.
 */
interface OrdreDuTourState {
    /** `null` tant qu'aucun round n'est ouvert — le mode alternance est un choix, pas un défaut. */
    tour: EtatDuTour | null;

    /** Le meneur désigne le camp qui ouvre. Rien n'est tiré, rien n'est trié. */
    ouvrir: (camp: Camp) => void;
    /** Un combattant prend son tour, et devient l'actif du plateau. */
    faireAgir: (combattantId: string) => void;
    /** Le camp actif cède : l'adversaire choisit le prochain. */
    ceder: () => void;
    /** Le camp actif garde la main. **Le paiement est à l'appelant** — ce store ne connaît pas les réserves. */
    conserver: () => void;
    /** Le round suivant s'ouvre sur le camp désigné. */
    roundSuivant: (camp: Camp) => void;
    /** Sort de l'alternance — fin du conflit. */
    clore: () => void;
}

export const useOrdreDuTourStore = create<OrdreDuTourState>()(
    persist(
        (set, get) => ({
            tour: null,

            ouvrir: camp => set({ tour: ouvrirLeRound(camp, useCombatStore.getState().round) }),

            faireAgir: combattantId => {
                const tour = get().tour;
                if (!tour) return;
                set({ tour: agir(tour, combattantId) });
                // Le plateau suit : l'actif est celui qui vient d'être désigné,
                // pas le suivant dans une liste triée qui n'existe plus.
                useCombatStore.getState().setCurrentTurnTo(combattantId);
            },

            ceder: () => {
                const tour = get().tour;
                if (!tour) return;
                set({ tour: passerLaMain(tour) });
            },

            conserver: () => {
                const tour = get().tour;
                if (!tour) return;
                set({ tour: conserverLaMain(tour) });
            },

            roundSuivant: camp => {
                const tour = get().tour;
                if (!tour) return;
                const suivant = ouvrirLeRoundSuivant(tour, camp);
                set({ tour: suivant });
                useCombatStore.setState({ round: suivant.round });
                useCombatStore.getState().broadcastSync();
            },

            clore: () => set({ tour: null }),
        }),
        {
            name: 'gmos-ordre-du-tour',
            partialize: state => ({ tour: state.tour }),
        },
    ),
);
