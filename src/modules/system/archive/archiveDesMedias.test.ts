import { describe, it, expect } from 'vitest';
import { rassemblerLesMedias, recenserLesMedias, planifierLImportDesMedias, pointerVersLesMediasEntres, ceQuImageOsTientPourLaCampagne, completerImageOs, type NexusMediasState } from './archiveDesMedias';
import type { StoryboardMoment } from '../../storyboard/useStoryboardStore';
import type { ImageMedia, ImageFolder, Diaporama } from '../../image/types';
import type { MediaItem } from '../../../stores/useMediaStore';
import type { Atmosphere } from '../../sound/useSoundStore';
import type { Playlist } from '../../music/useMusicStore';
import type { LightScene } from '../../light/useLightStore';

/**
 * **L'archive des médias (`.gmos-medias`)** — lot E5 du chantier des archives,
 * 2026-10-19. Ce qui part, et où cela revient dans une autre campagne.
 */
const BR = { id: 'c-br', name: 'Blade Runner', system: 'br' };
const media = (id: string, campaignIds: string[], type: MediaItem['type'] = 'image') =>
    ({ id, name: `${id}.png`, type, size: 1, createdAt: 0, tags: [], campaignIds }) as MediaItem;
const tuile = (id: string, campagneId: string | null, regle = true) =>
    ({ id, name: id, icon: 'x', color: '#000', lightStates: regle ? { l1: { on: true } } : {}, campagneId }) as unknown as LightScene;

const MAGASINS = {
    mediaList: [media('m-pluie', ['c-br']), media('m-orage', [], 'audio'), media('m-ailleurs', ['c-nephilim'])],
    atmospheres: [
        { id: 'atm-1', name: 'Néons', campagneId: 'c-br', pads: { PAD_01: { id: 'PAD_01', title: 'Orage', filePath: 'm-orage' }, PAD_02: { id: 'PAD_02', title: 'Sirène', filePath: 'D:/Sons/sirene.mp3' } } },
        { id: 'atm-2', name: 'Forêt', campagneId: 'c-nephilim', pads: { PAD_01: { id: 'PAD_01', title: 'Vent', filePath: 'D:/Sons/vent.mp3' } } },
    ] as unknown as Atmosphere[],
    playlists: [
        { id: 'pl-1', name: 'Vangelis', campagneId: 'c-br', pads: [
            { id: 'pad-a', label: 'Tears', url: 'D:/Musique/tears.mp3', type: 'local', linkedLightSceneId: 'SCENE_c-br_02' },
            { id: 'pad-b', label: 'YouTube', url: 'https://youtu.be/x', type: 'link' },
        ] },
    ] as unknown as Playlist[],
    scenes: {
        'SCENE_c-br_02': tuile('SCENE_c-br_02', 'c-br'),
        'SCENE_c-br_03': tuile('SCENE_c-br_03', 'c-br'),
        SCENE_01: tuile('SCENE_01', null),
    },
};

describe('rassembler les médias d’une campagne', () => {
    const { state, fichiers } = rassemblerLesMedias(BR, MAGASINS);

    it('les médias étiquetés pour elle, et ceux que ses pads désignent sans étiquette', () => {
        expect(state.medias.map(m => m.id)).toEqual(['m-pluie', 'm-orage']);
    });

    it('ses ambiances, ses playlists et ses tuiles — pas celles des autres, ni le pot commun', () => {
        expect(state.atmospheres.map(a => a.id)).toEqual(['atm-1']);
        expect(state.playlists.map(p => p.id)).toEqual(['pl-1']);
        expect(state.tuilesDeLumiere.map(t => t.id)).toEqual(['SCENE_c-br_02', 'SCENE_c-br_03']);
    });

    it('les fichiers du disque à copier — ni un média du hub, ni un lien distant', () => {
        expect(fichiers).toEqual(['D:/Sons/sirene.mp3', 'D:/Musique/tears.mp3']);
    });

    it('l’aperçu compte par genre', () => {
        expect(recenserLesMedias(state)).toEqual([
            { libelle: 'images', nombre: 1 }, { libelle: 'sons', nombre: 1 },
            { libelle: 'ambiances sonores', nombre: 1 }, { libelle: 'playlists', nombre: 1 }, { libelle: 'tuiles de lumière', nombre: 2 },
        ]);
    });
});

