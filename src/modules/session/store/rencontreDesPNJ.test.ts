import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionOSStore } from '../useSessionOSStore';
import { useImageStore } from '../../image/useImageStore';
import type { Scene } from '../../../types/trame.types';
import type { Entity } from '../../../types/entity.types';

/*
  « Projeter = rencontrer » (David, 2026-10-13). Il ne voyait pas où marquer
  un PNJ rencontré depuis la galerie : la marque ne venait que de « Montré aux
  joueurs ». Projeter son portrait la pose désormais aussi, la première fois.
*/
const initial = useSessionOSStore.getState();
const SCENE: Scene = {
    id: 'sc-1', campaignId: 'c-1', acteId: 'a-1', ordre: 0, titre: 'L’entrepôt', resume: '',
    origine: 'preparee', entiteIds: ['luv'], indiceIds: [], creeeLe: 1, passages: [{ debut: 1 }],
};
const luv = { id: 'luv', name: 'Luv', campaignId: 'c-1', type: 'npc', role: 'boss', avatar: 'http://192.168.0.10:3001/temp/luv.png' } as Entity;
const deckard = { id: 'deckard', name: 'Deckard', campaignId: 'c-1', type: 'pc', role: 'ally', avatar: '' } as Entity;

const entite = (id: string) => useSessionOSStore.getState().entities.find(e => e.id === id);

beforeEach(() => {
    useSessionOSStore.setState({ activeCampaignId: 'c-1', scenes: [SCENE], entities: [luv, deckard] });
});

afterEach(() => {
    useSessionOSStore.setState(initial, true);
});

describe('marquerRencontre', () => {
    it('retient la rencontre avec la scène en cours, sans montrer le PNJ aux tablettes', () => {
        useSessionOSStore.getState().marquerRencontre('luv');
        expect(entite('luv')?.vuParLesJoueurs?.sceneId).toBe('sc-1');
        expect(entite('luv')?.isVisibleByPlayers).toBeFalsy();
    });

    it('garde la première rencontre', () => {
        useSessionOSStore.setState({ entities: [{ ...luv, vuParLesJoueurs: { le: 5 } }, deckard] });
        useSessionOSStore.getState().marquerRencontre('luv', 'sc-1');
        expect(entite('luv')?.vuParLesJoueurs).toEqual({ le: 5 });
    });

    it('ne marque jamais un PJ', () => {
        useSessionOSStore.getState().marquerRencontre('deckard');
        expect(entite('deckard')?.vuParLesJoueurs).toBeUndefined();
    });
});

describe('projeter un PNJ', () => {
    beforeEach(() => {
        useImageStore.setState({ projectionTarget: 'hub', projections: {}, imagePrecedente: {}, projectedEntity: null });
        (window as unknown as { appBridge: unknown }).appBridge = {
            image: { syncHubData: vi.fn(), launchDisplay: vi.fn() },
        };
    });

    afterEach(() => {
        delete (window as unknown as { appBridge?: unknown }).appBridge;
        useImageStore.setState({ projectionTarget: 'hub', projections: {}, imagePrecedente: {}, projectedEntity: null });
    });

    it('le marque rencontré une fois le portrait parti', async () => {
        await useImageStore.getState().projectEntity(luv);
        await vi.waitFor(() => expect(entite('luv')?.vuParLesJoueurs?.sceneId).toBe('sc-1'));
    });
});
