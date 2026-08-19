# Réconciliation des plans d'août 2026

**Date :** 2026-08-19
**Périmètre :** les 19 documents de `documentation/Planning/2026-08-*.md`, ~440 Ko
**Méthode :** chaque statut est **vérifié dans le code ou sur le disque**, jamais recopié d'un document.
Là où un document et le code se contredisent, c'est le code qui tranche, et la contradiction est écrite.

**À quoi sert ce document.** Août a produit dix-neuf plans, écrits au fil de chantiers qui se sont
recouverts. Plusieurs se déclarent mutuellement ouverts ou clos, et certains disent encore « à faire » ce
qui est fait depuis. Celui-ci dit **où en est chaque chantier**, **ce qui reste vraiment**, et **quel
document fait autorité sur quoi** — pour qu'on cesse de relire dix documents afin d'en déduire un état.

Il ne remplace aucun d'eux : ils restent le **récit** de ce qui a été trouvé, et c'est leur valeur. Il
remplace seulement l'exercice de les réconcilier de tête.

---

## 1. Les dix-neuf documents, et ce qu'ils sont

Trois natures, qui ne se lisent pas de la même façon.

**Références vivantes** — à tenir à jour, on y revient :

| Document | Autorité sur |
| --- | --- |
| `2026-08-08-trame-narrative-cycle-seance.md` | **Le chantier courant.** Son § 8 est l'ordre de travail, son § 9 les règles de rattachement, son § 10 les questions non tranchées |
| `2026-08-08-corpus-de-regles.md` | Le modèle du corpus : ce qu'un corpus définit, comment il se copie à la forge |
| `2026-08-09-procedure-corpus-notebooklm.md` | La procédure pas à pas et les gabarits en toutes lettres |
| `2026-08-07-acceleration-ia.md` | Le budget de temps des trois usages d'IA, et les seize axes chiffrés |
| `2026-08-07-fiabilite-cortex-combat.md` | Les cinq axes du Cortex tactique |

**Récits clos** — plus de suite, on les lit pour comprendre un choix, pas pour savoir quoi faire :
`2026-08-05-architecture-review-hardening.md` (9 points, tous clos) ·
`2026-08-07-restes-unification-transport.md` (5 points, tous clos) ·
`2026-08-07-perte-campagnes-persistance.md` (cause, correctif, récupération) ·
`2026-08-11-forge-systeme-derivee-du-corpus.md` (éprouvée le 16/08) ·
`2026-08-14-brancher-le-pilote-dans-les-modules.md` (**se déclare clos** à son § 1 bis) ·
`2026-08-15-forge-de-campagne-et-trame.md` et `2026-08-15-gabarits-atelier-de-campagne.md` (éprouvés le 16/08).

**Instantanés datés** — vrais le jour où ils ont été écrits, faux le lendemain par construction. On les
lit pour l'histoire, jamais pour l'état : les six `etat-et-reprise` des 10, 15, 17, 18 et 19 août, plus
`2026-08-10-soiree-premiere-forge.md`.

> **Le seul instantané à lire pour reprendre est le plus récent** :
> `2026-08-19-etat-et-reprise-quatre-defauts.md`.

---

## 2. Les contradictions, tranchées

Six désaccords entre documents, ou entre un document et le code. Résolus par vérification.

