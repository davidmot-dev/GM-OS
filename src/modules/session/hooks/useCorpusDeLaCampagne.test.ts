import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCorpusDeLaCampagne } from './useCorpusDeLaCampagne';

/**
 * **L'identifiant d'un pilote ne dit rien du jeu.**
 *
 * *Trouvé le 2026-08-30, en construisant la librairie de widgets de l'Ulanzi.*
 * La couture provisoire du 23/08 cherchait la sous-chaîne « blade » dans le nom
 * du jeu — un bricolage, mais un bricolage **qui marchait**. La remplacer par
 * une comparaison stricte sur `campaign.system` aurait été une régression
 * déguisée en propreté : la Forge fabrique les identifiants avec
 * `custom-${Date.now()}`, et *tous les pilotes de David sauf Dune* en portent un.
 *
 * Le défaut aurait été **muet** — une comparaison qui échoue rend simplement une
 * liste vide, et l'afficheur n'aurait plus rien montré sans que rien ne le dise.
 */

/**
 * `ai:list-systems` rend des **noms de dossiers nus**, pas des chemins — c'est
 * `readdir(docs/systems)` (voir `RAGEngine`). Le repli par nom affiché compare
 * ces noms au nom du pilote ; lui donner « systems/blade-runner » ferait échouer
 * la comparaison en silence, et le premier jet de ce test s'y est fait prendre.
 */
const listSystems = vi.fn(async () => ['dune', 'blade-runner', 'reves de dragons']);

beforeEach(() => {
    listSystems.mockClear();
    (window as unknown as { appBridge: unknown }).appBridge = { ai: { listSystems } };
    useSessionOSStore.setState({ campaigns: [], customGameDrivers: [], activeCampaignId: null });
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

/** Une campagne dont le pilote a été forgé : identifiant horodaté, nom parlant. */
const poser = (system: string, pilote?: { id: string; name: string; corpusId?: string }) => {
    useSessionOSStore.setState({
        activeCampaignId: 'c-9',
        campaigns: [{ id: 'c-9', name: 'Hadley Hope', system }] as never,
        customGameDrivers: (pilote ? [pilote] : []) as never,
    });
};

describe('le dossier du jeu de la campagne ouverte', () => {
    /** **Le test qui garde la régression.** */
    it('retrouve blade-runner derrière un identifiant forgé', async () => {
        poser('custom-1754000000000', {
            id: 'custom-1754000000000',
            name: 'Blade Runner',
            corpusId: 'blade-runner',
        });

        const { result } = renderHook(() => useCorpusDeLaCampagne());
        await waitFor(() => expect(result.current).toBe('blade-runner'));
    });

    /** Sans `corpusId`, le nom affiché désigne encore le bon dossier réel. */
    it('retrouve le dossier par le nom affiché du pilote', async () => {
        poser('custom-1754000000001', { id: 'custom-1754000000001', name: 'Blade Runner' });

        const { result } = renderHook(() => useCorpusDeLaCampagne());
        await waitFor(() => expect(result.current).toBe('blade-runner'));
    });

    /** Dune est le seul pilote livré : son identifiant dit déjà le jeu. */
    it('accepte un identifiant qui dit déjà le jeu', async () => {
        poser('dune');

        const { result } = renderHook(() => useCorpusDeLaCampagne());
        await waitFor(() => expect(result.current).toBe('dune'));
    });

    it('ne rend rien sans campagne ouverte', async () => {
        const { result } = renderHook(() => useCorpusDeLaCampagne());
        await waitFor(() => expect(listSystems).not.toHaveBeenCalled());
        expect(result.current).toBeNull();
    });

    /** Hors Electron, la résolution retombe sur l'identifiant. Elle ne casse pas. */
    it('survit à un pont absent', async () => {
        delete (window as unknown as { appBridge?: unknown }).appBridge;
        poser('dune');

        const { result } = renderHook(() => useCorpusDeLaCampagne());
        await waitFor(() => expect(result.current).toBe('dune'));
    });
});
