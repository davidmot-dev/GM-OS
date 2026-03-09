import React, { useEffect, useState } from 'react';
import { useImageStore } from '../modules/image/useImageStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { useClockStore } from '../store/useClockStore';
import { useFavoriteStore } from '../modules/favorite/useFavoriteStore';
import { useMapStore } from '../modules/map/useMapStore';
import { useMediaUrl } from '../hooks/useMediaUrl';
import PlayerMapCanvas from '../modules/map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../modules/whiteboard/components/PlayerDrawingCanvas';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';
import { ResolvedImage } from './ResolvedImage';
import type { ProjectedEntity } from '../modules/image/types';
import NarrativeClock from '../modules/clock/components/NarrativeClock';
import ClockVisualizer from '../modules/clock/components/ClockVisualizer';
import { useVoiceStore } from '../modules/voice/useVoiceStore';

const PlayerHub: React.FC = () => {
    const { mediaList, projections } = useImageStore();
    const { isClockProjected, timestamp, mode, theme, tensions } = useClockStore();
    const { favorites } = useFavoriteStore();
    const { combatants, currentTurnIdx, round } = useCombatStore();
    const { mapUrl } = useMapStore();

    const activeHubId = projections['hub'];
    
    const [liveImagePath, setLiveImagePath] = useState<string | null>(null);
    const [liveEntity, setLiveEntity] = useState<ProjectedEntity | null>(null);
    const [voiceLevel, setVoiceLevel] = useState(0);

    const { isSyncNPC, isActive } = useVoiceStore();
    
    // Voice Sync Animation values for the projected entity
    const syncActive = isSyncNPC && isActive && voiceLevel > 0.05;
    const voiceScale = syncActive ? 1 + (voiceLevel * 0.1) : 1;
    const voiceGlow = syncActive ? `0 0 ${voiceLevel * 30}px rgba(6, 182, 212, ${voiceLevel})` : 'none';

    const activeMedia = mediaList?.find(m => m.id === activeHubId);
    const backgroundPath = liveImagePath || activeMedia?.path;

    useEffect(() => {
        // Load existing states immediately for all persisted stores
        useClockStore.persist.rehydrate();
        useCombatStore.persist.rehydrate();
        useFavoriteStore.persist.rehydrate();
        useMapStore.persist.rehydrate();
        useWhiteboardStore.persist.rehydrate();
        useVoiceStore.persist.rehydrate();
        
        // Listen for IPC updates because this is a separate window
        if (window.appBridge?.on) {
            window.appBridge.on('image:sync-hub-data', (_event: unknown, ...args: unknown[]) => {
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
            });
        }

        // Listen to localStorage changes for cross-window Zustand synchronization
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'gm-os-clock-storage') {
                useClockStore.persist.rehydrate();
            }
            if (e.key === 'gmos-combat-storage') {
                useCombatStore.persist.rehydrate();
            }
            if (e.key === 'gm-os-favorites-storage') {
                useFavoriteStore.persist.rehydrate();
            }
            if (e.key === 'gmos-map-storage') {
                useMapStore.persist.rehydrate();
            }
            if (e.key === 'gm-os-whiteboard-storage-v1') {
                useWhiteboardStore.persist.rehydrate();
            }
            if (e.key === 'gmos-voice-storage') {
                useVoiceStore.persist.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const hasCombatants = combatants.length > 0;
    const activeCombatant = hasCombatants ? combatants[currentTurnIdx] : null;
    const sharedFavorites = favorites.filter(f => f.isSyncedToPlayerHub);

    // Sort the upcoming combatants
    const upcomingCombatants = [];
    if (hasCombatants && combatants.length > 1) {
        let i = (currentTurnIdx + 1) % combatants.length;
        while (i !== currentTurnIdx) {
            upcomingCombatants.push(combatants[i]);
            i = (i + 1) % combatants.length;
        }
    }

    const renderClockWidget = () => {
        return (
            <div className="backdrop-blur-md bg-slate-950/40 border-b border-r border-white/10 p-8 rounded-br-[2rem] rounded-tr-xl rounded-bl-xl shadow-2xl flex items-center justify-center w-full min-h-[250px]">
                <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
            </div>
        );
    };

    const resolvedBackground = useMediaUrl(backgroundPath || undefined);

    return (
        <div className="bg-[#221010] text-slate-100 font-cinematic selection:bg-red-600/30 w-full h-screen overflow-hidden flex flex-col relative select-none cursor-default">
            {/* Full-screen Campaign Background or Map OS Projection */}
            {(mapUrl && useMapStore.getState().projectionTarget === 'hub') ? (
                <div className="fixed inset-0 z-0">
                    <PlayerMapCanvas />
                </div>
            ) : (
                <>
                    <div
                        className="fixed inset-0 z-0 bg-cover bg-center grayscale-[20%] transition-all duration-1000 ease-in-out"
                        style={{
                            backgroundImage: resolvedBackground ? `url('${resolvedBackground}')` : "none",
                            opacity: resolvedBackground ? 1 : 0,
                            filter: `brightness(${(sharedFavorites.length > 0 || liveEntity) ? 0.15 : 0.4}) grayscale(20%)`
                        }}
                    ></div>
                    {/* If no image, show blackout background */}
                    {!resolvedBackground && <div className="fixed inset-0 z-0 bg-black"></div>}
                </>
            )}

            {/* Whiteboard / Annotation Layer */}
            <div className="fixed inset-0 z-[5]">
                <PlayerDrawingCanvas />
            </div>

            {/* Dark Overlay when favorites or entity are displayed */}
            {(sharedFavorites.length > 0 || liveEntity) && (
                <div 
                    className={`fixed inset-0 z-5 bg-black/${mapUrl ? '60' : '40'} backdrop-blur-[2px] pointer-events-none transition-all duration-700`}
                ></div>
            )}

            {/* Main Projection Overlay */}
            <div className="relative z-10 flex h-screen w-full flex-col overflow-hidden pointer-events-none">
                {/* 1. Dynamic Clock OS Widget & Jauges (Floating) */}
                {isClockProjected && (
                    <div className="absolute top-0 left-0 p-8 pointer-events-auto animate-in fade-in slide-in-from-left duration-700">
                        <div className="flex flex-col gap-4 transform scale-[0.65] origin-top-left w-[460px]">
                            {renderClockWidget()}

                            {/* 1b. Tension Clocks (Jauges) */}
                            {tensions.length > 0 && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {tensions.map(clock => (
                                        <div key={clock.id} className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl w-full">
                                            <NarrativeClock clock={clock} theme={theme} size={62} />
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <p className={`text-lg font-black truncate w-full ${theme === 'cyberpunk' ? 'text-pink-400 font-mono tracking-wider' : theme === 'oldstyle' ? 'text-amber-500 font-serif' : 'text-slate-200 uppercase tracking-tight'}`}>{clock.name}</p>
                                                <p className={`text-xs mt-0.5 font-bold ${theme === 'cyberpunk' ? 'text-cyan-400' : theme === 'oldstyle' ? 'text-amber-700/80 italic' : 'text-slate-400'}`}>
                                                    {clock.filledSegments} / {clock.totalSegments} Segments
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. THEATER AREA: Shared Favorites & Live Entity */}
                <div className={`flex-1 flex items-center justify-center p-4 md:p-12 transition-all duration-1000 ${hasCombatants ? 'pr-80' : ''} pointer-events-auto`}>
                    {(sharedFavorites.length > 0 || liveEntity) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center">
                                <div className={`grid grid-cols-1 ${ (sharedFavorites.length + (liveEntity ? 1 : 0)) > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-xl'} gap-8 md:gap-12 w-full place-items-center`}>
                                    
                                    {/* 2a. Live Projected Entity */}
                                    {liveEntity && (
                                        <div key={liveEntity.id} className="bg-slate-900/90 backdrop-blur-3xl border-2 border-gm-cyan/30 rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(34,211,238,0.2)] flex flex-col gap-6 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 w-full hover:border-gm-cyan/60 transition-all group ring-1 ring-gm-cyan/10">
                                            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
                                                <div 
                                                    className="size-28 md:size-40 rounded-2xl overflow-hidden border-2 border-gm-cyan/20 shadow-glow-cyan bg-slate-950 group-hover:border-gm-cyan/50 transition-all duration-700 scale-100 group-hover:scale-[1.05] flex-shrink-0 relative"
                                                    style={{
                                                        transform: `scale(${voiceScale})`,
                                                        boxShadow: voiceGlow,
                                                    }}
                                                >
                                                    {/* Blurred background */}
                                                    <ResolvedImage 
                                                        src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} 
                                                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" 
                                                    />
                                                    {/* Crisp centered image */}
                                                    <ResolvedImage 
                                                        src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} 
                                                        alt={liveEntity.name} 
                                                        className="relative z-10 w-full h-full object-contain" 
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-lg uppercase bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">{liveEntity.name}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="h-px w-6 bg-gm-cyan/40"></span>
                                                        <p className="text-gm-cyan text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] drop-shadow-sm">{liveEntity.subtitle || liveEntity.type || 'Personnage'}</p>
                                                        <span className="h-px w-6 bg-gm-cyan/40"></span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {liveEntity.fields && Object.keys(liveEntity.fields).length > 0 && (
                                                <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-white/5">
                                                    {Object.entries(liveEntity.fields).slice(0, 4).map(([k, v]) => (
                                                        <div key={k} className="flex flex-col items-center text-center">
                                                            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">{k}</span>
                                                            <span className="text-xs font-bold text-slate-200">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="relative pt-6 border-t border-white/10">
                                                <p className="font-serif text-slate-200 leading-relaxed italic text-sm md:text-base text-center whitespace-pre-wrap drop-shadow-md line-clamp-[10]">
                                                    {liveEntity.lore || liveEntity.description || "Aucun détail narratif supplémentaire."}
                                                </p>
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-4 py-1.5 rounded-full border border-gm-cyan/30 shadow-glow-cyan shadow-sm">
                                                    <span className="material-symbols-outlined text-gm-cyan text-[16px] block">history_edu</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2b. Shared Favorites */}
                                    {sharedFavorites.map(fav => (
                                        <div key={fav.id} className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-5 md:p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] flex flex-col gap-4 md:gap-5 animate-in fade-in zoom-in duration-700 w-full hover:border-white/20 transition-all group">
                                            <div className="flex flex-col items-center text-center gap-3 md:gap-4">
                                                <div className="size-20 md:size-28 rounded-xl overflow-hidden border border-white/10 shadow-xl bg-slate-900 group-hover:border-white/30 transition-all duration-500 scale-100 group-hover:scale-[1.05] flex-shrink-0 relative">
                                                    {/* Blurred background */}
                                                    <ResolvedImage 
                                                        src={fav.imageUrl || fav.tokenUrl} 
                                                        className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110" 
                                                    />
                                                    {/* Crisp centered image */}
                                                    <ResolvedImage 
                                                        src={fav.imageUrl || fav.tokenUrl} 
                                                        alt={fav.name} 
                                                        className="relative z-10 w-full h-full object-contain" 
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-lg md:text-xl font-black text-white tracking-tighter drop-shadow-md uppercase opacity-90">{fav.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="h-px w-3 bg-white/20"></span>
                                                        <p className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em]">{fav.type} {fav.subtitle ? `• ${fav.subtitle}` : ''}</p>
                                                        <span className="h-px w-3 bg-white/20"></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative pt-4 md:pt-5 border-t border-white/5">
                                                <p className="font-serif text-slate-300 leading-relaxed italic text-xs md:text-sm text-center whitespace-pre-wrap drop-shadow-sm line-clamp-[10]">
                                                    {fav.lore}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. SYNC INDICATOR (Bottom) */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none">
                    {sharedFavorites.length > 0 && (
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gm-cyan/40 animate-pulse">Knowledge Base Synchronized</p>
                    )}
                </div>
            </div>

            {/* 3. Right Side Combat Tracker */}
            {hasCombatants && activeCombatant && (
                <div className="fixed right-0 top-0 w-80 h-full z-20 bg-slate-900/30 backdrop-blur-sm border-l border-white/5 flex flex-col gap-4 p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <div className="flex flex-col">
                            <h1 className="text-white text-xl font-bold tracking-tight">Combat Initiative</h1>
                            <p className="text-red-400 text-xs font-bold uppercase tracking-tighter">Round {round} • Turn {currentTurnIdx + 1}</p>
                        </div>
                        <div className="bg-red-500/20 text-red-500 p-2 rounded-lg border border-red-500/30">
                            <span className="material-symbols-outlined">swords</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 px-4 py-4 rounded-xl bg-red-500/20 ring-1 ring-red-500/50 shadow-glow-crimson relative">
                            <ResolvedImage 
                                className="size-10 rounded-full bg-slate-800 bg-cover bg-center border-2 border-red-500 flex items-center justify-center text-slate-400 font-display font-black text-sm"
                                src={activeCombatant.avatar}
                                alt={activeCombatant.name}
                                fallback={activeCombatant.name.charAt(0)}
                            />
                            <div className="flex flex-col">
                                <p className="text-white text-sm font-bold leading-none">{activeCombatant.name}</p>
                                <p className="text-red-400 text-[10px] font-bold uppercase mt-1">Active Turn</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                {activeCombatant.statuses.map(s => (
                                    <span key={s.id} className="text-xs" title={`${s.name} (${s.duration > 0 ? s.duration + ' rounds' : 'permanent'})`}>{s.icon}</span>
                                ))}
                                <span className="material-symbols-outlined text-red-500">double_arrow</span>
                            </div>
                        </div>

                        {upcomingCombatants.slice(0, 5).map((combatant, idx) => (
                            <div key={combatant.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5 transition-opacity duration-500 opacity-80`}>
                                <ResolvedImage 
                                    className="size-10 rounded-full bg-slate-800 bg-cover bg-center border border-white/10 flex items-center justify-center text-slate-500 font-display font-black text-sm"
                                    src={combatant.avatar}
                                    alt={combatant.name}
                                    fallback={combatant.name.charAt(0)}
                                />
                                <div className="flex flex-col">
                                    <p className="text-slate-200 text-sm font-medium leading-tight">{combatant.name}</p>
                                    <p className="text-slate-500 text-[10px] uppercase mt-0.5">{idx === 0 ? 'Next' : 'Upcoming'}</p>
                                </div>
                                {combatant.statuses.length > 0 && (
                                    <div className="ml-auto flex items-center gap-1 opacity-50">
                                        {combatant.statuses.map(s => (
                                            <span key={s.id} className="text-[10px]">{s.icon}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-white/10">
                        <div className="flex items-center justify-between px-2">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Party Assets</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase">Party Gold</p>
                                <p className="text-lg font-bold text-yellow-500/80">1,250gp</p>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase">Danger</p>
                                <p className="text-lg font-bold text-red-500">High</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50"></div>
            <div className="fixed inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]"></div>
        </div>
    );
};


export default PlayerHub;
