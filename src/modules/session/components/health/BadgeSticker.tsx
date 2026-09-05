import React from 'react';
import { type PersistenceBadge } from '../../useSessionOSStore';
import { ShieldAlert } from 'lucide-react';

interface BadgeStickerProps {
    badge: PersistenceBadge;
    onRemove?: () => void;
}

/**
 * BadgeSticker component
 * Visualizes a "Persistence Badge" (permanent injury or status).
 * v5 Styling: "Sticker" look with glow based on severity.
 */
export const BadgeSticker: React.FC<BadgeStickerProps> = ({ badge, onRemove }) => {
    const severityColors = {
        minor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
        major: 'bg-orange-600/20 text-orange-400 border-orange-500/40',
        critical: 'bg-rose-700/30 text-rose-500 border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.3)]'
    };

    return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md border text-ui-9 font-black uppercase tracking-wider ${severityColors[badge.severity]} transition-all hover:scale-105 group cursor-default select-none`}>
            <ShieldAlert size={10} className="shrink-0" />
            <div className="flex flex-col min-w-[50px]">
                <span className="truncate max-w-[80px]" title={badge.description}>{badge.label}</span>
                {badge.location && <span className="text-ui-7 opacity-60 italic tracking-normal">{badge.location}</span>}
            </div>
            {onRemove && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 opacity-10 group-hover:opacity-100 hover:text-white transition-opacity text-sm font-bold leading-none"
                    title="Dissiper/Supprimer"
                >
                    ×
                </button>
            )}
        </div>
    );
};
