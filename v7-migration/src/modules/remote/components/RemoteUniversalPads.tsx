import React from 'react';
import { type RemoteUniversalPad } from '../types/remote.types';

interface RemoteUniversalPadsProps {
    pads: RemoteUniversalPad[];
    onTrigger: (id: string) => void;
}

const RemoteUniversalPads: React.FC<RemoteUniversalPadsProps> = ({ 
    pads, 
    onTrigger 
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Multi-Deck Universal Pad</p>
                <div className="flex gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pads && pads.length > 0 ? (
                    pads.map(pad => (
                        <button
                            key={pad.id}
                            onClick={() => onTrigger(pad.id)}
                            className={`group relative overflow-hidden aspect-video rounded-[2rem] border transition-all duration-500 ${
                                pad.isActive 
                                    ? 'border-accent shadow-glow-accent/20 scale-[0.98]' 
                                    : 'border-white/5 hover:border-white/20'
                            }`}
                        >
                            {/* Background Image / Placeholder */}
                            {pad.imageUrl ? (
                                <img 
                                    src={pad.imageUrl} 
                                    alt={pad.label}
                                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${pad.isActive ? 'opacity-40' : 'opacity-20'}`} 
                                />
                            ) : (
                                <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                                    pad.isActive ? 'from-accent/40 to-transparent' : 'from-white/5 to-transparent'
                                }`} />
                            )}

                            {/* Content */}
                            <div className="relative h-full p-5 flex flex-col justify-end items-start gap-1">
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${pad.isActive ? 'text-accent' : 'text-slate-500'}`}>
                                    {pad.type}
                                </span>
                                <h3 className={`text-xs font-black uppercase leading-tight transition-colors ${pad.isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {pad.label}
                                </h3>
                                {pad.sublabel && (
                                    <span className="text-[9px] font-medium text-slate-500 line-clamp-1">{pad.sublabel}</span>
                                )}
                            </div>

                            {/* Active Indicator */}
                            {pad.isActive && (
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent shadow-glow-accent animate-ping" />
                            )}
                        </button>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-20 premium-glass rounded-[2rem] border border-white/5">
                        <p className="text-sm italic text-slate-500">Aucun pad configuré sur cet univers.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RemoteUniversalPads;
