/**
 * **Ce qu'une séquence laisse sonner derrière elle.**
 *
 * *Défaut trouvé par David le 2026-09-02 : « quand je passe d'une séquence à
 * l'autre, l'ancienne ambiance ne s'arrête pas ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA MÊME LEÇON QUE L'IMAGE, UNE SEMAINE PLUS TARD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'image du moment précédent s'éteignait déjà quand une autre séquence prenait
 * la main (`cibleDeLImageDuMoment`, 2026-08-31). Le son, lui, ne s'éteignait
 * jamais : Ambient-OS n'arrête que les pistes **qu'une nouvelle scène
 * n'allume pas**, donc une séquence sans ambiance à elle ne coupait rien, et
 * Sound-OS **empile** les bruitages au lieu de les remplacer.
 *
 * *Une séquence est une parenthèse — pour l'oreille comme pour l'œil.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ON N'ÉTEINT QUE CE QUE LA SÉQUENCE A POSÉ, ET SEULEMENT SI RIEN NE REPREND
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les trois moteurs ne se comportent pas pareil quand un autre son arrive, et
 * c'est ce qui décide, module par module :
 *
 * - **Musique** : la platine sait se relayer elle-même — `playPad` enchaîne en
 *   fondu croisé. Couper d'abord ferait un trou dans le son. On ne coupe donc
 *   que si la nouvelle séquence n'apporte aucune musique.
 * - **Bruitage** : Sound-OS empile. Un autre bruitage ne remplace pas celui
 *   d'avant, donc l'ancien s'arrête toujours.
 * - **Ambiance** : `applyScene` éteint déjà les pistes que sa scène n'allume
 *   pas. On ne coupe donc que si la nouvelle séquence n'a pas de scène — et
 *   c'est exactement le cas que David a vu à la table.
 */

/** Ce qu'une séquence a posé sur les trois moteurs de son. */
export interface SonsDuMoment {
    /** Le pad de Music-OS lancé par la séquence. */
    musicPadId: string | null;
    /** Le pad de Sound-OS. */
    soundPadId: string | null;
    /** La scène d'Ambient-OS. */
    ambientSceneId: string | null;
}

/** Rien de posé, rien à éteindre. */
export const AUCUN_SON: SonsDuMoment = { musicPadId: null, soundPadId: null, ambientSceneId: null };

/** Ce qu'une séquence **annonce** : ce qu'elle a réellement posé se relève après coup. */
export function lesSonsAnnoncesPar(moment: {
    musicPadId?: string; soundPadId?: string; ambientSceneId?: string;
}): SonsDuMoment {
    return {
        musicPadId: moment.musicPadId || null,
        soundPadId: moment.soundPadId || null,
        ambientSceneId: moment.ambientSceneId || null,
    };
}

/** Y a-t-il quelque chose à couper ? */
export function ilYAQuelqueChoseAEteindre(sons: SonsDuMoment): boolean {
    return !!(sons.musicPadId || sons.soundPadId || sons.ambientSceneId);
}

/**
 * Ce qui s'éteint quand une séquence prend la main sur une autre.
 *
 * `suivant` est ce que la nouvelle séquence **annonce**, et pas ce qu'elle aura
 * réussi à poser : la question est de savoir si un moteur va se relayer
 * lui-même, et cela se sait avant de lancer quoi que ce soit.
 */
export function cequUnePriseDeMainEteint(
    precedent: SonsDuMoment | null, suivant: SonsDuMoment,
): SonsDuMoment {
    if (!precedent) return AUCUN_SON;
    return {
        musicPadId: suivant.musicPadId ? null : precedent.musicPadId,
        soundPadId: precedent.soundPadId,
        ambientSceneId: suivant.ambientSceneId ? null : precedent.ambientSceneId,
    };
}

/**
 * Ce qui s'éteint quand le meneur arrête le moment.
 *
 * **La musique reste** — décision de David, reprise de celle du 2026-08-17 sur
 * les lumières : arrêter un moment referme sa parenthèse, ça ne fait pas tomber
 * le silence sur la table. Le meneur coupe la musique quand il le décide.
 */
export function cequUnArretEteint(precedent: SonsDuMoment | null): SonsDuMoment {
    if (!precedent) return AUCUN_SON;
    return { ...precedent, musicPadId: null };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Coupe ce qui a été décidé, chaque moteur par son propre geste d'arrêt.
 *
 * **Rien ici ne doit faire tomber la séquence qui arrive** : un moteur absent,
 * une scène effacée entre-temps, un magasin pas encore monté — on passe au
 * suivant. *Le même principe que la scène qu'une ambiance ouvre : ce qui
 * accompagne ne fait jamais tomber ce qui est demandé.*
 */
export async function eteindreLesSons(aEteindre: SonsDuMoment): Promise<void> {
    const gWindow = window as any;

    /*
      **La platine ne s'arrête que si elle joue encore CE morceau-là.** Si le
      meneur a changé de piste à la main depuis, la séquence n'a plus rien à y
      couper — et lui arracher sa musique serait le pire moment pour le faire.
    */
    if (aEteindre.musicPadId) {
        try {
            const music = gWindow.useMusicStore?.getState?.();
            if (music?.stopDeck) {
                if (music.deckA?.activePadId === aEteindre.musicPadId) music.stopDeck('A');
                else if (music.deckB?.activePadId === aEteindre.musicPadId) music.stopDeck('B');
            }
        } catch (e) {
            console.warn('[Storyboard] arrêt de la musique impossible :', e);
        }
    }

    if (aEteindre.soundPadId) {
        try {
            gWindow.soundEngine?.stop?.(aEteindre.soundPadId);
            gWindow.useSoundStore?.getState?.()?.setPadActive?.(aEteindre.soundPadId, false);
        } catch (e) {
            console.warn('[Storyboard] arrêt du bruitage impossible :', e);
        }
    }

    /*
      **Les pistes que cette scène-là avait allumées, et elles seules.**

      `fadeOutAll` aurait été plus court d'une ligne et faux : il emporterait la
      pluie que le meneur avait lancée à la main avant la séquence. On repasse
      donc par `toggleTrack`, le geste d'arrêt d'Ambient-OS — fondu de sortie et
      retour des lumières compris.

      L'état se relit à chaque tour : `toggleTrack` écrit dans le magasin, et un
      instantané pris avant la boucle mentirait dès la deuxième piste.
    */
    if (aEteindre.ambientSceneId) {
        try {
            const ambient = gWindow.useAmbientStore?.getState?.();
            const scene = ambient?.scenes?.find((s: any) => s.id === aEteindre.ambientSceneId);
            if (scene && ambient?.toggleTrack) {
                for (let i = 0; i < scene.activeTracks.length; i++) {
                    if (!scene.activeTracks[i]) continue;
                    const piste = gWindow.useAmbientStore.getState().tracks?.[i];
                    if (piste?.isPlaying) await ambient.toggleTrack(i);
                }
            }
        } catch (e) {
            console.warn('[Storyboard] arrêt de l’ambiance impossible :', e);
        }
    }
}
