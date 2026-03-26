import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NPCCategory = 'npcs' | 'places' | 'items' | 'events' | 'rumors';

/**
 * Représente une entité générée par le NPC-OS.
 * Peut être un PNJ, un lieu, un objet, un événement ou une rumeur.
 */
export interface NPCEntity {
    id: string;
    category: NPCCategory;
    name: string;
    /** Chemin local vers l'image d'avatar */
    avatar?: string;
    /** Notes privées du MJ */
    gmNotes: string;
    /** Champs dynamiques (ex: 'Race', 'Classe', 'Traits') */
    fields: Record<string, string>;
    timestamp: number;
    isDead?: boolean;
    /** Suggestion de prompt pour la génération d'image par l'IA */
    suggestedPrompt?: string;
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
        aiEnabled: boolean;
    };
    availableUniverses: string[];
    currentEntity: NPCEntity | null;
    savedEntities: NPCEntity[];
    isGenerating: boolean;
    isGeneratingAIAvatar: boolean;

    // Actions
    setConfig: (updates: Partial<NPCState['config']>) => void;
    /** 
     * Récupère la liste des univers disponibles (fichiers JSON dans /databases).
     * @param category Optionnel, filtre par catégorie (npcs, places, etc.)
     */
    fetchUniverses: (category?: NPCCategory) => Promise<void>;
    /** 
     * Génère une nouvelle entité aléatoire à partir de l'univers sélectionné.
     * Si `aiEnabled` est vrai, l'entité est enrichie narrativement par l'IA.
     */
    generate: () => Promise<void>;
    /** Ouvre une boîte de dialogue pour sélectionner manuellement un avatar. */
    selectAvatar: () => Promise<void>;
    /** Génère un avatar artistique via l'IA en se basant sur les champs de l'entité. */
    generateAvatar: (instructions?: string) => Promise<void>;
    /** Sauvegarde l'entité actuelle dans le mémo (historique). */
    saveToMemo: () => void;
    deleteFromMemo: (id: string) => void;
    updateEntityNotes: (id: string, notes: string) => void;
    toggleDeadStatus: (id: string) => void;
    clearHistory: () => void;
    setCurrentEntity: (entity: NPCEntity | null) => void;
    getBackupData: () => {
        savedEntities: NPCEntity[];
        config: NPCState['config'];
    };
}

const getBridge = () => (window as Window & typeof globalThis & { appBridge?: { npc: NPCBridge } }).appBridge?.npc;

export const useNPCStore = create<NPCState>()(
    persist(
        (set, get) => ({
            config: {
                category: 'npcs',
                universe: '',
                aiEnabled: true,
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

                    // Intelligent Name Extraction with Safety
                    const getName = (obj: Record<string, string>) => {
                        const nameKey = Object.keys(obj).find(k =>
                            ['nom', 'name', 'titre', 'character', 'personnage'].includes(k.toLowerCase())
                        );
                        
                        const val = nameKey ? obj[nameKey] : (Object.values(obj)[0] || "Unnamed Entity");
                        return String(val || "Unnamed Entity");
                    };

                    let entityFields = fields;
                    let suggestedPrompt = "";

                    // AI Enrichment if enabled
                    if (get().config.aiEnabled) {
                        try {
                            const { aiService } = await import('../ai/AIService');
                            const enriched = await aiService.enrichNPCEntity(fields, category, universe) as Record<string, string | { enrichedValue?: string, value?: string }>;
                            
                            if (enriched && Object.keys(enriched).length > 0) {
                                // Sanitize: ensure all values are strings
                                const sanitized: Record<string, string> = {};
                                for (const [key, value] of Object.entries(enriched)) {
                                    if (typeof value === 'object' && value !== null) {
                                        // Support suspected nested structure
                                        sanitized[key] = String(value.enrichedValue || value.value || JSON.stringify(value));
                                    } else {
                                        sanitized[key] = String(value);
                                    }
                                }
                                entityFields = sanitized;
                            }
                            
                            // Also suggest an image prompt
                            suggestedPrompt = await aiService.suggestNPCImagePrompt(getName(entityFields), entityFields, category, universe);
                        } catch (aiErr) {
                            console.warn("[useNPCStore] AI enrichment failed, using raw details:", aiErr);
                        }
                    }

                    const newEntity: NPCEntity = {
                        id: `ID-${Math.floor(Math.random() * 99999)}`,
                        category,
                        name: getName(entityFields),
                        gmNotes: "",
                        fields: entityFields,
                        suggestedPrompt,
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
                    // Clean and truncate fields to prevent HTTP 500 from too long/complex prompts
                    const fieldsText = Object.values(currentEntity.fields).join(', ').replace(/\n/g, ' ').substring(0, 300);
                    
                    const basePrompt = currentEntity.category === 'places' 
                        ? `Fantasy RPG environment art: ${currentEntity.name}. ${fieldsText}. Cinematic, epic scale, high quality.`
                        : `A professional fantasy RPG character portrait of ${currentEntity.name}. ${fieldsText}. High quality digital art, cinematic lighting, 8k.`;
                        
                    const prompt = instructions ? instructions : basePrompt;
                    const aspect = currentEntity.category === 'places' ? '16:9' : '1:1';
                    
                    const mediaId = await aiService.generateImage(prompt, aspect);
                    
                    const updatedEntity = { ...currentEntity, avatar: mediaId };
                    set({ currentEntity: updatedEntity });

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

            toggleDeadStatus: (id) => {
                const { currentEntity, savedEntities } = get();
                
                // Update current if matches
                if (currentEntity?.id === id) {
                    set({ currentEntity: { ...currentEntity, isDead: !currentEntity.isDead } });
                }
                
                // Update saved list
                set({
                    savedEntities: savedEntities.map(e => e.id === id ? { ...e, isDead: !e.isDead } : e)
                });
            },

            clearHistory: () => {
                set({ savedEntities: [] });
            },

            setCurrentEntity: (entity) => {
                set({ currentEntity: entity });
            },
            getBackupData: () => ({
                savedEntities: get().savedEntities,
                config: get().config
            })
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
