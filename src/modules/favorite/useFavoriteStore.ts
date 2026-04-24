import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FavoriteType = 'npc' | 'place' | 'item' | 'lore';

export interface FavoriteEntity {
    id: string;
    type: FavoriteType;
    name: string;
    subtitle?: string;
    imageUrl?: string; 
    tokenUrl?: string; 
    lastViewed?: number; 
    attributes?: Record<string, string | number>; 
    stats?: Record<string, number>; 
    lore?: string;
    secretNotes?: string;
    isStarred?: boolean;
    isSyncedToPlayerHub?: boolean;
    campaignId?: string;
    ownerId?: string;
    dialoguePrep?: string[];
}

interface FavoriteState {
    favorites: FavoriteEntity[];
    selectedFavoriteId: string | null;
    activeCategory: FavoriteType | 'all';
    searchQuery: string;
    viewMode: 'grid' | 'detail';

    addFavorite: (entity: Omit<FavoriteEntity, 'id' | 'lastViewed'>) => string;
    updateFavorite: (id: string, updates: Partial<FavoriteEntity>) => void;
    removeFavorite: (id: string) => void;
    selectFavorite: (id: string | null) => void;
    setCategory: (category: FavoriteType | 'all') => void;
    setSearchQuery: (query: string) => void;
    toggleStar: (id: string) => void;
    setViewMode: (mode: 'grid' | 'detail') => void;
    clearAllHubProjections: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
    persist(
        (set, get) => ({
            favorites: [],
            selectedFavoriteId: null,
            activeCategory: 'all',
            searchQuery: '',
            viewMode: 'grid',

            addFavorite: (entity) => {
                const newId = `fav-${Date.now()}`;
                set((state) => ({
                    favorites: [
                        ...state.favorites,
                        {
                            ...entity,
                            id: newId,
                            lastViewed: Date.now()
                        }
                    ]
                }));
                return newId;
            },

            updateFavorite: (id, updates) => {
                set((state) => ({
                    favorites: state.favorites.map(fav =>
                        fav.id === id ? { ...fav, ...updates } : fav
                    )
                }));
            },

            removeFavorite: (id) => set((state) => ({
                favorites: state.favorites.filter(fav => fav.id !== id),
                selectedFavoriteId: state.selectedFavoriteId === id ? null : state.selectedFavoriteId
            })),

            selectFavorite: (id) => set((state) => ({
                selectedFavoriteId: id,
                favorites: state.favorites.map(fav =>
                    fav.id === id ? { ...fav, lastViewed: Date.now() } : fav
                )
            })),

            setCategory: (category) => set({ activeCategory: category }),
            setSearchQuery: (query) => set({ searchQuery: query }),

            toggleStar: (id) => set((state) => ({
                favorites: state.favorites.map(fav =>
                    fav.id === id ? { ...fav, isStarred: !fav.isStarred } : fav
                )
            })),

            setViewMode: (mode) => set({ viewMode: mode }),

            clearAllHubProjections: () => {
                set((state) => ({
                    favorites: state.favorites.map(fav => ({ 
                        ...fav, 
                        isSyncedToPlayerHub: false
                    }))
                }));
            }
        }),
        {
            name: 'gm-os-favorites-storage',
            partialize: (state) => ({ favorites: state.favorites }),
        }
    )
);
