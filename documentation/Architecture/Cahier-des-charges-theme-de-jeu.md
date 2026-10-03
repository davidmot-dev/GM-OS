# Cahier des charges — thème de jeu pour GM-OS

**Contrat v1.7 — 2026-10-03.** Destinataire : l'assistant qui construit les thèmes de jeu.

Ce document est une **contrainte**, pas une inspiration. Il dit exactement ce que GM-OS lit dans un
thème, ce qu'il ignore et ce qu'il refuse. Tout ce qui n'y figure pas n'aura **aucun effet** dans
GM-OS. Les mots **DOIT**, **NE DOIT PAS**, **PEUT** et **RECOMMANDÉ** ont leur sens strict.

---

## 1 · Ce que tu livres

Un dossier par jeu, déposé par le meneur dans `docs/systems/<jeu>/theme/` :

```text
theme/
├── theme.css            OBLIGATOIRE — les jetons (§ 4) ; rien d'autre n'atteint GM-OS (§ 2)
├── intention.md         OBLIGATOIRE — l'intention visuelle et les limites signalées (§ 1.1)
├── matieres/*.svg       facultatif — textures de fond et de panneau (§ 7)
├── ornements.json       facultatif — les ornements, par emplacement (§ 8)
├── ornements/*.svg
├── icones.json          facultatif — les icônes, par nom (§ 9)
├── icones/*.svg
└── apercu/              facultatif — tes captures de démonstration, ignorées par GM-OS
```

- Tu **NE DOIS PAS** livrer `theme.original.css` : c'est GM-OS qui le crée quand le meneur retouche
  un thème dans son atelier.

### 1.1 · `intention.md` — dire ce qu'on vise, et ce qu'on n'a pas pu faire

GM-OS ne lit pas ce fichier : il sert au meneur pour juger le rendu, et à toi pour les retouches.
Il **DOIT** contenir deux parties, courtes.

**L'intention visuelle**, en trois phrases au plus : la matière, la forme, la lumière, l'époque.
*Exemple : « Terminal industriel des années 1980 : angles vifs, aucun arrondi, vert phosphore
atténué sur métal sombre, aucune lueur décorative. »*

**Les limites signalées** : chaque élément des références que le contrat ne permet pas de rendre
fidèlement, avec sa classe.

| Classe | Sens |
| --- | --- |
| **PARTIELLEMENT RÉALISABLE** | Approché par les jetons disponibles ; dis ce qui manque |
| **NON EXPRIMABLE** | Le contrat ne le permet pas : géométrie d'un composant, mise en page, emplacement d'ornement absent |

⭐ **Une limite signalée vaut mieux qu'une fausse implémentation sans effet.** N'essaie jamais de
contourner le contrat par une règle CSS : GM-OS ne la lirait pas, et le meneur croirait l'effet
présent.

## 2 · Un seul consommateur : l'interface de GM-OS

`theme.css` habille **l'interface de GM-OS** — le poste du meneur. Elle ne lit **que les jetons
`--rpg-*` listés au § 4**, la ligne `color-scheme` et les `@import` de polices. **Aucune règle CSS
ne l'atteint** : ni sélecteur, ni classe, ni mise en page. Une intention visuelle passe **par un
jeton, ou elle n'existe pas**.

⛔ **Les fiches de personnage ne sont pas concernées.** Dans GM-OS, une fiche est une reproduction
fidèle du PDF du jeu, construite par un autre outil, et **indépendante des thèmes** : elle ne lit
jamais `theme.css`.

**Les composants `.rpg-*` du SDK de thèmes** (`.rpg-panel`, `.rpg-button`…) ne servent qu'à la
page de démonstration du SDK (`docs/ui/rpg-theme-sdk/`). GM-OS ne les lit nulle part. Tu **PEUX**
en livrer pour cette démonstration, à la suite du bloc des jetons, mais ils sont **sans effet dans
GM-OS** : n'y consacre pas l'effort du thème, et ne compte jamais sur eux pour rendre une intention.

## 3 · Le format — ce que GM-OS sait lire

GM-OS ne charge pas la feuille : il la **relève** avec des règles simples. Hors de ces règles, il
ne voit rien, et ne te le dit pas.

1. Les jetons **DOIVENT** être déclarés dans un bloc de l'une de ces trois formes :
   `:root { … }`, `:root[data-theme="<jeu>"] { … }` ou `html[data-theme="<jeu>"] { … }`.
   RECOMMANDÉ : un seul bloc `:root[data-theme="<jeu>"]`, où `<jeu>` est le nom du dossier.
