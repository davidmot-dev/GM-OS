import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFavoriteStore } from '../useFavoriteStore';
import { FavoriteCard } from './FavoriteCard';

export const FavoriteGrid: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { favorites, activeCategory, searchQuery } = useFavoriteStore();

    // Filter logic
    const filteredFavorites = favorites.filter((fav) => {
        // Category filter
        if (activeCategory !== 'all' && fav.type !== activeCategory) {
            return false;
        }

        // Search text
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const matchesName = fav.name.toLowerCase().includes(query);
            const matchesSubtitle = fav.subtitle?.toLowerCase().includes(query);
            const matchesLore = fav.lore?.toLowerCase().includes(query);

            if (!matchesName && !matchesSubtitle && !matchesLore) {
                return false;
            }
        }

        return true;
    });

    if (filteredFavorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-app-border rounded-3xl mt-8">
                <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">search_off</span>
                <p className="text-xl font-bold text-slate-500">{t('modules:favorite.sections.no_dossier')}</p>
                <p className="text-sm text-slate-600 mt-2">{t('modules:favorite.grid.no_results_sub')}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((fav) => (
                <FavoriteCard key={fav.id} entity={fav} />
            ))}
        </div>
    );
};
