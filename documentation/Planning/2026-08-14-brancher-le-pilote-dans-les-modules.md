# Brancher le pilote dans les modules — état des lieux du 2026-08-14

Écrit pour être lu à froid. Fait suite à `2026-08-11-forge-systeme-derivee-du-corpus.md`, dont les
quatre axes sont clos : **la Forge produit un pilote juste**, éprouvé sur Alien le 2026-08-14 (zéro
constat aux contrôles).

La question qui ouvre ce document est celle de David : *« on a fini la Forge Système, maintenant il
faut utiliser cela dans les autres modules »*. Ce texte ne propose rien à faire — il dit **ce qui
lit le pilote aujourd'hui, ce qui l'ignore, et ce que chaque manque coûte en séance.**

Branche `feature/tablet-hub-pwa`, **1 053 tests verts**, `tsc -b` propre, build vérifié.
Relevé sur le code, fichier par fichier, et éprouvé sur le pilote d'Alien réellement enregistré.

---

## 0. Ce qu'il faut savoir avant de lire le reste

**Le défaut a toujours la même forme, et il n'est jamais bruyant.** Un module qui ignore le pilote
ne plante pas : il retombe sur une valeur générique — dix points de vie, une portée par défaut, un
« HP 0/0 » — et cette valeur *ressemble à une réponse*. C'est la leçon tenue depuis le 2026-08-10,
et les relevés ci-dessous en sont tous des cas.

**L'étalon de lecture est Alien**, parce qu'il ne ressemble pas à D&D : pas de points de vie fixes
(la Santé vaut la **Force**, deux à cinq), pas d'initiative chiffrée (des **cartes** numérotées),
pas de monnaie de table, une **réserve** de d6 dont on compte les six. Tout ce qui suppose D&D
casse silencieusement sur lui.

---

## 1. Ce qui est déjà branché — et c'est la majorité

Treize fichiers lisent le pilote actif (`getActiveDriver`), et la répartition par champ montre que
les quatre murs ont bien été suivis d'effet.

| Champ du pilote | Lu par | État |
|---|---|---|
| `dice` + `dice.engine` | `DiceBoard`, `DiceEngine`, `RemoteDicePad`, `diceActions` | **branché**, tablette comprise |
| `jet` (`DescripteurDeJet`) | `CharacterSheetEditor` → `PanneauDeJet` | **branché**, avec une réserve (§ 3) |
| `ressourcesDeTable` | `CombatControls`, `PanneauDAlternance`, `PanneauDeJet`, `SessionDashboard` | **branché** côté MJ |
| `combat.initiative` | `CombatControls`, `InitiativeList`, `EncounterGenerator` | **branché** |
| `combat.tacheDeDefaite` | `useCombatStore` (`santeSelonLeSysteme`) | **branché** |
| `combat.statsToTrack` | `CombatCard` | **branché** |
| `ui_config.gauges` | `CombatCard` | **branché** |
| `combat.damageTypes` | `DamageCalculator` | **branché** |
| `tactical.ranges` | `DiceBoard`, `useTacticalOrchestrator` | **branché**, sauf un appelant (§ 2.4) |
| `lootTables` | `LootGeneratorPanel`, `LootRollPanel` | **branché** |
| `encounterTemplates` | `EncounterRollPanel` | **branché** |

Et `SanteDuCombattant` — la brique qui répond « comment va ce combattant » **sans supposer de points
de vie** — est adoptée par sept modules : `CombatCard`, `DamageCalculator`, `CombatRules`,
`MapTokenNode`, `combatActions` (tablette), `ModuleSnapshots`, `GridEngine`.

*Le socle est là. Ce qui suit sont des endroits où on ne l'a pas appelé.*

---

## 1 bis. CE DOCUMENT EST CLOS — les cinq manques sont traités (2026-08-15)

Le § 2 ci-dessous décrit l'**état d'avant**. Il est conservé parce qu'il dit
*comment chaque défaut se présentait*, ce qu'un correctif ne raconte plus.

