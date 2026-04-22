/**
 * Session-OS Store — Session Slice
 *
 * Gère les sessions de jeu :
 * - CRUD des sessions
 * - Checklists de préparation
 * - Gestion des entités actives par session
 *
 * @module session/store/sessionSlice
 */

import type { StateCreator } from 'zustand';
import i18next from 'i18next';
import { gmToast } from '../../../stores/useToastStore';
import type { GameSession, TransferRequest } from './types';
import { sanitizeSession } from '../logic/sanitization';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface PendingPreFill {
    type: 'npc' | 'clue' | 'location' | 'item' | 'lore' | 'rumor';
    sourceId?: string;
    data: {
        title: string;
        content: string;
        imageUrl?: string;
        mediaUrl?: string;
    };
}

export interface SessionSliceState {
    sessions: GameSession[];
    pendingPreFill: PendingPreFill | null;
    transferRequests: TransferRequest[];
    connectedCharacters: Record<string, string>; // NEW: Mapping of characterId -> deviceId for active locks
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface SessionSliceActions {
    addSession: (session: Omit<GameSession, 'id'>) => string;
    updateSession: (id: string, updates: Partial<GameSession>) => void;
    updateSessionPublicSummary: (sessionId: string, summary: string) => void;
    updateSessionGmSecrets: (sessionId: string, secrets: string) => void;
    updateSessionNotes: (sessionId: string, notes: string) => void;
    toggleChecklistItem: (sessionId: string, itemId: string) => void;
    addChecklistItem: (sessionId: string, text: string) => void;
    removeChecklistItem: (sessionId: string, itemId: string) => void;
    updateChecklistItem: (sessionId: string, itemId: string, text: string) => void;
    addEntityToSession: (sessionId: string, entityId: string) => void;
    removeEntityFromSession: (sessionId: string, entityId: string) => void;
    clearSessionEntities: (sessionId: string) => void;
    deleteSession: (id: string) => void;
    sanitizeAllSessions: () => void;
    setPendingPreFill: (preFill: PendingPreFill) => void;
    clearPendingPreFill: () => void;
    setCharacterLocks: (locks: Record<string, string>) => void; // NEW: Setter for character locks

    // P2P Item Transfers
    requestItemTransfer: (fromCharId: string, toCharId: string, item: import('./types').InventoryItem) => void;
    approveItemTransfer: (requestId: string) => void;
    rejectItemTransfer: (requestId: string) => void;
}

export type SessionSlice = SessionSliceState & SessionSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
    // Initial State
    sessions: [],
    pendingPreFill: null,
    transferRequests: [],
    connectedCharacters: {},

    // Actions
    addSession: (session) => {
        const id = `s-${Date.now()}`;
        const newSession = sanitizeSession({ 
            ...session, 
            id,
            checklist: session.checklist || [],
            sessionEntityIds: session.sessionEntityIds || []
        });
        set((state) => ({ sessions: [...state.sessions, newSession] }));
        gmToast(i18next.t('modules:session.toasts.session_created', { number: newSession.number }), 'success');
        return id;
    },

