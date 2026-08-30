import { useSoundStore } from './useSoundStore';
import { soundController } from './SoundController';
import type { SoundPad } from './useSoundStore';
import { estUneFrappeDePastille } from '../../utils/frappeDePastille';

export class KeyboardEngine {
    private static instance: KeyboardEngine;
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): KeyboardEngine {
        if (!KeyboardEngine.instance) {
            KeyboardEngine.instance = new KeyboardEngine();
        }
        return KeyboardEngine.instance;
    }

    public initialize() {
        if (this.initialized) return;

        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.initialized = true;
        console.log('[KEY] Keyboard Engine initialized.');
    }

    private handleKeyDown(e: KeyboardEvent) {
        /*
          La garde vit dans `estUneFrappeDePastille` — la même que celle de
          Music-OS, qui la recopiait. Elle écarte désormais aussi les frappes
          tenues avec Ctrl, Alt ou Cmd : `e.code` ignore les modificateurs, donc
          `Ctrl+C` produisait `KeyC` et **lançait le son lié à la touche C**.
        */
        if (!estUneFrappeDePastille(e)) return;

        const currentState = useSoundStore.getState();
        const activeAtmos = currentState.atmospheres.find(a => a.id === currentState.activeAtmosphereId) || currentState.atmospheres[0];
        const keyCode = e.code; // e.g. "KeyA", "Numpad1", "Digit2"

        // Learn Mode
        if (currentState.isKeyLearnActive && currentState.activePadLearnId) {
            e.preventDefault();
            console.log(`[KEY] Learning mode: Mapping '${keyCode}' to pad ${currentState.activePadLearnId}`);
            currentState.setPadKeyMapping(currentState.activePadLearnId, keyCode);
            currentState.toggleKeyLearn(); 
            currentState.setActiveLearnPad(null);
            return;
        }

        // Playback Mode
        const padToTrigger = Object.values(activeAtmos.pads).find((p: SoundPad) => p.keyMapping === keyCode);

        if (padToTrigger) {
            e.preventDefault(); 
            console.log(`[KEY] Triggering pad: ${padToTrigger.title} (Key ${keyCode})`);
            soundController.togglePad(padToTrigger.id);
        }
    }

    public cleanup() {
        // Note: Removing anonymous arrow functions is tricky. 
        // In this architecture, the engine lives for the session.
        this.initialized = false;
    }
}

export const keyboardEngine = KeyboardEngine.getInstance();