| Manque | Traité par | Ce qui a changé |
|---|---|---|
| 2.1 — l'IA recevait `HP undefined/undefined` | `9366a4e` | `decrireLaSante` rejoint `SanteDuCombattant` : elle sait dire points, horloge, cases, blessure nommée, et **rend `null` quand il n'y a rien à dire** |
| 2.2 — dix points de vie en dur | `0f23291` | `combat.santeDeDepart`, une formule lue sur la fiche — `force` chez Alien, `(force + agilite) / 2 + 1` chez YZE |
| 2.3 — l'initiative par cartes inatteignable | `9366a4e` | une seule variable pour la condition du jet et celle du bouton |
| 2.4 — les portées décrites à l'aveugle | `9366a4e` | `TacticalNarrativeService` reçoit `tactical` du pilote |
| 2.5 — la tablette | *inchangé* | frontière assumée, pas un défaut |

**Trois leçons de méthode, et la première est la plus embarrassante.**

**Cette cartographie était incomplète.** Elle a raté `TacticalNarrativeService`,
qui annonçait des points de vie à deux endroits, puis le **rapport de combat
archivé dans la timeline** et le **calculateur de dégâts**. Trois écrits sur
sept manquaient. La raison est simple : chercher par motif ne trouve que ce qui
ressemble au motif qu'on a en tête. La passe finale a donc balayé `hp`, `hpMax`
et `maxHp` dans tout `src/`, sans échantillon.

**Le piège des portées explique qu'on ne les ait jamais vues.** Les valeurs par
défaut de `GridEngine` sont `contact −3, courte 0, moyenne −1, longue −2,
extreme −3` — **exactement celles d'Alien**. Le manque était rigoureusement
invisible sur le seul jeu où on le cherchait ; il ne se serait montré que sur
Dune, dont les portées montent de 0 à 4.

**Un défaut voisin, réparé au passage, durait depuis les quatre murs.**
`addCombatant` complétait `healthSystem` depuis `sheetData`, mais
`CharacterGrid` n'envoie que `sourcePlayerId` : la tâche de défaite de Dune, qui
lit son seuil **sur la fiche**, n'avait rien à lire pour un personnage joueur.
La fiche est désormais retrouvée à cet endroit unique.

---

## 2. Ce qui ignorait le pilote — état au 2026-08-14

Classé par ce que ça coûte en séance, du plus visible au plus discret.

### 2.1 — Le contexte envoyé à l'IA parle D&D, toujours

**Trois fichiers écrivent des points de vie dans l'invite, sans jamais consulter le modèle de
santé du pilote.**

- `src/modules/ai/hooks/useOracleContext.ts:26` — `- ${c.name} (${c.classRace}): HP ${c.hp}/${c.maxHp}`
- `src/modules/ai/hooks/useOracleContext.ts:37` — `- ${c.name}: HP ${c.hp}/${c.hpMax}, Initiatives: ${c.init}`
- `src/modules/ai/AIService.ts:1173` — la même ligne, dans l'autre chemin de contexte

**Sur Alien, l'Oracle reçoit littéralement `HP undefined/undefined` pour chaque personnage**, et
une initiative chiffrée pour un jeu qui tire des cartes. Le Sage — dont la persona du corpus dit
qu'il est « l'assistant technique froid et précis de Maman » — raisonne sur des points de vie qui
n'existent pas. Il ne peut que les ignorer ou les inventer.

C'est le manque le plus coûteux du lot, parce qu'il touche **toutes les réponses de l'IA**, et
parce que la brique existe déjà : `fractionDeVie`, `estHorsDeCombat` et `aUneJaugeDeVie` répondent
exactement à cette question, et **l'absence y est `null`, jamais `0`**.

**Le journal de séance a le même défaut** : `src/modules/journal/useJournalStore.ts:112` et `:123`
écrivent `${pc.hp}/${pc.maxHp} HP`, et `src/modules/journal/types.ts:57` et `:59` l'imposent
jusque dans le type. Un compte rendu de partie d'Alien annonce donc des PV pour des personnages
qui n'en ont pas.

### 2.2 — La santé de départ est câblée à dix, à sept endroits

`src/modules/combat/components/CombatControls.tsx:63` :

```ts
const modeleDeSante = activeDriver?.combat?.defaultHealthType || 'hp';
const pointsDeVie = modeleDeSante === 'hp' ? { hp: 10, hpMax: 10 } : {};
```

