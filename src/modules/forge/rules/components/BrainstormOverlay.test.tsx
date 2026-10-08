import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { BrainstormOverlay } from './BrainstormOverlay';
import { useBrainstormStore, abandonnerLaRequete } from '../store/useBrainstormStore';
import { forgeService, type InventaireForge } from '../../ForgeService';

vi.mock('../../ForgeService', () => ({ forgeService: { discoverCandidates: vi.fn() } }));
vi.mock('../../../session/useSessionOSStore', () => ({
    useSessionOSStore: (selecteur: (etat: { setCurrentView: () => void }) => unknown) =>
        selecteur({ setCurrentView: vi.fn() }),
}));
vi.mock('../../../../store/useSessionStore', () => ({
    useSessionStore: (selecteur: (etat: { setActiveModule: () => void }) => unknown) =>
        selecteur({ setActiveModule: vi.fn() }),
}));
vi.mock('./DiscoveryUI', () => ({ default: () => <div>Inventaire</div> }));

const inventaire = '| Sujet | Traité | Mécanique | Sections |\n|---|---|---|---|\n| Résolution des jets | oui | 2d20 | Agir |';

describe('BrainstormOverlay — dépendances de la découverte', () => {
    const origine = useBrainstormStore.getState();
    const pontInitial = window.appBridge;
    const lire = vi.fn<() => Promise<string | null>>(async () => null);

    beforeEach(() => {
        vi.clearAllMocks();
        lire.mockResolvedValue(null);
        abandonnerLaRequete();
        useBrainstormStore.setState({ ...origine, step: 'discovery', corpusCible: 'dune', notebookId: 'carnet-test',
            selectedSourceIds: ['source-test'], candidates: [], inventaireBrut: null, customSubject: '',
            isProcessing: false, error: null });
        window.appBridge = { ai: {
            listSystems: vi.fn(async () => ['dune']), listDir: vi.fn(async () => []), readDoc: lire,
        } } as unknown as typeof window.appBridge;
    });

    afterEach(() => {
        abandonnerLaRequete();
        useBrainstormStore.setState(origine, true);
        window.appBridge = pontInitial;
    });

    it('ne lance qu’une requête et applique aussi le sujet saisi pendant son attente', async () => {
        let terminer!: (resultat: InventaireForge) => void;
        vi.mocked(forgeService.discoverCandidates).mockImplementation(() =>
            new Promise(resolve => { terminer = resolve; }));
        render(<BrainstormOverlay />);
        await waitFor(() => expect(forgeService.discoverCandidates).toHaveBeenCalledTimes(1));
        act(() => useBrainstormStore.getState().setCustomSubject('Voyages interstellaires'));
        await act(async () => { terminer({ inventaire, candidats: [] }); });
        await waitFor(() => expect(useBrainstormStore.getState().candidates[0].title).toBe('Voyages interstellaires'));
        expect(forgeService.discoverCandidates).toHaveBeenCalledTimes(1);
        expect(forgeService.discoverCandidates).toHaveBeenCalledWith('carnet-test', ['source-test']);
        expect(useBrainstormStore.getState().isProcessing).toBe(false);
    });

    it('reprend l’inventaire sur disque et actualise le sujet sans interroger le carnet', async () => {
        lire.mockResolvedValue(inventaire);
        render(<BrainstormOverlay />);
        await waitFor(() => expect(useBrainstormStore.getState().candidates.length).toBeGreaterThan(0));
        act(() => useBrainstormStore.getState().setCustomSubject('Voyages interstellaires'));
        await waitFor(() => expect(useBrainstormStore.getState().candidates[0].title).toBe('Voyages interstellaires'));
        expect(forgeService.discoverCandidates).not.toHaveBeenCalled();
    });
});
