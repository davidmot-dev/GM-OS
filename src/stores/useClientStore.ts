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
    
    setPseudo: (pseudo: string) => void;
    setPlayerName: (name: string) => void;
    setCharacterId: (id: string | null) => void;
    setRole: (role: ClientState['role']) => void;
    setStatus: (status: ClientState['status']) => void;
    completeOnboarding: () => void;
    setLastError: (error: string | null) => void;
    resetIdentity: () => void;
}

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
            lastError: null,

            setPseudo: (pseudo) => set({ pseudo }),
            setPlayerName: (playerName) => set({ playerName }),
            setCharacterId: (characterId) => set({ characterId }),
            setRole: (role) => set({ role }),
            setStatus: (status) => set({ status }),
            completeOnboarding: () => set({ isOnboarded: true }),
            setLastError: (lastError) => set({ lastError }),
            resetIdentity: () => set({
                deviceId: generateUUID(),
                pseudo: '',
                role: 'player',
                status: 'disconnected',
                isOnboarded: false,
                characterId: null,
                playerName: '',
                lastError: null
            }),
        }),
        {
            name: 'gm-os-client-id',
        }
    )
);
