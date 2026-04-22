# Analyse : Voice OS (Modulateur Vocal "Auralis OS")

Ce document recense les fonctionnalités du module **Voice OS** (nommé "Auralis OS" dans l'UI) de GM-OS v3. Ce module permet au MJ de transformer sa voix en temps réel pour incarner divers types de personnages (monstres, fantômes, robots, etc.) avec une latence minimale.

## 1. Description Générale

Voice OS est un processeur de signal audio (DSP) basé sur la Web Audio API. Il capture le flux du microphone, lui applique une chaîne d'effets paramétrables, et le redirige soit vers un retour local (Monitor), soit vers une sortie audio physique spécifique (Live) pour être diffusé aux joueurs.

## 2. Interface Utilisateur (UI)

* **Barre Latérale Gauche (Presets) :**
  * Liste de presets thématiques (`ghost`, `ogre`, `robot`, `dragon`, `clean`) avec icônes et descriptions.
  * Bouton "+ Custom Profile" pour créer ses propres réglages.
* **Zone Centrale (Contrôle & Visualisation) :**
  * **Dashboard Header :**
    * Sélecteur de sortie audio (redirection vers périphérique spécifique).
    * 🎧 `Monitor` : Active/Désactive l'écoute locale (retour casque).
    * ⚡ `GO LIVE` : Active la diffusion vers la sortie sélectionnée.
    * 🔄 `Sync NPC` : Active l'envoi des niveaux audio vers le module NPC pour animer les portraits.
  * **Visualiseur :** Une icône de micro entourée d'un "Waveform Circle" qui réagit au volume.
  * **VU-mètre :** Barre horizontale en bas de l'écran affichant le niveau d'entrée en temps réel.
* **Barre Latérale Droite (Vocal Shapers) :**
  * **Sliders de précision :**
    * `Pitch Shift` : Modifie la hauteur (grave/aigu).
    * `Formant (Simul)` : Change le timbre (voix plus "petite" ou plus "massive") via égalisation.
    * `Reverb` : Ajoute de l'écho de salle.
    * `Disto` : Ajoute du grain ou de la distorsion robotique.

## 3. Logique Métier & Chaîne d'Effets (DSP)

Le module utilise une configuration `latencyHint: 'interactive'` pour réduire au maximum le délai entre la parole et le son traité.

* **Chaîne de traitement :**
    1. `Input Gain` : Réglage du niveau d'entrée.
    2. `Low Cut` (80Hz ou 250Hz) : Filtre les bruits sourds et les plosives.
    3. `Compressor` : Lisse le volume pour éviter les saturations.
    4. `Pitch Shifter` : Décalage de fréquence numérique.
    5. `Formant Shifter` : Simulation de timbre via un filtre en cloche (`peaking`) centré autour de fréquences clés du conduit vocal.
    6. `Distortion` : WaveShaper personnalisé avec courbe de saturation mathématique.
    7. `Reverb` : Utilisation d'un `ConvolverNode` avec une réponse impulsionnelle générée aléatoirement (bruit blanc déclinant).
* **Extraction de niveau (VU Meter) :** Calcul RMS (Root Mean Square) du signal toutes les 50ms pour l'UI et la synchronisation NPC.

## 4. Synchronisation NPC OS

Lorsque `Sync NPC` est activé, Voice OS envoie ses données de volume au module `npcApp`. Si un PNJ est "actif" dans NPC OS, son portrait s'anime (clignotements, tremblements ou animation de bouche) en rythme avec la voix du MJ.

## 5. Perspectives de Refonte (v5)

* **AudioWorklet** : Remplacer l'implémentation JS limitée du Pitch Shifter par un vrai AudioWorklet pour une meilleure qualité et encore moins de latence.
* **Impulse Responses (IR)** : Utiliser des fichiers de réponses impulsionnelles réels pour la réverbération au lieu d'une génération mathématique simple.
* **Voisinnage Technique** : Ce module est très lié aux permissions système (Microphone) et aux périphériques audio (Sorties), ce qui nécessitera une gestion robuste via le `AppBridge` dans Electron/Tauri.