2. Une déclaration par ligne, terminée par `;` : `--rpg-accent: #8fb7b1;`
3. Une valeur **NE DOIT PAS** contenir d'accolade `{` ou `}`, et le bloc des jetons **NE DOIT
   PAS** contenir de bloc imbriqué ni de commentaire contenant une accolade.
4. **Un jeton, une seule déclaration.** Si plusieurs blocs le déclarent, le dernier gagne ; ne
   compte pas là-dessus.
5. La polarité **DOIT** figurer dans le même bloc : `color-scheme: dark;` ou `color-scheme: light;`
   Elle **DOIT** correspondre au fond réel, selon une règle vérifiable : si le blanc `#ffffff`
   contraste davantage avec `--rpg-bg` que le noir `#000000`, le fond est sombre et la polarité est
   `dark` ; sinon, `light`. Une polarité fausse fait afficher à GM-OS des contrôles clairs sur un
   fond sombre, ou l'inverse.
6. Les polices **DOIVENT** être importées en tête de fichier, en `https`, depuis
   **`fonts.googleapis.com` ou `fonts.bunny.net` uniquement**. Tout autre hôte est ignoré : la police
   ne sera jamais téléchargée et le texte retombera sur la police de repli.
7. Couleurs opaques : **`#rrggbb` uniquement** (six chiffres). GM-OS calcule le contraste et
   **dérive d'autres couleurs de l'accent** ; il ne sait pas le faire à partir d'un nom de couleur,
   de `hsl()` ou d'un `#rgb` court. Couleurs transparentes : `rgba(r, g, b, a)`.

## 4 · Les jetons

**Statut** :

- **LU** : GM-OS l'applique aujourd'hui. **LU ⚙** : GM-OS l'applique quand le meneur a allumé les
  **personnalités** dans ses Paramètres — un seul réglage, qui lui fait comparer l'interface
  d'aujourd'hui et la nouvelle. Livre ces jetons comme les autres : c'est là que ton thème prend sa
  forme, son relief et sa matière ;
- **V2** : le nouveau GM-OS l'appliquera. Livre-le dès maintenant : la version actuelle l'ignore
  sans erreur ;
- **SDK** : sans effet dans GM-OS ; ne sert qu'à la page de démonstration du SDK. Facultatif.

Un jeton absent n'est **pas une erreur** : GM-OS garde la valeur de son thème de base. Seuls les
jetons marqués **obligatoires** doivent être présents.

### 4.1 · Couleurs de base

| Jeton | Rôle dans GM-OS | Statut | Format | Obl. |
| --- | --- | --- | --- | --- |
| `--rpg-bg` | Fond de l'application | LU | `#rrggbb`, opaque | ✅ |
| `--rpg-surface` | Fond des panneaux et des cartes | LU | `#rrggbb`, opaque | ✅ |
| `--rpg-surface-2` | Panneau posé sur un panneau (2ᵉ niveau) | LU ⚙ | `#rrggbb`, opaque | |
| `--rpg-text` | Texte principal | LU | `#rrggbb`, opaque | ✅ |
| `--rpg-muted` | Texte secondaire : légendes, aides, valeurs inactives | LU | `#rrggbb`, opaque | ✅ |
| `--rpg-accent` | Couleur d'identité : bouton principal, élément actif, sélection | LU | `#rrggbb`, opaque | ✅ |
| `--rpg-accent-2` | Accent secondaire de la démonstration | SDK | libre | |
| `--rpg-accent-contrast` | Texte posé **sur** l'accent (bouton plein) | LU ⚙ | `#rrggbb`, opaque | |
| `--rpg-border` | Bordure des panneaux | LU | `#rrggbb` ou `rgba()` | ✅ |
| `--rpg-border-soft` | Séparateurs discrets | LU ⚙ | `rgba()` RECOMMANDÉ | |
| `--rpg-paper`, `--rpg-ink` | Page et encre de la démonstration | SDK | libre | |

⛔ **Le piège du vocabulaire « page de livre ».** Dans le SDK et sa page de démonstration, `bg`
est la table autour de la page et `surface` la page où le texte est posé. **Dans GM-OS, le texte est posé directement sur
`bg`**, et aussi sur `surface`. Par conséquent :

