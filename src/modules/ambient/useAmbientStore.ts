import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ambientEngine } from './AmbientEngine';
import { useJournalStore } from '../journal/useJournalStore';
// Note: imports of hueEngine and useLightStore moved inside actions to avoid circular dependencies

export interface AmbientTrackState {
    id: string;
    label: string;
    url: string;
    volume: number;
    isPlaying: boolean;
    color: string;
    linkedLightSceneId?: string;
}

export interface AmbientTheme {
    id: string;
    name: string;
    universe: string;
    tracks: Partial<AmbientTrackState>[];
}

export interface AmbientScene {
    id: string;
    name: string;
    description: string;
    trackVolumes: number[]; // Array of 8 volumes (0 to 1)
    activeTracks: boolean[]; // Array of 8 booleans (play/stop)
}

interface AmbientState {
    tracks: AmbientTrackState[];
    masterVolume: number;
    outputDeviceId: string | 'default';
    presets: AmbientTheme[];
    scenes: AmbientScene[];
    customUniverses: string[];

    // Actions
    loadTheme: (universe: string, themeName: string) => Promise<void>;
    saveTheme: (universe: string, themeName: string) => void;
    deleteTheme: (themeId: string) => void;
    saveScene: (name: string) => void;
    deleteScene: (id: string) => void;
    addUniverse: (name: string) => void;
    toggleTrack: (index: number) => Promise<void>;
    setTrackVolume: (index: number, volume: number) => void;
    updateTrack: (index: number, updates: Partial<AmbientTrackState>) => void;
    setMasterVolume: (volume: number) => void;
    setOutputDevice: (deviceId: string) => void;
    fadeOutAll: () => void;
    setTrackLightLink: (index: number, sceneId: string | null) => void;
    handleLightReversion: (stoppedIndex: number) => void;
    applyScene: (sceneId: string) => Promise<void>;
    applySnapshot: (snapshot: {
        activeTracks?: { id: string; url: string; volume: number; isPlaying: boolean }[];
        masterVolume?: number;
        tracks?: AmbientTrackState[];
    }) => Promise<void>;
    reset: () => void;
}



const INITIAL_TRACKS: AmbientTrackState[] = Array(8).fill(null).map((_, i) => ({
    id: `track-${i}`,
    label: `modules:ambient.presets.tracks.default_track`,
    url: '',
    volume: 0.5,
    isPlaying: false,
    color: '#3b82f6' // Default blue
}));

const DEFAULT_PRESETS: AmbientTheme[] = [
    {
        id: 'cp-arc',
        universe: 'modules:ambient.presets.universes.cyberpunk',
        name: 'modules:ambient.presets.themes.arcology',
        tracks: [
            { label: 'modules:ambient.presets.tracks.spire_wind', url: '', volume: 0.4, color: '#06b6d4' },
            { label: 'modules:ambient.presets.tracks.security_drones', url: '', volume: 0.2, color: '#f43f5e' },
            { label: 'modules:ambient.presets.tracks.ac_hum', url: '', volume: 0.6, color: '#94a3b8' },
            { label: 'modules:ambient.presets.tracks.corp_announcements', url: '', volume: 0.3, color: '#fbbf24' }
        ]
    },
    {
        id: 'cp-club',
        universe: 'modules:ambient.presets.universes.cyberpunk',
        name: 'modules:ambient.presets.themes.neon_club',
        tracks: [
            { label: 'modules:ambient.presets.tracks.synth_bass', url: '', volume: 0.7, color: '#d946ef' },
            { label: 'modules:ambient.presets.tracks.distant_crowd', url: '', volume: 0.4, color: '#8b5cf6' },
            { label: 'modules:ambient.presets.tracks.neon_buzz', url: '', volume: 0.2, color: '#2dd4bf' }
        ]
    },
    {
        id: 'fan-forest',
        universe: 'modules:ambient.presets.universes.fantasy',
        name: 'modules:ambient.presets.themes.enchanted_forest',
        tracks: [
            { label: 'modules:ambient.presets.tracks.birds', url: '', volume: 0.5, color: '#22c55e' },
            { label: 'modules:ambient.presets.tracks.stream', url: '', volume: 0.6, color: '#3b82f6' },
            { label: 'modules:ambient.presets.tracks.foliage', url: '', volume: 0.3, color: '#f59e0b' }
        ]
    }
];

