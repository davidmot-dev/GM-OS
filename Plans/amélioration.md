# 🚀 GM-OS v5 : Idées d'améliorations et évolutions

Ce document répertorie les axes de développement futurs pour transformer GM-OS v5 en une plateforme d'immersion totale.

## 1. 📂 Système de Scénarios & Chronologie (Timeline OS)
Centraliser la gestion des moments clés de la partie.
*   **Master Storyboard** : Créer des événements déclenchant simultanément plusieurs modules (Musique, Ambiances, Lumières, Images).
*   **Timeline Interactive** : Suivre le déroulement temporel et narratif de la session.
*   **Notes Contextuelles** : Lier dynamiquement des entrées de Wiki ou des fiches PNJ à la progression du scénario.

## 2. 🤖 Intégration de l'IA (Gemini/Vocal Shaping)
Exploiter l'IA générative pour assister le MJ en temps réel.
*   **NPC Live Generator** : Génération instantanée de portraits (via DALL-E/Gemini) et de backgrounds basés sur les tables aléatoires du module Session.
*   **Transcription Automatique** : Écoute passive pour archiver les dialogues et les faits marquants dans le journal de session.
*   **Voice Automation** : Adapter automatiquement le pitch ou les effets de la voix en fonction du PNJ sélectionné.

## 3. 🗺️ Évolution du Map-OS & Player Hub
Améliorer l'interactivité et le rendu visuel du plateau virtuel.
*   **Effets Météo Dynamiques** : Couches de particules animées (pluie, fumée, neige, braises) sur les cartes projetées.
*   **Interactivité Joueur** : Permettre aux joueurs de poser des "pings" ou de déplacer leurs pions via l'interface Hub.
*   **Éclairage Dynamique** : Fog of war qui réagit à la position des sources lumineuses des pions.

## 4. ⚔️ Automatisation du Combat OS
Rendre les affrontements plus fluides et cinématiques.
*   **Calculateur de Dégâts Intelligent** : Gestion automatisée des résistances, vulnérabilités et états (étourdi, empoisonné, etc.).
*   **Visual Combat Log** : Affichage stylisé des coups critiques et des échecs sur l'écran des joueurs pour augmenter la tension.
*   **Gestion d'Initiative Avancée** : Rappels automatiques des effets à durée limitée à chaque début de tour.

## 5. 📱 Contrôle Déporté (Mobile/Tablette)
Offrir plus de liberté de mouvement au MJ.
*   **GM Remote Control** : Application optimisée pour tablette/smartphone permettant de piloter l'audio, les lumières et les projections sans écran.
*   **Second Screen Support** : Utiliser un appareil séparé pour afficher uniquement les notes secrètes ou les statistiques des monstres.

## 7. 🧠 Intelligence Artificielle & RAG (NotebookLM Mode)
Transformer GM-OS en un co-pilote savant et contextuel.
*   **Knowledge RAG (Retrieval-Augmented Generation)** : Indexation locale des fichiers PDF/Markdown de règles et de scénarios avec filtrage par campagne (Namespacing).
*   **Gems & Personas Contextuels** : Agents spécialisés (Sage, Scribe, Oracle) adaptant leur ton et leurs connaissances via un système d'instructions en couches (Identité + Système de Jeu + Source).
*   **Vocal Shaping integration** : Préparation des métadonnées IA pour piloter la synthèse vocale et les effets audio en fonction du Persona.

## 8. 🎮 Architecture Modulaire "System Drivers"
Rendre l'interface de GM-OS totalement agnostique au système de jeu.
*   **Game Drivers Engine** : Séparation de la logique métier (Dice-OS, Combat-OS) du noyau de l'application. Chaque jeu possède son "pilote" définissant ses mécaniques propres.
*   **Dynamic UI Components** : Composants d'interface (Jauges, Listes d'initiative) qui s'adaptent visuellement en fonction du driver actif.
*   **System Forge IA** : Workflow assisté par l'IA pour générer un driver et une fiche de personnage fonctionnelle à partir d'une simple capture ou d'un PDF de règle.
