# Stitch — ce qui est retenu

**Pour** : David et Claude Code, en phase 2 de la refonte
([plan](../2026-09-17-refonte-interface.md), § 5). Les prompts :
[`2026-09-26-prompts-stitch.md`](../2026-09-26-prompts-stitch.md).

| Fichier | Rôle |
| --- | --- |
| [`DESIGN.md`](./DESIGN.md) | **L'entrée** : ce que Stitch reçoit avant le prompt 1 (contexte, contraintes, jetons de départ) |
| [`grammaire/`](./grammaire/) | **La grammaire d'écran retenue** — prompt 1 et ses corrections |
| [`musique/`](./musique/) | **La Musique réorganisée retenue** — prompt 2 et ses corrections |
| [`cartographie/`](./cartographie/) | **La Cartographie réorganisée retenue** — prompt 3 et ses corrections |
| [`lumiere/`](./lumiere/) | **Light-OS réorganisé retenu** — prompt 4 et sa correction |
| [`des/`](./des/) | **Les Dés réorganisés retenus** — prompt 5 et sa correction |
| [`combat/`](./combat/) | **Le Combat habillé retenu**, régimes Atelier et Table — prompt 6 et sa correction |
| [`trame/`](./trame/) | **La Trame habillée retenue**, arbre et graphe — prompt 7 et sa correction |
| [`horloge/`](./horloge/) | **L'Horloge habillée retenue**, ses trois thèmes — prompt 7 et sa correction |
| [`image/`](./image/) | **Image-OS retenu** — deuxième tour, prompt 10 et sa correction ([prompts](../2026-09-27-prompts-stitch-tour-2.md)) |
| [`son/`](./son/) | **Effets sonores, Ambiances, Voice-OS retenus** — deuxième tour, prompt 11 et sa correction |
| [`pnj/`](./pnj/) | **Galerie, fiche, graphe social et générateur des PNJ retenus** — deuxième tour, prompt 12 et sa correction |
| [`outils/`](./outils/) | **Les outils de séance retenus** — deuxième tour, prompt 13 repris écran par écran |
| [`meneur/`](./meneur/) | **Le poste du meneur retenu** — deuxième tour, prompt 14 écran par écran |
| [`surcouches/`](./surcouches/) | **Le cadre commun des surcouches, et ses fenêtres** — deuxième tour, prompt 15 |
| [`preparation/`](./preparation/) | **La préparation retenue** — deuxième tour, prompt 16 écran par écran |
| [`outillage/`](./outillage/) | **Médiathèque, Paramètres, atelier du thème, Nexus, navigateur, aide retenus** — deuxième tour, prompt 17 |
| [`personnalites/`](./personnalites/) | **Les quatre personnalités** (prompt 8) et **leurs valeurs** dans le vocabulaire du contrat — étape T2.3, [`valeurs.md`](./personnalites/valeurs.md) |

Les exports bruts de Stitch vivent dans `Stitch/` à la racine, **exclu de git** : ce sont des
propositions. Seul ce qui est retenu entre ici.

## Comment lire ces dossiers

- **Les images sont des rendus de Claude Code**, faits en affichant le HTML exporté dans un
  navigateur à 1440 px. ⚠️ **L'image jointe par Stitch à son export peut être en retard sur son
  code** — constaté le 26/09 sur le Combat : le code était corrigé, l'image non.
- **Le HTML est une référence d'agencement**, jamais du code à coller (plan § 5) : il ne connaît
  ni les magasins, ni l'i18n, ni les vraies données.
- **Le `DESIGN.md` de `grammaire/`** réunit les deux exports de Stitch, contradictions tranchées :
  c'est lui qu'on traduira en valeurs de jetons (T2.3).

## La grammaire — retenue le 2026-09-26

`grammaire/combat.png`, `grammaire/cartographie.png`. Direction « Brutal Diegetic Console ».

**Ce qu'on garde**

1. **La grammaire d'écran** : en-tête du module (titre + ligne d'état en pastilles), barres
   d'outils juste dessous (action principale en bouton plein), zone de travail au centre,
   **panneau de réglages à droite**. Identique dans chaque module — la décision D2.
2. **La hiérarchie de la carte de combattant** : initiative en grand, nom et badges de camp,
   actions en haut à droite, puis points de vie, sang-froid et cible en trois blocs. Barrette
   rouge à gauche des hostiles. Répond à « c'est un peu confus ».
3. **La carte tactique** : outils regroupés en barres (Oracle, import ; portée, pinceau, révéler,
   pions ; effacer), couches avec leur état en badge. Répond à « les options se mélangent ».
4. **Le partage des polices** : Orbitron pour les titres, Inter pour le texte, Space Mono pour
   les chiffres.

**Ce qu'on écarte**

- Les fonctions inventées (voir le « Don't » du `DESIGN.md`).
  ⚠️ **Mais Stitch ne connaît que ce que montrent les captures** : la carte a treize sections de
  réglages et la première capture n'en montrait que le haut. Avant de déclarer une commande
  inventée, la chercher dans le code — Claude Code a fait retirer à tort, au prompt 1, une barre
  d'outils qui existait (pions, formes, ping).
- Les étiquettes de 10 px, encore présentes dans les écrans.
- L'arrondi à zéro et les halos cyan **comme règle générale** : c'est le style de la personnalité
  Cyberpunk, pas la grammaire. Moderne, Médiéval et Clair auront leur forme (prompt 8).

## La Musique — retenue le 2026-09-26

`musique/musique.png`. Réagencement permis (décision D1).

**Ce qu'on garde**

- **Trois colonnes** : platine A, **mixeur central** (fondus A et B, fondu croisé, courbe,
  niveau master), platine B.
- **La forme d'onde horizontale** avec les repères IN et OUT de la boucle, les valeurs d'entrée,
  de sortie et la durée de la sélection.
- **Le transport en gros boutons carrés** (lecture, stop, boucle), touchables au doigt.
- **Les pads à quatre par ligne** : la touche en badge, le titre en entier, catégorie et durée ;
  « Ajouter » dans la grille.
- **Le panneau de droite réduit** à la sortie audio et à l'interrupteur de l'atténuation.

**À régler à l'intégration** (pas dans Stitch)

- Le curseur de volume de chaque platine déborde à droite.
- Sur les pads 1 et 2, le badge de touche chevauche « Lecture • Deck A ».
- « Ajouter un morceau » propose un lien Spotify : n'existe pas.
- Le choix de sortie apparaît deux fois (en haut et dans le panneau) : n'en garder qu'un.

## La Cartographie — retenue le 2026-09-26

`cartographie/cartographie.png` et `cartographie-panneau-bas.png` (le panneau de droite défile).
Réagencement permis (décision D1). Répond à « tous les paramètres et options se mélangent ».

**Ce qu'on garde**

- **La séparation du jeu et de la préparation.** En jeu : la barre « En jeu direct » au-dessus
  de la carte — brouillard (révéler, masquer), forme (pinceau, zone, rond), tout révéler / tout
  masquer, ping, effet magique, zone de danger ; l'en-tête — Cortex tactique, recadrer, projeter ;
  le haut du panneau — Oracle, tour de combat et pions à poser, météo, moment de la journée,
  couches. En préparation, en bas du panneau : configurations sauvées, import et suppression de
  la carte, grille (taille, opacité, couleur), modèles de zones de danger, audio de la carte.
- **La carte au plus large.**

**À régler à l'intégration**

- « Crépuscule » est coupé.
- Inventés : le repère « Holo-scan 9M » sur la carte, l'audio de la carte présenté comme une
  ambiance nommée (il coupe le son et choisit la sortie, rien d'autre), « 0 latence » en pied.

⚠️ **Deux tours ont été nécessaires** : la première capture ne montrait que le haut d'un panneau de
treize sections, et Stitch a réorganisé la carte sans voir la moitié de ses commandes. La vitrine
capture désormais les panneaux qui défilent (`capturerEnDefilant`).

## Light-OS — retenu le 2026-09-26

`lumiere/lumiere.png` et `lumiere-panneau-bas.png` (le panneau de droite défile). Réagencement
permis (décision D1). Répond à « la disposition des lampes » et à « les pads sont trop fournis :
difficile de modifier un pad ou même de l'activer ».

**Ce qu'on garde**

- **Les tuiles allégées** : icône, nom, luminosité, vitesse de l'effet (« ×1 »). **Le bouton de
  réglage, en haut à droite, est séparé** du reste de la tuile, qui active la scène.
- **Les 18 cases de la campagne**, cases vides « + Capturer » comprises, puis les scènes communes.
- **La barre du bas** : Rouge critique, Bleu arcanique, Vert de soin, **« Arrêter la scène
  [Échap] »**, et les temps de transition en haut de la grille.
- **Le panneau de droite**, de haut en bas : le pont, « Synchro avec l'audio », « La lumière suit
  la voix » ; l'intensité globale ; **les lampes en liste verticale** (case de sélection, effet,
  interrupteur, curseur) ; **« Éclairage normal » dans son propre bloc**, avec son explication ;
  puis, en bas, **« Préparation • Atelier »** (découvrir, appairer, synchro des modules, mode
  simulé, mes effets, relire les lampes, réinitialiser le module) ; le blackout d'urgence en pied.

⛔ **« Éclairage normal » et « Arrêter la scène » sont deux gestes distincts** — le premier choisit
la scène où la pièce revient, le second coupe la scène en cours. Le premier tour de Stitch les
avait fusionnés en un seul bouton.

**À régler à l'intégration**

- **« Déconnecter » et « Oublier le pont » manquent** ; et Découvrir / Appairer ne s'affichent,
  dans GM-OS, que pont déconnecté (Stitch les montre avec le pont « En ligne »).
- Le pourcentage de chaque lampe est coupé au bord droit du panneau.
- La liste des effets est la même pour toutes les lampes (Stitch la fait varier).
- Inventés : « Nominal 80 % » sur l'intensité globale, le sous-titre « Mode tactile grand format
  • Cibles tactiles ≥ 48px », « Rythme live & intensité », « Modulation dynamique MJ »,
  « Préréglages rapides & captures en vol ».

## Les Dés — retenus le 2026-09-26

`des/des.png`. Réagencement permis (décision D1). Répond à « la partie avec les jets enregistrés
est trop grande » et à « la fenêtre avec les modes doit être mieux agencée ».

**Ce qu'on garde**

- **Le dernier jet domine**, en haut à droite : résultat total en grand, bandeau d'issue, puis
  chaque dé détaillé avec son rôle (attribut D10, compétence D8) et son sens (écueil, neutre).
  L'historique passe dessous, sobre : heure, système, faces, total, et le degré en toutes lettres.
- **Les jets rapides sur une seule ligne** sous le bouton, avec « + Ajouter ».
- **Le grand bouton « Lancer les dés »**, sur toute la largeur.
- **Les champs suivent le mode.** La liste nomme les douze modes. Pour les dés échelonnés :
  Attribut, Compétence, Équipement (facultatif), chacun de A = D12 à D = D6 ; Normal / Avantage /
  Désavantage ; le résumé de la poignée. **La rangée d4 à d100 n'appartient qu'aux modes seuil et
  pool.**

**À régler à l'intégration**

- **Stitch a empilé deux modes** (échelonnés, puis un « aperçu » du jet de seuil) : un seul mode
  s'affiche à la fois.
- **Les jets rapides ont perdu leur croix de suppression.**
- **Les dés d4 à d100 choisissent le dé, ils ne lancent pas** : « Toucher pour lancer direct » est
  faux.
- Inventés : « Échec critique », « Réussite critique », « Succès majeur » (GM-OS dit Succès ou
  Échec, et les six degrés quand le système en a), « Console de lancer tactile », « Moteur unifié
  multi-systèmes », « Configuration active », « Moteur actif », « Alternance rapide », « Relief
  diégétique ».

⚠️ **Le mode des dés échelonnés n'était dans aucune capture** (la vitrine force le mode Year
Zero). Au premier tour, Stitch l'a deviné de travers (« D10 (A) », alors que A vaut D12). Il a
fallu le décrire dans le prompt correctif.

