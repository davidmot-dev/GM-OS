import {
    useWhiteboardStore,
    type Point,
    type DrawingPath,
    type WhiteboardTool,
} from '../../whiteboard/useWhiteboardStore';
import type { ActionRegistry } from './types';

const addPath = (payload: any) => {
    useWhiteboardStore.getState().addPath(payload as DrawingPath);
};

export const whiteboardActions: ActionRegistry = {
    'whiteboard:set-laser-pointer': (payload) => {
        useWhiteboardStore.getState().setLaserPointer(payload as Point);
    },
    'whiteboard:set-active-path': (payload) => {
        const { path, drawerId } = payload as { path: DrawingPath; drawerId: string };
        useWhiteboardStore.getState().setActivePath(path, drawerId);
    },
    'whiteboard:draw': addPath,
    'whiteboard:add-path': addPath,
    'whiteboard:set-tool': (payload) => {
        useWhiteboardStore.getState().setTool(payload as WhiteboardTool);
    },
    'whiteboard:set-color': (payload) => {
        useWhiteboardStore.getState().setColor(payload as string);
    },
    'whiteboard:set-width': (payload) => {
        useWhiteboardStore.getState().setWidth(payload as number);
    },
    /*
      **Ce handler manquait** (2026-09-05). `whiteboard:set-background` était
      déclaré dans `RemoteActionType` depuis toujours, sans émetteur sur la
      tablette **et sans destinataire ici** : une action morte des deux côtés.
      *Un type d'action qui ne mène nulle part se lit comme une fonction qui
      existe.*
    */
    'whiteboard:set-background': (payload) => {
        useWhiteboardStore.getState().setBackgroundMode(payload as 'dark' | 'light');
    },
    'whiteboard:clear': () => {
        useWhiteboardStore.getState().clearBoard();
    },
    'whiteboard:undo': () => {
        useWhiteboardStore.getState().undo();
    },
    'whiteboard:redo': () => {
        useWhiteboardStore.getState().redo();
    },
};
