import { useState, useCallback } from 'react';
import { useMapStore } from '../useMapStore';
import { useMapUIStore } from '../useMapUIStore';
import { gmConfirm } from '../../../stores/useModalStore';
import type { FogEngine } from '../FogEngine';

export const useMapInteraction = (
    engineRef: React.RefObject<FogEngine | null>,
    previewCanvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
    const mapStore = useMapStore();
    const uiStore = useMapUIStore();

    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
    const [magicPreview, setMagicPreview] = useState<{ x: number, y: number, w: number, h: number, r: number } | null>(null);
    const [dangerPreview, setDangerPreview] = useState<{ x: number, y: number, w: number, h: number, radius: number, rotation: number } | null>(null);

    const clearPreviews = useCallback(() => {
        engineRef.current?.clearPreview();
        setMagicPreview(null);
        setDangerPreview(null);
    }, [engineRef]);

    const handleInteractionStart = useCallback((coords: { x: number, y: number }) => {
        uiStore.setIsDrawing(true);
        setStartPos(coords);

        if (uiStore.currentTool === 'brush') {
            engineRef.current?.drawBrush(coords.x, coords.y, coords.x, coords.y, uiStore.fogMode, uiStore.brushSize);
        }
    }, [uiStore, engineRef]);

    const handleInteractionMove = useCallback((coords: { x: number, y: number }, zoom: number) => {
        if (uiStore.currentTool === 'brush' && !uiStore.isPanning) {
            engineRef.current?.clearPreview();
            const ctx = previewCanvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, uiStore.brushSize / 2, 0, Math.PI * 2);
                ctx.strokeStyle = uiStore.fogMode === 'reveal' ? 'white' : 'black';
                ctx.lineWidth = 2 / zoom;
                ctx.stroke();
            }
        }

        if (!uiStore.isDrawing || !startPos || uiStore.isPanning) return;

        if (uiStore.currentTool === 'brush') {
            engineRef.current?.drawBrush(startPos.x, startPos.y, coords.x, coords.y, uiStore.fogMode, uiStore.brushSize);
            setStartPos(coords);
        } else if (uiStore.currentTool === 'rect') {
            engineRef.current?.previewRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y, uiStore.fogMode);
        } else if (uiStore.currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
            engineRef.current?.previewCircle(startPos.x, startPos.y, radius, uiStore.fogMode);
        } else if (uiStore.currentTool === 'magic') {
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
            setMagicPreview({ x: startPos.x, y: startPos.y, w: dist, h: dist, r: rotation });
        } else if (uiStore.currentTool === 'danger') {
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
            setDangerPreview({ x: startPos.x, y: startPos.y, w: dx, h: dy, radius: dist, rotation: rotation });
        }
    }, [uiStore, startPos, engineRef, previewCanvasRef]);

    const handleInteractionEnd = useCallback((coords: { x: number, y: number }) => {
        if (!uiStore.isDrawing || !startPos) return;

        if (uiStore.currentTool === 'rect' || uiStore.currentTool === 'circle') {
            const actionLabel = uiStore.fogMode === 'reveal' ? 'révéler' : 'cacher';
            const shapeLabel = uiStore.currentTool === 'rect' ? 'rectangle' : 'cercle';
            
            gmConfirm(
                `Êtes-vous sûr de vouloir ${actionLabel} cette zone (${shapeLabel}) ?`,
                () => {
                    if (uiStore.currentTool === 'rect') {
                        engineRef.current?.commitRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y, uiStore.fogMode);
                    } else if (uiStore.currentTool === 'circle') {
                        const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
                        engineRef.current?.commitCircle(startPos.x, startPos.y, radius, uiStore.fogMode);
                    }
                    if (engineRef.current) mapStore.setFogDataUrl(engineRef.current.getFogDataUrl());
                    uiStore.setIsDrawing(false);
                    setStartPos(null);
                },
                () => {
                    engineRef.current?.clearPreview();
                    uiStore.setIsDrawing(false);
                    setStartPos(null);
                }
            );
            return;
        }

        if (uiStore.currentTool === 'magic') {
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
            
            let finalX = startPos.x, finalY = startPos.y, finalW = dist || 100, finalH = dist || 100;
            if (uiStore.magicShape === 'rect') {
                finalW = Math.abs(dx);
                finalH = Math.abs(dy);
                finalX = startPos.x + dx / 2;
                finalY = startPos.y + dy / 2;
            }

            mapStore.addMagicEffect({
                type: uiStore.magicShape,
                style: uiStore.magicStyle,
                x: finalX,
                y: finalY,
                width: finalW,
                height: finalH,
                rotation: (uiStore.magicShape === 'line' || uiStore.magicShape === 'cone') ? rotation : 0,
                opacity: 0.8
            });
            setMagicPreview(null);
        }

        if (uiStore.currentTool === 'danger') {
            const preset = mapStore.dangerZonePresets.find(p => p.id === uiStore.selectedDangerPresetId);
            const dx = coords.x - startPos.x;
            const dy = coords.y - startPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

            mapStore.addDangerZone({
                name: preset?.name || "Zone de Danger",
                presetId: uiStore.selectedDangerPresetId || undefined,
                type: mapStore.dangerShape,
                x: (mapStore.dangerShape === 'cone' || mapStore.dangerShape === 'line') ? startPos.x : (mapStore.dangerShape === 'rect' ? Math.min(startPos.x, coords.x) : startPos.x),
                y: (mapStore.dangerShape === 'cone' || mapStore.dangerShape === 'line') ? startPos.y : (mapStore.dangerShape === 'rect' ? Math.min(startPos.y, coords.y) : startPos.y),
                width: mapStore.dangerShape === 'rect' ? Math.abs(dx) : dist,
                height: mapStore.dangerShape === 'rect' ? Math.abs(dy) : (mapStore.dangerShape === 'line' ? 40 : dist),
                radius: (mapStore.dangerShape === 'circle' || mapStore.dangerShape === 'cone') ? dist : 0,
                rotation: (mapStore.dangerShape === 'cone' || mapStore.dangerShape === 'line') ? rotation : 0,
                color: preset?.color || '#ff0000',
                hueSceneId: preset?.hueSceneId,
                audioAtmosphereId: preset?.audioAtmosphereId,
                audioPadId: preset?.audioPadId,
                isAura: mapStore.auraOverride || preset?.isAura,
                isDifficultTerrain: mapStore.difficultTerrainOverride || preset?.isDifficultTerrain,
                movementCost: mapStore.difficultTerrainOverride ? mapStore.movementCostOverride : (preset?.isDifficultTerrain ? preset?.movementCost : undefined),
                parentTokenId: ((mapStore.auraOverride || preset?.isAura) && uiStore.selectedTokenId) ? uiStore.selectedTokenId : undefined
            });
            setDangerPreview(null);
        }

        uiStore.setIsDrawing(false);
        setStartPos(null);
        if (engineRef.current) mapStore.setFogDataUrl(engineRef.current.getFogDataUrl());
    }, [uiStore, startPos, engineRef, mapStore]);

    return {
        isDrawing: uiStore.isDrawing,
        magicPreview,
        dangerPreview,
        handleInteractionStart,
        handleInteractionMove,
        handleInteractionEnd,
        clearPreviews
    };
};
