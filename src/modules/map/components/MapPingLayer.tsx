import React from 'react';
import { useMapStore } from '../useMapStore';
import type { MapPing } from '../types';

interface MapPingLayerProps {
    isProjectedView: boolean;
}

const MapPingLayer: React.FC<MapPingLayerProps> = ({ isProjectedView }) => {
    const { pings, projectedPings } = useMapStore();
    const activePings = isProjectedView ? projectedPings : pings;

    if (!activePings || activePings.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {activePings.map(ping => (
                <PingVisual key={ping.id} ping={ping} />
            ))}
        </div>
    );
};

// Extracted internal component for individual ping animation management
const PingVisual: React.FC<{ ping: MapPing }> = ({ ping }) => {
    return (
        <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center pointer-events-none"
            style={{
                left: ping.x,
                top: ping.y,
            }}
        >
            {/* Outer expanding ring */}
            <div 
                className="absolute inset-0 border-4 rounded-full animate-ping-expand"
                style={{ 
                    borderColor: ping.color, 
                    animationDuration: '1.5s',
                    animationIterationCount: 2 
                }} 
            />
            {/* Inner pulsating core */}
            <div 
                className="w-4 h-4 rounded-full shadow-[0_0_20px_10px_rgba(currentColor,0.8)] animate-pulse"
                style={{ backgroundColor: ping.color, color: ping.color }}
            />
        </div>
    );
};

export default MapPingLayer;
