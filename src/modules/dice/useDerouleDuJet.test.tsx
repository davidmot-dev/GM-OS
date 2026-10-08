import { StrictMode, useLayoutEffect, type PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAffichageDuJet, usePoseDesDes } from './useDerouleDuJet';

const avancer = (duree: number) => act(() => vi.advanceTimersByTime(duree));
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); });
function capturerLesRappels() {
    const rappels: Array<() => void> = [];
    const minuterie = globalThis.setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((rappel, delai, ...args) => {
        if (typeof rappel === 'function') rappels.push(() => rappel(...args));
        return minuterie(rappel, delai, ...args);
    });
    return rappels;
}

describe('le résultat du jet projeté', () => {
    it('ne démarre pas sans projection ni signal neuf', () => {
        const { result, rerender } = renderHook(p => useAffichageDuJet(p.projete, p.signal), {
            initialProps: { projete: false, signal: 0 },
        });
        rerender({ projete: true, signal: 0 });
        expect(result.current.showDice).toBe(false); expect(vi.getTimerCount()).toBe(0);
    });

    it('affiche dès le premier commit du nouveau signal', () => {
        const commits: boolean[] = [];
        const { rerender } = renderHook(signal => {
            const jet = useAffichageDuJet(true, signal);
            useLayoutEffect(() => { commits.push(jet.showDice); });
            return jet;
        }, { initialProps: 0 });
        rerender(1); expect(commits).toEqual([false, true]);
    });

    it('garde cinq secondes sans signal de pose et ne rejoue pas le signal expiré', () => {
        const { result, rerender } = renderHook(signal => useAffichageDuJet(true, signal), { initialProps: 1 });
        avancer(4999); expect(result.current.showDice).toBe(true);
        avancer(1); expect(result.current.showDice).toBe(false);
        rerender(1); expect(result.current.showDice).toBe(false); expect(vi.getTimerCount()).toBe(0);
    });

    it('ne prolonge pas le délai lors d’un changement sans nouveau signal', () => {
        const { result, rerender } = renderHook(p => useAffichageDuJet(p.projete, p.signal), {
            initialProps: { projete: true, signal: 1 },
        });
        avancer(3000); rerender({ projete: false, signal: 1 }); avancer(2000);
        expect(result.current.showDice).toBe(false);
        rerender({ projete: true, signal: 1 }); expect(result.current.showDice).toBe(false);
    });

    it('attend l’autorisation de projection pour un signal reçu pendant la désactivation', () => {
        const { result, rerender } = renderHook(p => useAffichageDuJet(p.projete, p.signal), {
            initialProps: { projete: false, signal: 1 },
        });
        expect(result.current.showDice).toBe(false);
        rerender({ projete: true, signal: 1 }); expect(result.current.showDice).toBe(true);
        avancer(5000); expect(result.current.showDice).toBe(false);
    });

    it('donne cinq secondes au second jet sans repasser par un affichage fermé', () => {
        const { result, rerender } = renderHook(signal => useAffichageDuJet(true, signal), { initialProps: 1 });
        avancer(4000); rerender(2); avancer(1000);
        expect(result.current.showDice).toBe(true); avancer(3999); expect(result.current.showDice).toBe(true);
        avancer(1); expect(result.current.showDice).toBe(false);
    });

    it('relance les cinq secondes au signal de pose', () => {
        const { result } = renderHook(() => useAffichageDuJet(true, 1));
        avancer(4000); act(() => result.current.signalerLesDesPoses()); avancer(1000);
        expect(result.current.showDice).toBe(true); avancer(3999); expect(result.current.showDice).toBe(true);
        avancer(1); expect(result.current.showDice).toBe(false);
    });

    it('ignore un signal de pose de l’ancien jet', () => {
        const { result, rerender } = renderHook(signal => useAffichageDuJet(true, signal), { initialProps: 1 });
        const ancienSignal = result.current.signalerLesDesPoses;
        rerender(2); avancer(4000); act(ancienSignal); avancer(1000);
        expect(result.current.showDice).toBe(false);
    });

    it('ignore une ancienne échéance déjà mise en file après le nouveau jet ou la pose', () => {
        const rappels = capturerLesRappels();
        const { result, rerender } = renderHook(signal => useAffichageDuJet(true, signal), { initialProps: 1 });
        rerender(2); act(() => rappels[0]()); expect(result.current.showDice).toBe(true);
        act(() => result.current.signalerLesDesPoses()); act(() => rappels[1]());
        expect(result.current.showDice).toBe(true);
    });

    it('ne rouvre pas un résultat expiré lors d’un signal tardif', () => {
        const { result } = renderHook(() => useAffichageDuJet(true, 1));
        avancer(5000); act(() => result.current.signalerLesDesPoses());
        expect(result.current.showDice).toBe(false); expect(vi.getTimerCount()).toBe(0);
    });

    it('nettoie l’échéance au démontage sous StrictMode', () => {
        const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
        const { unmount } = renderHook(() => useAffichageDuJet(true, 1), { wrapper });
        expect(vi.getTimerCount()).toBe(1); unmount(); expect(vi.getTimerCount()).toBe(0);
    });
});

