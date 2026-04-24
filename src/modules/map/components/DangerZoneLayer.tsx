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
            className="absolute inset-0 w-full h-full pointer-events-none z-[18]"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Motif pour Terrain Difficile */}
                <pattern id="pattern-difficult" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="white" strokeWidth="0.5" opacity="0.3" />
                </pattern>
            </defs>
            
            {zones.map(zone => {
                const isAura = zone.isAura;
                const isDT = zone.isDifficultTerrain;
                
                // Style spécifique
                const fillOpacity = isProjectedView ? 0.1 : (isDT ? 0.3 : 0.2);
                const strokeDash = isAura ? "2,2" : "5,5";
                const strokeWidth = isAura ? 1 : (isProjectedView ? 1 : 2);
                
                return (
                    <g key={zone.id}>
                        {zone.type === 'rect' && (
                            <rect
                                x={zone.x}
                                y={zone.y}
                                width={zone.width}
                                height={zone.height}
                                fill={isDT ? "url(#pattern-difficult)" : zone.color}
                                fillOpacity={fillOpacity}
                                stroke={zone.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDash}
                                filter="url(#zone-glow)"
                            />
                        )}

                        {zone.type === 'circle' && (
                            <circle
                                cx={zone.x}
                                cy={zone.y}
                                r={zone.radius}
                                fill={isDT ? "url(#pattern-difficult)" : zone.color}
                                fillOpacity={fillOpacity}
                                stroke={zone.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDash}
                                filter="url(#zone-glow)"
                            />
                        )}

                        {zone.type === 'cone' && (
                            <path
                                d={`M ${zone.x} ${zone.y} 
                                   L ${zone.x + (zone.radius || zone.width || 100) * Math.cos((zone.rotation - 30) * Math.PI / 180)} 
                                     ${zone.y + (zone.radius || zone.width || 100) * Math.sin((zone.rotation - 30) * Math.PI / 180)}
                                   A ${zone.radius || zone.width || 100} ${zone.radius || zone.width || 100} 0 0 1 
                                     ${zone.x + (zone.radius || zone.width || 100) * Math.cos((zone.rotation + 30) * Math.PI / 180)} 
                                     ${zone.y + (zone.radius || zone.width || 100) * Math.sin((zone.rotation + 30) * Math.PI / 180)}
                                   Z`}
                                fill={isDT ? "url(#pattern-difficult)" : zone.color}
                                fillOpacity={fillOpacity}
                                stroke={zone.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDash}
                                filter="url(#zone-glow)"
                            />
                        )}

                        {zone.type === 'line' && (
                            <rect
                                x={zone.x}
                                y={zone.y - (zone.height || 40) / 2}
                                width={zone.width}
                                height={zone.height || 40}
                                fill={isDT ? "url(#pattern-difficult)" : zone.color}
                                fillOpacity={fillOpacity}
                                stroke={zone.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDash}
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
                                className="select-none pointer-events-none"
                                style={{ textShadow: '0 0 4px black' }}
                            >
                                {zone.name} {isDT ? `(DT: x${zone.movementCost || 2})` : ''} {isAura ? '(Aura)' : ''}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

export default DangerZoneLayer;
