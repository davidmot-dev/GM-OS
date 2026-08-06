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
