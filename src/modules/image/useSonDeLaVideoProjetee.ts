import { useEffect, useRef, useState } from 'react';
import { useAudioMasterStore } from '../../stores/useAudioMasterStore';
import { useImageStore } from './useImageStore';
import { gainDeLaVideo } from './logic/gainDeLaVideo';

/**
 * **Le meneur dicte au projecteur le niveau de sa vidéo.**
 *
 * Ajouté le 2026-09-05, avec la vidéo dans Image-OS.
 *
 * ⛔ **Pourquoi un message et non un branchement.** La vidéo joue dans la fenêtre
 * de projection ; le bus audio vit dans celle du meneur. Un élément d'une
 * fenêtre ne se branche pas sur le graphe audio d'une autre — il n'y a aucun
 * chemin. Ce crochet calcule donc ici le niveau que la vidéo devrait tenir, et
 * le lui envoie par le canal qui porte déjà les projections. Voir
 * [[gainDeLaVideo]] pour ce que cette imitation rend, et ce qu'elle ne rend pas.
 *
 * ⚠️ **Il se monte dans le châssis, jamais dans un module.** Le meneur peut
 * baisser le son depuis n'importe quel écran, et le mode Focus se déclenche
 * hors d'Image-OS. *Un émetteur attaché à une vue émet ce que la vue veut bien* —
 * la leçon du 30/08, payée une seconde fois le 05/09 quand une frontière absente
 * a redescendu quatre crochets au rang de la vue.
 */

/** Ce que la voix du meneur impose au reste, tant qu'elle parle. */
interface EtatDeLaVoix {
    parle: boolean;
    plongee: number;
}

const VOIX_AU_REPOS: EtatDeLaVoix = { parle: false, plongee: 0.3 };

export function useSonDeLaVideoProjetee(): void {
    const volumeGeneral = useAudioMasterStore((e) => e.masterVolume);
    const modeFocus = useAudioMasterStore((e) => e.isFocusMode);
    const tamisageDuFocus = useAudioMasterStore((e) => e.focusDuckingRatio);
    const volumeDeLaVideo = useImageStore((e) => e.volumeVideo);

    /*
      **Les projections comptent parmi les déclencheurs, et ce n'est pas un
      détail.** Une fenêtre de projection qui vient de s'ouvrir n'a jamais rien
      reçu : elle démarrerait à plein volume et n'en bougerait plus jusqu'au
      prochain mouvement de curseur. En renvoyant le niveau à chaque changement
      de projection, la première vidéo naît déjà réglée.

      *Un récepteur qui n'a jamais rien reçu ne se distingue pas d'un récepteur
      en panne* — sauf si l'émetteur reparle au bon moment.
    */
    const projections = useImageStore((e) => e.projections);

    /*
      ⛔ **Voice-OS entre par un import différé, et c'est délibéré.**

      `useVoiceStore` tire `modeDeContexte`, qui tire `useSessionOSStore`, qui
      construit les moteurs de Music-OS et d'Ambient-OS — lesquels réimportent
      `useVoiceStore` pour s'abonner à son ducking. Le monter en tête de ce
      fichier ferait de `Shell` la porte d'entrée du cercle : les moteurs
      recevraient un module **à moitié évalué**, leur abonnement échouerait, et
      *la musique ne baisserait plus quand le meneur parle* — sans un mot dans la
      console de l'application.
      Constaté ici même le 2026-09-05, sur deux rejets non gérés en test.

      Les deux moteurs résolvent ce cycle par un `import()` dans une méthode ;
      on emploie le même remède plutôt que d'en inventer un second.
    */
    const [voix, setVoix] = useState<EtatDeLaVoix>(VOIX_AU_REPOS);

    useEffect(() => {
        let vivant = true;
        let desabonner: (() => void) | undefined;

        void import('../voice/useVoiceStore').then(({ useVoiceStore }) => {
            if (!vivant) return;
            const lire = (e: { isDucking: boolean; currentEffects: { duckingRange: number } }) =>
                setVoix({ parle: e.isDucking, plongee: e.currentEffects.duckingRange });

            lire(useVoiceStore.getState());
            desabonner = useVoiceStore.subscribe(lire);
        });

        return () => { vivant = false; desabonner?.(); };
    }, []);

    /* Ce qui est réellement parti : on ne répète pas un niveau inchangé. */
    const dernierEnvoi = useRef<number | null>(null);
    const dernieresProjections = useRef(projections);

    useEffect(() => {
        const gain = gainDeLaVideo({
            volumeGeneral,
            modeFocus,
            tamisageDuFocus,
            laVoixParle: voix.parle,
            plongeeDeLaVoix: voix.plongee,
            volumeDeLaVideo,
        });

        const projectionsOntChange = dernieresProjections.current !== projections;
        dernieresProjections.current = projections;

        if (!projectionsOntChange && dernierEnvoi.current === gain) return;
        dernierEnvoi.current = gain;

        /*
          Le pont est absent sur les surfaces sans Electron — la tablette. Elle
          ne projette pas de vidéo ; il n'y a rien à lui dire, et rien à signaler.
        */
        window.appBridge?.image?.syncHubData?.('son-video', String(gain));
    }, [
        volumeGeneral, modeFocus, tamisageDuFocus,
        voix, volumeDeLaVideo, projections,
    ]);
}
