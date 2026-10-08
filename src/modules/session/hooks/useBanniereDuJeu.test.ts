import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useLayoutEffect } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBanniereDuJeu } from './useBanniereDuJeu';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';

function enAttente<T>() {
    let resoudre!: (valeur: T) => void;
    const promesse = new Promise<T>(resolve => { resoudre = resolve; });
    return { promesse, resoudre };
}
const dossiers = vi.fn<() => Promise<string[]>>();
const adresseA = 'gmos://media/docs/systems/alpha/A%20Band.jpg';
const adresseB = 'gmos://media/docs/systems/beta/B.jpg';

beforeEach(() => {
    dossiers.mockReset().mockResolvedValue([]);
    vi.stubGlobal('appBridge', { ai: { listSystems: dossiers } });
    useSessionOSStore.setState({
        activeCampaignId: 'a',
        campaigns: [
            { id: 'a', name: 'Alpha', system: 'sys-a', activeLocationIds: [] },
            { id: 'b', name: 'Beta', system: 'sys-b', activeLocationIds: [] },
        ],
        customGameDrivers: [
            { ...DEFAULT_GAME_DRIVERS[0], id: 'sys-a', name: 'Alpha', corpusId: 'alpha', banniere: 'A Band.jpg' },
            { ...DEFAULT_GAME_DRIVERS[0], id: 'sys-b', name: 'Beta', corpusId: 'beta', banniere: 'B.jpg' },
        ],
    });
});
afterEach(() => vi.unstubAllGlobals());

describe('la bannière du contexte courant', () => {
    it('reste absente sans campagne ou sans fichier, sans lecture', () => {
        useSessionOSStore.setState({ activeCampaignId: null });
        const { result } = renderHook(() => useBanniereDuJeu());
        expect(result.current).toBeNull();
        act(() => useSessionOSStore.setState({ activeCampaignId: 'a', customGameDrivers: [] }));
        expect(result.current).toBeNull();
        expect(dossiers).not.toHaveBeenCalled();
    });

    it('attend la résolution du dossier puis encode le nom du fichier', async () => {
        const lecture = enAttente<string[]>();
        dossiers.mockReturnValueOnce(lecture.promesse);
        const { result } = renderHook(() => useBanniereDuJeu());
        expect(result.current).toBeNull();
        await act(async () => lecture.resoudre([]));
        expect(result.current).toBe(adresseA);
    });

    it('masque une bannière retirée dès le premier rendu, avant les effets', async () => {
        const rendus: Array<string | null> = [];
        const { result } = renderHook(() => {
            const adresse = useBanniereDuJeu();
            useLayoutEffect(() => { rendus.push(adresse); });
            return adresse;
        });
        await waitFor(() => expect(result.current).toBe(adresseA));
        rendus.length = 0;
        act(() => useSessionOSStore.setState(s => ({
            customGameDrivers: s.customGameDrivers.map(d => ({ ...d, banniere: undefined })),
        })));
        expect(rendus).toEqual([null]);
        expect(dossiers).toHaveBeenCalledTimes(1);
    });

    it('masque le résultat chargé pendant le changement de campagne', async () => {
        const rendus: Array<string | null> = [];
        const { result } = renderHook(() => {
            const adresse = useBanniereDuJeu();
            useLayoutEffect(() => { rendus.push(adresse); });
            return adresse;
        });
        await waitFor(() => expect(result.current).toBe(adresseA));
        const lectureB = enAttente<string[]>();
        dossiers.mockReturnValueOnce(lectureB.promesse);
        rendus.length = 0;
        act(() => useSessionOSStore.setState({ activeCampaignId: 'b' }));
        expect(rendus).toEqual([null]);
        await act(async () => lectureB.resoudre([]));
        expect(result.current).toBe(adresseB);
    });

    it('ignore une réponse ancienne arrivée après celle du nouveau jeu', async () => {
        const lectureA = enAttente<string[]>(), lectureB = enAttente<string[]>();
        dossiers.mockReturnValueOnce(lectureA.promesse).mockReturnValueOnce(lectureB.promesse);
        const { result } = renderHook(() => useBanniereDuJeu());
        act(() => useSessionOSStore.setState({ activeCampaignId: 'b' }));
        await act(async () => lectureB.resoudre([]));
        expect(result.current).toBe(adresseB);
        await act(async () => lectureA.resoudre([]));
        expect(result.current).toBe(adresseB);
    });

    it('recharge un dossier déclaré modifié, même avec le même jeu et fichier', async () => {
        const { result } = renderHook(() => useBanniereDuJeu());
        await waitFor(() => expect(result.current).toBe(adresseA));
        const nouvelle = enAttente<string[]>();
        dossiers.mockReturnValueOnce(nouvelle.promesse);
        act(() => useSessionOSStore.setState(s => ({
            customGameDrivers: s.customGameDrivers.map(d => d.id === 'sys-a' ? { ...d, corpusId: 'gamma' } : d),
        })));
        expect(result.current).toBeNull();
        await act(async () => nouvelle.resoudre([]));
        expect(result.current).toBe('gmos://media/docs/systems/gamma/A%20Band.jpg');
    });

    it('suit le chemin de campagne et ignore ses changements sans lien avec le dossier', async () => {
        const { result } = renderHook(() => useBanniereDuJeu());
        await waitFor(() => expect(result.current).toBe(adresseA));
        act(() => useSessionOSStore.setState(s => ({ campaigns: s.campaigns.map(c => ({ ...c, name: 'Renommée' })) })));
        expect(result.current).toBe(adresseA);
        expect(dossiers).toHaveBeenCalledTimes(1);
        act(() => useSessionOSStore.setState(s => ({
            campaigns: s.campaigns.map(c => c.id === 'a' ? { ...c, systemPath: 'systems/delta' } : c),
        })));
        await waitFor(() => expect(result.current).toBe('gmos://media/docs/systems/delta/A%20Band.jpg'));
        expect(dossiers).toHaveBeenCalledTimes(2);
    });

    it('rend null en cas de panne et ne conserve pas le résultat de la campagne précédente', async () => {
        const { result } = renderHook(() => useBanniereDuJeu());
        await waitFor(() => expect(result.current).toBe(adresseA));
        dossiers.mockRejectedValueOnce(new Error('indisponible'));
        act(() => useSessionOSStore.setState({ activeCampaignId: 'b' }));
        await act(async () => {});
        expect(result.current).toBeNull();
    });
});
