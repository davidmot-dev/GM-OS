import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSessionStore } from './store/useSessionStore';
import Shell from './components/Shell';
import { useModalStore } from './stores/useModalStore';
import SplashScreenSelector from './components/splash/SplashScreenSelector';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingOverlay from './components/common/LoadingOverlay';

// --- STORES (Safe for Web) ---
import { useSoundStore } from './modules/sound/useSoundStore';
import { useStoryboardStore } from './modules/storyboard/useStoryboardStore';
import { useMapStore } from './modules/map/useMapStore';
import { useCombatStore } from './modules/combat/useCombatStore';
import { useSessionOSStore } from './modules/session/useSessionOSStore';
import { useWhiteboardStore, type WhiteboardTool, type Point, type DrawingPath } from './modules/whiteboard/useWhiteboardStore';
import { useClockStore } from './store/useClockStore';
import { useMusicStore } from './modules/music/useMusicStore';
import { useImageStore } from './modules/image/useImageStore';
import { useAmbientStore } from './modules/ambient/useAmbientStore';
import { useMediaStore } from './stores/useMediaStore';
// import { mediaCleanupService } from './services/MediaCleanupService';
import { getDifferentialPayload } from './utils/syncUtils';
import { spatialTriggerService } from './modules/map/SpatialTriggerService';
import { useDisplayDetection } from './hooks/useDisplayDetection';
// import { useBackupSync } from './hooks/useBackupSync';
import { resolveToSendableUrl } from './utils/mediaResolver';

// --- LAZY COMPONENTS (Critical for Remote Stability) ---
const RemoteControl = lazy(() => import('./modules/remote/RemoteControl'));
const SessionDashboard = lazy(() => import('./modules/session/SessionDashboard'));
const DiceBoard = lazy(() => import('./modules/dice/DiceBoard'));
const MusicDashboard = lazy(() => import('./modules/music/MusicDashboard'));
const CombatDashboard = lazy(() => import('./modules/combat/CombatDashboard'));
const NPCDashboard = lazy(() => import('./modules/npc/NPCDashboard'));
const MapDashboard = lazy(() => import('./modules/map/MapDashboard'));
const ClockDashboard = lazy(() => import('./modules/clock/ClockDashboard'));
const AmbientDashboard = lazy(() => import('./modules/ambient/AmbientDashboard'));
const TableDashboard = lazy(() => import('./modules/tables/TableDashboard'));
const WebDashboard = lazy(() => import('./modules/web/WebDashboard'));
const ImageDashboard = lazy(() => import('./modules/image/ImageDashboard'));
const SoundDashboard = lazy(() => import('./modules/sound/SoundDashboard'));
const LightDashboard = lazy(() => import('./modules/light/LightDashboard'));
const WhiteboardDashboard = lazy(() => import('./modules/whiteboard/WhiteboardDashboard'));
const DebugDashboard = lazy(() => import('./modules/debug/DebugDashboard'));
const VoiceDashboard = lazy(() => import('./modules/voice/VoiceDashboard'));
const ProjectorView = lazy(() => import('./modules/image/components/ProjectorView'));
const PlayerHub = lazy(() => import('./components/PlayerHub'));
const TabletHub = lazy(() => import('./components/TabletHub'));
const ObsidianPanel = lazy(() => import('./modules/session/components/ObsidianPanel'));
const JournalDashboard = lazy(() => import('./modules/journal/JournalDashboard'));
const FavoriteDashboard = lazy(() => import('./modules/favorite/components/FavoriteDashboard').then(m => ({ default: m.FavoriteDashboard })));

// --- SHARED COMPONENTS ---
const ModalProvider = lazy(() => import('./components/ModalProvider'));
const ToastProvider = lazy(() => import('./components/ToastProvider'));
const AudioRouter = lazy(() => import('./modules/music/components/AudioRouter'));
const MediaBrowser = lazy(() => import('./components/MediaBrowser').then(m => ({ default: m.MediaBrowser })));
const GlobalKeybinds = lazy(() => import('./components/GlobalKeybinds').then(m => ({ default: m.GlobalKeybinds })));
const SpotlightSearch = lazy(() => import('./components/SpotlightSearch').then(m => ({ default: m.SpotlightSearch })));

