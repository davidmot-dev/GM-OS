import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Eye, Edit3, Lock, FilePenLine } from 'lucide-react';

const DoubleJournal: React.FC = () => {
    const { publicSummary, setPublicSummary, gmSecrets, setGmSecrets } = useSessionOSStore();

    return (
        <div className="flex-1 min-h-[400px] grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Public Summary */}
            <div className="bg-slate-900/40 rounded-xl border border-white/5 p-5 focus-within:ring-1 focus-within:ring-gm-gold/50 flex flex-col transition-all shadow-lg backdrop-blur-sm group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Eye className="text-slate-400" size={20} />
                        <h4 className="text-slate-100 font-bold text-sm tracking-wide">Public Summary</h4>
                    </div>
                    <button className="text-slate-500 hover:text-gm-gold transition-colors" title="Edit Mode">
                        <Edit3 size={16} />
                    </button>
                </div>

                <textarea
                    value={publicSummary}
                    onChange={(e) => setPublicSummary(e.target.value)}
                    className="flex-1 w-full bg-transparent border-none text-slate-400 text-sm leading-relaxed outline-none resize-none custom-scrollbar p-0 focus:ring-0"
                    placeholder="Enter public session notes here..."
                />
            </div>

            {/* GM Secrets */}
            <div className="bg-slate-900/40 rounded-xl border border-white/5 p-5 focus-within:ring-1 focus-within:ring-gm-gold/50 flex flex-col transition-all shadow-lg backdrop-blur-sm border-dashed border-slate-700/50 relative overflow-hidden group">
                {/* Background decorative icon */}
                <div className="absolute -top-4 -right-4 p-2 opacity-5 pointer-events-none">
                    <Lock size={120} className="text-gm-gold" />
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <Lock className="text-gm-gold" size={20} />
                        <h4 className="text-gm-gold font-bold text-sm tracking-wide">GM Secrets</h4>
                    </div>
                    <button className="text-slate-500 hover:text-gm-gold transition-colors" title="Edit Mode">
                        <FilePenLine size={16} />
                    </button>
                </div>

                <textarea
                    value={gmSecrets}
                    onChange={(e) => setGmSecrets(e.target.value)}
                    className="flex-1 w-full bg-transparent border-none text-slate-400 text-sm leading-relaxed outline-none resize-none custom-scrollbar p-0 focus:ring-0 relative z-10 border-l-2 border-gm-gold/40 pl-3"
                    placeholder="Enter private GM secrets, trap DCs, and hidden NPCs here..."
                />
            </div>

        </div>
    );
};

export default DoubleJournal;
