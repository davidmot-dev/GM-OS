import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../../utils/ecritureReserveeAuMJ';
import { useCombatStore } from './useCombatStore';
import {
    DECLARATION_DU_ROUND, depenserUneAction, rendreUneAction,
    type DeclarationDuRound, type EtatDuRound,
} from '../dice/systemes/combatDeDegenesis';

/**
 * **Le round de Degenesis** (`combat.initiativeEnReserve`) — DEG-A1, 03/11/2026, sur le
 * modèle des rangs d'action de RuneQuest (`useRangsDActionStore`).
 *
 * Ce que le meneur déclare avant l'initiative (Égo, surprise), puis ce que le jet a donné à
 * chacun : son score, ses actions, et les dés d'Égo **payés une fois** qui reviennent à sa
 * première action (p. 100). Le panneau de jet et la défense active dépensent les actions ici :
 * un seul compte, que tout le monde lit. Gardé chez le meneur seulement.
 */
interface RoundDeDegenesisState {
    declarations: Record<string, DeclarationDuRound>;
    /** Le round de l'initiative, et ce qu'elle a donné. */
    round: number | null;
    etats: Record<string, EtatDuRound>;
    declarer: (combattantId: string, maj: Partial<DeclarationDuRound>) => void;
    /** L'initiative est lancée : les états du round remplacent ceux d'avant. */
    poserLeRound: (round: number, etats: Record<string, EtatDuRound>) => void;
    /** Une action se dépense ; rend le bonus d'Égo qu'elle reçoit, ou `null` s'il n'en reste pas. */
    depenser: (combattantId: string) => number | null;
    rendre: (combattantId: string) => void;
    /** Nouveau round : l'Égo et la surprise se redéclarent, l'initiative se relance (p. 100). */
    roundSuivant: () => void;
    clore: () => void;
}

export const useRoundDeDegenesisStore = create<RoundDeDegenesisState>()(
    persist(
        (set, get) => ({
            declarations: {},
            round: null,
            etats: {},
            declarer: (id, maj) => set(s => ({ declarations: { ...s.declarations, [id]: { ...DECLARATION_DU_ROUND, ...s.declarations[id], ...maj } } })),
            poserLeRound: (round, etats) => set({ round, etats }),
            depenser: (id) => {
                const e = get().etats[id];
                const r = e ? depenserUneAction(e) : null;
                if (!r) return null;
                set(s => ({ etats: { ...s.etats, [id]: r.etat } }));
                return r.bonus;
            },
            rendre: (id) => set(s => (s.etats[id] ? { etats: { ...s.etats, [id]: rendreUneAction(s.etats[id]) } } : s)),
            roundSuivant: () => {
                set(s => ({
                    etats: {},
                    round: null,
                    declarations: Object.fromEntries(Object.entries(s.declarations).map(([id, d]) => [id, { ...d, ego: 0, surpris: false }])),
                }));
                const combat = useCombatStore.getState();
                useCombatStore.setState({ round: combat.round + 1 });
                combat.broadcastSync();
            },
            clore: () => set({ declarations: {}, round: null, etats: {} }),
        }),
        {
            name: 'gmos-round-de-degenesis',
            storage: stockageLocalDuMJ(),
            partialize: s => ({ declarations: s.declarations, round: s.round, etats: s.etats }),
        },
    ),
);

/** L'état du round d'un combattant, s'il appartient au round en cours du plateau. */
export function etatDuRoundCourant(combattantId: string | undefined): EtatDuRound | undefined {
    if (!combattantId) return undefined;
    const s = useRoundDeDegenesisStore.getState();
    return s.round !== null && s.round === useCombatStore.getState().round ? s.etats[combattantId] : undefined;
}
