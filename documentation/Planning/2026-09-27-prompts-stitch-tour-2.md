# Prompts pour Stitch — le deuxième tour (prompts 10 à 17)

**Pour** : David, qui colle ces prompts dans Stitch avec les captures de la vitrine.
**Décision** : David, 2026-09-27 — *« ce n'est pas parce que je n'ai pas eu de vraie plainte qu'il
ne faut pas en profiter pour revoir un peu le design, surtout si on veut une cohérence dans
l'ensemble de l'application »*. Le premier tour ([prompts 1 à 9](./2026-09-26-prompts-stitch.md))
n'avait montré à Stitch que le noyau : neuf écrans sur la cinquantaine de l'inventaire.
**Captures** : `e2e-resultats/vitrine/tour-2/` — **65 captures, produites le 2026-09-27** et
vérifiées une à une par planches contact :

```powershell
$env:GMOS_VITRINE='2'
$env:GMOS_VITRINE_SEMENCE='C:\Projet_David\Security_Backup_GMOS\_ABRI_2026-09-27\gmos-auto-2026-09-22T22-15-17-301.json'
npx playwright test e2e/vitrine.spec.ts   # construction à jour : npm run build
```

La semence est **la sauvegarde du 22/09** : la seule qui porte un journal de séance (111
événements). Les journaux ont été supprimés depuis par David.

⚠️ **Écrans capturés vides, faute de données dans l'instance jetable** — à dire à Stitch pour
qu'il n'invente pas le contenu : le storyboard (aucun moment), le lecteur de Deck-OS (aucun
paquet chargé), le grimoire et l'atelier des règles (le corpus des jeux n'est pas copié), Nexus
(pas de coffre), le générateur de PNJ et les tables aléatoires (aucun tirage encore).
**Inventaire** : [`2026-09-25-inventaire-des-ecrans.md`](./2026-09-25-inventaire-des-ecrans.md) — les
numéros entre parenthèses (2.1, 6.8…) y renvoient.

## Le périmètre

Tout ce qui reste des sections 0 à 6 de l'inventaire, **sauf** :

- ce que le premier tour a déjà traité : Combat (Atelier et Table), Dés et leurs modes, Musique
  et ses playlists, Cartographie (Atelier et Table), Light-OS, Trame (arbre et graphe), Horloge ;
- les écrans marqués ✕ : l'écran de démarrage (*« ne pas changer »*), la console Debug ;
- **toute la section 7** (Player Hub, projection, pupitre, tablettes, fiche HTML) : hors de la
  refonte depuis le 2026-09-25, par décision de David ;
- la barre latérale et l'indicateur de régime (0.1, 0.2) : ils sont sur toutes les captures, et
  la grammaire du prompt 1 les a déjà fixés.

⚠️ **Pas encore capturés**, faute d'un geste sûr pour les ouvrir dans l'instance jetable : le
centre de notifications des tablettes (0.4), la loupe de lecture (6.4), le panneau des
ressources de table (1.20), l'écran volant des effets de Light-OS (2.8). Ils rejoindront un lot
quand la vitrine saura les montrer.

## Mode d'emploi — ce qui change depuis le premier tour

1. **Le même projet Stitch.** Il a déjà la grammaire et les écrans retenus : c'est ce qui donne la
   cohérence. Une conversation par prompt.
