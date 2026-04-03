import { type DrawingPath, type Point, type WhiteboardTool } from '../../whiteboard/useWhiteboardStore';
export type { DrawingPath, Point, WhiteboardTool };

export type HealthLevel = 'SAIN' | 'BLESSÉ' | 'MORTEL' | 'FATAL';

export type HealthSystemData = 
    { type: 'wounds', data: { currentLevel: HealthLevel } } |
    { type: 'clock', data: { segments: number, maxSegments: number } } |
    { type: 'boxes', data: { boxes: { filled: boolean }[] } } |
    { type: 'anatomy', data: { parts: Record<string, { status: string }> } };

export interface RemoteCombatant {
    id: string;
    name: string;
    hp: number;
    hpMax: number;
    init: number;
    isPlayer: boolean;
    healthSystem?: HealthSystemData;
}

export interface RemoteSound {
    id: string;
    title: string;
    active: boolean;
}

export interface RemoteMoment {
    id: string;
    name: string;
}

export interface RemoteUniversalPad {
    id: string;
    type: 'music' | 'sound' | 'image' | 'ambient';
    label: string;
    sublabel?: string;
    color?: string;
    imageUrl?: string;
    isActive?: boolean;
}

export interface RemoteSyncData {
    sounds: RemoteSound[];
    moments: RemoteMoment[];
    masterVolume: number;
    combat: {
        combatants: RemoteCombatant[];
        currentTurnIdx: number;
        round: number;
    };
    notes: { 
        public: string; 
        private: string; 
    };
    whiteboard: {
        paths: DrawingPath[];
        activePath: DrawingPath | null;
        laserPointer: Point | null;
        backgroundMode: 'dark' | 'light';
        currentTool: WhiteboardTool;
        currentColor: string;
        currentWidth: number;
    };
    universalPads: RemoteUniversalPad[];
}

export type RemoteActionType = 
    | 'remote:register' 
    | 'remote:pad:trigger' 
    | 'remote:dice:roll' 
    | 'remote:dice:clear'
    | 'remote:sound:trigger' 
    | 'remote:sound:volume' 
    | 'remote:sound:stop-all'
    | 'remote:combat:next' 
    | 'remote:combat:hp' 
    | 'remote:story:trigger'
    | 'whiteboard:add-path'
    | 'whiteboard:set-active-path'
    | 'whiteboard:set-laser-pointer'
    | 'whiteboard:clear'
    | 'whiteboard:undo'
    | 'whiteboard:redo'
    | 'whiteboard:set-background'
    | 'whiteboard:set-tool'
    | 'whiteboard:set-color'
    | 'whiteboard:set-width';

export interface RemoteAction {
    type: RemoteActionType;
    payload: unknown;
}
