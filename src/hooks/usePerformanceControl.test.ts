import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerformanceStore } from '../stores/usePerformanceStore';
import { usePerformanceControl } from './usePerformanceControl';

// Le setup global remplace `navigator` par un objet simple : on le re-stubbe
// plutôt que d'espionner un accesseur qui n'existe pas.
const setUserAgent = (ua: string) => vi.stubGlobal('navigator', { ...navigator, userAgent: ua });

/** Fait passer la détection automatique pour une tablette. */
function pretendTablet() {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(820);
}

/** ... et pour un poste de bureau. */
function pretendDesktop() {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1920);
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
}

beforeEach(() => {
    vi.restoreAllMocks();
    usePerformanceStore.setState({ isLowGraphics: false, autoPerformanceEnabled: true });
});

describe('usePerformanceControl — détection automatique', () => {
    it('active le mode performance sur une tablette', () => {
        pretendTablet();
        renderHook(() => usePerformanceControl());

        expect(usePerformanceStore.getState().isLowGraphics).toBe(true);
    });

    it('laisse un poste de bureau en mode qualité', () => {
        pretendDesktop();
        renderHook(() => usePerformanceControl());

        expect(usePerformanceStore.getState().isLowGraphics).toBe(false);
    });

    it('ne touche à rien quand la détection est désactivée', () => {
        pretendTablet();
        usePerformanceStore.setState({ autoPerformanceEnabled: false });

        renderHook(() => usePerformanceControl());

        expect(usePerformanceStore.getState().isLowGraphics).toBe(false);
    });
});

describe('usePerformanceControl — choix de l\'utilisateur', () => {
    it('respecte un retour au mode qualité sur tablette', () => {
        // Le défaut : l'effet a `isLowGraphics` en dépendance, donc repasser en
        // mode qualité le relançait et il rétablissait aussitôt le mode
        // performance — bouton activable, jamais désactivable.
        pretendTablet();
        const { rerender } = renderHook(() => usePerformanceControl());
        expect(usePerformanceStore.getState().isLowGraphics).toBe(true);

        act(() => {
            usePerformanceStore.getState().setLowGraphicsByUser(false);
        });
        rerender();

        expect(usePerformanceStore.getState().isLowGraphics).toBe(false);
    });

    it('coupe la détection automatique dès le premier choix explicite', () => {
        pretendTablet();
        renderHook(() => usePerformanceControl());

        act(() => {
            usePerformanceStore.getState().setLowGraphicsByUser(false);
        });

        expect(usePerformanceStore.getState().autoPerformanceEnabled).toBe(false);
    });

    it('conserve le choix à travers un remontage', () => {
        pretendTablet();
        usePerformanceStore.getState().setLowGraphicsByUser(false);

        const { unmount } = renderHook(() => usePerformanceControl());
        unmount();
        renderHook(() => usePerformanceControl());

        expect(usePerformanceStore.getState().isLowGraphics).toBe(false);
    });

    it('permet aussi de forcer le mode performance sur un poste de bureau', () => {
        pretendDesktop();
        renderHook(() => usePerformanceControl());

        act(() => {
            usePerformanceStore.getState().setLowGraphicsByUser(true);
        });

        expect(usePerformanceStore.getState().isLowGraphics).toBe(true);
        expect(usePerformanceStore.getState().autoPerformanceEnabled).toBe(false);
    });
});

describe('usePerformanceControl — classes dérivées', () => {
    it('supprime les flous coûteux en mode performance', () => {
        pretendTablet();
        const { result } = renderHook(() => usePerformanceControl());

        expect(result.current.isLowGraphics).toBe(true);
        expect(result.current.blurClass).toBe('backdrop-blur-none');
        expect(result.current.heavyBlurClass).toBe('backdrop-blur-none');
        expect(result.current.animateClass).toBe('');
    });

    it('conserve les effets en mode qualité', () => {
        pretendDesktop();
        const { result } = renderHook(() => usePerformanceControl());

        expect(result.current.blurClass).toBe('backdrop-blur-xl');
        expect(result.current.heavyBlurClass).toBe('backdrop-blur-3xl');
    });
});
