# Refonte de l'interface — le plan

> **Architecture** : `documentation/Architecture/Refonte-Interface.md`. Ce
> document-ci ne redit pas l'état des lieux ; il dit **dans quel ordre on avance,
> ce qui le prouve, et ce qu'on refuse de faire.**
>
> Ouvert le **2026-09-17**. **Rien n'est commencé.** David joue d'abord une partie
> sur la version actuelle.

---

## 1 · L'objectif — deux buts, et le second contraint le premier

**A · Le fini.** Amener GM-OS au niveau des trois maquettes **sans refaire les
mises en page**, en rendant l'apparence pilotable depuis un seul fichier — et en
pouvant *juger le résultat en séance réelle avant d'avoir payé la migration*.

**B · L'adaptation au jeu.** ⭐ *« Je veux aussi que les thèmes de l'interface,
voire même des éléments visuels de l'interface, s'adaptent avec le jeu »* — David,
2026-09-17. **Le pont existe déjà et fonctionne** : huit jetons, la polarité,
l'échelle de texte et les polices (§ 8 de l'architecture). Il s'agit de
l'**étendre**, pas de l'inventer.

⚠️ **B contraint A, et pas l'inverse.** Chaque échelle ajoutée pour le fini doit
décider le jour même si le jeu peut la piloter — sinon on pose des jetons que le
jeu ne pourra jamais habiller, et il faudra rouvrir 214 fichiers pour le corriger.
*C'est la seule décision de ce chantier qui soit réellement difficile à défaire.*

---

## 2 · Les sept phases, et pourquoi cet ordre

| Ph. | Ce qu'on fait | Fichiers touchés | Réversible ? | Estimation |
| --- | --- | --- | --- | --- |
| **0** | Le filet : captures de référence, gardes automatiques | e2e + tests | — | 1 soirée |
| **1** | Les échelles manquantes (état, texte secondaire, élévation) | 1–2 | **oui, d'une ligne** | 1–2 soirées |
| **2** | Les directions visuelles, avec Stitch — jetables | 1 (valeurs) | **oui, d'une ligne** | 1 soirée + décision |
| **3** | Les primitives du socle | ~8 nouveaux | oui (rien ne les emploie encore) | 2–3 soirées |
| **4** | La migration, module par module | ~214 | par commit | **le gros** — 10 à 20 soirées |
| **5** | Le fini : halos, focus, bordures | primitives | oui | 2 soirées |
| **6** | ⭐ **Le paquet de thème du jeu** — matières, ornements, icônes (V2/V3/V4) | primitives + un chargeur | oui | **sous-chantier** — 6 à 10 soirées |

⭐ **La propriété qui rend ce plan sûr** : à la fin de la phase 2, David a **vu le
nouveau rendu dans sa vraie application, avec ses sept campagnes**, pour environ
trois soirées de travail — et peut tout annuler d'une ligne. La décision d'engager
les quinze soirées suivantes se prend **après** avoir vu, jamais avant.

---

## 3 · Phase 0 · Le filet — avant de toucher au style

*Un chantier qui change 214 fichiers d'habillage a besoin de savoir ce qu'il a
changé sans le vouloir.*

### T0.1 · Captures de référence, un panneau à la fois

`e2e/tousLesModules.spec.ts` ouvre déjà **chaque panneau de la barre latérale**
dans la vraie application Electron, via `ouvrirLeModule`. Il ne fait aujourd'hui
qu'une chose : vérifier que ça ne crie pas. **`toHaveScreenshot` n'est employé
nulle part dans le dépôt.**

On ajoute une capture par panneau.

⚠️ **Ce que ces captures prouvent, et ce qu'elles ne prouvent pas.** Une refonte
délibérée les fera **toutes** diverger — leur valeur n'est donc pas « rien n'a
changé », c'est **« seul ce que je visais a changé »**. On les régénère à chaque
étape acceptée, et on *regarde* le diff des modules qu'on n'a pas touchés. *Une
capture qu'on régénère sans la lire ne teste plus rien.*

### T0.2 · La garde des couleurs d'état

Le dépôt sait déjà lire ses propres sources dans un test —
`src/components/frontiereDuChassis.test.ts`, `markdownEnUnSeulEndroit.test.ts`.
On copie le motif : un test qui refuse une couleur de palette brute dans les
modules **déjà migrés**, avec une liste qui grandit à chaque module.

