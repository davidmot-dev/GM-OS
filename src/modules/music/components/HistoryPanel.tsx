import React from 'react';
import { History, Terminal, Clock } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';

const HistoryPanel: React.FC = () => {
    const { history, consoleLogs } = useMusicStore();

    return (
        <div className="h-full flex flex-col divide-y divide-slate-800/50">
            {/* History Section */}
            <div className="flex-1 min-h-0 flex flex-col p-4">
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <History size={14} className="text-gm-violet" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest">Dernières Pistes</h3>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                    {history.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">Aucun historique</p>
                    ) : (
                        history.map((track, i) => (
                            <div
                                key={`${track}-${i}`}
                                className="flex items-center gap-3 group animate-in slide-in-from-left-2 duration-300"
                                style={{ opacity: 1 - (i * 0.08) }}
                            >
                                <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-gm-violet transition-colors" />
                                <span className="text-xs text-slate-300 truncate font-medium group-hover:text-white transition-colors">
                                    {track}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Console Logs Section */}
            <div className="h-48 flex flex-col p-4 bg-slate-950/20">
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <Terminal size={14} className="text-gm-violet" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest">Console Système</h3>
                </div>

                <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1 custom-scrollbar">
                    {consoleLogs.length === 0 ? (
                        <p className="text-slate-700 italic">Initialisation du moteur...</p>
                    ) : (
                        consoleLogs.map((log, i) => (
                            <div key={i} className="text-slate-400 border-l border-slate-800 pl-2 py-0.5 hover:bg-slate-800/30 transition-colors">
                                <span className="text-gm-violet opacity-60 mr-2 opacity-50">
                                    <Clock size={8} className="inline mr-1" />
                                </span>
                                {log.replace(/^\[.*?\]\s*/, '')}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPanel;
