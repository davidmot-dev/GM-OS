import type { useMusicStore } from '../music/useMusicStore';
import type { useSoundStore } from '../sound/useSoundStore';
import type { useAmbientStore } from '../ambient/useAmbientStore';
import type { useImageStore } from '../image/useImageStore';
import type { useMapStore } from '../map/useMapStore';
import type { HueEngine } from '../light/HueEngine';
import type { SoundEngine } from '../sound/SoundEngine';

/**
 * Les ponts lus par Storyboard, avec les signatures des modules qui les exposent.
 * Facultatifs : un module pas encore chargé ne doit pas empêcher le moment.
 * Imports de types seuls, pour ne pas fermer les cycles entre ces modules.
 */
export interface FenetreDuStoryboard {
    useMusicStore?: Pick<typeof useMusicStore, 'getState'>;
    useSoundStore?: Pick<typeof useSoundStore, 'getState'>;
    useAmbientStore?: Pick<typeof useAmbientStore, 'getState'>;
    useImageStore?: Pick<typeof useImageStore, 'getState'>;
    useMapStore?: Pick<typeof useMapStore, 'getState' | 'setState'>;
    hueEngine?: Pick<HueEngine, 'applyScene' | 'revenirALEclairageNormal'>;
    soundEngine?: Pick<SoundEngine, 'loadAudio' | 'play' | 'stop'>;
}
