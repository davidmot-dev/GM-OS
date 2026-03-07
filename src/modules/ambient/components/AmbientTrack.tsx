import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
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
            ? 'bg-slate-900 shadow-[0_0_30px_rgba(30,41,59,0.5)] border-slate-700'
            : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60'
            }`}>

            {/* Track Info */}
            <div className="w-full text-center">
                <input
                    type="text"
                    value={track.label}
                    onChange={(e) => updateTrack(index, { label: e.target.value })}
                    className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center focus:text-white focus:outline-none"
                    placeholder="NOM DE PISTE"
                />

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
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700 hover:text-white hover:border-slate-500'
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
                <div className="h-full relative w-6 bg-slate-950/80 rounded-full border border-slate-800 p-1 flex items-end">
                    {/* Fill Level */}
                    <div
                        className="w-full rounded-full transition-all duration-150"
                        style={{
                            height: `${track.volume * 100}%`,
                            backgroundColor: track.isPlaying ? track.color : '#475569',
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
                <div className="flex items-center gap-1 text-[8px] font-mono text-slate-600 font-bold uppercase">
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
                    className="text-[8px] font-bold text-slate-500 hover:text-white hover:underline transition-all"
                >
                    {track.url ? "CHANGER" : "CHARGER"}
                </button>
            </div>
        </div>
    );
};

export default AmbientTrack;
