# Corpus de règles — socles génériques et systèmes dérivés

**Date :** 2026-08-08
**Branche :** `feature/tablet-hub-pwa`
**Statut :** conception — aucun code écrit · gabarits validés sur deux systèmes · test de socle clos
**Documents jumeaux :** `2026-08-07-acceleration-ia.md` (intégrations IA) ·
`2026-08-07-fiabilite-cortex-combat.md` (fiabilité du Cortex) ·
`2026-08-08-trame-narrative-cycle-seance.md` (trame narrative)

**Origine.** Constat de David, formulé d'abord comme un ressenti d'usage : *« Je ne suis pas satisfait
de comment les règles sont implémentées et/ou utilisées dans l'application. De même je n'ai pas toujours
l'impression d'avoir la main sur celles-ci. »* Précisé ensuite par deux exemples — les jeux utilisent
différents systèmes de santé (points de vie, états de santé…) et cela n'est pas bien représenté ; et il
manque des jets de dés automatisés (perception, santé mentale).

L'examen du code confirme le ressenti et en trouve la racine, qui est plus profonde que les deux
exemples : **rien ne tient le cadre des règles et le moteur d'exécution d'accord.** Le pilote de système
déclare des choses que le code n'implémente pas, et le code implémente des choses que le pilote ne peut
pas déclarer.

---

## 1. Le diagnostic

### 1.1 Cinq moteurs de santé existent, trois seulement sont déclarables

