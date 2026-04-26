# 📑 Guide de Migration : Synchronisation Cross-Window Simplifiée (v7)

Ce document détaille les principes de simplification adoptés pour la migration du module de synchronisation (Master ↔ Hub/Moniteurs) vers l'architecture **GM-OS v7 (Tauri)**. 

---

## 🏗️ 1. Changement de Paradigme : BroadcastChannel

En v5/v6 (Electron), la synchronisation reposait sur des messages IPC complexes relayés par le processus principal. Pour la v7, nous avons migré vers une approche plus robuste et performante.

### Pourquoi BroadcastChannel ?
*   **Performance** : Communication directe entre fenêtres (Webview context) sans passer par le backend Rust.
*   **Fiabilité** : API native standardisée (Chromium/WebView2) qui gère nativement le partage de mémoire sur la même origine (`localhost`).
*   **Isolation** : Ne surcharge pas le bus IPC de Tauri pour les données haute fréquence (positions de tokens, VU-mètres).

> [!TIP]
> Utilisez un canal unique par domaine : `gmos-map-sync`, `gmos-audio-sync`, etc.

---

## 🔄 2. Modèle "Authoritative Master Relay"

Le plus gros défi de la synchronisation est d'éviter les boucles de rétroaction (ex: un pion qui "rebondit" ou revient en arrière).

### Le Principe
1.  **L'Esclave (Hub/Tablet)** envoie une **intention** (ex: `token:move`) via le canal.
2.  **Le Master (GM-OS)** est le **seul** autorisé à modifier l'état définitif.
3.  **Le Master** applique le changement localement.
4.  **Le Master** diffuse ensuite un **état complet et consolidé** (`broadcastFullState`) à tous les écouteurs.

### Ce qu'il faut éviter (Anti-Pattern)
- Ne jamais relayer directement le payload d'un esclave vers les autres. Le Master doit toujours filtrer et re-générer le message à partir de son propre store (Source de Vérité).

---

## 🤝 3. Protocole de Handshake : `hub:ready`

Un problème fréquent est l'ouverture d'une fenêtre de projection sur un écran noir car elle a raté l'événement de synchronisation initial.

### La Solution
1.  **Initialisation** : La fenêtre esclave s'ouvre et s'initialise.
2.  **Signal** : Dès que React est monté, elle émet un signal `hub:ready`.
3.  **Réponse** : Le Master, en recevant ce signal, déclenche immédiatement un `broadcastFullState()`.
4.  **Résultat** : La synchronisation est atomique et instantanée dès le chargement.

---

## 🛡️ 4. Guardes de Fenêtres & Sécurité

Dans un environnement multi-fenêtres, il est crucial que le code sache s'il doit "émettre" ou "écouter".

### Détection Robuste
Ne vous fiez pas uniquement à l'URL. Combinez les vérifications :
```typescript
const isMJWindow = () => {
    const params = new URLSearchParams(window.location.search);
    const windowType = params.get('window'); // 'hub', 'projector', 'tablet'
    const mode = params.get('mode');         // 'hub' (ancien standard)
    
    return !windowType && !mode; // Si aucun paramètre esclave, c'est le Master
};
```

---

## 📦 5. Checklist pour la Migration v7

- [ ] **Abstraction Bridge** : Utiliser `AppBridgeAdapter` pour les appels système (Security, Filesystem).
- [ ] **Asset Protocol** : Convertir les chemins locaux (`C:\...`) en URLs Tauri via `convertFileSrc` dès la réception dans l'esclave.
- [ ] **Throttling** : Limiter la diffusion des données lourdes (Canvas Fog, VU-mètres) à 20 FPS maximum.
- [ ] **IndexedDB Partagé** : Pour les médias volumineux, envoyer uniquement l'ID (ex: `m-xxx`) et laisser l'esclave charger le Blob depuis l'IndexedDB partagée.

---

## 📄 Exemple de Structure (MapService.ts)

```typescript
// MJ Window logic
static syncToPlayers() {
    if (!isMJWindow()) return;
    const state = useMapStore.getState();
    broadcast({ type: 'map:sync', ...state });
}

// Slave Window logic
useEffect(() => {
    const bc = new BroadcastChannel('gmos-map-sync');
    bc.onmessage = (event) => {
        if (event.data.type === 'map:sync') {
            useMapStore.getState().applyState(event.data);
        }
    };
    // Handshake initial
    bc.postMessage({ type: 'hub:ready' });
    return () => bc.close();
}, []);
```

---
*Document créé le 24 Avril 2026 - Guide de Migration Stratégique GM-OS v7.*