*Le garde-fou grandit avec la migration. Posé à la fin, il n'aurait protégé que ce
qui restait à faire.*

### T0.3 · La garde de contraste — celle qui aurait évité deux défauts connus

Un test qui calcule le contraste WCAG de chaque paire (texte, fond) des jetons,
**pour les quatre thèmes**, et échoue sous le seuil.

⭐ **Ce test n'est pas théorique : ce dépôt a payé deux fois exactement ça.**
`#334155` sur le fond de Light-OS donnait **1,6** de contraste — invisible. Le
champ de recherche du Media Hub était à **5 % d'opacité** — une fonctionnalité
entière introuvable. *Aucune relecture ne les avait vus ; un nombre les aurait vus
tous les deux.*

### T0.4 · Le relevé de départ

`tsc -b`, `npm run validate`, le nombre de tests, et les comptes de classes brutes
gelés dans l'architecture (§ 2.2). C'est contre eux qu'on mesurera la fin.

---

## 4 · Phase 1 · Les échelles manquantes — un fichier, effet global

Tout entre dans `themeDeLInterface.ts` (R1 : un seul écrivain), avec les alias
correspondants dans `tailwind.config.js`.

| Tâche | Ce qu'on ajoute | Ce que ça résorbe |
| --- | --- | --- |
| **T1.1** | `--app-text-muted` — **valeur par défaut + alias Tailwind** | les **542** `text-slate-400/500`, ⛔ **et 4 classes mortes** (voir ci-dessous) |
| **T1.2** | `--etat-succes / danger / alerte / info` + leurs teintes de fond et de bordure | ~**900** classes emerald / red / amber |
| **T1.3** | `--elev-1/2/3` (ombre + bordure haute), `--rayon-sm/md/lg` | le relief des maquettes |
| **T1.4** | Substitution mécanique de T1.1 sur tout `src/` | — |
| **T1.5** | Les quatre thèmes reçoivent leurs valeurs, pas seulement `cyberpunk` | *une échelle définie pour un seul thème casse les trois autres en silence* |
| **T1.6** | ⭐ **L'entrée dans `PONT` de chaque nouvelle échelle** (`--rpg-etat-*`, `--rpg-rayon`…) | l'exigence « l'interface s'adapte au jeu » — **R2** |
| **T1.7** | ⭐ **La dérivation des 7 accents `gm-*`** depuis l'accent effectif, + suppression de `gm-teal` et `gm-orange` (employés nulle part) | **Q3** — et ⚠️ deux garanties : contraste ET distance entre frères (**R7**) |

⛔ **T1.1 répare un défaut existant, il n'invente rien.** `PONT` mappe déjà
`muted → --app-text-muted`, mais **aucune palette ne lui donne de valeur et aucun
alias Tailwind ne l'expose** — pendant que `JournalDashboard.tsx` emploie
`text-app-text-muted` **quatre fois** (l. 315, 323, 345, 350). Ces classes ne
produisent aucune règle : trois sont rattrapées par un `opacity-50` voisin, la
quatrième s'affiche en pleine intensité. *Même motif que les 125 `animate-in` sans
greffon — une classe qui n'existe pas ne prévient pas.*

⚠️ **T1.6 n'est pas une finition, c'est la tâche la plus difficile à défaire du
plan.** Un jeton posé sans entrée dans le pont est un jeton que le jeu ne pourra
jamais habiller, et le corriger plus tard veut dire rouvrir chaque module.

⚠️ **T1.4 est mécanique, donc dangereux.** `text-slate-500` ne veut pas *toujours*
dire « texte secondaire » — il y a des cas où c'est un état désactivé. On
substitue, puis **on lit les captures de T0.1 module par module**. C'est
précisément le travail pour lequel le filet a été posé en premier.

---

## 5 · Phase 2 · Les directions — et c'est là que Stitch sert

*C'est la phase où David décide, et la seule qui ait besoin d'un outil de design.*

| Tâche | Qui | Quoi |
| --- | --- | --- |
| **T2.1** | David | Captures de **ses écrans réels** (pas des descriptions) données à Stitch — la mise en page est déjà validée par de vraies parties |
| **T2.2** | Stitch | 4 à 5 directions, exportées en **Tailwind** |
| **T2.3** | Claude | Chaque direction traduite en **valeurs C0 seulement** — aucune structure, aucun composant repris |
| **T2.4** | David | Jugement **dans l'application réelle**, sept campagnes, de préférence un soir de jeu |
| **T2.5** | David | **Décision** : une direction, ou aucune |

