import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Lightbulb } from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';
import { useAmbientStore, type AmbientTrackState } from '../useAmbientStore';
import { ambientEngine } from '../AmbientEngine';

interface AmbientTrackProps {
    track: AmbientTrackState;
    index: number;
    onRequestMediaBrowser: () => void;
}

const TrackVisualizer: React.FC<{ index: number; color: string; isPlaying: boolean }> = ({ index, color, isPlaying }) => {
    const [data, setData] = useState<Uint8Array>(new Uint8Array(16));
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const analyser = ambientEngine.tracks[index].getAnalyser();
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            if (isPlaying) {
                analyser.getByteFrequencyData(dataArray);
                setData(new Uint8Array(dataArray.slice(0, 16)));
                requestRef.current = requestAnimationFrame(update);
            }
        };

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(update);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [index, isPlaying]);


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
                    value={track.label}
                    onChange={(e) => updateTrack(index, { label: e.target.value })}
                    className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest text-app-text/50 text-center focus:text-app-text focus:outline-none"
                    placeholder="NOM DE PISTE"
                />
                <div className="text-[7px] font-black text-white/20 mt-0.5 uppercase tracking-tighter">[{track.id}]</div>

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
                <div className="flex items-center gap-1 text-[8px] font-mono text-app-text/60 font-bold uppercase">
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
                    className="text-[8px] font-bold text-app-text/50 hover:text-app-text hover:underline transition-all"
                >
                    {track.url ? "CHANGER" : "CHARGER"}
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
                    title={track.linkedLightSceneId ? "Lumière Liée" : "Lier une Lumière"}
                >
                    <Lightbulb size={12} fill={track.linkedLightSceneId ? "currentColor" : "none"} />
                </button>
            </div>
        </div>
    );
};

export default AmbientTrack;
