export interface ClientContext {
    deviceId: string;
    pseudo: string;
    playerName?: string;
    characterId?: string;      // NEW: ID of the selected character
    role: 'combat' | 'narrative' | 'player' | 'remote' | 'hub';
    status: 'active' | 'ghost' | 'disconnected';
    lastSeen: number;
}
