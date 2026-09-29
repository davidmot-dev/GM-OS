# Refonte de l'interface — le plan de la phase 1

**Pour** : David, qui le relit avant qu'on code, et Claude Code, qui l'exécute. **Le 2026-09-27.**

Remplace le § 4 du [plan de la refonte](./2026-09-17-refonte-interface.md), écrit le 17/09. Celui-ci
ignorait trois choses décidées depuis : **les noms du contrat des thèmes** (D4), **les quatre
personnalités complètes** (D3, relevées en T2.3) et **le cadre** (contrat v1.3).

## 0 · En une phrase

À la fin de la phase 1, **les quatre thèmes de base sont des paquets de jetons `--rpg-*`, lus par le
même mécanisme que les thèmes de jeu**, et l'interface sait afficher les personnalités de Stitch.
Tu les juges alors dans ta vraie application (T2.4), et **un seul interrupteur** revient à
l'apparence d'aujourd'hui.

## 1 · Où on part — vérifié dans le code le 2026-09-27

- `src/theme/themeDeLInterface.ts` écrit **10 variables** (plus 2 dérivées de l'accent) : fond,
  surface, bordure, texte, accent, deux polices, trois de verre. **Aucune** variable de texte
  secondaire, d'état, d'arrondi, d'ombre, de cadre ou de matière.
- Les palettes de base ont **leur propre forme** (`PaletteDInterface` : `policeTitre`, `verre.fond`…),
  différente de celle des jetons de jeu. Deux vocabulaires pour une même chose.
- `PONT` (`jetonsDeTheme.ts`) traduit les jetons de jeu en `--app-*` ; il est **dérivé du contrat**
  et un essai vérifie que seuls les jetons LU l'empruntent. ⚠️ Il déclare déjà
  `muted → --app-text-muted`, **que rien n'écrit ni ne lit** (défaut connu, T1.1 du 17/09).
- Ce que l'interface emploie en dur, et que la phase 1 doit pouvoir piloter :

| Classe | Occurrences dans `src/` |
| --- | --- |
| `rounded`, `rounded-sm` à `rounded-3xl` | 2 193 |
| `shadow-sm` à `shadow-2xl` | 339 |
| `shadow-glow-*` | 334 |
| couleurs d'état en dur (`emerald`, `red`, `amber`, `green`, `rose`, `yellow`) | 2 048 |
| `text-slate-400` / `text-slate-500` | 220 / 343 |
| `theme === 'medieval'` / `'claire'` dans le code | 51 / 3 |
| règles `[data-theme='claire']` dans `index.css` | 33 |

- **La barre latérale et le bandeau** sont deux éléments de `Shell.tsx` (l. 267 et 544).
- **Le filet de la phase 0 est en place** : captures de référence de 20 panneaux (T0.1), garde des
  couleurs d'état (T0.2), garde de contraste (T0.3), relevé des couleurs (T0.4).

## 2 · Les trois principes

1. **D'abord à pixel constant, ensuite le nouveau look.** Chaque échelle entre avec des valeurs
   qui **reproduisent l'apparence d'aujourd'hui** ; les captures de T0.1 le prouvent (zéro
   différence). Les personnalités n'arrivent qu'à la fin, d'un bloc, derrière un interrupteur.
   *Si une capture bouge pendant la construction, c'est un défaut, pas un choix.*
2. **Un seul vocabulaire.** Un thème de base s'écrit en jetons `--rpg-*`, comme un thème de jeu.
   Le jeu recouvre ce qu'il déclare (D5), le reste vient du thème de base, et **une seule table**
   traduit le tout en `--app-*`.
3. **Chaque jeton décide le jour même si le jeu peut le piloter** (R2). En pratique : tout jeton
   que la phase 1 branche passe de **V2** à **LU** dans le contrat, qui passera en v1.4 à la fin.

## 3 · Les étapes

Chaque étape est **un commit**, réversible seul. Avant chaque séance de code : *« GM-OS
tourne-t-il ? »*. Les essais : `npx vitest run --maxWorkers=4`, `npx tsc -b`, et les captures
`npx playwright test e2e/ecransDeReference.spec.ts`.

