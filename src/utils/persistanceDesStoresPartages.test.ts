import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WindowRole } from './windowRole';

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

const role = vi.hoisted(() => ({ current: 'gm' as WindowRole }));

vi.mock('./windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

const { useDiceStore } = await import('../stores/useDiceStore');
const { useClockStore } = await import('../store/useClockStore');
const { useWhiteboardStore } = await import('../modules/whiteboard/useWhiteboardStore');
const { useFavoriteStore } = await import('../modules/favorite/useFavoriteStore');
const { useMapStore } = await import('../modules/map/useMapStore');
const { viderLesEcrituresDifferees } = await import('./ecritureReserveeAuMJ');

/**
 * ⭐ **L'écriture est différée depuis le 2026-09-17** — au plus 250 ms — pour
 * qu'un geste continu ne sérialise pas tout le magasin cent fois par seconde. Un
 * essai qui lit `localStorage` doit donc la **forcer** d'abord, sinon il mesure
 * le délai au lieu de mesurer la garde.
 */
const surLeDisque = (cle: string) => { viderLesEcrituresDifferees(); return localStorage.getItem(cle); };

/** Ce que le magasin contient réellement, une fois le JSON de Zustand déballé. */
const persiste = <S extends object>(cle: string): Partial<S> | null => {
    const brut = surLeDisque(cle);
    // Le JSON vient du magasin réel de ce cas, écrit ici sur le localStorage
    // artificiel. Cette annotation décrit l'enveloppe, pas un validateur d'import.
    return brut ? (JSON.parse(brut) as { state: Partial<S> }).state : null;
};

interface MagasinPersistant<S extends object> {
    getState: () => S;
    setState: (etat: Partial<S>) => void;
    persist: { rehydrate: () => void | Promise<void> };
}

/** Garde store, mises à jour et témoin liés avant le tableau de cas hétérogènes. */
function casDePersistance<S extends object>({ nom, cle, store, duMJ, duHub, temoin }: {
    nom: string;
    cle: string;
    store: MagasinPersistant<S>;
    duMJ: Partial<NoInfer<S>>;
    duHub: Partial<NoInfer<S>>;
    temoin: (etat: Partial<NoInfer<S>> | null) => number | undefined;
}) {
    return {
        nom, cle,
        ecrireDuMJ: () => store.setState(duMJ),
        ecrireDuHub: () => store.setState(duHub),
        rehydrater: () => store.persist.rehydrate(),
        temoinSurDisque: () => temoin(persiste<S>(cle)),
        temoinEnMemoire: () => temoin(store.getState()),
    };
}

/**
 * Chaque cas : le store, sa clé, ce que le MJ pose, et ce qu'une fenêtre
 * secondaire tenterait d'écrire par-dessus.
 */
const CAS = [
    casDePersistance({
        nom: 'useDiceStore',
        cle: 'gmos-dice-storage',
        store: useDiceStore,
        duMJ: { quickRolls: [{ id: 'qr-test', label: 'Attaque', formula: '1d20' }] },
        temoin: e => e?.quickRolls?.length,
        duHub: { quickRolls: [] },
    }),
    casDePersistance({
        nom: 'useClockStore',
        cle: 'gm-os-clock-storage',
        store: useClockStore,
        duMJ: { calendars: { 'cal-1': {
            id: 'cal-1', name: 'Calendrier impérial', months: [{ name: 'Mois artificiel', days: 30 }],
            daysPerWeek: 7, hoursPerDay: 24, minutesPerHour: 60,
        } } },
        temoin: e => Object.keys(e?.calendars ?? {}).length,
        duHub: { calendars: {} },
    }),
    casDePersistance({
        nom: 'useWhiteboardStore',
        cle: 'gm-os-whiteboard-storage-v1',
        store: useWhiteboardStore,
        duMJ: { paths: [{ id: 'p1', points: [], tool: 'brush', color: '#fff', width: 2 }] },
        temoin: e => e?.paths?.length,
        duHub: { paths: [] },
    }),
    casDePersistance({
        nom: 'useFavoriteStore',
        cle: 'gm-os-favorites-storage',
        store: useFavoriteStore,
        duMJ: { favorites: [{ id: 'f1', type: 'npc', name: 'Le Rachaghal' }] },
        temoin: e => e?.favorites?.length,
        duHub: { favorites: [] },
    }),
    casDePersistance({
        nom: 'useMapStore',
        cle: 'gmos-map-storage',
        store: useMapStore,
        duMJ: { mapPresets: [{
            id: 'm1', name: 'Le Bunker', mapUrl: null, mapName: null, isVideo: false,
            tokens: [], dangerZones: [], magicEffects: [], weatherType: 'none', weatherIntensity: 0,
            isGridEnabled: false, gridSize: 50, gridColor: '#fff', gridOpacity: 0.5,
            fogDataUrl: null, mapWidth: 100, mapHeight: 100, zoom: 1, panX: 0, panY: 0,
        }] },
        temoin: e => e?.mapPresets?.length,
        duHub: { mapPresets: [] },
    }),
] as const;

beforeEach(() => {
    role.current = 'gm';
    localStorage.clear();
});

describe('les stores partagés entre fenêtres', () => {
    describe.each(CAS)('$nom', ({ cle, ecrireDuMJ, ecrireDuHub, rehydrater, temoinSurDisque, temoinEnMemoire }) => {
        it('la fenêtre MJ persiste ce qu’elle change', () => {
            ecrireDuMJ();

            expect(temoinSurDisque()).toBeGreaterThan(0);
        });

        it.each(['hub', 'projector'] as const)(
            'la fenêtre « %s » n’écrase pas le magasin du MJ',
            (secondaire) => {
                ecrireDuMJ();
                const ecritParLeMJ = surLeDisque(cle);

                role.current = secondaire;
                ecrireDuHub();

                expect(surLeDisque(cle)).toBe(ecritParLeMJ);
                expect(temoinSurDisque()).toBeGreaterThan(0);
            },
        );

        it('la lecture reste ouverte — la fenêtre secondaire s’hydrate encore', async () => {
            ecrireDuMJ();

            role.current = 'hub';
            ecrireDuHub();
            await rehydrater();

            expect(temoinEnMemoire()).toBeGreaterThan(0);
        });
    });
});
