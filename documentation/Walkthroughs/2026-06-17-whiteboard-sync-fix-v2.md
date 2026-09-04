# Walkthrough - Whiteboard-OS Stroke Disappearance Fix v2

Ce fix v2 résout la cause racine profonde de la disparition des traits sur le Whiteboard-OS — un problème qui affectait **aussi le rendu local du MJ** (sans projection), en plus de la synchronisation réseau vers le Player Hub.

## Root Cause Analysis

### Bug #1 (LOCAL — CRITIQUE) : L'effet resize détruisait le canvas à chaque frame

L'effet `useEffect` de redimensionnement dans `DrawingCanvas.tsx` et `PlayerDrawingCanvas.tsx` dépendait de `[redraw]`, un `useCallback` avec 11 dépendances volatiles. À chaque mouvement de souris, `canvas.width = ...` était appelé, **effaçant tout le contenu du canvas** même si la taille n'avait pas changé. Sur un tableau avec de nombreux tracés, le cycle clear→redraw complet causait des micro-flashes visibles.

### Bug #2 (SYNC) : Race condition dans `stopDrawing()`

Deux mutations Zustand séparées (`setActivePath(null)` puis `addPath(newPath)`) causaient deux messages de sync — le premier envoyant `activePath: null` avec l'ancienne liste de `paths`, provoquant un flash de disparition sur le Player Hub.

### Bug #3 : Données volatiles dans localStorage persist

`activePath`, `activeDrawerId`, `laserPointer` et `version` étaient inclus dans le `partialize`, causant des écritures localStorage haute fréquence inutiles pendant le dessin.

### Bug #4 : Rehydratation localStorage en conflit avec BroadcastChannel

Les listeners `storage` events appelant `persist.rehydrate()` pouvaient écraser l'état en mémoire avec une version périmée du localStorage.

---

## Changes Made

### 1. Store — Mutation atomique
* **Modified** `useWhiteboardStore.ts`:
  * Ajout de `finishDrawing(path)` — mutation Zustand unique qui fusionne `addPath()` + `setActivePath(null)`.
  * Nettoyage de `partialize` : retrait de `activePath`, `activeDrawerId`, `laserPointer`, `version`.

### 2. Canvas MJ — Rendering stable
* **Modified** `DrawingCanvas.tsx`:
  * Remplacement de l'effet `resize` (dépendant de `[redraw]`) par un `ResizeObserver` monté une seule fois (`[]`).
  * Utilisation de `redrawRef` (ref stable) pour éviter les dépendances d'effet cycliques.
  * Utilisation de `finishDrawing()` dans `stopDrawing()` pour une fin de dessin atomique.
  * Suppression du listener `storage` event qui appelait `persist.rehydrate()`.

### 3. Canvas Player — Mêmes corrections
* **Modified** `PlayerDrawingCanvas.tsx`:
  * Mêmes 4 corrections que `DrawingCanvas.tsx`.

### 4. Synchroniseur — Payload complet
* **Modified** `useNexusSynchronizer.ts`:
  * Ajout de `backgroundMode` dans le payload `syncFast('whiteboard')`.

---

## Verification & Testing

### 1. Build & Type Safety
* TypeScript checks passed, production build succeeded.
* All 220 unit tests passed (`npx vitest run`).