### P1.1 · Les thèmes de base deviennent des paquets de jetons — à pixel constant

- `PALETTES` devient une table de **jetons du contrat** par thème (`bg`, `surface`, `text`,
  `accent`, `font-display`, `glass-bg`…), avec **les valeurs d'aujourd'hui**. Les pastilles
  d'accent restent à part : elles ne sont pas un jeton.
- `appliquerLeTheme` fusionne **jetons de base + jetons du jeu** (le jeu gagne, D5 ; l'accent reste
  arbitré à part, « la main surcharge »), puis traduit le tout par **une seule table**, dérivée du
  contrat comme `PONT`.
- **Preuve** : captures T0.1 identiques ; les essais de `themeDeLInterface` et du pont passent.
- ✅ **Fait le 2026-09-27.** Les 20 captures sont identiques ; une garde nouvelle,
  `src/theme/apparenceDAujourdhui.test.ts`, fige les variables posées par **chacun des quatre
  thèmes** avant la première modification (les captures ne montrent que le thème par défaut).
  Le contrat distingue désormais **où va un jeton** (`versLInterface`, lu par les thèmes de base
  via `VARIABLE_DU_JETON`) et **si le jeu peut le piloter** (statut LU, lu par `PONT`) : le verre
  a déjà sa variable, le jeu ne l'emprunte pas encore.
- *Pourquoi en premier* : tout le reste ajoute des lignes à cette table. Sans elle, chaque échelle
  s'ajouterait deux fois, côté base et côté jeu — le motif des deux tables de 2026-08-24.

### P1.2 · Les couleurs qui manquent — à pixel constant

