import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WhiteboardTool = 'brush' | 'eraser' | 'rect' | 'circle' | 'laser';

export interface Point {
    x: number;
    y: number;
}

export interface DrawingPath {
    id: string;
    points: Point[];
    color: string;
    width: number;
    tool: WhiteboardTool;
    isTemporary?: boolean; // For laser pointer
}

interface WhiteboardState {
    paths: DrawingPath[];
    currentTool: WhiteboardTool;
    currentColor: string;
    currentWidth: number;
    laserPointer: Point | null;
    
    // Projection
    projectionTarget: 'hub' | 'monitor' | null;
    version: number; // For sync triggering
    
    // Real-time trace
    activePath: DrawingPath | null;
    activeDrawerId: string | null;
    backgroundMode: 'dark' | 'light';

    // History
    undoStack: DrawingPath[][];
    redoStack: DrawingPath[][];

    // Actions
    setTool: (tool: WhiteboardTool) => void;
    setColor: (color: string) => void;
    setWidth: (width: number) => void;
    setLaserPointer: (point: Point | null) => void;
    setActivePath: (path: DrawingPath | null, drawerId: string | null) => void;
    addPath: (path: DrawingPath) => void;
    removePath: (id: string) => void;
    clearBoard: () => void;
    setBackgroundMode: (mode: 'dark' | 'light') => void;
    undo: () => void;
    redo: () => void;
    clearProjectedState: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>()(
    persist(
        (set) => ({
            paths: [],
            currentTool: 'brush',
            currentColor: '#ffffff',
            currentWidth: 3,
            laserPointer: null,
            projectionTarget: null,
            version: 0,
            activePath: null,
            activeDrawerId: null,
            backgroundMode: 'dark',
            undoStack: [],
            redoStack: [],

            setTool: (tool) => set((state) => ({ currentTool: tool, version: state.version + 1 })),
            setColor: (color) => set((state) => ({ currentColor: color, version: state.version + 1 })),
            setWidth: (width) => set((state) => ({ currentWidth: width, version: state.version + 1 })),
            setLaserPointer: (point) => set((state) => ({ laserPointer: point, version: state.version + 1 })),

            setActivePath: (path, drawerId) => set((state) => ({ 
                activePath: path, 
                activeDrawerId: drawerId,
                version: state.version + 1 
            })),

            addPath: (path) => set((state) => {
                const newPaths = [...state.paths, path];
                return {
                    paths: newPaths,
                    undoStack: path.isTemporary ? state.undoStack : [...state.undoStack, state.paths],
                    redoStack: [],
                    version: state.version + 1,
                    activePath: null, // Clear active trace once confirmed
                    activeDrawerId: null
                };
            }),

            removePath: (id) => set((state) => ({
                paths: state.paths.filter(p => p.id !== id),
                version: state.version + 1
            })),

            clearBoard: () => set((state) => ({
                undoStack: [...state.undoStack, state.paths],
                paths: [],
                redoStack: [],
                version: state.version + 1,
                activePath: null,
                activeDrawerId: null
            })),

            setBackgroundMode: (mode) => set((state) => ({ 
                backgroundMode: mode, 
                version: state.version + 1 
            })),

            undo: () => set((state) => {
                if (state.undoStack.length === 0) return state;
                const previousPaths = state.undoStack[state.undoStack.length - 1];
                const newUndoStack = state.undoStack.slice(0, -1);
                return {
                    paths: previousPaths,
                    undoStack: newUndoStack,
                    redoStack: [...state.redoStack, state.paths],
                    version: state.version + 1
                };
            }),

            redo: () => set((state) => {
                if (state.redoStack.length === 0) return state;
                const nextPaths = state.redoStack[state.redoStack.length - 1];
                const newRedoStack = state.redoStack.slice(0, -1);
                return {
                    paths: nextPaths,
                    undoStack: [...state.undoStack, state.paths],
                    redoStack: newRedoStack,
                    version: state.version + 1
                };
            }),

            clearProjectedState: () => set((state) => ({
                projectionTarget: null,
                version: state.version + 1
            }))
        }),
        {
            name: 'gm-os-whiteboard-storage-v1',
            partialize: (state) => ({
                paths: state.paths.filter(p => !p.isTemporary), // Don't persist laser pointer
                currentColor: state.currentColor,
                currentWidth: state.currentWidth,
                currentTool: state.currentTool,
                projectionTarget: state.projectionTarget,
                laserPointer: state.laserPointer,
                activePath: state.activePath,
                activeDrawerId: state.activeDrawerId,
                backgroundMode: state.backgroundMode,
                version: state.version
            })
        }
    )
);
