import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientState {
    deviceId: string;
    pseudo: string;
    role: 'combat' | 'narrative' | 'player' | 'remote';
    status: 'active' | 'ghost' | 'disconnected';
    isOnboarded: boolean;
    
    // Actions
    setPseudo: (pseudo: string) => void;
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

            setPseudo: (pseudo) => set({ pseudo }),
            setRole: (role) => set({ role }),
            setStatus: (status) => set({ status }),
            completeOnboarding: () => set({ isOnboarded: true }),
            resetIdentity: () => set({
                deviceId: generateUUID(),
                pseudo: '',
                role: 'player',
                status: 'disconnected',
                isOnboarded: false
            }),
        }),
        {
            name: 'gm-os-client-id', // Unique name for localStorage
        }
    )
);
