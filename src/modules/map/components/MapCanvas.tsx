import React, { useRef, useEffect, useState, type MouseEvent } from 'react';
import { useMapStore } from '../useMapStore';
import { FogEngine } from '../FogEngine';
import MapTokenNode from './MapTokenNode';

const MapCanvas: React.FC = () => {
    const { mapUrl, isVideo, fogDataUrl, setFogDataUrl, currentTool, fogMode, brushSize, tokens } = useMapStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const fogCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<FogEngine | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);

    // Keep latest fogDataUrl in ref for ResizeObserver to avoid stale closures
    const fogDataUrlRef = useRef(fogDataUrl);
    useEffect(() => {
        fogDataUrlRef.current = fogDataUrl;
    }, [fogDataUrl]);

    // Initialize Engine
    useEffect(() => {
        if (!fogCanvasRef.current || !previewCanvasRef.current || !containerRef.current) return;

        const engine = new FogEngine();
        engine.initialize(
            fogCanvasRef.current,
            previewCanvasRef.current,
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
        );
        engineRef.current = engine;

        // Resize observer to keep canvases synced with container
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                engine.resize(entry.contentRect.width, entry.contentRect.height);
                // Need to restore fog data if resized, otherwise it clears. Real VTT handles this better but here we do simple resize handling.
                if (fogDataUrlRef.current) engine.loadFromDataUrl(fogDataUrlRef.current);
                else engine.fillBlack();
            }
        });
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Load persisted fog when map initializes
    useEffect(() => {
        if (engineRef.current) {
            if (fogDataUrl) {
                engineRef.current.loadFromDataUrl(fogDataUrl);
            } else {
                engineRef.current.fillBlack();
            }
        }
    }, [mapUrl, fogDataUrl]); // We only trigger this if URL changes or on initial mount. We don't want to reload continuously.

    // --- Mouse Handlers for Fog Tools --- 

    // Convert screen coordinates to canvas coordinates
    const getCoordinates = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = previewCanvasRef.current!.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (currentTool === 'move_token') return; // Handled separately by Tokens
        const coords = getCoordinates(e);
        setIsDrawing(true);
        setStartPos(coords);

        if (currentTool === 'brush') {
            engineRef.current?.drawBrush(coords.x, coords.y, coords.x, coords.y, fogMode, brushSize);
        }
    };

    const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (currentTool === 'move_token') return;

        const coords = getCoordinates(e);

        if (currentTool === 'brush') {
            // Preview brush loosely
            engineRef.current?.clearPreview();
            const ctx = previewCanvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
                ctx.strokeStyle = fogMode === 'reveal' ? 'white' : 'black';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        if (!isDrawing || !startPos) return;

        if (currentTool === 'brush') {
            engineRef.current?.drawBrush(startPos.x, startPos.y, coords.x, coords.y, fogMode, brushSize);
            setStartPos(coords); // Update for smooth continuous lines
        } else if (currentTool === 'rect') {
            const w = coords.x - startPos.x;
            const h = coords.y - startPos.y;
            engineRef.current?.previewRect(startPos.x, startPos.y, w, h, fogMode);
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
            engineRef.current?.previewCircle(startPos.x, startPos.y, radius, fogMode);
        }
    };

    const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || currentTool === 'move_token') return;
        const coords = getCoordinates(e);

        if (startPos && currentTool === 'rect') {
            const w = coords.x - startPos.x;
            const h = coords.y - startPos.y;
            engineRef.current?.commitRect(startPos.x, startPos.y, w, h, fogMode);
        } else if (startPos && currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
            engineRef.current?.commitCircle(startPos.x, startPos.y, radius, fogMode);
        }

        setIsDrawing(false);
        setStartPos(null);

        // Save state to Zustand after drawing ends (this will trigger persistence)
        if (engineRef.current) {
            setFogDataUrl(engineRef.current.getFogDataUrl());
        }
    };

    const handleMouseLeave = () => {
        engineRef.current?.clearPreview();
        if (currentTool === 'brush' && isDrawing && engineRef.current) {
            setFogDataUrl(engineRef.current.getFogDataUrl());
        }
        setIsDrawing(false);
        setStartPos(null);
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-obsidian-dark overflow-hidden flex items-center justify-center border border-gray-700 rounded-xl">
            {/* 0. Empty State */}
            {!mapUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0">
                    <span className="text-4xl mb-2">🗺️</span>
                    <p className="text-xl font-bold font-display">Aucune carte chargée</p>
                    <p className="text-sm">Utilisez le panneau latéral pour importer une image ou vidéo.</p>
                </div>
            )}

            {/* 1. Base Layer (Image / Video) */}
            {mapUrl && isVideo ? (
                <video src={mapUrl} autoPlay loop muted className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" />
            ) : mapUrl ? (
                <img src={mapUrl} alt="Map Background" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" />
            ) : null}

            {/* 2. Fog Layer (Persistent Canvas) */}
            <canvas
                ref={fogCanvasRef}
                className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-80"
                style={{ display: mapUrl ? 'block' : 'none' }}
            />

            {/* 3. Token Layer (React Components overlay) */}
            <div className="absolute inset-0 w-full h-full z-30 pointer-events-none overflow-hidden" style={{ display: mapUrl ? 'block' : 'none' }}>
                {tokens.map(token => (
                    <MapTokenNode key={token.id} token={token} />
                ))}
            </div>

            {/* 4. Preview / Input Layer (Captures Mouse events) */}
            <canvas
                ref={previewCanvasRef}
                className={`absolute inset-0 w-full h-full z-40 ${currentTool === 'move_token' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                // Right click cancels current shape
                onContextMenu={(e) => {
                    e.preventDefault();
                    engineRef.current?.clearPreview();
                    setIsDrawing(false);
                    setStartPos(null);
                }}
            />
        </div>
    );
};

export default MapCanvas;
