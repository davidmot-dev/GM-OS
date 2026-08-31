# Chantiers garés — le registre qui se rappelle d'un coup

**Nature de ce document : registre vivant, pas instantané daté.** Contrairement
aux `etat-et-reprise`, celui-ci **se met à jour** — on y coche, on y ajoute, on
en retire ce qui est fait. C'est le seul endroit où vit la liste des idées garées.

**Ouvert le 2026-08-23** avec trois chantiers. **Au 2026-08-29 ils sont cinq, et
quatre sont clos** — thème, fiche HTML, sauvegarde des images, sauvegarde des
fiches, les trois derniers **éprouvés en réel, aller et retour**.

**Au 2026-08-30, Deck-OS tombe à son tour — construit ET éprouvé en réel le jour
même, David : *« tout fonctionne bien »*. Les cinq chantiers sont clos.**

**Au 2026-08-31, ce registre absorbe les autres listes** — plan IA, plan du
Cortex, réconciliation d'août, feuille de route Ulanzi. Tout ce qui reste, tout
plan confondu, tient dans la section ⭐ ci-dessous. **Commencer par elle.**

> **Revérifié dans le code le 2026-08-24**, chantier par chantier, sans rien recopier d'un document.
> Base saine : `tsc -b` propre, **2 321 tests au vert** (190 fichiers, 1 ignoré). Les trois états
> ci-dessous sont confirmés. **Quatre documents disaient faux et ont été corrigés le même jour** — le
> doublon des Quarts (supprimé), les confirmations de suppression (posées), le mode hors carte du Cortex
> (construit), et les chiffres du corpus. *Une liste de restes qui vit à deux endroits en désigne un
> faux* — c'est la troisième fois que ce document paie cette règle.

---

## ⭐ Le registre consolidé — 2026-08-31

**Pourquoi cette section existe.** Le 31/08, j'ai annoncé à David quatre défauts du Cortex et l'axe O
comme « à faire » — **ils étaient tous corrigés depuis les 22-24/08.** L'erreur ne venait d'aucun
document du dépôt : elle venait d'une mémoire de session restée au 21/08. *Une mémoire vieillit comme un
document, et elle n'a pas de `git log` pour le dire.* D'où cette section : **une seule liste, vérifiée
dans le code, qui absorbe toutes les autres.**

> Vérifié le 2026-08-31 : `tsc -b` propre, **3 158 tests au vert**, arbre propre et poussé.

### 1 · Ce qui se joue et ne se code pas — la catégorie P6

**C'est elle qui a produit tous les défauts des 18-19/08 et les huit de la séance du 21/08**, dont un jet
à seize dés. Aucun n'est sorti d'une relecture de code.

| Jamais vu tourner | Depuis |
| --- | --- |
| La **bascule de combat entre deux scènes**, et le retour des jetons | 20/08 |
| L'**aller-retour d'image** d'une ambiance | — |
| La **consigne de langue** — on sait qu'elle part, pas que le modèle l'applique | — |
| La **fusion et la scission de scènes** à la revue de fin de séance | 21/08 |
| Le **journal de contexte d'Ollama** | 22/08 |
| Les **six widgets Ulanzi ensemble** (un seul a été éprouvé) | 30-31/08 |
| Le **préchauffage du modèle** — gain mesuré au banc, pas à la table | 31/08 |

### 2 · Ce qui se décide à la table — axe N.3

Les **tailles** sont validées par David le 24/08 et vivent dans une seule table. Ce qui manque pour
**carte, PNJ, Oracle et journal**, ce n'est pas la taille : c'est **quels éléments grossissent**.
*Une densité se juge en jouant, pas en regardant* — choisir maintenant serait deviner quatre fois pour
économiser une séance.

### 3 · Ce qui se code, et c'est court — ✅ **les quatre points sont traités le 2026-08-31**

> **Trois des quatre n'ont pas demandé le code qu'on croyait.** 3a était un vrai défaut ; 3b était un
> bandeau qui pointait au mauvais endroit ; 3c était **déjà fait** et je l'avais recopié sans vérifier ;
> 3d était une mesure — qui a surtout corrigé **la mienne**. *Vérifier un reste coûte moins cher que le
> traiter, et parfois il n'y a rien à traiter.*

| | Quoi | Où |
| --- | --- | --- |
| a | ✅ **FAIT le 31/08.** La ligne du soutien direct disait « cases » et son seuil `<= 2` comptait en unités de grille. Elle lit maintenant la **bande déclarée par le pilote** (`Contact` ou `Courte`) et annonce l'allié comme les cibles : `Kaï à 1 zones [Portée au toucher]`. **La bande était déjà calculée pour les alliés, puis jetée.** Deux tests interdisaient le mot « cases » depuis le 22/08 — ils passaient parce qu'ils **ne mettaient aucun allié en scène** ; *un test qui interdit un mot ne vaut que sur les lignes qu'il fait écrire* | `TacticalNarrativeService.ts:448` |
| b | ✅ **FAIT le 31/08.** `roadmap-v6.md` portait déjà un bandeau « périmé » — le défaut était qu'**il renvoyait vers une liste de restes qui n'était plus la bonne**, et vers un `etat-et-reprise` nommé par sa date. Elle renvoie maintenant ici, l'index utilisateur ne l'annonce plus comme « Source de Vérité » (son lien était cassé), et `amélioration.md` non plus. *Un avertissement qui oriente vers un document périmé déplace le problème au lieu de le régler* | `documentation/Architecture/` |
| c | ✅ **RIEN À FAIRE, vérifié le 31/08 — et c'est moi qui avais recopié un reste mort.** L'étape 9 n'a pas été abandonnée : **son travail était déjà fait par la Forge de campagne** (15-16/08). Le plan de trame le dit depuis le 20/08, § 6 et § 8. J'avais copié la ligne du § 6 de la réconciliation sans l'ouvrir — *un reste recopié survit à sa correction*, la règle que ce même document énonce | `2026-08-08-trame-narrative-cycle-seance.md` |
| d | ✅ **MESURÉ le 31/08, la décision ET son motif tiennent.** Avec du sel en tête d'invite : **88-96 tok/s** à 4 000 tokens, **82** à 8 000 — soit **+56 s** pour doubler, contre les +51 s du 23/08. *Le prefill l'explique en entier ; il n'y a jamais eu de secondes manquantes.* ⛔ C'est mon banc du matin qui était faux : invite répétée, donc **cache de préfixe**. La condition de réouverture posée le 23/08 (300 tok/s) n'est pas remplie | § 13 de `2026-08-07-acceleration-ia.md` |

### 4 · Garé par décision, et à ne pas rouvrir sans raison

