# ✨ Jeu — Nephilim Légende

> **Pilote décrit :** « Nephilim », exporté le 2026-10-17 et corrigé le jour même (jet en degrés
> × 10, Seuil RK, santé, fiche alignée sur la fiche HTML). Retour à
> [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Un **d100 sous une cible en degrés** : le Vécu, plus le Ka de l'approche, multipliés par dix. Autour :
la **Traque** des Arcanes Mineurs, qui plafonne au **Seuil RK** du lieu, les trois **Chutes**, et une
santé en **cases temporaires** puis en **Conséquences**.

> Règles relues contre le corpus du jeu, `docs/systems/nephilim/rules/` (« Résolution des jets »,
> « Santé et blessures », « Initiative », « Monnaie de table », « Jauges et ressources
> individuelles »). Carnet NotebookLM : « Nephilim ».

---

## Le jet

![Le panneau de jet de Nephilim : le Vécu « Templier » 4 et l'approche du Feu 5, soit 90 %](captures/jeu-nephilim-jet.jpg)

- **Vécu** : le menu propose les Vécus **par leur nom**, tel qu'il est écrit sur la fiche
  (« Templier (4) », « Infirmière (5) »). Le Vécu contemporain du Simulacre vient en tête ; un
  Vécu dont le nom n'est pas écrit n'apparaît pas.
- **Approche (Ka)** : facultative. Le Ka-élément de l'approche s'ajoute au Vécu ; « — aucune — »
  lance le Vécu seul.
- **Les chances** : (Vécu + Ka) × 10, dites sous les menus — `(4 + 5) × 10 = 90 %`.
- **Difficulté** : les **circonstances, en degrés**. Le livre va de −5 (difficulté extrême) à +5
  (facilité extrême). Le curseur va plus loin, parce qu'il sert aussi à Rêves de Dragons : restez
  entre −5 et +5.

![Après le lancer : 86 contre 90, une réussite de marge 8](captures/jeu-nephilim-jet-lance.jpg)

Après le lancer :

| Le dé | Ce que dit GM-OS |
| :--- | :--- |
| Sous ou égal à la cible | **Réussite**, avec sa **marge** : le chiffre des dizaines (« 86 » → marge 8) |
| Un **double** réussi (11, 22… 99) | **Réussite critique** |
| Au-dessus de la cible | **Échec** |
| Un **double** raté, ou **00** | **Maladresse** — le 00 échoue toujours, même au-delà de 100 % |

Au-delà de dix degrés (une cible de plus de 100 %), chaque degré en trop **ajoute un point à la
marge**, et GM-OS le dit sous les chances.

---

## La Traque et le Seuil RK

![Le bandeau : Seuil RK 4, Jauge de Traque 3 sur 4, Intensité de la Traque 2](captures/jeu-nephilim-reserves.jpg)

Trois réserves au bandeau :

| Réserve | À qui | Ce qu'elle fait |
| :--- | :--- | :--- |
| **Seuil RK** | au meneur, de 2 à 9 | La tolérance occulte du **lieu** : 2–3 zone surveillée, 8–9 zone sauvage. **Réglez-la en changeant de lieu** |
| **Jauge de Traque** | aux joueurs | Elle a **autant de cases que le Seuil RK**. À ce seuil, elle se vide et l'Intensité monte d'un cran |
| **Intensité de la Traque** | au meneur, de 1 à 5 | 1 : aucun interdit · 2 : un Vécu ou une approche sacrifiés · 3 : un élément interdit · 4 : une discipline bloquée · 5 : Pentacle interdit |

La Traque monte d'un jeton par scène d'approche, de Science occulte, de Vécu passé ou de recherche
au-delà du Seuil RK : c'est vous qui l'ajoutez, GM-OS ne devine pas une scène.

---

## Combat et santé

![La carte de combat : trois cases temporaires cochées, puis une Conséquence mineure (−2) ; les Chutes en dessous](captures/jeu-nephilim-sante.jpg)

- **Initiative** : Ka-Eau × 2. L'option du livre (+1d6, « initiative variable ») reste à la table.
- **Santé physique** en six cases : les **trois cases temporaires**, puis **Conséquence mineure
  (−2)**, **sérieuse (−4)**, **grave (−6)**. Le livre fait choisir au joueur une case de valeur
  égale ou supérieure aux dommages ; GM-OS ne connaît pas cette valeur : **cochez à la main**, avec
  « Dégâts » et « Soins ».
- Le malus d'une Conséquence n'est **pas retiré seul** au jet : passez-le en circonstances.
- **Les Chutes** — Khaïba, Ombre, Narcose, de 0 à 10 — sont des jauges sur la carte. Leurs seuils
  (5–7, 8–9, 10) restent à la table.

---

## La fiche de personnage

La fiche GM-OS reprend **exactement les clés de la fiche HTML** « Nephilim Légende — fiche de
personnage (2 pages) » (gabarit `nephilim-legende-fr`, dans le moteur de fiches depuis le
2026-10-17) : ce qu'on saisit sur l'une remonte sur l'autre. Seuls restent à part le portrait et les
reports de la page 2, qui recopient la page 1.

Les Vécus se remplissent en deux colonnes : le **nom** (« Templier ») et le **degré** (4). C'est le
nom qui apparaît au jet.

---

## Ce qui reste à la main

- Une **maladresse avec le Vécu contemporain** coûte un degré d'**Ombre** : GM-OS dit la
  maladresse, l'Ombre se coche à la main.
- Les **Points de Sapience** (priorité d'initiative, Effets Mnémos), la **Stase** et son plafond au
  Ka dominant, les **Materiae Primae**.
- Les **sciences occultes** : la fiche les porte, aucun jet de sort n'est modélisé.
