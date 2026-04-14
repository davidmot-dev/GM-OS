import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Monitor, 
    Archive, 
    MessageSquare, 
    BookOpen,
    Wifi,
    WifiOff,
    User,
    LogOut,
    Users,
    Globe,
    Package
} from 'lucide-react';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { ResolvedImage } from './ResolvedImage';
import NarrativeClock from '../modules/clock/components/NarrativeClock';
import ClockVisualizer from '../modules/clock/components/ClockVisualizer';
import LobbyOnboarding from './hub/LobbyOnboarding';
import HubCharacterSheet from './hub/HubCharacterSheet';
import { HubMessenger } from './hub/HubMessenger';
import HubNotificationCenter from './hub/HubNotificationCenter';
import { HubClueViewer } from './hub/HubClueViewer';
import { HubNpcViewer } from './hub/HubNpcViewer';
import { HubAtlasViewer } from './hub/HubAtlasViewer';
import { HubItemViewer } from './hub/HubItemViewer';
import { HubArchives } from './hub/HubArchives';
import { HubTrombinoscope } from './hub/HubTrombinoscope';
import { HubAtlas } from './hub/HubAtlas';
import { HubInventory } from './hub/HubInventory';
import { useHubSync } from '../modules/session/hooks/useHubSync';
import PlayerPrivateNotes from '../modules/session/components/PlayerPrivateNotes';
import { type Clue, type Entity, type AtlasMap } from '../modules/session/store/types';
import { type FavoriteEntity } from '../modules/favorite/useFavoriteStore';
import { useDiceStore } from '../stores/useDiceStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useClientStore } from '../stores/useClientStore';
import { usePerformanceControl } from '../hooks/usePerformanceControl';
import { usePerformanceStore } from '../stores/usePerformanceStore';
import { VoiceReactiveAvatar } from './hub/VoiceReactiveAvatar';
import type { DieResult } from '../modules/dice/DiceEngine';

