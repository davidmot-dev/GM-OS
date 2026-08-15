# Forge de campagne — dérivée du corpus, structurée en actes

**Date :** 2026-08-15
**Branche :** `feature/tablet-hub-pwa`
**Statut :** conception — aucun code écrit
**Documents jumeaux :**
`2026-08-08-trame-narrative-cycle-seance.md` (le modèle actes/scènes, et l'après-partie) ·
`2026-08-11-forge-systeme-derivee-du-corpus.md` (la mécanique qu'on transpose ici)

**Origine.** Revue de la Forge de campagne demandée par David. Huit défauts relevés (§ 1), puis sa
question : *« est-ce qu'on ne pourrait appliquer la même chose que pour la Forge Système avec
l'utilisation de NotebookLM et des prompts différents, sachant que les livres sont sur NotebookLM ? »*,
et ses deux corrections — **ne pas extraire les règles d'une campagne**, et **structurer en actes et en
scènes**.

Ce document ne remplace pas celui du 8 août : il en instruit le **§ 6** (« La Forge Chronique génère la
trame ») et rien d'autre. Tout ce qui relève de la capture en partie et de l'après-partie y reste.

---

## 0. Les deux temporalités

**Décision de David, 2026-08-15 :** *« la partie résumé intervient dans une autre temporalité, il faut le
garder en tête, on va d'abord améliorer la forge. »*

| Temporalité | Ce qui s'y joue | Statut |
| --- | --- | --- |
| **Préparation** — avant la table | l'Atelier de campagne, la Forge, la trame écrite | **le présent document** |
| Partie | capture des scènes traversées, marquages gratuits | document du 8 août, § 3 |
| Après-partie | curation scène par scène, résumé, chronique, envoi NotebookLM | document du 8 août, § 4 |

Le modèle actes/scènes est **commun aux trois** — c'est pour cela qu'il est un prérequis ici (§ 5) et
non une fonctionnalité de ce chantier. On écrit la structure de données et ce qu'il faut pour la
**produire** et la **relire** ; on ne touche ni à la capture ni à la curation.

> ⚠️ Un bug actif de l'après-partie est signalé au § 8. Il pollue des données **aujourd'hui**, il se
> corrige en quelques lignes, et il n'attend pas ce chantier.

---

## 1. L'état des lieux

Huit défauts relevés le 2026-08-15 par lecture de `ChronicleService.ts`, `ChronicleForge.tsx` et
`crossDomainHelpers.ts`. Les cinq premiers survivront à la refonte s'ils ne sont pas traités ; les trois
derniers disparaissent avec elle.

### 1.1 L'invite part enrobée

`ChronicleService.ts:53` appelle `generateJSON` **sans `sansPersona` et sans `schema`**.

Sur Ollama — le moteur de David — `prepareSystemPrompt` ajoute à cet appel les instructions de la gemme
Sage **résolues depuis le corpus de la campagne active**, plus les personnages et PNJ de la séance en
cours. À une forge dont le métier est d'en créer **une autre**.

C'est le défaut du 2026-08-12, corrigé dans la Forge Système (`ForgeService.ts:173` passe
`{ lite: true, sansPersona: true }`) et dans le Cortex, jamais ici. *Un contexte hérité d'ailleurs reste
un choix que personne n'a fait.*

Et c'est la plus grosse sortie structurée de l'application — quatre collections imbriquées — la seule
qu'on demande encore poliment au lieu de l'imposer au décodeur.

> Sur Gemini, la persona n'est pas ajoutée : cette branche (`AIService.ts:945-1056`) n'appelle pas
> `prepareSystemPrompt`. Mais elle ne pose pas `response_schema` non plus. Aucun des deux fournisseurs
> n'est contraint.

### 1.2 L'invite enseigne D&D — et c'est la cause des chaînes dans les champs numériques

`ChronicleService.ts:76` : *« Remplis "hp", "ac", "speed", "initiative" en fonction du Driver »*, puis
l'exemple montre `"hp": 10, "ac": 10`.

Sur Dune, le modèle n'a pas de points de vie à donner. Il répond donc en prose :
`hp: "Inférieure à 1 (gravement battu)"`, `speed: "Normal"` — dans des champs typés `number`.
**Ce n'est pas le modèle qui dérape, c'est la question qui n'a pas de réponse.**

Le pilote sait pourtant dire `defaultHealthType`, `santeDeDepart`, `tacheDeDefaite`. Rien de tout cela
ne part : seuls `dice.logic` et les libellés de `statsToTrack` sont transmis.

C'est aussi la leçon du groupe `identite` de la Forge Système, payée en réel : un exemple à valeurs
concrètes se fait recopier. Dérivée d'Alien, la Forge avait rendu le nom, la description et la couleur
de Dune.

### 1.3 Le mode Enrichissement promet ce qu'il ne tient pas

L'invite déclare *« intègre-toi naturellement à cet univers existant »* — et **seul le nom de la
campagne est envoyé**. Ni synopsis, ni PNJ, ni lieux, ni lore.

Corollaire mesurable : `crossDomainHelpers.ts:26-43` ne construit sa table nom → identifiant que sur
**le lot courant**, et `.filter(r => r.targetId)` jette ensuite toute relation visant un PNJ déjà en
base. Un enrichissement ne peut structurellement pas se relier à l'existant.

### 1.4 Enrichir réécrit le système de la campagne visée

`crossDomainHelpers.ts:60` : `system: campaign.system || c.system`. Or `campaign.system` vaut toujours
`selectedDriverId`, que `startForge` rend obligatoire.

Enrichir « Agents de Dune » avec le sélecteur resté sur Alien **change le jeu de la campagne** — donc le
pilote de tous ses PNJ (`piloteDuPersonnage`, source 3), leurs jets, leur modèle de santé. Sans un mot.

### 1.5 « Campagne cible » est du texte libre qui échoue en silence

`ChronicleForge.tsx:313` compare par égalité stricte sur le nom. Une faute de frappe et l'invite part
quand même en mode enrichissement, pendant que le dépôt crée une campagne neuve. Deux comportements
opposés à un caractère près, et rien à l'écran ne les distingue.

### 1.6 Le badge moteur ment

`ChronicleForge.tsx:403` affiche « Gemma 4 » pour tout ce qui n'est pas Gemini, quel que soit le modèle
réellement chargé. `ChronicleService.ts:49` refuse les pièces jointes au même nom. Même défaut que le
bandeau du profil vocal, corrigé le 2026-08-15.

### 1.7 Le toast dit « déployée » avant tout déploiement

`startForge` et `handleCommit` partagent la clé `chronicle_forge_module.deploy_success` — « Chronique
déployée dans le Codex ». Le premier n'a fait qu'afficher un aperçu.

### 1.8 Ce que la Forge ne produit pas

`TimelineEvent` et `Clue` existent, sont typés, ont leurs écrans (`CluesManager` côté MJ, `HubArchives`
et `HubClueViewer` côté tablette) — et **la Forge n'en produit aucun**. Elle range les indices en
entrées de wiki `category: 'clue'`, qui n'ont ni révélation, ni porteur, ni lieu.

Et bien sûr : aucun acte, aucune scène. Le document du 8 août le disait déjà — *« pour un module nommé
Chronicle Architect, c'est le manque le plus net. »*

---

## 2. Ce qu'on transpose de la Forge Système

Elle marche en **deux étages séparés**, et c'est le modèle :

1. **L'Atelier** interroge NotebookLM, un sujet du canevas à la fois, et écrit des **fiches vérifiées et
   sourcées** sur le disque (`docs/systems/<jeu>/rules/*.md`).
2. **La Forge** ne lit jamais le livre. Elle lit les **fiches**, les répartit en huit groupes, et fait
   **un appel par groupe** — schéma imposé, `sansPersona`, vocabulaire des groupes précédents injecté
   dans les suivants.

La règle est écrite dans `GroupesDeChamps.ts:12` : *dériver du corpus, pas produire en parallèle* —
parce que deux productions indépendantes des mêmes faits divergeront et que rien ne les comparera
jamais.

**La Forge de campagne ne fait ni l'un ni l'autre.** Elle tire le texte brut des sources NotebookLM par
MCP (`source_get_content`), le déverse entier dans une invite unique, et demande les quatre collections
d'un coup. C'est l'approche que la Forge Système a abandonnée **après mesure** : budget d'invite réel
~8 000 tokens, corpus de Dune 34 500. *« L'envoyer entier ne vaut pas mieux que d'envoyer le livre : on
en perd les trois quarts en silence. »*

| Acquis de la Forge Système | Vaut ici ? |
| --- | --- |
| Deux étages : fiches sourcées, puis projection | oui, à l'identique |
| Un appel par groupe (budget d'invite, 7,7 tok/s en décodage) | oui |
| Schéma imposé au décodeur | oui |
| `sansPersona` | oui |
| Ordre des dépendances + `blocDuVocabulaire` | **oui, et c'est le gain principal** (§ 4) |
| « N'invente rien, omets » | oui pour l'extraction (§ 3.1) |
| Exemple montrant la forme, jamais les valeurs | oui |
| Canevas **fourni, jamais demandé** | oui, pour les *sujets* — pas pour les actes (§ 3.3) |
| Comblement par la famille (`fichesSupplantees`) | **non** — une campagne n'a pas de socle commun |

---

## 3. Deux choses très différentes s'appellent « forger une campagne »

### 3.1 A — Extraire une campagne publiée

Le module est sur NotebookLM. C'est alors rigoureusement le même métier que les règles : canevas fixe,
questions sourcées, fiches vérifiées, projection. Chaque PNJ redevient traçable jusqu'à une page
vérifiée, et *« n'invente rien, omets »* s'applique mot pour mot.

### 3.2 B — Inventer une campagne originale

Dans un univers documenté, mais sans module publié. Il n'y a rien à extraire : on demande à **produire**.
Toute la discipline s'inverse. NotebookLM sert encore, mais comme **ancrage** — le ton, les factions, ce
qui est vrai du monde — et non comme source à projeter.

> **Aujourd'hui la Forge confond les deux.** « MODE CRÉATION » et « MODE ENRICHISSEMENT » partagent la
> même invite à une phrase près, et le même mot d'ordre.

**Décision : construire A d'abord.** C'est celui où la machinerie se transpose presque sans invention,
c'est ce que David a réellement sur NotebookLM, et B en aura besoin de toute façon — une campagne
inventée doit être ancrée dans les fiches du monde pour ne pas dériver.

### 3.3 Les règles ne s'extraient pas — et c'est structurel

**Décision de David, 2026-08-15 :** *« dans une campagne tu ne dois pas extraire les règles ; à la
rigueur s'il y a des règles spécifiques, il faut les extraire pour les mettre dans le RAG. »*

Ce n'est pas seulement une question de périmètre. **Le pilote appartient au jeu, pas à la campagne.**
Une règle propre à un module — une horloge de corruption, un système de poursuite écrit pour cette
aventure — glissée dans le pilote contaminerait **toutes les autres campagnes du même jeu**, sans que
rien ne le signale. C'est exactement la classe de défaut du § 1.4, par une autre porte.

Donc :

- les règles spécifiques sortent en **fiches sous `campaignPath`**, citables par l'Oracle ;
- elles **ne touchent jamais** le `GameDriver` ni le `SheetTemplate` ;
- la Forge de campagne ne produit **aucun** champ de pilote. Le schéma le lui interdit par construction.

`Campaign.campaignPath` existe déjà (`campaign.types.ts:67`), `RAGService.ts:70` le lit, son champ
« Chemin des Notes » est dans `CampaignForm.tsx:471` — **et rien n'écrit dedans**. La destination est
prête depuis le début.

---

## 4. Les actes sont le second axe de découpage

**Le trou que la transposition laissait.** Les règles sont bornées : un jeu a un seul système
d'initiative, et un appel par sujet suffit. Une campagne a quarante PNJ, et *« énumère tous les PNJ du
module »* ne rentre dans aucune réponse. Il fallait un second axe de découpage que la Forge Système n'a
jamais eu à résoudre.

**Les actes sont cet axe.** On demande la colonne vertébrale en premier, puis on interroge le carnet
*acte par acte*. Chaque appel retrouve la taille d'un appel de la Forge Système.

> Le découpage narratif et le découpage technique sont le même découpage. C'est la marque d'un modèle
> juste, et c'est ce qui a fait converger la question de David et la proposition d'architecture sans
> qu'elles se soient parlé.

Et le § 6.2 du document du 8 août le demandait déjà : *« Générer d'abord les entités, lieux et indices,
puis générer la trame en lui fournissant la liste des noms déjà créés : le modèle ne peut plus inventer
un nom qui n'existe pas si on lui donne la liste. »*

---

## 5. Prérequis — le modèle actes / scènes

**On ne peut pas commencer par la Forge.** Elle produirait des actes et des scènes qu'aucun type ne
décrit et qu'aucun écran n'affiche. Vérifié le 2026-08-15 : ni `Acte` ni `Scène` n'existent nulle part
dans `src/types` ni dans `src/modules/session/store/types.ts`.

Ce chantier écrit **la structure et sa relecture**, pas la capture en partie (document du 8 août, § 3).

### 5.1 Ce qu'il faut poser

- `Acte` — rattaché à la campagne, ordonné, portant titre, résumé, et ce que le module en dit.
- `Scene` — rattachée à un acte, ordonnée, portant son résumé de contexte et ses renvois **par
  identifiant** vers le lieu, les PNJ présents, les indices, les objets.
- Le **taux de remplissage** distingue une scène préparée d'une scène improvisée. *Pas deux types* —
  le document du 8 août l'a tranché : deux types forceraient à choisir au pire moment, au milieu d'une
  partie, quand on ne sait pas encore si ce qu'on improvise deviendra important.

### 5.2 Trois points de vigilance repris du 8 août

- **Ne pas confondre `StoryboardMoment` et scène narrative.** On **lie**, on ne fusionne pas : une même
  ambiance sert plusieurs scènes. `StoryboardMoment` est une ambiance technique — `musicPadId`,
  `lightSceneId`, `mapUrl` — et sa liste est plate.
- **Références, pas payloads.** `SessionModuleSnapshot` embarque les playlists complètes ; une scène qui
  ferait pareil pèserait des mégaoctets par marquage.
- **Ne pas empiler les séances sous les actes.** Deux axes qui se croisent, pas une hiérarchie.

---

## 6. L'architecture cible

### 6.1 Étage 1 — l'Atelier de campagne

Même mécanique que l'Atelier des règles : une question par sujet, réponse sourcée, fiche vérifiée écrite
sur disque sous `campaignPath`. Le **canevas des sujets est fourni, jamais demandé** — sinon chaque
carnet invente sa taxonomie et deux campagnes cessent d'être comparables.

Les *sujets* sont fixes ; les *actes* sont lus dans le livre.

| # | Sujet | Destination |
| --- | --- | --- |
| 1 | Pitch, synopsis, ton et registre | `Campaign` |
| 2 | **Structure en actes** — leur nombre, leur titre, leur enjeu | `Acte` — **posé en premier** |
| 3 | Factions et organisations | `WikiEntry` + `Entity.faction` |
| 4 | Lieux majeurs | `AtlasMap` |
| 5 | PNJ majeurs — *interrogé acte par acte* | `Entity` |
| 6 | Secrets, révélations et indices | `Clue` |
| 7 | Amorces et accroches | `WikiEntry` |
| 8 | Menaces et progression | `WikiEntry` (horloges : à trancher, § 10) |
| 9 | **Règles spécifiques à la campagne** | **fiche RAG seule — jamais le pilote** (§ 3.3) |
| 10 | Scènes prévues — *interrogé acte par acte* | `Scene` |

Le canevas est **dérivé de ce que le code consomme**, comme celui des règles l'a été. Sept destinations :
`Campaign`, `Acte`, `Scene`, `Entity`, `AtlasMap`, `WikiEntry`, `Clue`.

### 6.2 Étage 2 — la Forge de campagne

Elle ne lit plus le livre : elle lit les fiches. Un appel par groupe, dans l'ordre des dépendances.
**Chaque étage ne peut désigner que ce que les précédents ont créé** — c'est `blocDuVocabulaire`
appliqué à la narration.

```text
campagne ──> actes ──> lieux ──> factions ──> PNJ (par acte) ──> relations
                                                    │
                                                    └──> indices ──> scènes (par acte)
```

| Ordre | Groupe | Vocabulaire reçu |
| --- | --- | --- |
| 1 | `campagne` — nom, pitch, synopsis, ton | — |
| 2 | `actes` — la colonne vertébrale | — |
| 3 | `lieux` | actes |
| 4 | `factions` | — |
| 5 | `pnj` (une passe par acte) | lieux, factions |
| 6 | `relations` | PNJ **existants, base comprise** (§ 6.3) |
| 7 | `indices` | PNJ, lieux |
| 8 | `scenes` (une passe par acte) | actes, lieux, PNJ, indices |

Sans cet ordre, chaque scène est un pari sur la cohérence orthographique du modèle.

### 6.3 Ne plus jeter en silence

`crossDomainHelpers.ts:42` fait `.filter(r => r.targetId)` : ce qui ne se résout pas **disparaît sans un
mot**. Pour une relation, c'est une perte discrète. Pour une scène, ce serait pire — elle perdrait ses
PNJ et ses indices, et l'écran annoncerait un succès.

**Signaler les non-résolus au lieu de les filtrer.** Petit changement, et il profite rétroactivement aux
relations existantes. Même famille que la récupération des sections égarées
(`recupererSectionsEgarees`) : *on répare plutôt qu'on ne refuse, et on dit ce qu'on a réparé.*

### 6.4 Reforger ne doit pas écraser les retouches

Repris du § 6.4 du 8 août, et toujours vrai : **rien ne protège ce que le MJ a corrigé**. Si retravailler
une séance efface le travail de la semaine précédente, le MJ cessera de retravailler.

L'enrichissement doit donc savoir ce qui existe déjà — ce qui règle aussi le § 1.3 : la campagne visée
est **envoyée** au modèle, plus seulement nommée.

---

## 7. Ordre de travail

Deux voies indépendantes. La première ne dépend de rien et rend la Forge actuelle honnête ; la seconde
construit la cible.

### Voie 1 — assainir la Forge actuelle (elle tourne pendant tout le chantier)

| # | Étape | Défaut |
| --- | --- | --- |
| 1 | `sansPersona` + schéma sur l'appel de chronique | § 1.1 |
| 2 | Transmettre le modèle de santé du pilote, cesser d'enseigner `hp`/`ac` | § 1.2 |
| 3 | Ne plus réécrire `campaign.system` en enrichissement | § 1.4 |
| 4 | Campagne cible : choisie, jamais saisie | § 1.5 |
| 5 | Badge moteur honnête, toast qui ne ment pas | § 1.6, § 1.7 |

Les étapes 1 et 2 vont ensemble : le § 1.2 est la cause racine des chaînes trouvées dans les champs
numériques, et elles se corrigent dans la même invite.

### Voie 2 — la cible

| # | Étape | Pourquoi ici |
| --- | --- | --- |
| 6 | Modèle `Acte` / `Scene` + écrans de relecture | rien ne peut être forgé avant |
| 7 | Canevas de campagne + Atelier (NotebookLM, un sujet à la fois) | produit les fiches |
| 8 | Lecture des fiches de campagne depuis `campaignPath` | l'équivalent de `lireFichesDuCorpus` |
| 9 | Groupes, schémas, ordre des dépendances, vocabulaire injecté | la Forge |
| 10 | Non-résolus signalés au lieu d'être filtrés | § 6.3 |
| 11 | Survie des retouches en reforge | § 6.4 |

---

## 8. Hors chantier — mais actif aujourd'hui

Ces deux points relèvent de l'après-partie (§ 0) et **ne font pas partie de ce chantier**. Le premier est
consigné ici parce qu'il pollue des données en ce moment même, et qu'il se corrige indépendamment.

**`summarizeSession` hors Gemini rend une phrase d'excuse.** `AIService.ts:371` :

```ts
return "Résumé non disponible pour ce fournisseur d'IA.";
```

Elle est **retournée**, pas levée. `generateAISummary` la traite donc comme un succès et l'enregistre
comme résumé ; `syncToNotebook` accepterait de la pousser dans le carnet comme source.
**David est sur Ollama : ses résumés de séance n'ont jamais fonctionné.** Signalé au § 1.2 du document
du 8 août, toujours présent sept jours plus tard.

*À vérifier sur les données enregistrées* : combien de séances portent cette chaîne, et combien sont
déjà parties chez NotebookLM.

**L'événement de décès n'est ni universel ni automatique.** `propagateStatusToSession` n'est appelée que
depuis le gestionnaire d'export du rapport de combat, et jamais pour un PJ. L'événement narratif le plus
fort d'une séance ne laisse aucune trace. Voir le § 5.3 du 8 août, y compris l'avertissement sur l'ordre
des travaux.

---

## 9. Ce que la trame apportera ailleurs

Rappelé du § 7 du 8 août, parce que cela change l'arbitrage du coût :

- **Contexte de l'Oracle et du Cortex.** `getLiveSessionContext` envoie aujourd'hui les dix derniers
  événements bruts. *« Scène en cours : l'embuscade de l'entrepôt — les PJ cherchent le manifeste, le
  garde est corrompu »* est un meilleur ancrage pour bien moins de tokens. Pour le Cortex, qui vise 30 à
  60 secondes, c'est direct.
- **Rencontres préparées.** Une scène peut déclarer sa rencontre : à table, un clic lance le combat
  pré-rempli. Un retour sur investissement de la préparation, qui n'existe pas aujourd'hui.
- **Prévu contre improvisé, comme donnée.** La divergence se relève toute seule et dit où la
  préparation a tenu.

---

## 10. Reste à décider

- **Les menaces et horloges de progression** vont-elles dans `WikiEntry`, ou méritent-elles un objet ?
  Une horloge de campagne se coche en séance — c'est un état, pas une entrée d'encyclopédie.
- **Où vivent les fiches de campagne ?** `campaignPath` est déclaré par le MJ et libre. Faut-il une
  convention `docs/campaigns/<slug>/`, symétrique de `systems/<jeu>/rules/`, avec la même résolution
  lecture = écriture que `corpusSysteme.ts` a imposée après le défaut du 2026-08-10 ?
- **Une scène prévue jamais jouée** reste-t-elle dans la trame, ou est-elle marquée abandonnée ? La
  réponse détermine si la trame est un plan glissant ou un registre. *(Reprise du 8 août, § 10.)*
- **Le mode B** (§ 3.2) mérite-t-il ses propres groupes, ou un simple jeu d'invites parallèle sur la
  même structure ? À trancher quand A tournera, pas avant.
