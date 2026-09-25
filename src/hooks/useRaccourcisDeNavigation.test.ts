import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * **Les raccourcis de navigation, frappés pour de vrai.**
 *
 * Chaque essai part d'un `keydown` sur `window`, comme la frappe du meneur.
 * C'est ce qui a manqué à `Ctrl+Maj+0` : la branche était écrite, relue, et
 * une garde en amont l'empêchait d'être jamais atteinte.
 */

vi.mock('../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/* Le ducking referme un cycle d'imports dès qu'un test entre par le magasin de
   session — voir `raccourciDeLaCampagne.test.ts`. */
vi.mock('../modules/voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const effacer = vi.fn();
const noircir = vi.fn();
vi.mock('../modules/image/logic/effacerLePlayerHub', () => ({ effacerLePlayerHub: () => effacer() }));
vi.mock('../modules/image/logic/noircirLePlayerHub', () => ({ noircirLePlayerHub: () => noircir() }));

const { useRaccourcisDeNavigation } = await import('./useRaccourcisDeNavigation');
const { useSessionStore } = await import('../store/useSessionStore');
const { useSessionOSStore } = await import('../modules/session/useSessionOSStore');
const { useModalStore } = await import('../stores/useModalStore');

function frapper(code: string, options: KeyboardEventInit = {}) {
    const evenement = new KeyboardEvent('keydown', { code, ctrlKey: true, cancelable: true, ...options });
    window.dispatchEvent(evenement);
    return evenement;
}

beforeEach(() => {
    effacer.mockClear();
    noircir.mockClear();
    useSessionStore.getState().setActiveModule('music');
    useSessionOSStore.getState().setCurrentView('npc-gallery');
    useModalStore.setState({ type: null } as never);
});

describe('Ctrl+T — Table-OS', () => {
    it('ouvre Table-OS', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        const evenement = frapper('KeyT');
        expect(useSessionStore.getState().activeModule).toBe('table');
        expect(evenement.defaultPrevented).toBe(true);
    });

    it('ne répond pas dans une fenêtre qui n’est pas celle du meneur', () => {
        renderHook(() => useRaccourcisDeNavigation(false));
        frapper('KeyT');
        expect(useSessionStore.getState().activeModule).toBe('music');
    });

    it('laisse la main à une boîte ouverte', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        useModalStore.setState({ type: 'custom' } as never);
        frapper('KeyT');
        expect(useSessionStore.getState().activeModule).toBe('music');
    });

    it('n’est pas pris par Ctrl+Maj+T', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        frapper('KeyT', { shiftKey: true });
        expect(useSessionStore.getState().activeModule).toBe('music');
    });
});

describe('Ctrl+² — le Cockpit', () => {
    it('ouvre Session-OS SUR le Cockpit, pas sur la dernière vue', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        const evenement = frapper('Backquote');
        expect(useSessionStore.getState().activeModule).toBe('dashboard');
        expect(useSessionOSStore.getState().currentView).toBe('cockpit');
        expect(evenement.defaultPrevented).toBe(true);
    });
});

describe('Ctrl+0 et Ctrl+Maj+N — le Player Hub', () => {
    it('Ctrl+0 efface', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        frapper('Digit0');
        expect(effacer).toHaveBeenCalledOnce();
        expect(noircir).not.toHaveBeenCalled();
    });

    it('Ctrl+Maj+N éteint', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        const evenement = frapper('KeyN', { shiftKey: true });
        expect(noircir).toHaveBeenCalledOnce();
        expect(effacer).not.toHaveBeenCalled();
        expect(evenement.defaultPrevented).toBe(true);
    });

    it('Ctrl+N seul ne fait rien, et laisse passer la frappe', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        const evenement = frapper('KeyN');
        expect(noircir).not.toHaveBeenCalled();
        expect(evenement.defaultPrevented).toBe(false);
    });

    /* ⛔ Windows réserve Ctrl+Maj+0 (bascule de disposition clavier) : la
       frappe n'arrive jamais. Ce geste ne doit plus rien porter, pour qu'on
       ne le réécrive pas en croyant le réparer. */
    it('Ctrl+Maj+0 ne porte plus rien', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        frapper('Digit0', { shiftKey: true });
        expect(noircir).not.toHaveBeenCalled();
        expect(effacer).not.toHaveBeenCalled();
    });

    it('Ctrl+Maj+1 n’ouvre pas la place 1', () => {
        renderHook(() => useRaccourcisDeNavigation(true));
        frapper('Digit1', { shiftKey: true });
        expect(useSessionStore.getState().activeModule).toBe('music');
    });
});
