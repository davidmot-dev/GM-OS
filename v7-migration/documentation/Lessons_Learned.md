# 🧠 Lessons Learned - GM-OS v5

Ce document consigne les défis techniques, les erreurs rencontrées et les solutions architecturales adoptées lors du développement de GM-OS v5 et v6.

---

## 🔄 Synchronisation d'État & Bridge (Architecture Bridge)

### 1. Synchronisation Multi-Fenêtres (Zustand Persist)
- **Défi** : Les stores Zustand (`persist`) ne se synchronisent pas automatiquement entre les fenêtres MJ et Player Hub.
- **Leçon** : L'utilisation d'événements `storage` couplée à une réhydratation manuelle est plus légère que des messages IPC constants.
- **Solution** : Écoute de `window.addEventListener('storage', ...)` et appel à `Store.persist.rehydrate()` lors de modifications clés (ex: dés, horloge).

### 2. Synchronisation de l'État Global (Deltas)
- **Défi** : Envoyer le store complet (>1Mo) à chaque seconde saturait le réseau.
- **Solution** : **Differential Sync (Deltas)**. Utilisation d'un utilitaire `isDeepEqual` pour ne diffuser que les propriétés modifiées. Réduction de 90% du trafic.

### 3. IPC Race Condition
- **Défi** : L'ordre de projection envoyé via IPC arrivait parfois avant que la fenêtre React cible ne soit initialisée.
- **Solution** : **Verrou IPC Définitif** (`ipcCount`). Le projecteur ignore les données de son store local dès qu'il reçoit son premier signal direct, garantissant que la volonté du MJ prime sur l'état persistant.

### 4. Portabilité des Chemins (MCP & Python) (2026-04-22)
- **Défi** : Le bridge MCP utilisait des chemins codés en dur (`C:\Users\david...`), empêchant l'application de fonctionner sur une autre machine après compilation.
- **Solution** : Refonte du service `mcp_bridge.ts` pour utiliser `process.env.USERPROFILE` et `path.join`. Le script Python `run_mcp.py` a également été rendu portable.
- **Leçon** : Toujours utiliser des chemins relatifs ou basés sur les dossiers système standards (`AppData`, `UserProfile`) pour les services externes.

### 5. Pont Agnostique (Agnostic Bridge v3) (2026-04-23)
- **Défi** : Préparer la migration vers Tauri tout en conservant une version stable sous Electron, sans avoir à maintenir deux codes frontends différents.
- **Solution** : Création d'un **AppBridgeAdapter**. Au lieu d'appeler `window.appBridge` directement, le code React utilise un service unifié qui détecte l'environnement (`isTauri` ou `isElectron`) et route les appels vers le moteur approprié.
- **Leçon** : Toujours abstraire les appels au système derrière une interface unifiée. Cela permet de décommissionner un moteur (ex: Electron) ultérieurement sans aucun impact sur l'UI.

### 6. Protocole de Médias Natifs (Tauri asset://) (2026-04-23)
- **Défi** : Le chargement de fichiers volumineux (musiques 1h+, vidéos 4K) via des data URIs ou des Blobs consommait trop de mémoire vive.
- **Solution** : Utilisation du protocole `asset://` (Tauri v2) via `convertFileSrc`. Ce protocole permet au Webview de lire directement les fichiers sur le disque avec les performances d'un serveur local optimisé.
- **Leçon** : Ne pas chercher à "encapsuler" les fichiers dans JavaScript. Utiliser les protocoles natifs de la plateforme pour laisser le système d'exploitation gérer le streaming et le cache.

### 7. Stockage Sécurisé (Rust Keyring)
- **Défi** : Stocker des clés API sensibles dans `localStorage` est risqué. Electron utilisait `safeStorage`, mais Tauri nécessite une approche différente.
- **Solution** : Abstraction via `AppBridge.security`. Sous Tauri, les secrets sont envoyés au backend Rust qui utilise la crate `keyring` (ou un stockage chiffré sur disque) au lieu de les exposer au frontend.

---