**Pourquoi ne pas coller le code de Stitch.** Il génère du neuf : il ne connaît ni
les magasins, ni l'i18n, ni les 27 modules, ni la forme des vraies données. Collé
tel quel, il produirait **un 28ᵉ module qui ne ressemble pas aux 27 autres** —
l'inverse du but.

**Le MCP de Stitch : pas ici.** Il n'améliore que la *lecture des valeurs* (lire
`#0f172a` au lieu de le deviner sur un JPEG). Réel, mais marginal tant qu'on ne
fait pas d'allers-retours. Il se justifiera si la phase 2 tourne en boucle. Le jour
venu : vérifier l'identité du paquet avant de l'exécuter (deux dépôts GitHub
portent une description strictement identique), et la clé donne accès au compte
Stitch.

---

## 6 · Phase 3 · Les primitives — `src/components/socle/`

Construites **d'après la direction retenue**, jamais avant.

| Tâche | Primitive | Ce qu'elle porte |
| --- | --- | --- |
| **T3.1** | `<Panneau>` | les 3 élévations, le rayon, la bordure haute claire |
| **T3.2** | `<Bouton>` | variantes neutre / accent / succès / danger, états repos-survol-actif-désactivé, halo au focus |
| **T3.3** | `<Tuile>` | la carte cliquable — ⚠️ *la tuile est un carré fixe : ce qu'on y ajoute pousse ce qui y était* |
| **T3.4** | `<Jauge>` | ⚠️ une jauge a **cinq lecteurs** dans ce dépôt, dont l'Ulanzi qui emploie d'autres noms. Cette primitive habille les jauges d'écran **et ne touche à aucun** des quatre drapeaux ni au code couleur en fractions de course |
| **T3.5** | `<Etiquette>`, `<EnTeteDeModule>` | le titre de module, le compteur, l'état |

Chacune : un test unitaire de ses variantes, et son entrée dans les captures.

