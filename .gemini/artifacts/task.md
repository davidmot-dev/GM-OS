# Nexus-OS v2 — Driver Export Tasks

- [/] Phase 1 - Types
  - [ ] Déclarer `NEXUS_DRIVER_EXTENSION` (`.gmos-driver`) dans `nexus.types.ts`
  - [ ] Ajouter `bundleType?: 'campaign' | 'driver'` et rendre optionnels `campaignId`/`campaignName`
  - [ ] Créer l'interface `NexusDriverState`
- [ ] Phase 2 - Bridge (Electron)
  - [ ] Modifier `nexus:select-export-path` pour accepter le type de bundle (campaign ou driver)
  - [ ] Modifier `nexus:select-import-file` pour supporter à la fois `.gmos` et `.gmos-driver`
  - [ ] Ajuster le parseur IPC pour supporter optionnellement un manifest Driver et le nom de fichier
- [ ] Phase 3 - Service (Renderer)
  - [ ] Implémenter `exportDriverBundle(driverId)`
  - [ ] Mettre à jour `importBundle(onConflict)` pour détecter le `bundleType` et injecter via le `ForgeSlice`
- [ ] Phase 4 - Tests
  - [ ] Mettre à jour `NexusService.test.ts` pour refléter les manifests avec `bundleType` optionnel
  - [ ] S'assurer que Vitest passe à 100% sur NexusService.
