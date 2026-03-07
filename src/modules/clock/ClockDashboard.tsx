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
    LayoutGrid
} from 'lucide-react';
import ClockVisualizer from './components/ClockVisualizer';
import NarrativeClock from './components/NarrativeClock';


const ClockDashboard: React.FC = () => {
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
        tickTimer,
        tensions,
        addTensionClock,
        removeTensionClock,
        updateTensionSegments,
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

    const fantasyDate = getFantasyDate();


    // Fetch calendars on mount
    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);




    // Timer interval
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        if (timerIsRunning && timerRemaining > 0) {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerIsRunning, timerRemaining, tickTimer]);

    const themes: { id: typeof theme; label: string }[] = [
        { id: 'modern', label: 'Moderne' },
        { id: 'cyberpunk', label: 'Cyberpunk' },
        { id: 'oldstyle', label: 'Old Style' },
    ];


    const modes: { id: typeof mode; label: string; icon: React.ElementType }[] = [

        { id: 'realtime', label: 'Temps Réel', icon: Clock },
        { id: 'static', label: 'Statique', icon: Settings },
        { id: 'timer', label: 'Minuteur', icon: Timer },
        { id: 'fantasy', label: 'Fantastique', icon: Calendar },
    ];

    return (
        <div className="h-full grid grid-cols-12 gap-6 p-6 bg-slate-950/50 overflow-hidden">
            {/* Sidebar Controls */}
            <div className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <LayoutGrid size={16} /> Configuration
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 mb-2 block uppercase font-medium">Mode de Temps</label>
                            <div className="grid grid-cols-2 gap-2">
                                {modes.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${mode === m.id
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-900/20'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
                                            }`}
                                    >
                                        <m.icon size={14} />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-2 block uppercase font-medium">Thème Visuel</label>
                            <div className="grid grid-cols-3 gap-2">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${theme === t.id
                                            ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-900/20'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
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
                                    <label className="text-xs text-slate-500 uppercase font-medium block mb-2">Calendrier</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                        value={activeCalendarId || ''}
                                        onChange={(e) => selectCalendar(e.target.value)}
                                    >
                                        <option value="" disabled>Choisir un calendrier...</option>
                                        {availableCalendars.map(calId => (
                                            <option key={calId} value={calId}>{calId}</option>
                                        ))}
                                    </select>
                                </div>

                                {activeCalendarId && calendars[activeCalendarId] && fantasyDate && (
                                    <div className="space-y-3 pt-2 border-t border-slate-700/50">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Année</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                                                    value={fantasyDate.year}
                                                    onChange={(e) => setFantasyDate({ year: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Jour</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                                                    value={fantasyDate.day}
                                                    onChange={(e) => setFantasyDate({ day: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase block mb-1">Mois</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
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
                                <label className="text-xs text-slate-500 uppercase font-medium block">Réglage Manuel</label>
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
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
                <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Timer size={16} /> Minuteur
                    </h3>

                    <div className="space-y-2 mb-4">
                        <input
                            type="text"
                            placeholder="Message du minuteur..."
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                            value={timerLabel}
                            onChange={(e) => setTimerLabel(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 mb-4 justify-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">

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
                                className="bg-slate-800/80 border border-slate-700 text-[10px] font-bold py-1 rounded hover:bg-slate-700 hover:text-blue-400 transition-all"
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
                                <Play size={14} fill="currentColor" /> Départ
                            </button>
                        ) : (
                            <button
                                onClick={pauseTimer}
                                className="flex-1 bg-amber-600/20 border border-amber-500/50 text-amber-400 p-2 rounded-lg text-xs font-bold uppercase hover:bg-amber-600/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Pause size={14} fill="currentColor" /> Pause
                            </button>
                        )}
                        <button
                            onClick={resetTimer}
                            className="bg-slate-800 border border-slate-700 text-slate-400 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </section>

                {/* Tension Clocks Grid Add */}
                <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Plus size={16} /> Nouvelle Jauge
                    </h3>
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Nom de la jauge..."
                            className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                        addTensionClock(val, 6);
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                        <div className="flex gap-2 flex-wrap">
                            {[4, 6, 8, 10, 12].map(s => (
                                <button
                                    key={s}
                                    onClick={() => addTensionClock(`Jauge ${s} seg`, s)}
                                    className="bg-slate-800/50 border border-slate-700 text-slate-400 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-700 hover:text-white transition-all"
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
                <div className="flex-1 min-h-[400px] bg-slate-900/40 border border-slate-800/50 rounded-2xl relative flex items-center justify-center overflow-hidden group">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={() => setIsClockProjected(!isClockProjected)}
                            className={`p-2 rounded-full transition-all border ${isClockProjected
                                ? 'bg-sky-600/20 border-sky-500 text-sky-400 shadow-lg shadow-sky-900/40'
                                : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-white'
                                }`}
                            title={isClockProjected ? "Caché du Player Hub" : "Affiché sur le Player Hub"}
                        >
                            <Monitor size={16} />
                        </button>
                    </div>

                    <div className="w-full h-full flex items-center justify-center p-12">
                        <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
                    </div>

                </div>

                {/* Tension Clocks Grid */}
                <div className="h-1/3 bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="grid grid-cols-4 gap-6">
                        {tensions.map((clock) => (
                            <div
                                key={clock.id}
                                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative group hover:border-slate-600 transition-all backdrop-blur-sm"
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
                                            {clock.filledSegments} / {clock.totalSegments} Segments
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {tensions.length === 0 && (
                            <div className="col-span-4 h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/50 rounded-xl py-8">
                                <Plus size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium italic">Aucune jauge active</p>
                                <p className="text-[10px] uppercase mt-1">Créez-en une pour suivre la tension narrative</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClockDashboard;
