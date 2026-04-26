import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAddChronicle } from './crossDomainHelpers';
import type { SessionOSStore } from '../store/index';
import { gmToast } from '../../../stores/useToastStore';

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn(),
}));

describe('handleAddChronicle (crossDomainHelpers.ts)', () => {
    let mockState: SessionOSStore;
    let mockSet: ReturnType<typeof vi.fn>;
    let mockGet: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockState = {
            campaigns: [],
            entities: [],
            atlasMaps: [],
            wikiEntries: [],
            activeCampaignId: null,
            currentView: '',
        } as unknown as SessionOSStore;
        mockSet = vi.fn((updateFn: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => {
            const updates = typeof updateFn === 'function' ? updateFn(mockState) : updateFn;
            mockState = { ...mockState, ...updates } as SessionOSStore;
        });
        mockGet = vi.fn(() => mockState);
    });

    it('adds a new campaign when it does not exist', () => {
        handleAddChronicle(mockSet as unknown as Parameters<typeof handleAddChronicle>[0], mockGet as unknown as () => SessionOSStore, {
            campaign: { name: 'Test Campaign', system: 'D&D' } as unknown as Parameters<typeof handleAddChronicle>[2]['campaign'],
            entities: [{ name: 'Goblin', role: 'monster', hp: 10, maxHp: 10, type: 'npc', status: 'alive' }] as unknown as Parameters<typeof handleAddChronicle>[2]['entities'],
            atlasMaps: [],
            wikiEntries: [],
        });

        expect(mockSet).toHaveBeenCalled();
        expect(mockState.campaigns.length).toBe(1);
        expect(mockState.campaigns[0].name).toBe('Test Campaign');
        expect(mockState.entities.length).toBe(1);
        expect(mockState.entities[0].name).toBe('Goblin');
        expect(mockState.activeCampaignId).toBe(mockState.campaigns[0].id);
        expect(mockState.currentView).toBe('cockpit');
        expect(gmToast).toHaveBeenCalledWith(expect.stringContaining('importée avec 1 entités'), 'success');
    });

    it('merges with an existing campaign if name matches', () => {
        mockState.campaigns = [
            { id: 'c-123', name: 'Existing Campaign', system: 'D&D', activeLocationIds: [] }
        ];

        handleAddChronicle(mockSet as unknown as Parameters<typeof handleAddChronicle>[0], mockGet as unknown as () => SessionOSStore, {
            campaign: { name: 'Existing Campaign', system: 'Custom' } as unknown as Parameters<typeof handleAddChronicle>[2]['campaign'],
            entities: [{ name: 'Dragon', type: 'npc', hp: 100, maxHp: 100, status: 'alive' }] as unknown as Parameters<typeof handleAddChronicle>[2]['entities'],
            atlasMaps: [],
            wikiEntries: [],
        });

        expect(mockState.campaigns.length).toBe(1); // Still 1 campaign
        expect(mockState.campaigns[0].system).toBe('Custom'); // Updated system
        expect(mockState.entities.length).toBe(1);
        expect(mockState.entities[0].campaignId).toBe('c-123'); // Maps to existing ID
        expect(gmToast).toHaveBeenCalledWith(expect.stringContaining('fusionnée avec "Existing Campaign"'), 'success');
    });

    it('correctly maps entity relations', () => {
        handleAddChronicle(mockSet as unknown as Parameters<typeof handleAddChronicle>[0], mockGet as unknown as () => SessionOSStore, {
            campaign: { name: 'Relational', system: 'D&D' } as unknown as Parameters<typeof handleAddChronicle>[2]['campaign'],
            entities: [
                { name: 'Alice', type: 'npc', hp: 10, maxHp: 10, status: 'alive', relations: [{ targetName: 'Bob', type: 'friend', description: 'friend' }] },
                { name: 'Bob', type: 'npc', hp: 10, maxHp: 10, status: 'alive' }
            ] as unknown as Parameters<typeof handleAddChronicle>[2]['entities'],
            atlasMaps: [],
            wikiEntries: [],
        });

        expect(mockState.entities.length).toBe(2);
        
        const alice = mockState.entities.find((e) => e.name === 'Alice')!;
        const bob = mockState.entities.find((e) => e.name === 'Bob')!;
        
        expect(alice).toBeDefined();
        expect(bob).toBeDefined();
        expect(alice.relations!.length).toBe(1);
        expect(alice.relations![0].targetId).toBe(bob.id);
        expect(alice.relations![0].type).toBe('friend');
    });
});
