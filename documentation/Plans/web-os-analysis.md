# Analyse : Web OS

Ce document recense exhaustivement les fonctionnalités natives du module **Web OS** de GM-OS v3, en vue de leur refonte dans l'architecture v5 (React/Tailwind/Zustand).

## 1. Description Générale

Web OS est un gestionnaire de signets/raccourcis pour le Maître du Jeu. Il permet d'ouvrir rapidement des liens (règles en ligne, générateurs, documents) dans le navigateur par défaut de l'ordinateur. C'est le module le plus léger de l'application.

## 2. Interface Utilisateur (UI)

* **En-tête (Header) :**
  * Titre du module ("Web OS", accent orangé `#f97316`).
  * Bouton "📂" : Charger une liste de liens (depuis un .json).
  * Bouton "💾" : Sauvegarder la liste de liens existante (vers un .json).
  * Bouton "🗑️" : Tout effacer (avec confirmation).
  * Bouton "➕ Nouveau Lien" : Ajouter un nouveau raccourci.
* **Affichage Principal (Grid) :**
  * Grille (`web-grid`) affichant des "pads" (tuiles) pour chaque lien enregistré.
* **Tuile de Lien (Pad) :**
  * Une icône centrale (🔗).
  * Le nom du lien en dessous.
  * Bordures et icône s'affichant dans la couleur personnalisée du lien.
  * Un mini-menu de contrôle au survol avec trois boutons :
    * "✏️" (Renommer).
    * "🎨" (Changer la couleur).
    * "✖" (Supprimer).

## 3. Logique Métier & Comportements

* **Structure d'un Lien (Modèle de données) :**
  * `url` (ex: "https://...")
  * `name` (nom d'affichage)
  * `color` (couleur hexadécimale de la tuile, `#f97316` par défaut)
* **Actions :**
  * **Clic sur un lien :** Ouverture de l'URL dans le navigateur externe natif du système (via `electron.shell.openExternal`).
  * **Créer un lien :** L'utilisateur est invité (`customPrompt`) à saisir l'URL, puis le Titre.
  * **Renommer :** L'utilisateur est invité (`customPrompt`) à donner un nouveau nom, en écrasant l'ancien (l'URL ne se modifie pas après coup dans la V3).
  * **Couleur :** Lie le lien sélectionné avec la palette globale (via un event global `global-color-changed`).
  * **Log :** L'ouverture d'un lien déclenche un événement dans le journal global de l'application (Log OS) : `"Ouverture du lien : [nom du lien]"`.

## 4. Persistance (Gestion d'État)

* **Sauvegarde JSON (Fichiers indépendants) :**
  * Utilise des appels inter-process Electron (`ipcRenderer.invoke('save-web-list')` et `open-web-list`) pour ouvrir des boîtes de dialogue système et sauvegarder/charger la grille actuelle.
* **État Global (Session OS) :**
  * Dispose des méthodes `exportState()` et `importState(data)` qui extraient/restaurent le tableau de liens complet pour l'incorporer dans la sauvegarde globale de la session du MJ.
