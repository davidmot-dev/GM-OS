/**
 * Session-OS Store — UI Slice
 *
 * Gère tout l'état d'interface utilisateur du module Session-OS :
 * - Vue active (currentView)
 * - Historique des jets de dés
 * - États de navigation (onglets, sélections)
 * - Indicateurs de chargement UI
 *
 * @module session/store/uiSlice
 */

import type { StateCreator } from 'zustand';
import type { CurrentView } from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface UiSliceState {
    currentView: CurrentView;
    wikiTab: 'timeline' | 'wiki';
    selectedWikiEntryId: string | null;
    selectedSessionId: string | null;
    selectedPlayerId: string | null;
    selectedCharacterId: string | null;
    selectedAtlasMapId: string | null;
    selectedEntityId: string | null;
    editingTemplateId: string | null;
    editingDriverId: string | null;
    diceRolls: { die: number; result: number; timestamp: number }[];
    isAddingEntity: boolean;
    isGeneratingAIImage: boolean;
    activeCampaignFormSection: string | null;
    isHeaderHidden: boolean;
    editingClueId: string | null;
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface UiSliceActions {
    setCurrentView: (view: CurrentView) => void;
    setWikiTab: (tab: UiSliceState['wikiTab']) => void;
    setSelectedWikiEntryId: (id: string | null) => void;
    setSelectedSession: (id: string | null) => void;
    setSelectedPlayer: (id: string | null) => void;
    setSelectedCharacter: (id: string | null) => void;
    setSelectedAtlasMap: (id: string | null) => void;
    setSelectedEntity: (id: string | null) => void;
    setEditingTemplateId: (id: string | null) => void;
    setEditingDriverId: (id: string | null) => void;
    setIsAddingEntity: (isAdding: boolean) => void;
    setIsGeneratingAIImage: (isGenerating: boolean) => void;
    setActiveCampaignFormSection: (section: string | null) => void;
    setHeaderHidden: (isHidden: boolean) => void;
    setEditingClueId: (id: string | null) => void;
    rollDice: (die: number) => void;
    clearDiceHistory: () => void;
}

export type UiSlice = UiSliceState & UiSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
    // Initial State
    currentView: 'cockpit',
    wikiTab: 'timeline',
    selectedWikiEntryId: null,
    selectedSessionId: null,
    selectedPlayerId: null,
    selectedCharacterId: null,
    selectedAtlasMapId: null,
    selectedEntityId: null,
    editingTemplateId: null,
    editingDriverId: null,
    diceRolls: [],
    isAddingEntity: false,
    isGeneratingAIImage: false,
    activeCampaignFormSection: 'details',
    isHeaderHidden: false,
    editingClueId: null,

    // Actions
    setCurrentView: (view) => set({ currentView: view }),
    setWikiTab: (tab) => set({ wikiTab: tab }),
    setSelectedWikiEntryId: (id) => set({ selectedWikiEntryId: id }),
    setSelectedSession: (id) => set({ selectedSessionId: id }),
    setSelectedPlayer: (id) => set({ selectedPlayerId: id }),
    setSelectedCharacter: (id) => set({ selectedCharacterId: id }),
    setSelectedAtlasMap: (id) => set({ selectedAtlasMapId: id }),
    setSelectedEntity: (id) => set({ selectedEntityId: id }),
    setEditingTemplateId: (id) => set({ editingTemplateId: id }),
    setEditingDriverId: (id) => set({ editingDriverId: id }),
    setIsAddingEntity: (isAdding) => set({ isAddingEntity: isAdding }),
    setIsGeneratingAIImage: (isGenerating) => set({ isGeneratingAIImage: isGenerating }),
    setActiveCampaignFormSection: (section) => set({ activeCampaignFormSection: section }),
    setHeaderHidden: (isHidden) => set({ isHeaderHidden: isHidden }),
    setEditingClueId: (id) => set({ editingClueId: id }),

    rollDice: (die) =>
        set((state) => ({
            diceRolls: [
                { die, result: Math.floor(Math.random() * die) + 1, timestamp: Date.now() },
                ...state.diceRolls.slice(0, 49), // Garder les 50 derniers résultats
            ],
        })),

    clearDiceHistory: () => set({ diceRolls: [] }),
});
