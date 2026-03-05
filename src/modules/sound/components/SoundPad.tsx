import React, { useState } from 'react';
import { useSoundStore, type SoundPad as ISoundPad } from '../useSoundStore';
import { soundEngine } from '../SoundEngine';

interface SoundPadProps {
    pad: ISoundPad;
}

const SoundPad: React.FC<SoundPadProps> = ({ pad }) => {
    const { id, title, filePath, volume, color, midiMapping, keyMapping, isActive, linkedLightSceneId } = pad;
    const { setPadActive, setPadVolume, isMidiLearnActive, isKeyLearnActive, activePadLearnId, setActiveLearnPad } = useSoundStore();

    // UI state
    const [progress, setProgress] = useState(0);

    // Auto-load audio buffer when file path is set
    React.useEffect(() => {
        if (filePath) {
            soundEngine.loadAudio(id, filePath);
        }
    }, [id, filePath]);

    const isLearningThis = activePadLearnId === id && (isMidiLearnActive || isKeyLearnActive);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setPadVolume(id, newVolume);

        // Update engine live if it's currently active
        // soundEngine.setVolume(pad.id, newVolume); - engine handles master, we need individual
        // Wait, SoundEngine does has a setVolume(padId, volume).
        soundEngine.setVolume(id, newVolume);
    };

    const togglePlayback = () => {
        if (isMidiLearnActive || isKeyLearnActive) {
            setActiveLearnPad(id);
            return;
        }

        if (!filePath) return;

        if (isActive) {
            // Stop
            setPadActive(id, false);
            soundEngine.stop(id);
            setProgress(0);
        } else {
            // Play
            setPadActive(id, true);

            // Dummy progress bar for now until we hook up actual AudioBuffer durations
            let p = 0;
            const interval = setInterval(() => {
                p += 2;
                if (p > 100) p = 100;
                setProgress(p);
            }, 100);

            soundEngine.play(id, volume, () => {
                setPadActive(id, false);
                setProgress(0);
                clearInterval(interval);
            });
        }
    };

    if (!filePath && !isLearningThis) {
        return (
            <div
                className={`relative h-44 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl flex items-center justify-center p-4 hover:border-slate-600 transition-all cursor-pointer ${isLearningThis ? `border-[${color}] shadow-[0_0_15px_${color}]` : ''}`}
                onClick={togglePlayback}
            >
                <span className="material-symbols-outlined text-slate-700 text-3xl">add</span>
            </div>
        );
    }

    const shortName = filePath ? filePath.split(/[/\\]/).pop() || '' : '';
    const keyLabel = keyMapping ? keyMapping.replace('Key', '').replace('Numpad', 'NUM ') : '';

    return (
        <div
            onClick={togglePlayback}
            className={`relative h-44 bg-slate-800/40 border-2 rounded-xl flex flex-col justify-between p-4 group cursor-pointer transition-all ${isActive ? 'shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'hover:border-slate-500'}`}
            style={{ borderColor: isActive || isLearningThis ? color : 'transparent' }}
        >
            <div className="flex justify-between items-start pointer-events-none">
                <span className="font-mono text-[10px] font-bold bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700" style={{ color: keyMapping ? color : undefined, borderColor: keyMapping ? `${color}40` : undefined }}>
                    {keyLabel || '-'}
                </span>

                <div className="flex space-x-1">
                    {linkedLightSceneId && (
                        <span className="material-symbols-outlined text-sm" style={{ color: color }}>lightbulb</span>
                    )}
                    {midiMapping && (
                        <span className="font-mono text-[8px] text-amber-500 ml-1">M:{midiMapping}</span>
                    )}
                </div>
            </div>

            <div className="text-center pb-2 pointer-events-none">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title || 'Unnamed Pad'}</h3>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{shortName}</p>
            </div>

            {/* Volume Slider - prevent click from triggering pad toggle */}
            <div
                className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
            >
                <input
                    className="vertical-slider"
                    max="1.5"
                    min="0"
                    step="0.05"
                    type="range"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '4px', height: '60px', WebkitAppearance: 'slider-vertical' }}
                />
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden pointer-events-none">
                <div
                    className="h-full transition-all duration-100"
                    style={{
                        width: isActive ? `${progress}%` : '0%',
                        backgroundColor: color,
                        boxShadow: isActive ? `0 0 10px ${color}` : 'none'
                    }}
                ></div>
            </div>
        </div>
    );
};

export default SoundPad;
