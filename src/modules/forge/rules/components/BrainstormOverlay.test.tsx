import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { BrainstormOverlay } from './BrainstormOverlay';
import { useBrainstormStore, abandonnerLaRequete } from '../store/useBrainstormStore';
import { forgeService, type InventaireForge } from '../../ForgeService';

vi.mock('../../ForgeService', () => ({ forgeService: { discoverCandidates: vi.fn(), inventaireDeSupplement: vi.fn() } }));
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

/**
 * Le mode supplément — § 185 du registre, 01/11/2026. Ses fiches vont dans
 * `systems/alien/supplements/<slug>/`, et l'inventaire ne part jamais seul :
 * sans les sources restreintes au PDF du supplément, il lirait aussi le livre
 * de base.
 */
describe('BrainstormOverlay — supplément', () => {
    const origine = useBrainstormStore.getState();
    const pontInitial = window.appBridge;
    const fichiers = new Map<string, string>();
    const lire = vi.fn(async (chemin: string) => fichiers.get(chemin) ?? null);

    beforeEach(() => {
        vi.clearAllMocks();
        fichiers.clear();
        fichiers.set('systems/alien/supplements/supplements.json',
            JSON.stringify([{ slug: 'colonial-marines', titre: 'Colonial Marines Operations Manual' }]));
        abandonnerLaRequete();
        useBrainstormStore.setState({ ...origine, step: 'discovery', corpusCible: 'alien', notebookId: 'carnet-test',
            supplementCible: { slug: 'colonial-marines', titre: 'Colonial Marines Operations Manual' },
            selectedSourceIds: [], sourcesDuCarnet: [], candidates: [], inventaireBrut: null, customSubject: '',
            isProcessing: false, error: null });
        window.appBridge = { ai: {
            listSystems: vi.fn(async () => ['alien']), listDir: vi.fn(async () => []), readDoc: lire,
        } } as unknown as typeof window.appBridge;
    });

    afterEach(() => {
        abandonnerLaRequete();
        useBrainstormStore.setState(origine, true);
        window.appBridge = pontInitial;
    });

    it('n’interroge pas le carnet de lui-même, et prévient qu’aucune source n’est retenue', async () => {
        render(<BrainstormOverlay />);
        // Le livre se choisit dans le panneau de gauche ; l'atelier dit où il écrit.
        expect(await screen.findByText('systems/alien/supplements/colonial-marines')).toBeTruthy();
        expect(screen.getByText(/Aucune source retenue/)).toBeTruthy();
        await waitFor(() => expect(lire).toHaveBeenCalledWith('systems/alien/supplements/colonial-marines/sujets.json'));
        expect(forgeService.inventaireDeSupplement).not.toHaveBeenCalled();
        expect(forgeService.discoverCandidates).not.toHaveBeenCalled();
    });

    it('reprend les sujets retenus par David plutôt que la liste brute du carnet', async () => {
        fichiers.set('systems/alien/supplements/colonial-marines/sujets.json',
            JSON.stringify([{ titre: 'Pistolets', mecanique: 'renommé par David', sections: ['Pistols'] }]));
        fichiers.set('systems/alien/supplements/colonial-marines/rules/inventaire-des-mecaniques.md',
            '| Sujet | Mécanique | Sections |\n|---|---|---|\n| Armes de poing (Pistols) | brut | Pistols |');
        render(<BrainstormOverlay />);
        await waitFor(() => expect(useBrainstormStore.getState().candidates.map(c => c.title)).toEqual(['Pistolets']));
        expect(forgeService.inventaireDeSupplement).not.toHaveBeenCalled();
    });
});
