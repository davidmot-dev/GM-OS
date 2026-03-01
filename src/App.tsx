import { useState } from 'react';
import Shell from './components/Shell';
import type { ModuleID } from './components/Shell';

// Component for the Dashboard module
const Dashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Campaign</h3>
        <p className="text-2xl font-bold">Obsidian & Slate</p>
      </div>
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Current Scene</h3>
        <p className="text-2xl font-bold text-blue-400">The Whispering Spire</p>
      </div>
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Players Online</h3>
        <p className="text-2xl font-bold text-emerald-400">4 / 5</p>
      </div>
    </div>

    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm h-96 flex items-center justify-center">
      <p className="text-slate-500 italic">Quick access widgets will appear here...</p>
    </div>
  </div>
);

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
  const [activeModule, setActiveModule] = useState<ModuleID>('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      default:
        return <PlaceholderModule name={activeModule} />;
    }
  };

  return (
    <Shell activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderModule()}
    </Shell>
  );
}

export default App;
