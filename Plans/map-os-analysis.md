# Analyse : Map OS (Cartographie Tactical & Brouillard de Guerre)

Ce document détaille les fonctionnalités du module **Map OS** de GM-OS v3. C'est l'un des modules les plus complexes techniquement, gérant l'affichage de cartes tactiques, le brouillard de guerre interactif et une couche de "Tokens" synchronisée entre le MJ et les joueurs.

## 1. Description Générale

Map OS transforme GM-OS en un mini-VTT (Virtual Tabletop). Il permet d'importer des cartes (images ou vidéos), de masquer des zones aux joueurs, et de manipuler des pions (tokens) représentant les PJ et PNJ.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Contrôles MJ) :**
  * **Importation :** Soutien natif des images (`.png`, `.jpg`) et des vidéos (`.mp4`).
  * **Projection :** Sélecteur d'écran et bouton de lancement de la vue Joueur.
  * **Outils de Brouillard :**
    * `Pinceau` : Tracé libre à la souris.
    * `Rectangle` / `Cercle` : Tracés géométriques précis avec prévisualisation et validation (Enter/Esc).
  * **Modes de Brouillard :** 🔓 Révéler (Gomme) ou 🔒 Masquer (Pinceau noir).
  * **Bibliothèque de Tokens :** Liste dynamique auto-générée récupérant les personnages depuis :
        1. Combat OS (Combattants actuels).
        2. Session OS (PJ présents et PNJ liés).
        3. Favorite OS (PNJ favoris).
* **Affichage Principal (Le Plan de Travail) :**
  * Un empilement de **5 canvas HTML5** pour une performance optimale :
        1. `Base` / `Video` : La carte de fond.
        2. `Fog` : La couche de brouillard (noir semi-opaque).
        3. `Tokens` : La couche des pions.
        4. `Preview` : Affichage temporaire des formes en cours de tracé.
        5. `Empty State` : Affiché quand aucune carte n'est chargée.

## 3. Logique Métier & Comportements

* **Moteur de Brouillard de Guerre (Fog of War) :**
  * Le brouillard est stocké sous forme de `DataURL` (base64) pour assurer sa persistance.
  * Utilise `globalCompositeOperation` : `destination-out` pour "creuser" des trous dans le brouillard et `source-over` pour en rajouter.
* **Système de Tokens Synchronisés :**
  * **Bidirectionnel :** Le MJ peut déplacer un pion, ce qui met à jour l'écran des joueurs. **NOUVEAUTÉ V3 :** Les joueurs peuvent aussi déplacer leurs propres pions sur la projection (tactile/souris), ce qui renvoie la position au MJ en temps réel.
  * **Overlay Tactical :** Chaque token affiche dynamiquement :
    * Une barre de vie (HP) auto-mise à jour depuis Combat OS.
    * Des icônes de statuts (effets actifs).
    * Le nom du personnage.
  * **Focus Combat :** Le pion dont c'est le tour dans Combat OS est entouré d'un halo vert vif (`highlightCombatTurn`).
* **Gestion des Vidéos :**
  * Les cartes animées tournent en boucle. Le brouillard s'applique par-dessus la vidéo en temps réel.

## 4. Projection & Synchronisation

* **IPC (Inter-Process Communication) :**
  * Envoie l'état complet de la carte (chemin du fichier, brouillard actuel, liste des tokens) à chaque modification.
  * Le rendu de projection (`map-projection-renderer.js`) est optimisé pour ne pas recalculer ce qui n'a pas changé.

## 5. Raccourcis Clavier

* `Enter` : Valider une forme géométrique.
* `Escape` : Annuler un tracé ou fermer la projection.
* `Supr` / `Backspace` : Supprimer le token sélectionné.

## 6. Persistance

* Le module exporte et importe :
  * Le chemin de la carte.
  * L'état binaire du brouillard.
  * La position, la taille et la visibilité de chaque token.
