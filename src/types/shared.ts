import type { InventoryItem } from './domain/item.types';

/**
 * Types partagés par l'infrastructure (Hub, Remote, Bridge).
 */

export interface ClientContext {
    deviceId: string;
    pseudo: string;
    playerName?: string;
    characterId?: string;
    role: 'combat' | 'narrative' | 'player' | 'remote' | 'hub';
    status: 'active' | 'ghost' | 'disconnected';
    lastSeen: number;
}

export interface RemoteNotification {
    id: string;
    type: 'vitals_update' | 'action' | 'alert';
    characterId: string;
    characterName: string;
    playerName: string;
    message: string;
    timestamp: number;
    isRead: boolean;
}

export interface HubNotification {
    id: string;
    type: 'message' | 'alert' | 'system';
    title: string;
    content: string;
    fromName: string;
    timestamp: number;
}

export interface SessionMessage {
    id: string;
    fromId: string;       // ID du perso ou 'GM'
    fromName: string;
    toId: string;         // ID du perso ou 'GM'
    toName: string;
    content: string;
    timestamp: number;
    isRead: boolean;
}

export interface TransferRequest {
    id: string;
    fromCharacterId: string;
    fromCharacterName: string;
    toCharacterId: string;
    toCharacterName: string;
    item: InventoryItem;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
}
