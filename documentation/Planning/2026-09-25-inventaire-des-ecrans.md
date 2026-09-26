# Inventaire des écrans — la liste qui précède tout le reste

> **Refonte de l'interface, étape 1.** Plan : [`2026-09-17-refonte-interface.md`](./2026-09-17-refonte-interface.md).
>
> Relevé dans le code le **2026-09-25** : le routage d'`App.tsx`, le registre des vues de
> Session-OS, les onglets déclarés de chaque module, les boîtes de `useModalStore`, les fenêtres
> `?window=…`. **Premier jet — c'est à toi de le corriger.**

## À quoi sert cette liste

Elle sert trois fois, et un écran qui en manque échappe aux trois :

1. **Ce qu'on montre à Stitch** : tes vrais écrans, capturés dans ta vraie application.
2. **Ce que la planche avant/après compare** : les captures automatiques de référence (T0.1).
3. **Ce que la donnée gelée doit mettre en scène** : la campagne témoin enrichie, pour que chaque
   écran y soit *dans son état*.

⚠️ **Un écran, c'est un module DANS UN ÉTAT.** Un Combat-OS vide ne ressemble pas à un Combat-OS à
onze combattants. D'où la colonne « État à montrer ».

## Comment l'annoter

Deux colonnes sont à toi :

- **Priorité** — j'ai mis ma proposition, corrige-la :
  - **★ Séance** : sous tes yeux pendant la partie ;
  - **◆ Prépa** : ouvert entre deux parties ;
  - **○ Rare** : ouvert quand ça va mal, ou presque jamais ;
  - **✕ Hors** : hors des phases 0 à 4 de la refonte.
- **Ta note** : l'état qui compte vraiment, ce qu'on laisse de côté, ce qui manque.

Tu peux annoter ici directement, ou me répondre en vrac : je reporte.

> ⭐ **Ma proposition pour les priorités ★** part des neuf raccourcis par défaut
> (`RACCOURCIS_PAR_DEFAUT` : Tableau de bord, Combat, Musique, Image, Carte, Horloge, Dés, Effets
> sonores, Journal) et de ce que le registre dit de tes soirées. *Elle ne vaut pas ton souvenir
> d'une vraie séance.*

---

## 0 · Le châssis — présent sur tous les écrans

| #   | Écran                                      | État à montrer                                             | Priorité | Ta note                             |
| --- | ------------------------------------------ | ---------------------------------------------------------- | -------- | ----------------------------------- |
| 0.1 | **Barre latérale** + en-tête de session    | Une campagne ouverte, une séance en cours, un module actif | ★        |                                     |
| 0.2 | **Indicateur de régime** (atelier / table) | Les deux positions                                         | ★        |                                     |
| 0.3 | **Palette** (`Ctrl+K`)                     | Une recherche avec des résultats de plusieurs sortes       | ◆        |                                     |
| 0.4 | **Centre de notifications** des tablettes  | Trois messages de joueurs non lus                          | ★        | C'est un écran volant et éphemère   |
| 0.5 | **Écran de démarrage** / voile d'attente   | Étape en cours affichée                                    | ✕        | ne pas changer l'écran de démarrage |

---

## 1 · Mener

### 1a · Session-OS (Tableau de bord) — 21 vues, le plus gros morceau

