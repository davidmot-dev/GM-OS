# Clock-OS

Clock-OS fait deux choses qui n'ont l'air d'en être qu'une : il **affiche le temps** — réel, figé,
compté à rebours, ou celui d'un calendrier inventé — et il tient vos **jauges de tension**, ces
horloges de *Blades in the Dark* qui montent pendant que les joueurs hésitent.

L'écran est en trois zones : la **configuration** à gauche, le **visualiseur** au centre, et la
**grille des jauges** en bas.

---

## ⚠️ La chose à savoir avant de créer une jauge

**Chaque jauge décide si les joueurs la voient — et une jauge neuve naît fermée.**

Le bouton **Monitor**, en haut à droite du visualiseur, est l'interrupteur général : allumé au
démarrage, il décide **si** les joueurs voient des jauges. Puis, sur chaque jauge, un **œil** décide
**laquelle**. Ce qui est ouvert part sur le Player Hub, sur les tablettes et sur l'afficheur de
table ; ce qui est fermé ne quitte pas votre écran.

| L'œil | Ce que ça veut dire |
| :--- | :--- |
| 👁️ doré | Les joueurs la voient, sur tous leurs écrans |
| 👁️‍🗨️ éteint | Elle n'existe que pour vous — vous pouvez la nommer « Le traître frappe » |

> ⚠️ **Une jauge que vous créez aujourd'hui naît fermée**, et s'ouvre d'un clic. *Ouvrir est un
> geste, refermer est un regret* : une jauge qu'on vient de poser porte souvent un nom qui en dit
> trop. **Les jauges créées avant le 2026-09-04 restent ouvertes** — elles l'étaient hier, elles le
> sont encore, et rien n'a bougé sur les écrans de vos joueurs.

> 🔎 **Les laisser ouvertes reste un bon parti** — dans *Blades in the Dark*, les horloges sont
> publiques, et c'est précisément ce qui les rend angoissantes. Le choix est désormais à vous, jauge
> par jauge, au lieu d'être tout ou rien.

---

## 🖥️ Les quatre modes de temps

| Mode | Ce qu'il fait |
| :--- | :--- |
| **Temps Réel** | L'heure de votre ordinateur. Le mode par défaut, pour garder un œil sur l'heure de la pause. |
| **Statique** | Une date et une heure que vous fixez à la main, et qui ne bougent plus. Pour figer un moment. |
| **Minuteur** | Un compte à rebours, avec un message. |
| **Fantastique** | Une date dans un calendrier inventé. |

### Le minuteur

- Six raccourcis de durée : **1, 5, 10, 15, 30 et 60 minutes**.
- Un **message** libre — « Auto-destruction », « Arrivée des renforts » — affiché avec le décompte.
- **Départ**, **Pause**, et une remise à zéro.
- Sous dix secondes, l'affichage passe en urgence ; à zéro, il devient rouge et sautille.
- **Une cloche sonne à zéro** — cinq harmoniques, quatre secondes. La clochette en haut de la
  section l'éteint et la rallume.

> ✅ **La sonnerie existe depuis le 2026-09-05.** Le moteur de cloche était écrit **en entier** et
> n'avait aucun appelant : aucune sonnerie n'existait nulle part dans GM-OS. Elle est allumée par
> défaut, *mais une sonnerie qu'on ne peut pas couper devient insupportable en trois séances* —
> d'où l'interrupteur, à côté du titre.
>
> Elle se tait toute seule dans deux cas : la clochette est éteinte, ou **le son général est
> coupé**. Si la table est au silence, une cloche est exactement ce qu'on ne veut pas.

> 🔎 **Le minuteur descend même quand vous quittez Clock-OS.** Ça n'a pas toujours été vrai : le
> battement vivait dans l'écran, et partir au cockpit le figeait — y compris sur les tablettes des
> joueurs, où un compte à rebours arrêté est pire qu'aucun, *parce qu'il est crédible*. Corrigé le
> 2026-08-30.