Le modèle vient bien du pilote — c'est la moitié du chemin, faite. **La valeur, non.** Chez Alien,
la Santé de départ **vaut la Force du personnage**, de deux à cinq (huit pour un androïde) : tous
les combattants entrent avec dix.

C'est **mot pour mot le défaut que `65bbd84` a corrigé pour les horloges** — `createDefault('clocks')`
donnait six segments à tout le monde, « un duelliste médiocre et un maître tombaient au même
rythme ». La règle posée alors vaut ici : *une valeur qui dépend du personnage ne peut pas vivre
dans le pilote*, elle se lit sur la fiche.

Le même dix figure à six autres endroits, dont l'importance varie :

| Fichier | Ligne |
|---|---|
| `session/components/AddCharacterForm.tsx` | 16 — `useState(10)` |
| `npc/components/NPCCard.tsx` | 78, 218 |
| `forge/components/ChronicleForge.tsx` | 314-316 (`hp`, `maxHp`, **`ac`**) |
| `favorite/components/FavoriteDetailPanel.tsx` | 499-500 |
| `favorite/components/FavoriteFullDossier.tsx` | 169-170 |

*`ac` — la classe d'armure — est une notion de D&D qu'aucun champ du pilote ne déclare. À traiter
séparément : ce n'est pas une valeur mal choisie, c'est un concept étranger.*

### 2.3 — L'initiative par cartes ne peut pas se déclencher

`src/modules/combat/components/CombatControls.tsx:89` :

```ts
if (activeDriver?.combat.initiativeFormula) {
    rollAutoInitiative({ formula: …, sortOrder: …, cards: activeDriver.combat.initiativeCards, … });
}
```

**Le tirage de cartes est passé en paramètre, mais la porte est gardée par la formule.** Un jeu qui
tire des cartes n'a pas de formule — Alien a `initiativeFormula: ''` — donc la branche entière est
sautée, et `initiativeCards` n'est jamais lu.

Le champ existe, le moteur sait s'en servir, l'écran le passe. Seule la condition d'entrée le rend
inatteignable. *Un champ qu'aucun chemin ne peut atteindre est un champ mort qui a l'air vivant.*

### 2.4 — Un appelant sur trois décrit les portées à l'aveugle

`GridEngine.getRangeInfo(distanceUnits, config?)` accepte les portées du pilote et retombe sur des
valeurs par défaut sans lui. Trois appelants, deux comportements :

| Appelant | Passe le pilote ? |
|---|---|
| `dice/DiceBoard.tsx:609` | **oui** — `activeDriver?.tactical` |
| `tactical-ai/hooks/useTacticalOrchestrator.ts:245` | **oui** — `driver?.tactical` |
| `tactical-ai/logic/TacticalNarrativeService.ts:74` | **non** — appel sans config |

Le troisième est celui qui **décrit la situation tactique à l'IA**. Il classe donc les distances
avec des bandes génériques pendant que le pilote en déclare d'autres.

Piège de lecture à signaler : les défauts en dur de `GridEngine` sont `contact −3, courte 0,
moyenne −1, longue −2, extreme −3` — **exactement les valeurs d'Alien**. Sur Alien, ce manque est
donc parfaitement invisible. Il ne se verra que sur Dune, dont les portées montent de 0 à 4.

### 2.5 — La tablette ne reçoit ni les réserves de table ni l'ordre d'action

Vérifié : `src/modules/remote/` ne mentionne `ressourcesDeTable` nulle part, et ne lit du pilote
que `dice` (`diceActions.ts:47-59`). Le `partialize` de `useCombatStore` diffuse quatre champs —
`combatants`, `round`, `currentTurnIdx`, `isCombatProjected` — et rien d'autre.

C'est **un choix assumé et écrit** : les deux vivent dans leur propre store pour ne pas rompre
l'égalité entre ce que `useCombatStore` persiste et ce qu'il diffuse. Les brancher est un chantier
à part — un nouveau flux dans `windowTransport`, la liste du relais, les types distants.

*Ce n'est donc pas un défaut, c'est une frontière. Elle est notée ici pour qu'on cesse de la
redécouvrir.*

---

