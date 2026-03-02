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

    history: string[]; // Last 10 pad labels
    consoleLogs: string[]; // Engine logs

    // Actions
    setCrossfader: (value: number) => void;
    setCrossfaderVisualOnly: (value: number) => void;
    setMasterVolume: (value: number) => void;
    setAutoFadeDuration: (value: number) => void;

    addPlaylist: (name: string) => void;
    removePlaylist: (id: string) => void;
    updatePad: (playlistId: string, padIndex: number, pad: Partial<MusicPad>) => void;
    reorderPads: (playlistId: string, oldIndex: number, newIndex: number) => void;
    clearPlaylistPads: (playlistId: string) => void;

    loadToDeck: (deck: 'A' | 'B', pad: MusicPad) => Promise<void>;
    playDeck: (deck: 'A' | 'B') => void;
    stopDeck: (deck: 'A' | 'B') => void;
    toggleLoop: (deck: 'A' | 'B') => void;

    // V3 Auto-Logic
    autoFadeTarget: 'A' | 'B' | null;
    clearAutoFadeTarget: () => void;
    triggerAutoFade: (target: 'A' | 'B') => void;
    playPad: (pad: MusicPad) => Promise<void>;
    addLog: (message: string) => void;
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
                history: [],
                consoleLogs: [],

                autoFadeTarget: null,
                clearAutoFadeTarget: () => set({ autoFadeTarget: null }),
                triggerAutoFade: (target) => {
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

                playDeck: (deck) => {
                    if (deck === 'A') musicEngine.deckA.play();
                    else musicEngine.deckB.play();
                },

                stopDeck: (deck) => {
                    if (deck === 'A') musicEngine.deckA.stop();
                    else musicEngine.deckB.stop();
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
                    const state = get();

                    if (!pad.url) {
                        get().addLog(`Piste ignore : pas de fichier associé à "${pad.label}"`);
                        return;
                    }

                    // Forcer reprise du contexte si besoin
                    await musicEngine.resume();

                    // 1. Est-ce que cette platine jour DÉJÀ cette musique ?
                    const isPlayingOnA = state.deckA.activePadId === pad.id && musicEngine.deckA.isPlaying;
                    const isPlayingOnB = state.deckB.activePadId === pad.id && musicEngine.deckB.isPlaying;

                    if (isPlayingOnA) {
                        musicEngine.deckA.fadeOut(state.autoFadeDuration);
                        set({ deckA: { ...state.deckA, activePadId: null, activeTrackLabel: null } });
                        return;
                    }
                    if (isPlayingOnB) {
                        musicEngine.deckB.fadeOut(state.autoFadeDuration);
                        set({ deckB: { ...state.deckB, activePadId: null, activeTrackLabel: null } });
                        return;
                    }

                    // 2. Choisir la platine de destination (L'Intelligence)
                    const isAActive = musicEngine.deckA.isPlaying;
                    const isBActive = musicEngine.deckB.isPlaying;

                    let targetDeck: 'A' | 'B' = 'A';

                    if (isAActive && !isBActive) targetDeck = 'B';
                    else if (isAActive && isBActive) {
                        // Les deux jouent, on remplace celle qui a le moins de son
                        targetDeck = state.crossfader > 0.5 ? 'A' : 'B';
                    }

                    // 3. Charger et jouer
                    await get().loadToDeck(targetDeck, pad);
                    get().playDeck(targetDeck);

                    // 4. Déclencher l'Auto-Fade vers cette platine
                    get().triggerAutoFade(targetDeck);
                },

                addLog: (message: string) => {
                    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
                    const log = `[${time}] ${message}`;
                    set((state) => ({
                        consoleLogs: [log, ...state.consoleLogs].slice(0, 40)
                    }));
                }
            }
        },
        {
            name: 'gmos-music-storage',
            // Ne pas persister l'état "playing" ou le volume temps réel si on veut
            partialize: (state) => ({
                playlists: state.playlists,
                crossfader: state.crossfader,
                masterVolume: state.masterVolume,
                autoFadeDuration: state.autoFadeDuration
            }),
        }
    )
);