- `text`, `muted` et `accent` **DOIVENT** être lisibles **sur `bg` ET sur `surface`** (§ 6) ;
- `color-scheme` **DOIT** décrire la polarité de **`bg`** : `dark` si le fond est sombre, même si
  la page de démonstration est claire.

Mesuré le 2026-09-26 sur les six thèmes existants : **quatre tombent dans ce piège**. Le texte de
Star Trek, sombre pour une page blanche, a un contraste de 1,42 sur son fond gris foncé ; l'accent
de Dune, 1,03 ; Dune déclare `light` sur un fond sombre. Si la démonstration du SDK et
l'interface ne peuvent pas partager les mêmes valeurs, **l'interface l'emporte** : c'est la seule
qui compte.

### 4.2 · Couleurs d'état — nouvelles

GM-OS affiche partout des réussites, des dangers et des alertes : jets, santé, jauges, erreurs.
Le jeu les choisit ; GM-OS les applique quand le meneur a allumé les personnalités (LU ⚙).

| Jeton | Sens | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-success` | Réussite, santé pleine, action accomplie | LU ⚙ | `#rrggbb` |
| `--rpg-danger` | Échec, blessure grave, suppression | LU ⚙ | `#rrggbb` |
| `--rpg-warning` | Tension, jauge qui s'épuise, prudence | LU ⚙ | `#rrggbb` |
| `--rpg-info` | Information neutre | LU ⚙ | `#rrggbb` |

⚠️ Elles **DOIVENT** rester reconnaissables entre elles et avec l'accent : un danger qui ressemble
à l'accent fait lire une sélection comme une alerte.

### 4.3 · Typographie

| Jeton | Rôle dans GM-OS | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-font-display` | Titres, noms de module, grands nombres | LU — **obligatoire** | pile de polices |
| `--rpg-font-mono` | Chiffres, dés, valeurs, code | LU | pile de polices |
| `--rpg-font-body` | Texte courant de l'interface | LU ⚙ | pile de polices |
| `--rpg-font-ui` | Police d'interface de la démonstration | SDK | pile de polices |
| `--rpg-title-tracking` | Espacement des lettres des titres | LU ⚙ | `0em` à `0.5em` |
| `--rpg-kicker-tracking` | Espacement des petites étiquettes | LU ⚙ | `0em` à `0.6em` |
| `--rpg-title-transform` | Casse des titres | LU ⚙ | `none`, `uppercase` ou `small-caps` |

Une pile de polices **DOIT** finir par une famille générique (`serif`, `sans-serif`, `monospace`),
et chaque police nommée **DOIT** être importée (§ 3.6) ou être une police système courante.

### 4.4 · Tailles du texte

Facteurs appliqués à l'interface. Valeur : un nombre (`1.1`) ou un pourcentage (`110`), **borné
entre 0.8 et 2**. Hors bornes, GM-OS ramène à la borne.

| Jeton | Ce qu'il agrandit | Statut |
| --- | --- | --- |
| `--rpg-font-scale` | Tout le texte | LU |
| `--rpg-scale-interface` | Étiquettes et badges | LU |
| `--rpg-scale-corps` | Texte courant | LU |
| `--rpg-scale-titres` | Titres et grands nombres | LU |
| `--rpg-scale-mono` | Chiffres et code | LU |

N'en déclare que si le jeu le **justifie** (une police de titre très fine qui a besoin d'être plus
grande, par exemple). Par défaut, abstiens-toi : le meneur règle ses tailles lui-même.

### 4.5 · Forme — nouvelle

C'est ce qui distingue un thème d'une palette. Un jeu aux angles vifs **DOIT** le dire ici.

| Jeton | Rôle | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-radius-sm` | Arrondi des petits éléments : badges, champs | LU ⚙ | `0px` à `12px` |
| `--rpg-radius-md` | Arrondi des boutons et des cartes | LU ⚙ | `0px` à `20px` |
| `--rpg-radius-lg` | Arrondi des panneaux | LU ⚙ | `0px` à `32px` |
| `--rpg-border-width` | Épaisseur des bordures de panneau | LU ⚙ | `0px` à `3px` |
| `--rpg-border-style` | Style des bordures de panneau | LU ⚙ | `solid` ou `double` |

### 4.6 · Relief et lumière — nouveaux

