# Nexus-OS v2 : Export de Drivers (GameDrivers)

**Date :** 06 Avril 2026
**Auteur :** Antigravity

## 🎯 Objectif
Étendre le module **Nexus-OS v2** (qui permettait jusqu'à présent d'exporter et d'importer des campagnes entières sous forme de fichiers `.gmos`) pour supporter l'export individuel des **GameDrivers** et **SheetTemplates**. L'enjeu est de permettre une meilleure réutilisabilité et un partage granulaire des systèmes de jeu forgés via l'interface *System Forge*.

## 🛠 Modélisation Architecturale
L'implémentation a impliqué la création d'une logique polymorphe dans le service d'archive et l'adaptation de l'interface IPC.

### 1. NexusService (Logique métier)
- **Scraping Polymorphe** : La méthode `exportDriverBundle` collecte spécifiquement le `GameDriver` et ses `SheetTemplates` associés.
- **Résolution des conflits par Clonage** : Contrairement aux campagnes (où l'écrasement est souvent souhaité), l'import de drivers existants utilise une stratégie de clonage (`clone`). La méthode `applyResolutionToDriver` génère un nouvel UUID pour le driver et met à jour en cascade l'UUID lié (`systemId`) des tous les modèles de fiche associés. Les titres des éléments ajoutent le suffixe `(Cloné)`.
- **Refactoring** : Suppression des méthodes dupliquées (ex: `buildDriverManifest`), instaurant un code d'exportation propre et unifié basé sur `NexusManifest`.

### 2. IPC & AppBridge
- Signature modifiée pour `window.appBridge.nexus.selectExportPath(bundleType)` autorisant explicitement l'affichage et la sauvegarde avec les extensions `.gmos-driver` (vs `.gmos` classique pour les campagnes).
- Implémentation validée sur le Main Process via le test *mocking*.

### 3. Interface Utilisateur (UI)
- L'interface d'administration des Drivers (dans `TemplateDashboard.tsx`) a été enrichie pour afficher :
  1. **Option d'Export** : Un bouton *EXPORTER* attaché au driver sélectionné dans le panneau d'aperçu.
  2. **Option d'Import** : Un bouton global *IMPORTER DRIVER* affiché systématiquement au niveau de la librairie lorsque l'onglet actif est `drivers`.
- L'UI repose sur les overlays esthétiques existants : `NexusHUD` pour le suivi des phases d'exportation, et `NexusConflictResolver` pour intercepter et statuer sur les IDs existants lors d'un import.

## 📈 Couverture et Fiabilité
L'objectif central était de préserver la fiabilité critique du module Nexus de GM-OS. L'ensemble de la suite test de `NexusService.test.ts` (49/49) a été restaurée en ajustant les stubs de manifeste en contexte de *testing* environnement pour la détection de conflit ('conflict detection').

## 🔮 Perspectives (Roadmap v6)
- **Distribution des Bundles** : Partager facilement la création de Drivers indépendamment des campagnes via un Repo Externe ou le Discord communautaire (les utilisateurs de *System Forge* pourront s'envoyer des "Règles.gmos-driver").
- **Extraction Partielle de Campagne** : À terme, la possibilité d'extraire automatiquement un `.gmos-driver` lors d'un export `.gmos` de campagne complète, si l'architecture permet une séparation totale.

## 🛠 Correctif de Robustesse : Validation Polymorphe

Lors des premiers tests de réimportation, un bug a été identifié : le validateur de manifeste (`validateManifest`) exigeait systématiquement `campaignId` et `campaignName`, provoquant l'échec des imports de drivers autonomes.

**Solution appliquée :**
- Introduction d'une logique basée sur le `bundleType` dans le service de validation.
- Utilisation de l'accès par crochet (`m['field']`) pour garantir la compatibilité TypeScript sur les types `Record<string, unknown>`.
- Cette modification assure que GM-OS reste extensible pour de nouveaux types de paquets (ex: Maps isolées, Decks isolés) sans régressions sur le moteur de validation core.

---
*Dernière mise à jour : 6 Avril 2026*
*Statut : Système de validation polymorphe stabilisé.*