## Le Combat — retenu le 2026-09-27

`combat/combat-atelier.png` et `combat-table.png`. Habillage, sans déplacer les grands blocs.
Répond à « c'est un peu confus, rendre le tout plus clair » et, en régime Table, à « mettre plus
d'emphase sur cette fonctionnalité ».

**Ce qu'on garde**

- **La hiérarchie de la carte** : initiative en grand, nom, camp en badge, cible ; **les deux
  jauges, Santé et Sang-froid, avec leurs chiffres** (« 148/155 »), y compris en régime Table.
- **Les mêmes commandes sur chaque carte, celles du code** : liste de camp, liste de cible,
  altérations en badges et leur « + », conseil du Cortex, champ de dégâts − / +, Percutant, Soins,
  Fiche, Calculer, croix de suppression.
- **Les combattants hors de combat grisés, barrés, regroupés en bas** (avec leur titre en Table).
- **Le panneau de droite de GM-OS** : Round et Tour suivant ; Auto initiative ; Ajouter,
  Fabriquer, Calculateur ; les deux tris ; Sync PV, Fin de combat, Reset combat.
- **En régime Table** : cartes pleine largeur, points de vie en gros chiffres, le compteur en tête
  (combattants, actifs, hors de combat — il se calcule), et le bloc « Configuration atelier
  (verrouillée) ».

**À régler à l'intégration**

- ⛔ **Stitch verrouille trop à la table.** Dans GM-OS, **seul « Reset combat » est hors de
  portée** (`HorsDePortee` dans `CombatControls.tsx`). Le calculateur, « Fin de combat », « Sync PV »
  et « Ajouter un combattant » (des renforts arrivent) sont des gestes de jeu.
- En Atelier, la rangée d'actions déborde de la carte (croix coupée), et le champ de dégâts est
  trop étroit pour qu'on lise sa valeur.
- En Table, les onglets de scène et « + Nouvelle scène » sont inventés : GM-OS pose la question
  « à quelle scène appartient ce combat ? » (l'Atelier l'a gardée).
- Noms tronqués (« Bryant — Capitaine… ») : la carte doit tenir 30 signes.
- Inventés : « Registre tactique », « Régime : Atelier (Édition débloquée) », « Routage
  télémétrique », « Contexte : actif [combat-01] », « Tactical Combat-OS live display », « Phase
  tactique ».

⚠️ **Au premier tour, Stitch avait donné à chaque combattant ses propres boutons** (« Ordre
radio », « Stabiliser », « Scan »…) et remplacé le bloc de dégâts par −5 / −10 / +5 : une autre
fonction, pas un habillage.

## La Trame — retenue le 2026-09-27

`trame/trame-arbre.png` et `trame-graphe.png`. Habillage. Répond à « la présentation est un peu
petite et pas toujours claire » et à « le graphe n'est pas toujours très lisible ».

**Ce qu'on garde**

