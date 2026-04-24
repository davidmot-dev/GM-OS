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
    
    // Actions
    updateCharacterHP: (playerId: string, charId: string, hp: number) => void;
    updateEntityHP: (entityId: string, hp: number) => void;
    updateEntity: (entityId: string, updates: Partial<Entity>) => void;
}
