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
import { useCombatStore } from './modules/combat/useCombatStore';
import { useSessionOSStore } from './modules/session/useSessionOSStore';
import { useWhiteboardStore, type WhiteboardTool, type Point, type DrawingPath } from './modules/whiteboard/useWhiteboardStore';
import { useClockStore } from './store/useClockStore';
import { mediaCleanupService } from './services/MediaCleanupService';
import { getDifferentialPayload } from './utils/syncUtils';

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

const PlaceholderModule = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-700" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight">Module {name}</h2>
  </div>
);

function App() {
  const lastSyncRef = React.useRef(0);
  const lastBroadcastRef = React.useRef<Record<string, unknown>>({});
  const { activeModule, theme } = useSessionStore();
  const sessionOSStore = useSessionOSStore();
  const { activeCampaignId, selectedSessionId, sessions } = sessionOSStore;
  const { isMediaHubOpen, closeMediaHub } = useModalStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Automatic Media Cleanup on startup
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("[App] Running automatic media cleanup...");
      mediaCleanupService.performCleanup().then(res => {
        if (res.deletedCount > 0) {
          console.log(`[App] Media cleanup finished: ${res.deletedCount} items removed, ${(res.savedBytes / 1024 / 1024).toFixed(2)} MB saved.`);
        }
      }).catch(err => console.error("[App] Media cleanup failed:", err));
    }, 5000); // 5s delay to let everything settle
    return () => clearTimeout(timer);
  }, []);

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

    const handleSync = async (immediate = true) => {
      // Throttle for whiteboard/non-immediate updates (100ms = 10Hz)
      if (!immediate) {
        const now = Date.now();
        if (now - lastSyncRef.current < 100) return;
        lastSyncRef.current = now;
      }
      try {
        const soundStore = useSoundStore.getState();
        const storyboardStore = useStoryboardStore.getState();
        const combatStore = useCombatStore.getState();
        
        const atmosId = soundStore.activeAtmosphereId;
        const atmosphere = soundStore.atmospheres.find(a => a.id === atmosId);
        const sounds = atmosphere ? Object.values(atmosphere.pads).map(p => ({
          id: p.id, title: p.title || p.id, active: !!p.filePath
        })) : [];

        const moments = storyboardStore.moments
          .filter(m => m.campaignId === activeCampaignId)
          .map(m => ({ id: m.id, name: m.name }));

        let activeSession = sessions.find(s => s.id === selectedSessionId);
        if (!activeSession) activeSession = sessions.find(s => s.status === 'active' && s.campaignId === activeCampaignId);
        if (!activeSession && sessions.length > 0) activeSession = [...sessions].reverse().find(s => s.campaignId === activeCampaignId);

        const notes = {
          public: activeSession?.publicSummary || activeSession?.sessionNotes || 'Aucun résumé public.',
          private: activeSession?.gmSecrets || activeSession?.sessionNotes || 'Aucune note secrète.'
        };

        const { resolveToSendableUrl } = await import('./utils/mediaResolver');
        const resolvedCombatants = await Promise.all(
          combatStore.combatants.map(async (c) => ({
            id: c.id, name: c.name, hp: c.hp, hpMax: c.hpMax,
            init: c.init, isPlayer: c.isPlayer, healthSystem: c.healthSystem,
            avatar: await resolveToSendableUrl(c.avatar)
          }))
        );

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

        const currentState = { sounds, moments, masterVolume: soundStore.masterVolume, combat, notes, whiteboard, clock };
        const diffPayload = getDifferentialPayload(currentState, lastBroadcastRef.current);
        
        if (Object.keys(diffPayload).length > 0) {
           bridge.send('remote:broadcast-sync', diffPayload);
           lastBroadcastRef.current = currentState;
        }
      } catch (e) { console.error("Sync failed", e); }
    };

    const handleAction = (action: unknown) => {
      const { type, payload } = action as RemoteAction;
      
      console.log('[App] Remote action received:', type);
      if (type === 'dice:roll') window.dispatchEvent(new CustomEvent('remote:roll-die', { detail: payload }));
      if (type === 'dice:clear') window.dispatchEvent(new CustomEvent('remote:clear-dice'));
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

      // Trigger an immediate sync after any remote action
      handleSync();
    };

    bridge.on('remote:request-sync', () => handleSync(true));
    // Cleanup any existing listeners to be safe before adding new one
    bridge.remote.removeActions();
    const cleanupAction = bridge.remote.onAction(handleAction);

    // Subscribe to stores to trigger direct sync on change
    // We use immediate=false for whiteboard to throttle rapid mouse movements
    const unsubWhiteboard = useWhiteboardStore.subscribe(() => handleSync(false));
    const unsubClock = useClockStore.subscribe(() => handleSync(false));
    
    handleSync();

    return () => {
      bridge.off('remote:request-sync', () => handleSync(true));
      cleanupAction();
      unsubWhiteboard();
      unsubClock();
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

  const searchParams = new URLSearchParams(window.location.search);
  const isProjector = searchParams.get('window') === 'projector';
  const isHub = searchParams.get('window') === 'hub';
  const isTablet = searchParams.get('window') === 'tablet';
  const isRemote = searchParams.get('window') === 'remote';

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      {isRemote ? (
        <ErrorBoundary moduleName="Remote Control"><RemoteControl /></ErrorBoundary>
      ) : isProjector ? (
        <ErrorBoundary moduleName="Projector View"><ProjectorView /></ErrorBoundary>
      ) : isHub ? (
        <ErrorBoundary moduleName="Player Hub"><PlayerHub /></ErrorBoundary>
      ) : isTablet ? (
        <ErrorBoundary moduleName="Tablet Hub"><TabletHub /></ErrorBoundary>
      ) : (
        <>
          <GlobalKeybinds />
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
