# 🟥 Afficheur Ulanzi

Un petit afficheur **32 × 8 pixels** posé sur la table, qui montre l'état de la partie sans que
personne n'ait à regarder un écran d'ordinateur. GM-OS y pousse des **widgets** qui défilent.

---

## 1. Ce que 32 × 8 permet — et interdit

Huit pixels de haut, c'est **une ligne de chiffres**. Pas une phrase, pas un paragraphe : un
nombre, une barre, une icône.

Toutes les idées de widget se ramènent à **quatre types** :

| Type | Ce qu'il montre |
| :--- | :--- |
| **jauge** | Une réserve qui monte et descend. |
| **compte à rebours** | Ce qu'il reste de temps. |
| **rang** | Une position dans une échelle. |
| **icône d'état** | Un fait, présent ou absent. |

> ⭐ **Miroir contre instrument.** Un widget *miroir* montre ce qui vit déjà dans GM-OS — l'horloge
> de tension, le minuteur, une réserve du pilote. Un widget *instrument* est piloté depuis
> l'afficheur lui-même. **Les miroirs sont la règle** : ce qui est déjà décidé ailleurs ne doit
> pas avoir deux maîtres.

## 2. Les six widgets

| Widget | Ce qu'il affiche | Étagère |
| :--- | :--- | :--- |
| **Défilé des Quarts** | Les quarts de *Blade Runner*, avec une couleur par moment du jour et la barre des consécutifs. | composé |
| **Horloges** | Les horloges de tension de Clock-OS. | miroir |
| **Minuteur** | Le minuteur en cours. | miroir |
| **Heure du monde** | L'heure de fiction. | générique |
| **Réserves des pilotes** | Les réserves de table du jeu. | miroir |
| **Signal Voight-Kampff** | Un niveau, de bas en haut. | composé |

**Deux étagères, et la différence compte** :

- **Générique** — un des quatre types, nourri par une source déclarée. Ajouter un jeu de plus coûte
  **zéro ligne de code**.
- **Composé** — un dessin qui lui est propre. Ça coûte du code, et il faut le justifier. Le défilé
  des Quarts en est un : ses noms, ses couleurs et sa barre sont propres à Blade Runner. *C'est le
  prix d'un objet qui dit vraiment quelque chose sur 32 × 8.*

Choisissez-en plusieurs : **ils défilent**.

## 3. Deux règles d'affichage qui valent au-delà de ce module

- **Une sélection absente n'est pas une sélection vide.** Un widget dont la source disparaît
  s'affiche **indisponible** ; il ne s'évapore jamais. Une disparition silencieuse se lit comme une
  panne de l'appareil.
- **On ne rend pas réglable ce qui dit quelque chose.** La couleur d'un widget qui code une
  information — rouge = danger — n'est pas un goût.
- **Le caviardage se fait à la source.** Ce qu'un joueur ne doit pas voir ne part pas vers
  l'afficheur ; on ne compte pas sur l'affichage pour le cacher.

## 4. Quand l'écran reste noir

> ⛔ **Un écran noir n'est presque jamais une panne de l'appareil.** Deux réglages en décident, et
> ils vivent **en mémoire flash** — un redémarrage n'y change rien :
>
> - `/api/settings` — les réglages de l'appareil.
> - `/api/loop` — ce qui défile. **`loop={}` veut dire « rien à afficher »**, jamais « en panne ».

Deux autres causes rencontrées en vrai :

- **Un appareil qui vient de démarrer refuse les écritures.** Laissez-lui le temps.
- **Une seconde prise de main** sur un appareil déjà muet empoisonne la routine : un seul maître à
  la fois.

## 5. Les icônes animées

L'appareil expose un **système de fichiers** et sait animer tout seul. Une icône **GIF 32 × 8**
déposée dans son dossier `ICONS` est jouée **par l'appareil**, à pleine vitesse et **sans aucun
trafic réseau**.

> ⚠️ **« Elles restent en flash » ne veut pas dire « elles seront là ».** Le 31/08, le dossier
> `ICONS` s'était vidé tout seul — cadre noir alors que le widget était bien poussé. Le dépôt des
> icônes est donc devenu une **veille** : GM-OS vérifie et redépose.

**Débit mesuré** : lecture ≈ 34 ms, écriture ≈ 150 ms à coût fixe.

## 6. Ce qui n'est pas possible

**Les boutons physiques de l'appareil sont garés.** Mesuré sur le firmware 0.98 : rien en HTTP.
Seul MQTT les expose, et il ne se configure que sur le portail de l'appareil — un courtier MQTT
serait un service de plus à faire vivre.

---

## 💡 Ce qu'il faut retenir

- **Des nombres et des barres, jamais des phrases.** C'est la contrainte qui décide de tout.
- **Plusieurs widgets défilent** ; le catalogue se choisit par jeu.
- **Écran noir → regardez `/api/settings` et `/api/loop`** avant de soupçonner le matériel.
- La conception détaillée vit dans
  [`Planning/2026-08-23-afficheur-ulanzi.md`](../Planning/2026-08-23-afficheur-ulanzi.md).

---

*Guide écrit le 2026-09-04. Le défilé des Quarts a été éprouvé en partie réelle le 2026-08-30 ; la
librairie et les six widgets datent des 30-31/08.*
