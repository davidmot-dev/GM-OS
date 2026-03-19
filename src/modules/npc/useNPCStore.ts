import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NPCCategory = 'npcs' | 'places' | 'items' | 'events' | 'rumors';

export interface NPCEntity {
    id: string;
    category: NPCCategory;
    name: string;
    avatar?: string;
    gmNotes: string;
    fields: Record<string, string>;
    timestamp: number;
}

interface NPCBridge {
    listDatabases: (category: string) => Promise<string[]>;
    loadDatabase: (category: string, name: string) => Promise<Record<string, string[]>>;
    selectAvatar: () => Promise<string | null>;
}

interface NPCState {
    config: {
        category: NPCCategory;
        universe: string;
    };
    availableUniverses: string[];
    currentEntity: NPCEntity | null;
    savedEntities: NPCEntity[];
    isGenerating: boolean;
    isGeneratingAIAvatar: boolean;

    // Actions
    setConfig: (updates: Partial<NPCState['config']>) => void;
    fetchUniverses: (category?: NPCCategory) => Promise<void>;
    generate: () => Promise<void>;
    selectAvatar: () => Promise<void>;
    generateAvatar: (instructions?: string) => Promise<void>;
    saveToMemo: () => void;
    deleteFromMemo: (id: string) => void;
    updateEntityNotes: (id: string, notes: string) => void;
    clearHistory: () => void;
    setCurrentEntity: (entity: NPCEntity | null) => void;
}

const getBridge = () => (window as Window & typeof globalThis & { appBridge?: { npc: NPCBridge } }).appBridge?.npc;

