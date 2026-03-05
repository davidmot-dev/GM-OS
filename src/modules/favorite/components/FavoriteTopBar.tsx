import React from 'react';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteTopBar: React.FC = () => {
    const { searchQuery, setSearchQuery } = useFavoriteStore();

    return (
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between gap-6 shrink-0 bg-slate-950/50 backdrop-blur-sm z-10">
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gm-cyan transition-colors text-[20px]">search</span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border-slate-800 focus:ring-1 focus:ring-gm-cyan focus:border-gm-cyan rounded-xl pl-10 py-2 text-sm transition-all placeholder:text-slate-600 outline-none text-slate-200"
                        placeholder="Search the Pantheon..."
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800/80 transition-colors text-sm font-semibold text-slate-300">
                    <span className="material-symbols-outlined text-[18px]">file_export</span>
                    Export
                </button>
                <div className="h-6 w-[1px] bg-slate-800 mx-1"></div>
                <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-800/80 hover:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
        </header>
    );
};
