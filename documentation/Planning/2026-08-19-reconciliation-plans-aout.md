# Réconciliation des plans d'août 2026

**Date :** 2026-08-19 · **mis à jour le 2026-08-22** (§ 3, § 4, § 5 — les statuts, jamais le récit)
**Périmètre :** les 19 documents de `documentation/Planning/2026-08-*.md`, ~440 Ko

> **Nature de ce document : référence vivante.** C'est le **seul endroit** où vit la liste consolidée des
> restes (§ 5). Un reste qui y est corrigé n'a pas à l'être ailleurs ; un reste qu'on découvre s'y ajoute.
> L'instantané le plus récent à lire pour reprendre est **`2026-08-22-etat-et-reprise.md`**.
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
| ~~`2026-08-08-trame-narrative-cycle-seance.md`~~ | ~~**Le chantier courant.**~~ **✅ CLOS le 2026-08-21** — ses dix étapes sont faites et ses trois questions tranchées. Passe en **récit clos** : son § 9 (règles de rattachement) reste la référence de conception |
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

> **Le seul instantané à lire pour reprendre est le plus récent** : ~~`2026-08-19-etat-et-reprise-quatre-defauts.md`~~
> → **`2026-08-22-etat-et-reprise.md`** (mis à jour le 2026-08-22 ; ceux des 19 et 20 août l'ont précédé
> et sont faux depuis, par construction).

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

~~**La trame narrative et le journal.**~~ **✅ CLOSE le 2026-08-21** — les dix étapes du § 8 du 08/08 sont
faites. *Le tableau d'origine est conservé ci-dessous pour l'histoire : il montre ce qui restait le 19/08
et ce que les deux jours suivants ont emporté.*

| # | Étape | État au 19/08 | Livré |
| --- | --- | --- | --- |
| 1 | Corriger `summarizeSession` hors Gemini | ✅ 17/08 | |
| 2 | **Décès universel et automatique** | ❌ `useCombatStore.ts:1073` garde `!c.isPlayer` | ✅ 20/08 |
| 3 | Modèle actes/scènes + **rattachement automatique** | 🟠 modèle fait ; rattachement fait pour le combat seul | ✅ 20/08, posé au goulot |
| 4 | Capture en un clic + marquages gratuits | ❌ | ✅ 20/08 |
| 5 | Axe `trace` / `chronique` | ✅ 18/08 | ses trois arbitraires tranchés le 21/08 |
| 6 | **Revue de fin de séance scène par scène** | ❌ le cœur du § 4.1 | ✅ 20/08, **complétée le 21/08** (fusionner, scinder) |
| 7 | Résumé sur l'ensemble curé | 🟠 le résumé tourne, la curation n'existe pas | ✅ 20/08 |
| 8 | Résumé de combat enrichi + événement d'ouverture | 🟠 enrichi ✅, ouverture ❌ | ✅ 20/08 |
| 9 | Trame générée par la Forge Chronique | ⛔ annoncée caduque | ✅ **elle était déjà faite** depuis le 15-16/08 |
| 10 | Trame injectée dans Oracle / Cortex | ❌ | ✅ **21/08** (`516395a`) |

~~**Le Cortex tactique — c'est désormais le chantier de code le plus mûr.**~~ **✅ SES CINQ AXES SONT
FAITS le 2026-08-22.** L'axe 2 s'est révélé pire que décrit — ce n'était pas la valeur par défaut mais
**le tri lui-même**, qui rangeait un allié déclaré parmi les cibles. L'axe 5 en cachait un second : le
pilote déclarait déjà le **nom** de ses portées, et trois écrans affichaient la clé canonique.

Il reste **deux des trois questions**, dont *« fusionner les deux appels du Cortex en un seul »*, que le
plan désigne comme *« peut-être le vrai levier de performance »* — et qui a gagné un argument mesuré le
21/08. La troisième est tranchée : quand les entrées ne sont pas fiables, **on conseille en restreignant
le propos** plutôt que de refuser.

> **Son garde-fou est levé depuis le 2026-08-21.** Le document interdisait de le traiter avant les axes A
> à C du plan jumeau : **les trois sont faits**. Et sa question sur les deux appels a gagné un argument
> mesuré — sous `NUM_PARALLEL: 1`, qui est le défaut d'Ollama, **les deux appels font la queue** : on
> attend la somme, pas le plus long. Le commentaire qui promettait le contraire est parti le 21/08.

