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

### 3. Synchronization Mechanism
Engines subscribe to the `AudioMasterStore` on initialization. Updates are applied using `setTargetAtTime` with a 100ms constant to ensure smooth transitions without audio artifacts.

## UI Components
- **MasterAudioController**: Located in the global `Shell` header.
- **Visuals**: Glassmorphism design, dynamic CSS-variable-based gradients for the slider, and "Aura/Glow" effects for the Focus button.
