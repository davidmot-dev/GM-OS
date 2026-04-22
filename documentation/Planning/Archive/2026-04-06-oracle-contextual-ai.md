# Walkthrough : Oracle IA Contextuel (Session-Aware)

**Date :** 6 Avril 2026
**Module :** AI-OS / Oracle
**Statut :** ✅ Complété

## 🎯 Objectifs

Transformer l'Oracle IA (Aide au MJ) en un assistant conscient de l'état "vivant" de la session en cours, au-delà de la simple connaissance des règles (RAG).

## 🛠️ Changements effectués

### 1. Intelligence de Concurrence (`AIService.ts`)

- **Collecte de Données Temps Réel** : Implémentation de `getLiveSessionContext()` qui extrait dynamiquement des stores Zustand :
  - **Personnages Joueurs** : Classe, race, santé actuelle (HP).
  - **PNJs Actifs** : Liste des PNJs vivants de la campagne avec descriptions.
  - **Indices Révélés** : Seuls les indices marqués comme "Révélés" par le MJ sont envoyés.
  - **Chronique** : Les 10 derniers événements du journal de session.
- **Fusion de Contextes** : Mise à jour de `generateText` pour injecter ce contexte vivant juste avant le contexte RAG statique, garantissant ainsi une priorité à la narration actuelle.

### 2. Prompt System (Directives MJ)

- **Ajustement Narratif** : Mise à jour des instructions système de l'Oracle. Il est désormais explicitement instruit de citer les noms des PJ et PNJs pour une immersion maximale.
- **Support Multi-Fournisseur** : La conscience de session fonctionne uniformément sur Gemini 1.5, Claude 3.5 et Ollama (Local).

### 3. Raffinement UI (`AIChatPanel.tsx`)

- **Indicateur de Statut** : Le header du panel affiche désormais **"Contextual Oracle Active"** avec un pulse émeraude, confirmant la liaison avec les données de la session.
- **Ambiance Visuelle** : Polissage du Glassmorphism 2.0 pour une immersion totale dans le Cockpit.

## ✅ Vérification

- [x] **Filtrage** : L'IA ne reçoit que les données de la campagne active (sécurité inter-campagne).
- [x] **Confidentialité** : Les indices non-révélés restent masqués pour l'Oracle (prévention des spoilers).
- [x] **Performance** : L'extraction de contexte via `getState()` est atomique et n'impacte pas le cycle de rendu React.

---
*Dernière mise à jour : 6 Avril 2026*
*Statut : Oracle IA Contextuel déployé et documenté.*
