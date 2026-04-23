# 🛡️ Standard d'Architecture : Bridge GM-OS (Electron/Tauri)

## 1. Vision & Objectif

L'architecture **Bridge** de GM-OS est conçue pour garantir une isolation totale entre la couche de présentation (React) et la couche système native. Cette séparation permet trois avantages critiques :
- **Sécurité** : Aucune API Node.js/OS n'est exposée directement au Web.
- **Portabilité** : Le passage d'Electron à Tauri (ou inversement) se fait sans toucher une seule ligne de code UI.
- **Robustesse** : Centralisation des interfaces système dans un contrat unique.

## 2. Règle d'Or : Isolation Stricte

Il est **strictement interdit** d'importer les modules suivants dans `/src/renderer` :
- `electron` (ipcRenderer, remote, etc.)
- `fs`, `path`, `os`, `child_process`
- Tout package Node.js natif.

**Méthode unique d'accès :** L'objet global `window.appBridge`.

## 3. Structure du Bridge (`window.appBridge`)

Le bridge est structuré par module fonctionnel pour éviter un objet "fourre-tout" massif.

### Exemple de structure :
```typescript
interface AppBridge {
    system: SystemBridge;    // Boot, Versions, Logs
    image: ImageBridge;      // Projections, Écrans
    audio: AudioBridge;      // Périphériques, Gain Master
    voice: VoiceBridge;      // Worklets, Transcription
    nexus: NexusBridge;      // P2P, WebSocket Sync
}
```

## 4. Communication Inter-Fenêtres

Dans un environnement multi-fenêtres (MJ, Hub, Projecteurs), la synchronisation suit ce protocole :

### A. Le Store Persistant (Zustand + Storage)
- Utilisé pour l'état de "fond" (Campagne, Paramètres).
- Les fenêtres secondaires écoutent l'événement global `storage` et appellent `Store.persist.rehydrate()`.

### B. Le Canal Direct (IPC Broadcast)
- Utilisé pour les actions temps-réel (Projection flash, Blackout, Volume).
- **Verrouillage IPC** : Pour éviter que le Store (plus lent à se synchroniser) n'écrase une commande directe, les fenêtres d'affichage utilisent un compteur `ipcCount`. Une fois le premier IPC reçu, le Store local est ignoré au profit du flux IPC.

## 5. Meilleures Pratiques

1. **Typage Strict** : Toutes les interfaces du Bridge doivent être définies dans `window.d.ts` et utiliser les types métiers du dossier `types/`.
2. **Promisification** : Toutes les méthodes du Bridge doivent être asynchrones (`Promise`) pour ne pas bloquer le thread UI.
3. **Mocks de Test** : Pour les tests Vitest, simulez systématiquement `window.appBridge` pour tester la logique métier sans avoir besoin d'un environnement Electron.

---
*Date de création : 16 Avril 2026*
*Version : 1.0 (v6 Stabilization Wave)*
