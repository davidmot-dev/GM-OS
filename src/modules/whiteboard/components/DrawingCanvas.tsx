import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useWhiteboardStore, type Point, type DrawingPath } from '../useWhiteboardStore';

export interface DrawingCanvasRef {
    getBlob: () => Promise<Blob | null>;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef>((_, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [instanceId] = useState(() => Math.random().toString(36).substring(7));
    const [isDrawing, setIsDrawing] = useState(false);
    const { 
        paths, 
        currentTool, 
        currentColor, 
        currentWidth, 
        addPath, 
        removePath, 
        setLaserPointer, 
        laserPointer,
        setActivePath,
        activePath,
        activeDrawerId,
        backgroundMode
    } = useWhiteboardStore();
    
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

    const drawPath = React.useCallback((ctx: CanvasRenderingContext2D, path: DrawingPath) => {
        if (path.points.length < 2) return;

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.beginPath();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        
        if (path.tool === 'eraser') {
            ctx.strokeStyle = backgroundMode === 'light' ? '#ffffff' : '#0f172a';
            ctx.lineWidth = path.width * 16;
        } else if (path.tool === 'laser') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
        } else {
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (path.tool === 'brush' || path.tool === 'eraser' || path.tool === 'laser') {
            const first = path.points[0];
            ctx.moveTo(first.x * w, first.y * h);
            for (let i = 1; i < path.points.length; i++) {
                const p = path.points[i];
                ctx.lineTo(p.x * w, p.y * h);
            }
        } else if (path.tool === 'rect') {
            const start = path.points[0];
            const end = path.points[path.points.length - 1];
            ctx.strokeRect(
                start.x * w, 
                start.y * h, 
                (end.x - start.x) * w, 
                (end.y - start.y) * h
            );
            return;
        } else if (path.tool === 'circle') {
            const start = path.points[0];
            const end = path.points[path.points.length - 1];
            // Calculate radius in pixel space for a proper circle
            const dx = (end.x - start.x) * w;
            const dy = (end.y - start.y) * h;
            const radius = Math.sqrt(dx * dx + dy * dy);
            ctx.arc(start.x * w, start.y * h, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
    }, [backgroundMode]);

    const redraw = React.useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw all persisted paths
        paths.forEach(path => {
            drawPath(ctx, path);
        });

        // 2. Draw remote active trace (if from another drawer)
        if (activePath && activeDrawerId !== instanceId) {
            drawPath(ctx, activePath);
        }

        // 3. Draw laser pointer dot (from store)
        if (laserPointer) {
            const w = canvas.width;
            const h = canvas.height;
            ctx.beginPath();
            ctx.arc(laserPointer.x * w, laserPointer.y * h, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 4. Draw local current preview
        if (isDrawing && currentPoints.length >= 2) {
            const previewPath: DrawingPath = {
                id: 'preview',
                points: currentPoints,
                color: currentColor,
                width: currentWidth,
                tool: currentTool
            };
            drawPath(ctx, previewPath);
        }
    }, [paths, isDrawing, currentPoints, currentTool, currentColor, currentWidth, activePath, activeDrawerId, instanceId, laserPointer, drawPath]);

    useImperativeHandle(ref, () => ({
        getBlob: async () => {
            const canvas = canvasRef.current;
            if (!canvas) return null;

            // Create a temporary canvas to include the background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return null;

            // 1. Fill background
            tempCtx.fillStyle = backgroundMode === 'light' ? '#ffffff' : '#020617';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // 2. Draw original canvas content onto temp canvas
            tempCtx.drawImage(canvas, 0, 0);

            return new Promise<Blob | null>((resolve) => {
                tempCanvas.toBlob((blob) => resolve(blob), 'image/png');
            });
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                redraw();
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const context = canvas.getContext('2d');
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            contextRef.current = context;
        }

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [redraw]);

    // Redraw all paths whenever paths change
    useEffect(() => {
        redraw();
    }, [redraw]);

    // SYNC: Listen for storage events (from other windows/players)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'gm-os-whiteboard-storage-v1') {
                useWhiteboardStore.persist.rehydrate();
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const roundCoord = (val: number) => Math.round(val * 10000) / 10000;

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const rx = roundCoord(x);
        const ry = roundCoord(y);
        setIsDrawing(true);
        setCurrentPoints([{ x: rx, y: ry }]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const rx = roundCoord(x);
        const ry = roundCoord(y);
        
        // Track laser pointer
        if (currentTool === 'laser') {
            setLaserPointer({ x: rx, y: ry });
        } else if (laserPointer) {
            setLaserPointer(null);
        }

        if (!isDrawing) return;
        
        // Point Decimation: only add point if it moved at least 0.002
        const lastPoint = currentPoints[currentPoints.length - 1];
        if (lastPoint && currentTool !== 'rect' && currentTool !== 'circle') {
            const dist = Math.sqrt(Math.pow(rx - lastPoint.x, 2) + Math.pow(ry - lastPoint.y, 2));
            if (dist < 0.002) return;
        }

        let newPoints: Point[];
        if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'laser') {
            newPoints = [...currentPoints, { x: rx, y: ry }];
        } else {
            // Shapes: only keep start and current end
            newPoints = [currentPoints[0], { x: rx, y: ry }];
        }

        setCurrentPoints(newPoints);

        // SYNC: Share active trace in real-time
        setActivePath({
            id: 'active',
            points: newPoints,
            color: currentColor,
            width: currentWidth,
            tool: currentTool,
            isTemporary: currentTool === 'laser'
        }, instanceId);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setActivePath(null, null); // Clear real-time trace

        if (currentPoints.length >= 2) {
            const id = Math.random().toString(36).substr(2, 9);
            const newPath: DrawingPath = {
                id,
                points: currentPoints,
                color: currentColor,
                width: currentWidth,
                tool: currentTool,
                isTemporary: currentTool === 'laser'
            };
            addPath(newPath);
            
            if (currentTool === 'laser') {
                setTimeout(() => {
                    removePath(id);
                }, 2000);
            }
        }
        setCurrentPoints([]);
    };

    const handleMouseLeave = () => {
        setLaserPointer(null);
        setActivePath(null, null);
        stopDrawing();
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Return normalized coordinates (0 to 1)
        return {
            x: (clientX - rect.left) / canvas.width,
            y: (clientY - rect.top) / canvas.height
        };
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={handleMouseLeave}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
        />
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';