- **Les cinq statuts de scène, reconnaissables d'un coup d'œil** (`etatDeLaScene`, dans
  `logic/trame.ts`, plus l'annulée) : En cours (cyan, ligne encadrée), Jouée (vert, coche),
  En pause (ambre), Annulée (rouge, titre barré), Prévue (gris).
- **L'arbre plus grand et sobre** : un acte montre son numéro, son titre, son nombre de scènes ;
  une scène, son titre et son statut. La fiche de droite : titre, enjeu, notes, « Marquer comme
  achevé ».
- **Le graphe à nœuds en petites cartes** — acte, statut, nom, lieu et PNJ — au lieu de points
  sans nom : c'est la réponse à « pas lisible ».
- **La vraie barre du graphe** (six onglets, « Toutes les scènes », « Masquer les scènes closes »,
  Relier, Ranger, Libre, Réinitialiser), les constats en pastilles, et **le panneau du nœud
  choisi** : Commencer / Rouvrir, Terminer, Détacher, Ouvrir la fiche, Supprimer, sorties et
  entrées.

**À régler à l'intégration**

- Les flèches pour monter et descendre un acte ont disparu (seule la corbeille reste).
- « + Ajouter une sortie » n'existe pas (on relie avec « Relier ») ; et chaque sortie a **un champ
  qui dit sa condition**, que Stitch a réduit à un sous-titre.
- Noms de nœud tronqués ; les cartes du bord droit passent sous le panneau.
- Inventés : « ID : SCN-0314 », « Verrouillage édition », « Session live #42 » ; deux cercles sur
  « Marquer comme achevé ».

⚠️ **Au premier tour, Stitch avait inventé une trame chronométrée** (durées, tempo, embranchements
Alpha / Bêta, conditions de déblocage, tension) et remplacé le graphe par une « matrice radiale ».

## L'Horloge — retenue le 2026-09-27

`horloge/horloge-moderne.png`, `horloge-cyberpunk.png`, `horloge-old-style.png`. Habillage.
Répond à « les différents thèmes des horloges ne sont pas assez élaborés », aux noms de jauge
tronqués, et à l'alerte du dernier quart.

**Ce qu'on garde**

- **Un cadran par thème.** **Old style** a une vraie personnalité (cadre en laiton rivé, cadran à
  aiguilles et chiffres romains à côté de l'heure numérique, date à empattements) ; **Cyberpunk**,
  chiffres néon cyan avec halo et secondes en jaune ; **Moderne**, grands chiffres blancs épurés.
- **Les noms de jauge en entier**, sur deux ou trois lignes.
- **Le code couleur de GM-OS** : orange à mi-course, **rouge et bandeau dans le dernier quart**.
- **Les réglages de chaque jauge dans un menu « ⋮ »** au lieu d'une rangée de dix icônes sans nom :
  Forme (Anneau, Barre, Points, Aiguille), Sens (Monte / S'épuise), Remplir, Sur l'afficheur de
  table, Vue par les joueurs, Couleur sur l'afficheur. « Par scène » seul en pied de carte.
- **« Nouvelle jauge »** : nom, forme, sens, puis « +4 … +12 » qui créent la jauge d'un geste
  (version Moderne).

**À régler à l'intégration**

- Moderne reste proche de l'actuel : à reprendre avec les personnalités (prompt 8) si trop sobre.
- Le menu « ⋮ » recouvre le nom de la jauge quand il s'ouvre.
- Sur Cyberpunk et Old style, « +8 » paraît sélectionné, comme un choix de maximum : ce sont des
  boutons de création.
- Manque « Revenir à la couleur d'origine » à côté des couleurs.
- Inventés : « Chronomètre nautique & laiton d'observatoire », « Chronomètre de bord »,
  « Système matriciel T-0 », « Flux principal synchronisé », et les bandeaux « Seuil critique —
  déclenchement imminent », « Tension active », « Stable ».

## Les quatre personnalités — retenues le 2026-09-27

`personnalites/moderne.png`, `cyberpunk.png`, `medieval.png`, `clair.png`. Décision D3 : chaque
thème de base devient une personnalité complète — forme, relief, matière, typographie.

⚠️ **Références de STYLE, pas de contenu.** Stitch n'a pas repris l'écran de combat retenu : il a
rhabillé ses propres écrans du premier tour, inventions comprises (« Tir précis », « Jet système
direct », « Chronique écrite »…). La mise en page vient de la grammaire et des écrans déjà
retenus ; ici on ne garde que **la forme, la matière et la typographie**.

| Thème | Ce qu'on garde |
| --- | --- |
| **Moderne** | Plus Jakarta Sans, chiffres en JetBrains Mono ; cartes blanches arrondies (≈ 12 px) sur cadre ardoise ; un seul accent bleu ; ombres douces, aucun halo |
| **Cyberpunk** | Orbitron, Inter, JetBrains Mono ; arrondi 0, coins coupés à 45° ; néon cyan, halo sur l'élément actif, magenta pour l'hostile ; verre dépoli, trame de balayage |
| **Médiéval** | Cinzel, EB Garamond (italique pour les sous-titres) ; parchemin vieilli, cadre en bois sombre ; coins en laiton ; or terni pour l'accent, rouge sang pour l'hostile ; aucune lueur |
| **Clair** | Tout l'écran clair, barre latérale et bandeau compris ; cartes blanches, bordure grise, ombre nette ; texte presque noir ; couleurs d'état foncées, lisibles sur blanc |

**À régler à l'intégration**

- **Clair** : le « Registre tactique live » est resté un bloc sombre à texte gris, illisible ; la
  police est Plus Jakarta Sans (demandé : Inter) — Moderne et Clair partagent donc la leur.
- **Moderne et Clair** : les icônes s'affichent en toutes lettres (« swords », « more_vert ») — le
  HTML exporté déclare deux fois la police d'icônes. Défaut d'export, pas de dessin.

⚠️ **Il a fallu deux tours, et un troisième pour le Clair.** Au premier, Moderne, Cyberpunk et
Médiéval avaient le même fond marine, le même cyan et les mêmes polices. **Cause : Stitch a UN
système de design par projet** — les cinq `DESIGN.md` exportés sont identiques octet pour octet,
et c'est le Cyberpunk importé au départ. Le remède : un prompt par personnalité, avec des valeurs
explicites (polices, arrondis, matière) et la consigne d'ignorer le `DESIGN.md` du projet.

**Le prompt 9 n'a pas été lancé** : il n'aurait produit qu'un `DESIGN.md`, pour un seul thème. Les
valeurs de chaque thème se relèvent dans le HTML exporté (étape T2.3).

## Image-OS — retenu le 2026-09-27 (deuxième tour)

`image/image-bibliotheque.png`, `image-diaporamas.png`, `image-favoris.png`,
`image-choix-de-l-ecran.png`. Réagencement permis. Le prompt demandait : *voir d'un coup d'œil
ce qui est projeté et où, et projeter une autre image d'un geste*.

**Ce qu'on garde**

- **Le bloc « En direct » en tête de la bibliothèque** : l'image projetée en grand, l'écran qui
  la reçoit, « Couper l'image » (le blackout de l'écran cible). C'est la réponse au prompt.
- **Les grandes vignettes**, badge de l'écran sur celle qui est projetée ; au survol : favori,
  renommer, déplacer vers un dossier, retirer ; sur une vidéo, « Boucle / 1 fois ».
- **Le panneau de droite** : écran cible (Player Hub, Moniteur 1, Moniteur 2), commandes
  d'urgence (Target, All, Noir, Restore default — une seule fois), arborescence, son des
  vidéos, stockage local.
- **Les diaporamas** : la liste à droite avec « Créer un diaporama » et l'écran visé ; le
  montage en grandes lignes numérotées (vignette, ↑ ↓, corbeille) ; **une seule cadence**
  (− 7 + s) ; la bande « Ajouter depuis la bibliothèque (images fixes uniquement) ».

**À régler à l'intégration**

- **Un clic sur la vignette projette** : le bouton « Projeter sur… » de la barre d'outils et la
  fenêtre « Projeter l'image » avec « Valider » restent une étape de trop pour Image-OS. Cette
  fenêtre sert en revanche de modèle aux choix d'écran de la carte et du tableau blanc (6.8), qui
  sont déjà des fenêtres dans GM-OS.
- « Lancer sur Player Hub » apparaît deux fois sur les diaporamas : n'en garder qu'un.
- Les favoris gardent un bouton « Projeter » sous chaque vignette **et** « clic gauche =
  projection immédiate » : choisir, et le faire pareil dans la bibliothèque.
- « Plein écran » existe (`FullScreenPreview`) : c'est l'aperçu, pas une projection.
- La rangée d'icônes en pied du panneau des favoris (écran, cadre, cadenas, arrêt) ne correspond
  à rien d'identifié.
- Inventés : les nombres des dossiers (24 / 42 / 18), les étiquettes sur les vignettes du
  montage (« 4K_MASTER », « ACTION_SEQ »), « Modale sélection écran ouverte », « V6.2 »,
  « Statut sortie ».

⚠️ **Au premier tour, Stitch avait inventé la moitié d'un lecteur vidéo** : pause, réinitialiser,
boucle ou fin sur noir, fondus de 1 ou 2 s, une durée par image, un chronomètre de projection,
la résolution et l'espace colorimétrique, et une sortie « Stream / OBS ». Il avait aussi perdu
Moniteur 2, et les gestes de chaque vignette.

## Le son — retenu le 2026-09-27 (deuxième tour)

`son/son-effets-sonores.png`, `son-ambiances.png`, `son-voice-os.png`. Les trois écrans devaient
former une famille avec la Musique retenue.

**Ce qu'on garde**

- **Effets sonores** : des **icônes sur les onglets d'atmosphère et sur les pads** — la demande de
  David (« pouvoir mettre des icônes dans un onglet ») ; « Toutes / Cette campagne » ; MIDI
  learn, Key learn, sortie audio, **« Arrêt progressif (3 s) »**, Réinitialiser ; le pad qui
  joue garde sa barre de lecture ; à droite, le périphérique MIDI, **la liste des touches
  assignées**, le volume master.
- **Ambiances** : des **tranches de console**, comme la Musique — lecture / pause, curseur,
  **le niveau en gros chiffres (75 %, 40 %, 60 %)** lisible de loin, « Vider », « Lier une
  scène lumineuse » ; les pistes vides éteintes, avec « Choisir ». Univers, thème et scènes
  rapides en tête ; « Silence ambiances » une seule fois. Répond à « l'interface est un peu
  austère ».
- **Voice-OS** : trois colonnes — modèles vocaux et voix des PNJ, le micro au centre (plus
  petit), puis les effets **rangés en deux groupes** : « Nettoyage & sécurité » (anti-larsen,
  débruitage aucun / navigateur / neuronal, porte, atténuation de la musique) et « Modeleurs
  vocaux » (hauteur, timbre, réverbération, distorsion, compression, bitcrush). Répond à « la
  partie avec les effets prend peut-être un peu trop de place ».

**À régler à l'intégration**

- Effets sonores : « Arrêt progressif (3 s) » apparaît deux fois (barre d'outils et pied du
  panneau) : n'en garder qu'un.
- Ambiances : la sortie audio s'appelle « Diffusion Table (Joueurs) » (c'est le choix du
  périphérique, comme ailleurs) ; l'échelle en dB du master est décorative.
- Voice-OS : « Gain entrée + 0,0 dB », « DSP : actif », « Anti-Larsen hybride » à vérifier contre
  le module ; le bas du panneau (paramètres de l'atténuation) n'était pas dans la capture.
- Les noms des pistes d'ambiance (« Pluie acide », « Vent tunnel ») sont d'exemple : la capture
  n'avait aucune piste active (le thème de la sauvegarde est un gabarit sans sons).
- Inventés et restés : « < 12 ms » / « Latency 8.2 ms » (le pied « Buffer 48 kHz, latence ~12 ms »
  est, lui, dans GM-OS), « Stream : Direct-IO », « DSP Protocol v6.2 ».

⚠️ **Au premier tour, Stitch avait inventé une console de mixage** : solo et mute par piste,
atténuation automatique des ambiances, durée et courbe de fondu entre scènes — et transformé
« Arrêt progressif (3 s) » en « REC IN » puis en « Silence rapide… coupe toutes les voies
instantanément », **le contraire du geste réel**. Il avait aussi inventé deux atmosphères.

## Les PNJ — retenus le 2026-09-27 (deuxième tour)

`pnj/pnj-galerie.png`, `pnj-fiche.png`, `pnj-graphe-social.png`, `pnj-generateur-atelier.png`,
`pnj-generateur-table.png`.

**Ce qu'on garde**

- ⭐ **La fiche de PNJ suit le jeu** — la réponse à « la fiche n'est pas en accord avec le système
  de jeu ». Le bloc fixe Vitalité / CA / Vitesse (un autre jeu, posé au-dessus de la fiche
  Blade Runner) disparaît ; la fiche devient **des blocs titrés qui se remplissent des champs du
  jeu** : identification, attributs (**A (d12), B (d10), C (d8)** — l'échelle juste des dés
  échelonnés), Santé et Sang-froid en barres segmentées, compétences, équipement. La « console
  de dommage » garde − / +, Percutant, Soins ; en tête, Projeter, Combat, Carte, Retour, Modifier ;
  à droite, la campagne, **les relations clés** (du graphe social) et **les notes privées du MJ**,
  marquées non projetées. Répond aussi à « retravailler l'apparence ».
- **La galerie** : les filtres en onglets avec leur nombre, de grandes cartes (portrait, camp,
  description, vitalité), les trois gestes réels (Fiche, Combat, Projeter).
- **Le graphe social** : les portraits sur les nœuds, la légende des **onze** types de lien, et
  **le panneau du nœud à droite** — faction, onglets Relations / Modifier, chaque relation avec
  son type et sa description, la perception entrante. Ce panneau existe dans GM-OS mais se
  voyait mal.
- **Le générateur** : les cinq catégories dans les deux régimes, l'historique des mémos ; le
  résultat en **blocs titrés venus de la table**, les notes privées à part, **les dix actions
  réelles** d'un tirage. En régime Table : un gros « Tirage instantané » et le résultat lisible
  de loin.

**À régler à l'intégration**

- Générateur, Atelier : le panneau « Paramètres du tirage » (tables sources, tirage auto,
  options d'enrichissement, cases à cocher) est **inventé** — GM-OS n'a que l'univers, le fichier
  et l'enrichissement par IA. Les libellés des dix actions sont tronqués.
- Générateur, Table : « Projection joueurs active », les statuts « En jeu / Actif / En veille »
  des derniers tirages.
- Fiche : « #VALE-882-WL », « Protocole de détection Tyrell-Wallace », « Synchro Voice-OS »,
  « Fiche joueur », l'objectif et l'étape de scène, les qualificatifs sous les attributs
  (« Colosse »…), « Dernier impact », « Crit » sur les armes.
- Graphe : des relations aux types composés (« Allié secrète », « Hostile // Cible contrat »,
  « Menace critique ») — un lien a UN type, et un nom facultatif.
- Galerie : le panneau « PNJ & Monstres » à droite (« 3 prêtes », « Acte 1 », « Sync »).
- Les portraits et les textes du générateur sont d'exemple : la capture n'avait aucun tirage.

⚠️ **Au premier tour, Stitch n'avait pas fait la fiche**, la note la plus nette de David, et avait
donné au générateur des statistiques de combat (Santé 48, « CR 7 », un radar d'équilibre) — alors
qu'un tirage ne produit que des champs de texte. Il fallait lui dire ce qu'un tirage contient.

## Les outils de séance — retenus le 2026-09-27 (deuxième tour)

⛔ **Le prompt 13 groupé a échoué deux fois.** Cinq surcouches (tables, butin, calcul des
dégâts, fiche du combattant, atelier des adversaires) dans un seul prompt : Stitch en a fait
des **pages entières** au lieu de fenêtres par-dessus le combat, et a inventé un moteur de
combat (armure déduite, localisation, table des critiques D66, panique, journal des impacts).
Au second passage, **dans la même conversation, il a recopié mot pour mot ses inventions**.
Son export était en plus cassé : une accolade manquait dans `tailwind.config`, l'écran
s'affichait sans style (même son `screen.png`). **Le remède : une nouvelle conversation, un
écran, un prompt court qui dit ce que l'écran fait — et rien d'autre.**

### Le calcul des dégâts — retenu le 2026-09-27

`outils/outils-calcul-des-degats.png`. Répond à « cet écran n'est pas clair pour moi, ni sur ce
que cela fait exactement ».

**Ce qu'on garde** : une **fenêtre par-dessus le combat** ; le calcul rendu visible en trois
temps — ce qui entre (la valeur en grand avec − / +, « Dernier jet : 7 », Dégâts ou Soins,
Percutant ou Perforant), qui est touché (cases à cocher, « Tout cocher / décocher »), et pour
chaque cible **« 12 → 2 PV »**, avec la raison quand il y en a une (**« Résistant : moitié »**,
« 148 → 143 PV, −5 PV (résistance) ») ; les cibles non cochées « Inchangé » ; en pied, la
synthèse (« 2 combattants affectés, 15 PV totaux déduits »), Annuler, **Appliquer l'impact**.

**À régler à l'intégration** : les types de dégâts viennent du pilote du jeu (`typesDeDegats`),
pas d'une liste fixe ; les sous-titres « Cinétique / Balistique », « Tactile 1 mètre »,
« Console tactile grand format » sont décoratifs ; les pas −5 / +5 sont un ajout de confort, à
garder ou non ; les étiquettes de nature (« Humain », « Nexus-7 ») sont d'exemple.

### Les tables aléatoires — retenues le 2026-09-27

`outils/outils-tables-aleatoires.png`. Répond à « rendre le tout plus ergonomique ».

**Ce qu'on garde** : le réglage en une rangée — 1. univers / jeu, 2. table active, le
modificateur (− 5, − 1, + 1, + 5), le jet manuel avec « Valider jet » — puis **un seul grand
bouton « Lancer d100 »** (le dé de la table) ; **le résultat qui domine** : jet brut,
modificateur, **total en grand**, la table d'origine, le titre de l'entrée, son texte, et
**l'effet mécanique dans son propre cadre** ; dessous, les trois gestes réels : **Verser au
butin, Proposer des objets, Log session** ; à droite, l'historique récent (total, titre, jet
brut, heure) avec « Effacer l'historique », et l'accès à l'atelier.

**À régler à l'intégration** : le raccourci « [Espace] » et « Réinjecter » dans l'historique
n'existent pas (l'historique n'est pas cliquable) — ✅ **les deux retenus par David le
2026-09-29** (voir « Les idées tranchées » en fin) ; « p. 112 »,
« Malus régie », « Prêt au déclenchement », « Subsystem 08-T », « −6 dB » sont décoratifs.

### Loot-OS — retenu le 2026-09-27

`outils/outils-loot-generer.png`, `outils-loot-pool.png`, `outils-loot-historique.png`. Répond à
« l'ergonomie n'est pas très bonne, il faudrait être mieux accompagné ».

**Ce qu'on garde** : une **fenêtre par-dessus le tableau de bord** ; **les trois étapes
numérotées en onglets** — 1. Générer, 2. Pool actif (« 3 en attente »), 3. Historique
(« 3 distribués ») — qui disent dans quel ordre on s'en sert ; **Générer** : l'IA (Lite /
Full, la description, « Générer les objets ») puis les tables du système (recherche ; nom,
nombre d'entrées, mode « un seul tiré / chaque ligne testée », Tirer) ; **Pool actif** : chaque
objet avec son type (Objet / Monnaie), **sa rareté en couleur** (Commun … Légendaire), sa
description, et **« Donner à » un bouton par personnage** ; « Tout vider » ; **Historique** :
l'objet, sa rareté, « Donné à », « il y a 5 min » ; à droite, toujours visibles, le résumé du
trésor et le conseil au meneur.

**À régler à l'intégration** : « Partager équitablement » (la monnaie entre les personnages) et
« Archiver les reliquats » n'existent pas — ✅ **les deux retenus par David le 2026-09-29** ;
« Transféré », « Trié par heure de remise », « Statut système : en ligne » sont décoratifs.

### La fiche du combattant — retenue le 2026-09-27

`outils/outils-fiche-du-combattant.png`. Même famille que la fiche PNJ retenue.

**Ce qu'on garde** : une **fenêtre par-dessus le combat, en lecture seule** — le choix du code
(`FicheDuCombattant.tsx` : les jauges se modifient déjà sur la carte, deux endroits pour la même
valeur est le défaut que ce projet paie le plus) ; les blocs du jeu : attributs avec leur rang et
leur dé (**A = d12 … D = d6**, l'échelle rappelée en tête), Santé et Sang-froid en barres
segmentées, compétences avec leur dé ; **la provenance des valeurs en pied**
(« Valeurs lues sur la fiche de campagne — à jour ») ; une seule action, « Au bestiaire » —
**« Dans la campagne » n'apparaît pas parce que Roy Batty y est déjà**, exactement la règle du
code.

**À régler à l'intégration** : le bloc d'identité est inventé (matricule fabricant, date
d'inception, espérance estimée, affectation, dernière localisation) — ce sont **les champs de
la fiche du jeu** qui s'y affichent (nom, archétype, nature, années de service, domicile) ; les
compétences sont groupées par « domaine A / B / C » : dans Blade Runner, **chaque compétence
dépend d'un attribut** — les grouper par attribut ; décoratifs : « Dossier archive // Division
répression », « Mandat // Retrait immédiat », les qualificatifs d'attribut (« Bio-renforcé »,
« Rupture VK »), « Statut : Éraflure / Lucide », « Monitoring biométrique », « Mode
investigation police ».

### L'atelier des adversaires — retenu le 2026-09-27

`outils/outils-atelier-des-adversaires.png`. Même famille que la fiche du combattant.

**Ce qu'on garde** : une **fenêtre par-dessus le combat**, onglets Fabriquer / Bestiaire ;
**les trois temps** — l'archétype (Brute, Tireur, Rapide, Meneur, Spécialiste, Quelconque) et
sa phrase, ou un modèle du bestiaire ; les champs du jeu en **pastilles à trois états**
(▲ poussé vert, ▼ négligé rouge, neutre gris) et la phrase « Proposé d'après les libellés du
jeu — clique pour corriger, ton choix est retenu » ; le rang, le nombre, le nom — ; à droite,
**l'aperçu de la fiche qui va naître** (Santé, Sang-froid, attributs et leur dé, l'échelle) ;
Au bestiaire, Garder dans la campagne, **Envoyer au combat** en bouton plein.

**À régler à l'intégration** : « MAX 1 » à côté du nombre — le rang **propose** un nombre
(`RANGS.nombreSuggere` : 4 piétailles, 2 aguerris, 1 élite, 1 boss), il ne le plafonne pas ;
décoratifs : « Forge tactique élite & boss », « Indice tactique #BOSS-01 », « En cours de
forge ». La note de David, « un peu difficile d'accès », porte sur **l'endroit d'où on
l'ouvre** (le bouton du panneau de combat) : à traiter avec le Combat, pas ici.

## Le poste du meneur — retenu le 2026-09-27 (deuxième tour)

Prompt 14, fait **un écran par conversation** (la leçon du prompt 13).

### Le storyboard — retenu le 2026-09-27

`meneur/meneur-storyboard.png`. Répond à « la présentation en ligne est parfois peu lisible ».

**Ce qu'on garde** : ⭐ **un tableau, une ligne par moment, une colonne par source** (musique,
ambiance, lumière, carte, image, bruitage, écran) — ce que chaque moment déclenche se lit d'un
coup d'œil, et les colonnes vides disent aussi ce qu'il ne touche pas ; l'ordre numéroté avec sa
poignée ; « Jouer » par ligne, **« Arrêter » sur la ligne en cours**, qui se détache (couleur,
« En cours ») ; Dupliquer, Régler, Supprimer ; « Ajouter une séquence » en tête ; à droite,
**le détail du moment en cours** (ce que chaque source joue).

**À régler à l'intégration** : le lieu sous chaque nom n'existe pas (un moment n'a qu'un nom) ;
« Séquence précédente / suivante » n'existe pas — ✅ **retenu par David le 2026-09-29**
(enchaîner les moments sans viser la ligne ; une touche ou un bouton de l'Ulanzi à envisager) ; inventés : le « retour vidéo » des joueurs, « Hardware & DMX master
routing », « Vérifier flux DMX », « Exporter (.json) », « Réinitialiser ordre », « Matrice
10 canaux tempo-synchrones », « Pupitre de scène DMX ». Il manque la colonne du **titre affiché
sur l'écran des joueurs**, et le diaporama (dans la colonne image).

### Préparer la séance (l'ancien « MJ Focus ») — retenu le 2026-09-27

`meneur/meneur-preparer-la-seance.png`. Répond à « je ne vois pas ce que c'est » : **l'écran le
dit dans son titre** — « Préparer la séance n°1 — samedi 28 août 2026 ».

**Ce qu'on garde** : ⭐ **le rangement par moment d'usage** — 1. Avant la partie (synopsis des
joueurs marqué public, secrets du meneur marqués jamais partagés, checklist, date, ressources
annexes, PNJ et monstres liés avec recherche / ajouter / retirer, PJ présents d'un clic),
2. Pendant la partie (les notes du cockpit, en lecture ici), 3. Après la partie (les retours
des joueurs) ; en tête, « Retour à la liste des séances », le statut Planifiée / En cours /
Terminée, « Enregistrer et fermer ».

**À régler à l'intégration** : le nom de la vue — « MJ Focus » ne dit rien, le titre de
l'écran le remplace ; les secrets sont **un seul texte** (`gmSecrets`), pas des secrets
numérotés ; les notes du cockpit sont un texte libre, pas des lignes horodatées ; la date n'a
pas d'heure ni de durée (« 20:30 · créneau de 4 h ») ; le lien de ressource s'ouvre, le
fichier local aussi (« Preload » est le nom technique) ; les retours des joueurs sont **par personnage, trois notes sur cinq étoiles (plaisir, histoire, combat) et un commentaire** (`SessionFeedback`), pas un paragraphe unique ; décoratifs : « Diffusion table :
synchronisée », « Canal local GM strict », « Télémétrie & logs tactiques », « Analyse &
capitalisation post-mortem ».

### Le cockpit — retenu le 2026-09-27

`meneur/meneur-cockpit.png`. L'écran ★ où le meneur passe la partie.

**Ce qu'on garde** : ⭐ **la scène en cours en tête**, grande (acte, titre, sa description) —
répond à « où en est-on ? » ; le groupe en cartes (portrait, présence, santé en barre) ; les PNJ
actifs de la scène (portrait, camp, retirer, « Ajouter un PNJ ») ; résumé public et secrets du
meneur côte à côte, marqués ; la carte active et ses lieux épinglés ; les indices ; **à droite,
ce qui tourne ailleurs, en lecture rapide** : l'ordre de combat et le round avec « Ouvrir
Combat-OS », les conditions actives, les deux platines (titre, position, boucle), les cartes
du destin, le jet rapide et son historique ; en tête, « Mettre en pause » (existe : la pause de
séance, axe G), Oracle, Règles, Snapshot.

**À régler à l'intégration** : « Déclencheur d'urgence » et « Changer de scène » n'existent pas
— le second : ✅ **décidé par David le 2026-09-29, un raccourci vers la trame** ouverte sur la
scène en cours, pas un second écrivain de la scène ; les indices :
GM-OS ne montre dans le cockpit que **les indices déjà révélés**, en carrousel
(`SessionClueDeck`), pas des indices « à révéler » avec un bouton — ✅ **retenu par David le
2026-09-29** : les indices non révélés de la scène, chacun avec « Révéler » ;
la carte « Gérer le groupe » et « Ajouter un PNJ » apparaissent deux fois (en tête et dans leur
bloc) ; il manque la colonne des vues du tableau de bord (Cockpit, Rencontres, Storyboard,
Galerie, Loot-OS…) et l'afficheur Ulanzi ; décoratifs : « Menace ambiante : haute tension »,
« Latence replay », « Transmis aux 4 terminaux », « Alerte détection 15 % », « Clé n°09-MJ »,
« Grid 24×36 m », « Canal Deckard », « GM-01 override ».

### Le journal de jeu — retenu le 2026-09-27

`meneur/meneur-journal.png`. Stitch a proposé quatre rangements (fil puis revue, onglets,
deux panneaux, triptyque) ; **David a choisi le fil puis la revue, sur une seule page** — celui
d'aujourd'hui, habillé. (Claude Code recommandait les onglets, pour donner toute la largeur au
fil pendant la partie : écarté.)

**Ce qu'on garde** : une page en deux zones nommées — **1. Pendant la partie, le fil** : chaque
événement avec son heure, son type en pastille de couleur (Combat, PNJ, PJ, Lieu, Note, Dés,
Oracle, Audio, Système) et sa nature ; **la trace plus discrète que la chronique**, « Masquer les
traces mécaniques », « Tout / Chronique uniquement » ; **2. Après la partie** : le compte rendu
(Résumer par IA, Copier en Markdown), la revue scène par scène (« Ranger dans… », « Absorber
dans la scène suivante », « Scinder ici », et « Rien qui raconte — cette scène n'entrera pas dans
le résumé ») ; la note de fin de séance ; à gauche, les journaux de la campagne et « Nouveau
journal ». **Ce sont les vrais événements du 22/09** : Stitch n'a presque rien inventé.

**À régler à l'intégration** : « Absorber » choisit la scène à absorber dans une liste
(« Absorber… »), il ne vise pas d'office la suivante ; le bloc « Filtrage par type d'extrait »
(trois cases à cocher) n'existe pas — le filtre est la bascule trace / chronique ; décoratifs :
« Durée : --:-- », « Net-node ping », « Sauvegarde locale synchronisée », « Blade Runner RPG
Engine ».

### L'Oracle — retenu le 2026-09-27, avec une réserve

`meneur/meneur-oracle.png`.

**Ce qu'on garde** : une **fenêtre large par-dessus le tableau de bord** ; en tête, le persona
choisi et sa liste (les huit : Sage, Scribe, Oracle, Barde, Alchimiste, Acteur, Cartographe,
Stratège), **Campagne / Système** en bascule, « Vider la discussion », « Ouvrir NotebookLM dans
le navigateur », Échap ; **la discussion** : la question du meneur en bulle, **une réponse
longue lisible à un mètre** — paragraphes, mots clés en gras, la liste des étapes dans un
encadré ; la saisie en pied.

⛔ **La réserve : la source côte à côte n'est pas faisable telle quelle.** Stitch montre la
discussion ET « l'extrait de la source » en deux colonnes ; dans GM-OS ce sont **deux modes**
(Discussion / Voir la source), et pour une raison technique : **Google interdit d'intégrer
NotebookLM dans une page** (`X-Frame-Options`, noté dans `OraclePanel.tsx`) — la colonne de
droite ne pourrait pas afficher le carnet. Trois voies : garder les
deux modes ; ou remplir la colonne avec **les passages cités par la réponse** (si NotebookLM les
renvoie) ; ou la retirer et donner toute la largeur à la discussion. ✅ **David, le 2026-09-29 :
on garde les deux modes.** *(Les passages cités ne sont pas vérifiés : `useNotebookLM.ts` ne
garde de la réponse du serveur MCP que son texte.)*

**À régler aussi** : « Annoter » n'existe pas ; « Rafraîchir la source » existe (« Actualiser la
source ») ; le contenu de la réponse et de la source est d'exemple (les modificateurs de
pupillométrie sont inventés — **ce n'est pas une règle de Blade Runner**) ; décoratifs :
« Index d'arbitrage synchronisé », « Canal arbitrage vocal & texte », « 24 documents
référencés », « Lecture diégétique active ».

### Deck-OS — retenu le 2026-09-27

`meneur/meneur-deck-lecteur.png`, `meneur-deck-bibliotheque.png`.

⚠️ **Export défectueux, corrigé sur la copie rangée ici** : Stitch demandait à Google Fonts
« Space Mono » et « Syne » en graisses 100 à 900 ; Space Mono n'existe qu'en 400 et 700, la
requête échouait et **tout l'écran s'affichait dans une police à empattement**. Le HTML rangé
porte l'adresse corrigée. *Deuxième défaut d'export de la soirée, après l'accolade manquante :
toujours rendre soi-même le HTML avant de juger.*

**Ce qu'on garde** : ⭐ **les quatre tas du lecteur, d'un coup d'œil** — la pioche (dos de
carte, « 42 cartes »), la carte tirée en grand (un clic la retourne), la défausse (la dernière
carte, le compte, « Remettre dans la pioche »), et **les cartes en main** : chaque carte avec son
porteur, son état (« Sous scellé : personne ne la connaît » / « Révélée au porteur : table
aveugle ») et ses gestes (Donner à…, Révéler / Re-sceller, Jouer, Rendre au paquet) ; Piocher,
Défausser, Remélanger ; **Standard / Oracle** en bascule ; « Projeter sur le Player Hub ».
La bibliothèque : chaque paquet avec son système, son nombre de cartes, **« Ouvert aux joueurs /
Meneur seul »** et sa phrase, Charger, Modifier, Supprimer ; « Nouveau paquet », « Tout voir /
Système actif ».

**À régler à l'intégration** : inventés — « Révéler / Sceller / Rappeler toutes les cartes »,
le « Journal deck », la « Régie de distribution » (clients connectés, « Voir le retour
tablette »), les « Règles de pioche globales » (défausse automatique, autorisation de défausse
directe), « Importer CSV / JSON », « Dupliquer », « Archiver paquet » ; l'interrupteur « Accès
tablettes joueurs » du lecteur double celui de chaque paquet dans la bibliothèque — un seul
endroit ; décoratifs : « Indexé », « Rebus », « Total purgé », « Télémesure des possessions »,
« Flux synchro actif », « Format Poker — Paysage ».

### La liste des séances — retenue le 2026-09-27

`meneur/meneur-liste-des-seances.png`. Aujourd'hui, une carte ne montre que numéro, date et
statut.

**Ce qu'on garde** : ⭐ **un ruban vertical**, la prochaine séance en haut, les terminées en bas,
la séance en cours nettement détachée ; chaque carte dit **ce que la préparation contient
déjà** — la première ligne du synopsis, la checklist (« 3 / 6 » avec sa barre), les PNJ liés,
les PJ prévus ou présents (« 1 absent » en rouge) ; le statut en badge ; « Préparer la séance »
en bouton de carte ; « Supprimer » discret ; les compteurs par statut en tête ; « Créer une
séance », « Retour cockpit ».

**À régler à l'intégration** : les libellés du bouton varient (« Préparer », « Reprendre »,
« Consulter ») — un seul geste existe, ouvrir la préparation : ✅ **le libellé suit le statut,
décidé par David le 2026-09-29** (Planifiée → Préparer, En cours → Reprendre, Terminée →
Consulter) ; « Session prévue à 20:30 » (pas d'heure) ; inventés : « Repères
d'actes » avec leur pourcentage (une séance porte bien l'acte prévu, `acteId`, mais sans
avancement), « Navigation par date » (doublon du ruban), « Exporter résumé Markdown »,
« Archiver le ruban », la règle « suppression verrouillée pendant la partie » ; décoratifs :
« Ruban actif », « Axe : ordre antéchronologique », « Timeline OS ».

## Les surcouches — retenues le 2026-09-27 (deuxième tour)

Prompt 15. Le but n'est pas cinq fenêtres, mais **un cadre commun** aux quelque trente
surcouches (27 variantes de `CustomModalVariant`, plus les boîtes simples) : *si le cadre est
juste, la plupart suivent* (inventaire, 6.12). Fait en deux temps : le cadre d'abord, sur les
deux fenêtres les plus simples ; puis chaque autre fenêtre l'applique.

### Le cadre — retenu le 2026-09-27

`surcouches/surcouche-confirmation.png`, `surcouche-saisie.png`.

**Ce qu'on garde, et qui vaut pour toutes les surcouches** : l'écran assombri derrière ; **l'en-
tête** — pictogramme dans une case, titre, « [Échap] » et la croix à droite ; le corps ; **le
pied** séparé par un filet, **l'action principale en bouton plein à droite, « Annuler » à sa
gauche** ; la petite largeur (~500 px) pour une question. **La confirmation** : le bouton
destructeur est rouge mais **« Annuler » a le focus** — le geste par réflexe ne détruit rien.
**La saisie** : un libellé au-dessus du champ, une phrase d'aide dessous.

**À régler à l'intégration** : les deux fenêtres ne portent pas le même bord (la saisie a un halo
cyan, la confirmation non) — **un seul bord pour le cadre** ; décoratifs : « // Dialogue
sécurisé », « sur le réseau actif », le sous-titre « Saisie // Univers » ; la phrase d'aide de la
saisie est d'exemple (elle dépend de la question posée).

### La palette (Ctrl+K) — retenue le 2026-09-27

`surcouches/surcouche-palette.png`. Applique le cadre commun, en largeur moyenne, dans le tiers
haut de l'écran.

**Ce qu'on garde** : un seul grand champ ; **les résultats groupés par sorte**, chacune avec son
titre et son pictogramme — Entités, Audio, Règles & wiki, Actions & outils (les cinq sortes de
`useSpotlight` : `entity`, `audio`, `map`, `rule`, `action`) ; le résultat choisi surligné,
avec son geste à droite (« Ouvrir », « Exécuter ») ; **en pied, les touches** (↑ ↓ naviguer,
Entrée ouvrir, Échap fermer) et le nombre de résultats.

**À régler à l'intégration** : le panneau « Aperçu fiche » à droite (santé, sang-froid, « Ouvrir
fiche ») et la touche « Aperçu » n'existent pas — ✅ **retenu par David le 2026-09-29, pour
les entités seulement** (vide pour une musique ou une action, il n'apparaît pas) ; le groupe **Cartes** manque (pas de carte pour
« roy ») ; décoratifs : « Recherche // Spotlight », le matricule de l'aperçu, la durée d'une
musique, « Livre de base ».

