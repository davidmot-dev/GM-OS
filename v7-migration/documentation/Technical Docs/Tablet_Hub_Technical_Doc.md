# 🛠️ Tablet Hub : Architecture Technique

Le **Tablet Hub** est un module "second-screen" pour GM-OS v5. Il fonctionne comme une instance web légère de l'application, synchronisée en temps réel avec le processus principal (Electron/Vite) via WebSocket.

## 🏗️ Architecture "Bridge-less"

Contrairement au reste de l'application (Renderer), le Hub peut s'exécuter dans un navigateur distant (tablette, smartphone). Il ne peut donc pas accéder à l'objet `window.appBridge` natif d'Electron.

### Stratégies de Substitution

1.  **WebSocket (Differential Sync)** : Toute l'activité de l'état global (Stores Zustand) est capturée par `App.tsx` (le "Maître") et diffusée via un serveur WebSocket local (Port 3001). Le système n'envoie que les *deltas* (segments de store modifiés) via `getDifferentialPayload`.
2.  **Local Asset Middleware (HTTP Proxy)** : Les images ne sont plus envoyées en Base64. Le MJ PC cache les blobs dans un dossier temporaire et le Hub les récupère via des URLs HTTP directes (`http://[IP]:3001/temp/m-xxx`).
3.  **AppBridge v2 (Standardisation)** : Utilisation d'interfaces TypeScript strictes pour sécuriser les échanges entre le Main Process et le Renderer, facilitant une future migration vers Tauri v2.
4.  **Client Identity & Persistence** : Chaque terminal génère un `deviceId` persistant (UUID). Les joueurs s'authentifient via un **Lobby Onboarding** pour choisir leur pseudonyme et leur rôle.

## 🔄 Protocole de Synchronisation

Le Hub utilise un modèle de synchronisation "One-Way" (Maître vers Esclave) :

### Flux de Données :
1.  Le MJ modifie un état (ex: remplit un segment de jauge).
2.  `App.tsx` détecte le changement via une souscription (`useClockStore.subscribe`).
3.  L'application prépare un payload `sync` contenant les extraits pertinents des stores :
    - `clock`: `isClockProjected`, `timestamp`, `tensions`, `theme`.
    - `combat`: `combatants` (avec avatars résolus), `round`, `currentTurnIdx`.
    - `entities`: Liste filtrée des PNJ/Monstres de la campagne active (`activeCampaignId`) marqués comme `isVisibleByPlayers`.
    - `liveEntity`: L'entité actuellement projetée en "Spotlight".
    - `liveImagePath`: Image d'ambiance ou de scène projetée.
    - `voiceLevel`: Intensité sonore pour le visualiseur.
4.  Le payload est envoyé via IPC au Main Process Electron, puis diffusé vers tous les clients WebSocket connectés.
5.  Le `TabletHub.tsx` reçoit le message `sync` et met à jour ses stores locaux via `useStore.setState()`.
6.  **Filtrage Intelligent** : Pour optimiser la bande passante, le MJ n'envoie que les entités dont l'ID de campagne correspond à la session active, évitant ainsi de charger des PNJ d'autres aventures sur la tablette.

## 🛡️ Session Manager & Robustesse

La v5.1 introduit le `SessionManager.ts` (Main Process) pour gérer la persistance des connexions :

- **Ghost State (Fantôme)** : Si une tablette perd le Wi-Fi, elle n'est pas immédiatement déconnectée. Elle passe en état "fantôme" pendant 2 minutes, permettant une reconnexion transparente.
- **Session Takeover** : Un joueur peut reprendre sa session sur un autre appareil (nécessite l'approbation du MJ via le Lobby).
- **Lobby Monitor** : Interface intégrée au MJ pour visualiser les terminaux connectés et leur état de santé.

## 📦 Structure du Composant `TabletHub.tsx`

```mermaid
graph TD
    A[App.tsx - Master] -- IPC: broadcast-sync --> B[Main Process Electron]
    B -- WebSocket: 3001 --> C[Tablet Hub Client]
    C --> D[Socket Listener: remote:register]
    D --> E[SessionManager: Track deviceId]
    E --> F[Store Update: isClockProjected, etc.]
    F --> G[UI Render: Clock, Tensions]
```

### Écrans de Rendu :
- **Narrative Clock** : Utilise le `ClockVisualizer`.
- **Jauges de Tension** : Rendu dynamique via une grille responsive.
- **Grille de Projection Unifiée** : Utilise le composant `HubProjectionCard` pour afficher les entités et images.
- **Déduplication Intelligente** : Un algorithme de filtrage (ID > Nom > Image) garantit qu'une entité n'apparaît qu'une seule fois à l'écran, même si elle est à la fois "Projetée" et "Synchronisée".
- **Trombinoscope** : Galerie interactive filtrant les entités reçues via WebSocket.
- **Détails PNJ** : Vue modale immersive.
- **Footer Réactif** : Indicateur de volume sonore (`voiceLevel`) intégré pour un feedback vocal en temps réel.

## 🧪 Tests Automatisés

Le Hub est couvert par `src/components/__tests__/TabletHub.test.tsx` :
- **Mocks Vitest** : Simulation des stores Zustand avec injection manuelle de `.persist.rehydrate`.
- **Validation DOM** : Vérifie l'absence de composants lourds comme `Map-OS` pour garantir la légèreté sur mobile.
- **Réactivité** : Teste le masquage automatique de l'horloge selon la projection.
