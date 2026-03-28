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
    activeCampaignName: string | null;
    activeCampaignWallpaper: string | null;
    editingClueId: string | null;
    remoteNotifications: import('./types').RemoteNotification[];
    hubNotifications: import('./types').HubNotification[];
    messages: import('./types').SessionMessage[];
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
    addRemoteNotification: (notif: Omit<import('./types').RemoteNotification, 'id' | 'timestamp' | 'isRead'>) => void;
    clearRemoteNotification: (id: string) => void;
    addHubNotification: (notif: Omit<import('./types').HubNotification, 'id' | 'timestamp'>) => void;
    clearHubNotification: (id: string) => void;
    addSessionMessage: (message: import('./types').SessionMessage) => void;
    remoteSendMessage: (toId: string, toName: string, fromId: string, fromName: string, content: string) => void;
    sendDirectMessage: (toId: string, toName: string, content: string) => void;
    saveMessageToJournal: (messageId: string) => void;
}

export type UiSlice = UiSliceState & UiSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set, get) => ({
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
    activeCampaignFormSection: 'identity',
    isHeaderHidden: false,
    activeCampaignName: null,
    activeCampaignWallpaper: null,
    editingClueId: null,
    remoteNotifications: [],
    hubNotifications: [],
    messages: [],

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

    addRemoteNotification: (notif) =>
        set((state) => ({
            remoteNotifications: [
                {
                    ...notif,
                    id: `rn-${Date.now()}`,
                    timestamp: Date.now(),
                    isRead: false,
                },
                ...state.remoteNotifications.slice(0, 19), // Garder les 20 dernières
            ],
        })),

    clearRemoteNotification: (id) =>
        set((state) => ({
            remoteNotifications: state.remoteNotifications.filter((n) => n.id !== id),
        })),

    addHubNotification: (notif) =>
        set((state) => ({
            hubNotifications: [
                {
                    ...notif,
                    id: `hn-${Date.now()}`,
                    timestamp: Date.now(),
                },
                ...state.hubNotifications.slice(0, 9), // Garder les 10 dernières
            ],
        })),

    clearHubNotification: (id) =>
        set((state) => ({
            hubNotifications: state.hubNotifications.filter((n) => n.id !== id),
        })),

    addSessionMessage: (message) =>
        set((state) => ({
            messages: [...state.messages, message].slice(-100), // Garder les 100 derniers
        })),

    remoteSendMessage: (toId, toName, fromId, fromName, content) => {
        const msg: import('./types').SessionMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            fromId,
            fromName,
            toId,
            toName,
            content,
            timestamp: Date.now(),
            isRead: true,
        };

        // Ajout local (Optimistic)
        set((state) => ({ messages: [...state.messages, msg].slice(-100) }));

        // Envoi via Bridge/Socket
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session:send-message', { detail: msg }));
        }
    },

    sendDirectMessage: (toId, toName, content) => {
        const msg: import('./types').SessionMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            fromId: 'GM',
            fromName: 'Maître du Jeu',
            toId,
            toName,
            content,
            timestamp: Date.now(),
            isRead: true,
        };

        // Ajout local
        set((state) => ({ messages: [...state.messages, msg].slice(-100) }));

        // Broadcast aux Hubs
        if (window.appBridge?.send) {
            window.appBridge.send('remote:broadcast-ui-action', {
                type: 'session:receive-message',
                payload: msg
            });
        }
    },

    saveMessageToJournal: (messageId) => {
        const { messages } = get();
        const msg = messages.find((m) => m.id === messageId);
        if (!msg) return;

        // Import dynamique pour éviter les dépendances circulaires
        import('../../journal/useJournalStore').then((m) => {
            const journalStore = m.useJournalStore.getState();
            journalStore.addEvent({
                type: 'NOTE',
                title: `Message de ${msg.fromName} (${msg.fromId})`,
                content: msg.content,
            });
        });
    },
});
