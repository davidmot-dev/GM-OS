import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useLayoutEffect } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCorrespondanceDuJeu } from './useCorrespondanceDuJeu';
import { chargerLaCorrespondance } from './chargerLaCorrespondance';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';
import type { PlayerCharacter } from '../../types/player.types';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';

vi.mock('./chargerLaCorrespondance', () => ({ chargerLaCorrespondance: vi.fn() }));
const charger = vi.mocked(chargerLaCorrespondance);
const dossiers = vi.fn<() => Promise<string[]>>();
const tableA: CorrespondanceDeFiche = { version: 1, gabaritDeLaFiche: 'alpha', champs: [] };
const tableB: CorrespondanceDeFiche = { version: 1, gabaritDeLaFiche: 'beta', champs: [] };
const personnageA: PlayerCharacter = {
    id: 'pj-a', name: 'Ada', portraitUrl: '', campaignId: 'a', systemId: 'sys-a', templateId: 'tpl-a', sheetData: {},
};
const personnageB: PlayerCharacter = {
    ...personnageA, id: 'pj-b', name: 'Béa', campaignId: 'b', systemId: 'sys-b', templateId: 'tpl-b',
};
function enAttente<T>() {
    let resoudre!: (valeur: T) => void;
    const promesse = new Promise<T>(resolve => { resoudre = resolve; });
    return { promesse, resoudre };
}
beforeEach(() => {
    dossiers.mockReset().mockResolvedValue([]);
    charger.mockReset().mockImplementation(async racine => racine === 'systems/alpha' ? tableA : tableB);
    vi.stubGlobal('appBridge', { ai: { listSystems: dossiers } });
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'b',
        campaigns: [
            { id: 'a', name: 'Alpha', system: 'sys-a', activeLocationIds: [] },
            { id: 'b', name: 'Beta', system: 'sys-b', activeLocationIds: [] },
        ],
        customGameDrivers: [
            { ...DEFAULT_GAME_DRIVERS[0], id: 'sys-a', name: 'Alpha', corpusId: 'alpha', templateId: 'tpl-a' },
            { ...DEFAULT_GAME_DRIVERS[0], id: 'sys-b', name: 'Beta', corpusId: 'beta', templateId: 'tpl-b' },
        ],
    });
});
afterEach(() => vi.unstubAllGlobals());

