import { create } from 'zustand';
import { laSceneQueLAmbianceOuvre } from '../session/logic/trame';
import type { Scene } from '../../types/trame.types';
import { persist } from 'zustand/middleware';

export interface StoryboardMoment {
    id: string;
    name: string;
    description: string;
    color: string; // UI accent color
    icon: string;
    
    // Actions to trigger
    musicPadId?: string;       // Music-OS Pad
    lightSceneId?: string;     // Light-OS Scene
    mapUrl?: string;           // Atlas-OS Map URL
    isMapVideo?: boolean;
    imageMediaId?: string;     // Image-OS Media ID
    soundPadId?: string;       // Sound-OS Pad ID
    ambientSceneId?: string;   // Ambient-OS Scene ID

    /*
      **Où ça sort — demandé par David le 2026-08-31.**

      *« Dans une séquence de storyboard, est-ce qu'on peut choisir sur quelle
      sortie une musique, un son, une ambiance doit être jouée ? Même chose pour
      la projection d'image, sur quel écran je la projette. »*

      Quatre champs facultatifs, et **l'absence veut dire « comme avant »** : le
      module joue sur sa sortie, l'image part sur l'écran choisi dans Image-OS.
      Un moment écrit avant ce jour se comporte donc exactement comme la veille.

      Ce ne sont pas des réglages de module déguisés : ils appartiennent au
      **moment**, parce que c'est le moment qui sait que ce grondement-là doit
      sortir sous la table pendant que la musique reste devant.
    */
    /** Sortie audio de la musique du moment. Absent : celle de Music-OS. */
    musicOutputId?: string;
    /** Sortie audio du bruitage. Absent : celle de Sound-OS. */
    soundOutputId?: string;
    /** Sortie audio de l'ambiance. Absent : celle d'Ambient-OS. */
    ambientOutputId?: string;
    /** Écran de projection de l'image. Absent : la cible courante d'Image-OS. */
    imageTarget?: string;

    campaignId: string;
}

/** Ce que la table montrait avant qu'un moment ne prenne la main. */
export interface ImageAvantLeMoment {
    mapUrl: string | null;
    mapName: string | null;
    isVideo: boolean;
}

interface StoryboardState {
    moments: StoryboardMoment[];
    activeMomentId: string | null;
    /**
     * L'image de la scène, mise de côté le temps du moment.
     *
     * **Un moment est une parenthèse, pas un remplacement.** Demande de David du
     * 2026-08-17 : quand le moment commence, son image prend la place de celle
     * de la scène ; quand il s'arrête, **on revient à l'image de la scène**.
     * Sans cette mémoire, arrêter une ambiance laisserait la table sur son décor
     * — et le meneur devrait retrouver à la main le lieu qu'il avait projeté.
     *
     * `null` quand aucun moment ne tourne, ou quand le moment ne portait pas
     * d'image : il n'y a alors rien eu à remplacer, donc rien à rendre.
     */
    imageAvantLeMoment: ImageAvantLeMoment | null;

    // Actions
    addMoment: (moment: Omit<StoryboardMoment, 'id'>) => void;
    updateMoment: (id: string, updates: Partial<StoryboardMoment>) => void;
    deleteMoment: (id: string) => void;
    duplicateMoment: (id: string) => void;
    setMoments: (moments: StoryboardMoment[]) => void;
    triggerMoment: (id: string) => Promise<void>;
    /**
     * Referme la parenthèse : l'image de la scène revient.
     *
     * **On ne coupe que ce que le moment a posé.** La musique et les lumières
     * restent : le meneur les arrête quand il le décide, et les couper d'office
     * ferait tomber le silence sur la table pour un geste qui ne parlait que de
     * l'image.
     */
    arreterLeMoment: () => void;
    reset: () => void;
}

