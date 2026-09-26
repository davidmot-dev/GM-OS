---
version: alpha
name: GM-OS — Brutal Diegetic Console (direction retenue, 2026-09-26)
description: >-
  Réunion des deux exports de Stitch (prompt 1 et sa correction) : les jetons du second, la prose
  du premier. Contradictions tranchées par Claude Code — voir la note en fin de fichier.
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
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: 0.06em
  title-md:
    fontFamily: Orbitron
    fontSize: 18px
    fontWeight: 700
    lineHeight: 24px
    letterSpacing: 0.08em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 700
    lineHeight: 15px
    letterSpacing: 0.12em
  number-lg:
    fontFamily: Space Mono
    fontSize: 28px
    fontWeight: 700
  number-md:
    fontFamily: Space Mono
    fontSize: 15px
    fontWeight: 600
rounded:
  sm: 0px
  md: 0px
  lg: 0px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  gutter: 12px
  margin: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
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
  tile:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    height: 24px
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    height: 24px
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    height: 24px
  badge-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-status}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    height: 24px
---

## Overview

Une station de régie tactique pour un meneur qui joue dans la pénombre, à un mètre de deux écrans
de 1440 × 900. Brutalisme cybernétique : arêtes vives à zéro degré, aucun adoucissement,
signalétique franche. Chaque conteneur est un caisson, chaque jauge une unité de télémesure.

⚠️ **Deux choses distinctes dans ce fichier.** La **grammaire d'écran** (Layout, Components) vaut
pour les quatre thèmes de base et pour les thèmes de jeu. Le **style** (arêtes à zéro, halos cyan,
grain) est une **personnalité** — la candidate du thème Cyberpunk (décision D3).

## Colors

Celles du thème Cyberpunk actuel, reprises telles quelles par Stitch. `primary` est l'accent
(`--rpg-accent`) ; il est réservé aux éléments actifs, aux sélections et aux actions décisives.
Les quatre couleurs d'état restent distinctes entre elles et du cyan.

## Typography

- **Orbitron** — les titres de module et les grands intitulés.
- **Inter** — tout le texte à lire (noms, descriptions, titres de morceaux, libellés) et les
  étiquettes.
- **Space Mono** — les chiffres seulement : initiatives, points de vie, durées, compteurs,
  résultats. Sa chasse fixe empêche les valeurs de sautiller quand elles changent.
- Les étiquettes en capitales espacées ne descendent **jamais sous 11 px**.

## Layout

La **grammaire d'écran**, identique dans chaque module :

1. **En-tête du module** — le titre (Orbitron), un surtitre ou une ligne d'état en pastilles.
2. **Barre(s) d'outils** — juste sous l'en-tête : l'action principale en bouton plein à gauche,
   les secondaires ensuite ; une deuxième ligne au besoin.
3. **Zone de travail** — au centre, la plus grande possible.
4. **Panneau de réglages à droite** (~ 300 px) — ce qui se règle, séparé de ce qui se fait ; en
   régime Table, il se replie ou se verrouille.

La barre latérale (220 px) et le bandeau du haut (56 px) ne changent pas. Grille de 12 colonnes,
gouttières de 12 px, marges de 16 px. En régime **Table**, les espacements passent de `sm`–`md` à
`lg`–`xl` et les cibles tactiles à 48 px.

## Elevation & Depth

Pas d'ombres diffuses : un étagement net et des filets.

- **Niveau 1** (carte) : `surface`, bordure `1px solid #1e293b`, aucune ombre.
- **Niveau 2** (panneau surélevé, tuile) : `surface-raised`, filet supérieur
  `1px solid rgba(34, 211, 238, 0.2)`.
- **Niveau 3** (fenêtre flottante) : `rgba(15, 23, 42, 0.95)`, `backdrop-filter: blur(16px)`,
  bordure `1px solid #22d3ee`, ombre `0 0 0 1px #020617, 0 8px 32px rgba(0, 0, 0, 0.85)`.
- **Halo de l'élément actif** : `0 0 16px rgba(34, 211, 238, 0.35), inset 0 0 8px rgba(34, 211, 238, 0.15)`.
- **Matière** : un grain de balayage cathodique à 4 % d'opacité sur le fond.

## Shapes

- Arrondi **0 px** partout (boutons, cartes, modales, jauges, badges, tuiles).
- Barrette verticale de **3 px** à gauche d'une carte sélectionnée (cyan) ou hostile / en alerte
  (rouge).
- Ornements possibles : encoche biseautée à 45° (8 px) au coin d'une tuile maîtresse ; réticule
  filaire discret à l'angle d'un module.

## Components

- **Carte de combattant** — initiative en grand (`number-lg`) à gauche, nom (Inter, gras) et
  badges de camp, description en `body-sm` estompé ; actions (« Calculer soins / dégâts »,
  « Fiche ») en haut à droite ; en dessous, trois blocs : points de vie (valeur, état, jauge),
  sang-froid (valeur, jauge), cible actuelle (liste).
- **Tuile / pad** — la touche en badge (« DIGIT 1 »), le titre sur deux ou trois lignes, catégorie
  et durée en pied ; l'état actif en bordure pleine et halo. « Ajouter » occupe une case de la
  grille.
- **Platine** — titre du morceau, temps écoulé / durée en `number-lg`, **forme d'onde
  horizontale** avec les repères d'entrée et de sortie de boucle, puis le transport (lecture,
  stop, boucle) en gros boutons carrés.
- **Couche de carte** — œil de visibilité, nom, valeur d'état en badge à droite.
- **Jauge** — rail de 8 px ; verte, puis ambre, puis rouge sous 25 %.

## Do's and Don'ts

- **Do** — la même grammaire dans chaque module ; le panneau de réglages toujours à droite.
- **Do** — les chiffres en Space Mono, le texte en Inter.
- **Don't** — une étiquette sous 11 px.
- **Don't** — une fonction absente de GM-OS. Stitch en a inventé plusieurs, retirées à la main :
  flux caméra, historique du log, règles de mort subite, « Cortex verrouillé » (combat) ;
  égaliseur, ratio de synchro, dossiers de raccourcis, second choix de sortie, latence, lien
  Spotify (musique) ; FPS, latence, coordonnées, cône de vision (carte).
- ⚠️ **Mais attention au sens inverse** : le panneau de la carte compte treize sections, et la
  première capture n'en montrait que le haut. La barre d'outils du bas (pions, formes, ping)
  retirée au prompt 1 **n'était pas inventée** — erreur de Claude Code, corrigée au prompt 3 avec
  les captures `5-carte-reglages-*`.

---

*Note de Claude Code.* Le dernier export de Stitch avait perdu sa prose, annonçait Orbitron pour
les titres tout en les définissant en Space Grotesk (que ses écrans ne chargent pas), et gardait une
étiquette à 10 px dans ses écrans. Tranché ici : titres en Orbitron (ce que les écrans emploient),
étiquettes à 11 px au moins, prose du premier export mise à jour.
