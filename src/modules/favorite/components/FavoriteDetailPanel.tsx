import React from 'react';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteDetailPanel: React.FC = () => {
    const { favorites, selectedFavoriteId, selectFavorite } = useFavoriteStore();

    const entity = favorites.find(f => f.id === selectedFavoriteId);
    if (!entity) return null;

    const typeColor =
        entity.type === 'npc' ? 'text-amber-500 ring-amber-500/20' :
            entity.type === 'place' ? 'text-emerald-500 ring-emerald-500/20' :
                entity.type === 'item' ? 'text-purple-500 ring-purple-500/20' :
                    'text-blue-500 ring-blue-500/20';

    return (
        <aside className="w-96 bg-slate-900/80 backdrop-blur-xl border-l border-slate-800 p-8 overflow-y-auto hidden xl:flex flex-col gap-8 shrink-0 shadow-2xl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100">Details</h2>
                <button
                    onClick={() => selectFavorite(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className={`w-32 h-32 rounded-full ring-4 ${typeColor.split(' ')[1]} overflow-hidden bg-slate-800`}>
                        {entity.imageUrl ? (
                            <img className="w-full h-full object-cover" src={entity.imageUrl} alt={entity.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className={`material-symbols-outlined text-5xl ${typeColor.split(' ')[0]}`}>
                                    {entity.type === 'npc' ? 'person' : entity.type === 'place' ? 'map' : 'stars'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-100">{entity.name}</h3>
                        {entity.subtitle && (
                            <p className={`${typeColor.split(' ')[0]} font-semibold text-sm`}>{entity.subtitle}</p>
                        )}
                    </div>
                </div>

                {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(entity.attributes).map(([key, value]) => (
                            <div key={key} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{key}</p>
                                <p className="text-sm font-bold text-slate-200">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {entity.stats && Object.keys(entity.stats).length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Attributes</h4>
                        <div className="space-y-3">
                            {Object.entries(entity.stats).map(([stat, val]) => {
                                // Assume val is 0 to 100 for the visual bar (mocking D&D stats as percentages or raw numbers)
                                // We'll render 5 segment blocks
                                const blocks = 5;
                                const filledBlocks = Math.round((val / 100) * blocks);

                                return (
                                    <div key={stat} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">{stat}</span>
                                        <div className="flex gap-1">
                                            {Array.from({ length: blocks }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-6 h-1 rounded-full ${i < filledBlocks ? typeColor.replace('text-', 'bg-').split(' ')[0] : 'bg-slate-800'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {entity.lore && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Background Lore</h4>
                        <p className="text-sm text-slate-400 leading-relaxed italic">
                            {entity.lore}
                        </p>
                    </div>
                )}

                <div className="pt-6 mt-auto">
                    <button className="w-full py-3 bg-slate-200 hover:bg-white text-slate-900 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg">
                        OPEN FULL DOSSIER
                    </button>
                </div>
            </div>
        </aside>
    );
};
