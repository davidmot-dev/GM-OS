# 📐 Walkthrough : Layout Manager Implementation

Cette mise à jour introduit le **Layout Manager**, une fonctionnalité permettant de sauvegarder et de restaurer automatiquement l'organisation de votre espace de travail (modules actifs, thèmes, panneaux ouverts) pour chaque campagne.

## 🚀 Fonctionnalités Implémentées

### 1. Persistance par Campagne
Chaque campagne (`Campaign`) possède désormais un champ `layoutConfig` qui stocke :
- Le module actif (ex: Map-OS, Combat-OS)
- L'état des panneaux (IA GEMS, Cortex Tactique)
- Le thème visuel et la couleur d'accentuation

### 2. Synchronisation Automatique
Le nouveau hook `useLayoutManager` assure la transition fluide entre les campagnes :
- **Restauration** : Dès que vous changez de campagne, l'interface s'ajuste pour retrouver votre dernier espace de travail.
- **Auto-Save** : Toute modification de l'interface (fermeture d'un panneau, switch de module) est immédiatement enregistrée dans la campagne active.

## 🛠️ Détails Techniques

### Store `SessionOS`
Mise à jour de `src/modules/session/useSessionOSStore.ts` pour inclure l'action `updateCampaignLayout`.

### Hook `useLayoutManager`
Situé dans `src/modules/session/hooks/useLayoutManager.ts`, il utilise des `refs` pour éviter les boucles infinies entre la restauration et la sauvegarde.

### Intégration Shell
Le hook est appelé au niveau global dans `src/components/Shell.tsx`, garantissant son fonctionnement sur toute l'application.

## 📝 Note sur la différence avec les Snapshots
- **Snapshots** : Capture l'état du *jeu* (musique, carte active, PV des joueurs).
- **Layout Manager** : Capture l'état de l' *interface* (votre plan de travail).

---

> [!TIP]
> Vous pouvez désormais dédier un layout spécifique au combat pour une campagne A et un layout d'exploration pour une campagne B. Le switch est transparent !
