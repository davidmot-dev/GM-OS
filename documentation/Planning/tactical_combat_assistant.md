# Blueprint : Tactical Combat Assistant (Cortex AI)

**Status : Implementé (v6.2.3-dev - 9 Avril 2026)**

Ce document décrit l'architecture et les étapes d'implémentation de l'assistant tactique IA conçu pour GM-OS v6.

## 🎯 Objectifs
- Fournir des conseils stratégiques en temps réel au MJ en fonction de la situation sur l'Atlas.
- Traduire les données géométriques (positions, distances) en langage naturel pour l'IA.
- Suggérer des actions spécifiques (Attaque, Déplacement, Retraite) basées sur les capacités du personnage.

## 🏗️ Architecture du Système

### 1. Tactical Narrative Service (Nouveau Service)
Ce service est le "traducteur" spatio-temporel. Il transforme l'état du `MapStore` et du `CombatStore` en un prompt textuel.
- **Entrée** : `tokens[]`, `combatants[]`, `dangerZones[]`, `gridSize`.
- **Logic** : Calcul des vecteurs de menace, des zones de flanquement et de la proximité via `GridEngine`.
- **Sortie** : Une description textuelle de la scène tactique (Le `narrativeReport`).
  - *Exemple* : "Le PNJ 'Grom' est au contact de 2 ennemis (PJ 'Aragon' et PJ 'Legolas'). Il est flanqué."

### 2. Parallel Cortex Engine (Orchestration)
Pour garantir une latence minimale malgré l'usage de modèles complexes (Gemini 3.1 Pro), l'orchestrateur exécute deux branches en parallèle :
- **Branche A (Streaming)** : Génère la "Narration Stratégique" (ambiance, opportunité globale) pour un affichage immédiat et progressif.
- **Branche B (Direct JSON)** : Génère les "Conseils Tactiques" structurés (id, type, message, priorité).
- **Synchronisation** : Un `Promise.all` attend la fin des deux processus pour libérer l'état `idle` de l'IA.

### 3. Prompt Engineering (Le Cerveau)
Le prompt envoyé à l'IA (Gemma 4 ou Gemini) sera structuré ainsi :
- **Contexte** : Description du système de jeu (via GameDriver).
- **Situation** : Sortie du *Tactical Narrative Service*.
- **Capacités** : Liste des sorts/attaques du personnage actif.
- **Consigne** : Proposer 3 options tactiques classées par priorité.

### 3. Tactical Advice UI (Interface Sidebar)
Un nouveau composant de cockpit pour le MJ :
- **Composant** : `TacticalAdvicePanel.tsx`.
- **Visuel** : Cartes pliables avec code couleur (Rouge = Danger imminent, Vert = Opportunité, Bleu = Conseil de placement).
- **Actions** : Bouton pour copier le conseil dans le chat ou appliquer automatiquement certains effets.

---

## 🛠️ Phases d'Implémentation

### Phase 1 : Le "Narrateur Tactique" (Logic)
Développement du service capable de générer la description de scène.
- Utilisation de `GridEngine` pour calculer les relations (Qui est proche de qui ? Qui est isolé ? Qui est groupé pour un sort de zone ?).
- Création du système de sérialisation du prompt.

### Phase 2 : Orchestration IA (Integration)
Connecter l'orchestrateur existant (`useTacticalOrchestrator.ts`) au service de génération d'IA.
- Gestion du "Cooldown" d'analyse pour éviter de saturer l'IA à chaque pixel de mouvement.
- Intégration du `useSessionOSStore` pour lire les capacités réelles des personnages depuis leurs fiches.

### Phase 3 : Interface de Commandement (UI)
- Création du panneau dans le `SessionWorkspace`.
- Ajout d'animations de chargement "Neural Sync" pendant l'analyse.
- Support du "Quick Chat" pour envoyer le conseil textuel directement aux joueurs si besoin.

---

## 🚦 Risques et Solutions
- **Temps de réponse** : L'IA peut mettre 2-3 secondes ou plus sur des modèles Pro.
  - *Solution 1* : **Parallélisation** des appels narration et conseils pour diviser la latence par deux.
  - *Solution 2* : Utiliser un cache et n'analyser que lors d'un "Token Drop" (fin de mouvement) ou d'un changement de tour.
- **Haluctinations Spatiales** : L'IA pourrait imaginer des distances fausses.
  - *Solution* : Ne jamais laisser l'IA calculer elle-même les distances. Lui donner les distances pré-calculées par le code JS (GridEngine).

## 🧪 Plan de Vérification
- **Tests Unitaires** : Valider que le `TacticalNarrativeService` génère bien une description cohérente d'un scénario de flanquement simple.
- **Tests Intégration** : Vérifier que le changement de tour dans le `CombatStore` déclenche bien une requête à l'IA.
- **Manual QA** : Déplacer un pion sur la carte et vérifier que le conseil se met à jour.
- **Performance Benchmarking** : Comparaison du temps de réponse Séquentiel vs Parallèle.

---
> [!IMPORTANT]
> User Review Required: Approuvez-vous cette approche par "Traduction Narrative" (JS calcule, IA conseille) ou préférez-vous que l'IA ait accès aux coordonnées brutes ?
