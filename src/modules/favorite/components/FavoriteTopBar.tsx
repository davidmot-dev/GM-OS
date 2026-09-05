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
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors text-xl">search</span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-app-surface/50 border-app-border focus:ring-1 focus:ring-accent focus:border-accent rounded-xl pl-10 py-2 text-sm transition-all placeholder:text-slate-600 outline-none text-slate-200"
                        placeholder={t('modules:favorite.topbar.search_placeholder')}
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-border hover:bg-app-surface/80 transition-colors text-sm font-semibold text-slate-300">
                    <span className="material-symbols-outlined text-lg">file_export</span>
                    {t('modules:favorite.topbar.export')}
                </button>
                <div className="h-6 w-[1px] bg-app-border mx-1"></div>
                <button className="p-2 rounded-xl text-slate-500 hover:bg-app-surface/80 hover:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
        </header>
    );
};