### Les instantanés — retenus le 2026-09-27

`surcouches/surcouche-instantane-capturer.png`, `surcouche-instantane-contenu.png`. Appliquent le
cadre commun, en largeur moyenne.

**Ce qu'on garde** : **Capturer l'état** — une phrase qui dit ce qu'est un instantané (l'état de
tous les modules, associé à une séance), les modules concernés en pastilles, la liste des séances
à choisir, chacune avec son statut et **« Instantané existant (sera remplacé) »** en alerte ;
« Capturer l'état actuel ». **Voir le contenu** — un bloc par module figé (audio : les deux
platines et l'ambiance ; lumière : la scène ; projection et carte), « Prêt pour la
restauration », « Restaurer cet état » en bouton plein.

**À régler à l'intégration** : « Enregistré le … à 22:30 » (vérifier que l'instantané garde son
heure) ; décoratifs : « Système snapshot instantané », « DMX sync OK », « 4 sources
synchronisées », « Écran tactique 4K », « Snapshot_ID // auto-gen ».

### La fin de séance — retenue le 2026-09-27

`surcouches/surcouche-fin-resume.png`, `surcouche-fin-retours.png`, `surcouche-fin-notes.png`.

**Ce qu'on garde** : le cadre commun, **un seul pied par fenêtre** — le résumé : « Annuler » et
« Enregistrer le résumé » ; les retours et les notes : « Fermer » seul (on lit les retours ; les
notes s'enregistrent seules). **Le résumé** : la séance et sa date, « Résumé public & lore » et
la phrase « Ce contenu sera utilisé par l'Oracle ». **Les retours** : en tête, la moyenne
générale et celle de chaque note ; puis par personnage **trois notes en étoiles** (plaisir,
histoire, combat) et son commentaire (`SessionFeedback`). **Les notes rapides** : un grand champ
libre, « Sauvegarde automatique — fermez la fenêtre pour enregistrer ».

**À régler à l'intégration** : « (joueur : Marc) » — à vérifier contre ce que porte un retour
(`characterName`, pas le joueur) ; « 442 caractères // sécurisé » décoratif.

⚠️ **Au premier passage, Stitch avait cassé le cadre** sur les trois fenêtres (titre
« MOD_CONSOLE_OVERLAY », un second pied inventé : « Ajuster télémétrie », « Valider
directive »). Un correctif court, dans la même conversation et **portant sur le cadre seul**, a
suffi : la contamination touche le contenu, pas la forme.

## La préparation — retenue le 2026-09-28 (deuxième tour)

Prompt 16, un écran par conversation : les écrans qu'on ouvre entre deux parties.

### La bibliothèque des campagnes — retenue le 2026-09-27

`preparation/preparation-bibliotheque.png`. Répond à « il manque une image de fond, et un petit
synopsis ». **Les deux champs existaient déjà** (`wallpaperUrl`, `synopsis`) : la carte
montrait l'image quand elle était là, et la description au lieu du synopsis.

**Ce qu'on garde** : ⭐ **l'image de fond en tête de chaque carte, et sa place même vide** —
« Ajouter une image de fond », une invitation et non un trou ; le système en badge sur l'image ;
le nom ; **le synopsis sur trois lignes, ou « Écrire un synopsis »** ; « Active » et le cadre de la
campagne ouverte ; Exporter (avec le nombre de médias emportés), Modifier, Supprimer ; « Gérer »
en bouton de carte ; en tête, la recherche, « Désactiver la campagne », « Importer une
archive », « Créer une campagne ».

**À régler à l'intégration** : afficher **le synopsis** (`synopsis`) et non la description ; un
texte parasite dans le bouton « Stop all » du bandeau (« FITBIT_HOURLY_ACTIVITY ») — défaut de
Stitch, à ignorer ; « Ctrl+F » dans la recherche n'existe pas.

### La fiche de la campagne — retenue le 2026-09-27

`preparation/preparation-campagne.png`. L'écran « Gérer » de la bibliothèque.

**Ce qu'on garde** : **tout sans défiler, par ordre de ce qu'on vient chercher** — les séances
d'abord (numéro, date, statut, la première ligne du résumé, « Modifier le résumé » ; la séance en
cours détachée), la galerie des PNJ en mosaïque avec **l'aperçu de celui qu'on survole** (nom,
camp, « Fiche »), les lieux actifs avec leur vignette ; l'aperçu (description et synopsis)
**repliable** ; en tête, le nom, le système, « Pilote actif », Retour, Modifier, Exporter vers
Obsidian.

