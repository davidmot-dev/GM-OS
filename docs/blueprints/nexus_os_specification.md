# Blueprint : Nexus-OS — Système de Packaging & Portabilité Totale

Ce document définit la spécification technique exhaustive pour le module **Nexus-OS**, responsable de l'archivage, de l'exportation et de la restauration complète (données + médias) des campagnes et des systèmes de jeu.

---

## 📋 1. Vision & Objectifs

Nexus-OS permet de transformer une entité complexe (Campagne ou Driver) en un paquet autonome (`.gmos`), garantissant que le MJ peut déplacer son travail d'un ordinateur à un autre sans perdre aucune image, relation ou configuration.

### Les 3 Piliers :
1. **Harvesting (Moissonnage)** : Capture physique de tous les fichiers binaires liés (Media Hub IDs `m-xxx` + chemins absolus).
2. **Relocation (Relocalisation)** : Transformation des références locales en chemins relatifs dans l'archive, et remappage inverse à l'import.
3. **Context-Aware (Conscience du Contexte)** : Intelligence de liaison pour ne rien oublier (PNJs, Relations, Journaux, Sons, Playlists).

---

## 🏗️ 2. Architecture du Système

### A. Le Bundle `.gmos` (Structure de l'Archive)
L'archive est un dossier compressé (Format ZIP) avec la structure suivante :
```text
archive_campagne.gmos/
├── manifest.json            # Métadonnées, version, assetMap (checksums SHA-256)
├── state.json               # Extraction complète des slices de stores (Zustand)
└── assets/                  # Dossier racine des médias moissonnés
    ├── profiles/            # Portraits PNJs, Avatars PJs (Media Hub m-xxx)
    ├── maps/                # Battlemaps, Vidéos d'ambiance
    ├── audio/               # Sons locaux (Sound Pads, Music Playlists)
    ├── decks/               # Contenu complet des paquets de cartes
    └── misc/                # Autres fichiers non classifiés
```

### B. Fichiers Clés
| Fichier | Rôle |
|---|---|
| `src/modules/system/archive/NexusService.ts` | Orchestrateur renderer — scraping, harvest, streaming IPC |
| `src/modules/system/archive/nexus.types.ts` | Types TypeScript partagés |
| `src/modules/system/archive/NexusHUD.tsx` | Interface de progression (Glassmorphism) |
| `electron/nexus_bridge.ts` | Main process — ZIP, checksums, cache assets |
| `electron/preload.ts` | Exposition du pont IPC au renderer (`window.appBridge.nexus`) |
| `src/types/window.d.ts` | Typage TypeScript des méthodes IPC |

---

## 🗺️ 3. Cartographie des Dépendances d'Actifs

### Médias collectés par `collectAssetPaths()` :
- **Campaign-OS** : `wallpaperUrl`
- **NPC/PC-OS** : `entity.avatar`, `playerCharacter.portraitUrl`, `playerCharacter.tokenUrl`
- **Map-OS** : `atlasMap.fileUrl` (Auto-détection Image vs Vidéo)
- **Wiki-OS** : `wikiEntry.imageUrls[]`
- **Clue-OS** : `clue.mediaUrl`
- **Deck-OS** : `deckManifest.folderPath` (Copie récursive)
- **Sound-OS** : `soundPad.filePath` (fichiers audio locaux des atmosphères)
- **Music-OS** : `musicPad.url` (uniquement les pads de type `'local'`)

### Règles de filtrage :
| Type | Inclus ? |
|---|---|
| `m-xxx` (Media Hub IndexedDB) | ✅ Résolu via `getMediaBlob()` → base64 |
| `C:\Users\...` (chemin absolu) | ✅ Copie directe par le main process |
| `https://...` (URL distante) | ❌ Non-portable, ignoré avec comptage diagnostic |
| `blob:...` (URL temporaire) | ❌ Invalide après redémarrage, ignoré |

---

## 🔄 4. Processus de Relocalisation (Relinker)

| Phase | Action Technique |
|:---|:---|
| **EXPORT** | `collectAssetPaths()` → `splitAssetRefs()` → `resolveMediaHubAssets()` (IDB→base64) → Streaming IPC → ZIP |
| **IMPORT** | Extraction ZIP → Écriture MediaHub (`storeMediaBlob`) → `buildAssetMap()` → `remapPaths()` → `injectState()` → Restauration stores audio |

### Protocole Streaming IPC (évite les limites de taille)
Le transfert des assets Media Hub utilise un pattern streaming pour éviter les limites de sérialisation du `contextBridge` Electron :

1. `nexus.clearAssets()` — vide le cache main process
2. `nexus.registerAsset(id, dataUrl)` × N — un asset à la fois
3. `nexus.exportBundle(...)` — le bridge lit depuis `pendingAssetCache` (Map mémoire)
4. `pendingAssetCache.clear()` — nettoyage post-ZIP automatique

