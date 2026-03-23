# Media Cleanup Service (GM-OS v5)

## Overview

The `MediaCleanupService` is a core utility designed to manage the disk footprint of the application by identifying and removing orphaned media files from IndexedDB.

## Architecture

The service is implemented as a **Singleton** to ensure a single cleanup process runs across the application.

### Location

`src/services/MediaCleanupService.ts`

### Key Components

- **`performCleanup()`** : The main orchestrator. It:
  1. Initializes `gmos-media-db`.
  2. Scans multiple stores for active references.
  3. Deletes any media entry in IndexedDB that is NOT in the reference set.

## Reference Collection Logic

The service scans the following stores to find media IDs (starting with `m-`) :

- **NPC Store** : Current entity and saved entities (avatars).
- **Image Store** : Media list, projections (hub).
- **SessionOS Store** : Campaigns (wallpapers), entities, players (portraits, tokens), atlas maps, wiki entries.
- **Combat Store** : Active combatants (avatars).
- **Sound Store** : Atmosphere pads (file paths).
- **Music Store** : Playlists and individual pads (URLs).
- **Ambient Store** : Presets and active tracks (URLs).

## Trigger Mechanism

1. **Automatic** : Runs once 5 seconds after application startup (via `App.tsx`) to avoid initial performance spikes.
2. **Manual** : Triggered from the **Global Settings Modal** under the **System** tab.

## Data Schema

Successfully deleted items are logged with :

- `deletedCount` : Number of records removed.
- `savedBytes` : Total size of the deleted blobs in bytes.

---

*Last Updated: 2026-03-24*
