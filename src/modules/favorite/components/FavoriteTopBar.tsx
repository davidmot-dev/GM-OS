import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFavoriteStore } from '../useFavoriteStore';

export const FavoriteTopBar: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { searchQuery, setSearchQuery } = useFavoriteStore();

    return (
        <header className="h-16 border-b border-app-border px-8 flex items-center justify-between gap-6 shrink-0 bg-app-bg/50 backdrop-blur-sm z-10">
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle group-focus-within:text-accent transition-colors text-xl">search</span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-app-surface/50 border-app-border focus:ring-1 focus:ring-accent focus:border-accent rounded-xl pl-10 py-2 text-sm transition-all placeholder:text-app-subtle outline-none text-app-text"
                        placeholder={t('modules:favorite.topbar.search_placeholder')}
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-border hover:bg-app-surface/80 transition-colors text-sm font-semibold text-app-text">
                    <span className="material-symbols-outlined text-lg">file_export</span>
                    {t('modules:favorite.topbar.export')}
                </button>
                <div className="h-6 w-[1px] bg-app-border mx-1"></div>
                <button className="p-2 rounded-xl text-app-subtle hover:bg-app-surface/80 hover:text-app-text transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
        </header>
    );
};