| Jeton | Rôle | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-elevation-1` | Ombre d'un élément posé (carte, tuile) | LU ⚙ | valeur de `box-shadow`, ou `none` |
| `--rpg-elevation-2` | Ombre d'un panneau flottant | LU ⚙ | idem |
| `--rpg-elevation-3` | Ombre d'une boîte de dialogue | LU ⚙ | idem |
| `--rpg-shadow` | Ancienne ombre unique : GM-OS s'en sert pour `elevation-2` si celle-ci manque | LU ⚙ | idem |
| `--rpg-glow` | Couleur du halo autour de l'élément actif | LU ⚙ | `rgba()` ou `none` |
| `--rpg-glow-strength` | Intensité du halo | LU ⚙ | `0` à `1` |

`--rpg-glow: none;` est une vraie décision : un jeu sobre (papier, bois, métal mat) n'a pas de
halo.

### 4.7 · Transparence et verre — nouveaux

GM-OS pose des panneaux semi-transparents par-dessus le fond : les boîtes, les surcouches, et la
barre latérale quand le jeu ne déclare pas de cadre (§ 4.8).

| Jeton | Rôle | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-glass-bg` | Fond d'un panneau semi-transparent | LU ⚙ | `rgba()`, opacité **0.4 à 0.95** |
| `--rpg-glass-border` | Bordure de ce panneau | LU ⚙ | `rgba()`, opacité 0.05 à 0.6 |
| `--rpg-glass-blur` | Flou de ce qui est derrière | LU ⚙ | `0px` à `24px` |

### 4.8 · Le cadre — nouveau

Le **cadre**, c'est ce qui entoure les modules : la barre latérale et le bandeau du haut. Un jeu
**PEUT** lui donner une autre polarité que le contenu : un cadre de bois sombre autour d'un
parchemin, une console noire autour de fiches blanches.

| Jeton | Rôle | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-frame-bg` | Fond de la barre latérale et du bandeau du haut | LU ⚙ | `#rrggbb`, opaque |
| `--rpg-frame-text` | Texte et icônes du cadre | LU ⚙ | `#rrggbb`, opaque |
| `--rpg-frame-accent` | Élément actif du cadre : module ouvert, bouton allumé | LU ⚙ | `#rrggbb`, opaque |

- **Absents, ils valent `bg`, `text` et `accent`** : le cadre suit le contenu, comme aujourd'hui.
  N'en déclare que si le jeu le justifie.
- Si tu déclares `frame-bg`, **déclare aussi `frame-text` et `frame-accent`**. Sinon GM-OS pose
  `text` et `accent` sur ton fond de cadre, et c'est eux que le validateur mesure (§ 6) : un texte
  sombre, choisi pour un contenu clair, disparaît sur un cadre sombre.
- Le cadre est **opaque** : `glass-bg` ne s'y applique pas quand `frame-bg` est déclaré.

## 5 · La transparence — ce qui peut l'être, et ce qui ne le peut pas

| Jetons | Transparence |
| --- | --- |
| `bg`, `surface`, `surface-2`, `text`, `muted`, `accent`, `accent-contrast`, couleurs d'état, `frame-bg`, `frame-text`, `frame-accent` | ⛔ **Interdite.** GM-OS en calcule le contraste et en dérive des couleurs : une couleur transparente n'a pas de contraste défini |
| `border`, `border-soft` | Permise, opacité **0.08 à 1** |
| `glass-bg` | **Obligatoire** si déclaré, opacité **0.4 à 0.95**. En dessous, le texte n'est plus lisible sur une image |
| `glass-border`, `glow`, les ombres | Libre |
| Les matières (§ 7) | Opacité **au plus 0.35**, par `--rpg-texture-opacity` |

## 6 · Le contraste — des nombres, pas une impression

Le meneur lit son écran **à un mètre, dans une pièce tamisée**. Ratios WCAG :

| Paire | Minimum (en dessous : refusé) | Recommandé |
| --- | --- | --- |
| `text` sur `bg` | **4.5** | 7 |
| `text` sur `surface` | **4.5** | 7 |
| `muted` sur `bg` et sur `surface` | **3** | 4.5 |
| `accent` sur `bg` | **3** | 4.5 |
| `accent-contrast` sur `accent` | **4.5** | 7 |
| Chaque couleur d'état sur `bg` | **3** | 4.5 |
| `frame-text` sur `frame-bg` | **4.5** | 7 |
| `frame-accent` sur `frame-bg` | **3** | 4.5 |

Les deux dernières paires ne se mesurent que si `frame-bg` est déclaré. Sans `frame-text` ou
`frame-accent`, ce sont `text` et `accent` qui se mesurent sur `frame-bg` (§ 4.8).