## 3. Le cinquième mur, éprouvé sur le pilote d'Alien

`DescripteurDeJet` **compose un seuil** depuis des champs de la fiche ; Alien **compose une
réserve** — attribut plus compétence — et compte les six. Ce n'est pas la même mécanique.

Ce que le pilote d'Alien porte réellement : `jet: { reserve: { base: 1, max: 10, faces: 6 }, sens:
'superieur-ou-egal' }`, sans `seuil`.

**Ce qui marche déjà, vérifié dans le code** : `PanneauDeJet` s'affiche (il ne demande que
`piloteDeLaFiche?.jet`), et le jet part bien en `rollYZE` — `rollFromConfig` teste
`config.engine === 'yze'` **avant** de regarder le seuil, donc les six sont comptés correctement.

**Ce qui manque** : `preparerLeJet` boucle sur `descripteur.seuil`, qui est vide. Le nombre de dés
vaut donc `reserve.base` — **un** — plus ce que le joueur ajoute à la main. *La taille de la
réserve devrait venir de la fiche : Force + Combat rapproché, et non d'un curseur.*

**Le seuil calculé vaut 0**, et `PanneauDeJet` le passe en `successThreshold`. Sans conséquence
aujourd'hui, puisque le moteur `yze` l'ignore — mais c'est une valeur fausse qui circule, et le
jour où un autre moteur la lira, elle rendra tous les dés gagnants.

**Décision de conception, non engagée.** Elle demande de dire dans le descripteur *ce qui compose
la réserve* et non seulement *ce qui compose le seuil* — les deux formes existant côte à côte,
puisque Dune a besoin de la première.

---

## 4. Ce qui restait à trancher — tranché le 2026-08-15

- **Un champ pour la santé de départ ?** Oui, et **une formule** plutôt qu'un
  champ unique : un seul champ suffisait à Alien mais pas à sa famille, le SRD
  composant deux attributs. Même forme que `initiativeFormula`, mêmes contrôles.
- **`ac` n'est pas un concept du pilote.** Toujours vrai, toujours à trancher —
  il traîne dans `ChronicleForge` et les fiches de favoris.
- **Le type du journal imposait `hp`/`maxHp`.** Rendus facultatifs plutôt que
  remplacés : les séances déjà archivées restent lisibles telles quelles.
- **Comment décrire la santé à l'IA ?** En toutes lettres, et **en se taisant
  quand on ne sait pas** : `decrireLaSante` rend `null`, et l'appelant n'écrit
  rien. *Une valeur fausse dans une invite est une affirmation, pas un silence.*

## 4 bis. Ce qui reste ouvert au 2026-08-15

- **`ac` — la classe d'armure — n'est un champ d'aucun pilote.** Elle traîne à dix dans
  `ChronicleForge` et les fiches de favoris. Ce n'est pas une valeur mal choisie, c'est un
  **concept étranger** : à supprimer ou à déclarer, pas à corriger.
- **Le cinquième mur** (§ 3) : la taille de la réserve d'Alien devrait venir de la fiche —
  Force + Combat rapproché — et non d'un curseur à un dé.
- **La tablette** ne reçoit ni les réserves de table ni l'ordre d'action. Frontière assumée.
- **Le socle commun ne comble rien sur Alien**, dont le corpus est complet : il servira au
  prochain jeu, quand trois fiches sur quatorze existeront et qu'on voudra déjà un pilote.

---

## 5. Les règles à ne pas défaire

Rappelées ici parce que chaque point ci-dessus les met en jeu.

- **L'absence n'est pas un zéro.** Sans jauge, la réponse est `null` — jamais `0` —, et un
  combattant sans système *ni* jauge n'est pas déclaré mort.
- **L'outil suit l'état, il n'arbitre pas.** Le 2026-08-13, un contrôle a accusé les portées
  d'Alien d'un décalage qu'elles n'avaient pas : `−3, 0, −1, −2, −3` est la règle du livre. Un
  contrôle qui crie à tort ne coûte pas que sa crédibilité — celui-là *dictait* une erreur.
- **Vérifier sur la charge réelle, jamais sur un exemple qu'on a écrit soi-même.**
- **Ne rien refuser sans motif écrit.**
