import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRemoteSync } from './useRemoteSync';

const mockSetStatus = vi.fn();
const mockClientStore = {
    deviceId: 'test-device',
    pseudo: 'Test Player',
    setStatus: mockSetStatus,
};

vi.mock('../../../stores/useClientStore', () => ({
    useClientStore: () => mockClientStore,
}));

describe('useRemoteSync', () => {
    let mockWebSocket: {
        send: ReturnType<typeof vi.fn>;
        close: ReturnType<typeof vi.fn>;
        readyState: number;
        onmessage?: (event: { data: string }) => void;
        onclose?: () => void;
        onopen?: () => void;
        onerror?: () => void;
    };
    let mockWebSocketSpy: ReturnType<typeof vi.fn>;
    let originalWebSocket: typeof WebSocket;

    beforeEach(() => {
        vi.useFakeTimers();
        originalWebSocket = globalThis.WebSocket;

        const MockWS = vi.fn().mockImplementation(function (this: any) {
            this.send = vi.fn();
            this.close = vi.fn();
            this.readyState = 0; // CONNECTING
            mockWebSocket = this;
            return this;
        });
        (MockWS as any).CONNECTING = 0;
        (MockWS as any).OPEN = 1;
        (MockWS as any).CLOSING = 2;
        (MockWS as any).CLOSED = 3;

        mockWebSocketSpy = MockWS;
        globalThis.WebSocket = MockWS as unknown as typeof WebSocket;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        globalThis.WebSocket = originalWebSocket;
    });

    it('should initialize with default sync data', () => {
        const { result } = renderHook(() => useRemoteSync());
        expect(result.current.syncData.masterVolume).toBe(1.0);
        expect(result.current.syncData.sounds).toEqual([]);
    });

    it('should attempt to connect on mount', () => {
        renderHook(() => useRemoteSync());
        act(() => { vi.advanceTimersByTime(0); });
        expect(mockWebSocketSpy).toHaveBeenCalled();
    });

    it('should handle granular sync messages', () => {
        const { result } = renderHook(() => useRemoteSync());
        act(() => { vi.advanceTimersByTime(0); });
        
        act(() => {
            mockWebSocket.onmessage!({
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
        act(() => { vi.advanceTimersByTime(0); });
        
        act(() => {
            mockWebSocket.onmessage!({
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
        act(() => { vi.advanceTimersByTime(0); });
        
        act(() => {
            mockWebSocket.readyState = 3; // CLOSED
            mockWebSocket.onclose!();
        });

        // First retry after 1000ms
        act(() => { vi.advanceTimersByTime(1000); });
        expect(mockWebSocketSpy).toHaveBeenCalledTimes(2);

        act(() => {
            mockWebSocket.readyState = 3; // CLOSED
            mockWebSocket.onclose!();
        });

        // Second retry should be after 2000ms
        act(() => { vi.advanceTimersByTime(1000); }); // 1000ms passed, not enough
        expect(mockWebSocketSpy).toHaveBeenCalledTimes(2);
        
        act(() => { vi.advanceTimersByTime(1000); }); // 2000ms passed, triggers retry
        expect(mockWebSocketSpy).toHaveBeenCalledTimes(3);
    });
});
