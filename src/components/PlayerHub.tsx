import React, { useEffect, useState } from 'react';
import { useImageStore } from '../modules/image/useImageStore';
import { useCombatStore, type Combatant } from '../modules/combat/useCombatStore';
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
import { useTacticalAIStore } from '../modules/tactical-ai/useTacticalAIStore';
import { useDiceStore } from '../stores/useDiceStore';
import type { DieResult } from '../modules/dice/DiceEngine';


const PlayerHub: React.FC = () => {
    const { mediaList, projections } = useImageStore();
    const { isClockProjected, timestamp, mode, theme, tensions } = useClockStore();
    const { favorites } = useFavoriteStore();
    const { combatants, currentTurnIdx, round, isCombatProjected } = useCombatStore();
    const { mapUrl, projectionTarget } = useMapStore();
    const { backgroundMode, projectionTarget: whiteboardTarget } = useWhiteboardStore();
    const { isDiceProjected, lastRoll, projectionTrigger } = useDiceStore();
    const [showDice, setShowDice] = useState(false);
    const diceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTriggerRef = React.useRef(0);

    useEffect(() => {
        // On affiche seulement si le mode est ON et qu'un nouveau trigger (lancer) survient
        if (isDiceProjected && projectionTrigger > lastTriggerRef.current) {
            lastTriggerRef.current = projectionTrigger;
            const timerShow = setTimeout(() => setShowDice(true), 0);
            
            if (diceTimerRef.current) clearTimeout(diceTimerRef.current);
            diceTimerRef.current = setTimeout(() => {
                setShowDice(false);
            }, 5000);

            return () => clearTimeout(timerShow);
        } else if (!isDiceProjected) {
            const timerHide = setTimeout(() => setShowDice(false), 0);
            return () => clearTimeout(timerHide);
        }
    }, [isDiceProjected, projectionTrigger]);

    const isWhiteboardActive = whiteboardTarget === 'hub';

    const activeHubId = projections['hub'];
    
    const [liveImagePath, setLiveImagePath] = useState<string | null | undefined>(undefined);
    const [liveEntity, setLiveEntity] = useState<ProjectedEntity | null>(null);
    const [voiceLevel, setVoiceLevel] = useState(0);

    // Voice Sync Animation values
    const syncActive = voiceLevel > 0.05;
    const voiceScale = syncActive ? 1 + (voiceLevel * 0.15) : 1;
    const voiceGlow = syncActive ? `0 0 ${voiceLevel * 30}px rgba(6, 182, 212, ${voiceLevel})` : 'none';

    const activeMedia = mediaList?.find(m => m.id === activeHubId);

    useEffect(() => {
        // Load existing states immediately for all persisted stores
        const rehydrateAll = async () => {
            await Promise.all([
                useClockStore.persist.rehydrate(),
                useCombatStore.persist.rehydrate(),
                useFavoriteStore.persist.rehydrate(),
                useMapStore.persist.rehydrate(),
                useWhiteboardStore.persist.rehydrate(),
                useVoiceStore.persist.rehydrate(),
                useImageStore.persist.rehydrate(),
                useDiceStore.persist.rehydrate()
            ]);
        };
        rehydrateAll();
        
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
            const keys: Record<string, () => void> = {
                'gm-os-clock-storage': () => useClockStore.persist.rehydrate(),
                'gmos-combat-storage': () => useCombatStore.persist.rehydrate(),
                'gm-os-favorites-storage': () => useFavoriteStore.persist.rehydrate(),
                'gmos-map-storage': () => useMapStore.persist.rehydrate(),
                'gm-os-whiteboard-storage-v1': () => useWhiteboardStore.persist.rehydrate(),
                'gmos-voice-storage': () => useVoiceStore.persist.rehydrate(),
                'gm-os-tactical-ai': () => useTacticalAIStore.persist.rehydrate(),
                'gmos-image-storage': () => useImageStore.persist.rehydrate(),
                'gmos-dice-storage': () => useDiceStore.persist.rehydrate()
            };

            if (e.key && keys[e.key]) keys[e.key]();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const visibleCombatants = combatants.filter(c => 
        c.isPlayer || !c.statuses.some(s => {
            const n = s.name.toLowerCase();
            return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
        })
    );
    const hasCombatants = isCombatProjected && visibleCombatants.length > 0;
    
    // Find active combatant among visible ones, or use the real one if it's a player
    const realActiveCombatant = combatants[currentTurnIdx];
    const activeCombatant = (realActiveCombatant && (realActiveCombatant.isPlayer || !realActiveCombatant.statuses.some(s => {
        const n = s.name.toLowerCase();
        return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
    }))) ? realActiveCombatant : null;
    const sharedFavorites = favorites.filter(f => f.isSyncedToPlayerHub);

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
            <div className="backdrop-blur-md bg-slate-950/40 border-b border-r border-white/10 p-8 rounded-br-[2rem] rounded-tr-xl rounded-bl-xl shadow-2xl flex items-center justify-center w-full min-h-[250px]">
                <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
            </div>
        );
    };

    const backgroundPath = liveImagePath !== undefined ? liveImagePath : activeMedia?.path;
    const resolvedBackground = useMediaUrl(backgroundPath || undefined);
    const isMapActive = !!(mapUrl && projectionTarget === 'hub');

    return (
        <div className="bg-[#221010] text-slate-100 font-cinematic selection:bg-red-600/30 w-full h-screen overflow-hidden flex flex-col relative select-none cursor-default">
            {/* Map Background Layer (Z-0) */}
            {isMapActive && (
                <div className="fixed inset-0 z-0">
                    <PlayerMapCanvas 
                        onMapClick={(x, y) => {
                            useMapStore.getState().addPing(x, y, '#06b6d4'); // GM-OS Cyan for player pings
                        }}
                    />
                </div>
            )}
            
            {/* Campaign Background (if no map or map inactive) */}
            {!isMapActive && (
                <>
                    <div
                        className="fixed inset-0 z-0 bg-cover bg-center grayscale-[20%] transition-all duration-1000 ease-in-out"
                        style={{
                            backgroundImage: resolvedBackground ? `url('${resolvedBackground}')` : "none",
                            opacity: resolvedBackground ? 1 : 0,
                            filter: `brightness(${(sharedFavorites.length > 0 || liveEntity) ? 0.15 : 0.4}) grayscale(20%)`
                        }}
                    ></div>
                    {!resolvedBackground && <div className="fixed inset-0 z-0 bg-black"></div>}
                </>
            )}

            {/* Whiteboard Layer (Z-30) */}
            <div className={`fixed inset-0 z-30 pointer-events-none transition-colors duration-500 ${
                isWhiteboardActive && backgroundMode === 'light' ? 'bg-white' : 
                isWhiteboardActive && backgroundMode === 'dark' ? 'bg-app-bg' : 'bg-transparent'
            }`}>
                <PlayerDrawingCanvas />
            </div>

            {/* Overlays for focus */}
            {(sharedFavorites.length > 0 || liveEntity) && (
                <div className={`fixed inset-0 z-5 bg-black/${isMapActive ? '60' : '40'} backdrop-blur-[2px] pointer-events-none transition-all duration-700`}></div>
            )}

            {/* Main Content Area */}
            <div className="relative z-40 flex h-screen w-full flex-col overflow-hidden pointer-events-none">
                {/* 1. Dashboard Widgets */}
                {isClockProjected && (
                    <div className="absolute top-0 left-0 p-8 pointer-events-auto animate-in fade-in slide-in-from-left duration-700">
                        <div className="flex flex-col gap-4 transform scale-[0.65] origin-top-left w-[460px]">
                            {renderClockWidget()}

                            {tensions.length > 0 && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {tensions.map(clock => (
                                        <div key={clock.id} className="flex items-center gap-5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl w-full">
                                            <NarrativeClock clock={clock} theme={theme} size={75} />
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <p className={`text-xl font-black truncate w-full ${theme === 'cyberpunk' ? 'text-pink-400 font-mono tracking-wider' : theme === 'oldstyle' ? 'text-amber-500 font-serif' : 'text-slate-200 uppercase tracking-tight'}`}>{clock.name}</p>
                                                <p className={`text-sm mt-0.5 font-bold ${theme === 'cyberpunk' ? 'text-cyan-400' : theme === 'oldstyle' ? 'text-amber-700/80 italic' : 'text-slate-400'}`}>
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

                {/* 2. Central Theater Area */}
                <div className={`flex-1 flex items-center justify-center p-4 md:p-12 transition-all duration-1000 ${hasCombatants ? 'pr-80' : ''} pointer-events-none`}>
                    {(sharedFavorites.length > 0 || liveEntity) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center">
                                <div className={`grid grid-cols-1 ${(sharedFavorites.length + (liveEntity ? 1 : 0)) > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-xl'} gap-8 md:gap-12 w-full place-items-center`}>
                                    
                                    {liveEntity && (
                                        <div key={liveEntity.id} className="bg-slate-900/90 backdrop-blur-3xl border-2 border-gm-cyan/30 rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(34,211,238,0.2)] flex flex-col gap-6 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 w-full hover:border-gm-cyan/60 transition-all group">
                                            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
                                                <div 
                                                    className="size-28 md:size-40 rounded-2xl overflow-hidden border-2 border-gm-cyan/20 shadow-glow-cyan bg-slate-950 group-hover:border-gm-cyan/50 transition-all scale-100 group-hover:scale-105 relative"
                                                    style={{ transform: `scale(${voiceScale})`, boxShadow: voiceGlow }}
                                                >
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" />
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} alt={liveEntity.name} className="relative z-10 w-full h-full object-contain" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-lg uppercase bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">{liveEntity.name}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="h-px w-6 bg-gm-cyan/40"></span>
                                                        <p className="text-gm-cyan text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em]">{liveEntity.subtitle || liveEntity.type || 'Personnage'}</p>
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
                                            </div>
                                        </div>
                                    )}

                                    {sharedFavorites.map(fav => (
                                        <div key={fav.id} className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-5 md:p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] flex flex-col gap-4 md:gap-5 animate-in fade-in zoom-in duration-700 w-full group">
                                            <div className="flex flex-col items-center text-center gap-3 md:gap-4">
                                                <div className="size-20 md:size-28 rounded-xl overflow-hidden border border-white/10 shadow-xl bg-slate-900 group-hover:border-white/30 transition-all scale-100 group-hover:scale-105 relative">
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110" />
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} alt={fav.name} className="relative z-10 w-full h-full object-contain" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-lg md:text-xl font-black text-white tracking-tighter uppercase opacity-90">{fav.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="h-px w-3 bg-white/20"></span>
                                                        <p className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em]">{fav.type}</p>
                                                        <span className="h-px w-3 bg-white/20"></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative pt-4 border-t border-white/5">
                                                <p className="font-serif text-slate-300 leading-relaxed italic text-xs md:text-sm text-center line-clamp-[10]">
                                                    {fav.lore}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dice Projection Overlay */}
                    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-12 pointer-events-none transition-all duration-1000 ${
                        showDice ? 'opacity-100' : 'opacity-0'
                    }`}>
                        {lastRoll && (
                            <div className={`bg-slate-950/80 backdrop-blur-3xl border-2 border-gm-cyan/30 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(34,211,238,0.3)] flex flex-col items-center gap-8 max-w-2xl w-full transform transition-all duration-1000 ${
                                showDice ? 'scale-100 translate-y-0 animate-in zoom-in' : 'scale-95 translate-y-8 duration-700'
                            }`}>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <span className="text-gm-cyan text-xs font-black uppercase tracking-[0.5em] animate-pulse">Dice Result</span>
                                    <h2 className="text-white/80 text-xl font-black tracking-tight uppercase drop-shadow-lg">{lastRoll.title}</h2>
                                </div>

                                <div className="text-6xl md:text-8xl leading-tight font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all text-center break-words max-w-full">
                                    {lastRoll.totalDisplay}
                                </div>

                                {lastRoll.tagSuccess !== undefined && (
                                    <div className={`px-12 py-3 rounded-full text-2xl font-black uppercase tracking-[0.3em] shadow-2xl ${
                                        lastRoll.tagSuccess 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-500/20' 
                                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-rose-500/20'
                                    }`}>
                                        {lastRoll.tagSuccess ? 'Success' : 'Failure'}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 justify-center mt-4">
                                    {(lastRoll.rolls as DieResult[]).map((r, i) => (
                                        <div key={i} className={`size-16 flex items-center justify-center rounded-2xl text-2xl font-black border-2 transition-all ${
                                            r.isExploded ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-glow-indigo/30 scale-110' :
                                            r.isCritMax ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-glow-emerald/30 scale-110' :
                                            r.isCritMin ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-glow-crimson/30 scale-90' :
                                            'bg-white/5 border-white/10 text-white/50'
                                        }`}>
                                            {r.displayStr || r.val}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Sync Status */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
                    {sharedFavorites.length > 0 && (
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gm-cyan/40 animate-pulse">Knowledge Base Synchronized</p>
                    )}
                </div>
            </div>

            {/* 4. Sidebar: Combat Tracker */}
            {hasCombatants && activeCombatant && (
                <div className="fixed right-0 top-0 w-80 h-full z-50 bg-slate-900/40 backdrop-blur-xl border-l border-white/10 flex flex-col gap-4 p-6 shadow-2xl animate-in slide-in-from-right duration-500 pointer-events-auto">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <div className="flex flex-col">
                            <h1 className="text-white text-xl font-bold tracking-tight">Initiative</h1>
                            <p className="text-red-400 text-xs font-bold uppercase">Round {round} • Turn {currentTurnIdx + 1}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Active Turn */}
                        <div className="flex flex-col gap-4 px-4 py-4 rounded-xl bg-red-500/20 ring-1 ring-red-500/50 shadow-glow-crimson relative overflow-hidden transition-all duration-700">
                            <div className="flex items-center gap-4">
                                <ResolvedImage className="size-10 rounded-full border-2 border-red-500" src={activeCombatant.avatar} alt={activeCombatant.name} fallback={activeCombatant.name.charAt(0)} />
                                <div className="flex flex-col">
                                    <p className="text-white text-sm font-bold leading-none">{activeCombatant.name}</p>
                                    <p className="text-red-400 text-[10px] font-bold uppercase mt-1">Active Turn</p>
                                </div>
                                <div className="ml-auto text-red-500 material-symbols-outlined">double_arrow</div>
                            </div>

                            {/* Health Indicators */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-red-500/20">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-red-500/40">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                                    <span className="text-xs font-black text-red-100 tracking-normal">{activeCombatant.hp} / {activeCombatant.hpMax} HP</span>
                                </div>
                                
                                {activeCombatant.healthSystem && (
                                    <>
                                        {activeCombatant.healthSystem.type === 'wounds' && (
                                            <div className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40">
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">
                                                    {String(activeCombatant.healthSystem.data.currentLevel || '')}
                                                </span>
                                            </div>
                                        )}
                                        {activeCombatant.healthSystem.type === 'clock' && (
                                            <div className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                                                    Clock {Number(activeCombatant.healthSystem.data.segments || 0)}/{Number(activeCombatant.healthSystem.data.maxSegments || 0)}
                                                </span>
                                            </div>
                                        )}
                                        {activeCombatant.healthSystem.type === 'boxes' && (
                                            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40">
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter mr-1">Stress</span>
                                                {(activeCombatant.healthSystem.data.boxes as Array<{ filled: boolean }> || []).map((b, bi) => (
                                                    <div key={bi} className={`w-1.5 h-1.5 rounded-xs border ${b.filled ? 'bg-orange-500 border-orange-400' : 'border-orange-500/30'}`} />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Queue */}
                        {upcomingCombatants.slice(0, 5).map((combatant, idx) => (
                            <div key={combatant.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5 opacity-80 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <ResolvedImage className="size-10 rounded-full border border-white/10 group-hover:border-white/30 transition-colors" src={combatant.avatar} alt={combatant.name} fallback={combatant.name.charAt(0)} />
                                    <div className="flex flex-col">
                                        <p className="text-slate-200 text-sm font-medium leading-tight">{combatant.name}</p>
                                        <p className="text-slate-500 text-[10px] uppercase tracking-tighter">{idx === 0 ? 'Next' : 'Upcoming'}</p>
                                    </div>

                                    {/* Mini HP Bar for upcoming */}
                                    <div className="ml-auto flex flex-col items-end gap-1">
                                         <span className="text-[9px] font-bold text-slate-400 tracking-tighter">{combatant.hp} HP</span>
                                         <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                             <div 
                                                className={`h-full transition-all ${combatant.hp / combatant.hpMax < 0.3 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                                style={{ width: `${Math.min(100, (combatant.hp / combatant.hpMax) * 100)}%` }} 
                                             />
                                         </div>
                                    </div>
                                </div>
                                
                                {/* Mini health system tags if present */}
                                {combatant.healthSystem && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {combatant.healthSystem.type === 'wounds' && (
                                            <span className="text-[8px] font-black text-amber-500/80 uppercase px-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                                                {String(combatant.healthSystem.data.currentLevel || '')}
                                            </span>
                                        )}
                                        {combatant.healthSystem.type === 'clock' && (
                                            <span className="text-[8px] font-black text-blue-400 uppercase px-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                                                {Number(combatant.healthSystem.data.segments || 0)}/{Number(combatant.healthSystem.data.maxSegments || 0)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Polish Overlays */}
            <div className="fixed inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50"></div>
            <div className="fixed inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]"></div>
        </div>
    );
};

export default PlayerHub;
