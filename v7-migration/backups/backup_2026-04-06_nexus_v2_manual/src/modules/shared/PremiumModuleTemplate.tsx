import React from 'react';
import { 
  ArrowLeft, Save, Layout, Settings, 
  Info, type LucideIcon 
} from 'lucide-react';

/**
 * Interface pour les éléments de navigation de la sidebar
 */
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

/**
 * Template de base pour un module Premium GM-OS v5.
 * Copiez ce fichier pour démarrer un nouveau module avec le layout standard.
 */
export const PremiumModuleTemplate: React.FC = () => {
  // État de navigation
  const [activeSection, setActiveSection] = React.useState<string>('core');

  // Configuration de la navigation
  const navItems: NavItem[] = [
    { id: 'core', label: 'Général', icon: Layout, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'config', label: 'Configuration', icon: Settings, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'info', label: 'Informations', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  const handleBack = () => {
    console.log('Retour arrière...');
  };

  const handleSave = () => {
    console.log('Sauvegarde des modifications...');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0c] select-none font-inter text-app-text/90">
      
      {/* --- TOP PREMIUM BAR --- */}
      <div className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-cyan-500/40 transition-all shadow-lg hover:scale-105 active:scale-95 group"
            title="Retour"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black/40 text-center text-2xl flex items-center justify-center rounded-2xl border border-white/10 shadow-inner">
              ⭐
            </div>
            <div>
              <h1 className="text-xl font-black text-white italic tracking-tight">NOM DU MODULE</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  STANDARD V5.6
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:opacity-90 transition-all"
        >
          <Save size={16} /> Sauvegarder
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* --- SIDEBAR NAVIGATION --- */}
        <div className="w-24 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col items-center py-8 gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`group relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                activeSection === item.id 
                ? `${item.bg} ${item.color} shadow-lg ring-1 ring-white/10` 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
              title={item.label}
            >
              <item.icon size={22} className={`transition-transform duration-300 ${activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {activeSection === item.id && (
                <div className={`absolute -right-1 w-1 h-6 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`} />
              )}
            </button>
          ))}
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_40%)]">
          <div className="max-w-5xl mx-auto p-12 animate-fade-in">
            
            {/* Contenu conditionnel selon activeSection */}
            {activeSection === 'core' && (
              <div className="space-y-8">
                <header className="space-y-2 mb-10">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                    <Layout className="text-cyan-400" size={32} />
                    Section <span className="text-cyan-500/20 underline decoration-cyan-500/40">Générale</span>
                  </h2>
                  <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                    Description de la section et des fonctionnalités principales.
                  </p>
                </header>

                <div className="grid grid-cols-2 gap-8">
                  {/* Carte Premium Standard */}
                  <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block px-1">Exemple de Saisie</label>
                    <input 
                      type="text"
                      className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/10 font-mono text-base text-white focus:border-cyan-500/50 outline-none transition-all shadow-inner"
                      placeholder="Saisissez quelque chose..."
                    />
                  </div>

                  <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm flex flex-col justify-center">
                    <p className="text-[11px] text-slate-500 leading-relaxed italic px-2">
                       Conseil : Utilisez ces cartes pour regrouper les paramètres logiques par thématique.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ajoutez d'autres sections ici */}
            {activeSection !== 'core' && (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <Layout size={64} className="mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest">Section en construction...</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModuleTemplate;