describe('le maintien des dés posés', () => {
    it('retire les dés après deux secondes et signale pose puis effacement', () => {
        const signaler = vi.fn();
        const { result } = renderHook(() => usePoseDesDes('a', signaler));
        act(() => result.current.auReposDesDes()); expect(signaler).toHaveBeenCalledTimes(1);
        avancer(1999); expect(result.current.desPoses).toBe(false);
        avancer(1); expect(result.current.desPoses).toBe(true); expect(signaler).toHaveBeenCalledTimes(2);
    });

    it('réarme dès le premier commit d’un autre identifiant de jet', () => {
        const commits: boolean[] = [];
        const signaler = vi.fn();
        const { result, rerender } = renderHook(id => {
            const pose = usePoseDesDes(id, signaler);
            useLayoutEffect(() => { commits.push(pose.desPoses); });
            return pose;
        }, { initialProps: 'a' });
        act(() => result.current.auReposDesDes()); avancer(2000); rerender('b');
        expect(commits).toEqual([false, true, false]);
    });

    it('ne prépare pas de maintien sans jet', () => {
        const signaler = vi.fn();
        const { result } = renderHook(() => usePoseDesDes(undefined, signaler));
        act(() => result.current.auReposDesDes()); expect(signaler).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('annule le maintien du premier jet quand le suivant arrive', () => {
        const signaler = vi.fn();
        const { result, rerender } = renderHook(id => usePoseDesDes(id, signaler), { initialProps: 'a' });
        act(() => result.current.auReposDesDes()); avancer(1000); rerender('b'); avancer(1000);
        expect(result.current.desPoses).toBe(false); expect(signaler).toHaveBeenCalledTimes(1);
        act(() => result.current.auReposDesDes()); avancer(2000);
        expect(result.current.desPoses).toBe(true); expect(signaler).toHaveBeenCalledTimes(3);
    });

    it('ignore un ancien callback de scène après le changement de jet', () => {
        const signaler = vi.fn();
        const { result, rerender } = renderHook(id => usePoseDesDes(id, signaler), { initialProps: 'a' });
        const ancienRepos = result.current.auReposDesDes; rerender('b'); act(ancienRepos);
        expect(signaler).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    });

    it('ignore un ancien rappel de maintien déjà mis en file', () => {
        const rappels = capturerLesRappels();
        const signaler = vi.fn();
        const { result, rerender } = renderHook(id => usePoseDesDes(id, signaler), { initialProps: 'a' });
        act(() => result.current.auReposDesDes()); rerender('b'); act(() => rappels[0]());
        expect(result.current.desPoses).toBe(false); expect(signaler).toHaveBeenCalledTimes(1);
    });

    it('nettoie au démontage et ignore la scène qui répond ensuite', () => {
        const signaler = vi.fn();
        const { result, unmount } = renderHook(() => usePoseDesDes('a', signaler));
        const repos = result.current.auReposDesDes; act(repos); unmount(); act(repos); avancer(2000);
        expect(vi.getTimerCount()).toBe(0); expect(signaler).toHaveBeenCalledTimes(1);
    });

    it('garde le maintien lors d’un rendu du même jet', () => {
        const signaler = vi.fn();
        const { result, rerender } = renderHook(id => usePoseDesDes(id, signaler), { initialProps: 'a' });
        act(() => result.current.auReposDesDes()); avancer(1000); rerender('a'); avancer(1000);
        expect(result.current.desPoses).toBe(true);
    });
});

describe('les deux étapes ensemble', () => {
    function useJet(signal: number) {
        const affichage = useAffichageDuJet(true, signal);
        const pose = usePoseDesDes(`jet-${signal}`, affichage.signalerLesDesPoses);
        return { ...affichage, ...pose };
    }
    it('garde les cinq secondes après un maintien commencé au plafond de chute', () => {
        const { result } = renderHook(() => useJet(1));
        avancer(4000); act(() => result.current.auReposDesDes()); avancer(1000);
        expect(result.current.showDice).toBe(true); expect(result.current.desPoses).toBe(false);
        avancer(1000); expect(result.current.desPoses).toBe(true); expect(result.current.showDice).toBe(true);
        avancer(4999); expect(result.current.showDice).toBe(true);
        avancer(1); expect(result.current.showDice).toBe(false);
    });

    it('ne laisse pas le maintien du précédent effacer les dés ou prolonger le résultat suivant', () => {
        const { result, rerender } = renderHook(useJet, { initialProps: 1 });
        act(() => result.current.auReposDesDes()); avancer(1000); rerender(2); avancer(1000);
        expect(result.current.desPoses).toBe(false); expect(result.current.showDice).toBe(true);
        avancer(4000); expect(result.current.showDice).toBe(false);
    });
});
