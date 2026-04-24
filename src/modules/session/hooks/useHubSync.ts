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
import { useMapStore } from '../../map/useMapStore';
import { type Entity, type AtlasMap } from '../store/types';
import type { ProjectedEntity } from '../../image/types';

/**
 * Attempts to resolve an m-xxx media ID to a data: URI using the local IndexedDB.
 */
async function resolveMediaToDataUrl(src: string | undefined): Promise<string | undefined> {
    if (!src) return undefined;
    // Si l'URL est déjà résolue (HTTP, data:, blob:), la retourner directement
    if (!src.startsWith('m-')) return src;
    try {
        // ⚠️ Ne pas spécifier de version ici pour éviter un VersionError
        // si la DB a été mise à jour par useMediaStore (actuellement v4).
        const db = await openDB('gmos-media-db');
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
    // Fallback HTTP proxy : si on est sur tablette (pas d'appBridge),
    // le PC a mis le fichier dans /temp/ — on le récupère via HTTP
    if (!window.appBridge) {
        const host = window.location.hostname;
        const remoteUrl = `http://${host}:3001/temp/${src}`;
        console.log(`[useHubSync] Remote HTTP fallback: ${src} → ${remoteUrl}`);
        return remoteUrl;
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
    const voiceLevel = useSyncStore(state => state.voiceLevel);
    const setVoiceLevel = useSyncStore(state => state.setVoiceLevel);
    const [sessionSummary, setSessionSummary] = useState<string>('');
    const [showDice, setShowDice] = useState(false);
    const [sharedRule, setSharedRule] = useState<{ title: string, content: string, category?: string } | null>(null);
    const [mapPings, setMapPings] = useState<{ x: number, y: number, color: string, timestamp: number }[]>([]);

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

    // --- Core Logic : Sync Payload Processor ---
    const applySyncPayload = useCallback((payload: any) => {
        if (!payload) return;
        const { clock, combat, voiceLevel: vLevel, session, notes, dice } = payload;
        
        if (clock) useClockStore.setState(prev => ({ ...prev, ...clock }));
        if (combat) useCombatStore.setState(prev => ({ ...prev, ...combat }));
        if (vLevel !== undefined) setVoiceLevel(vLevel);
        if (notes?.public !== undefined) setSessionSummary(notes.public);
        if (dice) useDiceStore.setState(prev => ({ ...prev, ...dice }));

        if (session) {
            const activeSession = (session.sessions || []).find((s: any) => s.status === 'active');
            
            console.log('[useHubSync] Session payload received:', {
                payloadActiveCampaignId: session.activeCampaignId,
                payloadActiveCampaignName: session.activeCampaignName,
                activeSessionFound: activeSession ? `${activeSession.id} (${activeSession.campaignId})` : 'NONE',
                sessionsCount: session.sessions?.length
            });

            useSessionOSStore.setState(prev => {
                const updates: any = {};
                if (session.sessions !== undefined) updates.sessions = session.sessions;
                if (session.campaigns !== undefined) updates.campaigns = session.campaigns;
                if (session.players !== undefined) updates.players = session.players;
                if (session.clues !== undefined) updates.clues = session.clues;
                if (session.entities !== undefined) updates.entities = session.entities;
                if (session.atlasMaps !== undefined) updates.atlasMaps = session.atlasMaps;
                
                // Prioritize explicit metadata from payload, fallback to finding in campaign list
                updates.activeCampaignId = session.activeCampaignId ?? prev.activeCampaignId;
                updates.activeCampaignName = session.activeCampaignName ?? 
                                           (session.campaigns || prev.campaigns).find((c: any) => c.id === updates.activeCampaignId)?.name;
                
                if (session.activeCampaignWallpaper !== undefined) updates.activeCampaignWallpaper = session.activeCampaignWallpaper;
                if (session.customSheetTemplates !== undefined) updates.customSheetTemplates = session.customSheetTemplates;
                if (session.customGameDrivers !== undefined) updates.customGameDrivers = session.customGameDrivers;
                if (session.characterLocks !== undefined) updates.connectedCharacters = session.characterLocks;
                
                console.log('[useHubSync] Applying store updates:', {
                    newCampaignId: updates.activeCampaignId,
                    newCampaignName: updates.activeCampaignName
                });
                
                return { ...prev, ...updates };
            });

            if (session.favorites !== undefined) {
                console.log('[useHubSync] Syncing favorites:', session.favorites.length);
                useFavoriteStore.setState({
                    favorites: session.favorites
                });
            }
        }
    }, [setVoiceLevel]);

    // WebSocket Connection Logic
    useEffect(() => {
        // 🛡️ SÉCURITÉ : Si on a un bridge natif (Tauri/Electron), on n'a pas besoin de WebSocket pour le local.
        // On ne le garde que pour les vrais accès distants (Tablettes/Phones).
        const isNative = (window as any).appBridge && ((window as any).appBridge.isTauri || (window as any).appBridge.isElectron);
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Si on est en local et qu'on a le bridge, on considère qu'on est "connecté" via le pont.
        if (window.appBridge && isLocalhost) {
            setStatus('connected');
        }

        if (!host) return;

        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let isActive = true;

        const startConnection = () => {
            if (!isActive) return;

            // Ne pas tenter de WebSocket si on est en natif et sur localhost, sauf si on force le mode remote
            if (isNative && isLocalhost) {
                console.log('[useHubSync] Local Native context detected, skipping WebSocket.');
                return;
            }

            const socketUrl = `ws://${host}:${port}`;
            console.log('[useHubSync] Attempting WebSocket connection to:', socketUrl);
            
            try {
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
                    // On ne passe en "error" que si on n'a pas de bridge de secours
                    if (!window.appBridge) {
                        setStatus('error');
                    }
                    setClientStatus('disconnected');
                    
                    // Reconnect after 5s
                    reconnectTimer = setTimeout(() => {
                        startConnection();
                    }, 5000);
                };

                socket.onerror = () => {
                    if (!window.appBridge) {
                        setStatus('error');
                    }
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
                            if (entity && (entity.name === 'TEST' || entity.id?.startsWith('mock-') || !entity.id)) {
                                setLiveEntity(null);
                            } else {
                                setLiveEntity(entity);
                            }
                        }
                    }

                    if (data.type === 'sync' && data.payload) {
                        applySyncPayload(data.payload);
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

                    if (data.type === 'session:display-rule' && data.payload) {
                        setSharedRule(data.payload);
                    }

                    if (data.type === 'map:sync-hub') {
                        const payload = data.payload;
                        if (!payload) {
                            useMapStore.getState().resetProjectionState();
                        } else {
                            useMapStore.setState(prev => {
                                const updates: any = {
                                    projectionTarget: 'hub',
                                    projectedMapUrl: payload.mapUrl,
                                    projectedIsVideo: payload.isVideo,
                                    projectedTokens: payload.tokens || [],
                                    projectedWeatherType: payload.weatherType,
                                    projectedWeatherIntensity: payload.weatherIntensity,
                                    projectedTimeOfDay: payload.timeOfDay,
                                    projectedMapWidth: payload.mapWidth,
                                    projectedMapHeight: payload.mapHeight,
                                    projectedIsGridEnabled: payload.isGridEnabled,
                                    projectedGridSize: payload.gridSize,
                                    projectedGridColor: payload.gridColor,
                                    projectedGridOpacity: payload.gridOpacity,
                                    projectedMagicEffects: payload.magicEffects || [],
                                    projectedDangerZones: payload.dangerZones || []
                                };
                                if (payload.fogDataUrl !== undefined) {
                                    updates.projectedFogDataUrl = payload.fogDataUrl;
                                }
                                return { ...prev, ...updates };
                            });
                        }
                    }
                } catch (err) {
                    console.error('[useHubSync] Sync parsing error:', err);
                }
            };
        } catch (e) {
            console.warn('[useHubSync] WebSocket initialization failed:', e);
        }
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
            const [type, data] = args as [string, unknown];
            if (type === 'image') setLiveImagePath((data as string) || null);
            else if (type === 'entity') {
                const entity = data ? JSON.parse(data as string) : null;
                if (entity && (entity.name === 'TEST' || entity.id?.startsWith('mock-') || !entity.id)) {
                    setLiveEntity(null);
                } else {
                    setLiveEntity(entity);
                }
            }
            else if (type === 'voice-level') setVoiceLevel(parseFloat(data as string) || 0);
            else if (type === 'map-ping') {
                const ping = typeof data === 'string' ? JSON.parse(data) : data;
                setMapPings(prev => [...prev.slice(-10), { ...ping, timestamp: Date.now() }]);
            }
            else if (type === 'session:display-rule') {
                setSharedRule(data as any);
            }
            else if (type === 'map:sync-hub' || type === 'map:sync-projector') {
                const payload = typeof data === 'string' ? JSON.parse(data) : data as any;
                if (!payload) {
                    useMapStore.getState().resetProjectionState();
                } else {
                    useMapStore.setState(prev => {
                        const updates: Partial<typeof prev> = {
                            projectionTarget: (payload.target || 'hub') as typeof prev.projectionTarget,
                        };

                        // Only update fields that are present in the payload
                        // 🛡️ mapUrl est l'ID brut (m-xxx), jamais une DataURL.
                        // useMediaUrl dans PlayerMapCanvas le résout localement.
                        if (payload.mapUrl !== undefined) updates.projectedMapUrl = payload.mapUrl;
                        if (payload.isVideo !== undefined) updates.projectedIsVideo = payload.isVideo;
                        if (payload.fogDataUrl !== undefined) updates.projectedFogDataUrl = payload.fogDataUrl;
                        if (payload.tokens !== undefined) updates.projectedTokens = payload.tokens;
                        if (payload.weatherType !== undefined) updates.projectedWeatherType = payload.weatherType;
                        if (payload.weatherIntensity !== undefined) updates.projectedWeatherIntensity = payload.weatherIntensity;
                        if (payload.timeOfDay !== undefined) updates.projectedTimeOfDay = payload.timeOfDay;
                        if (payload.mapWidth !== undefined) updates.projectedMapWidth = payload.mapWidth;
                        if (payload.mapHeight !== undefined) updates.projectedMapHeight = payload.mapHeight;
                        if (payload.isGridEnabled !== undefined) updates.projectedIsGridEnabled = payload.isGridEnabled;
                        if (payload.gridSize !== undefined) updates.projectedGridSize = payload.gridSize;
                        if (payload.gridColor !== undefined) updates.projectedGridColor = payload.gridColor;
                        if (payload.gridOpacity !== undefined) updates.projectedGridOpacity = payload.gridOpacity;
                        if (payload.magicEffects !== undefined) updates.projectedMagicEffects = payload.magicEffects;
                        if (payload.dangerZones !== undefined) updates.projectedDangerZones = payload.dangerZones;

                        return { ...prev, ...updates };
                    });
                }
            }
        };

        const handleBroadcastSync = (_e: unknown, payload: unknown) => {
            console.log('[useHubSync] Sync received via BRIDGE (IPC)');
            
            // Gestion du Panic Button / Reset Global
            if ((payload as any)?.type === 'FULL_RESET') {
                setLiveImagePath(null);
                setLiveEntity(null);
                return;
            }

            applySyncPayload(payload);
        };

        if (window.appBridge?.on) {
            window.appBridge.on('image:sync-hub-data', handleIpcUpdate);
            window.appBridge.on('map:ping', (_e: unknown, data: unknown) => handleIpcUpdate(null, 'map-ping', data));
            // Les listeners map:sync-hub via AppBridge sont conservés comme FALLBACK
            // Le mécanisme principal est maintenant BroadcastChannel (voir ci-dessous)
            window.appBridge.on('map:sync-hub', (_e: unknown, data: unknown) => handleIpcUpdate(null, 'map:sync-hub', data));
            window.appBridge.on('map:sync-projector', (_e: unknown, data: unknown) => handleIpcUpdate(null, 'map:sync-projector', data));
            window.appBridge.on('remote:broadcast-sync', handleBroadcastSync);
        }

        // ─── BroadcastChannel MAP SYNC (mécanisme principal) ──────────────────
        // BroadcastChannel est GARANTI cross-window dans Chromium/WebView2 (même origine).
        // Contrairement à Tauri emit, il ne dépend pas du routage IPC cross-WebviewWindow.
        const mapBroadcastChannel = new BroadcastChannel('gmos-map-sync');

        const handleMapBroadcast = async (event: MessageEvent) => {
            const msg = event.data as Record<string, unknown>;
            if (!msg || typeof msg !== 'object') return;

            console.log('[useHubSync] BroadcastChannel map message received:', msg.type);

            if (msg.type === 'map:clear') {
                useMapStore.getState().resetProjectionState();
                return;
            }

            if (msg.type === 'map:sync') {
                // Résoudre le m-xxx → DataURL depuis l'IndexedDB partagée
                // AVANT de mettre à jour le store (évite un flash noir)
                let resolvedMapUrl: string | null | undefined = undefined;

                if (msg.mapId !== undefined) {
                    const rawId = msg.mapId as string | null;
                    if (rawId === null) {
                        resolvedMapUrl = null;
                    } else if (rawId.startsWith('m-')) {
                        // Résolution IndexedDB locale (IndexedDB partagée entre fenêtres Tauri same-origin)
                        const dataUrl = await resolveMediaToDataUrl(rawId);
                        resolvedMapUrl = dataUrl ?? null;
                        console.log(`[useHubSync] m-xxx resolved: ${rawId} → ${resolvedMapUrl ? `DataURL (${Math.round((resolvedMapUrl.length)/1024)}KB)` : 'null'}`);
                    } else {
                        // Déjà une URL résolue (http, data:, blob:, chemin absolu)
                        resolvedMapUrl = rawId;
                    }
                }

                useMapStore.setState(prev => {
                    const updates: Partial<typeof prev> = {
                        projectionTarget: ((msg.target as string) || 'hub') as typeof prev.projectionTarget,
                    };

                    if (resolvedMapUrl !== undefined) updates.projectedMapUrl = resolvedMapUrl;
                    if (msg.isVideo !== undefined) updates.projectedIsVideo = msg.isVideo as boolean;
                    if (msg.fogDataUrl !== undefined) updates.projectedFogDataUrl = msg.fogDataUrl as string | null;
                    if (msg.tokens !== undefined) updates.projectedTokens = msg.tokens as typeof prev.projectedTokens;
                    if (msg.weatherType !== undefined) updates.projectedWeatherType = msg.weatherType as typeof prev.projectedWeatherType;
                    if (msg.weatherIntensity !== undefined) updates.projectedWeatherIntensity = msg.weatherIntensity as number;
                    if (msg.timeOfDay !== undefined) updates.projectedTimeOfDay = msg.timeOfDay as typeof prev.projectedTimeOfDay;
                    if (msg.mapWidth !== undefined) updates.projectedMapWidth = msg.mapWidth as number;
                    if (msg.mapHeight !== undefined) updates.projectedMapHeight = msg.mapHeight as number;
                    if (msg.isGridEnabled !== undefined) updates.projectedIsGridEnabled = msg.isGridEnabled as boolean;
                    if (msg.gridSize !== undefined) updates.projectedGridSize = msg.gridSize as number;
                    if (msg.gridColor !== undefined) updates.projectedGridColor = msg.gridColor as string;
                    if (msg.gridOpacity !== undefined) updates.projectedGridOpacity = msg.gridOpacity as number;
                    if (msg.magicEffects !== undefined) updates.projectedMagicEffects = msg.magicEffects as typeof prev.projectedMagicEffects;
                    if (msg.dangerZones !== undefined) updates.projectedDangerZones = msg.dangerZones as typeof prev.projectedDangerZones;
                    if (msg.isMapMuted !== undefined) updates.projectedIsMapMuted = msg.isMapMuted as boolean;
                    if (msg.mapVolume !== undefined) updates.projectedMapVolume = msg.mapVolume as number;

                    return { ...prev, ...updates };
                });
            }
        };

        mapBroadcastChannel.addEventListener('message', handleMapBroadcast);

        // 🧹 BOOT : Vider l'état projeté stale (session précédente)
        useMapStore.getState().resetProjectionState();

        // 📡 Signaler au MJ qu'on est prêt via BroadcastChannel ET AppBridge (double sécurité)
        const sendReady = () => {
            const readyBc = new BroadcastChannel('gmos-hub-signals');
            readyBc.postMessage({ type: 'hub:ready', window: 'hub' });
            readyBc.close();
            // Fallback AppBridge
            window.appBridge?.ipc?.send('hub:ready', { window: 'hub' });
        };
        setTimeout(sendReady, 800);
        setTimeout(sendReady, 2500);

        return () => {
            mapBroadcastChannel.removeEventListener('message', handleMapBroadcast);
            mapBroadcastChannel.close();
        };


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
                window.appBridge.off('map:ping', handleIpcUpdate);
                window.appBridge.off('remote:broadcast-sync', handleBroadcastSync);
            }
        };
    }, []);

    // Asset Resolution (m-xxx)
    useEffect(() => {
        let mounted = true;
        const resolveAssets = async () => {
            // Favorites
            // Favorites : On ne synchronise que ce qui est explicitement partagé, 
            // ou ce qui appartient au personnage actif (si défini et non nul).
            const sharedFavs = favorites.filter(f => 
                f.isSyncedToPlayerHub || 
                (characterId && f.ownerId === characterId)
            );
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
        transferRequests,
        isOnboarded,
        characterId,
        sharedRule,
        setSharedRule,
        mapPings,
        setMapPings
    };
};