<!-- -->

> 🔎 **Un minuteur jamais lancé n'est pas un minuteur fini.** Les deux affichent `00:00` ; seul le
> second est rouge.

### Le mode fantastique

Un calendrier est un fichier JSON déposé dans `databases/calendars/`. GM-OS en livre **un seul** :
le **Calendrier d'Harptos** (Royaumes Oubliés) — 18 mois, dont les fêtes intercalaires, et des
semaines de dix jours.

Le format gère les mois de longueurs différentes, les **jours intercalaires**, les mois qui
n'existent que les **années bissextiles**, et un nombre d'heures par jour qui n'est pas forcément
vingt-quatre.

Année, mois, jour et heure se règlent ensuite dans le panneau de gauche.

### ⭐ Créer un calendrier — l'Atelier

*Ajouté le 2026-09-15.* Jusque-là, la seule façon d'avoir un calendrier à vous était de **copier
`harptos.json` à la main** et de l'éditer au bloc-notes. C'est pourquoi il n'y en avait qu'un.

Le bouton 📅 **à côté de la liste des calendriers** ouvre l'Atelier.

| Dans l'Atelier | Ce que ça fait |
| :--- | :--- |
| **Jours par an**, en haut | Se recalcule à chaque frappe. **Le seul nombre qui compte vraiment.** |
| **Jours visés** | Facultatif. Affiche l'écart avec votre cible, et sert de consigne à l'IA. |
| **Les mois** | Nom, durée, « Fête » (jour hors calendrier), « Bissext. » ; flèches pour réordonner. |
| **Bissextile tous les** | Le cycle de VOTRE monde. **`0` = jamais.** |
| **Année de départ** | Où la chronique commence. Choisir le calendrier vous y pose. |
| **Composer d'après une description** | L'IA propose les mois ; elle **n'enregistre rien**. |

> ⭐ **Pourquoi la longueur de l'année est affichée en permanence.** C'est la somme de douze champs
> séparés, et personne ne l'additionne. *Un calendrier dont l'année fait 358 jours au lieu de 360 a
> l'air parfait champ par champ* — ça ne se voit qu'à la séance où vous annoncez « nous voyageons
> trois mois » et où les dates ne tombent pas juste.

> ⛔ **Certains calendriers sont REFUSÉS à l'enregistrement**, et ce n'est pas de la préciosité : un
> calendrier **sans mois**, ou dont le jour dure **zéro heure**, ne donne pas une date fausse — **il
> fige GM-OS**. L'horloge cherche l'année en bouclant, et ne s'arrête jamais. Le motif est toujours
> écrit en bas de l'écran.

> 💡 **L'édition à la main reste possible.** Les fichiers sont dans `databases/calendars/`, et un
> calendrier posé là est lu comme avant — mais s'il est mal formé, l'horloge refuse simplement de
> calculer une date plutôt que de se figer.

#### ⚠️ Ce que l'IA ne remplace pas

Elle rend des mois plausibles, ce qui est **exactement le piège** : onze mois au lieu de douze se lit
très bien. **Regardez la longueur de l'année avant d'enregistrer.** *Le modèle propose, le contrôle
relit, et c'est vous qui montrez.*

---

## 🎨 Les trois thèmes

Le thème habille le visualiseur **et les jauges**, chez vous comme chez les joueurs.

| Thème | Allure |
| :--- | :--- |
| **Moderne** | Épuré, typographie fine, accent de votre thème d'application. |
| **Cyberpunk** | Turquoise et rose, affichage digital, effets de glitch. |
| **Old Style** | Bronze et ambre, engrenages, chiffres romains. |

---

## ⏱️ Les jauges de tension

### Créer

Panneau de gauche, section **Nouvelle Jauge** :

