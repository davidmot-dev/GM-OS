# Trame narrative et cycle de séance

**Date :** 2026-08-08
**Branche :** `feature/tablet-hub-pwa`
**Statut :** conception — aucun code écrit
**Documents jumeaux :** `2026-08-07-acceleration-ia.md` (intégrations IA) ·
`2026-08-07-fiabilite-cortex-combat.md` (fiabilité du Cortex)

**Origine.** Constat de David en examinant l'après-partie : *« pour que le module journal fonctionne
bien, il manque des éléments narratifs »*. La vérification confirme le manque, et il est structurel —
GM-OS modélise un monde et des séances, mais **jamais une histoire**.

---

## 1. Le constat

### 1.1 Ce qui existe et qui n'est pas ça

**`StoryboardMoment` est une ambiance technique, pas une unité narrative.** Il porte `musicPadId`,
`lightSceneId`, `mapUrl`, `imageMediaId`, `soundPadId`, `ambientSceneId`, et `triggerMoment` déclenche
le tout. C'est une « scène » au sens régie. La liste est **plate** : ni ordre, ni acte, ni relation
entre les moments.

**`GameSession` n'a aucune structure interne.** `publicSummary` et `gmSecrets` sont des blocs de texte ;
rien ne décrit ce qui s'est passé *dans* la séance.

**`ChronicleForgeResult` produit `campaign` + `entities` + `locations` + `lore` — aucun arc.** La Forge
Chronique fabrique un décor, jamais une progression. Pour un module nommé « Chronicle Architect », c'est
le manque le plus net.

**Et le journal accumule des événements sans ancres.** `JournalEvent` porte un `timestamp`, un `type` et
du texte. Rien ne dit *où* dans l'histoire cet événement a eu lieu.

### 1.2 Un bug trouvé en chemin

`AIService.summarizeSession` ne gère que Gemini : hors Gemini, elle retourne la chaîne littérale
`"Résumé non disponible pour ce fournisseur d'IA."`. Le garde ligne 246 laisse passer Ollama, qui tombe
donc dans ce cas.

**David utilise Ollama : ses résumés de séance n'ont jamais fonctionné.** Cette phrase est enregistrée
comme résumé, puis potentiellement poussée dans NotebookLM comme source
(`useJournalStore.ts:286`). **À vérifier sur les données déjà enregistrées.**

---

## 2. Le modèle

**Trois niveaux, pas quatre.** Pas d'objet « scénario » distinct : l'acte en tient lieu. Décision de
David — *« dans une séance, on est censé savoir dans quel acte on se trouve, et a priori quelles scènes
seront jouées »*.

```text
Campagne ──> Actes ──> Scènes
                          ▲
Séance ───────────────────┘   (traverse des scènes ; n'en est pas le parent)
```

Trois relations, sans hiérarchie forcée :

| Relation | Nature |
| --- | --- |
| Séance → acte | la séance se déroule dans un acte, avec des scènes **anticipées** |
| Séance → scènes traversées | un **parcours**, pas un ordre |
| Événement de journal → scène | la scène **active au moment de l'émission** |

**Ne pas imposer la linéarité.** Une partie ne suit jamais le plan : on saute une scène, on en joue une
dans le désordre, on en improvise, une autre déborde sur deux séances. D'où **deux faces distinctes** :
ce qui a été *prévu*, et ce qui a été *traversé*. La divergence entre les deux est elle-même
intéressante — c'est là que la partie s'est écartée du plan, donc là où il s'est passé quelque chose.

**Ne pas empiler les séances sous les actes.** Une séance coupe la trame arbitrairement. Ce sont deux
axes qui se croisent, pas une hiérarchie.

**Deux niveaux, pas plus.** Actes et scènes suffisent. Résister aux chapitres, beats, fils et arcs
secondaires — un seul développeur maintient cela.

**Une scène prévue et une scène improvisée sont le même objet**, avec un taux de remplissage différent.
Deux types distincts forceraient à choisir au pire moment : au milieu d'une partie, quand on ne sait pas
encore si ce qu'on improvise deviendra important.

---

## 3. La capture en partie : capturer, pas documenter

**En fin de séance, on n'a pas besoin d'avoir *documenté*, on a besoin de se *souvenir*.** Ce n'est pas
la même chose, et c'est beaucoup moins cher.

Or au moment où une scène est créée, **l'application sait déjà** : la carte active, les jetons visibles,
les combattants en piste, le moment de storyboard en cours, l'heure, les PNJ présents.

