# 🏗️ Documentation Technique : Vision de l'Oracle (Map Narrative)

Le système **Vision de l'Oracle** est un moteur de génération narrative contextuelle intégré au module Map-OS. Il utilise l'IA pour synthétiser l'état visuel et tactique d'une scène de jeu.

## 📐 Architecture de la Solution

Le système repose sur une architecture découplée en quatre couches :

1. **Couche d'Extraction (Stores)** : Récupère les données brutes via `useMapStore` (tokens, météo, zones) et `useCombatStore` (combattants, stats, factions).
2. **Couche Logique (Hook)** : Le hook `useNarrativeGenerator` agrège et nettoie ces données pour créer un contexte structuré.
3. **Couche Intelligence (AI Service)** : Envoie un prompt hautement structuré vers l'assistant IA (Gemini/Ollama).
4. **Couche Présentation (UI)** : Affiche le résultat via `NarrativeModal` et permet l'archivage dans `useJournalStore`.

## 🧠 Le Hook `useNarrativeGenerator`

Ce hook est le cœur du système. Il effectue les opérations suivantes :

### 1. Agrégation Data-Enhanced
Chaque token présent sur la map est enrichi avec les informations de combat si un ID de combattant lui est lié :
- Si `token.combatantId` existe : Récupération des HP actuels, des conditions (statuts) et de l'allégeance (Faction).
- Tri des forces par faction (Joueurs, Alliés, Hostiles, Neutres).

### 2. Synthèse Environnementale
Récupération du type de météo et des zones de danger actives (nom et type de danger) pour poser le décor.

## 📝 Structure du Prompt IA

Le prompt est divisé en trois sections directives pour garantir une sortie de haute qualité :

- **Contexte Environnemental** : "La scène se passe sous [Météo]. Les zones suivantes sont dangereuses : [Zones]."
- **Forces en Présence** : Liste exhaustive des participants groupés par faction, incluant leur état de santé et leurs afflictions.
- **Directives Narratives** :
    - Ton immersif et sombre (style Dark Fantasy).
    - Description sensorielle (vue, son, odeur).
    - **Analyse Tactique** : Conseils spécifiques sur la psychologie des PNJ (ex: "Les gobelins blessés devraient tenter de se replier vers la zone de feu").

## 🖥️ Composants Utilisés

- **`MapControls.tsx`** : Point d'entrée via le bouton "Vision de l'Oracle".
- **`NarrativeModal.tsx`** : Interface de lecture avec thématique "Parchemin" et contrôles de copie/archivage.
- **`useModalStore`** : Gère l'ouverture et la transmission des données vers la modal personnalisée `narrative-display`.

## 💾 Flux de Données du Journal

Lorsqu'une narration est validée par le MJ, elle est envoyée au `useJournalStore` avec le type d'événement `STORY`. Cela permet aux joueurs de relire les descriptions de l'Oracle ultérieurement via leur interface de journal.
