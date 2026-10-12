import { describe, it, expect } from 'vitest';
import { indiceProjete, premiereFoisVu, scenesEntreesEnCours } from './ecranDeScene';
import type { Scene } from '../../../types/trame.types';

const scene = (id: string, patch: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c-1', acteId: 'a-1', ordre: 0, titre: id, resume: '', origine: 'preparee',
    entiteIds: [], indiceIds: [], creeeLe: 1, ...patch,
});
const enCours = (id: string, patch: Partial<Scene> = {}) => scene(id, { passages: [{ debut: 10 }], ...patch });
const enPause = (id: string) => scene(id, { passages: [{ debut: 10, fin: 20 }] });

describe('scenesEntreesEnCours — ce qui ouvre l’écran', () => {
    it('une scène qui commence', () => {
        expect(scenesEntreesEnCours([scene('A')], [enCours('A')])).toEqual(['A']);
    });

    it('une scène reprise après une pause', () => {
        expect(scenesEntreesEnCours([enPause('A')], [scene('A', { passages: [{ debut: 10, fin: 20 }, { debut: 30 }] })])).toEqual(['A']);
    });

    it('⛔ rien pour une scène qui APPARAÎT déjà en cours — une sauvegarde rechargée', () => {
        expect(scenesEntreesEnCours([], [enCours('A')])).toEqual([]);
        expect(scenesEntreesEnCours([scene('autre')], [scene('autre'), enCours('A')])).toEqual([]);
    });

    it('rien pour une scène déjà en cours qui change de titre, ni pour une scène qu’on termine', () => {
        expect(scenesEntreesEnCours([enCours('A')], [enCours('A', { titre: 'Autre' })])).toEqual([]);
        expect(scenesEntreesEnCours([enCours('A')], [enCours('A', { termineeLe: 30 })])).toEqual([]);
    });
});

describe('premiereFoisVu — la trace du PNJ rencontré', () => {
    const pnj = { id: 'luv', campaignId: 'c-1' };

    it('retient la scène donnée', () => {
        expect(premiereFoisVu(pnj, [], 5, 'sc-x')).toEqual({ le: 5, sceneId: 'sc-x' });
    });

    it('sinon la scène en cours qui le compte parmi ses PNJ', () => {
        const scenes = [scene('prevue', { entiteIds: ['luv'] }), enCours('ici', { entiteIds: ['luv'] }), enCours('ailleurs')];
        expect(premiereFoisVu(pnj, scenes, 5)).toEqual({ le: 5, sceneId: 'ici' });
    });

    it('sinon la date seule — mieux qu’une scène devinée', () => {
        expect(premiereFoisVu(pnj, [enCours('ailleurs')], 5)).toEqual({ le: 5 });
    });
});

describe('indiceProjete', () => {
    it('porte l’image sous les deux noms que lisent les écrans', () => {
        expect(indiceProjete({ id: 'i', title: 'La photo', content: 'Floue.', mediaUrl: 'photo.png' }))
            .toMatchObject({ id: 'i', name: 'La photo', description: 'Floue.', imageUrl: 'photo.png', avatar: 'photo.png' });
    });
});