| Sujet | Ce que disait un document | Ce qui est vrai |
| --- | --- | --- |
| **Autorisation par rôle** (revue d'archi, point 9) | Titre marqué `⬜`, bilan du 07/08 : *« l'angle mort est toujours ouvert »* | **Clos.** `electron/actionPolicy.ts` (réseau) puis `electron/relayPolicy.ts` (fenêtres locales). Marqueur corrigé dans le document le 19/08 |
| **`summarizeSession` hors Gemini** | Listé comme reste ouvert les 15/08 **et** 17/08 | **Corrigé le 17/08.** Il lève désormais au lieu de rendre une excuse |
| **Fiches v3 avec `sections:`** | 09/08 : *« aucune n'a encore été produite — c'est le chemin critique »* | **88 fiches** en portent. Chemin critique dégagé |
| **Doublon exact du corpus Cthulhu Hack** | Signalé le 17/08 | **Introuvable** : aucun contenu identique, aucun `sujet:` en double. Nettoyé entre-temps |
| **Cortex, axe 1** (config tactique transmise) | Doc du 07/08 : à faire | **Fait.** `TacticalNarrativeService.ts:95` passe `tacticalConfig` à `getRangeInfo` |
| **`sceneId` dans `metadata`** | Dette notée les 18 et 19/08 | **Fermée le 19/08** — champ de premier ordre, porté par tout ce que le combat émet |

Et une **fausse contradiction** : les comptes de fiches du corpus diffèrent d'un document à l'autre
(17, 18, 13…). Ils ne se contredisent pas, ils sont datés. L'état réel est au § 4.

---

## 3. Les chantiers, par état

### ✅ Clos, et éprouvés

- **Durcissement et transport** — les 9 points de la revue d'architecture, les 5 restes du transport. Le
  transport local est unifié sur `WindowRelay`, avec contrôle de rôle au relais.
- **Perte de campagnes** — cause trouvée, correctif posé, données récupérées par les clichés.
- **Le pilote dans les modules** — les cinq murs, clos le 15/08 par le document lui-même.
- **La Forge Système** — éprouvée en dérivant Cthulhu Hack le 16/08, qui a révélé cinq défauts et donné
  trois leçons de méthode.
- **La Forge de campagne** — éprouvée en réel le 16/08 sur « Le secret de Milo » : 3 actes, 29 scènes,
  43 PNJ.

### 🟠 En cours — c'est ici que le travail se passe

**La trame narrative et le journal.** Ordre de travail du 08/08, § 8 :

| # | Étape | État |
| --- | --- | --- |
| 1 | Corriger `summarizeSession` hors Gemini | ✅ 17/08 |
| 2 | **Décès universel et automatique** | ❌ `useCombatStore.ts:1073` garde `!c.isPlayer` |
| 3 | Modèle actes/scènes + **rattachement automatique** | 🟠 modèle fait ; rattachement fait pour le combat seul |
| 4 | Capture en un clic + marquages gratuits | ❌ |
| 5 | Axe `trace` / `chronique` | ✅ 18/08 |
| 6 | **Revue de fin de séance scène par scène** | ❌ le cœur du § 4.1 |
| 7 | Résumé sur l'ensemble curé | 🟠 le résumé tourne, la curation n'existe pas |
| 8 | Résumé de combat enrichi + événement d'ouverture | 🟠 enrichi ✅, ouverture ❌ |
| 9 | Trame générée par la Forge Chronique | ⛔ **caduque** — la Forge de chronique a été retirée le 17/08 |
| 10 | Trame injectée dans Oracle / Cortex | ❌ |

**Le Cortex tactique.** Axe 1 fait ; axes 2 (faction explicite, `unknown` plutôt qu'`enemy` par défaut),
3 (`linkedCombatantId` sur tous les chemins), 4 (qualifier les entrées : mesuré contre supposé) et 5
(unité de distance tirée du pilote — « cases » est encore en dur, `TacticalNarrativeService.ts:191`)
restent ouverts. Le document porte aussi **trois questions non tranchées**, dont *« fusionner les deux
appels du Cortex en un seul »*, que le plan lui-même désigne comme *« peut-être le vrai levier de
performance »*.

**L'accélération IA.** L'axe A (iGPU) est activé depuis le 12/08. Les quinze autres axes du plan — 55 h
chiffrées — n'ont pas été repris comme tels ; plusieurs ont été traités de biais par d'autres chantiers.
**Ce plan mériterait sa propre relecture**, parce que son ordre recommandé date d'avant la Forge Système,
la Forge de campagne et le journal.

---

## 4. L'état réel du corpus, compté sur le disque

| Système | Fiches | Index |
| --- | --- | --- |
| alien | 25 | 2 |
| blade-runner | 23 | 3 |
| dune | 20 | 3 |
| cthulhu hack | 18 | — |
| srd-yze | 17 | — |
| rêves de dragons | 7 | — |
| noc | 4 | — |
| coc7, dnd-5e | **0** | — |

**88 fiches en v3** (avec `sections:`) · **16 marquées `a_regenerer: true`** · **4 marquées
`doublon_de:`** · **28 citant des pages non fiables** (`pages_fiables: false`).

Cinq campagnes sur disque : `a-la-claire-fontaine`, `anges-de-feu`, `dune`, `hadley-hope`,
`le-secret-de-milo`.

> Le doublon « deux campagnes secret de Milo » signalé le 17/08 **ne se voit pas sur le disque** : il
> vit dans le magasin de l'application (IndexedDB). Il ne peut se vérifier que dans l'écran des
> campagnes.

---

## 5. Ce qui reste, consolidé et priorisé

Dix-neuf documents produisent une liste de restes qui se répètent. La voici dédoublonnée, par ordre de
préjudice réel.

### P1 — Perte de données silencieuse

- **`SessionService.saveFullSession` omet `entities` et `clues`.** Vérifié le 19/08, toujours vrai.
  **Les PNJ et les indices ne sont pas dans les sauvegardes.** Signalé le 16/08, reporté trois fois.
  C'est le seul reste de toute la liste qui détruit du travail.

### P2 — Le journal et la trame

- La **mort d'un PJ** n'émet rien, et l'événement de décès n'est produit qu'au bouton d'export (étape 2,
  marquée *correction* et non fonctionnalité).
- Aucun **événement d'ouverture de combat** (moitié de l'étape 8).
- **`addEvent` écrit dans un journal clos** hors enregistrement.
- L'**export** télécharge du JSON brut alors que `rendreLeCompteRendu` existe.
- La **revue des 37 émetteurs**, un par un.
- La **curation scène par scène** (étape 6) et l'**injection de la trame dans l'Oracle** (étape 10).

### P3 — Le Cortex

Axes 2 à 5, plus les trois questions non tranchées. Le document prévient : *ne pas traiter ce plan avant
les axes A à C du plan jumeau* — l'axe A est fait, B et C ne le sont pas.

### P4 — Le corpus et les règles

- **`docs/commun/`** est reconnu par le moteur et **n'existe toujours pas** sur le disque.
- **16 fiches à régénérer**, 4 doublons à fusionner à cette occasion.
- **noc (4 fiches) et rêves de dragons (7)** sont très en dessous des autres ; **coc7 et dnd-5e sont
  vides**.
- Le **« Chemin des Règles » est vide** pour les campagnes, qui utilisent toutes des systèmes
  `custom-…` : le rattachement repose sur le repli par nom affiché, douteux pour « Rêve de Dragon » au
  singulier contre le dossier `reves de dragons` au pluriel.
- Le **réglage de langue d'un corpus n'a pas d'écran** (édition à la main dans `corpus.json`).
- Le **plafond de 4 000 jetons** du RAG ne laisse passer que deux fiches entières — à réévaluer depuis
  que l'iGPU est actif.

### P5 — Données et ménages

Deux campagnes « secret de Milo » (à vérifier dans l'application) · les 14 factions de Milo à juger ·
`docs/campaigns/dune/Agents_of_Dune.md` hors convention.

### P6 — Ce qui n'a jamais été vu tourner

C'est la catégorie qui a produit **tous** les défauts des 18 et 19 août : la trame en séance (deux scènes
en parallèle, la scène improvisée) · la bascule de combat entre deux scènes **et le retour des tokens** ·
l'aller-retour d'image d'une ambiance · le sélecteur de tirage et le sens du dé · **la consigne de
langue** — on sait qu'elle part, pas que le modèle l'applique.

---

## 6. Ce qui est caduc

- **L'étape 9 du plan de trame** (« la Forge Chronique génère la trame ») : la Forge de chronique a été
  retirée le 17/08. L'étape doit être réécrite ou abandonnée — elle ne peut pas rester en l'état.
- **`documentation/Architecture/roadmap-v6.md`** n'a pas bougé depuis le **16 avril**. Tout ce qui compte
  vit dans `Planning/`. *Une roadmap fausse coûte plus qu'une roadmap absente* : à réconcilier ou à
  archiver.
- Les **comptes de fiches** cités dans les documents des 8, 9 et 10 août : dépassés, voir le § 4.

---

## 7. Comment ne pas refaire ce travail

Trois règles, tirées de ce que la réconciliation a coûté.

1. **Un document déclare sa nature en tête** — référence vivante, récit clos, ou instantané daté. Les
   trois ne se relisent pas de la même façon, et c'est de les confondre qui oblige à tout relire.
2. **Un reste ne se recopie pas d'un document à l'autre.** Quatre documents portaient encore
   `AIService.ts:371`, corrigé depuis le 17/08 ; recopier un reste le fait survivre à sa correction.
   Un reste vit à **un seul** endroit, et les autres y renvoient.
3. **Un statut se vérifie avant d'être écrit.** Six des contradictions ci-dessus tenaient à un document
   affirmant un état que le code démentait depuis des jours.
