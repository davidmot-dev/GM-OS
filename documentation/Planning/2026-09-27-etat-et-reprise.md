# État et reprise — le 2026-09-27, **les thèmes réparés, le filet posé, Stitch fait, la phase 1 commencée**

> **Base saine.** `tsc -b` propre, **6 119 essais Vitest** (476 fichiers, 1 ignoré), les **20
> captures de référence** identiques. Branche `feature/tablet-hub-pwa`, **poussée jusqu'à
> `5417bb9e`** ; ce document et la mise à jour du registre sont à commiter.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md) — pour la refonte, § 76 et la
> ligne 12 de la vue d'un coup d'œil.
>
> Il prend la suite de [`2026-09-25-etat-et-reprise.md`](./2026-09-25-etat-et-reprise.md).

---

## Ce que les deux journées ont produit

| Commit | Chantier | Éprouvé ? |
| --- | --- | --- |
| `867448b7`, `1e838772` | **P0 des thèmes** : le contrat en données, le validateur (`npm run theme:valider`), la vitrine d'un jeu | ✅ — il a refusé les six thèmes, pour de bonnes raisons |
| `243f4e4a` | **Les six thèmes de jeu reconstruits** par RPG Theme Builder, un aller-retour chacun | ✅ **tous acceptés**, vitrines avant/après |
| `6a140fac`, `f6ef4d66` | La vitrine : l'écran d'accueil a son attribut ; **onze captures pour Stitch** et leurs prompts | ✅ |
| `6cba00c1` | **Phase 0 de la refonte** — captures de référence, gardes des couleurs d'état et du contraste, relevé | ✅ reproductibles, une mutation détectée |
| `1dc90718` | **Contrat des thèmes v1.3 — le cadre** | ✅ les six thèmes toujours acceptés ; **chargé dans ChatGPT par David** |
| `8f7e0b53` | **Stitch retenu** (huit écrans, quatre personnalités), **T2.3**, le plan de la phase 1 | — des images et des valeurs, rien d'exécuté |
| `5417bb9e` | **P1.1** — les thèmes de base deviennent des paquets de jetons | ✅ **à pixel constant** : 20 captures identiques, les variables des quatre thèmes figées |

---

## Par quoi reprendre

1. **P1.2** du [plan de la phase 1](./2026-09-27-refonte-phase-1.md) : texte secondaire, couleurs
   d'état, texte sur l'accent, cadre — **à pixel constant**. Avant de coder : *« GM-OS
   tourne-t-il ? »*. ⛔ **David ne veut pas que son interface change maintenant** : rien de visible
   avant P1.7, et là derrière un réglage des Paramètres éteint par défaut.
2. **Côté RPG Theme Builder** : le cahier v1.3 est chargé. **Non confirmé** : les deux références
   `alien.css` et `blade-runner.css`, resynchronisées le 26/09, ont-elles été remises dans ChatGPT ?
3. **À trancher un jour avec David** : deux lectures souples du cahier que le validateur signale sans
   refuser (un repli de police absent, une `@media` après les jetons) — `Pipeline-des-themes.md` § 4.
4. **Repris du 25/09, rien n'a bougé** : la carte projetée à la main avant un moment (§ 114), le
   compresseur d'Ambient-OS, les correctifs audio des §§ 106 à 110, la restauration (§ 87).

---

## Ce qu'il ne faut pas repayer

### ⭐⭐ Stitch ne connaît que ce que montrent les captures

Au prompt 1, j'ai fait retirer à Stitch une barre d'outils de la carte que je croyais inventée :
elle existait, mais la capture ne montrait que le haut d'un panneau de treize sections. Même chose
aux Dés : le mode des dés échelonnés n'était dans aucune capture, et Stitch l'a deviné de travers.
*Avant de déclarer une commande inventée, la chercher dans le code* ; et la vitrine capture
désormais les panneaux qui défilent (`capturerEnDefilant`).

### ⭐ Stitch n'a qu'un système de design par projet

Au premier tour des personnalités, Moderne, Cyberpunk et Médiéval avaient le même fond, le même
cyan, les mêmes polices. Les cinq `DESIGN.md` exportés étaient **identiques octet pour octet** : le
Cyberpunk importé au départ s'appliquait à tout. Le remède : un prompt par personnalité, avec des
valeurs explicites et la consigne d'ignorer le `DESIGN.md` du projet. Et **relever les valeurs dans
le navigateur**, pas dans la configuration Tailwind de l'export, qui peut être celle du projet.

### ⭐ L'image jointe à un export Stitch peut être en retard sur son code

Constaté sur le Combat : le code était corrigé, l'image non. Je rends moi-même le HTML exporté
(Chromium de Playwright, `executablePath` vers `chromium-1217`) avant de juger.

### ⛔ Des captures qui ne montrent qu'un thème ne prouvent rien pour les trois autres

Les 20 captures de référence tournent sous le thème par défaut. Pour une phase « à pixel constant »,
elles ne suffisent pas : **`apparenceDAujourdhui.test.ts` fige les variables des quatre thèmes**,
relevées *avant* la première modification. Une variable ajoutée ne la casse pas ; une valeur changée,
si.

### ⛔ Une copie de travail qui écrase le fichier commité

L'inventaire des écrans a été réécrit par une ancienne version — probablement un onglet de VS Code
resté ouvert sur le premier jet — et les 34 notes de David ont disparu de la copie de travail.
Restauré par `git show HEAD:…`, après avoir mis de côté la version fautive. *Avant d'écrire sur un
document que David annote, vérifier qu'il n'a pas reculé.*

### ⛔ Windows ignore la casse, `.gitignore` aussi

`Stitch/` dans `.gitignore` excluait aussi `documentation/Planning/stitch/`. Corrigé en `/Stitch/`,
ancré à la racine.

### ⚠️ Le pont a un repli connu : `paper` alimente `surface`

En écrivant l'essai « aucun jeton non appliqué n'emprunte le pont du jeu », `paper` (SDK) est sorti
en `--app-surface` : c'est le repli voulu du 2026-08-24, pas une fuite. L'essai porte sur les jetons
V2 seulement.

### ⚠️ Pour moi : pas de guillemets inversés dans un `node -e` passé par Bash

Deux fois dans la soirée, un `` ` `` dans un script `node -e "…"` a été exécuté par le shell, et une
fois il a produit un fichier tronqué. Pour du code qui contient des gabarits, écrire le fichier ou
passer par l'outil d'édition.
