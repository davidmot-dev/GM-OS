import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { musicEngine } from './MusicEngine';
import { playlistsApresInstantane } from './logic/instantaneDeSeance';
import { platineDeDestination, positionDeLaPlatine } from './logic/fonduCroise';
import { useJournalStore } from '../journal/useJournalStore';
// Note: imports of hueEngine and useLightStore moved inside actions to avoid circular dependencies

export type PadType = 'local' | 'link';

export interface MusicPad {
    id: string;
    label: string;
    url: string;
    type: PadType;
    loopA: number | null;
    loopB: number | null;
    linkedLightSceneId?: string;
    keybind?: string;
    /**
     * La teinte de la tuile — une **clé** de `logic/couleursDePastille`, jamais
     * une valeur hexadécimale : le jour où le thème change, on corrige la palette
     * et toutes les pastilles suivent. Absente = aucune couleur choisie.
     */
    couleur?: string;
}

export interface Playlist {
    id: string;
    name: string;
    pads: MusicPad[];
    /**
     * **La campagne propriétaire — étiquette, pas cloison.** Demandé par David
     * le 2026-08-30.
     *
     * Absent ou `null` : la playlist est **commune**, visible dans toutes les
     * campagnes. C'est le défaut, et c'est ce qui rend la bascule indolore —
     * les atmosphères écrites avant ce champ n'ont pas d'étiquette et restent
     * donc toutes visibles. *Aucune migration : une migration est l'endroit où
     * les données de ce projet sont déjà mortes deux fois.*
     *
     * Le tri lui-même vit dans `logic/playlistsDeLaCampagne.ts`, parce qu'il
     * sert à l'écran **et au clavier**.
     */
    campagneId?: string | null;
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

    /**
     * La sonie mesuree de chaque piste, en LUFS, indexee par son URL ou son id.
     *
     * *Chantier du 2026-09-03.* Elle se remplit toute seule pendant l'ecoute :
     * une piste jouee une fois est calee pour toutes les suivantes.
     *
     * ⚠️ **Ce n'est pas une donnee de campagne** — c'est une mesure, et une
     * mesure se refait. Elle est persistee pour ne pas etre reperdue a chaque
     * lancement, mais elle n'a rien a faire dans une sauvegarde : *ce qui se
     * recalcule ne se sauvegarde pas.*
     */
    sonies: Record<string, number>;
    setSonie: (piste: string, lufs: number) => void;
    basculerLaNormalisation: (actif?: boolean) => void;

    /** Aligner ou non les pistes sur une meme sonie. */
    normalisation: boolean;

    /** La sonie visee, en LUFS. */
    cibleDeSonie: number;

    history: string[]; // Last 10 pad labels
    consoleLogs: string[]; // Engine logs

    // Actions
    setCrossfader: (value: number) => void;
    /*
      `setCrossfaderVisualOnly` a été retiré le 2026-08-30, avec son seul
      appelant. Il servait au `Mixer` à écrire la position animée du fondu dans
      le magasin, soixante fois par seconde — et `useNexusSynchronizer`, abonné
      à ce magasin, reportait alors sa diffusion d'image en image : **pendant
      toute une transition, plus rien ne partait vers le Player Hub, le
      projecteur ni les tablettes.**

      Une position d'agrément vit désormais dans l'état du composant. *Laisser
      la méthode en place aurait invité à refaire exactement la même chose.*
    */
    /**
     * Le volume général de la musique. `fonduMs` sert aux moments de
     * storyboard ; un curseur n'en passe pas et garde son lissage court.
     */
    setMasterVolume: (value: number, fonduMs?: number) => void;
    setAutoFadeDuration: (value: number) => void;
    setOutputDevice: (deviceId: string) => void;

