# Technical Documentation: Master Soundscape Controller

## Overview
The Master Soundscape Controller provides a centralized interface and logic for managing the global volume of all audio modules in GM-OS v5. It also implements the "Focus Chat" mode for narrative clarity.

## Architecture

### 1. Global Store: `useAudioMasterStore`
The system state is managed by a dedicated Zustand store (`src/stores/useAudioMasterStore.ts`).
- **masterVolume**: A multiplier (0.0 to 1.5) applied to all audio output.
- **isFocusMode**: A boolean toggle for the "Focus Chat" feature.
- **focusDuckingRatio**: The factor by which background audio is reduced during Focus Mode (default: 0.1 or 10%).

### 2. Audio Engine Integration
Instead of a single global gain node that could cause routing complexity, each audio engine implements a terminal `globalSyncGain` node.

- **Music & Ambient Engines**:
    - Chain: `[Local Effects] -> [Master Gain] -> [Ducking Gain] -> [Global Sync Gain] -> [Destination]`
    - Focus Logic: `targetGain = masterVolume * (isFocusMode ? focusDuckingRatio : 1.0)`
- **Sound Engine (SFX)**:
    - Focus Logic: `targetGain = masterVolume * (isFocusMode ? 0.5 : 1.0)` (SFX are kept more audible than music).
- **Voice Engine**:
    - Focus Logic: `targetGain = masterVolume` (Voice is never ducked by Focus Mode).
- **Projected video** *(2026-09-05)*:
    - It is **not** an engine and **not** in the bus: it plays in the projector `BrowserWindow`,
      which has no access to this window's `AudioContext`.
    - The GM computes its level in `image/logic/gainDeLaVideo.ts` and **sends** it over
      `syncHubData('son-video', gain)`. The emitter lives in `Shell`
      (`image/useSonDeLaVideoProjetee.ts`), never in a module.
    - Consequence to know: its sound leaves through the **projector window's** output device, not
      the one chosen in Music-OS. `setSinkId` applies to a context, and there is none here.

### 3. Synchronization Mechanism
Engines subscribe to the `AudioMasterStore` on initialization. Updates are applied using `setTargetAtTime` with a 100ms constant to ensure smooth transitions without audio artifacts.

#### ⛔ Ducking subscription: a failure that used to be silent (fixed 2026-09-05)

`MusicEngine` and `AmbientEngine` are **constructed at module load** and immediately subscribe to
`useVoiceStore` through a deferred `import()` — precisely to avoid a cycle. That was not enough.

`useVoiceStore` statically imported `ai/modeDeContexte`, which pulls `useSessionOSStore`, from which
the engines are reachable. Whenever `useVoiceStore` was the **entry point of the graph**, the
engines' deferred import returned a module still being evaluated: the binding was empty, the
subscription threw inside an unawaited promise, and **ducking was never wired** — with nothing in
the console.

⭐ *An import cycle breaks nothing until someone enters from the wrong end.* Four one-line probes —
the session store, `modeDeContexte`, the engine itself — are all clean; only the one entering through
the voice store fails. That is what makes it invisible, and easy to reopen.

Two fixes, and both were needed:

1. **The edge is cut.** `modeDeContexte` now enters through `await import()` inside the async action
   that uses it. `voice/importsDuMagasinDeVoix.test.ts` reads the source and forbids a static import
   of `../ai/`, `../session/`, `../music/` or `../ambient/` — and also checks the deferred call is
   present, since *a ban without its replacement is worked around by deleting the feature.*
2. **The failure can no longer be silent.** Both engines go through
   `voice/abonnementAuDucking.ts`, which keeps the module **namespace** rather than destructuring it
   (an ESM binding is live and fills in once evaluation ends), re-reads it one turn later, and
   otherwise logs an error naming the engine **and** the consequence.

⚠️ **Scope, stated honestly**: the failure was only ever *observed* in tests. Whether it ever
occurred in the running application is neither proven nor disproven — which is exactly why the
second fix exists. *A silent failure cannot be proven absent.*

### 4. Panic Button (Stop All) Logic
Implemented in v5.3, the Panic Button provides a synchronized shutdown of all media and lighting subsystems. 
- **Method**: `handleStopAll` in `MasterAudioController.tsx`.
- **Target Subsystems**:
  - `MusicEngine.stopAll()`: Halts all playback decks.
  - `SoundEngine.stopAll()`: Stops all active SFX.
  - `AmbientEngine.fadeOutAll(1.0)`: Performs a swift 1-second fade out on all ambient tracks.
  - `useImageStore.blackoutAll()`: Clears all projected images to black.
  - `hueEngine.extinguishAll()`: Turns off all smart lighting.

### 5. Technical Pattern: Window-based Decoupling
To avoid circular dependencies within the global `Shell` (which imports the `MasterAudioController`), the engines are not imported at the top-level of the UI component. 
- **Implementation**: Engines are accessed via the `window` object (e.g., `(window as any).musicEngine`) inside the event handler.
- **Safety**: Each engine is responsible for exposing its singleton on the `window` object during its own initialization.

## UI Components
- **MasterAudioController**: Located in the global `Shell` header.
- **Visuals**: Glassmorphism design, dynamic CSS-variable-based gradients for the slider, and "Aura/Glow" effects for the Focus button.
- **Panic Button**: A dedicated power icon (red in Modern, burgundy in Medieval) for immediate emergency stops.
