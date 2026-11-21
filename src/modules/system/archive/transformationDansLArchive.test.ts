import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NexusCampaignState } from './nexus.types';

/**
 * § 268, T9 (21/11/2026) — **un personnage transformé part dans l'archive
 * `.gmos` avec sa réserve, et en revient.** David : « je voudrais pouvoir
 * transformer un PNJ en Personnage Joueur, et vice-versa » ; décision Q3 :
 * ce qui n'a pas d'équivalent est « gardé en réserve ». Une réserve perdue à
 * l'export rendrait l'aller-retour faux sans un mot.
 */

const CAMPAGNE = 'camp-1';

const anciennePj = {
    id: 'pc-rachel', name: 'Rachel', type: 'npc', role: 'hostile', status: 'alive', avatar: 'media:rachel',
    hp: 8, maxHp: 10, ac: 0, speed: 0, initiative: 0, description: '', roleplayingNotes: '', gmSecretInfo: '',
    linkedMapIds: [], campaignId: CAMPAGNE, templateId: 'tpl-1', sheetData: { force: 2 },
    reserveDeTransformation: { pj: { ficheId: 'fiche-42', playerNotes: 'Mes souvenirs', inventoryItems: [{ id: 'i1', name: 'Blaster' }] } },
};
const ancienPnj = {
    id: 'e-marta', name: 'Marta', portraitUrl: 'media:marta', campaignId: CAMPAGNE, templateId: 'tpl-1', sheetData: {},
    reserveDeTransformation: { pnj: { role: 'ally', voiceProfile: { pitch: 2 } } },
};

const etat = {
    campaigns: [{ id: CAMPAGNE, name: 'Les pluies', system: 'jeu-maison' }],
    entities: [anciennePj],
    players: [{ id: 'j-ana', realName: 'Ana', avatarUrl: '', isOnline: true, characters: [ancienPnj] }],
    sessions: [], atlasMaps: [], wikiEntries: [], timelineEvents: [], clues: [], actes: [], scenes: [],
    decks: [], deckStates: {}, customGameDrivers: [{ id: 'jeu-maison', name: 'Jeu maison' }],
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
vi.mock('../../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ journals: [] }), setState: vi.fn() },
}));

const { nexusService } = await import('./NexusService');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');

beforeEach(() => vi.clearAllMocks());

describe('la réserve de transformation dans l’archive', () => {
    it('l’export emporte la réserve d’un PNJ qui fut PJ, et celle d’un PJ qui fut PNJ', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        expect(paquet.entities.find(e => e.id === 'pc-rachel')?.reserveDeTransformation).toEqual(anciennePj.reserveDeTransformation);
        expect(paquet.players[0].characters[0].reserveDeTransformation).toEqual(ancienPnj.reserveDeTransformation);
    });

    it('l’import la repose telle quelle', () => {
        const paquet = JSON.parse(JSON.stringify(nexusService.scrapeCampaignData(CAMPAGNE))) as NexusCampaignState;
        (nexusService as unknown as { injectState: (s: NexusCampaignState) => void }).injectState(paquet);
        const miseAJour = vi.mocked(useSessionOSStore.setState).mock.calls[0]?.[0] as { entities?: typeof etat.entities; players?: typeof etat.players };
        expect(miseAJour.entities?.find(e => e.id === 'pc-rachel')?.reserveDeTransformation).toEqual(anciennePj.reserveDeTransformation);
        expect(miseAJour.players?.[0].characters[0].reserveDeTransformation).toEqual(ancienPnj.reserveDeTransformation);
    });
});
