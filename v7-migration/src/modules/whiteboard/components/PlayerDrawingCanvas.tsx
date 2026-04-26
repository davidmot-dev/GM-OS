import React, { useRef, useEffect, useState } from 'react';
import { useWhiteboardStore, type DrawingPath, type Point } from '../useWhiteboardStore';
import WhiteboardToolbar from './WhiteboardToolbar';

export const PlayerDrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [instanceId] = useState(() => Math.random().toString(36).substring(7));
    const { 
        paths, 
        laserPointer, 
        projectionTarget, 
        addPath, 
        removePath, 
        setLaserPointer, 
        currentColor, 
        currentWidth, 
        currentTool,
        setActivePath,
        activePath,
        activeDrawerId,
        backgroundMode
    } = useWhiteboardStore();
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

    const isActive = projectionTarget !== null;

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
            const dx = (end.x - start.x) * w;
            const dy = (end.y - start.y) * h;
            const radius = Math.sqrt(dx * dx + dy * dy);
            ctx.arc(start.x * w, start.y * h, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
    }, [backgroundMode]);

    const redraw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!isActive) return;

        paths.forEach(path => drawPath(ctx, path));

        // 2. Draw remote active trace (from other drawers)
        if (activePath && activeDrawerId !== instanceId) {
            drawPath(ctx, activePath);
        }

        // 3. Draw current preview (if drawing locally)
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

        // 4. Draw Laser Pointer (dot)
        if (laserPointer) {
            const w = canvas.width;
            const h = canvas.height;
            ctx.beginPath();
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.arc(laserPointer.x * w, laserPointer.y * h, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }, [paths, laserPointer, isActive, isDrawing, currentPoints, currentColor, currentWidth, currentTool, activePath, activeDrawerId, instanceId, drawPath]);

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

    // Redraw whenever paths or pointer change
    useEffect(() => {
        redraw();
    }, [paths, laserPointer, redraw]);

    // REAL-TIME SYNC: Rehydrate store on storage events (cross-window)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'gm-os-whiteboard-storage-v1') {
                useWhiteboardStore.persist.rehydrate();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e) {
            clientX = (e as React.TouchEvent).touches[0].clientX;
            clientY = (e as React.TouchEvent).touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        // Normalized coordinates (0 to 1)
        return { 
            x: (clientX - rect.left) / canvas.width, 
            y: (clientY - rect.top) / canvas.height 
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isActive) return;
        const { x, y } = getCoordinates(e);
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isActive) return;
        const { x, y } = getCoordinates(e);

        // Synchronize laser pointer
        if (currentTool === 'laser') {
            setLaserPointer({ x, y });
        } else if (laserPointer) {
            setLaserPointer(null);
        }

        if (!isDrawing) return;

        let newPoints: Point[];
        if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'laser') {
            newPoints = [...currentPoints, { x, y }];
        } else {
            // Shapes: start + current
            newPoints = [currentPoints[0], { x, y }];
        }
        
        setCurrentPoints(newPoints);

        // SYNC: Share active trace
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
        setActivePath(null, null);

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

    return (
        <div className="w-full h-full relative group">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={handleMouseLeave}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`w-full h-full ${isActive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
            />
            
            {isActive && (
                <WhiteboardToolbar className="absolute left-6 top-1/2 -translate-y-1/2 scale-75 origin-left" />
            )}
        </div>
    );
};
