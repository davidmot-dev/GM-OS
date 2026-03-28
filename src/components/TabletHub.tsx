import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
    Wifi,
    WifiOff
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
import { useTacticalAIStore } from '../modules/tactical-ai/useTacticalAIStore';
import { openDB } from 'idb';
import { useClientStore } from '../stores/useClientStore';
import LobbyOnboarding from './hub/LobbyOnboarding';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { 
    Archive, 
    Monitor,
    Search,
    LogOut
} from 'lucide-react';

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
    const { clues } = useSessionOSStore();

    const activeHubId = projections['hub'];
    const [liveImagePath, setLiveImagePath] = useState<string | null | undefined>(undefined);
    const [liveEntity, setLiveEntity] = useState<ProjectedEntity | null>(null);
    const [currentTab, setCurrentTab] = useState<'live' | 'archives'>('live');
    const { deviceId, pseudo, playerName, characterId, isOnboarded, setStatus: setClientStatus, resetIdentity } = useClientStore();
    const { sessions, activeCampaignWallpaper, activeCampaignName } = useSessionOSStore();
    const activeSession = sessions.find(s => s.status === 'active');
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const socketRef = useRef<WebSocket | null>(null);
    const connectRef = useRef<(() => void) | undefined>(undefined);
    // Resolved versions of favorites (m-xxx IDs converted to data: URIs)
    const [resolvedFavorites, setResolvedFavorites] = useState<FavoriteEntity[]>([]);

    // WebSocket Sync Logic
    const host = window.location.hostname;
    const port = 3001;

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

                        useSessionOSStore.setState({ 
                            sessions: data.payload.session.sessions || [],
                            campaigns: data.payload.session.campaigns || [],
                            players: data.payload.session.players || [],
                            activeCampaignId: data.payload.session.activeCampaignId || null,
                            activeCampaignName: data.payload.session.activeCampaignName || null,
                            activeCampaignWallpaper: data.payload.session.activeCampaignWallpaper || null
                        });
                    }

                    if (incomingVoice !== undefined) setVoiceLevel(incomingVoice);
                }
            } catch (err) {
                console.error('[TabletHub] Sync error:', err);
            }
        };

        socket.onerror = () => setStatus('error');
    }, [host, port, deviceId, pseudo, playerName, setClientStatus, characterId]); // Removed role, added characterId

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
            <div className="backdrop-blur-md bg-slate-950/40 border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center justify-center w-full aspect-square max-w-[250px] overflow-hidden">
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
        <div className="bg-black text-slate-100 font-cinematic selection:bg-red-600/30 w-full h-screen overflow-hidden flex flex-col relative select-none cursor-default" style={rootStyles}>
            
            {/* Sync connection status */}
            <div className={`fixed top-4 right-4 z-50 p-1.5 rounded-full backdrop-blur-md border ${
                status === 'connected' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
            }`} title={status === 'connected' ? 'Synchronisé' : 'Déconnecté du MJ'}>
                {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
            </div>

            {/* Campaign Title Header */}
            {activeCampaignName && (
                <div className="fixed top-6 left-8 z-50 animate-in fade-in slide-in-from-left duration-1000">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gm-gold/60 uppercase tracking-[0.4em] mb-1">Opération en cours</span>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tightest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
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
            
            {!resolvedBackground && !activeCampaignWallpaper && <div className="fixed inset-0 z-0 bg-[#110505]"></div>}

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
                        <div className="grid grid-cols-2 gap-4 w-full h-fit overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {tensions.map(clock => (
                                <div key={clock.id} className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl">
                                    <NarrativeClock clock={clock} theme={theme} size={48} />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <p className={`text-sm font-black truncate w-full ${theme === 'cyberpunk' ? 'text-pink-400 font-mono tracking-wider' : theme === 'oldstyle' ? 'text-amber-500 font-serif' : 'text-slate-200 uppercase tracking-tight'}`}>{clock.name}</p>
                                        <p className={`text-[10px] mt-0.5 font-bold ${theme === 'cyberpunk' ? 'text-cyan-400' : theme === 'oldstyle' ? 'text-amber-700/80 italic' : 'text-slate-400'}`}>
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
                                        <div key={liveEntity.id} className={`bg-slate-900/90 backdrop-blur-3xl border-2 border-gm-cyan/30 rounded-3xl p-5 md:p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)] flex flex-col gap-4 animate-in fade-in zoom-in duration-1000 w-full ${liveEntity.type === 'Oracle' ? 'max-w-xl' : ''}`}>
                                            <div className="flex flex-col items-center text-center gap-4">
                                                <div 
                                                    className={`${liveEntity.type === 'Oracle' ? 'w-full aspect-[2/3] max-h-[75vh]' : 'size-28 md:size-40'} rounded-2xl overflow-hidden border-2 border-gm-cyan/20 shadow-glow-cyan bg-slate-950 transition-all scale-100 relative [transform:scale(var(--voice-scale))] [box-shadow:var(--voice-glow)]`}
                                                >
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" />
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} alt={liveEntity.name} className={`relative z-10 w-full h-full ${liveEntity.type === 'Oracle' ? 'object-contain' : 'object-cover'}`} />
                                                </div>

                                                {liveEntity.type !== 'Oracle' && (
                                                    <div className="flex flex-col items-center">
                                                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase whitespace-nowrap">{liveEntity.name}</h3>
                                                        <p className="text-gm-cyan text-[9px] font-black uppercase tracking-[0.3em] mt-1">{liveEntity.subtitle || liveEntity.type || 'Personnage'}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {liveEntity.type !== 'Oracle' && (
                                                <div className="relative pt-4 border-t border-white/10">
                                                    <p className="font-serif text-slate-200 leading-relaxed italic text-xs md:text-sm text-center line-clamp-6">
                                                        {liveEntity.lore || liveEntity.description || "Détails confidentiels."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {resolvedFavorites.map(fav => (
                                        <div key={fav.id} className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-3 md:gap-4 animate-in fade-in zoom-in duration-700 w-full">
                                            <div className="flex flex-col items-center text-center gap-3">
                                                <div className="size-16 md:size-20 rounded-xl overflow-hidden border border-white/10 shadow-xl bg-slate-900 relative">
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110" />
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} alt={fav.name} className="relative z-10 w-full h-full object-contain" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-base md:text-lg font-black text-white tracking-tighter uppercase opacity-90">{fav.name}</h3>
                                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em]">{fav.type}</p>
                                                </div>
                                            </div>
                                            <div className="relative pt-3 border-t border-white/5">
                                                <p className="font-serif text-slate-300 leading-relaxed italic text-[10px] md:text-xs text-center line-clamp-4">
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
                                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                                        <Archive className="text-gm-gold" size={24} />
                                        Archives du Groupe
                                    </h2>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Preuves et indices collectés lors de la campagne.</p>
                                </div>
                                <div className="text-[10px] font-black bg-white/5 border border-white/10 px-4 py-2 rounded-full text-white/40 uppercase tracking-widest">
                                    {clues.filter(c => c.isRevealed).length} Fragments Découverts
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {clues.filter(c => c.isRevealed).map((clue, idx) => (
                                        <div 
                                            key={clue.id} 
                                            className={`group bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all hover:border-gm-gold/30 hover:bg-slate-900/80 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${idx * 50}`}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className="size-16 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex-none">
                                                    {clue.mediaUrl ? (
                                                        <ResolvedImage src={clue.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/10">
                                                            <Search size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4 flex-1">
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-black text-white group-hover:text-gm-gold transition-colors">{clue.title}</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {clue.revealedAt && (
                                                                <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                                    DÉCOUVERT LE {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(clue.revealedAt)}
                                                                </span>
                                                            )}
                                                            {clue.campaignMoment && (
                                                                <span className="text-[7px] font-black text-gm-gold/40 uppercase tracking-[0.2em] bg-gm-gold/5 px-2 py-0.5 rounded border border-gm-gold/10">
                                                                    {clue.campaignMoment}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-white/40 leading-relaxed italic font-serif line-clamp-4">{clue.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {clues.filter(c => c.isRevealed).length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-white/5 rounded-[3rem]">
                                            <Archive size={48} className="text-white/5" />
                                            <p className="text-xs font-black uppercase tracking-widest text-white/20">Aucune archive disponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation Tabs */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
                <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl flex items-center gap-1">
                    <button 
                        onClick={() => setCurrentTab('live')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'live' ? 'bg-gm-gold text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        <Monitor size={14} />
                        Direct
                    </button>
                    <button 
                        onClick={() => setCurrentTab('archives')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'archives' ? 'bg-gm-gold text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        <Archive size={14} />
                        Archives
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <button 
                        onClick={() => {
                            if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
                                resetIdentity();
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={14} />
                        Quitter
                    </button>
                </div>
            </div>

            {/* Bottom: Combat Tracker (Simplified) */}
            {hasCombatants && activeCombatant && (
                <div className="fixed right-4 bottom-4 top-auto md:top-4 md:bottom-auto w-auto md:w-80 h-auto md:h-[calc(100vh-2rem)] z-50 bg-slate-950/60 backdrop-blur-2xl border border-white/10 flex flex-col gap-4 p-4 md:p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-500 pointer-events-auto">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex flex-col">
                            <h1 className="text-white text-base md:text-lg font-bold tracking-tight">Initiative</h1>
                            <p className="text-red-400 text-[10px] font-bold uppercase">Round {round} • Tour {currentTurnIdx + 1}</p>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto custom-scrollbar pr-2">
                        {/* Active Turn */}
                        <div className="flex-none md:flex-initial flex flex-col gap-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-glow-crimson relative overflow-hidden min-w-[180px]">
                            <div className="flex items-center gap-3">
                                <ResolvedImage className="size-8 rounded-full border border-red-500" src={activeCombatant.avatar} alt={activeCombatant.name} fallback={activeCombatant.name.charAt(0)} />
                                <div className="flex flex-col">
                                    <p className="text-white text-xs font-bold leading-none truncate max-w-[80px]">{activeCombatant.name}</p>
                                    <p className="text-red-400 text-[8px] font-bold uppercase mt-1">À toi</p>
                                </div>
                            </div>
                            {activeCombatant.hpMax > 0 && (
                                <div className="flex items-center gap-2 pt-2 border-t border-red-500/20">
                                    <span className="text-[10px] font-black text-red-100">{activeCombatant.hp} / {activeCombatant.hpMax} HP</span>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                         <div 
                                            className="h-full bg-red-500 transition-all duration-500" 
                                            style={{ width: `${(activeCombatant.hp / (activeCombatant.hpMax || 1)) * 100}%` }}
                                         />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Next in Line (Limited for lightness) */}
                        {upcomingCombatants.slice(0, 3).map((combatant) => (
                            <div key={combatant.id} className="flex-none md:flex-initial flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 opacity-80 min-w-[140px]">
                                <ResolvedImage className="size-8 rounded-full border border-white/10" src={combatant.avatar} alt={combatant.name} fallback={combatant.name.charAt(0)} />
                                <div className="flex flex-col">
                                    <p className="text-slate-200 text-xs font-medium leading-tight truncate max-w-[70px]">{combatant.name}</p>
                                    <p className="text-slate-500 text-[8px] uppercase">En attente</p>
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
        </div>
    );
};

export default TabletHub;