> ⚠️ **Critique** : Ne jamais passer `inlineAssets` comme paramètre direct de `exportBundle`. La limite de sérialisation du `contextBridge` Electron tronque silencieusement les objets dépassant ~50 Mo.

---

## ⚡ 5. Processus d'Export (Phases)

| # | Phase | % HUD | Description |
|---|---|---|---|
| 1 | `scraping` | 10% | Extraction de l'état via `scrapeCampaignData()` |
| 2 | `harvesting` | 25-45% | `collectAssetPaths()` + résolution des `m-xxx` IDs |
| 2b | `packaging` | 55-70% | Streaming des blobs vers le cache IPC (`registerAsset`) |
| 3 | `packaging` | 70% | Appel `exportBundle` → ZIP via archiver (streaming) |
| 4 | `done` | 100% | Toast succès + rapport des assets manquants |

---

## 📥 6. Processus d'Import (Phases)

| # | Phase | % HUD | Description |
|---|---|---|---|
| 1 | `extracting` | 10% | Lecture ZIP → manifest + state |
| 2 | `remapping` | 20-50% | Écriture assets dans MediaHub IndexedDB (`storeMediaBlob`) |
| 3 | `remapping` | 50-75% | `detectConflicts()` → `ConflictResolver UI` → `applyResolution()` |
| 4 | `remapping` | 80% | `remapPaths()` sur l'état → mise à jour des IDs |
| 5 | `injecting` | 85% | `injectState()` dans tous les stores Zustand |
| 6 | `injecting` | 90% | Restauration `useSoundStore.atmospheres` + fusion `useMusicStore.playlists` |
| 7 | `done` | 100% | Toast succès |

---

## 🎭 7. Conflict Resolver

Lorsqu'une campagne importée a le même ID qu'une campagne existante, 3 stratégies sont disponibles :

| Stratégie | Comportement |
|---|---|
| `replace` | Écrase la campagne existante (comportement par défaut silencieux) |
| `clone` | Régénère tous les UUIDs → nouvelle campagne indépendante |
| `cancel` | Annule l'import, aucune modification |

---

## 🎵 8. Portabilité Audio (Niveau 5)

- **Sound Board** : Les `Atmosphere[]` (groupes de pads sonores) sont capturées dans `state.json.atmospheres`.
- **Music Playlists** : Les `Playlist[]` locales sont capturées dans `state.json.playlists`.
- **Fichiers audio locaux** : `.mp3`, `.wav`, `.ogg`, `.flac` → routés dans `assets/audio/`.
- **À l'import** : `useSoundStore.setState({ atmospheres })` et fusion par ID dans `useMusicStore`.

---

## 🧪 9. Protocole de Test

### T1 : Intégrité de Référence
- Scénario : Relations circulaires entre PNJs
- Vérification : UUID cohérents après round-trip

### T2 : Moissonnage Global
- Scénario : Campagne avec 57 médias Media Hub
- Vérification : `manifest.assetMap.length === 57` + dossier `assets/profiles/` présent dans le ZIP

### T3 : Round-Trip Complet
1. Export → renommer en `.zip` → vérifier `assets/` présent
2. Reset du store → Import
3. Vérification : tous les avatars, cartes et pads sonores fonctionnels

### T4 : Sécurité
- Rejet des bundles avec `schemaVersion` incompatible
- Protection contre le path traversal (regex `/../`) dans les `relativePath`

---

| Preload | `electron/preload.ts` |
| Types globaux | `src/types/window.d.ts` |

---

## 📡 10. Nexus-Link : Synchronisation Temps Réel

Le module Nexus gère également la communication bidirectionnelle entre le Cockpit MJ et les périphériques mobiles via WebSocket.

### A. Protocole `broadcastUIAction`
- **Rôle** : Permet au processus principal (Electron) d'émettre des ordres visuels vers tous les Remote MJ connectés sans passer par le store global persistant.
- **Canal** : `remote:broadcast-ui-action` (IPC) → WebSocket Server → Clients.

### B. Diffusion Réactive (Reactive Broadcasting)
Pour garantir une parité totale entre les actions locales (boutons GM) et les actions distantes :
1. Les composants (locaux ou distants) modifient le store standard (ex: `useDiceStore.lastRoll`).
2. Un abonnement global (`useEffect`) dans `App.tsx` détecte le changement d'état.
3. L'action est automatiquement diffusée via `broadcastUIAction`.

> 💡 **Avantage** : Cette architecture assure que n'importe quelle source de lancer (clic sur dé, raccourci clavier, ou bouton mobile) génère un feedback visuel synchronisé sur tous les écrans MJ.

---

*Date de mise à jour : 4 Avril 2026*
*Statut : **Implémenté & Fonctionnel** — Portabilité médias (v1.0) et Synchronisation Réactive des dés opérationnelles.*
