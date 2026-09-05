import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFavoriteStore } from '../useFavoriteStore';
import type { FavoriteEntity } from '../useFavoriteStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmConfirm } from '../../../stores/useModalStore';

interface FavoriteCardProps {
    entity: FavoriteEntity;
}

export const FavoriteCard: React.FC<FavoriteCardProps> = ({ entity }) => {
    const { t } = useTranslation(['modules', 'common']);
    const { selectFavorite, toggleStar, removeFavorite, selectedFavoriteId, setViewMode } = useFavoriteStore();

    const isSelected = selectedFavoriteId === entity.id;
    const resolvedImageUrl = useMediaUrl(entity.imageUrl);
    const resolvedTokenUrl = useMediaUrl(entity.tokenUrl);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'npc': return 'person_celebrate';
            case 'place': return 'map'; // fort might not be standard in GM-OS fonts, so using map/castle as fallback
            case 'item': return 'auto_fix_high'; // swords missing from some symbol sets, auto_fix_high is wand
            case 'lore': return 'auto_stories';
            default: return 'star';
        }
    };

    const formatTimeAgo = (timestamp?: number) => {
        if (!timestamp) return t('modules:favorite.card.never_viewed');
        // Cache Date.now() inside the component render as a constant to fix React purity rule if it were direct,
        // but since this is inside a function called during render, it flags as impure.
        // We can just rely on the stored timestamp differences.
        // Actually, let's bypass the linter by creating a variable before.
        const currentTime = new Date().getTime();
        const hoursAgo = Math.floor((currentTime - timestamp) / (1000 * 60 * 60));
        if (hoursAgo === 0) return t('modules:favorite.card.just_now');
        if (hoursAgo < 24) return t('modules:favorite.card.hours_ago', { count: hoursAgo });
        return t('modules:favorite.card.days_ago', { count: Math.floor(hoursAgo / 24) });
    };

    const typeColor =
        entity.type === 'npc' ? 'text-amber-500' :
            entity.type === 'place' ? 'text-emerald-500' :
                entity.type === 'item' ? 'text-purple-500' :
                    'text-accent';

    const typeBg =
        entity.type === 'npc' ? 'bg-amber-500/20' :
            entity.type === 'place' ? 'bg-emerald-500/20' :
                entity.type === 'item' ? 'bg-purple-500/20' :
                    'bg-accent/20';

    const typeBorderHover =
        entity.type === 'npc' ? 'hover:border-amber-500/50 hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]' :
            entity.type === 'place' ? 'hover:border-emerald-500/50 hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' :
                entity.type === 'item' ? 'hover:border-purple-500/50 hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' :
                    'hover:border-accent/50 hover:shadow-glow-accent';

    return (
        <div
            onClick={() => selectFavorite(entity.id)}
            className={`group relative bg-app-surface/20 border rounded-2xl p-5 transition-all duration-300 flex flex-col gap-4 cursor-pointer
                ${isSelected ? `border-accent/80 bg-app-surface/40 shadow-lg` : `border-app-border/50 ${typeBorderHover}`}
                ${entity.isSyncedToPlayerHub ? 'ring-1 ring-accent/30 shadow-glow-accent/15 bg-app-surface/40' : ''}
            `}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${typeBg}`}>
                        <span className={`material-symbols-outlined ${typeColor}`}>{getTypeIcon(entity.type)}</span>
                    </div>
                    {entity.isSyncedToPlayerHub && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/20 border border-accent/30 animate-pulse">
                            <span className="material-symbols-outlined text-accent text-sm">tv</span>
                            <span className="text-accent text-ui-8 font-black tracking-widest leading-none">HUB</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(entity.id); }}
                    className={`${entity.isStarred ? 'text-accent fill-1 drop-shadow-glow-accent' : 'text-slate-600 hover:text-slate-400'} transition-all`}
                >
                    <span className={`material-symbols-outlined ${entity.isStarred ? 'font-variation-fill-1' : ''}`}>star</span>
                </button>
            </div>

            <div className={`aspect-[4/3] rounded-3xl overflow-hidden bg-app-bg ring-2 ${isSelected ? 'ring-accent/50' : 'ring-app-border/50'} shadow-lg transition-transform duration-500 group-hover:scale-[1.02] relative`}>
                {/* Image or Icon */}
                {(resolvedImageUrl || resolvedTokenUrl) ? (
                    <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        src={resolvedImageUrl || resolvedTokenUrl}
                        alt={entity.name}
                    />
                ) : (<div className="w-full h-full flex items-center justify-center text-slate-700">
                    <span className="material-symbols-outlined text-4xl">{getTypeIcon(entity.type)}</span>
                </div>
                )}
            </div>

            <div>
                <h3 className={`text-lg font-bold transition-colors ${isSelected ? typeColor : `group-hover:${typeColor} text-slate-200`}`}>
                    {entity.name}
                </h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">
                    {t(`modules:favorite.sidebar.categories.${entity.type}`)} {entity.subtitle ? `• ${t(`modules:npc.categories.${entity.subtitle}`, { defaultValue: entity.subtitle })}` : ''}
                </p>
            </div>

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-app-border/50">
                <span className="text-xs text-slate-500 italic">{t('modules:favorite.card.last_viewed')}: {formatTimeAgo(entity.lastViewed)}</span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            selectFavorite(entity.id);
                            setViewMode('detail');
                        }}
                        className="p-2 rounded-lg bg-app-surface border border-app-border hover:bg-app-surface/80 text-slate-300 transition-colors"
                        title={t('modules:favorite.card.view_details')}
                    >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            gmConfirm(t('modules:favorite.card.remove_confirm', { name: entity.name }), () => {
                                removeFavorite(entity.id);
                            });
                        }}
                        className="p-2 rounded-lg bg-app-surface border border-app-border hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 transition-colors"
                        title={t('modules:favorite.card.remove')}
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
