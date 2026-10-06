import React, { useState, useMemo, useEffect } from 'react';
import { EtiquetteDuDegre } from '../modules/dice/EtiquetteDuDegre';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Monitor, 
    Archive, 
    MessageSquare, 
    Wifi,
    WifiOff,
    Users,
    Globe,
    Package,
    Swords,
    Layers
} from 'lucide-react';
import { useFermetureParEchap } from '../hooks/useFermetureParEchap';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { ResolvedImage } from './ResolvedImage';
import { Bouton, EnTeteDeModule, Etiquette, Panneau } from './socle';
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
import HubMainDeCartes from './hub/HubMainDeCartes';
import { HubDirect } from './hub/HubDirect';
import { HubHorlogesPubliques } from './hub/HubHorlogesPubliques';
import { HubRuleViewer } from './hub/HubRuleViewer';
import { useHubSync } from '../modules/session/hooks/useHubSync';
import PlayerPrivateNotes from '../modules/session/components/PlayerPrivateNotes';
import { type Clue, type Entity, type AtlasMap } from '../modules/session/store/types';
import { type FavoriteEntity } from '../modules/favorite/useFavoriteStore';
import { type Combatant, type StatusEffect } from '../modules/combat/types';
import { useDiceStore } from '../stores/useDiceStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useClientStore } from '../stores/useClientStore';
import { usePerformanceControl } from '../hooks/usePerformanceControl';
import { usePerformanceStore } from '../stores/usePerformanceStore';
import type { DieResult } from '../modules/dice/DiceEngine';
import FondProjete from './hub/FondProjete';
import { useFonduCroise, FONDU_COTE_JOUEURS_MS } from '../modules/image/useFonduCroise';

