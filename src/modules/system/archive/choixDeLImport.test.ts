import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/**
 * **Le choix avant les médias** — lot E4 du chantier des archives, 2026-10-19.
 *
 * Les médias de l'archive entraient avant qu'on ait choisi quoi faire :
 * « Annuler » laissait des orphelins, « Remplacer » retirait ensuite l'étiquette
 * de la campagne aux médias qu'on venait d'importer, et une copie recevait des
 * médias étiquetés pour l'original. Et une campagne qui arrivait sans conflit ne
 * demandait rien : impossible de la rejouer.
 */
const journal: string[] = [];
const media = {
    addMedia: vi.fn(async (_f: File, _tags: string[], campagnes: string[]) => { journal.push(`addMedia:${campagnes.join(',')}`); return 'm-importe'; }),
    removeCampaignReference: vi.fn(async (id: string) => { journal.push(`retirer:${id}`); }),
    mediaList: [],
};
vi.mock('../../../stores/useMediaStore', () => ({ useMediaStore: { getState: () => media } }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: { getState: () => ({ playlists: [] }), setState: vi.fn(), subscribe: vi.fn() } }));
vi.mock('../../sound/useSoundStore', () => ({ useSoundStore: { getState: () => ({ atmospheres: [] }), setState: vi.fn(), subscribe: vi.fn() } }));

const { nexusService } = await import('./NexusService');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { NEXUS_SCHEMA_VERSION } = await import('./nexus.types');
type Choix = import('./nexus.types').NexusConflictResolution;
type Arrivee = import('./nexus.types').ArriveeDUneCampagne;
type Conflit = import('./nexus.types').NexusConflict;

const C = 'camp-br';
const MANIFESTE = {
    schemaVersion: NEXUS_SCHEMA_VERSION, bundleType: 'campaign', campaignId: C, campaignName: 'Blade Runner',
    exportedAt: '2026-10-19T10:00:00.000Z', assetMap: [{ relativePath: 'assets/pluie.png', originalRef: 'media://pluie' }],
};
const ETAT = {
    campaign: { id: C, name: 'Blade Runner', system: 'br', activeLocationIds: [], wallpaperUrl: 'media://pluie' },
    entities: [], players: [], atlasMaps: [], wikiEntries: [], timelineEvents: [], clues: [],
    sessions: [{ id: 'sess-1', campaignId: C, name: 'Séance 1' }],
    deckManifests: [], deckSessionStates: [],
};

const pontInitial = window.appBridge;
beforeEach(() => {
    journal.length = 0;
    media.addMedia.mockClear();
    useSessionOSStore.setState({ campaigns: [], sessions: [] });
    window.appBridge = { ...pontInitial, nexus: {
        selectImportFile: vi.fn(async () => 'br.gmos'),
        importBundle: vi.fn(async () => ({
            success: true, manifestJson: JSON.stringify(MANIFESTE), stateJson: JSON.stringify(ETAT),
            assetData: { 'assets/pluie.png': 'data:image/png;base64,iVBORw0KGgo=' },
        })),
    } } as unknown as Window['appBridge'];
});
afterEach(() => { window.appBridge = pontInitial; });

/** Le choix de l'écran, et ce qu'on lui a montré. */
function choisir(strategie: Choix['strategy']) {
    const vu: { conflits?: Conflit[]; arrivee?: Arrivee } = {};
    const onConflict = vi.fn(async (conflits: Conflit[], arrivee?: Arrivee) => {
        journal.push('choix');
        Object.assign(vu, { conflits, arrivee });
        return { strategy: strategie };
    });
    return { onConflict, vu };
}

describe('le choix de l’import d’une campagne', () => {
    it('une campagne qui arrive sans conflit demande quand même, et se décrit', async () => {
        const { onConflict, vu } = choisir('replace');
        expect((await nexusService.importBundle(onConflict)).success).toBe(true);
        expect(vu.conflits).toEqual([]);
        expect(vu.arrivee).toMatchObject({ nom: 'Blade Runner', seances: 1 });
    });

    it('« Annuler » n’écrit rien — pas même un média', async () => {
        const { onConflict } = choisir('cancel');
        expect((await nexusService.importBundle(onConflict)).success).toBe(false);
        expect(media.addMedia).not.toHaveBeenCalled();
        expect(useSessionOSStore.getState().campaigns).toEqual([]);
    });

    it('« Rejouer » : les médias sont étiquetés pour la nouvelle campagne, qui arrive sans ses séances', async () => {
        const { onConflict } = choisir('rejouer');
        expect((await nexusService.importBundle(onConflict)).success).toBe(true);
        const [campagne] = useSessionOSStore.getState().campaigns;
        expect(campagne.id).not.toBe(C);
        expect(campagne.name).toBe('Blade Runner');
        expect(journal).toEqual(['choix', `addMedia:${campagne.id}`]);
        expect(useSessionOSStore.getState().sessions.filter(s => s.campaignId === campagne.id)).toEqual([]);
        // Le chemin du média est bien réécrit, après la copie comme avant elle.
        expect(campagne.wallpaperUrl).not.toBe('media://pluie');
    });

    it('« Remplacer » en conflit : l’ancienne étiquette est retirée AVANT que les nouveaux médias la reçoivent', async () => {
        useSessionOSStore.setState({ campaigns: [{ ...ETAT.campaign, name: 'Blade Runner (locale)' }] as never });
        const { onConflict, vu } = choisir('replace');
        await nexusService.importBundle(onConflict);
        expect(vu.conflits).toHaveLength(1);
        expect(journal).toEqual(['choix', `retirer:${C}`, `addMedia:${C}`]);
    });

    it('« Rejouer » alors que l’original est là : « (Nouvelle partie) », l’original intact', async () => {
        useSessionOSStore.setState({ campaigns: [ETAT.campaign] as never });
        const { onConflict } = choisir('rejouer');
        await nexusService.importBundle(onConflict);
        const campagnes = useSessionOSStore.getState().campaigns;
        expect(campagnes.map(c => c.name).sort()).toEqual(['Blade Runner', 'Blade Runner (Nouvelle partie)']);
        expect(journal).not.toContain(`retirer:${C}`);
    });
});
