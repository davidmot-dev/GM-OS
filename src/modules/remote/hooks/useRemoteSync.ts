import { useState, useEffect, useRef, useCallback } from 'react';
import { useClientStore } from '../../../stores/useClientStore';
import { type RemoteSyncData, type RemoteActionType } from '../types/remote.types';

const INITIAL_SYNC_DATA: RemoteSyncData = {
    sounds: [],
    moments: [],
    masterVolume: 1.0,
    combat: { combatants: [], currentTurnIdx: 0, round: 1 },
    notes: { public: '', private: '' },
    whiteboard: {
        paths: [],
        activePath: null,
        laserPointer: null,
        backgroundMode: 'dark',
        currentTool: 'brush',
        currentColor: '#ffffff',
        currentWidth: 3
    },
    universalPads: []
};

const BACKOFF_INITIAL = 1000;
const BACKOFF_MAX = 30000;

export const useRemoteSync = () => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [syncData, setSyncData] = useState<RemoteSyncData>(INITIAL_SYNC_DATA);
    const socketRef = useRef<WebSocket | null>(null);
    const backoffRef = useRef(BACKOFF_INITIAL);
    const connectRef = useRef<(() => void) | null>(null);
    const reconnectTimerRef = useRef<any>(null);
    
    const { deviceId, pseudo, setStatus: setClientStatus } = useClientStore();

    const host = window.location.hostname;
    const port = 3001;

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;

        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        setStatus('connecting');
        const socketUrl = `ws://${host}:${port}`;
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('[Remote] Connected to GM-OS');
            setStatus('connected');
            setClientStatus('active');
            backoffRef.current = BACKOFF_INITIAL; // Reset backoff on success

            socket.send(JSON.stringify({ 
                type: 'remote:register', 
                payload: { deviceId, pseudo, role: 'remote' } 
            }));
        };

        socket.onclose = () => {
            console.log(`[Remote] Disconnected. Retrying in ${backoffRef.current}ms...`);
            setStatus('error');
            setClientStatus('disconnected');
            
            reconnectTimerRef.current = setTimeout(() => {
                const nextBackoff = Math.min(backoffRef.current * 2, BACKOFF_MAX);
                backoffRef.current = nextBackoff;
                if (connectRef.current) connectRef.current();
            }, backoffRef.current);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'sync' || data.type.startsWith('sync:')) {
                    const key = data.type === 'sync' ? null : data.type.split(':')[1];
                    setSyncData(prev => {
                        if (!key) {
                            return {
                                ...prev,
                                ...data.payload,
                                combat: data.payload.combat ? { ...prev.combat, ...data.payload.combat } : prev.combat,
                                notes: data.payload.notes ? { ...prev.notes, ...data.payload.notes } : prev.notes,
                                whiteboard: data.payload.whiteboard ? { ...prev.whiteboard, ...data.payload.whiteboard } : prev.whiteboard
                            };
                        }
                        const typedKey = key as keyof RemoteSyncData;
                        const previousValue = prev[typedKey];
                        return {
                            ...prev,
                            [typedKey]: typeof data.payload === 'object' && !Array.isArray(data.payload)
                                ? { ...(previousValue as Record<string, unknown>), ...data.payload }
                                : data.payload
                        };
                    });
                }
            } catch (err) {
                console.error('[Remote] Failed to parse message:', err);
            }
        };

        socket.onerror = () => setStatus('error');
        socketRef.current = socket;
    }, [host, port, deviceId, pseudo, setClientStatus]);

    // Update ref whenever connect changes
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        const timer = setTimeout(() => {
            connect();
        }, 0);
        return () => {
            clearTimeout(timer);
            socketRef.current?.close();
        };
    }, [connect]);

    const sendAction = useCallback((type: RemoteActionType, payload: unknown) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, payload }));
            if ('vibrate' in navigator) window.navigator.vibrate(50);
        }
    }, []);

    return {
        status,
        syncData,
        sendAction
    };
};
