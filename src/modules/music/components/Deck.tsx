import React, { useEffect, useState, useMemo } from 'react';
import { Play, Pause, Square, Repeat, X } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { musicEngine } from '../MusicEngine';
import { secondesAuPointeur, pasDuClavier } from '../logic/pointageDeLecture';
import { gainsALaPosition } from '../logic/fonduCroise';
import { plageValide } from '../logic/plageDeLecture';

interface DeckProps {
    side: 'A' | 'B';
}

const Deck: React.FC<DeckProps> = ({ side }) => {
    const { deckA, deckB, playDeck, stopDeck, toggleLoop, triggerAutoFade, playlists, definirLaPlageDuPad } = useMusicStore();
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

    /*
      **La plage de lecture — demandée par David le 2026-09-16.**

      Elle appartient au **pad**, pas à la platine : elle découpe un morceau, et
      le morceau survit à la platine qui le joue. La platine ne connaît que
      `activePadId`, d'où la recherche ici.

      ⚠️ **Les points ne s'appellent PAS A et B**, bien que le champ persisté se
      nomme `loopA`/`loopB` depuis toujours : les platines s'appellent déjà A et
      B, et « poser B sur la platine A » est une phrase que personne ne devrait
      avoir à démêler en séance. À l'écran, ce sont **Entrée** et **Sortie**.
    */
    const padCharge = useMemo(
        () => playlists.flatMap(p => p.pads).find(p => p.id === deckState.activePadId) ?? null,
        [playlists, deckState.activePadId]
    );
    const plage = plageValide(padCharge?.loopA, padCharge?.loopB, duration);
    const unPointPose = !!padCharge && (padCharge.loopA !== null || padCharge.loopB !== null);

    const poserLePoint = (bord: 'entree' | 'sortie') => {
        if (!padCharge) return;
        const ici = Math.round(positionAffichee * 10) / 10;
        definirLaPlageDuPad(
            padCharge.id,
            bord === 'entree' ? ici : padCharge.loopA,
            bord === 'sortie' ? ici : padCharge.loopB
        );
    };

    const waveformHeights = useMemo(() => {
        // Use a static "random-looking" sequence for the visualizer to avoid lint issues
        return [60, 45, 80, 50, 65, 30, 85, 40, 70, 55, 90, 45, 60, 35, 75, 50, 65, 40, 80, 55, 70, 35, 90, 50, 65, 40, 85, 55, 70, 45, 80, 50, 65, 35, 75, 45, 60, 30, 85, 55];
    }, []);

    /*
      **La platine de la maquette retenue — refonte, L2, étape 2 (2026-10-02).**
      Le temps écoulé en grand, lisible de loin ; la forme d'onde plus haute,
      avec les repères IN et OUT de la plage ; sous elle, l'entrée, la durée
      de la sélection et la sortie ; le transport en gros boutons carrés,
      touchables au doigt.

      Le curseur de volume par platine de la maquette n'est pas repris : GM-OS
      n'en a pas (le volume est celui du master et du fondu croisé), et un
      curseur de plus sur deux platines serait un troisième volume à surveiller.
    */
    const etat = isPlaying ? 'En lecture' : deckState.activePadId ? 'Chargée' : 'Vide';
    const boutonCarre = 'size-12 shrink-0 rounded-xl flex items-center justify-center transition-all active:scale-[0.96]';

    return (
        <div className={`group relative flex h-full flex-col gap-3 rounded-[1.5rem] border p-4 shadow-xl transition-all duration-500 ${isPlaying ? 'border-accent/60 bg-app-bg/50 shadow-glow-accent/10' : 'border-app-border/50 bg-app-bg/40'}`}>
            {/* L'en-tête : la platine, son état, sa plage */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-ui-8 font-black uppercase tracking-widest transition-all ${isPlaying ? 'border-accent bg-accent text-app-on-accent' : 'border-app-border/50 bg-app-surface/60 text-app-muted'}`}>
                        Platine {side} — {etat}
                    </span>

                    {/* Le bandeau nomme le silence ET porte le geste qui le lève. */}
                    {inaudible && (
                        <button
                            onClick={() => void triggerAutoFade(side)}
                            title={`La platine ${side} joue mais le crossfader est sur l’autre — cliquer pour l’amener à l’antenne`}
                            className="shrink-0 px-1.5 py-0.5 rounded-lg text-ui-8 font-black uppercase tracking-widest border bg-etat-alerte/15 border-etat-alerte/40 text-etat-alerte hover:bg-etat-alerte hover:text-app-bg transition-all"
                        >
                            Muet → à l’antenne
                        </button>
                    )}
                </div>
                {padCharge && (
                    <span className={`truncate text-ui-8 font-black uppercase tracking-widest ${plage ? 'text-etat-succes' : 'text-app-subtle'}`}>
                        {plage ? 'Plage active' : 'Morceau entier'}
                    </span>
                )}
            </div>

            {/* Le morceau et le temps */}
            <div className="min-w-0">
                <h3 className="truncate text-sm font-black tracking-tight text-app-text" title={deckState.activeTrackLabel ?? undefined}>
                    {deckState.activeTrackLabel || 'Aucun morceau chargé'}
                </h3>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                    <p className="font-mono font-black tracking-tight">
                        <span className={`text-3xl ${pointageEnCours !== null || isPlaying ? 'text-accent' : 'text-app-text'}`}>{formatTime(positionAffichee)}</span>
                        <span className="text-sm text-app-subtle"> / {formatTime(duration)}</span>
                    </p>
                    {plage && (
                        <span className="font-mono text-ui-10 font-black text-app-muted">
                            Boucle : {formatTime(plage.entree)} → {formatTime(plage.sortie)}
                        </span>
                    )}
                </div>
            </div>

            {/* La forme d'onde, curseur de position */}
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
                className={`relative flex h-20 items-center gap-0.5 overflow-hidden rounded-xl border border-app-border/50 bg-app-bg/60 px-1.5 shadow-inner outline-none transition-colors focus-visible:border-accent ${
                    duration > 0 ? 'cursor-pointer hover:border-accent/40' : ''
                }`}
            >
                {waveformHeights.map((h, i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-accent/50 animate-jitter' : 'bg-app-muted/30'}`}
                        style={{
                            height: `${isPlaying ? h * 0.8 : h * 0.45}%`,
                            transitionDelay: `${i * 5}ms`
                        }}
                    />
                ))}

                {/* La plage, dessinée sous le voile de progression pour que le
                    trait de lecture reste lisible en la traversant. Elle ne
                    prend pas les clics : la forme d'onde reste un curseur. */}
                {plage && duration > 0 && (
                    <div
                        className="absolute inset-y-0 pointer-events-none bg-etat-succes/10 border-x-2 border-etat-succes/70"
                        style={{
                            left: `${(plage.entree / duration) * 100}%`,
                            width: `${((plage.sortie - plage.entree) / duration) * 100}%`
                        }}
                    >
                        <span className="absolute left-0 top-0 bg-etat-succes px-1 text-ui-7 font-black text-app-bg">IN</span>
                        <span className="absolute right-0 top-0 bg-etat-succes px-1 text-ui-7 font-black text-app-bg">OUT</span>
                    </div>
                )}

                {/* Le voile de progression laisse passer les clics : c'est le
                    cadre au-dessus qui écoute. Pendant un glissement, le trait
                    se fige sur le doigt et cesse de suivre la lecture. */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className={`h-full bg-accent/10 border-r-2 ease-linear ${
                            pointageEnCours !== null
                                ? 'border-accent shadow-glow-accent'
                                : 'border-accent/70 transition-all duration-100'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/*
              **Les deux points se posent à l'endroit où l'on écoute.**

              Pas de champ où taper des secondes : on cale une boucle à
              l'oreille, pas au chronomètre. Le bouton prend la position
              affichée — celle du doigt s'il glisse sur la forme d'onde,
              celle de la lecture sinon — donc **le geste marche à l'arrêt
              comme en lecture**, comme le pointage dont il hérite.

              ⚠️ **Un seul point posé ne fait pas une plage**, et l'écran le
              DIT. `plageValide` refuse silencieusement une plage à moitié
              posée, à l'envers, ou trop courte ; laisser l'écran muet dans
              ces trois cas donnerait un bouton qui ne fait rien, sans dire
              pourquoi — *le défaut préféré de ce projet.*
            */}
            {padCharge && (
                <div className="grid grid-cols-[1fr_auto_1fr_auto] items-stretch gap-1.5">
                    <button
                        onClick={() => poserLePoint('entree')}
                        disabled={duration <= 0}
                        title="Poser l'entrée de la plage à la position actuelle"
                        className="flex flex-col items-center rounded-lg border border-app-border/50 bg-app-surface/50 px-2 py-1 text-app-muted hover:text-etat-succes hover:border-etat-succes/40 transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="text-ui-8 font-black uppercase tracking-widest">Entrée</span>
                        <span className="font-mono text-xs font-black">{padCharge.loopA !== null ? formatTime(padCharge.loopA) : '—'}</span>
                    </button>
                    <span className={`flex flex-col items-center justify-center px-1 text-center ${plage ? 'text-etat-succes' : unPointPose ? 'text-etat-alerte' : 'text-app-subtle'}`}>
                        <span className="text-ui-8 font-black uppercase tracking-widest">
                            {plage ? 'Sélection' : unPointPose
                                ? (padCharge.loopA === null ? 'Pose l\'entrée' : padCharge.loopB === null ? 'Pose la sortie' : 'Plage invalide')
                                : 'Pas de plage'}
                        </span>
                        {plage && <span className="font-mono text-xs font-black">{formatTime(plage.sortie - plage.entree)}</span>}
                    </span>
                    <button
                        onClick={() => poserLePoint('sortie')}
                        disabled={duration <= 0}
                        title="Poser la sortie de la plage à la position actuelle"
                        className="flex flex-col items-center rounded-lg border border-app-border/50 bg-app-surface/50 px-2 py-1 text-app-muted hover:text-etat-succes hover:border-etat-succes/40 transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="text-ui-8 font-black uppercase tracking-widest">Sortie</span>
                        <span className="font-mono text-xs font-black">{padCharge.loopB !== null ? formatTime(padCharge.loopB) : '—'}</span>
                    </button>
                    <button
                        onClick={() => definirLaPlageDuPad(padCharge.id, null, null)}
                        disabled={!unPointPose}
                        title="Retirer la plage — le morceau entier se joue de nouveau"
                        aria-label="Retirer la plage"
                        className="flex items-center rounded-lg border border-app-border/50 bg-app-surface/50 px-2 text-app-subtle hover:text-etat-danger hover:border-etat-danger/30 transition-all active:scale-[0.9] disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* Le transport, en gros boutons carrés */}
            <div className="mt-auto flex items-center gap-2">
                <button
                    onClick={() => isPlaying ? engineDeck.pause() : playDeck(side)}
                    title={isPlaying ? 'Pause' : 'Lecture'}
                    aria-label={isPlaying ? `Pause — platine ${side}` : `Lecture — platine ${side}`}
                    className={`${boutonCarre} ${isPlaying
                        ? 'bg-accent text-app-on-accent shadow-glow-accent'
                        : 'bg-app-surface-2 text-app-text border border-app-border hover:border-accent/60'}`}
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-0.5" />}
                </button>
                <button
                    onClick={() => stopDeck(side)}
                    title="Stop"
                    aria-label={`Stop — platine ${side}`}
                    className={`${boutonCarre} bg-app-surface/50 border border-app-border/50 text-app-muted hover:bg-etat-danger/10 hover:text-etat-danger hover:border-etat-danger/30`}
                >
                    <Square size={16} fill="currentColor" />
                </button>
                <button
                    onClick={() => toggleLoop(side)}
                    aria-pressed={deckState.isLooping}
                    className={`h-12 flex-1 rounded-xl border flex items-center justify-center gap-2 text-ui-9 font-black uppercase tracking-widest transition-all ${deckState.isLooping
                        ? 'bg-accent/10 border-accent/50 text-accent shadow-glow-accent'
                        : 'bg-app-surface/50 border-app-border/50 text-app-muted hover:text-app-text'
                        }`}
                    title={plage
                        ? (deckState.isLooping ? 'La plage tourne en boucle' : 'La plage joue une fois, puis s\'arrête')
                        : (deckState.isLooping ? 'Le morceau entier tourne en boucle' : 'Le morceau joue une fois')}
                >
                    <Repeat size={14} /> Boucle
                </button>
            </div>
        </div>
    );
};

export default Deck;
