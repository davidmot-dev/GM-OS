import { describe, it, expect } from 'vitest';
import { rassemblerLesMedias, recenserLesMedias, planifierLImportDesMedias, pointerVersLesMediasEntres, type NexusMediasState } from './archiveDesMedias';
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
