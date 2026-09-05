import React from 'react';
import { History, Terminal, Clock } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';

const HistoryPanel: React.FC = () => {
    const { history, consoleLogs } = useMusicStore();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 bg-slate-900/60 rounded-3xl border border-white/5 p-6 backdrop-blur-md">
            {/* History Section (Left) */}
            <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <div className="size-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                        <History size={14} />
                    </div>
                    <h3 className="text-ui-10 font-bold uppercase tracking-widest">Track History</h3>
                </div>

                <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar pr-2">
                    {history.length === 0 ? (
                        <p className="text-ui-10 text-slate-600 italic">No history recorded yet...</p>
                    ) : (
                        history.map((track, i) => (
                            <div
                                key={`${track}-${i}`}
                                className="flex items-center gap-3 group animate-in slide-in-from-left-2 duration-300 py-1 border-b border-white/[0.02]"
                                style={{ opacity: 1 - (i * 0.1) }}
                            >
                                <div className="size-1.5 rounded-full bg-slate-700 group-hover:bg-teal-500 transition-colors" />
                                <span className="text-xs text-slate-400 truncate font-medium group-hover:text-white transition-colors">
                                    {track}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Console Logs Section (Right) */}
            <div className="flex flex-col min-h-0 border-l border-white/5 pl-6">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Terminal size={14} />
                    </div>
                    <h3 className="text-ui-10 font-bold uppercase tracking-widest">System Interface Log</h3>
                </div>

                <div className="max-h-[120px] overflow-y-auto font-mono text-ui-10 space-y-1 custom-scrollbar pr-4 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                    {consoleLogs.length === 0 ? (
                        <p className="text-slate-700 italic">Engine initializing...</p>
                    ) : (
                        consoleLogs.map((log, i) => (
                            <div key={i} className="text-slate-500 flex items-start gap-2 py-0.5 border-l-2 border-primary/20 pl-2 hover:bg-white/[0.02] transition-colors rounded-sm">
                                <span className="text-primary/40 shrink-0">
                                    <Clock size={10} className="inline mr-1" />
                                </span>
                                <span className="break-all">{log.replace(/^\[.*?\]\s*/, '')}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPanel;

