import React, { useRef, useEffect, useState, type MouseEvent } from 'react';
import { useMapStore } from '../useMapStore';
import { FogEngine } from '../FogEngine';
import MapTokenNode from './MapTokenNode';
import MapPingLayer from './MapPingLayer';
import WeatherLayer from './WeatherLayer';
import MagicLayer from './MagicLayer';
import DangerZoneLayer from './DangerZoneLayer';

import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmConfirm } from '../../../stores/useModalStore';

const MapCanvas: React.FC = () => {
    const { 
        mapUrl, isVideo, fogDataUrl, setFogDataUrl, 
        currentTool, fogMode, brushSize, tokens, 
        fogCommand, triggerFogCommand,
        addPing,
        zoom, panX, panY, viewResetCounter, setViewState,
        mapWidth, mapHeight, setMapDimensions,
        isGridEnabled, gridSize, gridColor, gridOpacity,
        setSelectedTokenId,
        magicStyle, magicShape, magicEffects, addMagicEffect, removeMagicEffect,
        addDangerZone, dangerShape,
        isMapMuted, mapVolume, mapOutputDeviceId
    } = useMapStore();



    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fogCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<FogEngine | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [lastPanPos, setLastPanPos] = useState<{ x: number, y: number } | null>(null);
    const [magicPreview, setMagicPreview] = useState<{ x: number, y: number, w: number, h: number, r: number } | null>(null);
    const [dangerPreview, setDangerPreview] = useState<{ x: number, y: number, w: number, h: number, radius: number, rotation: number } | null>(null);


    const fitToScreen = React.useCallback((targetW = mapWidth, targetH = mapHeight) => {
        if (!containerRef.current) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        if (cw === 0 || ch === 0) return;
        
        const scale = Math.min(cw / targetW, ch / targetH);
        const px = (cw - targetW * scale) / 2;
        const py = (ch - targetH * scale) / 2;
        
        setViewState(scale, px, py);
    }, [mapWidth, mapHeight, setViewState]);

    // Track container size & re-fit
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => {
            fitToScreen();
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [fitToScreen]);

    // Re-fit when container size changes and zoom is currently "fitted" (optional, but let's just do it on reset/load)

    // 1. Initialiser le Fog Engine
    useEffect(() => {
        if (!fogCanvasRef.current || !previewCanvasRef.current) return;
        
        const engine = new FogEngine();
        engine.initialize(
            fogCanvasRef.current,
            previewCanvasRef.current,
            mapWidth,
            mapHeight
        );
        engineRef.current = engine;

        if (fogDataUrl) engine.loadFromDataUrl(fogDataUrl);
        else engine.fillBlack();
    }, [mapWidth, mapHeight, fogDataUrl]);

    // 2. Détecter le chargement du média et ajuster les dimensions + Auto-Fit
    useEffect(() => {
        if (!resolvedMapUrl) return;

        const handleDimensions = (w: number, h: number) => {
            // Un petit délai pour s'assurer que le container a fini son layout si possible
            setTimeout(() => {
                setMapDimensions(w, h);
                engineRef.current?.resize(w, h);
                fitToScreen(w, h);
            }, 10);
        };

        if (isVideo) {
            const video = document.createElement('video');
            video.src = resolvedMapUrl;
            video.onloadedmetadata = () => handleDimensions(video.videoWidth, video.videoHeight);
            // Fallback if already loaded
            if (video.videoWidth > 0) handleDimensions(video.videoWidth, video.videoHeight);
        } else {
            const img = new Image();
            img.src = resolvedMapUrl;
            img.onload = () => handleDimensions(img.width, img.height);
            // Fallback if already loaded
            if (img.width > 0) handleDimensions(img.width, img.height);
        }
    }, [resolvedMapUrl, isVideo, setMapDimensions, fitToScreen]);

    // Handle Audio Volume & Device for GM View
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = mapVolume;
        }
    }, [mapVolume]);

    useEffect(() => {
        const setDevice = async () => {
            if (videoRef.current && 'setSinkId' in videoRef.current) {
                try {
                    const deviceId = mapOutputDeviceId === 'default' ? '' : mapOutputDeviceId;
                    await (videoRef.current as any).setSinkId(deviceId);
                    console.log(`[MapCanvas] Output device set to: ${deviceId || 'default'}`);
                } catch (err) {
                    console.error("[MapCanvas] Failed to set output device:", err);
                }
            }
        };
        setDevice();
    }, [mapOutputDeviceId]);

    // 3. Répondre au bouton "Recadrer"
    useEffect(() => {
        if (viewResetCounter > 0) {
            fitToScreen();
        }
    }, [viewResetCounter, fitToScreen]);


    useEffect(() => {
        if (!engineRef.current || !fogCommand) return;
        if (fogCommand === 'reveal_all') engineRef.current.revealAll();
        else if (fogCommand === 'hide_all') engineRef.current.fillBlack();
        setFogDataUrl(engineRef.current.getFogDataUrl());
        triggerFogCommand(null);
    }, [fogCommand, setFogDataUrl, triggerFogCommand]);

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

    // Coordinate Conversion Factor
    const getCoordinates = (e: MouseEvent) => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const rect = container.getBoundingClientRect();
        
        // Raw position in container
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Account for pan and zoom to get "virtual" coordinates
        // Virtual = (Raw - Pan) / Zoom
        return {
            x: (rawX - panX) / zoom,
            y: (rawY - panY) / zoom
        };
    };

    const handleMouseDown = (e: MouseEvent) => {
        // Middle click (button 1): start pan
        if (e.button === 1) {
            setIsPanning(true);
            setLastPanPos({ x: e.clientX, y: e.clientY });
            return;
        }
        
        // Clic gauche sur le fond -> Désélectionner
        if (e.button === 0) {
            setSelectedTokenId(null);
            
            if (currentTool === 'move_token') return; // Ne pas dessiner en mode déplacement de pions
            
            const coords = getCoordinates(e);

            if (currentTool === 'ping') {
                addPing(coords.x, coords.y, '#eab308'); // GM-OS Gold
                return;
            }

            setIsDrawing(true);
            setStartPos(coords);

            if (currentTool === 'brush') {
                engineRef.current?.drawBrush(coords.x, coords.y, coords.x, coords.y, fogMode, brushSize);
            } else if (currentTool === 'danger') {
                setIsDrawing(true);
                setStartPos(coords);
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isPanning && lastPanPos) {
            const dx = e.clientX - lastPanPos.x;
            const dy = e.clientY - lastPanPos.y;
            setViewState(zoom, panX + dx, panY + dy);
            setLastPanPos({ x: e.clientX, y: e.clientY });
            return;
        }

        const coords = getCoordinates(e);

        if (currentTool === 'brush' && !isPanning) {
            engineRef.current?.clearPreview();
            const ctx = previewCanvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
                ctx.strokeStyle = fogMode === 'reveal' ? 'white' : 'black';
                ctx.lineWidth = 2 / zoom; // Adjust line width for zoom
                ctx.stroke();
            }
        }

        if (!isDrawing || !startPos || isPanning) return;

        if (currentTool === 'brush') {
            engineRef.current?.drawBrush(startPos.x, startPos.y, coords.x, coords.y, fogMode, brushSize);
            setStartPos(coords);
        } else if (currentTool === 'rect') {
            engineRef.current?.previewRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y, fogMode);
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
            engineRef.current?.previewCircle(startPos.x, startPos.y, radius, fogMode);
        } else if (currentTool === 'magic') {
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
            setMagicPreview({
                x: startPos.x,
                y: startPos.y,
                w: dist,
                h: dist,
                r: rotation
            });
        } else if (currentTool === 'danger' && isDrawing && startPos) {
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
            setDangerPreview({
                x: startPos.x,
                y: startPos.y,
                w: dx,
                h: dy,
                radius: dist,
                rotation: rotation
            });
        }

    };

    const handleMouseUp = (e: MouseEvent) => {
        if (isPanning) {
            setIsPanning(false);
            setLastPanPos(null);
            return;
        }

        if (!isDrawing) return;
        const coords = getCoordinates(e);

        if (startPos && (currentTool === 'rect' || currentTool === 'circle')) {
            const actionLabel = fogMode === 'reveal' ? 'révéler' : 'cacher';
            const shapeLabel = currentTool === 'rect' ? 'rectangle' : 'cercle';
            
            gmConfirm(
                `Êtes-vous sûr de vouloir ${actionLabel} cette zone (${shapeLabel}) ?`,
                () => {
                    if (currentTool === 'rect') {
                        engineRef.current?.commitRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y, fogMode);
                    } else if (currentTool === 'circle') {
                        const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
                        engineRef.current?.commitCircle(startPos.x, startPos.y, radius, fogMode);
                    }
                    if (engineRef.current) setFogDataUrl(engineRef.current.getFogDataUrl());
                    setIsDrawing(false);
                    setStartPos(null);
                },
                () => {
                    engineRef.current?.clearPreview();
                    setIsDrawing(false);
                    setStartPos(null);
                },
                "Appliquer",
                "Annuler"
            );
            // We return early and wait for the modal
            return;
        }

        if (startPos && currentTool === 'magic') {
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

            // Placement logic adjustment:
            // Circle/Cone/Line: vertex/center is startPos
            // Rect: startPos is top-left
            
            let finalX = startPos.x;
            let finalY = startPos.y;
            let finalW = dist || 100;
            let finalH = dist || 100;

            if (magicShape === 'rect') {
                // If it's a rectangle, we allow dragging from corner to corner
                finalW = Math.abs(dx);
                finalH = Math.abs(dy);
                // The store/layer expects X/Y to be the center
                finalX = startPos.x + dx / 2;
                finalY = startPos.y + dy / 2;
            }

            addMagicEffect({
                type: magicShape,
                style: magicStyle,
                x: finalX,
                y: finalY,
                width: finalW,
                height: finalH,
                rotation: (magicShape === 'line' || magicShape === 'cone') ? rotation : 0,
                opacity: 0.8
            });
            setMagicPreview(null);
        }

        if (startPos && currentTool === 'danger') {
            const state = useMapStore.getState();
            const presets = state.dangerZonePresets;
            const presetId = state.selectedDangerPresetId;
            const preset = presets.find(p => p.id === presetId);
            
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

            console.log("[MapCanvas] Zone construite avec:", {
                name: preset?.name,
                hue: preset?.hueSceneId,
                atmos: preset?.audioAtmosphereId,
                pad: preset?.audioPadId
            });

            addDangerZone({
                name: preset?.name || "Zone de Danger",
                presetId: presetId || undefined,
                type: dangerShape,
                x: (dangerShape === 'cone' || dangerShape === 'line') ? startPos.x : (dangerShape === 'rect' ? Math.min(startPos.x, coords.x) : startPos.x),
                y: (dangerShape === 'cone' || dangerShape === 'line') ? startPos.y : (dangerShape === 'rect' ? Math.min(startPos.y, coords.y) : startPos.y),
                width: dangerShape === 'rect' ? Math.abs(dx) : dist,
                height: dangerShape === 'rect' ? Math.abs(dy) : (dangerShape === 'line' ? 40 : dist),
                radius: (dangerShape === 'circle' || dangerShape === 'cone') ? dist : 0,
                rotation: (dangerShape === 'cone' || dangerShape === 'line') ? rotation : 0,
                color: preset?.color || '#ff0000',
                hueSceneId: preset?.hueSceneId,
                audioAtmosphereId: preset?.audioAtmosphereId,
                audioPadId: preset?.audioPadId
            });
            setDangerPreview(null);
        }



        setIsDrawing(false);
        setStartPos(null);
        setMagicPreview(null);
        if (engineRef.current) setFogDataUrl(engineRef.current.getFogDataUrl());

    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = -e.deltaY;
        const scaleFactor = delta > 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.1), 10);

        // Zoom centered on mouse
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

        setViewState(newZoom, newPanX, newPanY);
    };

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full h-full bg-obsidian-dark overflow-hidden border border-gray-700 rounded-xl ${
                isPanning ? 'cursor-grabbing' : currentTool === 'move_token' ? 'cursor-default' : 'cursor-crosshair'
            }`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
                setIsPanning(false);
                setIsDrawing(false);
                engineRef.current?.clearPreview();
            }}
            onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                if (currentTool === 'magic') {
                    const coords = getCoordinates(e as unknown as MouseEvent);

                    // Find and remove the nearest magic effect
                    const nearest = magicEffects.find(eff => {
                        const dist = Math.sqrt(Math.pow(eff.x - coords.x, 2) + Math.pow(eff.y - coords.y, 2));
                        return dist < (eff.width || 50); // Simple collision
                    });
                    if (nearest) removeMagicEffect(nearest.id);
                }
            }}

        >
            {/* 0. Empty State */}
            {!resolvedMapUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0">
                    <span className="text-4xl mb-2">🗺️</span>
                    <p className="text-xl font-bold font-display">Aucune carte chargée</p>
                    <p className="text-sm">Utilisez le panneau latéral pour importer une image ou vidéo.</p>
                </div>
            )}

            {/* Transform Layer Wrapper */}
            <div 
                className="absolute top-0 left-0 origin-top-left pointer-events-none"
                style={{
                    width: mapWidth,
                    height: mapHeight,
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                }}
            >
                {/* 1. Base Layer (Image / Video) */}
                {resolvedMapUrl && isVideo ? (
                    <video 
                        ref={videoRef}
                        src={resolvedMapUrl} 
                        autoPlay 
                        loop 
                        muted={isMapMuted} 
                        className="absolute inset-0 w-full h-full object-cover z-10" 
                    />
                ) : resolvedMapUrl ? (
                    <img 
                        src={resolvedMapUrl} 
                        alt="Map Background" 
                        className="absolute inset-0 w-full h-full object-cover z-10" 
                    />
                ) : null}

                {/* 2. Grid Layer */}
                {isGridEnabled && (
                    <canvas ref={gridCanvasRef} className="absolute inset-0 w-full h-full z-15" />
                )}

                {/* 3. Tokens Layer (Under Fog for shading) */}
                <div className="absolute inset-0 w-full h-full z-16 pointer-events-none">
                    {tokens.map(token => (
                        <MapTokenNode key={token.id} token={token} />
                    ))}
                </div>

                {/* 4. Magic Effects Layer (Under Fog) */}
                <MagicLayer isProjectedView={false} />

                {/* 5. Danger Zones Layer */}
                <DangerZoneLayer isProjectedView={false} />

                {/* 6. Fog Layer (Top-level mask) */}
                <canvas
                    ref={fogCanvasRef}
                    className="absolute inset-0 w-full h-full z-20 opacity-80"
                    style={{ display: resolvedMapUrl ? 'block' : 'none' }}
                />

                {/* 7. Pings Layer (Above Fog) */}
                <MapPingLayer isProjectedView={false} />

                {/* 8. Weather Layer */}
                <WeatherLayer isProjectedView={false} />

                {/* 5. Preview Layer */}
                <canvas
                    ref={previewCanvasRef}
                    className="absolute inset-0 w-full h-full z-40 pointer-events-none"
                />

                {/* Magic Preview Overlay (Simple visual aid) */}
                {magicPreview && (
                    <div 
                        className={`absolute border-2 border-white/50 border-dashed pointer-events-none z-50 ${magicShape === 'circle' ? 'rounded-full' : ''}`}
                        style={{
                            left: magicPreview.x,
                            top: magicPreview.y,
                            width: (magicShape === 'rect' || magicShape === 'cone' || magicShape === 'line') ? 0 : magicPreview.w * 2,
                            height: (magicShape === 'rect' || magicShape === 'cone' || magicShape === 'line') ? 0 : magicPreview.h * 2,
                            transform: `translate(-50%, -50%) rotate(${magicShape === 'line' || magicShape === 'cone' ? magicPreview.r : 0}deg)`,
                        }}
                    >
                        {magicShape === 'rect' && (
                            <div className="absolute top-0 left-0 border-2 border-white/50 border-dashed"
                                 style={{
                                     width: Math.abs(magicPreview.w),
                                     height: Math.abs(magicPreview.h),
                                     transform: `translate(${magicPreview.w < 0 ? magicPreview.w : 0}px, ${magicPreview.h < 0 ? magicPreview.h : 0}px)`
                                 }}
                            />
                        )}
                        {(magicShape === 'line' || magicShape === 'cone') && (
                            <svg 
                                className="absolute top-0 left-0 overflow-visible"
                                style={{ width: 1, height: 1 }}
                            >
                                {magicShape === 'line' ? (
                                    <line 
                                        x1="0" y1="0" x2={magicPreview.w} y2="0" 
                                        stroke="rgba(255,255,255,0.5)" strokeWidth="40" strokeDasharray="5,5"
                                    />
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

                {/* Danger Zone Drawing Preview */}
                {dangerPreview && (
                    <div 
                        className={`absolute border border-rose-500/50 bg-rose-500/10 pointer-events-none z-50 border-dashed ${dangerShape === 'circle' ? 'rounded-full text-center flex items-center justify-center' : ''}`}
                        style={{
                            left: dangerShape === 'circle' 
                                ? (dangerPreview.x - dangerPreview.radius)
                                : Math.min(dangerPreview.x, dangerPreview.x + dangerPreview.w),
                            top: dangerShape === 'circle' 
                                ? (dangerPreview.y - dangerPreview.radius)
                                : Math.min(dangerPreview.y, dangerPreview.y + dangerPreview.h),
                            width: dangerShape === 'circle' 
                                ? (dangerPreview.radius * 2)
                                : Math.abs(dangerPreview.w),
                            height: dangerShape === 'circle' 
                                ? (dangerPreview.radius * 2) 
                                : Math.abs(dangerPreview.h)
                        }}
                    >
                        {dangerShape === 'circle' && (
                            <div className="w-1 h-1 bg-rose-500 rounded-full" />
                        )}
                    </div>
                )}


            </div>
        </div>
    );
};

export default MapCanvas;
