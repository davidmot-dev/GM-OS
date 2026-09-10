import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * **Un magasin qui apparaît en cours de route ne casse plus le hub.**
 *
 * `useHubSync` atteint huit magasins par leur nom sur `window`, sans en importer
 * aucun — c'est délibéré. Mais il les appelait derrière un ternaire :
 *
 *     const combatants = useCombatStore ? useCombatStore(s => s.combatants) : EMPTY_ARR;
 *
 * ...soit 27 crochets conditionnels. Le nombre de crochets appelés dépendait
 * donc de ce qui était chargé, et React exige qu'il soit invariant. Le jour où
 * l'un des huit magasins arrivait entre deux rendus, le hub levait « Rendered
 * more hooks than during the previous render » — devant les joueurs.
 *
 * Ça tenait par accident : le graphe d'imports statiques d'`App.tsx` charge les
 * huit avant le premier rendu. *Rien ne l'imposait, rien ne le testait, et le
 * dépôt charge déjà 32 modules en `lazy()`.*
 *
 * Ce test reproduit exactement la bascule : premier rendu sans le magasin,
 * second rendu avec. Il échoue sur le code d'avant.
 */

/** Un magasin Zustand réduit à ce que `useMagasin` lui demande. */
function magasinFactice(etat: Record<string, unknown>) {
    return Object.assign(() => etat, {
        getState: () => etat,
        subscribe: () => () => {},
    });
}

const fenetre = window as unknown as Record<string, unknown>;

beforeEach(() => {
    /*
      `useHubSync` ouvre une socket au montage. On la remplace par une coquille :
      ce test ne parle pas du transport, et une vraie connexion le rendrait
      dépendant du réseau.
    */
    vi.stubGlobal('WebSocket', class {
        static readonly OPEN = 1;
        readyState = 0;
        onopen: (() => void) | null = null;
        onclose: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onmessage: ((e: unknown) => void) | null = null;
        send() {}
        close() {}
    });

    for (const nom of [
        'useImageStore', 'useSessionOSStore', 'useClockStore', 'useFavoriteStore',
        'useCombatStore', 'useClientStore', 'useDiceStore', 'useSyncStore',
    ]) delete fenetre[nom];
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const { useHubSync } = await import('./useHubSync');

describe('useHubSync devant des magasins qui arrivent en retard', () => {
    it('se monte sans aucun magasin sur window', () => {
        const { result } = renderHook(() => useHubSync());
        expect(result.current.combatants).toEqual([]);
    });

    /*
      Le cœur du test. Sur le code d'avant, ce second rendu ajoutait un crochet
      au compte et React levait ; ici, `useSyncExternalStore` a déjà été appelé
      au premier rendu, magasin absent ou non.
    */
    it('survit à l’apparition d’un magasin entre deux rendus', () => {
        const { result, rerender } = renderHook(() => useHubSync());
        expect(result.current.combatants).toEqual([]);

        fenetre.useCombatStore = magasinFactice({
            combatants: [{ id: 'c1' }],
            currentTurnIdx: 2,
            round: 3,
            isCombatProjected: true,
        });

        expect(() => rerender()).not.toThrow();
        expect(result.current.combatants).toEqual([{ id: 'c1' }]);
        expect(result.current.round).toBe(3);
    });

    it('survit aussi à la disparition d’un magasin', () => {
        fenetre.useCombatStore = magasinFactice({ combatants: [{ id: 'c1' }], round: 3 });
        const { result, rerender } = renderHook(() => useHubSync());
        expect(result.current.round).toBe(3);

        delete fenetre.useCombatStore;

        expect(() => rerender()).not.toThrow();
        expect(result.current.combatants).toEqual([]);
        expect(result.current.round).toBe(0);
    });

    /*
      L'horloge absente rendait `Date.now()`, une valeur neuve à chaque lecture.
      `useSyncExternalStore` compare l'instantané qu'on lui rend : une valeur
      instable le ferait boucler jusqu'au dépassement de pile.
    */
    it('garde un horodatage stable quand l’horloge est absente', () => {
        const { result, rerender } = renderHook(() => useHubSync());
        const premier = result.current.timestamp;
        rerender();
        expect(result.current.timestamp).toBe(premier);
    });
});
