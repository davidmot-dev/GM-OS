import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NexusCampaignState } from './nexus.types';

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

const journaux = [
    { id: 'j1', campaignId: CAMPAGNE, events: [] },
    { id: 'j2', campaignId: 'camp-autre', events: [] },
];

vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: { getState: () => etat, setState: vi.fn() },
}));
vi.mock('../../sound/useSoundStore', () => ({ useSoundStore: { getState: () => ({ atmospheres: [] }) } }));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: { getState: () => ({ playlists: [] }) } }));
vi.mock('../../../stores/useMediaStore', () => ({ useMediaStore: { getState: () => ({}) } }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));
vi.mock('../../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ journals: journaux }), setState: vi.fn() },
}));

const { nexusService } = await import('./NexusService');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useJournalStore } = await import('../../journal/useJournalStore');

beforeEach(() => vi.clearAllMocks());

function injecter(paquet: NexusCampaignState) {
    (nexusService as unknown as { injectState: (state: NexusCampaignState) => void }).injectState(paquet);
    expect(useSessionOSStore.setState).toHaveBeenCalledTimes(1);
    const miseAJour = vi.mocked(useSessionOSStore.setState).mock.calls[0]?.[0];
    if (!miseAJour || typeof miseAJour === 'function') throw new Error('Injection objet attendue');
    return miseAJour;
}

describe('injection des archives anciennes ou récentes', () => {
    it('préserve la trame et les journaux locaux si une archive ancienne ne les déclare pas', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        delete paquet.actes;
        delete paquet.scenes;
        delete paquet.journaux;
        const miseAJour = injecter(paquet);
        expect(miseAJour).not.toHaveProperty('actes');
        expect(miseAJour).not.toHaveProperty('scenes');
        expect(useJournalStore.setState).not.toHaveBeenCalled();
    });

    it('un tableau vide efface uniquement la trame et les journaux de la campagne importée', () => {
        const miseAJour = injecter({
            ...nexusService.scrapeCampaignData(CAMPAGNE), actes: [], scenes: [], journaux: [],
        });
        expect(miseAJour.actes).toEqual([etat.actes[1]]);
        expect(miseAJour.scenes).toEqual([etat.scenes[1]]);
        expect(useJournalStore.setState).toHaveBeenCalledExactlyOnceWith({ journals: [journaux[1]] });
    });

    it('remplace la trame et les journaux ciblés sans perdre ceux des autres campagnes', () => {
        const paquet = nexusService.scrapeCampaignData(CAMPAGNE);
        const acte = { ...paquet.actes![0], id: 'a3' };
        const scene = { ...paquet.scenes![0], id: 's3', acteId: acte.id };
        const journal = { id: 'j3', campaignId: CAMPAGNE, events: [] };
        const miseAJour = injecter({ ...paquet, actes: [acte], scenes: [scene], journaux: [journal] });
        expect(miseAJour.actes).toEqual([etat.actes[1], acte]);
        expect(miseAJour.scenes).toEqual([etat.scenes[1], scene]);
        expect(useJournalStore.setState).toHaveBeenCalledExactlyOnceWith({ journals: [journaux[1], journal] });
    });
});

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
