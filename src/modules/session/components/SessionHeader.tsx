import React from 'react';
import { Users, Sparkles, Hammer } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';

interface SessionHeaderProps {
    isOracleOpen: boolean;
    setIsOracleOpen: (open: boolean) => void;
    setIsSnapshotModalOpen: (open: boolean) => void;
    forgeMode: 'system' | 'chronicle';
    setForgeMode: (mode: 'system' | 'chronicle') => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
    isOracleOpen,
    setIsOracleOpen,
    setIsSnapshotModalOpen,
    forgeMode,
    setForgeMode
}) => {
    const { currentView, setCurrentView } = useSessionOSStore();
    const { theme } = useSessionStore();

    const getTitle = () => {
        switch (currentView) {
            case 'cockpit': return 'Master Cockpit';
            case 'timeline-wiki': return 'Chroniques';
            case 'forge': return 'System Forge';
            case 'templates': return 'Bibliothèque des Fiches';
            case 'social-graph': return 'Social Nexus (Graphe Social)';
            default: return currentView.replace('-', ' ');
        }
    };

    return (
        <header className={`flex items-center justify-between h-16 px-6 z-50 border-b-0 relative transition-all duration-500 ${
            theme === 'medieval' ? 'bg-app-surface/90 border-b-2 border-app-border/40' : 'premium-glass'
        }`}>
            <div className={`absolute inset-0 bg-gradient-to-r via-transparent pointer-events-none ${
                theme === 'medieval' ? 'from-accent/5 to-accent/5' : 'from-cyan-500/5 to-cyan-500/5'
            }`} />
            
            <div className="flex items-center gap-8 relative z-10">
                <div className={`flex items-center gap-3 ${theme === 'medieval' ? 'text-accent' : 'text-gm-gold'}`}>
                    <Users size={28} className={theme === 'medieval' ? 'opacity-80' : ''} />
                    <h1 className={`text-app-text text-lg tracking-[0.15em] uppercase ${
                        theme === 'medieval' ? 'font-display' : 'font-bold tracking-tight'
                    }`}>
                        {theme === 'medieval' ? 'GRIMOIRE' : 'Session'} <span className="text-accent opacity-80">OS</span>
                        <span className={`ml-4 ${
                            theme === 'medieval' ? 'text-accent/40 font-display text-sm italic' : 'text-gm-gold font-light opacity-80'
                        }`}>
                            {getTitle()}
                        </span>
                    </h1>
                </div>
            </div>

            {/* Forge Tab Switcher */}
            {currentView === 'forge' && (
                <div className={`flex p-1 bg-app-surface/50 border border-app-border/50 shadow-lg ${
                    theme === 'medieval' ? 'rounded-md' : 'rounded-xl'
                }`}>
                    <button
                        onClick={() => setForgeMode('system')}
                        className={`px-6 py-1.5 transition-all flex items-center gap-2 ${
                            theme === 'medieval' ? 'rounded-sm text-[11px] font-display tracking-widest' : 'rounded-lg text-[10px] font-black uppercase tracking-widest'
                        } ${
                            forgeMode === 'system' ? 'bg-accent text-white shadow-glow-accent' : 'text-app-text/60'
                        }`}
                    >
                        <Hammer size={12} /> System Forge
                    </button>
                    <button
                        onClick={() => setForgeMode('chronicle')}
                        className={`px-6 py-1.5 transition-all flex items-center gap-2 ${
                            theme === 'medieval' ? 'rounded-sm text-[11px] font-display tracking-widest' : 'rounded-lg text-[10px] font-black uppercase tracking-widest'
                        } ${
                            forgeMode === 'chronicle' ? 'bg-fuchsia-600/80 text-white shadow-glow-fuchsia/40' : 'text-app-text/60'
                        }`}
                    >
                        <Sparkles size={12} /> Chronicle Forge
                    </button>
                </div>
            )}

            <div className="flex gap-3">
                {currentView !== 'cockpit' && (
                    <button
                        onClick={() => setCurrentView('cockpit')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm transition-all shadow-lg border ${
                            theme === 'medieval' ? 'font-display tracking-wider rounded-md border-app-border/60 bg-app-surface/80' : 'font-bold rounded-lg border-app-border/50 bg-app-surface/50'
                        } text-app-text hover:bg-app-surface hover:text-accent`}
                    >
                        <Sparkles size={18} className="rotate-[-45deg]" />
                        {theme === 'medieval' ? 'RETOUR AU CONSEIL' : 'Retour Cockpit'}
                    </button>
                )}
                <button
                    onClick={() => setIsOracleOpen(!isOracleOpen)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-sm transition-all border nav-item-glow ${
                        theme === 'medieval' ? 'font-display tracking-widest rounded-md' : 'font-bold rounded-lg'
                    } ${
                        isOracleOpen 
                            ? 'bg-accent text-white border-accent shadow-glow-accent' 
                            : `bg-app-surface/50 text-accent border-accent/30 hover:bg-accent/10 hover:border-accent/50 hover:shadow-glow-accent/20`
                    }`}
                    title="Consult the AI Oracle"
                >
                    <Sparkles size={18} className={isOracleOpen ? 'animate-pulse' : ''} />
                    Oracle
                </button>
                <button
                    onClick={() => setIsSnapshotModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                        theme === 'medieval' 
                            ? 'bg-emerald-800/20 text-emerald-300 border-emerald-800/40 hover:bg-emerald-800/30' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                    title="Capturer l'état actuel"
                >
                    <Sparkles size={18} />
                    Snapshot
                </button>
            </div>
        </header>
    );
};

export default SessionHeader;
