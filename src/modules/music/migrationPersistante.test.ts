import { describe, expect, it, vi } from 'vitest';

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
// Même isolation du cycle de ducking que les essais des plages musicales.
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { useMusicStore } = await import('./useMusicStore');
const { musicEngine } = await import('./MusicEngine');
const options = useMusicStore.persist.getOptions();
const migrer = options.migrate;
if (!migrer) throw new Error('Migration persistante absente');

describe('la migration persistante des liens lumineux de Music-OS', () => {
    it.each([0, null, undefined])('reprend l’ancien lien pour la version %s sans perdre les autres champs', async (version) => {
        const ancienPad = { id: 'pad-essai', label: 'Pluie', url: 'm-pluie', type: 'local',
            loopA: 12, loopB: 48, keybind: 'p', couleur: 'bleu', lightLinkId: 'SCENE_03',
            ancienChamp: { note: 'conservée' } };
        const source = { playlists: [{ id: 'liste-essai', name: 'Taverne', campagneId: 'c-essai',
            pads: [ancienPad], notesAnciennes: ['conservées'] }],
            masterVolume: 0.7, outputDeviceId: 'sortie-essai', sonies: { 'm-pluie': -18 },
            champSupplementaire: { actif: true } };
        const attendu = structuredClone(source);
        const { lightLinkId, ...padAttendu } = attendu.playlists[0].pads[0];

        // null et undefined représentent les versions historiques tolérées,
        // même si le contrat actuel du middleware ne nomme que number.
        const resultat = await migrer(source, version as number);

        expect(resultat).toBe(source);
        expect(resultat).toEqual({ ...attendu, playlists: [{ ...attendu.playlists[0],
            pads: [{ ...padAttendu, linkedLightSceneId: lightLinkId }] }] });
        expect(ancienPad.lightLinkId).toBe('SCENE_03');
        expect(resultat.playlists[0].pads[0]).not.toHaveProperty('lightLinkId');
    });

    it.each(['SCENE_09', '', null])('garde le nouveau champ déjà défini (%s) et l’ancien tel quel', async (lien) => {
        const pad = { id: 'pad-essai', lightLinkId: 'SCENE_03', linkedLightSceneId: lien };
        const source = { playlists: [{ id: 'liste', pads: [pad] }] };

        const resultat = await migrer(source, 0);

        expect(resultat.playlists[0].pads[0]).toBe(pad);
        expect(resultat.playlists[0].pads[0]).toEqual(pad);
    });

    it.each(['', null])('retire l’ancien champ vide (%s) sans fabriquer un lien lumineux', async (lien) => {
        const source = { playlists: [{ pads: [{ id: 'pad-essai', lightLinkId: lien }] }] };

        const resultat = await migrer(source, 0);

        expect(resultat.playlists[0].pads[0]).toEqual({ id: 'pad-essai', linkedLightSceneId: undefined });
    });

    it('laisse les pastilles sans ancien lien intactes', async () => {
        const pad = { id: 'pad-essai', url: 'm-essai' };
        const source = { playlists: [{ pads: [pad] }] };
        expect((await migrer(source, 0)).playlists[0].pads[0]).toBe(pad);
    });

    it.each([1, 2])('ne touche pas aux données d’une version plus récente (%s)', async (version) => {
        const source = { playlists: [{ pads: [{ lightLinkId: 'SCENE_03' }] }] };
        const temoin = structuredClone(source);
        expect(await migrer(source, version)).toBe(source);
        expect(source).toEqual(temoin);
    });

    it.each([null, undefined, {}, { playlists: [] }])('garde les états absents ou sans playlists : %j', async (source) => {
        expect(await migrer(source, 0)).toBe(source);
    });

    it('la sélection persistée conserve les réglages et exclut les platines et les actions', () => {
        const etat = useMusicStore.getState();
        const selectionner = options.partialize;
        if (!selectionner) throw new Error('Sélection persistante absente');
        const durable = selectionner(etat);
        expect(durable.playlists).toBe(etat.playlists);
        expect(durable.outputDeviceId).toBe(etat.outputDeviceId);
        for (const cle of ['deckA', 'deckB', 'activePlaylistId', 'history', 'consoleLogs', 'playPad']) {
            expect(durable).not.toHaveProperty(cle);
        }
    });

    it('ne déclenche aucun chargement ni lecture dans les deux platines', async () => {
        const chargerA = vi.spyOn(musicEngine.deckA, 'loadTrack');
        const chargerB = vi.spyOn(musicEngine.deckB, 'loadTrack');
        const jouerA = vi.spyOn(musicEngine.deckA, 'play');
        const jouerB = vi.spyOn(musicEngine.deckB, 'play');

        await migrer({ playlists: [{ pads: [{ lightLinkId: 'SCENE_03' }] }] }, 0);

        for (const appel of [chargerA, chargerB, jouerA, jouerB]) expect(appel).not.toHaveBeenCalled();
    });
});
