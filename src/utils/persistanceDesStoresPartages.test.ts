import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **Les cinq stores partagés n'acceptent d'écriture que de la fenêtre MJ.**
 *
 * Suite directe du 2026-08-24 sur `useCombatStore` : le même défaut valait pour
 * cinq autres stores persistés dans `localStorage`. Le Player Hub et le
 * projecteur tournent sur la **même origine** que le MJ, donc dans le même
 * magasin, sous les mêmes clés — et les deux chemins de synchronisation
 * (`useHubSync`, `CrossWindowEventService`) appliquent par `setState`, ce qui
 * fait écrire un store persisté.
 *
 * Ce fichier vérifie le **branchement** de chaque store, pas la garde
 * elle-même : *une garde écrite et non branchée est une garde absente.* Chaque
 * cas nomme un champ que la fenêtre secondaire **ne reçoit jamais** — c'est
 * celui-là qu'elle écrasait.
 */

const role = vi.hoisted(() => ({ current: 'gm' as string }));

vi.mock('./windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

const { useDiceStore } = await import('../stores/useDiceStore');
const { useClockStore } = await import('../store/useClockStore');
const { useWhiteboardStore } = await import('../modules/whiteboard/useWhiteboardStore');
const { useFavoriteStore } = await import('../modules/favorite/useFavoriteStore');
const { useMapStore } = await import('../modules/map/useMapStore');

/** Ce que le magasin contient réellement, une fois le JSON de Zustand déballé. */
const persiste = (cle: string) => {
    const brut = localStorage.getItem(cle);
    return brut ? JSON.parse(brut).state : null;
};

/**
 * Chaque cas : le store, sa clé, ce que le MJ pose, et ce qu'une fenêtre
 * secondaire tenterait d'écrire par-dessus.
 */
const CAS = [
    {
        nom: 'useDiceStore',
        cle: 'gmos-dice-storage',
        store: useDiceStore,
        duMJ: { quickRolls: [{ label: 'Attaque', sides: 20 }] },
        temoin: (e: any) => e?.quickRolls?.length,
        duHub: { quickRolls: [] },
    },
    {
        nom: 'useClockStore',
        cle: 'gm-os-clock-storage',
        store: useClockStore,
        duMJ: { calendars: { 'cal-1': { name: 'Calendrier impérial' } } },
        temoin: (e: any) => Object.keys(e?.calendars ?? {}).length,
        duHub: { calendars: {} },
    },
    {
        nom: 'useWhiteboardStore',
        cle: 'gm-os-whiteboard-storage-v1',
        store: useWhiteboardStore,
        duMJ: { paths: [{ id: 'p1', points: [], tool: 'brush', color: '#fff', width: 2 }] },
        temoin: (e: any) => e?.paths?.length,
        duHub: { paths: [] },
    },
    {
        nom: 'useFavoriteStore',
        cle: 'gm-os-favorites-storage',
        store: useFavoriteStore,
        duMJ: { favorites: [{ id: 'f1', name: 'Le Rachaghal' }] },
        temoin: (e: any) => e?.favorites?.length,
        duHub: { favorites: [] },
    },
    {
        nom: 'useMapStore',
        cle: 'gmos-map-storage',
        store: useMapStore,
        duMJ: { mapPresets: [{ id: 'm1', name: 'Le Bunker' }] },
        temoin: (e: any) => e?.mapPresets?.length,
        duHub: { mapPresets: [] },
    },
] as const;

beforeEach(() => {
    role.current = 'gm';
    localStorage.clear();
});

describe('les stores partagés entre fenêtres', () => {
    describe.each(CAS)('$nom', ({ cle, store, duMJ, temoin, duHub }) => {
        it('la fenêtre MJ persiste ce qu’elle change', () => {
            (store as any).setState(duMJ);

            expect(temoin(persiste(cle))).toBeGreaterThan(0);
        });

        it.each(['hub', 'projector'])(
            'la fenêtre « %s » n’écrase pas le magasin du MJ',
            (secondaire) => {
                (store as any).setState(duMJ);
                const ecritParLeMJ = localStorage.getItem(cle);

                role.current = secondaire;
                (store as any).setState(duHub);

                expect(localStorage.getItem(cle)).toBe(ecritParLeMJ);
                expect(temoin(persiste(cle))).toBeGreaterThan(0);
            },
        );

        it('la lecture reste ouverte — la fenêtre secondaire s’hydrate encore', async () => {
            (store as any).setState(duMJ);

            role.current = 'hub';
            (store as any).setState(duHub);
            await (store as any).persist.rehydrate();

            expect(temoin((store as any).getState())).toBeGreaterThan(0);
        });
    });
});
