# Campaign Deletion Cascade Pattern (GM-OS v5)

## Overview

Deleting a campaign in GM-OS v5 triggers a global cleanup process called "Deletion Cascade". This ensures that all data linked to a specific campaign is removed or detached across multiple stores and modules, preventing orphaned references and data bloat.

## Architecture

The cascade is implemented using the **Root Store Override Pattern** in Zustand. Instead of handling deletions locally in each slice, the root store (`src/modules/session/store/index.ts`) overrides the standard `deleteCampaign` action.

### Trigger Logic

```typescript
// src/modules/session/store/index.ts

deleteCampaign: (id) => {
    const state = get();
    // 1. Identify and remove from SessionOSStore lists
    set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
        
        entities: state.entities.filter(e => e.campaignId !== id),
        sessions: state.sessions.filter(s => s.campaignId !== id),
        atlasMaps: state.atlasMaps.filter(m => m.campaignId !== id),
        wikiEntries: state.wikiEntries.filter(w => w.campaignId !== id),
        timelineEvents: state.timelineEvents.filter(t => t.campaignId !== id),
        clues: state.clues.filter(c => c.campaignId !== id),
        
        // 2. Detach Player Characters (Global entities)
        players: state.players.map(p => ({
            ...p,
            characters: p.characters.map(c => 
                c.campaignId === id ? { ...c, campaignId: null } : c
            )
        }))
    }));

    // 3. Trigger cross-domain cleanup (MediaStore)
    useMediaStore.getState().removeCampaignReference(id);
}
```

## Module Interactions

### 1. Session-OS
- **Hard Deletion**: Entities (NPCs), Sessions, Maps, Wiki Entries, and Clues are permanently filtered out from the local state and subsequently from localStorage during persistence.
- **Soft Detachment**: Player Characters (PCs) are global items. Only their `campaignId` link is severed (`null`), allowing them to be reassigned to other campaigns.

### 2. Media-OS (IndexedDB)
- **Reference Removal**: The `removeCampaignReference` call is asynchronous. It connects to IndexedDB (`gmos-media-db`) and removes the `campaignId` from the `campaignIds` array of every `MediaItem`.
- **Note**: The actual media blobs are NOT deleted unless a global **Physical Cleanup** is triggered (see `media-cleanup.md`).

## Benefits
- **Data Integrity**: No dangling pointers or broken UI tags (e.g., "Unit_C-17" badges).
- **Performance**: Keeps the session store (localStorage) lean.
- **Persistence**: Atomic updates ensure that partial deletions don't occur across page reloads.

---

*Last Updated: 2026-03-30*
