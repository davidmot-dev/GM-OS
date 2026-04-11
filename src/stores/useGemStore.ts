import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GemDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseInstructions: string;
  systemOverrides?: Record<string, string>; // systemId -> specific instructions
}

interface GemState {
  gems: GemDefinition[];
  activeGemId: string;
  setGems: (gems: GemDefinition[]) => void;
  setActiveGemId: (id: string) => void;
  updateGem: (id: string, updates: Partial<GemDefinition>) => void;
  syncGemsWithDefaults: () => void;
}

const defaultGems: GemDefinition[] = [
  {
    id: 'sage',
    name: 'settings:ai.gems.templates.sage.name',
    icon: 'BookOpen',
    description: 'settings:ai.gems.templates.sage.desc',
    baseInstructions: 'settings:ai.gems.templates.sage.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.sage.overrides.dnd-5e'
    }
  },
  {
    id: 'scribe',
    name: 'settings:ai.gems.templates.scribe.name',
    icon: 'PenTool',
    description: 'settings:ai.gems.templates.scribe.desc',
    baseInstructions: 'settings:ai.gems.templates.scribe.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.scribe.overrides.dnd-5e'
    }
  },
  {
    id: 'oracle',
    name: 'settings:ai.gems.templates.oracle.name',
    icon: 'Sparkles',
    description: 'settings:ai.gems.templates.oracle.desc',
    baseInstructions: 'settings:ai.gems.templates.oracle.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.oracle.overrides.dnd-5e'
    }
  },
  {
    id: 'bard',
    name: 'settings:ai.gems.templates.bard.name',
    icon: 'Music',
    description: 'settings:ai.gems.templates.bard.desc',
    baseInstructions: 'settings:ai.gems.templates.bard.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.bard.overrides.dnd-5e'
    }
  },
  {
    id: 'alchemist',
    name: 'settings:ai.gems.templates.alchemist.name',
    icon: 'Beaker',
    description: 'settings:ai.gems.templates.alchemist.desc',
    baseInstructions: 'settings:ai.gems.templates.alchemist.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.alchemist.overrides.dnd-5e'
    }
  },
  {
    id: 'actor',
    name: 'settings:ai.gems.templates.actor.name',
    icon: 'User',
    description: 'settings:ai.gems.templates.actor.desc',
    baseInstructions: 'settings:ai.gems.templates.actor.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.actor.overrides.dnd-5e'
    }
  },
  {
    id: 'cartographer',
    name: 'settings:ai.gems.templates.cartographer.name',
    icon: 'Map',
    description: 'settings:ai.gems.templates.cartographer.desc',
    baseInstructions: 'settings:ai.gems.templates.cartographer.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.cartographer.overrides.dnd-5e'
    }
  },
  {
    id: 'strategist',
    name: 'settings:ai.gems.templates.strategist.name',
    icon: 'Sword',
    description: 'settings:ai.gems.templates.strategist.desc',
    baseInstructions: 'settings:ai.gems.templates.strategist.instr',
    systemOverrides: {
      'dnd-5e': 'settings:ai.gems.templates.strategist.overrides.dnd-5e'
    }
  }
];

export const useGemStore = create<GemState>()(
  persist(
    (set) => ({
      gems: defaultGems,
      activeGemId: 'oracle',
      setGems: (gems) => set({ gems }),
      setActiveGemId: (activeGemId) => set({ activeGemId }),
      updateGem: (id, updates) => set((state) => ({
        gems: state.gems.map(g => g.id === id ? { ...g, ...updates } : g)
      })),
      syncGemsWithDefaults: () => set((state) => {
        const newGems = [...state.gems];
        let changed = false;

        // 1. Add missing gems
        defaultGems.forEach(dg => {
          if (!newGems.find(g => g.id === dg.id)) {
            newGems.push(dg);
            changed = true;
          }
        });

        // 2. Migrate existing hardcoded strings to keys
        // We do this EVERY time sync is called to ensure that if a user switches languages,
        // their default gems (which were stored as strings) get updated to keys.
        newGems.forEach((g, idx) => {
          const dg = defaultGems.find(d => d.id === g.id);
          if (dg) {
            // We consider it a default string if it doesn't contain a dot (translation key marker)
            // or if it matches exactly one of the known default strings (FR or EN)
            const isKey = g.name.includes('.');
            if (!isKey) {
              // Migration: update to keys to support multi-language
              newGems[idx] = { 
                ...g, 
                name: dg.name, 
                description: dg.description,
                baseInstructions: dg.baseInstructions
              };
              changed = true;
            }
          }
        });

        if (!changed) return state;
        return { gems: newGems };
      })
    }),
    {
      name: 'gmos-gem-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Force apply default gems to ensure keys are used instead of old hardcoded strings
          return {
            ...persistedState,
            gems: defaultGems
          };
        }
        return persistedState;
      }
    }
  )
);
