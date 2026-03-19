# 🛠️ Technical Doc: Image OS

The **Image OS** module manages visual projections across multiple displays (Physical Monitors and the Player Hub). It uses a hybrid architecture combining a global Zustand store with Electron IPC for real-time window synchronization.

## 🏗️ Architecture

### 1. The Bridge (`appBridge.image`)

The module communicates through the `ImageBridge` interface:

- `getDisplays()`: Detects physical monitors.
- `launchDisplay(paths, target)`: Opens/Updates a projector window on a specific monitor.
- `syncHubData(type, data)`: Sends real-time signals (image paths, NPC entities, voice levels) to the Player Hub.
- `closeAllDisplays()`: Emergency shutdown of all projector windows.

### 2. State Management (`useImageStore`)

- **Projections**: A map of `{ targetId: mediaId | path }` representing what is currently displayed on each target.
- **Sequence/Diaporama**: Manages a list of "active" media for sequential projection.
- **Persistence**: The state is persisted in `localStorage` (`gmos-image-storage`) to allow recovery after a restart.

## 🔄 Synchronization Logic

### Cross-Window Sync (Zustand + Storage)

Since the **Player Hub** and **Projector Views** are separate Electron windows, they subscribe to `localStorage` events to rehydrate their local stores when the GM makes a change in the Dashboard.

### IPC Projection Sync

For immediate visual updates (like a Blackout), the module uses IPC messages:

1. **GM clicks Blackout**: `useImageStore` updates the `projections` state AND calls `syncHubData('image', '')`.
2. **Main Process**: Broadcasts `image:sync-hub-data` to all relevant windows.
3. **Player Hub**: Receives the signal and sets `liveImagePath` to `null`.
4. **useMediaUrl Hook**: Upon receiving a `null` or empty source, it clears the `resolvedUrl`, resulting in an instant black screen.

## 🎞️ Diaporama / Slideshow Logic

The slideshow progresses through the `navigateSequence(direction)` function:

- It finds the current media index in the active list.
- It calculates the next index (with wrapping).
- It triggers a `projectSolo` for the new media, ensuring both the target monitor and the Hub mirror are updated.

## 🛡️ Safety & Reliability

- **Media Resolution**: The `useMediaUrl` hook handles ID-to-Blob resolution (via IndexedDB) and local file path formatting transparently.
- **Rehydration**: All projection windows rehydrate their stores on mount to ensure they display the correct initial state even if they were opened after the projection started.
