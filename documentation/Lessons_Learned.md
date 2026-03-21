# 🧠 Lessons Learned : GM-OS v5 (Architecture Bridge & Sync)

Ce document répertorie les défis techniques, les erreurs commises et les solutions adoptées au cours de la refonte de GM-OS v5 vers une architecture moderne.

## 1. Gestion des Médias & WebSocket

### Défi
Le transfert systématique d'images (avatars, fonds de carte) via WebSocket en Base64 saturait la bande passante du MJ PC et ralentissait le rendu sur tablette (parsing CPU intensif).

### Leçon
L'utilisation de **DataURIs massif** n'est pas viable pour une application temps-réel multi-client.

**Solution :** Mise en place d'un **Local Asset Middleware (HTTP Proxy)**. Les fichiers sont mis en cache dynamiquement sur le disque et servis par un port dédié. Les messages WebSocket ne contiennent plus que des URLs courtes.

## 2. Synchronisation de l'État Global

### Défi
Envoyer le store complet à chaque changement (Zustand subscribe) créait des "chocs" de données (payload > 1Mo) pour des modifications mineures (ex: une seconde de l'horloge).

### Leçon
La synchronisation brute ("Full Sync") est inefficace.

**Solution :** **Differential Sync (Deltas)**. Utilisation d'un utilitaire `isDeepEqual` pour ne diffuser que les propriétés ayant réellement changé. Réduction de l'usage réseau de plus de 90% dans 80% des cas d'usage.

## 3. Typage TypeScript & Bridge IPC

### Défi
L'utilisation de `any` ou `unknown` dans le bridge de communication (`appBridge`) rendait le code fragile et compliquait le passage d'Electron à Tauri.

### Leçon
Le typage strict n'est pas une option pour les couches d'interopérabilité.

**Solution :** Standardisation **AppBridge v2**. Toutes les interfaces (`DisplayInfo`, `RemoteAction`, `SyncPayload`) ont été centralisées dans `window.d.ts` avec des types stricts importés des stores.

## 4. Maintenance des Données (IndexedDB)

### Défi
L'accumulation de blobs (images IA, anciens PNJ) dans IndexedDB finissait par ralentir l'application et occuper plusieurs Go d'espace disque inutilement.

### Leçon
Un store client-side doit être auto-nettoyant.

**Solution :** **MediaCleanupService**. Un scan automatique au démarrage identifie les IDs orphelins (fichiers présents en base mais plus référencés dans aucun store de campagne) et les supprime.

---

> [!TIP]
> **Règle d'or GM-OS :** Toute nouvelle fonctionnalité de synchronisation doit être testée avec un payload différentiel et un asset local pour garantir la fluidité sur les terminaux MJ et Joueurs.
