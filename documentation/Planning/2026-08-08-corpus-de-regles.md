# Corpus de règles — socles génériques et systèmes dérivés

**Date :** 2026-08-08
**Branche :** `feature/tablet-hub-pwa`
**Statut :** conception — aucun code écrit · gabarits de prompts en cours de validation
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
| Monnaie de table | — | ❌ **inexistant** |
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
8. Monnaie de table ou ressource partagée (élan, menace, stress, jetons…)
9. Distances et portées en combat
10. Poursuites
11. Environnement et dangers (froid, vide, chute, feu, privation…)
12. Ton, registre et ambiance recherchés

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
de ce jeu qui n'entrent dans aucun des 12 sujets. Uniquement les mécaniques
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
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  exact du jeu.
```

### 4.4 Protocole de validation

**Ne pas industrialiser.** Neuf systèmes × douze sujets font plus de cent requêtes. Valider les gabarits
sur **un seul** système d'abord.

Ordre : **Blade Runner** (fait le 2026-08-08, cf. § 4.6), puis **Alien**. Deux jeux du même moteur.

**Le test de socle ne s'obtient pas en demandant une étiquette au carnet — corrigé au § 4.6.** Il
consiste à générer les deux systèmes, puis à **comparer nous-mêmes les fiches sujet par sujet** :

- Si la mécanique décrite est la même de part et d'autre → le sujet appartient au socle YZE.
- Si elle diffère → elle appartient à l'univers, quoi qu'en dise la marque du livre.

Indice déjà acquis, à confirmer : Blade Runner résout par **un dé d'attribut plus un dé de compétence,
de D6 à D12, réussite à 6 ou plus**. Si Alien revient avec une réserve de d6 et des dés de stress, alors
**« YZE » n'est pas une chose unique** sur le sujet le plus central, ce qui était la réserve formulée
pendant la discussion (de même, le 2d20 de Dune n'est pas celui de Conan).

Destination des fiches : `docs/systems/<id>/rules/<slug>.md`, en cohérence avec l'existant. Rappel :
`docs/` est le corpus indexé par le RAG — **n'y déposer aucune documentation technique.**

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

**Acquis de conception au passage.** Sur la monnaie de table, la réponse est un vrai résultat :
*« toutes les jauges — Stress, Promotion, Humanité, Chinyen — sont purement individuelles »*. Blade
Runner n'a donc pas besoin de réserve partagée, seulement de ressources par personnage, ce que
`CombatStatMapping.isResource` sait déjà porter.

**Chiffre à retenir.** Seize fichiers, environ 100 Ko, dans le seul dossier de Blade Runner. Avec le
filtre RAG cassé, tout cela part dans le contexte de **chaque** question, quel que soit le système joué.
La dépendance à l'axe B (§ 2.3) n'est plus une projection : elle est mesurable sur un seul système.

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

**Prochaine étape en cours :** David génère les fichiers MD via les deux gabarits, puis on les compare
pour juger si les prompts sont assez précis. Les corrections des gabarits reviendront dans ce document.