describe('planifier l’import dans une autre campagne', () => {
    const { state } = rassemblerLesMedias(BR, MAGASINS);
    let n = 0;
    const neuf = (p: string) => `${p}-neuf-${++n}`;

    it('ambiances et playlists sont COPIÉES pour la cible : nouveaux identifiants, son étiquette', () => {
        const plan = planifierLImportDesMedias(state, 'c-2049', MAGASINS.scenes, neuf);
        expect(plan.telQuel).toBe(false);
        expect(plan.atmospheres[0].id).not.toBe('atm-1');
        expect(plan.atmospheres[0].campagneId).toBe('c-2049');
        expect(plan.playlists[0].id).not.toBe('pl-1');
        expect(plan.playlists[0].pads[0].id).not.toBe('pad-a');
        expect(plan.playlists[0].campagneId).toBe('c-2049');
    });

    it('les tuiles passent au râtelier de la cible, même numéro, et la musique qui les allume suit', () => {
        const plan = planifierLImportDesMedias(state, 'c-2049', MAGASINS.scenes, neuf);
        expect(plan.tuilesDeLumiere.map(t => t.id)).toEqual(['SCENE_c-2049_02', 'SCENE_c-2049_03']);
        expect(plan.tuilesDeLumiere.every(t => t.campagneId === 'c-2049')).toBe(true);
        expect(plan.playlists[0].pads[0].linkedLightSceneId).toBe('SCENE_c-2049_02');
    });

    it('une tuile réglée de la cible ne s’écrase jamais ; une case vide se prend', () => {
        const locales = {
            ...MAGASINS.scenes,
            'SCENE_c-2049_02': tuile('SCENE_c-2049_02', 'c-2049', true),   // réglée
            'SCENE_c-2049_03': tuile('SCENE_c-2049_03', 'c-2049', false),  // vide
            'SCENE_c-2049_01': tuile('SCENE_c-2049_01', 'c-2049', true),   // réglée
        };
        const plan = planifierLImportDesMedias(state, 'c-2049', locales, neuf);
        expect(plan.tuilesDeLumiere.map(t => t.id)).toEqual(['SCENE_c-2049_04', 'SCENE_c-2049_03']);
    });

    it('réimporter dans la campagne d’origine : les identifiants restent, la fusion remplacera', () => {
        const plan = planifierLImportDesMedias(state, 'c-br', MAGASINS.scenes, neuf);
        expect(plan.telQuel).toBe(true);
        expect(plan.atmospheres[0].id).toBe('atm-1');
        expect(plan.tuilesDeLumiere.map(t => t.id)).toEqual(['SCENE_c-br_02', 'SCENE_c-br_03']);
    });

    it('les sons venus du disque pointent vers leur média entré ; le reste ne bouge pas', () => {
        const plan = planifierLImportDesMedias(state, 'c-2049', MAGASINS.scenes, neuf);
        const pointe = pointerVersLesMediasEntres(plan, { 'D:/Sons/sirene.mp3': 'm-sirene', 'D:/Musique/tears.mp3': 'm-tears' });
        expect(pointe.atmospheres[0].pads.PAD_01.filePath).toBe('m-orage');
        expect(pointe.atmospheres[0].pads.PAD_02.filePath).toBe('m-sirene');
        expect(pointe.playlists[0].pads[0].url).toBe('m-tears');
        expect(pointe.playlists[0].pads[1].url).toBe('https://youtu.be/x');
    });

    it('l’archive n’est pas modifiée', () => {
        planifierLImportDesMedias(state, 'c-2049', MAGASINS.scenes, neuf);
        expect((state as NexusMediasState).atmospheres[0].id).toBe('atm-1');
    });
});

