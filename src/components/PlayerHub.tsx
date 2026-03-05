import React, { useEffect, useState } from 'react';
import { useImageStore } from '../modules/image/useImageStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { useClockStore } from '../store/useClockStore';
import NarrativeClock from '../modules/clock/components/NarrativeClock';

// In a real application, we'd pull these from their respective stores:
// import { useClockStore } from '../modules/clock/useClockStore';
// import { useNPCStore } from '../modules/npc/useNPCStore';
// import { useSessionStore } from '../store/useSessionStore';

const PlayerHub: React.FC = () => {
    const { mediaList, activeProjectionId } = useImageStore();
    const [liveImagePath, setLiveImagePath] = useState<string | null>(() => {
        if (activeProjectionId) {
            const activeMedia = mediaList.find(m => m.id === activeProjectionId);
            if (activeMedia) return activeMedia.path;
        }
        return null;
    });

    useEffect(() => {
        // Listen for IPC updates because this is a separate window
        // @ts-expect-error global
        if (window.appBridge?.on) {
            // @ts-expect-error global
            window.appBridge.on('image:sync-hub-data', (_event, type: string, imagePath: string) => {
                if (type === 'image') {
                    setLiveImagePath(imagePath || null);
                }
            });

            // @ts-expect-error global
            window.appBridge.on('image:update-display', (_event, paths: string[]) => {
                if (paths && paths.length > 0 && paths[0]) {
                    setLiveImagePath(paths[0]);
                } else {
                    setLiveImagePath(null); // Blackout
                }
            });
        }

        // Listen to localStorage changes for cross-window Zustand synchronization
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'gm-os-clock-storage') {
                useClockStore.persist.rehydrate();
            }
            if (e.key === 'gmos-combat-storage') {
                useCombatStore.persist.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // MOCK DATA for now until other stores are connected
    // Dynamic Clock State processing
    const { timestamp, mode, theme, timerRemaining, timerLabel, activeCalendarId, calendars, tensions } = useClockStore();

    let currentTime = "";
    let currentAmPm = "";
    let currentDate = "";

    if (mode === 'realtime') {
        const date = new Date();
        currentTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/ AM| PM/i, '');
        currentAmPm = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).includes('AM') ? 'AM' : 'PM';
        currentDate = date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else {
        const date = new Date(timestamp);
        currentTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).replace(/ AM| PM/i, '');
        currentAmPm = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).includes('AM') ? 'AM' : 'PM';

        if (mode === 'fantasy' && activeCalendarId && calendars[activeCalendarId]) {
            // Basic fantasy date formatting fallback
            const cal = calendars[activeCalendarId];
            const day = Math.floor(timestamp / (1000 * 60 * 60 * 24)) % 30 + 1; // extremely simplified
            currentDate = `Day ${day} of ${cal.name}`;
        } else {
            currentDate = "Time Stopped";
        }
    }

    // Dynamic Combat State processing
    const { combatants, currentTurnIdx, round } = useCombatStore();
    const hasCombatants = combatants.length > 0;
    const activeCombatant = hasCombatants ? combatants[currentTurnIdx] : null;

    // Sort the upcoming combatants
    const upcomingCombatants = [];
    if (hasCombatants && combatants.length > 1) {
        let i = (currentTurnIdx + 1) % combatants.length;
        while (i !== currentTurnIdx) {
            upcomingCombatants.push(combatants[i]);
            i = (i + 1) % combatants.length;
        }
    }

    let safePath = liveImagePath;

    if (safePath) {
        safePath = safePath.startsWith('http') || safePath.startsWith('file://') || safePath.startsWith('data:')
            ? safePath
            // @ts-expect-error global
            : (window.appBridge?.utils?.formatFileUrl ? window.appBridge.utils.formatFileUrl(safePath) : safePath.replace(/\\/g, '/'));
    }

    const renderClockWidget = () => {
        if (mode === 'timer') {
            const minutes = Math.floor(timerRemaining / 60).toString().padStart(2, '0');
            const seconds = (timerRemaining % 60).toString().padStart(2, '0');

            let containerStyle = "bg-slate-900/40 border-white/10 shadow-glow-white";
            let timeStyle = "text-slate-50 tracking-tighter font-mono";
            let labelStyle = "text-slate-400 uppercase tracking-[0.2em]";

            if (theme === 'cyberpunk') {
                containerStyle = "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]";
                timeStyle = "text-cyan-400 font-mono drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]";
                labelStyle = "text-pink-500 font-mono tracking-widest";
            } else if (theme === 'oldstyle') {
                containerStyle = "bg-[#1a0f0a]/80 border-amber-700/50 shadow-lg shadow-black";
                timeStyle = "text-amber-500 font-serif drop-shadow-md";
                labelStyle = "text-amber-200/80 font-serif italic";
            }

            return (
                <div className={`backdrop-blur-md border-b border-r p-6 rounded-br-3xl ${containerStyle} flex flex-col items-center justify-center min-w-[220px]`}>
                    <p className={`text-xs font-bold mb-2 ${labelStyle}`}>
                        {timerLabel || (theme === 'oldstyle' ? "Sablier de Destin" : "Minuteur Actif")}
                    </p>
                    <h2 className={`text-6xl font-black tabular-nums ${timeStyle} ${timerRemaining === 0 ? 'animate-pulse text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : ''}`}>
                        {minutes}:{seconds}
                    </h2>
                </div>
            );
        }

        // Standard Clock
        let containerStyle = "bg-slate-900/40 border-white/10 shadow-glow-white";
        let timeStyle = "text-slate-50 font-bold tracking-tighter";
        let ampmStyle = "text-slate-400 text-xl";
        let dateStyle = "text-slate-300 font-medium text-sm";
        let labelStyle = "text-red-500 text-xs font-bold uppercase tracking-[0.2em]";

        if (theme === 'cyberpunk') {
            containerStyle = "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]";
            timeStyle = "text-cyan-400 font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] font-black";
            ampmStyle = "text-pink-500 font-bold font-mono";
            dateStyle = "text-cyan-300 font-mono text-xs uppercase tracking-wider";
            labelStyle = "text-pink-500 text-xs font-bold uppercase tracking-[0.4em] mb-1 glitch-text";
        } else if (theme === 'oldstyle') {
            containerStyle = "bg-[#1a0f0a]/80 border-amber-700/50 shadow-lg shadow-black";
            timeStyle = "text-amber-500 font-serif font-bold drop-shadow-md";
            ampmStyle = "text-amber-600 font-serif italic text-lg ml-2";
            dateStyle = "text-amber-200/80 font-serif italic mt-3";
            labelStyle = "text-amber-700 text-xs font-bold uppercase tracking-[0.2em] mb-2";
        }

        return (
            <div className={`backdrop-blur-md border-b border-r p-8 rounded-br-3xl ${containerStyle}`}>
                <div className="flex flex-col gap-1">
                    <p className={labelStyle}>Current Time</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className={`text-6xl ${timeStyle}`}>{currentTime}</h2>
                        <span className={ampmStyle}>{currentAmPm}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${theme === 'oldstyle' ? 'mt-3 border-t border-amber-900/50 pt-3' : 'mt-2'}`}>
                        {theme === 'oldstyle' ? (
                            <span className="material-symbols-outlined text-amber-600 text-sm">auto_awesome</span>
                        ) : theme === 'cyberpunk' ? (
                            <span className="material-symbols-outlined text-pink-500 text-sm">terminal</span>
                        ) : (
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                        )}
                        <p className={dateStyle}>{currentDate}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#221010] text-slate-100 font-cinematic selection:bg-red-600/30 w-full h-screen overflow-hidden flex flex-col relative select-none cursor-default">
            {/* Full-screen Campaign Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center grayscale-[20%] transition-all duration-1000 ease-in-out"
                style={{
                    backgroundImage: safePath ? `url('${safePath}')` : "none",
                    opacity: safePath ? 1 : 0,
                    filter: 'brightness(0.4) grayscale(20%)'
                }}
            ></div>

            {/* If no image, show blackout background */}
            {!safePath && <div className="fixed inset-0 z-0 bg-black"></div>}

            {/* Main Projection Overlay */}
            <div className="relative z-10 flex h-screen w-full flex-col justify-between overflow-hidden">
                {/* TOP ROW */}
                <div className="flex justify-between items-start w-full">
                    {/* 1. Dynamic Clock OS Widget */}
                    <div className="flex flex-col gap-4">
                        {renderClockWidget()}

                        {/* 1b. Tension Clocks (Jauges) */}
                        {tensions.length > 0 && (
                            <div className="flex flex-col gap-3 px-8 pb-8">
                                {tensions.map(clock => (
                                    <div key={clock.id} className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg">
                                        <NarrativeClock clock={clock} theme={theme} size={60} />
                                        <div className="flex flex-col">
                                            <p className={`text-sm font-bold truncate max-w-[150px] ${theme === 'cyberpunk' ? 'text-pink-400 font-mono tracking-wider' : theme === 'oldstyle' ? 'text-amber-500 font-serif' : 'text-slate-200 uppercase tracking-tight'}`}>{clock.name}</p>
                                            <p className={`text-[10px] ${theme === 'cyberpunk' ? 'text-cyan-400' : theme === 'oldstyle' ? 'text-amber-700/80 italic' : 'text-slate-400'}`}>
                                                {clock.filledSegments} / {clock.totalSegments} Segments
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER AREA (Empty for focus on background) */}
                <div className="flex-grow"></div>

                {/* BOTTOM AREA */}
                <div className="flex flex-col items-center w-full">
                    {/* NPC Reveal Card removed per user request */}
                </div>
            </div>

            {/* 3. Right Side Combat Tracker */}
            {hasCombatants && activeCombatant && (
                <div className="fixed right-0 top-0 w-80 h-full z-20 bg-slate-900/30 backdrop-blur-sm border-l border-white/5 flex flex-col gap-4 p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <div className="flex flex-col">
                            <h1 className="text-white text-xl font-bold tracking-tight">Combat Initiative</h1>
                            <p className="text-red-400 text-xs font-bold uppercase tracking-tighter">Round {round} • Turn {currentTurnIdx + 1}</p>
                        </div>
                        <div className="bg-red-500/20 text-red-500 p-2 rounded-lg border border-red-500/30">
                            <span className="material-symbols-outlined">swords</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Active Turn */}
                        <div className="flex items-center gap-4 px-4 py-4 rounded-xl bg-red-500/20 ring-1 ring-red-500/50 shadow-glow-crimson relative">
                            <div
                                className="size-10 rounded-full bg-slate-800 bg-cover bg-center border-2 border-red-500 flex items-center justify-center text-slate-400 font-display font-black text-sm"
                                style={activeCombatant.avatar ? { backgroundImage: `url('${activeCombatant.avatar}')` } : {}}
                            >
                                {!activeCombatant.avatar && activeCombatant.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-white text-sm font-bold leading-none">{activeCombatant.name}</p>
                                <p className="text-red-400 text-[10px] font-bold uppercase mt-1">Active Turn</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                {activeCombatant.statuses.map(s => (
                                    <span key={s.id} className="text-xs" title={`${s.name} (${s.duration > 0 ? s.duration + ' rounds' : 'permanent'})`}>{s.icon}</span>
                                ))}
                                <span className="material-symbols-outlined text-red-500">double_arrow</span>
                            </div>
                        </div>

                        {/* Upcoming Turns */}
                        {upcomingCombatants.slice(0, 5).map((combatant, idx) => (
                            <div key={combatant.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5 transition-opacity duration-500 opacity-80`}>
                                <div
                                    className="size-10 rounded-full bg-slate-800 bg-cover bg-center border border-white/10 flex items-center justify-center text-slate-500 font-display font-black text-sm"
                                    style={combatant.avatar ? { backgroundImage: `url('${combatant.avatar}')` } : {}}
                                >
                                    {!combatant.avatar && combatant.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-slate-200 text-sm font-medium leading-tight">{combatant.name}</p>
                                    <p className="text-slate-500 text-[10px] uppercase mt-0.5">{idx === 0 ? 'Next' : 'Upcoming'}</p>
                                </div>
                                {combatant.statuses.length > 0 && (
                                    <div className="ml-auto flex items-center gap-1 opacity-50">
                                        {combatant.statuses.map(s => (
                                            <span key={s.id} className="text-[10px]">{s.icon}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Party Vitals (Compact Overlay) */}
                    <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-white/10">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Party Assets</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase">Party Gold</p>
                                <p className="text-lg font-bold text-yellow-500/80">1,250gp</p>
                            </div>
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase">Danger</p>
                                <p className="text-lg font-bold text-red-500">High</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vignette & HUD Grains */}
            <div className="fixed inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50"></div>
            <div className="fixed inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]"></div>
        </div>
    );
};

export default PlayerHub;
