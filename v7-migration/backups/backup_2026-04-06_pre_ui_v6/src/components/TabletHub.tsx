import React, { useState } from 'react';
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
import { type Clue, type Entity, type AtlasMap } from '../modules/session/store/types';
import { type FavoriteEntity } from '../modules/favorite/useFavoriteStore';
import { useDiceStore } from '../stores/useDiceStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useClientStore } from '../stores/useClientStore';
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
        characterId
    } = useHubSync();

    const { resetIdentity } = useClientStore();

    const [currentTab, setCurrentTab] = useState<'live' | 'archives' | 'trombinoscope' | 'atlas' | 'inventory'>('live');
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
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

    // Derived State
    const unreadCount = messages.filter(m => 
        m.timestamp > lastReadMessageTime && 
        (
            (m.fromId === 'GM' && (m.toId === characterId || m.toId === 'all' || !m.toId)) || 
            (m.fromId === characterId && m.toId === 'GM')
        )
    ).length;

    const characterName = players
        .flatMap(p => p.characters)
        .find(c => c.id === characterId)?.name || 'Joueur';

    const visibleCombatants = combatants.filter(c => 
        c.isPlayer || !c.statuses?.some(s => ['invisible', 'invisibilité', 'caché', 'hidden'].includes(s.name.toLowerCase()))
    );

    const activeCombatant = visibleCombatants.find((_, idx) => idx === currentTurnIdx) || null;
    const hasCombatants = isCombatProjected && visibleCombatants.length > 0;

    const upcomingCombatants = visibleCombatants.length > 1 
        ? visibleCombatants.filter(c => c.id !== activeCombatant?.id)
        : [];

    // Items (type === 'item') are inventory-only and must NOT appear in the live dashboard
    const liveFavorites = resolvedFavorites.filter(f => f.type !== 'item');
    const inventoryItems = resolvedFavorites.filter(f => f.type === 'item');

    const toggleMessenger = () => {
        setIsMessengerOpen(!isMessengerOpen);
        if (!isMessengerOpen) setLastReadMessageTime(Date.now());
    };

    // Priority: live projection > media library projection > campaign wallpaper
    const backgroundPath = liveImagePath !== undefined
        ? liveImagePath
        : (activeHubId || activeCampaignWallpaper);
    const resolvedBackground = useMediaUrl(backgroundPath || undefined);

    const rootStyles = {
        '--hub-bg-url': resolvedBackground ? `url('${resolvedBackground}')` : "none",
        '--hub-bg-opacity': resolvedBackground ? 1 : 0,
        '--hub-blur-bg-url': activeCampaignWallpaper ? `url("${activeCampaignWallpaper}")` : "none",
        '--voice-scale': voiceLevel > 0.05 ? 1 + (voiceLevel * 0.15) : 1, 
        '--voice-glow': voiceLevel > 0.05 ? `0 0 ${voiceLevel * 30}px rgba(6, 182, 212, ${voiceLevel})` : '0 0 0 transparent' 
    } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-app-bg text-app-text font-inter overflow-hidden flex flex-col relative select-none" style={rootStyles}>
            
            {/* Status & Connection */}
            <div className={`fixed top-4 right-4 z-50 p-1.5 rounded-full backdrop-blur-md border ${
                status === 'connected' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`} title={status === 'connected' ? 'Synchronisé' : 'Déconnecté du MJ'}>
                {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
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
            {activeCampaignWallpaper && isOnboarded && (
                <div 
                    className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none brightness-[0.35] grayscale-[20%]"
                    style={{ backgroundImage: `url('${activeCampaignWallpaper}')` }}
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
            {(resolvedFavorites.length > 0 || liveEntity) && (
                <div className="fixed inset-0 z-5 bg-black/40 backdrop-blur-[1px] pointer-events-none transition-all duration-700"></div>
            )}

            {/* Main Content Area */}
            <div className="relative z-40 flex h-screen w-full flex-col overflow-hidden pointer-events-none p-4 md:p-8">
                
                {/* Widgets: Clock & Narrative Indicators */}
                <div className="flex flex-col gap-4 mb-6 pl-12 w-full max-w-[460px] pointer-events-auto animate-in fade-in slide-in-from-left duration-700">
                    {isClockProjected && String(mode) !== 'hidden' && (
                        <div className="backdrop-blur-md bg-app-surface/40 border border-app-border/40 p-2 rounded-2xl shadow-2xl flex items-center justify-center w-full aspect-square max-w-[250px] overflow-hidden">
                            <div className="scale-[0.5] origin-center transform-gpu">
                                <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
                            </div>
                        </div>
                    )}

                    {isClockProjected && tensions.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 w-full h-fit overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                            {tensions.map(clock => (
                                <div key={clock.id} className="flex items-center gap-3 bg-app-surface/60 backdrop-blur-xl border border-app-border/40 rounded-2xl p-3 shadow-xl">
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
                <div className={`flex-1 flex items-center justify-center transition-all duration-1000 ${hasCombatants ? 'pr-0 md:pr-72' : ''} pointer-events-none overflow-hidden`}>
                    {currentTab === 'live' && (liveFavorites.length > 0 || liveEntity) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-2 flex flex-col items-center justify-center">
                                <div className={`grid grid-cols-1 ${(liveFavorites.length + (liveEntity ? 1 : 0)) > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-md'} gap-4 md:gap-8 w-full place-items-center`}>
                                    {liveEntity && (
                                        <div className={`bg-app-surface/90 backdrop-blur-3xl border-2 border-accent/30 rounded-3xl p-5 md:p-6 shadow-glow-accent flex flex-col gap-4 animate-in fade-in zoom-in duration-1000 w-full`}>
                                            <div className="flex flex-col items-center text-center gap-4">
                                                <div className="size-28 md:size-40 rounded-2xl overflow-hidden border-2 border-accent/20 bg-app-surface relative [transform:scale(var(--voice-scale))] [box-shadow:var(--voice-glow)]">
                                                    <ResolvedImage src={liveEntity.avatar || liveEntity.imageUrl} alt={liveEntity.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <h3 className="text-xl md:text-2xl font-black text-app-text tracking-tighter uppercase">{liveEntity.name}</h3>
                                                    <p className="text-accent text-[9px] font-black uppercase tracking-[0.3em] mt-1">{liveEntity.subtitle || liveEntity.type}</p>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-app-border/40">
                                                <p className="font-serif text-app-text/80 leading-relaxed italic text-xs md:text-sm text-center line-clamp-6">
                                                    {liveEntity.lore || liveEntity.description || "Détails confidentiels."}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {liveFavorites.map(fav => (
                                        <div key={fav.id} className="bg-app-surface/80 backdrop-blur-2xl border border-app-border/40 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-3 md:gap-4 animate-in fade-in zoom-in duration-700 w-full">
                                            <div className="flex flex-col items-center text-center gap-3">
                                                <div className="size-16 md:size-20 rounded-xl overflow-hidden border border-app-border/40 bg-app-surface">
                                                    <ResolvedImage src={fav.imageUrl || fav.tokenUrl} alt={fav.name} className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base md:text-lg font-black text-app-text tracking-tighter uppercase">{fav.name}</h3>
                                                    <p className="text-app-text/40 text-[8px] font-black uppercase tracking-[0.3em]">{fav.type}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-app-border/20">
                                                <p className="font-serif text-app-text/60 leading-relaxed italic text-[10px] md:text-xs text-center line-clamp-4">{fav.lore}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'archives' && <HubArchives clues={clues} activeCampaignId={activeCampaignId} onSelectClue={setSelectedClue} />}
                    {currentTab === 'trombinoscope' && <HubTrombinoscope npcs={resolvedNpcs} onSelectNpc={setSelectedNpc} />}
                    {currentTab === 'atlas' && <HubAtlas atlasMaps={resolvedAtlasMaps} onSelectMap={setSelectedAtlasMap} />}
                    {currentTab === 'inventory' && <HubInventory items={inventoryItems} onSelectItem={setSelectedItem} />}
                </div>
            </div>

            {/* Floatings: Session Summary */}
            {sessionSummary && currentTab === 'live' && (
                <div className="fixed bottom-28 left-8 z-[60] w-full max-w-2xl bg-app-surface/20 backdrop-blur-md border border-app-border/40 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 pointer-events-auto">
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
                <div className="bg-app-surface/80 backdrop-blur-2xl border border-app-border/40 p-1.5 rounded-full shadow-2xl flex items-center gap-1">
                    {(
                        [
                            { id: 'live', icon: Monitor, label: 'Direct', color: undefined },
                            { id: 'archives', icon: Archive, label: 'Archives', color: undefined },
                            { id: 'trombinoscope', icon: Users, label: 'PNJ', color: 'indigo' },
                            { id: 'atlas', icon: Globe, label: 'Lieux', color: 'emerald' },
                            { id: 'inventory', icon: Package, label: 'Sac', color: 'amber' }
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
                        onClick={toggleMessenger}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isMessengerOpen ? 'bg-indigo-600 text-white' : 'text-app-text/40 hover:text-app-text'}`}
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
                <aside className="fixed right-4 top-4 w-80 h-[calc(100vh-2rem)] z-50 bg-app-surface/60 backdrop-blur-2xl border border-app-border/40 flex flex-col gap-4 p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-right pointer-events-auto">
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
                        className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-app-surface/40 backdrop-blur-md"
                    >
                        <DiceResultDisplay />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Internal sub-component for clarity
const DiceResultDisplay: React.FC = () => {
    const { lastRoll } = useDiceStore();
    if (!lastRoll) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-app-surface/95 backdrop-blur-[40px] border-2 border-accent/40 rounded-[3rem] p-8 md:p-12 shadow-[0_0_80px_rgba(var(--accent-rgb),0.3)] flex flex-col items-center gap-6 max-w-2xl w-full"
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