    addPlaylist: (name: string, campagneId?: string | null) => void;
    removePlaylist: (id: string) => void;
    /**
     * Change le propriétaire d'une playlist : une campagne, ou `null` pour la
     * rendre commune. Le seul écrivain de `campagneId`.
     */
    assignerLaPlaylist: (id: string, campagneId: string | null) => void;
    updatePad: (playlistId: string, padIndex: number, pad: Partial<MusicPad>) => void;
    /**
     * Pose ou retire la plage de lecture d'un pad — voir
     * `logic/plageDeLecture`.
     *
     * Par **identifiant** et non par index, contrairement à `updatePad` : le
     * geste part de la platine, qui ne connaît que `activePadId` et ignore dans
     * quelle playlist se trouve ce qu'elle joue. *Faire remonter l'index
     * jusqu'à l'écran de la platine aurait été lui demander de savoir ce qu'il
     * n'a pas à savoir.*
     */
    definirLaPlageDuPad: (padId: string, entree: number | null, sortie: number | null) => void;
    /**
     * Ajoute une pastille vide à la fin d'une playlist.
     *
     * **Le nombre de pastilles n'est plus un réglage, c'est un geste.** Demandé
     * par David le 2026-09-16 : *« 5 pads par scène c'est parfois peu »*. Une
     * grille fixe force un choix pour tout le monde — cinq est trop peu pour
     * une taverne, seize est un mur de cases vides pour une scène de transition.
     */
    ajouterUnPad: (playlistId: string) => void;
    /** Retire une pastille. L'écran demande confirmation quand elle porte un morceau. */
    retirerUnPad: (playlistId: string, padIndex: number) => void;
    reorderPads: (playlistId: string, oldIndex: number, newIndex: number) => void;
    clearPlaylistPads: (playlistId: string) => void;
    renamePlaylist: (id: string, name: string) => void;

    loadToDeck: (deck: 'A' | 'B', pad: MusicPad) => Promise<void>;
    playDeck: (deck: 'A' | 'B') => Promise<void>;
    stopDeck: (deck: 'A' | 'B') => void;
    stopAll: () => Promise<void>;
    toggleLoop: (deck: 'A' | 'B') => void;

    /*
      `autoFadeTarget` / `clearAutoFadeTarget` ont été retirés le 2026-08-30.
      C'était un drapeau que le magasin posait et qu'un `useEffect` du `Mixer`
      devait consommer pour exécuter *le vrai* travail. Écran fermé, personne ne
      le consommait — et il restait posé, faussant le choix de la platine
      suivante. **Un drapeau qu'il faut penser à effacer finira par ne pas
      l'être** ; la position du crossfader se dérive et ne se périme pas.
    */
    triggerAutoFade: (target: 'A' | 'B') => Promise<void>;

    /**
     * Lance une piste sur la platine libre.
     *
     * `sortie` envoie **cette piste-là** sur l'enceinte demandée, sans déplacer
     * ce qui joue déjà ailleurs — routage par son demandé par David le
     * 2026-08-31. Absent, la musique suit la sortie du module comme avant.
     */
    /**
     * `isAutomatic` dit **d'où vient le geste**, et il ne décide que du journal.
     *
     * Un moment de storyboard allume la musique, l'ambiance et les lumières : si
     * chacun consigne, une seule intention du meneur devient trois lignes, et
     * aucune ne dit ce qu'il a joué. *Un journal qui double ses lignes se relit
     * comme un journal qui ment sur le nombre de gestes.* C'est la règle
     * d'`applyScene` depuis la revue des 36 émetteurs, étendue ici. (2026-09-09)
     */
    playPad: (pad: MusicPad, sortie?: string, isAutomatic?: boolean) => Promise<void>;
    addLog: (message: string) => void;
    setActivePlaylistId: (id: string) => void;

    // Key Learn UI State
    isKeyLearnActive: boolean;
    activePadLearnInfo: { playlistId: string, padIndex: number } | null;
    toggleKeyLearn: () => void;
    setActiveLearnPad: (playlistId: string | null, padIndex: number | null) => void;
    applySnapshot: (snapshot: {
        activePlaylistId?: string | null;
        playlists?: Playlist[];
        deckA?: { activePadId: string | null; volume: number; isPlaying: boolean };
        deckB?: { activePadId: string | null; volume: number; isPlaying: boolean };
        crossfader?: number;
        masterVolume?: number;
    }) => Promise<void>;
    reset: () => void;
}

