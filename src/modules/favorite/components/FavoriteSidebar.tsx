import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteSidebar: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { activeCategory, setCategory, addFavorite, selectFavorite, setViewMode } = useFavoriteStore();

    const handleNewEntry = () => {
        const newId = addFavorite({
            type: 'npc',
            name: t('modules:favorite.sidebar.categories.npc'), // Fallback to category name for new entry
            subtitle: t('common:standby'),
            isStarred: true,
            attributes: {},
            stats: {
                'Power': 50,
                'Defense': 50
            },
            lore: ''
        });
        selectFavorite(newId);
        setViewMode('detail');
    };

    return (
        <aside className="w-80 bg-app-surface/90 backdrop-blur-md border-r border-app-border p-6 flex flex-col gap-8 shrink-0">


            <nav className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-slate-500 text-ui-10 font-bold uppercase px-3 tracking-widest">{t('modules:favorite.sidebar.filters')}</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => setCategory('all')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'all' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-slate-400 hover:bg-app-surface/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-xl">grid_view</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.all')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('npc')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'npc' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-app-surface/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-xl ${activeCategory !== 'npc' && 'text-amber-500/70'}">person_celebrate</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.npc')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('place')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'place' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-slate-400 hover:bg-app-surface/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-xl ${activeCategory !== 'place' && 'text-emerald-500/70'}">map</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.place')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('item')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'item' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'text-slate-400 hover:bg-app-surface/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-xl ${activeCategory !== 'item' && 'text-purple-500/70'}">swords</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.item')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('lore')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'lore' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-slate-400 hover:bg-app-surface/50 hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-xl ${activeCategory !== 'lore' && 'text-accent/70'}">auto_stories</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.lore')}</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleNewEntry}
                    className="flex items-center justify-center gap-2 w-full bg-app-surface hover:bg-app-surface/80 text-white font-bold py-3 px-4 rounded-xl border border-app-border transition-all uppercase text-xs tracking-widest shadow-lg shadow-black/20"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    {t('modules:favorite.sidebar.new_entry')}
                </button>
            </nav>

            <div className="mt-auto flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-app-surface/50 border border-app-border/50">
                    <p className="text-xs text-slate-500 mb-2">{t('modules:favorite.sidebar.sync_status')}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-slate-300">{t('modules:favorite.sidebar.synced')}</span>
                    </div>
                </div>


            </div>
        </aside>
    );
};
