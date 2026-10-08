import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, fireEvent } from '@testing-library/react';
import { useSpotlight } from './useSpotlight';
import { useSessionStore } from '../store/useSessionStore';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

beforeEach(() => useSessionStore.getState().setActiveModule('dashboard'));

describe('la sélection de la recherche rapide', () => {
    it('revient au premier résultat quand la recherche change et garde la sélection si elle reste identique', () => {
        const { result } = renderHook(() => useSpotlight());
        act(() => result.current.setIsOpen(true));
        act(() => result.current.setSelectedIndex(3));
        act(() => result.current.setQuery('names'));
        expect(result.current.selectedIndex).toBe(0);
        act(() => result.current.setSelectedIndex(i => i + 2));
        act(() => result.current.setQuery(q => q));
        expect(result.current.selectedIndex).toBe(2);
    });

    it('abandonne recherche et sélection à la fermeture, y compris par le raccourci', () => {
        const { result } = renderHook(() => useSpotlight());
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(result.current.isOpen).toBe(true);
        act(() => result.current.setQuery('names'));
        act(() => result.current.setSelectedIndex(2));
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        expect(result.current.isOpen).toBe(false);
        expect(result.current.query).toBe('');
        expect(result.current.selectedIndex).toBe(0);
        act(() => result.current.setIsOpen(ouverte => !ouverte));
        expect(result.current.query).toBe('');
    });

    it('parcourt les résultats au clavier et exécute le résultat choisi', () => {
        const { result } = renderHook(() => useSpotlight());
        act(() => result.current.setIsOpen(true));
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        expect(result.current.selectedIndex).toBe(result.current.results.length - 1);
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        expect(result.current.selectedIndex).toBe(0);
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        const destination = result.current.results[1].id.replace('module-', '');
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(useSessionStore.getState().activeModule).toBe(destination);
        expect(result.current.isOpen).toBe(false);
        expect(result.current.selectedIndex).toBe(0);
    });

    it('reste à zéro quand la recherche ne trouve aucun résultat', () => {
        const { result } = renderHook(() => useSpotlight());
        act(() => { result.current.setIsOpen(true); result.current.setQuery('introuvable-xyzzy-123'); });
        expect(result.current.results).toHaveLength(0);
        fireEvent.keyDown(window, { key: 'ArrowDown' });
        fireEvent.keyDown(window, { key: 'ArrowUp' });
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(result.current.selectedIndex).toBe(0);
        expect(result.current.isOpen).toBe(true);
    });
});
