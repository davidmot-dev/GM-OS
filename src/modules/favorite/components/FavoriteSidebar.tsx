import React from 'react';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteSidebar: React.FC = () => {
    const { activeCategory, setCategory } = useFavoriteStore();

    return (
        <aside className="w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 p-6 flex flex-col gap-8 shrink-0">
            <div className="flex flex-col gap-1">
                <h1 className="text-gm-cyan text-xl font-bold tracking-tight">PANTHEON HUB</h1>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Master Control OS</p>
            </div>

            <nav className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-slate-500 text-[10px] font-bold uppercase px-3 tracking-widest">Library Filters</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => setCategory('all')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'all' ? 'bg-gm-cyan/10 text-gm-cyan border border-gm-cyan/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-[20px]">grid_view</span>
                            <span className="text-sm font-semibold leading-none">All Entities</span>
                        </button>
                        <button
                            onClick={() => setCategory('npc')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'npc' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-[20px] ${activeCategory !== 'npc' && 'text-amber-500/70'}">person_celebrate</span>
                            <span className="text-sm font-semibold leading-none">NPCs</span>
                        </button>
                        <button
                            onClick={() => setCategory('place')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'place' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-[20px] ${activeCategory !== 'place' && 'text-emerald-500/70'}">map</span>
                            <span className="text-sm font-semibold leading-none">Places</span>
                        </button>
                        <button
                            onClick={() => setCategory('item')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'item' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-[20px] ${activeCategory !== 'item' && 'text-purple-500/70'}">swords</span>
                            <span className="text-sm font-semibold leading-none">Items</span>
                        </button>
                        <button
                            onClick={() => setCategory('lore')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'lore' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-[20px] ${activeCategory !== 'lore' && 'text-blue-500/70'}">auto_stories</span>
                            <span className="text-sm font-semibold leading-none">Lore</span>
                        </button>
                    </div>
                </div>

                <button className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-black/20">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    New Entry
                </button>
            </nav>

            <div className="mt-auto flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                    <p className="text-xs text-slate-500 mb-2">Cloud Sync Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-slate-300">Vault Synced</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gm-cyan to-amber-200"></div>
                    <div>
                        <p className="text-sm font-bold leading-none text-slate-200">GameMaster_One</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase">Local Mode</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
