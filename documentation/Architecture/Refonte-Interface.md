# Refonte de l'interface — l'architecture

> **Nature de ce document : architecture, pas planning.** Il dit *ce qui existe*,
> *ce qui manque* et *quelles couches on vise*. Le déroulé du travail, les tâches
> et les essais vivent dans `documentation/Planning/2026-09-17-refonte-interface.md`.
>
> Ouvert le **2026-09-17**, après trois maquettes apportées par David (compteur de
> rounds / Dice-OS / Image-OS) et la question : *« je ne suis pas graphiste,
> est-ce possible ? »*

---

## 1 · Ce que les maquettes demandent vraiment

Les trois rendus ne proposent **pas un autre langage visuel**. Leur fond est
`#020617`, exactement la valeur de `--app-bg` dans ce dépôt. Leurs accents sont
emerald, amber, red, purple, cyan — la palette que le code emploie déjà. L'un
d'eux s'intitule *« IMAGE OS | Module »* : c'est un rendu d'un module existant.

L'écart n'est donc pas une identité, c'est un **fini** :

| Ce que les maquettes ont | Ce que GM-OS a aujourd'hui |
| --- | --- |
| Halo coloré autour de l'élément actif | `shadow-glow-*` existe, employé **330 fois** — mais sans règle d'emploi |
| Trois niveaux de profondeur nets | Aucune échelle d'élévation |
| Texte secondaire d'une seule valeur | **542** `text-slate-400/500` écrits à la main |
| Couleur d'état constante (vert = bon, rouge = danger) | Écrite en dur, module par module |
| Rythme d'espacement régulier | Aucune échelle |

*Une maquette ne se transpose pas en la copiant ; elle se transpose en extrayant
les règles qu'elle applique sans les dire.*

---

## 2 · L'état mesuré — relevé dans le code le 2026-09-17

**GM-OS a déjà un système de design. Il est adopté à moitié**, et c'est ce
demi-état qui trompe : on voit des couleurs en dur partout et on conclut qu'il
n'y a rien.

### 2.1 · Ce qui existe et fonctionne

| Pièce | Où | Ce qu'elle fait |
| --- | --- | --- |
| Table des thèmes d'interface | `src/theme/themeDeLInterface.ts` (339 l.) | **Unique écrivain** des `--app-*`. Quatre thèmes : `cyberpunk`, `medieval`, `modern`, `claire`. La lueur est **dérivée** de l'accent. |
| Alias Tailwind | `tailwind.config.js` | `app-bg`, `app-surface`, `app-border`, `app-text`, `app-accent` pointent vers les variables ; 8 `shadow-glow-*` ; 7 accents `gm-*` ; `glass-gradient` |
| Jetons du jeu | `src/theme/jetonsDeTheme.ts`, `themeDuJeu.ts` | Les 22 jetons d'un `theme.css` de jeu — **la page de livre**, pas le châssis |
| Atelier de thème | `src/theme/AtelierDuTheme.tsx` | Édite ces 22 jetons + l'échelle de texte, en réécrivant les déclarations |
| Échelle de texte | `src/index.css` § `@theme` | `--echelle-interface`, `--echelle-corps`, `--echelle-titres`, `--echelle-mono` |

### 2.2 · L'adoption, en chiffres

```text
Jetons de châssis  app-*        4 566 usages    214 fichiers / 310
  dont  text-app-text                   2 117
        border-app-border               1 097
        bg-app-surface                    774
        bg-app-bg                         578
shadow-glow-*                              330
Accents gm-*                            ~  279
Palette Tailwind brute                   4 124    214 fichiers
Déclarés et JAMAIS employés :  glass-gradient (0), gm-teal (0), gm-orange (0)
```

**Lecture** : le *châssis* (fond, surface, bordure, texte principal) est tokenisé
et respecté. Ce qui est écrit en dur, c'est autre chose.

### 2.3 · Ce que sont vraiment les 4 124 classes brutes

Elles ne sont pas du châssis mal fait. Ce sont **trois familles sans jeton**.

