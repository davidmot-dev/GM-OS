import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../../utils/ecritureReserveeAuMJ';
import { useCombatStore } from './useCombatStore';
import type { DeclarationDeRA } from '../dice/systemes/rangsDActionDeRuneQuest';

/**
 * **Les rangs d'action de RuneQuest** (`combat.initiative.mode: 'rangs-d-action'`) — RQ-A4,
 * 03/11/2026, sur le modèle du round de Rêve de Dragon (`useRoundDuVoyageurStore`).
 *
 * Ce que le meneur déclare pour chacun, et **ses décisions au-delà de 12** : reporter
 * l'action au round suivant (un sort s'y poursuit, p. 194 ; une arme seulement si la
 * meneuse le décide) ou y renoncer. Le plateau n'est touché que par `ordonnerLeRound`.
 */
export interface Report { ra: number; round: number; quoi: string }

interface RangsDActionState {
    declarations: Record<string, DeclarationDeRA>;
    /** L'action reportée : elle agit à `ra` pendant le round `round`. */
    reports: Record<string, Report>;
    /** Le round où le meneur a renoncé à l'action. */
    renonces: Record<string, number>;
    declarer: (combattantId: string, maj: Partial<DeclarationDeRA>, defaut: DeclarationDeRA) => void;
    reporter: (combattantId: string, report: Report) => void;
    renoncer: (combattantId: string, round: number) => void;
    /** Nouveau round : les intentions restent, les délais du round s'effacent. */
    roundSuivant: () => void;
    clore: () => void;
}

export const useRangsDActionStore = create<RangsDActionState>()(
    persist(
        (set) => ({
            declarations: {},
            reports: {},
            renonces: {},
            declarer: (id, maj, defaut) => set(s => ({ declarations: { ...s.declarations, [id]: { ...defaut, ...s.declarations[id], ...maj } } })),
            reporter: (id, report) => set(s => {
                const { [id]: _renonce, ...renonces } = s.renonces;
                return { reports: { ...s.reports, [id]: report }, renonces };
            }),
            renoncer: (id, round) => set(s => {
                const { [id]: _report, ...reports } = s.reports;
                return { reports, renonces: { ...s.renonces, [id]: round } };
            }),
            roundSuivant: () => {
                set(s => ({
                    declarations: Object.fromEntries(Object.entries(s.declarations).map(([id, d]) =>
                        [id, { ...d, preparations: 0, deplacement: 0, surprise: 'aucune' as const, armeVersSort: false, ajustement: 0 }])),
                }));
                const combat = useCombatStore.getState();
                useCombatStore.setState({ round: combat.round + 1 });
                combat.broadcastSync();
            },
            clore: () => set({ declarations: {}, reports: {}, renonces: {} }),
        }),
        {
            name: 'gmos-rangs-d-action',
            storage: stockageLocalDuMJ(),
            partialize: s => ({ declarations: s.declarations, reports: s.reports, renonces: s.renonces }),
        },
    ),
);
