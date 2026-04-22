---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Évolution fonctionnelle du module Forge'
session_goals: 'Générer des idées d''améliorations fonctionnelles pour transformer la Forge en un outil plus puissant et polyvalent.'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['First Principles Thinking', 'SCAMPER', 'What If Scenarios']
ideas_generated: [19]
context_file: 'Plans/amélioration.md'
---

## 📂 Intégration des idées externes (depuis amélioration.md)

Voici les axes majeurs répertoriés dans ton fichier d'améliorations, désormais intégrés au maillage de la Forge :

**[Chronologie #14]** : Timeline OS & Master Storyboard
_Concept_ : Créer une ligne de temps où chaque événement narratif déclenche automatiquement des changements dans tous les modules (Lumières, Sons, Images).
_Nouveauté_ : La Forge devient le chef d'orchestre temporel de l'aventure, plus seulement un gestionnaire de stats.

**[IA #15]** : NPC Live Generator & Voice Shaping
_Concept_ : Génération instantanée de PNJ avec portraits IA et modulation de la voix du MJ en temps réel selon le profil du PNJ.
_Nouveauté_ : Unifie la création de contenu (Body) et l'interprétation (Voice) en un seul clic.

**[Exploration #16]** : Map-OS Weather & Fog of War
_Concept_ : Ajout de particules dynamiques (pluie, neige, fumée) et d'un brouillard de guerre réactif aux sources de lumière des jetons.
_Nouveauté_ : Augmente massivement l'immersion visuelle sans intervention manuelle du MJ.

**[Contrôle #17]** : GM Remote Control (Second Screen)
_Concept_ : Déportation des contrôles sensibles (secrets, stats monstres) sur une tablette ou un smartphone.
_Nouveauté_ : Libère l'écran principal pour les projections et permet au MJ de circuler dans la pièce.

**[Savoir #18]** : Knowledge RAG (NotebookLM Mode) - **[RÉALISÉ / V1]**
_Concept_ : Indexation et interrogation de tes PDF de règles et scénarios directement depuis la Forge via l'IA.
_Statut Actuel_ : Déjà fonctionnel ! Le `RAGService` lit tes fichiers MD/PDF dans `/docs` et l'indicateur "Contextual RAG Active" est visible dans le chat AI. L'évolution visée est le mode "Full NotebookLM" (indexation vectorielle plus profonde).

**[Architecture #19]** : System Forge IA (Auto-Driver)
_Concept_ : Utiliser l'IA pour générer automatiquement un Game Driver et une fiche de personnage à partir d'une capture d'écran d'un livre de règle.
_Nouveauté_ : Rend GM-OS compatible avec n'importe quel système de jeu en quelques secondes.

---

## 🚀 Feuille de Route Mise à Jour


# Résultats de la Session de Brainstorming : Évolution de la Forge

**Facilitateur :** David
**Date :** 2026-03-13

## Introduction
Cette session visait à identifier des améliorations fonctionnelles pour la Forge, en respectant les principes de **Souveraineté du MJ** et de **Simplicité d'Usage**.

---

## 🏗️ Phase 1 : First Principles thinking
*Focus : Décomposer la règle et la fiche en éléments fondamentaux.*

**[Logique #1] : Arbres de Décision Mycéliens**
Transformer les règles textuelles en graphes interactifs pour une résolution pas à pas.

**[Interface #2] : Ghost Action UI**
Affichage contextuel des conséquences possibles basées sur les règles.

**[Mutation #3] : États Réactifs Dynamiques**
Injection automatique d'états (ex: Entravé, Inspiré) sur la fiche.

**[Contrôle #4] : Validation "Soft-Lock"**
Le système propose, le MJ valide d'un clic ou d'un mot.

**[Interface #5] : Compétences Quantiques**
Visibilité dynamique des champs de fiche selon le contexte (Combat vs Roleplay).

**[Automatisation #6] : Archivage Temporel des États**
Nettoyage automatique des statuts après une durée définie.

**[Logique #7] : Dissipation Conditionnelle (Smart Dispel)**
Conditions logiques de retrait d'état (ex: "En feu" s'arrête "Sous l'eau").

---

## 🛠️ Phase 2 : SCAMPER
*Focus : Optimiser et fusionner l'existant.*

**[Esthétique #8] : Dés Atmosphériques**
Feedback visuel (fumée, glace, feu) selon l'état du lanceur et la tension.

**[Immersion #9] : Règles de Scène (Smart Rules Macros)**
Lier les mécaniques aux lumières (Hue) et à l'audio d'ambiance.

**[Sémantique #10] : Glossaire d'Immersion Adaptatif**
Renommage dynamique des termes (PV -> Points de Sang) selon le thème.

**[Tactique #11] : Maillage Tactique Forge-Atlas**
Modificateurs de jets calculés automatiquement selon la position sur la carte.

**[Structure #12] : Construction de Fiche Adaptative**
La fiche s'auto-construit selon les règles activées, avec mode "Override".

---

## 🔮 Phase 3 : What If Scenarios
*Focus : Innovation radicale et futurisme.*

**[Intelligence #13] : Le Cerveau Co-MJ (AI Narrative Engine)**
L'IA suggère des rebondissements narratifs basés sur les résultats mécaniques.

---

## 🚀 Feuille de Route et Plan d'Action (Priorité 3-4-1-2)

### 1. Immersion Augmentée (Prio 1)
*   **Action** : Implémenter les **Dés Atmosphériques (#8)** et les **Macros de Scène (#9)**.
*   **Objectif** : Rendre la Forge spectaculaire et immersive.

### 2. Horizon IA (Prio 2)
*   **Action** : Développer le **Cerveau Co-MJ (#13)**.
*   **Objectif** : Assister l'imagination du MJ sans dicter ses choix.

### 3. Cerveau Tactique (Prio 3)
*   **Action** : Maillage **Forge-Atlas (#11)** et **Smart Dispel (#7)**.
*   **Objectif** : Automatiser la géométrie et la logique complexe.

### 4. Interface Réactive (Prio 4)
*   **Action** : **Ghost UI (#2)** et **Auto-Bridge (#12)**.
*   **Objectif** : Une interface qui s'efface devant le récit.

---
**Rapport généré par l'Agent BMAD pour GM-OS v5.**
