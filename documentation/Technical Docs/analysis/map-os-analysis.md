# Analyse : Map OS (Cartographie Tactical & Brouillard de Guerre)

Ce document détaille les fonctionnalités du module **Map OS** de GM-OS v3. C'est l'un des modules les plus complexes techniquement, gérant l'affichage de cartes tactiques, le brouillard de guerre interactif et une couche de "Tokens" synchronisée entre le MJ et les joueurs.

## 1. Description Générale

Map OS transforme GM-OS en un mini-VTT (Virtual Tabletop). Il permet d'importer des cartes (images ou vidéos), de masquer des zones aux joueurs, et de manipuler des pions (tokens) représentant les PJ et PNJ.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Contrôles MJ) :**
  * **Importation :** Soutien natif des images (`.png`, `.jpg`) et des vidéos (`.mp4`).
  * **Grille Tactique :** Nouvelle option pour afficher une grille ajustable (taille, opacité, couleur).
  * **Projection :** Sélecteur d'écran (Hub Joueur ou Moniteur externe).
  * **Outils de Brouillard :**
    * `Pinceau` : Tracé libre.
    * `Zone` (Rectangle) / `Rond` (Cercle) : Tracés géométriques avec confirmation modale.
  * **Modes de Brouillard :** 🔓 Révéler ou 🔒 Masquer.
  * **Outil Pions :** Mode spécifique pour déplacer les tokens sans risquer de modifier le brouillard.
* **Affichage Principal (Le Plan de Travail) :**
  * Un empilement de **canvas HTML5** optimisés :
        1. `Base` : Image ou Vidéo.
        2. `Grid` : Rendu de la grille tactique.
        3. `Fog` : Couche de brouillard persistante.
        4. `Tokens` : Couche interactive des pions.
        5. `Preview` : Feedback visuel en cours de tracé.
  * **Navigation :**
    * `Molette` : Zoom centré sur la souris (x0.1 à x10).
    * `Clic Milieu` : Panoramique (Drag & Pan).

## 3. Logique Métier & Comportements

* **Moteur de Brouillard de Guerre (Fog of War) :**
  * Persistance via `DataURL` (base64) synchronisée.
  * **Auto-Clear** : Le retrait de la carte via l'interface MJ vide automatiquement le brouillard et les tokens.
* **Système de Tokens Synchronisés :**
  * **Interactivité "Pass-through"** : Les pions autorisent le dessin du brouillard "à travers" eux (clic gauche) tout en restant supprimables (clic droit) à tout moment.
  * **Lien Combat OS** : Synchronisation des PV, statuts et tour actif (halo lumineux).
* **Projection & Synchronisation :**
  * Synchronisation multi-fenêtres via `localStorage` et événements de stockage.
  * Support du Player Hub avec gestion intelligente des couches (Z-index).

## 4. Raccourcis & Gestes

* `Molette` : Zoom.
* `Clic Milieu` : Déplacement de la vue.
* `Clic Droit` (sur pion) : Suppression immédiate.
* `Echap` / `Bouton Recadrer` : Réinitialise la vue sur la carte.

## 5. Persistance

* État complet sauvegardé via Zustand (persist middleware) :
  * Média, Grille (taille/opacité), Brouillard (DataURL), Tokens (positions/liens), Vue (Zoom/Pan).