## 🏗️ Architecture, Build & Typage

### 1. Conflits ESM / CommonJS dans Electron
- **Défi** : Modules natifs (`ws`, `bufferutil`) incompatibles avec le bundle Vite ESM.
- **Solution** : Externalisation dans `vite.config.ts` et usage de `createRequire(import.meta.url)` dans `main.ts`.

### 2. Typage Strict "Zéro-Any" (Standard AppBridge v2)
- **Défi** : L'usage de `any` rendait le code fragile lors de la migration Electron -> Tauri.
- **Solution** : Centralisation des interfaces (`DisplayInfo`, `RemoteAction`) dans `window.d.ts` et interdiction stricte de `any`. Utilisation d'interfaces stricts même pour les retours d'IA (NotebookLM).

### 3. Découplage UI (Forge/Grimoire)
- **Défi** : Confusion entre l'interface de création de règles (Forge) et de consultation (Grimoire).
- **Solution** : Isolation stricte des vues. Le Grimoire est une vue de lecture premium, tandis que la Forge est un atelier de génération.

---

## 💡 Immersion & Performance

### 1. Gestion des Médias (HTTP Proxy vs WebSocket)
- **Défi** : Le transfert d'images en Base64 via WebSocket saturait la bande passante.
- **Solution** : **Local Asset Middleware**. Les fichiers sont servis par un proxy HTTP local. Le WebSocket ne transmet plus que des URLs courtes.

### 2. CSS vs React pour les micro-animations
- **Leçon** : Le CSS natif est plus performant pour les animations haute fréquence (vocal scales).
- **Solution** : Utilisation de variables CSS (`--voice-scale`) injectées via React pour laisser le moteur CSS gérer le rendu fluide sans re-renders massifs.

### 3. Mixage Audio & Ducking
- **Défi** : Réduire le volume de plusieurs moteurs audio (Music, Ambient) sans "clics" lors de la détection de voix.
- **Solution** : Nœud `duckingGain` piloté par le store VoiceOS avec `setTargetAtTime` pour des fondus parfaits.

---

## 🤖 IA, MCP & Forge

### 1. Corruption de flux JSON-RPC (MCP)
- **Défi** : Logs Python mélangés avec les réponses JSON.
- **Solution** : Redirection des logs vers `stderr` et buffering robuste dans le bridge pour accumuler les chunks JSON complets.

### 2. Assainissement des Données LLM (Sanitizer)
- **Défi** : Les LLM renvoient parfois des structures imbriquées imprévisibles au lieu de texte simple.
- **Solution** : Couche d'**Assainissement des Données** systématique avant injection dans le store global pour aplatir les objets et garantir des types `string`.

### 3. Expiration de Session (NotebookLM)
- **Défi** : Sessions API NotebookLM expirant silencieusement (RPC Error 16).
- **Solution** : Mécanisme de **Self-Healing** interceptant le code 16 et relançant une authentification automatique transparente.

---

## 🎨 UI & Composants (Stabilisation v6)

### 1. Bug des Fenêtres Externes (Native Select)
- **Défi** : Les `<select>` HTML natifs ouvraient parfois des fenêtres OS séparées dans Electron.
- **Solution** : Migration systématique vers un composant `Select` personnalisé (Framer Motion) confiné au shell de l'application.

### 2. Gestion de l'État "Repos" (Campagne Nulle)
- **Défi** : Instabilité lors de la désactivation d'une campagne.
- **Solution** : Support explicite de `null` pour `activeCampaignId` et synchronisation des chemins système (Obsidian vault) lors de la transition.

### 3. Masquage Physique (Brouillard de Guerre)
- **Leçon** : Remplacer la logique logicielle complexe par une hiérarchie de rendu simple.
- **Solution** : Calque de brouillard placé physiquement au-dessus (`z-20`) des pions (`z-16`), laissant le moteur de rendu gérer nativement l'occultation.

---

*Dernière mise à jour : 23 Avril 2026 - GM-OS v7 (Migration Tauri) - Phase 1 : Abstraction Bridge.*
