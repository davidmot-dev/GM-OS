# 🔱 Blueprint : Unification Intelligent Core (Gemma 4 & Local-First)

Ce document définit la stratégie technique pour faire de **Gemma 4** (Google) le moteur d'intelligence artificiel principal de GM-OS v6, en exploitant l'architecture MoE (Mixture of Experts) via Ollama.

## 🎙️ Équipe de Conception (BMAD)

- **Winston (Architecte)** : Expert en Agnostic AI Patterns & Model Switching.
- **Sally (UX/Structure)** : Experte en Onboarding IA & Local-First workflows.
- **Carson (Performance)** : Expert en Quantisation & Ordonnancement MoE.

---

## 🛡️ Vision Stratégique

L'objectif est de réduire la dépendance au Cloud (Gemini/Anthropic) pour les tâches quotidiennes du Maître de Jeu, tout en augmentant la qualité du raisonnement local. Gemma 4 26B MoE est identifié comme le "Sweet Spot" actuel.

### Piliers de l'intégration

1. **Souveraineté des Données** : Tout ce qui est narratif reste en local.
2. **Latence Zéro** : Réponse quasi-instantanée de l'Oracle en session (MoE).
3. **Hybridation Intelligente** : Utilisation de NotebookLM (Cloud) comme pont multimodal pour la Forge.

---

## 🏗️ Spécifications Techniques

### 1. Service AI Agnostique (`AIService.ts`)

Le service ne doit plus "supposer" qu'il parle à Gemini ou Claude.

- **Standardisation JSON** : Implémentation d'un extracteur de blocs JSON robuste pour les modèles locaux qui ont tendance à ajouter du texte explicatif.
- **Gestion des Erreurs** : Système de fallback automatique vers Gemini 2.0 Flash si Ollama n'est pas détecté ou si le modèle Gemma 4 n'est pas "pulled".

### 2. Flux "Forge & NotebookLM"

Puisque Gemma 4 est un modèle textuel, la Forge évolue :

- **Entrée PDF/Image** -> Routage vers **NotebookLM MCP** ou **Gemini**.
- **Entrée Texte/Markdown** -> Routage prioritaire vers **Gemma 4**.
- **Transformation de Savoir** -> Gemma 4 reçoit le texte extrait par NotebookLM pour structurer le JSON final du système.

---

## 🏛️ Modifications de Structure

### Store Global (`useAIStore.ts`)

- `configs.ollama.modelId` par défaut : `gemma4:26b`.
- Ajout d'un tag `recommended: true` sur le profil Ollama.

### Paramétrage (`AISettings.tsx`)

- **Dashboard de Santé Local** : Visualisation du statut du serveur Ollama.
- **One-Click Install** : Bouton "Pull Gemma 4" déclenchant le téléchargement via le bridge Electron/Tauri.

---

## 🛡️ Analyse des Risques (Carson)

| Risque | Description | Mitigation |
| :--- | :--- | :--- |
| **VRAM Limit** | Le modèle 26B MoE peut saturer les GPU de 4Go ou 6Go. | Proposer automatiquement Gemma 2 9B ou Phi-3 en alternative "Light". |
| **JSON Pollution** | Les modèles locaux ferment mal les accolades ou bavent du texte. | Regex de nettoyage strict dans `AIService.generateJSON`. |
| **Context Overflow** | Les documents RAG trop longs saturent la fenêtre de 128k. | Optimisation du `RAGService` pour ne fournir que les 10 extraits les plus pertinents. |

---

## 📋 Roadmap d'Exécution

- [x] **Phase 1** : Refonte de `AIService.ts` pour supporter `generateJSON` de manière agnostique.
- [x] **Phase 2** : Mise à jour des services `ForgeService` et `ChronicleService` pour utiliser le nouveau moteur.
- [x] **Phase 3** : Mise à jour de l'UI des réglages avec le bouton de téléchargement direct.
- [x] **Phase 4** : Stabilisation réseau Windows (`net.fetch`) et forçage DNS IPv4.
- [ ] **Phase 5** : Tests de charge sur des machines aux specs variées.

---

## ✅ Critères de Succès

- L'Oracle répond en moins de 2 secondes en local.
- Un système de jeu complet peut être "forgé" sans clé API (si le texte source est fourni).
- Le français produit par Gemma 4 est jugé "immersif" par les testeurs GM-OS.
