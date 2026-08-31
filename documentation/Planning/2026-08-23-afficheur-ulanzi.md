# L'afficheur Ulanzi — quatre widgets, pas une bibliothèque par jeu

**Nature de ce document : référence vivante de conception.** Il dit ce qu'on a décidé et *pourquoi*.

> ✅ **Le premier widget EST CODÉ, le 2026-08-23** — le défilé des quarts, poussé depuis le cockpit.
> `tsc -b` propre, **2 286 tests au vert**, l'appareil rendu à sa routine après essai. Voir § 13.
> Le reste du document décrit ce qui n'est pas encore construit.

**Matériel :** Ulanzi TC001 flashé sous **AWTRIX 3**, acquis le 2026-08-21. Matrice **32 × 8 pixels** RVB,
ESP32, trois boutons, buzzer, capteur de luminosité, API HTTP et MQTT.
**Documents liés :** `2026-08-07-acceleration-ia.md` (la plomberie réseau existe déjà) ·
`2026-08-19-reconciliation-plans-aout.md` § 5 (où ce chantier attend une décision).

---

## 1. La contrainte qui décide de tout

**32 × 8, soit environ cinq caractères lisibles en statique.** Au-delà, ça défile — et **un texte qui
défile n'est pas consultable d'un coup d'œil**, ce qui annule la seule chose que cet objet sache faire.

> **Des nombres, des barres, des couleurs, des icônes. Jamais de phrases.**
> Ce qui a besoin d'une phrase a déjà un écran.

**Et ce que l'objet est, qu'aucun autre écran de la table n'est :**

- **Public par construction** — tout ce qui s'y affiche est montrable. C'est un canal de *divulgation*,
  pas d'information, là où le cockpit garde ses secrets.
- **Ambiant** — on ne le regarde pas, on *remarque qu'il a changé*.
- **Permanent** — il est là même quand personne ne l'interroge.

---

## 2. Vingt idées qui sont quatre widgets

**Le tri décisif, fait le 2026-08-23.** La question n'est pas « quel jeu ? » mais « quelle forme ? ».
Toutes les idées rassemblées — 2D20, NOC, Blade Runner, Cthulhu, Nephilim, Rêve de Dragon, W40K,
Star Wars — tombent dans quatre cases et **aucune n'en déborde**.

| Widget | Ce qu'il montre | Exemples |
|---|---|---|
| **La jauge** | une valeur bornée, en barre | SAN, progression d'un piratage, Voight-Kampff, boucliers avant/arrière, fatigue, jauge de Soupçon (NOC), Momentum et Menace (2D20), fiel et menace |
| **Le compte à rebours** | un temps ou des segments qui s'épuisent | Tension Clock, « LOCKDOWN 30s », l'air et l'autodestruction d'Alien |
| **Le rang** | qui joue, et qui suit | initiative |
| **L'icône d'état** | un symbole 8 × 8 qui change de sens ou de couleur | heure draconique, météo, plexus et Champs Magiques (Nephilim), couleur de scène |

### Pourquoi la distinction n'est pas cosmétique

**Une bibliothèque de fonctions par jeu, c'est N implémentations à maintenir et N écrivains vers 256
pixels.** C'est le piège nommé dès le 21/08 : si combat, trame, dés et Forge poussent chacun leurs
pixels, l'afficheur clignote au hasard. *Ici le motif habituel du projet ne produit pas un silence, il
produit du bruit* — ce qui est pire, parce que ça se voit et qu'on ne sait pas d'où ça vient.

**Quatre widgets et une table de correspondances**, c'est un seul arbitre, et ajouter un jeu coûte trois
lignes de déclaration au lieu d'un module.

---

## 3. La correspondance existe déjà — ne pas la réécrire

**C'est le point le plus important du document.**

Le **pilote** déclare déjà ce qu'un jeu suit : les jauges de NOC, le Momentum et la Menace de 2D20, les
ressources individuelles. Si l'Ulanzi se construit sa propre table par jeu, elle devient **le sixième
champ qui redouble une vérité déjà écrite ailleurs**.

> On connaît la fin : le 2026-08-22 a coûté une soirée entière à réparer **cinq champs qui auraient dû
> passer par `resoudreCorpus` et n'y passaient pas**. Voir `2026-08-22-etat-et-reprise.md`, § 2.7.

**L'Ulanzi n'a pas à savoir ce qu'est le Soupçon.** Elle doit savoir afficher *une jauge nommée* ; c'est
au pilote de dire lesquelles méritent les pixels.

---

## 4. Deux natures de jauge, et elles n'ont pas les mêmes exigences

**Distinction relevée le 2026-08-23, à partir d'une idée de David** — *« une jauge verte qui se vide
silencieusement au fil des découvertes macabres, sans que les joueurs sachent exactement pourquoi »*.

| | **Le miroir** | **L'instrument** |
|---|---|---|
| Exemples | SAN réelle, boucliers, Momentum | Voight-Kampff, la jauge qui se vide sans raison |
| Source | le moteur de jeu | le meneur, à la main |
| S'il ment | **c'est un bug** | **c'est le but** |

Le second n'est pas de l'information, c'est de la **désorientation** : il retourne la propriété ambiante
de l'objet contre les joueurs. Il exige donc une poussée manuelle **qu'aucun module ne puisse
contredire** — sans quoi le moteur « corrigerait » une valeur qui n'a jamais eu vocation à être juste.

---

## 5. Ce que 32 × 8 refuse, et ce que le refus apprend

- **« TOUR : Kaelen » ne marchera pas.** Ça défile. Mais l'idée est bonne et c'est la *forme* qui est
  mauvaise : **32 pixels de large, ce sont dix combattants en points** — l'actuel en clair, les morts
  éteints. Ça se lit en un dixième de seconde et ça en dit plus qu'un nom.
- **Deux barres superposées passent très bien** — 8 lignes de haut, deux barres de trois pixels et un
  interstice. C'est le meilleur usage de la hauteur qu'on ait trouvé : boucliers avant/arrière d'un
  vaisseau.
- **Icône + jauge + horloge en même temps : impossible.** Une chose à la fois, et c'est précisément
  pourquoi l'arbitre existe.

---

## 6. Le pad MIDI n'est pas une fonction de l'afficheur

L'idée : *un pad d'un Akai MPK Mini déclenche une sirène, passe les Hue et Govee en rouge clignotant, et
affiche « LOCKDOWN — 30s » sur l'Ulanzi.*

**C'est une scène, pas une fonction Ulanzi.** Un déclencheur (le pad) qui éclate vers plusieurs sorties
(son, lumières, afficheur). Construite comme « une fonction de l'Ulanzi », elle **soude trois
sous-systèmes** et on ne pourra plus les séparer. Construite comme une scène dont l'Ulanzi est **un
abonné parmi d'autres**, le module lumières — qui existe et émet au journal depuis le 2026-08-22 —
devient son pair et non son client.

