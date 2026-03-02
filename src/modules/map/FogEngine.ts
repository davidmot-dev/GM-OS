import { type FogMode, type MapTool } from './useMapStore';

/**
 * FogEngine
 * 
 * Manages drawing on the Fog of War canvas and the Preview canvas.
 * Isolated from React render cycle for performance.
 */
export class FogEngine {
    private fogCtx: CanvasRenderingContext2D | null = null;
    private previewCtx: CanvasRenderingContext2D | null = null;

    private width: number = 0;
    private height: number = 0;

    constructor() { }

    /**
     * Bind the engine to actual canvas elements
     */
    public initialize(fogCanvas: HTMLCanvasElement, previewCanvas: HTMLCanvasElement, width: number, height: number) {
        this.fogCtx = fogCanvas.getContext('2d', { willReadFrequently: true });
        this.previewCtx = previewCanvas.getContext('2d');
        this.resize(width, height);
    }

    /**
     * Update internal dimensions and canvas sizes
     */
    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        if (this.fogCtx) {
            this.fogCtx.canvas.width = width;
            this.fogCtx.canvas.height = height;
        }
        if (this.previewCtx) {
            this.previewCtx.canvas.width = width;
            this.previewCtx.canvas.height = height;
        }
    }

    /**
     * Fills the entire fog canvas with total darkness (reset)
     */
    public fillBlack() {
        if (!this.fogCtx) return;
        this.fogCtx.globalCompositeOperation = 'source-over';
        this.fogCtx.fillStyle = 'black';
        this.fogCtx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Restores state from a base64 DataURL
     */
    public loadFromDataUrl(dataUrl: string, callback?: () => void) {
        if (!this.fogCtx) return;
        const img = new Image();
        img.onload = () => {
            this.fogCtx!.globalCompositeOperation = 'source-over';
            this.fogCtx!.clearRect(0, 0, this.width, this.height);
            this.fogCtx!.drawImage(img, 0, 0, this.width, this.height);
            if (callback) callback();
        };
        img.src = dataUrl;
    }

    /**
     * Returns the current fog state as base64 for persistence
     */
    public getFogDataUrl(): string {
        if (!this.fogCtx) return '';
        return this.fogCtx.canvas.toDataURL('image/png');
    }

    /**
     * Helper to setup composite operation (Erase = Reveal, Draw = Hide)
     */
    private setupOperation(ctx: CanvasRenderingContext2D, mode: FogMode, tool: MapTool, brushSize: number) {
        // 'destination-out' acts as an eraser, making pixels transparent -> Reveals the map underneath
        // 'source-over' draws new pixels -> Adds black fog back
        ctx.globalCompositeOperation = mode === 'reveal' ? 'destination-out' : 'source-over';

        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        if (mode === 'reveal') {
            // When erasing, fillStyle/strokeStyle color doesn't matter, only alpha matters
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.fillStyle = "rgba(0,0,0,1)";

            // Soft edges for brush only
            if (tool === 'brush') {
                ctx.shadowBlur = brushSize;
                ctx.shadowColor = "black";
            } else {
                ctx.shadowBlur = 0;
            }
        } else {
            // When hiding, we explicitly draw black pixels
            ctx.strokeStyle = "black";
            ctx.fillStyle = "black";
            ctx.shadowBlur = 0;
        }

        ctx.lineWidth = brushSize;
    }

    // --- Action Methods ---

    public drawBrush(x0: number, y0: number, x1: number, y1: number, mode: FogMode, brushSize: number) {
        if (!this.fogCtx) return;
        this.setupOperation(this.fogCtx, mode, 'brush', brushSize);
        this.fogCtx.beginPath();
        this.fogCtx.moveTo(x0, y0);
        this.fogCtx.lineTo(x1, y1);
        this.fogCtx.stroke();
    }

    public commitRect(x: number, y: number, w: number, h: number, mode: FogMode) {
        if (!this.fogCtx) return;
        this.setupOperation(this.fogCtx, mode, 'rect', 0); // No blur for shapes
        this.fogCtx.fillRect(x, y, w, h);
        this.clearPreview();
    }

    public commitCircle(x: number, y: number, radius: number, mode: FogMode) {
        if (!this.fogCtx) return;
        this.setupOperation(this.fogCtx, mode, 'circle', 0);
        this.fogCtx.beginPath();
        this.fogCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.fogCtx.fill();
        this.clearPreview();
    }

    // --- Preview Methods (for Rect & Circle drag before commit) ---

    public clearPreview() {
        if (!this.previewCtx) return;
        this.previewCtx.clearRect(0, 0, this.width, this.height);
    }

    public previewRect(x: number, y: number, w: number, h: number, mode: FogMode) {
        if (!this.previewCtx) return;
        this.clearPreview();

        this.previewCtx.fillStyle = mode === 'reveal' ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.8)";
        this.previewCtx.strokeStyle = mode === 'reveal' ? "white" : "black";
        this.previewCtx.lineWidth = 1;
        this.previewCtx.setLineDash([5, 5]);

        this.previewCtx.fillRect(x, y, w, h);
        this.previewCtx.strokeRect(x, y, w, h);
    }

    public previewCircle(x: number, y: number, radius: number, mode: FogMode) {
        if (!this.previewCtx) return;
        this.clearPreview();

        this.previewCtx.fillStyle = mode === 'reveal' ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.8)";
        this.previewCtx.strokeStyle = mode === 'reveal' ? "white" : "black";
        this.previewCtx.lineWidth = 1;
        this.previewCtx.setLineDash([5, 5]);

        this.previewCtx.beginPath();
        this.previewCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.previewCtx.fill();
        this.previewCtx.stroke();
    }
}
