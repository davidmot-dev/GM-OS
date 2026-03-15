---
stepsCompleted: ['step-01-init', 'step-01b-continue', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: ['Plans/amélioration.md', 'Plans/architecture-patterns.md']
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 2
---

# Product Requirements Document - GM-OS v5 : Cerveau Tactique

**Author:** david
**Date:** 2026-03-12
**Status:** PRD Completed & Polished

## 1. Executive Summary

Le **Cerveau Tactique** est une extension majeure de GM-OS v5 conçue pour transformer l'expérience de narration des Maîtres de Jeu (MJ) via une orchestration automatisée et intelligente de l'ambiance. 

Le produit s'articule autour du **"Bouton d'Ambiance Totale"**, une interface unique capable de générer instantanément une immersion visuelle (IA générative), sonore (curation audio locale sémantique) et physique (synchronisation Philips Hue). L'innovation réside dans sa capacité à opérer en arrière-plan sans interrompre le flux narratif, tout en offrant des "Flashs Matériels" pour les moments de haute intensité.

## 2. Success Criteria

### User Success
- **Simplicité** : Déclenchement d'une ambiance complète (Image + Son + Lumière) en moins de **3 clics**.
- **Effet Wow** : Immersion instantanée perçue comme magique par les joueurs.
- **Narrative-First** : Feedback discret via la Status Bar ; aucune interruption technique de la narration.

### Technical Success
- **Performance** : Image finale affichée sur le Player Hub en moins de **15-20s** (asynchrone).
- **Curation Locale** : Sélection audio sémantique (< 500ms) s'appuyant sur les tags du Media Hub sans dépendance cloud.
- **Résilience** : Basculement automatique en mode "Local Only" si le cloud est indisponible.

## 3. Product Scope

### Phase 1 : MVP (Bouton d'Ambiance Totale)
- **PromptUnique** : Barre de saisie pour intentions visuelles et sonores.
- **VisualSymphony** : Génération d'images HD (DALL-E/Imagen) avec fondu enchaîné (Cross-fade).
- **SemanticAudio** : Curation automatique des SoundPads et musiques via tags Media Hub.
- **HardwareSync** : Pilotage Philips Hue (couleurs dominantes + Flashs matériels).

### Phase 2 : Croissance (Intelligence Tactique)
- **Smart Dispel** : Aide à la gestion des états de combat.
- **Tactical Bridge** : Suggestions tactiques basées sur la position des pions sur la Map.

### Phase 3 : Vision (Immersion Persona)
- **Voice OS** : Modulation vocale temps réel pour PNJ.
- **Live NPC** : Génération de fiches et portraits à la volée.

## 4. User Journeys

### Scénario A : La Frontière Narrative
*Le MJ décrit l'entrée dans un nouveau lieu.*
- **Action** : Saisie de "Cité gothique sous une pluie de cendres".
- **Résultat** : L'image apparaît progressivement en fondu, le son devient sourd et mélancolique, les lumières virent au gris tamisé. 
- **Impact** : Le MJ n'a jamais quitté ses joueurs du regard.

### Scénario B : L'Événement Critique (Le Coup de Tonnerre)
*Un éclair déchire le ciel dans la narration.*
- **Action** : Le système détecte l'intention de flash ou le MJ appuie sur un déclencheur rapide.
- **Résultat** : Les lampes Philips Hue de la pièce flashent instantanément en blanc froid, synchronisées avec un échantillon sonore de foudre local.

## 5. Domain & Platform Requirements

### TTRPG Domain
- **Confidentialité** : Seuls les prompts textuels descriptifs sont envoyés au cloud.
- **Taxonomie Audio** : Utilisation stricte des catégories : Météo, Intensité, Biome, Matériau (voir `docs/tactical-ai-tagging.md`).

### Desktop App (Windows / Electron)
- **Backend Privilégié** : Accès direct au hardware (Hue, Audio) via `appBridge`.
- **Hybrid-Cloud Strategy** : L'intelligence est cloud (image), mais l'exécution est locale (audio, lumière) pour garantir la continuité en cas de panne internet.
### Glossaire Technique
- **Flash Matériel** : Synchronisation matérielle instantanée (latence < 200ms) entre un événement sonore ou un prompt d'intensité et le système d'éclairage Philips Hue (ex: éclair de foudre, explosion).
- **LIFO (Last-In-First-Out)** : Gestion des tâches asynchrones où le dernier prompt saisi écrase immédiatement le traitement des précédents pour garantir la réactivité.

### Sécurité
- **Chiffrement** : Clés API chiffrées via le `safeStorage` d'Electron.

## 6. Innovation : Le Pont Physique (Flashs Matériels)

L'innovation clé est la **Synchronisation Matérielle Instantanée**. Le système détecte les pics d'intensité (foudre, explosion) et pilote le matériel Hue via le Bridge Electron avec une latence cible **< 200ms**. Si le matériel est absent, l'UI simule l'effet visuellement pour préserver la cohérence.

## 7. Functional Requirements (Capability Contract)

### Orchestration Ambiance
- **RF1** : Saisie unique via barre "Prompt Ambiance".
- **RF2** : Extraction simultanée des intentions (Image/Son/Lumière).
- **RF3** : Indicateur d'état asynchrone (Status Bar).

### Immersion Visuelle
- **RF4** : Génération d'image HD via API Cloud.
- **RF5** : Affichage Player Hub avec Cross-fade de 3s.
- **RF6** : Gestion de priorité LIFO (nouveau prompt annule le précédent).

### Curation Audio
- **RF7** : Sélection automatique musiques/ambiances locales.
- **RF8** : Mapping sémantique prompt-to-tags (Media Hub).
  - *Exemple de mapping JSON attendu :*
  ```json
  {
    "storm": { "hue": "cold-white-strobe", "audio": ["thunder_low.wav", "rain_loop.mp3"] },
    "forest": { "hue": "deep-green-ambient", "audio": ["birds_morning.mp3"] }
  }
  ```
- **RF9** : Cross-fade audio automatique entre pistes.

### Éclairage (Philips Hue)
- **RF10** : Flashs matériels instantanés sur événements haute intensité.
- **RF11** : Synchronisation chromatique selon image/ambiance.
- **RF12** : Fallback visuel UI si matériel non détecté.

## 8. Non-Functional Requirements (Quality Attributes)

### Performance
- **Intelligence over Latency** : Délai de réflexion IA de **1s à 3s** accepté pour garantir la pertinence.
- **Audio Speed** : Sélection des pistes locales en **< 500ms** (Mesure : Temps écoulé entre trigger sémantique et appel `play()` dans les logs Electron).
- **Visual Smoothness** : Zéro lag d'interface pendant la génération cloud.
- **Hardware Latency** : Commande Hue envoyée en **< 200ms** (Mesure : Benchmarking via l'outil de diagnostic Hardware intégré).

### Fiabilité
- **Offline Logic** : Fonctionnement dégradé des sons et lumières sans internet.
- **Priority Management** : Annulation immédiate des tâches obsolètes (LIFO).

### Sécurité
- **Chiffrement** : Stockage natif Windows pour les secrets API.
- **Data Minimization** : Transmission cloud limitée aux descriptions d'ambiance.
