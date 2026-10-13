# 🌌 Jeu — NOC

> **Pilote décrit :** « NOC », exporté le 2026-10-13. Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Les Héros résistent dans un monde enfermé dans l'Artefact. Trois choses rendent ce jeu différent
dans GM-OS : les **dés de destin**, le **Fiel** qui déborde en **Menace**, et la **Cabale**, la
cellule commune à toute la table.

---

## Le Fiel et la Menace — le bandeau des réserves

![Le bandeau de NOC : le Fiel en cinq segments, la Menace sans plafond, et les gestes « Début de séance » et « Nouveau scénario »](captures/jeu-noc-reserves.jpg)

| Réserve | Ce qu'elle fait dans GM-OS |
| :--- | :--- |
| **Fiel** (0 à 5) | Une goutte par 1 sur un dé de destin. Les joueurs la voient et la font monter eux-mêmes, depuis leur tablette. **À la cinquième goutte, la jauge se vide et la Menace monte de 1** ; un message le dit, c'est le moment où la Loi applique autant d'effets du Fiel que la Menace |
| **Menace** (sans plafond) | Aux mains de la Loi, visible des joueurs. **« Début de séance »** lui retire un point ; **« Nouveau scénario »** la remet à zéro |

> ⚠️ **Les gouttes ne s'ajoutent pas seules** quand un dé de destin fait 1 : on clique sur le + du
> Fiel. L'automatiser au panneau de jet est gardé pour plus tard (décision du 2026-10-13).

Si le Fiel est à 4 et reçoit 3 gouttes, la jauge se vide une fois et **reste à 2** : les gouttes
se posent une à une. Les règles ne tranchent pas ce cas.

---

## Le jet — les dés de destin

![Le panneau de jet de NOC : le Domaine retenu, la réserve, et la section « Puiser dans la Cabale »](captures/jeu-noc-jet.jpg)

- On retient un **Domaine** sur la fiche du Héros : il donne autant de d10.
- Chaque **8, 9 ou 10** est une réussite, et un **10 fait lancer un dé de plus** (le livre le dit
  facultatif : un dé de trop se retire à la voix).
- Le panneau compte les réussites. **Comparer le niveau de Talent, plus les réussites, à la
  difficulté reste votre geste** : le pilote ne demande pas encore le Talent.

---

## La Cabale — la fiche du groupe

La Cabale est **un personnage de plus, commun à toute la table** (règle :
`docs/systems/noc/rules/la-cabale.md`). Sa fiche appartient à la campagne.

![La carte de campagne, et son bouton « Cabale — Fiche du groupe »](captures/jeu-noc-carte-de-campagne.jpg)

- **Chez vous :** le bouton **Cabale** de la carte de campagne, dans le cockpit, ouvre sa feuille.
  La première fois, **« Créer une fiche pour Cabale »**.
- **Sur une tablette :** le bouton **Cabale**, à côté de « Ma fiche ». Ce que le joueur y écrit
  remonte chez vous.
- Son **nom** est celui qu'on écrit dans le champ « Nom » de la feuille.

![La feuille de Cabale ouverte dans GM-OS : identité, sept Domaines et leurs Atouts, réserves et jauges de péril autour de l'étoile](captures/jeu-noc-fiche-du-groupe.jpg)

### Puiser dans la Cabale

Au panneau de jet, la section **« Puiser dans la Cabale »** offre quatre apports :

| Apport | Ce qu'il donne | D'où il est pris |
| :--- | :--- | :--- |
| **Dés de la Cabale** | 1 dé par point | Le Domaine de la Cabale qui correspond au Domaine retenu par le Héros. **Rechargé par « Nouveau scénario »** |
| **Espoir de la Cabale** | 3 dés par point | La piste Espoir de la feuille, qui descend |
| **Vécu de la Cabale** | +1 au résultat | La piste Vécu de la feuille, qui descend |
| **Atout de la Cabale** | +1 au résultat | L'Atout choisi dans la liste (seuls les Atouts garnis sont proposés). **Rechargé par « Nouveau scénario »**. Une Faille (Atout à −1) ne fournit rien |

![Après le lancer : huit dés (trois du Domaine, deux de la Cabale, trois pour un point d'Espoir), et ce qui a été puisé](captures/jeu-noc-jet-lance.jpg)

> ⚠️ **Règles prises de la note NotebookLM, non relues** : la recharge des Domaines et des Atouts à
> chaque scénario, et le +1 d'un point d'Atout. Si le livre dit autre chose, c'est le pilote qui
> change, pas le code.

---

## Combat et santé — les dix cases Blessures

![La carte de combattant d'un Héros : dix cases Blessures, six cochées, les seuils Choqué, Lourdement blessé et Agonie, et en dessous Trauma, Traque et Noirceur](captures/jeu-noc-sante.jpg)

- **Santé : la jauge Blessures, dix cases** qu'on coche de gauche à droite. Un coup en coche autant
  que ses dégâts ; « Soins » en décoche.
  - à **5** cases : **Choqué** (−1 à tous les Domaines) ;
  - à **8** : **Lourdement blessé** (−1 aux Talents, un point permanent) ;
  - à **10** : **Agonie**, puis la mort en dix minutes.
- **La jauge « Blessures » de la fiche suit les cases** : ce qu'on coche au combat s'y reporte, sur
  la fiche HTML comme sur la tablette.
- **Trauma, Traque et Noirceur** sont suivis sur chaque carte de combattant.
- **Initiative :** l'Instinct, du plus haut au plus bas.
- **Types de dégâts :** Choc, Perforant, Tranchant, Multiple, Quantique, Énergie noire, Chutes,
  Brûlures, Asphyxie, Poisons.

---

## Ce qui manque encore

- **Le Talent n'entre pas dans le jet**, et la difficulté n'est pas réglable : le panneau compte les
  réussites des dés de destin, rien de plus.
- **Le 1 qui verse une goutte de Fiel** n'est pas fait par le panneau (gardé pour plus tard) : il
  s'affiche « fléau » sous le jet, et chacun est une goutte à poser d'un clic sur le + du Fiel.
- **Les malus de seuil** (−1 aux Domaines quand on est Choqué, −1 aux Talents au-delà) ne
  s'appliquent pas tout seuls au jet : l'état s'affiche, le malus reste votre geste.
- **Un Héros né avant le 2026-10-13** a des points de vie : sur sa carte de combattant, cliquer sur
  le nom du moteur de santé (« Points de Vie », en haut à gauche du bloc) fait défiler les modèles —
  quatre clics mènent aux dix cases Blessures.
- **Le Soupçon** (Cabale Dykovienne) n'est pas sur la fiche.
