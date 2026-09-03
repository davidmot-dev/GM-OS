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
    /**
     * Points de vie — **facultatifs, parce que tous les jeux n'en ont pas.**
     *
     * Chez Dune, « il n'existe aucune jauge numérique de santé ou de fatigue sur
     * la feuille de personnage » : vaincre un personnage est une tâche étendue.
     * Tant que ces champs étaient obligatoires, un tel combattant naissait avec
     * des PV inventés — et un 0 ressemble à un mourant quand il ne veut dire que
     * « ce jeu ne compte pas comme ça ».
     *
     * L'autorité est `healthSystem` quand il est présent. `hp` reste pour les
     * systèmes qui en ont, et son absence est une information : elle se lit
     * « pas de jauge », jamais « jauge à zéro ».
     */
    hp?: number;
    hpMax?: number;
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
    /** Notes de roleplay de l'entité */
    roleplayingNotes?: string;
    /** Informations secrètes du MJ */
    gmSecretInfo?: string;
    /**
     * D'ou vient un adversaire fabrique par l'atelier.
     *
     * **Porte par le combattant, et c'est le point.** L'archetype et le rang
     * sont connus a la seconde ou on le fabrique, et perdus des qu'on ferme
     * l'atelier. Sans eux, le ranger au bestiaire depuis sa fiche obligerait a
     * les redemander — ou a inventer « quelconque / pietaille » pour un boss.
     * *Une information qu'on possede au moment ou on la produit ne se redemande
     * pas plus tard : elle voyage.*
     *
     * Absente pour tout combattant ajoute autrement, et c'est une information :
     * elle se lit « celui-la n'a pas ete fabrique ».
     */
    origineFabriquee?: import('./logic/promotionDuCombattant').OrigineFabriquee;
    /** Statistiques additionnelles (Mana, Santé Mentale, etc.) */
    extraStats?: Record<string, { value: number; max: number }>; 
    resistances?: string[];
    vulnerabilities?: string[];
    immunities?: string[];
    /** Système de santé spécifique (ex: D&D 5e, Savage Worlds) */
    healthSystem?: HealthSystem;
    /** Données de fiche locales (force, santé, sang-froid, etc.) */
    sheetData?: Record<string, string | number | boolean>;
}
