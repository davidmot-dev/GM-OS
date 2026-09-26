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
