import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { musicEngine } from './MusicEngine';

export type PadType = 'local' | 'link';

export interface MusicPad {
    id: string;
    label: string;
    url: string;
    type: PadType;
    loopA: number | null;
    loopB: number | null;
    lightLinkId?: string;
}

export interface Playlist {
    id: string;
    name: string;
    pads: MusicPad[];
}

interface MusicState {
    playlists: Playlist[];
    activePlaylistId: string | null;

    deckA: {
        activePadId: string | null;
        activeTrackLabel: string | null;
        volume: number;
        isLooping: boolean;
        isPlaying: boolean;
    };
    deckB: {
        activePadId: string | null;
        activeTrackLabel: string | null;
        volume: number;
        isLooping: boolean;
        isPlaying: boolean;
    };

    crossfader: number; // 0 to 1
    masterVolume: number;
    autoFadeDuration: number; // in ms
    outputDeviceId: string | 'default';

    history: string[]; // Last 10 pad labels
    consoleLogs: string[]; // Engine logs

    // Actions
    setCrossfader: (value: number) => void;
    setCrossfaderVisualOnly: (value: number) => void;
    setMasterVolume: (value: number) => void;
    setAutoFadeDuration: (value: number) => void;
    setOutputDevice: (deviceId: string) => void;

    addPlaylist: (name: string) => void;
    removePlaylist: (id: string) => void;
    updatePad: (playlistId: string, padIndex: number, pad: Partial<MusicPad>) => void;
    reorderPads: (playlistId: string, oldIndex: number, newIndex: number) => void;
    clearPlaylistPads: (playlistId: string) => void;

    loadToDeck: (deck: 'A' | 'B', pad: MusicPad) => Promise<void>;
    playDeck: (deck: 'A' | 'B') => Promise<void>;
    stopDeck: (deck: 'A' | 'B') => void;
    stopAll: () => void;
    toggleLoop: (deck: 'A' | 'B') => void;

    // V3 Auto-Logic
    autoFadeTarget: 'A' | 'B' | null;
    clearAutoFadeTarget: () => void;
    triggerAutoFade: (target: 'A' | 'B') => Promise<void>;

    playPad: (pad: MusicPad) => Promise<void>;
    addLog: (message: string) => void;
    setActivePlaylistId: (id: string) => void;
}

