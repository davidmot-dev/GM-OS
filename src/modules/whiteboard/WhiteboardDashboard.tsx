import React from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import WhiteboardToolbar from './components/WhiteboardToolbar';
import { useWhiteboardStore } from './useWhiteboardStore';
import { 
    RotateCcw, 
    RotateCw, 
    Trash2, 
    Download,
    Cast
} from 'lucide-react';
import { gmCustom } from '../../stores/useModalStore';

const WhiteboardDashboard: React.FC = () => {
    const { 
        clearBoard, 
        undo, 
        redo,
        projectionTarget,
        clearProjectedState,
        backgroundMode
    } = useWhiteboardStore();

    const isLight = backgroundMode === 'light';

    return (
        <div className={`h-full w-full transition-colors duration-500 relative overflow-hidden flex flex-col ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            {/* Header / Info bar */}
            <div className={`flex items-center justify-between p-4 backdrop-blur-md border-b z-10 ${isLight ? 'bg-white/80 border-black/10' : 'bg-slate-900/50 border-white/5'}`}>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase">Whiteboard OS</h2>
                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Visual Brainstorming Module</p>
                    {projectionTarget && (
                        <div className="flex items-center gap-2 mt-1 py-1 px-2 bg-gm-cyan/10 border border-gm-cyan/20 rounded-md">
                            <Cast size={12} className="text-gm-cyan animate-pulse" />
                            <span className="text-[9px] font-black text-gm-cyan uppercase tracking-wider">Projection Active • {projectionTarget === 'hub' ? 'Player Hub' : 'Moniteur'}</span>
                            <button 
                                onClick={() => {
                                    if (projectionTarget === 'monitor' && window.appBridge?.image?.closeAllDisplays) {
                                        window.appBridge.image.closeAllDisplays();
                                    }
                                    clearProjectedState();
                                }}
                                className="ml-2 text-[8px] text-rose-400 hover:text-rose-300 font-bold uppercase transition-colors"
                            >
                                Arrêter
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => gmCustom('whiteboard-projection-select')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border font-black uppercase text-xs tracking-widest ${projectionTarget ? 'bg-slate-800 text-slate-400 border-white/5' : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border-indigo-500/20'}`}
                    >
                        <Cast size={14} />
                        Projeter
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={undo} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                        <RotateCcw size={18} />
                    </button>
                    <button onClick={redo} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                        <RotateCw size={18} />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={clearBoard} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/10">
                        <Trash2 size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gm-cyan/20 hover:bg-gm-cyan/30 text-gm-cyan text-xs font-black uppercase tracking-widest transition-all border border-gm-cyan/20">
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
                <DrawingCanvas />
                
                {/* Floating Toolbar */}
                <WhiteboardToolbar className="absolute left-6 top-1/2 -translate-y-1/2" />
            </div>

            {/* Decorative Grid Overlay (Subtle) */}
            <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-3xl m-4" />
        </div>
    );
};

export default WhiteboardDashboard;
