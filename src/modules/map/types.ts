export interface MapToken {
    id: string; // Unique ID for the token on the map
    name: string; // Nom affiché ou identifiant du token
    avatar: string;
    x: number;
    y: number;
    size: number; // Taille de base, ex: 1 pour une case, 2 pour un grand monstre
    linkedCombatantId?: string; // Lien avec Combat OS
    linkedSessionPlayerId?: string; // Lien direct avec un joueur Session OS
    isVisible?: boolean; // Si faux, le token est caché pour les joueurs (projection)
}

export interface MapPing {
    id: string;
    x: number;
    y: number;
    color: string;
    createdAt: number;
}

export type MagicShape = 'circle' | 'rect' | 'line' | 'cone';
export type MagicStyle = 'fire' | 'ice' | 'acid' | 'electric' | 'poison' | 'arcane' | 'darkness';

export interface MagicEffect {
    id: string;
    type: MagicShape;
    style: MagicStyle;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
}

export interface DangerZonePreset {
    id: string;
    name: string;
    color: string;
    radius?: number;
    hueSceneId?: string;
    audioAtmosphereId?: string;
    audioPadId?: string;
}

export interface DangerZone {
    id: string;
    presetId?: string; // Lien optionnel vers un modèle
    name: string;
    type: 'circle' | 'rect' | 'line' | 'cone';
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number;
    rotation: number; // En degrés
    color: string;
    hueSceneId?: string;
    audioAtmosphereId?: string;
    audioPadId?: string;
    activeTokenIds: string[]; // Tokens actuellement à l'intérieur
}

export type FogMode = 'reveal' | 'hide';
export type MapTool = 'brush' | 'rect' | 'circle' | 'move_token' | 'ping' | 'magic' | 'danger';
export type WeatherType = 'none' | 'rain' | 'snow' | 'smoke';
