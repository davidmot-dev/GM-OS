# Walkthrough : Intégration de l'Export Obsidian

Ce document détaille l'implémentation et l'usage de la nouvelle fonctionnalité d'exportation structurée vers Obsidian dans GM-OS v5.

## 🎯 Objectif

Permettre aux MJs d'exporter leurs données de session (PNJs, Monstres, Lieux, Lore) vers un coffre Obsidian dans une structure de dossiers logique et prête à l'emploi.

## 🛠️ Implémentation Technique

### 1. Bridge Electron (Main Process)
Le bridge a été étendu dans `electron/obsidian_bridge.ts` pour inclure deux nouveaux handlers IPC :

- `obsidian:write-note` : Permet d'écrire du contenu textuel dans un fichier `.md`.
- `obsidian:ensure-directory` : Assure que l'arborescence de dossiers existe avant l'écriture.

Une vérification de sécurité empêche toute écriture en dehors du dossier "Vault" configuré.

### 2. Service Renderer (`ObsidianExportService.ts`)
Ce service centralise la logique de formatage Markdown. Il convertit les objets complex (Entités, Maps, Wiki) en chaînes Markdown avec des **YAML Frontmatter** pour une compatibilité maximale avec les plugins Obsidian (Dataview, Metadata Menu).

### 3. Store Zustand (`useSessionOSStore.ts`)
L'action `exportActiveCampaignToObsidian` coordonne l'export :
1. Elle récupère le chemin du Vault depuis le store Obsidian.
2. Elle filtre les données appartenant à la campagne active.
3. Elle appelle le service d'export et gère le feedback utilisateur via `gmToast`.

## 📖 Manuel d'Utilisation

1. **Accès** : Rendez-vous dans l'écran "Détails de la Campagne" (accessible depuis le Cockpit).
2. **Lancement** : Cliquez sur le bouton "Exporter vers Obsidian" dans l'en-tête.
3. **Résultat** : Un dossier au nom de votre campagne est créé dans votre Vault Obsidian avec la structure suivante :

- `PNJs/` : Personnages non-joueurs.
- `Bestiaire/` : Monstres et créatures.
- `Lieux/` : Points d'intérêt de l'Atlas.
- `Lore/` : Entrées historiques et géographiques du Wiki.
- `Scenario.md` : Résumé global et notes de session.

## ✅ Tests et Validation
- **Tests Unitaires** : `ObsidianExportService.test.ts` valide le formatage et la sanitization des noms de fichiers.
- **Sécurité** : Injection de chemins malveillants bloquée au niveau du bridge.
- **Performance** : Export asynchrone pour ne pas bloquer l'UI, même avec des centaines d'entrées.

---
*Document généré par l'Agent GM-OS v5*
