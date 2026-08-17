/**
 * GM-OS v6 — Campaign Domain Types
 *
 * Regroupe les interfaces liées aux campagnes et à la configuration de layout.
 *
 * @module types/campaign
 */

import type { ModuleID, ThemeID } from '../store/useSessionStore';

// ─────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────

export interface LayoutConfig {
    activeModule: ModuleID;
    isAIPanelOpen: boolean;
    isTacticalPanelOpen: boolean;
    theme: ThemeID;
    themeColor: string;
}

export type CurrentView =
    | 'cockpit'
    | 'campaign-details'
    | 'campaign-editor'
    | 'npc-gallery'
    | 'social-graph'
    | 'world-atlas'
    | 'library'
    | 'players'
    | 'templates'
    | 'session-prep'
    | 'session-focus'
    | 'timeline-wiki'
    | 'trame'
    | 'forge'
    | 'template-editor'
    | 'driver-editor'
    | 'storyboard'
    | 'deck-library'
    | 'deck-player'
    | 'rulebook'
    | 'rule-workshop'
    | 'campaign-form';


// ─────────────────────────────────────────────
// Campaign
// ─────────────────────────────────────────────

export interface Campaign {
    id: string;
    name: string;
    system: string;
    description?: string;
    synopsis?: string;
    notes?: string;
    gmNotes?: string;
    activeSessionId?: string;
    wallpaperUrl?: string;
    activeLocationIds: string[];
    ragPath?: string;
    aiPersonas?: Record<string, string>;
    layoutConfig?: LayoutConfig;
    notebookUrl?: string;
    systemPath?: string;
    campaignPath?: string;
    obsidianPath?: string;
    /**
     * La langue dans laquelle la Forge écrit cette campagne — un code, `fr`, `en`…
     *
     * **Réglage par campagne, décidé par David le 2026-08-17** : on peut forger
     * depuis un livre anglais et vouloir un résultat en français, ou garder une
     * campagne dans sa langue d'origine pendant que le reste passe au français.
     * Le corpus du système porte le sien de son côté ; les deux ne se croisent
     * jamais, chaque forge lisant ses propres fiches.
     *
     * Absent : la langue de l'interface sert de repli. *On ne fait pas payer une
     * nouveauté à l'existant.*
     */
    langueDeForge?: string;

    // Social Graph Optimization
    nodePositions?: Record<string, { x: number; y: number }>;
    isGraphLocked?: boolean;
}
