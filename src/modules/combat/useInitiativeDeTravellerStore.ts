import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../../utils/ecritureReserveeAuMJ';
import { PREPARATION_D_INITIATIVE, type CampDeTraveller, type PreparationDInitiative } from './logic/initiativeDeTraveller';

/**
 * **Ce que le meneur prépare avant l'initiative de Traveller** — TRV-A4, 27/11/2026, sur le modèle
 * du round de Degenesis (`useRoundDeDegenesisStore`) : les Effets de Tactique de chaque camp et le
 * camp qui tend l'embuscade (p. 71). Lu par `rollAutoInitiative` ; gardé chez le meneur seulement.
 * Un nouveau combat repart de zéro (`reinitialiser`).
 */
interface InitiativeDeTravellerState extends PreparationDInitiative {
    poserLaTactique: (camp: CampDeTraveller, effet: number) => void;
    poserLEmbuscade: (camp: CampDeTraveller | null) => void;
    reinitialiser: () => void;
}

export const useInitiativeDeTravellerStore = create<InitiativeDeTravellerState>()(
    persist(
        (set) => ({
            ...PREPARATION_D_INITIATIVE,
            poserLaTactique: (camp, effet) => set(s => ({ tactique: { ...s.tactique, [camp]: Math.trunc(effet) || 0 } })),
            poserLEmbuscade: camp => set({ embuscade: camp }),
            reinitialiser: () => set({ ...PREPARATION_D_INITIATIVE }),
        }),
        {
            name: 'gmos-initiative-de-traveller',
            storage: stockageLocalDuMJ(),
            partialize: s => ({ tactique: s.tactique, embuscade: s.embuscade }),
        },
    ),
);