**Donc une scène improvisée se crée en un clic, sans rien taper** : elle capture l'état, le titre viendra
plus tard. C'est la seule version qui survivra à l'usage réel — tout ce qui demande de la frappe pendant
que les joueurs attendent ne sera pas fait.

> **Précédent, et piège.** `SessionModuleSnapshot` capture déjà musique, son, ambiance et lumières. Mais
> il embarque les **playlists et atmosphères complètes en payload**. Une scène doit stocker des
> **références, pas des contenus**, sinon chaque marquage pèse des mégaoctets.

### 3.1 Le marquage doit être gratuit

Si déclarer « on est maintenant dans la scène X » coûte plus d'un clic, ce ne sera pas fait, et la trame
pourrira en une séance. Deux marquages s'obtiennent **d'actions déjà accomplies** :

| Action déjà faite | Effet |
| --- | --- |
| Déclencher un moment de storyboard lié à une scène | marque la scène |
| **Démarrer un combat** sans scène active | **crée une scène improvisée** |

Le début d'un combat est une frontière de scène très forte — plus nette qu'un changement d'ambiance. Et
c'est exactement le cas de l'**événement imprévu** : pas de rencontre prévue correspondante, donc scène
improvisée, marquée comme telle.

### 3.2 Le risque, et pourquoi il est acceptable

Un changement de scène sera oublié, et des événements s'accumuleront sous la précédente. Deux
amortisseurs : le marquage gratuit ci-dessus, et **la revue de fin de séance permet de scinder une
scène**. Un marquage manqué est réparable, pas perdu — même principe que *« ne jamais bloquer le chemin
de sortie de l'erreur »*.

---

## 4. Le cycle de séance

Le plan IA cadre les usages en deux moments — préparer, jouer. **Il en existe un troisième**, déjà à
moitié implémenté (`useJournalStore.ts:234-235` résume, `:286` pousse vers NotebookLM,
`ObsidianExportService` exporte) : **l'après-partie**.

| Moment | Pression de temps | Ce qui s'y joue |
| --- | --- | --- |
| Préparation | aucune, si non bloquant | la trame, le monde, les ambiances |
| Partie | forte | le parcours réel, la capture |
| **Après-partie** | **aucune** | la curation, la chronique, la file de forge |

C'est le moment où **la boucle se referme** : le journal des lacunes devient la file de la Forge, la
séance devient chronique, la chronique devient source NotebookLM. Le plan IA décrit le journal des
lacunes mais ne disait jamais *quand* il est traité — la réponse est ici.

### 4.1 Deux étapes, pas une

**Décision de David : ne pas résumer directement tous les éléments.**

Le journal mélange deux natures. Les types existent déjà — `AUDIO`, `COMBAT`, `NPC`, `LOCATION`, `NOTE`,
`SYSTEM`, `ORACLE` — et une bonne partie est écrite automatiquement. Aujourd'hui,
`summarizeSession(journal.events)` envoie **tout**, y compris *« Combat : Initiative — l'initiative a été
tirée pour 6 combattants »*, à un modèle chargé d'écrire une chronique. Trois dégâts : le prompt gonfle
(et se fait tronquer à 16 384 tokens), le signal narratif se dilue, et le résumé risque de raconter des
jets de dés.

**Étape 1 — curer.** Revue **scène par scène**, pas événement par événement. Chaque scène affiche son
contexte capturé et ses événements : la nommer, compléter son résumé, jeter celles qui n'étaient rien,
fusionner deux scènes qui n'en faisaient qu'une, scinder celle qui en cachait deux. *Une dizaine de
scènes se revoit en quelques minutes là où deux cents événements ne se revoient jamais.*

**Étape 2 — résumer** l'ensemble curé, **avec une structure** au lieu d'une chronologie plate.

**Deux arguments qui vont au-delà de la taille du prompt :**

- **Les deux étapes n'ont pas le même mode de défaillance.** Un résumé raté se relance — c'est bon
  marché. Une curation ratée fausse tout ce qui en découle. Donc la curation mérite l'attention du MJ,
  le résumé mérite l'automatisation.
- **La sortie de l'étape 1 vaut par elle-même.** Une trame curée est la matière première de la
  chronique, du wiki et de NotebookLM. Le résumé n'en est qu'un dérivé. **À persister comme artefact,
  pas comme prétraitement jetable.**

