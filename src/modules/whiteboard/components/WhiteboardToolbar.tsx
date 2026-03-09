import React from 'react';
import { 
    Pencil, 
    Eraser, 
    Square, 
    Circle, 
    Zap,
    Palette
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
        setColor 
    } = useWhiteboardStore();

    const tools: { id: WhiteboardTool; icon: LucideIcon; label: string }[] = [
        { id: 'brush', icon: Pencil, label: 'Crayon' },
        { id: 'eraser', icon: Eraser, label: 'Gomme' },
        { id: 'laser', icon: Zap, label: 'Laser' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Cercle' },
    ];

    const colors = [
        '#ffffff', // White
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
    ];

    return (
        <div className={`flex flex-col gap-4 z-20 ${className}`}>
            {/* Tool Selection */}
            <div className="flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
                        className={`p-3 rounded-xl transition-all relative group ${currentTool === tool.id ? 'bg-gm-violet text-white shadow-lg shadow-gm-violet/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        title={tool.label}
                    >
                        <tool.icon size={20} />
                        <div className="absolute left-full ml-4 px-2 py-1 rounded bg-gm-violet text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {tool.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Color Palette */}
            <div className="flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="p-2 text-slate-600">
                    <Palette size={16} />
                </div>
                <div className="grid grid-cols-2 gap-2 p-1">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => setColor(color)}
                            className={`size-6 rounded-full transition-transform hover:scale-125 border border-white/10 ${currentColor === color ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WhiteboardToolbar;
