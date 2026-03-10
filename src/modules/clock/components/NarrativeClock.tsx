import React from 'react';
import type { TensionClock, ClockTheme } from '../../../store/useClockStore';


interface NarrativeClockProps {
    clock: TensionClock;
    theme?: ClockTheme;
    size?: number;
}

const NarrativeClock: React.FC<NarrativeClockProps> = ({ clock, theme = 'modern', size = 120 }) => {
    const { totalSegments, filledSegments } = clock;
    const radius = 45;
    const center = 50;
    const strokeWidth = 8;
    const gap = 0.05; // Gap between segments in radians

    const getThemeColors = () => {
        const themeMap: Record<ClockTheme, { filled: string; empty: string; text: string; glow: string }> = {
            cyberpunk: {
                filled: '#22d3ee', // Cyan 400
                empty: '#312e81',  // Indigo 900
                text: '#f472b6',   // Pink 400
                glow: 'rgba(34, 211, 238, 0.6)'
            },
            oldstyle: {
                filled: '#f59e0b', // Amber 500
                empty: '#451a03',  // Amber 950
                text: '#d97706',   // Amber 600
                glow: 'rgba(245, 158, 11, 0.4)'
            },
            modern: {
                filled: 'var(--accent)',
                empty: 'var(--app-surface)',
                text: 'var(--app-text)',
                glow: 'rgba(var(--accent-rgb), 0.5)'
            }
        };
        return themeMap[theme] || themeMap.modern;
    };


    const colors = getThemeColors();
    const segments = [];
    const anglePerSegment = (2 * Math.PI) / totalSegments;

    for (let i = 0; i < totalSegments; i++) {
        const startAngle = i * anglePerSegment + gap / 2 - Math.PI / 2;
        const endAngle = (i + 1) * anglePerSegment - gap / 2 - Math.PI / 2;

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const largeArcFlag = anglePerSegment - gap > Math.PI ? 1 : 0;

        const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
        ].join(' ');

        const isFilled = i < filledSegments;

        segments.push(
            <path
                key={i}
                d={pathData}
                fill="none"
                stroke={isFilled ? colors.filled : colors.empty}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
                style={{
                    filter: isFilled ? `drop-shadow(0 0 4px ${colors.glow})` : 'none'
                }}
            />
        );
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className="transform transition-transform active:scale-95 select-none"
        >
            {/* Background Circle */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill={theme === 'oldstyle' ? 'rgba(69, 26, 3, 0.1)' : 'rgba(30, 41, 59, 0.2)'}
                stroke={theme === 'oldstyle' ? 'rgba(120, 53, 15, 0.2)' : 'rgba(51, 65, 85, 0.3)'}
                strokeWidth="1"
            />


            {/* Segments */}
            {segments}

            {/* Center Label */}
            <text
                x={center}
                y={center}
                textAnchor="middle"
                dominantBaseline="central"
                fill={filledSegments === totalSegments ? '#ef4444' : colors.text}
                className={`text-[14px] font-bold font-mono transition-colors ${filledSegments === totalSegments ? 'animate-pulse' : ''} ${theme === 'oldstyle' ? 'font-serif' : ''}`}
            >

                {filledSegments}/{totalSegments}
            </text>

            {/* Full Alert Ping */}
            {filledSegments === totalSegments && (
                <circle
                    cx={center}
                    cy={center}
                    r={radius + 4}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="animate-ping"
                    opacity="0.5"
                />
            )}
        </svg>
    );
};

export default NarrativeClock;