`HealthInterpreter` (`src/modules/session/logic/HealthInterpreter.ts`) implémente **cinq** systèmes de
santé complets avec leur logique de transition : `hp`, `clocks`, `anatomy`, `wounds` (échelle d'états)
et `boxes` (cases de stress). Les cinq ont leur rendu dans
`src/modules/session/components/health/` — `HealthBarDriver`, `ClockDriver`, `AnatomicalSilhouette`,
`WoundLevelsDriver`, `HarmBoxesDriver`.

Mais `GameDriver.combat.defaultHealthType` (`src/types/drivers.ts:90`) ne vaut que
`'hp' | 'clocks' | 'anatomy'`. **Les états de santé et les cases de stress ne sont atteignables par
aucun système de jeu.** La liste déroulante de `RuleEngineEditor.tsx:237` n'a que trois entrées.

Le seul chemin restant est un engrenage à `opacity-30` (`HealthManager.tsx:121`) qui fait défiler les
cinq moteurs **personnage par personnage**, et **réinitialise la santé à chaque changement**
(`HealthManager.tsx:102` appelle `createDefault`). C'est la définition littérale de « ne pas avoir la
main » : la seule commande existante est cachée, individuelle, destructive, et sans rapport avec le
système de jeu.

Trois conséquences :

- **Les échelles sont codées en dur.** `['Sonne', 'Blesse', 'Grave', 'Critique']`, les cases
  `Léger/Léger/Grave/Grave/Critique`, les six membres de l'anatomie. Rien ne vient du pilote. Rêves de
  Dragons ne peut pas déclarer sa propre échelle, alors que ses fiches existantes parlent déjà de
  `degres-malus.md` et `jet-endurance-sonne.md`.
- **Changer le système ne rattrape pas l'existant.** `defaultHealthType` ne sert qu'à *créer* un défaut ;
  un personnage qui possède déjà un `healthSystem` garde le sien indéfiniment
  (`HealthManager.tsx:55-65`).
- **La tablette porte un modèle divergent et incompatible.** `remote.types.ts:6-10` attend `clock` au
  singulier là où le MJ envoie `clocks`, et un `wounds` fait de
  `{ currentLevel: 'SAIN'|'BLESSÉ'|'MORTEL'|'FATAL' }` là où le MJ envoie `{ levels, currentIndex }`.
  Or `useNexusSynchronizer.ts:221` transmet la forme du MJ telle quelle. **Sur la tablette, les horloges
  n'affichent rien et les états de santé affichent une case vide** — cela n'a jamais pu fonctionner.
  Il n'existe par ailleurs aucune branche `hp`.

### 1.2 Le même défaut dans l'autre sens : `2d20` déclarable, non implémenté

`DiceConfig.engine` (`src/types/drivers.ts:27`) énumère douze moteurs, dont `'yze'` et `'2d20'`.
`DiceBoard.tsx` en traite dix. **`'2d20'` n'a aucun cas** et tombe dans le `default`, c'est-à-dire un
jet standard sommé. Dune est donc déclaré en 2d20 et roulé comme un d20 ordinaire, silencieusement.

### 1.3 Il n'existe aucun système de base

`DEFAULT_GAME_DRIVERS` (`src/data/defaultGameDrivers.ts:4`) est un **tableau vide**. Tous les systèmes
sont des pilotes « custom ». Quand un système n'a pas de pilote, `forgeSlice.ts:130` en fabrique un par
défaut : `1d20`, logique `sum`, santé `hp`.

**Alien, Dune et Rêves de Dragons démarrent donc tous leur vie en D&D**, et c'est ensuite à la Forge —
donc à un LLM — de tout re-déduire. Deux fois pour le Year Zero Engine, puisque Alien et Blade Runner
ne se connaissent pas.

### 1.4 Les états de combat sont une constante codée en dur

`COMBAT_AUTO_STATUS_RULES` (`src/modules/combat/logic/CombatRules.ts:30`) applique automatiquement
« En feu », « Gelé », « Corrodé », « Choqué », « Empoisonné », « Confus » avec des durées fixes. Un
bestiaire d'états très D&D, imposé à Rêves de Dragons comme à Blade Runner. **Les états relèvent du
corpus, pas du code.**

### 1.5 Les monnaies de table n'existent pas

Aucune trace de Momentum, Menace, Stress collectif ou Bennies dans les types.
`CombatStatMapping.isResource` existe mais désigne une ressource **par personnage** (points de magie,
santé mentale), pas une réserve partagée à la table.

C'est la mécanique signature des trois socles cités par David : Momentum/Menace en 2d20, dés de Stress
en YZE, Bennies en Savage Worlds. **Sans monnaie de table, ces trois socles perdent chacun ce qui les
définit.** Et le besoin est déjà là : les fiches NOC portent `jauge-fiel-menace.md`,
`diminution-fiel-menace.md` et `provoquer-le-destin.md` — une monnaie de table décrite en texte, que
l'application ne sait pas tenir.

### 1.6 Aucun jet automatisé

Aucun mécanisme de demande de jet dans le dépôt : ni MJ→joueur, ni jet nommé, ni jet secret. Tous les
jets partent d'un geste humain, sur `DiceBoard.tsx` (MJ) ou via `diceActions.ts` (tablette).

Ce qui existe est pourtant solide : `DiceEngine` couvre onze modes et
`rollFromConfig(activeDriver.dice, …)` honore la configuration du système. Il existe même un précédent
de jet automatique — l'initiative, roulée seule par `CombatRules.ts:145` à partir de
`initiativeFormula`.

Ce qui manque est précis : pas de **jets nommés** attachés au système (« Perception », « Santé
mentale »), pas de lien entre un champ de fiche et un jet — `SheetFieldType`
(`src/data/defaultSheetTemplates.ts:4`) n'a aucun type « caractéristique jetable » — et pas de jet
déclenché par le MJ sur un personnage donné.

> **Arbitrage en attente.** « Jet automatisé » recouvre trois choses de coûts très différents : le MJ
> demande un jet qui part chez chaque joueur sur sa tablette ; le MJ roule en secret sans que la table
> le voie ; le joueur clique « Perception » sur sa fiche sans recomposer sa formule. Le jet secret est
> de loin le moins cher. **Non tranché.**

### 1.7 Les personas par système sont écrites, affichées — et jamais lues

**Signalé par David le 2026-08-08 comme un usage IA oublié des trois plans : la génération des personas
par système.** L'examen montre que le manque est plus grave qu'un simple usage absent — **la chaîne qui
appliquerait ces personas est morte sur deux de ses quatre étages.**

`AIService.prepareSystemPrompt` (`src/modules/ai/AIService.ts:739-755`) résout la persona en quatre
temps, chacun écrasant le précédent :

1. `gem.systemOverrides[systemId]`, sinon `gem.baseInstructions` (des clés i18n) ;
2. écrasé par `docs/systems/<id>/gems.json`, lu par `readDoc` ;
3. écrasé par `sheetTemplate.aiPersonas[gemId]`, le gabarit étant cherché par `t.id === systemId`.

**Et c'est tout.** `driver.aiPersonas` et `driver.aiInstructions` **ne sont lus nulle part** — vérifié
par recherche exhaustive dans `AIService.ts`, qui ne mentionne que `sheetTemplate.aiPersonas`.

Or les deux champs sont bel et bien :

- **écrits par la Forge** — `ForgeService.ts:161` demande explicitement au modèle de *« rédiger des
  aiInstructions courtes mais précises pour qu'un autre assistant puisse simuler ce MJ »* ;
- **éditables** dans `RuleEngineEditor.tsx:412` et `:457`, et dans `SheetTemplateEditor.tsx:412` ;
- **affichés** dans `RulebookViewer.tsx:310` et `:315`, et dans `TemplateDashboard.tsx:389` ;
- **signalés** par `OraclePanel.tsx:242`, qui affiche un indicateur `hasDriverOverride` quand le pilote
  porte une persona.

**C'est l'instance la plus pure du « je n'ai pas la main » trouvée jusqu'ici.** David écrit des
directives destinées à l'IA, dans l'éditeur de règles ; l'interface confirme leur existence et va
jusqu'à afficher un badge indiquant que le pilote surcharge la persona ; et l'IA ne les voit jamais.
La Forge les produit, ce qui leur donne une apparence d'autorité supplémentaire.

**En pratique, aucune persona par système n'est active.** Aucun `gems.json` n'existe sur disque
(recherche dans tout `docs/`) ; un seul gabarit de fiche est intégré (`generic`) et la recherche se fait
par `t.id === systemId`, donc elle échoue sauf gabarit personnalisé nommé exactement comme le système ;
et seuls les `systemOverrides` de `dnd-5e` sont fournis par défaut. **Alien, Blade Runner, Dune, NOC et
Rêves de Dragons partagent donc tous la même persona générique**, quel que soit le ton déclaré.

> **Corollaire pour le corpus.** Le sujet 13 — *ton, registre et ambiance* — est exactement la matière
> première d'une persona. La fiche Blade Runner décrit son registre néo-noir, celle d'Alien le sien. La
> génération de personas est donc un **consommateur naturel du corpus**, à condition de réparer d'abord
> la chaîne d'application : générer des personas dans un champ que personne ne lit ne ferait
> qu'ajouter de la décoration.

---

## 2. Le modèle retenu : corpus copiés à la forge

**Proposition de David.** Définir des corpus de règles généraux portant des caractéristiques — comment
on gère la santé, comment on fait les jets, comment on gère les distances… À la forge d'un système, on
le **lie par défaut** à l'un de ces corpus, **les règles se recopient** dans le nouveau système, ce qui
permet des ajustements à la marge selon l'univers.

### 2.1 Copie, et non héritage vivant — validé

Une première proposition d'héritage vivant (socle consulté à la lecture) a été **écartée**. Elle
obligeait à arbitrer la précédence entre socle et jeu à chaque lecture, y compris côté Oracle, qui
verrait deux fiches contradictoires sans savoir laquelle l'emporte.

**La copie dissout ce problème** : après la forge, il n'existe qu'un seul jeu de règles, celui du jeu,
entièrement éditable. Le point de départ étant *« je n'ai pas la main »*, la copie est exactement la
réponse — elle maximise la prise et supprime toute action à distance.

Elle rend aussi caduque l'exigence de **révocation** formulée pendant la discussion : on ne révoque pas
ce qu'on possède, on l'édite.

### 2.2 Ce que la copie coûte, et la parade

**Aucune propagation.** Une erreur corrigée dans le socle YZE ne rejoindra jamais les jeux déjà forgés.

Parade bon marché : **inscrire la provenance dans le pilote** — `socle: 'yze'`, `socleVersion: '1.2'`.
Cela permet plus tard de *proposer* un rapprochement, et surtout de distinguer un écart voulu d'un
oubli. Sans cette trace, au bout d'un an la question n'a plus de réponse.

### 2.3 Dépendance structurelle : la copie rend l'axe B obligatoire

Copier le texte, c'est écrire le Year Zero intégralement dans `docs/systems/alien/rules/` **et** dans
`docs/systems/blade-runner/rules/`. Sur disque, sans importance. En lecture, sans coût **à condition que
la récupération soit cloisonnée par système** — une question sur Alien ne doit lire que le dossier
d'Alien.

Or c'est précisément ce qui est cassé : le filtre de `RAGEngine.getRelevantContext` laisse passer 48
fichiers sur 49 (§ 3.1 du plan IA). **En l'état, cinq jeux YZE mettraient cinq copies du même texte dans
le contexte de chaque question**, et la troncature à 16 384 tokens en jetterait l'essentiel en silence.

**L'axe B cesse d'être rentable pour devenir obligatoire.** Ce n'est pas un préalable de confort, c'est
une dépendance du modèle lui-même.

### 2.4 Un sujet a deux faces, et il faut les tenir ensemble

Remarque de David : le corpus peut aussi être du texte par sujet — *« la Santé : se gère via des niveaux
de santé qui sont en bonne santé, blessé, gravement blessé, etc. »* Elle est juste, et se pousse plus
loin. Chaque sujet porte :

- une face **structurée**, que l'application exécute :
  `{ type: 'wounds', niveaux: ['Sain', 'Blessé', 'Gravement blessé', 'Mourant'] }` ;
- une face **textuelle**, que le MJ lit et que l'Oracle cite.

Si les deux vivent séparément, elles divergent — et une divergence entre le texte et la structure, c'est
l'Oracle qui contredit le module de combat sur la même règle. **La face texte doit être écrite en regard
de la structure**, idéalement engendrée en partie à partir d'elle.

> **Arbitrage retenu — un sujet peut être purement textuel, mais marqué.** L'autoriser rend le corpus
> expressif immédiatement et évite de bloquer sur les monnaies de table. Mais un sujet sans structure
> est invisible à l'application : jamais appliqué, seulement cité — ce qui recrée l'écart que la refonte
> veut supprimer. Il doit donc être **explicitement marqué « non appliqué »** et visible comme tel dans
> l'éditeur, pour qu'on voie d'un coup d'œil ce que GM-OS fait respecter et ce qu'il se contente de
> réciter.

### 2.4 bis Arbitrage du 2026-08-08 : génération système par système, pas de copie automatique

**Décision de David, après l'essai croisé Alien / Blade Runner :** *« je pense que je vais générer
système par système même s'il y a des similitudes. L'idée n'est pas de ne plus rien faire et de tout
automatiser, si on fait cela on va perdre la granularité. »*

**Le test lui donne raison, et c'est ce qui a changé l'arbitrage.** Copier un socle YZE dans Blade
Runner y aurait importé les modificateurs numériques de portée d'Alien (Blade Runner joue en
avantage/désavantage), sa réserve de d6 (Blade Runner lance deux dés gradués), et sa formule de Santé
(Blade Runner en a une autre). Trois erreurs sur les trois sujets les plus structurants. **La
granularité perdue par la copie coûte plus cher que le temps qu'elle fait gagner.**

