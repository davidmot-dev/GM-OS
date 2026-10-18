import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSaisieDifferee } from './useSaisieDifferee';

/** **La saisie de la tablette, envoyée après une pause** — Nephilim, 2026-10-18. */
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('une saisie de la tablette', () => {
    it('ne part qu’une fois, après la pause de frappe, avec la dernière valeur', () => {
        const envoyer = vi.fn();
        const { result } = renderHook(() => useSaisieDifferee(envoyer, {}));
        act(() => { result.current.saisir('pastlives_0_name', 'Aè'); });
        act(() => { result.current.saisir('pastlives_0_name', 'Aède'); });
        expect(result.current.brouillons.pastlives_0_name).toBe('Aède');
        expect(envoyer).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(700); });
        expect(envoyer).toHaveBeenCalledTimes(1);
        expect(envoyer).toHaveBeenCalledWith('pastlives_0_name', 'Aède');
    });

    it('part tout de suite à la fermeture', () => {
        const envoyer = vi.fn();
        const { result, unmount } = renderHook(() => useSaisieDifferee(envoyer, {}));
        act(() => { result.current.saisir('incarnations_0_era', 'Le Déluge'); });
        unmount();
        expect(envoyer).toHaveBeenCalledWith('incarnations_0_era', 'Le Déluge');
    });

    it('le brouillon s’efface quand la fiche du meneur porte la valeur', () => {
        const envoyer = vi.fn();
        const { result, rerender } = renderHook(({ fiche }) => useSaisieDifferee(envoyer, fiche), { initialProps: { fiche: {} as Record<string, unknown> } });
        act(() => { result.current.saisir('pastlives_0_name', 'Aède'); });
        act(() => { vi.advanceTimersByTime(700); });
        rerender({ fiche: { pastlives_0_name: 'Aède' } });
        expect(result.current.brouillons).toEqual({});
    });
});
