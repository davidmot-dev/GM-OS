import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/**
 * **Importer une archive des médias dans une autre campagne** — lot E5 du
 * chantier des archives, 2026-10-19. Un média garde son identifiant ; les
 * ambiances, playlists et tuiles sont copiées pour la cible ; rien n'est retiré
 * à la campagne d'origine.
 */
function magasin<T extends object>(faire: () => T) {
    let etat = faire();
    return {
        getState: () => etat,
        setState: (maj: Partial<T> | ((e: T) => Partial<T>)) => { etat = { ...etat, ...(typeof maj === 'function' ? maj(etat) : maj) }; },
        subscribe: () => () => {},
        remettre: () => { etat = faire(); },
    };
}
type Media = { id: string; name: string; type: string; size: number; createdAt: number; tags: string[]; campaignIds: string[] };
const mediaHub = magasin(() => ({
    isInitialized: true,
    mediaList: [{ id: 'm-pluie', name: 'pluie.png', type: 'image', size: 4, createdAt: 0, tags: [], campaignIds: ['c-br'] }] as Media[],
}));
const appels: string[] = [];
const actions = {
    initDB: vi.fn(async () => {}),
    updateMediaCampaigns: vi.fn(async (id: string, campaignIds: string[]) => { appels.push(`etiqueter:${id}:${campaignIds.join('+')}`); }),
    restaurerUnMedia: vi.fn(async (m: Media) => { appels.push(`restaurer:${m.id}:${m.campaignIds.join('+')}`); return true; }),
    addMedia: vi.fn(async (f: File, _t: string[], c: string[]) => { appels.push(`ajouter:${f.name}:${c.join('+')}`); return 'm-sirene-neuf'; }),
    getMediaBlob: vi.fn(async () => new Blob(['abcd'], { type: 'image/png' })),
};
const son = magasin(() => ({ atmospheres: [{ id: 'atm-1', name: 'Néons', campagneId: 'c-br', pads: {} }] as { id: string; name: string; campagneId?: string; pads: Record<string, { filePath: string | null }> }[] }));
const musique = magasin(() => ({ playlists: [] as { id: string }[] }));
const lumiere = magasin(() => ({ scenes: {} as Record<string, { id: string; campagneId?: string | null }> }));

vi.mock('../../../stores/useMediaStore', () => ({ useMediaStore: { getState: () => ({ ...mediaHub.getState(), ...actions }) } }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));
vi.mock('../../sound/useSoundStore', () => ({ useSoundStore: son }));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: musique }));
vi.mock('../../light/useLightStore', () => ({ useLightStore: lumiere }));
vi.mock('../../session/logic/SessionBackupManager', async (original) => ({
    ...(await original<typeof import('../../session/logic/SessionBackupManager')>()),
    instantaneAvant: vi.fn(async () => { appels.push('instantane'); return { statut: 'ecrit' }; }),
}));

const { nexusService } = await import('./NexusService');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { NEXUS_SCHEMA_VERSION } = await import('./nexus.types');
type Arrivee = import('./nexus.types').ArriveeDUneCampagne;

const ARCHIVE = {
    origine: { campaignId: 'c-br', campaignName: 'Blade Runner', system: 'br' },
    medias: [
        { id: 'm-pluie', name: 'pluie.png', type: 'image', size: 4, createdAt: 0, tags: [], campaignIds: ['c-br'] },
        { id: 'm-orage', name: 'orage.mp3', type: 'audio', size: 4, createdAt: 0, tags: [], campaignIds: [] },
    ],
    atmospheres: [{ id: 'atm-1', name: 'Néons', campagneId: 'c-br', pads: {
        PAD_01: { id: 'PAD_01', title: 'Orage', filePath: 'm-orage' },
        PAD_02: { id: 'PAD_02', title: 'Sirène', filePath: 'D:/Sons/sirene.mp3' },
    } }],
    playlists: [],
    tuilesDeLumiere: [{ id: 'SCENE_c-br_02', name: 'Pluie acide', icon: 'x', color: '#0f0', lightStates: { l1: { on: true } }, campagneId: 'c-br' }],
};
const MANIFESTE = {
    schemaVersion: NEXUS_SCHEMA_VERSION, bundleType: 'medias', campaignId: 'c-br', campaignName: 'Blade Runner',
    exportedAt: '2026-10-19T10:00:00.000Z',
    assetMap: [
        { originalRef: 'm-pluie', relativePath: 'assets/profiles/m-pluie.png' },
        { originalRef: 'm-orage', relativePath: 'assets/profiles/m-orage.mp3' },
        { originalRef: 'D:/Sons/sirene.mp3', relativePath: 'assets/audio/sirene.mp3' },
    ],
};
const OCTETS = 'data:application/octet-stream;base64,AAAA';

const pontInitial = window.appBridge;
beforeEach(() => {
    appels.length = 0;
    [mediaHub, son, musique, lumiere].forEach(m => m.remettre());
    Object.values(actions).forEach(a => a.mockClear());
    useSessionOSStore.setState({ campaigns: [{ id: 'c-br', name: 'Blade Runner' }, { id: 'c-2049', name: '2049' }] as never, activeCampaignId: 'c-2049' });
    window.appBridge = { ...pontInitial, nexus: {
        selectImportFile: vi.fn(async () => 'br.gmos-medias'),
        importBundle: vi.fn(async () => ({
            success: true, manifestJson: JSON.stringify(MANIFESTE), stateJson: JSON.stringify(ARCHIVE),
            assetData: { 'assets/profiles/m-pluie.png': OCTETS, 'assets/profiles/m-orage.mp3': OCTETS, 'assets/audio/sirene.mp3': OCTETS },
        })),
    } } as unknown as Window['appBridge'];
});
afterEach(() => { window.appBridge = pontInitial; });

