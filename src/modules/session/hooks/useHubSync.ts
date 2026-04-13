import { useEffect, useState, useCallback, useRef } from 'react';
import { openDB } from 'idb';
import { useImageStore } from '../../image/useImageStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useClockStore } from '../../../store/useClockStore';
import { useFavoriteStore, type FavoriteEntity } from '../../favorite/useFavoriteStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useClientStore } from '../../../stores/useClientStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSyncStore } from '../../../stores/useSyncStore';
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
    const { clues, activeCampaignId, activeCampaignName, activeCampaignWallpaper, entities, atlasMaps, sessions, transferRequests } = useSessionOSStore();
    const { deviceId, pseudo, playerName, characterId, setStatus: setClientStatus, isOnboarded } = useClientStore();

    // Derived UI State
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [liveImagePath, setLiveImagePath] = useState<string | null | undefined>(undefined);
    const [liveEntity, setLiveEntity] = useState<ProjectedEntity | null>(null);
    const setVoiceLevel = useSyncStore(state => state.setVoiceLevel);
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
    useEffect(() => {
        if (!host) return;

        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let isActive = true;

        const startConnection = () => {
            if (!isActive) return;

            const socketUrl = `ws://${host}:${port}`;
            console.log('[useHubSync] Connecting to:', socketUrl);
            socket = new WebSocket(socketUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                if (!isActive) {
                    socket?.close();
                    return;
                }
                console.log('[useHubSync] Connected to Nexus Bridge');
                setStatus('connected');
                setClientStatus('active');
                socket?.send(JSON.stringify({ 
                    type: 'remote:register',
                    payload: { deviceId, pseudo, playerName, characterId, role: 'hub' }
                }));
                socket?.send(JSON.stringify({ type: 'remote:request-sync' }));
            };

            socket.onclose = () => {
                if (!isActive) return;
                console.log('[useHubSync] WebSocket Disconnected');
                setStatus('error');
                setClientStatus('disconnected');
                
                // Reconnect after 5s
                reconnectTimer = setTimeout(() => {
                    startConnection();
                }, 5000);
            };

            socket.onerror = () => {
                setStatus('error');
            };

            socket.onmessage = (event) => {
                if (!isActive) return;
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'remote:error') {
                        const { code, message } = data.payload || {};
                        console.error(`[useHubSync] Server Error (${code}):`, message);
                        if (code === 'character_taken') {
                            useClientStore.getState().setCharacterId(null);
                            useClientStore.getState().setLastError(message);
                        }
                    }

                    if (data.type === 'hub-projection') {
                        const { type, data: payload } = data.payload;
                        if (type === 'image') setLiveImagePath(payload || null);
                        if (type === 'entity') {
                            const entity = payload ? JSON.parse(payload) : null;
                            console.log(`[useHubSync] Received Hub Entity: ${entity?.name}`);
                            setLiveEntity(entity);
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
                                customGameDrivers: session.customGameDrivers || [],
                                connectedCharacters: session.characterLocks || {}
                            });

                            if (session.favorites) {
                                useFavoriteStore.setState({
                                    favorites: session.favorites || []
                                });
                            }
                        }
                    }

                    // Handle specific P2P events
                    if (data.type === 'session:request-item-transfer' && data.payload) {
                        useSessionOSStore.getState().requestItemTransfer(
                            data.payload.fromCharId,
                            data.payload.toCharId,
                            data.payload.item
                        );
                    }

                    if (data.type === 'session:approve-item-transfer') {
                        useSessionOSStore.getState().approveItemTransfer(data.payload.requestId);
                    }

                    if (data.type === 'session:reject-item-transfer') {
                        useSessionOSStore.getState().rejectItemTransfer(data.payload.requestId);
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
        };

        startConnection();

        return () => {
            isActive = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (socket) {
                socket.onclose = null; // Prevent reconnect loop
                socket.close();
            }
            socketRef.current = null;
        };
    }, [host, deviceId, pseudo, playerName, characterId, setClientStatus]);

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

        const handleUpdateNarrative = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'session:update-character-narrative',
                    payload: customEvent.detail
                }));
            }
        };

        const handleRequestTransfer = (e: Event) => {
            const customEvent = e as CustomEvent;
            
            // 1. Local update (Optimistic UI)
            useSessionOSStore.getState().requestItemTransfer(
                customEvent.detail.fromCharId,
                customEvent.detail.toCharId,
                customEvent.detail.item
            );

            // 2. Network broadcast
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'session:request-item-transfer',
                    payload: customEvent.detail
                }));
            }
        };

        const handleRemoveItem = (e: Event) => {
            const customEvent = e as CustomEvent;
            
            // 1. Local update (Optimistic UI)
            useSessionOSStore.getState().removeInventoryItem(
                customEvent.detail.playerId,
                customEvent.detail.characterId,
                customEvent.detail.itemId
            );

            // 2. Network broadcast
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'session:remove-inventory-item',
                    payload: customEvent.detail
                }));
            }
        };

        window.addEventListener('session:send-message', handleSendMessage);
        window.addEventListener('session:update-character-narrative', handleUpdateNarrative);
        window.addEventListener('session:request-item-transfer', handleRequestTransfer);
        window.addEventListener('session:remove-inventory-item', handleRemoveItem);

        return () => {
            window.removeEventListener('session:send-message', handleSendMessage);
            window.removeEventListener('session:update-character-narrative', handleUpdateNarrative);
            window.removeEventListener('session:request-item-transfer', handleRequestTransfer);
            window.removeEventListener('session:remove-inventory-item', handleRemoveItem);
            if (window.appBridge?.off) {
                window.appBridge.off('image:sync-hub-data', handleIpcUpdate);
            }
        };
    }, []);

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

    // --- Notifications d'Échanges P2P ---
    const lastApprovedRequestsRef = useRef<string[]>([]);
    
    useEffect(() => {
        if (!transferRequests || !characterId) return;

        // 1. Détecter les objets REÇUS
        const approvedForMe = transferRequests.filter(r => 
            r.toCharacterId === characterId && 
            r.status === 'approved' && 
            !lastApprovedRequestsRef.current.includes(r.id)
        );

        if (approvedForMe.length > 0) {
            approvedForMe.forEach(req => {
                useSessionOSStore.getState().addHubNotification({
                    title: 'Objet Reçu !',
                    content: `Vous avez reçu "${req.item.name}" de la part d'un allié.`,
                    fromName: 'SYSTÈME',
                    type: 'system'
                });
                lastApprovedRequestsRef.current.push(req.id);
            });
        }

        // 2. Détecter les objets DONNÉS (validés par le MJ)
        const approvedByMe = transferRequests.filter(r => 
            r.fromCharacterId === characterId && 
            r.status === 'approved' && 
            !lastApprovedRequestsRef.current.includes(r.id)
        );

        if (approvedByMe.length > 0) {
            approvedByMe.forEach(req => {
                useSessionOSStore.getState().addHubNotification({
                    title: 'Échange Validé',
                    content: `Votre don de "${req.item.name}" a été accepté par le MJ.`,
                    fromName: 'SYSTÈME',
                    type: 'system'
                });
                lastApprovedRequestsRef.current.push(req.id);
            });
        }

        // 3. Détecter les objets REJETÉS
        const rejectedByMe = transferRequests.filter(r => 
            r.fromCharacterId === characterId && 
            r.status === 'rejected' && 
            !lastApprovedRequestsRef.current.includes(r.id)
        );

        if (rejectedByMe.length > 0) {
            rejectedByMe.forEach(req => {
                useSessionOSStore.getState().addHubNotification({
                    title: 'Échange Refusé',
                    content: `Le MJ a refusé votre don de "${req.item.name}".`,
                    fromName: 'SYSTÈME',
                    type: 'alert'
                });
                lastApprovedRequestsRef.current.push(req.id);
            });
        }
    }, [transferRequests, characterId]);

    // Cleanup old approved requests from ref to avoid memory leak
    useEffect(() => {
        if (!transferRequests) return;
        const currentIds = transferRequests.map(r => r.id);
        lastApprovedRequestsRef.current = lastApprovedRequestsRef.current.filter(id => currentIds.includes(id));
    }, [transferRequests]);

    // Theater Logic (Alignment with PlayerHub)
    const theaterEntity = (liveEntity?.displayMode === 'theater')
        ? liveEntity
        : resolvedFavorites.find(f => f.displayMode === 'theater');

    return {
        status,
        liveImagePath,
        liveEntity,
        theaterEntity,
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
        transferRequests,
        isOnboarded,
        characterId
    };
};