Deux étapes suffisent. L'envoi vers NotebookLM et Obsidian est une *action*, pas une décision. En
revanche le **journal des lacunes** habite le même moment mais reste un flux distinct : ce sont des
questions, pas des événements.

### 4.2 Trois défauts propres au journal

Distincts du bug du § 1.2, et trouvés en examinant la chaîne complète `generateAISummary` →
`syncToNotebook`.

**Le résumé est stocké comme un événement du journal** (`useJournalStore.ts:237-241`), typé `SYSTEM`.
Deux conséquences :

- `SYSTEM` est classé **trace** et non **récit** par le filtre du § 4.2 : le résumé serait donc écarté
  de lui-même.
- Surtout, `summarizeSession` prend `journal.events` en entrée. **Régénérer le résumé lui réinjecte le
  résumé précédent** — contamination récursive, qui s'aggrave à chaque régénération.

**Un résumé est un artefact dérivé du journal, pas un événement dedans.** Sa place est sur la séance
(`GameSession.publicSummary` existe déjà), pas dans le flux d'événements.

**La recherche du résumé se fait par titre traduit.** `syncToNotebook` fait
`e.title === i18next.t('modules:journal.events.ai_summary')` (`:257`). Générer le résumé en français
puis basculer l'interface en anglais casse le lien, et l'envoi échoue sur « pas de résumé ». **Même
famille de fragilité que l'appariement jeton ↔ combattant du Cortex** : une relation structurelle portée
par une chaîne d'affichage.

**Et le bug du § 1.2 emprunte le chemin nominal.** `summarizeSession` **retourne** sa chaîne d'excuse au
lieu de lever une erreur : `generateAISummary` la traite donc comme un succès, l'enregistre comme
résumé, et `syncToNotebook` accepterait de la pousser dans NotebookLM. Rien, à aucune étape, ne signale
l'échec.

> **Ce que le journal n'a pas besoin d'avoir.** Le plan IA définit une boucle de revue (axe O) pour les
> artefacts que l'IA rend durables. **Le journal n'en relève pas** : sa revue est la curation en deux
> étapes du § 4.1, et l'envoi vers NotebookLM est déjà une action séparée et explicite. La différence
> tient à qui consomme l'artefact — une fiche de règle est citée des mois plus tard, à froid, par
> l'Oracle ; un résumé de séance est relu immédiatement, par son auteur, en connaissance de cause.

### 4.3 Distinguer la trace du récit

Le journal sert deux usages qui ne veulent pas la même granularité :

- **Pendant la partie**, c'est un fil qu'on regarde ; « initiative tirée » confirme que l'action est
  passée. Utile.
- **Après la partie**, c'est la matière de la chronique. Là, c'est du bruit.

**Donc ne pas supprimer : distinguer.** Un axe de plus sur l'événement — `trace` ou `chronique` — à côté
du `type` existant. Le `type` en donne déjà 80 % (`AUDIO` et `SYSTEM` sont des traces), mais `COMBAT`
contient les deux : le tirage d'initiative est une trace, le résumé de fin est du récit.

**Bénéfice direct : l'étape 1 devient presque automatique.** On ne cure que l'ambigu.

---

## 5. L'émission sémantique par module

> **Principe général.** Chaque module doit émettre **à son niveau sémantique, pas à son niveau
> mécanique**. Le module de combat sait ce qu'est un combat ; le journal sait seulement qu'il a reçu du
> texte.

Corollaire : **si un module n'émet qu'un score, sa texture est perdue définitivement.** Personne ne
pourra reconstituer après coup ce que lui seul voyait.

### 5.1 État du module de combat

Trois points d'émission, un de chaque nature :

| Site | Événement | Nature |
| --- | --- | --- |
| `clearCombatants` (~196) | « Combat : Résumé de fin » — rounds, participants, pertes, survivants | résumé, mais **tableau de score** |
| `rollInitiative` (~263) | « Combat : Initiative » | trace mécanique |
| `propagateStatusToSession` (~431) | « Décès : X » (typé `NPC`) | **vraie substance narrative** |

**Aucun événement de début de combat.** Dans la chronique, des décès surgissent donc sans cadre, et le
combat n'est nommé qu'à sa clôture. Un événement d'ouverture — « Combat engagé : 6 combattants », avec
le lieu si la carte est chargée — donnerait un début à l'arc. C'est une ligne.

