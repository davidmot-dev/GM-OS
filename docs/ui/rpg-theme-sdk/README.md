# RPG Theme SDK — v2

Sépare le **core fonctionnel** des **skins visuels**. Le HTML ne change jamais
selon le jeu ; seul `data-theme` sur `<html>` change.

```text
RPG_THEME_SDK/
├── core/       rpg-core.css · rpg-theme-switcher.js
├── themes/     alien.css · noc.css · star-trek.css · themes.json
├── reference/  preview.html
└── docs/       README.md
```

---

## 1. Deux consommateurs, et ils ne reçoivent pas la même chose

C'est la distinction qui manquait à la v1, et sans elle on attend du thème ce
qu'il ne peut pas donner.

| Ce que le SDK fournit | Interface de l'application | Fiches et documents |
| --- | --- | --- |
| Les **22 jetons de thème** | ✅ presque en entier | ✅ |
| `rpg-button` `rpg-input` `rpg-select` `rpg-textarea` | ✅ | ✅ |
| `rpg-stat` `rpg-meter` `rpg-check` `rpg-field` `rpg-table` | 🟠 selon les écrans | ✅ |
| `rpg-page` `rpg-header` `rpg-footer` `rpg-page-chip` `rpg-kicker` `rpg-callout` | ❌ sans objet | ✅ |

