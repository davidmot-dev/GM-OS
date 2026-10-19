import { describe, it, expect } from 'vitest';
import { clonerLaCampagne, reecrireLesIdentifiants, tableDuClonage } from './clonerLaCampagne';
import type { NexusCampaignState } from './nexus.types';

/**
 * **Le clonage juste** — lot E3 du chantier des archives, 2026-10-19. Une copie
 * ne doit plus rien désigner de l'original : ni dans la trame, ni dans le graphe,
 * ni chez les personnages.
 */
const C = 'camp-orig';
const ETAT = {
    campaign: {
        id: C, name: 'Blade Runner', system: 'br', description: '', activeLocationIds: ['map-1'],
        organisationDeLaTrame: {
            positions: { 'scene-1': { x: 0, y: 0 }, 'scene-2': { x: 100, y: 0 }, 'npc-1': { x: 50, y: 80 } },
            trajets: { '["enchainement","scene-1","scene-2"]': { points: [], depart: 'droite', arrivee: 'gauche' } },
            espacement: 'equilibre',
        },
        stylesDesLiensDeTrame: { '["enchainement","scene-1","scene-2"]': { pointilles: true } },
        dispositionPrecedenteDeTrame: { positionsVivantes: { 'scene-1': { x: 1, y: 1 } }, epingles: { 'groupe:acte-1': { x: 2, y: 2 } } },
    },
    entities: [
        { id: 'npc-1', campaignId: C, name: 'Deckard', relations: [{ targetId: 'npc-2' }, { targetId: 'npc-ailleurs' }], linkedMapIds: ['map-1'] },
        { id: 'npc-2', campaignId: C, name: 'Rachael', relations: [{ targetId: 'npc-1' }] },
    ],
    relatedEntities: [{ id: 'npc-ailleurs', campaignId: 'camp-autre', name: 'Tyrell', relations: [{ targetId: 'npc-1' }] }],
    players: [{
        id: 'joueur-1', name: 'Alice',
        characters: [
            { id: 'pj-1', campaignId: C, name: 'K' },
            { id: 'pj-autre', campaignId: 'camp-autre', name: 'Autre' },
        ],
    }],
    sessions: [{ id: 'sess-1', campaignId: C, activeSceneId: 'scene-1' }],
    atlasMaps: [{ id: 'map-1', campaignId: C, name: 'Los Angeles' }],
    wikiEntries: [{ id: 'wiki-1', campaignId: C, title: 'Tyrell Corp', linkedEntityIds: ['npc-1'] }],
    timelineEvents: [{ id: 'te-1', campaignId: C, sceneId: 'scene-2' }],
    clues: [{ id: 'clue-1', campaignId: C, sceneId: 'scene-1', locationId: 'map-1' }],
    actes: [{ id: 'acte-1', campaignId: C, titre: 'Acte I' }],
    scenes: [
        {
            id: 'scene-1', campaignId: C, acteId: 'acte-1', lieuId: 'map-1', entiteIds: ['npc-1'], personnagesIds: ['pj-1'],
            indiceIds: ['clue-1'], enchainements: [{ vers: 'scene-2' }], passages: [{ debut: 1, seanceId: 'sess-1' }],
            momentDeStoryboardId: 'moment-1', battlemapIds: ['map-1'], morceauxIds: ['track-7'],
        },
        { id: 'scene-2', campaignId: C, acteId: 'acte-1', entiteIds: ['npc-2'], indiceIds: [] },
    ],
    rencontres: [{ id: 'renc-1', campaignId: C, sceneId: 'scene-2', entiteIds: ['npc-2'] }],
    journaux: [{ id: 'jour-1', campaignId: C, sessionId: 'sess-1' }],
    modulesDuJeu: { tmr: { sceneId: 'scene-1' } },
    deckManifests: [{ id: 'deck-1', systemId: 'br' }],
    deckSessionStates: [],
    playlists: [{ id: 'pl-1', campagneId: C, name: 'Pluie' }],
    atmospheres: [{ id: 'atm-1', campagneId: C, name: 'Néon' }],
} as unknown as NexusCampaignState;

let compteur = 0;
const neuf = (prefixe: string) => `${prefixe}-neuf-${++compteur}`;

/** Toutes les chaînes et toutes les clés d'une valeur, à plat. */
function toutesLesChaines(v: unknown, sortie: string[] = []): string[] {
    if (typeof v === 'string') sortie.push(v);
    else if (Array.isArray(v)) v.forEach(x => toutesLesChaines(x, sortie));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { sortie.push(k); toutesLesChaines(x, sortie); }
    return sortie;
}

