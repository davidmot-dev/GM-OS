import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InventoryItem } from '../modules/session/useSessionOSStore';

interface LootStoreState {
    lastLoot: InventoryItem[];
    isLootProjected: boolean;
    projectionTrigger: number;
    tableName: string;
    
    setLastLoot: (items: InventoryItem[], tableName: string) => void;
    setIsLootProjected: (projected: boolean) => void;
    triggerLootProjection: () => void;
    clearLoot: () => void;
}

export const useLootStore = create<LootStoreState>()(
    persist(
        (set) => ({
            lastLoot: [],
            isLootProjected: false,
            projectionTrigger: 0,
            tableName: '',
            
            setLastLoot: (items, tableName) => set({ 
                lastLoot: items, 
                tableName,
                projectionTrigger: Date.now() 
            }),
            setIsLootProjected: (isLootProjected) => set({ isLootProjected }),
            triggerLootProjection: () => set({ projectionTrigger: Date.now() }),
            clearLoot: () => set({ lastLoot: [], isLootProjected: false, projectionTrigger: 0, tableName: '' })
        }),
        {
            name: 'gmos-loot-storage'
        }
    )
);

// Cross-store access for the Bridge
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useLootStore = useLootStore;
}
