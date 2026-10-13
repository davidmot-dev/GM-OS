# 🎲 Les jeux et leurs mécaniques

Chaque jeu entre dans GM-OS par son **pilote** : le fichier, forgé ou écrit à la main, qui dit
comment on lance les dés, quelles réserves la table partage, comment on encaisse les coups. Le même
écran change donc de visage selon le jeu de la campagne ouverte. Cette page explique **chaque
mécanique une fois**, et dit **où la voir**. Une page par jeu dit ensuite ce que *son* pilote en
fait.

> **Mis à jour le 2026-10-13**, sur les pilotes exportés ce jour-là. Un pilote nouveau ou amélioré
> se reporte ici. La marche à suivre est en bas de page, sous « Tenir ce manuel à jour ». Les captures
> sont celles des pilotes **corrigés** le même soir (`Export Dirvers/corriges/`).

---

## Les jeux

| Jeu | Ce qui le distingue dans GM-OS | Page |
| :--- | :--- | :--- |
| 🌌 **NOC** | Dés de destin sur un Domaine. **Fiel** qui déborde en **Menace**. La **Cabale**, fiche commune où l'on puise au jet | [NOC](./54-Jeu-NOC.md) |
| 🏜️ **Dune** | 2d20 sous un seuil. **Impulsion** et **Menace**. Dés achetés, ordre du tour **alterné**, **défaite** en tâche étendue | [Dune](./54-Jeu-Dune.md) |
| 🖖 **Star Trek** | 2d20 sous un seuil. **Impulsion** et **Menace**. Dés achetés | [Star Trek](./54-Jeu-Star-Trek.md) |
| 👽 **Alien** | Réserve de d6 et **dés de Stress**, qui déclenchent la **Panique** | [Alien](./54-Jeu-Alien.md) |
| 🌃 **Blade Runner** | **Dés échelonnés** : un dé par attribut et par compétence, de D6 à D12 | [Blade Runner](./54-Jeu-Blade-Runner.md) |
| 🐙 **Cthulhu Hack** | **Sauvegardes** au d20 sous la caractéristique, **dés d'usure** (Torche, Bagou…) | [Cthulhu Hack](./54-Jeu-Cthulhu-Hack.md) |
| 🐉 **Rêves de Dragons** | d100 sous un **pourcentage** lu dans la table de résolution, **degrés** de réussite | [Rêves de Dragons](./54-Jeu-Reves-de-Dragons.md) |
| ⚡️ **Torg Eternity** | Un d20 qui **explose**, converti par la **Table des Bonus**, contre un **Niveau de Difficulté** ; **Possibilité**, « Un de plus ! » et relance favorisée après le premier dé ; **Annulation des dommages** | [Torg](./54-Jeu-Torg.md) |

---

## Où regarder

| Écran | Ce qu'on y trouve |
| :--- | :--- |
| **Le bandeau des réserves**, en tête de Session-OS | Les réserves de table (Impulsion, Menace, Fiel…), leurs boutons + / −, et les gestes « Fin de scène », « Début de séance », « Nouveau scénario » |
| **Le panneau « Lancer un test »**, sur la fiche d'un personnage (formulaire, pas « Fiche du jeu ») et sur la tablette (vue synthétique) | Le jet du jeu : ce qu'on retient sur la fiche, les dés achetés, ce qu'on puise dans le groupe, le résultat |
| **La carte de campagne**, dans le cockpit | Le bouton de la **fiche du groupe** (la Cabale), quand le jeu en a une |
| **La tablette d'un joueur** | Les mêmes réserves et le même jet, et le bouton du groupe à côté de « Ma fiche » |
| **Combat-OS** | L'ordre du tour, la santé, la défaite — voir [Combat-OS](./30-Combat-OS.md) |
| **Dice-OS** | Le pupitre, et les dés d'usure — voir [Dice-OS](./34-Dice-OS-le-pupitre.md) |

---

## Le jet (`jet`)

