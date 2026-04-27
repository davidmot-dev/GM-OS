import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientState {
    deviceId: string;
    pseudo: string;
    role: 'combat' | 'narrative' | 'player' | 'remote';
    status: 'active' | 'ghost' | 'disconnected';
    isOnboarded: boolean;
    characterId: string | null;
    playerName: string;
    lastError: string | null;
    
    // Actions
    setPseudo: (pseudo: string) => void;
    setPlayerName: (name: string) => void;
    setCharacterId: (id: string | null) => void;
    setRole: (role: ClientState['role']) => void;
    setStatus: (status: ClientState['status']) => void;
    completeOnboarding: () => void;
    setLastError: (error: string | null) => void;
    resetIdentity: () => void;
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
    } catch (e) {}
    
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

            setPseudo: (pseudo) => set({ pseudo }),
            setPlayerName: (playerName) => set({ playerName }),
            setCharacterId: (characterId) => set({ characterId }),
            setRole: (role) => set({ role }),
            setStatus: (status) => set({ status }),
            completeOnboarding: () => set({ isOnboarded: true }),
            setLastError: (lastError) => set({ lastError }),
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
                    lastError: null
                });
            },
            logout: () => set({
                // Keep deviceId!
                pseudo: '',
                status: 'disconnected',
                isOnboarded: false,
                characterId: null,
                playerName: '',
                lastError: null
            }),
        }),
        {
            name: 'gm-os-client-id', // Unique name for localStorage
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useClientStore = useClientStore;
}
