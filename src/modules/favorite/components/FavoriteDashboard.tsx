import React from 'react';
import { FavoriteSidebar } from './FavoriteSidebar';
import { FavoriteTopBar } from './FavoriteTopBar';
import { FavoriteGrid } from './FavoriteGrid';
import { FavoriteDetailPanel } from './FavoriteDetailPanel';
import { FavoriteFullDossier } from './FavoriteFullDossier';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteDashboard: React.FC = () => {
    const { selectedFavoriteId, viewMode } = useFavoriteStore();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-app-bg font-sans text-slate-100 antialiased">
            {/* Sidebar (col-span-3 equivalent in fixed width) */}
            <FavoriteSidebar />

            {/* Main Workspace (col-span-9 equivalent in flex-1) */}
            <main className="flex flex-1 flex-col">
                {viewMode === 'grid' && <FavoriteTopBar />}

                {/* Main Content Area */}
                <div className={`flex flex-1 min-h-0 ${viewMode === 'grid' ? 'flex-col overflow-y-auto custom-scrollbar' : 'flex-col'}`}>
                    {viewMode === 'grid' ? (
                        <div className="p-8 flex flex-col gap-8 max-w-6xl mx-auto">
                            <section>
                                <div className="flex items-end justify-between mb-6">
                                    <div>
                                        <h2 className="text-3xl font-extrabold tracking-tight">Favorite Entities</h2>
                                        <p className="text-slate-400 mt-1">A curated collection of your most critical campaign elements.</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Sort by:</span>
                                        <button className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors">
                                            Recent <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Mosaic Card Grid */}
                                <FavoriteGrid />
                            </section>
                        </div>
                    ) : (
                        <FavoriteFullDossier key={selectedFavoriteId || 'none'} />
                    )}
                </div>
            </main>

            {/* Attribute Glass Panel */}
            {selectedFavoriteId && viewMode === 'grid' && (
                <FavoriteDetailPanel key={selectedFavoriteId} />
            )}
        </div>
    );
};
