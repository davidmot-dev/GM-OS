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

    /**
     * **Ce test affirmait l'inverse jusqu'au 2026-08-15** : `// Updated system`.
     * Il codifiait le défaut plutôt que la règle.
     *
     * Enrichir « Agents de Dune » avec le sélecteur de la Forge resté sur Alien
     * réécrivait le jeu de la campagne — donc le pilote de tous ses PNJ
     * (`piloteDuPersonnage`, troisième source), leurs jets, leur modèle de santé.
     * Sans un mot. Le pilote choisi dans la Forge sert à *produire* ; il n'a
     * jamais eu vocation à rebaptiser une campagne déclarée.
     */
    it('ne réécrit pas le jeu d\'une campagne existante', () => {
        mockState.campaigns = [
            { id: 'c-123', name: 'Existing Campaign', system: 'dune', activeLocationIds: [] }
        ];

        handleAddChronicle(mockSet as unknown as Parameters<typeof handleAddChronicle>[0], mockGet as unknown as () => SessionOSStore, {
            campaign: { name: 'Existing Campaign', system: 'alien' } as unknown as Parameters<typeof handleAddChronicle>[2]['campaign'],
            entities: [{ name: 'Dragon', type: 'npc', hp: 100, maxHp: 100, status: 'alive' }] as unknown as Parameters<typeof handleAddChronicle>[2]['entities'],
            atlasMaps: [],
            wikiEntries: [],
        });

        expect(mockState.campaigns.length).toBe(1);
        expect(mockState.campaigns[0].system, 'la campagne garde son jeu').toBe('dune');
        expect(mockState.entities.length).toBe(1);
        expect(mockState.entities[0].campaignId).toBe('c-123');
        expect(gmToast).toHaveBeenCalledWith(expect.stringContaining('fusionnée avec "Existing Campaign"'), 'success');
        // La divergence se dit : elle signale presque toujours un sélecteur oublié.
        expect(gmToast).toHaveBeenCalledWith(expect.stringContaining('reste sur son jeu'), 'warning');
    });

    it('adopte le jeu de la Forge quand la campagne n\'en déclarait aucun', () => {
        // Une campagne orpheline rattachée à un jeu est un gain ; une campagne
        // déclarée qu'on rebaptise est une perte. Les deux cas ne se traitent pas
        // pareil, et c'est la seule asymétrie que ce correctif introduit.
        mockState.campaigns = [
            { id: 'c-456', name: 'Orpheline', system: '', activeLocationIds: [] }
        ];

        handleAddChronicle(mockSet as unknown as Parameters<typeof handleAddChronicle>[0], mockGet as unknown as () => SessionOSStore, {
            campaign: { name: 'Orpheline', system: 'alien' } as unknown as Parameters<typeof handleAddChronicle>[2]['campaign'],
            entities: [],
            atlasMaps: [],
            wikiEntries: [],
        });

        expect(mockState.campaigns[0].system).toBe('alien');
        expect(gmToast).not.toHaveBeenCalledWith(expect.stringContaining('reste sur son jeu'), 'warning');
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
