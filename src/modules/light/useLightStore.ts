import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ----------------------
// Types & Interfaces
// ----------------------

/** Statut de connexion au pont Philips Hue */
export type ConnectionStatus = 'disconnected' | 'discovering' | 'pairing' | 'connected' | 'mock';

/**
 * État détaillé d'une ampoule individuelle.
 */
export interface HueLightState {
    /** Indique si la lampe est allumée */
    on: boolean;
    /** Luminosité (0-254) */
    bri: number; 
    /** Coordonnées de couleur dans l'espace CIE */
    xy?: [number, number]; 
    /** Température de couleur (Mireds) */
    ct?: number; 
    /** Effet logiciel appliqué (ex: 'candle', 'warp', 'police') */
    effect?: string; 
}

/**
 * Représente une ampoule Hue physique.
 */
export interface HueLight {
    id: string;
    /** Nom défini dans l'application Hue */
    name: string;
    /** Type de matériel (ex: 'Extended color light') */
    type: string;
    /** État actuel de la lampe */
    state: HueLightState;
}

/**
 * Scène d'ambiance GM-OS enregistrant l'état de plusieurs lampes.
 */
export interface LightScene {
    /** Identifiant de scène (SCENE_01 à SCENE_18) */
    id: string; 
    /** Nom personnalisé par le MJ */
    name: string;
    /** Icône représentative */
    icon: string;
    /** Couleur hexadécimale pour le retour visuel dans l'interface */
    color: string; 
    /** États des lampes enregistrés pour cette scène */
    lightStates: Record<string, HueLightState>; 
    /** Code touche MIDI/Clavier associé (Key Learn) */
    keyCode?: string; 
}

/**
 * Interface d'état globale pour le Light-OS (Atmosphère).
 */
interface LightState {
    // Connection
    /** Adresse IP locale du pont Hue identifié */
    bridgeIp: string | null;
    /** Nom d'utilisateur (API Key) généré lors de l'appairage */
    username: string | null;
    /** Statut actuel du cycle de connexion */
    status: ConnectionStatus;

    // Devices
    /** Liste des lampes découvertes sur le pont */
    lights: Record<string, HueLight>;

    // Global Control
    /** Multiplicateur de luminosité globale (0 à 100%) */
    globalBrightness: number; 
    /** Durée par défaut des transitions entre scènes (ms) */
    transitionTimeMs: number; 

    // Scenes
    /** Catalogue des 18 scènes disponibles */
    scenes: Record<string, LightScene>;
    /** ID de la scène actuellement active sur le système */
    activeSceneId: string | null;
    /** Dernière scène activée manuellement par l'utilisateur */
    lastManualSceneId: string | null;

    // Actions - Connection
    /** Met à jour les paramètres de connexion au pont */
    setConnection: (status: ConnectionStatus, ip?: string | null, username?: string | null) => void;

    // Actions - Devices
    /** Définit la liste des lampes disponibles */
    setLights: (lights: Record<string, HueLight>) => void;
    /** Modifie l'état d'une lampe spécifique */
    updateLightState: (id: string, state: Partial<HueLightState>) => void;

    // Actions - Global
    setGlobalBrightness: (val: number) => void;
    setTransitionTime: (ms: number) => void;

    // Actions - Scenes
    /** Capture l'état actuel de toutes les lampes dans une scène */
    saveSceneSnapshot: (sceneId: string, currentLights: Record<string, HueLight>) => void;
    /** Met à jour le nom, l'icône ou la couleur d'une scène */
    updateSceneMetadata: (sceneId: string, name: string, icon: string, color: string) => void;
    /** Active une scène sur le pont physique */
    setActiveScene: (sceneId: string | null, isAutomatic?: boolean) => void;
    /** Réinitialise une scène aux valeurs par défaut */
    clearScene: (sceneId: string) => void;
    /** Indique si la synchronisation avec d'autres modules (ex: Combat) est active */
    isSyncEnabled: boolean;
    setSyncEnabled: (val: boolean) => void;
    /** Restaure l'état d'éclairage à partir d'un snapshot de session */
    applySnapshot: (snapshot: {
        activeSceneId?: string | null;
        globalBrightness?: number;
        scenes?: Record<string, LightScene>;
    }) => void;
    /** Oublie les identifiants de connexion du pont */
    forgetBridge: () => void;
    /** Réinitialise complètement le store */
    reset: () => void;
    /** Synchronise le token de connexion avec le trousseau natif */
    syncWithKeychain: () => Promise<void>;
}


// ----------------------
// Initial State
// ----------------------

const createDefaultScenes = (): Record<string, LightScene> => {
    const scenes: Record<string, LightScene> = {};
    for (let i = 1; i <= 18; i++) {
        const id = `SCENE_${i.toString().padStart(2, '0')}`;
        scenes[id] = {
            id,
            name: `Scene ${i}`,
            icon: 'wb_incandescent',
            color: '#334155', // slate-700
            lightStates: {}
        };
    }
    return scenes;
};