describe('Image-OS : ce que la campagne utilise, et rien d’autre (décision de David, 19/10)', () => {
    const img = (id: string, path: string, folderId: string | null = null) => ({ id, name: id, path, folderId }) as ImageMedia;
    const BIBLIOTHEQUE = {
        mediaList: [
            img('io-tyrell', 'm-tyrell', 'dos-br'),
            img('io-rue', 'D:/Images/rue.png', 'dos-villes'),
            img('io-pluie', 'm-pluie'),
            img('io-loge', 'm-loge'),
            img('io-nephilim', 'm-ailleurs', 'dos-nephilim'),
        ],
        folders: [
            { id: 'dos-br', name: 'Blade Runner', parentId: null },
            { id: 'dos-villes', name: 'Villes', parentId: 'dos-br' },
            { id: 'dos-nephilim', name: 'Nephilim', parentId: null },
        ] as ImageFolder[],
        diaporamas: [
            { id: 'dia-ville', nom: 'La ville', imageIds: ['io-rue', 'io-tyrell'], dureeParImageMs: 6000 },
            { id: 'dia-autre', nom: 'Ailleurs', imageIds: ['io-nephilim'], dureeParImageMs: 6000 },
        ] as Diaporama[],
    };
    const MOMENTS = [
        { id: 'mo-1', campaignId: 'c-br', name: 'Arrivée', diaporamaId: 'dia-ville' },
        { id: 'mo-2', campaignId: 'c-br', name: 'Bureau', imageMediaId: 'io-loge' },
        { id: 'mo-3', campaignId: 'c-nephilim', name: 'Ailleurs', diaporamaId: 'dia-autre' },
    ] as unknown as StoryboardMoment[];

    const tenu = ceQuImageOsTientPourLaCampagne('c-br', MOMENTS, BIBLIOTHEQUE, new Set(['m-pluie']));

    it('les images que ses moments appellent, celles de ses diaporamas, et celles dont le média est étiqueté pour elle', () => {
        expect(tenu.images.map(i => i.id)).toEqual(['io-tyrell', 'io-rue', 'io-pluie', 'io-loge']);
        expect(tenu.diaporamas.map(d => d.id)).toEqual(['dia-ville']);
    });

    it('les dossiers qui les rangent, parents compris — pas ceux d’une autre campagne', () => {
        expect(tenu.dossiers.map(d => d.id).sort()).toEqual(['dos-br', 'dos-villes']);
    });

    it('dans l’archive : les médias du hub qu’Image-OS désigne partent, le fichier du disque est copié', () => {
        const { state, fichiers } = rassemblerLesMedias(BR, {
            ...MAGASINS,
            mediaList: [...MAGASINS.mediaList, media('m-tyrell', []), media('m-loge', [])],
            imageOs: BIBLIOTHEQUE, moments: MOMENTS,
        });
        expect(state.medias.map(m => m.id)).toEqual(['m-pluie', 'm-orage', 'm-tyrell', 'm-loge']);
        expect(fichiers).toContain('D:/Images/rue.png');
        expect(recenserLesMedias(state)).toContainEqual({ libelle: "images d'Image-OS", nombre: 4 });
        expect(recenserLesMedias(state)).toContainEqual({ libelle: 'diaporamas', nombre: 1 });
    });

    it('à l’import, l’image venue du disque pointe vers son média entré', () => {
        const { state } = rassemblerLesMedias(BR, { ...MAGASINS, imageOs: BIBLIOTHEQUE, moments: MOMENTS });
        const plan = pointerVersLesMediasEntres(planifierLImportDesMedias(state, 'c-2049', {}), { 'D:/Images/rue.png': 'm-rue' });
        expect(plan.imageOs!.images.find(i => i.id === 'io-rue')!.path).toBe('m-rue');
    });

    it('Image-OS reçoit ce qui manque, et ne remplace rien de ce qui est déjà là', () => {
        const local = {
            mediaList: [img('io-tyrell', 'm-tyrell-retouche')],
            folders: [] as ImageFolder[],
            diaporamas: [{ id: 'dia-ville', nom: 'La ville (version du poste)', imageIds: ['io-tyrell'], dureeParImageMs: 4000 }] as Diaporama[],
        };
        const r = completerImageOs(local, tenu);
        expect(r.mediaList.find(i => i.id === 'io-tyrell')!.path).toBe('m-tyrell-retouche');
        expect(r.diaporamas.find(d => d.id === 'dia-ville')!.nom).toBe('La ville (version du poste)');
        expect(r.ajouts).toEqual({ images: 3, dossiers: 2, diaporamas: 0 });
    });
});
