import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { BrainstormOverlay } from './BrainstormOverlay';
import { useBrainstormStore, abandonnerLaRequete } from '../store/useBrainstormStore';
import { forgeService, type InventaireForge } from '../../ForgeService';
import { useModalStore } from '../../../../stores/useModalStore';

vi.mock('../../ForgeService', () => ({ forgeService: { discoverCandidates: vi.fn(), inventaireDeSupplement: vi.fn() } }));
vi.mock('../../../session/useSessionOSStore', () => ({
    useSessionOSStore: (selecteur: (etat: { setCurrentView: () => void }) => unknown) =>
        selecteur({ setCurrentView: vi.fn() }),
}));
vi.mock('../../../../store/useSessionStore', () => ({
    useSessionStore: (selecteur: (etat: { setActiveModule: () => void }) => unknown) =>
        selecteur({ setActiveModule: vi.fn() }),
}));
// La liste réduite à ses deux gestes de requête : abandonner, redemander l'inventaire.
vi.mock('./DiscoveryUI', () => ({
    default: (p: { onAbandon?: () => void; onRelancer?: () => void }) => (
        <div>Inventaire
            <button onClick={p.onAbandon}>abandonner</button>
            {p.onRelancer && <button onClick={p.onRelancer}>redemander</button>}
        </div>
    ),
}));

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

    /*
     * David, le 06/11/2026, sur COC : un sujet libre déjà inventorié se fondait dans la liste,
     * sans un mot — « il n'y a rien qui se passe dans la forge ». Il passe en tête, marqué.
     */
    it('un sujet libre déjà dans la liste passe en tête, marqué, sans se dédoubler', async () => {
        lire.mockResolvedValue(inventaire);
        render(<BrainstormOverlay />);
        await waitFor(() => expect(useBrainstormStore.getState().candidates.length).toBeGreaterThan(0));
        act(() => useBrainstormStore.getState().setCustomSubject('Poursuites'));
        await waitFor(() => expect(useBrainstormStore.getState().candidates[0].id).toBe('poursuites'));
        const { candidates } = useBrainstormStore.getState();
        expect(candidates[0].tags).toContain('sujet libre retrouvé');
        expect(candidates.filter(c => c.id === 'poursuites')).toHaveLength(1);
        expect(candidates.slice(1).some(c => c.tags.includes('sujet libre retrouvé'))).toBe(false);
    });

    /*
     * Audit du parcours de l'atelier, 06/11/2026 (défaut A) : sur un jeu sans inventaire enregistré,
     * « Abandonner » pendant le premier inventaire le relançait aussitôt — la liste vide et l'atelier
     * sans erreur ressemblaient à une ouverture.
     */
    it('abandonner le premier inventaire ne le relance pas ; « redemander » le relance', async () => {
        vi.mocked(forgeService.discoverCandidates).mockImplementation(() => new Promise(() => {}));
        render(<BrainstormOverlay />);
        await waitFor(() => expect(forgeService.discoverCandidates).toHaveBeenCalledTimes(1));
        act(() => screen.getByText('abandonner').click());
        await act(async () => { await new Promise(r => setTimeout(r, 30)); });
        expect(forgeService.discoverCandidates).toHaveBeenCalledTimes(1);
        act(() => screen.getByText('redemander').click());
        await waitFor(() => expect(forgeService.discoverCandidates).toHaveBeenCalledTimes(2));
    });

    /* Défaut B : « Actualiser » relisait le même fichier ; il redemande l'inventaire au carnet. */
    it('livre de base : « redemander » interroge le carnet même quand un inventaire est sur le disque', async () => {
        lire.mockResolvedValue(inventaire);
        vi.mocked(forgeService.discoverCandidates).mockResolvedValue({ inventaire, candidats: [] });
        render(<BrainstormOverlay />);
        await waitFor(() => expect(useBrainstormStore.getState().candidates.length).toBeGreaterThan(0));
        expect(forgeService.discoverCandidates).not.toHaveBeenCalled();
        act(() => screen.getByText('redemander').click());
        // La liste n'est pas vide : une confirmation d'abord.
        await waitFor(() => expect(useModalStore.getState().type).toBe('confirm'));
        expect(forgeService.discoverCandidates).not.toHaveBeenCalled();
        act(() => { useModalStore.getState().onConfirm?.(); });
        await waitFor(() => expect(forgeService.discoverCandidates).toHaveBeenCalledTimes(1));
    });

    it('un sujet libre inédit reçoit sa propre marque', async () => {
        lire.mockResolvedValue(inventaire);
        render(<BrainstormOverlay />);
        await waitFor(() => expect(useBrainstormStore.getState().candidates.length).toBeGreaterThan(0));
        act(() => useBrainstormStore.getState().setCustomSubject('Voyages interstellaires'));
        await waitFor(() => expect(useBrainstormStore.getState().candidates[0].tags).toEqual(['hors canevas', 'sujet libre']));
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

describe('BrainstormOverlay — relecture : ce que les lecteurs liront (F1, 06/11/2026)', () => {
    const origine = useBrainstormStore.getState();
    const pontInitial = window.appBridge;
    const carte = (slug: string, content: string) => ({
        id: slug, slug, title: slug, category: 'rule' as const, summary: '', tags: [], content,
        systemId: 'coc', forgedAt: 0, sections: [], avertissements: [],
    });

    beforeEach(() => {
        window.appBridge = { ai: { listSystems: vi.fn(async () => ['coc']), listDir: vi.fn(async () => []), readDoc: vi.fn(async () => null) } } as unknown as typeof window.appBridge;
    });
    afterEach(() => {
        useBrainstormStore.setState(origine, true);
        window.appBridge = pontInitial;
    });

    it('une fiche d’équipement en prose : l’alerte, sans refus', () => {
        useBrainstormStore.setState({ ...origine, step: 'review', corpusCible: 'coc',
            activeCard: carte('equipements-et-objets', '---\nsujet: Equipements et Objets\n---\n\n## Valeurs\n- Gilet rigide : RD 8, malus -4\n') });
        render(<BrainstormOverlay />);
        // i18n n'est pas chargé dans les essais : on lit la clé.
        expect(screen.getByRole('alert').textContent).toBe('session.forge_module.atelier.lecteurs_alerte_equipement');
    });

    it('une fiche à tableaux : ce que le catalogue lira, par famille', () => {
        useBrainstormStore.setState({ ...origine, step: 'review', corpusCible: 'coc',
            activeCard: carte('armes', '---\nsujet: Armes\n---\n\n### Tableau des Armes de contact (p. 93)\n\n| Arme | DM |\n|:--- |:--- |\n| **Machette** | 1d6+1+FOR |\n| **Fouet** | 1d4+FOR |\n') });
        render(<BrainstormOverlay />);
        const bilan = document.querySelector('[data-bilan-des-lecteurs]');
        expect(bilan?.textContent).toContain('session.forge_module.atelier.lecteurs_equipement');
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
