import { useState, useEffect, useRef, useCallback } from 'react';
import { useClientStore } from '../../../stores/useClientStore';
import { type RemoteSyncData, type RemoteActionType } from '../types/remote.types';
import { type RollResult as BaseRollResult } from '../../dice/DiceEngine';
import { capturePairingTokenFromUrl, getPairingToken } from '../pairingToken';

export interface RollRecord extends BaseRollResult {
    id: string;
    timestamp: Date;
    title: string;
}

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

// Au chargement du module : le token arrive dans le fragment du QR d'appairage,
// il faut le capturer avant que la première connexion ne s'ouvre.
capturePairingTokenFromUrl();

export const useRemoteSync = () => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [isPaired, setIsPaired] = useState<boolean>(() => !!getPairingToken());
    const [syncData, setSyncData] = useState<RemoteSyncData>(INITIAL_SYNC_DATA);
    const [lastDiceResult, setLastDiceResult] = useState<RollRecord | null>(null);
    const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const backoffRef = useRef(BACKOFF_INITIAL);
    const connectRef = useRef<(() => void) | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
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

            // Le rôle 'remote' est privilégié (flux MJ non caviardé) : sans token
            // valide, le serveur rétrograde la connexion en simple joueur.
            socket.send(JSON.stringify({
                type: 'remote:register',
                payload: { deviceId, pseudo, role: 'remote', token: getPairingToken() }
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
                
                // Unified Sync Logic
                if (data.type === 'sync') {
                    setSyncData(prev => ({
                        ...prev,
                        ...data.payload,
                        // Deep merge for specific complex objects if needed
                        combat: data.payload.combat ? { ...prev.combat, ...data.payload.combat } : prev.combat,
                        notes: data.payload.notes ? { ...prev.notes, ...data.payload.notes } : prev.notes,
                        whiteboard: data.payload.whiteboard ? { ...prev.whiteboard, ...data.payload.whiteboard } : prev.whiteboard,
                        // `session` arrive partiel depuis que le diff descend d'un
                        // niveau : l'écraser perdrait les champs inchangés.
                        session: data.payload.session ? { ...prev.session, ...data.payload.session } : prev.session
                    }));
                } 
                // Legacy Sync Segments
                else if (data.type.startsWith('sync:')) {
                    const key = data.type.split(':')[1] as keyof RemoteSyncData;
                    setSyncData(prev => ({
                        ...prev,
                        [key]: typeof data.payload === 'object' && !Array.isArray(data.payload)
                            ? { ...(prev[key] as Record<string, unknown>), ...data.payload }
                            : data.payload
                    }));
                }
                // Specific UI Actions
                else if (data.type === 'dice:result') {
                    setLastDiceResult(data.payload);
                    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
                    resultTimeoutRef.current = setTimeout(() => {
                        setLastDiceResult(null);
                    }, 15000);
                }
                // Le serveur confirme le rôle réellement accordé, qui peut être
                // inférieur à celui demandé si l'appairage n'a pas été validé.
                else if (data.type === 'remote:registered') {
                    setIsPaired(data.payload?.role === 'remote');
                }
                // Handle Remote Errors (e.g. Character Collision)
                else if (data.type === 'remote:error') {
                    console.error('[Remote Error]', data.payload);
                    if (data.payload?.code === 'pairing_required') {
                        // La socket est bien ouverte : on est connecté, mais en
                        // mode joueur. Ce n'est pas une erreur de connexion.
                        setIsPaired(false);
                    } else {
                        setStatus('error');
                    }
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

    const clearDiceResult = useCallback(() => {
        if (resultTimeoutRef.current) {
            clearTimeout(resultTimeoutRef.current);
            resultTimeoutRef.current = null;
        }
        setLastDiceResult(null);
    }, []);

    return {
        status,
        isPaired,
        syncData,
        lastDiceResult,
        clearDiceResult,
        sendAction
    };
};
