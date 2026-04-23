import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from './SessionManager';

// Mocks
vi.mock('../../journal/useJournalStore', () => ({
    useJournalStore: {
        getState: () => ({
            stopJournal: vi.fn(),
            startJournal: vi.fn(),
            addEvent: vi.fn(),
        }),
    },
}));

vi.mock('../../../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: () => ({
            removeCampaignReference: vi.fn(),
        }),
    },
}));

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn(),
}));

describe('SessionManager', () => {
    let mockSet: any;
    let mockGet: any;

    beforeEach(() => {
        mockSet = vi.fn();
        mockGet = vi.fn(() => ({
            campaigns: [{ id: 'c1', name: 'Campaign 1' }],
            sessions: [{ id: 's1', campaignId: 'c1', number: 1, publicSummary: 'Test', status: 'planned' }],
            entities: [{ id: 'e1', campaignId: 'c1' }],
            players: [],
            atlasMaps: [],
            wikiEntries: [],
            timelineEvents: [],
            clues: []
        }));
    });

    it('should set active campaign correctly', () => {
        SessionManager.setActiveCampaign(mockSet, mockGet, 'c1');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            activeCampaignId: 'c1',
            currentView: 'cockpit'
        }));
    });

    it('should launch a session correctly', () => {
        SessionManager.launchSession(mockSet, mockGet, 's1');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            currentView: 'cockpit'
        }));
        
        // Check if session status was updated
        const callArgs = mockSet.mock.calls[0][0];
        expect(callArgs.sessions[0].status).toBe('active');
    });

    it('should delete campaign and related data (cascade)', () => {
        SessionManager.deleteCampaign(mockSet, mockGet, 'c1');
        
        // We need to check the function passed to set
        const setUpdateFn = mockSet.mock.calls[0][0];
        const result = setUpdateFn(mockGet());
        
        expect(result.campaigns).toHaveLength(0);
        expect(result.entities).toHaveLength(0);
    });
});