Conséquence sur le modèle du § 2 : **le rôle du socle rétrécit, et ce n'est pas un échec du dispositif
mais son résultat.** Ce qui subsiste :

- **Le socle reste utile comme amorce** pour un système sans carnet ni livre exploitable — c'est la
  réponse au `DEFAULT_GAME_DRIVERS` vide (§ 1.3), qui fait aujourd'hui démarrer tout jeu en D&D.
- **Le socle reste utile comme constat**, sujet par sujet : savoir que les portées d'Alien et de Blade
  Runner sont identiques au mètre près est une information de conception, pas un mécanisme.
- **Mais l'harmonisation réelle vient du canevas, pas du socle.** C'est la liste des treize sujets qui
  rend les systèmes comparables et qui dit à GM-OS où regarder. Elle donne la comparabilité **sans
  imposer le contenu** — exactement ce que David veut préserver.

**Le canevas est donc la pièce partagée du dispositif ; le corpus reste propre à chaque jeu.**

### 2.5 Convergence : le canevas de l'axe H est le schéma du corpus

La liste des sujets d'un corpus **est** le canevas de l'axe H du plan IA. David l'a re-dérivée
indépendamment, ce qui est un bon signe de justesse.

Le canevas cesse d'être un simple générateur de requêtes NotebookLM pour devenir le **schéma du
corpus** : la liste fait autorité, la couverture devient mesurable, et le journal des lacunes s'y adosse.

Ses exclusions restent valables et s'appliquent ici : **création de personnage, progression, équipement,
historique** — les chapitres les plus volumineux des livres, que GM-OS n'exploite pas.

---

## 3. Ce qu'un corpus définit

Sujets dérivés de ce que GM-OS exploite réellement. Deux d'entre eux — poursuite et environnement — ont
été trouvés par David et manquaient au canevas initial.