export const useMusicStore = create<MusicState>()(
    persist(
        (set, get) => {
            // Lier le moteur audio au store local pour l'UI réactive
            // @ts-expect-error onStateChange is private but we bind it here
            musicEngine.deckA.onStateChange = (s) => set((state) => ({ deckA: { ...state.deckA, isPlaying: s.isPlaying } }));
            // @ts-expect-error onStateChange is private but we bind it here
            musicEngine.deckB.onStateChange = (s) => set((state) => ({ deckB: { ...state.deckB, isPlaying: s.isPlaying } }));

            /*
              **La normalisation : le moteur demande, le store repond.** Le
              moteur n'importe aucun store — c'est le store qui lui pose ses
              rappels, comme pour `onStateChange`. Sans quoi on refermerait le
              cycle qui casse deja les tests du ducking.
            */
            for (const platine of [musicEngine.deckA, musicEngine.deckB]) {
                platine.sonieDe = (piste) => get().sonies[piste] ?? null;
                platine.reglageDeNormalisation = () => ({
                    actif: get().normalisation, cible: get().cibleDeSonie,
                });
                platine.onSonieMesuree = (piste, lufs) => get().setSonie(piste, lufs);
            }
            void musicEngine.preparerLaSonie();

            return {
                playlists: [
                    {
                        id: 'default', name: 'Exploration', pads: Array(5).fill(null).map((_, i) => ({
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
                sonies: {},
                normalisation: false,
                cibleDeSonie: -18,

                setSonie: (piste, lufs) => {
                    /*
                      On n'ecrit que si la valeur a bouge d'au moins un dixieme
                      de dB : la sonde affine sa mesure chaque seconde, et
                      persister a chaque affinement ferait ecrire le disque
                      soixante fois par morceau pour rien.
                    */
                    const ancienne = get().sonies[piste];
                    if (ancienne !== undefined && Math.abs(ancienne - lufs) < 0.1) return;
                    set((state) => ({ sonies: { ...state.sonies, [piste]: lufs } }));
                },

                basculerLaNormalisation: (actif) => {
                    set((state) => ({ normalisation: actif !== undefined ? actif : !state.normalisation }));
                    musicEngine.rejouerLaNormalisation();
                },
                history: [],
                consoleLogs: [],

                // Key Learn UI State
                isKeyLearnActive: false,
                activePadLearnInfo: null,
                toggleKeyLearn: () => set((state) => ({ isKeyLearnActive: !state.isKeyLearnActive, activePadLearnInfo: null })),
                setActiveLearnPad: (playlistId, padIndex) => set({ activePadLearnInfo: playlistId && padIndex !== null ? { playlistId, padIndex } : null }),

                /**
                 * **La transition, désormais d'un seul tenant dans le moteur.**
                 *
                 * `autoFadeTarget` était un drapeau que le magasin posait et
                 * qu'un `useEffect` du composant `Mixer` consommait pour lancer
                 * *le vrai* travail : animer le curseur, puis arrêter la platine
                 * sortante. **Écran fermé, personne ne le consommait** — la
                 * platine sortante jouait indéfiniment, et le drapeau périmé
                 * faussait ensuite le choix de la platine suivante.
                 *
                 * Il ne reste ici que ce qui appartient au magasin : lancer la
                 * lecture, demander la transition, tenir le journal.
                 */
                triggerAutoFade: async (target) => {
                    await musicEngine.resume();
                    await get().playDeck(target);
                    musicEngine.crossfadeTo(target, get().autoFadeDuration);
                    set({ crossfader: positionDeLaPlatine(target) });
                    get().addLog(`Transition auto vers Deck ${target}`);
                },



                setCrossfader: (value) => {
                    const val = Math.max(0, Math.min(1, value));
                    musicEngine.setCrossfader(val);
                    set({ crossfader: val });
                },

                setMasterVolume: (value, fonduMs) => {
                    const val = Math.max(0, Math.min(1, value));
                    musicEngine.setMasterVolume(val, fonduMs);
                    set({ masterVolume: val });
                },

                setAutoFadeDuration: (value) => set({ autoFadeDuration: value }),

                setOutputDevice: (deviceId) => {
                    musicEngine.setOutputDevice(deviceId);
                    set({ outputDeviceId: deviceId });
                },

                /**
                 * `campagneId` non fourni : la playlist naît **commune**.
                 *
                 * L'écran, lui, passe la campagne ouverte — une atmosphère
                 * créée pendant qu'on prépare Hadley Hope lui appartient. Mais
                 * le magasin ne va pas la chercher lui-même : il ignore
                 * `useSessionOSStore`, et doit continuer à l'ignorer (ce
                 * fichier porte déjà deux imports différés pour cause de
                 * cycle).
                 */
                addPlaylist: (name, campagneId = null) => set((state) => ({
                    playlists: [...state.playlists, {
                        id: crypto.randomUUID(),
                        name,
                        campagneId,
                        pads: Array(5).fill(null).map((_, i) => ({
                            id: crypto.randomUUID(),
                            label: `Pad ${i + 1}`,
                            url: '',
                            type: 'local',
                            loopA: null,
                            loopB: null,
                            linkedLightSceneId: undefined
                        }))
                    }]
                })),

                removePlaylist: (id) => set((state) => ({
                    playlists: state.playlists.filter(p => p.id !== id)
                })),

                assignerLaPlaylist: (id, campagneId) => set((state) => ({
                    playlists: state.playlists.map(p => p.id === id ? { ...p, campagneId } : p)
                })),

                updatePad: (playlistId, padIndex, padData) => set((state) => {
                    const newPlaylists = state.playlists.map(p =>
                        p.id === playlistId
                            ? { ...p, pads: p.pads.map((pd, i) => i === padIndex ? { ...pd, ...padData } : pd) }
                            : p
                    );

                    // Sync Deck labels if renamed
                    const updatedPlaylist = newPlaylists.find(p => p.id === playlistId);
                    const updatedPad = updatedPlaylist?.pads[padIndex];
                    
                    let deckA = state.deckA;
                    let deckB = state.deckB;

                    if (updatedPad) {
                        if (state.deckA.activePadId === updatedPad.id) {
                            deckA = { ...state.deckA, activeTrackLabel: updatedPad.label };
                        }
                        if (state.deckB.activePadId === updatedPad.id) {
                            deckB = { ...state.deckB, activeTrackLabel: updatedPad.label };
                        }
                    }

                    return { playlists: newPlaylists, deckA, deckB };
                }),

                definirLaPlageDuPad: (padId, entree, sortie) => {
                    set((state) => ({
                        playlists: state.playlists.map(p => ({
                            ...p,
                            pads: p.pads.map(pd => pd.id === padId ? { ...pd, loopA: entree, loopB: sortie } : pd)
                        }))
                    }));

                    /*
                      **Les deux platines, et pas seulement celle d'où vient le
                      geste.** Le même pad peut être chargé des deux côtés — le
                      préchargement existe précisément pour ça. Ne prévenir
                      qu'une platine laisserait l'autre jouer le morceau entier
                      en croyant respecter la plage.
                    */
                    const state = get();
                    if (state.deckA.activePadId === padId) musicEngine.deckA.definirLaPlage(entree, sortie);
                    if (state.deckB.activePadId === padId) musicEngine.deckB.definirLaPlage(entree, sortie);
                },

                ajouterUnPad: (playlistId) => set((state) => ({
                    playlists: state.playlists.map(p => p.id === playlistId
                        ? {
                            ...p,
                            pads: [...p.pads, {
                                id: crypto.randomUUID(),
                                /*
                                  Le numéro suit la POSITION et non un compteur :
                                  une pastille retirée au milieu ne doit pas
                                  laisser un trou dans la numérotation de la
                                  suivante. C'est un nom de départ, que le
                                  meneur remplacera en déposant un fichier.
                                */
                                label: `Pad ${p.pads.length + 1}`,
                                url: '',
                                type: 'local' as const,
                                loopA: null,
                                loopB: null,
                                linkedLightSceneId: undefined
                            }]
                        }
                        : p)
                })),

                /*
                  ⚠️ **Retirer une pastille ne touche PAS aux platines.** Si
                  celle-ci jouait, elle continue — le son ne s'arrête pas parce
                  qu'on a rangé la grille, et la platine garde son morceau
                  jusqu'à ce qu'on l'arrête. *Couper le son sur un geste
                  d'organisation serait la pire surprise possible en séance.*
                */
                retirerUnPad: (playlistId, padIndex) => set((state) => ({
                    playlists: state.playlists.map(p => p.id === playlistId
                        ? { ...p, pads: p.pads.filter((_, i) => i !== padIndex) }
                        : p)
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
                        console.log(`[MusicStore] Loading pad ${pad.id} to deck ${deck}: ${pad.url}`);
                        get().addLog(`Chargement ${deck}: ${pad.label}`);
                        
                        // Force l'activation de l'audio sur interaction utilisateur
                        await musicEngine.resume();

                        /*
                          **La plage se repose APRÈS le chargement, toujours.**
                          `loadTrack` efface celle de la piste précédente — elle
                          découpait un autre morceau — donc c'est ici, et nulle
                          part ailleurs, que celle du pad entre en vigueur.
                        */
                        if (deck === 'A') {
                            await musicEngine.deckA.loadTrack(pad.url);
                            musicEngine.deckA.definirLaPlage(pad.loopA, pad.loopB);
                            set((state) => ({ deckA: { ...state.deckA, activePadId: pad.id, activeTrackLabel: pad.label } }));
                        } else {
                            await musicEngine.deckB.loadTrack(pad.url);
                            musicEngine.deckB.definirLaPlage(pad.loopA, pad.loopB);
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


                stopAll: async () => {
                    const duration = get().autoFadeDuration;
                    musicEngine.deckA.fadeOut(duration);
                    musicEngine.deckB.fadeOut(duration);
                    get().addLog("ARRÊT TOTAL (Progressif)");

                    // 5. Revert Lights if sync enabled
                    try {
                        const { useLightStore } = await import('../light/useLightStore');
                        const { hueEngine } = await import('../light/HueEngine');
                        const { isSyncEnabled } = useLightStore.getState();
                        if (isSyncEnabled) {
                            hueEngine.revertToManualScene();
                        }
                    } catch (e) {
                        console.error("[MusicStore] Light reversion failed", e);
                    }
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

                playPad: async (pad: MusicPad, sortie?: string, isAutomatic = false) => {
                    if (!pad.url) {
                        get().addLog(`Piste ignorée : pas de fichier pour "${pad.label}"`);
                        return;
                    }

                    await musicEngine.resume();

                    // Detection link externe (YouTube, etc.)
                    const isService = musicEngine.isStreamingService(pad.url);

                    if (isService) {
                        get().addLog(`Ouverture lien externe : ${pad.label}`);
                        get().stopAll(); // Trigger fade-out of current music

                        if (window.appBridge?.web?.openExternal) {
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

                    /*
                      2. La platine qui accueille : celle qu'on n'entend pas.

                      La position vient du **moteur**, pas du magasin : pendant
                      un fondu elle se calcule sur l'horloge audio, et c'est la
                      seule qui dise où en est réellement le son. L'ancien code
                      consultait d'abord `autoFadeTarget`, un drapeau qu'un
                      composant devait penser à effacer — périmé, il choisissait
                      la platine à l'envers.
                    */
                    const targetDeck = platineDeDestination(musicEngine.positionDuCrossfader());

                    // 3. Charger, router, déclencher
                    await get().loadToDeck(targetDeck, pad);
                    // La sortie se pose avant le fondu : la platine doit déjà
                    // viser la bonne enceinte quand le crossfader la fait monter.
                    musicEngine.routerLaPlatine(targetDeck, sortie);
                    await get().triggerAutoFade(targetDeck);

                    if (!isAutomatic) {
                        useJournalStore.getState().addEvent({
                            type: 'AUDIO',
                            title: `Musique : ${pad.label}`,
                            content: `Lecture de la piste "${pad.label}" sur le Deck ${targetDeck}.`,
                            metadata: { padId: pad.id, deck: targetDeck }
                        });
                    }

                    // 4. Trigger Light if linked and sync enabled
                    try {
                        const { useLightStore } = await import('../light/useLightStore');
                        const { hueEngine } = await import('../light/HueEngine');
                        const { isSyncEnabled } = useLightStore.getState();

                        if (isSyncEnabled && pad.linkedLightSceneId) {
                            /* ⛔ **Par la porte unique, et le délai est la raison
                               pour laquelle la réservation survit au déclenchement** :
                               ces 300 ms arrivent après la fin du moment, et
                               écraseraient sa lumière. Voir `DELAI_DE_RELACHE_MS`. */
                            const { appliquerLaSceneLiee } = await import('../light/logic/lumiereReservee');
                            // Delay to let audio loading/decoding breathe
                            setTimeout(() => {
                                appliquerLaSceneLiee(hueEngine, pad.linkedLightSceneId);
                            }, 300);
                        }
                    } catch (e) {
                        console.warn("[MusicStore] Light trigger skipped or failed", e);
                    }
                },

                addLog: (message: string) => {
                    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
                    const log = `[${time}] ${message}`;
                    set((state) => ({
                        consoleLogs: [log, ...state.consoleLogs].slice(0, 40)
                    }));
                },

                setActivePlaylistId: (id: string) => set({ activePlaylistId: id }),

                renamePlaylist: (id: string, name: string) => set((state) => ({
                    playlists: state.playlists.map(p => p.id === id ? { ...p, name } : p)
                })),

                applySnapshot: async (snapshot) => {
                    if (!snapshot) return;
                    
                    try {
                        // 1. Volumes and Crossfader
                        if (snapshot.masterVolume !== undefined) get().setMasterVolume(snapshot.masterVolume);
                        if (snapshot.crossfader !== undefined) get().setCrossfader(snapshot.crossfader);
                        
                        // 2. Playlists and Active Playlist
                        /*
                          ⛔ **On fusionne, on ne remplace plus en bloc.** Et
                          c'est ici que le défaut coûtait le plus cher : les
                          playlists appartiennent à une campagne depuis le
                          2026-08-30, donc restaurer une séance d'une campagne
                          pouvait effacer les atmosphères d'une autre.
                          Voir `logic/instantaneDeSeance.ts`.
                        */
                        if (snapshot.playlists) {
                            set(state => ({
                                playlists: playlistsApresInstantane(state.playlists, snapshot.playlists),
                            }));
                        }
                        if (snapshot.activePlaylistId) set({ activePlaylistId: snapshot.activePlaylistId });

                        // 3. Decks
                        // Note: Loading might be async and depends on URL being valid
                        if (snapshot.deckA?.activePadId) {
                            const pad = get().playlists.flatMap(p => p.pads).find(p => p.id === snapshot.deckA?.activePadId);
                            if (pad) {
                                await get().loadToDeck('A', pad);
                                if (snapshot.deckA.isPlaying) await get().playDeck('A');
                            }
                        }

                        if (snapshot.deckB?.activePadId) {
                            const pad = get().playlists.flatMap(p => p.pads).find(p => p.id === snapshot.deckB?.activePadId);
                            if (pad) {
                                await get().loadToDeck('B', pad);
                                if (snapshot.deckB.isPlaying) await get().playDeck('B');
                            }
                        }
                    } catch (err) {
                        console.error("MusicStore: Failed to apply snapshot", err);
                    }
                },

                reset: () => {
                    get().stopAll();
                    set({
                        playlists: [
                            {
                                id: 'default', name: 'Exploration', pads: Array(5).fill(null).map((_, i) => ({
                                    id: `pad-${i}`,
                                    label: `Pad ${i + 1}`,
                                    url: '',
                                    type: 'local',
                                    loopA: null,
                                    loopB: null,
                                    linkedLightSceneId: undefined
                                }))
                            }
                        ],
                        activePlaylistId: 'default',
                        deckA: { activePadId: null, activeTrackLabel: null, volume: 1.0, isLooping: true, isPlaying: false },
                        deckB: { activePadId: null, activeTrackLabel: null, volume: 1.0, isLooping: true, isPlaying: false },
                        crossfader: 0.5,
                        history: [],
                        consoleLogs: [],
                    });
                    get().addLog("Module réinitialisé");
                }
            }
        },

        {
            name: 'gmos-music-storage',
            partialize: (state) => ({
                playlists: state.playlists,
                crossfader: state.crossfader,
                masterVolume: state.masterVolume,
                autoFadeDuration: state.autoFadeDuration,
                outputDeviceId: state.outputDeviceId,
                sonies: state.sonies,
                normalisation: state.normalisation,
                cibleDeSonie: state.cibleDeSonie
            }),
            version: 1,
            migrate: (persistedState: any, version: number) => {
                // Handle both null (no previous version) and 0 (initial version)
                if (version === 0 || version === null || version === undefined) {
                    console.log('[MusicStore] Migrating storage to v1...');
                    const state = persistedState as any;
                    if (state && state.playlists) {
                        state.playlists = state.playlists.map((p: any) => ({
                            ...p,
                            pads: p.pads.map((pad: any) => {
                                // Migrate old lightLinkId to linkedLightSceneId
                                if (pad.lightLinkId !== undefined && pad.linkedLightSceneId === undefined) {
                                    const { lightLinkId, ...rest } = pad;
                                    return { ...rest, linkedLightSceneId: lightLinkId || undefined };
                                }
                                return pad;
                            })
                        }));
                        console.log('[MusicStore] Migration complete.', state.playlists);
                    }
                    return state ?? persistedState;
                }
                return persistedState;
            },
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('[MusicStore] Rehydrated from storage. Playlists:', state.playlists?.map(p => ({
                        name: p.name,
                        pads: p.pads.map(pad => ({ label: pad.label, linkedLightSceneId: pad.linkedLightSceneId }))
                    })));
                }
            }
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useMusicStore: typeof useMusicStore }).useMusicStore = useMusicStore;
}
