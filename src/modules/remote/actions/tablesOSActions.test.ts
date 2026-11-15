import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TableData, TableResult } from '../../tables/types';

/**
 * **Table-OS sur la télécommande du meneur** (Fire HD 8, registre § 256, T6).
 *
 * Décision de David du 15/11/2026 : les tables du jeu actif, le résultat au meneur seul, et
 * « Montrer aux joueurs ». Ce qui se joue ici : le dossier recalculé au poste, rien cru sur
 * parole, et **aucune réponse hors du rôle `remote`**.
 */

const PILOTE_ALIEN = { id: 'alien', name: 'ALIEN, le jeu de rôle', corpusId: 'alien',
    combat: { panique: { table: { univers: 'Alien', table: 'test_de_panique' } } } };
const TABLES: Record<string, TableData> = {
    blessures_critiques: { name: 'Blessures Critiques', dice: 'd66', entries: [{ min: 11, max: 66, title: 'Sang dans les yeux', description: 'Le sang coule.', effect: 'OBSERVATION −2' }] },
    test_de_panique: { name: 'Test de Panique', dice: '1d6', entries: [{ min: 1, max: 99, title: 'Sursaut', description: '' }] },
};

const session = {
    campaigns: [{ id: 'c-alien', system: 'alien' }, { id: 'c-sans-tables', system: 'symbaroum' }],
    customGameDrivers: [PILOTE_ALIEN, { id: 'symbaroum', name: 'Symbaroum', corpusId: 'symbaroum' }],
    addHubNotification: vi.fn(),
};
vi.mock('../../session/useSessionOSStore', () => ({ useSessionOSStore: { getState: () => session } }));
vi.mock('../../session/store/tousLesPilotes', () => ({ tousLesPilotes: (pilotes: unknown[]) => pilotes }));

const tirerSur = vi.fn();
const journaliserUnTirage = vi.fn();
const magasin: { history: TableResult[] } = { history: [] };
vi.mock('../../tables/useTableStore', () => ({
    useTableStore: { getState: () => ({ ...magasin, tirerSur, journaliserUnTirage }) },
}));

const { tablesOSActions } = await import('./tablesOSActions');

const diffuse = vi.fn();
const pont = {
    listUniverses: vi.fn(async () => ['Alien', 'Dune', 'generique']),
    listTables: vi.fn(async (u: string) => (u === 'Alien' ? Object.keys(TABLES) : [])),
    loadTable: vi.fn(async (_u: string, t: string) => TABLES[t] ?? null),
};
const ctx = (campagne: string | null) => ({ activeCampaignId: campagne, sync: vi.fn() });
const RESULTAT: TableResult = { rawRoll: 15, modifier: 0, finalValue: 15, timestamp: 42, tableName: 'Blessures Critiques',
    entry: TABLES.blessures_critiques.entries[0] };

beforeEach(() => {
    vi.clearAllMocks();
    magasin.history = [];
    (window as unknown as { appBridge: unknown }).appBridge = { remote: { broadcastUIAction: diffuse }, tables: pont };
});

describe('lister', () => {
    it('rend les tables du jeu actif, triées, avec leur nom et leur dé — au rôle remote seul', async () => {
        await tablesOSActions['remote:tables:lister']!(null, ctx('c-alien'));
        expect(diffuse).toHaveBeenCalledWith({ type: 'tables:liste', payload: { univers: 'Alien', tables: [
            { id: 'blessures_critiques', nom: 'Blessures Critiques', des: 'd66' },
            { id: 'test_de_panique', nom: 'Test de Panique', des: '1d6' },
        ] } }, 'remote');
    });

    it('dit pourquoi il n’y a rien : pas de campagne, ou un jeu sans tables', async () => {
        await tablesOSActions['remote:tables:lister']!(null, ctx(null));
        await tablesOSActions['remote:tables:lister']!(null, ctx('c-sans-tables'));
        const [[sans], [symbaroum]] = diffuse.mock.calls;
        expect(sans.payload).toMatchObject({ univers: null, tables: [], raison: expect.stringContaining('Aucune campagne') });
        expect(symbaroum.payload).toMatchObject({ univers: null, tables: [], raison: 'Aucune table pour Symbaroum.' });
    });
});

describe('tirer', () => {
    it('tire au poste du MJ dans le dossier recalculé, et répond au rôle remote seul', async () => {
        tirerSur.mockResolvedValueOnce(RESULTAT);
        await tablesOSActions['remote:tables:tirer']!({ table: 'blessures_critiques', modificateur: 10 }, ctx('c-alien'));
        expect(tirerSur).toHaveBeenCalledWith('Alien', 'blessures_critiques', 10);
        expect(diffuse).toHaveBeenCalledWith({ type: 'tables:resultat', payload: { table: 'blessures_critiques', resultat: RESULTAT } }, 'remote');
    });

    it('refuse une table qui n’est pas du jeu actif — même existante ailleurs', async () => {
        await tablesOSActions['remote:tables:tirer']!({ table: '../Dune/rencontres' }, ctx('c-alien'));
        await tablesOSActions['remote:tables:tirer']!({ table: 'blessures_critiques' }, ctx('c-sans-tables'));
        expect(tirerSur).not.toHaveBeenCalled();
        expect(diffuse.mock.calls.every(([r, role]) => r.payload.resultat === null && role === 'remote')).toBe(true);
    });

    it('refuse un modificateur qui n’est pas un entier borné', async () => {
        for (const modificateur of [1.5, 101, -101, '3', Number.NaN]) {
            await tablesOSActions['remote:tables:tirer']!({ table: 'blessures_critiques', modificateur }, ctx('c-alien'));
        }
        expect(tirerSur).not.toHaveBeenCalled();
        expect(diffuse).toHaveBeenCalledTimes(5);
    });
});

describe('montrer aux joueurs', () => {
    it('journalise et annonce sur les tablettes un tirage de l’historique', () => {
        magasin.history = [RESULTAT];
        tablesOSActions['remote:tables:montrer']!({ timestamp: 42 }, ctx('c-alien'));
        expect(journaliserUnTirage).toHaveBeenCalledWith(RESULTAT);
        expect(session.addHubNotification).toHaveBeenCalledWith({
            type: 'system', title: 'Blessures Critiques', fromName: 'Le meneur',
            content: '15 · Sang dans les yeux\nLe sang coule.\nOBSERVATION −2',
        });
        expect(diffuse).toHaveBeenCalledWith({ type: 'tables:montre', payload: { timestamp: 42, montre: true } }, 'remote');
    });

    it('n’annonce rien pour un tirage absent de l’historique — la tablette ne fabrique pas de résultat', () => {
        tablesOSActions['remote:tables:montrer']!({ timestamp: 7, resultat: RESULTAT }, ctx('c-alien'));
        expect(journaliserUnTirage).not.toHaveBeenCalled();
        expect(session.addHubNotification).not.toHaveBeenCalled();
        expect(diffuse).toHaveBeenCalledWith({ type: 'tables:montre', payload: { timestamp: 7, montre: false } }, 'remote');
    });
});