| Famille | Exemples mesurés | Ce que ça veut dire |
| --- | --- | --- |
| **État** | `bg-emerald-500` ×160, `bg-red-500` ×144, `text-amber-400` ×137 | succès / danger / alerte |
| **Texte secondaire** | `text-slate-500` ×327, `text-slate-400` ×215 | *l'absence de `--app-text-muted`* |
| **Catégorie** | `text-purple-400` ×68, `text-blue-400` ×54, `text-indigo-400` ×41 | un module, un type, une origine |

*Une couleur écrite en dur n'est pas une négligence quand aucun jeton ne la
nomme : c'est le seul mot disponible.*

### 2.4 · Le poids par module — l'ordre de migration en découle

| Module | .tsx | lignes | classes brutes |
| --- | ---: | ---: | ---: |
| `session` | 95 | 25 082 | **1 164** |
| `map` | 16 | 3 479 | 298 |
| `remote` | 17 | 3 498 | 244 |
| `forge` | 13 | 5 709 | 243 |
| `combat` | 11 | 3 036 | 172 |
| `favorite` | 7 | 1 591 | 166 |
| `music` | 10 | 2 302 | 126 |
| `light` | 7 | 1 334 | 119 |
| `system` | 2 | 786 | 101 |
| … 20 autres | | | < 100 chacun |
| `components/` (hors modules) | | | 469 |

`session` pèse **28 %** à lui seul. Il ne se migre pas en une fois.

---

## 3 · Le diagnostic — quatre manques, et ils n'ont pas le même prix

| # | Manque | Portée | Coût |
| --- | --- | --- | --- |
| **G1** | Pas d'échelle d'**état** (`--etat-succes/danger/alerte/info`) | 1 fichier | faible |
| **G2** | Pas de **texte secondaire** (`--app-text-muted/subtle`) | 1 fichier + substitution mécanique | faible |
| **G3** | Pas d'échelle d'**élévation / rayon / espacement** | 1 fichier | faible |
| **G4** | Pas de **primitives** — `src/components/common` contient 3 fichiers (`ErrorBoundary`, `LoadingOverlay`, `Select`) | 310 fichiers | **élevé** |

⭐ **C'est la clé du chantier.** G1 à G3 changent l'apparence de **toute**
l'application depuis **un seul fichier**, en quelques heures, et s'annulent d'une
ligne. G4 se paie fichier par fichier, sur des semaines.

**Ils ne doivent jamais être mélangés dans un même lot de travail.** Sinon on perd
la propriété qui rend ce chantier sûr : *pouvoir juger le rendu avant d'avoir payé
la migration.*

---

## 4 · L'architecture cible — cinq couches, et qui a le droit de parler à qui

```text
┌─ C4 · Les modules (session, combat, music…)
│      emploient C3. Tolérés sur C2 pour un cas unique. Jamais sous C2.
├─ C3 · Les primitives            src/components/socle/
│      <Panneau> <Bouton> <Tuile> <Jauge> <Etiquette> <EnTeteDeModule>
│      Elles seules connaissent l'élévation, le rayon, le halo.
├─ C2 · Les alias Tailwind        tailwind.config.js + index.css @theme
│      bg-app-surface, text-app-muted, bg-etat-danger, shadow-elev-2…
├─ C1 · Les variables CSS         --app-*, --etat-*, --elev-*, --rayon-*
│      Écrites par UN SEUL écrivain.
└─ C0 · Les valeurs               src/theme/themeDeLInterface.ts
       Les palettes + les nouvelles échelles. C'est ici qu'on change de look.
```

**Changer l'apparence de GM-OS = éditer C0.** Tout le reste suit. C'est l'objectif
architectural du chantier, et il est déjà à moitié atteint.

---

## 5 · Les invariants — non négociables

**R1 · Un seul écrivain des variables.**
`themeDeLInterface.ts` est, et reste, le seul endroit qui écrit les `--app-*`.
*Raison payée le 2026-08-24* : les quatre thèmes étaient déclarés deux fois (une
table JS, des blocs `:root[data-theme]`), chacune lue pour une moitié d'elle-même
— d'où une lueur qui ne suivait pas l'accent, visible sans être nommable. Les
nouvelles échelles entrent dans la même table, pas à côté.

