import { useSoundStore } from '../../sound/useSoundStore';
import type { ActionRegistry } from './types';

const trigger = (payload: any) => {
    const soundId = (payload as { id?: string })?.id || (payload as { padId?: string })?.padId || '';
    console.log(`[Actions] Remote Trigger Sound (+Lights): ${soundId}`, payload);
    if (soundId) {
        // Import différé : SoundController tire toute la chaîne audio.
        import('../../sound/SoundController').then(({ soundController }) => {
            soundController.togglePad(soundId);
        });
    }
};

const setVolume = (payload: any) => {
    useSoundStore.getState().setMasterVolume((payload as { volume: number }).volume);
};

const stopAll = () => {
    useSoundStore.getState().stopAllPads();
};

export const audioActions: ActionRegistry = {
    'sound:trigger': trigger,
    'remote:sound:trigger': trigger,
    'sound:volume': setVolume,
    'remote:sound:volume': setVolume,
    'sound:stop-all': stopAll,
    'remote:sound:stop-all': stopAll,
};
