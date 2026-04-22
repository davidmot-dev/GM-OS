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
    | 'forge'
    | 'template-editor'
    | 'driver-editor'
    | 'storyboard'
    | 'deck-library'
    | 'deck-player'
    | 'rulebook'
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

    // Social Graph Optimization
    nodePositions?: Record<string, { x: number; y: number }>;
    isGraphLocked?: boolean;
}
