# 🛠️ Tablet Hub : Architecture Technique

Le **Tablet Hub** est un module "second-screen" pour GM-OS v5. Il fonctionne comme une instance web légère de l'application, synchronisée en temps réel avec le processus principal (Electron/Vite) via WebSocket.

## 🏗️ Architecture "Hybrid Bridge" (v7 Tauri)

Le Hub peut désormais s'exécuter dans deux contextes distincts :

1.  **Mode Local (Player Hub Window)** : Exécuté comme une fenêtre native Tauri sur le même PC que le MJ. Il accède à l'objet `window.appBridge` et utilise l'**IPC haute vitesse** (Tauri `emit`/`listen`).
2.  **Mode Distant (Tablet/Smartphone)** : Exécuté dans un navigateur externe via le protocole **Nexus**. Il ne peut pas accéder au bridge et repose exclusivement sur **WebSocket**.

### Protocole de Résilience (Nexus v6.1)
Le Hub utilise un **Enregistrement Réactif**. Contrairement aux versions précédentes, l'identité (Pseudo, Personnage) est transmise dès la sélection dans le Lobby via un message `remote:register`. Si l'identité change, une re-validation immédiate est effectuée pour garantir l'unicité de la session.

### Stratégies de Synchronisation

1.  **IPC (Array Spreading)** : Sous Tauri v2, les données sont envoyées via `AppBridge.send`. Le récepteur (Player Hub) déballe les arguments pour mettre à jour ses hooks `useHubSync` instantanément.
2.  **WebSocket (Differential Sync)** : Pour les clients distants, le MJ PC continue de diffuser les deltas via un serveur WebSocket local (Port 3001).
3.  **Local Asset Middleware (Tauri asset://)** : Sur le Player Hub local, les images utilisent le protocole `asset://`. Pour le Hub distant, elles transitent par le proxy HTTP local.

---

## 🔄 Protocole de Synchronisation

```mermaid
graph TD
    A[App.tsx - Master] -- IPC: send --> B[AppBridge]
    B -- Tauri emit: image:sync-hub-data --> C[Player Hub Window]
    B -- WebSocket: 3001 --> D[Remote Tablet Client]
    C -- useHubSync hook --> E[Local Store Update]
    D -- Socket Listener --> F[Remote Store Update]
```

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

- **Session Takeover** : Un joueur peut reprendre sa session sur un autre appareil (nécessite l'approbation du MJ via le Lobby).
- **Lobby Monitor** : Interface intégrée au MJ pour visualiser les terminaux connectés, leur état de santé, et gérer les verrous de personnages.
- **Protocole d'Éjection (Force Reset)** : Le MJ peut envoyer un signal `remote:eject-all` qui ordonne à tous les clients de vider leur `localStorage` (`resetIdentity`) et ferme physiquement les sockets.

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
- **Messaging Hub & Notifications (v5.7)** : 
    - **Isolation des Canaux** : Filtrage strict des messages basés sur `toId`. Le canal "Tous les Joueurs" (`all`) est isolé des dialogues privés (PJ <-> MJ ou PJ <-> PJ).
    - **Notification Toast** : Système d'alerte global (`activeToast`) géré par le parent `TabletHub.tsx`. Lorsqu'un message arrive sur un canal inactif, un toast `framer-motion` est déclenché.
    - **Auto-Read & Navigation** : Cliquer sur une notification met à jour le `selectedRecipientId` et déclenche un reset du timer `lastReadMessageTime` pour synchroniser le badge d'inbox.

### 2.4 Système de Dés & Projection
- **Synchronisation Visuelle (v7.0.6)** : Utilisation systématique de `getDieCssClass` (issu de `DiceUIUtils.ts`) pour garantir une parité parfaite avec le MJ.
- **Support Year Zero Engine (YZE)** : Différenciation immédiate des dés de **Base** (B) et d'**Équipement** (G) via des couleurs (Jaune vs Cyan) et des labels incrustés.
- **Feedback Haptique** : Déclenchement de `navigator.vibrate` lors de la réception d'un résultat de dé pour renforcer l'immersion sur mobile.

### 2.5 Notes Privées PJ (v7.0.6)
- **Interface Étendue** : Dimensionnement `max-w-xl` pour maximiser l'espace utile sur tablette.
- **Saisie Confortable** : Zone de texte (`textarea`) avec hauteur fixe de 640px pour permettre une prise de notes complexe sans défilement constant de la page parente.
- **Persistance** : Synchronisation bi-directionnelle avec le store MJ via le hook `remoteUpdateCharacterNarrative`.

## 🧪 Tests Automatisés

Le Hub est couvert par `src/components/__tests__/TabletHub.test.tsx` :
- **Mocks Vitest** : Simulation des stores Zustand avec injection manuelle de `.persist.rehydrate`.
- **Validation DOM** : Vérifie l'absence de composants lourds comme `Map-OS` pour garantir la légèreté sur mobile.
- **Réactivité** : Teste le masquage automatique de l'horloge selon la projection.
