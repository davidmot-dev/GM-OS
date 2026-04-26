import React from 'react';
import ClockVisualizer from '../../modules/clock/components/ClockVisualizer';
import NarrativeClock from '../../modules/clock/components/NarrativeClock';

interface HubClockWidgetsProps {
    isClockProjected: boolean;
    timestamp: number;
    mode: any;
    theme: any;
    tensions: any[];
}

export const HubClockWidgets: React.FC<HubClockWidgetsProps> = ({
    isClockProjected,
    timestamp,
    mode,
    theme,
    tensions
}) => {
    if (!isClockProjected) return null;

    return (
        <div className="absolute top-0 left-0 p-8 pointer-events-auto animate-in fade-in slide-in-from-left duration-700">
            <div className="flex flex-col gap-4 transform scale-[0.65] origin-top-left w-[460px]">
                {/* Main Clock */}
                <div className="backdrop-blur-md bg-app-surface/40 border-b border-r border-app-border/40 p-8 rounded-br-[2rem] rounded-tr-xl rounded-bl-xl shadow-2xl flex items-center justify-center w-full min-h-[250px]">
                    <ClockVisualizer theme={theme} timestamp={timestamp} mode={mode} />
                </div>

                {/* Tension Clocks */}
                {tensions.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {tensions.map(clock => (
                            <div key={clock.id} className="flex items-center gap-5 bg-app-surface/60 backdrop-blur-xl border border-app-border/40 rounded-2xl p-5 shadow-xl w-full">
                                <NarrativeClock clock={clock} theme={theme} size={75} />
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <p className={`text-xl font-black truncate w-full ${theme === 'cyberpunk' ? 'text-accent font-mono tracking-wider' : theme === 'oldstyle' ? 'text-amber-500 font-serif' : 'text-app-text uppercase tracking-tight'}`}>{clock.name}</p>
                                    <p className={`text-sm mt-0.5 font-bold ${theme === 'cyberpunk' ? 'text-cyan-400' : theme === 'oldstyle' ? 'text-amber-700/80 italic' : 'text-app-text/60'}`}>
                                        {clock.filledSegments} / {clock.totalSegments} Segments
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
