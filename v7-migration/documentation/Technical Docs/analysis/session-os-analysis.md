# Analyse : Session OS (Centre de Pilotage des Campagnes)

Ce document détaille les fonctionnalités du module **Session OS**, le cœur organisationnel de GM-OS v3. Ce module gère la structure des campagnes, le suivi des sessions, les fiches personnages (PJ/PNJ) et le journal de bord du MJ.

## 1. Description Générale

Session OS est un gestionnaire d'information hiérarchique. Contrairement aux autres modules qui sont des outils spécialisés, Session OS sert de "colle" entre les modules, centralisant les données qui seront ensuite utilisées par Map OS, Combat OS ou NPC OS.

## 2. Structure des Données

Les données sont organisées en trois niveaux :

* **Campagne :** (Nom, Système, Description, Synopsis, Notes globales, Liste de sessions, PJ, PNJ, Monstres, Fond d'écran dédié).
* **Session :** (N°, Date, Statut [Planifiée/En cours/Terminée], Chrono, Résumé public, Notes privées du MJ, Prochaine étape, Checklist, Liens externes, Liste des présents, Entités liées).
* **Entités (PJ, PNJ, Monstres) :** (ID, Nom, Personnage, Avatar, HP actuels/max, Description, Référence livre/page, Liens externes).

## 3. Interface Utilisateur (UI) Dynamique

L'interface est entièrement pilotée par `SessionRenderer.js` et propose trois vues principales :

* **Dashboard :** Liste des campagnes sous forme de cartes visuelles avec statistiques (nombre de PJ, sessions, statut Live).
* **Vue Campagne (Cockpit) :** Vue d'ensemble de la campagne choisie avec trois panneaux :
    1. **Entités** : Grilles gérant les avatars, la vie et les actions (edit, combat, favoris).
    2. **Notes de Campagne** : Synopsis et secrets du MJ.
    3. **Sessions** : Historique et création de nouvelles séances.
* **Vue Session (Détails) :** Vue opérationnelle pour le soir de partie :
    1. **Suivi d'Équipe** : Gestion des présences et bouton "Envoyer l'équipe au combat".
    2. **Rencontres** : Liaison rapide de PNJ/Monstres déjà créés ou création "à la volée".
    3. **Checklist** : Tâches à accomplir durant la séance.
    4. **Journal double** : Notes MJ (privées) vs Résumé public.
    5. **Chronomètre** : Suivi de la durée de la séance.

## 4. Logique Métier & Intégrations

* **Combat OS** : Envoi direct des PJ/PNJ/Monstres vers la grille de combat avec synchronisation bidirectionnelle des HP.
* **Map OS** : Fournit la bibliothèque de tokens (PJ/PNJ) pour l'affichage sur carte.
* **Global Manager** : Gestion des fonds d'écran (Wallpaper) spécifiques à chaque campagne qui s'activent automatiquement lors de la sélection de la campagne.
* **Chrono Session** : Timer persistant qui tourne en arrière-plan et se sauvegarde dans l'état de la session.
* **Générateur d'ID** : Utilise un système de `timestamp + random` pour garantir l'unicité des entités.

## 5. Persistance

* Le module gère sa propre sauvegarde/chargement via des fichiers JSON (`save-session-list`, `open-session-list`).
* Il effectue une migration automatique des données lors de l'import pour garantir la compatibilité avec les nouvelles versions (ajout d'ID, de champs d'avatars, etc.).

## 6. Perspectives pour v5

* **Zustand/Context** : Centraliser l'état des campagnes pour éviter les passages d'objets complexes entre renderers.
* **Rich Text** : Passer des `textarea` simples à un éditeur Markdown ou un éditeur de texte riche pour les notes de session.
* **Relations Complexes** : Possibilité de lier des PNJ à des lieux ou des objets, et pas seulement à des sessions.
