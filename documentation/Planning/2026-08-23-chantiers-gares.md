# Chantiers garés — le registre qui se rappelle d'un coup

**Nature de ce document : registre vivant, pas instantané daté.** Contrairement
aux `etat-et-reprise`, celui-ci **se met à jour** — on y coche, on y ajoute, on
en retire ce qui est fait. C'est le seul endroit où vit la liste des idées garées.

**Ouvert le 2026-08-23.** Trois chantiers — **le n° 1 est construit le jour même**, les deux autres attendent.

> **Revérifié dans le code le 2026-08-24**, chantier par chantier, sans rien recopier d'un document.
> Base saine : `tsc -b` propre, **2 321 tests au vert** (190 fichiers, 1 ignoré). Les trois états
> ci-dessous sont confirmés. **Quatre documents disaient faux et ont été corrigés le même jour** — le
> doublon des Quarts (supprimé), les confirmations de suppression (posées), le mode hors carte du Cortex
> (construit), et les chiffres du corpus. *Une liste de restes qui vit à deux endroits en désigne un
> faux* — c'est la troisième fois que ce document paie cette règle.

---

## La vue d'un coup d'œil

| # | Chantier | État | Le premier geste | Bloqué par |
| --- | --- | --- | --- | --- |
| 1 | **Afficheur Ulanzi** | ✅ **CONSTRUIT le 23/08** | **L'essayer en séance** — et surtout vérifier la **restitution** en la fermant | Rien |
| 2 | **Deck-OS — garder la carte** | **Rien décidé** | Trancher les deux questions ci-dessous | Deux décisions de David |
| 3a | **Thème par jeu** | ✅ **LIVRÉ le 24/08** | — *vérifié en réel sur Hadley Hope* | Rien |
| 3b | **Fiche HTML** | Plan **écrit**, sujet 2 renversé | Commiter le fichier HTML, puis l'hôte iframe | Rien — prêt à partir |

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

## 3b · La fiche — les TODO

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
