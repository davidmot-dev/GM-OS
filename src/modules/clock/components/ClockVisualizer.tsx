import React, { useState, useEffect } from 'react';
import type { ClockMode, ClockTheme } from '../../../store/useClockStore';
import { useClockStore } from '../../../store/useClockStore';
import { useTranslation } from 'react-i18next';
import { mentionDeLaFete } from '../logic/formeDuCalendrier';

interface ClockVisualizerProps {
    theme: ClockTheme;
    timestamp: number;
    mode: ClockMode;
    /** T4 : même heure et même calendrier, dans la colonne de la tablette. */
    compact?: boolean;
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

const ClockVisualizer: React.FC<ClockVisualizerProps> = ({ theme, timestamp, mode, compact = false }) => {
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
            /*
              ⚠️ **Un jour hors calendrier n'a AUCUN jour de semaine**, et le
              calcul rend désormais `undefined` dans ce cas au lieu d'en inventer
              un. Cette garde tenait déjà : elle prend simplement son sens.
            */
            if (fantasyDate.dayOfWeek) {
                dateStr = `${fantasyDate.dayOfWeek} ${dateStr}`;
            }
            /*
              ⭐ **La fête qualifie la date, elle ne la remplace pas.**
              *Demandé par David le 2026-09-15.* « 13 Hammer — Nuits du Marteau
              (2/4) » : sans le numéro, le meneur qui compte « nous partons dans
              trois jours » perd son repère au milieu de sa propre fête.
            */
            const fete = mentionDeLaFete(fantasyDate.fete ?? null);
            if (fete) dateStr = `${dateStr} — ${fete}`;

            return dateStr;
        }
        return d.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    /**
     * **L'heure en trois morceaux**, le calendrier fantastique compris — les
     * trois cadrans la découpent chacun à leur façon (refonte, L4, étape 2).
     */
    const morceaux = () => {
        const h = mode === 'fantasy' && fantasyDate ? fantasyDate.hour : date.getHours();
        const m = mode === 'fantasy' && fantasyDate ? fantasyDate.minute : date.getMinutes();
        const s = mode === 'fantasy' && fantasyDate ? fantasyDate.second : date.getSeconds();
        const deux = (n: number) => n.toString().padStart(2, '0');
        return { h, m, s, hh: deux(h), mm: deux(m), ss: deux(s) };
    };

