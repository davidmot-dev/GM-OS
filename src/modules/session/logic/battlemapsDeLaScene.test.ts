import { describe, it, expect } from 'vitest';
import { ajouterLaBattlemap, battlemapsDeLaScene, battlemapsDuLieu, retirerLaBattlemap } from './battlemapsDeLaScene';
import { fusionnerLesScenes, secondeMoitieDeLaScene } from './trame';
import type { AtlasMap } from '../../../types/chronicle.types';
import type { Scene } from '../../../types/trame.types';

/*
  L5 (2026-10-12) : *« il y a plusieurs choses dans les lieux : le lieu même,
  généralement une image, et des battlemaps qui doivent être chargées dans
  Map-OS »*. Le lieu propose ses battlemaps ; la scène en ajoute ou en écarte.
*/
const carte = (id: string, type: AtlasMap['type'], liens: string[] = []): AtlasMap => ({
    id, name: id, fileUrl: `${id}.jpg`, isVideo: false, type, narrativeDescription: '', gmNotes: '',
    campaignId: 'c-1', linkedEntities: liens.map(mapId => ({ id: `l-${mapId}`, name: mapId, category: 'lieu', mapId })),
});
const ATLAS = [
    carte('palais', 'city', ['hall', 'salle', 'ville-voisine']),
    carte('hall', 'battlemap'), carte('salle', 'battlemap'), carte('ville-voisine', 'city'),
    carte('egouts', 'battlemap'),
];
const scene = (patch: Partial<Scene> = {}): Scene => ({
    id: 's', campaignId: 'c-1', acteId: 'a', ordre: 0, titre: 's', resume: '', origine: 'preparee',
    entiteIds: [], indiceIds: [], creeeLe: 1, lieuId: 'palais', ...patch,
});
const noms = (cartes: AtlasMap[]) => cartes.map(c => c.id);

describe('battlemapsDeLaScene', () => {
    it('le lieu propose ses liens de type battlemap — pas les autres lieux liés', () => {
        expect(noms(battlemapsDuLieu(ATLAS[0], ATLAS))).toEqual(['hall', 'salle']);
        expect(noms(battlemapsDeLaScene(scene(), ATLAS))).toEqual(['hall', 'salle']);
    });

    it('la scène en ajoute et en écarte, sans toucher au lieu', () => {
        let s = scene();
        s = { ...s, ...ajouterLaBattlemap(s, 'egouts') };
        s = { ...s, ...retirerLaBattlemap(s, 'hall', ATLAS) };
        expect(noms(battlemapsDeLaScene(s, ATLAS))).toEqual(['salle', 'egouts']);
        expect(s.battlemapsRetirees).toEqual(['hall']);
        expect(ATLAS[0].linkedEntities).toHaveLength(3);
    });

    it('rajouter une battlemap écartée la fait revenir, retirer une ajoutée l’enlève', () => {
        let s = scene({ battlemapIds: ['egouts'], battlemapsRetirees: ['hall'] });
        s = { ...s, ...ajouterLaBattlemap(s, 'hall') };
        expect(s.battlemapsRetirees).toBeUndefined();
        s = { ...s, ...retirerLaBattlemap(s, 'egouts', ATLAS) };
        expect(s.battlemapIds).toBeUndefined();
        expect(noms(battlemapsDeLaScene(s, ATLAS))).toEqual(['hall', 'salle']);
    });

    it('sans lieu, seulement les battlemaps ajoutées ; une carte disparue est ignorée', () => {
        expect(noms(battlemapsDeLaScene(scene({ lieuId: undefined, battlemapIds: ['egouts', 'efface'] }), ATLAS)))
            .toEqual(['egouts']);
    });

    it('la fusion réunit les ajoutées, la scission les recopie', () => {
        const f = fusionnerLesScenes(scene({ battlemapIds: ['egouts'] }), scene({ id: 't', battlemapIds: ['hall'] }));
        expect(f.battlemapIds).toEqual(['egouts', 'hall']);
        const moitie = secondeMoitieDeLaScene(scene({ battlemapIds: ['egouts'], battlemapsRetirees: ['hall'] }), 'u', 'u', 1, 2);
        expect(moitie.battlemapIds).toEqual(['egouts']);
        expect(moitie.battlemapsRetirees).toEqual(['hall']);
    });
});
