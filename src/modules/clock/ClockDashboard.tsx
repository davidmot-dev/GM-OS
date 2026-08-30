import React, { useEffect } from 'react';
import { useClockStore } from '../../store/useClockStore';
import {
    Clock,
    Timer,
    Calendar,
    Settings,
    Plus,
    Trash2,
    Play,
    Pause,
    RotateCcw,
    Monitor,
    LayoutGrid,
    ChevronsUp,
    MonitorSmartphone
} from 'lucide-react';
import ClockVisualizer from './components/ClockVisualizer';
import NarrativeClock from './components/NarrativeClock';
import ChoixDeLaForme from './components/ChoixDeLaForme';
import { FORME_PAR_DEFAUT, type FormeDeJauge } from './components/formesDeJauge';
import { nomDeLaJauge, SEGMENTS_PROPOSES, SEGMENTS_PAR_DEFAUT } from './logic/nomDeLaJauge';
import { COULEURS_DU_COMPTE } from '../ulanzi/widgets/compteARebours';

/** Ce que l'afficheur montre quand une jauge n'a pas de couleur choisie. */
const COULEUR_DE_JAUGE_PAR_DEFAUT = COULEURS_DU_COMPTE.plein;
import { useTranslation } from 'react-i18next';


const ClockDashboard: React.FC = () => {
    /*
      La forme que prendront les **prochaines** jauges créées. Un état d'écran
      et non de magasin : c'est une intention du moment, pas une donnée de
      campagne, et la forme réelle est portée par chaque jauge.
    */
    const [formeDesNouvelles, setFormeDesNouvelles] = React.useState<FormeDeJauge>(FORME_PAR_DEFAUT);
    const [nomDeLaNouvelle, setNomDeLaNouvelle] = React.useState('');

    /**
     * **Le seul chemin de création d'une jauge**, quel que soit le geste.
     *
     * Le bouton `+N` et la touche `Entrée` passent tous deux par ici : c'est ce
     * qui garantit qu'ils ne peuvent plus diverger sur le nom, comme ils l'ont
     * fait jusqu'au 2026-08-30. Le champ se vide après coup — sans quoi le nom
     * resterait et la jauge suivante le reprendrait sans qu'on l'ait voulu.
     */
    const creerLaJauge = (segments: number) => {
        addTensionClock(
            nomDeLaJauge(nomDeLaNouvelle, t('clock.gauge_default', { segments })),
            segments,
            formeDesNouvelles,
        );
        setNomDeLaNouvelle('');
    };
    const {
        mode,
        theme,
        timestamp,
        setMode,
        setTimestamp,
        setTheme,

        timerIsRunning,
        timerRemaining,
        startTimer,
        pauseTimer,
        resetTimer,
        tensions,
        addTensionClock,
        removeTensionClock,
        updateTensionSegments,
        changerLaFormeDeLaJauge,
        changerLaCouleurDeLaJauge,
        remplirLaJauge,
        basculerSurLAfficheur,
        setTimer,
        setTimerLabel,
        timerDuration,
        timerLabel,
        isClockProjected,
        setIsClockProjected,
        availableCalendars,
        activeCalendarId,
        calendars,
        fetchCalendars,
        selectCalendar,
        getFantasyDate,
        setFantasyDate
    } = useClockStore();
    const { t } = useTranslation('modules');

    const fantasyDate = getFantasyDate();


    // Fetch calendars on mount
    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);




    /*
      **Le battement du minuteur n'est plus ici.**

      Il vivait dans cet effet, donc dans **la vue** : quitter Clock-OS pour le
      cockpit le démontait, et le minuteur cessait de descendre — y compris pour
      les tablettes, qui reçoivent `timerRemaining`. Il est monté dans `Shell`,
      comme le battement de l'afficheur et pour la même raison : *un émetteur
      attaché à une vue émet ce que la vue veut bien.*

      Voir `useBattementDuMinuteur`.
    */

    const themes: { id: typeof theme; label: string }[] = [
        { id: 'modern', label: t('clock.themes.modern') },
        { id: 'cyberpunk', label: t('clock.themes.cyberpunk') },
        { id: 'oldstyle', label: t('clock.themes.oldstyle') },
    ];


    const modes: { id: typeof mode; label: string; icon: React.ElementType }[] = [
        { id: 'realtime', label: t('clock.modes.realtime'), icon: Clock },
        { id: 'static', label: t('clock.modes.static'), icon: Settings },
        { id: 'timer', label: t('clock.modes.timer'), icon: Timer },
        { id: 'fantasy', label: t('clock.modes.fantasy'), icon: Calendar },
    ];

    return (
        <div className="h-full grid grid-cols-12 gap-6 p-6 bg-app-bg/50 overflow-hidden">
            {/* Sidebar Controls */}
            <div className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <section className="bg-app-surface/80 border border-app-border rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-app-text/60 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <LayoutGrid size={16} /> {t('clock.config')}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-app-text/50 mb-2 block uppercase font-medium">{t('clock.time_mode')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {modes.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${mode === m.id
                                            ? 'bg-accent/20 border-accent text-accent shadow-glow-accent'
                                            : 'bg-app-surface/50 border-app-border text-app-text/60 hover:border-accent/50 hover:bg-app-surface'
                                            }`}
                                    >
                                        <m.icon size={14} />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-app-text/50 mb-2 block uppercase font-medium">{t('clock.visual_theme')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${theme === t.id
                                            ? 'bg-accent/20 border-accent text-accent shadow-glow-accent'
                                            : 'bg-app-surface/50 border-app-border text-app-text/60 hover:border-accent/50 hover:bg-app-surface'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mode === 'fantasy' && (
                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-medium block mb-2">{t('clock.calendar')}</label>
                                    <select
                                        className="w-full bg-app-bg border border-app-border rounded p-2 text-xs text-app-text focus:outline-none focus:border-accent"
                                        value={activeCalendarId || ''}
                                        onChange={(e) => selectCalendar(e.target.value)}
                                    >
                                        <option value="" disabled>{t('clock.choose_calendar')}</option>
                                        {availableCalendars.map(calId => (
                                            <option key={calId} value={calId}>{calId}</option>
                                        ))}
                                    </select>
                                </div>

                                {activeCalendarId && calendars[activeCalendarId] && fantasyDate && (
                                    <div className="space-y-3 pt-2 border-t border-app-border/50">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase block mb-1">{t('clock.year')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text"
                                                    value={fantasyDate.year}
                                                    onChange={(e) => setFantasyDate({ year: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase block mb-1">{t('clock.day')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text"
                                                    value={fantasyDate.day}
                                                    onChange={(e) => setFantasyDate({ day: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase block mb-1">{t('clock.month')}</label>
                                            <select
                                                className="w-full bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text"
                                                value={fantasyDate.monthIndex}
                                                onChange={(e) => setFantasyDate({ monthIndex: parseInt(e.target.value) })}
                                            >
                                                {calendars[activeCalendarId].months.map((m, idx) => {
                                                    const isLeap = fantasyDate.year % 4 === 0;
                                                    if (m.leapYearOnly && !isLeap) return null;
                                                    return <option key={idx} value={idx}>{m.displayName || m.name}</option>;
                                                })}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <input
                                                type="number"
                                                placeholder="HH"
                                                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center"
                                                value={fantasyDate.hour}
                                                onChange={(e) => setFantasyDate({ hour: parseInt(e.target.value) })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="MM"
                                                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center"
                                                value={fantasyDate.minute}
                                                onChange={(e) => setFantasyDate({ minute: parseInt(e.target.value) })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="SS"
                                                className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white text-center"
                                                value={fantasyDate.second}
                                                onChange={(e) => setFantasyDate({ second: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'static' && (
                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs text-slate-500 uppercase font-medium block">{t('clock.manual_setting')}</label>
                                <div className="space-y-2">
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                        value={new Date(timestamp).toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const newDate = new Date(e.target.value);
                                            const currentDate = new Date(timestamp);
                                            newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
                                            setTimestamp(newDate.getTime());
                                        }}
                                    />
                                    <input
                                        type="time"
                                        step="1"
                                        className="w-full bg-app-bg border border-app-border rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                        value={new Date(timestamp).toTimeString().split(' ')[0]}
                                        onChange={(e) => {
                                            const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
                                            const newDate = new Date(timestamp);
                                            newDate.setHours(hours, minutes, seconds || 0);
                                            setTimestamp(newDate.getTime());
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Timer Control Section */}
                <section className="bg-app-surface/80 border border-app-border rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-app-text/60 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Timer size={16} /> {t('clock.timer_section')}
                    </h3>

                    <div className="space-y-2 mb-4">
                        <input
                            type="text"
                            placeholder={t('clock.timer_placeholder')}
                            className="w-full bg-app-surface/80 border border-app-border rounded-lg p-2 text-xs text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                            value={timerLabel}
                            onChange={(e) => setTimerLabel(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-4 justify-center bg-app-surface/50 p-4 rounded-xl border border-app-border/50">

                        <span className={`text-3xl font-mono font-bold tracking-tighter tabular-nums leading-none ${timerRemaining === 0 && timerDuration > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:
                            {(timerRemaining % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[1, 5, 10, 15, 30, 60].map(m => (
                            <button
                                key={m}
                                onClick={() => setTimer(m * 60)}
                                className="bg-app-surface/80 border border-app-border text-[10px] font-bold py-1 rounded hover:bg-app-surface hover:text-accent transition-all"
                            >
                                {m}m
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">

                        {!timerIsRunning ? (
                            <button
                                onClick={startTimer}
                                className="flex-1 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 p-2 rounded-lg text-xs font-bold uppercase hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Play size={14} fill="currentColor" /> {t('clock.start')}
                            </button>
                        ) : (
                            <button
                                onClick={pauseTimer}
                                className="flex-1 bg-amber-600/20 border border-amber-500/50 text-amber-400 p-2 rounded-lg text-xs font-bold uppercase hover:bg-amber-600/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Pause size={14} fill="currentColor" /> {t('clock.pause')}
                            </button>
                        )}
                        <button
                            onClick={resetTimer}
                            className="bg-app-surface border border-app-border text-app-text/60 p-2 rounded-lg hover:bg-app-surface/80 hover:text-accent transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </section>

                {/* Tension Clocks Grid Add */}
                <section className="bg-app-surface/80 border border-app-border rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-app-text/60 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Plus size={16} /> {t('clock.new_gauge')}
                    </h3>
                    <div className="flex flex-col gap-3">
                        {/*
                          **Un seul chemin de création, et c'est tout le
                          correctif.**

                          *Signalé par David le 2026-08-30 : « quand j'ajoute une
                          jauge, son nom est toujours Jauge 6, alors que je l'ai
                          déclarée Impulsion ».* Le champ était **non contrôlé**
                          et n'agissait que sur `Entrée` ; les boutons `+N`, eux,
                          ne l'avaient jamais lu et fabriquaient toujours le
                          libellé par défaut. Or le champ est posé juste au-dessus
                          d'eux, dans le même bloc : tout dit qu'il leur
                          appartient.

                          `Entrée` avait sa propre règle en prime — six segments,
                          quel que soit le bouton qu'on aurait choisi. *Deux
                          chemins pour un même geste, et un seul lisait ce que
                          l'utilisateur avait écrit.*
                        */}
                        <input
                            type="text"
                            value={nomDeLaNouvelle}
                            onChange={(e) => setNomDeLaNouvelle(e.target.value)}
                            placeholder={t('clock.gauge_placeholder')}
                            className="bg-app-surface/80 border border-app-border rounded-lg p-2 text-xs text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                            onKeyDown={(e) => { if (e.key === 'Enter') creerLaJauge(SEGMENTS_PAR_DEFAUT); }}
                        />
                        <ChoixDeLaForme valeur={formeDesNouvelles} onChoisir={setFormeDesNouvelles} />
                        <div className="flex gap-2 flex-wrap">
                            {SEGMENTS_PROPOSES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => creerLaJauge(s)}
                                    title={nomDeLaNouvelle.trim()
                                        ? t('clock.gauge_add_named', { nom: nomDeLaNouvelle.trim(), segments: s })
                                        : t('clock.gauge_add_default', { segments: s })}
                                    className="bg-app-bg/50 border border-app-border text-app-text/50 px-2 py-1 rounded text-[10px] font-bold hover:bg-app-surface hover:text-accent transition-all"
                                >
                                    +{s}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Main Visualizer */}
            <div className="col-span-9 flex flex-col gap-6 overflow-hidden">
                {/* Main Clock Area */}
                <div className="flex-1 min-h-[400px] bg-app-surface/40 border border-app-border/50 rounded-2xl relative flex items-center justify-center overflow-hidden group">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={() => setIsClockProjected(!isClockProjected)}
                            className={`p-2 rounded-full transition-all border ${isClockProjected
                                ? 'bg-accent/20 border-accent text-accent shadow-glow-accent'
                                : 'bg-app-surface/50 border-app-border text-app-text/50 hover:text-app-text'
                                }`}
                            title={isClockProjected ? t('clock.projection.hide') : t('clock.projection.show')}
                        >
                            <Monitor size={16} />
                        </button>
                    </div>

                    <div className="w-full h-full flex items-center justify-center p-12">
                        <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
                    </div>

                </div>

                {/* Tension Clocks Grid */}
                <div className="h-1/3 bg-app-surface/20 border border-app-border/30 rounded-2xl p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="grid grid-cols-4 gap-6">
                        {tensions.map((clock) => (
                            <div
                                key={clock.id}
                                className="bg-app-surface/60 border border-app-border rounded-xl p-4 relative group hover:border-accent/40 transition-all backdrop-blur-sm"
                            >
                                <button
                                    onClick={() => removeTensionClock(clock.id)}
                                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            // Simple logic: left click adds, right click (handled separately) or shift-click removes
                                            if (e.shiftKey) {
                                                updateTensionSegments(clock.id, -1);
                                            } else {
                                                updateTensionSegments(clock.id, 1);
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            updateTensionSegments(clock.id, -1);
                                        }}
                                    >
                                        <NarrativeClock clock={clock} theme={theme} size={100} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-300 truncate w-full max-w-[120px] uppercase tracking-tight">{clock.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono italic">
                                            {clock.filledSegments} / {clock.totalSegments} {t('clock.segments')}
                                        </p>
                                    </div>

                                    {/*
                                      Changer d'avis sur une jauge déjà posée.
                                      Discret au repos, franc au survol : quatre
                                      boutons toujours allumés sur chaque carte
                                      disputeraient l'œil à la jauge elle-même,
                                      qui est la seule chose à lire en séance.
                                    */}
                                    <div className="opacity-30 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        <ChoixDeLaForme
                                            compact
                                            valeur={clock.forme ?? FORME_PAR_DEFAUT}
                                            onChoisir={(f) => changerLaFormeDeLaJauge(clock.id, f)}
                                        />
                                        {/*
                                          **La couleur de cette jauge SUR L'AFFICHEUR.**

                                          Demandé par David le 2026-08-31. Le champ
                                          `color` existait depuis toujours et **rien ne
                                          le renseignait** — aucune interface ne le
                                          posait, aucun rendu ne le lisait. L'Ulanzi le
                                          lit désormais, jauge par jauge, ce qui lui
                                          donne enfin un usage.

                                          Les jauges de CET écran gardent leur habillage
                                          de thème : ce réglage-ci ne parle qu'à l'objet
                                          de la table.
                                        */}
                                        <input
                                            type="color"
                                            value={clock.color ?? COULEUR_DE_JAUGE_PAR_DEFAUT}
                                            onChange={(e) => changerLaCouleurDeLaJauge(clock.id, e.target.value)}
                                            title={t('clock.gauge_color')}
                                            aria-label={t('clock.gauge_color')}
                                            className="h-5 w-5 shrink-0 cursor-pointer rounded border border-slate-700 bg-transparent p-0"
                                        />
                                        {clock.color && (
                                            <button
                                                type="button"
                                                onClick={() => changerLaCouleurDeLaJauge(clock.id, null)}
                                                title={t('clock.gauge_color_reset')}
                                                className="text-xs leading-none text-slate-600 hover:text-slate-300"
                                            >
                                                ×
                                            </button>
                                        )}

                                        {/*
                                          **Remplir d'un coup.** Un instrument qui *se
                                          vide* — le Voight-Kampff — part de son
                                          maximum ; sans ce geste il fallait six clics
                                          sur `+1` avant de pouvoir le descendre.
                                        */}
                                        <button
                                            type="button"
                                            onClick={() => remplirLaJauge(clock.id)}
                                            title={t('clock.gauge_fill')}
                                            aria-label={t('clock.gauge_fill')}
                                            className="shrink-0 text-slate-600 hover:text-slate-200"
                                        >
                                            <ChevronsUp size={14} />
                                        </button>

                                        {/*
                                          **Sur l'afficheur, ou non.** `isClockProjected`
                                          est tout-ou-rien ; ce drapeau choisit LESQUELLES
                                          des jauges vont sur les 32 pixels. Absent, elle
                                          y va — on retire une jauge de l'afficheur, on
                                          ne l'y ajoute pas.
                                        */}
                                        <button
                                            type="button"
                                            onClick={() => basculerSurLAfficheur(clock.id)}
                                            title={(clock.surLAfficheur ?? true)
                                                ? t('clock.gauge_display_off')
                                                : t('clock.gauge_display_on')}
                                            aria-label={t('clock.gauge_display')}
                                            className={`shrink-0 transition-colors ${(clock.surLAfficheur ?? true)
                                                ? 'text-gm-gold/70 hover:text-gm-gold'
                                                : 'text-slate-700 hover:text-slate-500'}`}
                                        >
                                            <MonitorSmartphone size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {tensions.length === 0 && (
                            <div className="col-span-4 h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl py-8">
                                <Plus size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium italic">{t('clock.empty.no_gauges')}</p>
                                <p className="text-[10px] uppercase mt-1">{t('clock.empty.create_hint')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClockDashboard;