### 5.2 Ce que le résumé de combat devrait devenir

Le résumé actuel est un tableau de score : rounds, participants, pertes, survivants. Un chroniqueur n'en
fait rien. Il manque ce qui fait un combat.

**Le module de combat est le seul à pouvoir le savoir** : la séquence des tours, les chutes de PV, les
états appliqués et levés, qui a été flanqué, les zones traversées. Il devrait tenir un petit relevé
pendant le combat — plus gros coup encaissé, qui est tombé le plus bas, quel état a été décisif, à quel
round le rapport de force s'est inversé — et l'émettre en **un** événement final. Tout cela se calcule
mécaniquement à partir des états qu'il traverse déjà.

> **Garder ce résumé mécanique, ne pas le faire générer par l'IA.** C'est tentant, mais ce serait un
> appel IA **en pleine séance**, au budget le plus serré, pour produire ce que la chronique
> d'après-partie fera mieux avec plus de contexte. Une chaîne construite est instantanée, gratuite,
> déterministe, et fonctionne hors ligne.

### 5.3 Les décès vivent leur vie — et le prérequis

**Décision de David : les décès restent des événements narratifs autonomes**, le résumé de combat ne les
reprend pas. Le rattachement se fait tout seul : `summarizeSession` trie par timestamp, donc les décès
s'intercalent dans le déroulé et le résumé arrive en clôture. Aucune référence croisée nécessaire.

**Mais l'événement de décès est bien moins fiable qu'il n'y paraît.** `propagateStatusToSession` n'est
appelée **que depuis `CombatControls.tsx:181`**, à l'intérieur du gestionnaire d'**export du rapport de
combat**. Un décès n'est donc journalisé que si :

1. le MJ clique explicitement sur l'export du rapport
2. **et** le mort n'est pas un personnage joueur (`!c.isPlayer`)
3. **et** il est rattaché à une entité de la galerie (`c.sourceEntityId`)

Conséquences : **la mort d'un PJ n'est jamais journalisée** — l'événement narratif le plus fort qu'une
séance puisse produire ; un PNJ créé à la volée meurt sans trace ; et sans export, rien.

Or aujourd'hui, le seul endroit où un décès apparaît à peu près sûrement est la ligne `**Pertes :**` du
résumé de combat — celle qu'il s'agit justement de retirer.

> ⚠️ **L'ordre compte.** Rendre l'événement de décès **universel et automatique d'abord**, retirer les
> pertes du résumé **ensuite**. L'inverse ferait disparaître les morts des chroniques, PJ compris.

**À trancher :** le décès d'un PJ mérite-t-il un traitement distinct ? L'événement est aujourd'hui typé
`NPC`, ce qui ne conviendrait pas — un type `PC` ou un marquage d'importance permettrait à la chronique
de lui donner son poids.

### 5.4 Le principe vaut au-delà du combat

Le combat n'est que le premier cas. La carte pourrait émettre « le groupe a atteint tel lieu »,
l'Oracle « telle règle a été tranchée pendant la partie ». **Mieux vaut poser la règle générale
maintenant que la redécouvrir module par module.**

---

## 6. La Forge Chronique génère la trame

**Décision de David : la Forge propose une trame, et lie les éléments connexes — lieux, PNJ présents,
indices, objets. Tout reste modifiable au moment de retravailler la séance à venir.**

### 6.1 Extension du résultat

`ChronicleForgeResult` gagne des **actes**, chacun portant ses **scènes**, chaque scène portant son
résumé de contexte et ses renvois **par nom** vers le lieu, les PNJ présents, les indices et les objets.

### 6.2 Générer en passes, pour que les liens tiennent par construction

Le mécanisme de résolution existe déjà et fonctionne : `crossDomainHelpers.ts:23-38` construit une table
nom → identifiant à l'import et résout les `targetName` des relations en `targetId`.

**Mais mieux vaut ne pas dépendre de la résolution après coup.** Générer d'abord les entités, lieux et
indices, **puis** générer la trame en lui fournissant la liste des noms déjà créés : le modèle ne peut
plus inventer un nom qui n'existe pas si on lui donne la liste. Même principe que driver → template, et
la trame en est l'argument le plus fort — sans passes, chaque scène est un pari sur la cohérence
orthographique du modèle.

### 6.3 Ne plus jeter en silence