Le vocabulaire de composants est celui d'une **page de livre** — il vient de
maquettes de manuels. Une application de type cockpit (modules ancrés, cartes de
combattant, barres d'outils) en prend les **couleurs, les polices, les rayons et
la polarité**, pas la mise en page.

**Conséquence pratique : ne pas s'attendre à ce que l'interface ressemble à la
preview.** Aller plus loin est un travail sur les composants de l'application,
pas sur la CSS du thème.

---

## 2. Trois catégories de variables — ne pas les confondre

**a. Les 22 jetons de thème** — un thème DOIT les définir tous.

```text
Couleurs (12)    bg · surface · surface-2 · paper · ink · text · muted
                 accent · accent-2 · accent-contrast · border · border-soft
Typographie (4)  font-display · font-body · font-ui · font-mono
Formes (5)       radius-sm · radius-md · radius-lg · shadow
                 title-tracking · kicker-tracking
Polarité (1)     color-scheme: dark | light
```

`color-scheme` **n'est pas optionnel** : sans lui les `<select>`, les
défilements et les champs natifs d'un thème clair s'affichent en sombre. Les
trois thèmes le déclarent déjà.

**b. Les 3 constantes du core** — `content-width`, `gutter`, `transition`.
Aucun des trois thèmes ne les surcharge : ce sont des réglages de mise en page
communs, **pas des obligations de thème**. Un thème peut les surcharger, il n'a
pas à les déclarer.

**c. Les variables d'instance** — posées sur un élément, pas sur `:root` :

```html
<div class="rpg-meter" style="--rpg-meter-value: 62%">
```

Elles n'appartiennent pas au thème et ne doivent pas figurer dans un fichier de
thème.

### Le cas `--rpg-accent-2`

**Le core ne le lit jamais.** Seuls les thèmes s'en servent dans leurs propres
surcharges — NOC cinq fois, Star Trek deux, ALIEN pas du tout, bien qu'il le
déclare.

C'est légitime, mais il faut le savoir : `accent-2` est un **jeton à l'usage des
thèmes**, pas un jeton que le core promet d'honorer. Un auteur qui le définit en
espérant colorer un composant partagé n'obtiendra rien.

---

## 3. Un seul endroit déclare les thèmes

En v1 la liste vivait à **quatre endroits** : `VALID_THEMES` dans le switcher,
`themes.json`, les `<link>` de la preview et ses `<option>`. Ajouter un jeu
demandait quatre modifications, et en oublier une **échouait en silence** — le
switcher retombait sur `alien` sans rien dire.

Désormais **les `<link>` font foi** :

```html
<link rel="stylesheet" href="../themes/blade-runner.css"
      data-rpg-theme="blade-runner" data-rpg-name="Blade Runner">
```

Le switcher en déduit la liste valide **et remplit les `<select>` tout seul**.
C'est la seule source qui ne peut pas mentir : un thème dont la CSS n'est pas
chargée ne peut pas s'appliquer, quoi qu'en dise un registre. Et un identifiant
inconnu **avertit en console** au lieu de retomber muettement sur le défaut.

`themes.json` reste le registre destiné à l'application hôte — métadonnées,
noms, versions. Il ne pilote plus le switcher.

---

## 4. Ajouter un thème

1. Copier un thème existant, renommer l'identifiant `data-theme`.
2. Définir les **22 jetons**, `color-scheme` compris.
3. N'ajouter que les surcharges visuelles nécessaires, toutes scopées
   `:root[data-theme="mon-jeu"] .rpg-*`.
4. Ne **jamais** créer `.monjeu-button`, `.monjeu-panel`, etc.
5. Ajouter la balise `<link data-rpg-theme>` à la preview.
6. Compléter `themes.json` si l'application hôte s'en sert.

### La règle qui empêche le contrat d'enfler

**Un jeton entre au contrat quand un *deuxième* jeu en a besoin.** Tant qu'un
seul le réclame, il vit dans sa surcharge — c'est ce qui a été fait pour les
`clip-path` d'ALIEN, et c'est pour ça que le contrat tient en 22 jetons sur
trois jeux visuellement incompatibles.

---

## 5. Test d'acceptation

Un thème est valide s'il rend `reference/preview.html` correct **sans aucune
modification du DOM**, obtenu uniquement par :

```js
RPGTheme.set("mon-jeu");
```

À vérifier avant livraison : toutes les variables définies · contraste **4,5:1**
pour le texte courant et **3:1** pour les grands titres (WCAG AA) · survol et
focus visibles · champs de formulaire lisibles · aucune image absente · aucun
déplacement de mise en page au changement de thème.

---

## 6. Intégration dans une application hôte

Trois points à régler avant de brancher ce SDK dans une application existante.

**Le propriétaire du thème.** Le switcher mémorise le choix dans
`localStorage["rpg-ui-theme"]`. Une application qui tient déjà son thème dans
son propre état (lié à la campagne, au jeu, au profil) ne doit **pas** charger
le switcher : elle aurait deux écrivains sur `data-theme`, et le dernier à
écrire gagnerait. Le switcher est fait pour la preview et les pages autonomes.

**L'espace de valeurs de `data-theme`.** Si l'application utilise déjà cet
attribut pour ses propres thèmes d'interface, les deux vocabulaires entrent en
collision. Prévoir un second attribut — `data-jeu` par exemple — pour que la
peau du jeu et la famille d'interface restent orthogonales. C'est notamment ce
qui permet à une application de garder ses règles conditionnelles de thème clair
quand elle affiche un jeu clair.

**Le pont vers les variables de l'hôte.** Si l'application lit ses propres noms
de variables, huit correspondances suffisent à faire suivre l'essentiel :

| jeton du SDK | variable typique de l'hôte |
| --- | --- |
| `--rpg-bg` | fond de l'application |
| `--rpg-surface` / `--rpg-paper` | surfaces |
| `--rpg-text` | texte principal |
| `--rpg-muted` | texte secondaire |
| `--rpg-accent` | accent |
| `--rpg-border` | bordures |
| `--rpg-font-display` | police de titre |
| `--rpg-font-mono` | police à chasse fixe |

Les quatorze autres sont du gain net : la plupart des applications n'ont aucun
équivalent pour `accent-contrast`, `border-soft`, `font-ui`, les rayons, les
`tracking` ou la transition.

---

## 7. Polices

Les thèmes emploient des polices web libres comme approximations. Pour une
application hors ligne (Electron), les héberger localement si la licence le
permet — les repli sont déjà prévus dans chaque CSS.

⚠️ Une police absente **échoue en silence** : le navigateur retombe sur le repli
sans rien signaler. Vérifier visuellement, pas seulement dans le code.
