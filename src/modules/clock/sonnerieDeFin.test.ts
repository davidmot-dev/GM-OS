import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * **La cloche sonne à zéro, une fois, et se laisse couper.**
 *
 * Point C3 du § 12d, tranché par David le 2026-09-05. `ChimeEngine` — cinq
 * harmoniques, quatre secondes de décroissance — était **entièrement écrit et
 * n'avait aucun appelant** : aucune sonnerie n'existait nulle part dans
 * l'application, alors que la fin d'un minuteur est le moment qui la mérite le
 * plus.
 */

const cloche = { playChime: vi.fn() };
vi.mock('./services/ChimeEngine', () => ({ chimeEngine: cloche }));

const { useBattementDuMinuteur } = await import('./useBattementDuMinuteur');
const { useClockStore } = await import('../../store/useClockStore');
const { useAudioMasterStore } = await import('../../stores/useAudioMasterStore');

/** Pose un minuteur qui tourne, à `secondes` de la fin. */
function poser(secondes: number, options: { sonnerie?: boolean; volume?: number } = {}) {
    useClockStore.setState({
        timerRemaining: secondes,
        timerDuration: 60,
        timerIsRunning: true,
        sonnerieDuMinuteur: options.sonnerie ?? true,
    });
    useAudioMasterStore.setState({ masterVolume: options.volume ?? 1 });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('la cloche de fin de minuteur', () => {
    it('sonne quand le minuteur atteint zéro', () => {
        poser(1);
        renderHook(() => useBattementDuMinuteur());

        vi.advanceTimersByTime(1000);

        expect(useClockStore.getState().timerRemaining).toBe(0);
        expect(cloche.playChime).toHaveBeenCalledTimes(1);
    });

    it('ne sonne pas tant qu’il descend', () => {
        poser(5);
        renderHook(() => useBattementDuMinuteur());

        vi.advanceTimersByTime(3000);

        expect(useClockStore.getState().timerRemaining).toBe(2);
        expect(cloche.playChime).not.toHaveBeenCalled();
    });

    it('ne sonne qu’UNE fois — la transition ne se produit qu’une fois', () => {
        poser(2);
        renderHook(() => useBattementDuMinuteur());

        vi.advanceTimersByTime(10_000);

        expect(cloche.playChime).toHaveBeenCalledTimes(1);
    });

    it('se tait quand le meneur a coupé la sonnerie', () => {
        poser(1, { sonnerie: false });
        renderHook(() => useBattementDuMinuteur());

        vi.advanceTimersByTime(1000);

        expect(useClockStore.getState().timerRemaining).toBe(0);
        expect(cloche.playChime).not.toHaveBeenCalled();
    });

    it('se tait quand le son est coupé — une cloche au silence est ce qu’on ne veut pas', () => {
        poser(1, { volume: 0 });
        renderHook(() => useBattementDuMinuteur());

        vi.advanceTimersByTime(1000);

        expect(cloche.playChime).not.toHaveBeenCalled();
    });

    it('ne casse pas le minuteur si le contexte audio refuse', () => {
        cloche.playChime.mockImplementationOnce(() => { throw new Error('AudioContext refusé'); });
        poser(1);
        renderHook(() => useBattementDuMinuteur());

        expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
        expect(useClockStore.getState().timerRemaining).toBe(0);
    });
});

describe('ce que le battement fait toujours', () => {
    it('ne descend pas quand le minuteur est à l’arrêt', () => {
        useClockStore.setState({ timerRemaining: 10, timerIsRunning: false });
        renderHook(() => useBattementDuMinuteur());

        vi.advanceTimersByTime(5000);

        expect(useClockStore.getState().timerRemaining).toBe(10);
    });
});
