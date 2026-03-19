import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../useMapStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import MapPingLayer from './MapPingLayer';
import WeatherLayer from './WeatherLayer';
import MagicLayer from './MagicLayer';


interface PlayerMapCanvasProps {
    onMapClick?: (x: number, y: number) => void;
}

const PlayerMapCanvas: React.FC<PlayerMapCanvasProps> = ({ onMapClick }) => {
    const { 
        projectedMapUrl, projectedIsVideo, projectedFogDataUrl,
        projectedMapWidth, projectedMapHeight,
        projectedIsGridEnabled, projectedGridSize, projectedGridColor, projectedGridOpacity,
        viewResetCounter
    } = useMapStore();

    // Use projected state for the hub
    const mapUrl = projectedMapUrl;
    const isVideo = projectedIsVideo;
    const fogDataUrl = projectedFogDataUrl;
    const mapWidth = projectedMapWidth;
    const mapHeight = projectedMapHeight;
    const isGridEnabled = projectedIsGridEnabled;
    const gridSize = projectedGridSize;
    const gridColor = projectedGridColor;
    const gridOpacity = projectedGridOpacity;

    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);

    const containerRef = useRef<HTMLDivElement>(null);
    const fogCanvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);

    const [localView, setLocalView] = React.useState({ zoom: 1, x: 0, y: 0 });

    const fitToScreen = React.useCallback(() => {
        if (!containerRef.current || mapWidth === 0 || mapHeight === 0) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        if (cw === 0 || ch === 0) return;

        const scale = Math.min(cw / mapWidth, ch / mapHeight);
        const px = (cw - mapWidth * scale) / 2;
        const py = (ch - mapHeight * scale) / 2;
        
        setLocalView({ zoom: scale, x: px, y: py });
    }, [mapWidth, mapHeight]);

    // Independent Fit-to-screen on load/resize
    useEffect(() => {
        fitToScreen();
    }, [fitToScreen, mapUrl]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => fitToScreen());
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [fitToScreen]);

    // Handle View Resets from GM
    useEffect(() => {
        if (viewResetCounter > 0) fitToScreen();
    }, [viewResetCounter, fitToScreen]);

    // Add storage listener for cross-window sync
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'gmos-map-storage') {
                useMapStore.persist.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Sync Fog Canvas
    useEffect(() => {
        const canvas = fogCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!fogDataUrl) {
            // Fill completely black if no fog data is provided
            canvas.width = mapWidth;
            canvas.height = mapHeight;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, mapWidth, mapHeight);
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas.width = mapWidth;
            canvas.height = mapHeight;
            ctx.clearRect(0, 0, mapWidth, mapHeight);
            ctx.drawImage(img, 0, 0, mapWidth, mapHeight);
        };
        img.src = fogDataUrl;
    }, [fogDataUrl, mapWidth, mapHeight]);

    // Grid Rendering
    useEffect(() => {
        const canvas = gridCanvasRef.current;
        if (!canvas || !isGridEnabled) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = mapWidth;
        canvas.height = mapHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = gridOpacity;
        ctx.lineWidth = 1;

        for (let x = 0; x <= mapWidth; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
        }
        for (let y = 0; y <= mapHeight; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
        }
        ctx.stroke();
    }, [isGridEnabled, gridSize, gridColor, gridOpacity, mapWidth, mapHeight]);

    // Determine which view to use: Sync with GM or Fit to screen?
    // For now, let's stick to "Fit to Screen" as the Hub is often a fixed monitor.
    const effectiveZoom = localView.zoom;
    const effectivePanX = localView.x;
    const effectivePanY = localView.y;

    return (
        <div ref={containerRef} className="w-full h-full bg-app-bg relative overflow-hidden pointer-events-auto">
            {/* Transform Layer Wrapper */}
            <div 
                className="absolute top-0 left-0 origin-top-left cursor-crosshair"
                style={{
                    width: mapWidth,
                    height: mapHeight,
                    transform: `translate(${effectivePanX}px, ${effectivePanY}px) scale(${effectiveZoom})`,
                }}
                onPointerDown={(e) => {
                    if (!onMapClick || !containerRef.current) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    const rawX = e.clientX - rect.left;
                    const rawY = e.clientY - rect.top;
                    const x = (rawX - effectivePanX) / effectiveZoom;
                    const y = (rawY - effectivePanY) / effectiveZoom;
                    onMapClick(x, y);
                }}
            >
                {/* 1. Base Layer */}
                {resolvedMapUrl && isVideo ? (
                    <video src={resolvedMapUrl} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                ) : resolvedMapUrl ? (
                    <img src={resolvedMapUrl} alt="Map Background" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                ) : null}

                {/* 2. Grid Layer */}
                {isGridEnabled && (
                    <canvas ref={gridCanvasRef} className="absolute inset-0 w-full h-full z-15 pointer-events-none" />
                )}

                {/* 3. Fog Layer */}
                <canvas
                    ref={fogCanvasRef}
                    className="absolute inset-0 w-full h-full z-20 opacity-100 pointer-events-none"
                />

                {/* 4. Magic Effects Layer */}
                <MagicLayer isProjectedView={true} />

                {/* 5. Pings Layer */}
                <MapPingLayer isProjectedView={true} />


                {/* 5. Weather Layer */}
                <WeatherLayer isProjectedView={true} />
            </div>
            
            {/* Vignette effect */}
            <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50"></div>
        </div>
    );
};

export default PlayerMapCanvas;
