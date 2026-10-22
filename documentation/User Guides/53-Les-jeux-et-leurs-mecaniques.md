# 🎲 Les jeux et leurs mécaniques

Chaque jeu entre dans GM-OS par son **pilote** : le fichier, forgé ou écrit à la main, qui dit
comment on lance les dés, quelles réserves la table partage, comment on encaisse les coups. Le même
écran change donc de visage selon le jeu de la campagne ouverte. Cette page explique **chaque
mécanique une fois**, et dit **où la voir**. Une page par jeu dit ensuite ce que *son* pilote en
fait.

> **Mis à jour le 2026-10-13**, sur les pilotes exportés ce jour-là ; **le 2026-10-14** pour Alien et Blade Runner (forcer le jet, Panique), Star Trek (spécialisation) et Torg (cosms). Un pilote nouveau ou amélioré
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
| 🌑 **Symbaroum** | Un **test** au d20 sous l'un des huit attributs ; **Corruption** temporaire et permanente en jauges ; fiche HTML reliée, douze cadres de talents et pouvoirs | [Symbaroum](./54-Jeu-Symbaroum.md) |
| 🐉 **Rêves de Dragons** | d100 sous un **pourcentage**, degrés ; **Livret du voyageur HTML de cinq pages**, dont l'Archétype, relié au formulaire ; fatigue, blessures, ouvrages, repos et Château Dormant ; **stress/XP/Archétype**, **chance/destinée/moral**, **astrologie privée liée à Clock-OS** ; carte TMR | [Rêves de Dragons](./54-Jeu-Reves-de-Dragons.md) |
| ⚡️ **Torg Eternity** | Un d20 qui **explose**, converti par la **Table des Bonus**, contre un **Niveau de Difficulté** ; **Possibilité**, « Un de plus ! » et relance favorisée après le premier dé ; **Annulation des dommages** | [Torg](./54-Jeu-Torg.md) |
| ✨ **Nephilim Légende** | d100 sous une cible en **degrés × 10** (Vécu ou Art occulte + Ka d'approche), **doubles** critiques ou maladresses et leurs **suites** (Khaïba, Ombre, Sapience), **marge** sur les dizaines ; **Traque** plafonnée au **Seuil RK** du lieu ; **155 Vécus** et **31 époques** reliés à la fiche | [Nephilim](./54-Jeu-Nephilim.md) |

---

## Où regarder

| Écran | Ce qu'on y trouve |
| :--- | :--- |
| **Le bandeau des réserves**, en tête de Session-OS | Les réserves de table (Impulsion, Menace, Fiel…), leurs boutons + / −, et les gestes « Fin de scène », « Début de séance », « Nouveau scénario » — et, si le jeu les déclare, « Moment de calme » et « Effets du … » |
| **L'onglet « Lancer un test »** de la fiche d'un personnage, chez vous (à côté de « Formulaire » et « Fiche du jeu ») et sur la tablette (à côté de « Vue synthétique » et « Ma fiche ») | Le jet du jeu : ce qu'on retient sur la fiche, les dés achetés, ce qu'on puise dans le groupe, le résultat, puis les blocs du jeu |
| **La carte de campagne**, dans le cockpit | Le bouton de la **fiche du groupe** (la Cabale), quand le jeu en a une |
| **La tablette d'un joueur** | Les mêmes réserves et le même jet, et l'onglet du groupe à côté de « Ma fiche » |
| **Combat-OS** | L'ordre du tour, la santé, la défaite — voir [Combat-OS](./30-Combat-OS.md) |
| **Dice-OS** | Le pupitre, et les dés d'usure — voir [Dice-OS](./34-Dice-OS-le-pupitre.md) |

---

## Les modules du jeu (`modulesDuJeu`)

Dans **Bibliothèque des modèles › pilote du jeu › Modules du jeu**, le meneur choisit les outils
proposés pour ce pilote. Le choix s’enregistre automatiquement et accompagne les exports/imports
du pilote et de campagne. Une référence absente du catalogue est signalée au meneur et conservée
à l’export ; elle peut être retirée explicitement.

Les anciens pilotes Alien proposent **MU/TH/UR 6000** et le **Détecteur de mouvement** par défaut.
Tout décocher enregistre une liste vide : la proposition par défaut ne revient pas à la reprise.
Star Trek propose **LCARS — Passerelle**, à sélectionner explicitement dans son pilote.

Rêve de Dragon propose **Terres Médianes du Rêve**, à sélectionner dans son pilote. Sa carte
officielle en couleur et son carnet restent dans le module ; rêve et fatigue se dépensent sur
la fiche après validation du MJ. Voir le [guide Rêves de Dragons](54-Jeu-Reves-de-Dragons.md).
Les autres jeux attendent leurs modules compatibles.

Dans **Cockpit › Modules du jeu**, **Ouvrir le pupitre** prépare l’outil. Pendant une séance,
coche les personnages dans **Accès des personnages** : leur Tablet Hub reçoit la carte du module.
Décocher un personnage lui retire l’accès immédiatement. **Fermer tous les accès et couper les
effets** conserve la préparation et les dialogues. **Tout couper** ferme tous les modules et leurs
effets à la fois, même si le disque est indisponible (l’erreur de sauvegarde reste visible).
MU/TH/UR et le détecteur Alien sont disponibles avec des accès indépendants. Le détecteur permet
un scan partagé entre les PJ choisis, des contacts aléatoires dans la proximité retenue et un faux
écho de neuf secondes. Chaque appareil active localement ses bips. Aucun Stress n’est modifié.
Le MJ peut classer/supprimer les dossiers MU/TH/UR et traiter plusieurs demandes privées par PJ.
Le détecteur propose des préréglages nommés par campagne : les charger arrête le scan, qui se
relance volontairement. Voir le [guide Alien](54-Jeu-Alien.md).

**Alien A8 :** le détecteur propose aussi un mode discret optionnel, avec plan privé de
zones, déplacements par Tour et batterie propre au M314. Un scan par Tour teste l'Énergie
et ne transmet que les zones des mouvements à portée. L'onglet **Actes** de MU/TH/UR garde
les brouillons de dossiers au MJ jusqu'à publication et remet chaque objectif au seul
opérateur, une fois par acte. Les conséquences narratives et l'entrée en combat restent
arbitrées par Maman ; le suivi A7 conserve les gains de Récit.

LCARS propose sept consoles attribuées aux personnages réels de la campagne. Les affectations
se préparent au pupitre ; l’accès au module s’ouvre séparément pendant la séance. Ses 19 actions
arrivent dans une file arbitrée par le MJ, avec réponses privées, partage autorisé, publications
ciblées et ordres avec accusés. Préparation, préréglages et échanges sont sauvegardés par campagne.
Les pièces jointes privées suivent les destinataires du rapport et voyagent dans les sauvegardes.
Les alertes et décomptes suivent le serveur ; un appareil choisi par le MJ diffuse sirène,
voix et son des médias après activation locale. Il doit garder LCARS ouvert. Voir le
[guide Star Trek](54-Jeu-Star-Trek.md).

Chaque joueur reçoit uniquement sa vue autorisée. Sans accès, l’onglet dit **« Aucun module
ouvert par le meneur. »** Changer de campagne, terminer la séance ou redémarrer ferme les accès
et arrête les effets. Les codes, dossiers et dialogues restent sauvegardés ; les sauvegardes
complètes et exports de campagne les emportent, à garder entre meneurs.

---

## Le jet (`jet`)

Le panneau « Lancer un test » lit sur la fiche ce que le jeu demande, et ne lance que quand chaque
choix est fait. *Depuis le 22/10/2026*, il a son propre onglet sur la fiche, et il se lit en étapes
numérotées :

1. **Composer** : les valeurs que l'on retient sur la fiche, puis le calcul — d'où sortent le seuil
   et la réserve. Ce qui manque s'écrit dessous.
2. **Préparer**, seulement si le jeu y a quelque chose : la difficulté, les réserves où puiser, la
   préparation d'Alien, la spécialisation…
3. **Lancer les dés** : les dés achetés, le tirage, et le bouton **Lancer**.
4. **Résultat**, après le lancer : le verdict à droite du titre, les dés — nommés sous chacun quand
   le code sait ce qu'ils sont (Stress, Panique, Écarté, Critique, Complication ; Succès sur une
   réserve sans seuil) —, puis les gestes qui suivent (forcer, dépenser, Fortune, Possibilités…).