export const useMusicStore = create<MusicState>()(
    persist(
        (set, get) => {
            // Lier le moteur audio au store local pour l'UI réactive
            // @ts-expect-error onStateChange is private but we bind it here
            musicEngine.deckA.onStateChange = (s) => set((state) => ({ deckA: { ...state.deckA, isPlaying: s.isPlaying } }));
            // @ts-expect-error onStateChange is private but we bind it here
            musicEngine.deckB.onStateChange = (s) => set((state) => ({ deckB: { ...state.deckB, isPlaying: s.isPlaying } }));

            return {
                playlists: [
                    {
                        id: 'default', name: 'Exploration', pads: Array(16).fill(null).map((_, i) => ({
                            id: `pad-${i}`,
                            label: `Pad ${i + 1}`,
                            url: '',
                            type: 'local',
                            loopA: null,
                            loopB: null
                        }))
                    }
                ],
                activePlaylistId: 'default',

                deckA: { activePadId: null, activeTrackLabel: null, volume: 1.0, isLooping: true, isPlaying: false },
                deckB: { activePadId: null, activeTrackLabel: null, volume: 1.0, isLooping: true, isPlaying: false },

                crossfader: 0.5,
                masterVolume: 1.0,
                autoFadeDuration: 5000,
                outputDeviceId: 'default',
                history: [],
                consoleLogs: [],

                autoFadeTarget: null,
                clearAutoFadeTarget: () => set({ autoFadeTarget: null }),
                triggerAutoFade: async (target) => {

                    await musicEngine.resume();
                    await get().playDeck(target);
                    musicEngine.performAutoFade(target, get().autoFadeDuration);
                    set({ autoFadeTarget: target });
                    get().addLog(`Transition auto vers Deck ${target}`);
                },



                setCrossfader: (value) => {
                    const val = Math.max(0, Math.min(1, value));
                    musicEngine.setCrossfader(val);
                    set({ crossfader: val });
                },

                setCrossfaderVisualOnly: (value) => {
                    set({ crossfader: Math.max(0, Math.min(1, value)) });
                },

                setMasterVolume: (value) => {
                    const val = Math.max(0, Math.min(1, value));
                    musicEngine.setMasterVolume(val);
                    set({ masterVolume: val });
                },

                setAutoFadeDuration: (value) => set({ autoFadeDuration: value }),

                setOutputDevice: (deviceId) => set({ outputDeviceId: deviceId }),

                addPlaylist: (name) => set((state) => ({
                    playlists: [...state.playlists, {
                        id: crypto.randomUUID(),
                        name,
                        pads: Array(16).fill(null).map((_, i) => ({
                            id: crypto.randomUUID(),
                            label: `Pad ${i + 1}`,
                            url: '',
                            type: 'local',
                            loopA: null,
                            loopB: null
                        }))
                    }]
                })),

                removePlaylist: (id) => set((state) => ({
                    playlists: state.playlists.filter(p => p.id !== id)
                })),

                updatePad: (playlistId, padIndex, padData) => set((state) => ({
                    playlists: state.playlists.map(p =>
                        p.id === playlistId
                            ? { ...p, pads: p.pads.map((pd, i) => i === padIndex ? { ...pd, ...padData } : pd) }
                            : p
                    )
                })),

                reorderPads: (playlistId, oldIndex, newIndex) => set((state) => {
                    const playlist = state.playlists.find(p => p.id === playlistId);
                    if (!playlist) return state;

                    const newPads = [...playlist.pads];
                    const [movedItem] = newPads.splice(oldIndex, 1);
                    newPads.splice(newIndex, 0, movedItem);

                    return {
                        playlists: state.playlists.map(p =>
                            p.id === playlistId ? { ...p, pads: newPads } : p
                        )
                    };
                }),

                clearPlaylistPads: (playlistId) => set((state) => ({
                    playlists: state.playlists.map(p =>
                        p.id === playlistId
                            ? {
                                ...p, pads: p.pads.map((pd, i) => ({
                                    ...pd,
                                    label: `Pad ${i + 1}`,
                                    url: '',
                                    type: 'local',
                                    loopA: null,
                                    loopB: null
                                }))
                            }
                            : p
                    )
                })),

                loadToDeck: async (deck, pad) => {
                    try {
                        // Force l'activation de l'audio sur interaction utilisateur
                        await musicEngine.resume();

                        if (deck === 'A') {
                            await musicEngine.deckA.loadTrack(pad.url);
                            set((state) => ({ deckA: { ...state.deckA, activePadId: pad.id, activeTrackLabel: pad.label } }));
                        } else {
                            await musicEngine.deckB.loadTrack(pad.url);
                            set((state) => ({ deckB: { ...state.deckB, activePadId: pad.id, activeTrackLabel: pad.label } }));
                        }

                        // Add to history if not local link
                        const currentHistory = get().history;
                        if (pad.label && pad.label !== currentHistory[0]) {
                            set((state) => ({
                                history: [pad.label, ...state.history.filter(h => h !== pad.label)].slice(0, 10)
                            }));
                        }

                        get().addLog(`Piste chargée sur Deck ${deck}: ${pad.label}`);
                    } catch (error) {
                        console.error(`Erreur chargement Deck ${deck}:`, error);
                        get().addLog(`ERREUR chargement Deck ${deck}`);
                    }
                },

                playDeck: async (deck) => {
                    await musicEngine.resume();
                    const label = deck === 'A' ? get().deckA.activeTrackLabel : get().deckB.activeTrackLabel;
                    if (deck === 'A') await musicEngine.deckA.play();
                    else await musicEngine.deckB.play();
                    get().addLog(`Lecture lancée sur Deck ${deck}${label ? `: ${label}` : ''}`);
                },


                stopDeck: (deck) => {
                    const duration = get().autoFadeDuration;
                    const label = deck === 'A' ? get().deckA.activeTrackLabel : get().deckB.activeTrackLabel;
                    if (deck === 'A') {
                        musicEngine.deckA.fadeOut(duration);
                    } else {
                        musicEngine.deckB.fadeOut(duration);
                    }
                    get().addLog(`Arrêt Deck ${deck}${label ? `: ${label}` : ''} (Fade Out)`);
                },


                stopAll: () => {
                    const duration = get().autoFadeDuration;
                    musicEngine.deckA.fadeOut(duration);
                    musicEngine.deckB.fadeOut(duration);
                    get().addLog("ARRÊT TOTAL (Progressif)");
                },


                toggleLoop: (deck) => set((state) => {
                    const isA = deck === 'A';
                    const current = isA ? state.deckA.isLooping : state.deckB.isLooping;
                    const newValue = !current;

                    if (isA) musicEngine.deckA.setLooping(newValue);
                    else musicEngine.deckB.setLooping(newValue);

                    return isA
                        ? { deckA: { ...state.deckA, isLooping: newValue } }
                        : { deckB: { ...state.deckB, isLooping: newValue } };
                }),

                playPad: async (pad: MusicPad) => {
                    if (!pad.url) {
                        get().addLog(`Piste ignorée : pas de fichier pour "${pad.label}"`);
                        return;
                    }

                    await musicEngine.resume();

                    // Detection link externe (YouTube, etc.)
                    const isService = musicEngine.isStreamingService(pad.url);

                    if (isService) {
                        get().addLog(`Ouverture lien externe : ${pad.label}`);
                        // @ts-expect-error global
                        if (window.appBridge?.web?.openExternal) {
                            // @ts-expect-error global
                            window.appBridge.web.openExternal(pad.url);
                        } else {
                            window.open(pad.url, '_blank');
                        }
                        return;
                    }

                    // 1. Est-ce que cette platine joue DÉJÀ cette musique ?
                    const state = get();
                    const isPlayingOnA = state.deckA.activePadId === pad.id && musicEngine.deckA.isPlaying;
                    const isPlayingOnB = state.deckB.activePadId === pad.id && musicEngine.deckB.isPlaying;

                    if (isPlayingOnA) {
                        get().stopDeck('A');
                        return;
                    }
                    if (isPlayingOnB) {
                        get().stopDeck('B');
                        return;
                    }

                    // 2. Choisir la platine de destination
                    const targetDeck = state.autoFadeTarget || (state.crossfader < 0.5 ? 'B' : 'A');

                    // 3. Charger et déclencher
                    await get().loadToDeck(targetDeck, pad);
                    await get().triggerAutoFade(targetDeck);
                },

                addLog: (message: string) => {
                    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
                    const log = `[${time}] ${message}`;
                    set((state) => ({
                        consoleLogs: [log, ...state.consoleLogs].slice(0, 40)
                    }));
                },

                setActivePlaylistId: (id: string) => set({ activePlaylistId: id })
            }
        },

        {
            name: 'gmos-music-storage',
            partialize: (state) => ({
                playlists: state.playlists,
                crossfader: state.crossfader,
                masterVolume: state.masterVolume,
                autoFadeDuration: state.autoFadeDuration,
                outputDeviceId: state.outputDeviceId
            }),
        }
    )
);

