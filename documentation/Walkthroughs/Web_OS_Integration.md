# Walkthrough : Integration Web-OS & Bridge Système

Web-OS agit comme un "launcher" d'URL hautement intégré au système hôte via le protocole Bridge de GM-OS.

## 🏗️ Architecture Technique
- **Store `useWebStore`** : Gère une collection d'objets `WebLink`. Utilise Zustand avec persistance automatique pour conserver vos raccourcis entre les sessions.
- **Isolation du Bridge** : Le module n'ouvre pas les liens à l'intérieur d'une iframe (souvent bloquée par les politiques de sécurité modernes), mais délègue cette tâche au processus principal via `appBridge.web.openExternal`.

## 💾 Gestion des Flux JSON
L'import/export ne se limite pas à de la manipulation de fichiers simple :
1. **Serialization** : Les objets `WebLink` sont sérialisés en JSON.
2. **Bridge Handshake** : Le store coordonne avec le Bridge les dialogues de fichiers système pour choisir l'emplacement de sauvegarde ou de lecture.
3. **Validation** : Le système vérifie l'intégrité des données JSON lors de l'import pour éviter la corruption du store.

## 🔗 Pilotage par Snapshot (Integration Session-OS)
Web-OS supporte la fonction `applySnapshot`. Cela signifie qu'une configuration de campagne peut potentiellement injecter une liste de liens Web spécifiques dès le lancement de la session, automatisant la préparation logicielle du MJ.

## ✅ Points de Vérification
- Test de l'ouverture d'URLs via le Bridge Electron/Tauri.
- Validation de la persistance Zustand (rechargement de l'app).
- Vérification de la compatibilité des exports JSON.
- Test du mécanisme de réinitialisation ("Emergency Reset").
