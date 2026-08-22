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
    /**
     * La disposition de l'**atelier** — hors séance.
     *
     * Elle porte son nom d'origine, et c'est la migration : les campagnes
     * écrites avant l'axe N n'en ont qu'une, et c'est celle-là. *Renommer ce
     * champ aurait fait repartir tout le monde d'une disposition vide, sans que
     * personne comprenne pourquoi.*
     */
    layoutConfig?: LayoutConfig;
    /**
     * La disposition de la **table** — pendant une séance ouverte. Axe N.
     *
     * *« On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa
     * table telle qu'on l'a laissée le samedi soir. »*
     *
     * Absente tant que le meneur n'a rien réglé en séance : on retombe alors sur
     * celle de l'atelier, plutôt que sur une disposition vide. **Un régime qui
     * démarre nu n'est pas un second régime, c'est une perte.**
     */
    layoutConfigPartie?: LayoutConfig;
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

    /**
     * Quand la campagne a été clôturée. C'est elle qui la range.
     *
     * **Il n'existait aucun statut de campagne** — relevé par David le
     * 2026-08-20. On pouvait achever un acte, terminer une scène, clore une
     * séance, mais jamais dire d'une campagne qu'elle est finie : elle restait
     * indéfiniment dans la bibliothèque au même rang que celle qu'on joue ce
     * soir.
     *
     * **Une date et non un booléen**, comme `Scene.termineeLe` : *quand* une
     * campagne s'est achevée est une information qu'on relit des années après,
     * et un `true` ne la porte pas.
     *
     * **Clôturer n'efface rien** — c'est la règle déjà tenue par l'acte achevé
     * et la scène terminée. La campagne reste lisible, ses fiches consultables,
     * et rouvrir est un simple geste. Ce qu'elle emporte est décrit par
     * `laTrameALaCloture` : les scènes jamais jouées deviennent annulées, celles
     * qu'on a jouées sans les clore deviennent terminées.
     */
    clotureeLe?: number;

    // Social Graph Optimization
    nodePositions?: Record<string, { x: number; y: number }>;
    isGraphLocked?: boolean;
}
