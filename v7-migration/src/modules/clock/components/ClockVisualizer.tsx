import React, { useState, useEffect } from 'react';
import type { ClockMode, ClockTheme } from '../../../store/useClockStore';
import { useClockStore } from '../../../store/useClockStore';
import { useTranslation } from 'react-i18next';

interface ClockVisualizerProps {
    theme: ClockTheme;
    timestamp: number;
    mode: ClockMode;
}

const ClockVisualizer: React.FC<ClockVisualizerProps> = ({ theme, timestamp, mode }) => {
    const { timerRemaining, timerDuration, timerLabel, calendars, activeCalendarId, getFantasyDate } = useClockStore();
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

                {/* Hands Container - Centered */}
                <div className="absolute inset-0 pointer-events-none">

                    {/* Hour Hand */}
                    <div
                        className="absolute w-2 h-24 bg-gradient-to-t from-amber-800 to-amber-500 rounded-full shadow-lg"
                        style={{
                            left: 'calc(50% - 4px)',
                            top: 'calc(50% - 96px)',
                            transformOrigin: 'bottom center',
                            transform: `rotate(${hRotate}deg)`
                        }}
                    >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-7 bg-amber-500 rounded-t-full border border-amber-300/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                    </div>

                    {/* Minute Hand */}
                    <div
                        className="absolute w-1.5 h-36 bg-gradient-to-t from-amber-700 to-amber-400 rounded-full shadow-md"
                        style={{
                            left: 'calc(50% - 3px)',
                            top: 'calc(50% - 144px)',
                            transformOrigin: 'bottom center',
                            transform: `rotate(${mRotate}deg)`
                        }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-400 rounded-full border border-amber-200/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                    </div>

                    {/* Second Hand */}
                    <div
                        className="absolute w-0.5 h-40 bg-red-600 rounded-full shadow-sm"
                        style={{
                            left: 'calc(50% - 1px)',
                            top: 'calc(50% - 160px)',
                            transformOrigin: 'bottom center',
                            transform: `rotate(${sRotate}deg)`
                        }}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-red-500 rounded-full" />
                    </div>

                    {/* Center Pin Hub */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-950 border-4 border-amber-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center z-20">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_white]" />
                    </div>
                </div>

                <div className="absolute bottom-[-80px] text-center w-full">
                    <p className="font-serif italic text-amber-200/80 text-xl tracking-[0.2em] font-bold drop-shadow-md">
                        {mode === 'fantasy' ? formatDate(date).toUpperCase() : date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                    </p>
                </div>
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
        const total = timerDuration || 1;
        const percentage = (timerRemaining / total) * 100;

        const getTimerTheme = () => {
            switch (theme) {
                case 'cyberpunk':
                    return {
                        ring: 'var(--accent)',
                        bg: 'rgba(var(--accent-rgb), 0.1)',
                        text: timerRemaining === 0 ? '#f43f5e' : 'var(--accent)',
                        glow: 'drop-shadow-glow-accent',
                        font: 'font-mono uppercase tracking-tighter'
                    };
                case 'oldstyle':
                    return {
                        ring: '#f59e0b',
                        bg: '#451a03',
                        text: timerRemaining === 0 ? '#ef4444' : '#d97706',
                        glow: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))',
                        font: 'font-serif italic'
                    };
                case 'modern':
                default:
                    return {
                        ring: 'var(--accent)',
                        bg: 'var(--app-surface)',
                        text: timerRemaining === 0 ? '#ef4444' : 'var(--app-text)',
                        glow: 'drop-shadow-glow-accent',
                        font: 'font-mono tabular-nums tracking-tighter'
                    };
            }
        };

        const timerColors = getTimerTheme();

        return (
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-96 h-96 flex items-center justify-center">
                    {/* Outer Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                            cx="192"
                            cy="192"
                            r="180"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            style={{ color: timerColors.bg }}
                        />
                        <circle
                            cx="192"
                            cy="192"
                            r="180"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={1131}
                            strokeDashoffset={1131 - (1131 * percentage) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                            style={{
                                color: timerRemaining < 10 && theme !== 'oldstyle' ? '#ef4444' : timerColors.ring,
                                filter: timerColors.glow
                            }}
                        />
                    </svg>

                    <div className="flex flex-col items-center z-10">
                        <span className={`text-[120px] font-black leading-none ${timerColors.font} ${timerRemaining === 0 ? 'animate-bounce' : ''}`} style={{ color: timerColors.text }}>
                            {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:
                            {(timerRemaining % 60).toString().padStart(2, '0')}
                        </span>
                        <span className={`uppercase tracking-[0.5em] font-bold mt-4 text-center max-w-md px-4 ${theme === 'oldstyle' ? 'font-serif italic text-amber-600' : 'text-app-text/50'}`}>
                            {timerLabel || (theme === 'oldstyle' ? t('clock.visualizer.hourglass') : t('clock.visualizer.active_timer'))}
                        </span>
                    </div>
                </div>
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
