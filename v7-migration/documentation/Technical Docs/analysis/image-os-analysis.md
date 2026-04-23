# Analyse : Image OS

Ce document recense exhaustivement les fonctionnalités natives du module **Image OS** de GM-OS v3, en vue de leur refonte dans l'architecture v5 (React/Tailwind/Zustand + Electron/Tauri IPC).

## 1. Description Générale

Image OS est un module dédié à l'affichage et la projection d'images (illustrations, plans de ville, portraits de PNJs) soit sur le **Player Hub** (écran partagé réseau web), soit sur un moniteur externe (une seconde fenêtre Electron). Il gère une playlist dynamique locale avec possibilité d'avance/retour rapide.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Bibliothèque) :**
  * Bouton "☁️ Ajouter Images" : Ouvre l'explorateur système pour importer un lot d'images.
  * Bouton "📂 Charger Preset" : Charge une playlist d'images (format JSON custom `.imglist`).
  * Bouton "💾 Sauvegarder" : Sauvegarde la playlist courante (`.imglist`).
  * Bouton "⚠️ Tout Effacer" : Vide la playlist courante (avec confirmation).
* **En-tête Principal (Main Header) :**
  * Titre du module ("Image OS", accent bleu fluo `#00d2ff`).
  * Contrôles de navigation : "◀" (Précédent) et "▶" (Suivant).
  * Sélecteur d'écran cible (`image-screen-select`) : "📽️ Player Hub" (par défaut) ou "Ecran 1", "Ecran 2" (selon les moniteurs détectés par Electron).
  * Bouton "🔄" : Rafraîchit manuellement la liste des écrans physiques détectés.
  * Bouton "▶ LANCER" : Envoie la **première image cochée "active"** vers la cible de projection.
  * Bouton "NOIR" : Stoppe la projection actuelle (sur le Hub ET les écrans physiques) et coupe la fenêtre d'affichage.
* **Zone d'Affichage (Grid/List) :**
  * Liste défilante des images chargées dans la playlist.
* **Tuile d'Image (`.img-card`) :**
  * Miniature de l'image (Thumb).
  * Nom du fichier.
  * Checkbox (Switch) pour marquer "actif/inactif" l'image lors d'un lancement séquentiel.
  * Bouton "SOLO" : Lance immédiatement cette image spécifique indépendamment des checkboxes.
  * Bouton "✖" : Retire l'image de la playlist.
  * Surlignage (classe `.active-projection`) si l'image est celle présentement affichée.

## 3. Logique Métier & Comportements

* **Structure d'une Image (Modèle de données) :**
  * `path` : Chemin absolu local vers le fichier image (uniquement local en V3).
  * `active` : Booléen décrétant si l'image fait partie du diaporama activé lors de l'appui sur "LANCER".
* **Raccourcis Clavier :**
  * Mode "Fleches Gauche/Haut" : Appel à `navigate(-1)` (Image active précédente).
  * Mode "Fleches Droite/Bas" : Appel à `navigate(1)` (Image active suivante).
* **Navigation Intelligente :**
  * La navigation par touches saute automatiquement les images non-cochées (`active: false`). Elle boucle de la fin vers le début.
* **Logique de Projection :**
  * **Transitions :** Lors du passage d'une image à une autre (ou au noir), la transition doit s'effectuer impérativement de façon fluide via un "fade out" puis "fade in".
  * **Vers le "Player Hub" :** Utilise `ipcRenderer.send('sync-hub-data', 'image', imagePath)`. Le main process s'occupe du relayage WebSockets vers les tablettes des joueurs.
  * **Vers un Moniteur ("Ecran X") :** Utilise `ipcRenderer.send('launch-display', [imagePath], projectionTarget)`. Ouvre/met à jour une fenêtre Electron borderless sur le moniteur ciblé.
* **Log :** L'ouverture ou la fermeture d'une image génère un événement textuel dans le journal "Log OS" (ex: `"Projection sur Player Hub : mon_image.jpg"` ou `"Fin de projection (Noir)"`).

## 4. Persistance (Gestion d'État)

* **Sauvegardes Presets (`.imglist`) :**
  * Enregistrées dans le dossier `Save/Images/` de l'application via `fs.promises`.
