import React, { useRef, useEffect, useState } from 'react';
import { useWhiteboardStore, type DrawingPath, type Point } from '../useWhiteboardStore';
import { limiteurDeCadence } from '../../../utils/limiteurDeCadence';
import WhiteboardToolbar from './WhiteboardToolbar';

export const PlayerDrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [instanceId] = useState(() => Math.random().toString(36).substring(7));
    const { 
        paths, 
        laserPointer, 
        projectionTarget, 
        finishDrawing,
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

    // Ref stable pour accéder à redraw sans créer de dépendance d'effet
    const redrawRef = useRef(redraw);
    redrawRef.current = redraw;

    // RESIZE: Ne s'exécute qu'au montage — utilise ResizeObserver
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            const w = Math.round(width);
            const h = Math.round(height);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            redrawRef.current();
        });

        const context = canvas.getContext('2d');
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            contextRef.current = context;
        }

        observer.observe(parent);
        return () => observer.disconnect();
    }, []); // ← Mount-only!

    // REDRAW: S'exécute quand les données changent, sans toucher aux dimensions du canvas
    useEffect(() => {
        redraw();
    }, [paths, laserPointer, redraw]);

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
        // Normalized coordinates (0 to 1)
        return { 
            x: (clientX - rect.left) / canvas.width, 
            y: (clientY - rect.top) / canvas.height 
        };
    };

    /*
      ⭐ **Même correctif que le canevas du MJ, et pour la même raison.**

      ⛔ Chaque point appelait `setActivePath`, donc un `set()` sur un magasin
      persisté — que Zustand écrit **à chaque `set()`**, sans condition. Et
      `CrossWindowEventService` jette déjà tout ce qui arrive à moins de 50 ms.

      ⚠️ *Le même défaut vivait dans deux fichiers* : le canevas du meneur et
      celui des joueurs. Corriger l'un sans l'autre aurait laissé la tablette
      saccader, et on aurait cherché ailleurs.
    */
    const diffusion = useRef(limiteurDeCadence());

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isActive) return;
        const { x, y } = getCoordinates(e);
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isActive) return;
        const { x, y } = getCoordinates(e);

        /*
          ⚠️ **Une seule fenêtre pour les deux diffusions.** Le laser et le tracé
          partent du même geste ; les limiter séparément consommerait deux
          fenêtres et l'un des deux passerait toujours après l'autre.

          L'extinction du laser (`null`) n'est PAS limitée : elle ne part qu'une
          fois, quand on change d'outil. *Ce qui arrête quelque chose ne se
          limite jamais* — un arrêt perdu laisse un point rouge sur l'écran des
          joueurs, et rien ne dit pourquoi.
        */
        const peutDiffuser = diffusion.current.tenter();

        // Synchronize laser pointer
        if (currentTool === 'laser') {
            if (peutDiffuser) setLaserPointer({ x, y });
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
        if (!peutDiffuser) return;
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
        /* ⛔ Sans cette réouverture, le dernier point — celui qui ferme la
           forme — pourrait tomber dans une fenêtre close et n'être jamais
           diffusé : *les autres écrans garderaient un trait tronqué.* */
        diffusion.current.rouvrir();

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
            // Atomic: ajoute le path ET nettoie activePath en une seule mutation
            finishDrawing(newPath);

            if (currentTool === 'laser') {
                setTimeout(() => {
                    removePath(id);
                }, 2000);
            }
        } else {
            // Pas assez de points pour un tracé valide — juste nettoyer l'état actif
            setActivePath(null, null);
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