| Sujet | Face structurée | État |
|---|---|---|
| Résolution / jets | `dice.engine`, `logic`, `successThreshold`, `critRange` | 11 moteurs, **`2d20` non implémenté** |
| Degrés de réussite et critiques | `critRange` | partiel |
| Oppositions, aide, coopération | — | ❌ **inexistant** |
| Initiative et tour | `initiativeFormula`, `initiativeSort`, `initiativeCards` | ✓ |
| Santé et blessures | `defaultHealthType` + échelle | 5 moteurs réels, **3 déclarables**, échelles en dur |
| Dégâts et types | `damageTypes`, tags `res_`/`vul_`/`imm_` | ✓ |
| États et conditions | — | ❌ **codés en dur** (`CombatRules.ts:30`) |
| Monnaie de table (partagée) | — | ❌ **inexistant** |
| Jauges et ressources individuelles | `statsToTrack.isResource`, `ui_config.gauges` | ⚠️ **décoratives** : ni bornes, ni seuils, ni effets |
| Distances et portées | `tactical.ranges` (5 seuils + modificateurs) | ✓ mais **non transmis au Cortex** |
| Poursuites | — | ❌ inexistant |
| Environnement et dangers | — | ❌ inexistant |
| Stats suivies | `statsToTrack` | ✓ |
| Ton et registre | `aiInstructions` (texte libre) | ✓ |

**Cinq cases vides, un moteur déclaré mais mort, un moteur non transmis.** C'est l'écart chiffré entre
le cadre des règles et ce que les jeux de David demandent.

---

## 4. Constitution du corpus par NotebookLM

**C'est l'axe I appliqué** — laisser NotebookLM distiller au lieu de rapatrier du texte brut pour le
faire mâcher par Ollama. Bénéfice immédiat : **le corpus se constitue à la main dès maintenant**, sans
une ligne de code ; l'application rattrapera ensuite.

### 4.1 Quatre corrections apportées à la proposition initiale

La proposition de David était : un prompt d'inventaire (« liste-moi les mécaniques : combat, santé,
poursuite, environnement et autres »), puis un prompt de génération (« donne-moi une série de fiches
détaillées sur chacun des sujets »).

1. **« et autres » fait dériver la liste.** Si chaque carnet invente sa taxonomie, on obtient neuf
   nomenclatures incompatibles et la comparaison entre jeux d'un même socle devient impossible. La liste
   doit être **fournie**. Mais une soupape reste nécessaire — une section « hors catégories » réservée
   aux mécaniques *centrales* — car c'est elle qui fera évoluer le canevas de façon contrôlée.
2. **Une seule requête pour toutes les fiches donne des paragraphes, pas des fiches.** Il faut une
   requête **par sujet**, donc deux *gabarits* et non deux requêtes.
3. **Rien n'interdit d'inventer.** Sans consigne, un sujet non couvert produira du générique plausible.
   C'est le défaut de l'axe O : *le journal des lacunes attrape ce qui manque, rien n'attrape ce qui est
   faux*. La consigne de non-couverture est la ligne la plus rentable des deux prompts.
4. **Séparer socle et univers dès la génération.** Sur le carnet d'Alien, YZE et Alien arrivent
   mélangés. Faire étiqueter à la source coûte zéro et livre le corpus générique gratuitement.

S'ajoutent les exclusions du § 2.5 et l'exigence de **valeurs chiffrées en clair**, pour que la face
structurée se remplisse sans retranscription — c'est là que la dérive texte/structure commence.

### 4.2 Gabarit 1 — inventaire (une fois par système)

*Version 2, corrigée après l'essai Blade Runner (§ 4.6).*

```
Tu analyses UNIQUEMENT les sources de ce carnet. Ne complète jamais avec des
connaissances extérieures.

Pour chacun des sujets ci-dessous, indique si ce jeu le traite, et résume sa
mécanique en une à deux phrases maximum :

1. Résolution des jets (dés utilisés, lecture du résultat, réussite/échec)
2. Degrés de réussite et critiques
3. Jets opposés, aide et coopération
4. Initiative et déroulement du tour
5. Santé et blessures (échelle utilisée, incapacité, mort)
6. Dégâts et types de dégâts
7. États et conditions (comment on les subit, comment on en sort)
8. Monnaie de table ou ressource PARTAGÉE par toute la table (élan, menace, jetons…)
9. Jauges et ressources INDIVIDUELLES, tenues sur la fiche d'un personnage
   (stress, santé mentale, points de magie, fatigue, monnaie, réputation…)
10. Distances et portées en combat
11. Poursuites
12. Environnement et dangers (froid, vide, chute, feu, privation…)
13. Ton, registre et ambiance recherchés

Réponds par un TABLEAU MARKDOWN (avec des barres verticales), colonnes :
Sujet | Traité (oui/partiellement/non) | Mécanique | Pages.

La colonne « Mécanique » doit contenir les éléments CONCRETS : dés employés et
leur taille, seuils chiffrés, nombre de niveaux d'une échelle. « On lance des
dés et on compare à un seuil » est une réponse inutile.

La colonne « Pages » donne les numéros de page du livre. N'utilise jamais les
numéros de référence internes du carnet : ils ne veulent rien dire hors d'ici.

Si un sujet n'est pas couvert par les sources, écris « non couvert par les
sources » — n'invente rien, ne comble pas par analogie avec d'autres jeux.

Ajoute ensuite une section « Hors catégories » listant les mécaniques CENTRALES
de ce jeu qui n'entrent dans aucun des 13 sujets. Uniquement les mécaniques
centrales.

Écris tous les symboles en toutes lettres. Si le livre utilise une icône (par
exemple pour marquer une réussite), nomme-la au lieu de la reproduire.

N'aborde PAS : création de personnage, progression, équipement et matériel,
historique et background, bestiaire, scénarios inclus.
```

### 4.3 Gabarit 2 — fiche détaillée (à rejouer par sujet)

*Version 2, corrigée après l'essai Blade Runner (§ 4.6).*

