# 🎮 Guide : l'habillage des cartes de combat

Les cartes de Combat-OS ne se ressemblent pas d'un jeu à l'autre. Un pilote peut décider de
l'allure de ses jauges et de la disposition de l'initiative.

---

## 🌈 Les trois styles de jauge

| Style | Rendu | Pour quoi |
| :--- | :--- | :--- |
| **`bar`** *(défaut)* | Une barre pleine qui se vide | Points de vie, ressources continues |
| **`segmented`** | Dix cases discrètes | Stress, blessures, tout ce qui se compte en cases |
| **`neon`** | Une barre avec halo lumineux | Cyberpunk, science-fiction |

Sans configuration, c'est `bar`.

> ⛔ **La couleur que vous déclarez n'est pas appliquée.** Seul le style `bar` la lit — et
> **seulement si elle est écrite en classe Tailwind** (`bg-red-500`). En `segmented` et en `neon`,
> la couleur d'accent du thème est employée quoi qu'il arrive.
>
> Le problème est concret : **l'exemple que la Forge elle-même produit** combine
> `"style": "segmented"` et `"color": "#d97706"` — un style et un format de couleur qui, ensemble,
> garantissent que la couleur sera ignorée. Relevé le 2026-09-04.

---

## 📐 L'initiative : liste ou grille

- **`list`** *(défaut)* — une colonne. Lisible pour cinq ou six combattants.
- **`grid`** — plusieurs colonnes, pour voir vingt adversaires sans défiler.

---

## 🎚️ Les ressources sur une carte

Une ressource déclarée par le pilote — Santé mentale, Mana, Détermination — s'affiche sous les
points de vie du combattant.

**Deux chemins**, selon ce que le pilote contient :

- **avec `ui_config.gauges`** : chaque jauge a son style ;
- **sans** : repli sur `combat.statsToTrack`, toutes en **segments**, sur une échelle de dix.

> 🔎 **Une jauge se règle au clic**, ce qu'aucun guide ne disait : **clic gauche −1**, **clic droit
> +1**. C'est le geste le plus rapide pour suivre une Santé mentale qui s'effrite.

---

## 🛠️ Le régler à la main

Dans l'éditeur du pilote, l'objet `ui_config` :

```json
"ui_config": {
  "gauges": [
    { "fieldId": "hp",     "label": "PV",     "style": "bar",       "color": "bg-red-500" },
    { "fieldId": "stress", "label": "Stress", "style": "segmented", "color": "bg-amber-500" }
  ],
  "initiativeStyle": "grid"
}
```

> [!TIP]
> **Écrivez les couleurs en classes Tailwind** (`bg-red-500`, `bg-amber-500`), pas en
> hexadécimal — c'est la seule forme que le rendu sache lire, et seulement sur le style `bar`.

---

## 🤖 Ce que la Forge configure

En dérivant un système, la Forge propose un `ui_config` d'après le genre du jeu : des segments pour
le Stress d'un jeu d'horreur, une disposition d'initiative adaptée au nombre de combattants
habituel.

C'est une proposition. Relisez-la dans l'éditeur : c'est cinq lignes de JSON, et c'est ce qui donne
à un système son allure propre.

---

*Guide révisé le 2026-09-04, code à l'appui. Les trois styles et les deux dispositions existent bien
— mais **la couleur déclarée n'est appliquée que sur le style `bar`, et seulement en classe
Tailwind**, ce qu'aucune page ne disait et que l'exemple de la Forge contredit. Ajouté : le réglage
d'une jauge au clic.*
