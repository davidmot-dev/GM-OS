# Walkthrough : Persistance Media Hub (Mars 2026)

Cette mise à jour introduit la fonctionnalité de **Persistance** pour les assets du Media Hub, permettant de protéger des fichiers (images, sons, documents) contre le nettoyage automatique.

## ✨ Nouvelles Fonctionnalités

### 🔒 Verrouillage de Persistance
Vous pouvez désormais marquer n'importe quel média comme "Persistant" depuis le panneau de détails tactiques.
- **Protection** : Un média persistant est ignoré par le `MediaCleanupService`.
- **Indicateur visuel** : Une icône de bouclier ou de cadenas apparaît sur l'asset dans le Media Browser.

### 🛠️ Intégration Store & DB
- **Migration IndexedDB** : Passage à la version 3 pour supporter le flag de persistance.
- **Protection Native** : Le service de nettoyage vérifie désormais le flag `isPersistent` avant toute suppression d'orphelin.

## 🧪 Validation Technique
- [x] **Store** : Action `toggleMediaPersistence` fonctionnelle dans `useMediaStore`.
- [x] **Logique** : `MediaCleanupService` mis à jour pour filtrer les items persistants.
- [x] **UI** : Composants `TacticalDetailPanel` et `MediaBrowser` mis à jour.

---
*Date : 24 Mars 2026*
*Version : v5.1.2*
