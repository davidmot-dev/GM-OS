import React, { useState, useEffect } from 'react';
import { useSoundStore, type SoundPad as ISoundPad } from '../useSoundStore';
import { soundEngine } from '../SoundEngine';
import { soundController } from '../SoundController';
import { gmCustom, gmPrompt, gmConfirm } from '../../../stores/useModalStore';
import { Plus, Zap, Keyboard, Lightbulb, Volume2, MoreHorizontal, Edit2, Trash2, RefreshCcw } from 'lucide-react';

interface SoundPadProps {
    pad: ISoundPad;
    onAssignMedia: (padId: string) => void;
}

const SoundPad: React.FC<SoundPadProps> = ({ pad, onAssignMedia }) => {
    const { id, title, filePath, volume, color, midiMapping, keyMapping, isActive, linkedLightSceneId } = pad;
    const { setPadVolume, isMidiLearnActive, isKeyLearnActive, activePadLearnId, setActiveLearnPad, renamePad, clearPad } = useSoundStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // UI state
    const [progress, setProgress] = useState(0);

    // Auto-load audio buffer when file path is set
    useEffect(() => {
        if (filePath) {
            soundEngine.loadAudio(id, filePath);
        }
    }, [id, filePath]);

    // React to isActive changes (even from MIDI/Keyboard) to show progress
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive) {
            let p = 0;
            interval = setInterval(() => {
                p += 2;
                if (p > 100) p = 100;
                setProgress(p);
            }, 100);
        }

        return () => {
            if (interval) clearInterval(interval);
            // Reset progress on cleanup (when isActive becomes false)
            setProgress(0);
        };
    }, [isActive]);

    const isLearningThis = activePadLearnId === id && (isMidiLearnActive || isKeyLearnActive);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setPadVolume(id, newVolume);
        soundEngine.setVolume(id, newVolume);
    };

    const togglePlayback = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMidiLearnActive || isKeyLearnActive) {
            setActiveLearnPad(id);
            return;
        }

        if (!filePath) {
            onAssignMedia(id);
            return;
        }

        soundController.togglePad(id, onAssignMedia);
    };

    if (!filePath && !isLearningThis) {
        return (
            <div
                className="relative h-44 bg-app-surface/20 border-2 border-dashed border-app-border/50 rounded-2xl flex flex-col items-center justify-center p-4 hover:border-app-border/20 hover:bg-app-surface/5 transition-all cursor-pointer group shadow-lg"
                onClick={togglePlayback}
            >
                <div className="size-12 rounded-full bg-app-surface/20 flex items-center justify-center text-app-text/40 group-hover:text-white group-hover:scale-110 transition-all border border-app-border/20 group-hover:bg-accent/40">
                    <Plus size={24} />
                </div>
                <span className="mt-4 text-[9px] font-black text-app-text/30 uppercase tracking-[0.2em] group-hover:text-app-text/60">Empty Pad</span>
            </div>
        );
    }

    const shortName = filePath ? filePath.split(/[/\\]/).pop() || '' : '';
    const keyLabel = keyMapping ? keyMapping.replace('Key', '').replace('Numpad', 'NUM ') : '';

    return (
        <div
            onClick={togglePlayback}
            className={`relative h-44 bg-app-bg/40 backdrop-blur-md border border-app-border/40 rounded-2xl flex flex-col justify-between p-5 group cursor-pointer transition-all duration-300 shadow-xl overflow-hidden ${isActive ? 'shadow-glow-accent ring-1 ring-accent/30' : 'hover:border-app-border/20 hover:bg-app-surface/5'}`}
            style={{ 
                borderColor: isActive ? color : isLearningThis ? 'var(--gm-violet)' : 'var(--app-border)',
                backgroundColor: isActive ? `${color}15` : undefined
            }}
        >
            {/* Header: Key & MIDI */}
            <div className="flex justify-between items-start pointer-events-none z-10">
                <div 
                    className={`px-2 py-1 rounded-lg border text-[9px] font-black tracking-tighter shadow-sm transition-colors ${keyMapping ? 'bg-accent text-white border-white/20' : 'bg-app-bg/60 text-app-text/40 border-app-border'}`}
                >
                    {keyLabel || <Keyboard size={10} />}
                </div>

                <div className="flex items-center gap-1.5 bg-app-bg/60 px-2 py-1 rounded-lg border border-app-border/30">
                    {linkedLightSceneId && (
                        <div className="flex items-center gap-1 text-accent animate-pulse">
                            <Lightbulb size={10} fill="currentColor" className="drop-shadow-glow-accent" />
                            <span className="text-[7px] font-black uppercase tracking-widest hidden group-hover:block">Light Linked</span>
                        </div>
                    )}
                    {midiMapping ? (
                        <span className="text-[9px] font-black text-amber-500">#{midiMapping}</span>
                    ) : (
                        <Zap size={10} className="text-slate-600" />
                    )}
                </div>

                {/* More Menu Trigger */}
                <div 
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }}
                    className="absolute top-2 right-2 size-8 flex items-center justify-center text-app-text/40 hover:text-white hover:bg-white/10 rounded-full transition-all pointer-events-auto opacity-0 group-hover:opacity-100 z-30"
                >
                    <MoreHorizontal size={16} />
                </div>
            </div>

            {/* Content: Title & File */}
            <div className="text-center pointer-events-none z-10">
                <h3 className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {title || 'Unnamed Sound'}
                </h3>
                <p className="text-[9px] font-bold text-app-text/30 mt-1.5 truncate max-w-[120px] mx-auto opacity-40 italic">
                    {shortName}
                </p>
            </div>

            {/* Volume Slider - Floating with glassmorphism */}
            <div
                className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-app-bg/80 backdrop-blur-md p-2 rounded-full border border-app-border shadow-2xl flex flex-col items-center gap-2">
                    <Volume2 size={10} className="text-app-text/40" />
                    <input
                        className="vertical-slider appearance-none bg-white/10 h-20 w-1 rounded-full outline-none cursor-pointer"
                        max="1.5"
                        min="0"
                        step="0.05"
                        type="range"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                </div>
            </div>

            {/* Progress Bar & Footer */}
            <div className="space-y-2 z-10 pointer-events-none">
                <div className="w-full bg-app-bg/60 h-1.5 rounded-full border border-app-border overflow-hidden">
                    <div
                        className="h-full transition-all duration-100 relative"
                        style={{
                            width: isActive ? `${progress}%` : '0%',
                            backgroundColor: color,
                            boxShadow: isActive ? `0 0 15px ${color}` : 'none'
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Background Glow when active */}
            {isActive && (
                <div 
                    className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 bg-gradient-to-t from-current to-transparent pointer-events-none"
                    style={{ color: color }}
                />
            )}

            {isMenuOpen && (
                <div className="absolute inset-0 bg-app-bg/98 z-50 flex flex-col items-center justify-center p-5 gap-2 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} className="text-[10px] font-black text-app-text/40 mb-2 hover:text-white uppercase tracking-[0.2em] transition-colors">Retour</button>
                    
                    <div className="w-full grid grid-cols-2 gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                gmPrompt('Renommer le Pad', title, (newTitle) => renamePad(id, newTitle));
                                setIsMenuOpen(false);
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-app-border bg-app-surface/50 text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:border-accent transition-all"
                        >
                            <Edit2 size={12} /> Renommer
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssignMedia(id);
                                setIsMenuOpen(false);
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-app-border bg-app-surface/50 text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:border-accent transition-all"
                        >
                            <RefreshCcw size={12} /> Remplacer
                        </button>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            gmCustom('light-scene-select', { 
                                type: 'sound', 
                                padId: id 
                            });
                            setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${linkedLightSceneId ? 'bg-accent/20 border-accent text-accent shadow-glow-accent' : 'bg-app-surface/50 border-app-border hover:bg-accent/10 hover:border-accent'}`}
                    >
                        <Lightbulb size={12} /> {linkedLightSceneId ? 'Lumière Liée' : 'Lier Lumière'}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            gmConfirm('Effacer ce pad ?', () => clearPad(id));
                            setIsMenuOpen(false);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
                    >
                        <Trash2 size={12} /> Effacer Pad
                    </button>
                </div>
            )}
        </div>
    );
};

export default SoundPad;