**L'accélération IA — son socle est posé.** Axe A (iGPU) le 12/08, axe B (RAG) le 09/08, puis le
2026-08-21 : **axe C** (ordre du prompt et contexte du Cortex), **axe D** (annulation réelle, verrou,
plafond unique qui suit le moment de jeu), **axe E.1** (la voie Ollama en flux, qui n'avait reçu aucune
correction depuis deux mois). Restent E.4, F, G et les blocs III à V.

**Ce plan mérite toujours sa propre relecture** avant d'être repris tel quel : son ordre recommandé date
d'avant la Forge Système, la Forge de campagne et le journal — et l'axe E.3 est **caduc**, le
`ChronicleService` qu'il vise n'existe plus.

---

## 4. L'état réel du corpus, compté sur le disque

**Recompté le 2026-08-22.** La colonne du 19/08 est conservée : c'est elle qui montre ce qu'une soirée de
reforge déplace.

| Système | Fiches au 19/08 | Fiches au 22/08 | |
| --- | --- | --- | --- |
| alien | 25 | 40 | |
| blade-runner | 23 | 26 | |
| dune | 20 | 24 | |
| cthulhu hack | 18 | 20 | |
| srd-yze | 17 | 18 | |
| rêves de dragons | 7 | **24** | reforgé le 21/08 ; ses 6 v1 archivées dans `rules-v1/` |
| noc | 4 | 4 | inchangé, toujours très en dessous |
| coc7 | 0 | 2 | **aucune fiche v3**, pas de dossier `rules/` |
| dnd-5e | 0 | 1 | idem |
| star-trek | — | **0** | dossier vide |

**16 marquées `a_regenerer: true`** · **4 marquées `doublon_de:`** · **28 citant des pages non fiables**
(`pages_fiables: false`) — *les trois comptes sont inchangés depuis le 19/08*.

**Les index des livres ont changé de rang le 21/08.** Deux formes de repli et un seuil de densité mesuré
(quarante → cent) : Rêves de Dragons passe de 217 à **544 entrées**, ses deux fichiers enfin lus. C'est ce
qui rend le contrôle des citations utilisable — une fiche citait quatre sections introuvables, elle en
cite quatre qui se résolvent.

Cinq campagnes sur disque : `a-la-claire-fontaine`, `anges-de-feu`, `dune`, `hadley-hope`,
`le-secret-de-milo`.

> Le doublon « deux campagnes secret de Milo » signalé le 17/08 **ne se voit pas sur le disque** : il
> vit dans le magasin de l'application (IndexedDB). Il ne peut se vérifier que dans l'écran des
> campagnes.

---

## 5. Ce qui reste, consolidé et priorisé

Dix-neuf documents produisent une liste de restes qui se répètent. La voici dédoublonnée, par ordre de
préjudice réel.

### ~~P1 — Perte de données silencieuse~~ ✅ close le 2026-08-20 et le 2026-08-21

- ~~**`SessionService.saveFullSession` omet `entities` et `clues`.**~~ ✅ **20/08** (`310d7a3`) — les PNJ,
  les indices et l'historique des séances entrent dans les sauvegardes. C'était le seul reste de la liste
  qui détruisait du travail ; il avait été signalé le 16/08 et reporté trois fois.
- **Deux défauts du même genre, trouvés le 20/08 et corrigés le 21** (`655c715`) : le `.default([])` sur
  `timelineEvents`, `wikiEntries` et `atlasMaps`, qui **remplaçait une chronologie vivante par du vide**
  au chargement — *un champ absent laisse le store tranquille, un défaut à vide l'écrase* ; et
  `validateSession` qui rendait `FullSessionSchema.parse({})` sur échec, d'où « Session chargée et
  vérifiée 📂 » sur un chargement qui n'avait rien chargé.

### ~~P2 — Le journal et la trame~~ ✅ close le 2026-08-21

Les six points sont faits. Conservés pour l'histoire, avec ce qui les a emportés :

- ~~La **mort d'un PJ** n'émet rien~~ ✅ 20/08 — universelle, automatique, type `PJ`, écrite à l'instant
  de la chute.
- ~~Aucun **événement d'ouverture de combat**~~ ✅ 20/08, de nature `trace`.
- ~~**`addEvent` écrit dans un journal clos**~~ et ~~l'**export** télécharge du JSON brut~~ ✅ 20/08 : une
  séance close est un compte rendu, pas un cahier.
- ~~La **revue des 37 émetteurs**~~ ✅ 20/08 — ils étaient 36, et elle a trouvé **cinq défauts muets** dont
  un type d'événement inexistant. Ses **trois classements laissés ouverts** ont été tranchés le 21/08
  (`40f6aa9`), et l'un d'eux cachait un défaut : ouvrir une carte dans l'atlas **déplaçait le groupe**
  dans le résumé.
