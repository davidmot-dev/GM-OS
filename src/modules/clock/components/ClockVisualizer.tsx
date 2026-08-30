import React, { useState, useEffect } from 'react';
import type { ClockMode, ClockTheme } from '../../../store/useClockStore';
import { useClockStore } from '../../../store/useClockStore';
import { useTranslation } from 'react-i18next';

interface ClockVisualizerProps {
    theme: ClockTheme;
    timestamp: number;
    mode: ClockMode;
}

/**
 * **Le repère du cadran du minuteur.**
 *
 * `cx`, `cy` et `r` sont des unités du repère SVG. Sans `viewBox`, ce repère
 * vaut des **pixels**, et le cadran était écrit pour une boîte de 384 px. Or
 * `w-96` vaut 24 rem, et `:root { font-size: 85% }` fait valoir un rem 13,6 px :
 * la boîte mesure **326 px**. Le cercle débordait de 58 px à droite et en bas —
 * coupé net, et son centre décalé de 29 px par rapport aux chiffres.
 *
 * Avec le `viewBox`, le dessin s'adapte à la boîte quelle qu'elle soit, et le
 * piège des 85 % ne peut plus mordre. C'est la troisième fois que cette valeur
 * de racine coûte quelque chose à ce projet.
 */
const REPERE = 384;

interface HabillageDuMinuteur {
    /** Ce qui se dessine **derrière** l'anneau : fonds, cadres, index. */
    fond: React.ReactNode;
    /**
     * Le rayon de l'anneau, dans le repère.
     *
     * Il varie : « old style » entoure son cadran d'un cadre épais et de douze
     * index, et un anneau au même rayon que les autres passerait par-dessus.
     */
    rayon: number;
    piste: string;
    epaisseurDeLaPiste: number;
    trait: string;
    epaisseurDuTrait: number;
    /** Une **valeur** de `filter`, pas un nom de classe. */
    halo?: string;
    chiffres: string;
    couleurDesChiffres: string;
    /** Entre les chiffres et le libellé. Le trait fin est la signature de « moderne ». */
    separateur: React.ReactNode;
    libelle: string;
}

/**
 * **L'habillage du minuteur, thème par thème.**
 *
 * Demandé par David le 2026-08-30. Le minuteur portait *un seul* dessin pour
 * les trois thèmes — le même anneau épais, seules la teinte et la police
 * changeaient — alors que les trois horloges n'ont rien en commun : « moderne »
 * n'a aucun anneau et vit d'un trait fin, « old style » est un cadran orné à
 * douze index, « cyberpunk » vit de halos et de néon rose.
 *
 * Chaque habillage emprunte donc au rendu d'horloge du même thème, et pas à
 * une idée générique de minuteur. *Un thème qu'un seul écran n'applique pas
 * n'est pas un thème, c'est une préférence de couleur.*
 *
 * Les variables s'appellent `--app-accent` et `--app-accent-rgb`. `var(--accent)`
 * et `rgba(var(--accent-rgb), .1)` ne désignaient rien, et une valeur invalide
 * fait **tomber la déclaration entière** : `color` retombait sur l'héritage,
 * d'où l'anneau blanc vif à la place d'un liseré d'accent. *Une couleur qui
 * n'existe pas ne laisse pas un trou, elle laisse la couleur du voisin.*
 */
