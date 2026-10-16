# 🐙 Jeu — Cthulhu Hack

> **Pilote décrit :** « Cthulhu Hack », exporté le 2026-10-16 et corrigé le jour même (Fortune, suites du déclin, Matériel, Hors Jeu). Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Deux gestes : la **Sauvegarde**, un d20 sous la caractéristique, et les **dés d'usure**, des
ressources qui sont des dés et qui s'épuisent. Autour d'eux : la **Fortune**, la **Folie
passagère** et le **Choc**, le **Hors Jeu**.

> Règles relues contre le carnet NotebookLM « Cthulhu Hack » le 2026-10-16 (sections « Fortune »,
> « Folie passagère », « Chocs », « Hors Jeu », « Conséquences du Hors Jeu », « Matériel et
> Richesse »). Les trois tables sont dans Table-OS, univers **Cthulhu Hack** : `folies_passageres`,
> `chocs`, `consequences_du_hors_jeu`.

---

## La Sauvegarde

![Le panneau de jet de Cthulhu Hack : une Sauvegarde de Sagesse, seuil 15](captures/jeu-cthulhu-hack-jet.jpg)

- On retient une **caractéristique** : sa valeur est le seuil.
- On lance **1d20** : **sous ou égal au seuil**, la Sauvegarde réussit. Un **1** est un critique,
  un **20** une complication.
- **Avantage / Désavantage** : deux dés, on garde le meilleur ou le moins bon.

![Après le lancer](captures/jeu-cthulhu-hack-jet-lance.jpg)

---

## La Fortune

Règle optionnelle du livre : le joueur **place** des jetons sur sa fiche (champ **Fortune**), et
n'en a **jamais plus de deux**.

| Après un jet raté | Jetons placés | Possible si la fiche en porte |
| :--- | :--- | :--- |
| **Relancer** la Sauvegarde ou la Ressource | 1 | 0 ou 1 |
| **Réussir** la Sauvegarde ou la Ressource | 2 | 0 |

- **Sur la fiche** (panneau de jet, chez vous ou sur la tablette) : sous une Sauvegarde ratée, les
  boutons **« Relancer (+1 Fortune) »** et **« Réussir (+2 Fortune) »**.
- **Au pupitre** : sous le dernier jet venu d'une fiche — une Sauvegarde demandée depuis la
  tablette, une ressource lancée depuis la carte de combat ou le pupitre — les mêmes deux boutons.
  Une **ressource** sauvée retrouve d'abord le dé qu'elle venait de perdre ; relancée, elle peut
  redescendre.
- **Le meneur défausse** un ou deux jetons quand il le veut (champ Fortune, à la main) pour une
  complication : *1 jeton* — relancer un test réussi sans Désavantage, un innocent en danger, un
  sombre secret ; *2 jetons* — relancer un test réussi avec Désavantage, un **Choc** sans perte de
  Santé mentale, une nouvelle menace. La fiche s'en libère.

---

## Les dés d'usure

**Santé mentale, Torche, Bagou, Richesse** — et le **Matériel** : chacun est **un dé**, écrit sur
la fiche (« d8 »).

- On la lance quand on la sollicite. **Un 1 ou un 2 la fait descendre d'un cran** : d20 → d12 →
  d10 → d8 → d6 → d4 → épuisée.
- Le nouveau dé **s'écrit tout seul sur la fiche**.
- **Chez vous :** le mode « usure » de [Dice-OS](./34-Dice-OS-le-pupitre.md), ou le bouton de la
  ressource sur la carte de combat.
- **Sur la tablette :** les joueurs ont deux rangées de boutons, **Sauvegardes** et
  **Ressources**. Le jet part chez vous : vous le voyez, et il entre au journal.

### Folie passagère ou Choc

Quand la **Santé mentale** descend d'un cran, le pupitre propose **« Folie passagère »** et
**« Choc »** sous le jet : le livre applique la Folie passagère, et laisse au meneur le choix du
Choc, plus court. Le bouton tire **1d6** dans la table et écrit le résultat à l'historique et au
journal (« 6 — Hurlement : Attire immédiatement l'attention »). Une seule suite par jet.

### Le Matériel

La fiche porte **quatre emplacements** (section « Matériel ») : le **nom** de l'objet et son
**dé**, de d4 à d20 (d8 pour l'équipement standard). Un emplacement nommé devient une ressource
comme la Torche — sur la tablette, au pupitre. Le livre dit **quand** le tester : au premier moment
calme après usage, à la fin d'un combat pour une arme, chaque jour pour des rations, à chaque usage
pour des jumelles. Une **armure** qui descend perd aussi 1 point de protection : à la main.

---

## Combat et santé

- **Santé :** points de vie (PV).
- **Ressources suivies :** Santé mentale, Torche, Bagou, Richesse.
- **Hors Jeu.** À **0 PV**, la carte du personnage montre **« Tirer les conséquences »** : 1d10
  dans la table des Conséquences (9+ Essoufflé, 8 Titubant, 7 Commotion, 6 Inconscient, 5 Os brisés,
  4 Estropié, 3 Ravagé, 2 Détruit, 1 Mort). La règle dit de tirer **une fois le danger écarté** :
  vous choisissez le moment. Puis **« S'il survit : récupérer 1d4 PV »**, qui passe par la santé
  comme un soin. Les pertes définitives de Sauvegardes s'écrivent à la main.
- La fiche HTML de Cthulhu Hack se relie à son personnage GM-OS : voir
  [Fiche de personnage HTML](./63-Fiche-de-personnage-HTML.md).

---

## Ce qui reste à la main

- La **défausse** des jetons de Fortune par le meneur, et ses effets.
- La **variante Pulp** du Hors Jeu (tirer dès la chute, puis à chaque blessure avec −1 cumulé).
- La **perte de protection** d'une armure qui descend, et les **Sauvegardes perdues** d'un Hors Jeu.
- Les durées des Chocs et des Folies (Moments, minutes, heures) ne se comptent pas.