**À régler à l'intégration** : l'image de fond de la campagne n'est pas en bandeau (demandé) —
à reprendre de la bibliothèque ; décoratifs : « Log_status : pending », « Archive_hash »,
« Live_session : active_regie », « Sys_build », « Canvas_01 », « Grid_nav », « Sync_OK ».

### Les joueurs — retenus le 2026-09-27

`preparation/preparation-joueurs.png`.

**Ce qu'on garde** : **les noms des joueurs en entier** (ils étaient coupés : « Tho… ») ;
chaque joueur avec son nombre de personnages et « En ligne / Hors ligne » (sa tablette) ;
le joueur choisi, son état en clair (« Hors ligne — tablette déconnectée ») ; ses personnages en
cartes : portrait, nom, peuple / origine, **Points de vie avec − / + en gros**, Fiche, Combat,
projeter, la campagne, « Transférer vers… » ; « Ajouter un joueur », « Ajouter un personnage ».

**À régler à l'intégration** : les avatars des joueurs sont remplacés par des initiales — garder
les avatars (ils existent) ; le nom de la campagne est coupé dans sa liste (« Anges de Fe ») et
« Transférer vers » est rogné ; inventés : « Classe niveau 5 », « Opérateur de table actif »,
« ID système PL-0091 », « #CHAR-01 », « Disposition tactique active ».

