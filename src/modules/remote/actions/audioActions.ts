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

/**
 * **Couper le son coupe les trois sources, pas une seule.**
 *
 * Trouvé par David en séance le 2026-09-05 : *« le bouton tout couper ne coupe
 * pas la musique et ambiant »*. Il n'appelait que `stopAllPads()`, donc **les
 * bruitages de Sound-OS et rien d'autre** — la musique continuait, l'ambiance
 * aussi.
 *
 * Le bouton s'appelait « STOP ALL SOUNDS » ; je l'ai renommé « Tout couper » la
 * veille en le promouvant dans la ligne d'état, **sans vérifier ce qu'il
 * coupait**. *Un nom plus large que le geste est une promesse qu'on tient
 * seulement par hasard.* Il s'appelle maintenant « Couper le son », et il coupe
 * le son.
 *
 * ⚠️ **Les images et les lumières restent** — tranché par David. Le rideau
 * complet est le bouton du meneur ; celui-ci est à portée de pouce sur une
 * tablette posée sur la table, et éteindre l'écran des joueurs par mégarde
 * coûterait plus cher que de laisser tourner une musique.
 *
 * Les magasins sont importés à la demande : `MusicEngine` et `AmbientEngine`
 * tirent toute la chaîne audio, et ce fichier est chargé par le registre
 * d'actions au démarrage.
 */
const stopAll = async () => {
    useSoundStore.getState().stopAllPads();

    /* Chacun dans son coin : un refus ne doit pas empêcher les deux autres. */
    try {
        const { useMusicStore } = await import('../../music/useMusicStore');
        await useMusicStore.getState().stopAll();
    } catch (err) {
        console.warn('[Actions] Musique non coupée :', err);
    }

    try {
        /* L'action du magasin plutôt que le moteur : elle oublie aussi le thème
           chargé, sans quoi la ligne d'état continuerait de le nommer. */
        const { useAmbientStore } = await import('../../ambient/useAmbientStore');
        useAmbientStore.getState().fadeOutAll();
    } catch (err) {
        console.warn('[Actions] Ambiance non coupée :', err);
    }
};

export const audioActions: ActionRegistry = {
    'sound:trigger': trigger,
    'remote:sound:trigger': trigger,
    'sound:volume': setVolume,
    'remote:sound:volume': setVolume,
    'sound:stop-all': stopAll,
    'remote:sound:stop-all': stopAll,
};
