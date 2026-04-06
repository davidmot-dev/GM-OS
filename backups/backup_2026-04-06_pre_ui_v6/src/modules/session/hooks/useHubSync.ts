import { useEffect, useState, useCallback, useRef } from 'react';
import { openDB } from 'idb';
import { useImageStore } from '../../image/useImageStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useClockStore } from '../../../store/useClockStore';
import { useFavoriteStore, type FavoriteEntity } from '../../favorite/useFavoriteStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useClientStore } from '../../../stores/useClientStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { type Entity, type AtlasMap } from '../store/types';
import type { ProjectedEntity } from '../../image/types';

/**
 * Attempts to resolve an m-xxx media ID to a data: URI using the local IndexedDB.
 */
async function resolveMediaToDataUrl(src: string | undefined): Promise<string | undefined> {
    if (!src) return undefined;
    if (!src.startsWith('m-')) return src;
    try {
        const db = await openDB('gmos-media-db', 1);
        const item = await db.get('media', src);
        if (item?.blob) {
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(item.blob as Blob);
            });
        }
    } catch (e) {
        console.error('[useHubSync] Could not resolve m-id:', src, e);
    }
    return undefined;
}

export const useHubSync = () => {
    // Current State
    const { projections } = useImageStore();
    const { timestamp, mode, theme, tensions, isClockProjected } = useClockStore();
    const { favorites } = useFavoriteStore();
    const { combatants, currentTurnIdx, round, isCombatProjected } = useCombatStore();
    const { clues, activeCampaignId, activeCampaignName, activeCampaignWallpaper, entities, atlasMaps, sessions } = useSessionOSStore();
    const { deviceId, pseudo, playerName, characterId, setStatus: setClientStatus, isOnboarded } = useClientStore();

    // Derived UI State
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [liveImagePath, setLiveImagePath] = useState<string | null | undefined>(undefined);
    const [liveEntity, setLiveEntity] = useState<ProjectedEntity | null>(null);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [sessionSummary, setSessionSummary] = useState<string>('');
    const [showDice, setShowDice] = useState(false);

    // Resolved Assets
    const [resolvedFavorites, setResolvedFavorites] = useState<FavoriteEntity[]>([]);
    const [resolvedNpcs, setResolvedNpcs] = useState<Entity[]>([]);
    const [resolvedAtlasMaps, setResolvedAtlasMaps] = useState<AtlasMap[]>([]);

    const socketRef = useRef<WebSocket | null>(null);
    const diceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastDiceTriggerRef = useRef(0);
    const { projectionTrigger, isDiceProjected } = useDiceStore();

    const host = window.location.hostname;
    const port = 3001;
    const connectRef = useRef<() => void>(() => {});

    // WebSocket Connection Logic
    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;
        
        const socketUrl = `ws://${host}:${port}`;
        console.log('[useHubSync] Connecting to:', socketUrl);
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('[useHubSync] Connected to Nexus Bridge');
            setStatus('connected');
            setClientStatus('active');
            socket.send(JSON.stringify({ 
                type: 'remote:register',
                payload: { deviceId, pseudo, playerName, characterId, role: 'hub' }
            }));
            socket.send(JSON.stringify({ type: 'remote:request-sync' }));
        };

        socket.onclose = () => {
            console.log('[useHubSync] WebSocket Disconnected');
            setStatus('error');
            setClientStatus('disconnected');
            // Reconnect via connectRef to avoid circular dependency in declaration
            setTimeout(() => {
                if (socketRef.current?.readyState !== WebSocket.OPEN) {
                    connectRef.current();
                }
            }, 5000);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'hub-projection') {
                    const { type, data: payload } = data.payload;
                    if (type === 'image') setLiveImagePath(payload || null);
                    if (type === 'entity') {
                        setLiveEntity(payload ? JSON.parse(payload) : null);
                    }
                }

                if (data.type === 'sync' && data.payload) {
                    const { clock, combat, voiceLevel: vLevel, session, notes, dice } = data.payload;
                    
                    if (clock) useClockStore.setState(prev => ({ ...prev, ...clock }));
                    if (combat) useCombatStore.setState(prev => ({ ...prev, ...combat }));
                    if (vLevel !== undefined) setVoiceLevel(vLevel);
                    if (notes?.public !== undefined) setSessionSummary(notes.public);
                    if (dice) useDiceStore.setState(prev => ({ ...prev, ...dice }));

                    if (session) {
                        useSessionOSStore.setState({ 
                            sessions: session.sessions || [],
                            campaigns: session.campaigns || [],
                            players: session.players || [],
                            clues: session.clues || [],
                            entities: session.entities || [],
                            atlasMaps: session.atlasMaps || [],
                            activeCampaignId: session.activeCampaignId || null,
                            activeCampaignName: session.activeCampaignName || null,
                            activeCampaignWallpaper: session.activeCampaignWallpaper || null,
                            customSheetTemplates: session.customSheetTemplates || [],
                            customGameDrivers: session.customGameDrivers || []
                        });

                        if (session.favorites) {
                            useFavoriteStore.setState({
                                favorites: session.favorites || []
                            });
                        }
                    }
                }

                if (data.type === 'session:receive-message' && data.payload) {
                    const msg = data.payload;
                    useSessionOSStore.getState().addSessionMessage(msg);
                    
                    if (msg.fromId !== characterId && (msg.toId === characterId || msg.toId === 'all' || !msg.toId)) {
                        const isBroadcast = msg.toId === 'all' || !msg.toId;
                        const isFromGM = msg.fromId === 'GM';
                        
                        useSessionOSStore.getState().addHubNotification({
                            type: 'message',
                            title: isBroadcast 
                                ? (isFromGM ? 'Annonce MJ' : 'Message Général')
                                : (isFromGM ? 'Message Privé (MJ)' : `Message de ${msg.fromName}`),
                            content: msg.content,
                            fromName: msg.fromName
                        });
                    }
                }
            } catch (err) {
                console.error('[useHubSync] Sync parsing error:', err);
            }
        };

        socket.onerror = () => setStatus('error');

        return () => {
            socket.close();
        };
    }, [host, port, deviceId, pseudo, playerName, setClientStatus, characterId]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    // IPC Bridges (Electron)
    useEffect(() => {
        const handleIpcUpdate = (_event: unknown, ...args: unknown[]) => {
            const [type, data] = args as [string, string];
            if (type === 'image') setLiveImagePath(data || null);
            else if (type === 'entity') setLiveEntity(data ? JSON.parse(data) : null);
            else if (type === 'voice-level') setVoiceLevel(parseFloat(data) || 0);
        };

        if (window.appBridge?.on) {
            window.appBridge.on('image:sync-hub-data', handleIpcUpdate);
        }

        const handleSendMessage = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'session:send-message',
                    payload: customEvent.detail
                }));
            }
        };

        window.addEventListener('session:send-message', handleSendMessage);
        connect();

        return () => {
            window.removeEventListener('session:send-message', handleSendMessage);
            if (window.appBridge?.off) {
                window.appBridge.off('image:sync-hub-data', handleIpcUpdate);
            }
        };
    }, [connect]);

    // Asset Resolution (m-xxx)
    useEffect(() => {
        let mounted = true;
        const resolveAssets = async () => {
            // Favorites
            const sharedFavs = favorites.filter(f => f.isSyncedToPlayerHub || f.ownerId === characterId);
            const resFavs = await Promise.all(sharedFavs.map(async f => ({
                ...f,
                imageUrl: await resolveMediaToDataUrl(f.imageUrl) || f.imageUrl,
                tokenUrl: await resolveMediaToDataUrl(f.tokenUrl) || f.tokenUrl
            })));

            // NPCs
            const activeNpcs = entities.filter(e => String(e.campaignId) === String(activeCampaignId) && e.isVisibleByPlayers);
            const resNpcs = await Promise.all(activeNpcs.map(async e => ({
                ...e,
                avatar: await resolveMediaToDataUrl(e.avatar) || e.avatar
            })));

            // Atlas
            const activeMaps = atlasMaps.filter(m => String(m.campaignId) === String(activeCampaignId) && m.isVisited);
            const resMaps = await Promise.all(activeMaps.map(async m => ({
                ...m,
                fileUrl: await resolveMediaToDataUrl(m.fileUrl) || m.fileUrl
            })));

            if (mounted) {
                setResolvedFavorites(resFavs);
                setResolvedNpcs(resNpcs);
                setResolvedAtlasMaps(resMaps);
            }
        };
        resolveAssets();
        return () => { mounted = false; };
    }, [favorites, entities, atlasMaps, activeCampaignId, characterId]);

    // Dice Trigger
    useEffect(() => {
        if (isDiceProjected && projectionTrigger !== lastDiceTriggerRef.current) {
            lastDiceTriggerRef.current = projectionTrigger;
            // De-sync to avoid cascading render lint
            Promise.resolve().then(() => setShowDice(true));
            if (diceTimerRef.current) clearTimeout(diceTimerRef.current);
            diceTimerRef.current = setTimeout(() => setShowDice(false), 5000);
        }
    }, [isDiceProjected, projectionTrigger]);

    return {
        status,
        liveImagePath,
        liveEntity,
        voiceLevel,
        sessionSummary,
        showDice,
        resolvedFavorites,
        resolvedNpcs,
        resolvedAtlasMaps,
        projections,
        timestamp,
        mode,
        theme,
        tensions,
        isClockProjected,
        combatants,
        currentTurnIdx,
        round,
        isCombatProjected,
        clues,
        activeCampaignId,
        activeCampaignName,
        activeCampaignWallpaper,
        sessions,
        isOnboarded,
        characterId
    };
};