    /*
      **Les trois cadrans de la maquette retenue — refonte, phase 4, L4, étape
      2 (2026-10-02).** Réponse à « les différents thèmes des horloges ne sont
      pas assez élaborés ». Cyberpunk : les chiffres néon de l'accent avec leur
      halo, **les secondes en or** ; Old style : un cadre en laiton rivé, **le
      cadran à aiguilles à côté de l'heure numérique**, la date à empattements ;
      Moderne : de grands chiffres francs, les secondes dans l'accent. Les
      libellés décoratifs de la maquette (« Chronomètre de bord »…) sont des
      inventions de Stitch : ils ne sont pas repris.
    */
    const renderCyberpunk = () => {
        const { hh, mm, ss } = morceaux();
        return (
            <div className="relative flex flex-col items-center justify-center font-mono">
                <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full" />
                <div className="relative flex items-baseline gap-3 tabular-nums">
                    <span className="text-8xl font-black tracking-tighter text-accent drop-shadow-glow-accent">
                        {hh}<span className="animate-pulse opacity-70">:</span>{mm}
                    </span>
                    <span className="text-4xl font-black text-gm-gold drop-shadow-[0_0_12px_rgba(250,204,21,0.45)]">{ss}</span>
                    <div className="absolute -inset-1 bg-accent/20 skew-x-12 opacity-30 animate-pulse pointer-events-none" />
                </div>
                <div className="text-xs uppercase tracking-[0.4em] text-pink-500 font-bold bg-pink-500/10 px-3 py-1 rounded border border-pink-500/30 animate-glitch mt-6">
                    {formatDate(date)}
                </div>
                <div className="mt-6 grid grid-cols-4 gap-4 w-full max-w-md">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-1 bg-accent/20 relative overflow-hidden rounded-full">
                            <div className="absolute inset-y-0 left-0 bg-accent animate-shimmer" style={{ width: '40%', animationDelay: `${i * 0.5}s` }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderOldStyle = () => {
        const { h, m, s, hh, mm, ss } = morceaux();

        // Rotation for hands
        const sRotate = s * 6;
        const mRotate = m * 6 + s * 0.1;
        const hRotate = (h % 12) * 30 + m * 0.5;

        /*
          **Les aiguilles en pourcentage du cadran**, plus en `rem` : le cadran
          rapetisse pour laisser la place à l'heure numérique, et une longueur
          fixe aurait débordé. `bottom: 50%` pose toujours leur pied sur l'axe
          (correctif du 2026-08-30, voir l'historique de ce fichier).
        */
        const aiguille = (rotation: number, hauteur: string, extra: React.CSSProperties = {}) => ({
            left: '50%', bottom: '50%', height: hauteur, transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`, ...extra,
        });
        const rivet = 'absolute size-3 rounded-full bg-gradient-to-br from-amber-300 to-amber-700 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.6)]';

        return (
            /*
              **La date reste DANS le flux** (correctif du 2026-08-30 : posée en
              `absolute bottom-[-80px]`, elle retombait sur les jauges du
              Player Hub).
            */
            <div className="relative flex flex-col items-center gap-5 rounded-2xl border-2 border-amber-600/70 bg-[radial-gradient(circle_at_30%_20%,rgba(120,53,15,0.35),rgba(20,10,5,0.85))] px-10 py-7 shadow-[inset_0_0_40px_rgba(0,0,0,0.6),0_0_30px_rgba(0,0,0,0.5)]">
                <span className={`${rivet} left-2 top-2`} />
                <span className={`${rivet} right-2 top-2`} />
                <span className={`${rivet} left-2 bottom-2`} />
                <span className={`${rivet} right-2 bottom-2`} />

                <div className="flex items-center gap-10">
                    {/* Le cadran à aiguilles */}
                    <div className="relative size-52 shrink-0">
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(180,120,30,0.55)_0%,rgba(90,50,10,0.9)_100%)] shadow-[0_0_25px_rgba(0,0,0,0.7)]" />
                        <div className="absolute inset-0 rounded-full border-[8px] border-amber-700/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]" />
                        <div className="absolute inset-2 rounded-full border border-amber-400/30" />
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute inset-0 flex justify-center py-3" style={{ transform: `rotate(${i * 30}deg)` }}>
                                <div className={`rounded-full ${i % 3 === 0 ? 'h-3 w-1 bg-amber-200' : 'h-1.5 w-0.5 bg-amber-300/60'}`} />
                            </div>
                        ))}
                        {/* Les chiffres romains aux quatre quarts */}
                        {([['XII', 'left-1/2 top-8 -translate-x-1/2'], ['III', 'right-8 top-1/2 -translate-y-1/2'],
                           ['VI', 'left-1/2 bottom-8 -translate-x-1/2'], ['IX', 'left-8 top-1/2 -translate-y-1/2']] as const).map(([chiffre, place]) => (
                            <span key={chiffre} className={`absolute ${place} font-serif text-sm font-bold text-amber-100/90`}>{chiffre}</span>
                        ))}
                        <div className="absolute inset-0 pointer-events-none">
                            <div data-aiguille="heure" className="absolute w-1.5 rounded-full bg-gradient-to-t from-amber-900 to-amber-200 shadow" style={aiguille(hRotate, '27%')} />
                            <div data-aiguille="minute" className="absolute w-1 rounded-full bg-gradient-to-t from-amber-800 to-amber-100 shadow" style={aiguille(mRotate, '38%')} />
                            <div data-aiguille="seconde" className="absolute w-0.5 rounded-full bg-red-600" style={aiguille(sRotate, '42%')} />
                            <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500 bg-amber-950" />
                        </div>
                    </div>

                    {/* L'heure numérique, dans son cadre de laiton */}
                    <div className="flex items-baseline gap-3 rounded-xl border border-amber-600/60 bg-black/40 px-6 py-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.7)] tabular-nums">
                        <span className="font-serif text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                            {hh}:{mm}
                        </span>
                        <span className="border-l border-amber-600/40 pl-3 font-serif text-4xl font-bold text-amber-300">{ss}</span>
                    </div>
                </div>

                <p className="flex items-center gap-4 text-center font-serif italic text-amber-200/90 text-xl tracking-[0.2em] font-bold drop-shadow-md">
                    <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/70" />
                    {mode === 'fantasy' ? formatDate(date).toUpperCase() : date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                    <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/70" />
                </p>
            </div>
        );
    };

    const renderModern = () => {
        const { hh, mm, ss } = morceaux();

        return (
            <div className="flex flex-col items-center">
                <div className="text-9xl font-black text-app-text tracking-tighter tabular-nums flex items-baseline">
                    {hh}
                    <span className="text-app-text/30 mx-1 animate-pulse">:</span>
                    {mm}
                    <span className="text-5xl text-accent ml-4 font-bold">
                        {ss}
                    </span>
                </div>
                <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-app-border to-transparent my-6" />
                <div className="text-xl text-app-text/70 font-semibold tracking-[0.3em] uppercase">
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
                          dériver. En `px` — c'était `text-[calc(120px*var(--echelle-titres,1))]` — les
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

    if (compact) {
        const { hh, mm, ss } = morceaux();
        const minuteur = mode === 'timer';
        const epuise = minuteur && timerDuration > 0 && timerRemaining === 0;
        const urgent = minuteur && timerIsRunning && timerRemaining < 10;
        return (
            <div className={`min-w-0 space-y-2 ${theme === 'oldstyle' ? 'font-serif' : 'font-mono'}`}>
                <div role={minuteur ? 'timer' : undefined} className={`flex flex-wrap items-baseline gap-1 tabular-nums ${epuise || urgent ? 'text-etat-danger' : 'text-accent'}`}>
                    <span className="text-[28px] font-bold leading-none">
                        {minuteur ? `${Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:${(timerRemaining % 60).toString().padStart(2, '0')}` : `${hh}:${mm}`}
                    </span>
                    {!minuteur && <span className="text-[14px]">{ss}</span>}
                </div>
                <p className="text-[14px] leading-snug text-app-muted break-words">
                    {minuteur ? (timerLabel || t('clock.timerLabel', 'Minuteur')) : formatDate(date)}
                </p>
            </div>
        );
    }

    if (mode === 'timer') return renderTimer();

    switch (theme) {
        case 'cyberpunk': return renderCyberpunk();
        case 'oldstyle': return renderOldStyle();
        case 'modern':
        default: return renderModern();
    }
};

export default ClockVisualizer;