- ~~La **curation scène par scène**~~ ✅ 20/08, **complétée le 21/08** — fusionner et scinder, avec la
  réversibilité vérifiée (scinder puis refusionner rend le fil intact).
- ~~L'**injection de la trame dans l'Oracle**~~ ✅ 21/08 (`516395a`).

### P1 bis (nouveau, 2026-08-22) — Un jet faux d'un facteur cinq

*Il prend le rang P1 laissé libre : c'est le seul reste de la liste qui produit un dégât à chaque séance.*

**Le pilote de Rêves de Dragons compose `seuil = caractéristiques + compétences`.** Chez RdD la
compétence **déplace la colonne, donc elle multiplie** : Agilité 12 avec +3 vaut 78 %, le pilote annonce
15 %. Dans le sens qui fait échouer les personnages compétents — et *les joueurs concluront que leurs
personnages sont mauvais, jamais que l'outil se trompe.*

**Le code est fait le 2026-08-22** (`e8edd30` → `5f5ac10`, `da94e78`) : la cible multiplie, les deux
tables du livre sont transcrites avec leur exception, la Forge sait produire une cible, et les six degrés
arrivent aux écrans en disant tous le même mot — *ils étaient sept lecteurs à les rendre, pas six.* La
question de livre est tranchée : **le livre imprime 86.**

~~**Il reste le geste**~~ ✅ **FAIT le 2026-08-23, rapporté par David** : il a redérivé le pilote, vidé
le seuil de ses douze composantes, et **vérifié à l'écran — Agilité 12, compétence +3, difficulté
moyenne → 78 %**, avec le calcul affiché (`12 × 6,5`). Le panneau ne réclame plus que deux menus.

> **Deux défauts trouvés grâce à ses captures d'écran, et aucun ne se lisait dans le code :**
>
> 1. **Son pilote déclarait `cible` ET `difficulte`** — deux réglages nommés « difficulté » côte à côte,
>    mécaniques sans rapport. Un commentaire de `PanneauDeJet` affirmait pourtant que ce piège était
>    « défait » : les deux gardes étaient indépendants. *Un commentaire qui déclare un piège fermé
>    dispense de vérifier.* Corrigé sur trois couches — le panneau ne l'affiche plus, le moteur force
>    `reussitesRequises` à 1 quand une cible décide, le contrôle du pilote le signale.
> 2. **Et `jet.difficulte` n'avait AUCUN écran d'édition** — on réclamait donc un retrait irréalisable.
>    *Un contrôle qui réclame une action impossible est pire qu'aucun contrôle*, et c'était **le piège du
>    22/08 refait à l'identique** : une chose sans écran ne se corrige qu'en la refabriquant. Question de
>    David : *« s'il est invisible, comment je le retire ? »* → `EditeurDuJet` porte désormais
>    « Retirer le compte », comme il portait déjà « Vider le seuil ».

*P1 bis était le seul reste de la liste qui faussait une partie en cours. Il ne l'est plus.*

### ~~P3 — Le Cortex~~ ✅ CLOS le 2026-08-22

*Il garde son rang d'origine : d'autres documents le citent comme « P3 », et renuméroter un reste le rend
introuvable. Dans les faits il est deuxième, P1 et P2 étant closes.*

~~Axes 2 à 5, plus les trois questions non tranchées.~~ **Les cinq axes sont faits** — `89e77c0`,
`6a441f5`, `4a57cde` — et l'une des trois questions est tranchée (conseiller en restreignant le propos
quand les entrées ne sont pas fiables). Restent les deux autres, dont *« fusionner les deux appels »*.

**Le garde-fou du document — *ne pas traiter ce plan
avant les axes A à C du plan jumeau* — est levé depuis le 2026-08-21** : les trois sont faits. Voir le
§ 3 pour ce que la mesure de `NUM_PARALLEL: 1` change à sa troisième question.

### P4 — Le corpus et les règles

> **Partagé, et le partage a été tranché le 2026-08-19.** Les quatre premiers points sont du **contenu** :
> ils demandent le carnet, la Forge et le jugement de David, pas une ligne de code. Les deux derniers
> sont du **code**. Aucun des six ne bloque quoi que ce soit — c'est de la justesse de réponse, pas de
> la fiabilité, et c'est pourquoi P4 passe après P1 et P2.

