import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import taxonomyData from './tactical-taxonomy.json';

export interface TaxonomyMapping {
  keywords: string[];
  tags: string[];
  intensity: number;
  audio?: { effect?: string; ambient?: string };
  hardware?: { scene: string; color: string; priority: number };
  ambientSceneId?: string;
}

interface TaxonomyState {
  mappings: TaxonomyMapping[];
  addMapping: (mapping: TaxonomyMapping) => void;
  updateMapping: (index: number, mapping: TaxonomyMapping) => void;
  removeMapping: (index: number) => void;
  resetToDefault: () => void;
  ensureRangeRules: () => void;
}

export const useTaxonomyStore = create<TaxonomyState>()(
  persist(
    (set) => ({
      mappings: taxonomyData.mappings as TaxonomyMapping[],

      addMapping: (mapping) =>
        set((state) => ({
          mappings: [...state.mappings, mapping],
        })),

      ensureRangeRules: () =>
        set((state) => {
          const hasRange = state.mappings.some(m => m.tags.includes('range'));
          if (hasRange) return state;

          const defaultRanges = (taxonomyData.mappings as TaxonomyMapping[]).filter(m => m.tags.includes('range'));
          return { mappings: [...state.mappings, ...defaultRanges] };
        }),

      updateMapping: (index, mapping) =>
        set((state) => {
          const newMappings = [...state.mappings];
          newMappings[index] = mapping;
          return { mappings: newMappings };
        }),

      removeMapping: (index) =>
        set((state) => ({
          mappings: state.mappings.filter((_, i) => i !== index),
        })),

      resetToDefault: () =>
        set({
          mappings: taxonomyData.mappings as TaxonomyMapping[],
        }),
    }),
    {
      name: 'gm-os-tactical-taxonomy',
    }
  )
);
