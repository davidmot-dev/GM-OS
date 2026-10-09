import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, fireEvent, waitFor } from '@testing-library/react';
import { useSpotlight } from './useSpotlight';
import { useSessionStore } from '../store/useSessionStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import type { DocumentIA } from '../types/documentsIA';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

beforeEach(() => useSessionStore.getState().setActiveModule('dashboard'));
afterEach(() => vi.unstubAllGlobals());

describe('documents de la Forge dans la recherche', () => {
    it('parcourt l’arbre dans son ordre, garde les fichiers sans filtrer leur extension et ouvre l’atelier', async () => {
        const documents: DocumentIA[] = [{
            name: 'dossier', path: '/dossier', type: 'directory', children: [
                { name: 'codex-lint-test.md', path: '/dossier/a.md', type: 'file' },
                { name: 'sous-dossier', path: '/dossier/sous', type: 'directory', children: [
                    { name: 'codex-lint-test.txt', path: '/dossier/sous/b.txt', type: 'file' },
                ] },
                { name: 'sans enfants', path: '/dossier/vide', type: 'directory' },
            ],
        }, { name: 'codex-lint-test-fin.md', path: '/fin.md', type: 'file' }];
        const lister = vi.fn<() => Promise<DocumentIA[]>>().mockResolvedValue(documents);
        vi.stubGlobal('appBridge', { ...window.appBridge, ai: { listDocs: lister } });
        const { result } = renderHook(() => useSpotlight());
        act(() => { result.current.setIsOpen(true); result.current.setQuery('codex-lint-test'); });
        await waitFor(() => expect(result.current.results).toHaveLength(3));
        expect(result.current.results.map(r => [r.id, r.title])).toEqual([
            ['forged-/dossier/a.md', 'codex-lint-test'],
            ['forged-/dossier/sous/b.txt', 'codex-lint-test.txt'],
            ['forged-/fin.md', 'codex-lint-test-fin'],
        ]);
        act(() => result.current.results[1].action());
        expect(useSessionOSStore.getState().currentView).toBe('rule-workshop');
        expect(result.current.isOpen).toBe(false);
        expect(documents[0].children).toHaveLength(3);
    });

    it('une erreur de lecture des documents laisse les destinations de la palette utilisables', async () => {
        const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('appBridge', { ...window.appBridge, ai: { listDocs: vi.fn().mockRejectedValue(new Error('lecture simulée')) } });
        const { result } = renderHook(() => useSpotlight());
        await waitFor(() => expect(erreur).toHaveBeenCalled());
        expect(result.current.results.length).toBeGreaterThan(0);
        expect(result.current.results.every(r => r.id.startsWith('module-'))).toBe(true);
    });
});

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
