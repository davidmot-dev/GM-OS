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
* **Plage de lecture (ex-« Loop Points »)** : chaque pad peut porter une entrée et une sortie (`loopA`/`loopB`), posées depuis la platine à la position écoutée. Le moteur rejoue la plage en boucle ou une seule fois, selon le bouton 🔁 de la platine — voir `logic/plageDeLecture.ts` pour la table des quatre comportements.
  * ⛔ **Ce paragraphe a décrit pendant des mois une fonctionnalité qui n'existait pas.** Les deux champs étaient déclarés et initialisés à `null` en cinq endroits, **écrits par personne et lus par personne** ; aucun écran ne les posait, et le moteur ne connaissait que `audioElement.loop`, c'est-à-dire le morceau entier. Construit le **2026-09-16**, à la demande de David — qui se souvenait de la promesse, faite ici et dans le guide 71. *Une documentation d'analyse écrite en même temps que le plan décrit l'intention ; relue un an plus tard, elle se lit comme un état des lieux.*
* **Visualiseur** : Barre de progression temps-réel sur chaque deck.

## 4. Organisation & Playlists

* **Système d'Onglets** : Les musiques sont regroupées dans des Playlists nommées (ex: "Exploration", "Combat", "Taverne").
* **Grille de Pads** : nombre **libre** par playlist — cinq à la création, `ajouterUnPad` /
  `retirerUnPad` ensuite. ⛔ *Était « 16 » ici ; la refonte `da7979d2` a ramené la création à cinq
  **et ajouté un `.slice(0, 5)` à l'affichage**, ce qui cachait onze pastilles des playlists
  antérieures — que le clavier, lui, jouait toujours. Plafond retiré le 2026-09-16.*
  * **Type Local** : Fichiers WAV/MP3 chargés en mémoire (AudioBuffer).
  * **Type Link** : Liens URL (YouTube/Spotify) qui s'ouvrent en externe après un fade-out automatique de l'appli.
* **Drag & Drop** : Possibilité de réorganiser les pads ou de déplacer une piste d'une playlist à une autre via les onglets.
* **Éditeur de pastille** (`components/EditeurDePastille.tsx`, variante de boîte `music-pad-edit`) :
  nom, **couleur** (`MusicPad.couleur`, une clé de `logic/couleursDePastille` — jamais un
  hexadécimal) et **touche**. La capture de touche y est locale et sans danger : une surcouche
  ouverte rend `estUneFrappeDePastille` faux, donc l'écouteur global est muet. Le conflit de touche
  est demandé à `padDuRaccourci` — *la même fonction que le clavier interroge en séance* — et la
  touche est retirée à son ancien détenteur à l'enregistrement.
* **Grille responsive** : le nombre de colonnes suit la largeur (2 → 6). ⚠️ **La tuile est un
  `aspect-square`** : le nombre de colonnes est exactement ce qui décide de sa taille, et le menu
  qui s'ouvre par-dessus a une **hauteur fixe** — d'où le plafond à six.

## 5. Intégrations & Extras

* **Light OS Link** : Un pad de musique peut être "lié" à un bouton de Light OS. Lancer la musique active automatiquement l'ambiance lumineuse correspondante.
* **Key Learning** : Raccourcis clavier personnalisables pour chaque pad.
* **Historique & Console** : Liste des 10 dernières pistes jouées et journal d'activité technique interne.

## 6. Perspectives pour v5

* **Multi-Sorties** : Permettre d'envoyer le Deck A et le Deck B sur des cartes sons différentes (Monitoring/Pré-écoute).
* **Égaliseur (EQ)** : Ajouter un égaliseur 3 bandes simple par Deck.
* **Auto-Playlist** : Mode lecture enchaînée automatique pour les sessions longues.
* **Waveform Display** : Remplacer la barre de progression simple par une vraie visualisation de la forme d'onde avec les points de boucle visibles.