### Le Grimoire — retenu le 2026-09-28

`preparation/preparation-grimoire.png`. La configuration du jeu (le pilote), sept onglets.
Répond à « les options ne sont pas toujours claires ».

**Ce qu'on garde** : ⭐ **chaque réglage dit ce qu'il change à la table** — un encadré « En
clair » et **un exemple** (« Deckard lance 1d12 (Vigueur A) + 1d10 (Armes B) ») ; les choix en
tuiles, l'actif surligné (« Dés échelonnés (d6…d12) ») ; la lecture du résultat illustrée par
des tirages (1 = écueil, 6 à 9 = un succès, **10+ = deux succès** — la règle réelle) ; la
formule par défaut en grand avec ses pas ; le gabarit de fiche lié et son aperçu ; les sept
onglets à gauche, chacun avec son résumé (« 5 paliers de portée », « Tables de butin ») ;
« Synchroniser », « Enregistrer les modifications ».

**À régler à l'intégration** : inventés — la « Console de test » (« Tester le jet système »), le
« Répertoire système » (Combat-OS connecté, Dice-OS synchronisé…), « Réinitialiser aux
défauts », « Référence système validée » ; les options du moteur sont **quatre tuiles** alors que
le code en a treize (Standard, explosifs, formule, seuil, pool, pool explosif, avantage,
désavantage, Year Zero, YZE Step, FATE, Rolemaster, 2D20) — une liste avec l'explication de
chacune ; « Marge de succès » n'existe pas dans la lecture du résultat.