export const useNPCStore = create<NPCState>()(
    persist(
        (set, get) => ({
            config: {
                category: 'npcs',
                universe: '',
            },
            availableUniverses: [],
            currentEntity: null,
            savedEntities: [],
            isGenerating: false,
            isGeneratingAIAvatar: false,

            setConfig: (updates) => {
                const newConfig = { ...get().config, ...updates };
                set({ config: newConfig });
                // If category changed, refresh universes
                if (updates.category) {
                    get().fetchUniverses(updates.category);
                }
            },

            fetchUniverses: async (category) => {
                const cat = category || get().config.category;
                const bridge = getBridge();
                if (!bridge) return;
                try {
                    const universes = await bridge.listDatabases(cat);
                    set({ availableUniverses: universes });
                    // Set default universe if current one is invalid or empty
                    if (universes.length > 0 && (!get().config.universe || !universes.includes(get().config.universe))) {
                        set(state => ({ config: { ...state.config, universe: universes[0] } }));
                    }
                } catch (err) {
                    console.error("Failed to fetch universes:", err);
                }
            },

            generate: async () => {
                const { category, universe } = get().config;
                const bridge = getBridge();
                if (!universe || !bridge) return;

                set({ isGenerating: true });
                try {
                    const data = await bridge.loadDatabase(category, universe);
                    if (!data) throw new Error("Database empty or not found");

                    const fields: Record<string, string> = {};

                    // Logic to pick random values
                    Object.entries(data).forEach(([key, values]) => {
                        if (Array.isArray(values) && values.length > 0) {
                            fields[key] = values[Math.floor(Math.random() * values.length)];
                        }
                    });

                    // Intelligent Name Extraction
                    const getName = (obj: Record<string, string>) => {
                        const nameKey = Object.keys(obj).find(k =>
                            ['titre', 'name', 'nom', 'character', 'personnage'].includes(k.toLowerCase())
                        );

                        if (nameKey) return obj[nameKey];

                        // Try first name + last name
                        const prenomKey = Object.keys(obj).find(k => ['prenom', 'prénom', 'firstname'].includes(k.toLowerCase()));
                        const nomKey = Object.keys(obj).find(k => ['nom', 'lastname', 'surname'].includes(k.toLowerCase()));
                        if (prenomKey && nomKey) return `${obj[prenomKey]} ${obj[nomKey]}`;

                        // Fallback to first field
                        return Object.values(obj)[0] || "Unnamed Entity";
                    };

                    const newEntity: NPCEntity = {
                        id: `ID-${Math.floor(Math.random() * 99999)}`,
                        category,
                        name: getName(fields),
                        gmNotes: "",
                        fields,
                        timestamp: Date.now()
                    };

                    set({ currentEntity: newEntity, isGenerating: false });
                } catch (err) {
                    console.error("Generation failed:", err);
                    set({ isGenerating: false });
                }
            },

            selectAvatar: async () => {
                const bridge = getBridge();
                if (!bridge) return;
                try {
                    const avatarPath = await bridge.selectAvatar();
                    if (avatarPath) {
                        const { currentEntity, savedEntities } = get();
                        if (currentEntity) {
                            const updatedEntity = { ...currentEntity, avatar: avatarPath };
                            set({ currentEntity: updatedEntity });

                            // Update in memos if present
                            if (savedEntities.find(e => e.id === currentEntity.id)) {
                                set({
                                    savedEntities: savedEntities.map(e => e.id === currentEntity.id ? updatedEntity : e)
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Avatar selection failed:", err);
                }
            },

            generateAvatar: async (instructions?: string) => {
                const { currentEntity, savedEntities } = get();
                if (!currentEntity) return;

                set({ isGeneratingAIAvatar: true });
                try {
                    const { aiService } = await import('../ai/AIService');
                    // Check if it's a place or NPC to adjust prompt
                    // Clean and truncate fields to prevent HTTP 500 from too long/complex prompts
                    const fieldsText = Object.values(currentEntity.fields).join(', ').replace(/\n/g, ' ').substring(0, 300);
                    
                    const basePrompt = currentEntity.category === 'places' 
                        ? `Fantasy RPG environment art: ${currentEntity.name}. ${fieldsText}. Cinematic, epic scale, high quality.`
                        : `A professional fantasy RPG character portrait of ${currentEntity.name}. ${fieldsText}. High quality digital art, cinematic lighting, 8k.`;
                        
                    const prompt = instructions ? instructions : basePrompt;
                    const aspect = currentEntity.category === 'places' ? '16:9' : '1:1';
                    
                    const mediaId = await aiService.generateImage(prompt, aspect);
                    console.log(`[useNPCStore] Image generated successfully: ${mediaId.substring(0, 50)}...`);
                    
                    const updatedEntity = { ...currentEntity, avatar: mediaId };
                    set({ currentEntity: updatedEntity });
                    console.log(`[useNPCStore] currentEntity updated with new avatar.`);

                    // Update in memos if present
                    if (savedEntities.find(e => e.id === currentEntity.id)) {
                        set({
                            savedEntities: savedEntities.map(e => e.id === currentEntity.id ? updatedEntity : e)
                        });
                    }
                } catch (err) {
                    console.error("AI Avatar Generation Error:", err);
                    const { gmToast } = await import('../../stores/useToastStore');
                    gmToast("Erreur lors de la génération IA", "error");
                } finally {
                    set({ isGeneratingAIAvatar: false });
                }
            },

            saveToMemo: () => {
                const { currentEntity, savedEntities } = get();
                if (currentEntity && !savedEntities.find(e => e.id === currentEntity.id)) {
                    set({ savedEntities: [currentEntity, ...savedEntities] });
                }
            },

            deleteFromMemo: (id) => {
                set(state => ({
                    savedEntities: state.savedEntities.filter(e => e.id !== id)
                }));
            },

            updateEntityNotes: (id, notes) => {
                // Check current entity
                if (get().currentEntity?.id === id) {
                    set(state => ({ currentEntity: state.currentEntity ? { ...state.currentEntity, gmNotes: notes } : null }));
                }
                // Check saved entities
                set(state => ({
                    savedEntities: state.savedEntities.map(e => e.id === id ? { ...e, gmNotes: notes } : e)
                }));
            },

            clearHistory: () => {
                set({ savedEntities: [] });
            },

            setCurrentEntity: (entity) => {
                set({ currentEntity: entity });
            }
        }),
        {
            name: 'gmos-npc-storage',
            partialize: (state) => ({
                savedEntities: state.savedEntities,
                config: state.config
            })
        }
    )
);