1. **Nommez-la** — c'est le seul moyen de la reconnaître dans la grille.
2. Choisissez sa **forme** (voir ci-dessous).
3. Choisissez son **sens** : **Monte** ou **S'épuise** (voir juste en dessous).
4. Cliquez le nombre de segments : **+4, +6, +8, +10, +12**.

`Entrée` dans le champ crée directement une jauge de **6 segments**.

> 🔎 **Le nom est bien pris en compte, depuis le 2026-08-30.** Avant cette date, les boutons `+N`
> ne lisaient jamais le champ et fabriquaient toujours « Jauge 6 seg » : *deux chemins pour un même
> geste, et un seul lisait ce qu'on avait écrit.*

### ⭐ Les deux sens — ce qui monte, ce qui s'épuise

*Ajouté le 2026-09-15.* Jusque-là une jauge ne savait que **monter**. C'est faux pour la moitié de
ce qu'on veut suivre à une table : les vivres, les munitions, l'oxygène, la charge d'une batterie.

| Sens | Ce qu'elle raconte | Elle part… | Elle crie… |
| :--- | :--- | :--- | :--- |
| **Monte** | Alerte, rituel, compte à rebours | **vide** | quand elle est **pleine** |
| **S'épuise** | Vivres, munitions, oxygène, batterie | **pleine** | quand elle est **vide** |

> ⭐ **Ce n'est pas qu'une affaire de dessin.** Le sens change **quatre** choses d'un coup : l'état
> de départ, le moment où la jauge passe au rouge et se met à pulser, ce que fait le clic gauche, et
> la façon dont le compte rendu de séance la relit (« 2/6 **restants** »).

⚠️ **Vous pouvez changer d'avis après coup**, au survol de la carte. Si vous n'avez pas encore
touché à la jauge, elle se replace toute seule au départ de son nouveau sens ; dès qu'elle a compté
quelque chose, votre compte est gardé.

Une jauge créée avant ce réglage **monte**, et rien ne change pour elle.

### Les quatre formes

Chaque jauge a la sienne — une alerte des gardes n'a pas la même voix que des provisions qui
s'épuisent.

| Forme | Quand la choisir |
| :--- | :--- |
| **Anneau** | Le compte circulaire, l'idiome du jeu de rôle. C'est le défaut. |
| **Barre** | La seule qui reste lisible à dix ou douze segments. |
| **Points** | Le plus net à petite taille — pensé pour la tablette. |
| **Aiguille** | Un cadran : une pression qui monte, plutôt qu'un compte de coups. |

Une jauge créée avant l'arrivée de ce réglage est un anneau, et le reste.

### Faire monter, faire descendre

Sur la jauge elle-même, dans la grille :

⭐ **Le clic facile suit le sens de la jauge.**

| Geste | Sur une jauge qui **monte** | Sur une jauge qui **s'épuise** |
| :--- | :--- | :--- |
| **Clic gauche** | +1 segment | **−1 segment** (on consomme) |
| **Clic droit** *ou* **Maj + clic** | −1 segment | **+1 segment** (on rend) |

> ⚠️ **Oui, le geste s'inverse selon la jauge**, et c'est voulu : sur un consommable, le geste de
> la soirée est de consommer. *Un geste uniforme qui va dans le mauvais sens n'est pas plus simple,
> il est seulement plus régulier.* L'infobulle de la jauge rappelle toujours ce que fait le clic.

Et au survol de la carte, les commandes discrètes apparaissent :

- le choix de la **forme** ;
- le choix du **sens** — monte / s'épuise ;
- une **couleur** — ⚠️ elle ne change **que** l'apparence sur l'afficheur Ulanzi, pas sur vos
  écrans, qui gardent l'habillage du thème ;
- ⏫ **Remplir d'un coup** — pour un instrument qui *se vide*, et qui part donc de son maximum ;
- 📱 **Sur l'afficheur de table** — voir juste en dessous.

Une croix en haut de la carte supprime la jauge.

### ⭐ Le code couleur — voir venir, au lieu de constater

