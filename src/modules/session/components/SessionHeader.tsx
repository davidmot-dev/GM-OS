import React from 'react';
import { Users, Sparkles, Hammer } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

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
        <header className="flex items-center justify-between h-16 premium-glass px-6 z-50 border-b-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            
            <div className="flex items-center gap-8 relative z-10">
                <div className="flex items-center gap-3 text-gm-gold">
                    <Users size={28} />
                    <h1 className="text-app-text text-lg font-bold tracking-tight">
                        Session OS <span className="text-gm-gold font-light opacity-80">
                            {getTitle()}
                        </span>
                    </h1>
                </div>
            </div>

            {/* Forge Tab Switcher */}
            {currentView === 'forge' && (
                <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl shadow-lg">
                    <button
                        onClick={() => setForgeMode('system')}
                        className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            forgeMode === 'system' ? 'bg-primary text-white shadow-glow-primary/40' : 'text-slate-300'
                        }`}
                    >
                        <Hammer size={12} /> System Forge
                    </button>
                    <button
                        onClick={() => setForgeMode('chronicle')}
                        className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            forgeMode === 'chronicle' ? 'bg-fuchsia-600 text-white shadow-glow-fuchsia/40' : 'text-slate-300'
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
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                    >
                        <Sparkles size={18} className="rotate-[-45deg]" />
                        Retour Cockpit
                    </button>
                )}
                <button
                    onClick={() => setIsOracleOpen(!isOracleOpen)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border nav-item-glow ${
                        isOracleOpen 
                            ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]' 
                            : 'bg-white/5 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    }`}
                    title="Consult the AI Oracle"
                >
                    <Sparkles size={18} className={isOracleOpen ? 'animate-pulse' : ''} />
                    Oracle
                </button>
                <button
                    onClick={() => setIsSnapshotModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
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
