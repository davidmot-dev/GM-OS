# 🏗️ Blueprint : MJ Brainstorm (Forge de Règles v5)

Ce module permet au MJ de transformer des documents bruts (via NotebookLM) en fiches de décision et de règles synthétiques, persistées dans le système RAG de GM-OS.

## 1. Principes Directeurs
- **Règle des 5 secondes** : L'information doit être lisible instantanément en cours de partie.
- **On-Demand** : On ne génère pas tout d'un coup. On scanne les titres, puis on "forge" la fiche uniquement si nécessaire.
- **Persistance RAG** : Chaque fiche forgée est sauvée en `.md` dans le dossier système pour enrichir l'IA Oracle.
- **Design Silencieux** : Interface discrète (Glassmorphism), sans animations intrusives.

## 2. Modèle de Données (TypeScript Strict)
Fichier : `src/modules/forge/rules/types.ts`

```typescript
export type BrainstormCategory = 'rule' | 'decision' | 'memory' | 'scenario';

export interface BrainstormCandidate {
  id: string; // Slug unique
  title: string;
  category: BrainstormCategory;
  summary: string; // Courte description pour la liste
  tags: string[];
}

export interface BrainstormCard extends BrainstormCandidate {
  content: string; // Markdown complet de la fiche
  systemId: string; // Pour le classement RAG
  forgedAt: number;
}

export type BrainstormStep = 'idle' | 'discovery' | 'listing' | 'forging';
```

## 3. Store Global (Zustand)
Fichier : `src/modules/forge/rules/store/useBrainstormStore.ts`

```typescript
import { create } from 'zustand';
import { BrainstormStep, BrainstormCandidate, BrainstormCard } from '../types';

interface BrainstormState {
  step: BrainstormStep;
  candidates: BrainstormCandidate[];
  activeCard: BrainstormCard | null;
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: BrainstormStep) => void;
  setCandidates: (candidates: BrainstormCandidate[]) => void;
  startForging: (candidateId: string) => void;
  completeForge: (card: BrainstormCard) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useBrainstormStore = create<BrainstormState>((set) => ({
  step: 'idle',
  candidates: [],
  activeCard: null,
  isProcessing: false,
  error: null,

  setStep: (step) => set({ step }),
  setCandidates: (candidates) => set({ candidates, step: 'listing' }),
  startForging: () => set({ isProcessing: true }),
  completeForge: (card) => set({ 
    activeCard: card, 
    isProcessing: false,
  }),
  setError: (error) => set({ error, isProcessing: false }),
  reset: () => set({ step: 'idle', candidates: [], activeCard: null, error: null })
}));
```

## 4. Stratégie de Prompting (Harmonisée)

### A. Discovery (Scan rapide)
**Objectif** : Obtenir la liste des points d'intérêt.
```text
Analyse ce document de JDR. Identifie les 10 points (règles, situations complexes, ou éléments de lore) qui génèrent le plus de questions en cours de partie.
Réponds EXCLUSIVEMENT en JSON :
[{
  "id": "slug",
  "title": "Nom clair",
  "category": "rule|decision|memory",
  "summary": "Pourquoi c'est utile ?",
  "tags": ["combat", "urgence"]
}]
```

### B. Synthesis (On-Demand)
**Objectif** : Créer la fiche finale.
```text
Rédige une "Fiche de Décision" pour : {title}.
Format : Markdown.
Structure : 
1. Situation (Quand utiliser ?)
2. Séquence (Si X alors Y)
3. Conséquence (Issue possible)
Contrainte : Style direct, max 300 mots.
```

## 5. Intégration RAG & Bridge
Le module utilise le bridge `window.appBridge.ai` pour lire et écrire.

**Flux de sauvegarde** :
1. La fiche est générée.
2. Appel à `window.appBridge.ai.writeDoc(path, content)`.
3. Chemin : `docs/systems/${activeSystem}/rules/${cardId}.md`.
4. Le `RAGEngine` détecte le nouveau fichier et met à jour l'index.

## 6. Interface UI (Tailwind + Framer Motion)
- **Composant** : `BrainstormOverlay.tsx`.
- **Style** : Panneau latéral ou central en `glass-morphism`.
- **Interaction** : 
  - Liste de badges pour les candidats.
  - Bouton "Forger" avec loader discret.
  - Rendu Markdown via `react-markdown`.

## 7. Points de Vigilance
- **I18n** : Les prompts doivent s'adapter à la langue de la session.
- **Sécurité** : Vérifier que `writeDoc` ne permet pas de sortir du dossier `docs/`.
- **Authentification** : Gérer les erreurs 401 de NotebookLM via le mécanisme de rafraîchissement automatique de GM-OS.
