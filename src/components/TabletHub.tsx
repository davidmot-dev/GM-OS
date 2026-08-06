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
    Package,
    Swords,
    ChevronRight
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
import { getDieCssClass } from '../modules/dice/DiceUIUtils';
import { HubInventory } from './hub/HubInventory';
import { HubProjectionCard } from './hub/HubProjectionCard';
import { HubRuleViewer } from './hub/HubRuleViewer';
import { useHubSync } from '../modules/session/hooks/useHubSync';
import PlayerPrivateNotes from '../modules/session/components/PlayerPrivateNotes';
import { type Clue, type Entity, type AtlasMap } from '../modules/session/store/types';
import { type FavoriteEntity } from '../modules/favorite/useFavoriteStore';
import { type Combatant, type StatusEffect } from '../modules/combat/types';
import { type TensionClock } from '../store/useClockStore';
import { useDiceStore } from '../stores/useDiceStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useClientStore } from '../stores/useClientStore';
import { usePerformanceControl } from '../hooks/usePerformanceControl';
import { usePerformanceStore } from '../stores/usePerformanceStore';
import type { DieResult } from '../modules/dice/DiceEngine';

const TabletHub: React.FC = () => {
    const {
        status,
        liveImagePath,
        liveEntity,
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
        sharedRule,
        setSharedRule,
        latency
    } = useHubSync();

    const { resetIdentity } = useClientStore();
    const performance = usePerformanceControl();
    const { setLowGraphics } = usePerformanceStore();

    const [currentTab, setCurrentTab] = useState<'live' | 'archives' | 'trombinoscope' | 'atlas' | 'inventory'>('live');
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isMessengerOpen, setIsMessengerOpen] = useState(false);
    const [isCombatOverlayOpen, setIsCombatOverlayOpen] = useState(false);
    const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
    const [selectedNpc, setSelectedNpc] = useState<Entity | null>(null);
    const [selectedAtlasMap, setSelectedAtlasMap] = useState<AtlasMap | null>(null);
    const [selectedItem, setSelectedItem] = useState<FavoriteEntity | null>(null);
    const [lastReadMessageTime, setLastReadMessageTime] = useState(() => Date.now());
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('GM');
    const [activeToast, setActiveToast] = useState<{ fromName: string; channel: string } | null>(null);

    const activeHubId = projections['hub'];
    const activeSession = sessions.find((s: { status: string }) => s.status === 'active');
    const messages = useSessionOSStore((state) => state.messages);
    const players = useSessionOSStore((state) => state.players);

    // Derived State - Memoized for performance
    const unreadCount = useMemo(() => {
        return messages.filter(m => 
            m.timestamp > lastReadMessageTime && 
            m.fromId !== characterId && 
            (m.toId === characterId || m.toId === 'all' || !m.toId)
        ).length;
    }, [messages, lastReadMessageTime, characterId]);
 
    const playerWithChar = useMemo(() => players.find((p: { characters: { id: string }[] }) => p.characters.some((c: { id: string }) => c.id === characterId)), [players, characterId]);
    const characterName = playerWithChar?.characters.find((c: { id: string }) => c.id === characterId)?.name || 'Joueur';
    const playerId = playerWithChar?.id;
 
    const visibleCombatants = useMemo(() => combatants.filter((c: Combatant) => 
        c.isPlayer || !c.statuses?.some((s: StatusEffect) => ['invisible', 'invisibilité', 'caché', 'hidden'].includes(s.name.toLowerCase()))
    ), [combatants]);
 
    const activeCombatant = useMemo(() => visibleCombatants.find((_: unknown, idx: number) => idx === currentTurnIdx) || null, [visibleCombatants, currentTurnIdx]);
    const hasCombatants = isCombatProjected && visibleCombatants.length > 0;
 
    const upcomingCombatants = useMemo(() => visibleCombatants.length > 1 
        ? visibleCombatants.filter((c: Combatant) => c.id !== activeCombatant?.id)
        : [], [visibleCombatants, activeCombatant]);
 
    const inventoryItems = useMemo(() => resolvedFavorites.filter(f => f.type === 'item'), [resolvedFavorites]);
 
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
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        
        // Only notify for incoming messages
        if (lastMsg.fromId === characterId) return;
        
        // Only notify if relevant to me
        const isForMe = lastMsg.toId === characterId || lastMsg.toId === 'all' || !lastMsg.toId;
        if (!isForMe) return;

        // Check if we are currently looking at the right queue
        const msgQueue = lastMsg.toId === 'all' ? 'all' : (lastMsg.fromId === 'GM' ? 'GM' : lastMsg.fromId);
        const isRightQueue = isMessengerOpen && selectedRecipientId === msgQueue;

        if (!isRightQueue) {
            const channelName = lastMsg.toId === 'all' ? 'Canal Général' : (lastMsg.fromId === 'GM' ? 'Maître du Jeu' : 'Canal Privé');
            setActiveToast({ fromName: lastMsg.fromName, channel: channelName });
            
            // Auto-clear toast
            const timer = setTimeout(() => setActiveToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [messages, characterId, isMessengerOpen, selectedRecipientId]);

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

    return (
        <div className={`min-h-screen bg-app-bg text-app-text font-inter overflow-hidden flex flex-col relative select-none ${performance.isLowGraphics ? '' : 'will-change-transform'}`} style={rootStyles}>
            
            {/* Status & Connection */}
            <div className={`fixed top-4 right-4 z-50 flex items-center gap-2`}>
                {/* Sur un appareil géré automatiquement, le réglage est en lecture
                    seule : la détection réimposerait aussitôt son choix, et un
                    bouton qui revient tout seul vaut moins qu'un simple témoin. */}
                <button
                    onClick={performance.isManagedAutomatically ? undefined : () => setLowGraphics(!performance.isLowGraphics)}
                    disabled={performance.isManagedAutomatically}
                    aria-disabled={performance.isManagedAutomatically}
                    title={performance.isManagedAutomatically
                        ? 'Mode défini automatiquement pour cet appareil'
                        : 'Basculer entre qualité visuelle et fluidité'}
                    className={`p-1.5 px-3 rounded-full backdrop-blur-md border text-[9px] font-black uppercase tracking-widest transition-all ${
                        performance.isManagedAutomatically ? 'cursor-default' : ''
                    } ${
                        performance.isLowGraphics
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    }`}
                >
                    {performance.isLowGraphics ? 'Mode Performance' : 'Mode Qualité'}
                </button>
                <div className={`p-1.5 rounded-full backdrop-blur-md border transition-colors ${
                    status === 'connected' 
                        ? (latency !== null && latency < 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                }`} title={status === 'connected' ? `Synchronisé (${latency}ms)` : 'Déconnecté du MJ'}>
                    {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                </div>
            </div>

            {/* Campaign Header */}
            {activeCampaignName && currentTab === 'live' && (
                <div className="fixed top-12 md:top-6 left-4 md:left-8 z-40 animate-in fade-in slide-in-from-left duration-1000 pointer-events-none flex flex-col">
                    <span className="hidden md:block text-[10px] font-black text-accent/60 uppercase tracking-[0.4em] mb-1">Opération en cours</span>
                    <h1 className="text-xl md:text-3xl font-black text-app-text uppercase tracking-tightest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] opacity-50 md:opacity-100">
                        {activeCampaignName}
                    </h1>
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
            {(resolvedFavorites.length > 0 || liveEntity) && (
                <div className={`fixed inset-0 z-5 bg-black/40 pointer-events-none transition-all duration-700 opacity-100 ${performance.isLowGraphics ? '' : 'backdrop-blur-[1px]'}`}></div>
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
                            {tensions.map((clock: TensionClock) => (
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
                <div className={`flex-1 flex items-center justify-center transition-all duration-1000 pt-16 md:pt-0 ${hasCombatants ? 'pr-0 md:pr-72' : ''} md:pl-32 pointer-events-none overflow-hidden`}>
                    {currentTab === 'live' && (resolvedFavorites.length > 0 || liveEntity || (liveImagePath && liveImagePath !== activeCampaignWallpaper)) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-2 md:p-8 flex flex-col items-center justify-center">
                                {(() => {
                                    // 1. Filter favorites to avoid duplication with liveEntity
                                    const filteredFavorites = resolvedFavorites.filter(fav => 
                                        !liveEntity || (fav.id !== liveEntity.id && fav.name.toLowerCase() !== liveEntity.name.toLowerCase())
                                    );

                                    // 2. Identify all images already shown in entity cards
                                    const shownImages = new Set<string>();
                                    if (liveEntity) {
                                        if (liveEntity.avatar) shownImages.add(liveEntity.avatar);
                                        if (liveEntity.imageUrl) shownImages.add(liveEntity.imageUrl);
                                        if (liveEntity.portraitUrl) shownImages.add(liveEntity.portraitUrl);
                                    }
                                    filteredFavorites.forEach(fav => {
                                        if (fav.imageUrl) shownImages.add(fav.imageUrl);
                                    });

                                    // 3. Decide if we show the raw image card
                                    const isWallpaper = liveImagePath === activeCampaignWallpaper;
                                    const imageAlreadyShownAsEntity = !!liveImagePath && shownImages.has(liveImagePath);
                                    const showImageCard = !!liveImagePath && !isWallpaper && !imageAlreadyShownAsEntity;

                                    const count = filteredFavorites.length + (liveEntity ? 1 : 0) + (showImageCard ? 1 : 0);
                                    
                                    return (
                                        <div className={`grid grid-cols-1 ${count > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-4xl'} gap-8 md:gap-12 w-full place-items-center`}>
                                            {showImageCard && <HubProjectionCard src={liveImagePath!} count={count} />}
                                            {liveEntity && <HubProjectionCard entity={liveEntity} count={count} />}
                                            {filteredFavorites.map(fav => <HubProjectionCard key={fav.id} entity={fav} count={count} />)}
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
            <nav className="fixed bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto w-full max-w-full px-2 overflow-x-auto custom-scrollbar-minimal pb-2 md:pb-0" aria-label="Navigation Hub">
                <div className={`bg-app-surface/90 md:bg-app-surface/80 border border-app-border/40 p-1 md:p-1.5 rounded-full shadow-2xl flex items-center gap-1 w-max mx-auto ${performance.heavyBlurClass}`}>
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
                            className={`flex items-center gap-2 p-3 md:px-6 md:py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                currentTab === tab.id 
                                    ? `bg-${tab.color || 'accent'}${tab.color ? '-600 text-white' : ' text-app-bg'}` 
                                    : 'text-app-text/40 hover:text-app-text'
                            }`}
                            title={tab.label}
                        >
                            <tab.icon className="w-5 h-5 md:w-3.5 md:h-3.5" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                    <div className="w-[1px] h-4 bg-app-border/40 mx-1 md:mx-2" />
                    <button 
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        className={`flex items-center gap-2 p-3 md:px-4 md:py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isInventoryOpen ? 'bg-indigo-600 text-white' : 'text-app-text/40 hover:text-app-text'}`}
                        title="Fiche Personnage"
                    >
                        <User className="w-5 h-5 md:w-3.5 md:h-3.5" />
                        <span className="hidden md:inline">Fiche</span>
                    </button>
                    <button 
                        onClick={() => setIsNotesOpen(!isNotesOpen)}
                        className={`relative flex items-center gap-2 p-3 md:px-4 md:py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isNotesOpen ? 'bg-indigo-600 text-white shadow-glow-indigo/40' : 'text-app-text/40 hover:text-app-text'}`}
                        title="Notes Personnelles"
                    >
                        <BookOpen className="w-5 h-5 md:w-3.5 md:h-3.5" />
                        <span className="hidden md:inline">Notes</span>
                    </button>
                    <button 
                        onClick={toggleMessenger}
                        className={`relative flex items-center gap-2 p-3 md:px-4 md:py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isMessengerOpen ? 'bg-indigo-600 text-white shadow-glow-indigo/40' : 'text-app-text/40 hover:text-app-text'}`}
                        title="Messages"
                    >
                        <MessageSquare className="w-5 h-5 md:w-3.5 md:h-3.5" />
                        <span className="hidden md:inline">Messages</span>
                        {unreadCount > 0 && !isMessengerOpen && (
                            <span className="absolute top-0 right-0 md:-top-1 md:-right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] items-center justify-center font-bold text-white">{unreadCount}</span>
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => window.confirm('Quitter la session ?') && resetIdentity()}
                        className="flex items-center gap-2 p-3 md:px-6 md:py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all ml-1 md:ml-0"
                        title="Quitter"
                    >
                        <LogOut className="w-5 h-5 md:w-3.5 md:h-3.5" />
                        <span className="hidden md:inline">Quitter</span>
                    </button>
                </div>
            </nav>

            {/* Combat Overlay */}
            {hasCombatants && activeCombatant && (
                <>
                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setIsCombatOverlayOpen(!isCombatOverlayOpen)}
                        className={`fixed md:hidden top-4 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all ${isCombatOverlayOpen ? 'bg-rose-600 text-white' : 'bg-app-surface/90 border border-rose-500/30 text-rose-400'}`}
                    >
                        <Swords size={16} />
                        {isCombatOverlayOpen ? 'Fermer' : 'Initiative'}
                    </button>

                    {/* Combat Sidebar */}
                    <aside className={`fixed right-0 md:right-4 top-0 md:top-4 w-full md:w-80 h-screen md:h-[calc(100vh-2rem)] z-50 bg-app-surface/95 md:bg-app-surface/60 border-l md:border border-app-border/40 flex flex-col gap-4 p-6 md:rounded-[2rem] shadow-2xl transition-transform duration-300 pointer-events-auto ${performance.heavyBlurClass} ${isCombatOverlayOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                        <div className="flex items-center justify-between border-b border-app-border/40 pb-3 mt-12 md:mt-0">
                            <h2 className="text-app-text text-lg font-bold tracking-tight">Initiative</h2>
                            <button className="md:hidden p-2 rounded-full text-app-text/40 hover:bg-white/5" onClick={() => setIsCombatOverlayOpen(false)}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
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
                        {upcomingCombatants.slice(0, 5).map((c: Combatant) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-app-surface/20 border border-app-border/10 opacity-60">
                                <ResolvedImage className="size-8 rounded-full border border-app-border/10" src={c.avatar} alt={c.name} />
                                <p className="text-app-text/90 text-xs font-medium truncate">{c.name}</p>
                            </div>
                        ))}
                    </div>
                </aside>
                </>
            )}

            {/* Overlays & Modals */}
            {(!isOnboarded || !activeSession) && <LobbyOnboarding latency={latency} />}
            {characterId && (
                <>
                    {isInventoryOpen && <HubCharacterSheet onClose={() => setIsInventoryOpen(false)} />}
                    <AnimatePresence>
                        {isNotesOpen && playerId && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="fixed bottom-24 right-8 z-[150] w-full max-w-xl pointer-events-auto"
                            >
                                <PlayerPrivateNotes playerId={playerId} characterId={characterId} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <HubMessenger 
                        isOpen={isMessengerOpen} 
                        onClose={() => setIsMessengerOpen(false)} 
                        characterId={characterId} 
                        characterName={characterName} 
                        selectedRecipientId={selectedRecipientId}
                        onRecipientChange={(id) => {
                            setSelectedRecipientId(id);
                            setLastReadMessageTime(Date.now());
                        }}
                    />
                </>
            )}
            
            <AnimatePresence>
                {activeToast && (
                    <MessageToast 
                        fromName={activeToast.fromName} 
                        channel={activeToast.channel} 
                        onClick={() => {
                            setIsMessengerOpen(true);
                            setLastReadMessageTime(Date.now());
                            setActiveToast(null);
                        }}
                    />
                )}
            </AnimatePresence>
            <HubNotificationCenter />
            <HubClueViewer clue={selectedClue} onClose={() => setSelectedClue(null)} />
            <HubNpcViewer npc={selectedNpc} onClose={() => setSelectedNpc(null)} />
            <HubAtlasViewer map={selectedAtlasMap} onClose={() => setSelectedAtlasMap(null)} />
            <HubItemViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
            <HubRuleViewer rule={sharedRule} onClose={() => setSharedRule(null)} />

            {/* Dice Animation Overlay */}
            <AnimatePresence onExitComplete={() => {}}>
                {showDice && (
                        <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onAnimationStart={() => {
                            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                        }}
                        className={`fixed inset-0 z-[120] flex items-center justify-center p-12 bg-app-surface/40 pointer-events-none ${performance.blurClass}`}
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
                        className={`size-14 md:size-16 flex flex-col items-center justify-center rounded-xl text-xl md:text-2xl font-black border-2 transition-all shadow-lg relative ${getDieCssClass(r)}`}
                    >
                        {r.displayStr || r.val}
                        {r.source === 'gear' && <span className="absolute bottom-1 right-1.5 text-[8px] opacity-40 font-bold uppercase">G</span>}
                        {r.source === 'base' && <span className="absolute bottom-1 right-1.5 text-[8px] opacity-40 font-bold uppercase">B</span>}
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

const MessageToast: React.FC<{ fromName: string; channel: string; onClick: () => void }> = ({ fromName, channel, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.9 }}
            onClick={onClick}
            className="fixed bottom-24 left-1/2 z-[200] cursor-pointer"
        >
            <div className="bg-indigo-600/90 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center gap-4 hover:brightness-110 transition-all active:scale-95 group">
                <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} className="text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Nouveau Message</span>
                    <p className="text-sm font-bold text-white leading-tight">
                        {fromName} <span className="opacity-60 font-medium ml-1">({channel})</span>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default TabletHub;
