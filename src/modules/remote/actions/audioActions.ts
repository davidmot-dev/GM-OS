import { useSoundStore } from '../../sound/useSoundStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useAmbientStore } from '../../ambient/useAmbientStore';
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

/**
 * **Le volume d'une voie et sa sortie, commandés depuis la tablette.**
 *
 * Demandé par David le 2026-09-22 : *« je ne peux pas choisir où va sortir le
 * son »*, et *« il n'y a pas de slider dans les pads »*.
 *
 * ⛔ **Music-OS et Ambient-OS n'avaient AUCUNE action.** La tablette savait
 * lancer un morceau et une ambiance, jamais les doser — *une chaîne complète
 * sans bouton au bout*, le motif que ce dépôt a déjà payé quatre fois. Et
 * aucune des trois voies ne pouvait changer de sortie.
 *
 * ⚠️ **Chaque voie écrit dans SON magasin**, qui prévient son moteur. On ne
 * parle jamais au moteur d'ici : *un second écrivain qui court-circuite le
 * magasin laisse l'écran du meneur afficher autre chose que ce qui sort* —
 * exactement le défaut du curseur de bruitages, muet jusqu'au 2026-09-20.
 */
const MAGASINS = {
    sound: () => useSoundStore.getState(),
    music: () => useMusicStore.getState(),
    ambient: () => useAmbientStore.getState(),
} as const;

type VoieCommandee = keyof typeof MAGASINS;

const setVolumeDe = (voie: VoieCommandee) => (payload: unknown) => {
    const volume = (payload as { volume?: number })?.volume;
    /* `Number.isFinite` et pas seulement `typeof` : un `NaN` reçu du réseau
       couperait le son sans lever d'erreur. */
    if (typeof volume !== 'number' || !Number.isFinite(volume)) return;
    MAGASINS[voie]().setMasterVolume(volume);
};

const setSortie = (voie: VoieCommandee) => (payload: unknown) => {
    const sortie = (payload as { sortie?: string })?.sortie;
    if (typeof sortie !== 'string' || sortie.length === 0) return;
    MAGASINS[voie]().setOutputDevice(sortie);
};

export const audioActions: ActionRegistry = {
    'sound:trigger': trigger,
    'remote:sound:trigger': trigger,
    'sound:volume': setVolume,
    'sound:sortie': setSortie('sound'),
    'remote:sound:sortie': setSortie('sound'),
    'music:volume': setVolumeDe('music'),
    'remote:music:volume': setVolumeDe('music'),
    'music:sortie': setSortie('music'),
    'remote:music:sortie': setSortie('music'),
    'ambient:volume': setVolumeDe('ambient'),
    'remote:ambient:volume': setVolumeDe('ambient'),
    'ambient:sortie': setSortie('ambient'),
    'remote:ambient:sortie': setSortie('ambient'),
    'remote:sound:volume': setVolume,
    'sound:stop-all': stopAll,
    'remote:sound:stop-all': stopAll,
};
