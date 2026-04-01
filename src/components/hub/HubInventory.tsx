import React from 'react';
import { Package } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { type FavoriteEntity } from '../../modules/favorite/useFavoriteStore';

interface HubInventoryProps {
    items: FavoriteEntity[];
    onSelectItem: (item: FavoriteEntity) => void;
}

export const HubInventory: React.FC<HubInventoryProps> = ({ items, onSelectItem }) => {
    return (
        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                        <Package className="text-accent" size={30} />
                        Inventaire Personnel
                    </h2>
                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-[0.5em]">Trésors, reliques et objets du groupe.</p>
                </div>
                <div className="flex gap-2">
                    <div className="text-[10px] font-black bg-amber-500/10 border border-amber-500/20 px-6 py-2 rounded-full text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {items.length} Objets
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 place-items-start">
                    {items.map((item, idx) => (
                        <button 
                            key={item.id}
                            onClick={() => onSelectItem(item)}
                            type="button"
                            className={`group text-left relative flex flex-col gap-4 p-4 rounded-[2.5rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-amber-500/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${Math.min(idx * 50, 500)} w-full`}
                        >
                            <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-app-bg shadow-xl flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                                {item.imageUrl ? (
                                    <ResolvedImage 
                                        src={item.imageUrl} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                    />
                                ) : (
                                    <Package className="text-app-text/20" size={64} />
                                )}
                                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    <div className="px-4 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                                        Inspecter
                                    </div>
                                </div>
                            </div>
                            <div className="px-1 text-center space-y-1">
                                <h3 className="text-[11px] font-black text-app-text uppercase tracking-wider truncate border-b border-app-border/10 pb-2">{item.name}</h3>
                                {item.subtitle && (
                                    <p className="text-[8px] font-bold text-accent/60 uppercase tracking-widest truncate">{item.subtitle}</p>
                                )}
                            </div>
                        </button>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-app-border/20 rounded-[4rem] bg-app-surface/20 w-full">
                            <div className="p-12 bg-app-surface/40 rounded-full border border-app-border/10">
                                <Package size={80} className="text-app-text/5" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-black uppercase tracking-[0.4em] text-app-text/20">Inventaire Vide</p>
                                <p className="max-w-xs text-[10px] text-app-text/10 font-bold uppercase leading-relaxed">
                                    Aucun objet assigné à votre personnage.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
