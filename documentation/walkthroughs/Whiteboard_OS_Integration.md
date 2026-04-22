# Walkthrough : Integration Whiteboard-OS & Persistence

Whiteboard-OS utilise un système de dessin vectoriel performant couplé à une couche de persistance Zustand.

## 🏗️ Architecture Technique
- **`DrawingCanvas`** : Le cœur du module. Il utilise l'API Canvas HTML5 pour le rendu, mais stocke les données sous forme de `DrawingPath` (objets JSON) plutôt que de bitmaps simples. Cela permet l'Undo/Redo granulaire.
- **Store `useWhiteboardStore`** : 
    - Gère l'état global des tracés.
    - Implémente une pile d'historique (`undoStack`, `redoStack`).
    - Gère les cibles de projection via le bridge Electron/Tauri.

## 💾 Stratégie de Persistance
Le Whiteboard est sauvegardé automatiquement dans le `LocalStorage` :
- **Persistant** : Tous les tracés standard, les couleurs et les formes.
- **Éphémère** : Le tracé du **Laser Pointer** est marqué comme `isTemporary` et n'est jamais sauvegardé ni ajouté à l'historique, garantissant un nettoyage automatique.

## 🔗 Flux d'Exportation Wiki
Le bouton Export déclenche un pipeline complexe mais fluide :
1. **Extraction** : Le composant canvas génère un `Blob` via `canvas.toBlob()`.
2. **Ingestion Media** : Le `MediaStore` enregistre le fichier et génère un `mediaId` unique.
3. **Lien Wiki** : Le `SessionOSStore` crée une entrée de wiki en injectant le `mediaId`. Le dessin devient alors une ressource partagée accessible via les dossiers de session.

## ✅ Points de Vérification
- Validation de la réactivité du **Laser Pointer**.
- Test de l'isolation des formes (Rect vs Circle).
- Vérification de l'encapsulation de l'exportation (Blob -> File object).
- Test de la projection multi-canaux.
