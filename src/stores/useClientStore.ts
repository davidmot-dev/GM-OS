import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { exposerMagasinDuHub } from '../utils/magasinsDuHub';

interface ClientState {
    deviceId: string;
    pseudo: string;
    role: 'combat' | 'narrative' | 'player' | 'remote';
    status: 'active' | 'ghost' | 'disconnected';
    isOnboarded: boolean;
    characterId: string | null;
    playerName: string;
    lastError: string | null;
    /** Pourquoi le serveur a refusé : `reprise_refusee` propose de se présenter comme un nouvel appareil. */
    lastErrorCode: string | null;
    
    // Actions
    setPseudo: (pseudo: string) => void;
    setPlayerName: (name: string) => void;
    setCharacterId: (id: string | null) => void;
    setRole: (role: ClientState['role']) => void;
    setStatus: (status: ClientState['status']) => void;
    completeOnboarding: () => void;
    setLastError: (error: string | null, code?: string | null) => void;
    resetIdentity: () => void;
    /**
     * **Se présenter comme un nouvel appareil** (2026-10-22). Le serveur refuse un
     * identifiant connu qui revient sans son jeton de reprise — la protection du
     * transport privé (`a128c7af`). Le message disait « utilise un nouvel appareil »
     * sans que rien ne permette d'en changer : la tablette restait bloquée.
     */
    nouvelAppareil: () => void;
    logout: () => void;
}

// Generate a simple UUID if crypto.randomUUID is not available (fallback)
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Super-stable ID: Check a dedicated key first, then the store key, then generate.
// This prevents ID loss even if the main store persistence fails or is cleared.
const getStableDeviceId = () => {
    if (typeof window === 'undefined') return 'server-side';
    
    // 1. Check dedicated hardware-like key
    const dedicated = localStorage.getItem('gmos-tablet-uuid');
    if (dedicated) return dedicated;
    
    // 2. Check legacy store key (migration fallback)
    try {
        const legacy = localStorage.getItem('gm-os-client-id');
        if (legacy) {
            const parsed = JSON.parse(legacy);
            const id = parsed.state?.deviceId || parsed.deviceId;
            if (id) {
                localStorage.setItem('gmos-tablet-uuid', id);
                return id;
            }
        }
    } catch {
        // Un stockage indisponible n'empêche pas de créer l'identifiant local.
    }
    
    // 3. Generate and persist new stable ID
    const newId = generateUUID();
    localStorage.setItem('gmos-tablet-uuid', newId);
    return newId;
};

export const useClientStore = create<ClientState>()(
    persist(
        (set) => ({
            deviceId: getStableDeviceId(),
            pseudo: '',
            role: 'player',
            status: 'disconnected',
            isOnboarded: false,
            characterId: null,
            playerName: '',
            lastError: null,
            lastErrorCode: null,

            setPseudo: (pseudo) => set({ pseudo }),
            setPlayerName: (playerName) => set({ playerName }),
            setCharacterId: (characterId) => set({ characterId }),
            setRole: (role) => set({ role }),
            setStatus: (status) => set({ status }),
            completeOnboarding: () => set({ isOnboarded: true }),
            setLastError: (lastError, lastErrorCode = null) => set({ lastError, lastErrorCode: lastError ? lastErrorCode : null }),
            resetIdentity: () => {
                const stableId = getStableDeviceId(); // Keep existing if possible
                set({
                    deviceId: stableId,
                    pseudo: '',
                    role: 'player',
                    status: 'disconnected',
                    isOnboarded: false,
                    characterId: null,
                    playerName: '',
                    lastError: null,
                    lastErrorCode: null
                });
            },
            nouvelAppareil: () => {
                const id = generateUUID();
                try { localStorage.setItem('gmos-tablet-uuid', id); } catch { /* L'identifiant vaut pour cette session. */ }
                // Un nouvel identifiant : la tablette se réinscrit d'elle-même (`useHubSync`).
                set({ deviceId: id, pseudo: '', status: 'disconnected', isOnboarded: false, characterId: null, playerName: '', lastError: null, lastErrorCode: null });
            },
            logout: () => set({
                // Keep deviceId!
                pseudo: '',
                status: 'disconnected',
                isOnboarded: false,
                characterId: null,
                playerName: '',
                lastError: null,
                lastErrorCode: null
            }),
        }),
        {
            name: 'gm-os-client-id', // Unique name for localStorage
        }
    )
);

exposerMagasinDuHub('useClientStore', useClientStore);
