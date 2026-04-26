export interface ClientContext {
    deviceId: string;
    pseudo: string;
    playerName?: string;
    role: 'combat' | 'narrative' | 'player' | 'remote' | 'hub';
    status: 'active' | 'ghost' | 'disconnected';
    lastSeen: number;
}
