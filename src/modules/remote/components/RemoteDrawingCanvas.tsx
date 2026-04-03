import React, { useRef, useEffect, useState, useCallback } from 'react';
import { type DrawingPath, type Point, type WhiteboardTool } from '../types/remote.types';

interface RemoteDrawingCanvasProps {
    whiteboard: {
        paths: DrawingPath[];
        activePath: DrawingPath | null;
        laserPointer: Point | null;
        backgroundMode: 'dark' | 'light';
        currentTool: WhiteboardTool;
        currentColor: string;
        currentWidth: number;
    };
    onAction: (type: string, payload: unknown) => void;
}

const RemoteDrawingCanvas: React.FC<RemoteDrawingCanvasProps> = ({ whiteboard, onAction }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [instanceId] = useState(() => Math.random().toString(36).substring(7));
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

    const { 
        paths, 
        activePath, 
        laserPointer, 
        backgroundMode, 
        currentTool, 
        currentColor, 
        currentWidth 
    } = whiteboard;

    const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: DrawingPath) => {
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

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        paths.forEach(path => drawPath(ctx, path));

        if (activePath) {
            drawPath(ctx, activePath);
        }

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
    }, [paths, activePath, laserPointer, isDrawing, currentPoints, currentTool, currentColor, currentWidth, drawPath]);

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

    useEffect(() => {
        redraw();
    }, [redraw]);

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
        return {
            x: (clientX - rect.left) / canvas.width,
            y: (clientY - rect.top) / canvas.height
        };
    };

    const roundCoord = (val: number) => Math.round(val * 10000) / 10000;

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const rx = roundCoord(x);
        const ry = roundCoord(y);
        setIsDrawing(true);
        setCurrentPoints([{ x: rx, y: ry }]);
    };

    const lastEmitRef = useRef<number>(0);
    const lastLaserRef = useRef<Point | null>(null);

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const rx = roundCoord(x);
        const ry = roundCoord(y);
        
        const now = Date.now();
        const shouldThrottle = now - lastEmitRef.current < 50;

        if (currentTool === 'laser') {
            if (!shouldThrottle || !lastLaserRef.current || 
                Math.abs(lastLaserRef.current.x - rx) > 0.01 || 
                Math.abs(lastLaserRef.current.y - ry) > 0.01) {
                onAction('whiteboard:set-laser-pointer', { x: rx, y: ry });
                lastLaserRef.current = { x: rx, y: ry };
                if (!isDrawing) lastEmitRef.current = now;
            }
        }

        if (!isDrawing) return;
        
        const lastPoint = currentPoints[currentPoints.length - 1];
        if (lastPoint && currentTool !== 'rect' && currentTool !== 'circle') {
            const dist = Math.sqrt(Math.pow(rx - lastPoint.x, 2) + Math.pow(ry - lastPoint.y, 2));
            if (dist < 0.002) return;
        }

        let newPoints: Point[];
        if (currentTool === 'brush' || currentTool === 'eraser' || currentTool === 'laser') {
            newPoints = [...currentPoints, { x: rx, y: ry }];
        } else {
            newPoints = [currentPoints[0], { x: rx, y: ry }];
        }
        setCurrentPoints(newPoints);

        if (!shouldThrottle || currentTool === 'rect' || currentTool === 'circle') {
            onAction('whiteboard:set-active-path', {
                path: {
                    id: 'active',
                    points: newPoints,
                    color: currentColor,
                    width: currentWidth,
                    tool: currentTool,
                    isTemporary: currentTool === 'laser'
                },
                drawerId: instanceId
            });
            lastEmitRef.current = now;
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        onAction('whiteboard:set-active-path', { path: null, drawerId: null });

        if (currentPoints.length >= 2) {
            const newPath: DrawingPath = {
                id: Math.random().toString(36).substring(2, 9),
                points: currentPoints,
                color: currentColor,
                width: currentWidth,
                tool: currentTool,
                isTemporary: currentTool === 'laser'
            };
            onAction('whiteboard:add-path', newPath);
        }
        setCurrentPoints([]);
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={() => {
                if (isDrawing) stopDrawing();
                if (currentTool === 'laser') onAction('whiteboard:set-laser-pointer', null);
            }}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
        />
    );
};

export default RemoteDrawingCanvas;
