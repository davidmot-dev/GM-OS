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
    
    // Actions
    setPseudo: (pseudo: string) => void;
    setPlayerName: (name: string) => void;
    setCharacterId: (id: string | null) => void;
    setRole: (role: ClientState['role']) => void;
    setStatus: (status: ClientState['status']) => void;
    completeOnboarding: () => void;
    resetIdentity: () => void;
}

// Generate a simple UUID if crypto.randomUUID is not available (fallback)
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useClientStore = create<ClientState>()(
    persist(
        (set) => ({
            deviceId: generateUUID(),
            pseudo: '',
            role: 'player',
            status: 'disconnected',
            isOnboarded: false,
            characterId: null,
            playerName: '',

            setPseudo: (pseudo) => set({ pseudo }),
            setPlayerName: (playerName) => set({ playerName }),
            setCharacterId: (characterId) => set({ characterId }),
            setRole: (role) => set({ role }),
            setStatus: (status) => set({ status }),
            completeOnboarding: () => set({ isOnboarded: true }),
            resetIdentity: () => set({
                deviceId: generateUUID(),
                pseudo: '',
                role: 'player',
                status: 'disconnected',
                isOnboarded: false,
                characterId: null,
                playerName: ''
            }),
        }),
        {
            name: 'gm-os-client-id', // Unique name for localStorage
        }
    )
);
