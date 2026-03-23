# Analyse : Whiteboard OS (Tableau Blanc Collaboratif)

Le module **Whiteboard OS** permet au MJ et aux joueurs de dessiner en temps réel sur un espace vierge ou par-dessus d'autres contenus (selon le contexte de projection).

## 1. Description Générale
Il s'agit d'un outil de croquis rapide, de schémas tactiques ou de partage d'indices visuels. Il est conçu pour être simple, fluide et réactif.

## 2. Interface Utilisateur (UI)
* **Mode de Fond** : 
    * `Sombre` (par défaut) : Idéal pour l'immersion et les schémas néons. 
    * `Clair` (Tableau Blanc) : Bascule instantanée pour une lisibilité maximale (type "Velleda").
* **Barre d'Outils Adaptative** :
    * Les couleurs s'adaptent au fond (ex: le blanc devient noir en mode clair).
    * `Crayon` / `Brosse` : Dessin libre.
    * `Gomme` : Efface les tracés en fonction de la couleur de fond actuelle.
    * `Laser` : Pointeur temporaire qui disparaît après 2 secondes.
    * `Formes` (Rectangle, Cercle) : Tracés géométriques.
* **Palette de Couleurs** : 8 couleurs vibrantes prédéfinies, incluant un mode adaptatif (N&B).

## 3. Logique de Synchronisation
* **Multi-Fenêtres** : Utilise un store Zustand avec persistance `localStorage`. Chaque segment (`path`) dessiné est immédiatement répertorié.
* **Trace en Temps Réel** : Pendant qu'un utilisateur dessine, une trace temporaire (`activePath`) est diffusée aux autres instances avant d'être persistée une fois le clic relâché.
* **Player Hub Interaction** : Contrairement aux versions précédentes, la barre d'outils est interactive sur le Player Hub, permettant une utilisation directe sur tablette ou écran tactile.

## 4. Projection
* **Mode "Overlay" (Joueurs)** : En mode sombre, le tableau est transparent sur le Hub, permettant de dessiner par-dessus le fond d'écran ou la carte. En mode clair, il devient opaque (blanc solide).
* **Z-Index Strategy** :
    * Tokens de Carte : `z-35` (toujours au-dessus).
    * Whiteboard : `z-30`.
    * Widgets Dashboard (Horloge, Combat) : `z-40+` (toujours accessibles).

## 5. Raccourcis & Gestes
* `Sun / Moon Icon` : Toggle fond clair/sombre.
* `Crayon` : Raccourci par défaut.
* `Gomme` : Taille fixe large pour un nettoyage rapide.
