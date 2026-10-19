import { describe, it, expect } from 'vitest';
import { recenserLArchive, enUneLigne } from './recensementDeLArchive';
import type { NexusCampaignState } from './nexus.types';

/** L'aperçu et le bilan d'un import comptent avec la même liste — lot E6, 2026-10-19. */
describe('recenser une archive de campagne', () => {
    const etat = {
        campaign: { id: 'c1', name: 'Blade Runner' },
        entities: [{ id: 'n1' }, { id: 'n2' }],
        players: [{ id: 'j1', characters: [{ id: 'p1', campaignId: 'c1' }, { id: 'p2', campaignId: 'ailleurs' }] }],
        atlasMaps: [], wikiEntries: [], timelineEvents: [], clues: [{ id: 'i1' }], sessions: [],
        scenes: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        combatsGares: { s1: {} },
        deckManifests: [], deckSessionStates: [],
    } as unknown as NexusCampaignState;

    it('compte chaque famille, et seulement les personnages de CETTE campagne', () => {
        expect(recenserLArchive(etat)).toEqual([
            { libelle: 'PNJ', nombre: 2 },
            { libelle: 'personnages', nombre: 1 },
            { libelle: 'scènes', nombre: 3 },
            { libelle: 'indices', nombre: 1 },
            { libelle: 'combats préparés', nombre: 1 },
        ]);
    });

    it('ce qui vaut zéro ou manque n’est pas listé — une archive ancienne ne paraît rien perdre', () => {
        const libelles = recenserLArchive(etat).map(l => l.libelle);
        expect(libelles).not.toContain('tuiles de lumière');
        expect(libelles).not.toContain('séances');
    });

    it('en une ligne, pour le bilan et le journal', () => {
        expect(enUneLigne(recenserLArchive(etat))).toBe('2 PNJ · 1 personnages · 3 scènes · 1 indices · 1 combats préparés');
        expect(enUneLigne([])).toBe('rien');
    });
});
