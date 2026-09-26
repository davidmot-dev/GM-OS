---
version: alpha
name: GM-OS — console du meneur
description: >-
  Interface de bureau d'un meneur de jeu de rôle, lue pendant les parties, à un mètre, dans une
  pièce tamisée. Point de départ : le thème Cyberpunk actuel. Chaque jeu de rôle peut remplacer
  ces valeurs par les siennes.
colors:
  primary: "#06b6d4"
  on-primary: "#020617"
  background: "#020617"
  surface: "#0f172a"
  surface-raised: "#1e293b"
  text: "#f8fafc"
  text-muted: "#898c95"
  border: "#1e293b"
  success: "#10b981"
  danger: "#ef4444"
  warning: "#f59e0b"
  info: "#3b82f6"
  on-status: "#020617"
typography:
  display-lg:
    fontFamily: Orbitron
    fontSize: 34px
    fontWeight: 700
    letterSpacing: 0.04em
  title-md:
    fontFamily: Orbitron
    fontSize: 17px
    fontWeight: 700
    letterSpacing: 0.08em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 700
    letterSpacing: 0.12em
  number-lg:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: 700
  number-md:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: 600
rounded:
  sm: 6px
  md: 10px
  lg: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 16px
  caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label-sm}"
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
  tile:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.lg}"
    size: 160px
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px
  badge-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px
---

## Overview

GM-OS est une application de bureau (Electron) pour un meneur de jeu de rôle. Elle sert **pendant
les parties** : le meneur la lit **à un mètre, dans une pièce tamisée**, sur un ordinateur à deux
écrans de **1440 × 900** (celui du bas est tactile). L'interface est **en français**. Elle compte
27 modules : combat, dés, musique, lumières, carte, horloge, trame narrative, images…

Deux régimes coexistent :

- **Atelier** — la préparation : dense, les outils d'édition à portée ;
- **Table** — en jeu : tout plus grand, ce qui compte se lit de loin, les actions destructives
  sont éloignées.

Le ton : une console de régie, sûre et lisible, qui laisse la place à l'univers du jeu en cours.
**Chaque jeu de rôle peut remplacer les valeurs de ce fichier par les siennes** (Blade Runner,
Alien, Dune…) : le design ne doit jamais dépendre d'une couleur précise pour être compris.

Les valeurs ci-dessus sont celles du thème **Cyberpunk** actuel : un **point de départ**, pas une
direction imposée. Il existe quatre thèmes de base — Moderne, Cyberpunk, Médiéval, Clair — qui
doivent devenir quatre **personnalités** nettement différentes (forme, relief, matière,
typographie), avec la même grammaire d'écran.

## Colors

Les noms des couleurs correspondent aux variables que GM-OS applique ; garde-les.

| Couleur | Rôle | Variable de GM-OS |
| --- | --- | --- |
| `background` | Fond de l'application ; du texte y est posé directement | `--rpg-bg` |
| `surface` | Panneaux et cartes | `--rpg-surface` |
| `surface-raised` | Élément posé sur un panneau (2ᵉ niveau), tuiles | `--rpg-surface-2` |
| `text` | Texte principal | `--rpg-text` |
| `text-muted` | Légendes, aides, valeurs inactives | `--rpg-muted` |
| `primary` | L'accent : bouton principal, élément actif, sélection | `--rpg-accent` |
| `on-primary` | Texte posé sur l'accent | `--rpg-accent-contrast` |
| `border` | Bordure des panneaux | `--rpg-border` |
| `success`, `danger`, `warning`, `info` | Réussite, danger, alerte, information | `--rpg-success`… |

Règles :

- Contraste WCAG **≥ 4,5** pour `text` sur `background` **et** sur `surface` ; **≥ 3** pour
  `text-muted` et pour `primary` sur `background`.
- Les quatre couleurs d'état restent **reconnaissables entre elles et avec l'accent** : un danger
  qui ressemble à la sélection fait lire une sélection comme une alerte.
- **Un seul accent.** GM-OS dérive seul les teintes des modules et la lueur de l'accent.
- `text-muted` est aujourd'hui du texte à ~55 % d'opacité ; il devient une vraie couleur.

## Typography

