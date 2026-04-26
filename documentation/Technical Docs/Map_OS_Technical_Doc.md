# 🗺️ Map-OS : Architecture des Calques & Brouillard de Guerre

Cette documentation détaille la structure technique de l'affichage cartographique et la logique de masquage physique par le brouillard de guerre.

## 🏗️ Architecture "Bridge" et Rendu

Map-OS suit le standard GM-OS v5 en séparant strictement la logique métier (TypeScript) du rendu (React). L'interface est conçue pour être performante et "pixel-perfect" sur les écrans de projection (Player Hub et Moniteurs).

## 📐 Hiérarchie des Couches (Z-Layering)

Le rendu est organisé par un empilement de calques utilisant les Z-index CSS. Cet ordre est crucial pour permettre au brouillard de guerre d'occulter les éléments de jeu de manière physique.

| Calque | Z-Index | Composant / Élément | Description |
| :--- | :--- | :--- | :--- |
| **Fond** | `10` | `img` / `video` | Carte de base chargée par le MJ. |
| **Grille** | `15` | `canvas` | Grille tactique superposée. |
| **Pions (Tokens)** | `16` | `MapTokenNode` | PNJ et PJ. Placés sous le brouillard. |
| **Auras & Magie** | `17` | `MapAuraLayer` / `MagicLayer` | Effets de sorts et auras mobiles liées aux pions. |
| **Zones de Danger** | `18` | `DangerZoneLayer` | Zones tactiques statiques ou terrains difficiles. |
| **Brouillard** | `20` | `canvas` | **Masque Principal**. Recouvre tout ce qui précède. |
| **Interface / Pings** | `30+` | `MapPingLayer` | Notifications et pings (doivent rester visibles). |

> [!NOTE]
> Chaque calque peut désormais être masqué individuellement par le MJ via le système `LayerVisibility` sans affecter l'état physique du moteur de rendu.

## 🌫️ Brouillard de Guerre : Logique de Masquage

Le brouillard de guerre n'est plus géré par un filtrage conditionnel des données (ex: cacher le PNJ s'il est dans le brouillard), mais par un **masquage physique**.

### 1. Masquage Joueur (Player Hub)
Sur les écrans joueurs, le calque de brouillard est opaque (`opacity-100`). Puisque les pions (`z-16`) et la magie (`z-17`) sont situés sous ce calque (`z-20`), ils deviennent naturellement invisibles dès qu'ils pénètrent dans une zone non révélée du canvas.

### 2. Masquage MJ (GM View)
Sur l'interface MJ, le même calque est rendu avec une opacité réduite (`opacity-80`). Cela permet au MJ de garder une vue d'ensemble sur les pions tout en voyant distinctement les zones masquées pour ses joueurs.

## 🔄 Synchronisation et Projection (v5.5 Robustesse)

Les données de map sont synchronisées via `useMapStore.ts` et diffusées par le `CrossWindowEventService.ts` via BroadcastChannel.

### 1. Authoritative Master Relay
Le système applique un modèle de **Maître-Esclave** strict pour éviter les conflits d'état :
- **Master (MJ)** : Seule source de vérité. Il reçoit les deltas des esclaves (ex: mouvement de pion, ping), met à jour son store local, puis diffuse l'état complet via `broadcastFullState()`.
- **Slaves (Hub/Moniteur)** : Ils ne diffusent jamais d'état complet. Ils émettent des deltas et écoutent le flux du Master. Toute tentative de synchronisation complète par un esclave est bloquée par une garde URL (`isSlaveWindow`).

### 2. Handshake d'Initialisation (`hub:ready`)
Pour éviter le problème de "fenêtre noire" au démarrage (où l'esclave rate le broadcast initial du Master), un protocole de poignée de main est utilisé :
1. L'esclave s'ouvre et émet un signal `hub:ready`.
2. Le Master intercepte ce signal et déclenche immédiatement un `broadcastFullState()`.
3. L'esclave reçoit toutes les métadonnées (URL carte, Brouillard, Tokens, Météo) et s'initialise de manière atomique.

### 3. Throttling et Performance
La diffusion du Master est "throttlée" (déclenchée avec un délai de 50ms) pour grouper les mises à jour rapides (drag de tokens) et minimiser la charge CPU sur le canal de communication.

### 4. Stabilité du Chargement & Dynamic Imports (v7.0.0)
Pour résoudre les problèmes de **dépendances circulaires** fréquents dans les architectures de stores interconnectés (ex: `useMapStore` utilisant `MapService` qui lui-même utilise le store), Map-OS utilise désormais des imports dynamiques au sein des actions.
- Cela évite les deadlocks du résolveur Vite au démarrage.
- Le module `MapDashboard.tsx` est chargé en `lazy()` pour garantir que le shell de l'application est prêt avant l'initialisation du moteur de carte lourd.

## 📦 Composants Clés
- **`MapDashboard.tsx`** : Point d'entrée lazy-loaded.
- **`PlayerMapCanvas.tsx`** : Coordonne l'empilement correct pour le hub joueur.
- **`MapCanvas.tsx`** : Interface de contrôle et de rendu pour le MJ.
- **`FogEngine.ts`** : Logique bas-niveau de manipulation du canvas de brouillard.
