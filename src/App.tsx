import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSessionStore } from './store/useSessionStore';
import Shell from './components/Shell';
import { useModalStore } from './stores/useModalStore';
import SplashScreenSelector from './components/splash/SplashScreenSelector';

// --- STORES (Safe for Web) ---
import { useSoundStore } from './modules/sound/useSoundStore';
import { useStoryboardStore } from './modules/storyboard/useStoryboardStore';
import { useCombatStore } from './modules/combat/useCombatStore';
import { useSessionOSStore } from './modules/session/useSessionOSStore';
import { useWhiteboardStore } from './modules/whiteboard/useWhiteboardStore';
import { useClockStore } from './store/useClockStore';

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
  const { activeModule, theme } = useSessionStore();
  const sessionOSStore = useSessionOSStore();
  const { activeCampaignId, selectedSessionId, sessions } = sessionOSStore;
  const { isMediaHubOpen, closeMediaHub } = useModalStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

        bridge.send('remote:broadcast-sync', { sounds, moments, masterVolume: soundStore.masterVolume, combat, notes, whiteboard, clock });
      } catch (e) { console.error("Sync failed", e); }
    };

    const handleAction = (action: unknown) => {
      const { type, payload } = action as { type: string; payload: any };
      console.log('[App] Remote action received:', type);
      if (type === 'dice:roll') window.dispatchEvent(new CustomEvent('remote:roll-die', { detail: payload }));
      if (type === 'dice:clear') window.dispatchEvent(new CustomEvent('remote:clear-dice'));
      if (type === 'sound:trigger') useSoundStore.getState().triggerPad(payload.padId);
      if (type === 'sound:volume') useSoundStore.getState().setMasterVolume(payload.volume);
      if (type === 'sound:stop-all') useSoundStore.getState().stopAllPads();
      
      if (type === 'combat:update-hp') {
        const { id, delta } = payload;
        const c = useCombatStore.getState().combatants.find(c => c.id === id);
        if (c) useCombatStore.getState().updateCombatant(id, { hp: Math.min(c.hpMax, Math.max(0, c.hp + delta)) });
      }
      if (type === 'combat:next-turn') {
        console.log('[App] → Calling nextTurn()');
        useCombatStore.getState().nextTurn();
      }

      if (type === 'storyboard:trigger') {
        const m = useStoryboardStore.getState().moments.filter(m => m.campaignId === activeCampaignId)[payload.index];
        if (m) useStoryboardStore.getState().triggerMoment(m.id);
      }

      // --- WHITEBOARD ACTIONS ---
      if (type === 'whiteboard:set-laser-pointer') {
        useWhiteboardStore.getState().setLaserPointer(payload);
      }
      if (type === 'whiteboard:set-active-path') {
        useWhiteboardStore.getState().setActivePath(payload.path, payload.drawerId);
      }
      if (type === 'whiteboard:add-path') {
        useWhiteboardStore.getState().addPath(payload);
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
        useWhiteboardStore.getState().setTool(payload);
      }
      if (type === 'whiteboard:set-color') {
        useWhiteboardStore.getState().setColor(payload);
      }
      if (type === 'whiteboard:set-width') {
        useWhiteboardStore.getState().setWidth(payload);
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
      case 'dashboard': return <SessionDashboard />;
      case 'dice': return <DiceBoard />;
      case 'music': return <MusicDashboard />;
      case 'combat': return <CombatDashboard />;
      case 'map': return <MapDashboard />;
      case 'npc': return <NPCDashboard />;
      case 'clock': return <ClockDashboard />;
      case 'ambient': return <AmbientDashboard />;
      case 'table': return <TableDashboard />;
      case 'web': return <WebDashboard />;
      case 'image': return <ImageDashboard />;
      case 'sound': return <SoundDashboard />;
      case 'light': return <LightDashboard />;
      case 'favorite': return <FavoriteDashboard />;
      case 'whiteboard': return <WhiteboardDashboard />;
      case 'debug': return <DebugDashboard />;
      case 'voice': return <VoiceDashboard />;
      case 'obsidian': return <ObsidianPanel />;
      case 'journal': return <JournalDashboard />;
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
        <RemoteControl />
      ) : isProjector ? (
        <ProjectorView />
      ) : isHub ? (
        <PlayerHub />
      ) : isTablet ? (
        <TabletHub />
      ) : (
        <>
          <GlobalKeybinds />
          <ModalProvider />
          <ToastProvider />
          <AudioRouter />
          <MediaBrowser isOpen={isMediaHubOpen} onClose={closeMediaHub} onSelect={() => {}} title="MEDIA HUB" />
          {showSplash && <SplashScreenSelector onComplete={() => setShowSplash(false)} />}
          <Shell>{renderModule()}</Shell>
        </>
      )}
    </Suspense>
  );
}

export default App;
