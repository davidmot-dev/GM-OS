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
/* Lot E6 : l'instantané avant d'écrire. Sa garde est éprouvée ailleurs (purge,
   `SessionBackupManager.test.ts`) ; ici, on éprouve que l'import l'écoute. */
type Issue = Awaited<ReturnType<typeof import('../../session/logic/SessionBackupManager').instantaneAvant>>;
let issueDeLInstantane: Issue = { statut: 'ecrit' };
vi.mock('../../session/logic/SessionBackupManager', async (original) => ({
    ...(await original<typeof import('../../session/logic/SessionBackupManager')>()),
    instantaneAvant: vi.fn(async (motif: string) => { journal.push(`instantane:${motif}`); return issueDeLInstantane; }),
}));

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
    issueDeLInstantane = { statut: 'ecrit' };
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
        expect(journal.filter(e => !e.startsWith('instantane:'))).toEqual(['choix', `addMedia:${campagne.id}`]);
        expect(useSessionOSStore.getState().sessions.filter(s => s.campaignId === campagne.id)).toEqual([]);
        // Le chemin du média est bien réécrit, après la copie comme avant elle.
        expect(campagne.wallpaperUrl).not.toBe('media://pluie');
    });

    it('« Remplacer » en conflit : l’ancienne étiquette est retirée AVANT que les nouveaux médias la reçoivent', async () => {
        useSessionOSStore.setState({ campaigns: [{ ...ETAT.campaign, name: 'Blade Runner (locale)' }] as never });
        const { onConflict, vu } = choisir('replace');
        await nexusService.importBundle(onConflict);
        expect(vu.conflits).toHaveLength(1);
        expect(journal.filter(e => !e.startsWith('instantane:'))).toEqual(['choix', `retirer:${C}`, `addMedia:${C}`]);
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

describe('la sauvegarde avant d’écrire, l’aperçu et le bilan (lot E6)', () => {
    it('l’instantané passe APRÈS le choix et AVANT la première écriture', async () => {
        const { onConflict } = choisir('replace');
        await nexusService.importBundle(onConflict);
        expect(journal).toEqual(['choix', 'instantane:avant l\'import de la campagne « Blade Runner »', `addMedia:${C}`]);
    });

    it('un instantané refusé : rien n’entre, et on dit pourquoi', async () => {
        issueDeLInstantane = { statut: 'refuse', details: 'La base n’a pas été relue.' };
        const { onConflict } = choisir('replace');
        const r = await nexusService.importBundle(onConflict);
        expect(r.success).toBe(false);
        expect(r.error).toContain('Rien n\'a été importé');
        expect(media.addMedia).not.toHaveBeenCalled();
        expect(useSessionOSStore.getState().campaigns).toEqual([]);
    });

    it('un instantané qui n’aboutit pas : rien n’entre non plus', async () => {
        issueDeLInstantane = { statut: 'non-abouti' };
        const { onConflict } = choisir('rejouer');
        expect((await nexusService.importBundle(onConflict)).success).toBe(false);
        expect(useSessionOSStore.getState().campaigns).toEqual([]);
    });

    it('rien à sauver (profil neuf) : l’import passe, et le bilan le dit', async () => {
        issueDeLInstantane = { statut: 'sans-objet', details: 'Aucune campagne.' };
        const { onConflict } = choisir('replace');
        const r = await nexusService.importBundle(onConflict);
        expect(r.success).toBe(true);
        expect(r.bilan![0]).toBe('Aucune sauvegarde préalable : Aucune campagne.');
    });

    it('l’aperçu compte ce que l’archive porte, et le bilan dit ce qui est entré', async () => {
        const { onConflict, vu } = choisir('replace');
        const r = await nexusService.importBundle(onConflict);
        expect(vu.arrivee).toMatchObject({ contenu: [{ libelle: 'séances', nombre: 1 }], medias: 1 });
        expect(r.bilan).toEqual([
            expect.stringMatching(/^Sauvegarde automatique écrite juste avant l'import/),
            '« Blade Runner » importée telle quelle.',
            'Entré : 1 séances.',
            'Médias : 1 entré(s).',
        ]);
    });

    it('rejouer : le bilan dit ce qui a été effacé', async () => {
        const { onConflict } = choisir('rejouer');
        const r = await nexusService.importBundle(onConflict);
        expect(r.bilan![1]).toMatch(/nouvelle partie : séances, journaux et parcours effacés/);
        expect(r.bilan![2]).toBe('Entré : rien.');
    });
});
