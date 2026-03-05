import React from 'react';
import { FavoriteSidebar } from './FavoriteSidebar';
import { FavoriteTopBar } from './FavoriteTopBar';
import { FavoriteGrid } from './FavoriteGrid';
import { FavoriteDetailPanel } from './FavoriteDetailPanel';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteDashboard: React.FC = () => {
    const { selectedFavoriteId } = useFavoriteStore();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
            {/* Sidebar (col-span-3 equivalent in fixed width) */}
            <FavoriteSidebar />

            {/* Main Workspace (col-span-9 equivalent in flex-1) */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
                <FavoriteTopBar />

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
                        <section>
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight">Favorite Entities</h2>
                                    <p className="text-slate-400 mt-1">A curated collection of your most critical campaign elements.</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>Sort by:</span>
                                    <button className="flex items-center gap-1 text-gm-cyan hover:text-gm-cyan/80 transition-colors">
                                        Recent <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mosaic Card Grid */}
                            <FavoriteGrid />
                        </section>
                    </div>
                </div>
            </main>

            {/* Attribute Glass Panel */}
            {selectedFavoriteId && (
                <FavoriteDetailPanel />
            )}
        </div>
    );
};