function habillageDuMinuteur(theme: ClockTheme, epuise: boolean): HabillageDuMinuteur {
    switch (theme) {
        case 'cyberpunk':
            return {
                fond: <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl" />,
                rayon: 180,
                piste: 'rgba(var(--app-accent-rgb), 0.15)',
                epaisseurDeLaPiste: 4,
                trait: 'var(--app-accent)',
                epaisseurDuTrait: 8,
                halo: 'drop-shadow(0 0 12px var(--app-accent-glow))',
                chiffres: 'font-mono font-black tracking-tighter',
                couleurDesChiffres: epuise ? '#f43f5e' : 'var(--app-accent)',
                separateur: null,
                // Le badge rose qui porte la date dans l'horloge cyberpunk.
                libelle: 'text-xs font-bold uppercase tracking-[0.4em] text-pink-500'
                    + ' bg-pink-500/10 px-3 py-1 rounded border border-pink-500/30 animate-glitch',
            };

        case 'oldstyle':
            return {
                fond: (
                    <>
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(67,20,7,0.4)_0%,rgba(20,10,5,0.8)_100%)] shadow-[0_0_50px_rgba(0,0,0,0.8)]" />
                        <div className="absolute inset-0 rounded-full border-[12px] border-amber-900/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]" />
                        <div className="absolute inset-2 rounded-full border-2 border-amber-600/20" />
                        <div className="absolute inset-8 rounded-full border border-dashed border-amber-500/10 animate-spin-slow opacity-40" />
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-full w-full flex justify-center py-4"
                                style={{ transform: `rotate(${i * 30}deg)` }}
                            >
                                <div className={`rounded-full ${i % 3 === 0
                                    ? 'h-6 w-1.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                    : 'h-3 w-1 bg-amber-700/50'}`} />
                            </div>
                        ))}
                    </>
                ),
                // Assez rentré pour passer sous les index et le cadre de 12 px.
                rayon: 146,
                piste: 'rgba(120, 53, 15, 0.55)',
                epaisseurDeLaPiste: 3,
                trait: '#f59e0b',
                epaisseurDuTrait: 6,
                halo: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))',
                chiffres: 'font-serif italic font-bold',
                couleurDesChiffres: epuise ? '#ef4444' : '#d97706',
                separateur: null,
                libelle: 'font-serif italic text-xl font-bold tracking-[0.2em] text-amber-200/80 drop-shadow-md',
            };

        case 'modern':
        default:
            return {
                /*
                  Rien derrière : l'horloge « moderne » est faite de vide, de
                  chiffres très fins et d'un seul trait. Lui coller un halo la
                  ramènerait au thème d'à côté.
                */
                fond: null,
                rayon: 180,
                piste: 'var(--app-border)',
                epaisseurDeLaPiste: 2,
                trait: 'var(--app-accent)',
                epaisseurDuTrait: 3,
                halo: undefined,
                chiffres: 'font-thin tabular-nums tracking-tighter',
                couleurDesChiffres: epuise ? '#ef4444' : 'var(--app-text)',
                separateur: <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-app-border to-transparent my-6" />,
                libelle: 'text-lg font-light uppercase tracking-[0.3em] text-app-text/60',
            };
    }
}