- **Ulanzi D — les boutons physiques.** Mesuré le 30/08 : rien en HTTP sur le firmware 0.98. MQTT ou
  rien, et un courtier est un service de plus à faire vivre. *La seule des quatre directions dont le coût
  soit une dépendance d'infrastructure et non du code.*

### 5 · Clos et vérifié dans le code — ce qui ne doit plus être réannoncé

*Ces cinq points ont été présentés comme « à faire » le 31/08 alors qu'ils étaient faits. Les ancres sont
là pour que la vérification prenne dix secondes la prochaine fois.*

| Annoncé comme ouvert | Réalité, vérifiée le 31/08 |
| --- | --- |
| `activeDriver.tactical` non transmis | ✅ `tacticalConfig` est un paramètre — `TacticalNarrativeService.ts:103` |
| `faction` dérivée à `enemy` | ✅ `faction \|\| (isPlayer ? 'player' : 'neutral')` — `useCombatStore.ts:759` |
| Contexte RAG envoyé en double | ✅ `sansPersona: true` + `{ systemOnly, limit: 2 }` — `useTacticalAIStore.ts:176` |
| Unité « cases » en dur | ✅ `${unite}` déclarée par le pilote — **sauf le point 3a ci-dessus** |
| Axe O — `relu: false` lu par personne | ✅ mention « non relue » et déclaration en un clic — `AIChatPanel.tsx:443` |

**Et pour mémoire, tous les axes A → O du plan IA sont clos**, le Cortex avec eux (ses 5 axes le 22/08,
ses 3 questions les 22-23, ses vigilances le 24).

---

## La vue d'un coup d'œil

| # | Chantier | État | Le premier geste | Bloqué par |
| --- | --- | --- | --- | --- |
| 1 | **Afficheur Ulanzi** | ✅ **CONSTRUIT le 23/08, ÉPROUVÉ EN RÉEL le 30/08** — trois défauts de restitution trouvés et corrigés | La séance de Blade Runner elle-même | Rien |
| 2 | **Deck-OS — garder la carte** | ✅ **CONSTRUIT et ÉPROUVÉ EN RÉEL le 30/08** — quatrième tas, don entre joueurs, pioche par le joueur, onglet Cartes | — | Rien |
| 3a | **Thème par jeu** | ✅ **LIVRÉ le 24/08** | — *vérifié en réel sur Hadley Hope* | Rien |
| 3b | **Fiche HTML** | ✅ **LIVRÉE SUR LES DEUX ÉCRANS le 28/08** | Étapes 5 et 6 — le `hotspot` et `humanite` par la Forge | Rien |
| 4 | **Sauvegarde des images** | ✅ **ÉPROUVÉE EN RÉEL le 29/08** — aller **et** retour | — | Rien |
| 5 | **Sauvegarde de la bibliothèque des fiches** | ✅ **ÉPROUVÉE EN RÉEL le 29/08** — aller **et** retour | — | Rien |

### Ce que la soirée du 2026-08-23 a fermé

*Consigné ici pour que la question « que reste-t-il ? » cesse de rouvrir ce qui est clos — le § 5 du
document de réconciliation avait fait annoncer trois chantiers déjà faits.*

| Fermé | Comment |
| --- | --- |
| **P1 bis — le pilote RdD** | Redérivé par David, seuil vidé, **78 %** vérifié à l'écran. *C'était le seul reste qui faussait une partie en cours.* |
| **Les trois restes du RAG** | Déjà clos le 23/08 au matin ; le document qui les listait était périmé |
| **Le Cortex** | Ses deux questions : *ne pas fusionner, borner* (mesuré) et **le mode hors carte** (construit) |
| **Axe N.3** | Les cinq modules ont la règle du destructif ; la densité n'est calibrée que sur le combat |
| **Quatre suppressions muettes** | Journal ×2, Oracle, PNJ — confirmations posées |
| **`docs/commun/`** | Créé par David. **Vide** : reste à le remplir de ce qui est transversal |
| **Les fiches Blade Runner** | Zéro `a_regenerer` dans tout le corpus, doublon des Quarts supprimé |

**Ce qu'ils ont en commun, et ce n'est pas un hasard :**

- Les trois posent la **même** question — *qui détient la vérité* : la carte
  gardée sort-elle des trois tas ; qui arbitre les 256 pixels ; `sheetData` ou le
  fichier HTML. C'est le motif que ce projet paie tous les jours.
- Les trois s'appuient sur **la même plomberie, déjà en place** : `SyncServer`,
  `PairingManager`, `netTrust`, `net.fetch`, et le Player Hub sur tablette.
- Deux des trois butent sur **le même trou** : la tablette sait afficher et ne
  sait pas écrire.

---

# 1 · Afficheur Ulanzi / AWTRIX

📄 **Fait foi :** `documentation/Planning/2026-08-23-afficheur-ulanzi.md` (13 sections)
🧠 **Mémoire :** `gm-os-afficheur-ulanzi-awtrix`

**L'idée.** Un afficheur 32 × 8 pixels posé sur la table. La contrainte décide de
tout : à cette taille on affiche **des nombres et des barres, jamais des
phrases**. Vingt idées se ramènent à **quatre widgets**. Miroir contre
instrument : un miroir reflète un module qui existe, un instrument ne reflète
rien et doit donc être poussé depuis quelque part.

**Ce qui est tranché.** Quatre widgets et pas une bibliothèque par jeu · la table
de correspondances **existe déjà dans le pilote**, on ne la réécrit pas · **un
seul arbitre** pour les 256 pixels · on commence par **le compte à rebours seul**
· l'objet garde sa **routine** hors séance et n'est **emprunté** que si l'option
est cochée — donc il faut le **rendre**, y compris quand GM-OS plante.

**⚠️ Le test se fera sur Blade Runner** — corrigé le 2026-08-23 : *« en réalité ma
prochaine partie sera du Blade Runner »*. Ça renforce le plan au lieu de le
retarder, parce que **le compte à rebours y a un sujet natif : le Quart.**

**Ce que l'afficheur montre, et tout vient du corpus vérifié**
(`docs/systems/blade-runner/rules/`) :

- La journée compte **quatre Quarts** (matin, journée, soirée, nuit), 5 à 10 h
  chacun, **un seul lieu visité par Quart**.
- **Le seuil est à trois** : au-delà de 3 Quarts d'affilée sans pause, **1 point
  de stress par Quart supplémentaire** *(4 avec « Bourreau de travail »)*.
- **Les joueurs le notent déjà à la main** sur leur fiche d'Agenda.

Un nombre, un seuil, et une comptabilité que la table tient au crayon : si
l'afficheur prend, **il ne fait pas qu'informer, il retire du travail à la
table**. Un timer abstrait n'aurait jamais pu prouver ça.

