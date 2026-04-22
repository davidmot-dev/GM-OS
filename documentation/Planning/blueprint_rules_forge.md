# 🏗️ Blueprint : Forge des Règles (Édition GM-OS)

Ce document contient l'architecture complète pour intégrer la Forge des Règles dans un projet GM-OS existant utilisant déjà le MCP NotebookLM.

## 1. Store Global (Zustand)
Fichier suggéré : `src/stores/useForgeStore.ts`

```typescript
import { create } from 'zustand';

export type ForgeStep = 'idle' | 'discovery' | 'selection' | 'refinement';

export interface RuleCandidate {
  id: string;
  title: string;
  category: string;
  reason: string;
  suggestedTags: string[];
}

interface ForgeState {
  step: ForgeStep;
  activeNotebookId: string | null;
  candidates: RuleCandidate[];
  selectedIds: string[];
  currentRefiningIndex: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  startForge: (notebookId: string) => void;
  setCandidates: (candidates: RuleCandidate[]) => void;
  toggleSelection: (id: string) => void;
  nextStep: () => void;
  resetForge: () => void;
  setError: (error: string | null) => void;
}

export const useForgeStore = create<ForgeState>((set) => ({
  step: 'idle',
  activeNotebookId: null,
  candidates: [],
  selectedIds: [],
  currentRefiningIndex: 0,
  isLoading: false,
  error: null,

  startForge: (notebookId) => set({ 
    activeNotebookId: notebookId, 
    step: 'discovery',
    error: null 
  }),
  
  setCandidates: (candidates) => set({ 
    candidates, 
    step: 'selection' 
  }),
  
  toggleSelection: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter(i => i !== id)
      : [...state.selectedIds, id]
  })),
  
  nextStep: () => set((state) => {
    if (state.step === 'selection') return { step: 'refinement', currentRefiningIndex: 0 };
    if (state.step === 'refinement') {
      const nextIdx = state.currentRefiningIndex + 1;
      if (nextIdx < state.selectedIds.length) return { currentRefiningIndex: nextIdx };
      return { step: 'idle', activeNotebookId: null, selectedIds: [], candidates: [] };
    }
    return state;
  }),
  
  resetForge: () => set({ 
    step: 'idle', 
    candidates: [], 
    selectedIds: [], 
    activeNotebookId: null,
    error: null 
  }),

  setError: (error) => set({ error, isLoading: false })
}));
```

---

## 2. Stratégies de Prompting (Intelligence)

### A. Discovery Prompt (Scan)
Utilisé pour obtenir la liste des règles candidates.
```text
Analyse ce notebook de jeu de rôle. Liste les 10 règles les plus importantes.
Réponds UNIQUEMENT sous forme d'un tableau JSON d'objets :
[
  {
    "id": "slug-unique",
    "title": "Nom de la règle",
    "category": "Combat|Magie|Discrétion|Santé",
    "reason": "Description courte",
    "suggestedTags": ["tag1"]
  }
]
Ne mets rien d'autre que le JSON. Réponds en français.
```

### B. Refinement Prompt (Synthèse)
Utilisé pour rédiger la fiche finale d'une règle.
```text
Rédige une fiche synthétique pour la règle "{title}".
Format Markdown, 3 paragraphes max, très clair pour un MJ.
Réponds uniquement avec le contenu de la fiche.
```

---

## 3. Composant UI (React + Tailwind + Framer)
Fichier suggéré : `src/modules/rules/components/ForgeWizard.tsx`

> [!TIP]
> Ce composant utilise `window.appBridge.mcp.callTool`. Adaptez cette ligne selon votre implémentation GM-OS.

```tsx
// Structure simplifiée du Wizard
export const ForgeWizard = () => {
  const store = useForgeStore();
  
  // Fonction de Scan
  const handleScan = async (url: string) => {
    const notebookId = extractId(url);
    store.startForge(notebookId);
    
    try {
      const resp = await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'chat_with_notebook', {
        request: { notebook_id: notebookId, message: DISCOVERY_PROMPT }
      });
      
      // LOGIQUE DE PARSING ROBUSTE
      const text = resp.content as string;
      const jsonStart = text.indexOf('[{');
      const jsonEnd = text.lastIndexOf('}]');
      
      if (jsonStart !== -1) {
        const data = JSON.parse(text.substring(jsonStart, jsonEnd + 2));
        store.setCandidates(data);
      }
    } catch (err) {
      store.setError("Échec de la communication MCP");
    }
  };

  return (
    <div className="glass rounded-3xl p-8 border-accent/20">
       <AnimatePresence mode="wait">
         {/* Render steps based on store.step */}
       </AnimatePresence>
    </div>
  );
};
```

---

## 4. Points de Vigilance (Anti-Bug)

1. **Format des paramètres MCP :** Le serveur NotebookLM attend souvent `{ request: { notebook_id, message } }` et non `{ query }`. Vérifiez bien votre bridge.
2. **Parsing JSON :** NotebookLM ajoute souvent du texte avant ou après le JSON. Utilisez toujours `indexOf('[{')` pour extraire le bloc utile.
3. **Session Chrome :** Si le scan échoue, assurez-vous que la fenêtre Chrome ouverte par GM-OS est bien sur la page du NotebookLM.

```javascript
// Exemple de parsing sécurisé
const extractJson = (text) => {
  const start = text.indexOf('[{');
  const end = text.lastIndexOf('}]');
  if (start === -1) throw new Error("Aucun JSON trouvé");
  return JSON.parse(text.substring(start, end + 2));
};
```
