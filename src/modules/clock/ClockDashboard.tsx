import React, { useEffect } from 'react';
import { dateDuChamp, heureDuChamp } from './logic/champsDeDate';
import { horodatageValide } from '../../store/useClockStore';
import { useClockStore } from '../../store/useClockStore';
import {
    Clock,
    Timer,
    Calendar,
    Settings,
    Plus,
    Play,
    Pause,
    RotateCcw,
    Monitor,
    LayoutGrid,
    Bell,
    BellOff,
    CalendarPlus
} from 'lucide-react';
import ClockVisualizer from './components/ClockVisualizer';
import CarteDeJauge from './components/CarteDeJauge';
import ChoixDeLaForme from './components/ChoixDeLaForme';
import ChoixDuSens from './components/ChoixDuSens';
import { FORME_PAR_DEFAUT, type FormeDeJauge } from './components/formesDeJauge';
import {
    SENS_PAR_DEFAUT, type SensDeLaJauge,
} from './logic/sensDeLaJauge';
import { nomDeLaJauge, SEGMENTS_PROPOSES, SEGMENTS_PAR_DEFAUT } from './logic/nomDeLaJauge';
import { estBissextile } from './logic/formeDuCalendrier';
import { AtelierDesCalendriers } from './atelier/AtelierDesCalendriers';
import { useTranslation } from 'react-i18next';