```
Tu rédiges une fiche de règle sur le sujet : « {SUJET} ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Format de sortie : Markdown, 3 000 à 5 000 caractères, structuré exactement
selon les six sections ci-dessous. N'emploie aucune ligne de tirets « --- » et
aucun bloc de métadonnées en en-tête : commence directement par la section
« Métadonnées ».

## Métadonnées
- sujet : {SUJET}
- couverture : complète | partielle | absente
- sources : titres exacts des sources utilisées, avec numéros de page

## Règle
L'énoncé de la règle telle que le livre la pose.

## Valeurs
Toutes les valeurs chiffrées en clair, sous forme de liste : seuils, échelles
ordonnées, durées, modificateurs, nombres de dés. Une échelle se donne dans
l'ordre, du meilleur état au pire.

## À la table
Comment cela se joue concrètement, tour par tour si pertinent.

## Cas limites
Ce que le livre précise sur les situations ambiguës.

## Non couvert
Ce que le sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même la fiche
  avec « couverture : absente » et explique en une phrase ce que tu as cherché.
  Ne renvoie jamais une réponse vide.
- Cite tes sources par NUMÉRO DE PAGE dans le corps du texte, par exemple
  « (p. 72) ». N'utilise jamais les numéros de référence internes du carnet.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône
  (par exemple pour marquer une réussite), nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Reste dans ton sujet. Si une règle appartient à un autre sujet de la liste,
  mentionne-la en une phrase et renvoie vers lui au lieu de la détailler.
- Si le sujet porte sur des jauges ou des ressources, traite CHAQUE jauge
  séparément et donne pour chacune : ce qu'elle mesure, sa valeur de départ,
  ses bornes minimale et maximale, si elle monte ou descend quand la situation
  empire, ce qui la fait bouger dans chaque sens, CE QUI SE PRODUIT À CHAQUE
  SEUIL, et si elle se dépense (on la consomme volontairement) ou si elle
  s'accumule (elle subit les événements).
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  exact du jeu.
```

### 4.4 Protocole de validation

**Ne pas industrialiser.** Neuf systèmes × treize sujets font plus de cent requêtes. Valider les gabarits
sur **un seul** système d'abord.

**Protocole exécuté et clos le 2026-08-08.** Blade Runner puis Alien, deux jeux du même moteur, générés
puis comparés sujet par sujet — la comparaison faite par nous, et non demandée au carnet. **Résultat au
§ 4.7.**

Ce qu'il en reste pour les systèmes suivants :

- **La clé de comparaison doit être canonique.** Treize slugs et treize noms de sujets fixés, identiques
  d'un système à l'autre. Le carnet recopie sinon la ligne descriptive du prompt dans le champ `sujet`,
  ce qui casse la seule chose sur laquelle repose la comparaison.
- **Ne pas industrialiser** : treize sujets par système, plus les hors-catégories. Générer un système à
  la fois, et le normaliser avant de passer au suivant.

Destination des fiches : `docs/systems/<id>/rules/<slug>.md`. Rappel : `docs/` est le corpus indexé par
le RAG — **n'y déposer aucune documentation technique.**

### 4.5 Capturer les citations maintenant

Les citations `[1]`, `[2]` des fiches déjà forgées **sont mortes** : `forgeCard` n'a pas conservé la
table de correspondance NotebookLM. Le bloc `sources:` en frontmatter coûte zéro à la génération et
permettra de **vérifier au lieu de croire**. C'est aussi ce qui rendrait l'étage 2 de l'Oracle
bibliothécaire (axe M) quasi gratuit sur les sujets déjà couverts.

---

### 4.6 Retour d'expérience — essai Blade Runner du 2026-08-08

Douze fichiers produits avec les gabarits version 1, dans
`docs/systems/blade-runner/rules/`. **Fond excellent, forme cassée.**

**Ce qui a fonctionné, et qu'il ne faut pas dégrader en corrigeant :**

- **L'interdiction d'inventer a tenu.** C'était le point le plus risqué. « Monnaie de table → non
  couvert par les sources » ; « Environnement → partiellement, le froid, le vide et la privation ne sont
  pas couverts ». Le modèle a refusé de combler.
- **Les sources sont réelles et vérifiables** : `BRN-01_LivreDeRegles.pdf p. 54-57, p. 198, p. 204`, sur
  les onze fiches. L'exigence du § 4.5 est satisfaite d'emblée.
- **La section Valeurs est exploitable** sans retranscription : formule de Santé
  `(dé de Vigueur + dé d'Agilité) / 4` arrondi au supérieur, `+2` pour un Réplicant, seuil Brisé à `0`,
  taux de récupération par Quart, deux tables de critiques à 12 niveaux.
- **La soupape « Hors catégories » a produit le meilleur contenu du lot** — Humains vs Réplicants sur le
  forçage, TRPT, Voight-Kampff, Ancrages narratifs, Quarts et Pauses, double progression
  Promotion/Humanité. Elle a **redécouvert indépendamment les quatre sujets déjà fichés à la main** par
  David en avril. Le canevas ne rate pas ce qu'il juge important.

**Les six défauts corrigés dans la version 2 des gabarits :**

1. **Le frontmatter YAML est détruit sur les onze fiches.** Les `---` ont disparu et les quatre champs
   se sont concaténés en un seul titre de niveau 2 :
   `## sujet: Santé et blessuresorigine: SOCLEcouverture: complètesources: …`. **Illisible par
   machine**, alors que toute l'architecture repose sur `couverture`. Cause : `---` est un séparateur
   horizontal en Markdown, le carnet l'a traité comme tel. **Leçon : le YAML n'est pas demandable à
   NotebookLM.** On demande une section, on fabrique le frontmatter localement.
2. **Le symbole de réussite a été perdu — 49 occurrences sur 9 fichiers**, laissant `réussite ()`. Perte
   silencieuse et systématique. Les symboles doivent être demandés en toutes lettres.
