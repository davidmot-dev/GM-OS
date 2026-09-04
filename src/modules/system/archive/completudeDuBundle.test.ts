import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Ce qu'une archive emporte, et ce qu'elle repose.**
 *
 * Les quatre défauts du § 12b, corrigés le 2026-09-04. Chacun se vérifie ici en
 * faisant l'aller **et** le retour : c'est la seule façon de les voir, et c'est
 * pourquoi ils ont vécu si longtemps.
 */

const CAMPAGNE = 'camp-1';

const etat = {
    campaigns: [{ id: CAMPAGNE, name: 'Le secret de Milo', system: 'cyberpunk-perso' }],
    entities: [], players: [], sessions: [], atlasMaps: [], wikiEntries: [], timelineEvents: [],
    clues: [],
    actes: [
        { id: 'a1', campaignId: CAMPAGNE, ordre: 1, titre: 'Acte I', resume: '' },
        { id: 'a2', campaignId: 'camp-autre', ordre: 1, titre: "D'ailleurs", resume: '' },
    ],
    scenes: [
        { id: 's1', campaignId: CAMPAGNE, acteId: 'a1', ordre: 1, titre: 'La ruelle' },
        { id: 's2', campaignId: 'camp-autre', acteId: 'a2', ordre: 1, titre: 'Ailleurs' },
    ],
    decks: [{ id: 'd1', systemId: 'cyberpunk-perso', name: 'Complications' }],
    deckStates: { d1: { deckId: 'd1', tirees: [] } },
    customGameDrivers: [{ id: 'cyberpunk-perso', name: 'Cyberpunk maison' }],
    customSheetTemplates: [{ id: 'tpl-1', name: 'Fiche maison' }],
    getActiveDriver: () => null,
};

vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: { getState: () => etat, setState: vi.fn() },
}));
vi.mock('../../sound/useSoundStore', () => ({ useSoundStore: { getState: () => ({ atmospheres: [] }) } }));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: { getState: () => ({ playlists: [] }) } }));
vi.mock('../../../stores/useMediaStore', () => ({ useMediaStore: { getState: () => ({}) } }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

const { nexusService } = await import('./NexusService');

beforeEach(() => vi.clearAllMocks());

describe("la trame entre dans l'archive", () => {
    it('emporte les actes et les scènes de CETTE campagne, et pas des autres', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);

        expect(paquet.actes?.map(a => a.id)).toEqual(['a1']);
        expect(paquet.scenes?.map(s => s.id)).toEqual(['s1']);
    });
});

describe('le clonage refait les liens de la trame', () => {
    it("donne aux scènes l'identifiant du NOUVEL acte, jamais de l'ancien", () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        const clone = nexusService.applyResolutionToState(paquet, { strategy: 'clone' });

        const acte = clone.actes?.[0];
        const scene = clone.scenes?.[0];

        expect(acte?.id).not.toBe('a1');
        expect(scene?.acteId).toBe(acte?.id);
        expect(scene?.campaignId).toBe(clone.campaign.id);
        /*
          Sans ce dernier contrôle, les scènes de la copie désigneraient les
          actes de l'original : deux campagnes se partageraient une trame, et
          modifier l'une déplacerait l'autre.
        */
        expect(scene?.acteId).not.toBe('a1');
    });

    it('ne touche pas à la trame quand on remplace au lieu de cloner', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        const tel_quel = nexusService.applyResolutionToState(paquet, { strategy: 'replace' });

        expect(tel_quel.actes?.[0].id).toBe('a1');
    });
});

describe("ce que l'archive emporte pour Deck-OS et le pilote", () => {
    it('prend les paquets du système de la campagne', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        expect(paquet.deckManifests.map(d => d.id)).toEqual(['d1']);
        expect(paquet.deckSessionStates).toHaveLength(1);
    });

    it('prend le pilote personnalisé et son gabarit', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        expect(paquet.requiredDriverData?.map(d => d.id)).toEqual(['cyberpunk-perso']);
    });
});