const ClockDashboard: React.FC = () => {
    /*
      La forme que prendront les **prochaines** jauges créées. Un état d'écran
      et non de magasin : c'est une intention du moment, pas une donnée de
      campagne, et la forme réelle est portée par chaque jauge.
    */
    const [formeDesNouvelles, setFormeDesNouvelles] = React.useState<FormeDeJauge>(FORME_PAR_DEFAUT);
    /* Même raison que la forme : l'intention du moment, pas une donnée de campagne. */
    const [sensDesNouvelles, setSensDesNouvelles] = React.useState<SensDeLaJauge>(SENS_PAR_DEFAUT);
    const [nomDeLaNouvelle, setNomDeLaNouvelle] = React.useState('');
    const [atelierOuvert, setAtelierOuvert] = React.useState(false);

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
            sensDesNouvelles,
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
        setTimer,
        setTimerLabel,
        timerDuration,
        timerLabel,
        sonnerieDuMinuteur,
        basculerLaSonnerie,
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
            <AtelierDesCalendriers
                ouvert={atelierOuvert}
                onFermer={() => setAtelierOuvert(false)}
                onCalendriersChanges={() => { void fetchCalendars(); }}
                idDepart={activeCalendarId}
            />
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
                                        className={`p-2 rounded-lg border text-ui-10 font-bold uppercase transition-all ${theme === t.id
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
                            <div className="bg-app-surface-2/30 border border-app-border/50 rounded-lg p-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="text-xs text-app-subtle uppercase font-medium block mb-2">{t('clock.calendar')}</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 min-w-0 bg-app-bg border border-app-border rounded p-2 text-xs text-app-text focus:outline-none focus:border-accent"
                                            value={activeCalendarId || ''}
                                            onChange={(e) => selectCalendar(e.target.value)}
                                        >
                                            <option value="" disabled>{t('clock.choose_calendar')}</option>
                                            {availableCalendars.map(calId => (
                                                <option key={calId} value={calId}>{calId}</option>
                                            ))}
                                        </select>
                                        {/*
                                          ⭐ **L'Atelier des calendriers, 2026-09-15.**
                                          Avant lui, un calendrier ne se créait qu'en posant
                                          un JSON à la main dans `databases/calendars/` — et
                                          un seul existait, livré d'usine, en un mois de
                                          construction.
                                        */}
                                        <button
                                            type="button"
                                            onClick={() => setAtelierOuvert(true)}
                                            title={t('clock.calendar_workshop')}
                                            aria-label={t('clock.calendar_workshop')}
                                            className="shrink-0 px-2 rounded border border-app-border text-app-text/50 hover:text-accent hover:border-accent/50 transition-colors"
                                        >
                                            <CalendarPlus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {activeCalendarId && calendars[activeCalendarId] && fantasyDate && (
                                    <div className="space-y-3 pt-2 border-t border-app-border/50">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-ui-10 text-app-subtle uppercase block mb-1">{t('clock.year')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text"
                                                    value={fantasyDate.year}
                                                    onChange={(e) => setFantasyDate({ year: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-ui-10 text-app-subtle uppercase block mb-1">{t('clock.day')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text"
                                                    value={fantasyDate.day}
                                                    onChange={(e) => setFantasyDate({ day: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-ui-10 text-app-subtle uppercase block mb-1">{t('clock.month')}</label>
                                            <select
                                                className="w-full bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text"
                                                value={fantasyDate.monthIndex}
                                                onChange={(e) => setFantasyDate({ monthIndex: parseInt(e.target.value) })}
                                            >
                                                {calendars[activeCalendarId].months.map((m, idx) => {
                                                    const isLeap = estBissextile(calendars[activeCalendarId], fantasyDate.year);
                                                    if (m.leapYearOnly && !isLeap) return null;
                                                    return <option key={idx} value={idx}>{m.displayName || m.name}</option>;
                                                })}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <input
                                                type="number"
                                                placeholder="HH"
                                                className="bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text text-center"
                                                value={fantasyDate.hour}
                                                onChange={(e) => setFantasyDate({ hour: parseInt(e.target.value) })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="MM"
                                                className="bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text text-center"
                                                value={fantasyDate.minute}
                                                onChange={(e) => setFantasyDate({ minute: parseInt(e.target.value) })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="SS"
                                                className="bg-app-bg border border-app-border rounded p-1.5 text-xs text-app-text text-center"
                                                value={fantasyDate.second}
                                                onChange={(e) => setFantasyDate({ second: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'static' && (
                            <div className="bg-app-surface-2/30 border border-app-border/50 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs text-app-subtle uppercase font-medium block">{t('clock.manual_setting')}</label>
                                <div className="space-y-2">
                                    <input
                                        type="date"
                                        className="w-full bg-app-bg border border-app-border rounded p-2 text-xs text-app-text focus:outline-none focus:border-etat-info"
                                        value={dateDuChamp(timestamp)}
                                        onChange={(e) => {
                                            /*
                                              **Un champ vidé ne pose plus rien.**
                                              `new Date('')` rend une date
                                              invalide, dont `getTime()` vaut
                                              `NaN` — et c'est par là que le
                                              tableau de bord tombait. Le magasin
                                              le refuse désormais aussi ; on
                                              s'arrête ici pour ne pas même le
                                              lui proposer.
                                            */
                                            const newDate = new Date(e.target.value);
                                            if (Number.isNaN(newDate.getTime())) return;
                                            const currentDate = new Date(timestamp);
                                            newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
                                            setTimestamp(newDate.getTime());
                                        }}
                                    />
                                    <input
                                        type="time"
                                        step="1"
                                        className="w-full bg-app-bg border border-app-border rounded p-2 text-xs text-app-text focus:outline-none focus:border-etat-info"
                                        value={heureDuChamp(timestamp)}
                                        onChange={(e) => {
                                            /*
                                              Même garde que le champ de date :
                                              vidé, `''.split(':')` rend `[NaN]`,
                                              et `setHours(NaN)` invalide la
                                              date. Ce champ-ci ne plantait pas
                                              — `toTimeString()` ne lève pas —
                                              mais il posait la **même** valeur
                                              fausse, qui allait ensuite tuer
                                              son voisin.
                                            */
                                            const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
                                            if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
                                            const newDate = new Date(horodatageValide(timestamp) ? timestamp : Date.now());
                                            newDate.setHours(hours, minutes, Number.isFinite(seconds) ? seconds : 0);
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

                        {/*
                          **La cloche de fin, et son interrupteur** (point C3,
                          2026-09-05). `ChimeEngine` était écrit en entier et
                          n'avait aucun appelant : aucune sonnerie n'existait
                          nulle part. Elle sonne maintenant à zéro.

                          Le bouton est ici plutôt que dans les réglages : c'est
                          la seule section où le mot « sonnerie » veut dire
                          quelque chose, et on l'éteint au moment où elle gêne.
                        */}
                        <button
                            type="button"
                            onClick={basculerLaSonnerie}
                            title={sonnerieDuMinuteur ? t('clock.chime_off') : t('clock.chime_on')}
                            aria-label={t('clock.chime')}
                            className={`ml-auto shrink-0 transition-colors ${sonnerieDuMinuteur
                                ? 'text-gm-gold/70 hover:text-gm-gold'
                                : 'text-app-subtle hover:text-app-muted'}`}
                        >
                            {sonnerieDuMinuteur ? <Bell size={14} /> : <BellOff size={14} />}
                        </button>
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

                        <span className={`text-3xl font-mono font-bold tracking-tighter tabular-nums leading-none ${timerRemaining === 0 && timerDuration > 0 ? 'text-etat-danger animate-pulse' : 'text-app-text'}`}>
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
                                className="bg-app-surface/80 border border-app-border text-ui-10 font-bold py-1 rounded hover:bg-app-surface hover:text-accent transition-all"
                            >
                                {m}m
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">

                        {!timerIsRunning ? (
                            <button
                                onClick={startTimer}
                                className="flex-1 bg-etat-succes/20 border border-etat-succes/50 text-etat-succes p-2 rounded-lg text-xs font-bold uppercase hover:bg-etat-succes/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Play size={14} fill="currentColor" /> {t('clock.start')}
                            </button>
                        ) : (
                            <button
                                onClick={pauseTimer}
                                className="flex-1 bg-etat-alerte/20 border border-etat-alerte/50 text-etat-alerte p-2 rounded-lg text-xs font-bold uppercase hover:bg-etat-alerte/30 transition-colors flex items-center justify-center gap-2"
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
                        {/*
                          **Le sens se choisit AVANT la création, pas après.**
                          Un consommable naît plein : le décider après coup
                          obligerait à créer une jauge vide — qui crierait — puis
                          à la remplir. *Le réglage qui change l'état de départ
                          appartient au formulaire de départ.*
                        */}
                        <ChoixDuSens valeur={sensDesNouvelles} onChoisir={setSensDesNouvelles} />
                        <div className="flex gap-2 flex-wrap">
                            {SEGMENTS_PROPOSES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => creerLaJauge(s)}
                                    title={nomDeLaNouvelle.trim()
                                        ? t('clock.gauge_add_named', { nom: nomDeLaNouvelle.trim(), segments: s })
                                        : t('clock.gauge_add_default', { segments: s })}
                                    className="bg-app-bg/50 border border-app-border text-app-text/50 px-2 py-1 rounded text-ui-10 font-bold hover:bg-app-surface hover:text-accent transition-all"
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
                <div className="shrink-0 h-[44%] min-h-[18rem] bg-app-surface/40 border border-app-border/50 rounded-2xl relative flex items-center justify-center overflow-hidden group">
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

                {/*
                  **Les jauges ont la place** — refonte, L4, étape 2. Elles
                  tenaient dans le tiers bas de l'écran, sous un cadran qui
                  prenait le reste ; ce sont elles qu'on touche en séance.
                */}
                <div className="flex-1 min-h-0 bg-app-surface/20 border border-app-border/30 rounded-2xl p-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-app-text/60">
                        <LayoutGrid size={16} /> {t('clock.agencement.jauges')}
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-5 pt-2">
                        {tensions.map((clock) => (
                            <CarteDeJauge key={clock.id} clock={clock} theme={theme} />
                        ))}

                        {tensions.length === 0 && (
                            <div className="col-span-full h-full flex flex-col items-center justify-center text-app-subtle border-2 border-dashed border-app-border/50 rounded-xl py-8">
                                <Plus size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium italic">{t('clock.empty.no_gauges')}</p>
                                <p className="text-ui-10 uppercase mt-1">{t('clock.empty.create_hint')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClockDashboard;