3. **Renvois numériques nus** (`14-17`, `29-31`) pointant les fragments internes du carnet, sans
   signification hors session — alors que les pages étaient disponibles. C'est la citation morte qui
   revient par une autre porte.
4. **Le gabarit 1 a rendu du CSV**, pas un tableau Markdown, et sa colonne Sources ne contient que des
   index.
5. **Redondance interne** : les blessures critiques sont traitées à fond dans trois fiches (santé,
   dégâts, réussites critiques). Une question sur les critiques ramène trois fois la même chose. D'où la
   consigne de renvoyer plutôt que de recopier.
6. **Un sujet non couvert n'a produit aucun fichier.** L'absence n'est donc pas consignée et la
   couverture n'est pas mesurable. D'où la consigne de produire la fiche même vide.

S'ajoutent les échappements d'export (`1\.`, `\+`, `0\)`) et des noms de fichiers repris des titres
inventés par le carnet, avec espaces, accents et apostrophes.

**Et le vrai résultat du test : l'étiquette SOCLE/UNIVERS ne fonctionne pas, et le gabarit en est
responsable.**

Preuve directe : **« États et conditions » est étiqueté `SOCLE` dans l'inventaire et `UNIVERS` dans sa
propre fiche.** Même sujet, même carnet, deux réponses opposées. L'étiquette n'est pas une donnée, c'est
une opinion reformée à chaque requête.

La raison est structurelle : **le carnet ne contient que Blade Runner.** Lui demander si une mécanique
se retrouverait à l'identique dans un autre jeu du même moteur, c'est lui demander de raisonner sur des
sources qu'il n'a pas. Il a répondu par reconnaissance de marque — le livre dit « Year Zero Engine »,
donc SOCLE — et non par comparaison. Sa propre justification le trahit :
*« SOCLE (Calculs spécifiques mais principes d'incapacité et de critiques génériques) »*.

**Correction : `origine` sort du travail du carnet.** Chaque fiche décrit sa mécanique ; la comparaison
entre systèmes est faite par nous (§ 4.4). L'étiquette prétendait court-circuiter le test et ne faisait
que le masquer. Dans les fiches réparées, la valeur produite est conservée sous
`origine_supposee`, pour mémoire et sans autorité.

**Un treizième sujet manquait au canevas — les jauges individuelles.** Signalé par David en relisant les
fiches, et l'essai Blade Runner en apporte la preuve : **« Stress » apparaît dans 12 des 17 fichiers et
n'a aucune fiche à lui.** C'est pourtant une mécanique centrale du jeu — elle pilote le forçage des
jets, l'état Brisé mental, le TRPT et le coût du Souvenir Clé. Faute de sujet d'accueil, elle s'est
éparpillée en mentions incidentes sans jamais être définie. **Un sujet sans domicile se répand partout :
c'est le défaut de redondance (n° 5) sous une autre forme.**

Le sujet 8 devient donc explicitement *partagée par la table*, et le nouveau sujet 9 recueille les
jauges *individuelles*. Sans cette paire, la bonne réponse du carnet — « toutes les jauges sont
individuelles » — faisait disparaître les quatre jauges au lieu de les orienter.

**Une jauge n'est pas une chose unique**, et le gabarit doit forcer la distinction. Blade Runner en a
quatre, de trois natures différentes : le **Stress** s'accumule sous la pression et déclenche des
effets de seuil ; le **Chinyen** se dépense comme une monnaie ; l'**Humanité** et la **Promotion**
s'acquièrent puis se dépensent, l'une comme expérience, l'autre comme statut. D'où l'exigence ajoutée au
gabarit 2 : bornes, sens, ce qui la fait bouger dans chaque sens, **effets de seuil**, et dépensée
contre accumulée.

Côté code, `GaugeConfig` (`src/types/drivers.ts:49`) ne porte que `fieldId`, `label`, `color` et
`style` : **une jauge y est purement décorative.** `CombatStatMapping.isResource` la marque comme
ressource mais n'en décrit pas le comportement. C'est donc une case du tableau du § 3 à moitié vide, et
non pleine comme je l'avais d'abord classée.

**Acquis de conception au passage.** Sur la monnaie de table, la réponse est un vrai résultat :
*« toutes les jauges — Stress, Promotion, Humanité, Chinyen — sont purement individuelles »*. Blade
Runner n'a donc pas besoin de réserve partagée, seulement de ressources par personnage, ce que
`CombatStatMapping.isResource` sait déjà porter.

**Chiffre à retenir.** Seize fichiers, environ 100 Ko, dans le seul dossier de Blade Runner. Avec le
filtre RAG cassé, tout cela part dans le contexte de **chaque** question, quel que soit le système joué.
La dépendance à l'axe B (§ 2.3) n'est plus une projection : elle est mesurable sur un seul système.

---

### 4.7 Résultat du test de socle — Alien contre Blade Runner, 2026-08-08

Dix-huit fiches Alien produites avec les gabarits version 2. **Le format tient** : métadonnées
survivantes, pages citées en ligne tout au long du texte, symboles nommés en toutes lettres, aucun
échappement. La consigne anti-redondance fonctionne — la section « Non couvert » d'Alien renvoie
explicitement vers les autres sujets au lieu de recopier leur contenu.

**Un défaut nouveau, visant la clé de voûte.** Le carnet a recopié la ligne descriptive du prompt dans
le champ `sujet` : `États et conditions (comment on les subit, comment on en sort)`, `Jauges et
ressources INDIVIDUELLES, tenues sur la fiche d'un personnage`. Les slugs divergeaient aussi entre les
deux systèmes pour un même sujet. Or **la comparaison sujet par sujet est le test lui-même** : sans clé
stable, il n'a pas lieu. Les deux corpus sont désormais normalisés sur treize slugs et treize noms
canoniques, avec un champ `hors_canevas` pour les fiches nées de la soupape.

**Le verdict : « YZE » n'est pas une chose unique, mais le socle existe — sujet par sujet.**

| Sujet | Alien | Blade Runner | Verdict |
|---|---|---|---|
| Distances et portées | Contact / Courte (même zone) / Moyenne (zone adjacente, 25 m) / Longue (4 zones, 100 m) / Extrême (1 km) | Au contact / Courte (même zone) / Moyenne (zone adjacente, 25 m) / Longue (4 zones, 100 m) / Extrême (1 km) | **SOCLE, au mètre près** |
| — leurs modificateurs | −3 / 0 / −1 / −2 / −3 | avantage / désavantage | univers |
| Initiative | 10 cartes 1-10, plus bas d'abord, round 5-10 s | cartes 1-10, plus bas d'abord, round 5-10 s | **SOCLE** |
| — l'économie d'actions | 1 lente + 1 rapide, ou 2 rapides | 1 action + 1 mouvement | univers |
| Santé | à 0 → Brisé ; dégâts ordinaires non létaux ; mort par critique + test de Trépas (Endurance) | à 0 → Brisé ; dégâts ordinaires non létaux ; mort par critique + sauvegarde (Endurance) | **SOCLE (structure)** |
| — les formules | Santé = Force (2-5) ; table D66 de 36 blessures | (dé Vigueur + dé Agilité)/4, +2 Réplicant ; deux tables de 12 | univers |
| Résolution des jets | réserve de **D6** (Attribut + Compétence) + dés de stress ; 6 = réussite, 1 = panique | exactement **2 dés**, tailles **D6 → D12** ; 6 ou plus = réussite | **AUCUN SOCLE** |
| Monnaie de table | aucune | aucune | SOCLE (négatif) |

Sur le sujet le plus central, les deux jeux n'ont en commun que la convention « six est une réussite »
et le motif « forcer le jet ». Une réserve dont le **nombre** de dés varie contre deux dés dont la
**taille** varie : deux moteurs différents sous un même nom commercial. Et pourtant les portées sont
identiques valeur pour valeur, et l'initiative aussi.

**Conséquence architecturale : le socle ne se définit pas par système, mais sujet par sujet — et
parfois champ par champ.** L'exemple est directement exploitable : `TacticalRangeThreshold` porte
`{ label, maxUnits, modifier }` ; les deux premiers champs sont du socle YZE pur, le troisième est de
l'univers.

**Et c'est la copie qui encaisse cela sans effort.** Un héritage vivant aurait exigé des règles de
précédence champ par champ — précisément ce que la copie supprime. Le test ne valide pas seulement
l'idée de socle : il valide le choix de la copie, plus fortement que la discussion ne l'avait fait.
Il conduit aussi à l'arbitrage du § 2.4 bis — génération système par système, sans copie automatique.

**Détail révélateur : le stress d'Alien est *dans* le moteur de dés** (il ajoute des dés à la réserve et
porte le symbole de panique), alors que celui de Blade Runner est une jauge à côté. Même nom, place
structurelle différente — un cas de plus où l'étiquette trompe et où seule la mécanique décide.

