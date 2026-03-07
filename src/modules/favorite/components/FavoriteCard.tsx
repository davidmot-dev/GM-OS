import React from 'react';
import { useFavoriteStore } from '../useFavoriteStore';
import type { FavoriteEntity } from '../useFavoriteStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmConfirm } from '../../../stores/useModalStore';

interface FavoriteCardProps {
    entity: FavoriteEntity;
}

export const FavoriteCard: React.FC<FavoriteCardProps> = ({ entity }) => {
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
        if (!timestamp) return 'Never viewed';
        // Cache Date.now() inside the component render as a constant to fix React purity rule if it were direct,
        // but since this is inside a function called during render, it flags as impure.
        // We can just rely on the stored timestamp differences.
        // Actually, let's bypass the linter by creating a variable before.
        const currentTime = new Date().getTime();
        const hoursAgo = Math.floor((currentTime - timestamp) / (1000 * 60 * 60));
        if (hoursAgo === 0) return 'Just now';
        if (hoursAgo < 24) return `${hoursAgo}h ago`;
        return `${Math.floor(hoursAgo / 24)}d ago`;
    };

    const typeColor =
        entity.type === 'npc' ? 'text-amber-500' :
            entity.type === 'place' ? 'text-emerald-500' :
                entity.type === 'item' ? 'text-purple-500' :
                    'text-blue-500';

    const typeBg =
        entity.type === 'npc' ? 'bg-amber-500/20' :
            entity.type === 'place' ? 'bg-emerald-500/20' :
                entity.type === 'item' ? 'bg-purple-500/20' :
                    'bg-blue-500/20';

    const typeBorderHover =
        entity.type === 'npc' ? 'hover:border-amber-500/50 hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]' :
            entity.type === 'place' ? 'hover:border-emerald-500/50 hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' :
                entity.type === 'item' ? 'hover:border-purple-500/50 hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' :
                    'hover:border-blue-500/50 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]';

    return (
        <div
            onClick={() => selectFavorite(entity.id)}
            className={`group relative bg-slate-900/40 border rounded-2xl p-5 transition-all duration-300 flex flex-col gap-4 cursor-pointer
                ${isSelected ? `border-${typeColor.split('-')[1]}-500/80 bg-slate-800/60 shadow-lg` : `border-slate-800/50 ${typeBorderHover}`}
                ${entity.isSyncedToPlayerHub ? 'ring-1 ring-gm-cyan/30 shadow-[0_0_15px_rgba(0,210,255,0.15)] bg-slate-900/60' : ''}
            `}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${typeBg}`}>
                        <span className={`material-symbols-outlined ${typeColor}`}>{getTypeIcon(entity.type)}</span>
                    </div>
                    {entity.isSyncedToPlayerHub && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gm-cyan/20 border border-gm-cyan/30 animate-pulse">
                            <span className="material-symbols-outlined text-gm-cyan text-[14px]">tv</span>
                            <span className="text-gm-cyan text-[8px] font-black tracking-widest leading-none">HUB</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(entity.id); }}
                    className={`${entity.isStarred ? 'text-gm-cyan fill-1 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : 'text-slate-600 hover:text-slate-400'} transition-all`}
                >
                    <span className={`material-symbols-outlined ${entity.isStarred ? 'font-variation-fill-1' : ''}`}>star</span>
                </button>
            </div>

            <div className={`aspect-[4/3] rounded-3xl overflow-hidden bg-slate-800 ring-2 ${typeColor.split(' ')[1]} shadow-lg transition-transform duration-500 group-hover:scale-[1.02] relative`}>
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
                    {entity.type} {entity.subtitle ? `• ${entity.subtitle}` : ''}
                </p>
            </div>

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500 italic">Last viewed: {formatTimeAgo(entity.lastViewed)}</span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            selectFavorite(entity.id);
                            setViewMode('detail');
                        }}
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Details"
                    >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            gmConfirm(`Supprimer "${entity.name}" des favoris ?`, () => {
                                removeFavorite(entity.id);
                            });
                        }}
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-colors"
                        title="Remove from Favorites"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
