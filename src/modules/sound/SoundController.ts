import { useSoundStore } from './useSoundStore';
import { soundEngine } from './SoundEngine';
import { useLightStore } from '../light/useLightStore';
import { hueEngine } from '../light/HueEngine';

export class SoundController {
    private static instance: SoundController;

    private constructor() {}

    public static getInstance(): SoundController {
        if (!SoundController.instance) {
            SoundController.instance = new SoundController();
        }
        return SoundController.instance;
    }

    /**
     * Toggles a pad's playback and associated light effects.
     * @param padId The ID of the pad to toggle (e.g., PAD_01).
     * @param onAssignMedia Callback if no media is assigned.
     */
    public async togglePad(padId: string, onAssignMedia?: (id: string) => void) {
        const store = useSoundStore.getState();
        const activeAtmos = store.atmospheres.find(a => a.id === store.activeAtmosphereId) || store.atmospheres[0];
        const pad = activeAtmos.pads[padId];

        if (!pad) return;

        if (!pad.filePath) {
            if (onAssignMedia) onAssignMedia(padId);
            return;
        }

        if (pad.isActive) {
            // STOP
            store.setPadActive(padId, false);
            soundEngine.stop(padId);
            
            if (pad.linkedLightSceneId) {
                this.handleLightReversion(padId);
            }
        } else {
            // PLAY
            store.setPadActive(padId, true);

            // Fetch and decode if not pre-loaded (e.g., triggered from Remote while Sound-OS tab is closed)
            if (!soundEngine.hasBuffer(padId)) {
                console.log(`[SoundController] Audio for ${padId} not loaded. Loading now...`);
                await soundEngine.loadAudio(padId, pad.filePath);
            }

            soundEngine.play(padId, pad.volume, () => {
                store.setPadActive(padId, false);
                if (pad.linkedLightSceneId) {
                    this.handleLightReversion(padId);
                }
            });

            // Trigger Light if linked and sync enabled
            const { isSyncEnabled } = useLightStore.getState();
            if (isSyncEnabled && pad.linkedLightSceneId) {
                hueEngine.applyScene(pad.linkedLightSceneId, true);
            }
        }
    }

    /**
     * Stop all pads and revert lights if needed.
     */
    public stopAll() {
        const store = useSoundStore.getState();
        store.stopAllPads();
        soundEngine.stopAll();
        
        const { isSyncEnabled } = useLightStore.getState();
        if (isSyncEnabled) {
            hueEngine.revertToManualScene();
        }
    }

    /**
     * Smart light reversion: Checks if other active pads have linked light scenes
     * before reverting to the manual scene.
     */
    private handleLightReversion(stoppedPadId: string) {
        const { isSyncEnabled } = useLightStore.getState();
        if (!isSyncEnabled) return;

        const soundStore = useSoundStore.getState();
        const activeAtmos = soundStore.atmospheres.find(a => a.id === soundStore.activeAtmosphereId) || soundStore.atmospheres[0];
        
        // Find other active pads that have a linked light scene
        const otherActivePadsWithLights = Object.values(activeAtmos.pads).filter(
            p => p.isActive && p.id !== stoppedPadId && p.linkedLightSceneId
        );

        if (otherActivePadsWithLights.length > 0) {
            // Apply the light scene of the most recently checked active pad
            const nextPad = otherActivePadsWithLights[otherActivePadsWithLights.length - 1];
            console.log(`[SoundController] Reverting to light of another active pad: ${nextPad.title} (${nextPad.linkedLightSceneId})`);
            hueEngine.applyScene(nextPad.linkedLightSceneId!, true);
        } else {
            // No other pads with lights are active, return to original state
            console.log('[SoundController] No other active pads with lights. Reverting to manual scene.');
            hueEngine.revertToManualScene();
        }
    }
}

export const soundController = SoundController.getInstance();
