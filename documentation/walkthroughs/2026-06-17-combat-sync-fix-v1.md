# Walkthrough - Combat-OS & Player Hub Sync Fix

We have successfully resolved the synchronization issues between the GM's Combat-OS dashboard and the Player Hub / Projector screens.

## Changes Made

### 1. Electron Main Process
* **Modified** [main.ts](file:///c:/Projet_David/GM-OS-v5/electron/main.ts): Added an IPC listener for `remote:broadcast-sync` to forward sync payloads to the local `hubWindow` and `projectorWindows` instances. This ensures local windows loaded via the `file://` protocol receive all synchronization data even when not connected to WebSockets.

### 2. Workspace Sync (Nexus Synchronizer)
* **Modified** [useNexusSynchronizer.ts](file:///c:/Projet_David/GM-OS-v5/src/modules/remote/hooks/useNexusSynchronizer.ts):
  * Included `isCombatProjected` in the `fullState.combat` payload in `handleSync()`.
  * Replaced the `useCombatStore` subscription callback to invoke `handleSync()` directly on any store change.
  * This guarantees that all combat updates (including turn changes, round updates, and visibility toggles) are properly sanitized and media URLs resolved before sending them to player/hub clients, and removes the conditional `syncFast('combat')` path which was bypassing sanitization and leaking GM secret information (like roleplaying notes and GM secrets) to players.

### 3. Local Cross-Window Synchronization (BroadcastChannel)
* **Modified** [CrossWindowEventService.ts](file:///c:/Projet_David/GM-OS-v5/src/services/CrossWindowEventService.ts):
  * Added active subscriptions for `useCombatStore` and `useClockStore` in `setupSubscribers()`.
  * When changes occur in these stores, they are now broadcasted via the BroadcastChannel to update other local Electron windows in real time.

---

## Verification & Testing

### 1. Build & Type Safety Validation
* Ran the validation script `powershell -File ./scripts/validate.ps1`.
* All TypeScript checks passed, production build succeeded cleanly, and unit tests completed with zero errors (all 220 tests passed).
