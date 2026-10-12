import { create } from 'zustand';

/**
 * **L'écran « Scène en cours » : ouvert ou non, et sur quelle scène**
 * (2026-10-12, L2).
 *
 * Non persisté, et c'est voulu : rouvrir GM-OS sur un écran plein, sans
 * qu'aucune scène vienne de commencer, serait un écran qu'on n'a pas demandé.
 */
interface EcranDeSceneState {
    ouvert: boolean;
    /** La scène affichée ; `null` : la première scène en cours. */
    sceneId: string | null;
    ouvrir: (sceneId?: string | null) => void;
    fermer: () => void;
}

export const useEcranDeSceneStore = create<EcranDeSceneState>()((set) => ({
    ouvert: false,
    sceneId: null,
    ouvrir: (sceneId) => set((etat) => ({ ouvert: true, sceneId: sceneId ?? etat.sceneId })),
    fermer: () => set({ ouvert: false }),
}));
