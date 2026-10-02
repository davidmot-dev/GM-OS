import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';
import { useJournalStore } from '../../journal/useJournalStore';
import type { InventoryItem } from '../../../types/player.types';

/**
 * **Partager la monnaie, mettre les reliquats de côté** — les deux gestes de
 * Loot-OS retenus par David le 2026-09-29, réglés le 2026-10-02 : le partage
 * va aux PJ présents, une part entière chacun, le reste demeure au pool ; les
 * reliquats partent dans une réserve d'où ils reviennent.
 */

const magasin = () => useSessionOSStore.getState();

const objet = (nom: string, quantite: number, type = 'currency'): InventoryItem => ({
    id: `it-${nom}`, name: nom, type, rarity: 'common',
    weight: 0, quantity: quantite, description: '', properties: {},
});

const pj = (id: string) => ({
    id, name: id, classRace: '', portraitUrl: '', inventoryItems: [] as InventoryItem[],
    hp: 10, maxHp: 10, campaignId: 'c1', templateId: 'generic', sheetData: {},
});

const inventaire = (id: string) =>
    magasin().players.flatMap(p => p.characters).find(c => c.id === id)!.inventoryItems ?? [];

beforeEach(() => {
    useJournalStore.getState().clearJournal();
    (window as unknown as { useJournalStore?: unknown }).useJournalStore = useJournalStore;
    useSessionOSStore.setState({
        activeCampaignId: 'c1',
        players: [{ id: 'p1', realName: 'Table', avatarUrl: '', isOnline: true, characters: [pj('a'), pj('b'), pj('c')] }],
        lootPool: [], lootHistory: [], lootReserve: [],
    });
});

const trois = [
    { playerId: 'p1', characterId: 'a' },
    { playerId: 'p1', characterId: 'b' },
    { playerId: 'p1', characterId: 'c' },
];

describe('partager une monnaie', () => {
    it('chacun reçoit sa part, et le reste attend dans le pool', () => {
        magasin().addLootToPool([objet('Chinyen', 451)]);
        magasin().partagerLaMonnaie('it-Chinyen', trois);

        for (const id of ['a', 'b', 'c']) {
            expect(inventaire(id).map(i => i.quantity)).toEqual([150]);
        }
        expect(magasin().lootPool.map(i => i.quantity)).toEqual([1]);
    });

    it('rien ne se perd : les parts et le reste refont la somme', () => {
        magasin().addLootToPool([objet('Chinyen', 451)]);
        magasin().partagerLaMonnaie('it-Chinyen', trois);

        const donne = ['a', 'b', 'c'].reduce((n, id) => n + inventaire(id)[0].quantity, 0);
        const reste = magasin().lootPool.reduce((n, i) => n + i.quantity, 0);
        expect(donne + reste).toBe(451);
    });

    it('chaque part passe par la porte du don : elle est consignée', () => {
        magasin().addLootToPool([objet('Chinyen', 300)]);
        magasin().partagerLaMonnaie('it-Chinyen', trois);

        expect(magasin().lootHistory.map(e => e.recipientId).sort()).toEqual(['a', 'b', 'c']);
    });

    it('un partage où chacun recevrait zéro ne touche à rien', () => {
        magasin().addLootToPool([objet('Chinyen', 2)]);
        magasin().partagerLaMonnaie('it-Chinyen', trois);

        expect(magasin().lootPool.map(i => i.quantity)).toEqual([2]);
        expect(inventaire('a')).toEqual([]);
    });
});

describe('mettre les reliquats de côté', () => {
    it('le pool de la campagne passe dans la réserve, marqué de sa campagne', () => {
        magasin().addLootToPool([objet('Lanterne', 1, 'other'), objet('Corde', 1, 'other')]);
        magasin().archiverLesReliquats();

        expect(magasin().lootPool).toEqual([]);
        expect(magasin().lootReserve.map(i => [i.name, i.campaignId])).toEqual([['Lanterne', 'c1'], ['Corde', 'c1']]);
    });

    it('le butin d’une autre campagne reste où il est', () => {
        useSessionOSStore.setState({ lootPool: [{ ...objet('Ailleurs', 1, 'other'), campaignId: 'c2' }] });
        magasin().archiverLesReliquats();

        expect(magasin().lootPool.map(i => i.name)).toEqual(['Ailleurs']);
        expect(magasin().lootReserve).toEqual([]);
    });

    it('un objet mis de côté revient au pool', () => {
        magasin().addLootToPool([objet('Lanterne', 1, 'other')]);
        magasin().archiverLesReliquats();
        magasin().remettreAuPool('it-Lanterne');

        expect(magasin().lootReserve).toEqual([]);
        expect(magasin().lootPool.map(i => i.name)).toEqual(['Lanterne']);
    });
});
