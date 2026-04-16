# ⚙️ Documentation Technique : GM Remote Control Architecture

Ce document détaille l'implémentation du système de contrôle déporté (Remote Control) pour GM-OS v5.

## 🏗️ Architecture Globale (Nexus Sync v6)

Le système repose sur une communication **Full-Duplex** via WebSockets et un serveur de médias hybride, orchestré par la classe `SyncServer`.

### 1. Nexus Sync Server (Main Process)
- **Fichier** : `electron/SyncServer.ts`
- **Rôle** : 
    - **WebSocket Server** : Gère les connexions entrantes des clients (Player Hub, Tablettes, Mobiles).
    - **Media Proxy** : Sert les fichiers locaux (`/media/`) et les assets temporaires (`/temp/`) via HTTP pour contourner les restrictions CORS/Security des navigateurs mobiles.
    - **Role Management** : Identifie les clients par leur rôle (`gm`, `player`, `remote`).
    - **P2P Relay** : Permet le transfert direct de messages entre clients (ex: Chats) sans traitement par le GM PC.

### 2. Pont de Communication (Preload)
- **Fichier** : `electron/preload.ts`
- **Bridge API** : `window.appBridge.nexus`
- **Méthodes** :
    - `getConnectionInfo()` : Récupère l'IP locale et le port du serveur de média.
    - `onSyncClients(callback)` : Liste des terminaux connectés en temps réel.

### 3. Orchestration Nexus (Renderer Process)
- **Fichier** : `src/modules/system/logic/NexusService.ts`
- **Rôle** : 
    - **Nexus Link** : Maintient le heartbeat et la reconnexion automatique.
    - **Delta Sync** : Calcule les différences d'état avant diffusion pour optimiser la bande passante.
    - **Biometric Signature** : Gère l'unicité de connexion par personnage via `character_taken`.


## 📡 Protocole de Communication

Les messages sont échangés au format **JSON**.

### Mobile ➔ PC (Actions)
```json
{
  "type": "dice:roll",
  "payload": { "die": 20 }
}
```
Types supportés :
- `dice:roll`, `dice:clear`
- `sound:trigger` (via `SoundController`), `sound:volume`, `sound:stop-all`
- `ambient:trigger` (Theme auto-play/toggle logic), `ambient:scene`
- `combat:update-hp`, `combat:next-turn`
- `storyboard:trigger`

### 4. Specialized Trigger Logic (Main PC)
Pour garantir une expérience fluide, certaines actions ne sont pas de simples appels aux stores :
- **Sound-OS** : Les triggers distants utilisent `SoundController.togglePad()`. Cela garantit que si le tampon audio (buffer) n'était pas pré-chargé (onglet fermé), il est chargé dynamiquement avant la lecture. Cela gère aussi le déblocage forcé du contexte audio et la synchro Hue.
- **Ambient-OS** : Le trigger d'un thème (`loadTheme`) est suivi d'un auto-play de toutes les pistes actives (volume > 0). Appuyer à nouveau sur le même pad déclenche un `fadeOutAll()`, simulant un bouton On/Off physique.
- **Music-OS** : Les actions `playPad` forcent la résolution de l'ID MediaStore (`m-xxxx`) avant l'assignation à la platine.

### PC ➔ Mobile (Sync)
```json
{
  "type": "sync",
  "payload": {
    "sounds": [...],
    "moments": [...],
    "masterVolume": 0.8,
    "combat": {...},
    "notes": { "public": "...", "private": "..." }
  }
}
```

## 🛠️ Optimisations et Sécurité

1.  **Lazy Loading** : Le composant `RemoteControl` est chargé via `React.lazy`. Cela garantit que le navigateur mobile ne tente jamais d'importer des modules qui utiliseraient des API Node.js ou Electron, ce qui provoquerait un crash immédiat.
2.  **Robustesse Réseau** : Le serveur Vite est configuré avec `host: '0.0.0.0'` pour être accessible sur toutes les interfaces réseau du PC hôte.
3.  **Haptic Feedback** : Utilisation de `navigator.vibrate` sur les actions critiques pour améliorer l'expérience tactile.
4.  **Détection IP** : Le script de détection d'IP dans `main.ts` filtre les interfaces internes (loopback) et privilégie les adresses IPv4 valides pour la génération du QR Code.

---

## 🛑 Limites connues
- Nécessite d'être sur le même sous-réseau (WiFi).
- Pas de support HTTPS natif en local (peut poser problème avec certaines API de navigateur mobile comme la vibration si non servi via localhost ou HTTPS).
