# Blueprint : Nexus-OS - Système de Packaging & Portabilité Totale

Ce document définit la spécification technique exhaustive pour le module **Nexus-OS**, responsable de l'archivage, de l'exportation et de la restauration complète (données + médias) des campagnes et des systèmes de jeu.

---

## 📋 1. Vision & Objectifs
Nexus-OS permet de transformer une entité complexe (Campagne ou Driver) en un paquet autonome (`.gmos`), garantissant que le MJ peut déplacer son travail d'un ordinateur à un autre sans perdre aucune image, relation ou configuration.

### Les 3 Piliers :
1.  **Harvesting (Moissonnage)** : Capture physique de tous les fichiers binaires liés.
2.  **Relocation (Relocalisation)** : Transformation des chemins absolus en chemins relatifs (et inversement).
3.  **Context-Aware (Conscience du Contexte)** : Intelligence de liaison pour ne rien oublier (PNJs, Relations, Journaux).

---

## 🏗️ 2. Architecture du Système

### A. Le Bundle `.gmos` (Structure de l'Archive)
L'archive est un dossier compressé (Format ZIP) avec la structure suivante :
```text
archive_campagne_torg.gmos/
├── manifest.json            # Métadonnées, version et liste des dépendances
├── state.json               # Extraction des slices de stores (Zustand)
└── assets/                  # Dossier racine des médias moissonnés
    ├── profiles/            # Portraits PNJs, Avatars PJs
    ├── maps/                # Battlemaps, Vidéos d'ambiance
    ├── decks/               # Contenu complet des paquets de cartes
    └── sounds/              # (Optionnel) Musiques et effets liés
```

### B. Moteur d'Extraction (Scraper)
Le moteur parcourt récursivement les dépendances :
1.  **Racine** : `Campaign ID`.
2.  **Niveau 1** : Sessions, AtlasMaps, WikiEntries, TimelineEvents, Clues.
3.  **Niveau 2** : Événements Journal liés aux Sessions, Entités (PNJ) présentes sur les cartes ou dans les sessions.
4.  **Niveau 3** : Relations sociales des entités trouvées, Fiches de personnages (SheetData).
5.  **Niveau 4** : GameDrivers et SheetTemplates requis (Manifeste uniquement).

---

## 🗺️ 3. Cartographie des Dépendances d'Actifs
Chaque champ "URL" ou "Path" détecté déclenche une opération de moissonnage :

- **Campaign-OS** : `wallpaperUrl`, `ragPath`, `notebookUrl`.
- **NPC/PC-OS** : `avatar`, `portraitUrl`, `tokenUrl`, `badges[].icon`.
- **Map-OS** : `fileUrl` (Auto-détection Image vs Vidéo).
- **Wiki-OS** : `imageUrls` (Scan du tableau d'images).
- **Deck-OS** : `folderPath` (Copie récursive de tout le répertoire).
- **Journal-OS** : Scan des métadonnées pour les références d'images.

---

## 🔄 4. Processus de Relocalisation (Relinker)

| Phase | Action Technique |
| :--- | :--- |
| **EXPORT** | Pour chaque URL : `C:/User/Me/Map.jpg` -> `assets/maps/Map.jpg`. Sauvegarde du mapping original. |
| **IMPORT** | 1. Extraction dans le dossier média local. <br> 2. Reconstruction de l'URL : `assets/maps/Map.jpg` -> `[Local_Media_Hub_Path]/Map.jpg`. |

---

## 🧪 5. Protocole de Test Élevé (High-Reliability Testing)

Pour garantir la fiabilité demandée, Nexus-OS doit passer les tests suivants :

### T1 : Test d'Intégrité de Référence (Circular Checks)
- **Scénario** : PNJ A est l'ami de PNJ B, et PNJ B est l'ennemi de PNJ A.
- **Vérification** : L'archive doit maintenir la cohérence des UUID sans créer de doublons ou de liens brisés lors de la ré-injection.

### T2 : Test de Moissonnage Global (Asset Harvest)
- **Scénario** : Une campagne utilise 50 images dispersées sur 5 disques durs différents.
- **Vérification** : Le scanner doit confirmer que 100% des fichiers sont présents dans le bundle final. Un rapport d'erreur est généré si un fichier manque à l'appel.

### T3 : Test "Round-Trip" (Cycle Complet)
1.  Exportation d'une campagne complexe.
2.  Nettoyage complet du store GM-OS (Appel de `.reset()`).
3.  Importation de l'archive.
4.  **Vérification automatique** : Comparaison profonde (Deep Equal) du `state.json` original vs `state.json` restauré.

### T4 : Test de Sécurité (Sandboxing)
- **Scénario** : Tenter d'importer une archive corrompue ou contenant des chemins de fichiers malveillants.
- **Vérification** : Validation du schéma JSON et assainissement (sanitization) des chemins avant toute opération de fichier.

---

## 📂 Emplacements des fichiers
- **Spécification** : `docs/blueprints/nexus_os_specification.md`
- **Implémentation** : `src/modules/system/archive/NexusService.ts` (À venir)

---
*Date de sauvegarde : 26 Mars 2026*
*Statut : Blueprint Complet / Audit de Dépendances Terminé*
