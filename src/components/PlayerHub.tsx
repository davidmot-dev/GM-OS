import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Modules & Stores
import { useClockStore } from '../store/useClockStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { useFavoriteStore } from '../modules/favorite/useFavoriteStore';
import { useMapStore } from '../modules/map/useMapStore';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';
import { useImageStore } from '../modules/image/useImageStore';
import { useDiceStore } from '../stores/useDiceStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';


// Components
import PlayerMapCanvas from '../modules/map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../modules/whiteboard/components/PlayerDrawingCanvas';
import PlayerDiceBox3D from '../modules/dice/DiceBox3D';
import { useMediaUrl } from '../hooks/useMediaUrl';

// Sub-components (Modularized)
import { useHubSync } from '../modules/session/hooks/useHubSync';
import { HubClockWidgets } from './hub/HubClockWidgets';
import { HubProjectionCard } from './hub/HubProjectionCard';
import { HubDiceDisplay } from './hub/HubDiceDisplay';
import { HubCombatTracker } from './hub/HubCombatTracker';

const PlayerHub: React.FC = React.memo(() => {
    // 1. Unified Synchronization Hook (Bridge Isolation)
    const hubSync = useHubSync();
    const {
        liveImagePath, liveEntity, showDice, resolvedFavorites,
        isClockProjected, timestamp, mode, theme, tensions,
        combatants, currentTurnIdx, round, isCombatProjected,
        activeCampaignWallpaper, voiceLevel
    } = hubSync;

    // 2. Secondary Local States & Stores - Selective selectors
    const projectionTarget = useMapStore(s => s.projectionTarget);
    const projectedMapUrl = useMapStore(s => s.projectedMapUrl);
    const whiteboardTarget = useWhiteboardStore(s => s.projectionTarget);
    const backgroundMode = useWhiteboardStore(s => s.backgroundMode);
    const lastRoll = useDiceStore(s => s.lastRoll);
    const enable3D = useDiceStore(s => s.enable3D);
    const activeHubId = hubSync.projections['hub'];

    // 3. Asset Resolution
    const backgroundPath = liveImagePath !== undefined ? liveImagePath : (activeHubId || activeCampaignWallpaper);
    const resolvedBackground = useMediaUrl(backgroundPath || undefined);
    
    // 4. Feature Activators
    const isMapActive = !!(projectedMapUrl && projectionTarget === 'hub');
    const isWhiteboardActive = whiteboardTarget === 'hub';
    const hasCombatants = isCombatProjected && combatants.length > 0;

    // 5. Initial Persist Rehydration & Storage Sync (Cross-process)
    useEffect(() => {
        const rehydrateAll = async () => {
            console.log('[PlayerHub] Rehydrating stores for session start...');
            await Promise.all([
                useClockStore.persist.rehydrate(),
                useCombatStore.persist.rehydrate(),
                useFavoriteStore.persist.rehydrate(),
                useMapStore.persist.rehydrate(),
                useWhiteboardStore.persist.rehydrate(),
                useImageStore.persist.rehydrate(),
                useDiceStore.persist.rehydrate(),
                useSessionOSStore.persist.rehydrate()
            ]);
        };
        rehydrateAll();
    }, []);

    return (
        <div className="bg-app-bg text-app-text font-cinematic selection:bg-accent/30 w-full h-screen overflow-hidden flex flex-col relative select-none cursor-default">
            
            {/* LAYER 0: MAP / BACKGROUND */}
            <div className="fixed inset-0 z-0">
                {isMapActive ? (
                    <PlayerMapCanvas 
                        onMapClick={(x, y) => {
                            window.dispatchEvent(new CustomEvent('map:ping', { detail: { x, y, color: '#06b6d4' } }));
                            useMapStore.getState().addPing(x, y, '#06b6d4');
                        }}
                    />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={resolvedBackground || 'none'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-cover bg-center grayscale-[20%] transition-all duration-1000"
                            style={{
                                backgroundImage: resolvedBackground ? `url('${resolvedBackground}')` : "none",
                                filter: `brightness(${(resolvedFavorites.length > 0 || liveEntity) ? 0.15 : 0.4}) grayscale(20%)`
                            }}
                        />
                    </AnimatePresence>
                )}
                {!resolvedBackground && !isMapActive && <div className="absolute inset-0 bg-app-bg" />}
            </div>

            {/* LAYER 30: WHITEBOARD */}
            <div className={`fixed inset-0 z-30 pointer-events-none transition-colors duration-500 ${
                isWhiteboardActive && backgroundMode === 'light' ? 'bg-white' : 
                isWhiteboardActive && backgroundMode === 'dark' ? 'bg-app-bg' : 'bg-transparent'
            }`}>
                <PlayerDrawingCanvas />
            </div>

            {/* LAYER 40: CONTENT & UI */}
            <div className={`relative z-40 flex h-screen w-full flex-col overflow-hidden pointer-events-none transition-all duration-1000 blur-0 opacity-100 scale-100`}>
                
                {/* Clock & Tension Widgets */}
                <HubClockWidgets 
                    isClockProjected={isClockProjected}
                    timestamp={timestamp}
                    mode={mode}
                    theme={theme}
                    tensions={tensions}
                />

                {/* Main Projections Grid */}
                <div className={`flex-1 flex items-center justify-center p-4 md:p-12 transition-all duration-1000 ${hasCombatants ? 'pr-80' : ''}`}>
                    {(resolvedFavorites.length > 0 || liveEntity || (liveImagePath && liveImagePath !== activeCampaignWallpaper)) && (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto">
                            <div className="w-full max-h-full overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center justify-center">
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
                                        <div className={`grid grid-cols-1 ${count > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-5xl'} gap-8 md:gap-12 w-full place-items-center`}>
                                            {showImageCard && <HubProjectionCard src={liveImagePath!} count={count} />}
                                            {liveEntity && <HubProjectionCard entity={liveEntity} count={count} />}
                                            {filteredFavorites.map(fav => <HubProjectionCard key={fav.id} entity={fav} count={count} />)}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Bar Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
                    {resolvedFavorites.length > 0 && (
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/40 animate-pulse">Knowledge Base Synchronized</p>
                    )}
                </div>
            </div>

            {/* LAYER 50: COMBAT SIDEBAR */}
            {/* Le suivi de combat obéit à la bascule de projection du MJ, comme
                sur la tablette (TabletHub, même condition). Rendu sans garde, il
                restait affiché quelle que soit la valeur d'`isCombatProjected` :
                le bouton de projection du combat semblait sans effet sur le Hub
                alors qu'il fonctionnait sur la tablette. `hasCombatants` ne
                servait ici qu'à une classe de mise en page. */}
            {hasCombatants && (
                <HubCombatTracker
                    combatants={combatants}
                    currentTurnIdx={currentTurnIdx}
                    round={round}
                />
            )}

            {/* LAYER 60: DICE 3D (Behind results) */}
            <div className="fixed inset-0 z-[60] pointer-events-none">
                <PlayerDiceBox3D active={showDice && enable3D} lastRoll={lastRoll} />
            </div>

            {/* LAYER 70: DICE 2D RESULTS */}
            <HubDiceDisplay 
                showDice={showDice} 
                lastRoll={lastRoll} 
                enable3D={enable3D} 
            />

            {/* THEMATIC OVERLAYS (Grain, Vignette) */}
            <div className={`fixed inset-0 pointer-events-none z-[150] shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50 transition-opacity duration-1000 opacity-40`} />
            <div className="fixed inset-0 pointer-events-none z-[150] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
            
            {/* Global Voice Reactive Signal (Subtle bottom bar) */}
            <div className="fixed bottom-0 left-0 right-0 h-1 z-[200] overflow-hidden pointer-events-none opacity-20">
                 <div 
                    className="h-full bg-accent transition-all duration-75"
                    style={{ 
                        width: `${Math.min(100, voiceLevel * 100)}%`,
                        boxShadow: `0 0 ${voiceLevel * 40}px var(--color-accent)` 
                    }}
                 />
            </div>
        </div>
    );
});

export default PlayerHub;