### L'atelier des règles — retenu le 2026-09-28

`preparation/preparation-atelier-des-regles.png`. Répond à « il manque la possibilité de
préciser des paramètres » — **David, 2026-09-27 : les paramètres pour générer une règle**.
Ils existent, **dans la Forge** (onglet « Atelier de Règles » : carnet, sources, sujet,
candidates) ; l'atelier du Grimoire n'offrait qu'une fiche Markdown vide et renvoyait à la
Forge sans y mener.

**Ce qu'on garde** : « Créer une règle » ouvre une fenêtre à **deux chemins** — « L'écrire
moi-même » et **« La générer avec l'IA »** : le sujet, **les sources du carnet NotebookLM à
cocher**, et « Proposer des règles », qui annonce le nombre de candidates.

**À régler à l'intégration** : le chemin IA doit **appeler le même moteur que la Forge**
(`useBrainstormStore` : sources, sujet, candidates), pas en dupliquer un ; « Système cible &
type de dés » et « Type d'épreuve » sont inventés (le jeu est déjà celui de la campagne) ;
décoratifs : « Synapse Forge v6.4 », « Protocole atelier G6 », « Encodage UTF-8 »,
« Locked », « Corpus ID ». La bibliothèque des fiches derrière la fenêtre est à reprendre du
prompt (liste, fiche ouverte, Éditer / Partager / Exporter) : elle n'est vue qu'assombrie.

### Les chroniques — retenues le 2026-09-28

`preparation/preparation-chroniques.png`. Répond à « ce module est un peu difficile d'accès »
en partie seulement : la note porte aussi sur **le chemin** qui y mène (à traiter avec la
navigation du tableau de bord).

**Ce qu'on garde** : ⭐ **la frise et le wiki côte à côte** — la chronologie au centre, le wiki
du monde à droite, toujours visible (recherche, catégories, l'entrée ouverte, « Modifier la
fiche ») : on ne bascule plus d'onglet pour relier un événement à un lieu ; chaque événement
avec sa sorte en couleur (Combat, Séance, Quête, Lore), sa date, son titre, **son texte mis en
forme** (gras, listes, cases de quête) — la réponse au défaut garé du Markdown brut ;
« Éditer », supprimer ; les filtres par sorte ; « Nouvel événement ».

**À régler à l'intégration** : inventés — le pied de chaque événement (« Secteur 04 // Unité
BR-02 », « Statut : engagé // risque létal max », « Progression : 66 % »), les coordonnées GPS
et la « densité sensorielle » du lieu, « Accès directs rapides » ; les sortes réelles sont **cinq** — Quête, Combat, Lore, **Événement majeur**, Séance (`chronicle.types.ts`) — et les catégories du wiki **huit** (PNJ, lieu, organisation, lore, objet, indice, rumeur, autre) ; « Exporter Obsidian (.md) »
existe au niveau de la campagne, pas d'une entrée — à vérifier.

### L'atelier des calendriers — retenu le 2026-09-28

`preparation/preparation-atelier-des-calendriers.png`. Répond à « une présentation plus
moderne ».

