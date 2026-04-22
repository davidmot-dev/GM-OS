# Analyse : Ambient OS (Mixeur d'Ambiances)

Ce document recense exhaustivement les fonctionnalités natives du module **Ambient OS** de GM-OS v3. Ce module est un mixeur audio multi-pistes optimisé pour jouer des boucles sonores longues (fonds sonores, musiques d'ambiance, pluie, vent, etc.) de manière fluide et stable.

## 1. Description Générale

Ambient OS se présente sous la forme d'une table de mixage simplifiée à **8 pistes**. Il gère la lecture en boucle (Loop), le contrôle individuel du volume en temps réel, et un Master Bus doté d'un compresseur dynamique pour lisser et maximiser le rendu sonore.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Contrôles Système) :**
  * Sélecteur "Sortie Audio" (`ambient-output-select`) : Permet (tout comme Sound OS) de rediriger le son de ce mixeur vers une enceinte physique ou un câble audio virtuel spécifique.
  * Bouton "+ Charger Audios" : Ouvre l'explorateur pour importer des fichiers `.mp3` ou `.wav` et les affecte aux premières pistes libres.
  * Bouton "■ FADE OUT TOTAL" : Crée une pente de diminution de volume de 3 secondes sur l'ensemble du mix puis arrête les pistes.
  * Boutons "Sauvegarde / Chargement" (Presets).
  * Bouton "⚠️ Reset Grille" : Vide toutes les pistes.
* **Affichage Principal (Main - Le Mixeur) :**
  * Un conteneur (`ambient-track-container`) alignant les 8 pistes horizontalement ou sous forme de grille.
  * **Une Piste (Track) comprend :**
    * Mini-boutons de contrôle : Renommer ("✏️"), Changer la Couleur ("🎨"), Vider la piste ("✖").
    * Un indicateur visuel de nom de piste (`ambient-track-name`).
    * Un très gros bouton central Play/Pause (`ambient-play-btn`) affichant "▶" ou "⏸".
    * Un **Slider vertical** ou horizontal (`ambient-slider`) gérant le volume de la piste (0 à 100%).
    * Un bouton en base : "🔄 Remplacer" (si occupée) ou "📂 Charger Son".
  * **Drag & Drop :**
    * Les pistes acceptent le glisser-déposer de fichiers audio directement depuis l'explorateur Windows.
* **Console de Log (`ambient-console`)** :
  * Affichage d'historique en bas d'écran (ex: `Lecture de l'ambiance : Forêt`).

## 3. Logique Métier & Comportements

* **Web Audio API (AudioContext natif) :**
  * **IMPORTANT :** Contrairement à un lecteur normal, Ambient OS a été pensé pour le JdR. Il intègre un `DynamicsCompressorNode` au niveau de la sortie Master ("bus master").
  * Ce compresseur (Threshold -24, Ratio 12, Knee 30) vise à **écraser les gros pics sonores** et à remonter le son général (via un `MasterGain` de x1.3), permettant aux ambiances d'être parfaitement audibles sans pour autant agresser les tympans sur un bruit brusque.
  * **Traitement de phase gauche/droite :** La fonction `togglePlay()` inclut un "câblage" très spécifique (ChannelSplitter -> ChannelMerger) qui ne prend que le canal Gauche (Mono) pour le dupliquer sur la Droite, afin d'esquiver un bug rare de certains fichiers audio ayant une "phase inversée" qui annule le son sortant sur une enceinte unique.
* **Lecture Piste par Piste :**
  * Volume indépendant, géré par l'événement `setTargetAtTime` pour éviter les "craquements" lors des mouvements rapides de slider (`linearRampToValueAtTime`).
  * Chaque piste boucle *à l'infini* (`src.loop = true`).
  * Le "Fade-in" est automatisé : on passe de 0 de volume au volume cible du slider sur 1.5 seconde lorsqu'on clique sur "▶".
  * Le "Fade-out" individuel (quand on clique sur "⏸") se fait sur 1 seconde.
* **Routage Audio Direct :**
  * Contrairement à Sound OS (qui utilisait un `<audio>` tag caché), Ambient OS utilise la méthode expérimentale/récente native `AudioContext.setSinkId()` pour le routage audio, offrant de très bonnes performances et des latences réduites, évitant les problèmes de mapping 5.1/7.1 des cartes mères.

## 4. Persistance (Gestion d'État)

* Mécanisme standard de presets via `exportState` / `importState`.
* Un preset enregistre : le chemin local du fichier (`path`), le statut, le `volume` exact, la `color` et le `name` afin de retrouver exactement le mix parfait tel qu'on l'a constitué.
* Support de la base64 pour encoder des petits fichiers à l'intérieur du `.json` (pour l'export de vrais "Packs" tout-en-un portables).
