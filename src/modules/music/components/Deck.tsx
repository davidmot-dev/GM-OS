import React, { useEffect, useState, useMemo } from 'react';
import { Play, Pause, Square, Repeat, Activity } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { musicEngine } from '../MusicEngine';
import { secondesAuPointeur, pasDuClavier } from '../logic/pointageDeLecture';
import { gainsALaPosition } from '../logic/fonduCroise';

interface DeckProps {
    side: 'A' | 'B';
}

const Deck: React.FC<DeckProps> = ({ side }) => {
    const { deckA, deckB, playDeck, stopDeck, toggleLoop, triggerAutoFade } = useMusicStore();
    const deckState = side === 'A' ? deckA : deckB;
    const engineDeck = side === 'A' ? musicEngine.deckA : musicEngine.deckB;

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    /**
     * **Cette platine joue-t-elle sans qu'on l'entende ?**
     *
     * Le cas arrive dès qu'on précharge : platine A à l'antenne, on charge B, on
     * appuie sur Lecture de B — et rien ne sort, parce que le crossfader est
     * resté sur A. La platine tourne, le disque tourne à l'écran, le temps
     * défile : **tout dit que ça marche, et on n'entend rien.**
     *
     * *C'est le motif que ce projet paie le plus souvent : la donnée est juste
     * et l'écran ment par omission.* On le nomme, et on offre le geste qui le
     * corrige plutôt que de laisser chercher.
     */
    const [inaudible, setInaudible] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(engineDeck.currentTime);
            setDuration(engineDeck.duration);
            setIsPlaying(engineDeck.isPlaying);

            // Le gain vient de la même conversion que le fondu : deux formules
            // se contrediraient au bord, précisément là où on décide « muet ».
            const gains = gainsALaPosition(musicEngine.positionDuCrossfader());
            setInaudible(engineDeck.isPlaying && (side === 'A' ? gains.a : gains.b) < 0.05);
        }, 100);
        return () => clearInterval(interval);
    }, [engineDeck, side]);

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /*
      **Se placer dans le morceau — demandé par David le 2026-08-30.**

      La barre n'était qu'un décor : son voile de progression portait
      `pointer-events-none`, et rien n'écoutait le clic. Elle devient un curseur
      de position, utilisable **à l'arrêt comme en lecture** — c'est tout
      l'intérêt : on cale son passage pendant que le morceau précédent tourne,
      puis on lance.

      `pointageEnCours` tient la position pendant le glissement. Sans elle, le
      relevé périodique de 100 ms réécrirait la position sous le doigt du meneur
      et le curseur reviendrait en arrière entre deux images. *Deux écrivains
      pour une même valeur, à cent millisecondes d'intervalle.*

      **On ne déplace la lecture qu'au relâchement**, pas à chaque mouvement :
      repositionner un élément audio trente fois par seconde le fait hoqueter, et
      un simple clic — appui puis relâchement sans bouger — donne exactement le
      même geste.
    */
    const barreRef = React.useRef<HTMLDivElement>(null);
    const [pointageEnCours, setPointageEnCours] = useState<number | null>(null);

    const positionDuPointeur = (clientX: number): number => {
        const cadre = barreRef.current?.getBoundingClientRect();
        if (!cadre) return 0;
        return secondesAuPointeur(clientX, cadre, duration);
    };

    const deplacerLaLecture = (secondes: number) => {
        if (!engineDeck.seek(secondes)) return;
        setCurrentTime(secondes);
    };

    /** La position montrée : celle du doigt s'il y en a un, sinon celle du moteur. */
    const positionAffichee = pointageEnCours ?? currentTime;
    const progress = duration > 0 ? (positionAffichee / duration) * 100 : 0;

    const waveformHeights = useMemo(() => {
        // Use a static "random-looking" sequence for the visualizer to avoid lint issues
        return [60, 45, 80, 50, 65, 30, 85, 40, 70, 55, 90, 45, 60, 35, 75, 50, 65, 40, 80, 55, 70, 35, 90, 50, 65, 40, 85, 55, 70, 45, 80, 50, 65, 35, 75, 45, 60, 30, 85, 55];
    }, []);

    return (
        <div className="group relative bg-app-bg/40 backdrop-blur-[24px] rounded-[1.5rem] border border-app-border/50 p-4 shadow-xl overflow-hidden transition-all duration-500 hover:shadow-glow-accent/10 hover:border-accent/30 hover:bg-app-bg/50 flex flex-col gap-3">
            {/* Premium Ambient Background Glow */}
            <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full transition-all duration-1000 ${isPlaying ? 'bg-accent/20 blur-[120px] animate-pulse' : 'bg-transparent blur-0'}`} />
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blur-3xl pointer-events-none opacity-40" />

            {/* Header: Track Info & Disc */}
            <div className="flex items-center gap-4 relative z-10">
                {/* Compact Disc Visualizer */}
                <div className="relative shrink-0">
                    <div className={`size-12 rounded-full border-2 border-app-bg bg-app-bg shadow-lg flex items-center justify-center relative overflow-hidden transition-all duration-500 ${isPlaying ? 'animate-spin-slow scale-105' : 'group-hover:scale-105'}`}>
                        {/* Center Label */}
                        <div className={`size-6 rounded-full border border-app-bg flex items-center justify-center relative z-10 transition-all duration-500 ${isPlaying ? 'bg-accent shadow-glow-accent' : 'bg-app-surface'}`}>
                            <Activity size={10} className={`transition-all duration-500 ${isPlaying ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded-lg text-ui-7 font-black uppercase tracking-widest transition-all duration-500 border ${isPlaying ? 'bg-accent/20 border-accent text-white shadow-glow-accent/20' : 'bg-app-surface/60 border-app-border/50 text-slate-500'}`}>
                            DRK {side}
                        </span>

                        {/* Le bandeau nomme le silence ET porte le geste qui le lève. */}
                        {inaudible && (
                            <button
                                onClick={() => void triggerAutoFade(side)}
                                title={`La platine ${side} joue mais le crossfader est sur l’autre — cliquer pour l’amener à l’antenne`}
                                className="px-1.5 py-0.5 rounded-lg text-ui-7 font-black uppercase tracking-widest border bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black transition-all"
                            >
                                Muet → à l’antenne
                            </button>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white truncate tracking-tight transition-colors group-hover:text-accent/90">
                            {deckState.activeTrackLabel || "Ready"}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Waveform & Progress */}
            <div className="space-y-2 relative z-10">
                <div
                    ref={barreRef}
                    role="slider"
                    tabIndex={duration > 0 ? 0 : -1}
                    aria-label={`Position dans la piste — platine ${side}`}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(positionAffichee)}
                    aria-valuetext={formatTime(positionAffichee)}
                    aria-disabled={duration <= 0}
                    title={duration > 0 ? 'Cliquer ou glisser pour se placer dans le morceau' : undefined}
                    onPointerDown={(e) => {
                        if (duration <= 0) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setPointageEnCours(positionDuPointeur(e.clientX));
                    }}
                    onPointerMove={(e) => {
                        if (pointageEnCours === null) return;
                        setPointageEnCours(positionDuPointeur(e.clientX));
                    }}
                    onPointerUp={(e) => {
                        if (pointageEnCours === null) return;
                        e.currentTarget.releasePointerCapture(e.pointerId);
                        deplacerLaLecture(positionDuPointeur(e.clientX));
                        setPointageEnCours(null);
                    }}
                    /* Capture perdue — fenêtre qui perd le focus, geste interrompu :
                       on relâche l'état plutôt que de laisser le curseur collé au
                       doigt d'un pointeur qui n'existe plus. */
                    onPointerCancel={() => setPointageEnCours(null)}
                    onKeyDown={(e) => {
                        if (duration <= 0) return;
                        const pas = pasDuClavier(e.shiftKey);
                        if (e.key === 'ArrowLeft') { e.preventDefault(); deplacerLaLecture(currentTime - pas); }
                        else if (e.key === 'ArrowRight') { e.preventDefault(); deplacerLaLecture(currentTime + pas); }
                        else if (e.key === 'Home') { e.preventDefault(); deplacerLaLecture(0); }
                        else if (e.key === 'End') { e.preventDefault(); deplacerLaLecture(duration); }
                    }}
                    className={`h-4 bg-app-bg/60 rounded-lg border border-app-border/50 relative overflow-hidden flex items-end px-1 pb-0.5 gap-0.5 transition-colors shadow-inner outline-none focus-visible:border-accent ${
                        duration > 0
                            ? 'cursor-pointer hover:border-accent/40 group-hover:border-accent/20'
                            : 'group-hover:border-accent/10'
                    }`}
                >
                    {waveformHeights.map((h, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-t-[1px] transition-all duration-300 ${isPlaying ? 'bg-accent/30 animate-jitter' : 'bg-slate-800'}`}
                            style={{
                                height: isPlaying ? `${h}%` : '20%',
                                transitionDelay: `${i * 5}ms`
                            }}
                        />
                    ))}
                    
                    {/* Le voile de progression laisse passer les clics : c'est le
                        cadre au-dessus qui écoute. Pendant un glissement, le trait
                        se fige sur le doigt et cesse de suivre la lecture. */}
                    <div className="absolute inset-0 flex items-center px-0 pointer-events-none">
                        <div
                            className={`h-full bg-accent/5 border-r ease-linear ${
                                pointageEnCours !== null
                                    ? 'border-accent shadow-glow-accent'
                                    : 'border-accent/40 transition-all duration-100'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-ui-8 font-black font-mono tracking-tighter text-slate-600 px-0.5 uppercase">
                    <span className={pointageEnCours !== null ? 'text-accent' : isPlaying ? 'text-accent' : ''}>
                        {formatTime(positionAffichee)}
                    </span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center gap-1.5 relative z-10">
                <button
                    onClick={() => isPlaying ? engineDeck.pause() : playDeck(side)}
                    className={`flex-[2] h-8 rounded-lg flex items-center justify-center transition-all group/btn ${isPlaying
                        ? 'bg-app-surface/80 text-accent border border-accent/20'
                        : 'bg-accent text-white shadow-lg active:scale-[0.98]'
                        }`}
                >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-0.5" />}
                </button>
                
                <button
                    onClick={() => stopDeck(side)}
                    className="flex-1 h-8 rounded-lg bg-app-surface/50 border border-app-border/50 text-slate-600 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-[0.9]"
                    title="Stop"
                >
                    <Square size={10} fill="currentColor" />
                </button>
                <button
                    onClick={() => toggleLoop(side)}
                    className={`flex-1 h-8 rounded-lg border transition-all flex items-center justify-center ${deckState.isLooping
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-glow-accent'
                        : 'bg-app-surface/50 border-app-border/50 text-slate-600 hover:text-slate-300'
                        }`}
                    title="Toggle Loop"
                >
                    <Repeat size={10} />
                </button>
            </div>
        </div>
    );
};

export default Deck;