**Ce qu'on garde** : ⭐ **l'aperçu de l'année à droite**, qui se met à jour — les mois en
petites grilles, les fêtes intercalaires en bandeau entre deux mois, les totaux (jours dans
l'année, dans les mois, fêtes) ; les réglages à gauche en blocs numérotés (identification et
modèle, « Composer d'après une description », paramètres temporels, bissextile, semaine) ; la
validation en clair (« Couverture annuelle valide : 365 jours ») ; « Enregistrer le
calendrier ».

**À régler à l'intégration** : les saisons (« Hiver », « Printemps ») sur chaque mois n'existent
pas dans le format — ✅ **retenu par David le 2026-09-29, en champ facultatif** (les
calendriers existants restent valides ; l'affichage dans Clock-OS reste à décider) ; la règle bissextile est un nombre d'années, pas un
texte (« Jour du Bouclier ») ; décoratifs : « Forge chronologique G13 », « Matrice 365J
active », « Référence calendrier actif ».

### Six écrans sans note de David — retenus le 2026-09-28

Passés par Stitch **pour la cohérence** : aucun ne portait de plainte. Même famille, même
grammaire ; ce qu'on garde tient donc en une ligne chacun.

| Écran | Ce qu'on garde | À régler à l'intégration |
| --- | --- | --- |
| `preparation-formulaire` | **Les sept sections nommées** (elles n'étaient que des icônes) ; l'image de fond et le synopsis dans l'identité | « Sync : Obsidian local », « Statut synchronisation », « Registre séances » décoratifs |
| `preparation-modeles-de-fiche` | La liste (jeu, nombre de champs, badge « Référence officielle ») et **l'aperçu en groupes de champs** avec les dés | « Dupliquer pour forger », « Exporter Obsidian » à vérifier ; « Communauté » inventé |
| `preparation-atlas` | Bibliothèque des cartes (sorte, « Visité »), la carte au centre, **sa fiche à droite** (description, PNJ, indices, lieux voisins) | Le plan tactique annoté au centre est un exemple ; « Échelle 1 case = 1,5 m », « Canal feed » inventés |
| `preparation-forge` | **Les trois temps numérotés** (destination, dériver du corpus avec sa durée, intentions) ; le résultat en groupes de champs à relire, « Regénérer un groupe », « Valider l'ensemble » | « Régénérer un groupe » à vérifier contre la Forge ; « Station Cortex-L9 » décoratif |
| `preparation-favoris` | Filtres avec leur compte, **dossiers**, cartes avec image, sorte, étoile, « dernière vue » | « Allocation mémoire 68 % », « 12 favoris épinglés » inventés |
| `preparation-tableau-blanc` | La surface au plus large, **une barre d'outils compacte** (crayon, gomme, rectangle, cercle, pion), épaisseur et couleurs en pied ; Annuler, Rétablir, Tout effacer, Projeter | « Pion », « Cible » et « Règle / mesure rapide » n'existent pas — ✅ **les trois retenus par David le 2026-09-29** (l'unité de la règle vient du pilote) ; « Flux tablette maître », « Retour joueurs » inventés |

## L'outillage — retenu le 2026-09-28 (deuxième tour)

Prompt 17, un écran par conversation. Trois portaient une note de David.

| Écran | Ce qu'on garde | À régler à l'intégration |
| --- | --- | --- |
| `outillage-mediatheque` | ⭐ **Chaque type se reconnaît** (« plus de distinction entre les types ») : l'image montre l'image, le son sa forme d'onde et sa durée, la vidéo sa première image, le document sa première page ; **les tags en pastilles sur chaque vignette** et filtrables à gauche (« montrer plus clairement les tags ») ; le panneau du média choisi : lecture, tags, **liaisons** (campagne, playlist, storyboard, PNJ) | « Télémétrie CPU / RAM », « Grille compacte », l'échantillonnage du son inventés ; « Utilisé par » réel s'appelle ainsi dans le code |
| `outillage-parametres` | ⭐ **Chaque catégorie avec sa phrase** (« Apparence, langue, état ») — « mieux organiser le tout » ; les quatre thèmes de base en tuiles avec leur aperçu ; la couleur d'accent en pastilles nommées ; « Enregistrer les modifications » en pied | « Réservoir Cortex local 68 % », « Réinitialiser les réglages », « Dernière synchro » inventés ; les Paramètres comptent **une trentaine d'écrans** : ce cadre doit les tenir tous |
| `outillage-atelier-du-theme` | ⭐ **Chaque réglage dit où il se voit** (« Fond — le fond de l'application et des fiches ») **et le montre** : une vignette où la zone est surlignée — « être plus explicite sur les options » ; **l'aperçu vivant** (une carte de combattant, des badges) ; les polices en choix nommés ; « Annuler (rétablir copie d'origine) », « Créer un thème », « Enregistrer le thème » | « Jetons CSS injectés » affiche le code : utile au développeur, pas au meneur — à retirer ou replier ; « Empreinte SHA » inventé |
| `outillage-nexus` | ⭐ **L'arborescence large et le texte grand** — « l'arborescence est un peu petite et le texte aussi » ; les liens internes `[[…]]` cliquables ; la table des matières de la note | « Notes liées entrant » (les rétroliens) : à vérifier contre le module ; « Nouvelle note », « Mode édition » : Nexus lit le coffre, il ne l'écrit peut-être pas — à vérifier |
| `outillage-navigateur` | Les liens en tuiles numérotées, Charger / Enregistrer / Effacer, Précédent / Suivant / Recharger, l'adresse ; la page au plus large | La page de règles montrée est d'exemple (et invente une table D66) |
| `outillage-aide` | Les trois gestes maîtres en tête (palette, neuf places, Échap), puis **les raccourcis groupés par usage**, chaque touche dessinée | ⛔ **Plusieurs raccourcis sont inventés** (Ctrl+P, Espace pour le tour suivant, Alt+D…) : la liste doit venir du registre réel des raccourcis, pas du dessin |

---

## ⭐ Bilan du deuxième tour — 2026-09-28

**Huit lots, tous retenus** : Image-OS, le son, les PNJ, les outils de séance, le poste du
meneur, les surcouches, la préparation, l'outillage — une soixantaine d'écrans, qui s'ajoutent
aux neuf du premier tour. **Toute l'interface du meneur a désormais une direction Stitch**,
sauf quatre écrans jamais capturés (centre de notifications, loupe de lecture, ressources de
table, écran volant des effets de Light-OS) et la section 7 (Player Hub, tablettes : hors
refonte).

**Trois leçons, à garder pour tout futur passage dans Stitch :**
1. **Un écran par conversation, un prompt court qui dit ce que l'écran fait — et rien
   d'autre.** Le prompt 13 groupé a échoué deux fois ; dans la même conversation, Stitch
   recopie ses propres inventions. Un correctif dans la même conversation ne marche que s'il
   porte sur la forme (le cadre de la fin de séance).
2. **Écrire le prompt depuis le code**, surtout quand la capture est vide : ce que l'écran
   contient, ses gestes réels, ses règles (lecture seule, deux modes…). Deux fois, la réponse à
   une note de David existait déjà ailleurs (les paramètres de génération dans la Forge, le
   synopsis et l'image de fond dans la campagne).
3. **Toujours rendre soi-même le HTML exporté.** Deux défauts d'export en une soirée : une
   accolade manquante dans `tailwind.config` (écran sans style, même son `screen.png`) et des
   graisses de police impossibles (tout en empattement). Les copies rangées ici sont réparées.

**Ce qui vient ensuite** : rien de ce tour ne change l'écran avant la **phase 4**
(migration). La suite du code reste **P1.2** du plan de la phase 1.

---

## ✅ Les idées tranchées — David, le 2026-09-29

Les idées de Stitch notées « à décider » dans les lots ci-dessus, passées en revue une à une.
**Elles ne changent pas l'écran avant la phase 4** : ce tableau dit ce que la migration
reprendra, en plus de ce qu'on garde.

| Écran | Idée de Stitch | Décision |
| --- | --- | --- |
| L'Oracle | La source côte à côte | **Garder les deux modes** (Discussion / Voir la source) — Google interdit d'intégrer NotebookLM |
| Le cockpit | « Changer de scène » | **Un raccourci vers la trame**, ouverte sur la scène en cours — la scène garde un seul écrivain |
| Le cockpit | Les indices « à révéler » | **Oui** : les indices non révélés de la scène, chacun avec « Révéler », à côté du carrousel des révélés |
| Le storyboard | Moment précédent / suivant | **Oui** — enchaîner sans viser la ligne ; une touche ou un bouton de l'Ulanzi à envisager |
| La palette (Ctrl+K) | L'aperçu à droite | **Oui, pour les entités seulement** — absent pour une musique ou une action |
| Loot-OS | « Partager équitablement » | **Oui** — la monnaie du butin répartie entre les personnages |
| Loot-OS | « Archiver les reliquats » | **Oui** — ce que personne n'a pris est mis de côté |
| Les tables aléatoires | Espace pour lancer | **Oui** |
| Les tables aléatoires | « Réinjecter » depuis l'historique | **Oui** — l'historique devient cliquable |
| La liste des séances | Le libellé selon le statut | **Oui** — Préparer / Reprendre / Consulter, un seul geste derrière |
| L'atelier des calendriers | Une saison par mois | **Oui, champ facultatif** — les calendriers existants restent valides ; l'affichage dans Clock-OS reste à décider |
| Le tableau blanc | Pion, Cible, Règle / mesure | **Les trois** — l'unité de la règle vient du pilote, comme pour le Cortex |

**Restent « à vérifier »** (pas des idées, des doutes sur ce qui existe) : « Dupliquer pour
forger » et « Exporter Obsidian » (modèles de fiche), « Régénérer un groupe » (Forge), les
rétroliens et l'écriture de notes (Nexus).
