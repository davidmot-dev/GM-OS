import React from 'react';
import { Play } from 'lucide-react';
import { type RemoteMoment } from '../types/remote.types';

interface RemoteStoryboardProps {
    moments: RemoteMoment[];
    onTrigger: (index: number) => void;
}

const RemoteStoryboard: React.FC<RemoteStoryboardProps> = ({ moments, onTrigger }) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Séquences de Session</p>
            <div className="space-y-3">
                {moments.length > 0 ? (
                    moments.map((m, i) => (
                        <button 
                            key={m.id}
                            onClick={() => onTrigger(i)}
                            className="w-full p-6 premium-glass border border-accent/20 rounded-3xl flex items-center justify-between active:bg-accent active:text-app-bg transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black italic opacity-20">{(i + 1).toString().padStart(2, '0')}</span>
                                <span className="font-bold uppercase tracking-tight text-left text-app-text group-active:text-app-bg">{m.name}</span>
                            </div>
                            <Play size={24} fill="currentColor" className="text-accent group-active:text-app-bg" />
                        </button>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500 italic text-sm">
                        Aucune séquence détectée.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RemoteStoryboard;