    updateSession: (id, updates) =>
        set((state) => ({
            sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

    updateSessionPublicSummary: (sessionId, summary) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, publicSummary: summary } : s
            ),
        })),

    updateSessionGmSecrets: (sessionId, secrets) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, gmSecrets: secrets } : s
            ),
        })),

    updateSessionNotes: (sessionId, notes) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, sessionNotes: notes } : s
            ),
        })),

    toggleChecklistItem: (sessionId, itemId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? {
                          ...s,
                          checklist: (s.checklist || []).map((item) =>
                              item.id === itemId
                                  ? { ...item, isCompleted: !item.isCompleted }
                                  : item
                          ),
                      }
                    : s
            ),
        })),

    addChecklistItem: (sessionId, text) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? {
                          ...s,
                          checklist: [
                              ...(s.checklist || []),
                              { id: `ci-${Date.now()}`, text, isCompleted: false },
                          ],
                      }
                    : s
            ),
        })),

    removeChecklistItem: (sessionId, itemId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? { ...s, checklist: (s.checklist || []).filter((item) => item.id !== itemId) }
                    : s
            ),
        })),

    updateChecklistItem: (sessionId, itemId, text) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? {
                          ...s,
                          checklist: (s.checklist || []).map((item) =>
                              item.id === itemId ? { ...item, text } : item
                          ),
                      }
                    : s
            ),
        })),

    addEntityToSession: (sessionId, entityId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId && !(s.sessionEntityIds || []).includes(entityId)
                    ? { ...s, sessionEntityIds: [...(s.sessionEntityIds || []), entityId] }
                    : s
            ),
        })),

    removeEntityFromSession: (sessionId, entityId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? { ...s, sessionEntityIds: (s.sessionEntityIds || []).filter((id) => id !== entityId) }
                    : s
            ),
        })),

    clearSessionEntities: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, sessionEntityIds: [] } : s
            ),
        })),

    deleteSession: (id) =>
        set((state) => {
            const session = state.sessions.find((s) => s.id === id);
            const newSessions = state.sessions.filter((s) => s.id !== id);
            gmToast(i18next.t('modules:session.toasts.session_deleted', { number: session?.number }), 'success');
            return { sessions: newSessions };
        }),

    sanitizeAllSessions: () =>
        set((state) => ({
            sessions: state.sessions.map(sanitizeSession),
        })),

    setPendingPreFill: (preFill) => set({ pendingPreFill: preFill }),
    clearPendingPreFill: () => set({ pendingPreFill: null }),
    setCharacterLocks: (locks) => set({ connectedCharacters: locks }),

    // ─── P2P Item Transfers ───────────────────────

    requestItemTransfer: (fromCharId, toCharId, item) => {
        const state = get() as unknown as import('./index').SessionOSStore;
        const fromChar = state.players.flatMap(p => p.characters).find(c => c.id === fromCharId);
        const toChar = state.players.flatMap(p => p.characters).find(c => c.id === toCharId);

        if (!fromChar || !toChar) return;

        const request: import('./types').TransferRequest = {
            id: `tr-${Date.now()}`,
            fromCharacterId: fromCharId,
            fromCharacterName: fromChar.name,
            toCharacterId: toCharId,
            toCharacterName: toChar.name,
            item,
            timestamp: Date.now(),
            status: 'pending'
        };

        set((state) => ({ transferRequests: [...state.transferRequests, request] }));
        gmToast(i18next.t('modules:session.toasts.transfer_request_sent'), 'info');
    },

    approveItemTransfer: (requestId) => {
        const state = get() as unknown as import('./index').SessionOSStore;
        const request = state.transferRequests.find(r => r.id === requestId);
        
        if (!request || request.status !== 'pending') return;

        // 1. Trouver le player ID de l'expéditeur et du destinataire
        const fromPlayer = state.players.find(p => p.characters.some(c => c.id === request.fromCharacterId));
        const toPlayer = state.players.find(p => p.characters.some(c => c.id === request.toCharacterId));

        if (!fromPlayer || !toPlayer) {
            gmToast(i18next.t('modules:session.toasts.transfer_error_char_not_found'), "error");
            return;
        }

        // 2. Effectuer le transfert atomique
        const cleanItem = { ...request.item };
        delete (cleanItem as any).status; // L'objet n'est plus en attente pour le destinataire

        state.removeInventoryItem(fromPlayer.id, request.fromCharacterId, request.item.id);
        state.addInventoryItem(toPlayer.id, request.toCharacterId, cleanItem);

        // 3. Mettre à jour le statut de la requête
        set((state) => ({
            transferRequests: state.transferRequests.map(r => 
                r.id === requestId ? { ...r, status: 'approved' } : r
            )
        }));

        gmToast(i18next.t('modules:session.toasts.transfer_approved', { item: request.item.name }), 'success');
        

        // Log dans le journal
        const journal = (window as any).useJournalStore?.getState();
        if (journal) {
            journal.addEvent({
                type: 'SYSTEM',
                title: i18next.t('modules:session.events.item_transfer_title'),
                content: i18next.t('modules:session.events.item_transfer_content', { 
                    from: request.fromCharacterName, 
                    item: request.item.name, 
                    to: request.toCharacterName 
                })
            });
        }
    },

    rejectItemTransfer: (requestId) => {
        set((state) => ({
            transferRequests: state.transferRequests.map(r => 
                r.id === requestId ? { ...r, status: 'rejected' } : r
            )
        }));
        gmToast(i18next.t('modules:session.toasts.transfer_rejected'), "info");
    },
});
