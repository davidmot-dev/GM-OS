import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Régression : le suivi de combat du Player Hub ignorait la bascule de
 * projection du MJ.
 *
 * `HubCombatTracker` était rendu sans garde, `hasCombatants` ne servant qu'à une
 * classe de mise en page. Le bouton de projection du combat semblait donc sans
 * effet sur le Hub — alors qu'il fonctionnait sur la tablette, dont le rendu est
 * bien conditionné (`TabletHub`, `hasCombatants && activeCombatant`).
 *
 * C'est l'écart entre les deux vues qui a fini par désigner la cause : même
 * état, même source, deux rendus différents.
 */

const hubSyncState = vi.hoisted(() => ({
    current: {} as Record<string, unknown>,
}));

vi.mock('../../modules/session/hooks/useHubSync', () => ({
    useHubSync: () => hubSyncState.current,
}));

vi.mock('../hub/HubCombatTracker', () => ({
    HubCombatTracker: () => <div data-testid="combat-tracker" />,
}));

// Vues lourdes ou dépendantes du navigateur : hors sujet pour ce test.
vi.mock('../../modules/map/components/PlayerMapCanvas', () => ({ default: () => null }));
vi.mock('../../modules/whiteboard/components/PlayerDrawingCanvas', () => ({ PlayerDrawingCanvas: () => null }));
vi.mock('../../modules/dice/DiceBox3D', () => ({ default: () => null }));
vi.mock('../hub/HubClockWidgets', () => ({ HubClockWidgets: () => null }));
vi.mock('../hub/HubProjectionCard', () => ({ HubProjectionCard: () => null }));
vi.mock('../hub/HubDiceDisplay', () => ({ HubDiceDisplay: () => null }));
vi.mock('../../hooks/useMediaUrl', () => ({ useMediaUrl: () => null }));

/** Store factice : répond à un sélecteur comme à un appel nu. */
const storeMock = (data: Record<string, unknown>) => {
    const mock = ((selector?: (s: Record<string, unknown>) => unknown) =>
        selector ? selector(data) : data) as unknown as {
            (selector?: (s: Record<string, unknown>) => unknown): unknown;
            getState: () => Record<string, unknown>;
            persist: { rehydrate: () => Promise<void> };
        };
    mock.getState = () => data;
    mock.persist = { rehydrate: () => Promise.resolve() };
    return mock;
};

vi.mock('../../store/useClockStore', () => ({ useClockStore: storeMock({}) }));
vi.mock('../../modules/combat/useCombatStore', () => ({ useCombatStore: storeMock({}) }));
vi.mock('../../modules/favorite/useFavoriteStore', () => ({ useFavoriteStore: storeMock({}) }));
vi.mock('../../modules/map/useMapStore', () => ({
    useMapStore: storeMock({ projectionTarget: null, projectedMapUrl: null }),
}));
vi.mock('../../modules/whiteboard/useWhiteboardStore', () => ({
    useWhiteboardStore: storeMock({ projectionTarget: null, backgroundMode: 'dark' }),
}));
vi.mock('../../modules/image/useImageStore', () => ({ useImageStore: storeMock({}) }));
vi.mock('../../stores/useDiceStore', () => ({
    useDiceStore: storeMock({ lastRoll: null, enable3D: false }),
}));
vi.mock('../../modules/session/useSessionOSStore', () => ({ useSessionOSStore: storeMock({}) }));

const PlayerHub = (await import('../PlayerHub')).default;

/** Deux combattants : la garde doit tenir à l'état de projection, pas au vide. */
const COMBATTANTS = [{ id: 'c1' }, { id: 'c2' }];

function etatHub(isCombatProjected: boolean, combatants: unknown[] = COMBATTANTS) {
    return {
        liveImagePath: undefined,
        liveEntity: null,
        showDice: false,
        resolvedFavorites: [],
        isClockProjected: false,
        timestamp: 0,
        mode: 'day',
        theme: 'default',
        tensions: [],
        combatants,
        currentTurnIdx: 0,
        round: 1,
        isCombatProjected,
        activeCampaignWallpaper: null,
        voiceLevel: 0,
        projections: {},
    };
}

beforeEach(() => {
    hubSyncState.current = etatHub(true);
});

describe('PlayerHub — le suivi de combat suit la projection du MJ', () => {
    it('affiche le suivi quand le MJ projette le combat', () => {
        hubSyncState.current = etatHub(true);
        render(<PlayerHub />);
        expect(screen.queryByTestId('combat-tracker')).not.toBeNull();
    });

    it("retire le suivi quand le MJ coupe la projection", () => {
        hubSyncState.current = etatHub(false);
        render(<PlayerHub />);
        expect(screen.queryByTestId('combat-tracker')).toBeNull();
    });

    it("n'affiche rien quand il n'y a aucun combattant, même projection active", () => {
        hubSyncState.current = etatHub(true, []);
        render(<PlayerHub />);
        expect(screen.queryByTestId('combat-tracker')).toBeNull();
    });
});
