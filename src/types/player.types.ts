/**
 * GM-OS v6 — Player Domain Types
 *
 * Regroupe les interfaces liées aux joueurs et à leurs personnages,
 * y compris l'inventaire et les transferts d'objets.
 *
 * @module types/player
 */

import type { HealthSystem, EntityRelation } from './entity.types';

// ─────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────

export interface InventoryItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'consumable' | 'currency' | 'other' | string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string;
    weight: number;
    quantity: number;
    description: string;
    value?: number;
    properties: Record<string, string | number | boolean | object | null>;
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

export interface LootHistoryEntry {
    id: string;
    itemId: string;
    itemName: string;
    itemType: string;
    rarity: string;
    quantity: number;
    value: number;
    recipientId: string;
    recipientName: string;
    recipientPortrait?: string;
    timestamp: number;
}

// ─────────────────────────────────────────────
// Player Character (PJ)
// ─────────────────────────────────────────────

export interface PlayerCharacter {
    id: string;
    name: string;
    /**
     * **Facultatif depuis le 2026-08-15** : « Classe / Race » est une notion de
     * D&D. Alien parle de Carrière, Dune de Maison — et ces libellés vivent
     * dans les champs de la fiche, pas dans un champ imposé à tous les jeux.
     * L'écran de création ne le demande plus ; les personnages qui le portent
     * le gardent.
     */
    classRace?: string;
    portraitUrl: string;
    tokenUrl?: string;
    /**
     * Points de vie — **le détail d'un seul modèle de santé, pas la santé.**
     *
     * **La distinction qui débloque tout, posée par David le 2026-08-15 :**
     * *« normalement tout jeu a un mécanisme de Santé »*. C'est vrai — mais ce
     * mécanisme est `healthSystem`, qui en connaît cinq formes. Les points de
     * vie n'en sont qu'une, celle du modèle `hp`. Les tenir pour obligatoires
     * revenait à imposer D&D à tous les jeux.
     *
     * Facultatifs depuis lors, et **`healthSystem` fait autorité** : il est
     * posé à la création, d'après le modèle du pilote, ou `hp` à défaut — tout
     * personnage a donc toujours une santé, même quand ces deux champs sont
     * vides.
     *
     * Ne les lisez pas directement : `SanteDuCombattant` répond à « comment va
     * ce personnage » et rend `null` là où il n'y a rien à dire.
     */
    hp?: number;
    maxHp?: number;
    campaignId: string | null;
    /**
     * Le **jeu** pour lequel ce personnage a été créé — l'identifiant d'un pilote.
     *
     * **Pourquoi il manquait, et ce que son absence coûtait.** L'écran de
     * création demandait un « Système de Jeu » qui listait en réalité des
     * *gabarits de fiche* ; le personnage ne retenait donc que `templateId`, et
     * rien ne disait à quel jeu il appartenait. Impossible, dès lors,
     * d'empêcher un personnage de Dune de rejoindre une campagne Blade Runner —
     * ce que l'écran faisait d'ailleurs **tout seul**, en le rattachant
     * d'office à la campagne ouverte.
     *
     * Facultatif : les personnages créés avant le 2026-08-15 ne l'ont pas, et
     * ils continuent de fonctionner. *On ne fait pas payer une nouveauté à
     * l'existant.*
     */
    systemId?: string;
    /** Le gabarit de fiche. Il découle du pilote (`driver.templateId`). */
    templateId: string;
    /**
     * L'identifiant de sa fiche HTML dans la bibliothèque du moteur.
     *
     * Absent tant que le PJ n'a pas été relié à une fiche — et c'est le cas de
     * l'immense majorité. Le moteur **garde sa bibliothèque** et GM-OS s'y
     * branche (tranché le 2026-08-28) : ce champ est le seul lien entre les
     * deux, et il pointe vers une base que GM-OS ne détient pas.
     */
    ficheId?: string;
    sheetData: Record<string, unknown>;
    description?: string;
    gmNotes?: string;
    playerNotes?: string;
    linkedDocumentIds?: string[];
    inventory?: string;
    inventoryItems?: InventoryItem[];
    healthSystem?: HealthSystem;
    relations?: EntityRelation[];
    faction?: string;
    hubOptions?: {
        showHP: boolean;
        showMP: boolean;
        showAP: boolean;
        showInventory: boolean;
        showRelations: boolean;
    };
}

// ─────────────────────────────────────────────
// Player (Joueur physique)
// ─────────────────────────────────────────────

export interface Player {
    id: string;
    realName: string;
    email?: string;
    avatarUrl: string;
    isOnline: boolean;
    characters: PlayerCharacter[];
}
