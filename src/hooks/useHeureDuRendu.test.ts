import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHeureDuRendu } from './useHeureDuRendu';

afterEach(() => vi.useRealTimers());

describe('heure des libellés', () => {
    it('reste stable entre deux battements et libère sa minuterie au démontage', () => {
        vi.useFakeTimers();
        vi.setSystemTime(10_000);
        const { result, rerender, unmount } = renderHook(() => useHeureDuRendu(1000));
        expect(result.current).toBe(10_000);
        act(() => vi.advanceTimersByTime(500));
        rerender();
        expect(result.current).toBe(10_000);
        act(() => vi.advanceTimersByTime(500));
        expect(result.current).toBe(11_000);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