export const useLightStore = create<LightState>()(
    persist(
        (set, get) => ({
            bridgeIp: null,
            username: null,
            status: 'disconnected',

            lights: {},

            globalBrightness: 100,
            transitionTimeMs: 5000,

            scenes: createDefaultScenes(),
            activeSceneId: null,
            lastManualSceneId: null,
            isSyncEnabled: true, // Enabled by default

            setConnection: (status, ip, username) => {
                // Sécurité : Si un username (token Hue) est fourni, on l'enregistre dans le trousseau natif
                if (username && window.appBridge?.security) {
                    console.log(`[Light OS] 🛡️ Token reçu. Enregistrement dans le trousseau...`);
                    window.appBridge.security.saveSecret('hue-bridge-token', username);
                } else if (username === null) {
                    // Note : On ne supprime PAS du trousseau ici, seul forgetBridge le fait.
                    // On vide seulement la mémoire vive pour cette session.
                    console.log(`[Light OS] 💡 Statut déconnecté ou erreur : Nettoyage du token en mémoire vive.`);
                }

                set((state) => ({
                    status,
                    bridgeIp: ip !== undefined ? ip : state.bridgeIp,
                    // On ne stocke pas le username dans l'état persistant
                    username: username !== undefined ? username : state.username
                }));
            },

            setLights: (lights) => set({ lights }),

            updateLightState: (id, newState) => set((state) => {
                if (!state.lights[id]) return state;
                return {
                    lights: {
                        ...state.lights,
                        [id]: {
                            ...state.lights[id],
                            state: { ...state.lights[id].state, ...newState }
                        }
                    }
                };
            }),

            setGlobalBrightness: (val) => set({ globalBrightness: Math.max(0, Math.min(100, val)) }),

            setTransitionTime: (ms) => set({ transitionTimeMs: ms }),

            saveSceneSnapshot: (sceneId, currentLights) => set((state) => {
                const snapshot: Record<string, HueLightState> = {};
                Object.keys(currentLights).forEach(id => {
                    snapshot[id] = { ...currentLights[id].state };
                });
                return {
                    scenes: {
                        ...state.scenes,
                        [sceneId]: {
                            ...state.scenes[sceneId],
                            lightStates: snapshot
                        }
                    }
                };
            }),

            updateSceneMetadata: (sceneId, name, icon, color) => set((state) => ({
                scenes: {
                    ...state.scenes,
                    [sceneId]: {
                        ...state.scenes[sceneId],
                        name, icon, color
                    }
                }
            })),

            setActiveScene: (sceneId: string | null, isAutomatic = false) => set((state) => ({ 
                activeSceneId: sceneId,
                lastManualSceneId: isAutomatic ? state.lastManualSceneId : sceneId
            })),

            clearScene: (sceneId: string) => set((state) => ({
                scenes: {
                    ...state.scenes,
                    [sceneId]: {
                        ...state.scenes[sceneId],
                        name: `Scene ${parseInt(sceneId.split('_')[1])}`,
                        icon: 'wb_incandescent',
                        color: '#334155',
                        lightStates: {}
                    }
                }
            })),

            setSyncEnabled: (val: boolean) => set({ isSyncEnabled: val }),

            forgetBridge: () => {
                if (window.appBridge?.security) {
                    window.appBridge.security.deleteSecret('hue-bridge-token');
                }
                set({
                    bridgeIp: null,
                    username: null,
                    status: 'disconnected',
                    lights: {}
                });
            },

            applySnapshot: (snapshot) => {

                if (!snapshot) return;

                // 1. Restore the structures (all 18 scenes metadata and light states)
                if (snapshot.scenes) {
                    set({ scenes: snapshot.scenes });
                }

                if (snapshot.globalBrightness !== undefined) {
                    set({ globalBrightness: snapshot.globalBrightness });
                }

                if (snapshot.activeSceneId) {
                    // We don't call HueEngine here directly to avoid circular deps or complex logic in store
                    // But we set the active scene which UI will reflect
                    set({ activeSceneId: snapshot.activeSceneId });
                }
            },

            reset: () => {
                set({
                    scenes: createDefaultScenes(),
                    activeSceneId: null,
                    lastManualSceneId: null,
                    globalBrightness: 100,
                    transitionTimeMs: 5000,
                    isSyncEnabled: true
                });
            },

            syncWithKeychain: async () => {
                const security = window.appBridge?.security;
                if (!security) {
                    console.warn('[Light OS] 🛡️ API Security non disponible (Bridge absent)');
                    return;
                }

                console.log('[Light OS] 🔐 Synchronisation avec le trousseau...');
                const state = get();

                // 2. Récupération : On charge le token depuis le trousseau
                try {
                    const securedToken = await security.getSecret('hue-bridge-token');
                    console.log(`[Light OS] 🔐 Keychain Get Result:`, { 
                        type: typeof securedToken, 
                        exists: !!securedToken,
                        content: securedToken ? (securedToken.substring(0, 5) + '...') : 'EMPTY'
                    });

                    if (securedToken && typeof securedToken === 'string' && securedToken.length > 0) {
                        console.log('[Light OS] ✅ TOKEN_FOUND : Restauration immédiate.');
                        set({ username: securedToken });
                    } else {
                        console.log('[Light OS] ℹ️ Aucun jeton trouvé dans le trousseau natif.');
                        // Si on a un jeton en mémoire mais pas dans le keychain, on le sauvegarde (Migration)
                        if (state.username) {
                            console.log('[Light OS] 💾 Migration : Sauvegarde du jeton présent en mémoire vers le Keychain.');
                            await security.saveSecret('hue-bridge-token', state.username);
                        }
                    }
                } catch (err) {
                    console.error('[Light OS] ❌ Erreur critique Keychain:', err);
                }
            }
        }),
        {
            name: 'gm-os-light-storage-v1',
            partialize: (state) => ({
                bridgeIp: state.bridgeIp,
                // On ne mentionne PAS username ici pour éviter tout écrasement par undefined au chargement
                scenes: state.scenes,
                globalBrightness: state.globalBrightness,
                transitionTimeMs: state.transitionTimeMs,
                isSyncEnabled: state.isSyncEnabled,
                lastManualSceneId: state.lastManualSceneId
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useLightStore: typeof useLightStore }).useLightStore = useLightStore;
}
