import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * Point 5 du plan des restes : borner la cadence de `remote:request-sync`.
 *
 * Une demande forcée court-circuite le frein de 500 ms, et c'est voulu — un
 * appareil qui se connecte doit recevoir l'état sans attendre. Mais rien n'en
 * bornait la cadence, alors que le déclencheur vient du réseau : `SyncServer`
 * en émet une à chaque connexion de socket, et une tablette peut en envoyer sur
 * simple message. Une tablette qui se reconnecte en boucle relançait autant de
 * synchronisations complètes, résolution des médias comprise.
 */

/**
 * Sonde : `useSoundStore.getState()` est la première chose que fait le corps de
 * `handleSync`, juste après les gardes. La compter dit exactement combien
 * d'invocations ont franchi le plancher — sans dépendre de la réussite du
 * payload complet, qui demanderait de simuler onze stores en entier.
 */
const franchissements = vi.hoisted(() => ({ n: 0 }));

vi.mock('../../../utils/mediaResolver', () => ({
    resolveToSendableUrl: async (u: unknown) => u,
}));

vi.mock('../../../services/CrossWindowEventService', () => ({
    crossWindowSync: { isSyncing: () => false },
}));

const storeVide = vi.hoisted(() => () => ({
    getState: () => ({
        sessions: [], campaigns: [], entities: [], players: [], clues: [], atlasMaps: [],
        customSheetTemplates: [], customGameDrivers: [], activeCampaignId: null,
        combatants: [], moments: [], atmospheres: [], notes: {}, pads: [], favorites: [],
        paths: [], tensions: [], isSystemSyncing: false, masterVolume: 1,
    }),
    subscribe: () => () => { /* pas d'abonnement en test */ },
}));

vi.mock('../../sound/useSoundStore', () => ({
    useSoundStore: {
        ...storeVide(),
        getState: () => {
            franchissements.n += 1;
            return { atmospheres: [], activeAtmosphereId: null, masterVolume: 1 };
        },
    },
}));
vi.mock('../../storyboard/useStoryboardStore', () => ({ useStoryboardStore: storeVide() }));
vi.mock('../../combat/useCombatStore', () => ({ useCombatStore: storeVide() }));
vi.mock('../../session/useSessionOSStore', () => ({ useSessionOSStore: storeVide() }));
vi.mock('../../favorite/useFavoriteStore', () => ({ useFavoriteStore: storeVide() }));
vi.mock('../../whiteboard/useWhiteboardStore', () => ({ useWhiteboardStore: storeVide() }));
vi.mock('../../../store/useClockStore', () => ({ useClockStore: storeVide() }));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: storeVide() }));
vi.mock('../../image/useImageStore', () => ({ useImageStore: storeVide() }));
vi.mock('../../../stores/useDiceStore', () => ({ useDiceStore: storeVide() }));
vi.mock('../../map/useMapStore', () => ({ useMapStore: storeVide() }));

const { useNexusSynchronizer } = await import('./useNexusSynchronizer');

beforeEach(() => {
    vi.useFakeTimers();
    franchissements.n = 0;
    (window as unknown as { appBridge: unknown }).appBridge = { send: () => { /* rien */ } };
});

afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('useNexusSynchronizer — cadence des synchronisations forcées', () => {
    it('une rafale de demandes forcées ne produit pas une synchronisation par demande', async () => {
        const { result } = renderHook(() => useNexusSynchronizer(true));
        await vi.advanceTimersByTimeAsync(10);
        const depart = franchissements.n;

        // Dix tablettes qui se reconnectent coup sur coup.
        for (let i = 0; i < 10; i++) await result.current.handleSync(true);

        // Sans plancher, chacune franchissait. Avec, elles se fondent.
        expect(franchissements.n - depart).toBeLessThan(10);
    });

    it("la demande reportée finit par partir : elle n'est pas perdue", async () => {
        const { result } = renderHook(() => useNexusSynchronizer(true));
        await vi.advanceTimersByTimeAsync(10);

        await result.current.handleSync(true);
        const apresPremiere = franchissements.n;

        await result.current.handleSync(true); // dans le plancher : reportée
        await vi.advanceTimersByTimeAsync(1500);

        expect(franchissements.n).toBeGreaterThan(apresPremiere);
    });
});
