# Walkthrough : Centralisation des Paramètres & Hardware Bridge

Le module Settings est le point de convergence de plusieurs stores globaux, assurant la cohérence systémique de GM-OS v5.

## 🏗️ Architecture Multi-Store
Le module de paramètres orchestre la communication entre :
- **`useSessionStore`** : Gère les thèmes CSS et les variables de couleur d'accentuation injectées dans le document root.
- **`useHardwareStore`** : Centralise la détection des périphériques et le mapping des alias.
- **`useTacticalAIStore`** : Pilote les paramètres de l'assistance au combat.
- **`useAIStore`** : Gère les configurations cloud et les endpoints LLM.

## 🌉 Le Hardware Bridge
La détection matérielle repose sur deux piliers :
1. **Web Audio API** : Utilise `navigator.mediaDevices.enumerateDevices()` pour lister les sorties audio même en mode web standard.
2. **Native Bridge** : Pour les écrans, GM-OS communique via l'objet `window.appBridge` pour interroger directement le système d'exploitation et obtenir les coordonnées réelles des fenêtres de projection.

## 💾 Persistance & Alias Mapping
Un défi technique majeur est que les IDs de périphériques (GUIDs) peuvent changer selon le port utilisé ou les redémarrages.
- **Stratégie** : GM-OS stocke les alias en les liant aux IDs détectés.
- **Réconciliation** : Lors d'un changement d'ID, le système tente de réconcilier les anciens alias via les labels matériels si possible, garantissant que vos routages audio restent stables.

## 🧨 Factory Reset (Flush)
La fonction `flushApplication` est une procédure de nettoyage profond :
- Elle vide le `localStorage` de tous les stores.
- Elle réinitialise les bases `IndexedDB` (utilisées par le Media Hub).
- Elle force un rechargement complet de l'application pour garantir un état "Vierge".

## ✅ Points de Vérification
- Validation de l'injection des thèmes dans `data-theme`.
- Test de la réactivité des alias audio dans les panneaux de mixage.
- Vérification du status de connexion au Bridge Tauri/Electron.
- Test de persistance des clés API AI.
