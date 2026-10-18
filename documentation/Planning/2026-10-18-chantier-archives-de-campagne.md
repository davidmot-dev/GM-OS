# Chantier — les archives de campagne : la campagne, et ses médias

Ouvert le 2026-10-18. David, après avoir fini le scénario Blade Runner : *« au niveau de l'export,
je veux 2 choses, d'une part un export de tout ce qui concerne la campagne en elle-même, les pnj,
les trames, scène, lieux, wiki, etc... et d'autre part tout ce qui est média, light os, etc.... Je
veux pouvoir tout réimporter tel quel si je veux refaire jouer la campagne, ou alors réimporter les
média si je veux créer une nouvelle campagne dans le même univers et retrouver les media
réutilisables »*, puis : *« rédige le chantier et n'oublie pas la trame »*.

> ⏸ **Garé le 18/10 à la demande de David** (« note le chantier pour plus tard »). Rien n'est
> commencé ; les décisions du § 7 sont prises. Reprendre par E0, puis E1 et E3 (§ 6).

**Rien n'est codé ; les décisions du § 7 sont prises.** Cette page dit ce qui existe, ce qui manque, ce que je propose, et les décisions
à prendre. Inventaire fait dans le code le 18/10 (chemins et lignes cités, à revérifier avant de
coder : le code bouge).

---

## 1 · Ce qui existe déjà : l'archive Nexus (`.gmos`)

Le bouton « Export Nexus » de la fiche de campagne (`CampaignDetails.tsx:51`) et de la
bibliothèque (`CampaignLibrary.tsx:114`) produit un zip `.gmos` : `manifest.json`, `state.json`,
`assets/{profiles,maps,decks,misc}` (`src/modules/system/archive/NexusService.ts`, 1 755 lignes ;
`electron/nexus_bridge.ts` ; format dans `nexus.types.ts`). L'import (`importBundle`, `:1511`)
remet chaque média au Media Hub sous un identifiant neuf, rattaché à la campagne, puis réécrit les
références (`remapPaths`, `:1004`) ; sur un conflit, il propose **remplacer, cloner ou annuler**.

| Ce que `scrapeCampaignData` (`:218`) emporte | Remarque |
| :--- | :--- |
| la campagne (dont la fiche du groupe, le fond, **la disposition de la trame** : `organisationDeLaTrame`, `stylesDesLiensDeTrame`, `dispositionPrecedenteDeTrame`) | `campaign.types.ts:243-245` |
| séances, lieux (atlas), wiki, chronologie, indices | filtrés par `campaignId` |
| **actes et scènes** (la trame), rencontres préparées | filtrés par `campaignId` |
| journaux de séance portant la campagne | les anciens sans `campaignId` restent |
| PNJ de la campagne, et ceux d'autres campagnes liés par relation (secrets du meneur vidés) | `:154` |
| personnages des joueurs de la campagne | |
| paquets de cartes **du système** ; pilotes et fiches personnalisés ; modules du jeu | |
| **toutes** les ambiances sonores et **toutes** les playlists | pas seulement celles de la campagne (`:306`) |
| les médias, en option (`includeAssets`) : `m-…` du Media Hub en base64, fichiers du disque copiés | |

À côté : l'**export Obsidian** (`ObsidianExportService.ts`), du Markdown pour le coffre, **pas
réimportable** — et défectueux : il reçoit **tous** les PNJ, lieux et entrées du wiki, sans filtre
par campagne (`crossDomainHelpers.ts:247`).

---

## 2 · Ce qui appartient à une campagne — et où cela vit

| Donnée | Clé de rattachement | Rangement | Dans Nexus ? |
| :--- | :--- | :--- | :---: |
| campagne, séances, messages, PNJ, personnages, lieux, chronologie, wiki, indices, **actes, scènes**, rencontres, butin | `campaignId` | magasin de session (IndexedDB `gmos-state-db`) | oui, sauf **messages** et **butin** |
| journaux de séance | `campaignId?` | `journal-os-storage-v2` | oui (ceux qui la portent) |
| **moments de storyboard** (une scène y renvoie : `momentDeStoryboardId`) | `campaignId` | `gm-os-storyboard-storage` | **non** |
| réserves de table (Traque, Impulsion…) | `reserves[campaignId]` | `gmos-ressources-de-table` | **non** |
| combats préparés d'une scène | `combatsGares[sceneId]` | `gmos-combat-storage` | **non** |
| favoris | `campaignId?` | `gm-os-favorites-storage` | **non** |
| playlists de Music-OS | `campagneId?` | `gmos-music-storage` | toutes, sans filtre |
| ambiances de Sound | `campagneId?` | `gm-os-sound-storage` | toutes, sans filtre |
| tuiles de **Light-OS** | `campagneId?` | `gm-os-light-storage-v1` | **non** |
| modules du jeu (état par campagne) | `campagnes[campaignId]` | processus principal | oui |

