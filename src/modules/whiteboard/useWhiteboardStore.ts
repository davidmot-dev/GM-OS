import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Outils de dessin disponibles sur le Whiteboard */
export type WhiteboardTool = 'brush' | 'eraser' | 'rect' | 'circle' | 'laser';

/** Point de coordonnées vectorielles */
export interface Point {
    x: number;
    y: number;
}

/**
 * Représente un tracé vectoriel sur le tableau blanc.
 */
export interface DrawingPath {
    id: string;
    /** Liste ordonnée des points formant le tracé */
    points: Point[];
    /** Couleur du tracé (Hex) */
    color: string;
    /** Épaisseur du trait */
    width: number;
    /** Outil utilisé pour ce tracé */
    tool: WhiteboardTool;
    /** Si vrai, le tracé disparaît après un court instant (Laser) */
    isTemporary?: boolean; 
}

/**
 * Interface d'état globale pour le Whiteboard-OS (Tableau Blanc).
 * Gère le dessin vectoriel temps réel et la projection collaborative.
 */
interface WhiteboardState {
    /** Liste des tracés validés présents sur le tableau */
    paths: DrawingPath[];
    /** Outil actuellement sélectionné par l'utilisateur */
    currentTool: WhiteboardTool;
    /** Couleur active pour les nouveaux tracés */
    currentColor: string;
    /** Épaisseur active pour les nouveaux tracés */
    currentWidth: number;
    /** Position actuelle du pointeur laser (si actif) */
    laserPointer: Point | null;
    
    // Projection
    /** Cible de projection du tableau (Hub=Joueurs, Monitor=MJ) */
    projectionTarget: 'hub' | 'monitor' | null;
    /** Compteur de version pour forcer la synchronisation réseau */
    version: number; 
    
    // Real-time trace
    /** Tracé en cours de création (non encore validé) */
    activePath: DrawingPath | null;
    /** ID de l'utilisateur qui dessine actuellement (système multi-source) */
    activeDrawerId: string | null;
    /** Mode de rendu du fond (Sombre/Clair) */
    backgroundMode: 'dark' | 'light';

    // History
    /** Pile d'annulation pour les opérations Undo */
    undoStack: DrawingPath[][];
    /** Pile de rétablissement pour les opérations Redo */
    redoStack: DrawingPath[][];

    // Actions
    setTool: (tool: WhiteboardTool) => void;
    setColor: (color: string) => void;
    setWidth: (width: number) => void;
    /** Met à jour la position du laser pour tous les écrans */
    setLaserPointer: (point: Point | null) => void;
    /** Définit le tracé temporaire en cours de dessin */
    setActivePath: (path: DrawingPath | null, drawerId: string | null) => void;
    /** Ajoute définitivement un tracé au tableau et à l'historique */
    addPath: (path: DrawingPath) => void;
    /**
     * Termine atomiquement un dessin en ajoutant le tracé aux paths
     * ET en nettoyant activePath/activeDrawerId en une seule mutation Zustand.
     * Cela évite les race conditions de synchronisation.
     */
    finishDrawing: (path: DrawingPath) => void;
    /** Supprime un tracé spécifique */
    removePath: (id: string) => void;
    /** Efface tout le contenu du tableau */
    clearBoard: () => void;
    setBackgroundMode: (mode: 'dark' | 'light') => void;
    /** Annule la dernière action */
    undo: () => void;
    /** Rétablit la dernière action annulée */
    redo: () => void;
    /** Désactive la projection active */
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
                
                // Si c'est un tracé temporaire (laser), on programme sa suppression
                if (path.isTemporary) {
                    setTimeout(() => {
                        useWhiteboardStore.getState().removePath(path.id);
                    }, 2000);
                }

                return {
                    paths: newPaths,
                    undoStack: path.isTemporary ? state.undoStack : [...state.undoStack, state.paths],
                    redoStack: [],
                    version: state.version + 1,
                    activePath: null, // Clear active trace once confirmed
                    activeDrawerId: null
                };
            }),

            finishDrawing: (path) => set((state) => {
                const newPaths = [...state.paths, path];

                if (path.isTemporary) {
                    setTimeout(() => {
                        useWhiteboardStore.getState().removePath(path.id);
                    }, 2000);
                }

                return {
                    paths: newPaths,
                    activePath: null,
                    activeDrawerId: null,
                    undoStack: path.isTemporary ? state.undoStack : [...state.undoStack, state.paths],
                    redoStack: [],
                    version: state.version + 1,
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
                paths: state.paths.filter(p => !p.isTemporary),
                currentColor: state.currentColor,
                currentWidth: state.currentWidth,
                currentTool: state.currentTool,
                projectionTarget: state.projectionTarget,
                backgroundMode: state.backgroundMode
                // NOTE: activePath, activeDrawerId, laserPointer et version sont
                // des données volatiles temps réel gérées par BroadcastChannel/IPC.
                // Les persister causerait des écritures localStorage haute fréquence
                // et des rehydratations parasites.
            })
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useWhiteboardStore = useWhiteboardStore;
}
