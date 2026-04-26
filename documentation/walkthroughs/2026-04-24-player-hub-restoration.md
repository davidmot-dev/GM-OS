# Walkthrough - Restoration of Player Hub Functional Core (v7-Migration)

## Objective
Finalize the restoration of core Player Hub modules in the GM-OS v7 Tauri migration to restore parity with v6 and resolve synchronization issues.

## Key Changes

### 1. Functional Store Restoration
Restored the full suite of zustand stores in `v7-migration/src/store` and `modules/` to ensure state parity and persistence:
- `useSessionStore.ts`: Global settings (theme, language).
- `useCombatStore.ts`: Encounter management with `broadcastSync`.
- `useJournalStore.ts`: Session event logging.
- `useImageStore.ts`: Media library and projection targets.
- `useFavoriteStore.ts`: NPC/Item/Lore favorites management.
- `useSessionOSStore.ts`: Campaign, player, and entity metadata.
- `useDiceStore.ts`: Dice results and 3D trigger logic.
- `useClientStore.ts`: Device identification.
- `useSyncStore.ts`: Volatile state (voice levels).

### 2. Business Logic Restoration
- `CombatRules.ts`: Restored damage, initiative, and status conflict logic.
- `ImageService.ts`: Re-implemented projection orchestration for Tauri bridge compatibility.

### 3. UI Component Restoration
- `PlayerHub.tsx`: Restored as the main assembly point for the projection window.
- `HubClockWidgets.tsx`: Fixed imports and restored missing `ClockVisualizer` and `NarrativeClock` sub-components.
- `HubCombatTracker.tsx`: Corrected type imports for modular compatibility.

### 4. Synchronization Architecture
- Validated `useHubSync.ts` logic utilizing `BroadcastChannel` for low-latency map updates and the "Authoritative Master" model for global stores.

## Verification Results
- All core stores are rehydrated on Player Hub boot.
- Combatant statuses and HP are synchronized via IPC/Broadcast.
- Projection targets correctly distinguish between 'hub' and external displays.
