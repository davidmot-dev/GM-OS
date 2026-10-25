import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCombatStore } from './useCombatStore';
import {
    ouvrirLeRound,
    ouvrirLeRoundSuivant,
    agir,
    passerLaMain,
    conserverLaMain,
    agirDansSonCamp,
    secondTourDuCamp,
    type Camp,
    type EtatDuTour,
} from './logic/OrdreDuTour';
import type { SceneDeConflit } from './logic/paquetDAction';

/** La carte d'Action du round — Torg. Le paquet la détient, on retient laquelle. */
export interface CarteDuRound {
    deckId: string;
    index: number;
}

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
    qualifierActionDune: (action: NonNullable<EtatDuTour['actionDune']>) => void;
    rejouerDune: (parDetermination?: boolean) => void;
    /** Le round suivant s'ouvre sur le camp désigné. */
    roundSuivant: (camp: Camp) => void;
    /** Sort de l'alternance — fin du conflit. */
    clore: () => void;

    /* ── Le Paquet d'Action de Torg (2026-10-13) ───────────────────────────── */

    /** La carte retournée pour ce round. */
    carte: CarteDuRound | null;
    /** La ligne de la carte qui vaut : la claire (standard) ou la sombre (dramatique). */
    scene: SceneDeConflit;
    /** La carte est posée, son round n'est pas ouvert : elle attend d'être décrite, ou que le meneur tranche. */
    carteEnAttente: boolean;
    /** Ce qui a déjà été appliqué ce round (« inspiration:joueurs », « vivacite:adversaires ») — un clic, une fois. */
    dejaApplique: string[];
    choisirLaScene: (scene: SceneDeConflit) => void;
    /**
     * Une carte vient d'être retournée. `camp` : celui qu'elle désigne — le round
     * s'ouvre (le premier, ou le suivant). `null` : la carte n'est pas encore
     * décrite, le round attend que le meneur la décrive ou désigne le camp.
     */
    poserLaCarte: (carte: CarteDuRound, camp: Camp | null) => void;
    /** Le round s'ouvre sur la carte déjà posée. */
    ouvrirSurLaCarte: (camp: Camp) => void;
    /** Un combattant prend son tour ; son camp garde la main tant qu'il lui reste quelqu'un. */
    faireAgirDansSonCamp: (combattantId: string) => void;
    /** Vivacité : le camp rejoue un tour complet. */
    secondTour: (camp: Camp) => void;
    noterLApplication: (cle: string) => void;
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
            qualifierActionDune: action => set(s => ({ tour: s.tour ? { ...s.tour, actionDune: action } : null })),
            rejouerDune: (parDetermination = false) => {
                const t = get().tour; if (!t?.dernierAgissant) return;
                set({ tour: { ...t, repriseDune: t.dernierAgissant, enAttenteDeDecision: false, difficulteDune: parDetermination ? 0 : 1, repriseParDetermination: parDetermination } });
            },

            roundSuivant: camp => {
                const tour = get().tour;
                if (!tour) return;
                const suivant = ouvrirLeRoundSuivant(tour, camp);
                set({ tour: suivant });
                useCombatStore.setState({ round: suivant.round });
                useCombatStore.getState().broadcastSync();
            },

            clore: () => set({ tour: null, carte: null, carteEnAttente: false, dejaApplique: [] }),

            carte: null,
            scene: 'standard',
            dejaApplique: [],
            carteEnAttente: false,

            choisirLaScene: scene => set({ scene }),

            poserLaCarte: (carte, camp) => {
                set({ carte, dejaApplique: [], carteEnAttente: true });
                if (camp) get().ouvrirSurLaCarte(camp);
            },

            ouvrirSurLaCarte: camp => {
                if (get().tour) get().roundSuivant(camp);
                else get().ouvrir(camp);
                set({ carteEnAttente: false });
            },

            faireAgirDansSonCamp: combattantId => {
                const tour = get().tour;
                if (!tour) return;
                set({ tour: agirDansSonCamp(tour, combattantId) });
                useCombatStore.getState().setCurrentTurnTo(combattantId);
            },

            secondTour: camp => {
                const tour = get().tour;
                if (!tour) return;
                set({ tour: secondTourDuCamp(useCombatStore.getState().combatants, tour, camp) });
            },

            noterLApplication: cle => set(s => ({ dejaApplique: [...s.dejaApplique, cle] })),
        }),
        {
            name: 'gmos-ordre-du-tour',
            partialize: state => ({
                tour: state.tour, carte: state.carte, scene: state.scene,
                carteEnAttente: state.carteEnAttente, dejaApplique: state.dejaApplique,
            }),
        },
    ),
);
