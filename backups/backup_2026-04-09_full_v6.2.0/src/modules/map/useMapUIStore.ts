import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapTool, MagicStyle, MagicShape, FogMode } from './types';

interface MapUIState {
    currentTool: MapTool;
    magicStyle: MagicStyle;
    magicShape: MagicShape;
    fogMode: FogMode;
    selectedDangerPresetId: string | null;
    brushSize: number;
    isDraggingToken: boolean;
    selectedTokenId: string | null;
    isPanning: boolean;
    isDrawing: boolean;

    // Interaction Overrides
    dangerShape: 'circle' | 'rect' | 'line' | 'cone';
    auraOverride: boolean;
    difficultTerrainOverride: boolean;
    movementCostOverride: number;
    dangerRotation: number;

    setTool: (tool: MapTool) => void;
    setMagicSettings: (style: MagicStyle, shape: MagicShape) => void;
    setFogMode: (mode: FogMode) => void;
    setBrushSize: (size: number) => void;
    setSelectedDangerPresetId: (id: string | null) => void;
    setIsDraggingToken: (val: boolean) => void;
    setSelectedTokenId: (id: string | null) => void;
    setIsPanning: (val: boolean) => void;
    setIsDrawing: (val: boolean) => void;

    // Actions for Overrides
    setDangerShape: (shape: 'circle' | 'rect' | 'line' | 'cone') => void;
    setAuraOverride: (val: boolean) => void;
    setDifficultTerrainOverride: (val: boolean) => void;
    setMovementCostOverride: (val: number) => void;
    setDangerRotation: (val: number) => void;
}

export const useMapUIStore = create<MapUIState>()(
    persist(
        (set) => ({
            currentTool: 'move_token',
            magicStyle: 'fire',
            magicShape: 'circle',
            fogMode: 'reveal',
            selectedDangerPresetId: 'preset-fire',
            brushSize: 50,
            isDraggingToken: false,
            selectedTokenId: null,
            isPanning: false,
            isDrawing: false,

            dangerShape: 'circle',
            auraOverride: false,
            difficultTerrainOverride: false,
            movementCostOverride: 2,
            dangerRotation: 0,

            setTool: (currentTool) => set({ currentTool }),
            setMagicSettings: (magicStyle, magicShape) => set({ magicStyle, magicShape }),
            setFogMode: (fogMode) => set({ fogMode }),
            setBrushSize: (brushSize) => set({ brushSize }),
            setSelectedDangerPresetId: (selectedDangerPresetId) => set({ selectedDangerPresetId }),
            setIsDraggingToken: (isDraggingToken) => set({ isDraggingToken }),
            setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId }),
            setIsPanning: (isPanning) => set({ isPanning }),
            setIsDrawing: (isDrawing) => set({ isDrawing }),

            setDangerShape: (dangerShape) => set({ dangerShape }),
            setAuraOverride: (auraOverride) => set({ auraOverride }),
            setDifficultTerrainOverride: (difficultTerrainOverride) => set({ difficultTerrainOverride }),
            setMovementCostOverride: (movementCostOverride) => set({ movementCostOverride }),
            setDangerRotation: (dangerRotation) => set({ dangerRotation }),
        }),
        {
            name: 'gmos-map-ui-storage',
            version: 1,
            partialize: (state) => ({
                currentTool: state.currentTool,
                brushSize: state.brushSize,
                dangerShape: state.dangerShape,
                auraOverride: state.auraOverride,
                difficultTerrainOverride: state.difficultTerrainOverride,
                movementCostOverride: state.movementCostOverride,
                magicStyle: state.magicStyle,
                magicShape: state.magicShape,
                fogMode: state.fogMode
            })
        }
    )
);