*Ajouté le 2026-09-15.* Une jauge change de couleur **à mesure qu'elle approche de son bout** — le
plein pour une jauge qui monte, le vide pour un consommable.

| Cran | Couleur | Où |
| :--- | :--- | :--- |
| Calme | la couleur du thème | plus de la moitié de la course devant soi |
| **Tension** | **orange** | à partir de la mi-course |
| **Urgence** | **rouge** | dans le dernier quart |
| Au bout | rouge **qui pulse** | c'est arrivé |

**Les seuils sont des fractions, pas des segments comptés** — pour qu'une jauge de 4 et une jauge de
12 s'alarment au même endroit de leur course :

| Total | Calme | 🟠 Orange | 🔴 Rouge | Pulsation |
| :--- | :--- | :--- | :--- | :--- |
| **4** | 4, 3 | 2 | 1 | 0 |
| **6** | 6, 5, 4 | 3, 2 | 1 | 0 |
| **12** | 12 … 7 | 6 … 4 | 3 … 1 | 0 |

> ⚠️ **Ça vaut dans les deux sens** : une alerte des gardes passe à l'orange à mi-course comme des
> vivres. *Deux jauges côte à côte doivent se lire avec la même grammaire de couleur.* Vos jauges
> existantes changent donc d'apparence — aucune donnée ne bouge, seulement la teinte.

> 🔎 **À zéro, un consommable teinte son creux** d'un rouge sourd. Sans ça, une jauge vide n'aurait
> plus aucun segment allumé à colorer, et l'épuisement serait presque invisible sur la barre et les
> points. *Ce n'est pas une jauge éteinte, c'est une jauge consommée.*

#### ⚠️ Sur l'afficheur Ulanzi, l'échelle est plus courte

Sur les 32 pixels, **l'orange est déjà la couleur de repos** d'une horloge sans couleur choisie. Le
cran de tension n'y est donc visible que pour les jauges à qui **vous avez donné une couleur** :
elles quittent la leur pour l'orange, puis passent au rouge.

Pour les autres, l'échelle a deux crans — mais vous y gagnez quand même : **le rouge arrive
désormais au dernier quart et non plus au bout.** *Un jaune et un orange ne se distinguent pas à
deux pixels de hauteur à travers une table ; une jauge qui prétend dire trois choses en dirait
zéro.*