`crossDomainHelpers.ts:38` fait `.filter(r => r.targetId)` : **ce qui ne se résout pas est écarté sans
un mot.** Pour des relations c'est une perte discrète ; pour une trame ce serait pire — une scène
perdrait ses PNJ et ses indices silencieusement.

**Signaler les non-résolus au lieu de les filtrer.** Petit changement, et il profite rétroactivement aux
relations existantes.

### 6.4 Reforger ne doit pas écraser les retouches

Le mode enrichissement existe (paramètre `targetName`), mais **rien ne protège ce que le MJ a corrigé**.
C'est la « survie des corrections » de la boucle de revue, appliquée ici à l'artefact le plus visible de
tous. **Si retravailler une séance efface le travail de la semaine précédente, le MJ cessera de
retravailler.**

---

## 7. Ce que la trame apporte ailleurs

**Le contexte de l'Oracle et du Cortex.** `getLiveSessionContext` envoie aujourd'hui les dix derniers
événements bruts. Remplacer cela par *« scène en cours : l'embuscade de l'entrepôt — les PJ cherchent le
manifeste, le garde est corrompu »* donne **un bien meilleur ancrage pour bien moins de tokens**. Dans un
plan qui se bat pour tenir 4 000 tokens, c'est un gain direct.

Pour le Cortex en particulier, c'était la pièce manquante : le plan IA recommandait de le couper du lore
pour ne lui laisser que les règles de combat. **La trame lui rend ses enjeux pour quelques dizaines de
tokens** — un contexte de la bonne taille *et* de la bonne forme, là où le corpus de règles était à la
fois trop gros et hors sujet.

**Les rencontres préparées.** Une scène peut déclarer sa rencontre prévue : l'embuscade se prépare en
amont, et à table c'est un clic pour lancer le combat pré-rempli. Un vrai retour sur investissement de la
préparation, qui n'existe pas aujourd'hui.

**Prévu contre improvisé, comme donnée.** La distinction se relève toute seule. Après quelques séances,
elle dit où la préparation a tenu et où les joueurs sont sortis du script.

---

## 8. Ordre de travail suggéré

| # | Étape | Pourquoi ici |
| --- | --- | --- |
| 1 | **Corriger `summarizeSession`** hors Gemini | bug actif, données déjà polluées (§ 1.2) |
| 2 | **Rendre l'événement de décès universel et automatique** | prérequis de § 5.3, sinon les morts disparaissent |
| 3 | Modèle actes / scènes + rattachement automatique des événements | le socle |
| 4 | Capture en un clic + marquages gratuits (storyboard, début de combat) | sans cela la trame ne vivra pas |
| 5 | Axe `trace` / `chronique` sur les événements | rend l'étape 1 presque automatique |
| 6 | Revue de fin de séance scène par scène | l'étape 1 |
| 7 | Résumé sur l'ensemble curé | l'étape 2 |
| 8 | Résumé de combat enrichi + événement d'ouverture | § 5.2 |
| 9 | Trame générée par la Forge Chronique, en passes | § 6 |
| 10 | Trame injectée dans le contexte Oracle / Cortex | § 7 |

Les deux premières lignes sont des **corrections**, pas des fonctionnalités : à traiter indépendamment
du reste.

---

## 9. Points de vigilance

- **Ne pas confondre `StoryboardMoment` et scène narrative.** On **lie**, on ne fusionne pas : une même
  ambiance sert plusieurs scènes.
- **Références, pas payloads**, dans la capture d'état d'une scène (§ 3).
- **Le rattachement événement → scène doit être un champ de premier ordre**, pas une entrée dans
  `metadata` : c'est une relation structurelle, pas une donnée accessoire.
- **Le rattachement doit être automatique**, jamais manuel — c'est ce qui rend le regroupement possible
  après coup.
- **Vérifier les données déjà enregistrées** pour le bug § 1.2 : combien de séances portent la chaîne
  `"Résumé non disponible pour ce fournisseur d'IA."`, et combien ont été poussées telles quelles dans
  NotebookLM.

---

## 10. Reste à décider

- **Le décès d'un PJ mérite-t-il un type distinct ?** (§ 5.3)
- **Le principe d'émission sémantique s'étend-il tout de suite aux autres modules** (carte, Oracle), ou
  au fil de l'eau ? (§ 5.4)
- **Que devient une scène prévue jamais jouée ?** Elle reste dans la trame pour une séance ultérieure,
  ou elle est marquée abandonnée ? La réponse détermine si la trame est un plan glissant ou un registre.
