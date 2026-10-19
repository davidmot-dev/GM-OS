import { describe, it, expect } from 'vitest';
import { effacerLeParcours, rejouerLaCampagne } from './rejouerLaCampagne';
import type { NexusCampaignState } from './nexus.types';

/**
 * **Rejouer une campagne** — lot E4 du chantier des archives, 2026-10-19. La
 * préparation et les personnages restent ; les séances, les journaux et le
 * parcours partent ; les réserves de table reviennent au départ.
 */
const C = 'camp-br';
const ETAT = {
    campaign: { id: C, name: 'Blade Runner', system: 'br', activeLocationIds: [], activeSessionId: 'sess-1', clotureeLe: 1700000000000 },
    entities: [{ id: 'npc-1', campaignId: C, name: 'Deckard', relations: [] }],
    players: [{ id: 'joueur-1', name: 'Alice', characters: [{ id: 'pj-1', campaignId: C, name: 'K', sheetData: { force: 3 } }] }],
    sessions: [{ id: 'sess-1', campaignId: C }],
    atlasMaps: [{ id: 'map-1', campaignId: C }],
    wikiEntries: [{ id: 'wiki-1', campaignId: C }],
    timelineEvents: [
        { id: 'te-prep', campaignId: C, type: 'lore', title: 'La grande panne' },
        { id: 'te-joue', campaignId: C, type: 'combat', sessionId: 'sess-1', title: 'Course-poursuite' },
        { id: 'te-seance', campaignId: C, type: 'session', title: 'Séance 1' },
    ],
    clues: [{ id: 'clue-1', campaignId: C, title: 'La licorne', isRevealed: true, revealedAt: 1700000000000 }],
    actes: [{ id: 'acte-1', campaignId: C, titre: 'Acte I', acheve: true }],
    scenes: [{
        id: 'scene-1', campaignId: C, acteId: 'acte-1', titre: 'Le toit', entiteIds: ['npc-1'], indiceIds: ['clue-1'],
        enchainements: [{ vers: 'scene-2' }], passages: [{ debut: 1, fin: 2, seanceId: 'sess-1' }],
        termineeLe: 1700000000000, ecarteeDeLaChronique: true, momentDeStoryboardId: 'moment-1',
    }, { id: 'scene-2', campaignId: C, acteId: 'acte-1', titre: 'La ferme', entiteIds: [], indiceIds: [] }],
    rencontres: [{ id: 'renc-1', campaignId: C, sceneId: 'scene-1' }],
    journaux: [{ id: 'jour-1', campaignId: C, sessionId: 'sess-1' }],
    deckManifests: [],
    deckSessionStates: [{ deckId: 'deck-1', remainingIndices: [2], discardedIndices: [], currentCardIndex: 1 }],
    moments: [{ id: 'moment-1', campaignId: C, name: 'Pluie' }],
    combatsGares: { 'scene-1': { combatants: [{ id: 'cb-1', sourceId: 'npc-1' }], round: 1, currentTurnIdx: 0 } },
    favoris: [{ id: 'fav-1', campaignId: C, entityId: 'npc-1' }],
    messages: [{ id: 'msg-1', campaignId: C, content: 'Je suis un réplicant ?' }],
    lootPool: [{ id: 'loot-1', campaignId: C, name: 'Licorne en origami' }],
    lootHistory: [{ id: 'lh-1', campaignId: C }],
    reservesDeTable: { traque: 4 },
} as unknown as NexusCampaignState;

describe('effacer le parcours', () => {
    const r = effacerLeParcours(ETAT);

    it('les séances, les journaux, les messages et l’historique du butin partent', () => {
        expect(r.sessions).toEqual([]);
        expect(r.journaux).toEqual([]);
        expect(r.messages).toEqual([]);
        expect(r.lootHistory).toEqual([]);
        expect(r.campaign.activeSessionId).toBeUndefined();
        expect(r.campaign.clotureeLe).toBeUndefined();
    });

    it('la trame est rendue vierge : ni passage, ni scène terminée, ni acte achevé', () => {
        expect(r.scenes![0]).not.toHaveProperty('passages');
        expect(r.scenes![0]).not.toHaveProperty('termineeLe');
        expect(r.scenes![0]).not.toHaveProperty('ecarteeDeLaChronique');
        expect(r.actes![0]).not.toHaveProperty('acheve');
    });

    it('la préparation reste : enchaînements, PNJ, indices (cachés à nouveau), storyboard, combats préparés, butin', () => {
        expect(r.scenes![0]).toMatchObject({ enchainements: [{ vers: 'scene-2' }], entiteIds: ['npc-1'], indiceIds: ['clue-1'], momentDeStoryboardId: 'moment-1' });
        expect(r.clues[0]).toMatchObject({ id: 'clue-1', isRevealed: false });
        expect(r.clues[0]).not.toHaveProperty('revealedAt');
        expect(r.moments).toEqual(ETAT.moments);
        expect(r.combatsGares).toEqual(ETAT.combatsGares);
        expect(r.lootPool).toEqual(ETAT.lootPool);
        expect(r.rencontres).toEqual(ETAT.rencontres);
    });

    it('la chronologie garde ce qui est préparé, et perd ce qu’une séance a écrit', () => {
        expect(r.timelineEvents.map(e => e.id)).toEqual(['te-prep']);
    });

    it('les personnages restent tels quels', () => {
        expect(r.players).toEqual(ETAT.players);
    });

    it('les réserves de table reviennent au départ : un état vide, et non absent', () => {
        expect(r.reservesDeTable).toEqual({});
    });

    it('une archive ancienne sans journaux ni messages n’en reçoit pas', () => {
        const ancienne = effacerLeParcours({ ...ETAT, journaux: undefined, messages: undefined, lootHistory: undefined });
        expect(ancienne.journaux).toBeUndefined();
        expect(ancienne.messages).toBeUndefined();
        expect(ancienne.lootHistory).toBeUndefined();
    });
});

describe('rejouer la campagne', () => {
    let n = 0;
    const neuf = (p: string) => `${p}-neuf-${++n}`;

    it('une copie, au parcours effacé, qui ne désigne plus l’original', () => {
        const r = rejouerLaCampagne(ETAT, { nouvelId: neuf });
        expect(r.campaign.id).not.toBe(C);
        expect(r.campaign.name).toBe('Blade Runner');
        expect(r.scenes![0].enchainements![0].vers).toBe(r.scenes![1].id);
        expect(r.players[0].characters[0].id).not.toBe('pj-1');
        expect(r.players[0].characters[0]).toMatchObject({ campaignId: r.campaign.id, sheetData: { force: 3 } });
        expect(r.sessions).toEqual([]);
        expect(JSON.stringify(r)).not.toContain(`"${C}"`);
    });

    it('si l’original est sur ce poste, la copie s’appelle « (Nouvelle partie) »', () => {
        expect(rejouerLaCampagne(ETAT, { existeDeja: true, nouvelId: neuf }).campaign.name).toBe('Blade Runner (Nouvelle partie)');
    });

    it('l’original n’est pas modifié', () => {
        rejouerLaCampagne(ETAT, { nouvelId: neuf });
        expect(ETAT.sessions).toHaveLength(1);
        expect(ETAT.scenes![0].passages).toHaveLength(1);
        expect(ETAT.clues[0].isRevealed).toBe(true);
    });
});
