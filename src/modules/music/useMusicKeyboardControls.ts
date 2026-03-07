import { useEffect } from 'react';
import { useMusicStore } from './useMusicStore';

export const useMusicKeyboardControls = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in an input or modal
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (document.querySelectorAll('[role="dialog"]').length > 0) return;

            const currentState = useMusicStore.getState();
            const keyCode = e.code; // e.g., "KeyA", "Numpad1"

            // Key Learn Mode
            if (currentState.isKeyLearnActive && currentState.activePadLearnInfo) {
                e.preventDefault();
                console.log(`[KEY] Learning mode (Music): Mapping '${keyCode}' to pad at index ${currentState.activePadLearnInfo.padIndex}`);
                currentState.updatePad(currentState.activePadLearnInfo.playlistId, currentState.activePadLearnInfo.padIndex, { keybind: keyCode });
                currentState.toggleKeyLearn();
                currentState.setActiveLearnPad(null, null);
                return;
            }

            // Playback Mode - search across ALL playlists
            let targetPad = null;
            for (const playlist of currentState.playlists) {
                const pad = playlist.pads.find(p => p.keybind === keyCode);
                if (pad && pad.url) {
                    targetPad = pad;
                    break;
                }
            }

            if (targetPad) {
                e.preventDefault();
                currentState.playPad(targetPad);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