Calcule-les avant de livrer. Aujourd'hui, l'atelier de GM-OS **signale** les trois premières
paires sous le minimum ; le contrôleur de thème en construction **refusera** tout thème sous le
minimum.

## 7 · Les matières — nouvelles

Une texture donne sa matière au jeu : papier, métal brossé, grain de film, cuir.

| Jeton | Rôle | Statut | Format |
| --- | --- | --- | --- |
| `--rpg-texture-bg` | Matière du fond de l'application | LU ⚙ | `none`, `url('matieres/<fichier>.svg')` ou un dégradé CSS |
| `--rpg-texture-panel` | Matière des panneaux | LU ⚙ | idem |
| `--rpg-texture-opacity` | Opacité des deux matières | LU ⚙ | `0` à `0.35` |

- Le chemin **DOIT** être relatif et rester **dans** le dossier `theme/`. Tout chemin qui en sort
  (`../`, chemin absolu, adresse web) est refusé.
- **SVG RECOMMANDÉ**, motif répétable, **200 Ko au plus**. Une image PNG ou WebP est permise
  (500 Ko au plus), mais **GM-OS ne sait pas encore l'afficher** : il l'écarte et le dit. Pour que la
  matière se voie, livre un SVG ou un dégradé.
- La matière **NE DOIT PAS** porter de texte ni d'information : elle est décor, et elle doit pouvoir
  disparaître sans rien perdre.
