import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ambientEngine } from './AmbientEngine';

export interface AmbientTrackState {
    id: string;
    label: string;
    url: string;
    volume: number;
    isPlaying: boolean;
    color: string;
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
    addUniverse: (name: string) => void;
    toggleTrack: (index: number) => Promise<void>;
    setTrackVolume: (index: number, volume: number) => void;
    updateTrack: (index: number, updates: Partial<AmbientTrackState>) => void;
    setMasterVolume: (volume: number) => void;
    setOutputDevice: (deviceId: string) => void;
    fadeOutAll: () => void;
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
    label: `Piste ${i + 1}`,
    url: '',
    volume: 0.5,
    isPlaying: false,
    color: '#3b82f6' // Default blue
}));

const DEFAULT_PRESETS: AmbientTheme[] = [
    {
        id: 'cp-arc',
        universe: 'Cyberpunk',
        name: 'Arcologie',
        tracks: [
            { label: 'Vent de Spire', url: '', volume: 0.4, color: '#06b6d4' },
            { label: 'Drones de Sécurité', url: '', volume: 0.2, color: '#f43f5e' },
            { label: 'Murmure de Clim', url: '', volume: 0.6, color: '#94a3b8' },
            { label: 'Annonces Corporatives', url: '', volume: 0.3, color: '#fbbf24' }
        ]
    },
    {
        id: 'cp-club',
        universe: 'Cyberpunk',
        name: 'Club Néon',
        tracks: [
            { label: 'Basses Synth', url: '', volume: 0.7, color: '#d946ef' },
            { label: 'Foule Distante', url: '', volume: 0.4, color: '#8b5cf6' },
            { label: 'Neon Buzz', url: '', volume: 0.2, color: '#2dd4bf' }
        ]
    },
    {
        id: 'fan-forest',
        universe: 'Fantastique',
        name: 'Forêt Enchantée',
        tracks: [
            { label: 'Oiseaux', url: '', volume: 0.5, color: '#22c55e' },
            { label: 'Ruisseau', url: '', volume: 0.6, color: '#3b82f6' },
            { label: 'Feuillage', url: '', volume: 0.3, color: '#f59e0b' }
        ]
    }
];

const DEFAULT_SCENES: AmbientScene[] = [
    {
        id: 'scene-quiet',
        name: 'Calme Plat',
        description: 'Ambiance de fond discrète',
        trackVolumes: [0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        activeTracks: [true, true, true, false, false, false, false, false]
    },
    {
        id: 'scene-tension',
        name: 'Tension',
        description: 'Renforcement des basses et textures',
        trackVolumes: [0.4, 0.4, 0.3, 0.7, 0.7, 0.2, 0.2, 0.2],
        activeTracks: [true, true, true, true, true, false, false, false]
    },
    {
        id: 'scene-action',
        name: 'Action / Danger',
        description: 'Volume maximum sur toutes les pistes',
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
                } else {
                    try {
                        await ambientEngine.tracks[index].load(track.url);
                        ambientEngine.tracks[index].play(track.volume, 1.5);
                        set(state => ({
                            tracks: state.tracks.map((t, i) => i === index ? { ...t, isPlaying: true } : t)
                        }));
                    } catch (err) {
                        console.error("Failed to play track", err);
                    }
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

            fadeOutAll: () => {
                ambientEngine.fadeOutAll(2.0);
                set(state => ({
                    tracks: state.tracks.map(t => ({ ...t, isPlaying: false }))
                }));
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
                tracks: state.tracks,
                masterVolume: state.masterVolume,
                outputDeviceId: state.outputDeviceId,
                presets: state.presets,
                customUniverses: state.customUniverses
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useAmbientStore: typeof useAmbientStore }).useAmbientStore = useAmbientStore;
}

