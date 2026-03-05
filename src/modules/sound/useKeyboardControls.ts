import { useEffect } from 'react';
import { useSoundStore } from './useSoundStore';
import { soundEngine } from './SoundEngine';

export const useKeyboardControls = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore events if user is typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const currentState = useSoundStore.getState();
            const keyCode = e.code; // e.g. "KeyA", "Numpad1", "Digit2"

            // Learn Mode
            if (currentState.isKeyLearnActive && currentState.activePadLearnId) {
                e.preventDefault();
                console.log(`[KEY] Learning mode: Mapping '${keyCode}' to pad ${currentState.activePadLearnId}`);
                currentState.setPadKeyMapping(currentState.activePadLearnId, keyCode);
                currentState.toggleKeyLearn(); // Turn off learn mode after mapping one key
                currentState.setActiveLearnPad(null);
                return;
            }

            // Playback Mode
            // Find which pad has this key mapping
            const padToTrigger = Object.values(currentState.pads).find(p => p.keyMapping === keyCode);

            if (padToTrigger && padToTrigger.filePath) {
                e.preventDefault(); // Prevent default browser actions for mapped keys

                if (padToTrigger.isActive) {
                    soundEngine.stop(padToTrigger.id);
                    currentState.setPadActive(padToTrigger.id, false);
                } else {
                    currentState.setPadActive(padToTrigger.id, true);
                    soundEngine.play(padToTrigger.id, padToTrigger.volume, () => {
                        currentState.setPadActive(padToTrigger.id, false);
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
};