**Et c'est la seule jauge de Blade Runner qui appartienne à la TABLE.** Santé,
Sang-froid et Stress appartiennent à chaque personnage ; Promotion, chinyen et
Humanité s'attribuent en fin de session. Les 256 pixels n'ont de place que pour
une chose partagée — le premier test n'a donc pas à trancher *quel* personnage
afficher, et ne doit surtout pas se le voir imposer.

**Les deux natures du § 4 sont natives en Blade Runner :** le Quart est le
**miroir** (s'il ment, c'est un bug) ; **le test de référentiel** est
l'**instrument** — l'idée de David d'*« une jauge verte qui se vide silencieusement
sans que les joueurs sachent pourquoi »* **est** le référentiel, littéralement
(mesure à reproduire « avec une précision millimétrée », dégradation non montrée).

**Les TODO, dans l'ordre :**

1. ✅ **TRANCHÉ le 2026-08-23** — le test aura lieu. David : *« oui, le défilé des
   quarts »*.
2. ✅ **TRANCHÉ** — le Quart se pousse **depuis le cockpit** (« pour l'instant »).
   *GM-OS ne suivait aucun Quart : vérifié, le mot n'existait pas dans `src/` au
   sens de Blade Runner.*
3. ✅ **CONSTRUIT le 2026-08-23** — `src/modules/ulanzi/`, six fichiers, 13 tests
   propres au widget, `tsc -b` propre, **2 286 tests au vert**, appareil rendu à
   sa routine après essai. Voir § 13 du plan.
4. ⏳ **L'ESSAYER EN CONDITIONS** — ouvrir une séance, cocher l'option, avancer
   trois Quarts, voir le rouge au quatrième, prendre une pause, fermer la séance
   et vérifier que l'afficheur **redevient une horloge**. Puis la séance de
   Blade Runner.
5. **La librairie de widgets et son tableau de bord** (§ 12 du plan) — choisir
   par jeu, faire défiler à la cadence voulue. *Remplacera la couture provisoire
   qui teste « blade » dans le nom du jeu.*
6. **Brancher Clock-OS sur l'Ulanzi** — *idée de David, le 2026-08-23, gardée
   pour plus tard.* **Ce serait le premier MIROIR** (§ 4) : le défilé des quarts
   ne reflète aucun moteur, une horloge de tension en reflète un vrai.
   `TensionClock` (`src/store/useClockStore.ts:40`) porte déjà exactement ce
   qu'un widget « compte à rebours » demande — `name`, `totalSegments`,
   `filledSegments` — et le § 8 le classait **premier des usages**.
   ⚠️ **C'est ce branchement qui forcera la librairie du § 12 à exister** : deux
   widgets, donc un choix, donc un tableau de bord. Et deux écrivains vers 256
   pixels, donc l'arbitre.
7. **L'arbitre des 256 pixels** — inutile tant qu'il n'y a qu'un widget ; il ne
   redevient nécessaire que pour les surgissements, qui passent par `/api/notify`.
8. ❓ **À trancher plus tard — les boutons remontent-ils autrement que par MQTT ?**
   Toute la télécommande d'initiative en dépend, et un courtier est un service de
   plus à faire vivre.

> **Ce qui rend ce premier test court, et c'est le constat du 23/08 :** puisque
> aucun moteur ne suit le Quart, le défilé est un **instrument** et non un miroir.
> **Il n'y a rien à brancher** — ni pilote à forger, ni arbitre à écrire. Il
> deviendra un miroir le jour où un pilote Blade Runner déclarera le Quart ; pas
> avant, et surtout pas pour ce test.

> **Le pari du chantier.** Le compte à rebours est le seul widget présent dans
> presque tous les exemples, tous jeux confondus. **S'il ne prend pas à la table,
> les dix-neuf autres ne prendront pas non plus** — et la bibliothèque se
> dessinera seule ensuite, puisqu'on saura quelle jauge on a *voulu* pousser en
> jouant.

**🔧 ✅ RÉGLÉ le 2026-08-23 (`2db76db`) — trouvé en préparant ce test, sans rapport
avec l'afficheur :** deux fiches du corpus Blade Runner traitaient du même sujet —
`gestion-quarts-pauses.md` (**v1**, `a_regenerer: true`, sources **« non
capturées »**) et `structure-temporelle-par-quarts-et-pauses.md` (**v3**, 8 sections
citées du livre). C'était le motif corrigé sur Rêves de Dragons le 21/08 :
**l'Oracle peut répondre depuis celle qui ne cite rien.** La v1 est **supprimée** ;
**vérifié le 2026-08-24 — plus aucun `a_regenerer: true` dans un seul `rules/` du
dépôt**. Rien à reforger avant la séance.

---

# 2 · Deck-OS — garder la carte tirée

📄 **Fait foi :** ce document (aucun plan dédié n'existe encore)
🧠 **Mémoire :** `gm-os-deck-os-cartes-gardees`

**L'idée, mot pour mot (2026-08-23).** *« Je voudrais étendre l'utilisation de
Deck-OS : permettre à mes joueurs de tirer des cartes dans un deck et leur
permettre de garder la carte. »*

**Ce que le code dit aujourd'hui.** `src/types/deck.types.ts` — `DeckSessionState`
connaît **trois** endroits où une carte peut être :

```text
remainingIndices  ·  discardedIndices  ·  currentCardIndex
   la pioche            la défausse        la carte visible
```

**Aucune notion de carte tenue par quelqu'un.** C'est exactement le trou que
l'idée ouvre. Le module vit dans `src/modules/session/` — `DeckLibrary`,
`DeckPlayer`, `useDeckPlayer`, `deckSlice`, `DeckInterpreter` — et les vues
`deck-library` / `deck-player` existent déjà dans `CurrentView`.

**Les TODO, dans l'ordre :**

1. ⛔ **DÉCISION — une carte gardée est-elle un quatrième tas, ou un objet
   d'inventaire ?** Les deux lectures sont défendables et **elles ne mènent pas
   au même code**. Le quatrième tas garde tout dans `DeckSessionState` ;
   l'inventaire rapproche la carte d'un objet possédé — ce que le générateur de
   butin sait déjà faire.
2. ⛔ **DÉCISION — qui détient la vérité quand une carte est en main ?**
   *Si un index peut se trouver à la fois dans `discardedIndices` et dans la main
   d'un joueur, on a deux écrivains pour une même vérité.* Une carte gardée doit
   **sortir** des trois tas, ou n'y avoir jamais été.
3. **Le voyage jusqu'à la tablette du joueur.** « Garder la carte » veut
   probablement dire *qu'elle reste sur l'appareil du joueur* — donc que l'état du
   deck cesse d'être purement local au meneur. **C'est le vrai changement de
   nature**, bien plus que le quatrième tas.

---

# 3 · Thème par jeu & fiche HTML

📄 **Fait foi :** `documentation/Planning/2026-08-23-theme-de-jeu-et-fiche-calque.md`
🧠 **Mémoire :** `gm-os-theme-de-jeu-et-fiche-calque`

**L'idée.** Deux insatisfactions du 2026-08-23 : l'apparence des campagnes, et
celle des fiches de personnage. Le sujet 2 a été **renversé le même jour** — on
n'importe plus la fiche, **on affiche le HTML et on l'alimente**.

**Ce qui est tranché.** Palette libre déclarée dans le pilote · le jeu gagne et
la main surcharge la séance sans jamais écrire dans le pilote · **la fiche EST un
fichier HTML, un par PJ** · elle s'affiche sur les **deux** écrans, en bascule.

**Aucune question ouverte. Le chantier est prêt à partir.**

## 3a · Le thème — ✅ LIVRÉ le 2026-08-24

**Les six étapes sont faites**, et le résultat dépasse le plan : au lieu d'une
palette déclarée dans le pilote, **un jeu dépose `docs/systems/<jeu>/theme/theme.css`
et l'interface suit** — aucun registre, aucun code, aucune recompilation. Quatre
thèmes en place (Alien, NOC, Star Trek, Blade Runner), construits par David sur
son propre SDK de thèmes normalisé.

Ce qui a changé par rapport au plan : on **extrait les 22 jetons** au lieu
d'injecter la CSS, parce que le vocabulaire de composants du SDK est celui d'une
page de livre et n'a pas de correspondant dans le cockpit. Les composants
serviront au chantier 3b, dans l'iframe des fiches.

Détail des pièges rencontrés : mémoire `gm-os-theme-de-jeu-et-fiche-calque`.

### Ce que le plan demandait, pour mémoire

1. **Réconcilier les deux tables de thèmes.** `THEME_PALETTES`
   (`useSessionStore.ts:48`) et `:root[data-theme=…]` (`index.css:184-260`) se
   contredisent, et **chacune n'est lue que pour une moitié d'elle-même** — donc
   aucune n'est jamais visiblement fausse. *Ce pas seul corrige la lueur qui ne
   suit pas l'accent choisi.* **À faire avant tout le reste** : poser une palette
   libre sur deux tables contradictoires, c'est en fabriquer une troisième.
2. **Un seul arbitre** — une fonction écrit les douze variables, `color-scheme`
   compris ; `main.tsx:13-15` cesse d'écrire.
3. **`ThemeDeJeu` dans `ui_config`**, avec `themeColor` en repli. *Rappel :
   `ui_config.themeColor` est un **champ mort** — la Forge le produit, les
   contrôles le valident, `RevueDuPilote` l'affiche, et personne ne l'applique.*
4. **La chaîne de préséance**, avec la distinction **choisi / hérité** dans
   `LayoutConfig` — sans elle, `useLayoutManager` sauvegarde la surcharge et la
   décision « le jeu gagne » s'inverse en silence.
5. **La Forge produit une palette entière** et `controlesDuPilote` la vérifie
   (contraste texte/fond, `clarte` cohérente avec le fond).
6. **Un écran** pour régler la palette d'un jeu à la main.

**Pièges :** `color-scheme` obligatoire sinon les `<select>` natifs se trompent ·
polices en **liste close** (Google Fonts, liste fixe — un nom libre échoue en
silence) · le thème doit passer par la synchronisation vers la tablette.

## 3b · La fiche — étude faite le 2026-08-24, plan d'origine PÉRIMÉ

⚠️ **Le plan ci-dessous a été écrit sur la fiche Alien et ne tient plus.** David
a depuis construit un **gestionnaire de fiches** — un moteur unique qui rend
quatre gabarits déclarés en JSON, avec géométrie, champs typés et bibliothèque
IndexedDB. Il vit dans `docs/fiches/Character_Sheet_Manager.html`.

Ce que ça change :

- **« Détourner `save()` » n'a plus de sens** : il n'y a plus quatre fiches avec
  chacune sa convention, mais un moteur. La couture se publie **une fois**.
- **Le typage et l'auto-déclaration sont acquis** — `text`, `number`, `textarea`,
  `checkbox`, `hotspot`, plus `system` et `schemaVersion`.
- **Le `hotspot` a supprimé le cas de correspondance le plus coûteux** : dix
  bulles portant chacune sa valeur SONT un scalaire.

📄 **Fait foi désormais :**
`documentation/Planning/2026-08-24-correspondance-fiche-blade-runner.md` — la
table écrite à la main sur les 33 champs, comptée, et les six étapes qui restent.

### ✅ La couture est publiée le 2026-08-27 — le blocage est levé

*Il était le seul : aucune fiche n'exposait quoi que ce soit sur `window`, aucune
n'utilisait `postMessage`.* `docs/fiches/Character_Sheet_Manager.html` expose
désormais, **une fois pour les quatre gabarits** :

```js
window.RPGSheet = { version, getData, setData, getTemplate, onChange }
```

…et **le même contrat par `postMessage`** (canal `rpg-sheet` : `hello`, `get`,
`set`, `template`, plus les diffusions `change` et `open`), parce que l'hôte sera
une iframe et que `window.*` ne traverse pas une origine.

**Trois points, et les deux derniers ne se devinent pas :**

| Où | Quoi |
| --- | --- |
| `setByPath` | signale la clé écrite — **tous** les chemins d'édition y passent (champ, case, hotspot, piste, portrait, et l'écriture de l'hôte) : *un seul point, pas cinq* |
| `openCharacter` | annonce l'ouverture, sinon l'hôte ne sait jamais qu'on a changé de PJ |
| le bloc publié | `setData` **redessine les champs** en plus d'écrire — sans ça la donnée est juste et l'écran ment |

**Deux décisions prises en écrivant :**

- **Un lot ne porte qu'une origine** (`sheet` / `host` / `open`). Les changements
  sont groupés sur 60 ms ; avant d'appliquer une écriture de l'hôte, on **vide**
  ce qui restait de la saisie locale. Sans ça l'hôte se voit renvoyer sa propre
  écriture mêlée à celle du joueur, et la réapplique.
- **`getData` rend une copie.** L'hôte qui bricole l'objet reçu ne touche pas la
  fiche.

**Éprouvé, et pas seulement relu :** `electron/coutureDesFiches.test.ts` charge
**le vrai moteur du disque** dans un DOM — seuls les gabarits intégrés sont
remplacés par un gabarit de contrôle, les vrais pesant sept mégaoctets de fonds
de page — crée un personnage par le chemin normal de l'application, puis fait
l'aller-retour complet : écriture de l'hôte → écran redessiné (texte, case,
`select`, hotspots, champ dérivé) → saisie du joueur → remontée → persistance
vérifiée en rouvrant le personnage. **9 tests.** Le premier garde les trois
points ci-dessus présents dans le fichier : *le jour où le GPT régénère la fiche
et emporte la couture, c'est ce test qui le dit.*

### ✅ La table et son contrôle sont faits le 2026-08-28 — étapes 3 et 4

`docs/systems/blade-runner/fiche/correspondance.json` range les **74 clés** de la
fiche : 16 renommages, 17 compositions, 18 champs d'armes, 6 absents motivés.
Déposée à côté du thème, résolue par `resoudreCorpus` — *déposer un fichier
suffit*. Les trois capacités sont dans `src/modules/fiches/`, et
`electron/correspondanceDesFiches.test.ts` regarde **dans les deux sens** :
aucune clé citée qui n'existe pas, **et aucune clé de la fiche qui ne soit
citée**. Détail et décisions : `2026-08-24-correspondance-fiche-blade-runner.md`.

⚠️ **Trouvé en écrivant la table, et c'est le motif du chantier :** le typage des
17 `.level` corrigé le 24/08 l'avait été **dans la fiche autonome**, jamais dans
le gabarit intégré au **moteur** — celui que GM-OS affichera. Quatre jours, deux
fichiers du même dépôt qui se contredisent, aucun test capable de le voir.
Corrigé, et gardé par le contrôle. *Le défaut que l'étape 4 devait empêcher
s'était produit avant qu'elle existe.*

### ⛔ Ce qui reste, et ce qu'il faut savoir avant de s'y mettre

**Le premier geste de l'hôte n'était pas l'iframe, c'était `open`.** Le contrat
`postMessage` de la v1 avait `hello`, `get`, `template`, `set` — et pas de quoi
dire **quel PJ ouvrir** : `openCharacter` n'était appelé que par la barre
latérale du moteur.

### ✅ La couture v2 est publiée le 2026-08-28 — la bibliothèque est ouverte

Quatre verbes de plus, **un seul passage dans le moteur** :
`list`, `openCharacter`, `create`, `backup` — par `window.RPGSheet` **et** par
`postMessage`, comme les quatre premiers. `hello` annonce désormais `version: 2`.
Éprouvés dans `electron/coutureDesFiches.test.ts` : **18 tests** sur le vrai
moteur chargé du disque (9 avant).

**Trois choses tranchées en l'écrivant, dont deux qui ne se devinent pas :**

| | |
| --- | --- |
| **`openCharacter`, jamais `open`** | `open` est **déjà une diffusion** du moteur vers l'hôte, et le garde-fou du gestionnaire jette les messages qui la portent. Un verbe nommé `open` serait ignoré **en silence** — pas refusé : sans réponse, l'hôte attendant pour toujours. Le nom est le même des deux côtés, pour qu'on ne puisse pas se tromper en changeant de chemin. |
| **`openCharacter` lève, il n'alerte plus** | Une `alert()` dans une iframe est un cul-de-sac : l'hôte attend une réponse, pas une boîte que personne ne verra. C'est l'appelant qui décide quoi montrer — la barre latérale alerte, l'hôte reçoit `ok: false`. |
| **`backup` est le contenu, pas le téléchargement** | Une seule fabrication (`contenuDeSauvegarde`) sert le bouton *et* la couture. Deux formats auraient fini par ne plus se restaurer l'un l'autre. L'hôte en reçoit une **copie**, pour la même raison que `getData`. C'est l'étape 1 du chantier n° 5, faite d'avance parce qu'elle tenait dans le même passage. |

**✅ Tranché par David le 2026-08-28 — le moteur garde sa bibliothèque, GM-OS s'y
branche.** Donc : étendre la couture avec `open(id)`, `list` et `create`, et
ranger sur chaque PJ de GM-OS l'identifiant de sa fiche. Le moteur reste
utilisable seul, hors GM-OS.

### ✅ Qui gagne quand les deux bases divergent — tranché le 2026-08-28

**La fiche fait foi. GM-OS s'aligne.** *« C'est la tablette qui gagne »* — donc
l'écran où le joueur remplit sa fiche l'emporte sur ce que le meneur en a fait.

C'est la même règle que la table de correspondance applique déjà aux armes, et
elle a le mérite d'être **énonçable en une phrase** : une règle d'arbitrage qu'on
ne peut pas dire à voix haute finit toujours par être appliquée à moitié.

**Mais elle ne se pose pas silencieusement.** *« Il faut garder un log si
possible »* : chaque divergence écrasée doit laisser une trace — quel PJ, quelle
clé, quelle valeur perdue, quand. Sans ça, un champ écrasé par une resynchro se
découvre en séance, et on ne peut plus dire ce qu'il contenait.

> **Deux choses à décider en écrivant le journal, pas avant :** le rapprochement
> se fait dans le *renderer*, or `auditNotice` (`electron/auditLog.ts`) vit dans
> le process principal et écrit dans `main.log` sous le préfixe `[Sécurité]` —
> il faut soit un chemin IPC vers lui, soit un journal propre à ce sujet. Et un
> journal de divergences doit **tourner**, sinon il grossit à chaque frappe.
>
> Trois précédents disent que c'est ce journal qui fera gagner du temps :
> `~/ollama_debug.log` a tranché toutes les questions de contexte, le journal du
> thème a rendu bruyant un absent muet, et *un refus qui ne laisse aucune trace
> ne vaut pas grand-chose* — la phrase est déjà dans `auditLog.ts`.

⚠️ **La bibliothèque du moteur n'est sauvegardée par personne.** Elle vit sur
l'origine `gmos://`, et la sauvegarde du 28/08 ne couvre que `gmos-state-db`.
Combiné à la règle ci-dessus — *la fiche fait foi* — cela veut dire que **le
magasin qui détient la vérité est le seul qui ne soit pas protégé**. C'est le
chantier n° 5.

### ✅ L'hôte est livré le 2026-08-28 — côté meneur

Une bascule **Fiche du jeu / Formulaire** dans `CharacterSheetEditor`, qui
n'apparaît que si le jeu a une `correspondance.json` : proposer un écran vide
serait pire que ne rien proposer. Quatre modules dans `src/modules/fiches/`,
54 tests, et **aucun ne touche le store** — l'hôte rend ses conclusions par
rappel, et le seul endroit qui écrit reste celui qui écrivait déjà.

| | |
| --- | --- |
| `pontDeLaFiche.ts` | Le contrat par messages en promesses. Vérifie l'**émetteur** (`event.source`, la seule preuve incontrefaisable — le canal seul ne prouve rien), rend la main au bout de 15 s, et corrèle **par identifiant** puisque le moteur diffuse un `change` *avant* de répondre à un `set`. |
| `rapprochementDeLaFiche.ts` | La fiche fait foi. **`16` et `"16"` ne sont pas une divergence** — comparer strictement crierait sur chaque champ numérique à chaque ouverture, et on apprendrait à ignorer le journal. **Remplir n'est pas écraser.** |
| `journalDesDivergences.ts` | Par `appBridge.logger` → `main.log`. Le chemin existait de bout en bout : **aucun IPC nouveau**, et c'est le seul qui survive à la fermeture. Pas `auditNotice` — une donnée écrasée n'est pas un incident de sécurité. |
| `FicheHote.tsx` | L'iframe et la liaison. **GM-OS ne pousse qu'à la création** : semer ailleurs rouvrirait la question de qui gagne à chaque frappe. Une fiche liée disparue n'est pas recréée d'office — ce serait un doublon silencieux. |

`ficheId` est posé sur `PlayerCharacter` : c'est le seul lien entre les deux
bases, et il pointe vers une base que GM-OS ne détient pas. L'iframe est montée
à la première bascule puis **gardée montée et masquée** — elle charge sept
mégaoctets de fonds de page.

### ✅ Le second écran est livré le 2026-08-28 — la tablette a sa fiche

⚠️ **Recadrage de David, et il change la priorité :** *« la fiche HTML n'est pas
un outil du meneur, c'est un outil d'immersion des joueurs, d'où l'importance
qu'ils puissent le voir sur leurs tablettes. »* L'option « la tablette garde son
écran actuel », que j'avais recommandée comme la plus sage, enlevait exactement
ce à quoi la fiche sert. Elle est écartée.

**Le port distinct — `electron/serveurDesFiches.ts`, port 3002.** L'écran du
meneur marche parce que `gmos://media/…` est une **autre origine** que le
cockpit : c'est cette séparation qui impose `postMessage`, et c'est elle qui
protège les données du cockpit d'un HTML régénéré par un GPT. Ajouter `.html` aux
types servis par le `SyncServer` aurait été **une ligne** — et aurait mis la fiche
sur l'origine du Player Hub, avec accès à son stockage. *L'isolation ne vient pas
du protocole, elle vient de la différence d'origine* : un second port la rend à
la tablette pour le même prix.

Le serveur ne sert que deux formes d'adresse — `/fiches/….html` et
`/systems/<jeu>/fiche/….json` (la tablette n'a pas `readDoc`) — ne liste jamais un
dossier, n'écrit jamais, et ne sort jamais de `docs/`. `cheminServi` est pure et
éprouvée seule : *un serveur sur `0.0.0.0` voit passer ce que le réseau lui
envoie, pas ce qu'on avait prévu.*

**⚠️ La bibliothèque du moteur vit PAR APPAREIL**, et ça ne se devine pas : une
base IndexedDB appartient à une origine **et** à un navigateur. Les fiches du
meneur n'existent pas sur la tablette du joueur, et aucun réglage n'y changera
rien. D'où deux modes de liaison dans `FicheHote` :

| Mode | Où | Ce qu'il fait |
| --- | --- | --- |
| `bibliotheque` | Meneur | Choisit dans la bibliothèque du moteur ; l'identifiant se range sur le PJ. |
| `locale` | Tablette | **Rien à choisir.** Sème une fiche depuis ce que GM-OS sait du PJ, et retient son identifiant sur l'appareil. *La vérité reste celle de GM-OS, la tablette la redessine.* |

**Le chemin d'écriture de la tablette est posé** —
`remoteUpdateCharacterSheetData`, calqué sur `remoteUpdateCharacterNarrative` et
**pas** sur `remoteUpdateCharacterVitals` qui ne diffuse rien. Sans lui, un joueur
remplissait sa fiche et **rien n'arrivait** : la pire des issues, parce qu'il ne
l'aurait appris qu'à la séance suivante. `sheetData` s'y **fusionne** et ne se
remplace jamais — la fiche ne connaît que les champs de la table, et remplacer
l'objet entier perdrait tout ce que le meneur tient à côté. Côté réception,
l'action passe par `updateCharacter` et **pas** par la variante `remote`, sinon
elle rediffuserait à l'envoyeur — un aller-retour sans fin.

Restent les étapes 5 et 6 du document de correspondance : la convergence sur le
`hotspot` et le retour de `humanite` par la Forge.

### Le plan d'origine, conservé pour ce qu'il garde de vrai

0. ⚠️ **METTRE LE FICHIER À L'ABRI — trouvé le 2026-08-24.** `alien_character_sheet_v2.html`
   (1,6 Mo, 85 lignes, images embarquées) est posé **à la racine du dépôt et n'est pas suivi par git**.
   C'est la **seule copie** de la matière de tout ce chantier, et un `git clean` la détruirait sans un
   mot. *Le premier geste n'est pas de coder l'hôte, c'est de commiter le fichier* — et de décider où
   vivent les fiches (`docs/fiches/<systeme>/` ?), puisque le plan en veut **une par PJ**.
1. **L'hôte** — une iframe qui affiche le fichier d'un PJ, côté MJ, en bascule.
2. **L'adaptateur** — ⚠️ **détourner `save()` EN PREMIER**, avant d'ajouter quoi
   que ce soit. En iframe sandbox, `localStorage.setItem` **lève**, et l'écriture
   n'a pas de `try/catch` (ligne 78) alors que la lecture en a un (ligne 80) :
   **la fiche s'ouvrirait parfaitement et mourrait à la première frappe.**
   Le fichier n'a **qu'un** écouteur global, donc remplacer `save` capture toute
   la saisie. Masquer aussi *Exporter / Importer / Réinitialiser*.
3. **L'appairage** — normalisation **des deux côtés** (`carriere` ↔ `Carrière`),
   et repli des clés numérotées **aller-retour** : `stress_0..9` est dix booléens
   côté HTML et **un** champ côté GM-OS ; `equip_1..10` est l'`inventory`.
4. **L'épreuve** — modifier dans GM-OS et le voir dans la fiche ; cocher dans la
   fiche et le voir dans `sheetData`. *Les deux sens, ou rien.*
5. ⛔ **Le chemin d'écriture de la tablette** — `remoteUpdateCharacterSheetData`,
   son nom dans `remote.types.ts`, son entrée dans `sessionActions.ts`.
   **Bloquant** pour l'édition côté joueur. Il doit suivre
   `remoteUpdateCharacterNarrative` et **pas** `remoteUpdateCharacterVitals`, qui
   ne diffuse rien du tout.
6. **L'iframe côté tablette**, une fois le retour possible.
7. **L'impression** — offerte, le fichier a déjà son `@media print` paysage.
8. **Le repli** — la peau générée et ses trois briques (octogone, piste, réglé),
   pour les jeux sans fichier HTML.

**Annulé par le renversement**, à ne pas ressortir : `GeometrieDeFiche` ·
la fenêtre Electron cachée · l'extraction du scan · l'éditeur de calque ·
le `ResizeObserver`.

---

## Si on devait en reprendre un

**Le n° 1 — le défilé des quarts.** Il est passé devant le 2026-08-23 : la
décision est prise, **il a une date** (la prochaine séance de Blade Runner), et
il ne coûte qu'une soirée puisqu'il n'a rien à brancher. *Un chantier qui a une
date passe avant un chantier qui n'en a pas.* Il ne lui manque qu'un choix : d'où
se pousse le Quart.

**Le n° 3, section 3a, étape 1**, si on veut du code sans date. Aucune décision
requise, ça corrige un défaut visible aujourd'hui (l'accent et sa lueur ne sont
pas de la même couleur), et c'est borné.

**Le n° 2 ne peut pas commencer** tant que ses deux questions ne sont pas
tranchées : elles mènent à deux codes différents, et se tromper coûterait tout le
module.

---

# 4 · Sauvegarde des images

📄 **Fait foi :** `documentation/Planning/2026-08-27-sauvegarde-automatique.md`, § 7
🧠 **Mémoire :** `gm-os-sauvegarde-automatique`

**Ouvert le 2026-08-28**, découvert en mesurant, pas en cherchant.

**Ce que la mesure dit.** La sauvegarde automatique livrée le 28/08 est une
**sauvegarde de pointeurs**. Une carte de l'atlas porte
`"fileUrl": "m-<uuid>"` — un identifiant, dont les octets vivent ailleurs. Il y a
**trois** bases IndexedDB, et une seule est sauvegardée :

| Base | Contenu | Sauvegardée ? |
| --- | --- | --- |
| `gmos-state-db` | l'état de session | ✅ depuis le 28/08 |
| **`gmos-media-db`** | **les images** (`useMediaStore`) — ~263 Mo | ❌ **par personne** |
| `gmos-fog-data` | le brouillard de guerre | ❌ |

L'export du 7 août fait 498 Ko, porte **0 image** et **29 références**. Celui
d'avril faisait 33,8 Mo parce que les images y étaient encore en base64 dans
l'état : le facteur 66 est un **changement de modèle**, pas une optimisation.

> **Ce n'est pas une régression** — rien ne sauvegardait les images avant non
> plus. Mais restaurer sur un profil neuf rendrait les campagnes complètes avec
> **des cartes mortes**. C'est ce que ce chantier existe pour éviter.

## ✅ CONSTRUIT le 2026-08-29 — un miroir, pas des instantanés

**La mesure a changé la réponse.** Comptés sur la machine de David : **115
images, 261 Mo**, ~2,3 Mo pièce, 506 Go libres. Ma recommandation du 28 — « un
instantané séparé et rare » — coûtait **trois gigaoctets** avec la rotation de
douze, pour des fichiers qui ne changent jamais : *une carte ne change pas, on en
ajoute.* D'où un **miroir** : chaque image écrite **une seule fois**, jamais
réécrite. Premier passage 261 Mo, les suivants ne coûtent que les nouveautés.

**✅ Décision de David : le miroir GARDE TOUT.** Une image supprimée dans GM-OS
reste dans le miroir. *Une suppression accidentelle qui se propage au filet le
rend inutile le jour où il servirait.* Prix assumé : l'espace ne redescend jamais
seul — un geste de nettoyage explicite, qui dira ce qu'il s'apprête à supprimer,
viendra plus tard. Il n'y a donc **aucune rotation** ici, et c'est délibéré : la
rotation existe pour des copies complètes interchangeables ; ici chaque fichier
est unique.

**✅ Décision de David : le brouillard de guerre part avec.** C'était la
troisième base non sauvegardée. Il est copié **à chaque passage** et non une
seule fois — une image ne change pas, un brouillard si, et le figer au premier
passage archiverait une carte entièrement masquée.

| | |
| --- | --- |
| `electron/miroirDesMedias.ts` | Les trois règles du 28/08 tiennent : aucun git, jamais sous `APP_ROOT`, ne touche que ses fichiers. Un seul point fabrique un chemin, valide l'entrée **et** vérifie la sortie. Écriture atomique **et relue** — *une copie tronquée est pire qu'une absence, elle a l'air d'une copie.* |
| `mediasCopies()` | Ce qui rend l'incrément possible. **Sans elle il faudrait relire 261 Mo à chaque passage**, et la sauvegarde de sortie — quatre secondes — n'en aurait jamais le temps. |
| `catalogue.json` | Ce que chaque octet représente. **Fusionné, jamais remplacé** : une image oubliée par GM-OS garde sa fiche, sinon on conserverait un fichier dont on ne saurait plus le nom. |
| `MiroirDesMedias.ts` | Une copie à la fois — 115 blobs en parallèle, c'est un quart de gigaoctet en mémoire pour un travail que le disque sérialise. |

**Les images passent APRÈS l'état de session, jamais avant.** L'état est la
partie irremplaçable et la plus rapide à écrire. Et le miroir **ne lève jamais** :
une image illisible se compte et le passage continue — *un filet qui refuse de
poser la moitié qu'il peut poser ne vaut pas mieux qu'un filet absent.*

### ✅ Le premier passage, mesuré sur le disque le 2026-08-29

**116 fichiers, 260,8 Mo, zéro partiel**, catalogue présent. Par nature : 100
images, 14 sons, 1 vidéo — plus le **brouillard de guerre, 219 Ko**. Le catalogue
nomme chaque octet (`m-94211ee4-…` → `lieu-hotel-artemide.jpg`) : sans lui, une
restauration rendrait des fichiers anonymes.

*Les campagnes de David ne sont plus une sauvegarde de pointeurs.*

### ✅ Le retour, écrit le 2026-08-29

`mediasRestituables()` dit **combien** avant de proposer quoi que ce soit — *un
bouton qui ne dit pas ce qu'il va faire n'est pas cliqué le jour où il faudrait,
et il est cliqué le jour où il ne faudrait pas.* Le bandeau vit dans la
bibliothèque des médias et n'apparaît que si le miroir porte ce qu'elle n'a plus.

**Deux règles, et la seconde est celle qui fait qu'une restauration sert :**

1. **Jamais d'écrasement.** Un média déjà présent est plus récent que la copie.
2. **L'identifiant d'origine est conservé.** `addMedia` en fabrique un neuf, ce
   qui est juste pour un ajout et **ruineux pour une restauration** : une carte
   porte `"fileUrl": "m-<uuid>"`, et remettre les octets sous un autre
   identifiant donnerait un disque plein et des cartes toujours mortes — *le pire
   des résultats, parce qu'il a l'air d'une réussite.* D'où
   `restaurerUnMedia`, qui écrit sous l'identifiant reçu.

Le brouillard se remet **clé par clé et seulement s'il manque** : le remettre en
bloc écraserait ce que le meneur a dévoilé depuis.

✅ **ÉPROUVÉ EN RÉEL par David le 2026-08-29.** Image supprimée, application
relancée, bandeau apparu, image revenue **et réaffichée là où elle servait** —
c'est cette dernière ligne qui prouve que l'identifiant d'origine a été conservé,
et c'était le seul vrai risque.

⚠️ **Le bandeau avait d'abord été posé dans `ImageDashboard`** — Image-OS —
alors que David gère ses médias dans le **Media Hub** (`MediaBrowser`). Il a
supprimé une image et n'a rien vu. *Un filet rangé là où personne ne regarde
n'est pas un filet.* Il vit désormais dans les deux, et dans le Media Hub il est
**juste au-dessus de « Purger le hub global »** : au-dessus du geste après lequel
on en aura précisément besoin.

**Ce qui est déjà acquis et ne sera pas à refaire :** les trois règles de
construction (aucun git · jamais sous `APP_ROOT` · ne supprime que ses propres
fichiers), l'écriture atomique relue, et la rotation. Un instantané des médias
réutilise tout ça — il ne change que **la source** et **la cadence**.

---

# 5 · Sauvegarde de la bibliothèque des fiches

📄 **Fait foi :** ce document, plus `2026-08-27-sauvegarde-automatique.md` pour la
plomberie
🧠 **Mémoire :** `gm-os-sauvegarde-automatique`, `gm-os-fiches-de-personnage`

**Ouvert le 2026-08-28**, à la demande de David : *« rattache sur un chantier de
sauvegarde à part »*. Tenu séparément du n° 4 **parce qu'il n'attend aucune
décision** — le n° 4 est bloqué, celui-ci attend seulement que l'hôte existe.

**Ce qui l'ouvre.** La décision du 28/08 sur le chantier 3b : le moteur de fiches
garde sa bibliothèque, et **la fiche fait foi**. Or cette bibliothèque vit dans
l'IndexedDB de l'origine `gmos://` — pas dans `gmos-state-db`. **Le magasin qui
détient la vérité d'une fiche de personnage serait donc le seul qui ne soit pas
sauvegardé**, dans une application qui a déjà perdu ses campagnes deux fois.

| Base | Contenu | Sauvegardée ? |
| --- | --- | --- |
| `gmos-state-db` | l'état de session | ✅ depuis le 28/08 |
| `gmos-media-db` | les images — ~263 Mo | ❌ chantier n° 4 |
| `gmos-fog-data` | le brouillard de guerre | ❌ chantier n° 4 |
| **la base du moteur de fiches** | **personnages ET gabarits importés** | ❌ **celui-ci** |

**Ce qui rend ce chantier plus facile que le n° 4, et c'est la raison de le
tenir à part :**

- **Le moteur sait déjà s'exporter.** `backup()` rend un JSON
  `character-sheet-manager-backup` avec les gabarits non intégrés et tous les
  personnages, et `restore()` le relit. Il n'y a **rien à inventer** — juste à
  appeler ça depuis la couture plutôt que depuis un bouton.
- **C'est du texte, pas des octets.** Aucun problème de volume, donc aucune
  question de cadence ni de déduplication : c'est précisément ce qui bloque le
  n° 4.
- **La plomberie du 28/08 se réutilise telle quelle** — les trois règles,
  l'écriture atomique relue, la rotation. Comme pour le n° 4, seule **la source**
  change.

**Les TODO, dans l'ordre :**

1. ✅ **FAIT le 2026-08-28 — `backup` est au contrat `postMessage`**, publié dans
   le même passage que `list`, `openCharacter` et `create`.
2. ✅ **FAIT le 2026-08-29 — la copie entre dans la sauvegarde automatique**, sous
   `modules.fiches`, avec la date de sa prise.
3. ✅ **ÉPROUVÉE EN RÉEL le 2026-08-29, ALLER ET RETOUR.**
   **L'aller**, lu dans le fichier : `gmos-auto-2026-08-29T16-12-54.json` porte
   `modules.fiches` — **4 personnages, 69 champs chacun**, gabarit
   *Blade Runner FR*, copie prise à 18h11 et sauvegarde écrite à 18h12 en
   fermant l'application. Zéro gabarit embarqué, comme prévu : les intégrés
   reviennent avec le fichier du moteur.
   **Le retour**, par David : bibliothèque vidée, bouton cliqué, fiches revenues.
   *Une sauvegarde qu'on n'a jamais restaurée n'est pas une sauvegarde* — celle-ci
   l'a été.

### ✅ Construite le 2026-08-29

**Quand la copie est prise — tranché par David.** *Quand une fiche est ouverte
sur l'écran du meneur*, contre l'autre option : une iframe cachée en permanence,
sept mégaoctets tenus en mémoire pour un service rendu deux fois par séance.

| | |
| --- | --- |
| `useBibliothequeDesFiches` | Le magasin de la copie, persisté avec la **garde d'écriture du MJ** — c'est le huitième store à la recevoir. `priseLe` voyage avec le contenu : *une sauvegarde dont on ignore la fraîcheur est pire qu'une sauvegarde absente.* |
| `FicheHote` | Emporte la copie à chaque ouverture et à chaque saisie, groupée sur deux secondes. **Jamais en liaison `locale`** : la bibliothèque d'une tablette n'est qu'un reflet semé depuis GM-OS, et la sauvegarder l'écrirait par-dessus l'original. |
| `construireLaSauvegarde` | La range sous `modules.fiches`. Absente quand aucune fiche n'a jamais été ouverte — le cas normal. |
| couture v2 | `restore` rejoint `backup`. Il **ajoute et remplace par identifiant, il ne vide jamais** : ce qui n'est pas dans la sauvegarde reste en place. |

**⚠️ Le garde-fou qui empêche ce filet de devenir le second mécanisme de perte :
un instantané vide n'en remplace jamais un plein.** Le moteur répond aussi sur un
profil neuf, ou quand la bibliothèque a été vidée à la main — écraser une copie
de quatre personnages par une copie vide archiverait le vide. *C'est le refus de
rétrécissement de la sauvegarde automatique, appliqué ici mot pour mot.* Un
rétrécissement qui ne vide pas passe : c'est une suppression voulue.

**La restauration est offerte là où elle a du sens et nulle part ailleurs** : une
bibliothèque vide alors que GM-OS en garde une copie — le profil neuf, l'appareil
changé. La proposer sur une bibliothèque garnie inviterait à écraser des fiches
vivantes par une copie plus ancienne.

> **Ce que la copie ne voit pas, et il faut le dire :** une fiche modifiée en
> ouvrant le fichier HTML **hors de GM-OS**. La copie date de la dernière fois
> qu'une fiche a été ouverte dans le cockpit, et `priseLe` est là pour qu'on
> puisse le constater.