| Jeton | Variable | Alias Tailwind | Valeur neutre (aujourd'hui) |
| --- | --- | --- | --- |
| `muted` | `--app-text-muted` | `text-app-muted` | slate-400 (thèmes sombres) ; celle des règles de `claire` |
| *(dérivé)* | `--app-text-subtle` | `text-app-subtle` | slate-500 ; dérivé de `muted` quand le jeu le déclare |
| `surface-2` | `--app-surface-2` | `bg-app-surface-2` | — (nouvelle, aucun emploi à ce stade) |
| `accent-contrast` | `--app-accent-contrast` | `text-app-on-accent` | le texte posé aujourd'hui sur l'accent |
| `border-soft` | `--app-border-soft` | `border-app-soft` | `app-border` à 50 % |
| `success`, `danger`, `warning`, `info` | `--etat-*` + fond et bordure dérivés | `text-etat-succes`, `bg-etat-danger/15`… | emerald-500, red-500, amber-500, sky-500 |
| `frame-bg`, `frame-text`, `frame-accent` | `--app-frame-*` | — | absents : `bg`, `text`, `accent` |

- **Le cadre** se branche sur deux éléments seulement : `Shell.tsx` redéfinit, **sur la barre
  latérale et le bandeau**, `--app-bg`, `--app-text` et `--app-accent` à partir de `--app-frame-*`.
  Tout ce qui est dedans suit, sans toucher un composant de plus. Le texte estompé du cadre se
  **dérive** (`color-mix` du texte et du fond du cadre) : le contrat n'en a pas.
- **Preuve** : captures identiques (aucun composant n'emploie encore les alias, sauf le cadre, dont
  les valeurs par défaut sont celles d'aujourd'hui). T0.3 s'étend aux nouvelles paires.
- ✅ **Fait le 2026-09-29.** Les 20 captures sont identiques ; les nouveaux essais de
  `themeDeLInterface.test.ts` figent les valeurs d'aujourd'hui et le cadre. Quatre écarts au texte
  ci-dessus, tous voulus :
  - **les états n'ont pas de variables « fond » et « bordure »** : Tailwind 4 écrit l'opacité en
    `color-mix`, donc `bg-etat-danger/15` et `border-etat-danger/40` suffisent ;
  - dans le thème clair, `muted` et `subtle` valent **le texte**, pas slate-400/500 : ses règles
    de rattrapage d'`index.css` repeignent déjà ces deux classes en `--app-text` ;
  - **le texte estompé du cadre ne se dérive que si le cadre est déclaré.** Sinon c'est celui du
    reste de l'interface : la barre latérale ne changera pas en P1.3 ;
  - `surface-2` n'ayant aucun emploi, sa valeur (la surface éclaircie de 5 % vers le texte) est
    **provisoire**, à juger en P1.7.
- ⭐ **T0.3 a trouvé un défaut déjà visible** : le thème clair écrit succès, alerte et info en
  emerald, amber et sky 500 sur son fond crème — 2,45, 2,07 et 2,67 pour un seuil de 3. Figé en
  cliquet (`PAIRES_ILLISIBLES`, à côté des pastilles du médiéval) ; les remplaçantes se choisissent
  avec la personnalité du thème clair.
- ⛔ **Les captures de référence exigent le Zenbook en écran principal**, comme le 27/09 : sur
  l'écran externe (1920×1080, 100 %), elles sortent en 1440×900 au lieu de 1441×901 et échouent
  **toutes**, avant toute modification.

### P1.3 · Le texte secondaire — la seule substitution de la phase

- `text-slate-400` → `text-app-muted`, `text-slate-500` → `text-app-subtle`, **module par module**,
  un commit chacun, captures T0.1 relues à chaque fois. ⚠️ `slate-500` veut parfois dire
  « désactivé » et non « secondaire » : ces cas-là ne bougent pas (T1.4 du 17/09).
- Les règles `[data-theme='claire'] .text-slate-*` d'`index.css` tombent au fur et à mesure : le
  jeton fait leur travail.
- **Les 2 048 couleurs d'état, elles, ne bougent pas** : c'est la phase 4, module par module, avec la
  garde T0.2. La phase 1 crée les jetons ; elle ne migre pas les états.
- ✅ **Fait le 2026-09-29** : **461 substitutions** dans 18 modules. Les 20 captures passent, et un
  essai dans Chromium montre que les couleurs `oklch` de Tailwind et leurs équivalents hexadécimaux
  se peignent **au pixel près**. Ce qui a été tranché en route :
  - ⛔ **les valeurs de P1.2 étaient celles de Tailwind 3** (`#94a3b8`) ; Tailwind 4 écrit sa palette
    en `oklch` (`slate-400` = `#90a1b9`). Corrigé avant la substitution, états compris ;
  - **David : le jeu pilote le texte secondaire dès maintenant.** Sous un thème de jeu, il prend le
    `muted` du jeu (Blade Runner à peine, Dune et NOC en beige) ; sous le thème de base, rien ne
    change ;
  - **David : le Player Hub des tablettes reste hors P1.3** (`modules/remote`, `components/hub`),
    comme les écrans d'accueil (`components/splash`) ;
  - **la classe exacte seulement** : les variantes (`hover:text-slate-400`, `/60`) restent. Les règles
    du thème clair ne visent que la classe exacte ;
  - **un seul gris « désactivé » gardé**, dans `PlayerPrivateNotes.tsx`
    (`text-slate-500 cursor-not-allowed`) ;
  - ⚠️ **les règles `claire` ne tombent pas** : leur `!important` neutralisait les survols posés sur
    le même élément (154 lignes, dont 51 `hover:text-white`, qui écriraient du blanc sur le crème).
    `text-app-muted` et `text-app-subtle` reprennent donc cet `!important` dans le thème clair, et les
    règles `slate` restent pour les tablettes. Tout cela tombe avec la personnalité claire (P1.7).

### P1.4 · La forme et le relief — à pixel constant, effet global

- Dans `tailwind.config.js`, les **arrondis** (`rounded-sm` … `rounded-3xl`) et les **ombres**
  (`shadow-sm` … `shadow-2xl`) pointent vers des variables : `--rayon-sm/md/lg`, `--elev-1/2/3`.
  Valeurs neutres : **exactement celles de Tailwind**. `rounded-full` ne bouge jamais.
- **C'est le levier de la phase** : 2 193 arrondis et 339 ombres obéissent ensuite au thème **sans
  qu'on ouvre un seul composant**. Le Cyberpunk devient carré et le Médiéval presque droit d'un
  coup, au moment P1.7.
- `border-width`, `border-style`, `title-tracking`, `kicker-tracking`, `title-transform` : variables
  posées, **consommées par les primitives** (phase 3). Les 1 905 `uppercase` écrits en dur ne sont
  pas repris ici.
- `glow`, `glow-strength` : `--app-accent-glow` reste dérivé de l'accent quand le thème n'en dit
  rien ; `glow: none` l'éteint. Les 334 `shadow-glow-*` à couleur fixe attendent la phase 4.
- `font-body` : `font-sans` pointe aujourd'hui vers **la police des titres**. On l'envoie vers
  `--font-body`, dont la valeur neutre est… la police des titres. Le Médiéval pourra ensuite écrire
  en Garamond et titrer en Cinzel.
- **Preuve** : captures identiques.
- ✅ **Fait le 2026-09-29.** Les 20 captures passent ; les replis sont **relevés dans le CSS
  compilé par Tailwind 4**, pas de mémoire, et un essai les fige cran par cran. ⚠️ Le filet tolère
  0,5 % de pixels : un arrondi faux de 1 px pourrait passer dessous. Ce qui a été tranché :
  - **David : les crans se rangent par familles.** Petit (`sm`, `rounded`, `md`), moyen (`lg`, `xl`
    — 1 462 emplois), grand (`2xl`, `3xl`). *« Les cartes font 12 px », toutes* ; `lg` et `xl` se
    confondent sous une personnalité. Les ombres de même : posé (`sm`, `shadow`), flottant (`md`,
    `lg`), dialogue (`xl`, `2xl`) ;
  - **le repli des ombres garde `var(--tw-shadow-color)`** : c'est ce qui fait marcher
    `shadow-lg shadow-accent/20`. Une élévation déclarée apporte ses propres couleurs ;
  - `--rayon-*`, `--elev-*` et `--font-body` ne sont **écrits que si un thème les déclare** ;
    `appliquerLeTheme` efface désormais toute variable du contrat que le thème ne déclare plus
    (sans quoi quitter une personnalité laisserait ses arrondis) ;
  - `shadow` sert d'`elevation-2` quand elle manque, `glow-strength` règle l'opacité du halo dérivé
    (`JETONS_LUS_A_PART`) ; `glow: none` devient `transparent` — `none` n'est pas une couleur ;
  - bordure et typographie des titres (`--bordure-*`, `--titre-*`, `--surtitre-espacement`) :
    posées, lues par personne avant les primitives (phase 3) ;
  - ⚠️ **pour P1.6** : quand ces jetons passeront à LU, un jeu pourra piloter le halo ; la
    traduction de `none` est déjà faite après la fusion, pour lui aussi.

### P1.5 · Le verre et les matières — à pixel constant

- `glass-bg`, `glass-border`, `glass-blur` alimentent les `--glass-*` existants.
- Les textures de fond, aujourd'hui des règles `[data-theme=…] .bg-texture-overlay` dans
  `index.css`, deviennent `--rpg-texture-bg` et `--rpg-texture-opacity` : **un jeu pourra enfin
  donner sa matière**. Les SVG (grille du Cyberpunk, grain du parchemin) viennent en P1.7.
- **Preuve** : captures identiques.
- ✅ **Fait le 2026-09-29.** Les 20 captures passent — la grille du cyberpunk y est sur chaque
  écran. Le grain du médiéval et la toile du thème clair n'y paraissent pas : un essai compare leurs
  valeurs, au caractère près, aux règles d'`index.css` d'avant (`b3cab546`). Ce qui a été tranché :
  - **la pose du motif n'est pas dans le contrat** (taille, position, fusion) : elle vit dans le
    paquet de base (`matiere`) et s'écrit toujours, `auto` / `0% 0%` / `normal` par défaut. Un jeu n'en
    a pas besoin : sa tuile `url('matieres/…')` se répète à sa taille ;
  - ⚠️ **l'opacité des matières d'hier (1) dépasse le plafond du contrat (0,35)** : le plafond
    protège la lisibilité d'une matière inconnue, et la couleur de ces motifs porte déjà sa
    transparence. Rien à corriger à pixel constant ;
  - `glass-blur` pilote le flou de `.glass-bento`, le seul verre qui lit déjà les `--glass-*` ;
    les autres verres (`premium-glass`, `glass-panel`, `stitch-card`, `backdrop-blur-*`) attendent
    les primitives ;
  - ⚠️ **pour P1.6** : `url('matieres/…')` est relative au dossier du thème. Posée telle quelle en
    variable sur le document, elle se résoudrait depuis la page : le chargeur du thème de jeu devra
    la réécrire en adresse complète quand `texture-bg` passera à LU.

### P1.6 · Le contrat en v1.4 et les gardes

- Tous les jetons branchés en P1.2 à P1.5 passent de **V2** à **LU** : cahier, contrat en données,
  essai de concordance ; la copie de RPG Theme Builder suit. *Le jeu peut désormais les piloter,
  et le constructeur doit le savoir.*
- **La garde de distinction** : un essai compare les quatre thèmes deux à deux sur sept traits (fond,
  surface, texte, accent, fond du cadre, arrondi des cartes, police de titre) et **rougit si deux
  thèmes diffèrent sur moins de trois**. Seuils : 60 de distance de couleur, 4 px d'arrondi, une
  autre famille de police. Calculé sur les valeurs de T2.3 : de 7/7 (Cyberpunk et Clair) à **3/7 pour
  Moderne et Clair** (cadre, arrondi, police) — **sans le cadre, ils tomberaient à 2 et seraient
  refusés**.
- **T0.3 couvre toutes les paires** du contrat pour les quatre thèmes, cadre compris.
- **Les accents dérivés `gm-*`** (T1.7 du 17/09, R7) : ils se calculent depuis l'accent effectif,
  avec contraste et distance entre frères.
- ✅ **Fait le 2026-09-29 — mais pas tel qu'écrit, et c'est voulu.** 20 captures identiques,
  480 fichiers d'essais. Deux constats ont changé l'étape :
  - ⛔ **Le plan disait « P1.6 : rien ne change ». C'était vrai pour les thèmes de base, pas pour
    les jeux** : les six thèmes de jeu déclarent déjà la forme, le relief, le verre, la matière et le
    cadre. Passés à LU, Blade Runner aurait mis tout le texte en empattement et tous les angles à
    0 px. **David : tout ce que la v1.4 ouvre au jeu attend l'interrupteur de P1.7**, et la dérivation
    des `gm-*` aussi. Le contrat les marque **LU ⚙** (`personnalites: true`) ; `pontVersLInterface` et
    `appliquerLeTheme` prennent une option `personnalites`, **éteinte partout**.
  - **Seuls passent à LU les jetons qu'un élément de l'écran lit** (18) : `radius-*`,
    `elevation-*`, `shadow`, `glow`, `glow-strength`, `font-body`, `glass-*`, `texture-bg`,
    `texture-opacity`, `frame-*`. Restent **V2** ceux qu'aucun composant n'emploie encore —
    `surface-2`, `accent-contrast`, `border-soft`, les états (phase 4), `border-*`, `title-*`,
    `kicker-tracking`, `texture-panel` (phase 3). Les marquer LU aurait promis au constructeur un effet
    qui n'existe pas.
  - **Les `gm-*`** (`accentsDeModule.ts`) : chaque module garde **sa teinte** et prend la clarté et
    la saturation de l'accent, en OKLCH ; clarté poussée jusqu'au contraste 3, saturation plancher
    pour qu'un accent gris ne rende pas cinq gris. Sur dix cas (bases, personnalités, jeux, gris) :
    contraste ≥ 3,85, distance entre frères ≥ 0,078 (aujourd'hui : 0,125 ; seuil de la garde : 0,07).
    `gm-teal` et `gm-orange`, employés nulle part, sont retirés.
  - **La garde de distinction** (`distinctionDesThemes.ts`, essai dans `electron/`) : RVB euclidienne
    ≥ 60, arrondi ≥ 4 px, autre famille de police ; elle retrouve 7/7 et **3/7** sur les valeurs de
    T2.3, et refuse Moderne/Clair sans le cadre.
  - **T0.3** mesure les 12 paires pour les quatre thèmes, le cadre par ses replis.
  - **Le validateur** range les jetons LU ⚙ à part (« appliqués avec les personnalités ») ; **le
    chargeur** incorpore les matières `url('matieres/…svg')` en adresse `data:` et écarte PNG/WebP,
    en le disant. Le cahier passe en **v1.4**, la copie de RPG Theme Builder suit — **à recharger
    dans ChatGPT**.
  - ⚠️ **Ce que P1.7 devra brancher** : le réglage vers `appliquerLeTheme` (`useThemeDuJeu`,
    `main.tsx`, `AtelierDuTheme`) et vers `pontVersLInterface` ; l'atelier du thème, qui ne sait pas
    encore régler les jetons LU ⚙ ; la vérification de `font-body` dans `verifierLesPolices`.

### P1.7 · Les personnalités — derrière un interrupteur

- Les valeurs de T2.3 ([`stitch/personnalites/*.theme.css`](./stitch/personnalites/valeurs.md))
  entrent comme **deuxième jeu de paquets**. Un seul interrupteur choisit « aujourd'hui » ou
  « personnalités ». ✅ **David, 2026-09-27 : un réglage dans les Paramètres**, pour basculer en
  pleine séance et comparer. Il vit avec le choix du thème, se retient d'une session à l'autre, et
  **ne change rien d'autre** : ni le thème choisi, ni l'accent, ni le thème du jeu, qui continue de
  recouvrir ce qu'il déclare.
- Les pastilles d'accent de chaque thème sont revues pour le nouveau fond — le Médiéval en a quatre
  sous le minimum aujourd'hui (`PASTILLES_ILLISIBLES`, T0.3).
- Les SVG : grille du Cyberpunk, grain du parchemin, coins en laiton, coins coupés.
- **Ici, les captures changent — c'est le but.** Elles sont refaites, et tu les regardes avant
  qu'on les accepte comme nouvelle référence.

## 4 · Ce que la phase 1 ne fait PAS

- **Elle ne migre aucun module** : les 2 048 couleurs d'état, les 334 halos à couleur fixe, les
  51 branches `medieval` restent. C'est la phase 4.
- **Elle ne crée aucune primitive** (`<Panneau>`, `<Bouton>`…) : phase 3. Les jetons de bordure et
  de casse attendent leurs consommateurs là-bas.
- **Elle ne réagence aucun écran** : les directions retenues de Stitch attendent la phase 4 (D1).
- **Elle ne change pas les thèmes de jeu** : les six restent acceptés à chaque étape
  (`npm run theme:valider -- --tous`).

## 5 · Ce que tu verras, et quand

| Après | Ce qui change à l'écran |
| --- | --- |
| P1.1 à P1.6 | **Rien.** C'est le point : les captures le prouvent à chaque commit |
| P1.3 | Rien non plus, sauf un texte secondaire mal classé — relu module par module |
| P1.7, interrupteur sur « personnalités » | Les quatre thèmes de Stitch : couleurs, polices du texte, arrondis, ombres, cadre, matières. Les écrans gardent leur mise en page |

**Estimation** : P1.1 et P1.2, une soirée ; P1.3, une soirée (vingt modules) ; P1.4 à P1.6, une
soirée ; P1.7, une soirée. Soit **quatre soirées**, contre une à deux prévues le 17/09 : l'écart
vient de D3, qui a fait entrer les quatre personnalités complètes.

## 6 · Les décisions de David — 2026-09-27

1. ✅ **L'interrupteur de P1.7 est un réglage dans les Paramètres**, pas une constante.
2. ✅ **L'ordre est gardé** : le texte secondaire (P1.3) avant la forme et le relief (P1.4).
