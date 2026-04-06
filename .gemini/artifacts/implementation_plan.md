# Nexus-OS v2 — Driver Export Implementation Plan

Ce plan détaille la marche à suivre pour implémenter l'exportation et l'importation de `GameDrivers` autonomes (avec leurs `SheetTemplate` associés) sous forme de bundles `.gmos` via Nexus-OS.

## User Review Required

> [!WARNING]
> La structure du `NexusManifest` va être modifiée. Les propriétés `campaignId` et `campaignName` deviendront optionnelles, et une propriété `bundleType` (`'campaign' | 'driver'`) sera introduite pour différencier les archives. Cette compatibilité ascendante permet d'importer les anciens bundles (qui n'ont pas `bundleType`) comme des campagnes par défaut, tout en ouvrant la voie aux bundles de type Driver. 
> Êtes-vous d'accord avec cette approche pour l'architecture du `.gmos` ?

## Proposed Changes

---

### Nexus-OS Types & Configuration

#### [MODIFY] [nexus.types.ts](file:///c:/Projet_David/GM-OS-v5/src/modules/system/archive/nexus.types.ts)
- Ajouter un champ `bundleType?: 'campaign' | 'driver'` dans `NexusManifest`.
- Rendre `campaignId` et `campaignName` optionnels (le bridge devra s'y adapter).
- Ajouter les champs `driverId?: string` et `driverName?: string` dans le `NexusManifest`.
- Créer une nouvelle interface `NexusDriverState` contenant:
  - `gameDriver: GameDriver`
  - `sheetTemplate?: SheetTemplate`

---

### Electron Bridge Process (Main)

#### [MODIFY] [nexus_bridge.ts](file:///c:/Projet_David/GM-OS-v5/electron/nexus_bridge.ts)
- Renommer le paramètre `campaignId` en `contextId` dans `handleExportBundle`. Le bridge n'a en fait pas besoin de faire la distinction (`contextId` servira juste pour les logs et comme identifiant de repli).
- Adapter `NexusManifestFull` pour refléter les mêmes changements de types (ajout de `bundleType`, rendant `campaignId` optionnel).
- Renommer la signature RPC `nexus:export-bundle` dans `preload.ts` pour refléter cette généricité.

#### [MODIFY] [preload.ts](file:///c:/Projet_David/GM-OS-v5/electron/preload.ts)
- Mise à jour de la signature de `nexus.exportBundle` (soit en conservant `campaignId` renommé informatiquement en `contextId`, soit en modifiant le typage).

---

### Service Nexus (Renderer)

#### [MODIFY] [NexusService.ts](file:///c:/Projet_David/GM-OS-v5/src/modules/system/archive/NexusService.ts)
- Ajouter une méthode `exportDriverBundle(driverId: string, templateId?: string): Promise<NexusExportResult>`.
  - Celle-ci lira le driver depuis le store `useSessionOSStore.getState().getGameDriver(driverId)`.
  - Elle récupérera le `SheetTemplate` s'il est personnalisé.
  - Elle utilisera `appBridge.nexus.exportBundle` pour créer un fichier `.gmos`.
- Modifier la méthode `importBundle(onConflict)` pour gérer un import avec fourchement logique :
  - Si `manifest.bundleType === 'driver'`, déclencher une logique dédiée de résolution de conflit et la fonction privée `injectDriverState(state: NexusDriverState)`.
  - Utiliser le `onConflict` pour potentiellement faire un clone ou un remplacement des IDs de driver et template en cas de collision.
- Créer `detectDriverConflicts(manifest, state)` pour gérer les conflits d'id de templates et drivers.

#### [MODIFY] [NexusService.test.ts](file:///c:/Projet_David/GM-OS-v5/src/modules/system/archive/NexusService.test.ts)
- Mettre à jour les fixtures du manifeste (`baseManifest`) pour tester avec `campaignId` optionnel.
- Ajouter un test d'export `exportDriverBundle` validant le fonctionnement du bundle type driver.

## Open Questions

> [!IMPORTANT]
> - Doit-on utiliser l'extension `.gmos` standard pour les drivers, ou préfèrez-vous forcer un filtre différent lors de la sélection de fichier pour clarifier (ex: `.gmos-driver` dans l'interface, bien que la technique reste la même) ?
> - Actuellement l'export de template de fiche incluera-t-il les `avatars` / images ou seulement la structure JSON de la fiche ? Les sheets templates ne référencent pas d'images aujourd'hui, est-ce amené à changer ?

## Verification Plan

### Automated Tests
- Assurer le refactor dans `NexusService.test.ts` de la validation du Manifeste pour qu'il autorise `bundleType: 'driver'`.
- Couvrir les cas de collision d'IDs pour les Drivers (si un driver nommé ou IDté existe déjà).

### Manual Verification
- Côté interface (UI non implémentée mais simulable par code ou DevTools), exporter un GameDriver custom (.gmos).
- L'importer sans conflit sur la nouvelle machine.
- Redémarrer l'application et vérifier que le template/driver est chargé dans le store et prêt pour de nouvelles campagnes.
