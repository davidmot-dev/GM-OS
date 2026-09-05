import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDernierJet, DUREE_DU_RESULTAT_MS } from './useDernierJet';
import type { RollRecord } from './useRemoteSync';

/**
 * **Le résultat des dés sur la tablette.**
 *
 * Demandé par David le 2026-09-05. L'écran de résultat existait — cent
 * vingt-cinq lignes — et **rien ne l'avait jamais déclenché** : il guettait un
 * message `dice:result` que personne n'émet. La donnée circulait pourtant dans
 * le flux de synchronisation.
 *
 * Ce que ces tests gardent : on montre un jet **neuf**, jamais le dernier jet
 * connu — *le flux répète le même `lastRoll` à chaque synchronisation, et s'y
 * fier ferait resurgir un résultat écarté à la seconde suivante.*
 */

const jet = (id: string): RollRecord =>
    ({ id, timestamp: new Date(), title: 'Jet', total: 12 } as RollRecord);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ce qu’on montre', () => {
    it('ne ressort pas le jet déjà là à la connexion', () => {
        /* Une tablette qui se branche en cours de séance n'a pas à afficher un
           jet vieux d'une heure. */
        const { result } = renderHook(() => useDernierJet(jet('vieux')));
        expect(result.current.jet).toBeNull();
    });

    it('montre un jet neuf', () => {
        const { result, rerender } = renderHook(({ j }) => useDernierJet(j), {
            initialProps: { j: jet('vieux') },
        });

        rerender({ j: jet('neuf') });

        expect(result.current.jet?.id).toBe('neuf');
    });

    it('NE le remontre PAS après qu’on l’a écarté — le flux répète le même jet', () => {
        const { result, rerender } = renderHook(({ j }) => useDernierJet(j), {
            initialProps: { j: jet('vieux') },
        });
        rerender({ j: jet('neuf') });
        expect(result.current.jet?.id).toBe('neuf');

        act(() => result.current.ecarter());
        expect(result.current.jet).toBeNull();

        /* Trois synchronisations de plus avec le même jet : rien ne revient. */
        rerender({ j: jet('neuf') });
        rerender({ j: jet('neuf') });
        expect(result.current.jet).toBeNull();
    });

    it('montre le suivant même après en avoir écarté un', () => {
        const { result, rerender } = renderHook(({ j }) => useDernierJet(j), {
            initialProps: { j: jet('a') },
        });
        rerender({ j: jet('b') });
        act(() => result.current.ecarter());

        rerender({ j: jet('c') });

        expect(result.current.jet?.id).toBe('c');
    });

    it('supporte l’absence de jet', () => {
        const { result } = renderHook(() => useDernierJet(undefined));
        expect(result.current.jet).toBeNull();
        expect(() => result.current.ecarter()).not.toThrow();
    });
});

describe('il s’efface tout seul', () => {
    it('disparaît au bout de quinze secondes', () => {
        const { result, rerender } = renderHook(({ j }) => useDernierJet(j), {
            initialProps: { j: jet('a') },
        });
        rerender({ j: jet('b') });
        expect(result.current.jet?.id).toBe('b');

        act(() => { vi.advanceTimersByTime(DUREE_DU_RESULTAT_MS + 100); });

        expect(result.current.jet).toBeNull();
    });

    it('tient jusqu’au bout du délai', () => {
        const { result, rerender } = renderHook(({ j }) => useDernierJet(j), {
            initialProps: { j: jet('a') },
        });
        rerender({ j: jet('b') });

        act(() => { vi.advanceTimersByTime(DUREE_DU_RESULTAT_MS - 500); });

        expect(result.current.jet?.id).toBe('b');
    });

    it('le compte repart à zéro pour un jet suivant', () => {
        const { result, rerender } = renderHook(({ j }) => useDernierJet(j), {
            initialProps: { j: jet('a') },
        });
        rerender({ j: jet('b') });
        act(() => { vi.advanceTimersByTime(DUREE_DU_RESULTAT_MS - 200); });

        rerender({ j: jet('c') });
        act(() => { vi.advanceTimersByTime(DUREE_DU_RESULTAT_MS - 200); });

        /* Si le compte n'avait pas repris, `c` aurait déjà disparu. */
        expect(result.current.jet?.id).toBe('c');
    });
});