const importerDans = async (cible: string | 'annuler') => {
    const vu: { arrivee?: Arrivee } = {};
    const r = await nexusService.importBundle(async (_c, arrivee) => {
        vu.arrivee = arrivee;
        return cible === 'annuler' ? { strategy: 'cancel' } : { strategy: 'replace', campagneCible: cible };
    });
    return { r, vu };
};

describe('importer une archive des médias', () => {
    it('demande la campagne qui reçoit, et propose d’abord celle d’origine', async () => {
        const { vu } = await importerDans('c-2049');
        expect(vu.arrivee).toMatchObject({ genre: 'medias', nom: 'Blade Runner', campagneParDefaut: 'c-br' });
        expect(vu.arrivee!.campagnes!.map(c => c.id)).toEqual(['c-br', 'c-2049']);
    });

    it('« Annuler » n’écrit rien', async () => {
        const { r } = await importerDans('annuler');
        expect(r.success).toBe(false);
        expect(appels).toEqual([]);
        expect(son.getState().atmospheres).toHaveLength(1);
    });

    it('les médias gardent leur identifiant : étiquetés s’ils sont là, restaurés sinon ; le son du disque entre au hub', async () => {
        const { r } = await importerDans('c-2049');
        expect(r.success).toBe(true);
        expect(appels).toEqual([
            'instantane',
            'etiqueter:m-pluie:c-br+c-2049',
            'restaurer:m-orage:c-2049',
            'ajouter:sirene.mp3:c-2049',
        ]);
    });

    it('l’ambiance est copiée pour la cible, ses pads pointent vers les médias entrés ; l’originale reste', async () => {
        await importerDans('c-2049');
        const [originale, copie] = son.getState().atmospheres;
        expect(originale).toMatchObject({ id: 'atm-1', campagneId: 'c-br' });
        expect(copie.id).not.toBe('atm-1');
        expect(copie.campagneId).toBe('c-2049');
        expect(copie.pads.PAD_01.filePath).toBe('m-orage');
        expect(copie.pads.PAD_02.filePath).toBe('m-sirene-neuf');
    });

    it('la tuile entre dans le râtelier de la cible, au même numéro', async () => {
        await importerDans('c-2049');
        expect(lumiere.getState().scenes['SCENE_c-2049_02']).toMatchObject({ campagneId: 'c-2049', name: 'Pluie acide' });
    });

    it('le bilan dit où, combien, et ce qui a été copié', async () => {
        const { r } = await importerDans('c-2049');
        expect(r.bilan).toEqual([
            expect.stringMatching(/^Sauvegarde automatique écrite/),
            'Médias de « Blade Runner » importés dans « 2049 » (ambiances, playlists et tuiles copiées pour elle).',
            'Entré : 1 images · 1 sons · 1 ambiances sonores · 1 tuiles de lumière.',
            'Media Hub : 2 média(s) ajouté(s), 1 déjà présent(s) étiqueté(s) pour « 2049 ».',
        ]);
    });

    it('dans la campagne d’origine : rien n’est copié, la fusion remplace par identifiant', async () => {
        await importerDans('c-br');
        expect(son.getState().atmospheres.map(a => a.id)).toEqual(['atm-1']);
        expect(lumiere.getState().scenes['SCENE_c-br_02']).toBeDefined();
    });
});

describe('exporter les médias d’une campagne', () => {
    it('l’archive porte les médias, l’ambiance et la tuile ; le pont reçoit les octets du hub et les fichiers du disque', async () => {
        son.setState({ atmospheres: ARCHIVE.atmospheres as never });
        lumiere.setState({ scenes: { 'SCENE_c-br_02': ARCHIVE.tuilesDeLumiere[0] } as never });
        mediaHub.setState({ mediaList: ARCHIVE.medias as never });
        const enregistres: string[] = [];
        let exporte: { stateJson: string; manifestJson: string; fichiers: string[] } | undefined;
        window.appBridge = { ...pontInitial, nexus: {
            selectExportPath: vi.fn(async (genre: string) => (genre === 'medias' ? 'br.gmos-medias' : null)),
            clearAssets: vi.fn(async () => ({ ok: true })),
            registerAsset: vi.fn(async (id: string) => { enregistres.push(id); return { ok: true }; }),
            exportBundle: vi.fn(async (_id: string, _chemin: string, stateJson: string, manifestJson: string, fichiers: string[]) => {
                exporte = { stateJson, manifestJson, fichiers };
                return { success: true, missingAssets: [] };
            }),
        } } as unknown as Window['appBridge'];

        expect((await nexusService.exportMediasBundle('c-br')).success).toBe(true);
        const etat = JSON.parse(exporte!.stateJson);
        expect(etat.origine).toEqual({ campaignId: 'c-br', campaignName: 'Blade Runner', system: undefined });
        expect(etat.medias.map((m: Media) => m.id)).toEqual(['m-pluie', 'm-orage']);
        expect(etat.atmospheres.map((a: { id: string }) => a.id)).toEqual(['atm-1']);
        expect(etat.tuilesDeLumiere.map((t: { id: string }) => t.id)).toEqual(['SCENE_c-br_02']);
        expect(JSON.parse(exporte!.manifestJson)).toMatchObject({ bundleType: 'medias', campaignId: 'c-br' });
        expect(enregistres).toEqual(['m-pluie', 'm-orage']);
        expect(exporte!.fichiers).toEqual(['D:/Sons/sirene.mp3']);
    });
});