**R2 · Le jeu habille le châssis — par UN pont, et un seul.**
⭐ **Exigence de David, rappelée le 2026-09-17 : l'interface doit s'adapter au jeu
ouvert.** C'est déjà le cas (voir § 8) et ça doit le rester en s'étendant. Ce qui
ne se mélange pas, ce n'est pas *jeu / châssis* — c'est **les deux vocabulaires** :

- les **jetons** (`--rpg-bg`, `--rpg-accent`…) traversent le pont `PONT` de
  `jetonsDeTheme.ts` et deviennent des `--app-*` : c'est par là que le jeu habille
  l'application ;
- le **vocabulaire de composants** `.rpg-*` (`page`, `header`, `callout`…) est
  celui d'une page de livre, pas d'un cockpit. Il reste à l'iframe des fiches.

*Mesuré sur les trois premiers jeux : les six seules racines communes étaient les
primitives de formulaire.* Injecter la CSS entière imposerait en plus
`data-theme="alien"` sur la racine, où GM-OS met déjà sa famille d'interface — et
**32 règles d'`index.css` en dépendent**. Deux vocabulaires sur un attribut, le
dernier écrivain gagne.

⚠️ **Corollaire, et c'est la contrainte majeure de ce chantier** : *toute échelle
ajoutée au châssis doit décider, le jour même, si le jeu peut la piloter.* Un
jeton posé sans entrée dans `PONT` est un jeton que le jeu ne pourra jamais
habiller — et il faudra rouvrir chaque module pour le corriger.

**R3 · La refonte ne change aucun comportement.**
Aucune logique, aucun magasin, aucun appel réseau. Si un défaut apparaît en
chemin, il se corrige dans un **commit séparé**, jamais dans le lot de style —
sinon la bissection devient impossible.

**R4 · Aucune couleur d'état en dur dans du code nouveau ou migré.**
Une garde automatique le vérifie (voir le plan, T0.2). *Un garde-fou posé après la
migration ne protège que ce qui restait à faire.*

**R7 · Les accents de module sont DÉRIVÉS, jamais littéraux.**
⭐ *Décision de David, 2026-09-17.* Les sept `gm-*` se calculent à partir de
l'accent effectif — celui qu'`appliquerLeTheme` a déjà arbitré (jeu > main >
palette). Aucun arbitre nouveau ; c'est le mécanisme qui produit déjà
`--app-accent-glow` et `--app-accent-rgb` depuis le 2026-08-24.

⚠️ La dérivation garantit **deux** choses : assez de contraste avec le fond *sur
les quatre palettes, clair compris*, **et assez de distance entre frères**. Sans
la seconde, on perd le repère qui dit « tu es dans Music » — *c'est-à-dire la
seule raison de garder sept accents.* ⭐ *Une dérivation qui rend sept fois
presque la même couleur ressemble à une dérivation qui marche.*

**R5 · Chaque module migré est jouable le soir même.**
Pas d'état « à moitié refait ». Un module par commit, complet.

**R6 · Avant toute édition dans `src/`, demander si GM-OS tourne.**
Règle du dépôt, et ce chantier touche 310 fichiers de `src/` : c'est celui qui la
mettra le plus à l'épreuve.

---

## 6 · Ce que cette architecture refuse

- **Aucune bibliothèque de composants** (shadcn, Radix, MUI…). Le dépôt a son
  vocabulaire, ses quatre thèmes et son atelier ; y greffer un système étranger
  ferait deux sources de vérité — le motif que ce projet paie depuis un mois.
- **Figma n'est pas une source de vérité.** Une maquette propose ;
  `themeDeLInterface.ts` décide. Rien ne se synchronise depuis un outil de dessin.
- **Pas de CSS-in-JS, pas de styles en ligne.** Un style en ligne bat une règle
  `:root` — c'est précisément ce qui avait cassé les thèmes en août.
- **On ne refait pas les mises en page.** Ce chantier change l'habillage. Déplacer
  des boutons est un autre travail, avec d'autres risques.

