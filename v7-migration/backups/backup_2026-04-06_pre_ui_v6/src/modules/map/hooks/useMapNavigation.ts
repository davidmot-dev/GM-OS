import { useCallback, useRef } from 'react';
import { useMapStore } from '../useMapStore';
import { useMapUIStore } from '../useMapUIStore';

export const useMapNavigation = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    mapWidth: number,
    mapHeight: number
) => {
    const { zoom, panX, panY, setViewState } = useMapStore();
    const { isPanning, setIsPanning } = useMapUIStore();
    const lastPanPos = useRef<{ x: number, y: number } | null>(null);

    const fitToScreen = useCallback((targetW = mapWidth, targetH = mapHeight) => {
        if (!containerRef.current) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        if (cw === 0 || ch === 0 || targetW === 0 || targetH === 0) return;
        
        const scale = Math.min(cw / targetW, ch / targetH);
        const px = (cw - targetW * scale) / 2;
        const py = (ch - targetH * scale) / 2;
        
        setViewState(scale, px, py);
    }, [mapWidth, mapHeight, setViewState, containerRef]);

    const getCoordinates = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        
        const rawX = clientX - rect.left;
        const rawY = clientY - rect.top;

        return {
            x: (rawX - panX) / zoom,
            y: (rawY - panY) / zoom
        };
    }, [panX, panY, zoom, containerRef]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        const delta = -e.deltaY;
        const scaleFactor = delta > 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.1), 10);

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

        setViewState(newZoom, newPanX, newPanY);
    }, [zoom, panX, panY, setViewState, containerRef]);

    const startPanning = useCallback((clientX: number, clientY: number) => {
        setIsPanning(true);
        lastPanPos.current = { x: clientX, y: clientY };
    }, [setIsPanning]);

    const updatePanning = useCallback((clientX: number, clientY: number) => {
        if (!isPanning || !lastPanPos.current) return;
        const dx = clientX - lastPanPos.current.x;
        const dy = clientY - lastPanPos.current.y;
        setViewState(zoom, panX + dx, panY + dy);
        lastPanPos.current = { x: clientX, y: clientY };
    }, [isPanning, zoom, panX, panY, setViewState]);

    const stopPanning = useCallback(() => {
        setIsPanning(false);
        lastPanPos.current = null;
    }, [setIsPanning]);

    return {
        zoom,
        panX,
        panY,
        isPanning,
        fitToScreen,
        getCoordinates,
        handleWheel,
        startPanning,
        updatePanning,
        stopPanning
    };
};