2. **Joins toujours la grammaire retenue** : [`stitch/grammaire/combat.png`](./stitch/grammaire/combat.png)
   (en-tête, barres d'outils, zone de travail, panneau de réglages à droite) — plus, quand le
   prompt l'indique, l'écran déjà retenu du même domaine.
3. **En thème Cyberpunk seulement**, celui de la grammaire. Les quatre personnalités ne se
   redessinent pas écran par écran : elles arrivent par les valeurs de jetons (T2.3, déjà faites).
4. **Réglages** : application web, bureau, 1440 × 900.
5. **Rapporte-moi l'image et l'export HTML** de ce que tu retiens. Plus de `DESIGN.md` : Stitch
   n'en a qu'un par projet (leçon du premier tour).
6. ⛔ **On ne colle jamais le code de Stitch** : le HTML est une référence d'agencement.

### Trois leçons du premier tour, déjà dans les prompts

- **Stitch invente des fonctions** malgré la consigne (« Holo-scan 9M », « Ordre radio »,
  « Session live #42 »…) : chaque prompt le lui interdit encore, et on retire le reste par un
  prompt correctif. Chaque écran a demandé deux tours.
- **Il ne connaît que ce que montrent les captures** : avant de déclarer une commande inventée, la
  chercher dans le code.
- **L'image jointe à son export peut être en retard sur son code** : Claude Code rend lui-même le
  HTML pour juger.

---

## ⛔ Leçon du prompt 13 — un écran par conversation

Le prompt 13 groupait cinq fenêtres. Stitch en a fait des pages, a inventé un moteur de combat,
et **au second passage, dans la même conversation, a recopié mot pour mot ses inventions**.
Repris **un écran par nouvelle conversation, avec un prompt court qui dit ce que l'écran fait
et rien d'autre**, les cinq sont sortis justes du premier coup. **Les prompts 14 à 17 se
découpent de la même façon** : chaque écran reçoit son prompt au moment de le faire, écrit
depuis le code (ce qu'il contient vraiment, ses gestes réels), surtout quand la capture est
vide. Les textes ci-dessous restent la liste des écrans et des notes de David.

## Le rappel à coller en tête de chaque prompt

```text
Même logiciel, même grammaire d'écran que l'image jointe « grammaire » : en-tête du module
(titre + ligne d'état en pastilles), barres d'outils juste dessous (action principale en bouton
plein), zone de travail au centre, panneau de réglages à droite. Thème sombre Cyberpunk du projet.

Les captures numérotées sont les vrais écrans, avec de vraies données : leur contenu fait foi.
Garde CHAQUE information et CHAQUE commande qu'elles montrent, avec leurs libellés français.
N'ajoute aucune fonction, aucun chiffre, aucun sous-titre décoratif qui n'y figure pas.
Rien en dessous de 12 px ; texte courant contraste ≥ 4,5.
```

---

## Les prompts

### Prompt 10 — Image-OS (réagencement permis)

**Joindre** : `A1-image-bibliotheque.png`, `A2-image-diaporamas.png`, `A3-image-favoris.png`,
`A4-image-recents.png`, `A5-choix-de-l-ecran.png`, la grammaire. **Référence de style** :
`image_mockup.png` (ambiance seulement).

```text
Applique la grammaire à la bibliothèque d'images du meneur (2.1 à 2.3), celle qui projette sur
les écrans de la table. Quatre vues : la bibliothèque (dossiers, une image projetée), les
diaporamas (un diaporama monté : ordre des images, durée par image, lancer / arrêter), les favoris,
les récents. Plus la boîte qui choisit l'écran de projection (capture A5).

Pendant la partie, le meneur doit voir d'un coup d'œil CE QUI EST PROJETÉ et OÙ, et projeter une
autre image d'un geste. La préparation (dossiers, renommer, ranger, monter un diaporama) passe
au second plan. Les vignettes gardent leur taille ou grandissent : c'est une bibliothèque d'images.
```

### Prompt 11 — Le son : Effets sonores, Ambiances, Voice-OS

**Joindre** : `B1-effets-sonores.png`, `B2-ambiances.png`, `B3-voice-os.png`, la grammaire, et
[`stitch/musique/musique.png`](./stitch/musique/musique.png) (la Musique retenue — les trois
écrans doivent lui ressembler).

```text
Applique la grammaire à trois écrans du son, pour qu'ils forment une famille avec la console de
musique jointe (« musique ») : mêmes pads, mêmes curseurs, même transport.
1. Effets sonores (B1) : 16 pads colorés, un qui joue, le sélecteur d'atmosphère. Le meneur dit :
   « pouvoir mettre des icônes dans un onglet ».
2. Ambiances (B2) : des pistes superposées, dont trois actives à des niveaux différents. Le
   meneur dit : « l'interface est un peu austère ». Le niveau de chaque piste active doit se lire
   de loin.
3. Voice-OS (B3), la voix du meneur transformée : micro, porte de bruit, débruitage, effets. Le
   meneur dit : « les options ne sont pas toujours claires et la partie avec les effets prend
   peut-être un peu trop de place ».
```

### Prompt 12 — Les PNJ : galerie, fiche, graphe social, générateur

**Joindre** : `C1-pnj-galerie.png`, `C2-pnj-fiche.png`, `C3-graphe-social.png`,
`C4-generateur-pnj.png`, `C5-generateur-pnj-table.png`, la grammaire.

```text
Applique la grammaire aux personnages non joueurs.
1. La galerie (C1) : une quarantaine de PNJ avec portraits, filtres (tous, PNJ, monstres, alliés,
   hostiles).
2. La fiche d'un PNJ (C2). Le meneur dit : « retravailler l'apparence », et « la fiche de PNJ
   n'est pas toujours en accord avec le système de jeu » — elle doit pouvoir montrer les
   caractéristiques propres à chaque jeu, pas une liste fixe.
3. Le graphe social (C3) : familles, alliances, rivalités.
4. Le générateur (C4), et le même en régime Table (C5) : en jeu, le résultat généré doit se lire
   de loin.
```

### Prompt 13 — Les outils de séance : tables, butin, dégâts, adversaires

**Joindre** : `D1-tables.png`, `D2-tables-atelier.png`, `D3-loot-generer.png`,
`D4-loot-reserve.png`, `D5-loot-historique.png`, `D6-calcul-des-degats.png`,
`D7-fiche-combattant.png`, `D8-atelier-des-adversaires.png`, la grammaire, et
[`stitch/combat/combat-atelier.png`](./stitch/combat/combat-atelier.png) (le Combat retenu).

```text
Applique la grammaire à cinq outils qu'on ouvre en pleine partie.
1. Tables aléatoires (D1) et leur atelier (D2, une surcouche où l'on écrit une table). Le
   meneur dit : « rendre le tout plus ergonomique ». Le tirage affiché doit dominer.
2. Loot-OS (D3 à D5) : trois onglets, Génération, Pool actif, Historique. Le meneur dit :
   « l'ergonomie n'est pas très bonne, il faudrait être mieux accompagné » — l'écran doit dire
   dans quel ordre on s'en sert.
3. Le calcul des dégâts (D6). Le meneur dit : « cet écran n'est pas clair pour moi, ni sur ce
   que cela fait exactement ». Rends visible, dans l'écran, ce qui entre (qui frappe, qui est
   touché, les valeurs) et ce qui sort (les points perdus, sur qui).
4. La fiche d'un combattant (D7) et l'atelier des adversaires (D8), qui s'ouvrent depuis le
   combat joint : même famille de cartes et de jauges que lui. L'atelier est « un peu difficile
   d'accès ».
```

### Prompt 14 — Le poste du meneur : cockpit, storyboard, focus, préparation, cartes, Oracle, journal

**Joindre** : `E1-cockpit.png` à `E7-oracle.png`, `E8-journal.png` et les `E8-journal-suite-*.png`,
la grammaire, et [`stitch/trame/trame-arbre.png`](./stitch/trame/trame-arbre.png) (la Trame retenue,
même tableau de bord).

```text
Applique la grammaire au tableau de bord du meneur, écran par écran :
1. Le cockpit (E1) : la séance en cours, la scène active, les instantanés.
2. Le storyboard (E2), une suite de moments dont un en cours. Le meneur dit : « la présentation
   en ligne est parfois peu lisible ».
3. Le focus de séance (E3). Le meneur dit : « je ne vois pas ce que c'est » — l'écran doit dire
   à quoi il sert dès son en-tête.
4. La préparation de séance (E4) : une liste de contrôle.
5. Deck-OS (E5 lecteur, E6 bibliothèque) : un paquet ouvert, une main de cartes.
6. L'Oracle (E7), le panneau de questions à l'IA : une réponse longue et ses sources.
7. Le journal de jeu (E8 et suite) : le fil des événements de la séance, puis le compte rendu
   et la revue d'après-séance, sur la même page.
Garde la trame jointe comme modèle de densité : c'est le même tableau de bord.
```

### Prompt 15 — Les surcouches communes : palette, confirmation, saisie, instantanés, fin de séance

**Joindre** : `F1-palette.png` à `F5-fin-de-seance.png`, la grammaire.

```text
Ces fenêtres s'ouvrent PAR-DESSUS n'importe quel module. Propose UN cadre commun de surcouche
(titre, corps, boutons ; où vit l'action principale ; comment on ferme) et applique-le à :
1. la palette de commandes (F1), une recherche aux résultats de plusieurs sortes ;
2. une confirmation de suppression (F2) — le bouton destructeur ne doit pas être celui qu'on
   touche par réflexe ;
3. une saisie simple (F3) — le logiciel en a une quinzaine qui partagent ce cadre ;
4. le visualiseur d'instantanés (F4) ;
5. la fin de séance (F5) : résumé, retour, notes.
```

### Prompt 16 — La préparation : campagnes, joueurs, grimoire, forge, atlas, chroniques, favoris

**Joindre** : `G1-*.png` à `G13-*.png`, la grammaire.

```text
Applique la grammaire aux écrans qu'on ouvre ENTRE deux parties. Densité d'atelier : on peut
montrer plus, mais chaque écran garde en-tête, barre d'outils, zone de travail, panneau à droite.
- La bibliothèque des campagnes (G1). Le meneur dit : « il manque une image de fond, et un petit
  synopsis » — montre la place de ces deux éléments sur chaque carte de campagne.
- Joueurs (G2), détails et formulaire de campagne (G3, G4).
- Le grimoire, livre de règles du jeu (G5). Le meneur dit : « les options ne sont pas toujours
  claires ».
- L'atelier des règles (G6). Le meneur dit : « il manque (ou je ne l'ai pas vu) la possibilité de
  préciser des paramètres ».
- Modèles de fiche (G7), atlas du monde (G8), chroniques et wiki (G9 — « un peu difficile
  d'accès »), la forge (G10), les favoris (G11), le tableau blanc (G12).
- L'atelier des calendriers (G13). Le meneur dit : « une présentation plus moderne ».
Si l'ensemble dépasse une conversation, fais-le en deux : G1 à G6, puis G7 à G13.
```

### Prompt 17 — Médiathèque, Paramètres, Nexus, navigateur, aide

**Joindre** : `H1-mediatheque.png`, `H2-parametres-*.png`, `H3-atelier-du-theme-*.png`,
`H4-nexus.png`, `H5-navigateur.png`, `H6-aide.png`, la grammaire.

```text
Applique la grammaire à cinq écrans d'outillage.
1. La médiathèque (H1), une centaine de médias triés et cherchés. Le meneur dit : « la
   présentation est parfois un peu confuse ; mettre plus de distinction entre les différents
   types de média, montrer de façon plus claire les tags ».
2. Les paramètres (H2), cinq onglets : Système, Tactique, IA, Télécommande, Thème du jeu. Le
   meneur dit : « mieux organiser le tout ». Et l'atelier du thème (H3) : « être plus explicite
   sur les options » — chaque réglage doit dire ce qu'il change à l'écran.
3. Nexus Wiki (H4), le coffre Obsidian synchronisé. Le meneur dit : « l'arborescence est un peu
   petite et le texte aussi ».
4. Le navigateur web intégré (H5) et l'aide du meneur (H6).
```

---

## Ce que tu me rapportes

Pour chaque écran retenu : **l'image et l'export HTML**. Je rends le HTML moi-même, je relève ce
qu'on garde, ce qu'on écarte et ce qui est inventé, et je le range dans
[`stitch/`](./stitch/README.md) comme au premier tour. Rien de ce tour ne change l'écran avant la
phase 4 (migration) : la phase 1 reste à pixel constant.
