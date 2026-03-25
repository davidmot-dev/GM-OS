# Analyse : NPC OS (Générateur Universel)

Ce document détaille les fonctionnalités du module **NPC OS** de GM-OS v3. Malgré son nom, ce module est en réalité un "Générateur Universel" capable de créer au hasard des PNJ, des Lieux, des Objets, des Événements et des Rumeurs, le tout depuis des banques de données locales.

## 1. Description Générale

NPC OS lit des fichiers JSON contenant des listes de caractéristiques ou de traits (ex: Noms, Traits de personnalité, Alignement) et pioche aléatoirement dans chacune de ces listes pour assembler une "Entité" (PNJ, Objet, Lieu...) cohérente. Il offre la possibilité de customiser l'entité (avatar, notes) et de l'interconnecter avec d'autres modules (Combat OS, Session OS, Favoris).

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Réglages & Historique) :**
  * **Catégorie de Génération (`generator-mode-select`) :** Sélecteur principal entre PNJ, LIEU, OBJET, ÉVÉNEMENT, RUMEUR.
  * **Univers/Thème (`npc-universe-select`) :** Le dossier/fichier JSON source à cibler (ex: "fantasy", "cyberpunk").
  * **Type Secondaire (`place-type-select`) :** (Masqué pour les PNJ). Permet de sous-catégoriser (ex: un Lieu peut être une "Auberge", une "Boutique").
  * **Bouton d'Action Primaire :** "🎲 GÉNÉRER [CATÉGORIE]".
  * **Historique Local (`npc-history-list`) :** Affiche une liste des dernières générations conservées en "Mémo", avec un bouton "👁️" pour les recharger et "✖" pour les supprimer de la liste.
  * **Outils d'historique :** Boutons pour exporter/importer l'historique en JSON, ou tout effacer.
* **Affichage Principal (Main - La Carte) :**
  * S'affiche sous la forme d'une belle "Card" (`.cinema-npc-card`) au style "Glassmorphism".
  * **Avatar :** Une lettre ou une image cliquable permettant au MJ de charger un portrait personnalisé.
  * **En-tête :** Type généré (ex: "NPC"), Nom (calculé intelligemment par le Renderer), et un numéro ID aléatoire cosmétique.
  * **Grille de champs (`fields-grid`) :** Affiche tous les champs piochés du JSON (ex: Attitude: Hostile, Arme: Dague), hormis le nom et l'ID.
  * **Barre d'actions (`card-footer`) :**
    * "⭐ FAVORIS" : Envoie dans le module Favoris.
    * "💾 MÉMO" : Enregistre l'entité de manière permanente dans l'historique local visible sur la gauche.
    * "📝 NOTES" : Copie le résumé de l'entité dans le log de Session OS.
    * "⚔️ COMBAT" : (Disponible **uniquement** si c'est un PNJ) - Transfère directement l'entité dans le Combat Tracker avec 20 PV par défaut.
  * **Notes MJ (Privées) :** Un bloc de texte libre (`textarea`) pour que le MJ puisse ajouter des notes textuelles à la volée.

## 3. Logique Métier & Comportements

* **Architecture des Bases de Données :**
  * Lit le dossier `databases/`.
  * Sous-dossiers attendus : `npcs`, `places`, `items`, `events`, `rumors` (Chacun correspondant à une valeur de `<select id="generator-mode-select">`).
  * Format pour `npcs` : `Theme.json` (ex: `Fantasy.json`).
  * Format pour le reste : `Theme_SousType.json` (ex: pour un item -> `Fantasy_Arme.json`).
  * Le contenu du JSON s'attend à être un simple lexique de tableaux (ex: `{ "nom": ["Bob", "Alice"], "trait": ["Avare", "Généreux"] }`).
* **Algorithme de Génération :**
  * Itère sur chaque propriété principale du JSON (`Object.entries`).
  * Si c'est un Array, effectue un tirage `Math.random()`.
  * Crée un objet "Entité" (le `currentNPC`) regroupant les valeurs tirées.
  * Un champ interne vide `gmNotes` est ajouté d'office à la création.
* **Calcul d'Identification Intelligent (`getName`) :**
  * Puisque l'outil est "générique", la base JSON peut avoir appelé le titre "Titre", "Name", "Nom", "Prénom" + "Nom".
  * Le code du renderer (lignes 13-40) possède un regex intelligent qui parcourt les clés de l'objet pour tenter de déduire quel champ utiliser comme En-tête principal, priorisant `titre`, puis `name`, puis la combinaison de `prenom` + `nom`.
* **Import d'Avatar :**
  * Clique sur l'avatar rond -> Ouvre le sélecteur natif (`ipcRenderer.invoke('open-image-dialog')`).
  * Remplace l'initiale paryectee en `<img>` respectant le ratio (`object-fit: cover`).

## 4. Persistance (Gestion d'État)

* La persistance opère à un double niveau sur le "Mémo" (la liste d'historique `savedNPCs` à gauche).
    1. Méthodes `importState(data)` et `exportState()` pour sauvegarder la liste *lorsque Session OS fait son cycle de sauvegarde*.
    2. Possibilité d'export manuel et import manuel via des presets physiques (`.json`).
* L'Entité générée "courante" (`currentNPC`) est temporaire tant que le bouton "MÉMO" n'a pas été pressé.
