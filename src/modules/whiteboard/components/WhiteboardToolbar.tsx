import React from 'react';
import { 
    Pencil, 
    Eraser, 
    Square, 
    Circle, 
    Zap,
    Palette,
    Sun,
    Moon,
    UserRound,
    Crosshair
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWhiteboardStore, type WhiteboardTool } from '../useWhiteboardStore';
import { useTranslation } from 'react-i18next';
import { PAPIER } from '../papierDuTableau';

interface WhiteboardToolbarProps {
    className?: string;
    /**
     * **Le poste du meneur** — refonte, L6 : il gagne le Pion et la Cible, et
     * ses couleurs passent dans le pied du tableau, avec l'épaisseur et la
     * règle (maquette retenue). Le Player Hub garde sa barre telle quelle.
     */
    meneur?: boolean;
}

/** Les couleurs du crayon : la première suit le papier, noire sur le clair, blanche sur le sombre. */
export const couleursDuTableau = (clair: boolean) => [
    clair ? '#000000' : '#ffffff', // Black or White
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
];

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({ className = "", meneur = false }) => {
    const { 
        currentTool, 
        setTool, 
        currentColor, 
        setColor,
        backgroundMode,
        setBackgroundMode
    } = useWhiteboardStore();
    const { t } = useTranslation('modules');

    const isLight = backgroundMode === 'light';
    const papier = PAPIER[isLight ? 'clair' : 'sombre'];

    const tools: { id: WhiteboardTool; icon: LucideIcon; label: string }[] = [
        { id: 'brush', icon: Pencil, label: t('whiteboard.tools.brush') },
        { id: 'eraser', icon: Eraser, label: t('whiteboard.tools.eraser') },
        { id: 'laser', icon: Zap, label: t('whiteboard.tools.laser') },
        { id: 'rect', icon: Square, label: t('whiteboard.tools.rect') },
        { id: 'circle', icon: Circle, label: t('whiteboard.tools.circle') },
        ...(meneur ? [
            { id: 'pion' as const, icon: UserRound, label: t('whiteboard.tools.pion') },
            { id: 'cible' as const, icon: Crosshair, label: t('whiteboard.tools.cible') },
        ] : []),
    ];

    const colors = couleursDuTableau(isLight);

    return (
        <div className={`flex flex-col gap-4 z-20 pointer-events-auto ${className}`}>
            {/* Tool Selection */}
            <div className={`flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${papier.panneau}`}>
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
                        className={`p-3 rounded-xl transition-all relative group ${currentTool === tool.id ? 'bg-accent text-app-on-accent shadow-lg shadow-accent/20' : papier.outil}`}
                        title={tool.label}
                    >
                        <tool.icon size={20} />
                        <div className="absolute left-full ml-4 px-2 py-1 rounded bg-accent text-ui-10 font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                            {tool.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Background Toggle */}
            <div className={`flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${papier.panneau}`}>
                <button
                    onClick={() => setBackgroundMode(isLight ? 'dark' : 'light')}
                    className={`p-3 rounded-xl transition-all relative group ${papier.bascule}`}
                    title={isLight ? t('whiteboard.background.title_dark') : t('whiteboard.background.title_light')}
                >
                    {isLight ? <Sun size={20} /> : <Moon size={20} />}
                    <div className="absolute left-full ml-4 px-2 py-1 rounded bg-gm-violet text-ui-10 font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                        {isLight ? t('whiteboard.background.switch_dark') : t('whiteboard.background.switch_light')}
                    </div>
                </button>
            </div>

            {!meneur && (<>
            {/* Color Palette */}
            <div className={`flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${papier.panneau}`}>
                <div className={`p-2 ${papier.icone}`}>
                    <Palette size={16} />
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => setColor(color)}
                            className={`size-6 rounded-full transition-transform hover:scale-125 border ${papier.tourDePastille} ${currentColor === color ? 'ring-2 ring-accent/60 ring-offset-2 ring-offset-app-bg scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
            </>)}
        </div>
    );
};

export default WhiteboardToolbar;