⭐ **C'est ici que se joue « les éléments visuels s'adaptent au jeu ».** Les
primitives sont les seules à connaître la forme — rayon, bordure, relief. Si le
jeu doit pouvoir la piloter (lecture **V1** du § 8.5 de l'architecture), elles
doivent lire un jeton, pas une valeur en dur, **dès leur écriture**. Décidé après,
il faut rouvrir les six.

⚠️ **Et elles doivent survivre à un thème absent ou partiel.** La plupart des jeux
n'auront jamais de `theme.css` — *c'est le cas normal, pas une erreur.* Chaque
jeton lu par une primitive a donc un repli, comme le fait déjà
`pontVersLInterface`.

---

## 7 · Phase 4 · La migration — l'ordre, et pourquoi

⭐ **On commence par les trois écrans dont David a déjà les maquettes.** Combat,
Dice et Image sont exactement les trois rendus apportés le 2026-09-17 : ce sont
les seuls modules où la comparaison « visé / obtenu » est immédiate. Et ils pèsent
**23 fichiers** à eux trois — un lot pilote de la bonne taille pour éprouver les
primitives avant de les répandre.

| Lot | Modules | .tsx | classes | Pourquoi ici |
| --- | --- | ---: | ---: | --- |
| **L1 — pilote** | `combat`, `dice`, `image` | 23 | 289 | Les trois maquettes. Éprouve les primitives. |
| **L2** | `music`, `light`, `sound`, `ambient` | 23 | 290 | Vus à chaque séance |
| **L3** | `map`, `forge` | 29 | 541 | Gros, mais autonomes |
| **L4** | `remote`, `favorite`, `clock`, `npc` | 38 | 577 | |
| **L5** | `session` — **découpé par sous-dossier** | 95 | 1 164 | 28 % à lui seul. Jamais en une fois. |
| **L6** | les 18 restants + `components/` | ~80 | ~800 | |

**Règle de lot** (R5) : un module migré est complet, testé, et **jouable le soir
même**. Un commit par module. Jamais de module à moitié refait au coucher.

Après L1, on s'arrête et on rejoue une séance. *Si les primitives sont fausses,
c'est après 23 fichiers qu'il faut le découvrir, pas après 214.*

---

## 8 · Phase 5 · Le fini

Halos sur l'élément actif (le `shadow-glow-*` existant, enfin doté d'une règle
d'emploi), anneau de focus visible au clavier, bordures en dégradé des maquettes,
transitions. Tout dans les primitives : **aucun module n'est rouvert**.

---


---

## 9 · Phase 6 · Le paquet de thème du jeu — V2, V3, V4

> ⭐ **Décidé par David le 2026-09-17** : les quatre lectures d'« éléments visuels »
> sont retenues. V1 (la forme) est déjà dans les phases 1 et 3 ; **cette phase-ci
> porte les trois autres.** Conception détaillée : § 8.6 de l'architecture.

*Un sous-chantier, pas une finition. Il a sa propre décision d'entrée : on n'y va
que si les phases 1 à 5 ont tenu leurs promesses en séance.*

| Tâche | Quoi | Dépend de |
| --- | --- | --- |
| **T6.1** | Le **chargeur de paquet** : lit `ornements.json` / `icones.json` par `readDoc`, **confine tout chemin au dossier de thème du jeu**, et rend `null` sans paquet | — |
| **T6.2** | **V2 · Matière** — un jeton de fond de panneau, lu par `<Panneau>` ; SVG ou dégradé d'abord, matriciel par `gmos://` si besoin | T6.1, `<Panneau>` |
| **T6.3** | La **garde de contraste sur matière** : le texte reste lisible sur la texture, pas seulement sur la couleur | T6.2, T0.3 |
| **T6.4** | **V3 · Ornements** — le vocabulaire des **fentes** (`entete`, `coin`, `separateur`, `fond`), exposées par les primitives | T6.1, phase 3 |
| **T6.5** | **V4 · Icônes** — résolution `nom GM-OS → fichier du jeu`, **repli systématique sur `lucide-react`** | T6.1 |
| **T6.6** | Un **paquet témoin** sur un vrai jeu, pour éprouver le tout de bout en bout | tout |

### Les trois règles de cette phase

**P1 · Tout est facultatif, tout a un repli.**
La grande majorité des jeux n'auront jamais de paquet — *c'est le cas normal, pas
une erreur.* Un paquet partiel, incohérent ou absent ne doit jamais casser une
interface. C'est déjà l'esprit de `pontVersLInterface`, jeton par jeton.

**P2 · Surcharge partielle pour les icônes.**
Un jeu déclare **les icônes qui lui importent**, jamais les quatre cents.
*Quinze icônes bien choisies font un thème ; quatre cents font un projet mort.*

**P3 · Un thème ne s'exécute pas.**
Des valeurs et des fichiers. Aucun script, aucune mise en page, et **aucun chemin
qui sorte du dossier de thème du jeu** — le protocole `gmos` sert n'importe quel
chemin absolu, et un thème est du contenu déposé, pas du code du dépôt.

### ⚠️ Le seul coût de rupture du chantier

Le vocabulaire des **fentes d'ornement** se fige une fois. Chaque fente ajoutée
ensuite oblige à rouvrir les primitives **et** invalide les paquets déjà écrits
par les jeux. *C'est la seule décision de tout ce plan qui engage quelqu'un
d'autre que nous.*

## 10 · Les essais — ce qui prouve quoi

| Niveau | Outil | Ce que ça attrape | Ce que ça n'attrape pas |
| --- | --- | --- | --- |
| Jetons | Vitest | une échelle incomplète, un thème oublié, un contraste sous le seuil | le laid |
| Frontière | Vitest (motif `frontiereDuChassis`) | une couleur brute revenue dans un module migré | — |
| Primitives | Vitest + Testing Library | une variante manquante, un état non rendu | l'aspect |
| Écran | Playwright, vraie app Electron | une mise en page cassée, un module qui ne monte plus | — |
| **Données hostiles** | Playwright | ⭐ **le risque du § 7 de l'architecture** : 11 combattants, un nom de 24 signes, `148/155`, une jauge à 0 | — |
| Réel | David, en séance | **tout le reste** | — |

⛔ **`npx vitest run` sans bride rend les 263 fichiers en échec** sans avoir
exécuté un seul test. Toujours `--maxWorkers=4`, ou `npm run validate` qui le fait.

⚠️ **Aucun test ne dira si c'est beau.** Ce chantier est le seul du dépôt dont le
critère d'acceptation est un jugement — d'où la phase 2, qui existe uniquement
pour que ce jugement arrive **tôt et pour trois soirées**, pas tard et pour vingt.

---

## 11 · L'intégration

- **Branche** : `feature/refonte-interface`, ouverte depuis `main`. *(La branche
  courante au 2026-09-17 est `feature/tablet-hub-pwa`.)*
- **Un commit par tâche.** Jamais de style et de comportement dans le même commit
  (R3) — sinon la bissection ne sert plus à rien.
- **Fusion par phase**, pas en une fois. Les phases 0 à 2 peuvent fusionner seules :
  elles n'ajoutent que des jetons et des tests.
- **Repli** : phases 1 et 2, une ligne de `git revert` sur un fichier de valeurs.
  Phase 4, un module à la fois.
- ⛔ **R6 · Demander « GM-OS tourne-t-il ? » avant chaque édition dans `src/`.**
  Ce chantier touche 310 fichiers de `src/` — c'est celui qui met cette règle le
  plus à l'épreuve. Le rechargement à chaud a déjà fait perdre des campagnes deux
  fois.
- ⚠️ **`npm run repetition`** pour toute vérification qui touche aux données : une
  instance jetable semée par la sauvegarde du jour.

---

## 12 · Ce que ce plan ne fera PAS

- **Pas de refonte des mises en page.** On rhabille. Déplacer un bouton est un
  autre chantier, avec d'autres risques — et David a trouvé à l'écran chacun des
  défauts nés d'un déplacement.
- **Pas de bibliothèque de composants tierce.**
- **Pas de grand soir.** 1 112 fichiers, 225 780 lignes : une refonte en bloc
  laisserait des semaines sans pouvoir jouer.
- **Pas d'injection de la CSS d'un jeu.** L'interface s'adapte au jeu — c'est une
  exigence (R2, § 8 de l'architecture) — mais **par le pont des jetons**, jamais en
  injectant la feuille du jeu : son vocabulaire `.rpg-*` est celui d'une page de
  livre, et il entrerait en collision avec les 32 règles d'`index.css` qui
  dépendent de `data-theme`.
- **Pas de tablette dans les phases 0 à 4.** Le Tablet Hub a sa propre surface et
  ses propres contraintes ; il passe après, ou jamais — à trancher.

---

## 13 · Les décisions de David — les cinq questions, toutes tranchées

**Ouvertes puis tranchées le 2026-09-17, le jour même.** Aucune ne pouvait l'être
depuis le code. Elles sont consignées ici avec ce qu'elles coûtent, pour qu'on ne
les rouvre pas par accident — et pour que le prix payé reste visible.

**Q1 · Les quatre thèmes d'interface survivent-ils ? — ✅ TRANCHÉE le 2026-09-17**
**Oui. David : *« les 4 thèmes de base sont indépendants. »*** `cyberpunk`,
`medieval`, `modern` et `claire` restent, et forment **un axe à part** de l'habillage
par le jeu.

Ce que ça décide concrètement :

- Chaque nouvelle échelle (`--etat-*`, `--elev-*`, `--rayon-*`) reçoit **quatre
  jeux de valeurs par défaut**, un par palette. C'est mécanique, mais c'est du
  travail réel en phase 1 — et T1.5 existe pour ça.
- **Le jeu, lui, n'en fournit qu'un seul.** Il se pose *par-dessus la palette
  active*, quelle qu'elle soit. Le pont reste donc à une dimension : un
  `theme.css` n'a jamais à connaître les quatre thèmes.
- ⚠️ **Corollaire à ne pas oublier** : une échelle définie pour `cyberpunk` seul
  casse les trois autres **en silence**, puisque rien ne rend visible une variable
  absente. La garde de contraste (T0.3) tourne donc **sur les quatre palettes**,
  pas sur celle qui est ouverte.

**Q2 · Le thème clair est-il encore voulu ? — ✅ TRANCHÉE le 2026-09-17**
**Oui, explicitement : *« je veux conserver un thème clair »*.** Ce n'est donc pas
un héritage qu'on traîne, c'est une exigence — `claire` est maintenue au même
rang que les trois autres.

⚠️ **Ce qu'il coûte, pour que ce soit un choix et pas un héritage** : chaque jeton,
chaque halo et chaque seuil de contraste doit être validé **deux fois**, en sombre
et en clair. C'est la moitié du travail de la phase 1, et la raison pour laquelle
la garde de contraste (T0.3) tourne sur les quatre palettes et non sur celle qui
est ouverte.

**Q3 · Un accent par module, ou un accent unique ? — ✅ TRANCHÉE le 2026-09-17**
**Les sept accents `gm-*` deviennent des DÉRIVÉES de l'accent effectif.** Les
modules restent distinguables, mais tout l'écran appartient au même univers.

*Le problème que ça résout* : un `theme.css` fournit **un** accent, pas sept. Des
`gm-*` fixes auraient fait lire l'orange rouille d'Alien comme un thème à moitié
appliqué, à côté d'un Music-OS resté violet.

**L'accent effectif est déjà arbitré** par `appliquerLeTheme` (jeu > main >
palette) : la dérivation s'y branche, elle n'ajoute aucun arbitre. *Même principe
que `--app-accent-glow` et `--app-accent-rgb`, déjà dérivés depuis le 2026-08-24 —
et pour la même raison : une valeur recopiée dans une table que personne ne relit
quand l'accent bouge finit toujours par mentir.*

⚠️ **La dérivation doit garantir DEUX choses, pas une** — et c'est le piège :

1. **Assez de contraste avec le fond**, sur les quatre palettes, clair compris.
2. **Assez de distance entre frères.** Sept teintes d'une même famille peuvent
   finir trop proches pour être distinguées — et là on perd le repère de couleur
   qui dit « tu es dans Music » d'un coup d'œil, c'est-à-dire *la seule raison
   pour laquelle on les garde*.

**T0.3 couvre donc aussi les accents dérivés**, avec un seuil de séparation entre
eux. ⭐ *Une dérivation qui rend sept fois presque la même couleur ressemble à une
dérivation qui marche.*

⚠️ **Deux des sept (`gm-teal`, `gm-orange`) ne sont employés nulle part.** À
supprimer plutôt qu'à dériver — sinon on écrit une règle pour des couleurs que
personne ne regarde.

**Q4 · Jusqu'où va la phase 4 ? — ✅ TRANCHÉE le 2026-09-17**
**L1 + L2, puis on rejuge.** Soit les trois maquettes (`combat`, `dice`, `image`)
puis `music`, `light`, `sound`, `ambient` : **46 fichiers**, environ un tiers du
travail, et l'application devient cohérente **là où David regarde le plus en
séance**.

⭐ **Ce n'est pas un plan tronqué, c'est un point d'arrêt choisi.** *Le reste du
dépôt montre qu'un chantier qu'on n'arrête pas volontairement s'arrête tout seul,
au mauvais endroit.* La décision de continuer vers L3–L6 se reprend **après avoir
joué** avec L1+L2, sur une estimation fondée sur du réel et non sur un comptage.

⚠️ **Conséquence à ne pas oublier** : tant que L3–L6 ne sont pas faits, la garde
anti-couleurs-brutes (T0.2) ne couvre **que les modules migrés**. Sa liste reste
donc une liste, jamais un « tout `src/` ».

---

**Q5 · Jusqu'où vont « les éléments visuels » ? — ✅ TRANCHÉE le 2026-09-17**
David retient **les quatre** : V1 forme, V2 matière, V3 ornement, V4 iconographie.

Conséquences, et elles sont structurantes :

- **V1 entre en phases 1 et 3.** C'est un jeton, et les primitives doivent le lire
  *dès leur écriture* — décidé après, il faudrait rouvrir les six.
- **V2, V3 et V4 deviennent la phase 6**, un sous-chantier à part : ils ont besoin
  de *fichiers*, donc d'un **paquet de thème** (§ 8.6 de l'architecture).
- ⭐ **Aucun IPC nouveau n'est nécessaire** : `readDoc` lit déjà tout texte sous
  `docs/` (donc les SVG et les manifestes) et `gmos://` sert déjà n'importe quel
  fichier local.

⚠️ **Ce qui reste à trancher en entrant en phase 6** : le vocabulaire des **fentes
d'ornement** (`entete`, `coin`, `separateur`, `fond`). Il se fige une fois —
chaque fente ajoutée ensuite invalide les paquets déjà écrits par les jeux.

## 14 · Le premier geste, quand David voudra commencer

Phase 0, tâche T0.1 : les captures de référence. Une soirée, aucun pixel changé,
et à partir de là **tout ce qui bouge se voit**.
