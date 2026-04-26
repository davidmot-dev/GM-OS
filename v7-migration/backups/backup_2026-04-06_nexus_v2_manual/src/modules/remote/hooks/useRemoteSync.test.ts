import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRemoteSync } from './useRemoteSync';

// Mock the client store
vi.mock('../../../stores/useClientStore', () => ({
    useClientStore: () => ({
        deviceId: 'test-device',
        pseudo: 'Test Player',
        setStatus: vi.fn(),
    }),
}));

describe('useRemoteSync', () => {
    let mockWebSocket: any;

    beforeEach(() => {
        vi.useFakeTimers();
        mockWebSocket = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: WebSocket.CONNECTING,
        };
        global.WebSocket = vi.fn(() => mockWebSocket) as any;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should initialize with default sync data', () => {
        const { result } = renderHook(() => useRemoteSync());
        expect(result.current.syncData.masterVolume).toBe(1.0);
        expect(result.current.syncData.sounds).toEqual([]);
    });

    it('should attempt to connect on mount', () => {
        renderHook(() => useRemoteSync());
        expect(global.WebSocket).toHaveBeenCalled();
    });

    it('should handle granular sync messages', () => {
        const { result } = renderHook(() => useRemoteSync());
        
        act(() => {
            mockWebSocket.onmessage({
                data: JSON.stringify({
                    type: 'sync:masterVolume',
                    payload: 0.5
                })
            });
        });

        expect(result.current.syncData.masterVolume).toBe(0.5);
    });

    it('should perform deep merging for combat updates', () => {
        const { result } = renderHook(() => useRemoteSync());
        
        act(() => {
            mockWebSocket.onmessage({
                data: JSON.stringify({
                    type: 'sync:combat',
                    payload: { round: 5 }
                })
            });
        });

        expect(result.current.syncData.combat.round).toBe(5);
        expect(result.current.syncData.combat.combatants).toEqual([]);
    });

    it('should implement exponential backoff on connection loss', () => {
        renderHook(() => useRemoteSync());
        
        act(() => {
            mockWebSocket.onclose();
        });

        // First retry after 2000ms
        vi.advanceTimersByTime(2000);
        expect(global.WebSocket).toHaveBeenCalledTimes(2);

        act(() => {
            mockWebSocket.onclose();
        });

        // Second retry should be after 4000ms
        vi.advanceTimersByTime(2000); // 2000ms passed, not enough
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
        
        vi.advanceTimersByTime(2000); // 4000ms passed
        expect(global.WebSocket).toHaveBeenCalledTimes(3);
    });
});
