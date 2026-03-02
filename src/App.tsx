import { useSessionStore } from './store/useSessionStore';
import Shell from './components/Shell';
import DiceBoard from './modules/dice/DiceBoard';
import MusicDashboard from './modules/music/MusicDashboard';
import CombatDashboard from './modules/combat/CombatDashboard';
import NPCDashboard from './modules/npc/NPCDashboard';
import MapDashboard from './modules/map/MapDashboard';
import SessionDashboard from './modules/session/SessionDashboard';
import ModalProvider from './components/ModalProvider';
import AudioRouter from './modules/music/components/AudioRouter';
import ClockDashboard from './modules/clock/ClockDashboard';
import AmbientDashboard from './modules/ambient/AmbientDashboard';
import TableDashboard from './modules/tables/TableDashboard';
import WebDashboard from './modules/web/WebDashboard';




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
  const { activeModule } = useSessionStore();

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


      default:

        return <PlaceholderModule name={activeModule} />;
    }
  };

  return (
    <>
      <ModalProvider />
      <AudioRouter />
      <Shell>
        {renderModule()}
      </Shell>
    </>
  );
}

export default App;
