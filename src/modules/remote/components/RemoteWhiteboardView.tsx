import React from 'react';
import { 
    Pencil, 
    Eraser, 
    Square, 
    Circle, 
    Zap,
    RotateCcw,
    RotateCw,
    Trash2
} from 'lucide-react';
import RemoteDrawingCanvas from './RemoteDrawingCanvas';
import { type DrawingPath, type Point, type WhiteboardTool } from '../types/remote.types';

interface RemoteWhiteboardViewProps {
    whiteboard: {
        paths: DrawingPath[];
        activePath: DrawingPath | null;
        laserPointer: Point | null;
        backgroundMode: 'dark' | 'light';
        currentTool: WhiteboardTool;
        currentColor: string;
        currentWidth: number;
    };
    onAction: (type: string, payload: unknown) => void;
}

const RemoteWhiteboardView: React.FC<RemoteWhiteboardViewProps> = ({ whiteboard, onAction }) => {
    const { backgroundMode, currentTool, currentColor } = whiteboard;
    const isLight = backgroundMode === 'light';

    const tools = [
        { id: 'brush', icon: Pencil, label: 'Crayon' },
        { id: 'eraser', icon: Eraser, label: 'Gomme' },
        { id: 'laser', icon: Zap, label: 'Laser' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: Circle, label: 'Cercle' },
    ];

    const colors = [
        isLight ? '#000000' : '#ffffff',
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
    ];

    return (
        <div className={`h-full w-full flex flex-col relative overflow-hidden rounded-xl border border-white/10 ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
            {/* Toolbar (Top) */}
            <div className={`flex items-center justify-between p-2 border-b backdrop-blur-md ${isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-white/10'}`}>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => onAction('whiteboard:set-tool', tool.id)}
                            className={`p-2 rounded-lg transition-all ${currentTool === tool.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                            title={tool.label}
                            aria-label={tool.label}
                        >
                            <tool.icon size={18} />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => onAction('whiteboard:undo', null)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Annuler" aria-label="Annuler">
                        <RotateCcw size={16} />
                    </button>
                    <button onClick={() => onAction('whiteboard:redo', null)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Rétablir" aria-label="Rétablir">
                        <RotateCw size={16} />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button onClick={() => onAction('whiteboard:clear', null)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Effacer tout" aria-label="Effacer tout">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="aspect-video w-full max-h-[55vh] md:max-h-[60vh] relative bg-slate-900/40 rounded-xl overflow-hidden shadow-inner border border-white/5">
                <RemoteDrawingCanvas 
                    whiteboard={whiteboard} 
                    onAction={onAction} 
                />
            </div>

            {/* Color Bar (Bottom) */}
            <div className={`flex items-center gap-2 p-2 border-t overflow-x-auto no-scrollbar justify-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-white/10'}`}>
                {colors.map((color) => (
                    <button
                        key={color}
                        onClick={() => onAction('whiteboard:set-color', color)}
                        className={`size-6 rounded-full border transition-transform shrink-0 ${currentColor === color ? 'scale-125 ring-2 ring-accent ring-offset-2 ring-offset-slate-900' : 'border-white/10 hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        title={`Couleur ${color}`}
                        aria-label={`Choisir la couleur ${color}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default RemoteWhiteboardView;
