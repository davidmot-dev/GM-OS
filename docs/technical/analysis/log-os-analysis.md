# Analyse : Log OS (Journal d'Activité)

Ce document détaille les fonctionnalités du module **Log OS**, le système de journalisation centralisé de GM-OS v3.

## 1. Description Générale

Log OS est un module "passif" qui recueille les messages en provenance de tous les autres modules (Combat, Musique, Dés, etc.) pour offrir au MJ un historique chronologique de ce qui s'est passé durant la session.

## 2. Architecture & UI

* **Side Panel** : Le journal s'affiche dans un panneau latéral (`activity-log-panel`) qui peut être ouvert ou fermé via un bouton de la navbar.
* **Structure d'Entrée** : Chaque log contient :
  * Un **ID** (timestamp).
  * Une **Heure** précise (HH:MM:SS).
  * Un **Type** (catégorie du module).
  * Un **Message**.
  * Une **Icône** visuelle correspondante.
* **Limitation de Performance** : Le module limite l'affichage aux **100 dernières entrées** pour éviter de ralentir le DOM lors de sessions très longues.

## 3. Système d'Icônes par Module

Le module associe une icône unique à chaque type de message pour une lecture rapide par le MJ :

* `system`: 🖥️
* `dice`: 🎲
* `music`: 🎵
* `combat`: ⚔️
* `npc`: 👤
* `light`: 💡
* `map`: 🗺️
* (etc.)

## 4. Persistance

* Comme les autres modules, Log OS supporte `exportState()` et `importState()`.
* L'historique est sauvegardé dans le fichier de session global, permettant de reprendre une partie avec tout le journal précédent.

## 5. Perspectives pour v5

* **Filtrage par Type** : Permettre au MJ de n'afficher que les jets de dés ou que les changements de musique.
* **Logs Interactifs** : Cliquer sur un log de dé pour relancer le même jet, ou sur un log de PNJ pour ouvrir sa fiche.
* **Persistance sur Disque** : Écrire les logs dans un fichier `.log` tournant pour debug en cas de crash (en plus de l'affichage UI).
* **Niveaux de Sévérité** : Distinction visuelle entre Info, Succès, Alerte et Erreur.
