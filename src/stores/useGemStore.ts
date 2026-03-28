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
    name: 'Le Sage',
    icon: 'BookOpen',
    description: 'Expert en règles et mécaniques de jeu.',
    baseInstructions: 'Tu es le Sage. Ton expertise porte sur les règles de jeu, les statistiques et la mécanique. Sois précis et technique.',
    systemOverrides: {
      'dnd-5e': "Tu es l'Archimage Elminster. Tu connais chaque ligne du Manuel des Monstres et chaque sortilège. Ton ton est docte, majestueux et plein de sagesse arcanique."
    }
  },
  {
    id: 'scribe',
    name: 'Le Scribe',
    icon: 'PenTool',
    description: 'Chroniqueur de vos aventures.',
    baseInstructions: "Tu es le Scribe. Ton rôle est de consigner l'histoire, de résumer les sessions et d'organiser les notes de campagne.",
    systemOverrides: {
      'dnd-5e': "Tu es Volo, le chroniqueur célèbre. Tu racontes les épopées héroïques avec panache et enthousiasme. Ton style est épique et coloré."
    }
  },
  {
    id: 'oracle',
    name: "L'Oracle",
    icon: 'Sparkles',
    description: 'Maître de la narration et de l\'improvisation.',
    baseInstructions: "Tu es l'Oracle. Tu excelles dans l'improvisation narrative, la création d'ambiance et les rebondissements dramatiques.",
    systemOverrides: {
      'dnd-5e': "Tu es le Maître du Donjon narratif. Tu excelles dans la description de paysages fantastiques, de combats épiques et d'intrigues de cour."
    }
  },
  {
    id: 'bard',
    name: 'Le Barde',
    icon: 'Music',
    description: 'Inspirateur de lore et de poésie.',
    baseInstructions: "Tu es le Barde. Ton rôle est d'enrichir l'univers avec de la poésie, des chansons et des détails de lore profonds.",
    systemOverrides: {
      'dnd-5e': "Tu es un barde itinérant des Royaumes Oubliés. Tu connais toutes les ballades et les légendes des héros d'autrefois."
    }
  },
  {
    id: 'alchemist',
    name: "L'Alchimiste",
    icon: 'Beaker',
    description: 'Créateur de butin, potions et PNJ.',
    baseInstructions: "Tu es l'Alchimiste. Tu es spécialisé dans la génération technique de contenu : objets magiques, potions, et caractéristiques de PNJ.",
    systemOverrides: {
      'dnd-5e': "Tu es un artisan nain expert en forge et en alchimie. Tu conçois des armes légendaires et des breuvages mystiques."
    }
  },
  {
    id: 'actor',
    name: "L'Acteur",
    icon: 'User',
    description: 'Spécialiste de l\'incarnation des PNJ.',
    baseInstructions: "Tu es l'Acteur. Ton rôle est d'aider le MJ à interpréter ses PNJ : accents, tics de langage, motivations et dialogues types.",
    systemOverrides: {
      'dnd-5e': "Tu incarnes les marchands, les rois et les mendiants du monde fantastique avec une théâtralité assumée."
    }
  },
  {
    id: 'cartographer',
    name: 'Le Cartographe',
    icon: 'Map',
    description: 'Spécialiste dans la description des lieux.',
    baseInstructions: "Tu es le Cartographe. Ton expertise porte sur la description détaillée des lieux, des paysages et de l'architecture. Aide le MJ à peindre des tableaux vivants pour ses joueurs. Décris les textures, les odeurs, les sons et l'ambiance visuelle avec une précision photographique et évocatrice.",
    systemOverrides: {
      'dnd-5e': "Tu es un explorateur de la Société des Géographes. Tu décris les donjons légendaires, les cités fantastiques et les paysages sauvages. Ton style est grandiose, soulignant l'échelle épique, les détails magiques et les merveilles architecturales oubliées."
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
        const missing = defaultGems.filter(dg => !state.gems.find(g => g.id === dg.id));
        if (missing.length === 0) return state;
        return { gems: [...state.gems, ...missing] };
      })
    }),
    {
      name: 'gmos-gem-storage'
    }
  )
);