const DEFAULT_SCENES: AmbientScene[] = [
    {
        id: 'scene-quiet',
        name: 'modules:ambient.scenes.quiet.name',
        description: 'modules:ambient.scenes.quiet.desc',
        trackVolumes: [0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        activeTracks: [true, true, true, false, false, false, false, false]
    },
    {
        id: 'scene-tension',
        name: 'modules:ambient.scenes.tension.name',
        description: 'modules:ambient.scenes.tension.desc',
        trackVolumes: [0.4, 0.4, 0.3, 0.7, 0.7, 0.2, 0.2, 0.2],
        activeTracks: [true, true, true, true, true, false, false, false]
    },
    {
        id: 'scene-action',
        name: 'modules:ambient.scenes.action.name',
        description: 'modules:ambient.scenes.action.desc',
        trackVolumes: [0.8, 0.8, 0.6, 0.9, 0.9, 0.8, 0.8, 0.8],
        activeTracks: [true, true, true, true, true, true, true, true]
    }
];

export const useAmbientStore = create<AmbientState>()(
    persist(
        (set, get) => ({
            tracks: INITIAL_TRACKS,
            masterVolume: 1.0,
            outputDeviceId: 'default',
            presets: DEFAULT_PRESETS,
            scenes: DEFAULT_SCENES,
            customUniverses: [],


            loadTheme: async (universe, themeName) => {
                const theme = get().presets.find(p => p.universe === universe && p.name === themeName);
                if (!theme) return;

                // Stop all current
                ambientEngine.fadeOutAll(1.0);

                const newTracks = INITIAL_TRACKS.map((t, i) => {
                    const presetTrack = theme.tracks[i];
                    return presetTrack ? { ...t, ...presetTrack, isPlaying: false } : { ...t, url: '', isPlaying: false };
                });

                set({ tracks: newTracks });
            },

            saveTheme: (universe, themeName) => {
                const currentTracks = get().tracks;
                const newTheme: AmbientTheme = {
                    id: `custom-${Date.now()}`,
                    universe,
                    name: themeName,
                    tracks: currentTracks.map(t => ({
                        label: t.label,
                        url: t.url,
                        volume: t.volume,
                        color: t.color
                    }))
                };
                set(state => ({ presets: [...state.presets, newTheme] }));
            },

            deleteTheme: (themeId) => {
                set(state => ({ presets: state.presets.filter(p => p.id !== themeId) }));
            },

            saveScene: (name) => {
                const currentTracks = get().tracks;
                const newScene: AmbientScene = {
                    id: `scene-${Date.now()}`,
                    name,
                    description: 'modules:ambient.scenes.custom_scene',
                    trackVolumes: currentTracks.map(t => t.volume),
                    activeTracks: currentTracks.map(t => t.isPlaying)
                };
                set(state => ({ scenes: [...state.scenes, newScene] }));
            },

            deleteScene: (id) => {
                set(state => ({ scenes: state.scenes.filter(s => s.id !== id) }));
            },

            addUniverse: (name) => {
                const trimmedName = name.trim();
                if (!trimmedName || get().customUniverses.includes(trimmedName)) return;
                set(state => ({ customUniverses: [...state.customUniverses, trimmedName] }));
            },

            toggleTrack: async (index) => {
                const track = get().tracks[index];
                if (!track.url) return;

                await ambientEngine.resume();

                if (track.isPlaying) {
                    ambientEngine.tracks[index].stop(1.5);
                    set(state => ({
                        tracks: state.tracks.map((t, i) => i === index ? { ...t, isPlaying: false } : t)
                    }));

                    // Smart Reversion
                    try {
                        const { useLightStore } = await import('../light/useLightStore');
                        const { isSyncEnabled } = useLightStore.getState();
                        if (isSyncEnabled && track.linkedLightSceneId) {
                            get().handleLightReversion(index);
                        }
                    } catch (e) {
                        console.error("[AmbientStore] Smart reversion failed", e);
                    }
                } else {
                    try {
                        await ambientEngine.tracks[index].load(track.url);
                        ambientEngine.tracks[index].play(track.volume, 1.5);
                        set(state => ({
                            tracks: state.tracks.map((t, i) => i === index ? { ...t, isPlaying: true } : t)
                        }));

                        // Handling light scene
                        try {
                            const { useLightStore } = await import('../light/useLightStore');
                            const { hueEngine } = await import('../light/HueEngine');
                            const { isSyncEnabled } = useLightStore.getState();

                            if (isSyncEnabled && track.linkedLightSceneId) {
                                // The track is now playing, so apply its linked scene
                                hueEngine.applyScene(track.linkedLightSceneId, true);
                            }
                        } catch (e) {
                            console.warn("[AmbientStore] Light trigger skipped or failed", e);
                        }
                    } catch (err) {
                        console.error("Failed to play track", err);
                    }
                }
            },

            setTrackLightLink: (index, sceneId) => set(state => ({
                tracks: state.tracks.map((t, i) => i === index ? { ...t, linkedLightSceneId: sceneId || undefined } : t)
            })),

            handleLightReversion: async (stoppedIndex: number) => {
                try {
                    const { useLightStore } = await import('../light/useLightStore');
                    const { hueEngine } = await import('../light/HueEngine');

                    const { isSyncEnabled } = useLightStore.getState();
                    if (!isSyncEnabled) return;

                    const tracks = get().tracks;
                    const otherActiveWithLights = tracks.filter((t, i) => t.isPlaying && i !== stoppedIndex && t.linkedLightSceneId);

                    if (otherActiveWithLights.length > 0) {
                        const nextTrack = otherActiveWithLights[otherActiveWithLights.length - 1];
                        hueEngine.applyScene(nextTrack.linkedLightSceneId!, true);
                    } else {
                        hueEngine.revertToManualScene();
                    }
                } catch (e) {
                    console.error("[AmbientStore] handleLightReversion failed", e);
                }
            },

            setTrackVolume: (index, volume) => {
                ambientEngine.tracks[index].setVolume(volume);
                set(state => ({
                    tracks: state.tracks.map((t, i) => i === index ? { ...t, volume } : t)
                }));
            },

            updateTrack: (index, updates) => set(state => ({
                tracks: state.tracks.map((t, i) => i === index ? { ...t, ...updates } : t)
            })),

            setMasterVolume: (volume) => {
                set({ masterVolume: volume });
            },

            setOutputDevice: (deviceId) => {
                set({ outputDeviceId: deviceId });
            },

            fadeOutAll: async () => {
                ambientEngine.fadeOutAll(2.0);
                set(state => ({
                    tracks: state.tracks.map(t => ({ ...t, isPlaying: false }))
                }));

                // Light Reversion
                try {
                    const { useLightStore } = await import('../light/useLightStore');
                    const { hueEngine } = await import('../light/HueEngine');
                    const { isSyncEnabled } = useLightStore.getState();
                    if (isSyncEnabled) {
                        hueEngine.revertToManualScene();
                    }
                } catch (e) {
                    console.error("[AmbientStore] fadeOutAll light reversion failed", e);
                }
            },

            applyScene: async (sceneId) => {
                const scene = get().scenes.find(s => s.id === sceneId);
                if (!scene) return;

                await ambientEngine.resume();

                const currentTracks = get().tracks;
                const newTracks = [...currentTracks];

                for (let i = 0; i < 8; i++) {
                    const t = currentTracks[i];
                    const shouldBePlaying = scene.activeTracks[i];
                    const targetVolume = scene.trackVolumes[i];

                    if (shouldBePlaying && !t.isPlaying && t.url) {
                        await ambientEngine.tracks[i].load(t.url);
                        ambientEngine.tracks[i].play(targetVolume, 2.0);
                        newTracks[i] = { ...t, isPlaying: true, volume: targetVolume };
                    } else if (!shouldBePlaying && t.isPlaying) {
                        ambientEngine.tracks[i].stop(2.0);
                        newTracks[i] = { ...t, isPlaying: false, volume: targetVolume };
                    } else if (shouldBePlaying && t.isPlaying) {
                        ambientEngine.tracks[i].setVolume(targetVolume);
                        newTracks[i] = { ...t, volume: targetVolume };
                    } else {
                        newTracks[i] = { ...t, volume: targetVolume };
                    }
                }

                set({ tracks: newTracks });

                /*
                  **L'ambiance était muette**, l'un des trois modules relevés à
                  la revue des 36 émetteurs du 2026-08-20 — alors que la musique,
                  geste rigoureusement identique, émettait déjà. Elle prend donc
                  le même type : une nappe d'ambiance EST du son.

                  Nature `trace` par défaut d'`AUDIO`, et c'est juste : poser une
                  ambiance est un geste de table. Ce qu'elle installe — la pluie,
                  la taverne — relève de la scène, que la trame porte déjà.
                */
                useJournalStore.getState().addEvent({
                    type: 'AUDIO',
                    title: `Ambiance : ${scene.name}`,
                    content: `Nappe d'ambiance « ${scene.name} » appliquée.`,
                    metadata: { sceneId },
                });
            },

            applySnapshot: async (snapshot) => {
                if (!snapshot) return;

                if (snapshot.masterVolume !== undefined) set({ masterVolume: snapshot.masterVolume });

                // 1. Restore the structures (all 8 tracks metadata)
                if (snapshot.tracks) {
                    set({ tracks: snapshot.tracks });
                }

                // 2. Trigger Playback/Loading for tracks that should be playing
                const currentTracks = get().tracks;
                for (let i = 0; i < currentTracks.length; i++) {
                    const track = currentTracks[i];
                    
                    if (track.isPlaying && track.url) {
                        try {
                            await ambientEngine.tracks[i].load(track.url);
                            ambientEngine.tracks[i].play(track.volume, 1.0);
                        } catch (e) {
                            console.error(`[AmbientStore] Failed to restore track ${i}:`, e);
                        }
                    } else {
                        // Ensure it's stopped in the engine if it was playing before
                        ambientEngine.tracks[i].stop(1.0);
                    }
                }
            },

            reset: () => {
                ambientEngine.fadeOutAll(1.0);
                set({
                    tracks: INITIAL_TRACKS,
                    masterVolume: 1.0,
                    presets: DEFAULT_PRESETS,
                    scenes: DEFAULT_SCENES,
                    customUniverses: []
                });
            }
        }),
        {
            name: 'gmos-ambient-storage-v2', // Increment version to avoid conflicts
            partialize: (state) => ({
                // Reset isPlaying to false when persisting to prevent auto-play on reload
                tracks: state.tracks.map(t => ({ ...t, isPlaying: false })),
                masterVolume: state.masterVolume,
                outputDeviceId: state.outputDeviceId,
                presets: state.presets,
                scenes: state.scenes, // Persist custom scenes
                customUniverses: state.customUniverses
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useAmbientStore: typeof useAmbientStore }).useAmbientStore = useAmbientStore;
}

