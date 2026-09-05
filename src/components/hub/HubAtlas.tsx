import React from 'react';
import { Globe } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { type AtlasMap } from '../../modules/session/store/types';

interface HubAtlasProps {
    atlasMaps: AtlasMap[];
    onSelectMap: (map: AtlasMap) => void;
}

export const HubAtlas: React.FC<HubAtlasProps> = React.memo(({ atlasMaps, onSelectMap }) => {
    return (
        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                        <Globe className="text-accent" size={30} />
                        Atlas des Lieux Visités
                    </h2>
                    <p className="text-ui-10 text-app-text/30 font-bold uppercase tracking-[0.5em]">Cartographie des territoires explorés par le groupe.</p>
                </div>
                <div className="flex gap-2">
                    <div className="text-ui-10 font-black bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {atlasMaps.length} Lieux Découverts
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                    {atlasMaps.map((map, idx) => (
                        <button 
                            key={map.id}
                            onClick={() => onSelectMap(map)}
                            type="button"
                            className={`group text-left relative flex flex-col gap-5 p-5 rounded-[3rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-accent/30 transition-all duration-700 animate-in slide-in-from-bottom-8 duration-700 delay-${Math.min(idx * 70, 700)}`}
                        >
                            <div className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden bg-app-bg shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700 z-10" />
                                
                                {map.fileUrl ? (
                                    <ResolvedImage 
                                        src={map.fileUrl} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-app-surface/20">
                                        <Globe size={48} className="text-app-text/5 rotate-12" />
                                    </div>
                                )}

                                <div className="absolute top-4 right-4 z-20">
                                    <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-ui-7 font-black text-white/60 uppercase tracking-widest">
                                        {map.type}
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                                    <div className="px-6 py-2 bg-accent text-app-bg rounded-full text-ui-9 font-black uppercase tracking-[0.2em] shadow-glow-accent">
                                        Consulter l'Atlas
                                    </div>
                                </div>
                            </div>

                            <div className="px-2 space-y-2">
                                <h3 className="text-lg font-black text-app-text uppercase tracking-tight truncate group-hover:text-accent transition-colors duration-500">{map.name}</h3>
                                <p className="text-ui-10 font-serif text-app-text/40 leading-relaxed italic line-clamp-2">
                                    {map.narrativeDescription || "Documentation en attente..."}
                                </p>
                            </div>
                        </button>
                    ))}

                    {atlasMaps.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-app-border/20 rounded-[4rem] bg-app-surface/20">
                            <div className="p-12 bg-app-surface/40 rounded-full border border-app-border/10">
                                <Globe size={80} className="text-app-text/5 animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-black uppercase tracking-[0.4em] text-app-text/20">Territoires inconnus</p>
                                <p className="max-w-xs text-ui-10 text-app-text/10 font-bold uppercase leading-relaxed">
                                    Aucun lieu n'a encore été marqué comme visité par le Maître de Jeu.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
