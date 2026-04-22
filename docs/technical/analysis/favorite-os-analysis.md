# Analyse : Favorite OS (Panthéon des Favoris)

Ce document détaille les fonctionnalités du module **Favorite OS**, le gestionnaire de favoris de GM-OS v3. Ce module sert de point de ralliement pour les éléments les plus importants d'une campagne (PNJ, lieux, objets, notes).

## 1. Description Générale

Favorite OS est un module transversal. Il ne génère pas de contenu lui-même (sauf pour les notes), mais "capture" des éléments provenant d'autres modules (NPC OS, Session OS) pour les rendre accessibles en un clic, peu importe la campagne active.

## 2. Structure des Favoris

Le module gère quatre catégories principales :

* **NPC (PNJ) :** Personnages récurrents ou alliés précieux.
* **Place (Lieux) :** Villes, tavernes ou donjons importants.
* **Item (Objets) :** Artefacts, loot ou objets de quête.
* **Note :** Mémos rapides créés directement dans le module.

## 3. Logique de Découverte "Intelligente"

Une particularité notable de ce module est sa capacité à identifier le nom et les propriétés d'un objet même si les clés de données varient :

* **Recherche de Nom** : Si `name` ou `title` manquent, il cherche dans les clés `first_name`, `prenom`, `last`, `nom`, etc.
* **Affichage Dynamique** : La vue détaillée (`viewItem`) parcourt toutes les propriétés de l'objet et les affiche sous forme de paires Label/Valeur, en ignorant les métadonnées internes (`id`, `dateAdded`).

## 4. Fonctionnalités Clés

* **Gestion des Doublons** : Empêche d'ajouter deux fois le même élément (basé sur le nom calculé).
* **Vue Détaillée (Modal)** : Utilise un système de modal global (`detail-modal`) pour afficher la fiche complète d'un favori sans quitter l'onglet.
* **Envoi au Combat** : Un bouton dédié permet d'envoyer un PNJ favori directement dans le Combat OS.
* **Notes Rapides** : Interface simplifiée pour ajouter des mémos textuels (Titre + Contenu multi-ligne).

## 5. Persistance & Portabilité

* **LocalStorage** : Les favoris sont sauvegardés automatiquement dans le `localStorage` du navigateur/Electron, ce qui les rend persistants même après un redémarrage de l'application.
* **Import/Export JSON** : Permet de sauvegarder ses favoris dans un fichier externe (`favorites.json`) pour les transférer ou les sauvegarder de manière plus permanente.

## 6. Perspectives pour v5

* **Tags & Recherche** : Ajouter un système de tags pour filtrer les favoris quand la liste devient longue.
* **Drag & Drop Inter-Module** : Permettre de glisser-déposer un favori directement sur une carte (Map OS) ou dans une session (Session OS).
* **Édition Directe** : Pouvoir modifier les propriétés d'un favori sans avoir à le supprimer et le recréer depuis sa source.
* **Multi-sélection** : Envoyer plusieurs favoris au combat à la fois.