const TabletHub: React.FC = () => {
    const {
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
        combatants,
        currentTurnIdx,
        isCombatProjected,
        isClockProjected,
        clues,
        activeCampaignId,
        activeCampaignName,
        activeCampaignWallpaper,
        sessions,
        isOnboarded,
        characterId,
        transferRequests,
        theaterEntity
    } = useHubSync();

    const { resetIdentity } = useClientStore();
    const performance = usePerformanceControl();
    const { setLowGraphics } = usePerformanceStore();

    const [currentTab, setCurrentTab] = useState<'live' | 'archives' | 'trombinoscope' | 'atlas' | 'inventory'>('live');
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isMessengerOpen, setIsMessengerOpen] = useState(false);
    const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
    const [selectedNpc, setSelectedNpc] = useState<Entity | null>(null);
    const [selectedAtlasMap, setSelectedAtlasMap] = useState<AtlasMap | null>(null);
    const [selectedItem, setSelectedItem] = useState<FavoriteEntity | null>(null);
    const [lastReadMessageTime, setLastReadMessageTime] = useState(() => Date.now());

    const activeHubId = projections['hub'];
    const activeSession = sessions.find(s => s.status === 'active');
    const messages = useSessionOSStore((state) => state.messages);
    const players = useSessionOSStore((state) => state.players);

    // Derived State - Memoized for performance
    const unreadCount = useMemo(() => messages.filter(m => 
        m.timestamp > lastReadMessageTime && 
        (
            (m.fromId === 'GM' && (m.toId === characterId || m.toId === 'all' || !m.toId)) || 
            (m.fromId === characterId && m.toId === 'GM')
        )
    ).length, [messages, lastReadMessageTime, characterId]);
 
    const playerWithChar = useMemo(() => players.find(p => p.characters.some(c => c.id === characterId)), [players, characterId]);
    const characterName = playerWithChar?.characters.find(c => c.id === characterId)?.name || 'Joueur';
    const playerId = playerWithChar?.id;
 
    const visibleCombatants = useMemo(() => combatants.filter(c => 
        c.isPlayer || !c.statuses?.some(s => ['invisible', 'invisibilité', 'caché', 'hidden'].includes(s.name.toLowerCase()))
    ), [combatants]);
 
    const activeCombatant = useMemo(() => visibleCombatants.find((_, idx) => idx === currentTurnIdx) || null, [visibleCombatants, currentTurnIdx]);
    const hasCombatants = isCombatProjected && visibleCombatants.length > 0;
 
    const upcomingCombatants = useMemo(() => visibleCombatants.length > 1 
        ? visibleCombatants.filter(c => c.id !== activeCombatant?.id)
        : [], [visibleCombatants, activeCombatant]);
 
    const liveFavorites = useMemo(() => resolvedFavorites.filter(f => f.type !== 'item'), [resolvedFavorites]);
    const inventoryItems = useMemo(() => resolvedFavorites.filter(f => f.type === 'item'), [resolvedFavorites]);
 
    const isTheaterActive = !!theaterEntity;

    const toggleMessenger = () => {
        setIsMessengerOpen(!isMessengerOpen);
        if (!isMessengerOpen) setLastReadMessageTime(Date.now());
    };

    // Priority: live projection > media library projection > campaign wallpaper
    const backgroundPath = liveImagePath !== undefined
        ? liveImagePath
        : (activeHubId || activeCampaignWallpaper);
    const resolvedBackground = useMediaUrl(backgroundPath || undefined);
    const resolvedCampaignWallpaper = useMediaUrl(activeCampaignWallpaper || undefined);

    useEffect(() => {
        if (activeCampaignWallpaper) {
            console.log(`[TabletHub] Background wallpaper:`, {
                id: activeCampaignWallpaper,
                resolved: resolvedCampaignWallpaper
            });
        }
    }, [activeCampaignWallpaper, resolvedCampaignWallpaper]);

    const rootStyles = {
        '--hub-bg-url': resolvedBackground ? `url('${resolvedBackground}')` : "none",
        '--hub-bg-opacity': resolvedBackground ? 1 : 0,
        '--hub-blur-bg-url': resolvedCampaignWallpaper ? `url("${resolvedCampaignWallpaper}")` : "none",
    } as React.CSSProperties;

    const isWhiteboardActive = projections['hub'] === 'whiteboard'; // Alignement si tableau blanc actif

    return (
        <div className={`min-h-screen bg-app-bg text-app-text font-inter overflow-hidden flex flex-col relative select-none ${performance.isLowGraphics ? '' : 'will-change-transform'}`} style={rootStyles}>
            
            {/* Status & Connection */}
            <div className={`fixed top-4 right-4 z-50 flex items-center gap-2`}>
                <button 
                    onClick={() => setLowGraphics(!performance.isLowGraphics)}
                    className={`p-1.5 px-3 rounded-full backdrop-blur-md border text-[9px] font-black uppercase tracking-widest transition-all ${
                        performance.isLowGraphics
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    }`}
                >
                    {performance.isLowGraphics ? 'Mode Performance' : 'Mode Qualité'}
                </button>
                <div className={`p-1.5 rounded-full backdrop-blur-md border ${
                    status === 'connected' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                }`} title={status === 'connected' ? 'Synchronisé' : 'Déconnecté du MJ'}>
                    {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                </div>
            </div>

            {/* Campaign Header */}
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

            {/* Background Layers */}
            {/* Layer 1 (z-0): Campaign wallpaper — always visible as base atmosphere */}
            {resolvedCampaignWallpaper && (
                <div 
                    className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none brightness-[0.35] grayscale-[20%]"
                    style={{ backgroundImage: `url('${resolvedCampaignWallpaper}')` }}
                />
            )}
            {/* Layer 2 (z-1): Active projection (NPC, image projetée) */}
            <div
                className={`fixed inset-0 z-1 bg-cover bg-center transition-all duration-1000 ease-in-out ${
                    (resolvedFavorites.length > 0 || liveEntity) ? 'brightness-[0.15] grayscale-[30%]' : 'brightness-[0.4] grayscale-[20%]'
                }`}
                style={{
                    backgroundImage: resolvedBackground ? `url('${resolvedBackground}')` : 'none',
                    opacity: resolvedBackground ? 1 : 0,
                }}
            />
            
            {/* Overlay for focus (when an entity is displayed front-and-center) */}
            {(liveFavorites.length > 0 || liveEntity) && (
                <div className={`fixed inset-0 z-5 bg-black/40 pointer-events-none transition-all duration-700 ${isTheaterActive ? 'opacity-0' : 'opacity-100'} ${performance.isLowGraphics ? '' : 'backdrop-blur-[1px]'}`}></div>
            )}

            {/* Main Content Area */}
            <div className="relative z-40 flex h-screen w-full flex-col overflow-hidden pointer-events-none p-4 md:p-8">
                
                {/* Widgets: Clock & Narrative Indicators */}
                <div className="flex flex-col gap-4 mb-6 pl-12 w-full max-w-[460px] pointer-events-auto animate-in fade-in slide-in-from-left duration-700">
                    {isClockProjected && String(mode) !== 'hidden' && (
                        <div className={`bg-app-surface/40 border border-app-border/40 p-2 rounded-2xl shadow-2xl flex items-center justify-center w-full aspect-square max-w-[250px] overflow-hidden ${performance.blurClass}`}>
                            <div className="scale-[0.5] origin-center transform-gpu">
                                <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
                            </div>
                        </div>
                    )}

                    {isClockProjected && tensions.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 w-full h-fit overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                            {tensions.map(clock => (
                                <div key={clock.id} className={`flex items-center gap-3 bg-app-surface/60 border border-app-border/40 rounded-2xl p-3 shadow-xl ${performance.blurClass}`}>
                                    <NarrativeClock clock={clock} theme={theme} size={48} />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <p className={`text-sm font-black truncate w-full ${theme === 'cyberpunk' ? 'text-accent font-mono tracking-wider' : 'text-app-text uppercase tracking-tight'}`}>{clock.name}</p>
                                        <p className="text-[10px] mt-0.5 font-bold text-app-text/60">
                                            {clock.filledSegments} / {clock.totalSegments}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Centered Content Area */}
                <div className={`flex-1 flex items-center justify-center transition-all duration-1000 ${hasCombatants ? 'pr-0 md:pr-72' : ''} md:pl-32 pointer-events-none overflow-hidden`}>
                    {currentTab === 'live' && (liveFavorites.length > 0 || liveEntity || (liveImagePath && liveImagePath !== activeCampaignWallpaper)) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center">
                                {(() => {
                                    const uniqueFavorites = liveFavorites.filter(f => f.id !== theaterEntity?.id && f.id !== liveEntity?.id);
                                    const showLive = liveEntity && theaterEntity?.id !== liveEntity.id;
                                    const showProjection = liveImagePath && liveImagePath !== activeCampaignWallpaper;
                                    const count = uniqueFavorites.length + (showLive ? 1 : 0) + (showProjection ? 1 : 0);
                                    
                                    return (
                                        <div className={`grid grid-cols-1 ${count > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-4xl'} gap-8 md:gap-12 w-full place-items-center`}>
                                            {/* Explicit Image Projection Card */}
                                            {showProjection && (
                                                <div className={`relative bg-app-surface/90 border-2 border-accent/40 rounded-[2rem] p-4 shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] flex flex-col gap-4 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 w-full group overflow-hidden ${performance.heavyBlurClass} ${count > 1 ? 'md:col-span-2' : ''}`}>
                                                    {/* Header Label */}
                                                    <div className="flex items-center justify-between px-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Flux Visuel Actif</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-app-text/30 uppercase font-mono tracking-tighter">Sync: V6.3.0</span>
                                                    </div>

                                                    {/* Image Container */}
                                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-accent/20 bg-black/40">
                                                        <ResolvedImage 
                                                            src={liveImagePath} 
                                                            className="w-full h-full object-contain relative z-10" 
                                                        />
                                                        
                                                        {/* Scanline Effect */}
                                                        <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] opacity-40" />
                                                        
                                                        <div className="absolute inset-0 z-0 opacity-20 blur-2xl">
                                                            <ResolvedImage src={liveImagePath} className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Footer Decorative Line */}
                                                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                                                </div>
                                            )}

                                            {showLive && (
                                        <div key={liveEntity.id} className={`bg-app-surface/90 border-2 border-accent/30 rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)] flex flex-col gap-6 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 w-full hover:border-accent/60 transition-all group ${liveEntity.type === 'Oracle' ? 'md:max-w-2xl' : ''} ${performance.heavyBlurClass} ${performance.shadowClass}`}>
                                            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
                                                <VoiceReactiveAvatar 
                                                    imageUrl={liveEntity.avatar || liveEntity.imageUrl || liveEntity.portraitUrl} 
                                                    name={liveEntity.name} 
                                                    type={liveEntity.type}
                                                    isPerformanceLimited={performance.isLowGraphics}
                                                />

                                                {liveEntity.type !== 'Oracle' && (
                                                    <div className="flex flex-col items-center">
                                                        <h3 className="text-2xl md:text-3xl font-black text-app-text tracking-tighter drop-shadow-lg uppercase bg-gradient-to-b from-app-text to-app-text/60 bg-clip-text text-transparent">{liveEntity.name}</h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="h-px w-6 bg-accent/40"></span>
                                                            <p className="text-accent text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em]">{liveEntity.subtitle || liveEntity.type || 'Personnage'}</p>
                                                            <span className="h-px w-6 bg-accent/40"></span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {liveEntity.type !== 'Oracle' && (
                                                <div className="relative pt-6 border-t border-app-border/20">
                                                    <p className="font-serif text-app-text/80 leading-relaxed italic text-sm md:text-base text-center whitespace-pre-wrap drop-shadow-md line-clamp-[10]">
                                                        {liveEntity.lore || liveEntity.description || "Aucun détail narratif supplémentaire."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {uniqueFavorites.map(fav => (
                                        <div key={fav.id} className={`bg-app-surface/90 border border-app-border/20 rounded-[1.5rem] p-5 md:p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] flex flex-col gap-4 md:gap-5 animate-in fade-in zoom-in duration-700 w-full group ${performance.heavyBlurClass}`}>
                                            <div className="flex flex-col items-center text-center gap-3 md:gap-4">
                                                <div className="size-20 md:size-28 rounded-xl overflow-hidden border border-app-border/40 shadow-xl bg-app-surface group-hover:border-accent transition-all scale-100 group-hover:scale-105 relative">
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110" />
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} alt={fav.name} className="relative z-10 w-full h-full object-contain" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-lg md:text-xl font-black text-app-text tracking-tighter uppercase opacity-90">{fav.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="h-px w-3 bg-app-text/20"></span>
                                                        <p className="text-app-text/60 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em]">{fav.type}</p>
                                                        <span className="h-px w-3 bg-app-text/20"></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative pt-4 border-t border-app-border/20">
                                                <p className="font-serif text-app-text/70 leading-relaxed italic text-xs md:text-sm text-center line-clamp-[10]">
                                                    {fav.lore}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {currentTab === 'archives' && <HubArchives clues={clues} activeCampaignId={activeCampaignId} onSelectClue={setSelectedClue} />}
                    {currentTab === 'trombinoscope' && <HubTrombinoscope npcs={resolvedNpcs} onSelectNpc={setSelectedNpc} />}
                    {currentTab === 'atlas' && <HubAtlas atlasMaps={resolvedAtlasMaps} onSelectMap={setSelectedAtlasMap} />}
                    {currentTab === 'inventory' && (
                        <HubInventory 
                            items={inventoryItems} 
                            structuredItems={playerWithChar?.characters.find(c => c.id === characterId)?.inventoryItems || []}
                            characters={players.flatMap(p => p.characters.map(c => ({ ...c, playerId: p.id }))).filter(c => c.campaignId === activeCampaignId)}
                            transferRequests={transferRequests}
                            currentCharacterId={characterId}
                            onSelectItem={setSelectedItem} 
                        />
                    )}
                </div>
            </div>

            {/* Floatings: Session Summary */}
            {sessionSummary && currentTab === 'live' && (
                <div className={`fixed bottom-28 left-8 z-[60] w-full max-w-2xl bg-app-surface/20 border border-app-border/40 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 pointer-events-auto ${performance.blurClass}`}>
                    <div className="flex items-center gap-5 mb-6 opacity-40">
                        <BookOpen size={20} className="text-app-text" />
                        <h3 className="text-[10px] font-black text-app-text uppercase tracking-[0.4em]">Chroniques de Séance</h3>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar-minimal pr-6 group">
                        <p className="text-xl text-app-text/70 leading-relaxed font-serif italic text-justify group-hover:opacity-100 transition-opacity duration-700">
                            {sessionSummary}
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto" aria-label="Navigation Hub">
                <div className={`bg-app-surface/80 border border-app-border/40 p-1.5 rounded-full shadow-2xl flex items-center gap-1 ${performance.heavyBlurClass}`}>
                    {(
                        [
                            { id: 'live', icon: Monitor, label: 'Direct', color: undefined },
                            { id: 'archives', icon: Archive, label: 'Archives', color: undefined },
                            { id: 'trombinoscope', icon: Users, label: 'PNJ', color: 'indigo' },
                            { id: 'atlas', icon: Globe, label: 'Lieux', color: 'emerald' },
                            { id: 'inventory', icon: Package, label: 'Inventaire', color: 'amber' }
                        ] as const
                    ).map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                currentTab === tab.id 
                                    ? `bg-${tab.color || 'accent'}${tab.color ? '-600 text-white' : ' text-app-bg'}` 
                                    : 'text-app-text/40 hover:text-app-text'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="w-[1px] h-4 bg-app-border/40 mx-1" />
                    <button 
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isInventoryOpen ? 'bg-indigo-600 text-white' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <User size={14} />
                        Fiche
                    </button>
                    <button 
                        onClick={() => setIsNotesOpen(!isNotesOpen)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isNotesOpen ? 'bg-indigo-600 text-white shadow-glow-indigo/40' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <BookOpen size={14} />
                        Notes
                    </button>
                    <button 
                        onClick={toggleMessenger}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isMessengerOpen ? 'bg-indigo-600 text-white shadow-glow-indigo/40' : 'text-app-text/40 hover:text-app-text'}`}
                    >
                        <MessageSquare size={14} />
                        Messages
                        {unreadCount > 0 && !isMessengerOpen && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] items-center justify-center font-bold text-white">{unreadCount}</span>
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => window.confirm('Quitter la session ?') && resetIdentity()}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                    >
                        <LogOut size={14} />
                        Quitter
                    </button>
                </div>
            </nav>

            {/* Combat Overlay */}
            {hasCombatants && activeCombatant && (
                <aside className={`fixed right-4 top-4 w-80 h-[calc(100vh-2rem)] z-50 bg-app-surface/60 border border-app-border/40 flex flex-col gap-4 p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-right pointer-events-auto ${performance.heavyBlurClass}`}>
                    <h2 className="text-app-text text-lg font-bold tracking-tight border-b border-app-border/40 pb-3">Initiative</h2>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex flex-col gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-glow-crimson">
                            <div className="flex items-center gap-3">
                                <ResolvedImage className="size-8 rounded-full border border-rose-500" src={activeCombatant.avatar} alt={activeCombatant.name} />
                                <div className="flex flex-col">
                                    <p className="text-app-text text-xs font-bold leading-none">{activeCombatant.name}</p>
                                    <p className="text-rose-400 text-[8px] font-bold uppercase mt-1">À toi</p>
                                </div>
                            </div>
                        </div>
                        {upcomingCombatants.slice(0, 5).map((c) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-app-surface/20 border border-app-border/10 opacity-60">
                                <ResolvedImage className="size-8 rounded-full border border-app-border/10" src={c.avatar} alt={c.name} />
                                <p className="text-app-text/90 text-xs font-medium truncate">{c.name}</p>
                            </div>
                        ))}
                    </div>
                </aside>
            )}

            {/* Overlays & Modals */}
            {(!isOnboarded || !activeSession) && <LobbyOnboarding />}
            {characterId && (
                <>
                    {isInventoryOpen && <HubCharacterSheet onClose={() => setIsInventoryOpen(false)} />}
                    <AnimatePresence>
                        {isNotesOpen && playerId && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="fixed bottom-24 right-8 z-[150] w-full max-w-sm pointer-events-auto"
                            >
                                <PlayerPrivateNotes playerId={playerId} characterId={characterId} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <HubMessenger isOpen={isMessengerOpen} onClose={() => setIsMessengerOpen(false)} characterId={characterId} characterName={characterName} />
                </>
            )}
            <HubNotificationCenter />
            <HubClueViewer clue={selectedClue} onClose={() => setSelectedClue(null)} />
            <HubNpcViewer npc={selectedNpc} onClose={() => setSelectedNpc(null)} />
            <HubAtlasViewer map={selectedAtlasMap} onClose={() => setSelectedAtlasMap(null)} />
            <HubItemViewer item={selectedItem} onClose={() => setSelectedItem(null)} />

            {/* Dice Animation Overlay */}
            <AnimatePresence>
                {showDice && (
                        <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-[120] flex items-center justify-center p-12 bg-app-surface/40 pointer-events-none ${performance.blurClass}`}
                    >
                        <DiceResultDisplay />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Theater Mode Overlay (Z-200) - Alignement cinématique complet */}
            <AnimatePresence>
                {theaterEntity && (
                    <motion.div 
                        key={`theater-${theaterEntity.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center pointer-events-auto"
                    >
                        {/* Blurred Background */}
                        <div className="absolute inset-0 opacity-40 select-none pointer-events-none">
                            <ResolvedImage 
                                src={theaterEntity.avatar || theaterEntity.imageUrl || theaterEntity.portraitUrl} 
                                className={`w-full h-full object-cover scale-110 ${performance.isLowGraphics ? 'blur-lg' : 'blur-[120px]'}`} 
                            />
                        </div>
                        
                        {/* Focus Image */}
                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 md:p-24 overflow-hidden">
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="relative group max-h-full flex flex-col items-center max-w-6xl"
                            >
                                <ResolvedImage 
                                    src={theaterEntity.avatar || theaterEntity.imageUrl || theaterEntity.portraitUrl} 
                                    alt={theaterEntity.name}
                                    className="max-w-full max-h-[70vh] object-contain shadow-[0_0_150px_rgba(0,0,0,0.9)] rounded-3xl border border-white/10"
                                />
                                
                                {/* Floating Cinematic Caption */}
                                <div className="mt-8 md:mt-16 text-center">
                                    <h3 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                                        {theaterEntity.name}
                                    </h3>
                                    {(theaterEntity.subtitle || theaterEntity.type) && (
                                        <div className="flex items-center justify-center gap-6 mt-4 md:mt-6">
                                            <div className="h-px w-12 md:w-24 bg-accent/60 shadow-glow-accent" />
                                            <p className="text-accent text-xl md:text-2xl font-black uppercase tracking-[0.6em] md:tracking-[0.8em] drop-shadow-md">
                                                {theaterEntity.subtitle || theaterEntity.type}
                                            </p>
                                            <div className="h-px w-12 md:w-24 bg-accent/60 shadow-glow-accent" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Interactive Indicators */}
                        <div className="absolute top-12 right-16 flex flex-col items-end gap-2">
                            <div className="text-[10px] md:text-[12px] font-black text-accent shadow-glow-accent uppercase tracking-[1em] animate-pulse">
                                Theater Focus Active
                            </div>
                        </div>
                        
                        {/* Corner Borders */}
                        <div className="absolute top-8 left-8 size-24 md:size-32 border-t-2 border-l-2 border-accent/30 rounded-tl-3xl pointer-events-none" />
                        <div className="absolute bottom-8 right-8 size-24 md:size-32 border-b-2 border-r-2 border-accent/30 rounded-br-3xl pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Internal sub-component for clarity
const DiceResultDisplay: React.FC = () => {
    const { lastRoll } = useDiceStore();
    const performance = usePerformanceControl();
    if (!lastRoll) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative bg-app-surface/95 border-2 border-accent/40 rounded-[3rem] p-8 md:p-12 shadow-[0_0_80px_rgba(var(--accent-rgb),0.3)] flex flex-col items-center gap-6 max-w-2xl w-full ${performance.isLowGraphics ? 'backdrop-blur-none' : 'backdrop-blur-[40px]'}`}
        >
            {/* Background Decorative Glow */}
            <div className="absolute inset-0 bg-accent/5 rounded-[4rem] pointer-events-none" />
            
            <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-accent/60" />
                    <span className="text-accent text-[10px] font-black uppercase tracking-[0.8em] py-1 px-4 border border-accent/20 rounded-full">
                        Séquence du Destin
                    </span>
                    <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-accent/60" />
                </div>
                <h2 className="text-app-text font-black text-xl md:text-2xl tracking-tight uppercase drop-shadow-2xl opacity-80 mt-1">
                    {lastRoll.title}
                </h2>
            </div>

            {/* Total Result */}
            <div className="relative">
                <div className="absolute inset-0 bg-accentBlur blur-[60px] opacity-20 animate-pulse" />
                <div className="relative text-7xl md:text-8xl leading-none font-black text-app-text drop-shadow-[0_0_40px_rgba(var(--accent-rgb),0.5)] text-center tracking-tighter">
                    {lastRoll.totalDisplay}
                </div>
            </div>

            {/* Individual Dice */}
            <div className="flex flex-wrap gap-5 justify-center mt-6">
                {(lastRoll.rolls as DieResult[]).map((r, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`size-14 md:size-16 flex items-center justify-center rounded-xl text-xl md:text-2xl font-black border-2 transition-all shadow-lg ${
                            r.cssClass ? r.cssClass : 
                            r.isCritMax ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow-emerald/50' :
                            r.isCritMin ? 'bg-rose-600 border-rose-500 text-white shadow-glow-rose/50' :
                            r.isExploded ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-glow-amber/30' :
                            'bg-app-surface/40 border-app-border/30 text-app-text/40'
                        }`}
                    >
                        {r.displayStr || r.val}
                    </motion.div>
                ))}
            </div>

            {/* Final Tag */}
            {lastRoll.tagSuccess !== undefined && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`mt-4 px-10 py-3 rounded-2xl border-2 text-lg md:text-xl font-black uppercase tracking-[0.3em] backdrop-blur-2xl shadow-xl transition-all ${
                        lastRoll.tagSuccess 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-glow-emerald/40' 
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-glow-rose/40'
                    }`}
                >
                    {lastRoll.tagSuccess ? 'Réussite' : 'Échec'}
                </motion.div>
            )}
        </motion.div>
    );
};

export default TabletHub;
