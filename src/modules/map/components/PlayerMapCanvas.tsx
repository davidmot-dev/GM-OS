import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../useMapStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import MapTokenNode from './MapTokenNode';
import MapPingLayer from './MapPingLayer';
import { AmbianceLayer } from './AmbianceLayer';
import WeatherLayer from './WeatherLayer';
import MagicLayer from './MagicLayer';
import DangerZoneLayer from './DangerZoneLayer';


interface PlayerMapCanvasProps {
    onMapClick?: (x: number, y: number) => void;
}

const PlayerMapCanvas: React.FC<PlayerMapCanvasProps> = ({ onMapClick }) => {
    const mapStore = useMapStore();
    const { 
        projectedMapUrl, projectedIsVideo, projectedFogDataUrl,
        projectedMapWidth, projectedMapHeight,
        projectedIsGridEnabled, projectedGridSize, projectedGridColor, projectedGridOpacity,
        projectedTokens,
        projectedIsMapMuted, projectedMapVolume, mapOutputDeviceId,
        viewResetCounter
    } = mapStore;

    // Use projected state for the hub
    const mapUrl = projectedMapUrl;
    const isVideo = projectedIsVideo 
        || projectedMapUrl?.endsWith('.mp4') 
        || projectedMapUrl?.endsWith('.webm')
        || projectedMapUrl?.startsWith('data:video/'); // DataURL video reçue via IPC

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

        const scale = Math.min(cw / effectiveWidth, ch / effectiveHeight);
        const px = (cw - effectiveWidth * scale) / 2;
        const py = (ch - effectiveHeight * scale) / 2;
        
        setLocalView({ zoom: scale, x: px, y: py });
    }, [effectiveWidth, effectiveHeight]);

    // Independent Fit-to-screen on load/resize
    useEffect(() => {
        console.log(`[PlayerMapCanvas] Resetting dimensions and fitting to screen for new map: ${mapUrl}`);
        const timer = setTimeout(() => {
            setVideoDimensions({ w: 0, h: 0 });
            setImageDimensions({ w: 0, h: 0 });
            fitToScreen();
        }, 100);
        return () => clearTimeout(timer);
    }, [fitToScreen, mapUrl]);

    useEffect(() => {
        const timer = setTimeout(() => fitToScreen(), 0);
        return () => clearTimeout(timer);
    }, [fitToScreen, effectiveWidth, effectiveHeight]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => fitToScreen());
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [fitToScreen]);

    // Handle View Resets from GM
    useEffect(() => {
        if (viewResetCounter > 0) {
            const timer = setTimeout(() => fitToScreen(), 0);
            return () => clearTimeout(timer);
        }
    }, [viewResetCounter, fitToScreen]);

    // Storage listener removed: In v7 we use IPC instead of localStorage sync to avoid OOM loops.

    // Sync Fog Canvas
    useEffect(() => {
        if (!fogCanvasRef.current) return;
        const canvas = fogCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = effectiveWidth;
        canvas.height = effectiveHeight;

        if (!fogDataUrl) {
            // 🛡️ Pas de brouillard → canvas transparent (jamais noir !)
            // Un canvas vide (clearRect) est transparent et laisse voir la carte.
            ctx.clearRect(0, 0, effectiveWidth, effectiveHeight);
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            const ctx2 = canvas.getContext('2d');
            if (ctx2) {
                ctx2.clearRect(0, 0, effectiveWidth, effectiveHeight);
                ctx2.drawImage(img, 0, 0, effectiveWidth, effectiveHeight);
            }
            img.onload = null;
            img.src = '';
        };
        img.src = fogDataUrl;

        return () => {
            img.onload = null;
            img.src = '';
        };
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
                    await (videoRef.current as HTMLVideoElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
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
                        muted={projectedIsMapMuted !== false}
                        playsInline
                        onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            setVideoDimensions({ w: video.videoWidth, h: video.videoHeight });
                            // Forcer le play après chargement des métadonnées
                            video.play().catch(() => {
                                // Autoplay bloqué → forcer muted et réessayer
                                video.muted = true;
                                video.play().catch(console.error);
                            });
                        }}
                        className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" 
                    />
                ) : resolvedMapUrl ? (
                    <img 
                        src={resolvedMapUrl} 
                        alt="Map Background" 
                        onLoad={(e) => {
                            const img = e.currentTarget;
                            setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                        }}
                        className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" 
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
                
                {/* 4b. Danger Zones Layer (Under Fog) */}
                <DangerZoneLayer isProjectedView={true} />

                {/* 5. Fog Layer (Masking everything below) — rendu UNIQUEMENT si fog projeté */}
                {fogDataUrl && (
                    <canvas
                        ref={fogCanvasRef}
                        className="absolute inset-0 w-full h-full z-20 opacity-100 pointer-events-none"
                    />
                )}

                {/* 6. Pings Layer (Above Fog so they remain visible) */}
                <MapPingLayer isProjectedView={true} />

                {mapStore.projectedWeatherType !== 'none' && mapStore.layerVisibility.weather && (
                    <WeatherLayer isProjectedView={true} />
                )}
                
                {mapStore.layerVisibility.ambiance && <AmbianceLayer isProjectedView={true} />}
            </div>
            
            {/* Vignette effect */}
            <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] opacity-50"></div>
        </div>
    );
};

export default PlayerMapCanvas;