- ~~**`docs/commun/`** est reconnu par le moteur et **n'existe toujours pas** sur le disque.~~
  ✅ **Créé par David le 2026-08-23.** C'est le fonds valable pour **tous les jeux** — la seule
  provenance que `resolveProvenance` accepte quel que soit le système actif, au rang **30**, sous les
  fiches (100), la campagne (60) et le système (40). *Il complète, il ne contredit jamais une règle du
  jeu.* Reste à le remplir de ce qui est transversal : conventions de maîtrise, règles maison, glossaire
  de table.
- ~~**16 fiches à régénérer**~~ — ~~**3 au 2026-08-23**~~ ✅ **ZÉRO au 2026-08-24, le point est CLOS**
  (`2db76db`). Les trois derniers étaient du Blade Runner : `gestion-quarts-pauses`,
  `mecanique-forcer-un-jet`, `souvenir-cle`. Le premier était en **doublon** avec
  `structure-temporelle-par-quarts-et-pauses` (v3, huit sections citées) alors qu'il n'avait **aucune
  source** — *l'Oracle peut répondre depuis celle qui ne cite rien* — et il a été **supprimé** ; les deux
  autres ont reçu leurs sources. **Rien à traiter avant la séance de Blade Runner.**
  *(Recompté avec sa méthode le 2026-08-24 : `a_regenerer: true` dans les `rules/` — aucun résultat, pour
  aucun système. Les 12 occurrences restantes sont toutes dans des `rules-v1/` archivés, hors index.)*
- ~~**noc (4 fiches) et rêves de dragons (7)** sont très en dessous des autres~~ — **rêves de dragons est
  reforgé le 21/08** (21 fiches), **star-trek est né le 22/08** (19 fiches), et **noc est reforgé le 22/08**
  (18 fiches, **commitées** — `6cee139`). ~~Restent **coc7 et dnd-5e**, qui n'ont **aucune fiche v3**.~~
  ✅ **CLOS le 2026-08-24 : les deux sont SUPPRIMÉS, sur décision de David.** Ce n'étaient pas des
  corpus incomplets mais des reliquats d'avril : **ni l'un ni l'autre n'avait de dossier `rules/`**, donc
  l'Oracle n'y résolvait rien ; aucune campagne et aucun pilote ne les déclarait. Partis avec eux : les
  66 Ko de `coc7_rag_extraction_final.md` — récupérables dans git si un jour le jeu revient. **Le P4 du
  corpus n'a donc plus de reste.**
- ~~Le **« Chemin des Règles » est vide** pour les campagnes~~ — **la soirée du 22/08 a montré que le
  problème était ailleurs, et bien plus grave.** Le moteur n'appelait pas `resoudreCorpus` du tout, le
  chemin saisi à la main n'était pas déplié, et **le coffre Obsidian remplaçait la racine documentaire à
  chaque question**. Corrigé (`1c6e0a1` → `454155d`) ; voir `2026-08-22-etat-et-reprise.md`, § 2.7.
**Les deux qui sont du code :**

- ~~Le **réglage de langue d'un corpus n'a pas d'écran**~~ ✅ **22/08** (`4fd00bd`) — un corpus se
  déclare depuis l'atelier : nature, moteur et langue, sans passer par un éditeur de texte.