**Couverture croisée :** onze sujets sur treize présents des deux côtés. Manquent *poursuites* et
*monnaie de table* côté Alien — la seconde est déjà répondue dans `jauges-individuelles` (« sans
ressource collective partagée »), une fiche courte suffira — et *jauges individuelles* côté Blade
Runner. Alien a par ailleurs produit six fiches hors canevas : stress et panique, mode discret,
physiologie des synthétiques, affrontement des xénomorphes, combat spatial, forcer le test.

### 4.8 Personas : gabarits, essai Alien, et le corpus noyé

**Le seul étage vivant de la chaîne est `docs/systems/<id>/gems.json`** (§ 1.7), lu par `readDoc` et
**non indexé par le RAG**, qui ne prend que `.md`, `.txt` et `.pdf` (`RAGEngine.ts:142`). Il ne demande
**aucune modification de code**. Trois contraintes le façonnent :

- `gems.json` **remplace** l'instruction de base (`personaInstructions = systemGems[gemId]`), sans
  concaténation : chaque persona doit être autosuffisante.
- Le bloc générique — alias, « réponds en français », « cite le document source » — est **déjà ajouté
  après** : le répéter serait du prefill payé à chaque appel.
- La persona est en tête de **chaque** prompt système. Courte et stable, elle se met en cache une fois ;
  longue, elle se paie à chaque question. **Une persona porte une voix, jamais des règles** — le RAG
  fournit déjà les règles, et une persona qui les affirme finira par les contredire.

**Deux gabarits, en deux temps** : une *fiche de voix* (vocabulaire de la table, registre, ce que le jeu
veut faire ressentir, interdits), puis les *huit personas en JSON* enchaînées dans le même fil.

**Essai Alien du 2026-08-08.** Deux versions produites.

- **v1** : bon vocabulaire (Maman, Weyland-Yutani, la Frontière, USCMC, le Voile Extérieur), longueurs
  566-607 caractères — la contrainte a tenu. Mais **deux défauts**. (1) *Une affirmation de règle, et
  fausse* : le Stratège énonçait « la mort est toujours instantanée et inéluctable », que
  `sante-et-blessures.md`, tirée du même livre, contredit — mort instantanée sur 63-66 au D66
  seulement, sinon test de Trépas, et les androïdes ne meurent jamais. **La dérive persona/corpus
  démontrée au premier essai.** (2) *Confusion de destinataire* : les interdits du meneur transplantés
  sur l'assistant, le Scribe se voyant interdire de « planifier la fin d'une séance » alors qu'il résume
  des séances passées.
- **v2**, régénérée après correction du gabarit : interdits recentrés sur le rôle de l'assistant
  (« Interdiction absolue dans ton rôle de Scribe : ne réécris jamais les notes pour embellir… »),
  plus aucune affirmation de règle, et 506-533 caractères. **Les deux défauts sont levés.**