const TabletHub: React.FC = () => {
    const {
        status,
        liveImagePath,
        liveMediaEstUneVideo, liveVideoBoucle,
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

    const [currentTab, setCurrentTab] = useState<'live' | 'archives' | 'trombinoscope' | 'atlas' | 'inventory' | 'cartes'>('live');
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
 
    /**
     * **Les cartes qu'on me propose, comptées pour la pastille de l'onglet.**
     *
     * Les propositions étaient dans la colonne de gauche, donc toujours sous
     * les yeux. Les ranger dans un onglet les cache : sans ce compte, un joueur
     * à qui l'on tend une carte ne l'apprendrait qu'en ouvrant l'onglet par
     * hasard, et le donneur attendrait une réponse qui ne vient pas. *Déplacer
     * une décision en attente derrière un onglet oblige à la signaler devant.*
     */
    const demandesDeCarte = useSessionOSStore((state) => state.demandesDeCarte);
    const cartesProposees = useMemo(
        () => (demandesDeCarte ?? []).filter(
            (d: { versQui: string | null; statut: string }) =>
                d.versQui === characterId && d.statut === 'en-attente').length,
        [demandesDeCarte, characterId]
    );

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

    /*
      **Le fondu entre deux images, comme sur le Player Hub.** Il ne commence
      qu'une fois l'image **décodée** — sans quoi il s'animerait sur un cadre
      vide, et la tablette montrerait un temps mort puis un saut.
    */
    const { entrante: fondEntrant, sortante: fondSortant } =
        useFonduCroise(liveMediaEstUneVideo ? null : resolvedBackground, FONDU_COTE_JOUEURS_MS);
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

    const estDirect = currentTab === 'live';
    const commandesDeConnexion = (
        <div className={'flex flex-wrap items-center gap-2'}>
                {/* Sur un appareil géré automatiquement, le réglage est en lecture
                    seule : la détection réimposerait aussitôt son choix, et un
                    bouton qui revient tout seul vaut moins qu'un simple témoin. */}
                <Bouton habillage="libre" cibleTactile
                    onClick={performance.isManagedAutomatically ? undefined : () => setLowGraphics(!performance.isLowGraphics)}
                    disabled={performance.isManagedAutomatically}
                    aria-disabled={performance.isManagedAutomatically}
                    title={performance.isManagedAutomatically
                        ? 'Mode défini automatiquement pour cet appareil'
                        : 'Basculer entre qualité visuelle et fluidité'}
                    className={`p-1.5 px-3 rounded-full backdrop-blur-md border text-ui-9 font-black uppercase tracking-widest transition-all ${
                        performance.isManagedAutomatically ? 'cursor-default' : ''
                    } ${
                        performance.isLowGraphics
                            ? 'bg-etat-alerte/20 text-etat-alerte border-etat-alerte/30'
                            : 'bg-etat-info/20 text-etat-info border-etat-info/30'
                    }`}
                >
                    {performance.isLowGraphics ? 'Mode Performance' : 'Mode Qualité'}
                </Bouton>
                <div className={`flex items-center gap-2 p-1.5 rounded-full backdrop-blur-md border transition-colors ${
                    status === 'connected' 
                        ? (latency !== null && latency < 100 ? 'bg-etat-succes/10 text-etat-succes border-etat-succes/20 shadow-[0_0_10px_color-mix(in_srgb,var(--etat-succes)_20%,transparent)]' : 'bg-etat-alerte/10 text-etat-alerte border-etat-alerte/20')
                        : 'bg-etat-danger/10 text-etat-danger border-etat-danger/20 animate-pulse'
                }`} title={status === 'connected' ? `Synchronisé (${latency}ms)` : 'Déconnecté du MJ'}>
                    {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {<span className="text-[12px] font-bold">{status === 'connected' ? 'Connecté' : 'Déconnecté'}</span>}
                </div>
                {hasCombatants && <Bouton cibleTactile onClick={() => setIsCombatOverlayOpen(!isCombatOverlayOpen)} aria-pressed={isCombatOverlayOpen} icone={<Swords size={16} />}>Initiative</Bouton>}
            </div>
    );

    useFermetureParEchap(isNotesOpen, () => setIsNotesOpen(false), 'Notes joueur');
    useFermetureParEchap(isCombatOverlayOpen, () => setIsCombatOverlayOpen(false), 'Initiative tablette');

    return (
        <div className={`h-dvh [--hub-navigation-hauteur:148px] lg:[--hub-navigation-hauteur:100px] bg-app-bg text-app-text font-inter overflow-hidden flex flex-col relative select-none ${performance.isLowGraphics ? '' : 'will-change-transform'}`} style={rootStyles}>
            {/* Background Layers */}
            {/* Layer 1 (z-0): Campaign wallpaper — always visible as base atmosphere */}
            {resolvedCampaignWallpaper && (
                <div 
                    className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none brightness-[0.35] grayscale-[20%]"
                    style={{ backgroundImage: `url('${resolvedCampaignWallpaper}')` }}
                />
            )}
            {/* Layer 2 (z-1): Active projection (NPC, image ou VIDÉO projetée) */}
            {/*
              ⛔ **Une `background-image` ne peut pas jouer un film.** Même défaut
              que sur le Player Hub, corrigé le 2026-09-05 — voir [[FondProjete]].

              ⚠️ **Sans le son, ici.** L'écran de la table est unique ; les
              tablettes sont cinq, et cinq bandes-son décalées par le réseau ne
              font pas une ambiance. Le son de la table appartient aux enceintes
              de la table.
            */}
            <div
                className={`fixed inset-0 z-1 transition-all duration-1000 ease-in-out ${
                    (resolvedFavorites.length > 0 || liveEntity) ? 'brightness-[0.15] grayscale-[30%]' : 'brightness-[0.4] grayscale-[20%]'
                }`}
            >
                {/*
                  ⛔ **La tablette remplaçait l'image d'un coup — corrigé le
                  2026-09-14.**

                  Elle était la dernière des trois surfaces sans fondu : le
                  projecteur et le Player Hub en ont un depuis la veille, elle
                  gardait une coupe franche. Ça ne se voyait pas tant que le
                  meneur projetait une image toutes les deux minutes ; un
                  diaporama le montre quatre-vingt fois par heure.

                  Même mécanique que le Hub, **même durée** (décision de David) :
                  les tablettes reflètent l'écran de la table.

                  ⚠️ L'opacité du cadre a disparu avec le correctif : ce sont les
                  couches qui portent le fondu. *La garder aurait fait fondre
                  deux fois la même image, à deux rythmes.*
                */}

                {/* Un film ne se croise pas : il garde la voie directe. */}
                {resolvedBackground && liveMediaEstUneVideo && (
                    <FondProjete
                        url={resolvedBackground}
                        estUneVideo
                        boucler={liveVideoBoucle}
                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                    />
                )}

                {/*
                  La couche du dessous, à pleine opacité le temps d'être
                  recouverte — sauf quand il n'y a plus rien à montrer, où c'est
                  elle qui porte le fondu de sortie.

                  `z-0` explicite : une couche qui n'anime rien ne crée aucun
                  contexte d'empilement, et l'ordre finirait par dépendre du
                  hasard. Le projecteur a payé pour cette règle.
                */}
                {!liveMediaEstUneVideo && fondSortant && fondSortant !== fondEntrant && (
                    <FondProjete
                        key={`sortant-${fondSortant}`}
                        url={fondSortant}
                        estUneVideo={false}
                        className="absolute inset-0 z-0 w-full h-full bg-cover bg-center"
                        style={fondEntrant ? undefined : {
                            animation: `gmos-fondu-sortant ${FONDU_COTE_JOUEURS_MS}ms ease-in-out forwards`,
                        }}
                    />
                )}

                {!liveMediaEstUneVideo && fondEntrant && (
                    <FondProjete
                        key={`entrant-${fondEntrant}`}
                        url={fondEntrant}
                        estUneVideo={false}
                        className="absolute inset-0 z-10 w-full h-full bg-cover bg-center"
                        style={{ animation: `gmos-fondu-entrant ${FONDU_COTE_JOUEURS_MS}ms ease-in-out` }}
                    />
                )}
            </div>
            
            {/* Overlay for focus (when an entity is displayed front-and-center) */}
            {(resolvedFavorites.length > 0 || liveEntity) && (
                <div className={`fixed inset-0 z-5 bg-app-bg/40 pointer-events-none transition-all duration-700 opacity-100 ${performance.isLowGraphics ? '' : 'backdrop-blur-[1px]'}`}></div>
            )}

            {estDirect ? (
                <HubDirect {...{ activeCampaignName, activeCampaignWallpaper, liveImagePath, liveMediaEstUneVideo, liveEntity, resolvedFavorites, isClockProjected, timestamp, mode, theme, tensions, sessionSummary }} commandes={commandesDeConnexion} />
            ) : currentTab === 'inventory' ? (
                <div className="relative z-40 min-h-0 flex-1 overflow-hidden">
                    <HubInventory
                        items={inventoryItems}
                        structuredItems={playerWithChar?.characters.find(c => c.id === characterId)?.inventoryItems || []}
                        characters={players.flatMap(p => p.characters.map(c => ({ ...c, playerId: p.id }))).filter(c => c.campaignId === activeCampaignId)}
                        transferRequests={transferRequests}
                        currentCharacterId={characterId ?? undefined}
                        onSelectItem={setSelectedItem}
                        commandes={commandesDeConnexion}
                        informations={<HubHorlogesPubliques {...{ isClockProjected, timestamp, mode, theme, tensions }} />}
                    />
                </div>
            ) : currentTab === 'cartes' ? (
                <div className="relative z-40 min-h-0 flex-1 overflow-hidden">
                    <HubMainDeCartes characterId={characterId} commandes={commandesDeConnexion}
                        informations={<HubHorlogesPubliques {...{ isClockProjected, timestamp, mode, theme, tensions }} />} />
                </div>
            ) : (
            <div className="relative z-40 min-h-0 flex-1 overflow-hidden">
                {currentTab === 'archives' && <HubArchives clues={clues} activeCampaignId={activeCampaignId} onSelectClue={setSelectedClue} commandes={commandesDeConnexion}
                    informations={<HubHorlogesPubliques {...{ isClockProjected, timestamp, mode, theme, tensions }} />} />}
                {currentTab === 'trombinoscope' && <HubTrombinoscope npcs={resolvedNpcs} onSelectNpc={setSelectedNpc} commandes={commandesDeConnexion}
                    informations={<HubHorlogesPubliques {...{ isClockProjected, timestamp, mode, theme, tensions }} />} />}
                {currentTab === 'atlas' && <HubAtlas atlasMaps={resolvedAtlasMaps} onSelectMap={setSelectedAtlasMap} commandes={commandesDeConnexion}
                    informations={<HubHorlogesPubliques {...{ isClockProjected, timestamp, mode, theme, tensions }} />} />}
            </div>
            )}

            {/* Bottom Navigation */}
            <nav className={'relative z-[100] shrink-0 w-full border-t border-app-border bg-app-surface p-1 pb-[max(4px,env(safe-area-inset-bottom))]'} aria-label="Navigation Hub">
                <div data-hub-nav-scroll className={'w-full'}>
                <Panneau as="div" habillage="libre" className={'flex flex-col gap-1'}>
                    <div className={'grid grid-cols-3 gap-1 lg:grid-cols-6'}>
                    {(
                        [
                            { id: 'live', icon: Monitor, label: 'Direct' },
                            { id: 'archives', icon: Archive, label: 'Archives' },
                            { id: 'trombinoscope', icon: Users, label: 'PNJ' },
                            { id: 'atlas', icon: Globe, label: 'Lieux' },
                            { id: 'inventory', icon: Package, label: 'Inventaire' },
                            { id: 'cartes', icon: Layers, label: 'Cartes' }
                        ] as const
                    ).map((tab) => (
                        <Bouton habillage="socle" variante={currentTab === tab.id ? 'accent' : 'neutre'} cibleTactile
                            key={tab.id}
                            data-hub-tab={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            aria-pressed={currentTab === tab.id}
                            className={'relative w-full min-w-[44px] px-1'}
                            title={tab.label}
                        >
                            <span className={'text-[12px] tracking-normal'}>{tab.label}</span>
                            {/* Une carte qu'on me tend attend une réponse : elle
                                se signale même onglet fermé. */}
                            {tab.id === 'cartes' && cartesProposees > 0 && currentTab !== 'cartes' && (
                                <span className="absolute top-0 right-0 md:-top-1 md:-right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-etat-danger opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-etat-danger text-ui-9 items-center justify-center font-bold text-app-bg">{cartesProposees}</span>
                                </span>
                            )}
                        </Bouton>
                    ))}
                    </div>
                    <div className={'grid grid-cols-4 gap-1'}>
                    <Bouton habillage="socle" variante={isInventoryOpen ? 'accent' : 'neutre'} cibleTactile
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        aria-pressed={isInventoryOpen}
                        className={'relative w-full min-w-[44px] px-1'}
                        title="Fiche Personnage"
                    >
                        <span className={'text-[12px] tracking-normal'}>Fiche</span>
                    </Bouton>
                    <Bouton habillage="socle" variante={isNotesOpen ? 'accent' : 'neutre'} cibleTactile
                        onClick={() => setIsNotesOpen(!isNotesOpen)}
                        aria-pressed={isNotesOpen}
                        className={'relative w-full min-w-[44px] px-1'}
                        title="Notes Personnelles"
                    >
                        <span className={'text-[12px] tracking-normal'}>Notes</span>
                    </Bouton>
                    <Bouton habillage="socle" variante={isMessengerOpen ? 'accent' : 'neutre'} cibleTactile
                        onClick={toggleMessenger}
                        aria-pressed={isMessengerOpen}
                        className={'relative w-full min-w-[44px] px-1'}
                        title="Messages"
                    >
                        <span className={'text-[12px] tracking-normal'}>Messages</span>
                        {unreadCount > 0 && !isMessengerOpen && (
                            <span className="absolute top-0 right-0 md:-top-1 md:-right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-etat-danger opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-etat-danger text-ui-9 items-center justify-center font-bold text-app-bg">{unreadCount}</span>
                            </span>
                        )}
                    </Bouton>
                    <Bouton habillage="socle" variante={'danger'} cibleTactile
                        onClick={() => window.confirm('Quitter la session ?') && resetIdentity()}
                        className="flex min-w-[44px] items-center justify-center gap-2 p-3 md:px-6 md:py-2.5 rounded-full text-ui-10 font-black uppercase tracking-widest text-etat-danger hover:text-etat-danger hover:bg-etat-danger/10 transition-all ml-1 md:ml-0"
                        title="Quitter"
                    >
                        <span className={'text-[12px] tracking-normal'}>Quitter</span>
                    </Bouton>
                    </div>
                </Panneau>
                </div>
            </nav>

            {/* Combat Overlay */}
            {hasCombatants && activeCombatant && (
                <>
                    {/* Mobile Toggle Button */}
                    {/* Combat Sidebar */}
                    <Panneau as="aside" habillage="libre" className={`fixed right-0 top-0 z-[110] h-dvh w-full sm:w-80 bg-app-surface border-l border-app-border p-4 flex flex-col gap-4 overflow-auto ${isCombatOverlayOpen ? '' : 'hidden'}`}>
                        <EnTeteDeModule habillage="libre" className="flex items-center justify-between border-b border-app-border/40 pb-3 mt-12 md:mt-0">
                            <h2 className="text-app-text text-lg font-bold tracking-tight">Initiative</h2>
                            <Bouton habillage="socle" cibleTactile className={'min-w-[44px] p-2'} onClick={() => setIsCombatOverlayOpen(false)} title="Fermer l'initiative">
                                {'Fermer'}
                            </Bouton>
                        </EnTeteDeModule>
                    <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2">
                        <Panneau as="div" habillage="libre" className="flex flex-col gap-3 p-3 rounded-2xl bg-etat-danger/10 border border-etat-danger/30 shadow-glow-crimson">
                            <div className="flex items-center gap-3">
                                <ResolvedImage className="size-8 rounded-full border border-etat-danger" src={activeCombatant.avatar} alt={activeCombatant.name} />
                                <div className="flex flex-col">
                                    <p className={`text-app-text ${'text-[14px]'} font-bold leading-none`}>{activeCombatant.name}</p>
                                    <p className={`text-etat-danger ${'text-[14px]'} font-bold uppercase mt-1`}>À toi</p>
                                </div>
                            </div>
                        </Panneau>
                        {upcomingCombatants.slice(0, 5).map((c: Combatant) => (
                            <Panneau as="div" habillage="libre" key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-app-surface/20 border border-app-border/10 opacity-60">
                                <ResolvedImage className="size-8 rounded-full border border-app-border/10" src={c.avatar} alt={c.name} />
                                <p className={`text-app-text/90 ${'text-[14px] break-words'} font-medium`}>{c.name}</p>
                            </Panneau>
                        ))}
                    </div>
                </Panneau>
                </>
            )}

            {/* Overlays & Modals */}
            {(!isOnboarded || !activeSession) && <LobbyOnboarding latency={latency} />}
            {characterId && (
                <>
                    {isInventoryOpen && <HubCharacterSheet onClose={() => setIsInventoryOpen(false)} />}
                    <AnimatePresence>
                        {isNotesOpen && playerId && (
                            <motion.section role="dialog" aria-modal="true" aria-label="Notes & Feedback"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="fixed inset-3 z-[150] flex min-h-0 flex-col border border-app-border bg-app-surface shadow-2xl lg:left-auto lg:w-[560px]">
                                <div className="flex shrink-0 justify-end border-b border-app-border p-2">
                                    <Bouton cibleTactile onClick={() => setIsNotesOpen(false)} title="Fermer les notes">Fermer</Bouton>
                                </div>
                                <div className="min-h-0 overflow-auto">
                                    <PlayerPrivateNotes playerId={playerId} characterId={characterId} />
                                </div>
                            </motion.section>
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
            className="max-w-2xl w-full"
        >
            <Panneau as="div" habillage="libre" className={`relative bg-app-surface/95 border-2 border-accent/40 rounded-[3rem] p-8 md:p-12 shadow-[0_0_80px_rgba(var(--accent-rgb),0.3)] flex flex-col items-center gap-6 w-full ${performance.isLowGraphics ? 'backdrop-blur-none' : 'backdrop-blur-[40px]'}`}>
            {/* Background Decorative Glow */}
            <div className="absolute inset-0 bg-accent/5 rounded-[4rem] pointer-events-none" />
            
            <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-accent/60" />
                    <Etiquette habillage="libre" ton="accent" className="text-accent text-ui-10 font-black uppercase tracking-[0.8em] py-1 px-4 border border-accent/20 rounded-full">
                        Séquence du Destin
                    </Etiquette>
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
                        {r.source === 'gear' && <span className="absolute bottom-1 right-1.5 text-ui-8 opacity-40 font-bold uppercase">G</span>}
                        {r.source === 'base' && <span className="absolute bottom-1 right-1.5 text-ui-8 opacity-40 font-bold uppercase">B</span>}
                    </motion.div>
                ))}
            </div>

            {/* Final Tag */}
            {/*
                **La tablette écrivait « Réussite » en dur** pendant que
                l'incrustation de résultat écrivait « Succès » et le pupitre une
                clé i18n : trois vocabulaires pour le même jet, sous les yeux des
                mêmes joueurs. Le mot vient désormais d'un seul endroit ;
                l'animation, elle, reste celle de la tablette.
            */}
            <EtiquetteDuDegre
                resultat={lastRoll}
                classes={reussi => 'px-10 py-3 rounded-2xl border-2 text-lg md:text-xl font-black uppercase tracking-[0.3em] backdrop-blur-2xl shadow-xl transition-all '
                    + (reussi
                        ? 'bg-etat-succes/20 text-etat-succes border-etat-succes/60 shadow-glow-emerald/40'
                        : 'bg-etat-danger/20 text-etat-danger border-etat-danger/60 shadow-glow-rose/40')}
                enveloppe={contenu => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4"
                    >
                        {contenu}
                    </motion.div>
                )}
            />
            </Panneau>
        </motion.div>
    );
};

const MessageToast: React.FC<{ fromName: string; channel: string; onClick: () => void }> = ({ fromName, channel, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-[calc(var(--hub-navigation-hauteur)+env(safe-area-inset-bottom)+8px)] inset-x-3 z-[200] cursor-pointer lg:left-auto lg:w-[440px]"
        >
            <Bouton habillage="libre" cibleTactile onClick={onClick} title="Ouvrir le nouveau message" className="w-full bg-accent text-app-on-accent backdrop-blur-xl border border-app-on-accent/20 px-6 py-3 rounded-2xl shadow-[0_20px_50px_color-mix(in_srgb,var(--app-accent)_40%,transparent)] flex items-center gap-4 text-left hover:brightness-110 transition-all active:scale-95 group">
                <div className="p-2 bg-app-on-accent/20 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} />
                </div>
                <div className="min-w-0 flex flex-col">
                    <span className="text-[14px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Nouveau Message</span>
                    <p className="break-words text-[16px] font-bold leading-tight">
                        {fromName} <span className="opacity-60 font-medium ml-1">({channel})</span>
                    </p>
                </div>
            </Bouton>
        </motion.div>
    );
};

export default TabletHub;