---

## 7 · Le risque principal, et il ne vient pas du code

Les trois maquettes montrent **5 combattants**, des noms courts, des PV à deux
chiffres. Un vrai écran d'initiative tient 11 combattants, un nom de 24 signes et
`148/155`. **Une bonne part de leur élégance est un luxe de place que les vraies
données n'accordent pas.**

C'est pourquoi le plan impose d'éprouver chaque direction **dans l'application
réelle, avec les vraies campagnes**, avant de s'y attacher — et non sur un rendu.

⚠️ Second piège, connu du dépôt : `:root` porte `font-size: 85%`. Tout `rem`
transposé depuis une maquette sort **15 % plus petit** que prévu. Un `rem` vaut ici
13,6 px.

---

## 8 · L'adaptation au jeu — ce qui marche déjà, et ce qu'il faut étendre

> ⭐ **Exigence de David (2026-09-17)** : *« je veux aussi que les thèmes de
> l'interface, voire même des éléments visuels de l'interface, s'adaptent avec le
> jeu. »* Ce n'est pas un ajout au chantier : **c'est un axe de conception qui
> contraint tout le reste.**

### 8.1 · Ce qu'un jeu pilote déjà aujourd'hui

Déposer `docs/systems/<jeu>/theme/theme.css` suffit. Le fichier est lu par
`chargerLeThemeDuJeu`, ses jetons `--rpg-*` sont extraits **sans que la CSS soit
injectée**, puis traversent la table `PONT` de `jetonsDeTheme.ts` :

| Jeton du jeu | Variable du châssis | Effet |
| --- | --- | --- |
| `--rpg-bg` | `--app-bg` | le fond de l'application |
| `--rpg-surface` *(repli sur `--rpg-paper`)* | `--app-surface` | les panneaux |
| `--rpg-text` | `--app-text` | le texte |
| `--rpg-muted` | `--app-text-muted` | ⛔ **le pont l'écrit, rien ne le définit** — voir 8.3 |
| `--rpg-accent` | `--app-accent` | l'accent, **et par dérivation la lueur et `--app-accent-rgb`** |
| `--rpg-border` | `--app-border` | les bordures |
| `--rpg-font-display` | `--font-display` | la police des titres |
| `--rpg-font-mono` | `--font-mono` | la police à chasse fixe |

S'y ajoutent, hors table :

- **La polarité.** `color-scheme` déclaré par le thème l'emporte sur celle de
  l'atelier — *il le faut : un jeu peut être clair sur une interface sombre.*
- **L'échelle de texte.** `--rpg-font-scale` pose la taille de racine, et les
  échelles `corps` / `titres` / `mono` suivent.
- **Les polices.** Les `@import` du thème sont posés séparément et **ceux du jeu
  précédent retirés**. *Sans ça la variable désigne une police jamais téléchargée,
  et le navigateur retombe en silence sur le premier repli* — défaut vu par David
  le 2026-08-24. Hôtes en liste close : `fonts.googleapis.com`, `fonts.bunny.net`.

### 8.2 · La règle d'arbitrage — « le jeu gagne, la main surcharge »

Décidée le 2026-08-23, implémentée dans `appliquerLeTheme` :

1. Le socle est la palette d'atelier (`cyberpunk`, `medieval`, `modern`, `claire`).
2. Le jeu **recouvre — mais seulement ce qu'il déclare.** Un thème partiel ne doit
   pas effacer ce qui marchait.
3. L'accent est arbitré à part : le jeu passe devant, **sauf** si la main a posé
   une surcharge *différente de l'accent du thème d'atelier*. ⚠️ Cette nuance
   n'est pas une subtilité gratuite : `setTheme` réinitialise la couleur sur
   l'accent du thème, et sans elle une surcharge **héritée** ferait perdre au jeu
   son accent à tous les coups.

### 8.3 · ⛔ Le défaut trouvé en écrivant ce document

`PONT` mappe `muted → --app-text-muted`. Mais :

