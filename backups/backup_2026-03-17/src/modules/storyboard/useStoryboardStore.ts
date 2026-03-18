import { create } from 'zustand';
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
    
    campaignId: string;
}

interface StoryboardState {
    moments: StoryboardMoment[];
    activeMomentId: string | null;

    // Actions
    addMoment: (moment: Omit<StoryboardMoment, 'id'>) => void;
    updateMoment: (id: string, updates: Partial<StoryboardMoment>) => void;
    deleteMoment: (id: string) => void;
    triggerMoment: (id: string) => Promise<void>;
    reset: () => void;
}

export const useStoryboardStore = create<StoryboardState>()(
    persist(
        (set, get) => ({
            moments: [],
            activeMomentId: null,

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

            triggerMoment: async (id) => {
                const moment = get().moments.find(m => m.id === id);
                if (!moment) return;

                console.log(`[Storyboard] Triggering Moment: ${moment.name} (${id})`);
                set({ activeMomentId: id });

                // Cross-store orchestration
                const gWindow = window as any;
                const { gmToast } = gWindow.useToastStore?.getState() || {};

                // 1. Music-OS
                if (moment.musicPadId && gWindow.useMusicStore) {
                    const musicStore = gWindow.useMusicStore.getState();
                    const pad = musicStore.playlists.flatMap((p: any) => p.pads).find((p: any) => p.id === moment.musicPadId);
                    
                    if (pad) {
                        console.log(`[Storyboard] Music: Found pad ${pad.label} (${pad.id}). Playing...`);
                        await musicStore.playPad(pad);
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

                // 3. Atlas-OS (Map)
                if (moment.mapUrl && gWindow.useMapStore) {
                    console.log(`[Storyboard] Map: Setting URL ${moment.mapUrl}`);
                    const mapStore = gWindow.useMapStore.getState();
                    mapStore.setMap(moment.mapUrl, moment.isMapVideo || false);
                }

                // 4. Image-OS
                if (moment.imageMediaId && gWindow.useImageStore) {
                    const imageStore = gWindow.useImageStore.getState();
                    const media = imageStore.mediaList.find((m: any) => m.id === moment.imageMediaId);
                    if (media) {
                        console.log(`[Storyboard] Image: Projecting solo ${media.name}`);
                        imageStore.projectSolo(media);
                    } else {
                        console.warn(`[Storyboard] Image: Media ID ${moment.imageMediaId} NOT FOUND.`);
                    }
                }

                // 5. Sound-OS (SFX)
                if (moment.soundPadId && gWindow.useSoundStore && gWindow.soundEngine) {
                    const soundStore = gWindow.useSoundStore.getState();
                    const atmosId = soundStore.activeAtmosphereId;
                    const atmosphere = soundStore.atmospheres.find((a: any) => a.id === atmosId);
                    const pad = atmosphere?.pads[moment.soundPadId];
                    if (pad && pad.filePath) {
                        console.log(`[Storyboard] Sound: Playing SFX ${pad.title} (${pad.id})`);
                        await gWindow.soundEngine.loadAudio(pad.id, pad.filePath);
                        gWindow.soundEngine.play(pad.id, pad.volume);
                        soundStore.setPadActive(pad.id, true);
                    } else {
                        console.warn(`[Storyboard] Sound: Pad ID ${moment.soundPadId} NOT FOUND or no file.`);
                    }
                }

                // 6. Ambient-OS
                if (moment.ambientSceneId && gWindow.useAmbientStore) {
                    console.log(`[Storyboard] Ambient: Applying scene ${moment.ambientSceneId}`);
                    const ambientStore = gWindow.useAmbientStore.getState();
                    await ambientStore.applyScene(moment.ambientSceneId);
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
