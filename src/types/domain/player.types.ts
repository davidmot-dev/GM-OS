import type { PlayerCharacter } from './entity.types';

/**
 * Types liés aux joueurs physiques (comptes utilisateurs).
 */

export interface Player {
    id: string;
    realName: string;
    email?: string;
    avatarUrl: string;
    isOnline: boolean;
    characters: PlayerCharacter[];
}
