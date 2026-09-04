import { useMapStore } from '../../map/useMapStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { useImageStore } from '../../image/useImageStore';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import type { ActionContext, ActionRegistry } from './types';

const ping = (payload: any) => {
    const { x, y, color } = payload as { x: number; y: number; color?: string };
    console.log(`[Actions] Remote Map Ping: (${x}, ${y})`);
    // addPing déclenche sa propre synchronisation si nécessaire ; le handler
    // n'en demande donc pas lui-même. La diffusion de fin de traitement
    // s'applique quand même, ce type n'étant pas classé haute fréquence.
    useMapStore.getState().addPing(x, y, color || '#06b6d4');
};

const triggerStoryboardMoment = (payload: any, ctx: ActionContext) => {
    const storyboard = useStoryboardStore.getState();
    const moments = storyboard.moments.filter(m => m.campaignId === ctx.activeCampaignId);
    const moment = moments[(payload as { index: number }).index];
    if (moment) storyboard.triggerMoment(moment.id);
};

/**
 * Un pad universel ne dit pas de quel type il est : son identifiant est
 * recherché successivement dans la musique, les bruitages, les images puis les
 * ambiances. Le premier module qui le reconnaît le déclenche.
 */
const triggerUniversalPad = (payload: any) => {
    const { id } = payload as { id: string };
    console.log(`[Actions] [Remote:Pad:Trigger] id: ${id}`);

    const musicStore = useMusicStore.getState();
    const musicPad = musicStore.playlists.flatMap(p => p.pads).find(p => p.id === id);
    if (musicPad) {
        console.log(`[Actions] Triggering Music Pad: ${musicPad.label}`);
        musicStore.playPad(musicPad);
        return;
    }

    const soundStore = useSoundStore.getState();
    const activeAtmos = soundStore.atmospheres.find(a => a.id === soundStore.activeAtmosphereId)
        || soundStore.atmospheres[0];
    if (activeAtmos && activeAtmos.pads[id]) {
        console.log(`[Actions] Triggering Sound Pad: ${id}`);
        import('../../sound/SoundController').then(({ soundController }) => {
            soundController.togglePad(id);
        });
        return;
    }

    const imageStore = useImageStore.getState();
    const image = imageStore.mediaList.find(m => m.id === id);
    if (image) {
        console.log(`[Actions] Triggering Image Pad (Projection): ${image.name}`);
        imageStore.projectSolo(image);
        return;
    }

    const ambientStore = useAmbientStore.getState();
    const preset = ambientStore.presets.find(p => p.id === id);
    if (preset) {
        console.log(`[Actions] Triggering Ambient Preset: ${preset.name}`);
        /*
          **`loadTheme` charge sans jouer, et c'est juste à l'écran** : on
          charge, on règle, on démarre. Un pad de télécommande n'a pas de
          second geste — il chargeait donc le silence. `lancerLeTheme` fait
          les deux.
        */
        void ambientStore.lancerLeTheme(preset.universe, preset.name);
    }
};

export const sceneActions: ActionRegistry = {
    'map:ping': ping,
    'remote:map:ping': ping,
    'storyboard:trigger': triggerStoryboardMoment,
    'remote:story:trigger': triggerStoryboardMoment,
    'remote:pad:trigger': triggerUniversalPad,
    'universal:trigger': triggerUniversalPad,
};
