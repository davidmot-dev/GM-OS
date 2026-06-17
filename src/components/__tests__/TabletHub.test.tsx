import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import TabletHub from '../TabletHub';

// Types strictly defined for the mock appBridge
interface MockAppBridge {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    persist: {
        rehydrate: ReturnType<typeof vi.fn>;
    };
}

(window as unknown as { appBridge: MockAppBridge }).appBridge = {
    on: vi.fn(),
    off: vi.fn(),
    persist: { rehydrate: vi.fn(() => Promise.resolve()) }
};

interface StoreMock {
    (selector?: (s: any) => any): any;
    persist: { rehydrate: ReturnType<typeof vi.fn> };
    setState: ReturnType<typeof vi.fn>;
    getState: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
}

const { createStoreMock } = vi.hoisted(() => {
    const createStoreMock = (data: Record<string, unknown>): StoreMock => {
        const mock = vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
            return selector ? selector(data) : data;
        }) as unknown as StoreMock;
        mock.persist = { rehydrate: vi.fn(() => Promise.resolve()) };
        mock.setState = vi.fn();
        mock.getState = vi.fn(() => data);
        mock.subscribe = vi.fn(() => {
            return () => {};
        });
        return mock;
    };
    return { createStoreMock };
});

vi.mock('../../modules/combat/useCombatStore', () => ({
    useCombatStore: createStoreMock({ combatants: [], currentTurnIdx: 0, round: 1 })
}));

vi.mock('../../modules/image/useImageStore', () => ({
    useImageStore: createStoreMock({ projections: {}, mediaList: [] })
}));

vi.mock('../../store/useClockStore', () => ({
    useClockStore: createStoreMock({ timestamp: 0, mode: 'realtime', theme: 'default', tensions: [] })
}));

vi.mock('../../modules/favorite/useFavoriteStore', () => ({
    useFavoriteStore: createStoreMock({ favorites: [] })
}));

vi.mock('../../modules/map/useMapStore', () => ({
    useMapStore: createStoreMock({ mapUrl: null, projectionTarget: 'none', addPing: vi.fn() })
}));

vi.mock('../../modules/whiteboard/useWhiteboardStore', () => ({
    useWhiteboardStore: createStoreMock({ backgroundMode: 'dark', projectionTarget: 'none' })
}));

vi.mock('../../modules/voice/useVoiceStore', () => ({
    useVoiceStore: createStoreMock({ isSyncNPC: false })
}));

vi.mock('../../modules/tactical-ai/useTacticalAIStore', () => ({
    useTacticalAIStore: createStoreMock({ settings: {} })
}));

// Mock useSessionOSStore (used by TabletHub.tsx & HubNotificationCenter.tsx)
vi.mock('../../modules/session/useSessionOSStore', () => ({
    useSessionOSStore: createStoreMock({
        messages: [],
        players: [],
        entities: [],
        sessions: [],
        transferRequests: [],
        clues: [],
        hubNotifications: [],
        clearHubNotification: vi.fn(),
        requestItemTransfer: vi.fn(),
        removeInventoryItem: vi.fn(),
        addSessionMessage: vi.fn(),
        connectedCharacters: {},
        activeCampaignId: 'c-1',
        activeCampaignName: 'Test Campaign',
        activeCampaignWallpaper: null
    })
}));

// Mock useClientStore (used by TabletHub.tsx)
vi.mock('../../stores/useClientStore', () => ({
    useClientStore: createStoreMock({ deviceId: 'device-1', pseudo: 'Player', playerName: 'Player', characterId: 'char-1', isOnboarded: true, resetIdentity: vi.fn() })
}));

// Mock useDiceStore (used by TabletHub.tsx)
vi.mock('../../stores/useDiceStore', () => ({
    useDiceStore: createStoreMock({ lastRoll: null })
}));

// Mock useHubSync to prevent actual WebSocket/IndexedDB connections and act(...) warnings
vi.mock('../../modules/session/hooks/useHubSync', () => ({
    useHubSync: vi.fn(() => ({
        status: 'connected',
        liveImagePath: null,
        liveEntity: null,
        voiceLevel: 0,
        sessionSummary: '',
        showDice: false,
        resolvedFavorites: [],
        resolvedNpcs: [],
        resolvedAtlasMaps: [],
        projections: {},
        timestamp: 0,
        mode: 'realtime',
        theme: 'default',
        tensions: [],
        isClockProjected: false,
        combatants: [],
        currentTurnIdx: 0,
        round: 1,
        isCombatProjected: false,
        clues: [],
        activeCampaignId: 'c-1',
        activeCampaignName: 'Test Campaign',
        activeCampaignWallpaper: null,
        sessions: [{ id: 's-1', status: 'active' }],
        transferRequests: [],
        connectedCharacters: {},
        isOnboarded: true,
        characterId: 'char-1',
        deviceId: 'device-1',
        pseudo: 'Player',
        playerName: 'Player',
        sharedRule: null,
        setSharedRule: vi.fn(),
        latency: 10
    }))
}));

describe('TabletHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<TabletHub />);
    expect(container).toBeTruthy();
  });
});
