# 📦 Architecture : Stores & État Global (Zustand)

GM-OS v5 utilise **Zustand** pour la gestion de l'état global. Chaque module important possède son propre store pour minimiser les re-renders et faciliter la maintenance.

## Stores Principaux

### 1. `useSessionStore`
Gère les données de la campagne active, de la chronologie et des entités.

### 2. `useDiceStore`
Centralise la logique de projection et l'historique des dés.
- **Dernier jet (`lastRoll`)** : Mémorise le résultat pour l'affichage hub.
- **Projection (`isDiceProjected`)** : Déclenche l'overlay cinématique sur le Player Hub.
- **Persistance** : Utilise `localStorage` pour synchroniser l'état entre la fenêtre MJ et les fenêtres Joueurs.

### 3. `useLayoutManager`
Gère la persistance de l'interface (modules actifs, thèmes, panneaux ouverts) par campagne.

### 4. `useAudioStore` (et dérivés)
Gère le volume et l'état de lecture pour `Music`, `Sound`, `Ambient` et `Voice`.

## Mécanismes de Synchronisation

### Cross-Window Sync
Pour les fenêtres secondaires (Player Hub), nous utilisons un écouteur d'événement `storage` qui déclenche `Store.persist.rehydrate()`. Cela permet une mise à jour instantanée sans passer par des protocoles IPC lourds pour les données d'état simples.

### Persistance Sélective
Certaines parties de l'état ne sont pas persistantes (ex: timers de recherche, états de chargement) pour éviter des comportements incohérents au redémarrage.
