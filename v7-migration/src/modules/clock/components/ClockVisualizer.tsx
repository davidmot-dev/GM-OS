import React, { useState, useEffect } from 'react';
import type { ClockMode, ClockTheme } from '../../../store/useClockStore';
import { useClockStore } from '../../../store/useClockStore';

interface ClockVisualizerProps {
    theme: ClockTheme;
    timestamp: number;
    mode: ClockMode;
}

const ClockVisualizer: React.FC<ClockVisualizerProps> = ({ theme, timestamp, mode }) => {
    const { timerRemaining, timerDuration, timerLabel, calendars, activeCalendarId, getFantasyDate } = useClockStore();
    const [realtimeDate, setRealtimeDate] = useState(new Date());

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
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (d: Date) => {
        if (mode === 'fantasy' && activeCalendarId && calendars[activeCalendarId] && fantasyDate) {
            const cal = calendars[activeCalendarId];
            const monthObj = cal.months[fantasyDate.monthIndex];
            const monthName = monthObj.displayName || monthObj.name;
            let dateStr = `${fantasyDate.day} ${monthName} ${fantasyDate.year}`;
            if (fantasyDate.dayOfWeek) dateStr = `${fantasyDate.dayOfWeek} ${dateStr}`;
            return dateStr;
        }
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const renderCyberpunk = () => (
        <div className="relative flex flex-col items-center justify-center font-mono">
            <div className="text-7xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] tracking-tighter tabular-nums mb-2">
                {formatTime(date)}
            </div>
            <div className="text-xs uppercase tracking-[0.4em] text-pink-500 font-bold bg-pink-500/10 px-3 py-1 rounded border border-pink-500/30 mt-4">
                {formatDate(date)}
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
        const sRotate = seconds * 6;
        const mRotate = minutes * 6 + seconds * 0.1;
        const hRotate = (hours % 12) * 30 + minutes * 0.5;

        return (
            <div className="relative w-96 h-96 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-950/40 rounded-full border-8 border-amber-900 shadow-2xl" />
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute w-2 h-24 bg-amber-500 rounded-full" style={{ left: '50%', top: '50%', transformOrigin: 'bottom center', transform: `translate(-50%, -100%) rotate(${hRotate}deg)` }} />
                    <div className="absolute w-1.5 h-36 bg-amber-400 rounded-full" style={{ left: '50%', top: '50%', transformOrigin: 'bottom center', transform: `translate(-50%, -100%) rotate(${mRotate}deg)` }} />
                    <div className="absolute w-0.5 h-40 bg-red-600 rounded-full" style={{ left: '50%', top: '50%', transformOrigin: 'bottom center', transform: `translate(-50%, -100%) rotate(${sRotate}deg)` }} />
                </div>
                <div className="absolute bottom-[-60px] text-center w-full">
                    <p className="font-serif italic text-amber-200/80 text-xl font-bold uppercase tracking-widest">{formatDate(date)}</p>
                </div>
            </div>
        );
    };

    const renderModern = () => (
        <div className="flex flex-col items-center">
            <div className="text-9xl font-thin text-white tracking-tighter tabular-nums flex items-baseline">
                {date.getHours().toString().padStart(2, '0')}
                <span className="text-white/20 mx-2">:</span>
                {date.getMinutes().toString().padStart(2, '0')}
            </div>
            <div className="text-xl text-white/60 font-light tracking-widest uppercase mt-4">{formatDate(date)}</div>
        </div>
    );

    const renderTimer = () => {
        const total = timerDuration || 1;
        const percentage = (timerRemaining / total) * 100;
        return (
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-80 h-80 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="160" cy="160" r="150" stroke="#334155" strokeWidth="4" fill="transparent" />
                        <circle cx="160" cy="160" r="150" stroke="#06b6d4" strokeWidth="8" fill="transparent" strokeDasharray={942} strokeDashoffset={942 - (942 * percentage) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="flex flex-col items-center z-10">
                        <span className="text-8xl font-black text-cyan-400 tabular-nums">
                            {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:
                            {(timerRemaining % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="uppercase tracking-[0.4em] font-bold mt-2 text-white/50">{timerLabel || 'Timer Actif'}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (mode === 'timer') return renderTimer();
    switch (theme) {
        case 'cyberpunk': return renderCyberpunk();
        case 'oldstyle': return renderOldStyle();
        default: return renderModern();
    }
};

export default ClockVisualizer;