> 💡 **Le remède, si vous voulez les trois crans sur la table** : donnez une couleur à la jauge
> (l'échantillon au survol de sa carte). C'est exactement à ça que ce réglage sert.

### ⭐ « Par scène » — l'usure automatique

Sous les commandes, un petit champ **Par scène**. Posez-y un nombre et, **chaque fois que vous
terminez une scène dans la Trame**, la jauge bouge toute seule :

- une jauge qui **s'épuise** perd ce nombre — *une ration par scène* ;
- une jauge qui **monte** le gagne — *un segment de rituel par scène*.

⚠️ **Le nombre se saisit toujours positif** : c'est le sens de la jauge qui décide de la
direction, et la légende à côté vous la montre (`−1` ou `+1`). Champ vide : les scènes ne lui font
rien, et c'est le cas de toutes vos jauges actuelles.

⚠️ **Le déclencheur est le bouton « Terminer » d'une scène**, dans la Trame — pas un bouton de
Clock-OS. Refermer une scène déjà close ne reprend rien une seconde fois. Chaque mouvement est
annoncé en bas de l'écran : *une jauge qui bouge sans que vous l'ayez touchée doit le dire.*

---

## 📡 Où part une jauge — deux réglages, pas un

C'est la subtilité du module, et elle n'était écrite nulle part.

| Réglage | Portée |
| :--- | :--- |
| Le bouton **Monitor** du visualiseur | L'**interrupteur général**. Éteint : ni horloge ni jauges, nulle part. |
| L'icône 📱 sur une jauge | Décide si **cette** jauge part sur l'**afficheur Ulanzi** — et seulement lui. |

> ⛔ **Le bouton Monitor ne parle pas qu'au Player Hub**, contrairement à ce que dit son
> infobulle (« Affiché sur le Player Hub ») et à ce que ce guide affirmait. Il commande **trois**
> destinations d'un coup : le Player Hub, **les tablettes des joueurs**, et **les jauges de
> l'afficheur Ulanzi**. Éteindre l'horloge pour vous concentrer éteint donc aussi l'instrument posé
> au milieu de la table. Relevé le 2026-09-04.

Le drapeau par jauge choisit **lesquelles** vont sur les 32 pixels de l'Ulanzi ; l'interrupteur
décide **si**. Une jauge sans ce réglage y va : *on retire une jauge de l'afficheur, on ne l'y
ajoute pas.*

---

## 🔧 Dépannage

| Problème | Ce qu'il faut regarder |
| :--- | :--- |
| **Les joueurs voient une jauge que je voulais garder** | L'œil au survol de la carte la referme, elle seule. *Cette ligne disait « il n'existe pas de jauge privée » : c'était vrai jusqu'au 2026-09-04, ça ne l'est plus.* |
| **Mes rations ont baissé sans que j'y touche** | Elle a un **Par scène**, et vous venez de terminer une scène. Videz le champ pour la détacher. |
| **Ma jauge de vivres crie alors qu'elle est pleine** | Son sens est resté sur **Monte**. Basculez-le sur **S'épuise** au survol de la carte. |
| **Ma jauge est orange alors que tout va bien** | Elle a passé la mi-course. C'est le code couleur, pas un défaut — voir le tableau des seuils. |
| **Sur l'Ulanzi, je ne vois pas l'orange** | Cette jauge n'a pas de couleur choisie, et l'orange y est déjà la couleur de repos. Donnez-lui une couleur. |
| **Mon calendrier ne s'enregistre pas** | Il porte une **faute** — le motif est écrit en bas de l'Atelier. Un calendrier sans mois figerait l'horloge. |
| **La date fantastique ne s'affiche plus** | Le calendrier actif est mal formé. Ouvrez-le dans l'Atelier : les fautes y sont listées. |
| **Mon calendrier ne démarre pas à la bonne année** | Renseignez **Année de départ** dans l'Atelier, puis resélectionnez le calendrier dans la liste. |
| **L'afficheur Ulanzi ne montre plus les jauges** | Le bouton **Monitor** est éteint : c'est le même interrupteur. |
| **Le minuteur affiche `00:00` en rouge alors que je ne l'ai pas lancé** | Il a été configuré puis vidé. Un minuteur jamais configuré reste neutre. |
| **Aucun calendrier dans la liste** | Le mode fantastique lit `databases/calendars/`. Un seul y est livré. |
| **Ma jauge s'appelle « Jauge 6 seg »** | Le nom se saisit **avant** de cliquer `+N`. |
| **La couleur choisie ne change rien à l'écran** | Normal : elle ne vaut que pour l'afficheur Ulanzi. |

---

> [!TIP]
> **Le secret des jauges** : servez-vous-en aussi pour les objectifs des joueurs — « Piratage de la
> console », « Réparation du moteur » — et pas seulement pour les menaces. Une progression qu'on
> voit avancer vaut tous les discours — et pour celles-là, laissez l'œil ouvert.

---

*Guide refait le 2026-09-04, code à l'appui. Trois choses qui n'y étaient pas : les **quatre formes**
de jauge, le **réglage par jauge** pour l'afficheur de table, et le fait — le plus important — que
les jauges partaient chez les joueurs, toutes ou aucune, et par défaut. Une affirmation corrigée :
le bouton de projection ne commande pas que le Player Hub.*

*Ce dernier point a été **tranché et construit le soir même** : chaque jauge porte désormais son
œil, et une jauge neuve naît fermée.*
