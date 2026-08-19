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
import type { GameSession, TransferRequest, SessionFeedback } from './types';
import type { Scene } from '../../../types/trame.types';
import { sanitizeSession } from '../logic/sanitization';
import { suspendreLesScenes, reprendreLesScenes } from '../logic/trame';
import { cloturerLeJournalDeLaSeance } from '../../journal/clotureDeSeance';

/**
 * Ce que ce slice doit voir chez son voisin, et rien de plus.
 *
 * Une séance qui s'active ou s'arrête déplace l'état de jeu des scènes. On
 * élargit le typage **localement** plutôt que d'importer `TrameSlice` —
 * l'importer fermerait un cycle entre les deux modules, et c'est le geste déjà
 * retenu dans `trameSlice` et `entitySlice`.
 */
type AvecTrame = SessionSlice & { scenes: Scene[] };

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

    // Session Feedback
    submitSessionFeedback: (sessionId: string, feedback: SessionFeedback) => void;
    remoteSubmitSessionFeedback: (sessionId: string, feedback: SessionFeedback) => void;
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

    /*
      **Changer le statut d'une séance déplace les scènes avec elle.**

      Les deux règles de David du 2026-08-17 : une séance qui s'arrête SUSPEND
      ses scènes — elle ne les termine pas —, et une séance qui s'ouvre relance
      celles qui étaient en pause.

      Ici plutôt que dans l'écran, parce que **trois chemins** font ce même
      changement : le bouton de fin de séance du cockpit, le sélecteur de statut
      de l'éditeur de préparation, et `SessionManager.launchSession`. Le poser
      dans chacun aurait produit trois versions qui auraient fini par diverger —
      *une vérification qui ne couvre qu'un chemin ne protège que ce chemin.*

      Le déplacement ne se fait qu'au **changement** de statut : réenregistrer
      une séance active ne doit pas rouvrir un passage à chaque frappe.
    */
    updateSession: (id, updates) =>
        (set as unknown as (fn: (state: AvecTrame) => Partial<AvecTrame>) => void)((state) => {
            const avant = state.sessions.find((s) => s.id === id);
            const sessions = state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s));
            if (!avant || updates.status === undefined || updates.status === avant.status) {
                return { sessions };
            }

            const quand = Date.now();
            if (updates.status === 'active') {
                return { sessions, scenes: reprendreLesScenes(state.scenes ?? [], avant.campaignId, id, quand) };
            }
            if (avant.status === 'active') {
                /*
                  **La séance qui s'arrête clôt son journal.**

                  Elle ne le faisait pas : `stopJournal` n'était appelé que
                  depuis `setActiveCampaign`, donc un journal restait ouvert
                  jusqu'au changement de campagne — et personne ne lui passait
                  d'instantané, si bien que toute sa capture d'état de fin
                  n'avait jamais tourné.

                  Appelé hors du `set` — la clôture lit plusieurs stores et en
                  écrit un autre ; la faire pendant le calcul d'un état
                  reviendrait à muter pendant qu'on se met à jour.

                  **`avant` part avec elle, et c'est indispensable.** La
                  microtâche tourne après ce commit, donc après que la séance
                  soit passée à `done` : la clôture, qui cherchait la séance
                  encore `active`, ne trouvait plus rien et perdait les notes du
                  meneur, les entités de la séance et la checklist. Trouvé le
                  2026-08-19 en relisant une vraie séance — les tests
                  appelaient la clôture directement, sur un magasin où la séance
                  était `active` en dur, et ne pouvaient pas le voir.
                */
                queueMicrotask(() => cloturerLeJournalDeLaSeance(avant.campaignId, avant));
                return { sessions, scenes: suspendreLesScenes(state.scenes ?? [], avant.campaignId, quand) };
            }
            return { sessions };
        }),

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

    submitSessionFeedback: (sessionId, feedback) =>
        set((state) => ({
            sessions: state.sessions.map((s) => {
                if (s.id !== sessionId) return s;
                const currentFeedbacks = s.feedbacks || [];
                const filtered = currentFeedbacks.filter(f => f.characterId !== feedback.characterId);
                return {
                    ...s,
                    feedbacks: [...filtered, feedback]
                };
            })
        })),

    remoteSubmitSessionFeedback: (sessionId, feedback) => {
        get().submitSessionFeedback(sessionId, feedback);
        if (typeof window !== 'undefined') {
            if (window.appBridge?.remote?.broadcastToTablets) {
                window.appBridge.remote.broadcastToTablets(
                    'session:submit-feedback',
                    { sessionId, feedback }
                );
            } else {
                window.dispatchEvent(new CustomEvent('session:submit-feedback', {
                    detail: { sessionId, feedback }
                }));
            }
        }
    },
});
