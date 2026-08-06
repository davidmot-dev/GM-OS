import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useSessionStore } from './store/useSessionStore';
import Shell from './components/Shell';
import { useModalStore } from './stores/useModalStore';
import SplashScreenSelector from './components/splash/SplashScreenSelector';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingOverlay from './components/common/LoadingOverlay';

// --- STORES (Safe for Web) ---
// Les stores propres au traitement des actions distantes sont désormais
// importés par les handlers, dans modules/remote/actions.
import { useMapStore } from './modules/map/useMapStore';
import { useCombatStore } from './modules/combat/useCombatStore';
import { useSessionOSStore } from './modules/session/useSessionOSStore';
import { useAIStore } from './stores/useAIStore';
import { useLightStore } from './modules/light/useLightStore';
import { BootstrapService } from './modules/system/logic/BootstrapService';
import { useHydration } from './hooks/useHydration';
import { useHueAutoConnect } from './modules/light/hooks/useHueAutoConnect';
import { useDisplayDetection } from './hooks/useDisplayDetection';
import { useNexusSynchronizer } from './modules/remote/hooks/useNexusSynchronizer';
import { crossWindowSync } from './services/CrossWindowEventService';
import { dispatchRemoteAction } from './modules/remote/actions';
import { isMainWindow } from './utils/windowRole';

interface RemoteAction {
  type: string;
  payload?: any;
}

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
const MessageAlertOverlay = lazy(() => import('./modules/session/components/MessageAlertOverlay').then(m => ({ default: m.MessageAlertOverlay })));
const BrainstormOverlay = lazy(() => import('./modules/forge/rules/components/BrainstormOverlay').then(m => ({ default: m.BrainstormOverlay })));

const PlaceholderModule = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-700" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight">Module {name}</h2>
  </div>
);

function App() {
  const { activeModule, theme } = useSessionStore();
  const sessionOSStore = useSessionOSStore();
  const { activeCampaignId } = sessionOSStore;
  const { isMediaHubOpen, closeMediaHub } = useModalStore();
  const { syncWithKeychain: syncAIKeys } = useAIStore();
  const { syncWithKeychain: syncHueKeys } = useLightStore();
  const [showSplash, setShowSplash] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const isProjector = searchParams.get('window') === 'projector';
  const isHub = searchParams.get('window') === 'hub';
  const isTablet = searchParams.get('window') === 'tablet';

  // Workspace Sync v3: Modularized via useNexusSynchronizer
  // Même définition que celle qui gouverne la persistance (utils/windowRole) :
  // la fenêtre MJ est la seule à posséder les données de campagne.
  const isMainPC = isMainWindow();
  const isHydrated = useHydration();
  const isSystemReady = useSessionStore(state => state.isSystemReady);
  
  // Nexus Sync Engine Integration
  const { handleSync } = useNexusSynchronizer(isMainPC);

  // Le système est "prêt" si hydraté et (si Main PC) si le bootstrap est fini
  const isAppReady = isHydrated && (isMainPC ? isSystemReady : true);

  useDisplayDetection(isMainPC);
  
  // --- AUTO-CONNECT HUE BRIDGES (GM SEULEMENT) ---
  useHueAutoConnect(isMainPC);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isMainPC && isHydrated) {
      syncAIKeys();
      syncHueKeys();
    }
  }, [isMainPC, isHydrated, syncAIKeys, syncHueKeys]);

  // --- BOOTSTRAP DU SYSTÈME (GM SEULEMENT) ---
  useEffect(() => {
    if (isMainPC && isHydrated && !isSystemReady) {
      BootstrapService.bootstrap();
    }
  }, [isMainPC, isHydrated, isSystemReady]);

  // --- CROSS-WINDOW SYNC (BroadcastChannel) ---
  useEffect(() => {
    if (isHydrated) {
      crossWindowSync.init(isMainPC);
      if (isHub || isTablet || isProjector) {
        crossWindowSync.notifyReady();
      }
    }
  }, [isHydrated, isMainPC, isHub, isTablet, isProjector]);

  // --- MESSAGING BRIDGE (GM SIDE) ---
  useEffect(() => {
    if (!isMainPC) return;

    const handleSendMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (window.appBridge?.remote?.broadcastUIAction) {
        window.appBridge.remote.broadcastUIAction({
          type: 'session:receive-message',
          payload: customEvent.detail
        });
      }
    };

    window.addEventListener('session:send-message', handleSendMessage);
    return () => window.removeEventListener('session:send-message', handleSendMessage);
  }, [isMainPC]);

  const handleAction = useCallback((data: RemoteAction) => {
    dispatchRemoteAction(data, { activeCampaignId, sync: handleSync });
  }, [activeCampaignId, handleSync]);


  // Handle Remote Sync and Actions (Only on Main PC Window)
  useEffect(() => {
    const bridge = window.appBridge;
    if (!bridge?.remote || !isMainPC) return;

    // Synchroniser automatiquement la carte si le Combat-OS change (pour l'invisibilité des jetons liés)
    const unsubscribeCombat = useCombatStore.subscribe((state, prevState) => {
      if (state.combatants !== prevState.combatants) {
        useMapStore.getState().syncToPlayers();
      }
    });

    bridge.on('remote:request-sync', (_event) => {
        handleSync(true);
    });

    bridge.on('remote:sync-clients', (_event, clients: import('./types/shared').ClientContext[]) => {
        if (!clients || !Array.isArray(clients)) return;
        const locks: Record<string, string> = {};
        clients.forEach(c => {
            if ((c.status === 'active' || c.status === 'ghost') && c.characterId) {
                locks[c.characterId] = c.deviceId;
            }
        });
        useSessionOSStore.getState().setCharacterLocks(locks);
    });
    
    bridge.remote.removeActions();
    const cleanupAction = bridge.remote.onAction(handleAction);

    return () => {
      cleanupAction();
      unsubscribeCombat();
      console.log('[App] Remote action listeners removed.');
    };
  }, [handleSync, isMainPC, handleAction]);

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

  const pathname = window.location.pathname.toLowerCase();
  const isProjectorView = searchParams.get('window') === 'projector' || pathname.includes('/projector');
  const isHubView = searchParams.get('window') === 'hub' || pathname.includes('/player-hub');
  const isTabletView = searchParams.get('window') === 'tablet' || pathname.includes('/tablet-hub');
  const isRemoteView = searchParams.get('window') === 'remote' || pathname.includes('/remote');

  if (!isAppReady) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center">
      <div className="text-cyan-500 font-mono animate-pulse">GM-OS BOOTING...</div>
    </div>;
  }

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
          
          <Suspense fallback={null}>
            <MessageAlertOverlay />
            <BrainstormOverlay />
          </Suspense>
          
          <Shell>{renderModule()}</Shell>
        </>
      )}
    </Suspense>
  );
}

export default App;
