import { useSessionStore } from './store/useSessionStore';
import Shell from './components/Shell';
import DiceBoard from './modules/dice/DiceBoard';
import MusicDashboard from './modules/music/MusicDashboard';
import CombatDashboard from './modules/combat/CombatDashboard';
import NPCDashboard from './modules/npc/NPCDashboard';
import MapDashboard from './modules/map/MapDashboard';
import SessionDashboard from './modules/session/SessionDashboard';
import ModalProvider from './components/ModalProvider';
import ToastProvider from './components/ToastProvider';
import AudioRouter from './modules/music/components/AudioRouter';
import ClockDashboard from './modules/clock/ClockDashboard';
import AmbientDashboard from './modules/ambient/AmbientDashboard';
import TableDashboard from './modules/tables/TableDashboard';
import WebDashboard from './modules/web/WebDashboard';




import ImageDashboard from './modules/image/ImageDashboard';
import ProjectorView from './modules/image/components/ProjectorView';
import PlayerHub from './components/PlayerHub';
import SoundDashboard from './modules/sound/SoundDashboard';
import LightDashboard from './modules/light/LightDashboard';
import WhiteboardDashboard from './modules/whiteboard/WhiteboardDashboard';
import { FavoriteDashboard } from './modules/favorite/components/FavoriteDashboard';
import DebugDashboard from './modules/debug/DebugDashboard';
import { GlobalKeybinds } from './components/GlobalKeybinds';
import VoiceDashboard from './modules/voice/VoiceDashboard';
import { useModalStore } from './stores/useModalStore';
import { MediaBrowser } from './components/MediaBrowser';
import { useState, useEffect } from 'react';
import SplashScreenSelector from './components/splash/SplashScreenSelector';

// App.tsx entry point

const PlaceholderModule = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-700" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight">Module {name}</h2>
    <p className="text-slate-400 max-w-md">
      Ce module est en cours d'intégration. Nous allons bientôt y importer vos designs Stitch et votre logique métier.
    </p>
  </div>
);


function App() {
  const { activeModule, theme } = useSessionStore();
  const { isMediaHubOpen, closeMediaHub } = useModalStore();
  const [showSplash, setShowSplash] = useState(true);

  // Apply theme to the root HTML element for global CSS overrides
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <SessionDashboard />;
      case 'dice':
        return <DiceBoard />;
      case 'music':
        return <MusicDashboard />;
      case 'combat':
        return <CombatDashboard />;
      case 'map':
        return <MapDashboard />;
      case 'npc':
        return <NPCDashboard />;
      case 'clock':
        return <ClockDashboard />;
      case 'ambient':
        return <AmbientDashboard />;
      case 'table':
        return <TableDashboard />;
      case 'web':
        return <WebDashboard />;
      case 'image':
        return <ImageDashboard />;
      case 'sound':
        return <SoundDashboard />;
      case 'light':
        return <LightDashboard />;
      case 'favorite':
        return <FavoriteDashboard />;
      case 'whiteboard':
        return <WhiteboardDashboard />;
      case 'debug':
        return <DebugDashboard />;
      case 'voice':
        return <VoiceDashboard />;

      default:

        return <PlaceholderModule name={activeModule} />;
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const isProjector = searchParams.get('window') === 'projector';
  const isHub = searchParams.get('window') === 'hub';

  if (isProjector) {
    return <ProjectorView />;
  }

  if (isHub) {
    return <PlayerHub />;
  }

  return (
    <>
      <GlobalKeybinds />
      <ModalProvider />
      <ToastProvider />
      <AudioRouter />
      <MediaBrowser
        isOpen={isMediaHubOpen}
        onClose={closeMediaHub}
        onSelect={() => { }} // Standalone mode, just for management
        title="MEDIA HUB - GESTION GLOBALE"
      />
      {showSplash && <SplashScreenSelector onComplete={() => setShowSplash(false)} />}
      <Shell>
        {renderModule()}
      </Shell>
    </>
  );
}

export default App;
