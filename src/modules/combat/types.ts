import type { HealthSystem } from '../session/useSessionOSStore';

/**
 * Représente un effet d'état appliqué à un combattant (ex: Brûlé, Étourdi).
 */
export interface StatusEffect {
    /** Identifiant unique de l'instance d'effet */
    id: string; 
    /** Nom de l'effet (utilisé pour les conflits et la logique) */
    name: string;
    /** Durée en rounds (0 = infini) */
    duration: number; 
    /** Icône représentative (Emoji ou nom Lucide) */
    icon: string; 
}

/**
 * Entité participant à un combat.
 * Peut être liée à un personnage joueur (PC) ou un PNJ (NPC).
 */
export interface Combatant {
    id: string;
    name: string;
    /** Valeur d'initiative pour l'ordre de passage */
    init: number;
    hp: number;
    hpMax: number;
    /** Indique si le combattant est un PJ */
    isPlayer: boolean;
    /** Faction pour l'affichage et l'IA (Ami, Ennemi, Neutre) */
    faction: 'player' | 'enemy' | 'neutral' | 'ally';
    /** ID du combattant actuellement ciblé */
    targetId?: string;
    /** Lien vers l'ID du PlayerCharacter dans Session-OS (si isPlayer: true) */
    sourcePlayerId?: string; 
    /** Lien vers l'ID de l'entité NPC/Monstre dans Session-OS (si isPlayer: false) */
    sourceEntityId?: string; 
    /** URL de l'avatar ou du jeton */
    avatar?: string;
    /** Liste des effets d'état actifs */
    statuses: StatusEffect[];
    /** Statistiques additionnelles (Mana, Santé Mentale, etc.) */
    extraStats?: Record<string, { value: number; max: number }>; 
    resistances?: string[];
    vulnerabilities?: string[];
    immunities?: string[];
    /** Système de santé spécifique (ex: D&D 5e, Savage Worlds) */
    healthSystem?: HealthSystem;
}
