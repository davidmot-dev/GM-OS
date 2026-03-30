import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
    Monitor, 
    Archive, 
    MessageSquare, 
    Search, 
    BookOpen,
    Wifi,
    WifiOff,
    User,
    LogOut,
    Users,
    Sparkles,
    Globe,
    Package
} from 'lucide-react';
import { useImageStore } from '../modules/image/useImageStore';
import { useCombatStore, type Combatant } from '../modules/combat/useCombatStore';
import { useClockStore } from '../store/useClockStore';
import { useFavoriteStore, type FavoriteEntity } from '../modules/favorite/useFavoriteStore';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { ResolvedImage } from './ResolvedImage';
import type { ProjectedEntity } from '../modules/image/types';
import NarrativeClock from '../modules/clock/components/NarrativeClock';
import ClockVisualizer from '../modules/clock/components/ClockVisualizer';
import { useVoiceStore } from '../modules/voice/useVoiceStore';
import { useDiceStore } from '../stores/useDiceStore';
import type { DieResult } from '../modules/dice/DiceEngine';
import { useTacticalAIStore } from '../modules/tactical-ai/useTacticalAIStore';
import { openDB } from 'idb';
import { useClientStore } from '../stores/useClientStore';
import LobbyOnboarding from './hub/LobbyOnboarding';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import HubCharacterSheet from './hub/HubCharacterSheet';
import { HubMessenger } from './hub/HubMessenger';
import HubNotificationCenter from './hub/HubNotificationCenter';
import { HubClueViewer } from './hub/HubClueViewer';
import { HubNpcViewer } from './hub/HubNpcViewer';
import { HubAtlasViewer } from './hub/HubAtlasViewer';
import { HubItemViewer } from './hub/HubItemViewer';
import { type Clue, type Entity, type AtlasMap } from '../modules/session/store/types';

