import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../useMapStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import MapTokenNode from './MapTokenNode';
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
        projectedTokens,
        projectedIsMapMuted, projectedMapVolume, mapOutputDeviceId,
        viewResetCounter
    } = useMapStore();

    // Use projected state for the hub
    const mapUrl = projectedMapUrl;
    const isVideo = projectedIsVideo || projectedMapUrl?.endsWith('.mp4') || projectedMapUrl?.endsWith('.webm');
    const fogDataUrl = projectedFogDataUrl;
    const mapWidth = projectedMapWidth;
    const mapHeight = projectedMapHeight;
    const isGridEnabled = projectedIsGridEnabled;
    const gridSize = projectedGridSize;
    const gridColor = projectedGridColor;
    const gridOpacity = projectedGridOpacity;
    const tokens = projectedTokens;

    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fogCanvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);

    const [localView, setLocalView] = React.useState({ zoom: 1, x: 0, y: 0 });
    const [videoDimensions, setVideoDimensions] = React.useState({ w: 0, h: 0 });
    const [imageDimensions, setImageDimensions] = React.useState({ w: 0, h: 0 });

    const effectiveWidth = isVideo 
        ? (videoDimensions.w > 0 ? videoDimensions.w : (mapWidth || 2000))
        : (imageDimensions.w > 0 ? imageDimensions.w : (mapWidth || 2000));
        
    const effectiveHeight = isVideo 
        ? (videoDimensions.h > 0 ? videoDimensions.h : (mapHeight || 2000))
        : (imageDimensions.h > 0 ? imageDimensions.h : (mapHeight || 2000));

    const fitToScreen = React.useCallback(() => {
        if (!containerRef.current || effectiveWidth === 0 || effectiveHeight === 0) return;
        const cw = containerRef.current.clientWidth || window.innerWidth;
        const ch = containerRef.current.clientHeight || window.innerHeight;
        if (cw === 0 || ch === 0) return;

        const scale = Math.max(cw / effectiveWidth, ch / effectiveHeight);
        const px = (cw - effectiveWidth * scale) / 2;
        const py = (ch - effectiveHeight * scale) / 2;
        
        setLocalView({ zoom: scale, x: px, y: py });
    }, [effectiveWidth, effectiveHeight]);

    // Independent Fit-to-screen on load/resize
    useEffect(() => {
        console.log(`[PlayerMapCanvas] Fitting to screen: ${effectiveWidth}x${effectiveHeight} into ${containerRef.current?.clientWidth}x${containerRef.current?.clientHeight}`);
        fitToScreen();
    }, [fitToScreen, mapUrl, effectiveWidth, effectiveHeight]);

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
            canvas.width = effectiveWidth;
            canvas.height = effectiveHeight;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, effectiveWidth, effectiveHeight);
            return;
        }

        const img = new Image();
        img.onload = () => {
            canvas.width = effectiveWidth;
            canvas.height = effectiveHeight;
            ctx.clearRect(0, 0, effectiveWidth, effectiveHeight);
            ctx.drawImage(img, 0, 0, effectiveWidth, effectiveHeight);
        };
        img.src = fogDataUrl;
    }, [fogDataUrl, effectiveWidth, effectiveHeight]);

    // Grid Rendering
    useEffect(() => {
        const canvas = gridCanvasRef.current;
        if (!canvas || !isGridEnabled) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = effectiveWidth;
        canvas.height = effectiveHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = gridOpacity;
        ctx.lineWidth = 1;

        for (let x = 0; x <= effectiveWidth; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, effectiveHeight);
        }
        for (let y = 0; y <= effectiveHeight; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(effectiveWidth, y);
        }
        ctx.stroke();
    }, [isGridEnabled, gridSize, gridColor, gridOpacity, effectiveWidth, effectiveHeight]);

    // Determine which view to use: Sync with GM or Fit to screen?
    // For now, let's stick to "Fit to Screen" as the Hub is often a fixed monitor.
    const effectiveZoom = localView.zoom;
    const effectivePanX = localView.x;
    const effectivePanY = localView.y;

    // Handle Audio Volume & Device
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = projectedMapVolume;
        }
    }, [projectedMapVolume]);

    useEffect(() => {
        const setDevice = async () => {
            if (videoRef.current && 'setSinkId' in videoRef.current) {
                try {
                    const deviceId = mapOutputDeviceId === 'default' ? '' : mapOutputDeviceId;
                    await (videoRef.current as any).setSinkId(deviceId);
                    console.log(`[PlayerMapCanvas] Output device set to: ${deviceId || 'default'}`);
                } catch (err) {
                    console.error("[PlayerMapCanvas] Failed to set output device:", err);
                }
            }
        };
        setDevice();
    }, [mapOutputDeviceId]);

    return (
        <div ref={containerRef} className="w-full h-full bg-app-bg relative overflow-hidden pointer-events-auto">
            {/* Transform Layer Wrapper */}
            <div 
                className="absolute top-0 left-0 origin-top-left cursor-crosshair"
                style={{
                    width: effectiveWidth,
                    height: effectiveHeight,
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
                    <video 
                        ref={videoRef}
                        src={resolvedMapUrl} 
                        autoPlay 
                        loop 
                        muted={projectedIsMapMuted} 
                        onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
                        }}
                        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
                    />
                ) : resolvedMapUrl ? (
                    <img 
                        src={resolvedMapUrl} 
                        alt="Map Background" 
                        onLoad={(e) => {
                            const img = e.currentTarget;
                            setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                        }}
                        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
                    />
                ) : null}

                {/* 2. Grid Layer */}
                {isGridEnabled && (
                    <canvas ref={gridCanvasRef} className="absolute inset-0 w-full h-full z-15 pointer-events-none" />
                )}

                {/* 3. Tokens Layer (Under Fog) */}
                <div className="absolute inset-0 w-full h-full z-15">
                    {tokens.map(token => (
                        <MapTokenNode 
                            key={token.id} 
                            token={token} 
                            isProjectedView={true} 
                            localZoom={effectiveZoom}
                        />
                    ))}
                </div>

                {/* 4. Magic Effects Layer (Under Fog) */}
                <MagicLayer isProjectedView={true} />

                {/* 5. Fog Layer (Masking everything below) */}
                <canvas
                    ref={fogCanvasRef}
                    className="absolute inset-0 w-full h-full z-20 opacity-100 pointer-events-none"
                />

                {/* 6. Pings Layer (Above Fog so they remain visible) */}
                <MapPingLayer isProjectedView={true} />

                {/* 7. Weather Layer */}
                <WeatherLayer isProjectedView={true} />
            </div>
            
            {/* Vignette effect */}
            <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50"></div>
        </div>
    );
};

export default PlayerMapCanvas;