describe('cloner une campagne', () => {
    const copie = clonerLaCampagne(ETAT, neuf);
    const ancienne = [...tableDuClonage(ETAT, neuf).keys()];

    it('⭐ aucun identifiant de l’original ne reste dans ce que la copie emporte — valeurs ET clés', () => {
        const emporte = { ...copie, relatedEntities: undefined, playlists: undefined, atmospheres: undefined, deckManifests: undefined };
        const restes = toutesLesChaines(emporte).filter(s => ancienne.some(id => s === id || s.includes(`"${id}"`) || s.endsWith(`:${id}`)));
        expect(restes).toEqual([]);
    });

    it('la trame pointe vers la copie : acte, lieu, PNJ, personnages, indices, enchaînements, séances, battlemaps', () => {
        const [s1, s2] = copie.scenes!;
        expect(s1.acteId).toBe(copie.actes![0].id);
        expect(s1.lieuId).toBe(copie.atlasMaps[0].id);
        expect(s1.entiteIds).toEqual([copie.entities[0].id]);
        expect(s1.personnagesIds).toEqual([copie.players[0].characters[0].id]);
        expect(s1.indiceIds).toEqual([copie.clues[0].id]);
        expect(s1.enchainements![0].vers).toBe(s2.id);
        expect(s1.passages![0].seanceId).toBe(copie.sessions[0].id);
        expect(s1.battlemapIds).toEqual([copie.atlasMaps[0].id]);
    });

    it('le graphe suit : positions, trajets et styles rangés sous les nouveaux identifiants', () => {
        const [s1, s2] = copie.scenes!;
        const organisation = copie.campaign.organisationDeLaTrame!;
        expect(Object.keys(organisation.positions).sort()).toEqual([s1.id, s2.id, copie.entities[0].id].sort());
        expect(Object.keys(organisation.trajets)).toEqual([JSON.stringify(['enchainement', s1.id, s2.id])]);
        expect(Object.keys(copie.campaign.stylesDesLiensDeTrame!)).toEqual([JSON.stringify(['enchainement', s1.id, s2.id])]);
        expect(Object.keys(copie.campaign.dispositionPrecedenteDeTrame!.epingles!)).toEqual([`groupe:${copie.actes![0].id}`]);
    });

    it('tout appartient à la nouvelle campagne, qui porte « (Copie) »', () => {
        expect(copie.campaign.name).toBe('Blade Runner (Copie)');
        for (const liste of [copie.entities, copie.sessions, copie.atlasMaps, copie.clues, copie.actes!, copie.scenes!, copie.rencontres!]) {
            for (const x of liste as { campaignId: string }[]) expect(x.campaignId).toBe(copie.campaign.id);
        }
    });

    it('les personnages de la campagne sont copiés ; ceux d’autres campagnes et le joueur restent', () => {
        const [joueur] = copie.players;
        expect(joueur.id).toBe('joueur-1');
        expect(joueur.characters[0].id).not.toBe('pj-1');
        expect(joueur.characters[0].campaignId).toBe(copie.campaign.id);
        expect(joueur.characters[1]).toMatchObject({ id: 'pj-autre', campaignId: 'camp-autre' });
    });

    it('ce qui n’est pas copié n’est pas touché : bibliothèques, PNJ d’ailleurs, morceaux, storyboard', () => {
        expect(copie.playlists).toEqual(ETAT.playlists);
        expect(copie.atmospheres).toEqual(ETAT.atmospheres);
        expect(copie.relatedEntities).toEqual(ETAT.relatedEntities);
        expect(copie.scenes![0].morceauxIds).toEqual(['track-7']);
        expect(copie.scenes![0].momentDeStoryboardId).toBe('moment-1');
        expect(copie.entities[0].relations).toContainEqual({ targetId: 'npc-ailleurs' });
    });

    it('l’original n’est pas modifié', () => {
        expect(ETAT.campaign.id).toBe(C);
        expect(ETAT.scenes![0].lieuId).toBe('map-1');
    });
});

describe('réécrire les identifiants', () => {
    it('un identifiant entier seulement : « c1 » ne touche ni « c10 » ni « abc1 »', () => {
        const table = new Map([['c1', 'X']]);
        expect(reecrireLesIdentifiants({ a: 'c1', b: 'c10', c: 'abc1', d: '["lien","c1","c10"]', c1: 1 }, table))
            .toEqual({ a: 'X', b: 'c10', c: 'abc1', d: '["lien","X","c10"]', X: 1 });
    });
});
