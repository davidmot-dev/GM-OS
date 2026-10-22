import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CorpusDeCampagne } from '../../../../electron/corpusDeCampagne';

/**
 * **La campagne naît à la première publication** — David, 2026-10-22 : une
 * campagne neuve n'apparaissait dans « Mes campagnes » qu'une fois la Trame
 * écrite, alors que ses fiches étaient publiées depuis longtemps.
 */
const corpus: CorpusDeCampagne = { racine: 'campaigns/la-nuit-des-masques', id: 'la-nuit-des-masques', raison: 'convention', aCreer: true } as CorpusDeCampagne;
const publierLaFiche = vi.fn(async () => ({ publiee: true, ecartees: [] as string[] }));

vi.mock('./ServiceDeCampagne', () => ({
    serviceDeCampagne: {},
    etapesDeLaCampagne: () => [],
    corpusDeLaCampagne: vi.fn(async () => corpus),
    ecrireLeBrouillon: vi.fn(), ecrireLInventaire: vi.fn(), ecrireLaStructure: vi.fn(),
    publierLaFiche: (...a: unknown[]) => publierLaFiche(...(a as [])),
}));
vi.mock('./reprendreLAtelier', () => ({
    reprendreLAtelier: vi.fn(async () => ({
        publiees: new Set<string>(),
        brouillons: {
            'pnj-acte-1': {
                sujet: 'PNJ', horsCanevas: false, couverture: 'complète', sections: ['Acte 1'],
                slug: 'pnj-acte-1', markdown: '# PNJ', avertissements: [], reprise: true,
            },
        },
    })),
}));
vi.mock('../carnetNotebookLM', () => ({ listerLesCarnets: vi.fn(), listerLesSources: vi.fn() }));
vi.mock('../ForgeService', () => ({ forgeService: {} }));
vi.mock('../../ai/SelecteurDeMoteur', () => ({ SelecteurDeMoteur: () => null }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

import AtelierDeCampagne from './AtelierDeCampagne';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { Campaign } from '../../../types/campaign.types';

describe('Atelier de campagne — publier crée la campagne', () => {
    beforeEach(() => {
        publierLaFiche.mockClear();
        useSessionOSStore.setState({ campaigns: [] });
    });
    afterEach(cleanup);

    const publierUnBrouillon = async (nom: string) => {
        render(<AtelierDeCampagne />);
        fireEvent.change(screen.getByPlaceholderText(/titre de la campagne/), { target: { value: nom } });
        fireEvent.click(await screen.findByRole('button', { name: /Publier/ }));
        await waitFor(() => expect(publierLaFiche).toHaveBeenCalledTimes(1));
    };

    it('une campagne neuve entre dans « Mes campagnes » dès la première fiche publiée', async () => {
        await publierUnBrouillon('La Nuit des masques');
        await waitFor(() => expect(useSessionOSStore.getState().campaigns).toHaveLength(1));
        expect(useSessionOSStore.getState().campaigns[0]).toMatchObject({ name: 'La Nuit des masques', activeLocationIds: [] });
    });

    it('un homonyme à la casse près n’est pas doublé', async () => {
        useSessionOSStore.setState({ campaigns: [{ id: 'c-1', name: 'la nuit des masques', system: '', activeLocationIds: [] } as Campaign] });
        await publierUnBrouillon('La Nuit des masques');
        expect(useSessionOSStore.getState().campaigns.map(c => c.id)).toEqual(['c-1']);
    });
});
