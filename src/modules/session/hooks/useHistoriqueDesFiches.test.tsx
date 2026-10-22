// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHistoriqueDesFiches } from './useHistoriqueDesFiches';
import { useSessionOSStore } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { avecOrigine } from '../logic/origineDesModifications';

/**
 * **L'historique des fiches au journal** — H1 de l'audit du 2026-10-22 :
 * toutes les modifications, avec leur origine, regroupées par moment.
 */
const addEvent = vi.fn();
const initialSession = useSessionOSStore.getState();
const initialJournal = useJournalStore.getState();
const fiche = (sheetData: Record<string, unknown>) => ({
    players: [{ id: 'j', name: 'Joueuse', characters: [{ id: 'ilya', name: 'Ilya Vorn', campaignId: 'c', sheetData }] }],
});
const ecrire = (sheetData: Record<string, unknown>) => useSessionOSStore.setState(fiche(sheetData) as never);

beforeEach(() => {
    vi.useFakeTimers();
    addEvent.mockClear();
    useJournalStore.setState({ addEvent } as never);
    useSessionOSStore.setState({ ...fiche({ force: 3, espoir: 2 }), campaigns: [], customSheetTemplates: [] } as never);
});
afterEach(() => {
    vi.useRealTimers();
    useSessionOSStore.setState(initialSession, true);
    useJournalStore.setState(initialJournal, true);
});

describe('l\'historique des fiches', () => {
    it('une tablette qui change deux fois la Force : une ligne, avec son origine, après le calme', () => {
        renderHook(() => useHistoriqueDesFiches(true));
        avecOrigine('tablette', () => ecrire({ force: 4, espoir: 2 }));
        avecOrigine('tablette', () => ecrire({ force: 5, espoir: 2 }));
        expect(addEvent).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5_000);
        expect(addEvent).toHaveBeenCalledOnce();
        expect(addEvent.mock.calls[0][0]).toMatchObject({
            type: 'PJ', nature: 'trace', title: 'Fiche — Ilya Vorn (tablette)', content: 'force 3 → 5',
        });
    });

    it('le meneur et la tablette ne se mélangent pas', () => {
        renderHook(() => useHistoriqueDesFiches(true));
        ecrire({ force: 4, espoir: 2 });
        avecOrigine('tablette', () => ecrire({ force: 4, espoir: 3 }));
        vi.advanceTimersByTime(5_000);
        expect(addEvent.mock.calls.map(c => c[0].title).sort()).toEqual(['Fiche — Ilya Vorn', 'Fiche — Ilya Vorn (tablette)']);
    });

    it('ce que le journal dit déjà, et un chargement entier, ne se disent pas', () => {
        renderHook(() => useHistoriqueDesFiches(true));
        avecOrigine('silencieuse', () => ecrire({ force: 1, espoir: 2 }));
        ecrire(Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`champ${i}`, i + 1])));
        vi.advanceTimersByTime(5_000);
        expect(addEvent).not.toHaveBeenCalled();
    });

    it('éteint, il n\'écoute rien ; démonté, il dit ce qui attendait', () => {
        const { unmount, rerender } = renderHook(({ actif }) => useHistoriqueDesFiches(actif), { initialProps: { actif: false } });
        ecrire({ force: 4, espoir: 2 });
        vi.advanceTimersByTime(5_000);
        expect(addEvent).not.toHaveBeenCalled();
        rerender({ actif: true });
        ecrire({ force: 6, espoir: 2 });
        unmount();
        expect(addEvent).toHaveBeenCalledOnce();
        expect(addEvent.mock.calls[0][0].content).toBe('force 4 → 6');
    });
});
