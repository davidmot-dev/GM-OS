import React from 'react';
import { useMapStore } from '../useMapStore';

interface DangerZoneLayerProps {
    isProjectedView: boolean;
}

const DangerZoneLayer: React.FC<DangerZoneLayerProps> = ({ isProjectedView }) => {
    const { dangerZones, projectedDangerZones } = useMapStore();
    
    // On players' view, we only show projected ones. 
    // On GM view, we show all (usually GM doesn't have projectedDangerZones filled same way).
    const zones = isProjectedView ? projectedDangerZones : dangerZones;

    if (!zones || zones.length === 0) return null;

    return (
        <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-25"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            {zones.map(zone => (
                <g key={zone.id}>
                    {zone.type === 'rect' && (
                        <rect
                            x={zone.x}
                            y={zone.y}
                            width={zone.width}
                            height={zone.height}
                            fill={zone.color}
                            fillOpacity={isProjectedView ? 0.1 : 0.2}
                            stroke={zone.color}
                            strokeWidth={isProjectedView ? 1 : 2}
                            strokeDasharray="5,5"
                            filter="url(#zone-glow)"
                        />
                    )}

                    {zone.type === 'circle' && (
                        <circle
                            cx={zone.x}
                            cy={zone.y}
                            r={zone.radius}
                            fill={zone.color}
                            fillOpacity={isProjectedView ? 0.1 : 0.2}
                            stroke={zone.color}
                            strokeWidth={isProjectedView ? 1 : 2}
                            strokeDasharray="5,5"
                            filter="url(#zone-glow)"
                        />
                    )}

                    {zone.type === 'cone' && (
                        <path
                            d={`M ${zone.x} ${zone.y} 
                               L ${zone.x + (zone.radius || zone.width) * Math.cos((zone.rotation - 30) * Math.PI / 180)} 
                                 ${zone.y + (zone.radius || zone.width) * Math.sin((zone.rotation - 30) * Math.PI / 180)}
                               A ${zone.radius || zone.width} ${zone.radius || zone.width} 0 0 1 
                                 ${zone.x + (zone.radius || zone.width) * Math.cos((zone.rotation + 30) * Math.PI / 180)} 
                                 ${zone.y + (zone.radius || zone.width) * Math.sin((zone.rotation + 30) * Math.PI / 180)}
                               Z`}
                            fill={zone.color}
                            fillOpacity={isProjectedView ? 0.1 : 0.2}
                            stroke={zone.color}
                            strokeWidth={isProjectedView ? 1 : 2}
                            strokeDasharray="5,5"
                            filter="url(#zone-glow)"
                        />
                    )}

                    {zone.type === 'line' && (
                        <rect
                            x={zone.x}
                            y={zone.y - (zone.height || 40) / 2}
                            width={zone.width}
                            height={zone.height || 40}
                            fill={zone.color}
                            fillOpacity={isProjectedView ? 0.1 : 0.2}
                            stroke={zone.color}
                            strokeWidth={isProjectedView ? 1 : 2}
                            strokeDasharray="5,5"
                            filter="url(#zone-glow)"
                            transform={`rotate(${zone.rotation}, ${zone.x}, ${zone.y})`}
                        />
                    )}
                    
                    {!isProjectedView && (
                        <text
                            x={zone.x + 5}
                            y={zone.y + 15}
                            fill={zone.color}
                            fontSize="10"
                            fontWeight="bold"
                            className="select-none"
                            style={{ textShadow: '0 0 4px black' }}
                        >
                            {zone.name}
                        </text>
                    )}
                </g>
            ))}
        </svg>
    );
};

export default DangerZoneLayer;
