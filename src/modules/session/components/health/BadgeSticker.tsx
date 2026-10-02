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
        minor: 'bg-etat-alerte/10 text-etat-alerte border-etat-alerte/30',
        major: 'bg-etat-alerte/20 text-etat-alerte border-etat-alerte/40',
        critical: 'bg-etat-danger/30 text-etat-danger border-etat-danger/50 shadow-[0_0_10px_rgba(225,29,72,0.3)]'
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
                    className="ml-1 opacity-10 group-hover:opacity-100 hover:text-app-text transition-opacity text-sm font-bold leading-none"
                    title="Dissiper/Supprimer"
                >
                    ×
                </button>
            )}
        </div>
    );
};