Correctifs intégrés au gabarit : l'interdit porte sur ce que **l'assistant** ne doit pas faire dans son
rôle, transposé et non recopié ; et aucun fait de règle, **même en passant, même sous forme d'ambiance**.

**Piège d'emplacement, rencontré deux fois.** Le fichier avait été rangé dans
`docs/systems/alien/personas/` : `AIService` lit littéralement `systems/<id>/gems.json`, donc il n'était
**jamais lu, sans le moindre message**. Un test verrouille désormais le contrat de bout en bout —
`electron/systemPersonas.test.ts` : résolution de `docsPath`, lisibilité par `readDoc`, validité du
JSON, clés correspondant à des gemmes connues, longueur plafonnée, **et détection d'un fichier de
personas égaré dans un sous-dossier**. Huit tests, verts.

**Volumétrie relevée en chemin, et elle change les priorités.** `docs/` contient **37,8 Mo
indexables**. Le seul dossier d'Alien pèse **5,8 Mo sur 34 fichiers**, dont **le livre quatre fois** —
`_source_extracted.txt` (1,74 Mo), `full_book_by_pdf_page.md` (1,72 Mo), `Alien_le_jeu_de_rôle.txt`
(0,87 Mo), `alien_rag_base_partial.md` (0,31 Mo) — plus des découpages thématiques qui en sont encore
des extraits. Ailleurs, un PDF de campagne de **28,9 Mo** est lui aussi indexé.

**Les dix-huit fiches soignées d'Alien pèsent 0,09 Mo, soit 1,5 % du corpus de leur propre système.**
Elles concourent contre quatre copies brutes du même livre, avec un filtre qui laisse passer 48 fichiers
sur 49 et une troncature à 16 384 tokens qui tranche au hasard.

> **Conséquence sur l'ordre des travaux.** Générer les corpus des sept systèmes restants améliorera la
> qualité de ce qui *pourrait* être cité, mais tant que les décharges brutes restent indexées, l'Oracle
> n'ira pas les chercher. **Le prochain travail utile n'est plus de la génération, c'est le
> cloisonnement et l'exclusion — l'axe B.** L'arbitrage du 2026-08-08 l'avait anticipé (« le mécanisme
> d'exclusion reste nécessaire, pour sortir de l'index les décharges brutes ») ; on a désormais les
> chiffres, et ils sont plus mauvais que prévu.

---

## 5. Articulation avec les plans existants

| Plan | Relation |
|---|---|
| Axe B — réparer le RAG | **Devient obligatoire** (§ 2.3) : sans cloisonnement par système, la copie multiplie le contexte |
| Axe H — les canevas | **Fusionne** : le canevas devient le schéma du corpus (§ 2.5), enrichi de *poursuite* et *environnement* |
| Axe I — inverser NotebookLM | **C'est l'application concrète** : les deux gabarits du § 4 en sont la forme manuelle |
| Axe M — Oracle bibliothécaire | Bénéficie des `sources:` capturées (§ 4.5) |
| Axe O — boucle de revue | S'applique aux fiches produites : relecture à la première utilisation, mention visible tant qu'une fiche n'est pas relue |
| Fiabilité du Cortex | `driver.tactical` non transmis (`TacticalNarrativeService.ts:74`) est un cas de la même maladie : le cadre déclare, le moteur ignore |
| **Personas par système** | **Usage IA absent des trois plans, signalé par David (§ 1.7).** Consommateur naturel du sujet 13 du corpus, mais la chaîne d'application est morte : `driver.aiPersonas` et `driver.aiInstructions` ne sont lus nulle part |

---

## 6. Ce qui reste à trancher

1. **Les trois sens de « jet automatisé »** (§ 1.6) — non tranché.
2. **Où vit un socle.** Livré avec GM-OS comme donnée intégrée non modifiable, ou pilote ordinaire
   marqué « socle » et éditable comme les autres ? Recommandation : **le second**, cohérent avec
   l'objectif de garder la main. La copie à la forge rend l'objection habituelle (un socle modifié se
   répercute) sans objet, puisque rien ne se répercute.
3. **La forme structurée d'une monnaie de table** — ce qu'elle porte au minimum (nom, réserve courante,
   plafond, qui peut la dépenser, ce qu'elle achète).
4. **L'ordre des travaux.** David a explicitement refusé le déblocage incrémental au profit d'une refonte
   de fond : l'ordre reste à établir à partir du schéma du corpus, qui est le premier livrable.

---

## 7. Statut

**Acquis au 2026-08-08 :**

- Gabarits **version 2**, validés sur deux systèmes (§ 4.2, § 4.3).
- Corpus **Blade Runner** (17 fiches) et **Alien** (18 fiches), normalisés sur une clé canonique.
- **Test de socle exécuté et clos** (§ 4.7) : le socle existe sujet par sujet, pas par système.
- **Arbitrage de David** : génération système par système, sans copie automatique (§ 2.4 bis).

**Prochaines étapes, dans l'ordre :**

1. Compléter les deux corpus — *poursuites* et *monnaie de table* côté Alien, *jauges individuelles*
   côté Blade Runner.
2. Poursuivre système par système : Dune (test du 2d20, qui vérifiera si le constat se reproduit sur un
   autre moteur), puis NOC, Rêves de Dragons, CoC7, Cthulhu Hack, Nephilim, D&D 5e.
3. **Écrire le schéma du corpus** — la face structurée de chacun des treize sujets. C'est le premier
   livrable de code, et les corpus générés en sont désormais la matière de référence.

**Ne pas oublier :** la génération de personas par système (§ 1.7) exige de **réparer d'abord la chaîne
d'application**. Générer dans un champ que personne ne lit ne produirait que de la décoration
supplémentaire — soit exactement le défaut que toute cette refonte cherche à supprimer.
