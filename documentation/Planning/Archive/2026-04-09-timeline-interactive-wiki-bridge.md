# Walkthrough : Timeline Interactive & Wiki Bridge (v6.1.3-dev)

**Date :** 9 Avril 2026
**Auteur :** Antigravity AI
**Sujet :** Unification du Lore (Wiki) et de la Chronologie (Timeline)

## 🎯 Objectif
Permettre au Maître du Jeu de dater des éléments du Wiki pour qu'ils apparaissent automatiquement dans la chronologie de la campagne, créant ainsi une ligne du temps historique dynamique et navigable.

## 🛠️ Changements Réalisés

### 1. Évolution du Modèle de Données (`types.ts`)
- Ajout de la propriété optionnelle `eventDate?: string` à l'interface `WikiEntry`.
- Cette modification est rétrocompatible avec tous les articles existants.

### 2. Interface de Saisie (`WikiEntryForm.tsx`)
- Nouveau champ **"Date de l'événement"** ajouté au formulaire de création/édition d'article.
- Support des formats textuels (ex: "1250 DG", "Ère du Chaos") pour s'adapter à tous les univers.

### 3. Moteur de Fusion Virtuelle (`TimelineView.tsx`)
- Implémentation d'une logique de fusion au runtime :
  - Filtrage des articles Wiki possédant une date.
  - Transformation en objets compatibles avec la Timeline (Virtual Projection).
  - Trier chronologique basé sur les dates et fallback sur les IDs.
- Ajout de badges visuels **WIKI** pour distinguer les sources.

### 4. Navigation Bidirectionnelle (Interactivité)
- Implémentation du pattern **Deep-Linking** :
  - Cliquer sur un événement Wiki dans la Timeline déclenche l'action `setSelectedWikiEntryId`.
  - Basculement automatique sur l'onglet **Wiki** via `setWikiTab`.

### 5. Affichage Contextuel (`WikiView.tsx`)
- La date de l'événement est désormais affichée en haut de l'article pour renforcer le contexte historique.

## 🐛 Correctifs de Stabilité
- Résolution d'une erreur 500 (Vite Internal Server Error) due à un import manquant de `LucideHistory` (alias de `History`) dans `WikiView.tsx`.

## 🧪 Validation
- Création d'un article "Chute de l'Empire" daté de "1500".
- Vérification de l'apparition immédiate dans la Timeline.
- Validation du clic de navigation vers le Wiki.
- Test de suppression des entrées Wiki et vérification de la suppression automatique de la projection dans la Timeline.

---

*Dernière mise à jour : 9 Avril 2026*
