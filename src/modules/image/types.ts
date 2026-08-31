export interface ImageMedia {
    id: string;
    name: string;
    path: string; // Absolute path or URL
    active: boolean; // Is it part of the projection sequence?
    sizeInfo?: string; // e.g. "1920x1080 • 2.4MB"
    folderId?: string | null; // Virtual folder ID
    isFavorite?: boolean;
}

export interface ImageFolder {
    id: string;
    name: string;
    parentId?: string | null; // For nested folders later
}

export type ProjectionTarget = string | 'hub';

export interface DisplayInfo {
    id: string;
    bounds: { x: number, y: number, width: number, height: number };
    label: string;
}

export interface ProjectedEntity {
    id: string;
    name: string;
    subtitle?: string;
    avatar?: string;
    imageUrl?: string;
    portraitUrl?: string;
    description?: string;
    lore?: string;
    type?: string;
    fields?: Record<string, string>;
}

export interface ImageBridge {
    getDisplays: () => Promise<DisplayInfo[]>;
    syncHubData: (type: 'image' | 'entity' | 'voice-level' | 'titre', data: string) => void;
    launchDisplay: (paths: string[], target: ProjectionTarget) => void;
    closeAllDisplays: () => void;
}
