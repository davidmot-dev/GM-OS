import { describe, it, expect, vi, beforeEach } from 'vitest';
import { obsidianExportService } from './ObsidianExportService';
import { useObsidianStore } from './useObsidianStore';
import type { Campaign, Entity } from './useSessionOSStore';

describe('ObsidianExportService', () => {
    beforeEach(() => {
        // Mock window.appBridge
        (window as unknown as { appBridge: unknown }).appBridge = {
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

/**
 * **Le coffre choisi est celui où l'on écrit.**
 *
 * Le défaut : `vaultPath` était facultatif sur les deux exports et **aucun des
 * deux appelants ne le passait**. Tout retombait sur le `DEFAULT_VAULT_PATH`
 * écrit en dur dans la passerelle — chez David les deux coïncident, donc rien
 * ne se voyait, et un changement de coffre aurait écrit dans l'ancien en
 * annonçant une réussite.
 *
 * *Un argument facultatif que personne ne passe est un argument qui n'existe
 * pas.* On l'éprouve **des deux côtés** : la campagne et les règles avaient
 * l'oubli chacune de son côté.
 */
describe('le coffre où l’export écrit', () => {
    const appels = () =>
        (window.appBridge?.obsidian?.writeNote as unknown as { mock: { calls: unknown[][] } }).mock.calls;

    beforeEach(() => {
        (window as unknown as { appBridge: unknown }).appBridge = {
            obsidian: {
                writeNote: vi.fn().mockResolvedValue(true),
                ensureDirectory: vi.fn().mockResolvedValue(true),
                vaultExists: vi.fn().mockResolvedValue(true),
            },
        };
        useObsidianStore.setState({ vaultPath: 'D:\\Coffre choisi' });
    });

    const campagne: Campaign = {
        id: 'c-1', name: 'Hadley Hope', system: 'alien', description: '',
        synopsis: '', notes: '', activeLocationIds: [],
    };

    it('l’export de campagne prend le coffre du magasin, pas le chemin en dur', async () => {
        await obsidianExportService.exportCampaign(campagne, [], [], []);
        expect(appels()[0][2]).toBe('D:\\Coffre choisi');
    });

    it('l’export de règle aussi — l’oubli était des deux côtés', async () => {
        await obsidianExportService.exportRule('Le Quart', 'Seuil à trois.');
        expect(appels()[0][2]).toBe('D:\\Coffre choisi');
    });

    it('un chemin passé explicitement l’emporte sur le magasin', async () => {
        await obsidianExportService.exportCampaign(campagne, [], [], [], 'E:\\Autre coffre');
        expect(appels()[0][2]).toBe('E:\\Autre coffre');
    });

    /**
     * `writeNote` appelle `ensureDir` : sans cette porte, un mauvais chemin ne
     * lève pas — il fabrique une arborescence vide ailleurs sur le disque et
     * l'export s'annonce réussi. *C'est ce qui rendait le correctif
     * invérifiable.*
     */
    it('refuse d’écrire dans un coffre introuvable, et le dit', async () => {
        (window.appBridge!.obsidian!.vaultExists as unknown as { mockResolvedValue: (v: boolean) => void })
            .mockResolvedValue(false);

        const verdict = await obsidianExportService.exportCampaign(campagne, [], [], []);

        expect(verdict.success).toBe(false);
        expect(verdict.message).toContain('introuvable');
        expect(appels(), 'rien n’a été écrit').toHaveLength(0);
    });

    /** Navigateur, test : sans vérificateur on laisse passer — refuser sur une absence d'information bloquerait plus qu'elle ne protège. */
    it('n’exige pas le vérificateur quand la passerelle ne l’offre pas', async () => {
        (window as unknown as { appBridge: unknown }).appBridge = {
            obsidian: { writeNote: vi.fn().mockResolvedValue(true), ensureDirectory: vi.fn() },
        };
        expect((await obsidianExportService.exportCampaign(campagne, [], [], [])).success).toBe(true);
    });
});

/**
 * **Seulement la campagne exportée** — lot E0 du chantier des archives, 2026-10-19 :
 * exporter Blade Runner versait aussi dans son dossier les PNJ, lieux et entrées
 * du wiki de Nephilim.
 */
describe('l’export ne prend que la campagne exportée', () => {
    beforeEach(() => {
        (window as unknown as { appBridge: unknown }).appBridge = {
            obsidian: { writeNote: vi.fn().mockResolvedValue(true), ensureDirectory: vi.fn() },
        };
    });

    it('les PNJ, lieux et entrées du wiki d’une autre campagne restent dehors', async () => {
        const blade = { id: 'c-blade', name: 'Blade Runner', system: 'br', description: '', activeLocationIds: [] } as unknown as Campaign;
        const pnj = (id: string, name: string, campaignId: string) => ({ id, name, type: 'npc', role: 'neutral', campaignId }) as unknown as Entity;
        const lieu = (id: string, name: string, campaignId: string) => ({ id, name, type: 'city', campaignId }) as never;
        const wiki = (id: string, title: string, campaignId: string) => ({ id, title, category: 'Lore', content: '', campaignId }) as never;
        await obsidianExportService.exportCampaign(
            blade,
            [pnj('e-1', 'Deckard', 'c-blade'), pnj('e-2', 'Aurore Delisle', 'c-neph')],
            [lieu('m-1', 'Los Angeles', 'c-blade'), lieu('m-2', 'Atlantide', 'c-neph')],
            [wiki('w-1', 'Tyrell', 'c-blade'), wiki('w-2', 'Les Vécus', 'c-neph')],
        );
        const chemins = (window.appBridge?.obsidian?.writeNote as unknown as { mock: { calls: string[][] } }).mock.calls.map(c => c[0]);
        expect(chemins).toEqual([
            'Blade Runner/Scenario.md',
            'Blade Runner/PNJs/Deckard.md',
            'Blade Runner/Lieux/Los Angeles.md',
            'Blade Runner/Lore/Lore/Tyrell.md',
        ]);
    });
});
