import { describe, it, expect } from 'vitest';
import { ecransDuMedia, occupantDeLEcran } from './ceQuiEstProjete';
import type { ImageMedia } from '../types';

/**
 * **Le badge de l'écran ne s'allumait jamais** : la projection inscrit le
 * `path` du média (son identifiant au Media Hub), la vignette comparait son
 * `id` de pad. Trouvé en réagençant Image-OS, le 2026-09-30.
 */
const PORTRAIT: ImageMedia = { id: 'pad-1', path: 'm-1757', name: 'portrait.png', isFavorite: false, folderId: null } as ImageMedia;
const DECOR: ImageMedia = { id: 'pad-2', path: 'm-2000', name: 'decor.png', isFavorite: false, folderId: null } as ImageMedia;

describe('les écrans d’un média', () => {
    it('reconnaît le média par le path que la projection inscrit', () => {
        expect(ecransDuMedia({ hub: 'm-1757', 'ecran-2': null }, PORTRAIT)).toEqual(['hub']);
    });

    it('et par son id, pour un instantané plus ancien', () => {
        expect(ecransDuMedia({ hub: 'pad-1' }, PORTRAIT)).toEqual(['hub']);
    });

    it('ne s’allume pas pour un autre média', () => {
        expect(ecransDuMedia({ hub: 'm-2000' }, PORTRAIT)).toEqual([]);
    });
});

describe('ce qui occupe un écran', () => {
    it('rien, quand l’écran montre son décor', () => {
        expect(occupantDeLEcran({ hub: null }, 'hub', [PORTRAIT], null)).toBe(null);
        expect(occupantDeLEcran({}, 'hub', [PORTRAIT], null)).toBe(null);
    });

    it('le média projeté, retrouvé dans la bibliothèque', () => {
        expect(occupantDeLEcran({ hub: 'm-2000' }, 'hub', [PORTRAIT, DECOR], null))
            .toEqual({ genre: 'media', media: DECOR });
    });

    it('la fiche, quand c’est elle qui tient l’écran', () => {
        const fiche = { id: 'pnj-7', name: 'Rachael' };
        expect(occupantDeLEcran({ hub: 'pnj-7' }, 'hub', [PORTRAIT], fiche))
            .toEqual({ genre: 'fiche', fiche });
    });

    it('un marqueur, nommé', () => {
        expect(occupantDeLEcran({ hub: '__whiteboard__' }, 'hub', [], null))
            .toEqual({ genre: 'marqueur', libelle: 'Tableau blanc' });
        expect(occupantDeLEcran({ hub: '__youtube__abc' }, 'hub', [], null))
            .toEqual({ genre: 'marqueur', libelle: 'YouTube' });
    });

    it('une adresse posée à la main, telle quelle', () => {
        expect(occupantDeLEcran({ hub: 'https://exemple.org/a.png' }, 'hub', [], null))
            .toEqual({ genre: 'adresse', adresse: 'https://exemple.org/a.png' });
    });
});
