import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square, Lightbulb, Trash2 } from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';
import { useAmbientStore, type AmbientTrackState } from '../useAmbientStore';
import { ambientEngine } from '../AmbientEngine';

interface AmbientTrackProps {
    track: AmbientTrackState;
    index: number;
    onRequestMediaBrowser: () => void;
}

const SILENCE_VISUEL = new Uint8Array(16);

const TrackVisualizer: React.FC<{ index: number; color: string; isPlaying: boolean }> = ({ index, color, isPlaying }) => {
    const lecture = useMemo(() => ({ index, isPlaying }), [index, isPlaying]);
    const [mesure, setMesure] = useState<{ lecture: typeof lecture; data: Uint8Array } | null>(null);
    const data = isPlaying && mesure?.lecture === lecture ? mesure.data : SILENCE_VISUEL;

    useEffect(() => {
        const { index, isPlaying } = lecture;
        if (!isPlaying) return;
        let vivant = true;
        let frame: number;

        const update = () => {
            if (!vivant) return;
            const track = ambientEngine.tracks[index];
            if (track) {
                const analyser = track.getAnalyser();
                const freqData = new Uint8Array(16);
                analyser.getByteFrequencyData(freqData);
                setMesure({ lecture, data: freqData });
            }
            frame = requestAnimationFrame(update);
        };

        frame = requestAnimationFrame(update);
        return () => {
            vivant = false;
            cancelAnimationFrame(frame);
        };
    }, [lecture]);

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

    /*
      **La tranche de console — refonte, L2, étape 2 (2026-10-02).** La
      maquette retenue le 2026-09-27 répond à *« l'interface est un peu
      austère »* : chaque piste est une tranche, comme sur une console —
      lecture, curseur, **le niveau en gros chiffres, lisible de loin**, et
      sous lui « Vider » et « Lier lumière », visibles sans survol. Une piste
      vide est éteinte, et ne propose qu'une chose : « Choisir ».
    */
    const vide = !track.url;
    const libelle = t(track.label, { index: index + 1 });

    return (
        <div className={`relative group flex h-full flex-col items-center gap-3 rounded-2xl border p-2.5 transition-all duration-300 ${track.isPlaying
            ? 'bg-app-surface shadow-xl'
            : vide ? 'bg-app-surface/20 border-app-border/50' : 'bg-app-surface/40 border-app-border hover:border-accent/40'
            }`}
            style={track.isPlaying ? { borderColor: `${track.color}88`, boxShadow: `0 0 18px -6px ${track.color}66` } : undefined}
        >
            {/* L'en-tête : le numéro, le nom, la couleur */}
            <div className="w-full text-center">
                <div className="flex items-center justify-center gap-1.5">
                    <span className={`text-ui-8 font-black uppercase tracking-widest ${track.isPlaying ? 'text-accent' : 'text-app-subtle'}`}>
                        Piste {String(index + 1).padStart(2, '0')}
                    </span>
                    <input
                        type="color"
                        value={track.color}
                        onChange={(e) => updateTrack(index, { color: e.target.value })}
                        className="size-3 rounded-full bg-transparent border-none cursor-pointer overflow-hidden p-0"
                        title={libelle}
                    />
                </div>
                <input
                    type="text"
                    value={libelle}
                    onChange={(e) => updateTrack(index, { label: e.target.value })}
                    className={`mt-1 w-full bg-transparent text-ui-10 font-bold uppercase tracking-wide text-center truncate focus:text-app-text focus:outline-none ${vide ? 'text-app-subtle' : 'text-app-text'}`}
                    placeholder={t('modules:ambient.presets.tracks.default_track', { index: index + 1 }).toUpperCase()}
                />
                <div className="mt-1">
                    <TrackVisualizer index={index} color={track.color} isPlaying={track.isPlaying} />
                </div>
            </div>

            {/* Lecture / arrêt */}
            <button
                onClick={() => (vide ? handleFileSelect() : toggleTrack(index))}
                aria-label={vide ? t('modules:ambient.agencement.choisir') : libelle}
                aria-pressed={track.isPlaying}
                className={`size-12 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 relative ${track.isPlaying
                    ? 'text-app-on-accent'
                    : 'bg-app-surface/80 text-app-muted border border-app-border hover:text-app-text hover:border-accent/50'
                    }`}
                style={track.isPlaying ? { backgroundColor: track.color } : {}}
            >
                {track.isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-0.5" />}
            </button>

            {/* Le curseur vertical */}
            <div className="relative w-7 flex-1 min-h-24 rounded-full border border-app-border bg-app-bg/80 p-1 flex items-end">
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
                    aria-label={`${libelle} — volume`}
                    className="absolute inset-x-0 w-full h-full opacity-0 cursor-ns-resize"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' } as React.CSSProperties}
                />
            </div>

            {/* Le niveau, en gros chiffres */}
            <div className={`font-mono font-black leading-none ${track.isPlaying ? 'text-app-text' : 'text-app-subtle'}`}>
                <span className="text-2xl">{Math.round(track.volume * 100)}</span>
                <span className="text-xs">%</span>
            </div>

            {/* Les gestes de la piste, visibles sans survol */}
            <div className="flex w-full flex-col gap-1">
                {vide ? (
                    <button
                        onClick={handleFileSelect}
                        className="w-full rounded-lg border border-accent/40 bg-accent/10 py-1.5 text-ui-9 font-black uppercase tracking-widest text-accent hover:bg-accent/20 transition-all"
                    >
                        {t('modules:ambient.agencement.choisir')}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleFileSelect}
                            className="w-full truncate rounded-lg border border-app-border bg-app-bg/50 py-1 text-ui-9 font-bold text-app-muted hover:text-app-text transition-all"
                            title={t('common:actions.change')}
                        >
                            {t('common:actions.change')}
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
                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-app-border bg-app-bg/50 py-1 text-ui-9 font-bold uppercase tracking-wide text-app-muted hover:text-etat-danger hover:border-etat-danger/40 transition-all"
                            title={t('modules:ambient.dashboard.delete_track')}
                        >
                            <Trash2 size={10} /> {t('modules:ambient.agencement.vider')}
                        </button>
                    </>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        gmCustom('light-scene-select', {
                            type: 'ambient',
                            trackIndex: index
                        });
                    }}
                    className={`flex w-full items-center justify-center gap-1 rounded-lg border py-1 text-ui-9 font-bold uppercase tracking-wide transition-all ${track.linkedLightSceneId ? 'text-gm-cyan bg-gm-cyan/10 border-gm-cyan/40' : 'text-app-muted border-app-border bg-app-bg/50 hover:text-gm-cyan hover:border-gm-cyan/40'}`}
                    title={track.linkedLightSceneId ? t('modules:ambient.dashboard.linked_light') : t('modules:ambient.dashboard.link_light')}
                >
                    <Lightbulb size={10} fill={track.linkedLightSceneId ? "currentColor" : "none"} />
                    <span className="truncate">{track.linkedLightSceneId ? t('modules:ambient.agencement.liee') : t('modules:ambient.agencement.lier')}</span>
                </button>
            </div>
        </div>
    );
};

export default AmbientTrack;
