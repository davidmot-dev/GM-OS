import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { createCampaignSlice, type CampaignSlice } from '../store/campaignSlice';
import type { Campaign } from '../../../types/campaign.types';

vi.mock('./SessionBackupManager', () => ({ sessionBackupManager: {} }));
vi.mock('../useObsidianStore', () => ({ useObsidianStore: {} }));

describe('déplacement groupé de Trame', () => {
    it('fusionne les positions en une écriture et protège les campagnes figées et les coordonnées invalides', () => {
        const store = createStore<CampaignSlice>()(createCampaignSlice);
        const a: Campaign = { id: 'a', name: 'A', system: 'test', activeLocationIds: [],
            noeudsEpinglesDeLaTrame: { autre: { x: 1, y: 2 } }, stylesDesLiensDeTrame: { lien: { couleur: 'accent' } } };
        const b = { ...a, id: 'b' }; store.setState({ campaigns: [a, b] });
        let ecritures = 0; store.subscribe(() => ecritures++);
        const places = { scene: { x: 10, y: 20 }, pnj: { x: 50, y: 80 }, invalide: { x: NaN, y: 9 } };
        store.getState().epinglerPlusieursDansLaTrame('a', places);
        expect(ecritures).toBe(1);
        expect(store.getState().campaigns[0]).toEqual({ ...a, noeudsEpinglesDeLaTrame: { autre: { x: 1, y: 2 }, scene: { x: 10, y: 20 }, pnj: { x: 50, y: 80 } } });
        expect(store.getState().campaigns[1]).toBe(b);
        places.scene.x = 999; expect(store.getState().campaigns[0].noeudsEpinglesDeLaTrame?.scene.x).toBe(10);
        store.getState().epinglerPlusieursDansLaTrame('a', { scene: { x: 10, y: 20 } });
        store.getState().epinglerPlusieursDansLaTrame('absente', places);
        store.getState().epinglerPlusieursDansLaTrame('a', {}); expect(ecritures).toBe(1);
        store.getState().figerLeGrapheDeTrame('a', { scene: { x: 10, y: 20 } }); const fige = store.getState();
        store.getState().epinglerPlusieursDansLaTrame('a', places); expect(store.getState()).toBe(fige);
    });
});
