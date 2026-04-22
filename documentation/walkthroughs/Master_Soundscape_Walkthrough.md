# Walkthrough: Master Soundscape Controller

Implementation of a centralized audio management system for GM-OS v5.

## Accomplishments

### 🔊 Centralized Audio Control
- **Global Master Store**: Created `useAudioMasterStore` to manage system-wide volume and specialized audio modes.
- **Engine Synchronization**: Modified all four core audio engines to respect the global master volume:
    - `MusicEngine`: Linked to master volume and Focus ducking.
    - `AmbientEngine`: Linked to master volume and Focus ducking.
    - `SoundEngine`: Linked to master volume and partial Focus ducking (SFX remain priority).
    - `VoiceEngine`: Linked to master volume only (never ducked).

### ⚡ "Focus Chat" Mode
- Implemented a "tamisage total" (total dimming) toggle.
- When active, background music and ambience are instantly reduced to 10% volume, allowing the Game Master and players to converse clearly without stopping the mood entirely.

### 🎨 Premium UI Integration
- **Master Controller**: A new Glassmorphism-styled controller in the Header.
- **Dynamic Slider**: Reactive volume slider with smooth transitions and percentage display.
- **Focus Toggle**: Animated button with glow effects and "Pulse" indicator when active.

## Code Changes

- [NEW] `src/stores/useAudioMasterStore.ts`
- [NEW] `src/components/audio/MasterAudioController.tsx`
- [MODIFY] `src/modules/music/MusicEngine.ts`
- [MODIFY] `src/modules/ambient/AmbientEngine.ts`
- [MODIFY] `src/modules/sound/SoundEngine.ts`
- [MODIFY] `src/modules/voice/VoiceEngine.ts`
- [MODIFY] `src/components/Shell.tsx` (Version update to 5.1.1-ALPHA)

## Verification Results

- ✅ **Master Volume**: Moving the slider correctly scales all active audio streams.
- ✅ **Focus Chat**: Toggling Focus Mode dims music/ambient while keeping voice/SFX audible.
- ✅ **Persistence**: Global volume settings persist across sessions via Zustand middleware.
- ✅ **UI Consistency**: The controller follows the GM-OS premium design language and adapts to all themes.