- ~~Le **plafond du RAG**, `MAX_CONTEXT_TOKENS = 4000`~~ — ✅ **mesuré et TRANCHÉ le 2026-08-23**
  (`2026-08-23-plafond-rag-mesure.md`, qui porte les chiffres et la méthode). **Il reste à 4 000.**

  Deux sondes, l'une hors modèle et exacte, l'autre sur `gemma4:12b` à 100 % GPU. Ce qu'un palier
  achète : de 4 000 à 8 000, la pertinence double — 18 fiches à 37 sur dix questions réelles — pendant
  que le bruit passe de 2 à 8 ; au-delà de 8 000, chaque fiche gagnée coûte une fiche muette. Ce qu'il
  coûte : **+51 s par question**, soit 38 s qui deviennent 89 s, deux passes concordantes.
  *Le plafond n'est pas un réglage de qualité, c'est un réglage de temps d'attente.*

  > **Il ne se rouvre qu'à une condition mesurable** : un prefill notablement plus rapide. Le débit
  > tient aujourd'hui entre 106 et 115 tok/s ; à 300 tok/s la question se reposerait.

  **La mesure avait ouvert trois restes qui valaient plus que le plafond** — ✅ **les trois sont CLOS le
  2026-08-23**, le jour même, avec deux autres qu'on ne cherchait pas (les accents, la comparaison en
  sous-chaîne). Mesuré après coup sur les mêmes quatorze questions : **43 documents partaient, 27
  partent**, et il en part *plus* de pertinents — 25 contre 23, **zéro fiche muette, zéro saut de file**.
  Voir `2026-08-23-plafond-rag-mesure.md`, § 6.

  > ⚠️ **Ce paragraphe était périmé jusqu'au 2026-08-23 au soir**, et il a fait annoncer à David trois
  > chantiers déjà faits. *Une liste de restes qui vit à deux endroits en désigne un faux* — la règle 2
  > du § 7 s'applique à ce document lui-même.

  Les trois, et où ils sont corrigés dans `electron/ragSelection.ts` :

  - ~~**Le budget tranche sur la taille, pas sur la pertinence.**~~ ✅ — `meilleurScoreEcarte` et
    la raison `double-par-le-rang`. 13 des 31 documents retenus à 4 000
    ont un score inférieur à celui d'un document écarté faute de place : la boucle gloutonne écarte une
    fiche trop grosse **et continue**, laissant un petit document moins bien classé se glisser derrière.
    Sur « comment se résolvent les jets ? », la troisième place va à une fiche de PNJ de scénario [63]
    pendant que `degres-de-reussite-et-critiques` [103] attend le palier 8 000.
  - ~~**Aucun seuil de pertinence.**~~ ✅ — la raison `hors-sujet`, avec la garde du cas « question
    sans mots porteurs ». *Une seule correction pour deux défauts : `rien` redevient atteignable.* Une fiche à 100 tout rond n'a aucun mot commun avec la question et
    occupe pourtant 1 450 tokens. C'est aussi ce qui rend `rien` inatteignable, déjà consigné le 22/08 —
    **une seule correction pour deux défauts.**
  - ~~**À égalité de score, c'est le nom de fichier qui décide.**~~ ✅ — les occurrences comptent,
    plafonnées à trois (`OCCURRENCES_QUI_COMPTENT`). +12 pour un mot dans le titre, +3 pour un
    mot dans le corps, sans compter les occurrences : passé la fiche qui porte le mot dans son titre,
    tout s'agglutine à 103 et le départage se fait à l'ordre alphabétique du chemin.

*Note sur le « Chemin des Règles » : le repli échoue vraiment.* `memeIdentite` ne rapproche que des
identifiants égaux ou préfixés d'un tiret — il compare donc `reve-de-dragon` à `reves-de-dragons` et ne
conclut rien. Mais **le code offre déjà deux sorties propres** : le Chemin des Règles, qui est souverain,
et le choix à la main dans l'atelier. Il n'y a pas de correctif à écrire, seulement un champ à remplir.

### ~~P5 — Données et ménages~~ ✅ fait le 2026-08-19

Les trois ménages sont faits, **rapportés par David le soir même** : le doublon de campagne « secret de
Milo », les 14 factions à juger, et le sort d'`Agents_of_Dune.md`.

*Ce qui a été vérifié et ce qui ne l'a pas été, parce que la distinction compte* : le doublon de
campagne et les factions vivent dans le magasin de l'application (IndexedDB) et **ne sont pas
observables depuis le dépôt** — ils sont consignés sur la parole de David, ce qui suffit puisque c'est
lui qui les a faits.

**`docs/campaigns/dune/Agents_of_Dune.md` reste où il est, et c'est une décision** (David, 2026-08-19) :
*« Agents de Dune me convient pour l'instant, si je veux le reforger je le ferai plus tard. »* Le
fichier est donc hors convention **volontairement**, et non par oubli — le document d'origine notait
d'ailleurs que le renommer risquait de casser un « Chemin des Notes » déclaré, *qui est souverain*. Une
reforge éventuelle viserait `campaigns/agents-de-dune/` et rendrait la question sans objet. **À ne pas
resignaler comme un reste.**

### P6 — Ce qui n'a jamais été vu tourner

C'est la catégorie qui a produit **tous** les défauts des 18 et 19 août : ~~la trame en séance (deux scènes
en parallèle, la scène improvisée)~~ · la bascule de combat entre deux scènes **et le retour des tokens** ·
l'aller-retour d'image d'une ambiance · ~~le sélecteur de tirage et le sens du dé~~ · **la consigne de
langue** — on sait qu'elle part, pas que le modèle l'applique.

**Mise à jour du 2026-08-22, et elle vaut confirmation de la catégorie elle-même.** La séance du 21/08 a
levé la trame en séance et le pupitre de dés — **en révélant huit défauts que la lecture du code n'avait
pas trouvés**, dont un jet à seize dés et un combattant nommé « Ajouter un Combattant » qui a traversé le
journal, la chronique et le modèle. S'ajoutent à la liste, non vus tourner : **la fusion et la scission de
scènes** à la revue, livrées le 21/08, et le journal de contexte d'Ollama, posé le 22.

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
