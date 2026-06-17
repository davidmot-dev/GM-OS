/**
 * Session-OS Store — Shared Types (Backward-Compatible Re-exports)
 *
 * ⚠️ Ce fichier est maintenu pour la compatibilité descendante.
 * Les types ont été migrés vers des fichiers granulaires dans `src/types/`.
 *
 * Migration path :
 * - Entity, HealthSystem, DamageImpact  → src/types/entity.types.ts
 * - Player, PlayerCharacter, Inventory  → src/types/player.types.ts
 * - Campaign, LayoutConfig, CurrentView → src/types/campaign.types.ts
 * - GameSession, SessionMessage...      → src/types/session.types.ts
 * - AtlasMap, WikiEntry, Clue...        → src/types/chronicle.types.ts
 * - DeckManifest, DeckSessionState      → src/types/deck.types.ts
 *
 * @module session/store/types
 * @deprecated Importer directement depuis `src/types/*.types.ts`
 */

// ─────────────────────────────────────────────
// Re-exports depuis les fichiers granulaires
// ─────────────────────────────────────────────

export type {
    DamageImpact,
    PersistenceBadge,
    HealthSystem,
    EntityRelation,
    Entity,
} from '../../../types/entity.types';

export type {
    InventoryItem,
    TransferRequest,
    LootHistoryEntry,
    PlayerCharacter,
    Player,
} from '../../../types/player.types';

export type {
    LayoutConfig,
    CurrentView,
    Campaign,
} from '../../../types/campaign.types';

export type {
    SessionChecklistItem,
    SessionModuleSnapshot,
    GameSession,
    RemoteNotification,
    HubNotification,
    SessionMessage,
    SessionFeedback,
} from '../../../types/session.types';

export type {
    AtlasEntityCategory,
    AtlasLinkedEntity,
    AtlasMap,
    TimelineEvent,
    WikiEntry,
    Clue,
} from '../../../types/chronicle.types';

export type {
    CardFormat,
    CardOrientation,
    DeckManifest,
    DeckSessionState,
} from '../../../types/deck.types';

// ─────────────────────────────────────────────
// Re-exports tiers (drivers, sheet templates)
// ─────────────────────────────────────────────

export type { SheetTemplate } from '../../../data/defaultSheetTemplates';
export type { GameDriver } from '../../../types/drivers';