const PlaceholderModule = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-700" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight">Module {name}</h2>
  </div>
);

interface UniversalPad {
  id: string;
  type: 'music' | 'sound' | 'image' | 'ambient';
  label: string;
  color: string;
  imageUrl?: string;
  sublabel?: string;
}

function App() {
  const lastSyncRef = React.useRef(0);
  const lastBroadcastRef = React.useRef<Record<string, unknown>>({});
  const { activeModule, theme } = useSessionStore();
  const sessionOSStore = useSessionOSStore();
  const { activeCampaignId, selectedSessionId, sessions } = sessionOSStore;
  const { isMediaHubOpen, closeMediaHub } = useModalStore();
  const [showSplash, setShowSplash] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const isProjector = searchParams.get('window') === 'projector';
  const isHub = searchParams.get('window') === 'hub';
  const isTablet = searchParams.get('window') === 'tablet';
  const isRemote = searchParams.get('window') === 'remote';

  // Workspace Sync v2: Intelligent display detection (Main GM window only)
  const isMainPC = !isProjector && !isHub && !isTablet && !isRemote;
  useDisplayDetection(isMainPC);
  
  // Automated GitHub Backup (DISABLED)
  // useBackupSync();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* 
  // Automatic Media Cleanup on startup (Main PC only)
  useEffect(() => {
    if (!isMainPC) return;
    
    const timer = setTimeout(() => {
      console.log("[App] Running automatic media cleanup...");
      mediaCleanupService.performCleanup().then(res => {
        if (res.deletedCount > 0) {
          console.log(`[App] Media cleanup finished: ${res.deletedCount} items removed, ${(res.savedBytes / 1024 / 1024).toFixed(2)} MB saved.`);
        }
      }).catch(err => console.error("[App] Media cleanup failed:", err));
    }, 5000); // 5s delay to let everything settle
    return () => clearTimeout(timer);
  }, [isMainPC]);
  */

  // Handle Remote Sync and Actions (Only on Main PC Window)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const windowTag = searchParams.get('window') || 'main';
    const isMainPC = windowTag === 'main' || !windowTag;

    const bridge = window.appBridge;
    if (!bridge?.remote) return;

    // IMPORTANT: Projector and Hub windows MUST NOT listen for remote actions
    // otherwise every action is executed N times (once per open window).
    if (!isMainPC) {
      console.log(`[App] ${windowTag} window: Skipping remote action listeners.`);
      return;
    }

    // Démarrage de la surveillance des triggers spatiaux (GM uniquement)
    spatialTriggerService.startWatching();
    
    // Initialisation du MediaStore pour les résolutions d'URL (m-ID)
    useMediaStore.getState().initDB();

    // Synchroniser automatiquement la carte si le Combat-OS change (pour l'invisibilité des jetons liés)
    const unsubscribeCombat = useCombatStore.subscribe((state, prevState) => {
      if (state.combatants !== prevState.combatants) {
        useMapStore.getState().syncToPlayers();
      }
    });

    const handleSync = async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastSyncRef.current < 100) return;
      lastSyncRef.current = now;
      try {
        const soundStore = useSoundStore.getState();
        const storyboardStore = useStoryboardStore.getState();
        const combatStore = useCombatStore.getState();
        const freshSessionOS = useSessionOSStore.getState();
        const { sessions, campaigns, players, activeCampaignId, clues } = freshSessionOS;
        
        const atmosId = soundStore.activeAtmosphereId;
        const atmosphere = soundStore.atmospheres.find(a => a.id === atmosId);
        const sounds = atmosphere ? Object.values(atmosphere.pads).map(p => ({
          id: p.id, title: p.title || p.id, active: !!p.filePath
        })) : [];

        let universalPads: UniversalPad[] = [];
        try {
          const musicStore = useMusicStore.getState();
          const imageStore = useImageStore.getState();
          const ambientStore = useAmbientStore.getState();

          // MUSIC
          let musicPlaylist = musicStore.playlists.find(p => p.id === musicStore.activePlaylistId);
          if (!musicPlaylist && musicStore.playlists.length > 0) musicPlaylist = musicStore.playlists[0];
          const musicPads = (musicPlaylist?.pads.filter(p => !!p.url) || []).slice(0, 4).map(p => ({
            id: p.id, type: 'music' as const, label: p.label || 'Sans Nom', color: 'var(--accent)'
          }));

          // SOUND (SFX)
          let soundAtmosphere = soundStore.atmospheres.find(a => a.id === atmosId);
          if (!soundAtmosphere && soundStore.atmospheres.length > 0) soundAtmosphere = soundStore.atmospheres[0];
          const sfxPads = (soundAtmosphere ? Object.values(soundAtmosphere.pads) : [])
            .filter(p => !!p.filePath).slice(0, 4).map(p => ({
            id: p.id, type: 'sound' as const, label: p.title || p.id, color: 'var(--rose-500)'
          }));

          // IMAGE
          let favoriteImages = imageStore.mediaList.filter(m => m.isFavorite);
          if (favoriteImages.length === 0 && imageStore.mediaList.length > 0) {
            favoriteImages = imageStore.mediaList.slice(0, 4);
          }
          const imagePads = favoriteImages.slice(0, 4).map(m => ({
            id: m.id, type: 'image' as const, label: m.name, imageUrl: m.path, color: 'var(--emerald-500)'
          }));
          const resolvedImagePads = await Promise.all(imagePads.map(async (p) => ({
            ...p,
            type: 'image' as const,
            imageUrl: await resolveToSendableUrl(p.imageUrl)
          })));

          // AMBIENT
          const ambientPads = ambientStore.presets.slice(0, 4).map(p => ({
            id: p.id, type: 'ambient' as const, label: p.name, sublabel: p.universe, color: 'var(--blue-500)'
          }));

          universalPads = [...musicPads, ...sfxPads, ...resolvedImagePads, ...ambientPads];
        } catch (e) {
          console.error('[App] Failed to aggregate universal pads', e);
        }

        const moments = storyboardStore.moments
          .filter(m => m.campaignId === activeCampaignId)
          .map(m => ({ id: m.id, name: m.name }));


        const activeSession = sessions.find((s: import('./modules/session/store/types').GameSession) => s.status === 'active' && s.campaignId === activeCampaignId) || 
                              (sessions.length > 0 ? [...sessions].reverse().find((s: import('./modules/session/store/types').GameSession) => s.campaignId === activeCampaignId) : undefined);

        const notes = {
          public: activeSession?.publicSummary || activeSession?.sessionNotes || 'Aucun résumé public.',
          private: activeSession?.gmSecrets || activeSession?.sessionNotes || 'Aucune note secrète.'
        };

        const resolvedCombatants = (await Promise.all(
          combatStore.combatants.map(async (c) => ({
            id: c.id, name: c.name, hp: c.hp, hpMax: c.hpMax,
            init: c.init, isPlayer: c.isPlayer, healthSystem: c.healthSystem,
            avatar: await resolveToSendableUrl(c.avatar),
            statuses: c.statuses
          }))
        )).filter(c => c.isPlayer || !c.statuses?.some(s => {
          const n = s.name.toLowerCase();
          return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
        }));

        const combat = {
          combatants: resolvedCombatants,
          currentTurnIdx: combatStore.currentTurnIdx,
          round: combatStore.round
        };

        const clockStore = useClockStore.getState();
        const clock = {
          timestamp: clockStore.timestamp,
          mode: clockStore.mode,
          isClockProjected: clockStore.isClockProjected,
          theme: clockStore.theme,
          tensions: clockStore.tensions,
          timerRemaining: clockStore.timerRemaining,
          timerIsRunning: clockStore.timerIsRunning,
          timerLabel: clockStore.timerLabel,
          timerDuration: clockStore.timerDuration
        };

        const whiteboardStore = useWhiteboardStore.getState();
        const whiteboard = {
          paths: whiteboardStore.paths,
          activePath: whiteboardStore.activePath,
          laserPointer: whiteboardStore.laserPointer,
          backgroundMode: whiteboardStore.backgroundMode,
          currentTool: whiteboardStore.currentTool,
          currentColor: whiteboardStore.currentColor,
          currentWidth: whiteboardStore.currentWidth
        };

        const activeCampaign = campaigns.find(c => String(c.id) === String(activeCampaignId));
        
        if (activeCampaignId) {
            console.log(`[Sync] Active Campaign Found: ${activeCampaign?.name} (ID: ${activeCampaignId})`);
            if (activeCampaign?.wallpaperUrl) {
                console.log(`[Sync] Campaign has wallpaper defined: ${activeCampaign.wallpaperUrl.substring(0, 50)}...`);
            } else {
                console.warn(`[Sync] Campaign ${activeCampaignId} has NO wallpaperUrl defined in store!`);
            }
        } else {
            console.error(`[Sync] CRITICAL: activeCampaignId is NULL in SessionOSStore!`);
        }

        const session = {
            sessions,
            campaigns,
            players,
            activeCampaignId,
            activeCampaignName: activeCampaign?.name || null,
            activeCampaignWallpaper: activeCampaign?.wallpaperUrl ? await resolveToSendableUrl(activeCampaign.wallpaperUrl) : null
        };

        if (session.activeCampaignWallpaper) {
            console.log(`[Sync] Wallpaper resolved to: ${session.activeCampaignWallpaper.startsWith('data:') ? 'Data URI (Base64)' : session.activeCampaignWallpaper.substring(0, 100)}...`);
        }

        const currentState = { sounds, moments, masterVolume: soundStore.masterVolume, combat, notes, whiteboard, clock, universalPads, session };
        const diffPayload = force ? currentState : getDifferentialPayload(currentState, lastBroadcastRef.current);
        
        if (Object.keys(diffPayload).length > 0) {
           console.log(`[Sync] Broadcasting update (${force ? 'FULL' : 'DIFF'}):`, Object.keys(diffPayload));
           
           const sPayload = diffPayload as { session?: { activeCampaignWallpaper?: string } };
           if (sPayload.session?.activeCampaignWallpaper) {
               console.log(`[Sync] Including activeCampaignWallpaper in this broadcast.`);
           }
           bridge.send('remote:broadcast-sync', diffPayload);
           lastBroadcastRef.current = currentState;
        }
        lastSyncRef.current = Date.now();
      } catch (e: unknown) { 
          const err = e instanceof Error ? e.message : String(e);
          console.error("[Sync] Error in handleSync:", err); 
      }
    };

    const handleAction = (action: unknown) => {
      const { type, payload } = action as RemoteAction;
      
      console.log(`[App] [RemoteAction] type: ${type}`, payload);
      if (type === 'dice:roll') {
        console.log('[App] Roll Die action');
        window.dispatchEvent(new CustomEvent('remote:roll-die', { detail: payload }));
      }
      if (type === 'dice:clear') {
        console.log('[App] Clear Dice action');
        window.dispatchEvent(new CustomEvent('remote:clear-dice'));
      }

      if (type === 'remote:request-sync') {
        console.log('[App] Forced sync request from tablet');
        handleSync(true); // Force full sync broadcast
      }
      if (type === 'sound:trigger') useSoundStore.getState().triggerPad((payload as { padId: string }).padId);
      if (type === 'sound:volume') useSoundStore.getState().setMasterVolume((payload as { volume: number }).volume);
      if (type === 'sound:stop-all') useSoundStore.getState().stopAllPads();
      
      if (type === 'combat:update-hp') {
        const { id, delta } = payload as { id: string; delta: number };
        const c = useCombatStore.getState().combatants.find(c => c.id === id);
        if (c) useCombatStore.getState().updateCombatant(id, { hp: Math.min(c.hpMax, Math.max(0, c.hp + delta)) });
      }
      if (type === 'combat:next-turn') {
        console.log('[App] → Calling nextTurn()');
        useCombatStore.getState().nextTurn();
      }

      if (type === 'storyboard:trigger') {
        const m = useStoryboardStore.getState().moments.filter(m => m.campaignId === activeCampaignId)[(payload as { index: number }).index];
        if (m) useStoryboardStore.getState().triggerMoment(m.id);
      }

      // --- WHITEBOARD ACTIONS ---
      if (type === 'whiteboard:set-laser-pointer') {
        useWhiteboardStore.getState().setLaserPointer(payload as unknown as Point);
      }
      if (type === 'whiteboard:set-active-path') {
        useWhiteboardStore.getState().setActivePath((payload as { path: DrawingPath }).path, (payload as { drawerId: string }).drawerId);
      }
      if (type === 'whiteboard:draw') {
        useWhiteboardStore.getState().addPath(payload as unknown as DrawingPath);
      }
      if (type === 'whiteboard:clear') {
        useWhiteboardStore.getState().clearBoard();
      }
      if (type === 'whiteboard:undo') {
        useWhiteboardStore.getState().undo();
      }
      if (type === 'whiteboard:redo') {
        useWhiteboardStore.getState().redo();
      }
      if (type === 'whiteboard:set-tool') {
        useWhiteboardStore.getState().setTool(payload as unknown as WhiteboardTool);
      }
      if (type === 'whiteboard:set-color') {
        useWhiteboardStore.getState().setColor(payload as unknown as string);
      }
      if (type === 'whiteboard:set-width') {
        useWhiteboardStore.getState().setWidth(payload as unknown as number);
      }

      // --- UNIVERSAL ACTIONS ---
      if (type === 'universal:trigger') {
        const { id, type: itemType } = payload as { id: string, type: string };
        console.log(`[App] [Universal:Trigger] ${itemType} id: ${id}`);
        
        if (itemType === 'music') {
          const pads = useMusicStore.getState().playlists.flatMap(p => p.pads);
          const pad = pads.find(p => p.id === id);
          if (pad) {
            console.log(`[App] Triggering Music Pad: ${pad.label}`);
            useMusicStore.getState().playPad(pad);
          } else {
            console.warn(`[App] Music Pad not found: ${id} among ${pads.length} pads`);
          }
        } else if (itemType === 'sound') {
          console.log(`[App] Triggering Sound Pad: ${id}`);
          import('./modules/sound/SoundController').then((m) => {
            m.soundController.togglePad(id);
          });
        }
 else if (itemType === 'image') {
          const media = useImageStore.getState().mediaList.find(m => m.id === id);
          if (media) useImageStore.getState().projectSolo(media);
        } else if (itemType === 'ambient') {
          const ambientStore = useAmbientStore.getState();
          const preset = ambientStore.presets.find(p => p.id === id);
          if (preset) {
            console.log(`[App] Triggering Ambient Preset: ${preset.name}`);
            
            const isActive = ambientStore.tracks.some((t, i) => {
               const pTrack = preset.tracks[i];
               return pTrack && t.url === pTrack.url && t.isPlaying;
            });

            if (isActive) {
                ambientStore.fadeOutAll();
            } else {
                ambientStore.loadTheme(preset.universe, preset.name).then(() => {
                    const latestStore = useAmbientStore.getState();
                    preset.tracks.forEach((pTrack, index) => {
                        if (pTrack && pTrack.url && (pTrack.volume ?? 0) > 0) {
                            latestStore.toggleTrack(index).catch(e => console.error('[App] Failed to auto-play ambient track', e));
                        }
                    });
                });
            }
          }
        }
      }

      // Trigger an immediate sync after any remote action
      handleSync(true);
    };

    bridge.on('remote:request-sync', () => {
        console.log('[Sync] Remote requested full state sync');
        handleSync(true);
    });
    // Cleanup any existing listeners to be safe before adding new one
    bridge.remote.removeActions();
    const cleanupAction = bridge.remote.onAction(handleAction);

    // Subscribe to stores to trigger direct sync on change
    // We use immediate=false for whiteboard to throttle rapid mouse movements
    const unsubWhiteboard = useWhiteboardStore.subscribe(() => handleSync(false));
    const unsubClock = useClockStore.subscribe(() => handleSync(false));
    
    // Subscribe to stores for Universal Pad
    const unsubMusic = useMusicStore.subscribe(() => handleSync(false));
    const unsubSoundSync = useSoundStore.subscribe(() => handleSync(false));
    const unsubImage = useImageStore.subscribe(() => handleSync(false));
    const unsubAmbient = useAmbientStore.subscribe(() => handleSync(false));
    const unsubSessionOS = useSessionOSStore.subscribe(() => handleSync(false));
    
    handleSync();

    return () => {
      bridge.off('remote:request-sync', () => handleSync(true));
      cleanupAction();
      unsubWhiteboard();
      unsubClock();
      unsubMusic();
      unsubSoundSync();
      unsubImage();
      unsubAmbient();
      unsubSessionOS();
      unsubscribeCombat();
      console.log('[App] Remote effect cleanup - IPC listeners removed.');
    };
  }, [activeCampaignId, selectedSessionId, sessions, sessionOSStore]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <ErrorBoundary moduleName="Dashboard"><SessionDashboard /></ErrorBoundary>;
      case 'dice': return <ErrorBoundary moduleName="Dice OS"><DiceBoard /></ErrorBoundary>;
      case 'music': return <ErrorBoundary moduleName="Music OS"><MusicDashboard /></ErrorBoundary>;
      case 'combat': return <ErrorBoundary moduleName="Combat OS"><CombatDashboard /></ErrorBoundary>;
      case 'map': return <ErrorBoundary moduleName="Map OS"><MapDashboard /></ErrorBoundary>;
      case 'npc': return <ErrorBoundary moduleName="NPC OS"><NPCDashboard /></ErrorBoundary>;
      case 'clock': return <ErrorBoundary moduleName="Clock OS"><ClockDashboard /></ErrorBoundary>;
      case 'ambient': return <ErrorBoundary moduleName="Ambient OS"><AmbientDashboard /></ErrorBoundary>;
      case 'table': return <ErrorBoundary moduleName="Table OS"><TableDashboard /></ErrorBoundary>;
      case 'web': return <ErrorBoundary moduleName="Web OS"><WebDashboard /></ErrorBoundary>;
      case 'image': return <ErrorBoundary moduleName="Image OS"><ImageDashboard /></ErrorBoundary>;
      case 'sound': return <ErrorBoundary moduleName="Sound OS"><SoundDashboard /></ErrorBoundary>;
      case 'light': return <ErrorBoundary moduleName="Light OS"><LightDashboard /></ErrorBoundary>;
      case 'favorite': return <ErrorBoundary moduleName="Favorite OS"><FavoriteDashboard /></ErrorBoundary>;
      case 'whiteboard': return <ErrorBoundary moduleName="Whiteboard OS"><WhiteboardDashboard /></ErrorBoundary>;
      case 'debug': return <ErrorBoundary moduleName="Debug OS"><DebugDashboard /></ErrorBoundary>;
      case 'voice': return <ErrorBoundary moduleName="Voice OS"><VoiceDashboard /></ErrorBoundary>;
      case 'obsidian': return <ErrorBoundary moduleName="Obsidian Panel"><ObsidianPanel /></ErrorBoundary>;
      case 'journal': return <ErrorBoundary moduleName="Journal OS"><JournalDashboard /></ErrorBoundary>;
      default: return <PlaceholderModule name={activeModule} />;
    }
  };

  const isProjectorView = searchParams.get('window') === 'projector';
  const isHubView = searchParams.get('window') === 'hub';
  const isTabletView = searchParams.get('window') === 'tablet';
  const isRemoteView = searchParams.get('window') === 'remote';

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      {isRemoteView ? (
        <ErrorBoundary moduleName="Remote Control"><RemoteControl /></ErrorBoundary>
      ) : isProjectorView ? (
        <ErrorBoundary moduleName="Projector View"><ProjectorView /></ErrorBoundary>
      ) : isHubView ? (
        <ErrorBoundary moduleName="Player Hub"><PlayerHub /></ErrorBoundary>
      ) : isTabletView ? (
        <ErrorBoundary moduleName="Tablet Hub"><TabletHub /></ErrorBoundary>
      ) : (
        <>
          <GlobalKeybinds />
          <SpotlightSearch />
          <ModalProvider />
          <ToastProvider />
          <AudioRouter />
          <MediaBrowser isOpen={isMediaHubOpen} onClose={closeMediaHub} onSelect={() => {}} title="MEDIA HUB" />
          <LoadingOverlay />
          {showSplash && <SplashScreenSelector onComplete={() => setShowSplash(false)} />}
          <Shell>{renderModule()}</Shell>
        </>
      )}
    </Suspense>
  );
}

export default App;
