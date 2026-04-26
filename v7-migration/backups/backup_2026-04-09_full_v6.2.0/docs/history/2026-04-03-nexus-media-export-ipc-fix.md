# Walkthrough : Nexus-OS Media Export — Correction du Bug de Truncation IPC

**Date :** 3 Avril 2026
**Branche :** GM-OS_v6
**Durée :** ~2h

---

## 🧭 Contexte

L'export de campagne Nexus-OS produisait un ZIP complet en apparence (`manifest.json` + `state.json`) mais **sans aucun asset média**. Le HUD affichait pourtant "57 médias résolus" — indiquant que le harvest fonctionnait correctement côté renderer.

---

## 🔍 Root Cause Analysis

### Symptôme
Bundle `.gmos` = seulement 2 fichiers. Pas de dossier `assets/`. Pourtant le log renderer affichait `"57/57 Media Hub IDs résolus en base64"`.

### Investigation
1. `NexusService.ts::resolveMediaHubAssets()` → ✅ Fonctionnel, retournait bien 57 blobs base64
2. `NexusService.ts::exportBundle()` → ✅ Passait `inlineAssets` à `window.appBridge.nexus.exportBundle(...)`
3. **`electron/preload.ts` ligne 139** → ❌ **BUG TROUVÉ**

```typescript
// AVANT (cassé) — inlineAssets silencieusement ignoré
exportBundle: (
    campaignId: string,
    outputPath: string,
    stateJson: string,
    manifestJson: string,
    assetRefs: string[]  // ← 5 paramètres seulement !
) => ipcRenderer.invoke('nexus:export-bundle', ..., assetRefs)
//                                   inlineAssets jamais transmis ↑
```

**Cause profonde :** Le `preload.ts` (pont IPC) avait été écrit avec 5 paramètres, omettant le 6ème (`inlineAssets`). Les 57 blobs base64 étaient produits côté renderer mais n'atteignaient jamais le main process Electron. Aucune erreur TypeScript n'est levée car `window.d.ts` (types) et `preload.ts` (implémentation) sont des fichiers séparés.

---

## 🛠️ Solution : Pattern Streaming IPC

Au lieu de corriger simplement la signature (qui aurait créé un payload de ~100 Mo en un seul `invoke`, potentiellement instable), nous avons utilisé une **architecture de streaming** :

### Nouveau flux

```
Renderer (NexusService)          Main Process (nexus_bridge)
─────────────────────────        ─────────────────────────────────
clearAssets()          ─────►   pendingAssetCache.clear()
registerAsset(id1, b64) ─────►  pendingAssetCache.set(id1, b64)
registerAsset(id2, b64) ─────►  pendingAssetCache.set(id2, b64)
... × 57              ─────►   pendingAssetCache.size === 57
exportBundle(...)      ─────►   for entry of pendingAssetCache → ZIP
                                pendingAssetCache.clear()
```

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `electron/preload.ts` | Ajout `registerAsset()` et `clearAssets()` |
| `electron/nexus_bridge.ts` | Déclaration `pendingAssetCache` (Map), handlers IPC, lecture cache dans Phase 1b |
| `src/modules/system/archive/NexusService.ts` | Phase 4.5 : boucle streaming avant `exportBundle` |
| `src/types/window.d.ts` | Types TS pour les 2 nouvelles méthodes |

---

## ✅ Résultats Attendus

Après redémarrage Electron et nouvel export :

```
[Nexus Bridge] 57 asset(s) en cache mémoire prêts à archiver.
[Nexus Bridge] Traitement de 57 inline assets (depuis cache)...
[Nexus Bridge] Inline asset écrit : assets/profiles/avatar_m-xxx.png (48302 octets)
...
[Nexus Bridge] Cache vidé : 57 asset(s).
```

Le ZIP devrait contenir :
```
✅ manifest.json
✅ state.json
✅ assets/profiles/ (57 fichiers images)
```

---

## 💡 Enseignements Clés

1. **Toujours vérifier le preload après modification des signatures IPC.** Le preload est une zone morte — pas de TypeScript cross-process pour détecter les désynchronisations.
2. **Ajouter des logs IPC côté main process** pour confirmer que les données arrivent (les logs renderer ne suffisent pas).
3. **Au-delà de ~10 Mo par `invoke`**, préférer le pattern streaming ou `ipcRenderer.sendSync` avec chunking.

---

*Statut : Fix implémenté, en attente de validation utilisateur (nécessite redémarrage Electron).*
