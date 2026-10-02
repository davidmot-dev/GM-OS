import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteSidebar: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { activeCategory, setCategory, addFavorite, selectFavorite, setViewMode, favorites } = useFavoriteStore();
    /*
      **Chaque filtre dit combien il contient** — la maquette retenue (refonte,
      L4, étape 2). Un filtre vide se reconnaît avant qu'on clique dessus.
    */
    const compte = (type: 'all' | 'npc' | 'place' | 'item' | 'lore') =>
        type === 'all' ? favorites.length : favorites.filter(f => f.type === type).length;
    const pastille = 'ml-auto font-mono text-xs font-bold opacity-70';

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
                    <p className="text-app-subtle text-ui-10 font-bold uppercase px-3 tracking-widest">{t('modules:favorite.sidebar.filters')}</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => setCategory('all')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'all' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-muted hover:bg-app-surface/50 hover:text-app-text'}`}>
                            <span className="material-symbols-outlined text-xl">grid_view</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.all')}</span>
                            <span className={pastille}>{compte('all')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('npc')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'npc' ? 'bg-gm-gold/10 text-gm-gold border border-gm-gold/20' : 'text-app-muted hover:bg-app-surface/50 hover:text-app-text'}`}>
                            <span className={`material-symbols-outlined text-xl ${activeCategory !== 'npc' ? 'text-gm-gold/70' : ''}`}>person_celebrate</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.npc')}</span>
                            <span className={pastille}>{compte('npc')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('place')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'place' ? 'bg-gm-emerald/10 text-gm-emerald border border-gm-emerald/20' : 'text-app-muted hover:bg-app-surface/50 hover:text-app-text'}`}>
                            <span className={`material-symbols-outlined text-xl ${activeCategory !== 'place' ? 'text-gm-emerald/70' : ''}`}>map</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.place')}</span>
                            <span className={pastille}>{compte('place')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('item')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'item' ? 'bg-gm-violet/10 text-gm-violet border border-gm-violet/20' : 'text-app-muted hover:bg-app-surface/50 hover:text-app-text'}`}>
                            <span className={`material-symbols-outlined text-xl ${activeCategory !== 'item' ? 'text-gm-violet/70' : ''}`}>swords</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.item')}</span>
                            <span className={pastille}>{compte('item')}</span>
                        </button>
                        <button
                            onClick={() => setCategory('lore')}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeCategory === 'lore' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-muted hover:bg-app-surface/50 hover:text-app-text'}`}>
                            <span className={`material-symbols-outlined text-xl ${activeCategory !== 'lore' ? 'text-accent/70' : ''}`}>auto_stories</span>
                            <span className="text-sm font-semibold leading-none">{t('modules:favorite.sidebar.categories.lore')}</span>
                            <span className={pastille}>{compte('lore')}</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleNewEntry}
                    className="flex items-center justify-center gap-2 w-full bg-app-surface hover:bg-app-surface/80 text-app-text font-bold py-3 px-4 rounded-xl border border-app-border transition-all uppercase text-xs tracking-widest shadow-lg shadow-app-bg/20"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    {t('modules:favorite.sidebar.new_entry')}
                </button>
            </nav>

            <div className="mt-auto flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-app-surface/50 border border-app-border/50">
                    <p className="text-xs text-app-subtle mb-2">{t('modules:favorite.sidebar.sync_status')}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-etat-succes animate-pulse"></div>
                        <span className="text-xs font-medium text-app-text">{t('modules:favorite.sidebar.synced')}</span>
                    </div>
                </div>


            </div>
        </aside>
    );
};
