/**
 * Session-OS Store — Forge Slice
 *
 * Gère le moteur de règles, les templates de fiches et les drivers IA.
 * Encapsule la logique "Shadow Driver" pour garantir que chaque template
 * dispose d'un driver IA personnalisable.
 *
 * @module session/store/forgeSlice
 */

import type { StateCreator } from 'zustand';
import { DEFAULT_SHEET_TEMPLATES, type SheetTemplate } from '../../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import type { GameDriver } from '../../../types/drivers';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface ForgeSliceState {
    customSheetTemplates: SheetTemplate[];
    customGameDrivers: GameDriver[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface ForgeSliceActions {
    /**
     * Ajoute un modèle de fiche et **rend l'identifiant qu'il lui a donné**.
     *
     * **Pourquoi ce retour existe, relevé le 2026-08-14 en relisant l'état
     * persisté.** Cette action impose son propre `tpl-${Date.now()}` — c'est
     * voulu, la duplication d'un modèle en dépend. Mais la Forge fabriquait de
     * son côté un `custom-template-${Date.now()}`, le posait dans
     * `driver.templateId`, puis appelait cette action : le pilote gardait donc
     * une référence vers un identifiant **qui n'a jamais existé**.
     *
     * Le pilote « Within » en porte la trace, et son vrai modèle traînait sans
     * propriétaire. Ce que ça coûte : `AddEntityForm` donne `driver.templateId`
     * à chaque nouveau personnage et `CombatCard` cherche ensuite le modèle par
     * cet identifiant. Introuvable — donc **pas de fiche**, sans une erreur.
     *
     * Rendre l'identifiant attribué coûte un mot et supprime la classe entière
     * du défaut : l'appelant ne peut plus supposer, il sait.
     */
    addSheetTemplate: (template: Omit<SheetTemplate, 'id' | 'isBuiltin'>) => string;
    updateSheetTemplate: (id: string, updates: Partial<SheetTemplate>) => void;
    deleteSheetTemplate: (id: string) => void;

    // Game Drivers
    saveGameDriver: (driver: GameDriver) => void;
    updateGameDriver: (id: string, updates: Partial<GameDriver>) => void;
    deleteGameDriver: (id: string) => void;

    // Selectors (pures fonctions dépendant de l'état)
    getGameDriver: (id: string) => GameDriver | null;
    getOrCreateDriverForTemplate: (templateId: string) => GameDriver;
    getActiveDriver: () => GameDriver | null;
}

export type ForgeSlice = ForgeSliceState & ForgeSliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

export const createForgeSlice: StateCreator<ForgeSlice, [], [], ForgeSlice> = (set, get) => ({
    // Initial State
    customSheetTemplates: [],
    customGameDrivers: [],

    // Sheet Template Actions
    addSheetTemplate: (template) => {
        const id = `tpl-${Date.now()}`;
        const newTemplate: SheetTemplate = { ...template, id, isBuiltin: false };
        set((state) => ({ customSheetTemplates: [...state.customSheetTemplates, newTemplate] }));
        return id;
    },

    updateSheetTemplate: (id, updates) =>
        set((state) => ({
            customSheetTemplates: state.customSheetTemplates.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            ),
        })),

    deleteSheetTemplate: (id) =>
        set((state) => ({
            customSheetTemplates: state.customSheetTemplates.filter((t) => t.id !== id),
        })),

    // Game Driver Actions
    saveGameDriver: (driver) =>
        set((state) => {
            const exists = state.customGameDrivers.some((d) => d.id === driver.id);
            return {
                customGameDrivers: exists
                    ? state.customGameDrivers.map((d) => (d.id === driver.id ? driver : d))
                    : [...state.customGameDrivers, driver],
            };
        }),

    updateGameDriver: (id, updates) =>
        set((state) => ({
            customGameDrivers: state.customGameDrivers.map((d) =>
                d.id === id ? { ...d, ...updates } : d
            ),
        })),

    deleteGameDriver: (id) =>
        set((state) => ({
            customGameDrivers: state.customGameDrivers.filter((d) => d.id !== id),
        })),

    // Selectors
    getGameDriver: (id) => {
        const { customGameDrivers } = get();
        return (
            customGameDrivers.find((d) => d.id === id) ??
            DEFAULT_GAME_DRIVERS.find((d) => d.id === id) ??
            null
        );
    },

    getOrCreateDriverForTemplate: (templateId) => {
        const { customGameDrivers, saveGameDriver } = get();
        const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...get().customSheetTemplates];
        const template = allTemplates.find((t) => t.id === templateId);

        // Already have a custom driver for this template?
        const existing = customGameDrivers.find((d) => d.id === templateId);
        if (existing) return existing;

        // Create a custom override from the builtin driver
        const builtinDriver = DEFAULT_GAME_DRIVERS.find((d) => d.id === templateId);
        const newDriver: GameDriver = builtinDriver
            ? { ...builtinDriver }
            : {
                  id: templateId,
                  name: template?.name ?? templateId,
                  author: 'system',
                  version: '1.0',
                  description: '',
                  emoji: '🎮',
                  templateId: templateId,
                  dice: {
                      engine: 'standard',
                      defaultDice: '1d20',
                      logic: 'sum',
                      successThreshold: 6
                  },
                  combat: {
                      statsToTrack: [],
                      initiativeFormula: 'dex',
                      initiativeSort: 'desc',
                      defaultHealthType: 'hp'
                  },
                  aiInstructions: '',
              };

        saveGameDriver(newDriver);
        return newDriver;
    },

    getActiveDriver: () => null, // Résolu dans le root store (dépend de activeCampaignId)
});