*Le pad est une entrée, les lumières et l'afficheur sont des sorties. Le seam est là, pas ailleurs.*

---

## 7. L'arbitre des 256 pixels

**Un seul décide.** Les modules déclarent une **prétention** avec priorité ; l'arbitre tranche.

| Priorité | Prétention |
|---|---|
| 1 | **Le coup d'éclat** — critique, souffle de dragon, mort d'un PJ (l'événement existe et est déjà émis). *À doser : un afficheur qui crie tout le temps finit sous un livre.* |
| 2 | **Le compte à rebours** |
| 3 | **Le rang / tour en cours** |
| 4 | **La jauge** |
| 5 | **La couleur de scène, l'heure** |

**Et la règle du journal d'Ollama s'applique telle quelle :** *un afficheur absent, éteint ou hors réseau
ne doit jamais emporter ce qu'il décrivait.* Le compte à rebours vit dans l'application ; l'Ulanzi n'en
est qu'un reflet.

---

## 8. Les usages, classés du plus solide au plus décoratif

*Classement du 2026-08-21, inchangé — et la liste du 23/08 l'a renforcé au lieu de le bousculer.*

1. **Le compte à rebours.** Le meilleur candidat de loin, et **le seul qui change la façon de JOUER**
   plutôt que de s'informer. Barre + nombre : exactement ce que 32 × 8 rend bien. Alien en vit.
2. **Le tour en cours** + les **trois boutons physiques** comme télécommande d'initiative.
   ⚠️ *À vérifier avant de compter dessus : les appuis ne remontent probablement que par MQTT, ce qui
   imposerait un courtier.*
3. **L'heure draconique de Rêves de Dragons.** L'objet **est** une horloge, et RdD compte en douze heures
   draconiques avec leurs signes. **Le seul usage que ce matériel-là rend unique.** Douze icônes 8 × 8 à
   dessiner.
4. **La couleur de la scène.** Pas de l'information, une ambiance ; trivial, la scène ouverte est déjà
   connue de `PanneauDeTrameEnCours`.
5. **Le coup d'éclat.** Voir la mise en garde du § 7.

---

## 9. Le point de départ — et la prochaine partie est du **Blade Runner**

**Correction du 2026-08-23.** Le document visait « la prochaine séance d'Alien ». David : *« en réalité
ma prochaine partie sera du Blade Runner »*. Le changement n'affaiblit pas le plan — **il le renforce**,
parce que Blade Runner donne au compte à rebours un **sujet natif** que le jeu impose déjà à la table.

> **Le compte à rebours seul — sans arbitre, sans boutons — posé sur la table à la prochaine séance de
> Blade Runner, et il affiche LE QUART.**

### Pourquoi le Quart est le meilleur premier widget qu'on pouvait espérer

Tout ce qui suit vient du corpus vérifié — `docs/systems/blade-runner/rules/` :

- **Le Quart est l'unité de temps de l'enquête.** Une journée en compte quatre — matin, journée, soirée,
  nuit — chacun de 5 à 10 heures. Un personnage visite **un seul lieu par Quart**
  (`structure-temporelle-par-quarts-et-pauses.md`).
- **Il y a un seuil, et il est dur : trois.** Au-delà de **3 Quarts d'affilée** sans pause, le
  personnage subit **1 point de stress par Quart supplémentaire**. *(Exception : la spécialité « Bourreau
  de travail » repousse à 4.)*
- **Les joueurs le notent déjà à la main**, sur leur fiche d'Agenda.

Un nombre, un seuil, et une comptabilité que la table tient déjà au crayon. C'est **exactement** ce que
32 × 8 sait dire, et c'est la meilleure épreuve possible : si l'afficheur prend, il ne fait pas
qu'informer — **il retire du travail à la table**. Un timer abstrait n'aurait jamais pu prouver ça.

### Et c'est la seule de ces jauges qui appartienne à la TABLE

Contrainte relevée en préparant ce test, et elle tranche à elle seule :

| Jauge de Blade Runner | À qui elle appartient | Tient sur 32 × 8 ? |
| --- | --- | --- |
| **Le Quart** (et le compte de Quarts consécutifs) | **la table** | **oui** |
| Santé, Sang-froid, Stress | chaque personnage | non — quatre joueurs, un seul afficheur |
| Promotion, chinyen, Humanité | chaque personnage, **et hors séance** | non — attribués en fin de session |

**Les 256 pixels n'ont de place que pour une chose partagée.** Le Quart est la seule qui le soit. Les
jauges individuelles demanderaient de choisir *quel* personnage afficher — une question que le premier
test n'a pas à trancher, et qu'il ne doit surtout pas se voir imposer.

### Les deux natures se remplissent toutes seules en Blade Runner

Le § 4 opposait le **miroir** et l'**instrument**. Blade Runner fournit les deux, sans qu'on ait à les
inventer :

- **Miroir** — le Quart en cours et le compte de Quarts consécutifs. S'il ment, c'est un bug.
- **Instrument** — **le test de référentiel**. L'idée de David, *« une jauge verte qui se vide
  silencieusement au fil des découvertes macabres, sans que les joueurs sachent exactement pourquoi »*,
  **est le référentiel**, littéralement. Le corpus le décrit comme une mesure que le réplicant doit
  reproduire « avec une précision millimétrée », dont la dégradation ne lui est pas montrée, et qui se
  déclenche notamment quand il est **Brisé par le stress** ou tombe à zéro de Promotion
  (`le-test-de-referentiel-post.md`). S'il ment, **c'est le but.**

C'est plus qu'une coïncidence heureuse : **Blade Runner est le jeu où l'exemple fondateur du § 4 est
natif.** Il valait mieux qu'Alien pour ce test, et on ne l'avait pas vu.

### Ce qui ne change pas

**Une soirée au lieu d'une semaine, et une réponse que la lecture du code ne donne pas.** C'est la
discipline du reste du projet : *les défauts se trouvent en jouant.* Aucun des trente-huit commits du
22/08 n'a été trouvé à la lecture.

Le compte à rebours reste le seul widget qui apparaît dans presque tous les exemples, tous jeux
confondus. **S'il ne prend pas à la table, les dix-neuf autres ne prendront pas non plus.** Et la
bibliothèque se dessinera seule ensuite : on saura quelle jauge on a *voulu* pousser en jouant, ce
qu'aucune conception ne peut deviner.

### ⚠️ Un doublon trouvé dans le corpus Blade Runner, en préparant ce test

Deux fiches traitent **du même sujet** :

| Fiche | Gabarit | Sources |
| --- | --- | --- |
| `gestion-quarts-pauses.md` | **v1**, `a_regenerer: true` | **« non capturées »** |
| `structure-temporelle-par-quarts-et-pauses.md` | **v3** | `BRN-01_LivreDeRegles.pdf`, 8 sections citées |

C'est le motif corrigé sur Rêves de Dragons le 2026-08-21 — des fiches v1 sans sources qui coexistent
avec leurs v3. **L'Oracle peut répondre depuis celle qui ne cite rien.** À reforger avant la séance si
on veut poser des questions de règle sur les Quarts ; sans rapport avec l'afficheur, mais trouvé en
chemin et à ne pas reperdre.

---

## 10. Ce qui reste à trancher

1. ✅ **TRANCHÉ le 2026-08-23 — le compte à rebours à la prochaine séance de Blade Runner : OUI.**
   David : *« oui, le défilé des quarts »*. Le chantier est **débloqué** ; la spécification du widget
   est au § 11.
2. **Les boutons remontent-ils autrement que par MQTT ?** Toute l'idée de télécommande d'initiative en
   dépend, et un courtier est un service de plus à faire vivre. *Sans objet pour le premier test, qui
   se fait sans boutons.*
3. **La jauge « instrument » se pousse depuis quel écran ?** Le cockpit, le pupitre, un pad ? Elle n'a
   pas de module d'origine, puisqu'elle ne reflète rien. **Devenu urgent** — voir § 11 : le défilé des
   quarts *est* un instrument, et il lui faut donc une main.

*Plomberie déjà en place, et c'est ce qui rend le chantier court : `SyncServer`, `PairingManager`,
`netTrust` et `net.fetch` depuis le processus principal.*

---

## 11. Le défilé des quarts — la spécification du premier widget

**Décidé le 2026-08-23.** C'est le seul widget à construire pour la séance de Blade Runner.

### L'appareil, trouvé sur le réseau le 2026-08-23

Détecté sans que David ait eu à donner l'adresse, en sondant `/api/stats` sur le `/24` :

| | |
| --- | --- |
| **Nom mDNS** | **`awtrix_73f7a4.local`** — *à préférer à l'IP* |
| IP au 23/08 | `192.168.0.138` (DHCP, donc volatile) |
| MAC | `14-08-08-73-f7-a4` — ses six derniers hex **sont** l'uid |
| Firmware | AWTRIX **0.98**, `matrix: true` |
| État | batterie 100 %, capteurs température et humidité présents |

`Resolve-DnsName` ne fait pas de mDNS ; le résolveur de Windows, si — un simple `ping` du nom suffit.
**Viser le nom, pas l'IP** : un bail DHCP renouvelé casserait un afficheur codé en dur.

### Deux choses apprises en sondant, et elles touchent la conception

**1. `/api/loop` révèle quatre applications natives qui défilent en boucle** — Time, Temperature,
Humidity, Battery. Le défilé des quarts doit donc être **la seule application affichée** au moment où on
le regarde, sinon il disparaît quelques secondes derrière la météo et la batterie. *Un afficheur ambiant
qui s'absente n'est pas ambiant* — le § 1 rappelle qu'on ne le regarde pas, on remarque qu'il a changé ;
encore faut-il qu'il soit là quand on remarque.

**2. Le signal mesuré est faible : -76 dBm, 113 ms de ping.** ✅ **Sans objet** — David, le 2026-08-23 :
l'objet sera **à 3 m du routeur** pendant la partie. La mesure avait été prise à son emplacement de
rangement, pas à sa place de jeu. *À reprendre une fois posé sur la table, mais le doute est levé.*
La règle du journal d'Ollama reste vraie par ailleurs : **un afficheur absent, éteint ou hors réseau ne
doit jamais emporter ce qu'il décrivait.**

### Les deux régimes de l'objet — décidé par David le 2026-08-23

> *« Je veux qu'il affiche sa routine normale hors partie, mais pendant la partie, et si j'active
> l'option Ulanzi, il doit exécuter un ou des scripts liés au jeu. »*

**C'est le bon modèle, et il corrige le § 11 précédent** qui disait « la seule application » sans dire
*quand*. L'objet n'appartient pas à GM-OS : c'est une horloge de bureau que la séance **emprunte**.

| Régime | Ce qu'il affiche | Ce qui le déclenche |
| --- | --- | --- |
| **Routine** | Les 4 applications natives, en boucle | Le défaut. Hors séance, ou option décochée |
| **Séance** | Le ou les widgets du jeu, et rien d'autre | Séance ouverte **ET** option Ulanzi activée |

**L'option qui coche est essentielle** : elle rend l'objet facultatif, ce que la règle ci-dessus exige de
toute façon. Une séance sans Ulanzi doit se dérouler sans que rien ne manque.

### Ce que le modèle ajoute, et qui n'est pas évident : **la restitution**

Emprunter, c'est devoir rendre. Et le cas qui compte n'est pas la fin de séance normale — c'est
**l'anormale** : GM-OS ferme, plante, ou perd le réseau au milieu de la partie.

> **Sans restitution, l'Ulanzi reste bloqué sur un défilé figé — un Quart qui n'avance plus, pour
> toujours.** Et un afficheur qui ment sur un compteur est pire qu'un afficheur éteint : il est
> *crédible*.

C'est le miroir exact de la règle d'Ollama. Elle disait : *l'absence de l'afficheur ne doit rien
emporter*. Il faut désormais aussi : **l'absence de GM-OS ne doit rien laisser derrière**.

**Le remède, et il est natif** : les applications personnalisées d'AWTRIX acceptent une **durée de vie**
(`lifetime`) au terme de laquelle elles se retirent d'elles-mêmes. En la fixant courte et en
**republiant périodiquement** le widget, on obtient la propriété voulue **sans que GM-OS ait à faire
quoi que ce soit pour mourir proprement** : s'il cesse d'émettre, l'objet revient tout seul à sa routine.

*Le défilé ne se pousse donc pas une fois : il se pousse en battement.* Il faut le dire maintenant,
parce que ça change la forme du code — une horloge, pas un envoi.

✅ **`lifetime` VÉRIFIÉ sur l'appareil le 2026-08-23** (firmware 0.98). Un widget poussé avec
`lifetime: 25` et `lifetimeMode: 0` apparaît dans `/api/loop`, puis **s'en retire seul** : 32 s plus
tard la boucle était revenue à `Time, Temperature, Humidity, Battery`. Rien à nettoyer.

### Mais `lifetime` rend les pixels, pas la routine — et c'est le vrai piège

La lecture de `/api/settings` donne le reste du tableau, et il change la conclusion :

| Réglage | Valeur au 23/08 | Ce qu'il fait |
| --- | --- | --- |
| **`ATIME`** | `7` | **Secondes d'affichage par application** — c'est la cadence de rotation |
| `TIM` / `DAT` / `HUM` / `TEMP` / `BAT` | `true` / `false` / `true` / `true` / `true` | **Les interrupteurs des applications natives** |
| `ATRANS`, `TEFF`, `TSPEED` | `true`, `1`, `400` | Transition entre applications |
| `BRI`, `ABRI` | `120`, `false` | Luminosité, auto-luminosité désactivée |

### ⚠️ Correction du 2026-08-23 : ces interrupteurs ne s'appliquent PAS à chaud

**Ce que ce plan supposait était faux, et l'essai l'a montré.** Mis à `false`, `HUM`, `TEMP` et `BAT`
sont bien relus à `false` par `/api/settings` — **et les applications continuent de s'afficher**. C'est
au démarrage que la liste des applications se construit.

Mesuré en interrogeant `/api/stats.app` toutes les 1,5 s :

| | Séquence réellement affichée |
| --- | --- |
| Avant redémarrage | `Temperature → Humidity → Battery → gmos_quarts → Time` |
| Après redémarrage | `Time → gmos_quarts` |

> **Leçon.** *Un réglage qui s'écrit sans effet ne se distingue pas d'un réglage qui marche — sauf à
> regarder ce que l'objet fait vraiment.* La relecture confirmait `false` pendant que l'afficheur montrait
> la météo. C'est le motif du dépôt sous une forme nouvelle : ici la donnée était juste **des deux côtés**,
> et c'est le comportement qui mentait.

**Conséquence : silencer les natives coûte un redémarrage** (une dizaine de secondes) — à la prise **et**
à la restitution, puisque rendre exige le même geste que prendre. On ne l'inflige donc que si quelque
chose doit réellement changer, et l'option est **décochable** dans le panneau.

**Et `ATIME` disparaît du problème.** La part d'écran du défilé se règle par **`duration` sur le widget
lui-même** — vérifié : `duration: 25` avec `ATIME: 8` donne 25 s de défilé contre 8 s d'horloge.
L'horloge garde sa cadence d'origine, ce qui fait **un réglage de moins à rendre**.

Le régime « séance » est donc : **couper les trois bavardes (avec redémarrage si nécessaire), pousser le
widget avec sa `duration`**. Et le piège de la restitution demeure :

> **Si GM-OS plante après avoir éteint les natives, `lifetime` retire bien nos widgets — mais les natives
> restent éteintes. L'objet n'affiche alors PLUS RIEN.** Un écran noir au milieu de la table.

*Rendre les pixels ne suffit pas : il faut rendre ce qui les occupait.*

**Premier remède, abandonné le jour même : garder `TIM` allumée.** David : *« on ne sait pas enlever
Time aussi ? »* — si, et c'est mieux. Vérifié : `TIM: false` + redémarrage laisse `{"gmos_quarts": 0}`
**seul** dans la boucle, donc le défilé en permanence.

**Et le filet était mauvais.** Une horloge laissée par un GM-OS mort est *indiscernable d'un
fonctionnement normal* : elle **cache** la panne. Un afficheur éteint la montre.

> **Le vrai remède : la restitution se rejoue au prochain démarrage de GM-OS**, depuis la routine
> persistée dans le store. *Un filet qui ne rattrape qu'à l'instant de la chute n'en est pas un.*

La restitution explicite à la clôture reste nécessaire de toute façon ; elle ne couvre simplement pas le
plantage, et c'est pour ça qu'elle ne peut pas être le seul filet.

### Un mot sur « scripts », parce que le mot est piégeux

L'intention est juste — *un comportement propre au jeu*. Mais si « un script par jeu » devient la forme,
**le § 2 est défait** : on retombe sur une bibliothèque de fonctions par système, c'est-à-dire N
écrivains vers 256 pixels.

La forme juste reste celle du § 3 : **le pilote déclare quels widgets son jeu veut**, et l'afficheur sait
les rendre. Blade Runner déclarerait le défilé des quarts ; Rêves de Dragons, l'heure draconique. **Zéro
ligne de code par jeu supplémentaire** — c'est tout l'intérêt, et c'est ce qui rend le chantier court.

### Le constat qui rend le premier test court

**GM-OS ne suit aucun Quart aujourd'hui.** Vérifié : le mot n'apparaît nulle part dans `src/` au sens de
Blade Runner — les seules occurrences sont des « quarts d'heure ». Aucun pilote ne le déclare, aucun
module ne le compte.

**Conséquence, et elle est libératrice** : le défilé des quarts est, au sens du § 4, un **instrument** et
non un miroir. Il ne reflète rien, donc il n'y a **rien à brancher** — ni pilote à forger, ni moteur à
lire, ni arbitre à écrire. *C'est précisément ce qui tient dans une soirée.*

Il deviendra un miroir plus tard, le jour où un pilote Blade Runner déclarera le Quart. **Pas avant, et
surtout pas pour ce test.**

### Ce que 32 × 8 doit dire, et rien d'autre

Deux choses, tirées du corpus :

1. **Où on en est dans la journée** — lequel des quatre Quarts (matin, journée, soirée, nuit).
2. **Combien de Quarts d'affilée sans pause** — et le **franchissement du seuil de trois**, au-delà
   duquel chaque Quart coûte 1 point de stress.

Rien de plus. Pas de nom de lieu, pas d'heure, pas de texte : *ce qui a besoin d'une phrase a déjà un
écran* (§ 1).

### La composition proposée

### ⚠️ Révisé le 2026-08-23 après essai sur l'appareil : **le mot, pas les blocs**

La première version dessinait deux bandes abstraites. David, en la voyant : *« à la place des blocs
verts, tu peux écrire Matin, Journée, Soirée et Nuit sur la largeur de l'écran ? »*

**Vérifié sur la matrice, et ça tient** — « JOURNEE », le plus long des quatre à sept caractères, entre
sans défiler avec `noScroll`. Les accents, eux, ne passent pas : on envoie donc `JOURNEE` et `SOIREE`
**sans accent** (l'appareil force déjà les majuscules), pendant que l'écran de GM-OS affiche « Journée »
et « Soirée » correctement.

> **Leçon.** Le § 1 disait « des nombres et des barres, **jamais de phrases** ». Il avait raison sur les
> phrases et tort sur les mots : **un mot de sept caractères tient, et il se lit sans apprentissage** là
> où deux bandes de couleur demandent de savoir ce qu'elles signifient. *La contrainte portait sur la
> longueur, pas sur la nature.*

**Ce qui reste dessiné : la barre des Quarts consécutifs, réduite à deux pixels tout en bas.** Le compte
d'enchaînement est la seule chose que le livre sanctionne — le supprimer aurait rendu l'afficheur joli et
**muet sur la règle**. *On ne supprime pas l'information, on la range.*

---

*Version d'origine, conservée pour mémoire :* **deux bandes de 32 × 4, et aucun caractère.** Le mot de
David dit la forme : c'est un **défilé**, donc ça avance.

```text
┌────────────────────────────────┐
│ ████████ ████████ ░░░░░░ ░░░░░ │  ← la journée : 4 segments, ceux passés sont pleins
│ ███ ███ ███ ▓▓▓ ░░░ ░░░ ░░░ ░░ │  ← les Quarts consécutifs : 3 verts, le 4ᵉ rouge
└────────────────────────────────┘
   32 pixels de large, 8 de haut
```

- **Bande du haut — la journée.** Quatre segments de 8 px. Le Quart en cours **pulse doucement**, les
  précédents sont pleins, les suivants éteints. Une couleur par moment du jour (aube, plein jour,
  crépuscule, nuit) : on lit l'heure narrative sans savoir lire.
- **Bande du bas — le compte consécutif.** Des pastilles. **Les trois premières vertes, la quatrième et
  les suivantes rouges.** Le passage au rouge *est* le message : à partir d'ici, chaque Quart coûte un
  point de stress. Une pause remet la bande à zéro — et **ce retour au vert est l'événement le plus
  satisfaisant que l'objet puisse produire**.

**Aucun texte, donc aucun défilement.** Lisible de l'autre bout de la table, par quelqu'un qui ne
connaît pas la règle. C'est le meilleur usage possible des 256 pixels.

### La question que ça ouvre, et qu'il faut trancher avant de coder

> **Qui fait avancer le Quart ?**

Puisque aucun moteur ne le suit, quelqu'un pousse. Trois candidats, et le premier test doit en choisir
**un seul** :

| Où | Ce que ça vaut |
| --- | --- |
| **Un bouton dans le cockpit** | Le plus direct, et le meneur y est déjà. |
| **Le pupitre / une commande rapide** | Sous la main en séance, mais un écrivain de plus. |
| **Les trois boutons de l'Ulanzi** | Le geste le plus juste — mais il dépend du § 10.2 (MQTT), donc **hors du premier test**. |

*Recommandation : le cockpit, un bouton « Quart suivant » et un bouton « Pause ». Deux gestes, aucun
réglage, et rien à défaire si l'essai ne prend pas.*

### Ce qu'on saura le lendemain de la séance

Une seule question, et la lecture du code ne peut pas y répondre : **est-ce que les joueurs l'ont
regardé ?** Et, mieux : est-ce qu'ils ont *arrêté de tenir le compte au crayon* sur leur fiche d'Agenda.
Si oui, l'afficheur ne fait pas qu'informer — il a retiré du travail à la table, et les dix-neuf autres
idées valent la peine d'être construites.

---

## 12. La librairie de widgets et son tableau de bord

**Demandé par David le 2026-08-23** : *« un tableau de bord qui me permet de choisir un script pour un
jeu (Compteur de danger + compte à rebours, ou Jauge d'Impulsion + Horloge Galactique) ; si je choisis
plus d'un widget, ils doivent défiler, un temps déterminé par moi. Donc il me faut une sorte de
librairie de widgets à activer, seul ou en parallèle. »*

### La bonne nouvelle : la rotation est native, il n'y a pas d'ordonnanceur à écrire

`ATIME` **est** « un temps déterminé par moi ». AWTRIX fait déjà défiler ses applications à cette
cadence. Donc « plusieurs widgets qui défilent » se traduit par : **pousser N applications, écrire
`ATIME`.** Rien de plus.

**Conséquence sur le § 7 :** l'arbitre des 256 pixels n'est *pas* nécessaire au premier temps. La
sélection du tableau de bord est explicite et stable pendant une séance — **il y a un seul écrivain par
construction**. L'arbitre ne redevient nécessaire que pour les **surgissements** (le coup d'éclat du
§ 8.5), qui passent par `/api/notify` — un autre canal, qui ne se bat pas avec la boucle.

### Ce qu'est un widget, et pourquoi ce n'est pas un script

Un widget n'est pas du code : c'est **un des quatre types du § 2, lié à un sujet et à une source.**

```ts
type TypeDeWidget = 'jauge' | 'compte-a-rebours' | 'rang' | 'icone-etat';

interface WidgetDeTable {
    id: string;            // 'defile-des-quarts'
    nom: string;           // 'Défilé des quarts'
    type: TypeDeWidget;
    /** Le jeu auquel il appartient. Absent = universel. */
    systemId?: string;
    /** D'où vient la valeur — c'est la distinction miroir / instrument du § 4. */
    source:
        | { de: 'pilote'; champ: string }   // MIROIR : une jauge que le pilote déclare
        | { de: 'main' };                   // INSTRUMENT : poussé par le meneur
}
```

**Ajouter un jeu ne coûte donc aucune ligne de code** — c'est tout l'intérêt, et c'est ce que le § 3
protège. « Compteur de danger », « Jauge d'Impulsion », « Horloge Galactique » et « Défilé des quarts »
sont **quatre entrées de données**, pas quatre fonctions.

### Ce que le tableau de bord enregistre

```ts
interface ReglageUlanzi {
    systemId: string;
    /** Les widgets choisis, dans l'ordre où ils défileront. */
    actifs: string[];
    /** La cadence, en secondes. Écrite dans `ATIME`. */
    secondesParWidget: number;
}
```

### Qui déclare quoi — la question des deux écrivains, encore

Elle se pose ici comme partout, et elle se résout proprement parce que **les deux ne répondent pas à la
même question** :

| | Ce qu'il dit | La question |
| --- | --- | --- |
| **Le pilote** | Ce que le jeu **peut** montrer — ses jauges, leurs champs | *disponibilité* |
| **Le tableau de bord** | Ce qui est **actif**, dans quel ordre, à quelle cadence | *sélection* |

**Le pilote propose, le tableau de bord dispose.** Aucun des deux n'écrase l'autre.

Une conséquence à ne pas oublier : si le champ qu'un widget vise **disparaît du pilote**, le tableau de
bord doit le montrer **indisponible**, pas le faire disparaître en silence. *Un widget qui s'évapore
sans rien dire est exactement le défaut que ce projet paie tous les jours.*

### Combiner, c'est faire défiler l'un après l'autre

**Précision de David, le 2026-08-23** : « en parallèle » voulait dire *« qui défilent l'un après
l'autre »*. C'est donc exactement `ATIME`, et il n'y a rien de plus à concevoir.

*Pour mémoire, puisque la question se posera un jour* : deux widgets **côte à côte** seraient 16 × 8
chacun, soit deux caractères — ça ne marche pas. Le défilé des quarts montre pourtant deux choses à la
fois (le Quart du jour en haut, les consécutifs en bas) : elles ont été **composées** dans un seul
widget. La règle, si le besoin revient : *on ne juxtapose pas deux widgets quelconques, on compose un
widget qui en dit deux* — et le composé entre alors dans la librairie comme un widget à part entière.

---

## 13. Ce qui est construit — 2026-08-23

**Le défilé des quarts fonctionne.** `tsc -b` propre, 2 286 tests au vert, et l'appareil vérifié rendu à
sa routine exacte après essai (`ATIME: 7`, les quatre natives rallumées).

| Fichier | Ce qu'il porte |
| --- | --- |
| `src/modules/ulanzi/widgets/defileDesQuarts.ts` | **La règle et le dessin, sans réseau ni React.** Les quatre Quarts, le seuil de trois, la pause qui consomme un Quart |
| `…/defileDesQuarts.test.ts` | **13 tests** qui tiennent la règle du livre, pas les couleurs |
| `…/UlanziService.ts` | Parler à l'appareil : pousser, régler, **prendre et rendre la main** |
| `…/useUlanziStore.ts` | L'état du Quart, l'option, la cadence, la routine sauvegardée |
| `…/useBattementUlanzi.ts` | Le battement, les deux régimes, la restitution |
| `…/PanneauDesQuarts.tsx` | Le pupitre du cockpit : « Quart suivant », « Pause », et l'aperçu en SVG |

**Modifié :** `electron/main.ts` et `preload.ts` — le relais `light:request` accepte désormais des
en-têtes, et un alias `ulanzi` pointe dessus. *Un seul relais, deux noms* : en écrire un second aurait
donné deux chemins réseau à tenir.

### Les trois choses que l'appareil a apprises à ce plan

1. **`Content-Type: application/json` est obligatoire, et son absence échoue EN SILENCE.** Le POST part,
   rien ne proteste, l'application n'apparaît jamais. Le relais du Light OS n'en posait pas — le pont Hue
   s'en passe. *C'est le défaut qu'on aurait cherché une soirée.*
2. **`lifetime` marche** (`lifetime: 25`, `lifetimeMode: 0` → retrait automatique vérifié).
3. **Mais il rend les pixels, pas la routine** — d'où `NATIVES_A_COUPER`.
   ⚠️ *Corrigé le 2026-08-30 : cette ligne disait « qui ne contient jamais `TIM` ». C'est faux depuis le
   23/08 même — David a demandé de couper l'horloge aussi (« on ne sait pas enlever Time aussi ? »), et
   le filet a changé de nature : ce n'est plus l'horloge laissée allumée, c'est la restitution rejouée
   au démarrage suivant. Une horloge laissée par un GM-OS mort est indiscernable d'un fonctionnement
   normal — elle **cache** la panne.*

### Ce qui reste avant la séance

- **Poser l'objet à sa place de jeu et vérifier le signal** (3 m du routeur, annoncé par David).
- **Faire un essai complet en conditions** : ouvrir une séance, cocher l'option, avancer trois Quarts,
  voir le rouge au quatrième, prendre une pause, fermer la séance et **vérifier que l'afficheur redevient
  une horloge**.
- Le panneau n'apparaît que si le jeu de la campagne contient « blade », ou tant que l'option reste
  allumée. **Couture provisoire**, remplacée plus tard par la librairie du § 12.

---

## 14. La suite — les quatre directions et leur ordre

**Écrit le 2026-08-30, après l'essai en conditions.** David : *« maintenant que l'utilisation d'Ulanzi
est validée, est-ce qu'on peut aller un peu plus loin ? »* — puis, devant les quatre options :
*« est-ce qu'on peut prévoir les 4 options ? »*.

**L'ordre n'est pas libre.** Deux directions dépendent d'une troisième, et la quatrième reposait sur un
fait jamais vérifié — qui l'est maintenant.

| | Direction | Dépend de | État au 2026-08-31 |
| --- | --- | --- | --- |
| **A** | La librairie et son tableau de bord | — | ✅ **faite** |
| **B** | Clock-OS, le premier **miroir** | A | ✅ **faite** |
| **C** | Les jauges déclarées par les pilotes | A | ✅ **faite** |
| **D** | Les boutons physiques | un courtier MQTT | ⛔ **garée par David** — voir § D |

> **Les trois premières sont livrées, et deux widgets sont venus en plus** : le
> **minuteur** (§ 8.1, celui que ce plan classait premier) et le **signal du
> Voight-Kampff**, second widget composé. Six widgets au catalogue, dont trois
> miroirs. Voir le § 16 pour ce que l'appareil a appris à ce plan en route.

### Ce qui a changé depuis l'écriture du § 12, et qui rend A, B et C bien moins chers

**Le pilote sait déjà déclarer des jauges.** `GameDriver.ressourcesDeTable` et `RessourceDeTable`
(`src/modules/table/`) portent **exactement** ce qu'un widget « jauge » demande : `id`, `label`,
`depart`, `min`, `max`, le propriétaire et la visibilité. Ça n'existait pas le 23/08 — c'est arrivé par
le chantier des réserves de table du 15/08. **La source du miroir est donc déjà construite**, et le § 3
(« la correspondance existe déjà, ne pas la réécrire ») se trouve vérifié sans qu'on ait rien fait.

### ⚠️ Correction au § 12 : la cadence ne passe plus par `ATIME`

Le § 12 dit « pousser N applications, écrire `ATIME` », et `ReglageUlanzi.secondesParWidget` en découle.
**Le code livré a délibérément abandonné `ATIME`** au profit de `duration`, posé sur chaque widget — ce
qui laisse l'horloge native à sa cadence d'origine et fait *un réglage de moins à rendre*.

Conséquence, et elle est meilleure que ce que le plan prévoyait : **la cadence est par widget, pas
globale.** `ReglageUlanzi` doit donc porter une durée **par entrée**, pas une seule pour tout le monde.

### A · La librairie et son tableau de bord — le préalable

Le § 12 tient : un widget est **une donnée**, pas du code. Le travail est de sortir le défilé des Quarts
de son câblage en dur et de le faire entrer dans la librairie comme une entrée parmi d'autres.

*Pourquoi d'abord.* Le § 13 le disait déjà : **c'est le second widget qui force la librairie à
exister** — deux widgets, c'est un choix, et un choix, c'est un tableau de bord. Brancher Clock-OS en
dur avant de faire A donnerait deux câblages à défaire au lieu d'un.

À traiter dans A, et qui n'est pas dans le § 12 :

- **La couture provisoire disparaît.** Le panneau n'apparaît aujourd'hui que si le jeu contient
  « blade » ; c'est la librairie qui doit décider ce qui s'affiche, par `systemId`.
- **Un widget dont la source disparaît s'affiche INDISPONIBLE**, jamais ne s'évapore (§ 12).

### B · Clock-OS — le premier miroir

`TensionClock` (`src/store/useClockStore.ts`) porte déjà `name`, `totalSegments`, `filledSegments` :
c'est un widget « compte à rebours » sans rien à ajouter au moteur.

C'est le **premier miroir** au sens du § 4, et il change la nature de l'objet : jusqu'ici l'afficheur ne
reflétait rien. **S'il ment désormais, c'est un bug** — et il faut donc que la disparition d'une horloge
retire son widget, ce qu'un instrument n'avait jamais à gérer.

Choisi avant C parce qu'il est **universel** : toute campagne peut avoir une horloge de tension, alors
qu'une réserve de table appartient à un jeu.

### C · Les jauges des pilotes — le second miroir, qui prouve la librairie

L'Impulsion et la Menace de Dune, et tout ce qu'un pilote déclarera ensuite. **C'est l'étape qui
démontre la thèse du § 12** : si ajouter Dune coûte zéro ligne de code, la librairie est juste ; s'il
faut écrire quoi que ce soit, elle ne l'est pas.

Un point de vigilance venu du modèle : `RessourceDeTable` distingue **`proprietaire`** et
**`visibleAuxJoueurs`**. L'afficheur est **public par construction** (§ 1) — il ne doit donc jamais
montrer une réserve que le pilote déclare invisible aux joueurs. *Le caviardage se fait à la source, pas
à l'affichage* : c'est la même règle que les cartes scellées de Deck-OS.

### D · Les boutons physiques — mesuré le 2026-08-30, et la réponse est non

La question du § 10.2 est **tranchée**. Sur le firmware 0.98 de l'appareil de David :

```text
/api/buttons        → 404
/api/stats/buttons  → 404
/api/stats          → aucun état de bouton (indicator1/2/3 sont des LED de SORTIE)
```

**Les boutons ne remontent pas en HTTP.** MQTT, donc, ou rien — et un courtier est un service de plus à
faire vivre, à démarrer avec GM-OS et à rendre en partant. *Cette direction est la seule des quatre dont
le coût est une dépendance d'infrastructure et non du code.*

Recommandation : **la garer explicitement** jusqu'à ce qu'un besoin la réclame. La télécommande
d'initiative est séduisante, mais le cockpit fait déjà le geste, et l'objet vaut surtout par ce qu'il
**montre** sans qu'on le touche.

### Ce que l'incident du 2026-08-30 impose à toute la suite

La restitution a coûté trois défauts (§ 15). Elle devient **plus lourde avec N widgets** :

- `rendreLaMain` doit retirer **N applications**, pas une — et la sortie de GM-OS est bornée par un
  délai dur de **4 secondes partagé avec la sauvegarde**. Au-delà d'une poignée de widgets, il faudra
  retirer en parallèle plutôt qu'en boucle, ou s'appuyer sur `lifetime` et ne rendre que les réglages.
- Le **battement** republie chaque widget toutes les 30 s : N widgets = N requêtes par battement.
- *Un widget qui ment est pire qu'un widget absent, parce qu'il est crédible.* Avec des miroirs, cette
  règle cesse d'être théorique.

---

## 15. L'essai en conditions — 2026-08-30

**Le widget n'a rien eu.** David : *« le défilé des quarts est très bon »*. Les **trois** défauts
trouvés étaient tous dans **la restitution**, c'est-à-dire dans le seul cas qu'aucun test ni aucune
lecture de code n'atteignait : fermer une vraie application devant un vrai appareil.

### ⛔ Si l'écran est noir, le diagnostic tient en deux requêtes

Il a tranché **les trois fois** :

```text
Invoke-RestMethod http://awtrix_73f7a4.local/api/settings
Invoke-RestMethod http://awtrix_73f7a4.local/api/loop
```

**`loop={}` veut dire « rien à afficher », jamais « en panne ».** Et un redémarrage n'y peut **rien** :
`TIM/HUM/TEMP/BAT` vivent en flash. La sortie est un POST
`{"TIM":true,"HUM":true,"TEMP":true,"BAT":true}` sur `/api/settings`, puis `/api/reboot`.

### Les trois défauts

**1. La restitution vivait dans un nettoyage d'effet React.** *Fermer une fenêtre Electron ne démonte
pas l'arbre React* : elle n'était jamais appelée. Et même appelée, elle tire quatre requêtes HTTP **sans
les attendre** dans un rendu qu'on détruit. D'où le symptôme exact — fermer la **séance** marchait,
fermer l'**application** non. → passée sur le rail de sortie du process principal, le seul endroit où le
rendu est encore vivant **et attendu**. *Une restitution ne peut pas vivre dans un processus qui meurt
avant elle.*

**2. La routine était empoisonnée par une seconde prise de main.** `prendreLaMain` la fabrique **en
relisant les réglages de l'appareil** : reprise sur un appareil déjà muet, elle mémorisait « tout était
éteint ». Il n'y avait alors plus rien à rendre, et la restitution effaçait la routine en partant —
**l'appareil devenait irrécupérable par l'application elle-même**. → `memoriserLaRoutine` n'écrit
qu'**une fois**, et `rendreLaMain` **ne croit plus** une routine « tout éteint ». *Une sauvegarde qu'on
réécrit avec l'état qu'elle servait à réparer n'est plus une sauvegarde.*

**3. `StrictMode` monte chaque effet deux fois.** Deux abonnés recevaient la demande de fermeture ; le
premier partait rendre la main et posait `enMain` à faux, le second voyait ce faux, croyait n'avoir rien
à faire et **répondait aussitôt**. Le principal ne retient la fermeture que jusqu'à la **première**
réponse : il quittait en pleine restitution. → promesse **partagée** et un seul abonné. *Quand plusieurs
répondent pour un seul travail, c'est le plus rapide qui décide, et le plus rapide est celui qui n'a
rien fait.*

> **La leçon commune aux trois** : deux de ces corrections ont été livrées **sans jamais être
> exécutées**, données à tester sur du matériel. Les tests qui les accompagnaient sollicitaient
> l'abonnement **une seule fois** — ils validaient un scénario qui n'existe pas en développement, alors
> que `StrictMode` est dans le dépôt depuis toujours. *Un test qui ne reproduit pas les conditions
> réelles confirme surtout l'idée qu'on se fait du code.*

### Ce qui reste à savoir, et que seule la table dira

Les joueurs le regardent-ils, et **cessent-ils de tenir le compte des Quarts au crayon** sur leur fiche
d'Agenda. C'est la seule mesure qui dise si l'objet retire du travail ou en ajoute.

---

## 16. Ce que l'appareil a appris à ce plan — 2026-08-30/31

### ⚠️ Le débit, mesuré

| Ce qu'on envoie | Commandes | Temps par poussée | Échecs |
| --- | --- | --- | --- |
| `df`, un rectangle par colonne (980 o) | 32 | **802 ms** | **2 / 20** |
| `dl`, segments (435 o) | 12 | **401 ms** | 0 / 20 |
| petite charge témoin | 4 | 395 ms | 0 / 24 |

> ⚠️ **CORRIGÉ LE 2026-08-31 : c'est 253 ms, pas 400 — et la conclusion « l'appareil n'animera pas »
> était fausse.** Remesuré sur le même appareil : lecture 34 ms, écriture **253 ms**, et le même temps
> pour 59 octets que pour 398. Voir le § 17, qui refait le banc et change la conception du signal.

**Le coût est FIXE par écriture**, quelle que soit la charge. Deux conséquences qui ont décidé du code :
la cadence rapide ne peut pas descendre sous **500 ms**, et **un tracé pixel par pixel est
inutilisable** — il aurait lâché en séance sans qu'on sache pourquoi. *Un dessin trop lourd ne se voit
pas dans le code, il se voit sur le fil.*

`dl` (lignes) fonctionne sur le firmware 0.98. Les **19 effets natifs** (`Radar`, `MovingLine`,
`LookingEyes`, `Matrix`…) ne contiennent **aucun tracé** — ~~l'appareil n'animera pas un signal seul~~
⛔ **et c'est la conclusion qui était fausse : il l'anime, par une icône. Voir le § 17.**

### Les règles que la librairie a posées

- **Sélection absente ≠ sélection vide.** Absente → les `parDefaut` ; vide → on ne pousse rien, *c'est
  un choix*. Sans la nuance, ajouter une entrée au catalogue **allumerait un widget chez quelqu'un qui
  ne l'a jamais demandé.**
- **On ne rend pas réglable ce qui dit quelque chose** — ni les couleurs des Quarts (le moment du
  jour), ni celle du signal (le rythme), ni **jamais l'alerte**.
- **La plus précise gagne** : couleur de l'horloge > couleur du widget > origine.
- **Le caviardage se fait à la source**, jamais à l'affichage : `isClockProjected` et
  `visiblePourUnJoueur`, qui est la règle du module des réserves et non une seconde écrite à côté.
- **Le battement ne republie que ce qui a changé**, et renouvelle quand même `lifetime` toutes les
  30 s — *le silence est le filet qui rend l'appareil, il ne faut pas le déclencher par inadvertance.*
- **Une seule publication à la fois** : à 500 ms, deux applications à republier dépassent l'intervalle
  et `setInterval` n'attend rien.

### Deux pièges trouvés en branchant, sans rapport avec l'afficheur

**`campaign.system` ne dit rien du jeu** — la Forge fabrique `custom-${Date.now()}`. La couture qui
cherchait la sous-chaîne « blade » était un bricolage **qui marchait** ; la remplacer par une
comparaison stricte aurait été une régression déguisée en propreté. → `useCorpusDeLaCampagne`.

**Le minuteur ne descendait que sur son propre écran** : son battement vivait dans un effet de
`ClockDashboard`, et la valeur diffusée aux tablettes gelait avec lui. → monté dans `Shell`.


---

## 17. L'appareil sait animer — 2026-08-31, et ça défait une conception entière

*David montre une référence : un tracé d'électro animé sur un Ulanzi. « Est-ce qu'on pourrait
reproduire cela ? »* En mesurant pour répondre, **deux choses ont changé la réponse**, et la seconde
a défait le widget que je venais de livrer.

### Le banc du 30/08 était pessimiste, et il posait la mauvaise question

| | 30/08 | **31/08, remesuré** |
| --- | --- | --- |
| Lecture `/api/stats` | — | **34 ms** (médiane sur 12) |
| Écriture, charge de 59 o | 395 ms | **258 ms** |
| Écriture, charge de 398 o | 401 ms | **253 ms** |

Le coût est **fixe par requête** — la charge n'y change rien —, donc pousser des images plafonne à
**quatre par seconde**. Ce n'est pas une animation, c'est une succession de photos. Jusque-là, le § 16
avait raison sur le fond et faux sur le chiffre.

### ⭐ Mais l'appareil expose un SYSTÈME DE FICHIERS, et je ne l'avais jamais demandé

```text
GET /list?dir=/        → CUSTOMAPPS, DoNotTouch.json, ICONS, MELODIES, PALETTES
GET /edit              → un gestionnaire de fichiers complet
POST /edit  (multipart)→ dépose un fichier
DELETE /edit (path=…)  → en retire un
```

**Une icône animée déposée dans `ICONS` est jouée par l'appareil lui-même**, à pleine vitesse et
**sans un octet de trafic**. Vérifié en réel le jour même : un GIF **32 × 8** s'affiche sur toute la
largeur et s'anime. David : *« je vois un tracé animé sur toute la largeur »*.

> **La leçon, et elle est chère** : le § 16 conclut « l'appareil n'animera pas un signal seul » à partir
> de la liste des dix-neuf effets natifs. C'était une conclusion tirée d'un inventaire **partiel** — je
> n'avais pas demandé à l'appareil ce qu'il savait faire d'autre. *J'ai conçu tout un widget autour d'une
> contrainte que je n'avais pas fini de mesurer.*

### Ce que ça change, et ça dépasse le signal

| | Tracé en segments *(30-31/08)* | Icône animée *(31/08)* |
| --- | --- | --- |
| Fluidité | 2 images/s | **pleine vitesse, jouée localement** |
| Trafic en séance | une écriture / 500 ms, en permanence | **une par changement de niveau** |
| Cadence rapide | imposée à tout le battement | **rendue** |
| Budget de 16 segments | toute la conception | **disparu** |

*Une contrainte qu'on croyait structurelle — la cadence rapide de 500 ms de tout le battement — tenait
à un seul widget.*

### Les six icônes, et pourquoi le rythme monte de deux façons

`scripts/fabriquerLesIcones.py` produit `public/ulanzi/gmosvk1..6.gif`. **Un GIF dans un dépôt est
illisible** : on ne peut ni voir ce qui a changé, ni retoucher une courbe sans tout refaire. *La vérité
est dans le script ; les GIF n'en sont que la sortie.*

| Niveau | Battements | ms/image | Balayage |
| ---: | ---: | ---: | ---: |
| 1 | 1 | 90 | 2,9 s |
| 2 | 1 | 60 | 1,9 s |
| 3 | 2 | 60 | 1,9 s |
| 4 | 3 | 50 | 1,6 s |
| 5 | 4 | 40 | 1,3 s |
| 6 | 5 | 30 | 1,0 s |

Plus de battements **et** plus vite : une seule des deux ne suffisait pas. *Plus de battements sans
accélérer donne un tracé dense mais placide ; accélérer sans en ajouter donne un balayage pressé qui ne
dit rien du cœur.*

### Deux décisions de David, et un piège payé

**1. Les icônes restent sur l'appareil.** Elles vivent en flash et survivent aux redémarrages — c'est
exactement ce qui rend l'idée gratuite en séance. La restitution ne les efface pas : *elles ne
s'affichent pas d'elles-mêmes, et les redéposer chaque séance coûterait huit envois pour rien.*

⚠️ **C'est la première fois que GM-OS écrit durablement sur l'afficheur.** Tout le reste — widgets,
réglages — est temporaire par construction, et c'est ce qui fait tout le filet du § 11.

**2. Le tracé en segments est retiré**, pas gardé en repli.

**Le piège** : les fabricants de `multipart/form-data` ajoutent volontiers un paramètre `filename*`
(RFC 5987) à côté de `filename`. Le serveur embarqué **avale la ligne entière** et crée un fichier
nommé `gmosvk1.gif"; filename*=utf-8''%2FICONS%2F…`. Deux fichiers illisibles ont dû être supprimés à
la main. *Un serveur embarqué lit rarement toute la norme : on lui envoie le strict nécessaire* — d'où
un corps multipart écrit à la main, et isolé pour être vérifiable.

### Ce qui reste à voir en séance

Le dépôt **par GM-OS** n'a jamais tourné : je l'ai éprouvé en déposant les fichiers à la main depuis un
terminal, puis j'ai nettoyé l'appareil. Ce qui reste à vérifier tient en une phrase — *à la première
prise de main, les six icônes arrivent-elles, et le widget les trouve-t-il ?*
