export type HealthSystem = 'hp' | 'wounds' | 'clocks' | 'custom';

export interface Entity {
    id: string;
    name: string;
    type: string;
    avatar?: string;
    imageUrl?: string;
    portraitUrl?: string;
    hp: number;
    hpMax: number;
    status: 'alive' | 'dead' | 'unconscious' | 'dying';
    roleplayingNotes?: string;
    gmSecretInfo?: string;
}

export interface PlayerCharacter extends Entity {
    level?: number;
    class?: string;
    race?: string;
}

export interface Player {
    id: string;
    name: string;
    characters: PlayerCharacter[];
}

export interface Campaign {
    id: string;
    name: string;
    activeSessionId?: string;
    notebookUrl?: string;
}

export interface GameSession {
    id: string;
    campaignId: string;
    name: string;
    date: number;
}

export interface SessionOSState {
    campaigns: Campaign[];
    activeCampaignId: string | null;
    players: Player[];
    entities: Entity[];
    customGameDrivers: any[]; // Updated to any[] for now to avoid deep type issues
    currentView: string;
    messages: any[];
    sessions: any[];
    clues: any[];
    atlasMaps: any[];
    customSheetTemplates: any[];
    activeCampaignWallpaper: string | null;
    connectedCharacters: Record<string, string>;
    isSystemSyncing: boolean;
    
    // Actions
    updateCharacterHP: (playerId: string, charId: string, hp: number) => void;
    updateEntityHP: (entityId: string, hp: number) => void;
    updateEntity: (entityId: string, updates: Partial<Entity>) => void;
    updateCampaign: (id: string, updates: Partial<Campaign>) => void;
    setCurrentView: (view: string) => void;
    getActiveDriver: () => any;
    updateCharacterNarrative: (...args: any[]) => void;
    addSessionMessage: (...args: any[]) => void;
    requestItemTransfer: (...args: any[]) => void;
    approveItemTransfer: (...args: any[]) => void;
    rejectItemTransfer: (...args: any[]) => void;
    removeInventoryItem: (...args: any[]) => void;
    setCharacterLocks: (...args: any[]) => void;
    saveMessageToJournal: (...args: any[]) => void;
}