Le panneau « Lancer un test » lit sur la fiche ce que le jeu demande, et ne lance que quand chaque
choix est fait. Un pilote décrit son jet avec une ou plusieurs de ces pièces :

| Pièce | Ce que c'est | Exemple |
| :--- | :--- | :--- |
| **Seuil** (`seuil`) | Des valeurs de la fiche **additionnées** : chaque dé sous le seuil (ou au-dessus, selon le `sens`) réussit | Dune : Compétence + Principe |
| **Réserve** (`reserve`) | Un nombre de dés : une base, plus des valeurs de la fiche, jusqu'à un plafond | Alien : Attribut + Compétence ; NOC : le Domaine |
| **Dés achetés** (`cout`, `ressource`) | Des dés de plus, payés sur une réserve de table, à un prix qui monte | Dune : 1, 2 puis 3 points d'Impulsion |
| **Seconde réserve** (`secondaire`) | Des dés lancés avec les autres mais **comptés à part** : un 1 y déclenche quelque chose | Alien : les dés de Stress, et la **Panique** |
| **Dés échelonnés** (`desEchelonnes`) | **Un dé par valeur**, dont la taille se lit sur la fiche | Blade Runner : A = D12 … D = D6 |
| **Cible en pourcentage** (`cible`) | Un d100 sous un pourcentage, lu dans la table du jeu | Rêves de Dragons |
| **Table des Bonus** (`tableDeBonus`) | Le dé se convertit en **bonus** par la table du jeu, s'ajoute au **niveau** (le seuil additionné) et se compare à la difficulté | Torg : un d20 qui explose sur 10 et 20 |
| **Réglages de Torg** (`torg`) | Le champ des **Blessures** (−1 au total d'action chacune, jusqu'à −3), celui des **Possibilités** (dépensées après le premier dé), et le test de Réalité de l'**Annulation des dommages** | Torg |
| **Provoquer le destin** (`destin`) | Le **niveau** (le seuil : le Talent) contre la difficulté ; on lance de zéro au **plafond** (la réserve : le Domaine) de dés à dix faces, chaque 8 et plus élève le niveau, un 10 fait lancer un dé de plus, **chaque 1 verse une goutte dans la réserve de table** déclarée. Des **jauges de péril** retirent au Domaine et au Talent selon leurs seuils, cumulés | NOC |
| **Réserves du personnage** (`reservesDuPersonnage`) | Ce que le personnage puise dans **ses** réserves, sur **sa** fiche, au moment du jet — même forme que les apports du groupe | NOC : Vécu, Espoir, Singularité |
| **Composante facultative** (`facultative`) | Un choix qu'on peut laisser vide sans bloquer le jet | Torg : la compétence, absente d'un test non entraîné |
| **Critique, complication** (`critique`, `complication`) | Les faces qui comptent double, ou qui compliquent | 2d20 : 1 et 20 |
| **Difficulté** (`difficulte`) | Le nombre de réussites à atteindre, réglable avant de lancer | Dune : de 0 à 5 |
| **Sens** (`sens`) | Réussir **sous** le seuil, ou **au-dessus** | Cthulhu Hack : sous ; NOC : au-dessus |

**Avantage / Désavantage** n'apparaît que là où un seul dé décide : sur une réserve, il n'y a pas
de « meilleur dé ».

**Le résultat** dit le nombre de réussites sur une réserve, et **le calcul** sur un jet qui se
tranche d'un seul dé (Sauvegarde, pourcentage, Table des Bonus).

---

## Les réserves de table (`ressourcesDeTable`)

