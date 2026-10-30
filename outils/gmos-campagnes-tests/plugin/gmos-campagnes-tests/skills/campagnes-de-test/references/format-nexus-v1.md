# Nexus v1 — repères au 30/10/2026

Référence examinée : `src/modules/system/archive/nexus.types.ts`, `NexusService.ts` et les générateurs de `outils/campagnes-de-recette/` de GM-OS 6.5.0. Dans un dépôt accessible, les types et l'importateur courants priment. Cette fiche ne remplace pas la description complète de chaque domaine ni les validateurs métier.

## Archive

Un `.gmos` est un ZIP : `manifest.json`, `state.json`, puis les médias référencés sous `assets/`. Le manifeste a `schemaVersion: 1`, `bundleType: "campaign"`, `bundleId`, `campaignId`, `campaignName`, `exportedAt` ISO, `gmosVersion`, `requiredDriverIds`, `requiredTemplateIds`, `assetMap` et `stats`.

Chaque asset : `originalRef` (référence dans l'état), `relativePath` (chemin du ZIP), `checksum` SHA-256, `sizeBytes`, `mimeType`. Statistiques : `entityCount`, `sessionCount`, `atlasMapCount`, `wikiEntryCount`, `clueCount`, `assetCount`, `totalSizeBytes` (somme des médias, pas taille du ZIP).

`state.json` possède `campaign` et les tableaux `players`, `entities`, `sessions`, `atlasMaps`, `wikiEntries`, `timelineEvents`, `clues`. Les dépendances embarquées sont `requiredDriverData` et `requiredTemplateData`. Chaque joueur a `id`, `realName`, `characters` ; chaque nouveau PJ connaît `campaignId`, `systemId`, `templateId`, `sheetData` et son ID propre. Ne pas substituer les clés du manifeste HTML aux IDs du gabarit GM-OS : la correspondance est une couche différente.

Les champs facultatifs (actes, scènes, rencontres, moments, atmosphères, playlists, lumières, réserves, butin, modules…) ont des types spécifiques. **Ne pas les inventer à partir de leurs noms.** Les générateurs existants sont des exemples ; les types actuels et les exports autorisés déterminent leur forme.

Les paquets Deck-OS voyagent avec le **pilote** ; la pioche/défausse d'une table n'est pas un état portable de campagne. Ne pas réintroduire `deckSessionStates` pour préparer un test.

## Utilitaire Python

`inspect` lit un ZIP sans extraire de chemin sur disque et rend un résumé : type, IDs, pilote/gabarit, champs disponibles, joueurs et empreinte du fichier. Il n'importe rien dans GM-OS.

`build` exige l'état déjà préparé et typé selon les vraies sources. Exemple d'index média :

```json
[{"originalRef":"recette-jeu-carte.svg","relativePath":"assets/images/carte.svg","source":"medias/carte.svg","mimeType":"image/svg+xml"}]
```

`source` est relatif à cet index et doit rester dans son dossier. Aucun téléchargement implicite. L'utilitaire écrit un ZIP déterministe à date donnée, relit le résultat et refuse l'écrasement. Il ne fabrique pas le scénario, ne calcule pas les règles et ne remplace aucun pilote.

`verify` contrôle manifeste, noms de chemins, doublons, SHA/taille des médias, statistiques, dépendances embarquées, joueurs/PJ et liens courants de scènes/indices. Il ne contrôle pas toutes les structures des satellites, les droits tablette, les champs de chaque jeu, le rendu, les sons ou la justesse des calculs. Le rapport explicite cette portée. Une archive acceptée ici peut encore être refusée par GM-OS.
