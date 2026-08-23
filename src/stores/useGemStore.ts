import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Penchant } from '../../electron/ragSelection';

export interface GemDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseInstructions: string;
  systemOverrides?: Record<string, string>; // systemId -> specific instructions
  /**
   * **De quel côté ce cortex penche quand il cherche dans le corpus.**
   *
   * *Idée de David, 2026-08-23 : « le Sage privilégie les règles, le Scribe
   * privilégierait la campagne. »* Les cortex sont déjà des rôles nommés, le
   * meneur en choisit un explicitement, et **rien ne bascule tout seul** — la
   * même forme que le choix du moteur par Forge (axe J).
   *
   * `campagne` monte les notes de la campagne à **parité** avec les fiches du
   * corpus et laisse la pertinence trancher ; il ne les fait pas passer devant.
   * Mesuré : aller au-delà ne gagnait rien et cassait la moitié des questions
   * de règle.
   *
   * **Absent, rien ne change** — c'est le classement d'avant, qui était déjà un
   * penchant « règles » sans avoir de nom. Un cortex écrit par le meneur en
   * hérite donc, et c'est le bon défaut : on ne prête pas une intention à qui
   * n'en a pas déclaré.
   */
  penchant?: Penchant;
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
    // « Expert en règles et mécaniques de jeu » — c'est sa définition même.
    penchant: 'regles',
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
    // Chroniqueur des aventures : ce qu'il raconte vit dans les notes.
    penchant: 'campagne',
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
    // Narration et improvisation, donc la matière de la campagne.
    penchant: 'campagne',
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
    // Le lore est du contenu de campagne, pas une règle.
    penchant: 'campagne',
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
    // Choix de David. Butin et potions sortent de tables de règles — mais
    // il fabrique aussi des PNJ : si ses PNJ tombent à plat, c'est le premier à
    // basculer sur « campagne », qui laisse de toute façon la question décider.
    penchant: 'regles',
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
    // Incarner un PNJ demande de savoir qui il est, et ça, c'est la campagne.
    penchant: 'campagne',
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
    // Les lieux de la campagne, pas les règles de déplacement.
    penchant: 'campagne',
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
    // Tactique et combat : des règles, et des règles exactes.
    penchant: 'regles',
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
            // CRITICAL: We also check if the casing is wrong or if the namespace is missing
            const isKey = g.name.includes('.');
            const isCorrectKey = g.name === dg.name;
            
            if (!isKey || !isCorrectKey) {
              // Migration: update to keys to support multi-language and fix corrupted keys
              newGems[idx] = { 
                ...g, 
                name: dg.name, 
                description: dg.description,
                baseInstructions: dg.baseInstructions
              };
              changed = true;
            }

            /*
              **Le penchant se REMPLIT quand il est absent, et ne se remplace
              JAMAIS.** — né le 2026-08-23, donc aucun cortex enregistré avant
              n'en porte, et sans ce rattrapage le réglage n'aurait servi à rien
              tant que le meneur ne les aurait pas repris un par un.

              Mais c'est un champ qu'il PEUT changer, et l'écraser à chaque
              synchronisation le lui reprendrait en silence — au prochain
              démarrage, sans un mot. *C'est la règle d'`enrichirLePilote` :
              remplir ce qui est vide, ne jamais remplacer ce qui est rempli.*
            */
            if (newGems[idx].penchant === undefined && dg.penchant !== undefined) {
              newGems[idx] = { ...newGems[idx], penchant: dg.penchant };
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
