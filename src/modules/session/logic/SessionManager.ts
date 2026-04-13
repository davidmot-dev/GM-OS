import { gmToast } from '../../../stores/useToastStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { useMediaStore } from '../../../stores/useMediaStore';
import type { SessionOSStore } from '../store/index';
import type { GameSession, Campaign } from '../store/types';

/**
 * SessionManager logic service.
 * Handles complex state transitions for the Session module.
 */
export class SessionManager {
    /**
     * Activates a campaign and sets the initial UI view.
     */
    static setActiveCampaign(set: any, get: any, id: string | null) {
        const state = get() as SessionOSStore;
        set({
            activeCampaignId: id,
            currentView: 'cockpit',
            selectedSessionId: null,
            selectedAtlasMapId: null,
            selectedDeckId: null,
        });

        if (id) {
            const campaign = state.campaigns.find((c) => c.id === id);
            useJournalStore.getState().stopJournal();
            useJournalStore.getState().addEvent({
                type: 'SYSTEM',
                title: 'Campagne activée',
                content: `La campagne "${campaign?.name || id}" est maintenant active.`,
            });
        }
    }

    /**
     * Launches a session, updating statuses and starting the Journal.
     */
    static launchSession(set: any, get: any, sessionId: string) {
        const { sessions, campaigns } = get() as SessionOSStore;
        const session = sessions.find((s: GameSession) => s.id === sessionId);
        if (!session) return;

        // 1. Update session statuses
        const updatedSessions = sessions.map(s => {
            if (s.campaignId === session.campaignId) {
                if (s.id === sessionId) return { ...s, status: 'active' as const };
                if (s.status === 'active') return { ...s, status: 'done' as const };
            }
            return s;
        });

        // 2. Update campaign's active session
        const updatedCampaigns = campaigns.map(c => {
            if (c.id === session.campaignId) {
                return { ...c, activeSessionId: sessionId };
            }
            return c;
        });

        // 3. Init Journal OS
        useJournalStore.getState().startJournal(
            session.campaignId,
            `Session #${session.number}`,
            { publicSummary: session.publicSummary }
        );

        set({
            sessions: updatedSessions,
            campaigns: updatedCampaigns,
            currentView: 'cockpit',
            selectedDeckId: null
        });

        gmToast(`Session #${session.number} lancée.`, 'success');
    }

    /**
     * Performs a cascade delete of a campaign and its related data.
     */
    static deleteCampaign(set: any, get: any, id: string) {
        const state = get() as SessionOSStore;
        const campaign = state.campaigns.find((c: Campaign) => c.id === id);
        if (!campaign) return;

        set((state: SessionOSStore) => ({
            campaigns: state.campaigns.filter((c) => c.id !== id),
            activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
            
            entities: state.entities.filter(e => e.campaignId !== id),
            sessions: state.sessions.filter(s => s.campaignId !== id),
            atlasMaps: state.atlasMaps.filter(m => m.campaignId !== id),
            wikiEntries: state.wikiEntries.filter(w => w.campaignId !== id),
            timelineEvents: state.timelineEvents.filter(t => t.campaignId !== id),
            clues: state.clues.filter(c => c.campaignId !== id),
            
            players: state.players.map(p => ({
                ...p,
                characters: p.characters.map(c => 
                    c.campaignId === id ? { ...c, campaignId: null } : c
                )
            }))
        }));

        useMediaStore.getState().removeCampaignReference(id);
        gmToast(`Campagne "${campaign.name}" supprimée avec succès.`, 'info');
    }

    /**
     * Atomic navigation helpers
     */
    static navigateToAtlasMap(set: any, get: any, id: string) {
        set({ selectedAtlasMapId: id, currentView: 'world-atlas' });
        const map = (get() as SessionOSStore).atlasMaps.find(m => m.id === id);
        if (map) {
            useJournalStore.getState().addEvent({
                type: 'LOCATION',
                title: `📍 Navigation: ${map.name}`,
                content: map.narrativeDescription || `Le groupe se déplace vers ${map.name}.`,
            });
        }
    }
}
