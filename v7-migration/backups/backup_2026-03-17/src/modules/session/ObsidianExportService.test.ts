import { describe, it, expect, vi, beforeEach } from 'vitest';
import { obsidianExportService } from './ObsidianExportService';
import type { Campaign, Entity } from './useSessionOSStore';

describe('ObsidianExportService', () => {
    beforeEach(() => {
        // Mock window.appBridge
        (window as any).appBridge = {
            obsidian: {
                writeNote: vi.fn().mockResolvedValue(true),
                ensureDirectory: vi.fn().mockResolvedValue(true),
            },
        };
    });

    const mockCampaign: Campaign = {
        id: 'c-1',
        name: 'Test Campaign',
        system: 'medieval',
        description: 'A test campaign',
        synopsis: 'A brave test synopsis',
        notes: 'Session notes here',
        activeLocationIds: [],
    };

    const mockEntities: Entity[] = [
        {
            id: 'e-1',
            name: 'John Doe',
            type: 'npc',
            role: 'ally',
            status: 'alive',
            avatar: '',
            hp: 10,
            maxHp: 10,
            ac: 10,
            speed: 30,
            initiative: 0,
            description: 'Human Warrior',
            roleplayingNotes: 'Talks a lot',
            gmSecretInfo: 'Secret spy',
            linkedMapIds: [],
            campaignId: 'c-1',
        }
    ];

    it('should format and write notes correctly', async () => {
        const result = await obsidianExportService.exportCampaign(
            mockCampaign,
            mockEntities,
            [],
            []
        );

        expect(result.success).toBe(true);
        expect(window.appBridge?.obsidian?.writeNote).toHaveBeenCalled();
        
        // Verify campaign note content
        const [path, content] = (window.appBridge?.obsidian?.writeNote as unknown as { mock: { calls: string[][] } }).mock.calls[0];
        expect(path).toBe('Test Campaign/Scenario.md');
        expect(content).toContain('# Test Campaign');
        expect(content).toContain('A brave test synopsis');
    });

    it('should place NPCs in the correct folder', async () => {
        await obsidianExportService.exportCampaign(
            mockCampaign,
            mockEntities,
            [],
            []
        );

        const npcCall = (window.appBridge?.obsidian?.writeNote as unknown as { mock: { calls: string[][] } }).mock.calls.find(
            (call: string[]) => call[0].includes('PNJs/John Doe.md')
        );
        expect(npcCall).toBeTruthy();
        if (npcCall) {
            expect(npcCall[1]).toContain('role: ally');
        }
    });

    it('should sanitize file names', async () => {
        const campaignWithBadName = { ...mockCampaign, name: 'Bad:Name/Campaign?' };
        await obsidianExportService.exportCampaign(
            campaignWithBadName,
            [],
            [],
            []
        );

        const call = (window.appBridge?.obsidian?.writeNote as unknown as { mock: { calls: string[][] } }).mock.calls[0];
        expect(call[0]).toBe('BadNameCampaign/Scenario.md');
    });
});