La liste officielle des détenteurs d'une campagne (`services/purge/detenteursDeLaCampagne.ts`,
pour la purge) **oublie Sound et Light** : à compléter, et à réutiliser ici — *une seule liste de
ce qui appartient à une campagne*, pour purger comme pour archiver.

## 3 · Ce qui appartient à un univers, ou à personne

| Donnée | Rattachement | Rangement |
| :--- | :--- | :--- |
| médias du Media Hub (`m-…`, blob) | `campaignIds[]` (étiquettes) | IndexedDB `gmos-media-db` ; miroir disque `userData/backups/medias` |
| Image-OS : images, dossiers, **diaporamas** | aucun | `gmos-image-storage` (chemins absolus ou adresses) |
| fichiers de Music et de Sound | aucun (chemins absolus) | sur le disque de David |
| cartes : réglages, zones, **brouillard** | `mapUrl` | `gmos-map-storage`, IndexedDB `gmos-fog-data` |
| paquets de cartes (Deck-OS) et leurs images | `systemId` | `assets/decks/<système>/…` |
| tables aléatoires (Table-OS) | univers | `databases/tables/<univers>/*.json` |
| calendriers (Clock-OS) | aucun | `databases/calendars` |
| bestiaire | `jeuId` | `gmos-bestiaire-storage` |
| Voice, Ulanzi, Ambient, tableau blanc | aucun | stockage local |

---

## 4 · La trame — ce qu'il faut emporter, et ce que le clonage casse

La trame d'une campagne, c'est :
- les **actes** (`Acte` : titre, résumé, notes, ordre, achevé) et les **scènes** (`Scene`,
  `trame.types.ts:159`) : titre, résumé, notes, origine (préparée, improvisée), importance,
  description narrative, enjeux, répliques, idées musicales, cosms ;
- le **parcours réel** : les **passages** de chaque scène (`PassageDeScene` : début, fin, séance),
  `termineeLe`, `ecarteeDeLaChronique` — ce qui a été joué, quand, et à quelle séance ;
- la **forme du graphe** : enchaînements entre scènes (`enchainements[].vers`), positions,
  trajets et styles des liens, disposition précédente — rangés **sur la campagne** ;
- les **liens vers le reste** : `lieuId`, `entiteIds` (PNJ), `personnagesIds`, `indiceIds`,
  `momentDeStoryboardId`, `morceauxIds` (musique), `battlemapIds` / `battlemapsRetirees`,
  `noteObsidian` (un chemin du coffre), et, ailleurs, les combats préparés (`combatsGares[sceneId]`).

**Export « tel quel » : déjà presque complet** (actes, scènes, disposition sur la campagne). Il y
manque ce que la trame **désigne** sans l'emporter : les moments de storyboard, les combats
préparés, et — pour les morceaux et battlemaps — la certitude que leurs références se réécrivent à
l'import (à éprouver).

**Clonage (rejouer en copie) : cassé pour la trame.** `applyResolutionToState` (`:1389`) donne de
nouveaux identifiants à tout, mais ne réécrit, dans les scènes, que `acteId`. Restent pointés
vers **l'original** : `lieuId`, `entiteIds`, `indiceIds`, `enchainements[].vers`,
`passages[].seanceId`, `momentDeStoryboardId`, `battlemapIds` ; et sur la campagne copiée, les
positions et trajets du graphe, **indexés par identifiant de scène**. Une copie montrerait donc
une trame sans liens, un graphe en vrac, des scènes sans lieu ni PNJ. Il faut **une table de
correspondance unique** ancien → nouvel identifiant, appliquée à **tous** les champs qui en
portent (et aux relations entre PNJ, aux personnages, aux rencontres, aux journaux, aux modules du
jeu, que le clonage oublie aussi).

**Rejouer, c'est aussi remettre à zéro** : une campagne qu'on refait jouer ne doit pas arriver avec
les passages, les scènes terminées, les séances et les journaux de la première fois. À décider
(§ 7) : un import « à rejouer » qui garde la préparation (actes, scènes, enchaînements, graphe,
PNJ, lieux, indices, storyboard) et **efface le parcours** (passages, `termineeLe`, séances,
journaux, réserves de table, combats en cours).

---

## 5 · La proposition : deux archives

**A. L'archive de campagne** (`.gmos`, Nexus étendu) — *tout ce qui fait la campagne*, médias cités
par référence :
- ce que Nexus emporte déjà (§ 1), **plus** : moments de storyboard, réserves de table, combats
  préparés, favoris, butin, messages ; les playlists, ambiances et tuiles Light-OS **de cette
  campagne seulement** (plus les autres) ;
- les états de paquets de cartes **de ses paquets seulement**.

