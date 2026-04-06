import React from 'react';
import { 
    Pencil, 
    Eraser, 
    Square, 
    Circle, 
    Zap,
    Palette,
    Sun,
    Moon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWhiteboardStore, type WhiteboardTool } from '../useWhiteboardStore';

interface WhiteboardToolbarProps {
    className?: string;
}

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({ className = "" }) => {
    const { 
        currentTool, 
        setTool, 
        currentColor, 
        setColor,
        backgroundMode,
        setBackgroundMode
    } = useWhiteboardStore();

    const isLight = backgroundMode === 'light';

    const tools: { id: WhiteboardTool; icon: LucideIcon; label: string }[] = [
        { id: 'brush', icon: Pencil, label: 'Crayon' },
        { id: 'eraser', icon: Eraser, label: 'Gomme' },
        { id: 'laser', icon: Zap, label: 'Laser' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Cercle' },
    ];

    const colors = [
        isLight ? '#000000' : '#ffffff', // Black or White
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
    ];

    return (
        <div className={`flex flex-col gap-4 z-20 pointer-events-auto ${className}`}>
            {/* Tool Selection */}
            <div className={`flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${isLight ? 'bg-white/90 border-black/10' : 'bg-slate-900/80 border-white/10'}`}>
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
                        className={`p-3 rounded-xl transition-all relative group ${currentTool === tool.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-app-text/50 hover:text-white hover:bg-white/5'}`}
                        title={tool.label}
                    >
                        <tool.icon size={20} />
                        <div className="absolute left-full ml-4 px-2 py-1 rounded bg-accent text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                            {tool.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Background Toggle */}
            <div className={`flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${isLight ? 'bg-white/90 border-black/10' : 'bg-slate-900/80 border-white/10'}`}>
                <button
                    onClick={() => setBackgroundMode(isLight ? 'dark' : 'light')}
                    className={`p-3 rounded-xl transition-all relative group ${isLight ? 'text-amber-600 hover:bg-amber-600/10' : 'text-app-text/50 hover:text-accent hover:bg-white/5'}`}
                    title={isLight ? 'Mode Sombre' : 'Mode Clair'}
                >
                    {isLight ? <Sun size={20} /> : <Moon size={20} />}
                    <div className="absolute left-full ml-4 px-2 py-1 rounded bg-gm-violet text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                        {isLight ? 'Passer en Sombre' : 'Passer en Blanc'}
                    </div>
                </button>
            </div>

            {/* Color Palette */}
            <div className={`flex flex-col gap-2 p-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${isLight ? 'bg-white/90 border-black/10' : 'bg-slate-900/80 border-white/10'}`}>
                <div className={`p-2 ${isLight ? 'text-slate-600' : 'text-app-text/40'}`}>
                    <Palette size={16} />
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => setColor(color)}
                            className={`size-6 rounded-full transition-transform hover:scale-125 border ${isLight ? 'border-black/10' : 'border-white/10'} ${currentColor === color ? 'ring-2 ring-accent/60 ring-offset-2 ring-offset-app-bg scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WhiteboardToolbar;
