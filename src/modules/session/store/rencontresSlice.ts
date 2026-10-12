/**
 * Session-OS Store — Rencontres Slice
 *
 * Les rencontres préparées d'une campagne (2026-10-12). Voir
 * `src/types/rencontres.types.ts` pour le modèle, et
 * `combat/logic/invocationDeRencontre.ts` pour ce qu'en fait Combat-OS.
 *
 * @module session/store/rencontresSlice
 */

import type { CreateurDeSlice } from './contratDesSlices';
import type { RencontrePreparee } from '../../../types/rencontres.types';

export interface RencontresSliceState {
    rencontres: RencontrePreparee[];
}

export interface RencontresSliceActions {
    /** Range une rencontre et rend son identifiant. */
    ajouterUneRencontre: (rencontre: Omit<RencontrePreparee, 'id' | 'creeeLe'>) => string;
    /** Corrige une rencontre — `sceneId: undefined` la détache de sa scène. */
    modifierUneRencontre: (id: string, updates: Partial<Omit<RencontrePreparee, 'id' | 'campaignId'>>) => void;
    supprimerUneRencontre: (id: string) => void;
}

export type RencontresSlice = RencontresSliceState & RencontresSliceActions;

export const createRencontresSlice: CreateurDeSlice<RencontresSlice> = (set) => ({
    rencontres: [],

    ajouterUneRencontre: (rencontre) => {
        const id = `rencontre-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
            rencontres: [...(state.rencontres ?? []), { ...rencontre, id, creeeLe: Date.now() }],
        }));
        return id;
    },

    modifierUneRencontre: (id, updates) =>
        set((state) => ({
            rencontres: (state.rencontres ?? []).map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

    supprimerUneRencontre: (id) =>
        set((state) => ({
            rencontres: (state.rencontres ?? []).filter((r) => r.id !== id),
        })),
});