Les blocs propres à un jeu suivent, en **cartes repliables** : une carte refermée le reste sur cet
appareil. Un pilote décrit son jet avec une ou plusieurs de ces pièces :

| Pièce | Ce que c'est | Exemple |
| :--- | :--- | :--- |
| **Seuil** (`seuil`) | Des valeurs de la fiche **additionnées** : chaque dé sous le seuil (ou au-dessus, selon le `sens`) réussit | Dune : Compétence + Principe |
| **Réserve** (`reserve`) | Un nombre de dés : une base, plus des valeurs de la fiche, jusqu'à un plafond ; `sansPlafond` conserve les bonus lorsque le système ne fixe aucune limite au jet équipé | Alien : Attribut + Compétence ; NOC : le Domaine |
| **Jets Alien** (`alien`) | Bonus de l'arme reliée à la fiche HTML, outil/talent, situation signée et aide (maximum trois) ; le malus épuise la base puis le Stress. Opposition par annulation des réussites, défenseur sans forçage, actions d'éclat de la compétence avec budget et choix conservés | Alien A2 : préparer le test, résoudre l'opposition, dépenser les excédents ; les conséquences et les dégâts sont validés par Maman |
| **Combat Alien** (`combat.alien`, `jet.alien.combat`) | Tir, protection, soins et Trépas humains ; avaries et réparations synthétiques ; `survie` : réserves, privations, Rads et charge ; `actions` : lente/rapide, réactions, cartes multiples et Santé commune des xénomorphes, attaques et critiques propres, sang acide XX121 ; `progression` : objectifs remis par messagerie privée, Récit Cinéma, neuf questions de PX Campagne, achats, Camarade/Rival et fétiche par période | Alien A3–A7 : Maman valide les circonstances, résultats et temps de jeu ; les échéances et reçus survivent à la fermeture. Les objectifs secrets sont retirés des flux publics |
| **Dés achetés** (`cout`, `ressource`) | Des dés de plus, payés sur une réserve de table, à un prix qui monte | Dune : 1, 2 puis 3 points d'Impulsion |
| **Seconde réserve** (`secondaire`) | Des dés lancés avec les autres mais **comptés à part** : un 1 y déclenche quelque chose | Alien : les dés de Stress, et la **Panique** |
| **Dés échelonnés** (`desEchelonnes`) | **Un dé par valeur**, dont la taille se lit sur la fiche | Blade Runner : A = D12 … D = D6 |
| **Cible en pourcentage** (`cible`) | Un d100 sous un pourcentage que le jeu **calcule** : lu dans la table de résolution (`reves-de-dragons`), ou degrés × 10 avec doubles critiques et marge sur les dizaines (`nephilim`) | Rêves de Dragons, Nephilim |
| **Table des Bonus** (`tableDeBonus`) | Le dé se convertit en **bonus** par la table du jeu, s'ajoute au **niveau** (le seuil additionné) et se compare à la difficulté | Torg : un d20 qui explose sur 10 et 20 |
| **Réglages de Torg** (`torg`) | Le champ des **Blessures** (−1 au total d'action chacune, jusqu'à −3), celui des **Possibilités** (dépensées après le premier dé), et le test de Réalité de l'**Annulation des dommages** | Torg |
| **Provoquer le destin** (`destin`) | Le **niveau** (le seuil : le Talent) contre la difficulté ; on lance de zéro au **plafond** (la réserve : le Domaine) de dés à dix faces, chaque 8 et plus élève le niveau, un 10 fait lancer un dé de plus, **chaque 1 verse une goutte dans la réserve de table** déclarée. Des **jauges de péril** retirent au Domaine et au Talent selon leurs seuils, cumulés | NOC |
| **Réserves du personnage** (`reservesDuPersonnage`) | Ce que le personnage puise dans **ses** réserves, sur **sa** fiche, au moment du jet — même forme que les apports du groupe | NOC : Vécu, Espoir, Singularité · Nephilim : Stase, Effet Mnémos |
| **Forcer le jet** (`forcer`) | Après avoir vu les dés — sur la fiche, ou au **pupitre** et à la **télécommande** pour le dernier jet, qui annoncent le prix au lieu de l'écrire —, le bouton **« Forcer le jet »** relance ceux qui n’ont pas réussi — les 1 restent aussi, si le jeu le dit — et **fait payer** : la seconde réserve monte avant la relance (et gagne son dé), ou chaque 1 coûte un point sur la fiche. Combien de fois, qui ne force jamais, ce qui l’interdit : le bouton grisé **dit pourquoi**. Avec `relancerUneReussite`, des cases désignent les D10 et D12 à **une seule réussite** à relancer aussi, au risque de la perdre | Alien : +1 Stress ; Blade Runner : un point de Santé ou de Sang-froid par 1 |
| **Panique** (`panique`) | Un 1 sur la seconde réserve fait paraître **« Test de Panique »** : un dé, plus la valeur de cette réserve, lu dans la table du jeu. Avec les **suites** françaises d'Alien (`panique.suites`), le résultat de compétence reste provisoire, une Panique 10+ annule l'action malgré les six et le Point de Récit. Les effets, demandes, contagions choisies par Maman et rappels de traumatisme se conservent sur la fiche. Le cumul français monte d'un cran pour un résultat **inférieur** ; une égalité garde son effet | Alien : 1D6 + Niveau de Stress ; panneau **Stress et Panique** |
| **Brisé** (`brise`) | Quand forcer met un champ à zéro (Santé, Sang-froid), le panneau dit l'état ; s'il a un effet critique, **« Lancer l'effet critique »** jette le dé de la fiche (l'Empathie), lu dans la table du jeu ; sur un 1, le maximum perd un point **à vie**. Le même geste paraît **sur la carte de combat** quand ce champ tombe à zéro sous le stress, hors forçage ; l'effet tiré peut s'écrire sur la fiche (`noterDans`) | Blade Runner : Brisé par les dégâts, Brisé par le stress |
| **Stress subi** (`stressSubi`) | Un geste **« Encaisser »**, au meneur, sur la carte de combat et sous le panneau de jet : il choisit le **facteur** (1 à 3), le bouton lance les dés de la fiche nommés (l'Empathie et la Psychologie), **chaque réussite retire un point**, le reste se retire du champ (le Sang-froid). À zéro, Brisé par le stress | Blade Runner |
| **Fortune** (`fortune`) | Sous un jet **raté**, le joueur **place** des jetons sur sa fiche : un pour **relancer**, deux pour **réussir**, jamais plus que le maximum. Au panneau de jet, et au **pupitre** sur un jet venu d'une fiche (Sauvegarde, ressource — le dé perdu revient avant la relance). Le meneur défausse les jetons à la main | Cthulhu Hack : 2 jetons au plus |
| **Réussite dépensée** (`reussiteDepensee`) | Après le lancer, un bouton dépense **un point de la fiche** pour ajouter **un dé réussi** au jet | Alien : le Point de Récit donne un 6 |
| **Suites des critiques** (`suitesDesCritiques`) | Sur une **maladresse** ou un **critique**, selon ce qui a été lancé (section ou champ de la fiche), une carte rappelle la règle et propose **un bouton** qui ajoute un degré à une jauge de la fiche — ou au champ retenu au jet — ; jamais écrit sans le meneur | Nephilim : +1 Khaïba (Art occulte), +1 Ombre (Vécu contemporain), +1 Sapience (critique en Science occulte), −1 au Ka du construct |
| **Composante facultative** (`facultative`) | Un choix qu'on peut laisser vide sans bloquer le jet | Torg : la compétence, absente d'un test non entraîné |
| **Composante retirée** (`soustraire`, `motif`) | La valeur retenue se **retire** de la cible au lieu de s'y ajouter ; `motif` ne propose que les champs dont l'identifiant y répond | Nephilim : le degré d'une formule d'Alchimie, et seulement lui |
| **Consommation** (`consommation`) | Au lancer, le jet **retire seul** de la fiche ce qu'il consomme — la quantité lue sur une composante, dans la jauge de l'élément lu sur la même ligne —, sauf sur un critique | Nephilim : les Materiae Primae d'une transmutation |
| **Critique, complication** (`critique`, `complication`) | Les faces qui comptent double, ou qui compliquent | 2d20 : 1 et 20 |
| **Spécialisation** (`specialisation`) | Une case au jet : cochée, **chaque dé inférieur ou égal** à la composante nommée (la Fonction) compte double, comme le critique. C’est le joueur qui sait si la tâche entre dans une de ses spécialisations | Star Trek : le Focus de l’édition anglaise |
| **Difficulté** (`difficulte`) | Le nombre de réussites à atteindre, réglable avant de lancer. **Jamais sur un jet d'un seul dé** : à 0 tout réussirait, à 2 tout échouerait — la revue de la Forge le refuse | Dune : de 0 à 5 |
| **Modificateur du seuil** (`modificateurDuSeuil`) | Sur un seuil qu'on jette **dessous**, à l'étape « Préparer » : un curseur **Modificateur** qui s'ajoute au seuil, et avec `opposition` une case pour la **valeur adverse**, retirée de la référence. Les deux s'additionnent, et le calcul se lit sous « Seuil » ; le journal les redit avec le jet | Symbaroum : de −5 à +5, et 10 moins l'Attribut adverse — `12 + (10 − 13) = 9` |
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
| **Plafond lu sur une autre réserve** (`maxSur`) | Le plafond est la valeur courante d'une autre réserve de table : la Jauge de Traque de Nephilim plafonne au **Seuil RK** du lieu, que le meneur règle au bandeau en changeant de lieu |
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
- **Sur une tablette :** un onglet au nom du groupe, à côté de « Ma fiche ». Ce que le joueur y
  écrit remonte chez vous.
- **Son nom** est celui qu'on écrit dans le champ « Nom » de sa feuille.

### Puiser dans le groupe au jet (`apports`)

Un pilote peut dire ce que le groupe **apporte aux jets** des personnages. Le panneau « Lancer un
test » montre alors une section **« Puiser dans la … »**, une ligne par apport :

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Effet** (`effet`) | Des **dés** de plus dans la réserve, un **bonus** ajouté au résultat, des **1 annulés** après le lancer (`annuleLesUns` : seuls ceux qui servent se dépensent), ou des **degrés** ajoutés à la cible avant le ×10 (`degres` : la Stase et l'Effet Mnémos de Nephilim, dépensés quel que soit le résultat) |
| **Par point** (`parPoint`) | Ce que rapporte un point : trois dés pour un point d'Espoir de la Cabale |
| **Épuisement** (`epuisement`) | `piste` : la piste de la feuille du groupe descend (l'Espoir). `scenario` : une réserve rechargée par **« Nouveau scénario »** (les dés d'un Domaine) |
| **Stocks** (`stocks`) | Où se lit chaque stock sur la feuille du groupe |
| **Composante** (`composante`) | Le stock suit ce que le personnage a retenu : le Domaine du Héros choisit le Domaine de la Cabale |
| **Par jet** (`maxParJet`) | Combien de points au plus sur un même jet — un seul point d'Atout ou de Vécu chez NOC |
| **Seulement pour** (`si`) | La réserve ne se propose que si le champ retenu au jet vient de ces sections, ou est l'un de ces champs : la Stase de Nephilim au lancer d'un sort de Magie, l'Effet Mnémos à un test de Vécu |
| **Stock libéré** (`horsPlafondSi`, sur un stock) | Ce stock échappe à la limite par jet quand le personnage retient un champ précis : l'**Atout Capital** de NOC se dépense sans limite, mais seulement sur le Talent **Fortune** |

Rien ne se dépense avant **Lancer**, et l'on ne peut pas engager plus qu'il ne reste. Un bonus se
dit à côté des réussites (« 3 réussites (dont +1 Cabale) »).

**La recharge du groupe** (`nouveauScenario`, sur la fiche du groupe) : ce que sa feuille regagne à
**« Nouveau scénario »**, avec les mêmes mouvements que ceux des Héros — chez NOC, l'Espoir revient
au niveau de l'Atout Credo, le Vécu aux Légendes, la Singularité à l'Observatoire. La confirmation
du scénario le nomme.

---

## Les gestes sur chaque Héros (`gestesDesHeros`)

Certains gestes de table **écrivent sur la fiche de chaque Héros** de la campagne d'un seul clic.
Le bandeau des réserves les propose au meneur ; les deux plus lourds ouvrent d'abord un **aperçu,
Héros par Héros** (« Trauma 3 → 6 (+3, folie 1) »), puis **« Appliquer »**. Seules les fiches qui
changent sont écrites.

| Geste | Ce qu'il fait | Exemple |
| :--- | :--- | :--- |
| **Moment de calme** (`momentDeCalme`) | Un bouton au bandeau. Des réserves de table bougent, chaque Héros récupère dans l'ordre déclaré, des cases se décochent (`leve`). Une **récupération amputée** (`amputation`) se dit sans s'appliquer : le joueur choisit où la reprendre | NOC : −1 Fiel, Espoir +1 + Extase, −1 à chaque jauge de péril, Fatigué prend fin ; le Soupçon dit les 2, 4 ou 6 points à reprendre |
| **Début de séance**, **Nouveau scénario** (`debutDeSeance`, `nouveauScenario`) | Les boutons existants rendent aussi quelque chose à chaque fiche ; la confirmation du scénario le nomme | NOC : Vécu +1 par séance, plein à chaque scénario |
| **Effets du débordement** (`effetsDuDebordement`) | Un bouton « Effets du … » au bandeau. Quand la réserve déborde, la Loi choisit **autant d'effets que vaut l'autre réserve** (la Menace), le même plusieurs fois si elle veut ; le compte est rappelé, pas imposé | NOC : Bouleversement administratif, Intervention de l'Artefact, Tension, Traque, Fatigue |

Ce qu'un mouvement sait dire (`MouvementDeFiche`) : un gain ou une perte, un champ **ajouté**
(l'Extase), un Talent de **résistance** qui réduit (la Folie contre la Tension — à −1 il
aggrave), un **plafond** fixe ou lu sur la fiche (l'Espoir : 2 × Ferveur + 3, au plus 10), un
**plancher** de séquelles, et la case qui se **coche** quand la réserve est déjà vide (l'Espoir à
zéro → Fatigué). **Un même effet choisi deux fois cumule ses pertes avant la résistance** : deux
Tensions avec Folie 1 donnent 4 − 1 = 3 points de Trauma.

Une case cochée compte comme **un point de jauge de péril** : Fatigué (−1 aux Talents) se déclare
comme une jauge à un seuil. Un seuil peut ne valoir **que pour un champ retenu** (`seulementSi`) :
le Bouleversement retire 1 aux Talents, mais seulement sur un jet du Domaine Statut.

**Le jet d'un Rouage, au pupitre.** Le pupitre ne sait pas qui lance. Après un jet de d10 qui
fait des 1, sur un jeu qui verse du Fiel, deux boutons demandent **« Un Héros »** (les gouttes
entrent dans le Fiel) ou **« Un Rouage hostile »** (elles en sortent ; Fiel déjà vide : un Héros
désigné par la Loi gagne la Singularité qui reste). Une seule fois par jet.

---

## Les Cartes du Destin (`cartesDuDestin`)

Une **main de cartes** par personnage, tirée d'un paquet de Deck-OS marqué **Rôle : Paquet du
Destin**. Le pilote en dit la **taille** (`taille` : 4 chez Torg). Dans le lecteur de Deck-OS, trois
gestes : **Fin du combat** (la Réserve revient en main), **Fin de scène** (chacun complète sa main ;
qui en a trop doit défausser, GM-OS ne choisit pas pour lui) et **Fin d'Acte** (nouvelles mains).
Une carte peut être **posée en Réserve d'Action** — publique, toute la table la voit — et le
**Moment critique** pose toute la main en Réserve, une fois par Acte ; les deux se font aussi depuis
la tablette du joueur. Sur la carte de combat d'un héros, **l'Action approuvée** de la carte du
round lui fait piocher une carte. Pour les **Atouts** qui touchent aux cartes, deux gestes sous ceux
du paquet : **piocher une à trois cartes et en garder une**, les autres défaussées, et **chercher une
carte** dans la défausse ou la pioche, en vignettes. Voir [Torg](./54-Jeu-Torg.md).

---

## Les cosms et leurs Lois (`cosms`)

Un jeu dont la réalité change selon le lieu (Torg) déclare ses **cosms**, chacun avec ses **Lois du
Monde** : un nom et ce qu'elle dit. Le cosm se choisit **sur la scène** (Trame, champ « Cosm »),
avec un défaut sur la **campagne** (cockpit) ; deux cosms font une **zone mixte**, où les Lois des
deux s'appliquent. Les Lois s'affichent en rappel sur l'écran de la scène et dans Combat-OS ; celles
qui nomment une `mecanique` sont prises en charge par GM-OS (marque **GM-OS**) :

| Mécanique | Ce que fait GM-OS |
| :--- | :--- |
| `heroisme` | La main de Cartes du Destin compte **une carte de plus** |
| `action` | Après une Possibilité, **une seconde** : la meilleure des deux compte |
| `perseverance` | L'Annulation des dommages **annule moins** (Simple : le Choc seul ; Supérieur : une Blessure) |
| `magie` | Au jet d'une compétence magique (`competences`), du **Choc volontaire** donne +1 par point, jusqu'aux rangs, et s'écrit sur la fiche |
| `tenacite` | **Annoncée** quand le Choc met KO : on peut encaisser une Blessure pour l'effacer |
| `souffrance` | **Annoncée** quand une Blessure tombe : l'attaquant récupère un point de Choc |

La tablette reçoit le cosm courant du meneur.

**Les Cartes de Cosm** : un paquet par cosm, marqué **Rôle : Paquet de Cosm** dans la bibliothèque
de Deck-OS, puis rattaché à son cosm. Dans le lecteur d'un tel paquet, **Début d'Acte** (chacun
défausse sa carte non jouée, le paquet du cosm courant est remélangé, une carte chacun) et
**Changement de cosm** (la carte d'un cosm quitté s'échange, sauf pour qui a déjà joué la sienne
cet Acte). La carte tient à part de la main du Destin et se joue depuis la tablette. Voir
[Torg](./54-Jeu-Torg.md).

---

## Les dés d'usure (`desDUsure`)

Une ressource qui **est un dé** : on la lance quand on la sollicite, et un 1 ou un 2 la fait
descendre d'un cran (d20 → d12 → d10 → … → d4 → épuisée). Le dé courant s'écrit **sur la fiche** (« d8 ») ; le
pupitre le lit, le lance et y réécrit le dé qu'il devient. Sans déclaration, GM-OS reconnaît les
ressources suivies en combat dont le champ contient un dé. Voir [Cthulhu Hack](./54-Jeu-Cthulhu-Hack.md).

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Plafond** (`plafond`) | Le plus gros dé que la ressource atteint : d12, ou d20 pour le Matériel |
| **Nom sur la fiche** (`nomSur`) | Un **emplacement** dont le nom s'écrit sur la fiche (« Lampe-torche ») : c'est le Matériel. Vide, il ne se propose pas |
| **Suite du déclin** (`auDeclin`) | Quand la ressource descend, le **pupitre** propose un bouton par table — la **Folie passagère** ou le **Choc** de la Santé mentale — tirée dans Table-OS et écrite à l'historique |

---

## L'ordre du tour, la santé, la défaite (`combat`)

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Initiative par formule** (`initiativeFormula`, `initiativeSort`) | Une valeur de la fiche ou un jet, triés dans un sens ou dans l'autre |
| **Cartes d'initiative** (`initiativeCards`) | Un paquet de cartes numérotées, une par combattant (Alien, Blade Runner) |
| **Ordre alterné** (`initiative`) | Pas d'initiative individuelle : le tour **alterne** entre les camps, garder la main ou l'ouvrir coûte une réserve (Dune) |
| **Limites de Blessures** (`limitesDeBlessures`) | Sur la santé d'un **adversaire**, un choix « Type… » : combien de Blessures il encaisse avant d'être vaincu (sbire, aguerri…). Les cases du jeu se recoupent (Torg) |
| **Paquet d'Action** (`initiative` en mode `paquet`) | Chaque round, une **carte d'Action** dit quel camp commence ; il joue tous ses tours, puis l'autre. La carte porte aussi une Ligne de Conflit (avantages, désavantages) et des Actions approuvées. Le paquet se marque **« Paquet d'Action »** dans Deck-OS (**Rôle**), et chaque carte s'y décrit une fois (Torg) |
| **Modèle de santé** (`defaultHealthType`) | Points de vie, horloges, anatomie, blessures ou cases — la carte du combattant change d'aspect |
| **Santé de départ** (`santeDeDepart`) | Le maximum se lit sur la fiche (Alien : la Force) |
| **Cases de santé** (`casesDeSante`) | Pour le modèle « cases » : leur **nombre**, leurs **seuils** nommés (« Choqué » à 5) et l'état que chacun déclenche, le **libellé** de la jauge, et le **champ** de la fiche qui la suit (NOC : dix cases Blessures). Sans elles, cinq cases (Léger, Grave, Critique) |
| **Hors Jeu** (`horsJeu`) | À zéro de santé, un panneau sur la carte du combattant. Cthulhu Hack : **« Tirer les conséquences »** dans la table du jeu (Table-OS), puis **« S'il survit : récupérer 1d4 PV »**, qui passe par la santé comme un soin — vous choisissez le moment, la règle dit « une fois le danger écarté ». Blade Runner (**Brisé par les dégâts**) : le **rappel** de l'état, des **tables au choix** (Percutant, Perforant), le **dé au choix** (le dé de critique de l'arme, D6 à D12), chaque blessure **notée sur la fiche**, et **répétable** — chaque nouveau coup à zéro en est une autre, adversaires compris |
| **Protection** (`protection`) | Un bouton sur la carte : **deux dés du niveau** écrit sur la fiche (A à D), chaque réussite retire un point de dégâts, des dégâts ramenés à zéro annulent la blessure critique. Vous saisissez ensuite les dégâts restants. Jamais contre les dégâts d'un forçage (Blade Runner) |
| **Tâche de défaite** (`tacheDeDefaite`) | Vaincre un adversaire est une tâche étendue, pas une jauge qui tombe à zéro (Dune) |
| **Ressources suivies** (`statsToTrack`) | Les jauges que Combat-OS montre sur chaque carte ; leur **maximum** peut se lire sur la fiche par une formule (`max` : le Choc de Torg plafonne à l'Esprit). Chaque jauge a ses boutons **−** et **+** ; la règle peut y ajouter ses **gestes** (`gestes` : « Récupérer −2 », « Reprendre son souffle » qui remet à 0) |
| **Dommages selon la règle** (`dommages`) | La valeur saisie dans « Dégâts » devient un **total de dommages** : GM-OS lit la Résistance de la cible et applique la table du jeu — Blessures cochées, Choc ajouté et plafonné, KO annoncé (Torg) |
| **Types de dégâts** (`damageTypes`) | Proposés au calculateur de dégâts |

Le détail est dans [Combat-OS](./30-Combat-OS.md) et
[les cartes de combattant](./31-Combat-OS-cartes-de-combattant.md).

---

## Le reste

| Réglage | Ce qu'il change |
| :--- | :--- |
| **Portées** (`tactical`) | Les bandes de distance de Map-OS, en mètres ou en zones |
| **Butin** (`lootTables`, `vocabulaireDuButin`) | Les tables de butin du jeu et ses mots (monnaie, rareté) — voir [Loot-OS](./42-Butin-ecrire-les-tables.md) |
| **Identité visuelle** (`identiteVisuelle`) | Le style des **images générées** pour ce jeu (médium, palette, lumière, à éviter), en anglais, **ajouté d'office** à chaque génération. Une campagne le complète ou le remplace. Se règle par « Identité visuelle… » dans l'éditeur du pilote et sur la carte de la campagne ; la fenêtre d'invite le montre et peut le suspendre. **Une à quatre images d'exemple** (réduites à 512 pixels) : « Proposer depuis ces images » en fait rédiger le style par un modèle de vision de Cloudflare (Llama 3.2 Vision, licence de Meta à accepter une fois), et un modèle **FLUX.2** (Réglages IA → Génération d'image) les reçoit avec chaque image comme guide de style. Pour en discuter : le GPT `outils/rpg-visual-identity-builder/` |
| **Thème** (`ui_config`) | La couleur et les jauges de l'interface ; la peau complète vient du thème du jeu — voir [Créer un thème](./95-Creer-un-theme-de-jeu.md) |
| **Personnalités de l'IA** (`aiPersonas`, `aiInstructions`) | Ce que l'Oracle et les assistants savent du ton du jeu |
| **Fiche HTML** (`templateId`) | Le gabarit de fiche du jeu — voir [Fiche de personnage HTML](./63-Fiche-de-personnage-HTML.md) |

---

## Tenir ce manuel à jour

Un pilote **nouveau ou amélioré** se reporte ici, dans le même mouvement :

1. **Exporter** le pilote depuis la Forge dans `Export Dirvers/` (hors commit, sauf demande
   explicite du meneur ; David demande le 19/10 de versionner les exports locaux déjà présents).
2. **Reprendre la page du jeu** (`54-Jeu-….md`) — ou en créer une, sur le modèle des autres — et
   mettre à jour sa ligne « Pilote décrit ».
3. **Reprendre les captures** : `npm run build`, puis `npx playwright test e2e/capturesDesJeux.spec.ts`.
   Le scénario lit les pilotes exportés, les charge dans une instance jetable avec des campagnes
   fictives, et range les images dans `captures/` (préfixe `jeu-`). Un jeu nouveau s'y ajoute en une ligne
   (`MISES_EN_SCENE`).
4. **Une mécanique nouvelle dans le code** doit avoir sa ligne sur cette page : le test
   `electron/manuelDesJeux.test.ts` échoue tant qu'elle n'y est pas.

*Relu le 2026-10-15 : les deux modules Alien, leurs accès indépendants et la coupure générale,
puis six parcours sur le vrai transport Electron/Edge du PC. Appareils physiques à éprouver.*

*Relu le 2026-10-16 : dossiers, file de demandes privées et préréglages nommés Alien.*

*Complément LCARS : sept consoles, 19 actions arbitrées, médias privés et diffuseur unique ;
recette automatique à six formats, appareils physiques encore à essayer.*

*Relu le 2026-10-19 : livret HTML RdD relié au pilote étendu, page Archétype et module TMR ;
les niveaux du livret restent distincts du potentiel déclaré au carnet R5.*

*Complété le 2026-10-22 : Alien A3–A7, tir, protection, critiques, soins, avaries,
survie ; actions, xénomorphes et acide ; objectifs privés, Récit, PX et apprentissage,
avec validation des circonstances, résultats et temps de jeu par Maman.*