| #    | Vue                                                                                  | État à montrer                                                       | Priorité | Ta note                                                                           |
| ---- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| 1.1  | **Cockpit** (+ colonne des instantanés)                                              | Séance en cours, trame avec la scène active, 3 instantanés           | ★        |                                                                                   |
| 1.2  | **Storyboard**                                                                       | Une dizaine de moments, dont un en cours de lecture                  | ★        | La présentation en ligne est parfois peu lisible                                  |
| 1.3  | **Trame** — arbre                                                                    | Trois actes, ~30 scènes, statuts mélangés (jouée, en cours, annulée) | ★        | La présentation est un peu petite et pas toujours clair                           |
| 1.4  | **Trame** — graphe                                                                   | Un acte en chaîne, un acte en étoile (enquête)                       | ◆        | Le graphe n'est pas toujours très lisible                                         |
| 1.5  | **Galerie de PNJ**                                                                   | ~40 PNJ avec portraits, un filtre actif                              | ★        | La fiche de PNJ n'est pas toujours en accord avec le système de jeu               |
| 1.6  | **Graphe social**                                                                    | Familles, alliances, rivalités                                       | ◆        |                                                                                   |
| 1.7  | **Atlas du monde** + fiche d'une carte                                               | Plusieurs cartes, une ouverte avec ses entités liées                 | ◆        |                                                                                   |
| 1.8  | **Chronique / wiki**                                                                 | Frise de séances + entrées du wiki                                   | ◆        | Ce module est un peu difficile a accéder                                          |
| 1.9  | **Préparation de séance**                                                            | Liste de contrôle à moitié cochée                                    | ◆        |                                                                                   |
| 1.10 | **MJ Focus** (l'éditeur de la séance)                                                | Une séance avec son focus rempli                                     | ★        | je ne vois pas ce que c'est                                                       |
| 1.11 | **Cartes (Deck-OS)** — lecteur                                                       | Un paquet ouvert, une main de cartes                                 | ★        |                                                                                   |
| 1.12 | **Cartes (Deck-OS)** — bibliothèque                                                  | Plusieurs paquets                                                    | ◆        |                                                                                   |
| 1.13 | **Bibliothèque des campagnes**                                                       | Tes sept campagnes, avec et sans image de fond                       | ◆        | Il manque une image de fond, et un petit synopsis                                 |
| 1.14 | **Joueurs**                                                                          | 4 à 5 joueurs et leurs personnages                                   | ◆        |                                                                                   |
| 1.15 | **Détails / édition / formulaire de campagne** (3 vues)                              | Une campagne complète                                                | ◆        |                                                                                   |
| 1.16 | **Livre de règles** — 7 onglets (base, combat, tactique, IA, butin, carnet, atelier) | L'onglet de base d'un vrai pilote                                    | ◆        | Les options ne sont pas toujours claires                                          |
| 1.17 | **Atelier des règles**                                                               | —                                                                    | ○        | il manque (ou alors je ne l'ai pas vu), la possibilité de préciser des paramètres |
| 1.18 | **Modèles de fiche / pilotes** (+ deux éditeurs)                                     | —                                                                    | ○        |                                                                                   |
| 1.19 | **Oracle** (panneau de droite)                                                       | Une conversation avec une réponse longue et ses sources              | ★        |                                                                                   |
| 1.20 | **Panneau des ressources de table**                                                  | Un jeu qui en déclare (monnaie, jauges de groupe)                    | ★        |                                                                                   |

### 1b · Les autres modules « Mener »

| #    | Écran                                                           | État à montrer                                                                                                       | Priorité | Ta note                                                                                             |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| 1.21 | **Combat-OS** — **maquette fournie**                            | ⭐ **Données hostiles** : 11 combattants, un nom de 24 signes, `148/155`, une jauge à 0, un combattant hors de combat | ★        | les informations sont pas toujours bien présentées, c'est un peu confus, rendre le tout plus claire |
| 1.22 | Combat-OS — **régime table**                                    | Le même, en grand                                                                                                    | ★        | mettre plus d'emphase sur cette fonctionalité                                                       |
| 1.23 | Combat-OS — **Atelier des adversaires** (fabriquer / bestiaire) | Un bestiaire rempli                                                                                                  | ◆        | Un peu difficile d'accès                                                                            |
| 1.24 | **Dice-OS** — **maquette fournie**                              | Un jet qui vient de tomber, **avec ses degrés de réussite**                                                          | ★        | la partie avec les jets enregistrés est trop grande                                                 |
| 1.25 | Dice-OS — les modes                                             | Au moins : standard, réserve (YZE), échelonné (Blade Runner), pourcentage (RdD)                                      | ★        | la fenêtre avec les modes doit être mieux agencée                                                   |
| 1.26 | **Horloge & Temps**                                             | Horloge, minuteur lancé, 3 jauges de tension dont une **dans son dernier quart**                                     | ★        | Les différents thèmes des horloges ne sont pas assez élaborer                                       |
| 1.27 | Horloge — **Atelier des calendriers**                           | Un calendrier avec jours de fête                                                                                     | ○        | une présentation plus moderne                                                                       |
| 1.28 | **Journal de jeu** — le fil                                     | Séance en cours, ~30 événements de sortes différentes                                                                | ★        |                                                                                                     |
| 1.29 | Journal — **revue d'après-séance**                              | Scènes traversées, événements à reclasser                                                                            | ◆        |                                                                                                     |
| 1.30 | Journal — **compte rendu**                                      | Un compte rendu rédigé                                                                                               | ◆        |                                                                                                     |
| 1.31 | **Tables aléatoires**                                           | Une table ouverte, un tirage affiché                                                                                 | ★        | rendre le tout plus ergonomique                                                                     |
| 1.32 | Tables — **Atelier des tables**                                 | —                                                                                                                    | ○        |                                                                                                     |
| 1.33 | **Loot-OS** (générer / réserve / historique)                    | Un tirage de butin versé                                                                                             | ◆        | l'ergonomie n'est pas très bonne, il faudrait être mieux accompagné                                 |

---

## 2 · Montrer

| #   | Écran                                              | État à montrer                                               | Priorité | Ta note                                                                                                                                                                               |
| --- | -------------------------------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **Image-OS** — bibliothèque — **maquette fournie** | ~40 images, un dossier ouvert, une image projetée            | ★        |                                                                                                                                                                                       |
| 2.2 | Image-OS — **diaporamas**                          | Un diaporama monté                                           | ◆        |                                                                                                                                                                                       |
| 2.3 | Image-OS — favoris / récents                       | —                                                            | ◆        |                                                                                                                                                                                       |
| 2.4 | **Cartographie**                                   | Une carte avec brouillard partiellement levé et des jetons   | ★        | tous les paramètres et options se mélangent, il faut réorganiser l'interface                                                                                                          |
| 2.5 | Cartographie — **régime table**                    | Le même, en grand                                            | ★        | mettre plus d'emphase sur cette fonctionnalité                                                                                                                                        |
| 2.6 | **Tableau blanc**                                  | Un croquis en cours, la barre d'outils                       | ◆        |                                                                                                                                                                                       |
| 2.7 | **Light-OS**                                       | 18 tuiles colorées, **une scène active**, les lampes en pied | ★        | la disposition des lampes en dessous n'est pas toujours optimum. Les informations dans les pads sont trop fournies, il est parfois difficile de modifier un pad ou même de l'activer. |
| 2.8 | Light-OS — **l'écran volant des copies / effets**  | Une recherche dans les effets                                | ◆        |                                                                                                                                                                                       |

---

## 3 · Faire sonner

| #   | Écran                                | État à montrer                                             | Priorité | Ta note                                                                                                         |
| --- | ------------------------------------ | ---------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| 3.1 | **Musique** — deux platines + mixeur | **Les deux platines qui jouent, fondu croisé à mi-course** | ★        | réorganiser le tout vers une interface plus moderne et clair. Les boutons et options sont parfois un peu petits |
| 3.2 | Musique — **playlists**              | Une playlist de campagne, 20 morceaux                      | ★        | réorganiser cet écrans                                                                                          |
| 3.3 | **Effets sonores**                   | 16 pads colorés, un qui joue, le sélecteur d'atmosphère    | ★        | pouvoir mettre des icônes dans un tab                                                                           |
| 3.4 | **Ambiances**                        | 8 pistes, dont 3 actives à des niveaux différents          | ★        | l'interface est un peu austère                                                                                  |
| 3.5 | **Voice-OS**                         | Micro actif, la porte et le débruitage visibles            | ○        | les options ne sont pas toujours claires et la partie avec les effets prend peut-être un peu trop de place      |

---

## 4 · Préparer & retrouver

| #   | Écran                                    | État à montrer                              | Priorité | Ta note                                             |
| --- | ---------------------------------------- | ------------------------------------------- | -------- | --------------------------------------------------- |
| 4.1 | **Forge** — système (structure / règles) | Un pilote forgé, ses fiches en revue        | ◆        |                                                     |
| 4.2 | Forge — campagne                         | Une campagne forgée, actes et scènes        | ◆        |                                                     |
| 4.3 | Forge — trame                            | —                                           | ◆        |                                                     |
| 4.4 | **Générateur PNJ**                       | Un PNJ généré, avec son historique          | ◆        |                                                     |
| 4.5 | Générateur PNJ — **régime table**        | —                                           | ★        |                                                     |
| 4.6 | **Favoris**                              | Des favoris de plusieurs sortes, un dossier | ◆        |                                                     |
| 4.7 | **Nexus Wiki / Obsidian**                | Le coffre synchronisé                       | ○        | l'arborescence est un peu petite et le texte aussi  |
| 4.8 | **Navigateur web**                       | Une page ouverte, une vidéo YouTube         | ○        |                                                     |

---

## 5 · Technique

| #   | Écran                       | État à montrer                 | Priorité | Ta note |
| --- | --------------------------- | ------------------------------ | -------- | ------- |
| 5.1 | **Aide** — aperçu du meneur | Tel quel                       | ○        |         |
| 5.2 | Aide — manuel               | Un guide ouvert, une recherche | ○        |         |
| 5.3 | **Debug**                   | —                              | ✕        |         |

---

## 6 · Les surcouches — elles s'ouvrent par-dessus un module

| #    | Écran                                                                                                                   | État à montrer                              | Priorité | Ta note                                                                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1  | **Paramètres** — 5 onglets (système, IA, tactique, télécommande, thème)                                                 | Chaque onglet                               | ◆        | Mieux organiser le tout                                                                                                                         |
| 6.2  | Paramètres — **Atelier du thème**                                                                                       | Les 22 jetons, un jeu ouvert                | ◆        | être plus explicite sur les options                                                                                                             |
| 6.3  | **Médiathèque**                                                                                                         | ~100 médias, un tri et une recherche actifs | ◆        | la présentation est parfois un peu confuse, mettre plus de distinction dans les différents type de média, montrer de façon plus claire les tags |
| 6.4  | **Loupe de lecture**                                                                                                    | Un document Markdown agrandi                | ★        |                                                                                                                                                 |
| 6.5  | **Fiche d'un PNJ** (`npc-detail`)                                                                                       | Une fiche complète avec portrait            | ★        | retravailler l'apparence                                                                                                                        |
| 6.6  | **Fiche d'un combattant**                                                                                               | En plein combat                             | ★        |                                                                                                                                                 |
| 6.7  | **Calcul des dégâts**                                                                                                   | —                                           | ★        | cet écran n'est pas clair pour moi ni sur ce que cela fait exactement                                                                           |
| 6.8  | **Choix de l'écran de projection** (image, carte, tableau)                                                              | Deux moniteurs + le Player Hub              | ★        |                                                                                                                                                 |
| 6.9  | **Fin de séance** — résumé, retour, notes (3 boîtes)                                                                    | Après une vraie soirée                      | ◆        |                                                                                                                                                 |
| 6.10 | **Instantanés** (visualiseur)                                                                                           | —                                           | ○        |                                                                                                                                                 |
| 6.11 | **Les boîtes simples** — alerte, confirmation, saisie                                                                   | Une confirmation de suppression             | ★        |                                                                                                                                                 |
| 6.12 | **Les ~15 autres boîtes de saisie** — ajouter un joueur, un personnage, une campagne, un événement, une entrée de wiki… | Une seule suffit pour le modèle             | ◆        |                                                                                                                                                 |

> Le code en déclare **27 variantes** (`CustomModalVariant`). Elles partagent un seul cadre : si le
> cadre est juste, la plupart suivent — *c'est pourquoi 6.12 n'en garde qu'une*.

---

## 7 · Les autres fenêtres — ce que voient les joueurs, et tes autres écrans

| # | Fenêtre | État à montrer | Priorité | Ta note |
| --- | --- | --- | --- | --- |
| 7.1 | **Player Hub** — au repos | Le décor de la campagne | ✕ | |
| 7.2 | Player Hub — image projetée + **titre de moment** | Titre dans la police du jeu | ✕ | |
| 7.3 | Player Hub — **fiche de PNJ projetée** | — | ✕ | |
| 7.4 | Player Hub — **dés en 3D** | Un jet posé, résultat affiché | ✕ | |
| 7.5 | Player Hub — **carte projetée** | Brouillard et jetons | ✕ | |
| 7.6 | **Fenêtre de projection** (moniteur) | Une image, une vidéo | ✕ | |
| 7.7 | **Pupitre** (écran du bas, télécommande) — 8 onglets | Pads, Dés, Combat en priorité | ✕ | |
| 7.8 | **Tablette des joueurs** — 6 onglets | — | ✕ | |
| 7.9 | **Fiche HTML de personnage** (l'iframe du moteur de fiches) | — | ✕ | |

> ✅ **Tranché par David le 2026-09-25 : toute la section 7 est hors de la refonte, pour
> l'instant.** Le Player Hub et le pupitre rejoignent la tablette et la fiche HTML. *« Pour
> l'instant »* : la question se rouvrira après les lots L1 et L2, quand le socle aura fait ses
> preuves sur l'écran du meneur.
>
> ⚠️ **Ce que ça implique** : les surcouches 6.8 (choix de l'écran de projection) restent dans le
> périmètre — elles s'ouvrent chez le meneur, même si elles parlent du Hub.

---

## 8 · Les axes qui multiplient — et pourquoi on ne les capture pas tous

Chaque écran ci-dessus existe en plusieurs variantes. Tout capturer ferait **plusieurs centaines**
d'images : personne ne les lirait, et *une capture qu'on ne lit pas ne teste plus rien*.

| Axe | Valeurs | Ce que je propose |
| --- | --- | --- |
| **Thème d'interface** | cyberpunk, médiéval, moderne, **clair** | Tout en **ton thème habituel** ; les écrans ★ aussi en **clair** (Q2 : exigence explicite) |
| **Thème de jeu** | 4 thèmes livrés (dont Alien sur Hadley Hope) | Les écrans ★ **avec un thème de jeu actif**, une fois — c'est le but B de la refonte |
| **Régime** | atelier / table | Seulement les 5 modules qui en ont un : Combat, Carte, PNJ, Oracle, Journal |
| **Données** | vide / normal / hostile | ⭐ **Normal** partout ; **hostile** sur Combat et les jauges ; **vide** sur 3 ou 4 écrans d'accueil (une campagne neuve) |

---

## 9 · Pour Stitch : un noyau, pas la liste entière

✅ **Revu le 2026-09-26 après les annotations** — la liste vit désormais au **§ 0 du plan**
([`2026-09-17-refonte-interface.md`](./2026-09-17-refonte-interface.md)), pour n'exister qu'à un
seul endroit. Elle retient **les écrans où David a le plus à dire** : Light-OS, qui n'avait pas de
note au premier jet, en a désormais une des plus fortes.

Le reste de l'inventaire sert au **filet** (T0.1) et à la **migration** (phase 4), pas au design.

---

## 10 · Ce qui vient après ton annotation

1. **Les captures pour Stitch, par la vitrine** (`e2e/vitrine.spec.ts`, éprouvée le 25/09) : le
   noyau du plan, chaque écran mis en scène dans l'état décrit ici — sans séance de captures à la
   main.
2. **La donnée gelée** : la campagne témoin (`e2e/donnees/campagne-temoin.json`, 8 Ko aujourd'hui)
   enrichie pour mettre chaque écran ★ et ◆ dans son état.
3. **T0.1** : les captures automatiques de référence, écran par écran, sur cette donnée gelée.