- **aucune des quatre palettes ne définit `--app-text-muted`** ;
- **`tailwind.config.js` n'expose aucun alias** pour lui ;
- et `src/modules/journal/JournalDashboard.tsx` emploie **`text-app-text-muted`
  quatre fois** (lignes 315, 323, 345, 350).

Ces quatre classes **ne produisent aucune règle**. Trois portent `opacity-50` et
paraissent donc à peu près justes par accident ; celle de la ligne 350 s'affiche
en pleine intensité là où on voulait du texte secondaire.

*C'est le motif exact des 125 `animate-in` sans greffon, payé le 2026-09-03 : une
classe qui n'existe pas ne prévient pas — rien ne casse, il ne se passe simplement
rien.* Et c'est la démonstration de la contrainte du § 8.4 : **un jeton branché
d'un seul côté du pont est un jeton mort.**

Le correctif est la tâche T1.1 du plan, et il est plus petit qu'il n'y paraît : le
pont est déjà écrit, il manque la valeur par défaut et l'alias.

### 8.4 · La contrainte que cette exigence impose au chantier

⚠️ **Chaque échelle ajoutée au châssis doit décider, le jour même, si le jeu peut
la piloter.** Concrètement, pour les échelles de la phase 1 :

| Échelle | Le jeu doit-il pouvoir la piloter ? | Jeton proposé |
| --- | --- | --- |
| Texte secondaire | **Oui** — déjà prévu | `--rpg-muted` *(existe)* |
| États (succès / danger / alerte / info) | **Oui** — le rouge d'Alien n'est pas celui de RdD | `--rpg-etat-*` |
| Élévation, rayon | **Probablement** — un cockpit anguleux et un grimoire n'ont pas le même angle | `--rpg-rayon`, `--rpg-elevation` |
| Espacement | **Non** — c'est de l'ergonomie, pas de l'identité | — |

*Un jeton posé sans entrée dans `PONT` est un jeton que le jeu ne pourra jamais
habiller, et il faudra rouvrir chaque module pour le corriger.* C'est la seule
décision de ce chantier qui soit réellement difficile à défaire.

### 8.5 · « Des éléments visuels » — l'ambition à cadrer

Au-delà des couleurs et des polices, David veut que **des éléments visuels**
s'adaptent. Quatre lectures possibles, de coût très différent, **à trancher avant
la phase 3** — puisque ce sont les primitives qui les porteraient :

| # | Lecture | Ce que ça veut dire | Coût |
| --- | --- | --- | --- |
| **V1** | **Forme** | Le rayon, l'épaisseur et le style des bordures viennent du jeu : anguleux pour Alien, ourlé pour un médiéval | faible — deux jetons de plus |
| **V2** | **Matière** | Les panneaux acceptent une texture ou un dégradé fourni par le jeu (papier, métal, écran cathodique) | moyen — une image par thème, et la lisibilité à re-vérifier |
| **V3** | **Ornement** | Le jeu fournit des ornements d'en-tête, des coins, des séparateurs | moyen à élevé — un format à définir, et ça ne tient pas dans un `theme.css` |
| **V4** | **Iconographie** | Un jeu de pictogrammes par jeu, en remplacement de `lucide-react` | **élevé** — des centaines d'icônes, et un repli obligatoire |

⭐ **Les quatre sont retenues — décision de David, 2026-09-17.** Elles ne se
livrent pas ensemble pour autant : V1 appartient aux phases 1 et 3 (c'est un
jeton, et les primitives doivent le lire **dès leur écriture**), V2 à V4 forment
un sous-chantier à part, décrit au § 8.6 et en phase 6 du plan.

⚠️ **V4 reste d'un autre ordre de grandeur que les trois autres** — et ne devient
tenable que par la règle de surcharge partielle du § 8.6 : un jeu fournit **les
icônes qui lui importent**, jamais les quatre cents.

⚠️ **Le garde-fou commun aux quatre** : un thème de jeu est fourni par un fichier
déposé dans `docs/`, donc **un jeu doit pouvoir être partiel, incohérent ou
absent** sans casser l'interface. Toute extension du pont garde un repli — c'est
déjà la règle (`if (valeur)` dans `pontVersLInterface`), elle ne doit pas se
perdre en s'étendant.