const ClockVisualizer: React.FC<ClockVisualizerProps> = ({ theme, timestamp, mode }) => {
    const { timerRemaining, timerDuration, timerIsRunning, timerLabel, calendars, activeCalendarId, getFantasyDate } = useClockStore();
    const [realtimeDate, setRealtimeDate] = useState(new Date());
    const { t, i18n } = useTranslation('modules');

    useEffect(() => {
        if (mode === 'realtime') {
            const interval = setInterval(() => setRealtimeDate(new Date()), 1000);
            return () => clearInterval(interval);
        }
    }, [mode]);

    const date = mode === 'realtime' ? realtimeDate : new Date(timestamp);
    const fantasyDate = mode === 'fantasy' ? getFantasyDate() : null;

    const formatTime = (d: Date) => {
        if (mode === 'fantasy' && fantasyDate) {
            return `${fantasyDate.hour.toString().padStart(2, '0')}:${fantasyDate.minute.toString().padStart(2, '0')}:${fantasyDate.second.toString().padStart(2, '0')}`;
        }
        return d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (d: Date) => {
        if (mode === 'fantasy' && activeCalendarId && calendars[activeCalendarId] && fantasyDate) {
            const cal = calendars[activeCalendarId];
            const monthObj = cal.months[fantasyDate.monthIndex];
            const monthName = monthObj.displayName || monthObj.name;

            let dateStr = "";
            if (monthObj.isIntercalary) {
                dateStr = `${monthName} ${fantasyDate.year}`;
            } else {
                dateStr = `${fantasyDate.day} ${monthName} ${fantasyDate.year}`;
            }
            if (fantasyDate.dayOfWeek) {
                dateStr = `${fantasyDate.dayOfWeek} ${dateStr}`;
            }
            return dateStr;
        }
        return d.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const renderCyberpunk = () => (
        <div className="relative flex flex-col items-center justify-center font-mono">
            <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full" />
            <div className="text-7xl font-black text-accent drop-shadow-glow-accent tracking-tighter tabular-nums mb-2 relative">
                {formatTime(date)}
                <div className="absolute -inset-1 bg-accent/20 skew-x-12 opacity-30 animate-pulse pointer-events-none" />
            </div>
            <div className="text-xs uppercase tracking-[0.4em] text-pink-500 font-bold bg-pink-500/10 px-3 py-1 rounded border border-pink-500/30 animate-glitch mt-4">
                {formatDate(date)}
            </div>
            <div className="mt-8 grid grid-cols-4 gap-4 w-full max-w-md">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-1 bg-accent/20 relative overflow-hidden rounded-full">
                        <div className="absolute inset-y-0 left-0 bg-accent animate-shimmer" style={{ width: '40%', animationDelay: `${i * 0.5}s` }} />
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOldStyle = () => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if (mode === 'fantasy' && fantasyDate) {
            hours = fantasyDate.hour;
            minutes = fantasyDate.minute;
            seconds = fantasyDate.second;
        }

        // Rotation for hands
        const sRotate = seconds * 6;
        const mRotate = minutes * 6 + seconds * 0.1;
        const hRotate = (hours % 12) * 30 + minutes * 0.5;

        return (
            /*
              **La date était posée HORS du cadran, et retombait sur ce qui
              suit.** Signalé par David le 2026-08-30 sur le Player Hub : sa
              date d'horloge s'affichait par-dessus la carte des jauges.

              Elle vivait dans un `absolute bottom-[-80px]` — c'est-à-dire
              quatre-vingts pixels **sous** la boîte, donc en dehors. Un élément
              hors flux ne pousse rien : le conteneur ne mesurait que le cadran,
              et tout ce qui venait dessous se faisait recouvrir. Les deux
              autres thèmes posent leur date dans le flux, et n'ont jamais eu
              le problème.

              Le cadran garde sa boîte carrée — ses aiguilles et ses index y
              sont positionnés en absolu — et la date devient sa voisine.
            */
            <div className="flex flex-col items-center gap-6">
            <div className="relative w-96 h-96 flex items-center justify-center">
                {/* Layered Background for Depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(67,20,7,0.4)_0%,rgba(20,10,5,0.8)_100%)] rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)]" />

                {/* Outer Ornated Ring */}
                <div className="absolute inset-0 border-[12px] border-amber-900/60 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]" />
                <div className="absolute inset-2 border-2 border-amber-600/20 rounded-full" />

                {/* Spinning Astrolabe Ring */}
                <div className="absolute inset-8 border border-amber-500/10 rounded-full border-dashed animate-spin-slow opacity-40" />

                {/* Numerals / Markers */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute h-full w-full flex justify-center py-4"
                        style={{ transform: `rotate(${i * 30}deg)` }}
                    >
                        <div className={`rounded-full ${i % 3 === 0 ? 'h-6 w-1.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'h-3 w-1 bg-amber-700/50'}`} />
                    </div>
                ))}

                {/* Clock Face Details */}
                <div className="absolute inset-24 border border-amber-900/40 rounded-full bg-black/20" />

                {/*
                  **Les aiguilles ne pivotaient pas sur l'axe.** Signalé par
                  David le 2026-08-30 : elles ne partaient pas du pivot.

                  Chacune était posée par `top: calc(50% - Npx)`, où N valait sa
                  hauteur **supposée** : `h-24` pour 96 px, `h-36` pour 144,
                  `h-40` pour 160. Mais `h-24` vaut 6 rem, et
                  `:root { font-size: 85% }` fait valoir un rem 13,6 px — soit
                  81,6 px. Le bas de l'aiguille tombait donc 14 px **au-dessus**
                  du centre, 22 px pour la minute, 24 px pour la seconde : trois
                  pivots différents, aucun sur l'axe, et un moyeu dessiné au
                  vrai centre pour rendre l'écart bien visible.

                  Le remède n'est pas de recalculer les trois nombres — c'est de
                  n'en avoir aucun. **`bottom: 50%` pose le bas de l'aiguille sur
                  l'axe quelle que soit sa hauteur**, et `translateX(-50%)` la
                  centre quelle que soit sa largeur. On peut désormais changer
                  une longueur sans rien recalculer.

                  Quatrième fois aujourd'hui que cette racine à 85 % coûte
                  quelque chose : *une constante en pixels qui décrit un élément
                  dimensionné en rem est fausse par construction.*
                */}
                <div className="absolute inset-0 pointer-events-none">

                    {/* Hour Hand */}
                    <div
                        data-aiguille="heure"
                        className="absolute w-2 h-24 bg-gradient-to-t from-amber-800 to-amber-500 rounded-full shadow-lg"
                        style={{
                            left: '50%',
                            bottom: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${hRotate}deg)`
                        }}
                    >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-7 bg-amber-500 rounded-t-full border border-amber-300/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                    </div>

                    {/* Minute Hand */}
                    <div
                        data-aiguille="minute"
                        className="absolute w-1.5 h-36 bg-gradient-to-t from-amber-700 to-amber-400 rounded-full shadow-md"
                        style={{
                            left: '50%',
                            bottom: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${mRotate}deg)`
                        }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-400 rounded-full border border-amber-200/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                    </div>

                    {/* Second Hand */}
                    <div
                        data-aiguille="seconde"
                        className="absolute w-0.5 h-40 bg-red-600 rounded-full shadow-sm"
                        style={{
                            left: '50%',
                            bottom: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${sRotate}deg)`
                        }}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-red-500 rounded-full" />
                    </div>

                    {/* Center Pin Hub */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-950 border-4 border-amber-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center z-20">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_white]" />
                    </div>
                </div>

            </div>

                <p className="text-center font-serif italic text-amber-200/80 text-xl tracking-[0.2em] font-bold drop-shadow-md">
                    {mode === 'fantasy' ? formatDate(date).toUpperCase() : date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
            </div>
        );
    };

    const renderModern = () => {
        const h = mode === 'fantasy' && fantasyDate ? fantasyDate.hour : date.getHours();
        const m = mode === 'fantasy' && fantasyDate ? fantasyDate.minute : date.getMinutes();
        const s = mode === 'fantasy' && fantasyDate ? fantasyDate.second : date.getSeconds();

        return (
            <div className="flex flex-col items-center">
                <div className="text-9xl font-thin text-app-text tracking-tighter tabular-nums flex items-baseline">
                    {h.toString().padStart(2, '0')}
                    <span className="text-app-text/20 mx-2 animate-pulse">:</span>
                    {m.toString().padStart(2, '0')}
                    <span className="text-4xl text-app-text/40 ml-4 font-normal">
                        {s.toString().padStart(2, '0')}
                    </span>
                </div>
                <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-app-border to-transparent my-8" />
                <div className="text-xl text-app-text/60 font-light tracking-widest uppercase">
                    {formatDate(date)}
                </div>
            </div>
        );
    };

    const renderTimer = () => {
        /*
          **Au repos n'est pas épuisé.** Le minuteur affiche `00:00` dans les
          deux cas, mais un minuteur qu'on n'a jamais lancé n'a aucune raison
          d'être rouge ni de sautiller : le rouge et le rebond annoncent la fin
          d'un décompte, et ici ils annonçaient une fin qui n'a pas eu lieu.

          Le panneau de gauche, lui, posait déjà la bonne condition
          (`ClockDashboard`, `timerRemaining === 0 && timerDuration > 0`).
          *Deux lecteurs d'une même vérité, et un seul avait raison* — le motif
          le plus fréquent de ce projet.
        */
        const configure = timerDuration > 0;
        const epuise = configure && timerRemaining === 0;
        const urgent = timerIsRunning && timerRemaining < 10;

        const total = timerDuration || 1;
        const percentage = (timerRemaining / total) * 100;

        const habillage = habillageDuMinuteur(theme, epuise);
        const circonference = 2 * Math.PI * habillage.rayon;

        return (
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-96 h-96 flex items-center justify-center">
                    {habillage.fond}

                    {/* L'anneau de progression */}
                    <svg
                        className="absolute inset-0 w-full h-full transform -rotate-90"
                        viewBox={`0 0 ${REPERE} ${REPERE}`}
                    >
                        <circle
                            cx={REPERE / 2}
                            cy={REPERE / 2}
                            r={habillage.rayon}
                            stroke="currentColor"
                            strokeWidth={habillage.epaisseurDeLaPiste}
                            fill="transparent"
                            style={{ color: habillage.piste }}
                        />
                        <circle
                            cx={REPERE / 2}
                            cy={REPERE / 2}
                            r={habillage.rayon}
                            stroke="currentColor"
                            strokeWidth={habillage.epaisseurDuTrait}
                            fill="transparent"
                            /* Tirée du rayon : `1131` était juste, mais rien ne
                               l'obligeait à le rester si le rayon bougeait — et
                               il bouge, « old style » rentre le sien. */
                            strokeDasharray={circonference}
                            strokeDashoffset={circonference * (1 - percentage / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                            style={{
                                /* `drop-shadow-glow-accent` était un nom de
                                   classe posé dans `filter` : deux thèmes sur
                                   trois n'avaient donc aucun halo, en silence. */
                                color: urgent && theme !== 'oldstyle' ? '#ef4444' : habillage.trait,
                                filter: habillage.halo,
                            }}
                        />
                    </svg>

                    <div className="relative flex flex-col items-center z-10">
                        {/*
                          Une taille en `rem`, comme la boîte : les deux suivent
                          alors la même racine et le rapport ne peut plus
                          dériver. En `px` — c'était `text-[120px]` — les
                          chiffres débordaient de l'anneau dès que la racine
                          n'était pas à 100 %.
                        */}
                        <div
                            role="timer"
                            className={`relative text-[5.5rem] leading-none ${habillage.chiffres} ${epuise ? 'animate-bounce' : ''}`}
                            style={{ color: habillage.couleurDesChiffres }}
                        >
                            {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:
                            {(timerRemaining % 60).toString().padStart(2, '0')}
                            {theme === 'cyberpunk' && (
                                <div className="absolute -inset-1 bg-accent/20 skew-x-12 opacity-30 animate-pulse pointer-events-none" />
                            )}
                        </div>

                        {habillage.separateur}

                        <span className={`mt-4 text-center max-w-md px-4 ${habillage.libelle}`}>
                            {timerLabel || (theme === 'oldstyle' ? t('clock.visualizer.hourglass') : t('clock.visualizer.active_timer'))}
                        </span>
                    </div>
                </div>

                {/*
                  Les barres qui filent, signature du thème cyberpunk — et
                  **seulement quand le décompte tourne**. Une animation
                  d'activité sur un minuteur à l'arrêt raconterait la même
                  chose que le `00:00` rouge d'avant : un mouvement qui n'a pas
                  lieu.
                */}
                {theme === 'cyberpunk' && timerIsRunning && (
                    <div className="mt-6 grid grid-cols-4 gap-4 w-full max-w-md">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-1 bg-accent/20 relative overflow-hidden rounded-full">
                                <div
                                    className="absolute inset-y-0 left-0 bg-accent animate-shimmer"
                                    style={{ width: '40%', animationDelay: `${i * 0.5}s` }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (mode === 'timer') return renderTimer();

    switch (theme) {
        case 'cyberpunk': return renderCyberpunk();
        case 'oldstyle': return renderOldStyle();
        case 'modern':
        default: return renderModern();
    }
};

export default ClockVisualizer;
