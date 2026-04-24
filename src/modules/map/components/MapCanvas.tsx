import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '../useMapStore';
import { useMapUIStore } from '../useMapUIStore';
import { FogEngine } from '../FogEngine';
import MapTokenNode from './MapTokenNode';
import MapPingLayer from './MapPingLayer';
import WeatherLayer from './WeatherLayer';
import MagicLayer from './MagicLayer';
import DangerZoneLayer from './DangerZoneLayer';
import { AmbianceLayer } from './AmbianceLayer';

import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useMapNavigation } from '../hooks/useMapNavigation';
import { useMapInteraction } from '../hooks/useMapInteraction';

const MapCanvas: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    // Stores
    const mapStore = useMapStore();
    const uiStore = useMapUIStore();

    const resolvedMapUrl = useMediaUrl(mapStore.mapUrl || undefined);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fogCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<FogEngine | null>(null);

    // Hooks
    const { 
        zoom, panX, panY, isPanning,
        fitToScreen, getCoordinates, handleWheel,
        startPanning, updatePanning, stopPanning
    } = useMapNavigation(containerRef, mapStore.mapWidth, mapStore.mapHeight);

    const {
        magicPreview, dangerPreview,
        handleInteractionStart, handleInteractionMove, handleInteractionEnd,
        clearPreviews
    } = useMapInteraction(engineRef, previewCanvasRef);

    // Fog Engine Initialization
    useEffect(() => {
        if (!fogCanvasRef.current || !previewCanvasRef.current) return;
        if (!engineRef.current) engineRef.current = new FogEngine();
        
        engineRef.current.initialize(
            fogCanvasRef.current,
            previewCanvasRef.current,
            mapStore.mapWidth,
            mapStore.mapHeight
        );

        if (mapStore.fogDataUrl) engineRef.current.loadFromDataUrl(mapStore.fogDataUrl);
        else engineRef.current.fillBlack();
    }, [mapStore.mapWidth, mapStore.mapHeight, mapStore.fogDataUrl]);

    // Media Load & Auto-Fit
    useEffect(() => {
        if (!resolvedMapUrl) return;

        const handleDimensions = (w: number, h: number) => {
            setTimeout(() => {
                mapStore.setMapDimensions(w, h);
                fitToScreen(w, h);
            }, 10);
        };

        if (mapStore.isVideo) {
            const video = document.createElement('video');
            video.src = resolvedMapUrl;
            video.onloadedmetadata = () => handleDimensions(video.videoWidth, video.videoHeight);
        } else {
            const img = new Image();
            img.src = resolvedMapUrl;
            img.onload = () => handleDimensions(img.width, img.height);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedMapUrl, mapStore.isVideo]);

    // Audio & Device Sync
    useEffect(() => {
        if (videoRef.current) videoRef.current.volume = mapStore.mapVolume;
    }, [mapStore.mapVolume]);

    useEffect(() => {
        const setDevice = async () => {
            if (videoRef.current && 'setSinkId' in videoRef.current) {
                try {
                    const deviceId = mapStore.mapOutputDeviceId === 'default' ? '' : mapStore.mapOutputDeviceId;
                    await (videoRef.current as HTMLVideoElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
                } catch (err) {
                    console.error("[MapCanvas] Failed to set output device:", err);
                }
            }
        };
        setDevice();
    }, [mapStore.mapOutputDeviceId]);

    // Reset View Trigger
    useEffect(() => {
        if (mapStore.viewResetCounter > 0) fitToScreen();
    }, [mapStore.viewResetCounter, fitToScreen]);

    // Fog Commands (Reveal/Hide All)
    useEffect(() => {
        if (!engineRef.current || !mapStore.fogCommand) return;
        if (mapStore.fogCommand === 'reveal_all') engineRef.current.revealAll();
        else if (mapStore.fogCommand === 'hide_all') engineRef.current.fillBlack();
        mapStore.setFogDataUrl(engineRef.current.getFogDataUrl());
        mapStore.triggerFogCommand(null);
    }, [mapStore.fogCommand, mapStore]);


    // Grid Rendering
    useEffect(() => {
        const canvas = gridCanvasRef.current;
        if (!canvas || !mapStore.isGridEnabled) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = mapStore.mapWidth;
        canvas.height = mapStore.mapHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.strokeStyle = mapStore.gridColor;
        ctx.globalAlpha = mapStore.gridOpacity;
        ctx.lineWidth = 1;

        for (let x = 0; x <= mapStore.mapWidth; x += mapStore.gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, mapStore.mapHeight);
        }
        for (let y = 0; y <= mapStore.mapHeight; y += mapStore.gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(mapStore.mapWidth, y);
        }
        ctx.stroke();
    }, [mapStore.isGridEnabled, mapStore.gridSize, mapStore.gridColor, mapStore.gridOpacity, mapStore.mapWidth, mapStore.mapHeight]);

    // Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) {
            startPanning(e.clientX, e.clientY);
            return;
        }
        if (e.button === 0) {
            uiStore.setSelectedTokenId(null);
            if (uiStore.currentTool === 'move_token') return;
            
            const coords = getCoordinates(e.clientX, e.clientY);
            if (uiStore.currentTool === 'ping') {
                mapStore.addPing(coords.x, coords.y, '#eab308');
                return;
            }
            handleInteractionStart(coords);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            updatePanning(e.clientX, e.clientY);
            return;
        }
        if (uiStore.isDraggingToken) return;
        
        const coords = getCoordinates(e.clientX, e.clientY);
        handleInteractionMove(coords, zoom);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isPanning) {
            stopPanning();
            return;
        }
        const coords = getCoordinates(e.clientX, e.clientY);
        handleInteractionEnd(coords);
    };

    // Native Wheel Listener (Non-Passive)
    // React's onWheel is passive by default, preventing preventDefault() which is needed for map zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onNativeWheel = (e: WheelEvent) => {
            handleWheel(e);
        };

        container.addEventListener('wheel', onNativeWheel, { passive: false });
        return () => container.removeEventListener('wheel', onNativeWheel);
    }, [handleWheel]);

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full h-full bg-obsidian-dark overflow-hidden border border-gray-700 rounded-xl ${
                isPanning ? 'cursor-grabbing' : uiStore.currentTool === 'move_token' ? 'cursor-default' : 'cursor-crosshair'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                stopPanning();
                uiStore.setIsDrawing(false);
                clearPreviews();
            }}
            onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                if (uiStore.currentTool === 'magic') {
                    const coords = getCoordinates(e.clientX, e.clientY);
                    const nearest = mapStore.magicEffects.find(eff => {
                        const dist = Math.sqrt(Math.pow(eff.x - coords.x, 2) + Math.pow(eff.y - coords.y, 2));
                        return dist < (eff.width || 50);
                    });
                    if (nearest) mapStore.removeMagicEffect(nearest.id);
                }
            }}
        >
            {!resolvedMapUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0">
                    <span className="text-4xl mb-2">🗺️</span>
                    <p className="text-xl font-bold font-display">{t('map.canvas.empty', { defaultValue: 'Aucune carte chargée' })}</p>
                    <p className="text-sm">{t('map.canvas.emptySub', { defaultValue: 'Utilisez le panneau latéral pour importer une image ou vidéo.' })}</p>
                </div>
            )}

            <div 
                className="absolute top-0 left-0 origin-top-left pointer-events-none"
                style={{
                    width: mapStore.mapWidth,
                    height: mapStore.mapHeight,
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                }}
            >
                {resolvedMapUrl && mapStore.isVideo ? (
                    <video 
                        ref={videoRef}
                        src={resolvedMapUrl} 
                        autoPlay loop muted={mapStore.isMapMuted} 
                        className="absolute inset-0 w-full h-full object-cover z-10" 
                    />
                ) : resolvedMapUrl ? (
                    <img 
                        src={resolvedMapUrl} 
                        alt="Map Background" 
                        className="absolute inset-0 w-full h-full object-cover z-10" 
                    />
                ) : null}

                {mapStore.isGridEnabled && mapStore.layerVisibility.grid && (
                    <canvas ref={gridCanvasRef} className="absolute inset-0 w-full h-full z-15" />
                )}

                <div className="absolute inset-0 w-full h-full z-16 pointer-events-none">
                    {mapStore.layerVisibility.tokens && mapStore.tokens.map(token => (
                        <MapTokenNode key={token.id} token={token} />
                    ))}
                </div>

                {mapStore.layerVisibility.magic && <MagicLayer isProjectedView={false} />}
                {mapStore.layerVisibility.danger && <DangerZoneLayer isProjectedView={false} />}

                {mapStore.layerVisibility.fog && (
                    <canvas
                        ref={fogCanvasRef}
                        className="absolute inset-0 w-full h-full z-20 opacity-80"
                        style={{ display: resolvedMapUrl ? 'block' : 'none' }}
                    />
                )}

                <MapPingLayer isProjectedView={false} />
                {mapStore.layerVisibility.weather && <WeatherLayer isProjectedView={false} />}
                {mapStore.layerVisibility.ambiance && <AmbianceLayer />}

                <canvas ref={previewCanvasRef} className="absolute inset-0 w-full h-full z-40 pointer-events-none" />

                {magicPreview && (
                    <div 
                        className={`absolute border-2 border-white/50 border-dashed pointer-events-none z-50 ${uiStore.magicShape === 'circle' ? 'rounded-full' : ''}`}
                        style={{
                            left: magicPreview.x,
                            top: magicPreview.y,
                            width: (uiStore.magicShape === 'rect' || uiStore.magicShape === 'cone' || uiStore.magicShape === 'line') ? 0 : magicPreview.w * 2,
                            height: (uiStore.magicShape === 'rect' || uiStore.magicShape === 'cone' || uiStore.magicShape === 'line') ? 0 : magicPreview.h * 2,
                            transform: `translate(-50%, -50%) rotate(${uiStore.magicShape === 'line' || uiStore.magicShape === 'cone' ? magicPreview.r : 0}deg)`,
                        }}
                    >
                        {uiStore.magicShape === 'rect' && (
                            <div className="absolute top-0 left-0 border-2 border-white/50 border-dashed"
                                 style={{
                                     width: Math.abs(magicPreview.w),
                                     height: Math.abs(magicPreview.h),
                                     transform: `translate(${magicPreview.w < 0 ? magicPreview.w : 0}px, ${magicPreview.h < 0 ? magicPreview.h : 0}px)`
                                 }}
                            />
                        )}
                        {(uiStore.magicShape === 'line' || uiStore.magicShape === 'cone') && (
                            <svg className="absolute top-0 left-0 overflow-visible" style={{ width: 1, height: 1 }}>
                                {uiStore.magicShape === 'line' ? (
                                    <line x1="0" y1="0" x2={magicPreview.w} y2="0" stroke="rgba(255,255,255,0.5)" strokeWidth="40" strokeDasharray="5,5" />
                                ) : (
                                    <path 
                                        d={`M 0 0 L ${magicPreview.w * Math.cos(-Math.PI/6)} ${magicPreview.w * Math.sin(-Math.PI/6)} A ${magicPreview.w} ${magicPreview.w} 0 0 1 ${magicPreview.w * Math.cos(Math.PI/6)} ${magicPreview.w * Math.sin(Math.PI/6)} Z`}
                                        fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5,5"
                                    />
                                )}
                            </svg>
                        )}
                    </div>
                )}

                {dangerPreview && (
                    <div 
                        className={`absolute border border-rose-500/50 bg-rose-500/10 pointer-events-none z-50 border-dashed ${mapStore.dangerShape === 'circle' ? 'rounded-full text-center flex items-center justify-center' : ''}`}
                        style={{
                            left: mapStore.dangerShape === 'circle' ? (dangerPreview.x - dangerPreview.radius) : Math.min(dangerPreview.x, dangerPreview.x + dangerPreview.w),
                            top: mapStore.dangerShape === 'circle' ? (dangerPreview.y - dangerPreview.radius) : Math.min(dangerPreview.y, dangerPreview.y + dangerPreview.h),
                            width: mapStore.dangerShape === 'circle' ? (dangerPreview.radius * 2) : Math.abs(dangerPreview.w),
                            height: mapStore.dangerShape === 'circle' ? (dangerPreview.radius * 2) : Math.abs(dangerPreview.h)
                        }}
                    >
                        {mapStore.dangerShape === 'circle' && <div className="w-1 h-1 bg-rose-500 rounded-full" />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapCanvas;
