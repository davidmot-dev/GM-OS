import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useJournalStore } from '../journal/useJournalStore';

export type FavoriteType = 'npc' | 'place' | 'item' | 'lore';

/**
 * Entité mise en favori (PNJ, Lieu, Objet, Lore).
 * Ces entités peuvent être projetées sur le Player Hub via le Image-OS.
 */
export interface FavoriteEntity {
    id: string;
    type: FavoriteType;
    name: string;
    /** Sous-titre descriptif (ex: "Ruler of the Seven Peaks") */
    subtitle?: string;
    /** URL du portrait principal */
    imageUrl?: string; 
    /** URL de l'icône ou du jeton */
    tokenUrl?: string; 
    /** Timestamp de la dernière consultation */
    lastViewed?: number; 
    /** Attributs textuels (ex: HP: '140', Alignement: 'Loyal Bon') */
    attributes?: Record<string, string | number>; 
    /** Statistiques numériques pour les graphiques à barres */
    stats?: Record<string, number>; 
    /** Texte de lore public */
    lore?: string;
    /** Notes secrètes réservées au MJ */
    secretNotes?: string;
    /** Indique si l'élément est épinglé */
    isStarred?: boolean;
    /** État de synchronisation publique avec le Player Hub */
    isSyncedToPlayerHub?: boolean;
    /** ID de la campagne liée (pour filtrer et assigner) */
    campaignId?: string;
    /** ID du Personnage-Joueur propriétaire (rend l'objet privé au Tablet Hub) */
    ownerId?: string;
    /** Répliques de dialogue générées par l'IA Oracle */
    dialoguePrep?: string[];
    /** Mode d'affichage sur le Player Hub */
    displayMode?: 'card' | 'theater';
}

interface FavoriteState {
    favorites: FavoriteEntity[];
    selectedFavoriteId: string | null;
    activeCategory: FavoriteType | 'all';
    searchQuery: string;
    viewMode: 'grid' | 'detail';

    // Actions
    /** Ajoute une entité aux favoris */
    addFavorite: (entity: Omit<FavoriteEntity, 'id' | 'lastViewed'>) => string;
    /** 
     * Met à jour un favori et synchronise automatiquement la projection.
     * Si `isSyncedToPlayerHub` devient vrai, l'entité est projetée sur le Player Hub.
     */
    updateFavorite: (id: string, updates: Partial<FavoriteEntity>) => void;
    /** Supprime un favori */
    removeFavorite: (id: string) => void;
    /** Sélectionne un favori pour l'affichage détaillé */
    selectFavorite: (id: string | null) => void;
    /** Filtre les favoris par catégorie */
    setCategory: (category: FavoriteType | 'all') => void;
    /** Recherche textuelle dans les favoris */
    setSearchQuery: (query: string) => void;
    /** Épingle/Désépingle un favori */
    toggleStar: (id: string) => void;
    /** Change le mode d'affichage (grille ou détail) */
    setViewMode: (mode: 'grid' | 'detail') => void;
}

// Initial mock data
const initialMockFavorites: FavoriteEntity[] = [
    {
        id: 'mock-1',
        type: 'npc',
        name: 'High King Alaric',
        subtitle: 'Ruler of the Seven Peaks',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwj9taQCjzjjQ-86EMDqIVlENcrP3YOH170PQxu0YMVgdu8R5WgIygW9ppBRhgrogXVCV32WugsrbBN2gUhnyS8rdnf56ciMqG9e6zETogSTlgBDxpF1alehixi98nPyWwp6djGT9Z2OhiA1T_VfBbKiadtHMwp4QgjCxR-tEQEW5Q8H2Fjh2KHjWDMQCLeDg0HZjJmukdtnWsHZtVbiYVejZKIxmzufAZwjQzM9mizOeO5rbkzYeztLq-vTgtO3jKuiWdCydxU_0',
        lastViewed: Date.now() - 2 * 60 * 60 * 1000,
        isStarred: true,
        attributes: {
            'Health': '140 HP',
            'Alignment': 'Lawful Good'
        },
        stats: {
            'Charisma': 80,
            'Intelligence': 60
        },
        lore: '"Born during the Great Eclipse, Alaric was prophesied to reunite the shattered kingdoms. His reign has seen forty years of prosperity, though rumors of a dark cult rising in the Ironbound Keep keep him awake at night."'
    },
    {
        id: 'mock-2',
        type: 'place',
        name: 'Ironbound Keep',
        subtitle: 'Stronghold',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFskkhtKqR0gE69aByQ9o7D8Om5ty2xhMP1Anm64uPWJBoBJse-wsMuKqnN2Ft-VGkseFht_NTY8EghfaEMLqAoAgQhbrEIORlteHnzk58phtRBJ5M9AtiiOuiooHDxaKTTfni_h-dm34iO3Kp4B1EQoE-2ftnCuK-AEBmwmwjAkd7ylXFxXsMCSwehlD4rOiat-aDX2kZAtm5cmBzo5lMuqQXjlg-X-E_0koUcelP10zZx5P6pYv1DJehS2mzCvKEV6TNeNYa2X4',
        lastViewed: Date.now() - 5 * 60 * 60 * 1000,
        isStarred: true,
        lore: 'A massive medieval fortress on a rocky cliff, impenetrable by conventional means.'
    },
    {
        id: 'mock-3',
        type: 'item',
        name: 'Sun-Shattered Blade',
        subtitle: 'Legendary',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7yBDr1W0vXS5Bf1G6mAM9BQnbDx_rU-_yDwIePsKMJvxSvueZnfVqfFrjDXV4rRleUqV64WObF4gWnvV0z_QVMVQ-geZI9KqEPaoU1EBCFqQd5Og9yHeoA1f372zA1sHEHpYhioTsU6Gfq2iT8abeoPriGLnVSqE9KNhSSOMt3ZLu_evHc2NQXTXNkZgsNbCbK27gi_96icO10svtlcc2bi4mXVNhF3An8gQKc08iyPXmU87ChLCJFPIAdHj4XAJ3FYEhHEulbas',
        lastViewed: Date.now() - 24 * 60 * 60 * 1000,
        isStarred: true,
        attributes: {
            'Damage': '1d8 Radiant',
            'Weight': '3 lbs'
        },
        lore: 'A glowing legendary sword with runic inscriptions, said to be forged from a fallen star.'
    }
];