Des réserves qui appartiennent **à la table**, pas à un personnage : six joueurs n'ont pas six
Impulsions. Elles vivent **campagne par campagne**, s'affichent dans le **bandeau des réserves**, et
chaque mouvement s'inscrit au journal de séance avec ce qui l'a causé.

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Propriétaire** (`proprietaire`) | Les joueurs (icône 👥) ou le meneur (icône 👑). Il décide aussi, par défaut, qui la voit et qui la manipule |
| **Visible aux joueurs** (`visibleAuxJoueurs`) | La réserve apparaît sur les tablettes. Une Menace peut être publique sans être aux joueurs |
| **Manipulable par les joueurs** (`manipulableParLesJoueurs`) | Les joueurs la font bouger eux-mêmes, depuis leur tablette |
| **Plafond** (`max`) | Absent : sans plafond (la Menace). Présent : la réserve se dessine en segments |
| **Fin de scène** (`erosionFinDeScene`) | Ce qu'elle perd quand vous appuyez sur **« Fin de scène »** |
| **Début de séance** (`erosionDebutDeSeance`) | Ce qu'elle perd quand vous appuyez sur **« Début de séance »** — la soirée de jeu, pas le temps du récit |
| **Nouveau scénario** (`remiseAuDepartParScenario`) | Elle revient à son départ quand vous appuyez sur **« Nouveau scénario »** (une confirmation dit ce qui sera remis) |
| **Report du manque** (`reportSurEpuisement`) | Ce qu'elle ne peut pas payer **alimente une autre réserve** : à zéro d'Impulsion, un dé acheté se paie en Menace |
| **Débordement** (`debordement`) | À son plafond, elle **se vide** et une autre réserve monte : à cinq gouttes, le Fiel passe en Menace. Le reste d'un gain continue de remplir la jauge vidée |

**Rien ne devine quand une scène finit ou qu'une séance commence** : ces trois gestes sont des
boutons, au meneur. Ils n'apparaissent que si une réserve du jeu en déclare l'effet.

---

## La fiche du groupe (`ficheDeGroupe`)

Certains jeux ont **un personnage de plus, commun à toute la table** : la Cabale de NOC. Sa fiche
vit sur la **campagne**, pas chez un joueur. Il n'entre donc ni dans l'initiative ni dans le
panneau de jet, mais chacun le voit et le remplit.

- **Chez vous :** la carte de campagne du cockpit porte un bouton **« Fiche du groupe »**. Il ouvre
  la fiche HTML du groupe, branchée comme celle d'un personnage (« Relier » ou « Créer une fiche »).
- **Sur une tablette :** un bouton au nom du groupe, à côté de « Ma fiche ». Ce que le joueur y
  écrit remonte chez vous.
- **Son nom** est celui qu'on écrit dans le champ « Nom » de sa feuille.

### Puiser dans le groupe au jet (`apports`)

Un pilote peut dire ce que le groupe **apporte aux jets** des personnages. Le panneau « Lancer un
test » montre alors une section **« Puiser dans la … »**, une ligne par apport :

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Effet** (`effet`) | Des **dés** de plus dans la réserve, un **bonus** ajouté au résultat, ou des **1 annulés** après le lancer (`annuleLesUns` : seuls ceux qui servent se dépensent) |
| **Par point** (`parPoint`) | Ce que rapporte un point : trois dés pour un point d'Espoir de la Cabale |
| **Épuisement** (`epuisement`) | `piste` : la piste de la feuille du groupe descend (l'Espoir). `scenario` : une réserve rechargée par **« Nouveau scénario »** (les dés d'un Domaine) |
| **Stocks** (`stocks`) | Où se lit chaque stock sur la feuille du groupe |
| **Composante** (`composante`) | Le stock suit ce que le personnage a retenu : le Domaine du Héros choisit le Domaine de la Cabale |
| **Par jet** (`maxParJet`) | Combien de points au plus sur un même jet — un seul point d'Atout ou de Vécu chez NOC |

Rien ne se dépense avant **Lancer**, et l'on ne peut pas engager plus qu'il ne reste. Un bonus se
dit à côté des réussites (« 3 réussites (dont +1 Cabale) »).

---

## Les dés d'usure (`desDUsure`)