**B. L'archive des médias et ambiances d'un univers** (nouvelle, `.gmos-medias`) — *ce qui se
réutilise d'une campagne à l'autre* :
- médias du Media Hub étiquetés avec la campagne (ou choisis), Image-OS (images, dossiers,
  diaporamas), réglages et brouillard des cartes ;
- playlists, ambiances sonores, tuiles Light-OS, **avec leurs fichiers** (copiés depuis le disque) ;
- paquets de cartes du système et leurs images ; tables aléatoires et calendriers de l'univers.

**Trois imports** :
1. **Tel quel** — A puis B : la campagne revient identique (identifiants conservés ; refus, ou
   « remplacer », si elle existe déjà).
2. **À rejouer** — A en copie : nouveaux identifiants partout, **trame réécrite en entier**, et
   parcours effacé (selon § 7) ; B si les médias manquent sur ce poste.
3. **Médias seuls dans une nouvelle campagne** — B : tout revient dans les bibliothèques,
   **étiqueté pour la campagne choisie**, sans rien de l'ancienne campagne.

Chaque import : **sauvegarde avant d'écrire**, aperçu de ce qui va entrer, rien d'écrasé sans le
dire.

---

## 6 · Les lots proposés

| Lot | Quoi | Taille |
| :--- | :--- | :--- |
| **E0** | L'export Obsidian filtré par campagne (correction du défaut) | petit |
| **E1** | Une seule liste des détenteurs d'une campagne (purge **et** archive), Sound et Light compris | petit |
| **E2** | L'archive de campagne complète : storyboard, réserves, combats préparés, favoris, butin, messages ; playlists, ambiances et Light **de la campagne** ; états de ses seuls paquets | moyen |
| **E3** | **Le clonage juste** : une table de correspondance ancien → nouveau pour tous les identifiants, appliquée à la trame entière (scènes, enchaînements, passages, graphe, storyboard, battlemaps), aux relations, personnages, rencontres, journaux, modules du jeu | moyen |
| **E4** | L'import « à rejouer » : la préparation gardée, le parcours effacé | petit, après E3 |
| **E5** | L'archive des médias et ambiances d'un univers (`.gmos-medias`) : export, import dans une campagne choisie, fichiers audio et Light compris | grand |
| **E6** | Aperçu avant import, sauvegarde avant écriture, journal de ce qui est entré | moyen |

Ordre proposé : E0 → E1 → E3 (le plus fragile, le plus utile pour rejouer) → E2 → E4 → E6 → E5.

## 7 · Les décisions à prendre

1. **Rejouer** : qu'efface-t-on ? Passages et scènes terminées, sûrement ; séances et journaux ?
   réserves de table remises au départ ? fiches des personnages gardées, ou personnages laissés de
   côté (nouveaux joueurs) ?
2. **Les PNJ d'autres campagnes** liés par relation : les emporter (comme aujourd'hui, secrets
   vidés) ou couper le lien ?
3. **Les médias de l'archive B** : tous ceux étiquetés pour la campagne, ou un choix dans une liste
   au moment d'exporter ?
4. **Les fichiers audio** (Music, Sound) : les copier dans l'archive (lourd, mais complet), ou
   seulement leurs chemins (léger, ne marche que sur ce PC) ?
5. **Une ou deux archives à l'export** : deux boutons, ou un seul qui produit les deux fichiers ?
6. **Le nom** de l'archive B : `.gmos-medias` ? `.gmos-univers` ?

### Les décisions de David — 18/10

1. **Rejouer** : on **efface les séances et les journaux** (et donc le parcours : passages, scènes
   terminées) ; on **garde les personnages**. *Non tranché* : les réserves de table — proposé :
   remises à leur départ, comme à « Nouveau scénario ».
2. **PNJ d'autres campagnes** liés par relation : **on coupe le lien** — ils ne partent plus.
3. **Archive des médias** : **tous ceux de la campagne**.
4. **Fichiers audio** : **copiés dans l'archive**.
5. **Deux boutons** à l'export.
6. L'archive des médias s'appelle **`.gmos-medias`**.

## 8 · Garde-fous

- ⛔ Jamais éprouvé sur les données de David : **instance jetable** (`npm run repetition`, profils
  `e2e/`), campagnes fictives, puis une archive de Blade Runner importée **dans** l'instance jetable.
- Un import écrit **après** une sauvegarde automatique, et dit ce qu'il a écrit.
- Les essais de bout en bout : exporter → importer tel quel → comparer ; cloner → vérifier que
  **chaque** identifiant de la trame désigne la copie (un essai qui parcourt tous les champs
  d'identifiant, pour qu'un champ ajouté plus tard ne s'oublie pas en silence).

**En attendant** : l'export Nexus actuel, médias compris, garde déjà la campagne Blade Runner
(trame comprise) — sans storyboard, réserves, Light-OS ni combats préparés. Ne pas cloner une
campagne avant E3.
