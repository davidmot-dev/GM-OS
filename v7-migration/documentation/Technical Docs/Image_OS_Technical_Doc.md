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

## 🔄 Synchronization Logic (v6.3.2)

### 1. IPC-First Protocol (Race Condition Protection)

The projection module implements an **IPC Priority** mechanism to solve race conditions between the initial window mount and real-time commands.

- **Verrou IPC (`ipcCount`)**: The display window (Projector/Hub) maintains a counter of received IPC messages. 
- **Store Decoupling**: Once the first IPC message is received, the window **ignores** any updates from the local Zustand store. This ensures that a stale or desynchronized store (typical in multi-window Electron) cannot overwrite a live projection command.
- **Projector-Ready Signal**: When a new window is opened, it broadcasts a `projector-ready` signal. the Master Store listens to this and re-transmits the current projection state via IPC to ensure immediate synchronization.

### 2. React Rendering Optimization

- **Key Management**: To avoid massive UI lags or crashes, the `key` prop of `<img>` and `<video>` tags is bound to the **Media Path** (`m-xxxx`) rather than the Base64/Blob URL. 
- **Base64 Resolver**: Media are resolved to Base64 strings in memory to bypass Electron's `file://` and `blob:` security restrictions, ensuring consistent rendering across all secondary windows.

## ⚡ Reliability & Initialization

The previous issue requiring multiple clicks for initialization has been resolved by:
1. **Source Validation**: The `onRehydrateStorage` middleware now validates projections using `media.path` consistency checks.
2. **Mount Sync**: Windows perform a one-time sync from the Store only if no IPC messages have been received yet, bridging the gap between window launch and IPC readiness.

## 🎞️ Diaporama / Slideshow Logic

The slideshow progresses through the `navigateSequence(direction)` function:

- It finds the current media index in the active list.
- It calculates the next index (with wrapping).
- It triggers a `projectSolo` for the new media, ensuring both the target monitor and the Hub mirror are updated.

## 🛡️ Safety & Reliability

- **Media Resolution**: The `useMediaUrl` hook handles ID-to-Blob resolution (via IndexedDB) and local file path formatting transparently.
- **Rehydration**: All projection windows rehydrate their stores on mount to ensure they display the correct initial state even if they were opened after the projection started.
