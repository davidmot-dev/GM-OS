# Analyse : Global Manager (Le Chef d'Orchestre)

Ce document détaille les fonctionnalités du **Global Manager**, le module central de GM-OS v3 qui assure la cohésion de l'application, la gestion de l'apparence et la persistance des données.

## 1. Description Générale

Le Global Manager n'est pas un onglet de contenu, mais un ensemble de services transversaux. Il gère la navigation (Navbar), les interactions utilisateur (Modales), l'esthétique (Thèmes/Wallpapers) et la synchronisation avec les écrans des joueurs.

## 2. Système de Dialogues "Non-Bloquants"

Pour éviter de figer l'interface (problème récurrent avec les fonctions natives `alert` en Electron), le Global Manager implémente son propre système de promesses :

* `customPrompt(message, default, mode)` : Affiche une boîte de dialogue stylisée.
* Modes supportés : `alert`, `confirm`, `prompt` (simple ligne) et `prompt_multi` (textarea).
* Avantage : Permet de demander une saisie utilisateur sans arrêter le rendu audio ou les animations.

## 3. Gestion de l'Apparence & Thèmes

* **Moteur de Thèmes** : Alterne entre `cyberpunk`, `medieval` et `modern` en changeant l'attribut `data-theme` sur `<html>`.
* **Mode Session** : Une bascule cruciale qui ajoute la classe `.session-focus` au body. Cela masque instantanément tous les boutons "Edit" (poubelles, plus, engrenages) pour épurer l'interface quand le MJ joue.
* **Palette de Couleurs** : Gère une liste de couleurs favorites partagées par tous les modules pour plus de cohérence visuelle.
* **Wallpaper Engine** :
  * **Base Wallpaper** : Le fond par défaut du système.
  * **Temporary Wallpaper** : Fonds spécifiques aux campagnes (Session OS) qui se restaurent automatiquement en quittant la campagne.

## 4. Persistance Globale (Save/Load)

Le Global Manager est le seul module capable d'interroger tous les autres :

* **Backup Total** : Lors d'une sauvegarde, il appelle `exportState()` sur chaque application enregistrée (`window.musicApp`, `window.combatApp`, etc.).
* **Restauration** : Lors du chargement, il distribue les données via `importState(data)`.
* **Données Globales** : Stocke aussi le thème actif, le fond d'écran et la palette de couleurs.

## 5. Synchronisation Player Hub (Projection)

Il gère le canal IPC `sync-hub-data` pour envoyer en temps réel les informations vers l'écran des joueurs :

* **Wallpapers** : Changement d'ambiance visuelle chez les joueurs.
* **Combat Tracker** : Synchronisation des PV et de l'ordre de tour.
* **Images & Horloge** : Projection directe de visuels ou de timers.

## 6. Bouton Panique (Master Fade)

Une fonction `masterFadeOut(3s)` qui parcourt les modules audio (`Music`, `Sound`, `Ambient`) pour déclencher une rampe de volume descendante simultanée.

## 7. Perspectives pour v5

* **Gestionnaire d'État (Zustand)** : Remplacer l'orchestration manuelle par un store global pour une synchronisation plus réactive.
* **Architecture IPC robuste** : Sécuriser les échanges avec le Hub via des types TypeScript stricts.
* **Système de Modales React** : Intégrer les dialogues dans le cycle de vie de React plutôt que de manipuler le DOM directement.
* **Hotkeys Globaux** : Gérer les raccourcis clavier de manière centralisée pour éviter les conflits entre modules.