Une ressource qui **est un dé** : on la lance quand on la sollicite, et un 1 ou un 2 la fait
descendre d'un cran (d20 → d12 → d10 → … → d4 → épuisée). Le dé courant s'écrit **sur la fiche** (« d8 ») ; le
pupitre le lit, le lance et y réécrit le dé qu'il devient. Sans déclaration, GM-OS reconnaît les
ressources suivies en combat dont le champ contient un dé. Voir [Cthulhu Hack](./54-Jeu-Cthulhu-Hack.md).

---

## L'ordre du tour, la santé, la défaite (`combat`)

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Initiative par formule** (`initiativeFormula`, `initiativeSort`) | Une valeur de la fiche ou un jet, triés dans un sens ou dans l'autre |
| **Cartes d'initiative** (`initiativeCards`) | Un paquet de cartes numérotées, une par combattant (Alien, Blade Runner) |
| **Ordre alterné** (`initiative`) | Pas d'initiative individuelle : le tour **alterne** entre les camps, garder la main ou l'ouvrir coûte une réserve (Dune) |
| **Modèle de santé** (`defaultHealthType`) | Points de vie, horloges, anatomie, blessures ou cases — la carte du combattant change d'aspect |
| **Santé de départ** (`santeDeDepart`) | Le maximum se lit sur la fiche (Alien : la Force) |
| **Cases de santé** (`casesDeSante`) | Pour le modèle « cases » : leur **nombre**, leurs **seuils** nommés (« Choqué » à 5) et l'état que chacun déclenche, le **libellé** de la jauge, et le **champ** de la fiche qui la suit (NOC : dix cases Blessures). Sans elles, cinq cases (Léger, Grave, Critique) |
| **Tâche de défaite** (`tacheDeDefaite`) | Vaincre un adversaire est une tâche étendue, pas une jauge qui tombe à zéro (Dune) |
| **Ressources suivies** (`statsToTrack`) | Les jauges que Combat-OS montre sur chaque carte |
| **Types de dégâts** (`damageTypes`) | Proposés au calculateur de dégâts |

Le détail est dans [Combat-OS](./30-Combat-OS.md) et
[les cartes de combattant](./31-Combat-OS-cartes-de-combattant.md).

---

## Le reste

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Portées** (`tactical`) | Les bandes de distance de Map-OS, en mètres ou en zones |
| **Butin** (`lootTables`, `vocabulaireDuButin`) | Les tables de butin du jeu et ses mots (monnaie, rareté) — voir [Loot-OS](./42-Butin-ecrire-les-tables.md) |
| **Thème** (`ui_config`) | La couleur et les jauges de l'interface ; la peau complète vient du thème du jeu — voir [Créer un thème](./95-Creer-un-theme-de-jeu.md) |
| **Personnalités de l'IA** (`aiPersonas`, `aiInstructions`) | Ce que l'Oracle et les assistants savent du ton du jeu |
| **Fiche HTML** (`templateId`) | Le gabarit de fiche du jeu — voir [Fiche de personnage HTML](./63-Fiche-de-personnage-HTML.md) |

---

## Tenir ce manuel à jour

Un pilote **nouveau ou amélioré** se reporte ici, dans le même mouvement :

1. **Exporter** le pilote depuis la Forge dans `Export Dirvers/` (jamais commité).
2. **Reprendre la page du jeu** (`54-Jeu-….md`) — ou en créer une, sur le modèle des autres — et
   mettre à jour sa ligne « Pilote décrit ».
3. **Reprendre les captures** : `npm run build`, puis `npx playwright test e2e/capturesDesJeux.spec.ts`.
   Le scénario lit les pilotes exportés, les charge dans une instance jetable avec des campagnes
   fictives, et range les images dans `captures/` (préfixe `jeu-`). Un jeu nouveau s'y ajoute en une ligne
   (`MISES_EN_SCENE`).
4. **Une mécanique nouvelle dans le code** doit avoir sa ligne sur cette page : le test
   `electron/manuelDesJeux.test.ts` échoue tant qu'elle n'y est pas.
