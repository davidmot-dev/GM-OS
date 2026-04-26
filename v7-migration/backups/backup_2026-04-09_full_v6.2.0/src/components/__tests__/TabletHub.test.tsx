import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import TabletHub from '../TabletHub';

// Mock window.appBridge
(window as any).appBridge = {
    on: vi.fn(),
    off: vi.fn(),
    persist: { rehydrate: vi.fn() }
};

const { createStoreMock } = vi.hoisted(() => {
    const createStoreMock = (data: Record<string, unknown>) => {
        const mock = vi.fn(() => data) as any;
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

describe('TabletHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<TabletHub />);
    expect(container).toBeTruthy();
  });
});