- Le texte **DOIT** rester lisible **sur la matière** : les paires du § 6 dont le fond est `bg`
  (sous `texture-bg`) ou `surface` (sous `texture-panel`) gardent leur minimum **au pire point**,
  là où l'encre de la matière la plus gênante est posée à `texture-opacity`. GM-OS relève les
  couleurs de la matière (celles d'un dégradé avec leur alpha ; celles d'un SVG à pleine force, et
  `currentColor` y vaut **noir**, car un SVG posé en fond n'hérite pas de la couleur du texte) et
  mesure ; le rapport donne ces contrastes à part (« `bg sous texture-bg` »). Sans
  `texture-opacity` déclarée, il mesure à **0.35**, la pire que le jeu puisse recevoir. Un bruit
  (`feTurbulence`) qui n'est pas ramené à une couleur du dessin (`SourceGraphic`) invente ses
  couleurs : **signalé, non mesuré**.

## 8 · Les ornements — nouveaux

Des éléments décoratifs posés par GM-OS à des **emplacements fixes**. Le jeu en fournit le dessin ;
GM-OS décide où et à quelle taille. **Appliqués quand le meneur allume les personnalités** (LU ⚙),
avec parcimonie : le `coin` sur un ou deux panneaux principaux par écran, pas sur chacun.

`ornements.json`, chaque emplacement facultatif :

```json
{
  "entete": "ornements/entete.svg",
  "coin": "ornements/coin.svg",
  "separateur": "ornements/separateur.svg",
  "fond": "ornements/fond.svg"
}
```

| Emplacement | Où GM-OS le pose | Forme attendue |
| --- | --- | --- |
| `entete` | Sous le titre d'un module | Frise horizontale, rapport 8:1 environ |
| `coin` | Coin supérieur gauche d'un panneau ; GM-OS le retourne pour les trois autres | Carré |
| `separateur` | Entre deux sections | Frise horizontale fine |
| `fond` | En filigrane dans un panneau vide | Motif centré |

**Règles des SVG** (matières comprises) :

- **DOIT** avoir un `viewBox` ;
- **DOIT** dessiner en `currentColor` : GM-OS le colore avec l'accent, ce qui garde l'ornement
  accordé au thème et au mode clair ;
- **NE DOIT PAS** contenir de `<script>`, d'attribut `on…`, d'`<image>` externe, de `<foreignObject>`
  ni de lien vers un autre fichier ;
- **50 Ko au plus** par ornement.

⚠️ **Cette liste d'emplacements est la plus difficile à changer du contrat**, puisque chaque thème
écrit s'y conforme. Si un emplacement manque au jeu que tu construis, **signale-le** au meneur
plutôt que d'en inventer un : GM-OS ne le lirait pas.

## 9 · Les icônes — nouvelles

GM-OS peut remplacer **certaines** de ses icônes par celles du jeu. `icones.json` associe un **nom du
tableau ci-dessous** à un SVG du dossier `icones/`. **Chaque icône est facultative** : livre celles qui
comptent pour ton jeu — *quinze icônes bien choisies font un thème* —, les autres restent celles de
GM-OS. **Appliquées quand le meneur allume les personnalités** (LU ⚙), comme les ornements.

```json
{
  "combat": "icones/combat.svg",
  "sante": "icones/sante.svg"
}
```

| Nom | Ce qu'elle désigne |
| --- | --- |
| `tableau-de-bord` | Le tableau de bord de la campagne |
| `journal` | Le journal de jeu |
| `forge` | La Forge |
| `musique` | La musique |
| `effets-sonores` | Les effets sonores |
| `ambiances` | Les ambiances |
| `voix` | Voice-OS, la voix du meneur |
| `favoris` | Les favoris |
| `nexus` | Le Nexus Wiki, le coffre de notes |
| `cortex` | Le Cortex, l’assistant IA |
| `combat` | Combat-OS |
| `des` | Dice-OS, les dés |
| `pnj` | Les PNJ |
| `carte` | La cartographie |
| `mediatheque` | La médiathèque |
| `image` | Image-OS, la projection |
| `horloge` | L’horloge et le temps |
| `lumiere` | Light-OS, la lumière |
| `tables` | Les tables aléatoires |
| `navigateur` | Le navigateur web |
| `tableau-blanc` | Le tableau blanc |
| `aide` | L’aide |
| `pj` | Un personnage joueur |
| `sante` | La santé, les points de vie |
| `initiative` | L’initiative en combat |
| `indice` | Un indice |
| `butin` | Le butin |
| `lieu` | Un lieu |
| `scene` | Une scène de la trame |
| `oracle` | L’Oracle |

**Règles des icônes** — celles des SVG du § 8, plus deux :

- **DOIT** avoir un `viewBox`, **carré** (`0 0 24 24` est RECOMMANDÉ) ;
- **DOIT** dessiner en `currentColor` : GM-OS la colore avec **la couleur du texte autour** — une icône
  de la barre latérale s'allume avec son module, comme celle qu'elle remplace ;
- **NE DOIT PAS** contenir de `<script>`, d'attribut `on…`, d'`<image>` externe, de `<foreignObject>`
  ni de lien vers un autre fichier ;
- **DOIT** rester lisible à **16 px** : un trait d'au moins 1,5 sur 24, peu de détails ;
- **20 Ko au plus** par icône ; le chemin est `icones/<fichier>.svg`.

⚠️ **Cette liste de noms se fige, comme les emplacements d'ornement** : GM-OS pourra en ajouter,
jamais en renommer ni en retirer. Si une icône manque au jeu que tu construis, **signale-la** au
meneur plutôt que d'inventer un nom : GM-OS ne le lirait pas.

## 10 · Ce que GM-OS fait seul — ne le fournis pas

- **Les couleurs des modules** (musique, combat, lumière…) : GM-OS les **dérive de ton accent**.
  Un accent unique suffit, et c'est voulu : tout l'écran appartient au même univers.
- **La lueur et les variantes de l'accent** : dérivées elles aussi.
- **La mise en page**, les tailles des composants, l'emplacement des boutons : ils appartiennent à
  GM-OS et ne se règlent pas par un thème.
- **Le thème de base** : le meneur choisit Moderne, Cyberpunk, Médiéval ou Clair. **Ton thème se
  pose par-dessus** : tout jeton que tu déclares l'emporte — **forme, relief, matière et ornements
  compris**, pas seulement les couleurs —, tout jeton absent laisse celui du thème de base. Déclare
  donc la forme dès que le jeu a une identité propre (des angles vifs, un relief gravé, une
  matière) : sinon, il héritera de celle du thème choisi par le meneur.

## 11 · Ce qui est interdit

- Tout script, toute expression, toute règle `@` autre que l'`@import` de police des hôtes
  autorisés. Un `@font-face` est **ignoré** par l'interface : la police doit passer par `@import`.
- Tout chemin qui sort du dossier `theme/`, et toute ressource chargée depuis le web autre que les
  polices des deux hôtes autorisés.
- Toute tentative de régler l'interface par des sélecteurs (`.sidebar`, `body`, `button`…) : sans
  effet dans GM-OS.
- `!important` dans le bloc des jetons.

## 12 · Squelette à suivre

```css
/* ==========================================================================
   RPG THEME — <NOM DU JEU>
   Contrat GM-OS v1.7
   ========================================================================== */

@import url('https://fonts.googleapis.com/css2?family=<Police+Titre>:wght@500;700&family=<Police+Mono>:wght@400;600&display=swap');

:root[data-theme="<jeu>"] {
  color-scheme: dark;

  /* 4.1 · Couleurs de base */
  --rpg-bg: #rrggbb;
  --rpg-surface: #rrggbb;
  --rpg-surface-2: #rrggbb;
  --rpg-text: #rrggbb;
  --rpg-muted: #rrggbb;
  --rpg-accent: #rrggbb;
  --rpg-accent-2: #rrggbb;
  --rpg-accent-contrast: #rrggbb;
  --rpg-border: rgba(r, g, b, a);
  --rpg-border-soft: rgba(r, g, b, a);
  --rpg-paper: #rrggbb;
  --rpg-ink: #rrggbb;

  /* 4.2 · États */
  --rpg-success: #rrggbb;
  --rpg-danger: #rrggbb;
  --rpg-warning: #rrggbb;
  --rpg-info: #rrggbb;

  /* 4.3 · Typographie */
  --rpg-font-display: "<Police Titre>", <repli>, serif;
  --rpg-font-body: "<Police Texte>", <repli>, sans-serif;
  --rpg-font-ui: "<Police Interface>", <repli>, sans-serif;
  --rpg-font-mono: "<Police Mono>", <repli>, monospace;
  --rpg-title-tracking: 0.08em;
  --rpg-kicker-tracking: 0.18em;
  --rpg-title-transform: none;

  /* 4.5 · Forme */
  --rpg-radius-sm: 4px;
  --rpg-radius-md: 8px;
  --rpg-radius-lg: 14px;
  --rpg-border-width: 1px;
  --rpg-border-style: solid;

  /* 4.6 · Relief et lumière */
  --rpg-elevation-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --rpg-elevation-2: 0 8px 24px rgba(0, 0, 0, 0.45);
  --rpg-elevation-3: 0 18px 55px rgba(0, 0, 0, 0.5);
  --rpg-glow: rgba(r, g, b, 0.35);
  --rpg-glow-strength: 0.6;

  /* 4.7 · Verre */
  --rpg-glass-bg: rgba(r, g, b, 0.7);
  --rpg-glass-border: rgba(r, g, b, 0.15);
  --rpg-glass-blur: 12px;

  /* 4.8 · Cadre — facultatif : seulement si le cadre change de polarité */
  /* --rpg-frame-bg: #rrggbb; */
  /* --rpg-frame-text: #rrggbb; */
  /* --rpg-frame-accent: #rrggbb; */

  /* 7 · Matières */
  --rpg-texture-bg: none;
  --rpg-texture-panel: none;
  --rpg-texture-opacity: 0;
}

/* Facultatif : composants .rpg-* pour la page de démonstration du SDK — sans effet dans GM-OS. */
```

## 13 · Liste de contrôle avant de livrer

- [ ] `theme.css` a un bloc de jetons de la forme du § 3.1, avec `color-scheme`.
- [ ] Les jetons obligatoires sont présents : `bg`, `surface`, `text`, `muted`, `accent`, `border`,
      `font-display`.
- [ ] Toutes les couleurs opaques sont en `#rrggbb` ; aucune n'est transparente (§ 5).
- [ ] Chaque paire du § 6 atteint son minimum, et tu as indiqué les ratios obtenus au meneur.
- [ ] Les couleurs d'état se distinguent entre elles et de l'accent.
- [ ] Si tu déclares un cadre (§ 4.8), ses trois jetons sont là et ses deux paires atteignent leur
      minimum.
- [ ] Chaque police nommée est importée depuis un hôte autorisé ou est une police système.
- [ ] Toutes les valeurs sont dans leurs bornes (§ 4).
- [ ] Les chemins de matières et d'ornements restent dans `theme/`, et les SVG respectent le § 8.
- [ ] Aucun jeton n'est déclaré deux fois ; aucun `!important` dans le bloc des jetons.
- [ ] `color-scheme` correspond au fond réel, selon la règle du § 3.5.
- [ ] `intention.md` existe, avec l'intention visuelle **et** les limites signalées (§ 1.1) — même
      vide, la partie des limites dit « aucune ».
- [ ] Si le meneur t'a transmis un **rapport du validateur**, chaque erreur est corrigée ; tu ne
      recalcules pas ses contrastes, tu les lis.
- [ ] Tu as dit au meneur, en une phrase, **l'identité visuelle voulue** (forme, relief, matière) :
      elle l'aidera à juger le rendu dans GM-OS.

## 14 · Versions du contrat

| Version | Date | Ce qui change |
| --- | --- | --- |
| **v1** | 2026-09-26 | Premier contrat écrit. GM-OS lit **13 réglages** (6 couleurs, 2 polices, 5 tailles), la polarité et les polices importées. Les jetons **V2** sont réservés et annoncés : forme, relief, verre, états, matières, ornements. |
| **v1.1** | 2026-09-26 | ⛔ Le **piège « page de livre »** (§ 4.1) : dans GM-OS, le texte est posé sur `bg`, pas seulement sur `surface` — quatre des six thèmes existants y tombent. **Polarité vérifiable** (§ 3.5). **`intention.md` obligatoire**, avec les limites signalées et leur classe (§ 1.1). Le déroulé du travail vit dans [`Pipeline-des-themes.md`](./Pipeline-des-themes.md). |
| **v1.2** | 2026-09-26 | ⛔ **Un seul consommateur** (§ 2) : les fiches de personnage sont **indépendantes des thèmes** (décision de David) et ne lisent jamais `theme.css` — la v1 affirmait l'inverse. Les composants `.rpg-*` et les jetons `paper`, `ink`, `accent-2`, `font-ui` passent au statut **SDK** : facultatifs, sans effet dans GM-OS. La classe de limite « fiches seulement » disparaît. |
| **v1.7** | 2026-10-03 | ⭐ **Le texte sur la matière** (§ 7) : les contrastes du § 6 se mesurent aussi **au pire point de la matière**, et refusent sous le minimum. Aucun jeton ne change ; les sept thèmes du dépôt restent acceptés. Un thème v1.6 dont la matière noie le texte est désormais refusé. |
| **v1.6** | 2026-10-03 | ⭐ **Les icônes sont publiées** (§ 9) : trente noms — les modules, puis les notions de jeu (PJ, santé, initiative, indice, butin, lieu, scène, Oracle). `icones.json` et `icones/*.svg` entrent au paquet (§ 1), sous l'interrupteur des personnalités. Surcharge partielle, repli sur les icônes de GM-OS. Aucun jeton ne change : **tout thème v1.5 reste valide**. |
| **v1.5** | 2026-09-30 | ⭐ **Plus aucun jeton V2** : les treize derniers passent à **LU ⚙**, lus par les nouveaux composants de GM-OS — `surface-2`, `accent-contrast`, `border-soft`, les **quatre couleurs d'état**, `border-width`, `border-style`, `title-tracking`, `kicker-tracking`, `title-transform`, `texture-panel`. **Les ornements** (§ 8) s'appliquent aussi, sous le même interrupteur. Un nom de bloc peut contenir une espace : `:root[data-theme="cthulhu hack"]` (le nom du dossier). |
| **v1.4** | 2026-09-29 | ⭐ **Dix-huit jetons passent de V2 à LU ⚙** : la forme (`radius-*`), le relief (`elevation-*`, `shadow`, `glow`, `glow-strength`), le verre (`glass-*`), la police du corps (`font-body`), la matière de fond (`texture-bg`, `texture-opacity`) et le cadre (`frame-*`). GM-OS les applique quand le meneur allume les **personnalités** : éteintes, **aucun thème existant ne change** — décision du meneur, qui veut comparer avant d'adopter. Restent **V2** ceux qu'aucun élément de l'écran ne lit encore : `surface-2`, `accent-contrast`, `border-soft`, les états, `border-width`, `border-style`, `title-*`, `kicker-tracking`, `texture-panel`. Une matière `url('matieres/…')` doit être un **SVG** (§ 7). |
| **v1.3** | 2026-09-27 | ⭐ **Le cadre** (§ 4.8) : trois jetons **V2**, `frame-bg`, `frame-text`, `frame-accent`, pour une barre latérale et un bandeau d'une autre polarité que le contenu, et leurs deux paires de contraste (§ 6). Absents, ils valent `bg`, `text` et `accent` : aucun thème existant ne change. Né du relevé des quatre thèmes de base de GM-OS, dont deux (Médiéval, Moderne) ont un cadre sombre autour d'un contenu clair. |

Un jeton annoncé **V2** peut encore changer de nom ou de bornes avant d'être appliqué ; tout
changement sera inscrit ici. **Un jeton qui ne figure pas dans ce document n'est lu par personne.**
