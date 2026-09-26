# Prompts pour Stitch — phase 2 de la refonte (T2.1 et T2.2)

**Pour** : David, qui colle ces prompts dans Stitch avec les captures de la vitrine.
**Captures** : `e2e-resultats/vitrine/` (onze fichiers, produits le 2026-09-26 par
`$env:GMOS_VITRINE='1'; npx playwright test e2e/vitrine.spec.ts`).
**Plan** : [`2026-09-17-refonte-interface.md`](./2026-09-17-refonte-interface.md), § 0 et § 5.

## Mode d'emploi

0. ⭐ **Importe d'abord [`stitch/DESIGN.md`](./stitch/DESIGN.md) dans le projet Stitch.** C'est
   un fichier au format ouvert de Google ([spécification](https://github.com/google-labs-code/design.md)) :
   des jetons aux noms de GM-OS (fond, surface, accent, états, arrondis, polices), partant du
   thème Cyberpunk actuel, et en prose le contexte, les contraintes et la règle sur les maquettes.
   Ses couleurs passent le contrat de GM-OS (vérifié par `validerLeTheme`). Une fois importé, **le
   bloc de contexte (§ 1) devient inutile** : ne le colle que si Stitch n'a pas pris le fichier.
1. **Une conversation Stitch par prompt**, dans ce même projet : colle le prompt et joins les
   captures indiquées.
2. **L'ordre compte** (décision D2) : la **grammaire commune** d'abord (prompt 1), puis les écrans
   qui s'y rangent (prompts 2 à 7), puis les **quatre personnalités** (prompt 8).
3. Réglages de Stitch : **application web, bureau**, cadre de **1440 × 900**.
4. Pour chaque direction retenue, rapporte-moi **son `DESIGN.md` exporté** — c'est ce que je
   traduis — plus l'image, et l'export Tailwind en complément (prompt 9).
5. ⛔ **On ne colle jamais le code de Stitch dans GM-OS** (plan § 5) : je traduis chaque direction
   en **valeurs de jetons** (T2.3), et tu juges dans ta vraie application (T2.4). Le `DESIGN.md`
   reste l'outil de travail de Stitch ; **le contrat des thèmes reste la référence de GM-OS**.

### Les maquettes des guides — des références de style, jamais des modèles

`documentation/User Guides/` contient **14 maquettes** (`*_mockup.png`), une en tête de chaque
guide. Ce sont des **illustrations d'ambiance générées par IA**, pas des écrans de GM-OS :
format carré, libellés anglais, et **des fonctions qui n'existent pas** (« Previous turn »,
« Add status », actions Attack / Dash / Hide dans le combat ; égaliseur et synchro BPM dans la
musique). Elles donnent en revanche une direction de style nette : verre sombre, halos, grosses
valeurs chiffrées.

Joins-les **en plus** des captures, là où chaque prompt l'indique (« Référence de style »). Le
bloc de contexte dit à Stitch de n'en prendre que l'ambiance — sinon il recopierait les fausses
fonctions.

| Maquette | Prompt |
| --- | --- |
| `combat_mockup.png`, `dice_mockup.png`, `image_mockup.png` | 1 (la grammaire) |
| `music_mockup.png` | 2 |
| `map_mockup.png` | 3 |
| `light_mockup.png` | 4 |
| `dice_mockup.png` | 5 |
| `combat_mockup.png` | 6 et 8 |

---

## 1 · Le bloc de contexte — seulement si Stitch n'a pas importé `DESIGN.md`

```text
Contexte : tu redessines GM-OS, une application de bureau (Electron) pour un meneur de jeu de rôle.
Elle sert PENDANT les parties : le meneur la lit à un mètre, dans une pièce tamisée, sur un
ordinateur à deux écrans de 1440 × 900 (celui du bas est tactile). L'interface est en français.

Structure fixe, à conserver : une barre latérale à gauche (les modules), un bandeau en haut
(titre du module, volume, « Stop all », régime Atelier / Table, connexions), et le module au
centre. Il y a 27 modules ; les captures jointes sont les vrais écrans, avec de vraies données.

Deux régimes : « Atelier » (préparation, dense, outils d'édition à portée) et « Table » (en jeu :
tout plus grand, les actions destructives éloignées).

Contraintes :
- Garde CHAQUE information et CHAQUE commande visibles sur les captures. N'ajoute aucune
  fonctionnalité, n'en supprime aucune. Garde les libellés français tels quels.
- Lisibilité à un mètre : texte courant contraste WCAG ≥ 4,5, texte secondaire ≥ 3. Rien en
  dessous de 12 px.
- Les couleurs d'état (réussite, danger, alerte, information) doivent se distinguer entre elles
  et de la couleur d'accent.
- Le style doit pouvoir s'exprimer par des variables : fond, surface, surface de 2e niveau,
  texte, texte estompé, accent, texte sur l'accent, bordure, quatre couleurs d'état, polices de
  titre / de texte / chiffres, rayons d'arrondi (petit, moyen, grand), épaisseur et style de
  bordure, trois niveaux d'ombre, halo de l'élément actif, verre (fond translucide, bordure,
  flou), matière de fond. Pas d'effet qui ne se résume pas à ces variables.
- Chaque jeu de rôle peut remplacer ces variables par les siennes : le design ne doit pas
  dépendre d'une couleur précise pour être compréhensible.

Deux sortes d'images jointes :
- les CAPTURES (fichiers numérotés, 1440 × 900) sont les vrais écrans : c'est leur contenu qui
  fait foi ;
- les RÉFÉRENCES DE STYLE (fichiers « _mockup ») ne donnent que l'ambiance — matières, lumière,
  typographie, densité. N'en reprends ni les fonctions, ni les libellés anglais, ni la mise en
  page : plusieurs de leurs boutons n'existent pas dans le logiciel.
```

---

## 2 · Les prompts

### Prompt 1 — La grammaire commune (décision D2)

**Joindre** : `1-combat.png`, `4-musique.png`, `5-carte.png`. **Référence de style** : `combat_mockup.png`, `dice_mockup.png`, `image_mockup.png`.

```text
Voici trois écrans très différents du même logiciel : un combat (liste de combattants), une
console de musique (deux platines, un mixeur, des pads) et une carte tactique (une grande
surface et un panneau de réglages). Aujourd'hui, chacun a été conçu séparément et ils ne se
ressemblent pas.

Propose UNE grammaire d'écran commune, et montre-la appliquée à ces trois écrans :
- où vit le titre du module et son état ;
- où vit la barre d'actions principale ;
- la zone de travail principale ;
- où vivent les réglages et options (panneau latéral ? repliables ?) ;
- comment se présentent une carte, une tuile, un bouton principal, un bouton secondaire,
  une valeur chiffrée, un badge d'état.

Le but : qu'en ouvrant n'importe quel module, le meneur sache où regarder. Garde la barre
latérale et le bandeau du haut. Produis les trois écrans avec la même grammaire, en thème sombre.
```

### Prompt 2 — Musique (réagencement permis)

**Joindre** : `4-musique.png`, et l'image retenue au prompt 1. **Référence de style** : `music_mockup.png`.

```text
Applique la grammaire de l'image jointe à la console de musique (capture 4-musique).
Le meneur dit : « réorganiser le tout vers une interface plus moderne et claire ; les boutons
et options sont parfois un peu petits », et pour les playlists : « réorganiser cet écran ».

Éléments à garder : les onglets de playlists (en haut), deux platines A et B (titre du morceau,
forme d'onde, temps écoulé / durée, entrée / sortie de boucle, lecture-pause, stop, boucle),
les pads de la playlist (une tuile par morceau, couleur, raccourci clavier), « Ajouter »,
le master, le fondu croisé A↔B au centre, la durée du fondu automatique, le choix de la sortie
audio, « Key learn ».
Tu peux réagencer librement. Les commandes de lecture doivent être grandes et touchables au doigt.
Retire aussi l'égaliseur rapide, le « Sync ratio » et le bloc « Dossiers & raccourcis » : ils
n'existent pas dans le logiciel.
```

### Prompt 3 — Cartographie (réagencement permis)

**Joindre** : `5-carte.png` **et les quatre `5-carte-reglages-*.png`** (le panneau de réglages entier : il ne tient pas dans l'écran), et l'image retenue au prompt 1. **Référence de style** : `map_mockup.png`.

```text
Applique la grammaire à la carte tactique (capture 5-carte). Le meneur dit : « tous les
paramètres et options se mélangent, il faut réorganiser l'interface ».

Éléments à garder : la carte (grande, avec le brouillard de guerre et les pions), les
configurations sauvées (presets), importer un média, supprimer la carte, « Vision de l'Oracle »,
la gestion des couches (brouillard, grille, pions, effets magiques, zones de danger, climat et
météo, ambiance et heure), chacune avec son œil de visibilité.
Sépare ce qui se fait pendant la partie (révéler, déplacer, masquer) de ce qui se règle avant.
Donne à la carte le plus de place possible.
```

### Prompt 4 — Light-OS (réagencement permis)

**Joindre** : `6-lumiere.png`, **`6-lumiere-tuiles-*.png` et `6-lumiere-panneau-*.png`** (les tuiles et le panneau défilent ; les lampes, en bas, viennent du mode simulé), et l'image retenue au prompt 1. **Référence de style** : `light_mockup.png`.

```text
Applique la grammaire au pilotage des lumières (capture 6-lumiere). Le meneur dit : « la
disposition des lampes en dessous n'est pas toujours optimum ; les informations dans les pads
sont trop fournies, il est parfois difficile de modifier un pad ou même de l'activer ».

Éléments à garder : le pont Philips Hue et sa synchro audio, l'intensité globale, « la lumière
suit la voix », les actions rapides (Rouge critique, Bleu arcanique, Vert de soin), l'éclairage
normal, « Arrêter la scène », « Blackout d'urgence », le temps de transition, les tuiles de
scène (celles de la campagne, puis les communes, et les cases vides « Capturer »), la scène
active, la liste des lampes.
Une tuile doit s'activer d'un geste sans ambiguïté, et se modifier par un geste distinct.
Allège ce qu'une tuile affiche au repos.
```

### Prompt 5 — Dés (réagencement permis)

**Joindre** : `2-des.png` **et les quatre `2-des-mode-*.png`** (réserve, YZE, formule, seuil — chaque mode a ses réglages), et l'image retenue au prompt 1. **Référence de style** : `dice_mockup.png`.

```text
Applique la grammaire au lanceur de dés (capture 2-des). Le meneur dit : « la partie avec les
jets enregistrés est trop grande » et « la fenêtre avec les modes doit être mieux agencée ».

Garde tous les contrôles visibles. Le dernier jet et son résultat (avec ses degrés de réussite)
doivent dominer ; l'historique et les jets enregistrés passent au second plan.
```

### Prompt 6 — Combat (habillage et clarté, sans déplacer les blocs)

**Joindre** : `1-combat.png`, `10-combat-table.png`, et l'image retenue au prompt 1. **Référence de style** : `combat_mockup.png`.

```text
Applique la grammaire au suivi de combat (capture 1-combat), SANS déplacer les grands blocs :
liste des combattants à gauche, contrôles de combat à droite. Le meneur dit : « les
informations ne sont pas toujours bien présentées, c'est un peu confus, rendre le tout plus
clair ».

Travaille la hiérarchie de chaque carte de combattant : initiative, nom (jusqu'à 30 signes),
camp, jauges (Santé, Sang-froid), dégâts, « Percutant », « Fiche », « Calculer », cible.
Données difficiles à tenir : 11 combattants, « 148/155 », une jauge à zéro, un combattant hors
de combat.
Puis montre le même écran en régime Table (capture 10) : le meneur veut « mettre plus d'emphase
sur cette fonctionnalité » — ce qui compte en jeu doit se lire de loin.
```

### Prompt 7 — Trame et Horloge (habillage)

**Joindre** : `7-trame-arbre.png`, `8-trame-graphe.png`, `9-horloge.png`, et l'image retenue au prompt 1.

```text
Applique la grammaire à deux écrans, sans changer leur structure :
1. La trame narrative, en arbre (capture 7) et en graphe (capture 8). Le meneur dit : « la
   présentation est un peu petite et pas toujours claire » et « le graphe n'est pas toujours
   très lisible ». Les statuts de scène (en cours, jouée, annulée) doivent se distinguer d'un
   coup d'œil.
2. L'horloge et les jauges de tension (capture 9). Le meneur dit : « les différents thèmes des
   horloges ne sont pas assez élaborés ». Les noms des jauges sont aujourd'hui tronqués : ils
   doivent tenir. Une jauge dans son dernier quart doit alerter.
```

### Prompt 8 — Les quatre personnalités (décision D3)

**Joindre** : `1-combat.png`, `11-combat-clair.png`, et l'écran de combat retenu au prompt 6. **Référence de style** : `combat_mockup.png` (pour Cyberpunk).

```text
Le logiciel propose quatre thèmes de base : Moderne, Cyberpunk, Médiéval et Clair. Aujourd'hui
ils ne diffèrent que par quelques couleurs (captures 1 et 11), et le thème Clair a des défauts
visibles : cartes grises sur fond clair, bandeau d'alerte illisible, logo effacé.

Sur l'écran de combat retenu, propose QUATRE personnalités nettement différentes — pas seulement
des couleurs : la forme (arrondis, bordures simples ou doubles, épaisseur), le relief (ombres,
halo), la matière (verre, grain, papier, métal), la typographie.
- Moderne : sobre, net, lisible.
- Cyberpunk : néon, verre, lueurs, anguleux.
- Médiéval : parchemin, bois, encre, bordures ornées.
- Clair : lumineux, lisible en plein jour, sans perte de contraste.
Les quatre gardent la même grammaire et la même mise en page. Un joueur doit reconnaître le
thème d'un coup d'œil, même en noir et blanc.
```

### Prompt 9 — L'export (à la fin de chaque conversation)

```text
Mets à jour le DESIGN.md du projet avec cette direction, en gardant les noms des couleurs
(primary, background, surface, surface-raised, text, text-muted, border, success, danger,
warning, info) et en décrivant dans « Elevation & Depth » les ombres, le halo, le verre et la
matière en valeurs CSS. Puis exporte le résultat en Tailwind.
```

---

## 3 · Ce que tu me rapportes

Pour chaque direction que tu veux essayer : **son `DESIGN.md` exporté**, l'image, et l'export
Tailwind.
Je la traduis en valeurs de jetons (T2.3), sans reprendre ni structure ni composant, et tu la
juges dans ta vraie application avec tes campagnes (T2.4). La décision (T2.5) vient **après**
avoir vu.