/**
 * Attempts to resolve an m-xxx media ID to a data: URI using the local IndexedDB.
 * The Tablet Hub is an Electron window that shares the same file system via appBridge.
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
        console.error('[TabletHub] Could not resolve m-id:', src, e);
    }
    return undefined;
}


const TabletHub: React.FC = () => {
    const { mediaList, projections } = useImageStore();
    const { isClockProjected, timestamp, mode, theme, tensions } = useClockStore();
    const { favorites } = useFavoriteStore();
    const { combatants, currentTurnIdx, round, isCombatProjected } = useCombatStore();
    const { clues, activeCampaignId, entities, atlasMaps } = useSessionOSStore();

    const activeHubId = projections['hub'];
    const [liveImagePath, setLiveImagePath] = useState<string | null | undefined>(undefined);
    const [liveEntity, setLiveEntity] = useState<ProjectedEntity | null>(null);
    const [currentTab, setCurrentTab] = useState<'live' | 'archives' | 'trombinoscope' | 'atlas' | 'inventory'>('live');
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isMessengerOpen, setIsMessengerOpen] = useState(false);
    const [lastReadMessageTime, setLastReadMessageTime] = useState(Date.now());
    const { deviceId, pseudo, playerName, characterId, isOnboarded, setStatus: setClientStatus, resetIdentity } = useClientStore();
    const { sessions, activeCampaignWallpaper, activeCampaignName, players } = useSessionOSStore();
    
    // Find character name
    const characterName = players
        .flatMap(p => p.characters)
        .find(c => c.id === characterId)?.name || playerName || 'Joueur';

    const activeSession = sessions.find(s => s.status === 'active');
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const socketRef = useRef<WebSocket | null>(null);
    const connectRef = useRef<(() => void) | undefined>(undefined);
    // Resolved versions of favorites (m-xxx IDs converted to data: URIs)
    const [resolvedFavorites, setResolvedFavorites] = useState<FavoriteEntity[]>([]);
    const [resolvedNpcs, setResolvedNpcs] = useState<Entity[]>([]);
    const [selectedNpc, setSelectedNpc] = useState<Entity | null>(null);
    const [resolvedAtlasMaps, setResolvedAtlasMaps] = useState<AtlasMap[]>([]);
    const [selectedAtlasMap, setSelectedAtlasMap] = useState<AtlasMap | null>(null);
    const [selectedItem, setSelectedItem] = useState<FavoriteEntity | null>(null);

    const { isDiceProjected, lastRoll, projectionTrigger } = useDiceStore();
    const [showDice, setShowDice] = useState(false);
    const diceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTriggerRef = useRef(0);

    const messages = useSessionOSStore((state) => state.messages);
    const unreadCount = messages.filter(m => 
        m.timestamp > lastReadMessageTime && 
        (
            (m.fromId === 'GM' && (m.toId === characterId || m.toId === 'all' || !m.toId)) || 
            (m.fromId === characterId && m.toId === 'GM')
        )
    ).length;

    const inventoryItems = favorites.filter(f => f.type === 'item' && (f.ownerId === characterId || f.isSyncedToPlayerHub));

    const toggleMessenger = () => {
        setIsMessengerOpen(!isMessengerOpen);
        if (!isMessengerOpen) setLastReadMessageTime(Date.now());
    };

    // WebSocket Sync Logic
    const host = window.location.hostname;
    const port = 3001;
    const [sessionSummary, setSessionSummary] = useState<string>('');
    const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
    
    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;
        
        const socketUrl = `ws://${host}:${port}`;
        console.log('[TabletHub] Connecting to:', socketUrl);
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('[TabletHub] Connected to Nexus Bridge');
            setStatus('connected');
            setClientStatus('active');
            // On s'enregistre comme tablette avec les infos d'identité
            socket.send(JSON.stringify({ 
                type: 'remote:register',
                payload: { deviceId, pseudo, playerName, characterId, role: 'hub' }
            }));
            // On demande immédiatement une synchronisation complète pour éviter d'attendre le prochain diff
            socket.send(JSON.stringify({ type: 'remote:request-sync' }));
        };

        socket.onclose = () => {
            console.log('[TabletHub] WebSocket Disconnected');
            setStatus('error');
            setClientStatus('disconnected');
            // Attempt reconnect if still on tablet view
            setTimeout(() => {
                if (window.location.search.includes('window=tablet') && connectRef.current) {
                    connectRef.current();
                }
            }, 5000);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle projection updates (broadcast from Electron)
                if (data.type === 'hub-projection') {
                    const { type, data: payload } = data.payload;
                    if (type === 'image') setLiveImagePath(payload || null);
                    if (type === 'entity') {
                        if (!payload) setLiveEntity(null);
                        else setLiveEntity(JSON.parse(payload));
                    }
                }

                // Handle full sync (from App.tsx broadcast)
                if (data.type === 'sync' && data.payload) {
                    const { clock, combat, voiceLevel: incomingVoice } = data.payload;
                    console.log('[TabletHub] Received sync segments:', Object.keys(data.payload));
                    
                    if (clock) {
                        useClockStore.setState(prev => ({ ...prev, ...clock }));
                    }

                    if (combat) {
                        useCombatStore.setState(prev => ({ ...prev, ...combat }));
                    }

                    if (data.payload.session) {
                        console.log('[TabletHub] SYNC RECEIVED - Session Data:', {
                          hasSessions: !!data.payload.session.sessions,
                          hasCampaigns: !!data.payload.session.campaigns,
                          activeCampaignId: data.payload.session.activeCampaignId,
                          activeCampaignName: data.payload.session.activeCampaignName,
                          activeCampaignWallpaper: data.payload.session.activeCampaignWallpaper ? (data.payload.session.activeCampaignWallpaper.substring(0, 50) + '...') : 'NULL'
                        });

                        const incomingSession = data.payload.session;
                        useSessionOSStore.setState({ 
                            sessions: incomingSession.sessions || [],
                            campaigns: incomingSession.campaigns || [],
                            players: incomingSession.players || [],
                            clues: incomingSession.clues || [],
                            entities: incomingSession.entities || [],
                            atlasMaps: incomingSession.atlasMaps || [],
                            activeCampaignId: incomingSession.activeCampaignId || null,
                            activeCampaignName: incomingSession.activeCampaignName || null,
                            activeCampaignWallpaper: incomingSession.activeCampaignWallpaper || null,
                            customSheetTemplates: incomingSession.customSheetTemplates || [],
                            customGameDrivers: incomingSession.customGameDrivers || []
                        });

                        if (incomingSession.favorites) {
                            useFavoriteStore.setState({
                                favorites: incomingSession.favorites || []
                            });
                        }
                    }

                    if (data.payload.notes?.public !== undefined) {
                        setSessionSummary(data.payload.notes.public);
                    }

                    if (incomingVoice !== undefined) setVoiceLevel(incomingVoice);

                    if (data.payload.dice) {
                        console.log('[TabletHub] Dice sync received:', data.payload.dice);
                        useDiceStore.setState(prev => ({ ...prev, ...data.payload.dice }));
                    }
                }

                // Handle direct messages
                if (data.type === 'session:receive-message' && data.payload) {
                    const msg = data.payload;
                    useSessionOSStore.getState().addSessionMessage(msg);
                    
                    // Si le message n'est pas de nous et qu'on est le destinataire (direct ou broadcast)
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
                console.error('[TabletHub] Sync error:', err);
            }
        };

        socket.onerror = () => setStatus('error');

        // Handler pour envoyer des messages depuis le store (Hub)
        const handleSendMessage = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'session:send-message',
                    payload: customEvent.detail
                }));
            }
        };

        window.addEventListener('session:send-message', handleSendMessage);

        return () => {
            window.removeEventListener('session:send-message', handleSendMessage);
            socket.close();
        };
    }, [host, port, deviceId, pseudo, playerName, setClientStatus, characterId]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    // Voice Sync Animation values
    const syncActive = voiceLevel > 0.05;
    const voiceStyles = { 
        '--voice-scale': syncActive ? 1 + (voiceLevel * 0.15) : 1, 
        '--voice-glow': syncActive ? `0 0 ${voiceLevel * 30}px rgba(6, 182, 212, ${voiceLevel})` : '0 0 0 transparent' 
    } as React.CSSProperties;

    const activeMedia = mediaList?.find(m => m.id === activeHubId);

    useEffect(() => {
        // Handle Dice Projection Timer
        if (isDiceProjected && projectionTrigger !== lastTriggerRef.current) {
            console.log('[TabletHub] Showing dice! Trigger:', projectionTrigger, 'Last:', lastTriggerRef.current);
            setShowDice(true);
            lastTriggerRef.current = projectionTrigger;
            if (diceTimerRef.current) clearTimeout(diceTimerRef.current);
            diceTimerRef.current = setTimeout(() => {
                console.log('[TabletHub] Hiding dice after 5s');
                setShowDice(false);
            }, 5000);
        } else {
            console.log('[TabletHub] useEffect fired but condition not met:', { isDiceProjected, projectionTrigger, lastTrigger: lastTriggerRef.current });
        }
    }, [isDiceProjected, projectionTrigger]);

    useEffect(() => {
        // ALWAYS connect to WebSocket to receive session updates, 
        // even if not onboarded yet (onboarding depends on this data).
        console.log('[TabletHub] Initializing sync effect. Onboarded:', isOnboarded);
        connect();
        
        const rehydrateAll = async () => {
            await Promise.all([
                useClockStore.persist.rehydrate(),
                useCombatStore.persist.rehydrate(),
                useFavoriteStore.persist.rehydrate(),
                useVoiceStore.persist.rehydrate(),
                useImageStore.persist.rehydrate(),
                useDiceStore.persist.rehydrate(),
                useSessionOSStore.persist.rehydrate()
            ]);
        };
        rehydrateAll();
        
        const handleIpcUpdate = (_event: unknown, ...args: unknown[]) => {
            const [type, data] = args as [string, string];
            if (type === 'image') {
                setLiveImagePath(data || null);
            } else if (type === 'entity') {
                if (!data) {
                    setLiveEntity(null);
                } else {
                    try {
                        const entity = JSON.parse(data);
                        setLiveEntity(entity);
                    } catch (e) {
                        console.error("Failed to parse projected entity", e);
                    }
                }
            } else if (type === 'voice-level') {
                setVoiceLevel(parseFloat(data) || 0);
            }
        };

        if (window.appBridge?.on) {
            window.appBridge.on('image:sync-hub-data', handleIpcUpdate);
        }

        const handleStorageChange = (e: StorageEvent) => {
            const keys: Record<string, () => void> = {
                'gm-os-clock-storage': () => useClockStore.persist.rehydrate(),
                'gmos-combat-storage': () => useCombatStore.persist.rehydrate(),
                'gm-os-favorites-storage': () => useFavoriteStore.persist.rehydrate(),
                'gmos-voice-storage': () => useVoiceStore.persist.rehydrate(),
                'gm-os-tactical-ai': () => useTacticalAIStore.persist.rehydrate(),
                'gmos-image-storage': () => useImageStore.persist.rehydrate(),
                'gmos-dice-storage': () => useDiceStore.persist.rehydrate(),
                'gmos-v5-session-os-storage': () => useSessionOSStore.persist.rehydrate()
            };

            if (e.key && keys[e.key]) keys[e.key]();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            socketRef.current?.close();
            if (window.appBridge?.off) {
                window.appBridge.off('image:sync-hub-data', handleIpcUpdate);
            }
        };
    }, [connect, isOnboarded]);

    const visibleCombatants = combatants.filter(c => 
        c.isPlayer || !c.statuses?.some(s => {
            const n = s.name.toLowerCase();
            return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
        })
    );
    const hasCombatants = isCombatProjected && visibleCombatants.length > 0;
    
    // Find active combatant among visible ones, or use the real one if it's a player
    const realActiveCombatant = combatants[currentTurnIdx];
    const activeCombatant = (realActiveCombatant && (realActiveCombatant.isPlayer || !realActiveCombatant.statuses?.some(s => {
        const n = s.name.toLowerCase();
        return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
    }))) ? realActiveCombatant : null;
    const sharedFavorites = favorites.filter(f => f.isSyncedToPlayerHub);

    // Resolve m-xxx IDs in favorites to data: URIs so they display in this window
    useEffect(() => {
        let cancelled = false;
        const resolveAll = async () => {
            const resolved = await Promise.all(
                sharedFavorites.map(async (fav) => ({
                    ...fav,
                    imageUrl: await resolveMediaToDataUrl(fav.imageUrl) || fav.imageUrl,
                    tokenUrl: await resolveMediaToDataUrl(fav.tokenUrl) || fav.tokenUrl,
                }))
            );
            if (!cancelled) setResolvedFavorites(resolved);
        };
        resolveAll();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favorites]);

    // Resolve m-xxx IDs in NPCs for Trombinoscope
    useEffect(() => {
        let cancelled = false;
        const activeNpcs = (entities || []).filter(e => 
            String(e.campaignId) === String(activeCampaignId) && 
            e.isVisibleByPlayers
        );
        
        const resolveAll = async () => {
            const resolved = await Promise.all(
                activeNpcs.map(async (npc) => ({
                    ...npc,
                    avatar: await resolveMediaToDataUrl(npc.avatar) || npc.avatar,
                }))
            );
            if (!cancelled) setResolvedNpcs(resolved);
        };
        resolveAll();
        return () => { cancelled = true; };
    }, [entities, activeCampaignId]);

    // Resolve m-xxx IDs in Atlas Maps
    useEffect(() => {
        let cancelled = false;
        const activeMaps = (atlasMaps || []).filter(m => 
            String(m.campaignId) === String(activeCampaignId) && 
            m.isVisited
        );
        
        const resolveAll = async () => {
            const resolved = await Promise.all(
                activeMaps.map(async (map) => ({
                    ...map,
                    fileUrl: await resolveMediaToDataUrl(map.fileUrl) || map.fileUrl,
                }))
            );
            if (!cancelled) setResolvedAtlasMaps(resolved);
        };
        resolveAll();
        return () => { cancelled = true; };
    }, [atlasMaps, activeCampaignId]);

    // Sort the upcoming combatants among visible ones
    const upcomingCombatants: Combatant[] = [];
    if (hasCombatants && visibleCombatants.length > 1) {
        // Find index of active in visible list
        const visibleIdx = activeCombatant ? visibleCombatants.findIndex(c => c.id === activeCombatant.id) : -1;
        if (visibleIdx !== -1) {
            let i = (visibleIdx + 1) % visibleCombatants.length;
            while (i !== visibleIdx) {
                upcomingCombatants.push(visibleCombatants[i]);
                i = (i + 1) % visibleCombatants.length;
            }
        } else {
            // If active is hidden, just show all visible
            upcomingCombatants.push(...visibleCombatants);
        }
    }

    const renderClockWidget = () => {
        return (
            <div className="backdrop-blur-md bg-app-surface/40 border border-app-border/40 p-2 rounded-2xl shadow-2xl flex items-center justify-center w-full aspect-square max-w-[250px] overflow-hidden">
                <div className="scale-[0.5] origin-center transform-gpu">
                    <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
                </div>
            </div>
        );
    };

    const backgroundPath = liveImagePath !== undefined ? liveImagePath : activeMedia?.path;
    const resolvedBackground = useMediaUrl(backgroundPath || undefined);

    const rootStyles = {
        '--hub-bg-url': resolvedBackground ? `url('${resolvedBackground}')` : "none",
        '--hub-bg-opacity': resolvedBackground ? 1 : 0,
        '--hub-blur-bg-url': activeCampaignWallpaper ? `url("${activeCampaignWallpaper}")` : "none",
        ...voiceStyles
    } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-app-bg text-app-text font-inter overflow-hidden flex flex-col relative select-none" style={rootStyles}>
            
            {/* Sync connection status */}
            <div className={`fixed top-4 right-4 z-50 p-1.5 rounded-full backdrop-blur-md border ${
                status === 'connected' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`} title={status === 'connected' ? 'Synchronisé' : 'Déconnecté du MJ'}>
                {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
            </div>

            {/* Campaign Title Header */}
            {activeCampaignName && (
                <div className="fixed top-6 left-8 z-50 animate-in fade-in slide-in-from-left duration-1000">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-accent/60 uppercase tracking-[0.4em] mb-1">Opération en cours</span>
                        <h1 className="text-3xl font-black text-app-text uppercase tracking-tightest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                            {activeCampaignName}
                        </h1>
                    </div>
                </div>
            )}

            <div
                className={`fixed inset-0 z-1 bg-cover bg-center transition-all duration-1000 ease-in-out tablet-hub-bg [background-image:var(--hub-bg-url)] [opacity:var(--hub-bg-opacity)] ${
                    (resolvedFavorites.length > 0 || liveEntity) ? 'brightness-[0.15] grayscale-[30%] blur-[2px]' : 'brightness-[0.4] grayscale-[30%] blur-[2px]'
                }`}
            />

                {/* Visual Ambiance Layer (Always present as base layer) */}
                {activeCampaignWallpaper && isOnboarded && activeSession && (
                    <div 
                        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none opacity-50 blur-[4px] brightness-[0.4] [background-image:var(--hub-blur-bg-url)]"
                    />
                )}
            
            {!resolvedBackground && !activeCampaignWallpaper && <div className="fixed inset-0 z-0 bg-app-bg"></div>}

            {/* Overlay for focus */}
            {(resolvedFavorites.length > 0 || liveEntity) && (
                <div className="fixed inset-0 z-5 bg-black/40 backdrop-blur-[1px] pointer-events-none transition-all duration-700"></div>
            )}

            {/* Main Content Area */}
            <div className="relative z-40 flex h-screen w-full flex-col overflow-hidden pointer-events-none p-4 md:p-8">
                
                {/* Dashboard Widgets: Clock & Tensions (Stacked like Player Hub) */}
                <div className="flex flex-col gap-4 mb-6 pl-12 w-full max-w-[460px] pointer-events-auto animate-in fade-in slide-in-from-left duration-700">
                    {isClockProjected && (
                        <div className="w-full">
                           {renderClockWidget()}
                        </div>
                    )}

                    {tensions.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 w-full h-fit overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                            {tensions.map(clock => (
                                <div key={clock.id} className="flex items-center gap-3 bg-app-surface/60 backdrop-blur-xl border border-app-border/40 rounded-2xl p-3 shadow-xl">
                                    <NarrativeClock clock={clock} theme={theme} size={48} />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <p className={`text-sm font-black truncate w-full ${theme === 'cyberpunk' ? 'text-accent font-mono tracking-wider' : theme === 'oldstyle' ? 'text-amber-500 font-serif' : 'text-app-text uppercase tracking-tight'}`}>{clock.name}</p>
                                        <p className={`text-[10px] mt-0.5 font-bold ${theme === 'cyberpunk' ? 'text-cyan-400' : theme === 'oldstyle' ? 'text-amber-700/80 italic' : 'text-app-text/60'}`}>
                                            {clock.filledSegments} / {clock.totalSegments}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Central Theater Area */}
                <div className={`flex-1 flex items-center justify-center transition-all duration-1000 ${hasCombatants ? 'pr-0 md:pr-72' : ''} pointer-events-none overflow-hidden`}>
                    {currentTab === 'live' && (resolvedFavorites.length > 0 || liveEntity) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-2 flex flex-col items-center justify-center">
                                <div className={`grid grid-cols-1 ${(resolvedFavorites.length + (liveEntity ? 1 : 0)) > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-md'} gap-4 md:gap-8 w-full place-items-center`}>
                                    {liveEntity && (
                                        <div key={liveEntity.id} className={`bg-app-surface/90 backdrop-blur-3xl border-2 border-accent/30 rounded-3xl p-5 md:p-6 shadow-[0_0_40px_rgba(var(--accent-rgb),0.15)] flex flex-col gap-4 animate-in fade-in zoom-in duration-1000 w-full ${liveEntity.type === 'Oracle' ? 'max-w-xl' : ''}`}>
                                            <div className="flex flex-col items-center text-center gap-4">
                                                <div 
                                                    className={`${liveEntity.type === 'Oracle' ? 'w-full aspect-[2/3] max-h-[75vh]' : 'size-28 md:size-40'} rounded-2xl overflow-hidden border-2 border-accent/20 shadow-glow-accent bg-app-surface transition-all scale-100 relative [transform:scale(var(--voice-scale))] [box-shadow:var(--voice-glow)]`}
                                                >
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" />
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} alt={liveEntity.name} className={`relative z-10 w-full h-full ${liveEntity.type === 'Oracle' ? 'object-contain' : 'object-cover'}`} />
                                                </div>

                                                {liveEntity.type !== 'Oracle' && (
                                                    <div className="flex flex-col items-center">
                                                        <h3 className="text-xl md:text-2xl font-black text-app-text tracking-tighter uppercase whitespace-nowrap">{liveEntity.name}</h3>
                                                        <p className="text-accent text-[9px] font-black uppercase tracking-[0.3em] mt-1">{liveEntity.subtitle || liveEntity.type || 'Personnage'}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {liveEntity.type !== 'Oracle' && (
                                                <div className="relative pt-4 border-t border-app-border/40">
                                                    <p className="font-serif text-app-text/80 leading-relaxed italic text-xs md:text-sm text-center line-clamp-6">
                                                        {liveEntity.lore || liveEntity.description || "Détails confidentiels."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {resolvedFavorites.map(fav => (
                                        <div key={fav.id} className="bg-app-surface/80 backdrop-blur-2xl border border-app-border/40 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-3 md:gap-4 animate-in fade-in zoom-in duration-700 w-full">
                                            <div className="flex flex-col items-center text-center gap-3">
                                                <div className="size-16 md:size-20 rounded-xl overflow-hidden border border-app-border/40 shadow-xl bg-app-surface relative">
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110" />
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} alt={fav.name} className="relative z-10 w-full h-full object-contain" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-base md:text-lg font-black text-app-text tracking-tighter uppercase opacity-90">{fav.name}</h3>
                                                    <p className="text-app-text/40 text-[8px] font-black uppercase tracking-[0.3em]">{fav.type}</p>
                                                </div>
                                            </div>
                                            <div className="relative pt-3 border-t border-app-border/20">
                                                <p className="font-serif text-app-text/60 leading-relaxed italic text-[10px] md:text-xs text-center line-clamp-4">
                                                    {fav.lore}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'archives' && (
                        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-3">
                                        <Archive className="text-accent" size={24} />
                                        Archives du Groupe
                                    </h2>
                                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-widest">Preuves et indices collectés lors de la campagne.</p>
                                </div>
                                <div className="text-[10px] font-black bg-app-text/5 border border-app-border/40 px-4 py-2 rounded-full text-app-text/40 uppercase tracking-widest">
                                    {clues.filter(c => c.isRevealed && c.campaignId === activeCampaignId).length} Fragments Découverts
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {clues.filter(c => c.isRevealed && c.campaignId === activeCampaignId).map((clue, idx) => (
                                        <div 
                                            key={clue.id} 
                                            onClick={() => setSelectedClue(clue)}
                                            className={`group bg-app-surface/60 backdrop-blur-xl border border-app-border/40 rounded-3xl p-6 transition-all hover:border-accent/30 hover:bg-app-surface/80 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${idx * 50}`}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className="size-16 rounded-2xl bg-app-surface/40 border border-app-border/40 overflow-hidden flex-none">
                                                    {clue.mediaUrl ? (
                                                        <ResolvedImage src={clue.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-app-text/10">
                                                            <Search size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4 flex-1">
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-black text-app-text group-hover:text-accent transition-colors">{clue.title}</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {clue.revealedAt && (
                                                                <span className="text-[7px] font-black text-app-text/30 uppercase tracking-[0.2em] bg-app-text/5 px-2 py-0.5 rounded border border-app-border/40">
                                                                    DÉCOUVERT LE {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(clue.revealedAt)}
                                                                </span>
                                                            )}
                                                            {clue.campaignMoment && (
                                                                <span className="text-[7px] font-black text-accent/40 uppercase tracking-[0.2em] bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                                                                    {clue.campaignMoment}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-app-text/40 leading-relaxed italic font-serif line-clamp-4">{clue.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {clues.filter(c => c.isRevealed).length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-app-border/40 rounded-[3rem]">
                                            <Archive size={48} className="text-app-text/5" />
                                            <p className="text-xs font-black uppercase tracking-widest text-app-text/20">Aucune archive disponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'trombinoscope' && (
                        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                                        <Users className="text-accent" size={30} />
                                        Trombinoscope
                                    </h2>
                                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-[0.5em]">Registre des individus et entités identifiés.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="text-[10px] font-black bg-accent/10 border border-accent/20 px-6 py-2 rounded-full text-accent uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                        {resolvedNpcs.length} Profils Répertoriés
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 place-items-start">
                                    {resolvedNpcs.map((npc, idx) => (
                                        <div 
                                            key={npc.id}
                                            onClick={() => setSelectedNpc(npc)}
                                            className={`group relative flex flex-col gap-4 p-4 rounded-[2.5rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-accent/30 transition-all duration-500 cursor-pointer animate-in fade-in zoom-in duration-500 delay-${Math.min(idx * 50, 500)}`}
                                        >
                                            <div className="relative aspect-[3/4] w-full rounded-[2rem] overflow-hidden bg-app-bg shadow-xl">
                                                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                                                <ResolvedImage 
                                                    src={npc.avatar} 
                                                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
                                                />
                                                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                    <div className="px-4 py-1.5 bg-accent/90 backdrop-blur-md rounded-full text-[8px] font-black text-app-bg uppercase tracking-widest">
                                                        Inspecter
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-1 text-center">
                                                <h3 className="text-[11px] font-black text-app-text uppercase tracking-wider truncate mb-1">{npc.name}</h3>
                                                <p className="text-[7px] font-black text-app-text/20 uppercase tracking-[0.2em]">{npc.role || 'Citoyen'}</p>
                                            </div>
                                            {/* Status indicator */}
                                            <div className="absolute top-2 right-2 p-2 bg-app-bg/60 backdrop-blur-md rounded-full border border-app-border/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Sparkles size={10} className="text-accent" />
                                            </div>
                                        </div>
                                    ))}

                                    {resolvedNpcs.length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-6 border border-dashed border-app-border/20 rounded-[3rem] bg-app-surface/20">
                                            <div className="p-8 bg-app-surface/40 rounded-full border border-app-border/10">
                                                <Users size={64} className="text-app-text/5" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-black uppercase tracking-[0.3em] text-app-text/20">Aucun sujet identifié</p>
                                                <p className="text-[10px] text-app-text/10 font-bold uppercase">En attente de transmission par le MJ</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'atlas' && (
                        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                                        <Globe className="text-accent" size={30} />
                                        Atlas des Lieux Visités
                                    </h2>
                                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-[0.5em]">Cartographie des territoires explorés par le groupe.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {resolvedAtlasMaps.length} Lieux Découverts
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {resolvedAtlasMaps.map((map, idx) => (
                                        <div 
                                            key={map.id}
                                            onClick={() => setSelectedAtlasMap(map)}
                                            className={`group relative flex flex-col gap-5 p-5 rounded-[3rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-accent/30 transition-all duration-700 cursor-pointer animate-in fade-in slide-in-from-bottom-8 duration-700 delay-${Math.min(idx * 70, 700)}`}
                                        >
                                            <div className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden bg-app-bg shadow-2xl">
                                                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700 z-10" />
                                                
                                                {map.fileUrl ? (
                                                    <ResolvedImage 
                                                        src={map.fileUrl} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-app-surface/20">
                                                        <Globe size={48} className="text-app-text/5 rotate-12" />
                                                    </div>
                                                )}

                                                <div className="absolute top-4 right-4 z-20">
                                                     <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[7px] font-black text-white/60 uppercase tracking-widest">
                                                        {map.type}
                                                     </div>
                                                </div>

                                                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                                                    <div className="px-6 py-2 bg-accent text-app-bg rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-glow-accent">
                                                        Consulter l'Atlas
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-2 space-y-2">
                                                <h3 className="text-lg font-black text-app-text uppercase tracking-tight truncate group-hover:text-accent transition-colors duration-500">{map.name}</h3>
                                                <p className="text-[10px] font-serif text-app-text/40 leading-relaxed italic line-clamp-2 italic">
                                                    {map.narrativeDescription || "Documentation en attente..."}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {resolvedAtlasMaps.length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-app-border/20 rounded-[4rem] bg-app-surface/20">
                                            <div className="p-12 bg-app-surface/40 rounded-full border border-app-border/10">
                                                <Globe size={80} className="text-app-text/5 animate-pulse" />
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-sm font-black uppercase tracking-[0.4em] text-app-text/20">Territoires inconnus</p>
                                                <p className="max-w-xs text-[10px] text-app-text/10 font-bold uppercase leading-relaxed">
                                                    Aucun lieu n'a encore été marqué comme visité par le Maître de Jeu.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'inventory' && (
                        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                                        <Package className="text-accent" size={30} />
                                        Inventaire Personnel
                                    </h2>
                                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-[0.5em]">Trésors, reliques et objets du groupe.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="text-[10px] font-black bg-amber-500/10 border border-amber-500/20 px-6 py-2 rounded-full text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        {inventoryItems.length} Objets
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 place-items-start">
                                    {inventoryItems.map((item, idx) => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`group relative flex flex-col gap-4 p-4 rounded-[2.5rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-amber-500/30 transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${Math.min(idx * 50, 500)} w-full`}
                                        >
                                            <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-app-bg shadow-xl flex items-center justify-center">
                                                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                                                {item.imageUrl ? (
                                                    <ResolvedImage 
                                                        src={item.imageUrl} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                                    />
                                                ) : (
                                                    <Package className="text-app-text/20" size={64} />
                                                )}
                                                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                    <div className="px-4 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                                                        Inspecter
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-1 text-center space-y-1">
                                                <h3 className="text-[11px] font-black text-app-text uppercase tracking-wider truncate border-b border-app-border/10 pb-2">{item.name}</h3>
                                                {item.subtitle && (
                                                    <p className="text-[8px] font-bold text-accent/60 uppercase tracking-widest truncate">{item.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {inventoryItems.length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-app-border/20 rounded-[4rem] bg-app-surface/20 w-full">
                                            <div className="p-12 bg-app-surface/40 rounded-full border border-app-border/10">
                                                <Package size={80} className="text-app-text/5" />
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-sm font-black uppercase tracking-[0.4em] text-app-text/20">Inventaire Vide</p>
                                                <p className="max-w-xs text-[10px] text-app-text/10 font-bold uppercase leading-relaxed">
                                                    Aucun objet assigné à votre personnage.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Refined Session Summary (Sober & Floating) */}
            {sessionSummary && currentTab === 'live' && (
                <div className="fixed bottom-28 left-8 z-[60] w-full max-w-2xl bg-app-surface/20 backdrop-blur-md border border-app-border/40 rounded-[2.5rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-8 duration-1000 pointer-events-auto">
                    <div className="flex items-center gap-5 mb-6 opacity-40">
                        <div className="p-2.5 bg-app-text/5 rounded-2xl border border-app-border/40">
                            <BookOpen size={20} className="text-app-text" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-[10px] font-black text-app-text uppercase tracking-[0.4em]">Chroniques de Séance</h3>
                            <p className="text-[7px] font-bold text-app-text/50 uppercase tracking-widest">Journal Narratif en temps réel</p>
                        </div>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar-minimal pr-6 group">
                        <p className="text-xl text-app-text/70 leading-relaxed font-serif italic text-justify opacity-70 group-hover:opacity-100 transition-opacity duration-700">
                            {sessionSummary}
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Tabs */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
                <div className="bg-app-surface/80 backdrop-blur-2xl border border-app-border/40 p-1.5 rounded-full shadow-2xl flex items-center gap-1">
                    <button 
                        onClick={() => setCurrentTab('live')}
                        title="Vue Directe"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'live' ? 'bg-accent text-app-bg' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <Monitor size={14} />
                        Direct
                    </button>
                    <button 
                        onClick={() => setCurrentTab('archives')}
                        title="Archives"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'archives' ? 'bg-accent text-app-bg' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <Archive size={14} />
                        Archives
                    </button>
                    <button 
                         onClick={() => setCurrentTab('trombinoscope')}
                         title="Trombinoscope"
                         className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'trombinoscope' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <Users size={14} />
                        PNJ
                    </button>
                    <button 
                        onClick={() => setCurrentTab('atlas')}
                        title="Atlas des Lieux"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'atlas' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <Globe size={14} />
                        Lieux
                    </button>
                    <button 
                        onClick={() => setCurrentTab('inventory')}
                        title="Inventaire Personnel"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'inventory' ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <Package size={14} />
                        Sac
                    </button>
                    <button 
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        title="Fiche de personnage"
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isInventoryOpen ? 'bg-indigo-600 text-white' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <User size={14} />
                        Fiche
                    </button>
                    <button 
                        onClick={toggleMessenger}
                        title="Messagerie"
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isMessengerOpen ? 'bg-indigo-600 text-white' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <MessageSquare size={14} />
                        Messages
                        {unreadCount > 0 && !isMessengerOpen && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] items-center justify-center font-bold text-white">
                                    {unreadCount}
                                </span>
                            </span>
                        )}
                    </button>
                    <div className="w-[1px] h-4 bg-app-border/40 mx-1" />
                    <button 
                        onClick={() => {
                            if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
                                resetIdentity();
                            }
                        }}
                        title="Déconnexion"
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                    >
                        <LogOut size={14} />
                        Quitter
                    </button>
                </div>
            </div>

            {/* Bottom: Combat Tracker (Simplified) */}
            {hasCombatants && activeCombatant && (
                <div className="fixed right-4 bottom-4 top-auto md:top-4 md:bottom-auto w-auto md:w-80 h-auto md:h-[calc(100vh-2rem)] z-50 bg-app-surface/60 backdrop-blur-2xl border border-app-border/40 flex flex-col gap-4 p-4 md:p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-500 pointer-events-auto">
                    <div className="flex items-center justify-between border-b border-app-border/40 pb-3">
                        <div className="flex flex-col">
                            <h1 className="text-app-text text-base md:text-lg font-bold tracking-tight">Initiative</h1>
                            <p className="text-rose-400 text-[10px] font-bold uppercase">Round {round} • Tour {currentTurnIdx + 1}</p>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto custom-scrollbar pr-2">
                        {/* Active Turn */}
                        <div className="flex-none md:flex-initial flex flex-col gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-glow-crimson relative overflow-hidden min-w-[180px]">
                            <div className="flex items-center gap-3">
                                <ResolvedImage className="size-8 rounded-full border border-rose-500" src={activeCombatant.avatar} alt={activeCombatant.name} fallback={activeCombatant.name.charAt(0)} />
                                <div className="flex flex-col">
                                    <p className="text-app-text text-xs font-bold leading-none truncate max-w-[80px]">{activeCombatant.name}</p>
                                    <p className="text-rose-400 text-[8px] font-bold uppercase mt-1">À toi</p>
                                </div>
                            </div>
                            {activeCombatant.hpMax > 0 && (
                                <div className="flex items-center gap-2 pt-2 border-t border-rose-500/20">
                                    <span className="text-[10px] font-black text-rose-100">{activeCombatant.hp} / {activeCombatant.hpMax} HP</span>
                                    <div className="flex-1 h-1 bg-app-text/10 rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-rose-500 transition-all duration-500" 
                                            style={{ width: `${(activeCombatant.hp / (activeCombatant.hpMax || 1)) * 100}%` }}
                                         />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Next in Line (Limited for lightness) */}
                        {upcomingCombatants.slice(0, 3).map((combatant) => (
                            <div key={combatant.id} className="flex-none md:flex-initial flex items-center gap-3 p-3 rounded-2xl bg-app-surface/20 border border-app-border/10 opacity-80 min-w-[140px]">
                                <ResolvedImage className="size-8 rounded-full border border-app-border/10" src={combatant.avatar} alt={combatant.name} fallback={combatant.name.charAt(0)} />
                                <div className="flex flex-col">
                                    <p className="text-app-text/90 text-xs font-medium leading-tight truncate max-w-[70px]">{combatant.name}</p>
                                    <p className="text-app-text/40 text-[8px] uppercase">En attente</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Polish Overlays */}
            <div className="fixed inset-0 pointer-events-none z-50 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] opacity-50"></div>

            {/* Session Guard & Onboarding Overlay */}
            {(!isOnboarded || !activeSession) && <LobbyOnboarding />}

            {/* Interactive Character Sheet Overlay */}
            {characterId && (
                <>
                    {isInventoryOpen && (
                        <HubCharacterSheet 
                            onClose={() => setIsInventoryOpen(false)} 
                        />
                    )}

                    <HubMessenger 
                        isOpen={isMessengerOpen}
                        onClose={() => setIsMessengerOpen(false)}
                        characterId={characterId}
                        characterName={characterName}
                    />
                </>
            )}

            {/* Notification Center for Hub Alerts */}
            <HubNotificationCenter />

            {/* Clue Viewer Modal */}
            <HubClueViewer 
                clue={selectedClue} 
                onClose={() => setSelectedClue(null)} 
            />

            {/* NPC Viewer Modal */}
            <HubNpcViewer 
                npc={selectedNpc} 
                onClose={() => setSelectedNpc(null)} 
            />

            {/* Atlas Viewer Modal */}
            <HubAtlasViewer 
                map={selectedAtlasMap} 
                onClose={() => setSelectedAtlasMap(null)} 
            />

            {/* Item Viewer Modal */}
            <HubItemViewer 
                item={selectedItem} 
                onClose={() => setSelectedItem(null)} 
            />

            {/* Dice Projection Overlay */}
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-12 pointer-events-none transition-all duration-1000 ${
                showDice ? 'opacity-100' : 'opacity-0'
            }`}>
                {lastRoll && (
                    <div className={`bg-app-surface/90 backdrop-blur-3xl border-2 border-accent/30 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(var(--accent-rgb),0.3)] flex flex-col items-center gap-8 max-w-2xl w-full transform transition-all duration-1000 ${
                        showDice ? 'scale-100 translate-y-0 animate-in zoom-in' : 'scale-95 translate-y-8 duration-700'
                    }`}>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <span className="text-accent text-xs font-black uppercase tracking-[0.5em] animate-pulse">Dice Result</span>
                            <h2 className="text-app-text/80 text-xl font-black tracking-tight uppercase drop-shadow-lg">{lastRoll.title}</h2>
                        </div>

                        <div className="text-6xl md:text-8xl leading-tight font-black text-app-text drop-shadow-[0_0_40px_var(--app-accent)] transition-all text-center break-words max-w-full">
                            {lastRoll.totalDisplay}
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center mt-4">
                            {(lastRoll.rolls as DieResult[]).map((r, i) => {
                                const cls = r.cssClass || '';
                                const isYZEBase = cls.includes('amber');
                                const isYZERose = cls.includes('rose');
                                const isYZEEmerald = cls.includes('emerald');
                                const isSuccess = cls.includes('!bg-') || r.isCritMax;
                                const isCritMin = r.isCritMin;
                                const isExploded = r.isExploded;
                                
                                let diceStyle = 'bg-slate-950/40 border-white/5 text-slate-500';

                                if (isSuccess) {
                                    // Priority 1: YZE Solid Colors
                                    if (isYZEBase) diceStyle = 'bg-amber-500 border-amber-500 text-amber-950 shadow-glow-amber scale-110 z-10 font-black';
                                    else if (isYZERose) diceStyle = 'bg-rose-500 border-rose-500 text-white shadow-glow-rose scale-110 z-10 font-black';
                                    else if (isYZEEmerald) diceStyle = 'bg-emerald-500 border-emerald-500 text-emerald-950 shadow-glow-emerald scale-110 z-10 font-black';
                                    // Priority 2: Generic Success (Emerald Border)
                                    else diceStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-glow-emerald/40 scale-105 font-black border-2';
                                } else if (isCritMin) {
                                    // Priority 3: Fails / Banes (Rose Border)
                                    diceStyle = 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-glow-rose/40 scale-105 font-black border-2';
                                } else if (isExploded) {
                                    // Priority 4: Exploded Dice (Violet Border)
                                    diceStyle = 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-glow-violet/40 scale-105 font-black border-2';
                                } else {
                                    // Normal dice - subtle
                                    if (isYZEBase) diceStyle = 'bg-transparent border-amber-500/20 text-amber-500/80';
                                    else if (isYZERose) diceStyle = 'bg-transparent border-rose-500/20 text-rose-500/80';
                                    else if (isYZEEmerald) diceStyle = 'bg-transparent border-emerald-500/20 text-emerald-500/80';
                                }

                                return (
                                    <div key={i} className={`size-14 md:size-16 flex items-center justify-center rounded-2xl text-2xl border transition-all ${diceStyle}`}>
                                        {r.displayStr || r.val}
                                    </div>
                                );
                            })}
                        </div>

                        {lastRoll.tagSuccess !== undefined && (
                            <div className="mt-6 flex justify-center">
                                <div className={`px-10 py-2.5 rounded-full border-2 text-lg font-black uppercase tracking-[0.25em] backdrop-blur-md shadow-2xl transition-all ${
                                    lastRoll.tagSuccess 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-glow-emerald/30' 
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-glow-rose/30'
                                }`}>
                                    {lastRoll.tagSuccess ? 'succès' : 'échec'}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabletHub;
