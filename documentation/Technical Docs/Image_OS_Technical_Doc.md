# 🛠️ Technical Doc: Image OS

The **Image OS** module manages visual projections across multiple displays (Physical Monitors and the Player Hub). It uses a hybrid architecture combining a global Zustand store with Electron IPC for real-time window synchronization.

## 🏗️ Architecture

### 1. The Bridge (`appBridge.image`)

The module communicates through the `ImageBridge` interface:

- `getDisplays()`: Detects physical monitors.
- `launchDisplay(paths, target)`: Opens/Updates a projector window on a specific monitor.
- `syncHubData(type, data)`: Sends real-time signals to the Player Hub **and every projector window**.
  Types: `image`, `entity`, `voice-level`, `titre`, and — since 2026-09-05 — `son-video`,
  which carries the gain a projected video must hold (see *Video projection* below).
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

## 🎬 Video projection (2026-09-05)

### What was already there, and what blocked it

`ProjectorView` has long sniffed the loaded blob's MIME type and rendered a `<video>` instead of an
`<img>`. Four things kept that path unreachable:

1. `ImageDashboard` passed `allowedTypes={['image']}` to the media browser;
2. `ImageMedia` carried no `type`, so the library could not know what a pad held;
3. `ImagePad` painted its thumbnail with `background-image`, which cannot show a video;
4. the `<video>` element was `muted` in the markup.

`ImageMedia.type` is **optional on purpose**: pads created before this date fall back to
`estUneVideo(name)` from `src/stores/typesDeMedia.ts` — the same extension table the Media Hub uses
to classify files on import. *One table, two readers; never two tables.*

### ⛔ Audio: an order, not a patch cable

A projected video plays in the **projector `BrowserWindow`**. The audio bus (`AudioContext`, master
gain, ducking, `setSinkId`) lives in the **GM window**. There is no path between them: an element in
one renderer cannot be connected to another renderer's audio graph.

So the GM computes the level and **sends** it:

```
gain = volumeGeneral x (isFocusMode ? focusDuckingRatio : 1)
              x (isDucking ? duckingRange : 1)
              x volumeVideo
```

- `src/modules/image/logic/gainDeLaVideo.ts` — the pure calculation. Every factor is clamped
  independently, and an absent setting reads as *"change nothing"*, never as *"mute"*.
- `src/modules/image/useSonDeLaVideoProjetee.ts` — the emitter. Mounted in `Shell`, **never in a
  module**: the GM lowers the volume and toggles Focus from any screen.
- `ProjectorView` receives `son-video` and applies it to the element imperatively (React has no
  `volume` prop), re-applying on every source change since a fresh `<video>` is born at full volume.

⭐ **It re-emits on every projection change**, not only when the level changes. A projector window
that has just opened has received nothing and would stay at full volume forever.

⚠️ **What this imitation does not reproduce**: the sound leaves through the projector window's own
output device (the HDMI display), not the speaker chosen in Music-OS. `setSinkId` applies to a
context, and there is none here.

### YouTube (`__youtube__<id>`)

A YouTube link stays a Web-OS bookmark — nothing to back up, nothing for Nexus — so it never enters
the Image-OS library. It reaches the projector as a marker string, following the convention already
used by `__tactical_map__` and `__whiteboard__` rather than opening a second channel.

- `src/modules/web/youtube.ts` — recognition (watch / youtu.be / embed / shorts, start time), the
  `youtube-nocookie` embed URL, and the marker round-trip.
- `ImageService.projectMedia` short-circuits any `__`-prefixed path **before** `resolveToSendableUrl`:
  a marker names *what* to show, not *where* to find it.

⚠️ Its audio is outside the mix entirely, and no GM-OS setting can reach it. The UI says so at click
time.

## 🛡️ Safety & Reliability

- **Media Resolution**: The `useMediaUrl` hook handles ID-to-Blob resolution (via IndexedDB) and local file path formatting transparently.
- **Rehydration**: All projection windows rehydrate their stores on mount to ensure they display the correct initial state even if they were opened after the projection started.