export const useFavoriteStore = create<FavoriteState>()(
    persist(
        (set, get) => ({
            favorites: initialMockFavorites,
            selectedFavoriteId: null,
            activeCategory: 'all',
            searchQuery: '',
            viewMode: 'grid',

            addFavorite: (entity) => {
                const newId = `fav-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
                const favBefore = get().favorites.find(f => f.id === id);
                
                set((state) => ({
                    favorites: state.favorites.map(fav =>
                        fav.id === id ? { ...fav, ...updates } : fav
                    )
                }));

                // Handle projection sync
                if (favBefore) {
                    const imageStore = (window as unknown as { useImageStore?: { getState: () => { projectedEntity?: { id: string }, projectEntity: (e: any) => Promise<void> } } }).useImageStore;
                    if (imageStore) {
                        const isCurrentlyProjected = imageStore.getState().projectedEntity?.id === id;
                        
                        // If we are enabling sync, or if we are already synced and updating something (like displayMode)
                        if ((updates.isSyncedToPlayerHub === true && !isCurrentlyProjected) || (favBefore.isSyncedToPlayerHub && isCurrentlyProjected)) {
                            // Fetch the latest state of the favorite after the set() above would have finished or just merge here
                            const updatedFav = { ...favBefore, ...updates };
                            imageStore.getState().projectEntity(updatedFav);
                        } else if (updates.isSyncedToPlayerHub === false && isCurrentlyProjected) {
                            imageStore.getState().projectEntity(null); 
                        }
                    }

                    // Log to journal if just synced to hub
                    if (!favBefore.isSyncedToPlayerHub && updates.isSyncedToPlayerHub) {
                        useJournalStore.getState().addEvent({
                            type: 'SYSTEM',
                            title: 'Élément favori partagé',
                            content: `L'élément "${favBefore.name}" (${favBefore.type}) a été montré sur le Player Hub.`
                        });
                    }
                }
            },

            removeFavorite: (id) => set((state) => ({
                favorites: state.favorites.filter(fav => fav.id !== id),
                selectedFavoriteId: state.selectedFavoriteId === id ? null : state.selectedFavoriteId
            })),

            selectFavorite: (id) => set((state) => {
                if (!id) return { selectedFavoriteId: null };

                const updatedFavorites = state.favorites.map(fav =>
                    fav.id === id ? { ...fav, lastViewed: Date.now() } : fav
                );

                return {
                    selectedFavoriteId: id,
                    favorites: updatedFavorites
                };
            }),

            setCategory: (category) => set({ activeCategory: category }),
            setSearchQuery: (query) => set({ searchQuery: query }),

            toggleStar: (id) => set((state) => ({
                favorites: state.favorites.map(fav =>
                    fav.id === id ? { ...fav, isStarred: !fav.isStarred } : fav
                )
            })),

            setViewMode: (mode) => set({ viewMode: mode })
        }),
        {
            name: 'gm-os-favorites-storage',
            partialize: (state) => ({ favorites: state.favorites }),
        }
    )
);
