import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../../utils/ecritureReserveeAuMJ';
import { useCombatStore } from './useCombatStore';
import type { DeclarationDeRound } from '../dice/systemes/roundDeReveDeDragon';

/**
 * **Le round de Rêve de Dragon** (`combat.initiative.mode: 'phases'`) — 24/10/2026.
 *
 * À côté de `useCombatStore` pour la même raison que l'alternance : son
 * `partialize` est le contrat du transport vers les écrans secondaires. Ce que
 * le meneur déclare pour chacun — action, arme, état — vit ici, et ne touche le
 * plateau que par une action publique (`ordonnerLeRound`).
 */
export type DeclarationEnCours = Omit<DeclarationDeRound, 'id' | 'nom'>;

interface RoundDuVoyageurState {
    phase: number;
    /** Le round où les combattants s'affrontent pour la première fois : l'arme la plus longue frappe d'abord. */
    engagement: boolean;
    declarations: Record<string, DeclarationEnCours>;
    declarer: (combattantId: string, maj: Partial<DeclarationEnCours>, defaut: DeclarationEnCours) => void;
    allerALaPhase: (phase: number) => void;
    basculerEngagement: () => void;
    /** Les d6 tirés : le round s'ouvre en phase 2, la déclaration faite. */
    poserLesDes: (des: Record<string, number>) => void;
    /** Nouveau round : les d6 s'effacent, les déclarations restent à revoir ; l'engagement est passé. */
    roundSuivant: () => void;
    clore: () => void;
}

export const useRoundDuVoyageurStore = create<RoundDuVoyageurState>()(
    persist(
        (set) => ({
            phase: 1,
            engagement: true,
            declarations: {},
            declarer: (id, maj, defaut) => set(s => ({ declarations: { ...s.declarations, [id]: { ...defaut, ...s.declarations[id], ...maj } } })),
            allerALaPhase: phase => set({ phase: Math.max(1, Math.min(7, phase)) }),
            basculerEngagement: () => set(s => ({ engagement: !s.engagement })),
            poserLesDes: des => set(s => ({
                phase: 2,
                declarations: Object.fromEntries(Object.entries(s.declarations).map(([id, d]) => [id, { ...d, d6: des[id] ?? d.d6 }])),
            })),
            roundSuivant: () => {
                set(s => ({
                    phase: 1, engagement: false,
                    declarations: Object.fromEntries(Object.entries(s.declarations).map(([id, { d6: _d6, ...d }]) => [id, { ...d, charge: false }])),
                }));
                const combat = useCombatStore.getState();
                useCombatStore.setState({ round: combat.round + 1 });
                combat.broadcastSync();
            },
            clore: () => set({ phase: 1, engagement: true, declarations: {} }),
        }),
        {
            name: 'gmos-round-du-voyageur',
            storage: stockageLocalDuMJ(),
            partialize: s => ({ phase: s.phase, engagement: s.engagement, declarations: s.declarations }),
        },
    ),
);
