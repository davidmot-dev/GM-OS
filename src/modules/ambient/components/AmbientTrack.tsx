import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square, Volume2, Lightbulb, Trash2 } from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';
import { useAmbientStore, type AmbientTrackState } from '../useAmbientStore';
import { ambientEngine } from '../AmbientEngine';

interface AmbientTrackProps {
    track: AmbientTrackState;
    index: number;
    onRequestMediaBrowser: () => void;
}

const TrackVisualizer: React.FC<{ index: number; color: string; isPlaying: boolean }> = ({ index, color, isPlaying }) => {
    const [data, setData] = useState(new Uint8Array(16).fill(0));
    const rafRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!isPlaying) {
            setData(new Uint8Array(16).fill(0));
            return;
        }

        const update = () => {
            const track = ambientEngine.tracks[index];
            if (track) {
                const analyser = track.getAnalyser();
                const freqData = new Uint8Array(16);
                analyser.getByteFrequencyData(freqData);
                setData(freqData);
            }
            rafRef.current = requestAnimationFrame(update);
        };

        rafRef.current = requestAnimationFrame(update);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, index]);

    return (
        <div className="flex items-end justify-center gap-[2px] h-4 w-full px-2 overflow-hidden pointer-events-none opacity-50">
            {Array.from(data).map((v, i) => (
                <div
                    key={i}
                    className="w-[2px] rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(15, (v / 255) * 100)}%`, backgroundColor: color }}
                />
            ))}
        </div>
    );
};

const AmbientTrack: React.FC<AmbientTrackProps> = ({ track, index, onRequestMediaBrowser }) => {
    const { t } = useTranslation();
    const { toggleTrack, setTrackVolume, updateTrack } = useAmbientStore();

    const handleFileSelect = () => {
        onRequestMediaBrowser();
    };

    return (
        <div className={`relative group h-full flex flex-col items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${track.isPlaying
            ? 'bg-app-surface shadow-xl border-accent/30'
            : 'bg-app-surface/40 border-app-border hover:border-accent/40 hover:bg-app-surface/60'
            }`}>

            {/* Track Info */}
            <div className="w-full text-center">
                <input
                    type="text"
                    value={t(track.label, { index: index + 1 })}
                    onChange={(e) => updateTrack(index, { label: e.target.value })}
                    className="w-full bg-transparent text-ui-10 font-bold uppercase tracking-widest text-app-text/50 text-center focus:text-app-text focus:outline-none"
                    placeholder={t('modules:ambient.presets.tracks.default_track', { index: index + 1 }).toUpperCase()}
                />
                <div className="text-ui-7 font-black text-white/20 mt-0.5 uppercase tracking-tighter">[{track.id}]</div>

                {/* Visualizer */}
                <div className="mt-2">
                    <TrackVisualizer index={index} color={track.color} isPlaying={track.isPlaying} />
                </div>
            </div>

            {/* Play/Stop Button with Glow */}
            <button
                onClick={() => toggleTrack(index)}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 relative group/btn ${track.isPlaying
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-app-surface/80 text-app-text/50 border border-app-border hover:text-app-text hover:border-app-border/80'
                    }`}
                style={track.isPlaying ? { boxShadow: `0 0 20px -5px ${track.color}44`, borderColor: `${track.color}66`, color: track.color } : {}}
            >
                {track.isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}

                {/* Visual Feedback on Play */}
                {track.isPlaying && (
                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 pointer-events-none" style={{ backgroundColor: track.color }} />
                )}
            </button>

            {/* Vertical Slider Control */}
            <div className="flex-1 flex flex-col items-center gap-2 group/slider w-full">
                <div className="h-full relative w-6 bg-app-bg/80 rounded-full border border-app-border p-1 flex items-end">
                    {/* Fill Level */}
                    <div
                        className="w-full rounded-full transition-all duration-150"
                        style={{
                            height: `${track.volume * 100}%`,
                            backgroundColor: track.isPlaying ? track.color : 'var(--app-border)',
                            boxShadow: track.isPlaying ? `0 0 15px ${track.color}66` : 'none'
                        }}
                    />
                    {/* Native Slider (Vertical) */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={track.volume}
                        onChange={(e) => setTrackVolume(index, parseFloat(e.target.value))}
                        className="absolute inset-x-0 w-full h-full opacity-0 cursor-ns-resize"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' } as React.CSSProperties}
                    />

                </div>
                <div className="flex items-center gap-1 text-ui-8 font-mono text-app-text/60 font-bold uppercase">
                    <Volume2 size={10} />
                    {Math.round(track.volume * 100)}%
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                    type="color"
                    value={track.color}
                    onChange={(e) => updateTrack(index, { color: e.target.value })}
                    className="w-4 h-4 rounded-full bg-transparent border-none cursor-pointer overflow-hidden p-0"
                />
                <button
                    onClick={handleFileSelect}
                    className="text-ui-8 font-bold text-app-text/50 hover:text-app-text hover:underline transition-all"
                >
                    {track.url ? t('common:actions.change') : t('common:actions.load')}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        gmCustom('light-scene-select', { 
                            type: 'ambient', 
                            trackIndex: index 
                        });
                    }}
                    className={`p-1 rounded-full transition-all ${track.linkedLightSceneId ? 'text-gm-cyan bg-gm-cyan/10 drop-shadow-glow-cyan' : 'text-app-text/40 hover:text-gm-cyan hover:bg-gm-cyan/5'}`}
                    title={track.linkedLightSceneId ? t('modules:ambient.dashboard.linked_light') : t('modules:ambient.dashboard.link_light')}
                >
                    <Lightbulb size={12} fill={track.linkedLightSceneId ? "currentColor" : "none"} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (track.isPlaying) toggleTrack(index);
                        updateTrack(index, {
                            label: `modules:ambient.presets.tracks.default_track`,
                            url: '',
                            volume: 0.5,
                            linkedLightSceneId: undefined
                        });
                    }}
                    className="p-1 rounded-full text-app-text/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title={t('modules:ambient.dashboard.delete_track')}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

export default AmbientTrack;