### 8.6 · Le paquet de thème d'un jeu — ce que V2, V3 et V4 imposent

**V1 tient dans un `theme.css`. Les trois autres non** : elles ont besoin de
*fichiers*. Le dossier de thème d'un jeu cesse donc d'être une feuille de style
pour devenir un **paquet**.

```text
docs/systems/<jeu>/theme/
  theme.css            les jetons --rpg-*          (existe, inchangé)   V1
  matieres/*.svg|png   textures et fonds de panneau                     V2
  ornements.json       quel ornement dans quelle fente                  V3
  ornements/*.svg      les ornements eux-mêmes                          V3
  icones.json          nom GM-OS → fichier du jeu                       V4
  icones/*.svg         les pictogrammes fournis                         V4
```

#### Ce qui n'a PAS besoin d'être construit

⭐ **Aucun IPC nouveau n'est nécessaire, et c'est ce qui rend le sous-chantier
abordable.**

- `readDoc` lit **n'importe quel fichier texte sous `docs/`** — il sert déjà
  `gems.json`. Donc `ornements.json`, `icones.json` **et tout SVG** passent par le
  canal existant.
- Le protocole `gmos://media/<chemin>` sert déjà n'importe quel fichier local.
  Donc une texture matricielle (PNG, JPEG) est atteignable sans rien ajouter.
- `listDocs` existe pour énumérer.

**D'où une décision de conception** : *ornements et icônes sont du **SVG**, pas du
bitmap.* Ils passent alors par le canal texte, s'adaptent à toutes les densités
d'écran, et surtout peuvent **hériter de la couleur** (`currentColor`) — donc
suivre l'accent du jeu au lieu de le contredire.

#### ⚠️ La règle de confinement — à poser avant la première texture

Le protocole `gmos` accepte un **chemin absolu** et sert le fichier sans autre
contrôle. Or un thème est **du contenu déposé**, pas du code du dépôt.

**Un chemin venant d'un thème est donc résolu relativement au dossier de thème du
jeu, et refusé s'il en sort.** C'est exactement l'esprit de la liste close des
hôtes de polices déjà en place — *un fichier de thème est du code exécuté par
l'interface : on n'y suit pas n'importe quelle URL.*

#### ⭐ La surcharge partielle — la règle qui rend V4 possible

Un jeu ne fournit **jamais** le jeu d'icônes complet. Il déclare celles qui
comptent pour lui, le reste retombe sur `lucide-react` :

```json
{ "combat": "icones/xenomorphe.svg", "sante": "icones/bio.svg" }
```

*Quinze icônes bien choisies font un thème ; quatre cents font un projet mort.*
La même règle vaut pour les ornements et les matières : **tout est facultatif,
tout a un repli**, comme `pontVersLInterface` le fait déjà jeton par jeton.

#### Les fentes d'ornement — le vocabulaire à figer une fois

V3 n'a de sens que si les primitives exposent des **fentes nommées**, stables, peu
nombreuses. Proposition de départ, à trancher en phase 6 :

| Fente | Où | Exemple |
| --- | --- | --- |
| `entete` | en haut d'un `<Panneau>` | une frise |
| `coin` | les quatre angles | une ferrure |
| `separateur` | entre deux sections | un fleuron |
| `fond` | derrière le contenu, en filigrane | un sceau |

⚠️ **Ce vocabulaire se fige une fois.** Chaque fente ajoutée plus tard oblige à
rouvrir les primitives *et* invalide les paquets déjà écrits par les jeux —
c'est la seule partie de ce sous-chantier qui ait un coût de rupture.

#### Ce que ce paquet ne fera pas

- **Aucun script.** Un thème déclare des valeurs et des fichiers ; il n'exécute
  rien.
- **Aucune mise en page.** Un jeu habille, il ne déplace pas un bouton.
- **Aucune obligation.** La grande majorité des jeux n'auront jamais de paquet —
  *c'est le cas normal, pas une erreur.*
