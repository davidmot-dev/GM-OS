import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { type Entity } from '../../modules/session/store/types';

interface HubTrombinoscopeProps {
    npcs: Entity[];
    onSelectNpc: (npc: Entity) => void;
}

export const HubTrombinoscope: React.FC<HubTrombinoscopeProps> = ({ npcs, onSelectNpc }) => {
    return (
        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                        <Users className="text-accent" size={30} />
                        Trombinoscope
                    </h2>
                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-[0.5em]">Registre des individus et entités identifiés.</p>
                </div>
                <div className="flex gap-2">
                    <div className="text-[10px] font-black bg-accent/10 border border-accent/20 px-6 py-2 rounded-full text-accent uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        {npcs.length} Profils Répertoriés
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 place-items-start">
                    {npcs.map((npc, idx) => (
                        <button 
                            key={npc.id}
                            onClick={() => onSelectNpc(npc)}
                            type="button"
                            className={`group relative flex flex-col gap-4 p-4 rounded-[2.5rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-accent/30 transition-all duration-500 cursor-pointer animate-in fade-in zoom-in duration-500 delay-${Math.min(idx * 50, 500)} w-full`}
                        >
                            <div className="relative aspect-[3/4] w-full rounded-[2rem] overflow-hidden bg-app-bg shadow-xl">
                                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                                <ResolvedImage 
                                    src={npc.avatar} 
                                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
                                />
                                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    <div className="px-4 py-1.5 bg-accent/90 backdrop-blur-md rounded-full text-[8px] font-black text-app-bg uppercase tracking-widest">
                                        Inspecter
                                    </div>
                                </div>
                            </div>
                            <div className="px-1 text-center">
                                <h3 className="text-[11px] font-black text-app-text uppercase tracking-wider truncate mb-1">{npc.name}</h3>
                                <p className="text-[7px] font-black text-app-text/20 uppercase tracking-[0.2em]">{npc.role || 'Citoyen'}</p>
                            </div>
                            <div className="absolute top-2 right-2 p-2 bg-app-bg/60 backdrop-blur-md rounded-full border border-app-border/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Sparkles size={10} className="text-accent" />
                            </div>
                        </button>
                    ))}

                    {npcs.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-6 border border-dashed border-app-border/20 rounded-[3rem] bg-app-surface/20">
                            <div className="p-8 bg-app-surface/40 rounded-full border border-app-border/10">
                                <Users size={64} className="text-app-text/5" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-app-text/20">Aucun sujet identifié</p>
                                <p className="text-[10px] text-app-text/10 font-bold uppercase">En attente de transmission par le MJ</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
