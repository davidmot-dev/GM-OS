/**
 * Session-OS Store — Bridge File (Compatibility Layer)
 *
 * Ce fichier est un pont de compatibilité descendante.
 * Il ré-exporte le store et tous les types depuis la nouvelle
 * architecture modulaire (store/index.ts).
 *
 * ✅ TOUS les imports existants dans le projet continuent de fonctionner :
 *    import { useSessionOSStore } from './useSessionOSStore'
 *    import type { Campaign } from './useSessionOSStore'
 *
 * ⚙️ Pour ajouter une fonctionnalité, modifiez les slices dans store/
 *    et non ce fichier.
 *
 * @see src/modules/session/store/index.ts — Assembleur principal
 * @see src/modules/session/store/types.ts — Interfaces de domaine
 */

// ─────────────────────────────────────────────
// Store principal (ré-export)
// ─────────────────────────────────────────────

export { useSessionOSStore } from './store/index';
export type { SessionOSStore as SessionOSState } from './store/index';

// ─────────────────────────────────────────────
// Types de domaine (ré-exports pour compatibilité)
// ─────────────────────────────────────────────

export type {
    // UI
    CurrentView,
    LayoutConfig,

    // Campaign
    Campaign,

    // Session
    GameSession,
    SessionChecklistItem,
    SessionModuleSnapshot,

    // Entity
    Entity,
    Player,
    PlayerCharacter,
    HealthSystem,
    EntityRelation,
    PersistenceBadge,
    DamageImpact,

    // Atlas
    AtlasMap,
    AtlasLinkedEntity,
    AtlasEntityCategory,

    // Chronicle
    WikiEntry,
    TimelineEvent,

    // Forge
    SheetTemplate,
    GameDriver,
} from './store/types';

// ─────────────────────────────────────────────
// Window bridge (cross-store access)
// ─────────────────────────────────────────────

import { useSessionOSStore } from './store/index';

if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useSessionOSStore = useSessionOSStore;
}