describe('la correspondance du personnage courant', () => {
    it('ne lit rien sans personnage', () => {
        const { result, rerender } = renderHook((pj: PlayerCharacter | null | undefined) => useCorrespondanceDuJeu(pj),
            { initialProps: undefined });
        expect(result.current).toBeNull();
        rerender(null);
        expect(dossiers).not.toHaveBeenCalled();
        expect(charger).not.toHaveBeenCalled();
    });

    it.each([
        ['jeu déclaré', personnageA],
        ['gabarit ancien', { ...personnageA, systemId: undefined }],
        ['campagne du personnage', { ...personnageA, systemId: undefined, templateId: 'inconnu' }],
    ])('résout le %s plutôt que la campagne active', async (_nom, pj) => {
        const { result } = renderHook(() => useCorrespondanceDuJeu(pj));
        await waitFor(() => expect(result.current).toBe(tableA));
        expect(charger).toHaveBeenCalledWith('systems/alpha');
    });

    it('masque immédiatement une table lors du changement ou du retrait du personnage', async () => {
        const rendus: Array<CorrespondanceDeFiche | null> = [];
        const { result, rerender } = renderHook((pj: PlayerCharacter | null) => {
            const table = useCorrespondanceDuJeu(pj);
            useLayoutEffect(() => { rendus.push(table); });
            return table;
        }, { initialProps: personnageA as PlayerCharacter | null });
        await waitFor(() => expect(result.current).toBe(tableA));
        const attente = enAttente<CorrespondanceDeFiche | null>();
        charger.mockReturnValueOnce(attente.promesse);
        rendus.length = 0;
        rerender(personnageB);
        expect(rendus).toEqual([null]);
        await act(async () => attente.resoudre(tableB));
        expect(result.current).toBe(tableB);
        rendus.length = 0;
        rerender(null);
        expect(rendus).toEqual([null]);
    });

    it('ignore une ancienne lecture de table arrivée après la nouvelle', async () => {
        const attenteA = enAttente<CorrespondanceDeFiche | null>();
        charger.mockReturnValueOnce(attenteA.promesse);
        const { result, rerender } = renderHook(pj => useCorrespondanceDuJeu(pj), { initialProps: personnageA });
        await waitFor(() => expect(charger).toHaveBeenCalledTimes(1));
        rerender(personnageB);
        await waitFor(() => expect(result.current).toBe(tableB));
        await act(async () => attenteA.resoudre(tableA));
        expect(result.current).toBe(tableB);
        expect(console.info).toHaveBeenCalledTimes(1);
    });

    it('abandonne une résolution obsolète avant de lire la table', async () => {
        const attente = enAttente<string[]>();
        dossiers.mockReturnValueOnce(attente.promesse);
        const { result, rerender } = renderHook(pj => useCorrespondanceDuJeu(pj), { initialProps: personnageA });
        rerender(personnageB);
        await waitFor(() => expect(result.current).toBe(tableB));
        await act(async () => attente.resoudre([]));
        expect(charger).toHaveBeenCalledTimes(1);
        expect(charger).toHaveBeenCalledWith('systems/beta');
    });

    it('garde la table pendant une édition des données et un changement de campagne sans effet sur le jeu', async () => {
        const { result, rerender } = renderHook(pj => useCorrespondanceDuJeu(pj), { initialProps: personnageA });
        await waitFor(() => expect(result.current).toBe(tableA));
        rerender({ ...personnageA, sheetData: { force: 7 }, playerNotes: 'Note' });
        act(() => useSessionOSStore.setState(s => ({
            activeCampaignId: 'a', campaigns: s.campaigns.map(c => ({ ...c, name: 'Renommée' })),
            customGameDrivers: s.customGameDrivers.map(d => ({ ...d, description: 'Description modifiée' })),
        })));
        expect(result.current).toBe(tableA);
        expect(dossiers).toHaveBeenCalledTimes(1);
        expect(charger).toHaveBeenCalledTimes(1);
    });

    it('relit une nouvelle racine même pour le même personnage', async () => {
        const { result } = renderHook(() => useCorrespondanceDuJeu(personnageA));
        await waitFor(() => expect(result.current).toBe(tableA));
        act(() => useSessionOSStore.setState(s => ({
            campaigns: s.campaigns.map(c => c.id === 'a' ? { ...c, systemPath: 'systems/beta' } : c),
        })));
        await waitFor(() => expect(result.current).toBe(tableB));
        expect(charger).toHaveBeenLastCalledWith('systems/beta');
    });

    it('rend null sans table et après une panne de résolution, sans rejet non traité', async () => {
        charger.mockResolvedValueOnce(null);
        const { result, rerender } = renderHook(pj => useCorrespondanceDuJeu(pj), { initialProps: personnageA });
        await waitFor(() => expect(charger).toHaveBeenCalledTimes(1));
        expect(result.current).toBeNull();
        dossiers.mockRejectedValueOnce(new Error('indisponible'));
        rerender(personnageB);
        await waitFor(() => expect(console.error).toHaveBeenCalledOnce());
        expect(result.current).toBeNull();
        expect(charger).toHaveBeenCalledTimes(1);
    });

    it('ne lit plus la table si le composant se ferme pendant la résolution', async () => {
        const attente = enAttente<string[]>();
        dossiers.mockReturnValueOnce(attente.promesse);
        const { unmount } = renderHook(() => useCorrespondanceDuJeu(personnageA));
        unmount();
        await act(async () => attente.resoudre([]));
        expect(charger).not.toHaveBeenCalled();
        expect(console.info).not.toHaveBeenCalled();
    });
});
