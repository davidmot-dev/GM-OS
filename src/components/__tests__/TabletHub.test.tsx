import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabletHub from '../TabletHub';
import React from 'react';

// Mock window.appBridge
(window as any).appBridge = {
    on: vi.fn(),
    off: vi.fn(),
    persist: { rehydrate: vi.fn() }
};

const { createStoreMock, mocks } = vi.hoisted(() => {
    const createStoreMock = (data: any) => {
        const mock = vi.fn(() => data);
        (mock as any).persist = { rehydrate: vi.fn(() => Promise.resolve()) };
        (mock as any).setState = vi.fn();
        (mock as any).getState = vi.fn(() => data);
        (mock as any).subscribe = vi.fn((cb: any) => {
            // No-op subscribe
            return () => {};
        });
        return mock;
    };

    return {
        createStoreMock,
        mocks: {
            image: createStoreMock({ mediaList: [], projections: {} }),
            combat: createStoreMock({ combatants: [], currentTurnIdx: 0, round: 1 }),
            clock: createStoreMock({ 
                isClockProjected: true, 
                timestamp: 0, 
                mode: 'realtime', 
                theme: 'cyberpunk', 
                tensions: [] 
            }),
            favorite: createStoreMock({ favorites: [] }),
            voice: createStoreMock({}),
            tactical: createStoreMock({})
        }
    };
});

vi.mock('../../modules/image/useImageStore', () => ({ useImageStore: mocks.image }));
vi.mock('../../modules/combat/useCombatStore', () => ({ useCombatStore: mocks.combat }));
vi.mock('../../store/useClockStore', () => ({ useClockStore: mocks.clock }));
vi.mock('../../modules/favorite/useFavoriteStore', () => ({ useFavoriteStore: mocks.favorite }));
vi.mock('../../modules/voice/useVoiceStore', () => ({ useVoiceStore: mocks.voice }));
vi.mock('../../modules/tactical-ai/useTacticalAIStore', () => ({ useTacticalAIStore: mocks.tactical }));

vi.mock('../../hooks/useMediaUrl', () => ({
    useMediaUrl: vi.fn(() => null)
}));

describe('TabletHub', () => {
    it('renders without Map-OS components', () => {
        render(<TabletHub />);
        
        // MapCanvas should NOT be present
        // Since PlayerMapCanvas is excluded, there shouldn't be a map canvas in the main DOM tree of TabletHub
        expect(screen.queryByTestId('player-map-canvas')).toBeNull();
    });

    it('renders clock widget when projected', () => {
        render(<TabletHub />);
        // Checking for elements that should be there
        // Since I mocked useClockStore to have isClockProjected: true
        // and renderClockWidget returns a div with backdrop-blur-md
        const clockContainer = document.querySelector('.backdrop-blur-md');
        expect(clockContainer).toBeTruthy();
    });
});