Trois familles : **titres** (display), **texte courant** (body), **chiffres** (mono, à chasse
fixe : jets, jauges, minuteurs, initiatives).

⚠️ Aujourd'hui, **tout** le texte de l'interface est dans la police de titre — une police de texte
distincte est prévue. Ne prends pas ce défaut pour une intention : propose une police de texte
lisible.

Quatre **bandes de taille** que le meneur règle séparément : étiquettes et badges, texte courant,
titres et grands nombres, chiffres et code. Les tailles sont données en pixels réels.

- Texte lu : **14 px au moins** ; étiquettes et badges : **11 px au moins** (des étiquettes de
  7 à 10 px existent aujourd'hui et ne se lisent pas à un mètre).
- Les petites capitales espacées servent aux étiquettes ; jamais au texte à lire.
- Les grandes valeurs chiffrées (initiative, résultat d'un jet, points de vie) dominent leur carte.

## Layout

Structure fixe, **à conserver** :

- une **barre latérale** à gauche, la liste des modules ;
- un **bandeau** en haut : titre du module, volume, « Stop all », régime Atelier / Table,
  connexions des joueurs ;
- le **module** au centre.

À l'intérieur des modules, une **grammaire d'écran commune** reste à définir, et elle est l'enjeu
de ce projet : où vivent le titre du module et son état, la barre d'actions principale, la zone
de travail, les réglages, le panneau latéral. En ouvrant n'importe quel module, le meneur doit
savoir où regarder.

Cadre de travail : **1440 × 900**, bureau. Pas de version mobile.

## Elevation & Depth

GM-OS prévoit ces réglages, que le format ne sait pas encore porter en jetons — décris-les en
valeurs CSS :

- **trois niveaux d'ombre** : élément posé (carte, tuile), panneau flottant, boîte de dialogue ;
- un **halo** autour de l'élément actif (couleur et intensité ; un thème sobre peut n'en avoir
  aucun) ;
- le **verre** : fond translucide (opacité **0,4 à 0,95**), bordure, flou de l'arrière-plan
  (0 à 24 px) — pour la barre latérale, les boîtes et les surcouches ;
- une **matière** discrète : grain, métal brossé, papier… opacité **0,35 au plus**, jamais porteuse
  d'information.

## Shapes

- Arrondis : `sm` (badges, champs, 0 à 12 px), `md` (boutons, cartes, 0 à 20 px), `lg` (panneaux,
  0 à 32 px). Un univers aux angles vifs met **0**.
- Bordures de panneau : épaisseur **0 à 3 px**, style **simple ou double**.
- Ornements possibles, à quatre emplacements seulement : sous le titre d'un module, dans le coin
  d'un panneau, entre deux sections, en filigrane d'un panneau vide.

## Components

Les éléments qui reviennent dans tous les modules, et qui doivent se ressembler partout :

- **Bouton principal** et **bouton secondaire** — touchables au doigt (44 px de haut au moins).
- **Carte** — un combattant, un morceau, un PNJ : titre, valeur chiffrée, jauges, actions.
- **Tuile** — pads de musique, scènes de lumière : s'active d'un geste, se modifie par un geste
  distinct, n'affiche que l'essentiel au repos.
- **Jauge** — santé, tension, sang-froid : lisible de loin, alerte dans son dernier quart.
- **Badge d'état** — réussite, danger, alerte, information.
- **Panneau de réglages** — ce qui se règle avant la partie, séparé de ce qui se fait pendant.
- **Onglets** — playlists, vues, catégories.

## Do's and Don'ts

- **Do** : garder **chaque** information et **chaque** commande des captures ; garder les
  libellés français tels quels.
- **Do** : penser le régime Table — ce qui compte en jeu se lit de loin.
- **Do** : rendre les quatre thèmes de base reconnaissables d'un coup d'œil, même en noir et blanc.
- **Don't** : ajouter ou supprimer une fonctionnalité.
- **Don't** : un effet qui ne se résume pas aux valeurs de ce fichier et aux réglages de la
  section Elevation & Depth.
- **Don't** : reprendre des images « _mockup » autre chose que l'ambiance (matières, lumière,
  typographie, densité). Plusieurs de leurs boutons n'existent pas dans le logiciel, et leurs
  libellés sont en anglais.
