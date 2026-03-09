import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../useMapStore';
import MapTokenNode from './MapTokenNode';

const MapTokenLayer: React.FC = () => {
    const { projectedTokens, projectedMapWidth, projectedMapHeight, viewResetCounter } = useMapStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [localView, setLocalView] = React.useState({ zoom: 1, x: 0, y: 0 });

    const fitToScreen = React.useCallback(() => {
        if (!containerRef.current || projectedMapWidth === 0 || projectedMapHeight === 0) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        if (cw === 0 || ch === 0) return;

        const scale = Math.min(cw / projectedMapWidth, ch / projectedMapHeight);
        const px = (cw - projectedMapWidth * scale) / 2;
        const py = (ch - projectedMapHeight * scale) / 2;
        
        setLocalView({ zoom: scale, x: px, y: py });
    }, [projectedMapWidth, projectedMapHeight]);

    useEffect(() => {
        fitToScreen();
    }, [fitToScreen]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => fitToScreen());
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [fitToScreen]);

    useEffect(() => {
        if (viewResetCounter > 0) fitToScreen();
    }, [viewResetCounter, fitToScreen]);

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none bg-transparent overflow-hidden">
            <div 
                className="absolute top-0 left-0 origin-top-left pointer-events-none"
                style={{
                    width: projectedMapWidth,
                    height: projectedMapHeight,
                    transform: `translate(${localView.x}px, ${localView.y}px) scale(${localView.zoom})`,
                }}
            >
                <div className="absolute inset-0 w-full h-full">
                    {projectedTokens.map(token => (
                        <MapTokenNode 
                            key={token.id} 
                            token={token} 
                            isProjectedView={true} 
                            localZoom={localView.zoom}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapTokenLayer;
