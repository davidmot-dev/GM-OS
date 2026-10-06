import React from 'react';
import ClockVisualizer from '../../modules/clock/components/ClockVisualizer';
import NarrativeClock from '../../modules/clock/components/NarrativeClock';
import type { useHubSync } from '../../modules/session/hooks/useHubSync';
import { Panneau } from '../socle';

type Props = Pick<ReturnType<typeof useHubSync>, 'isClockProjected' | 'timestamp' | 'mode' | 'theme' | 'tensions'> & { colonneEnPaysage?: boolean };

/** Les mêmes informations publiques sur les trois écrans de travail J1. */
export const HubHorlogesPubliques: React.FC<Props> = ({ isClockProjected, timestamp, mode, theme, tensions, colonneEnPaysage = false }) => {
    const horlogeVisible = String(mode) !== 'hidden';
    if (!isClockProjected || (!horlogeVisible && !tensions.length)) return null;
    return (
        <div aria-label="Horloges publiques" className={`order-1 grid grid-cols-2 gap-3 ${colonneEnPaysage ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
            {horlogeVisible && <Panneau className="min-w-0 p-3">
                <h2 className="mb-3 text-[14px] font-bold text-app-muted">Horloge</h2>
                <ClockVisualizer compact theme={theme} timestamp={timestamp} mode={mode} />
            </Panneau>}
            {tensions.map(clock => <Panneau key={clock.id} className="min-w-0 p-3">
                <h2 className="mb-2 text-[14px] font-bold leading-snug text-app-text break-words">{clock.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <NarrativeClock clock={clock} theme={theme} size={48} />
                    <span className="text-[14px] font-mono text-app-muted">{clock.filledSegments} / {clock.totalSegments}</span>
                </div>
            </Panneau>)}
        </div>
    );
};
