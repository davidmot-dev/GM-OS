# Analyse : Music OS (Mixer DJ Thématique)

Ce document détaille les fonctionnalités du module **Music OS**, le lecteur audio principal de GM-OS v3, conçu pour gérer les musiques d'ambiance avec des transitions fluides et une organisation par thèmes.

## 1. Description Générale

Music OS n'est pas un simple lecteur "Play/Pause". Il s'inspire des logiciels de DJing avec deux platines (**Decks**) et un **Crossfader**, permettant au MJ de passer d'une ambiance calme à une musique de combat sans coupure brutale.

## 2. Architecture Audio (Web Audio API)

* **Dual Engine** : Deux instances de sources audio indépendantes (Deck A et Deck B).
* **Routage** : Chaque Deck possède son propre `GainNode` relié à un `MasterGain` global au module.
* **Sortie Native** : Utilise un `MediaStreamDestination` vers un élément `<audio>` invisible. Cela permet d'utiliser `setSinkId` pour diriger la musique vers une carte son spécifique (ex: sortie enceintes vs sortie casque).
* **Qualité** : Fixé à 48000Hz pour éviter le ré-échantillonnage instable sous Windows.

## 3. Fonctionnalités de Mixage

* **Crossfader Logiciel** : Un slider (0-100) qui équilibre dynamiquement les gains des Decks A et B.
* **Auto-Fade** : Boutons "Fade to A" et "Fade to B" qui animent automatiquement le crossfader et lancent/arrêtent les pistes avec une rampe linéaire (1.5s par défaut).
* **Boucles (Loop Points)** : Chaque piste peut avoir des points de début (A) et de fin (B) personnalisés. Le moteur reboucle instantanément entre ces deux points, idéal pour les pistes d'ambiance qui ont une intro ou une outro non désirée en boucle.
* **Visualiseur** : Barre de progression temps-réel sur chaque deck.

## 4. Organisation & Playlists

* **Système d'Onglets** : Les musiques sont regroupées dans des Playlists nommées (ex: "Exploration", "Combat", "Taverne").
* **Grille de Pads** : 16 pads par playlist.
  * **Type Local** : Fichiers WAV/MP3 chargés en mémoire (AudioBuffer).
  * **Type Link** : Liens URL (YouTube/Spotify) qui s'ouvrent en externe après un fade-out automatique de l'appli.
* **Drag & Drop** : Possibilité de réorganiser les pads ou de déplacer une piste d'une playlist à une autre via les onglets.

## 5. Intégrations & Extras

* **Light OS Link** : Un pad de musique peut être "lié" à un bouton de Light OS. Lancer la musique active automatiquement l'ambiance lumineuse correspondante.
* **Key Learning** : Raccourcis clavier personnalisables pour chaque pad.
* **Historique & Console** : Liste des 10 dernières pistes jouées et journal d'activité technique interne.

## 6. Perspectives pour v5

* **Multi-Sorties** : Permettre d'envoyer le Deck A et le Deck B sur des cartes sons différentes (Monitoring/Pré-écoute).
* **Égaliseur (EQ)** : Ajouter un égaliseur 3 bandes simple par Deck.
* **Auto-Playlist** : Mode lecture enchaînée automatique pour les sessions longues.
* **Waveform Display** : Remplacer la barre de progression simple par une vraie visualisation de la forme d'onde avec les points de boucle visibles.
