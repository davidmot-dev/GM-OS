import React from 'react';
import { Volume2, X } from 'lucide-react';
import { type RemoteSound } from '../types/remote.types';

interface RemoteSoundboardProps {
    sounds: RemoteSound[];
    masterVolume: number;
    onVolumeChange: (vol: number) => void;
    onTrigger: (id: string) => void;
    onStopAll: () => void;
}

const RemoteSoundboard: React.FC<RemoteSoundboardProps> = ({ 
    sounds, 
    masterVolume, 
    onVolumeChange, 
    onTrigger, 
    onStopAll 
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 p-6 premium-glass rounded-[2.5rem]">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Volume Maître</span>
                    <span className="text-xs font-black text-accent">{Math.round(masterVolume * 100)}%</span>
                </div>
                <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent"
                    title="Volume Maître"
                    aria-label="Volume Maître"
                />
                <button 
                    onClick={onStopAll}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
                >
                    <X size={20} strokeWidth={3} />
                    <span className="text-xs font-black uppercase tracking-widest">STOP ALL SOUNDS</span>
                </button>
            </div>

            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Déclencheurs SFX</p>
                <div className="grid grid-cols-2 gap-3">
                    {sounds && sounds.length > 0 ? (
                        sounds.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => onTrigger(s.id)}
                                disabled={!s.active}
                                className={`p-6 border rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all ${
                                    s.active ? 'premium-glass text-white' : 'bg-black/20 border-white/5 text-white/20'
                                }`}
                            >
                                <Volume2 size={24} className={s.active ? 'text-rose-400' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight truncate w-full px-2">
                                    {s.title}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-10 text-slate-500 italic text-sm">
                            Chargement des sons...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemoteSoundboard;
