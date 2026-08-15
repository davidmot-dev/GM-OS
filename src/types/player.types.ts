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
     * **Encore obligatoires, et c'est un reste à traiter.**
     *
     * L'écran de création ne les demande plus depuis le 2026-08-15 : la valeur
     * vient de `combat.santeDeDepart`, lue sur la fiche. Mais les rendre
     * facultatifs dans ce type casse **six écrans et trente lectures**, dont
     * chacune devrait décider quoi afficher en l'absence de jauge. Un `?? 0`
     * mécanique y recréerait le défaut que tout ce travail combat : *l'absence
     * n'est pas un zéro, et un mourant affiché pour tout le monde ne se
     * signale pas.*
     *
     * À reprendre écran par écran, avec `SanteDuCombattant` qui sait déjà
     * répondre `null`.
     */
    hp: number;
    maxHp: number;
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
