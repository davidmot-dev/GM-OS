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
import { gmToast } from '../../../stores/useToastStore';
import type { GameSession } from './types';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface SessionSliceState {
    sessions: GameSession[];
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
}

export type SessionSlice = SessionSliceState & SessionSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set) => ({
    // Initial State
    sessions: [],

    // Actions
    addSession: (session) => {
        const id = `s-${Date.now()}`;
        const newSession: GameSession = { ...session, id };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
        gmToast.success(`Session #${newSession.number} créée.`);
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
                          checklist: s.checklist.map((item) =>
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
                              ...s.checklist,
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
                    ? { ...s, checklist: s.checklist.filter((item) => item.id !== itemId) }
                    : s
            ),
        })),

    updateChecklistItem: (sessionId, itemId, text) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? {
                          ...s,
                          checklist: s.checklist.map((item) =>
                              item.id === itemId ? { ...item, text } : item
                          ),
                      }
                    : s
            ),
        })),

    addEntityToSession: (sessionId, entityId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId && !s.sessionEntityIds.includes(entityId)
                    ? { ...s, sessionEntityIds: [...s.sessionEntityIds, entityId] }
                    : s
            ),
        })),

    removeEntityFromSession: (sessionId, entityId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId
                    ? { ...s, sessionEntityIds: s.sessionEntityIds.filter((id) => id !== entityId) }
                    : s
            ),
        })),

    clearSessionEntities: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, sessionEntityIds: [] } : s
            ),
        })),
});