export const useStoryboardStore = create<StoryboardState>()(
    persist(
        (set, get) => ({
            moments: [],
            activeMomentId: null,
            imageAvantLeMoment: null,

            arreterLeMoment: () => {
                const { imageAvantLeMoment } = get();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gWindow = window as any;

                if (imageAvantLeMoment && gWindow.useMapStore) {
                    gWindow.useMapStore.getState().setMap(
                        imageAvantLeMoment.mapUrl,
                        imageAvantLeMoment.isVideo,
                        imageAvantLeMoment.mapName ?? 'Sans titre',
                    );
                }
                set({ activeMomentId: null, imageAvantLeMoment: null });
            },

            addMoment: (momentData) => set((state) => ({
                moments: [...state.moments, { ...momentData, id: crypto.randomUUID() }]
            })),

            updateMoment: (id, updates) => set((state) => ({
                moments: state.moments.map(m => m.id === id ? { ...m, ...updates } : m)
            })),

            deleteMoment: (id) => set((state) => ({
                moments: state.moments.filter(m => m.id !== id),
                activeMomentId: state.activeMomentId === id ? null : state.activeMomentId
            })),

            duplicateMoment: (id) => {
                const moment = get().moments.find(m => m.id === id);
                if (moment) {
                    const newMoment = { ...moment, id: crypto.randomUUID(), name: `${moment.name} (Copie)` };
                    set((state) => ({
                        moments: [...state.moments, newMoment]
                    }));
                }
            },

            setMoments: (moments) => set({ moments }),

            triggerMoment: async (id) => {
                const moment = get().moments.find(m => m.id === id);
                if (!moment) return;

                console.log(`[Storyboard] Triggering Moment: ${moment.name} (${id})`);
                set({ activeMomentId: id });

                /*
                  **Lancer une ambiance ouvre la scène qui la déclare.**

                  Second marquage gratuit du § 3.1 du plan du 2026-08-08, resté
                  à l'état de projet jusqu'au 2026-08-20 :
                  `momentDeStoryboardId` n'était jamais que LU, pour afficher
                  l'ambiance à côté du titre.

                  *Si déclarer « on est maintenant dans la scène X » coûte plus
                  d'un clic, ce ne sera pas fait, et la trame pourrira en une
                  séance.* Lancer une ambiance est un geste que le meneur fait
                  déjà : il ne lui en coûte rien de plus.

                  `laSceneQueLAmbianceOuvre` porte les gardes — une seule
                  candidate ou rien, jamais une scène close, jamais celle qui
                  tourne déjà. Et l'échec est muet à dessein : une ambiance qui
                  n'ouvre aucune scène reste une ambiance qui marche.
                */
                try {
                    const os = (window as unknown as {
                        useSessionOSStore?: { getState: () => {
                            scenes?: Scene[]; activeCampaignId?: string | null;
                            ouvrirLaScene?: (id: string, seanceId?: string) => void;
                            sessions?: { id: string; campaignId: string; status: string }[];
                        } };
                    }).useSessionOSStore?.getState();
                    if (os?.ouvrirLaScene) {
                        const aOuvrir = laSceneQueLAmbianceOuvre(
                            os.scenes ?? [], os.activeCampaignId, id,
                        );
                        if (aOuvrir) {
                            const seance = (os.sessions ?? []).find(
                                x => x.campaignId === os.activeCampaignId && x.status === 'active');
                            os.ouvrirLaScene(aOuvrir, seance?.id);
                        }
                    }
                } catch {
                    // Une trame en mauvais état n'empêche pas de lancer une ambiance.
                }

                // Cross-store orchestration
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gWindow = window as any;
                const { gmToast } = gWindow.useToastStore?.getState() || {};

                // 1. Music-OS
                if (moment.musicPadId && gWindow.useMusicStore) {
                    const musicStore = gWindow.useMusicStore.getState();
                    const pad = musicStore.playlists.flatMap((p: { pads: { id: string, label: string }[] }) => p.pads).find((p: { id: string }) => p.id === moment.musicPadId);
                    
                    if (pad) {
                        console.log(`[Storyboard] Music: Found pad ${pad.label} (${pad.id}). Playing...`);
                        await musicStore.playPad(pad, moment.musicOutputId);
                    } else {
                        console.warn(`[Storyboard] Music: Pad ID ${moment.musicPadId} NOT FOUND in any playlist.`);
                        if (gmToast) gmToast('warning', `Musique introuvable: ${moment.musicPadId}`);
                    }
                }

                // 2. Light-OS
                if (moment.lightSceneId && gWindow.useLightStore && gWindow.hueEngine) {
                    console.log(`[Storyboard] Light: Applying scene ${moment.lightSceneId}`);
                    const lightStore = gWindow.useLightStore.getState();
                    gWindow.hueEngine.applyScene(moment.lightSceneId);
                    lightStore.setActiveScene(moment.lightSceneId);
                }

                /*
                  3. Atlas-OS (Map) — **et on retient ce qu'on remplace.**

                  L'image du moment prend la place de celle de la scène, et
                  `arreterLeMoment` la rendra. On ne relève rien quand le moment
                  ne porte pas d'image : il n'a alors rien remplacé, et écrire
                  une mémoire vide ferait croire à une parenthèse ouverte qui
                  rendrait un décor arbitraire à sa fermeture.
                */
                if (moment.mapUrl && gWindow.useMapStore) {
                    console.log(`[Storyboard] Map: Setting URL ${moment.mapUrl}`);
                    const mapStore = gWindow.useMapStore.getState();
                    set({
                        imageAvantLeMoment: {
                            mapUrl: mapStore.mapUrl ?? null,
                            mapName: mapStore.mapName ?? null,
                            isVideo: !!mapStore.isVideo,
                        },
                    });
                    mapStore.setMap(moment.mapUrl, moment.isMapVideo || false);
                }

                // 4. Image-OS
                if (moment.imageMediaId && gWindow.useImageStore) {
                    const imageStore = gWindow.useImageStore.getState();
                    const media = imageStore.mediaList.find((m: { id: string, name: string }) => m.id === moment.imageMediaId);
                    if (media) {
                        console.log(`[Storyboard] Image: Projecting solo ${media.name}`);
                        imageStore.projectSolo(media, moment.imageTarget);
                    } else {
                        console.warn(`[Storyboard] Image: Media ID ${moment.imageMediaId} NOT FOUND.`);
                    }
                }

                // 5. Sound-OS (SFX)
                if (moment.soundPadId && gWindow.useSoundStore && gWindow.soundEngine) {
                    const soundStore = gWindow.useSoundStore.getState();
                    const atmosId = soundStore.activeAtmosphereId;
                    const atmosphere = soundStore.atmospheres.find((a: { id: string }) => a.id === atmosId);

                    const pad = atmosphere?.pads[moment.soundPadId];
                    if (pad && pad.filePath) {
                        console.log(`[Storyboard] Sound: Playing SFX ${pad.title} (${pad.id})`);
                        await gWindow.soundEngine.loadAudio(pad.id, pad.filePath);
                        gWindow.soundEngine.play(pad.id, pad.volume, undefined, moment.soundOutputId);
                        soundStore.setPadActive(pad.id, true);
                    } else {
                        console.warn(`[Storyboard] Sound: Pad ID ${moment.soundPadId} NOT FOUND or no file.`);
                    }
                }

                // 6. Ambient-OS
                if (moment.ambientSceneId && gWindow.useAmbientStore) {
                    console.log(`[Storyboard] Ambient: Applying scene ${moment.ambientSceneId}`);
                    const ambientStore = gWindow.useAmbientStore.getState();
                    await ambientStore.applyScene(moment.ambientSceneId, moment.ambientOutputId);
                }

                if (gmToast) gmToast('info', `Moment activé : ${moment.name}`);
            },

            reset: () => set({ moments: [], activeMomentId: null })
        }),
        {
            name: 'gm-os-storyboard-storage',
            partialize: (state) => ({ moments: state.moments })
        }
    )
);

/*
  **Exposé sur le global, comme le combat et la carte.**

  La trame en a besoin pour capturer l'ambiance en cours quand une scène naît en
  un clic (§ 3 du plan du 2026-08-08) : un import direct fermerait un cycle, le
  storyboard orchestrant déjà les autres modules par ce même chemin.
*/
if (typeof window !== 'undefined') {
    (window as unknown as { useStoryboardStore: typeof useStoryboardStore }).useStoryboardStore =
        useStoryboardStore;
}
