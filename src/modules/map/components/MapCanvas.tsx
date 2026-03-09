import React, { useRef, useEffect, useState, type MouseEvent } from 'react';
import { useMapStore } from '../useMapStore';
import { FogEngine } from '../FogEngine';
import MapTokenNode from './MapTokenNode';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmConfirm } from '../../../stores/useModalStore';

const MapCanvas: React.FC = () => {
    const { 
        mapUrl, isVideo, fogDataUrl, setFogDataUrl, 
        currentTool, fogMode, brushSize, tokens, 
        fogCommand, triggerFogCommand,
        zoom, panX, panY, viewResetCounter, setViewState,
        mapWidth, mapHeight, setMapDimensions,
        isGridEnabled, gridSize, gridColor, gridOpacity
    } = useMapStore();
    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);

    const containerRef = useRef<HTMLDivElement>(null);
    const fogCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<FogEngine | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [lastPanPos, setLastPanPos] = useState<{ x: number, y: number } | null>(null);

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
            }, 50);
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

        if (e.button === 0) {
            if (currentTool === 'move_token') return; // Ne pas dessiner en mode déplacement de pions
            
            const coords = getCoordinates(e);
            setIsDrawing(true);
            setStartPos(coords);

            if (currentTool === 'brush') {
                engineRef.current?.drawBrush(coords.x, coords.y, coords.x, coords.y, fogMode, brushSize);
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

        setIsDrawing(false);
        setStartPos(null);
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
            onContextMenu={(e) => e.preventDefault()}
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
                        src={resolvedMapUrl} 
                        autoPlay 
                        loop 
                        muted 
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

                {/* 3. Fog Layer */}
                <canvas
                    ref={fogCanvasRef}
                    className="absolute inset-0 w-full h-full z-20 opacity-80"
                    style={{ display: resolvedMapUrl ? 'block' : 'none' }}
                />

                {/* 4. Tokens Layer */}
                <div className="absolute inset-0 w-full h-full z-30 pointer-events-none">
                    {tokens.map(token => (
                        <MapTokenNode key={token.id} token={token} />
                    ))}
                </div>

                {/* 5. Preview Layer */}
                <canvas
                    ref={previewCanvasRef}
                    className="absolute inset-0 w-full h-full z-40 pointer-events-none"
                />
            </div>
        </div>
    );
};

export default MapCanvas;
