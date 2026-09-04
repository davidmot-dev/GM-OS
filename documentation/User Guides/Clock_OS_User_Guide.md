# ⏳ Guide : Clock-OS, le temps et la tension

Clock-OS fait deux choses qui n'ont l'air d'en être qu'une : il **affiche le temps** — réel, figé,
compté à rebours, ou celui d'un calendrier inventé — et il tient vos **jauges de tension**, ces
horloges de *Blades in the Dark* qui montent pendant que les joueurs hésitent.

L'écran est en trois zones : la **configuration** à gauche, le **visualiseur** au centre, et la
**grille des jauges** en bas.

---

## ⚠️ La chose à savoir avant de créer une jauge

**Vos jauges de tension sont visibles par vos joueurs. Toutes, et par défaut.**

Le bouton **Monitor**, en haut à droite du visualiseur, est allumé au démarrage. Tant qu'il l'est,
chaque jauge que vous posez apparaît sur le Player Hub **et sur les tablettes** — son nom, sa forme,
et son compte (`3 / 6`).

Il n'y a **pas de réglage jauge par jauge** pour les joueurs : c'est tout ou rien. Une jauge secrète
n'est donc possible qu'en éteignant le bouton, ce qui masque aussi l'horloge et toutes les autres.

> 🔎 **Ce n'est pas forcément un défaut** — dans *Blades in the Dark*, les horloges sont publiques,
> et c'est précisément ce qui les rend angoissantes. Mais il faut le savoir avant de nommer une
> jauge « Le traître frappe ».

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
vingt-quatre. Pour votre monde, copiez `harptos.json` et modifiez-le.

Année, mois, jour et heure se règlent ensuite dans le panneau de gauche.

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
3. Cliquez le nombre de segments : **+4, +6, +8, +10, +12**.

`Entrée` dans le champ crée directement une jauge de **6 segments**.

> 🔎 **Le nom est bien pris en compte, depuis le 2026-08-30.** Avant cette date, les boutons `+N`
> ne lisaient jamais le champ et fabriquaient toujours « Jauge 6 seg » : *deux chemins pour un même
> geste, et un seul lisait ce qu'on avait écrit.*

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

| Geste | Effet |
| :--- | :--- |
| **Clic gauche** | +1 segment |
| **Clic droit** *ou* **Maj + clic** | −1 segment |

Et au survol de la carte, quatre commandes discrètes apparaissent :

- le choix de la **forme** ;
- une **couleur** — ⚠️ elle ne change **que** l'apparence sur l'afficheur Ulanzi, pas sur vos
  écrans, qui gardent l'habillage du thème ;
- ⏫ **Remplir d'un coup** — pour un instrument qui *se vide*, et qui part donc de son maximum ;
- 📱 **Sur l'afficheur de table** — voir juste en dessous.

Une croix en haut de la carte supprime la jauge.

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
| **Les joueurs voient une jauge que je voulais garder** | Il n'existe pas de jauge privée. Le seul recours est le bouton **Monitor**, qui masque tout. |
| **L'afficheur Ulanzi ne montre plus les jauges** | Le bouton **Monitor** est éteint : c'est le même interrupteur. |
| **Le minuteur affiche `00:00` en rouge alors que je ne l'ai pas lancé** | Il a été configuré puis vidé. Un minuteur jamais configuré reste neutre. |
| **Aucun calendrier dans la liste** | Le mode fantastique lit `databases/calendars/`. Un seul y est livré. |
| **Ma jauge s'appelle « Jauge 6 seg »** | Le nom se saisit **avant** de cliquer `+N`. |
| **La couleur choisie ne change rien à l'écran** | Normal : elle ne vaut que pour l'afficheur Ulanzi. |

---

> [!TIP]
> **Le secret des jauges** : servez-vous-en aussi pour les objectifs des joueurs — « Piratage de la
> console », « Réparation du moteur » — et pas seulement pour les menaces. Une progression qu'on
> voit avancer vaut tous les discours. Et puisqu'elles sont publiques, c'est le bon usage.

---

*Guide refait le 2026-09-04, code à l'appui. Trois choses qui n'y étaient pas : les **quatre formes**
de jauge, le **réglage par jauge** pour l'afficheur de table, et le fait — le plus important —
que **les jauges partent chez les joueurs, toutes ou aucune, et par défaut**. Une affirmation
corrigée : le bouton de projection ne commande pas que le Player Hub.*
