# État et reprise — 2026-09-15, au soir

> **Base saine.** `tsc -b` propre, **4 869 tests verts** (391 fichiers, 1 ignoré), **190 tests E2E**,
> branche `feature/tablet-hub-pwa`.
>
> ⚠️ **Le plantage de rendu d'une exécution E2E complète** (§ 1 bis du registre) n'est toujours pas
> expliqué, et **aucune des exécutions complètes du 15 ne l'a reproduit**. *Un symptôme intermittent
> qui ne se produit pas n'est pas un symptôme résolu.*
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule.
> Ce document-ci ne dit que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.
>
> Il prend la suite de [`2026-09-14-etat-et-reprise.md`](./2026-09-14-etat-et-reprise.md).
>
> ✅ **Les trois chantiers de la journée sont éprouvés en réel** — *« ça marche »*, *« ok ça marche »*,
> *« ok c'est bon ça fonctionne »*.

---

## Ce que la journée du 15 a produit

| Quoi | Ce qui est entré |
| --- | --- |
| **Les jauges qui se vident** | ⭐ Le **sens** d'une jauge — monte / s'épuise — et l'**usure de fin de scène**. Le mécanisme de descente existait déjà : c'est l'intention qui manquait à tout ce qui l'entoure (§ 66) |
| **Le code couleur** | ⭐ Orange à mi-course, rouge au dernier quart, **en fractions** pour que 4 et 12 segments s'alarment au même endroit (§ 66) |
| **L'Atelier des calendriers** | ⭐ Composer une année sans écrire de JSON — et ⛔ **la garde qui empêche un calendrier de GELER GM-OS** (§ 67) |

⭐ **Le motif de la journée : trois demandes de fonctionnalité, trois défauts antérieurs trouvés en
comptant avant d'écrire.** L'alarme d'une jauge qui criait à la bonne nouvelle ; un cinquième lecteur
sur l'Ulanzi que la demande ne nommait pas ; un calendrier capable de figer l'application.

---

## 1 · Par quoi reprendre

### ⚠️ `databases/` n'est dans AUCUNE sauvegarde — et le trou grossit

Ni les **calendriers**, ni les **tables** que l'Atelier écrit depuis le 14. Le trou est antérieur aux
deux Ateliers ; ce qui a changé, c'est que **David crée désormais du contenu qui vit là**.

Proposé le 15 avec le chantier des calendriers, **écarté par David** pour garder la portée. *C'est
une décision de portée, pas un oubli* — mais c'est la première chose à rouvrir.

> Le miroir des images (§ chantier 4 de la sauvegarde) montre la forme que ça prendrait : un miroir
> incrémental plutôt que des instantanés. `databases/` pèse bien moins que les 261 Mo d'images.

### ⚠️ Deux chemins d'IA jamais empruntés pour de vrai

| Chemin | État |
| --- | --- |
| **Une photo de page de manuel** (§ 65) | Le fil, la lecture des capacités et la garde sont posés. **Aucune image n'est jamais partie vers un modèle depuis ce dépôt.** À essayer avec `gemma4:12b` |
| **Composer un calendrier** (§ 67) | Le schéma et le contrôle en aval sont éprouvés. *Personne n'a vu un calendrier sortir d'une phrase* |
| **Ranger une table par l'IA** (§ 63) | Jamais lancé contre un vrai modèle |

⚠️ **Un vrai PDF de manuel** n'a jamais traversé l'Atelier non plus. C'est là que « Ranger par l'IA »
cessera d'être optionnel : un manuel rend souvent un texte désordonné.

### ⚠️ Le jour de la semaine ignore les jours hors calendrier

`getFantasyDate` compte les jours écoulés modulo la longueur de la semaine — or à Harptos **les fêtes
ne sont pas des jours de semaine**. Relevé le 15, **non corrigé** : c'est une règle de monde, et elle
mérite d'être tranchée par David avant d'être écrite. Certains calendriers comptent les fêtes, d'autres
les sautent.

### ⚠️ Ce qui n'a jamais vu de vrai matériel

Inchangé depuis le 14 : l'endurance d'un diaporama sur une soirée entière, le fondu de tablette sur
une vraie tablette, et la séquence de storyboard qui s'était mal exécutée et qu'on n'a jamais
reproduite.

---

## 2 · Ce qu'il ne faut pas repayer

### ⛔ Un gel n'est pas une lenteur — aucun `timeout` ne le rattrape

Un calendrier sans mois mettait `getFantasyDate` en boucle infinie. J'ai posé la garde, écrit les
tests **avec un `timeout` sur chacun**, puis dégradé la garde pour vérifier qu'ils rougissaient.

**Ils n'ont pas rougi : ils ont pendu.** Il a fallu tuer vitest de l'extérieur après deux minutes.

> *Une boucle synchrone ne rend pas la main à l'ordonnanceur, donc rien ne peut l'interrompre — ni
> vitest, ni un navigateur, ni un superviseur.* Le gel est le seul mode d'échec qui échappe à tous
> les garde-fous d'exécution : **on ne peut que l'empêcher d'entrer**. D'où le contrôle posé en
> *condition* du module, et pas en confort — et dans le magasin autant que dans l'écran.

### ⛔ `npm run test:e2e`, JAMAIS `npx playwright test` seul

Les tests chargent `dist/`. Seul le script `test:e2e` fait le `npm run build` d'abord.

Le 15, j'ai lancé Playwright directement : **sept essais sont passés au vert sur le paquet de la
veille**, et les trois nouveaux ont échoué en cherchant un bouton bel et bien présent dans les
sources — j'ai cru à un défaut de sélecteur. Le piège est **écrit noir sur blanc** dans
`lancerGmOs.ts`.

> *Un avertissement lu n'est pas un avertissement appliqué* — et le mode d'échec est le pire qui
> soit : **des verts faux**, qui ne signalent rien.

### ⛔ Un champ renseigné que rien ne lit est pire qu'un champ vide

`harptos.json` déclarait `currentYear: 1492` ; **aucun lecteur dans tout le dépôt**, et choisir
Harptos affichait l'an 56. Idem `daysPerWeek`, *requis par le type et absent du seul fichier qui
existe*.

> Le motif habituel de ce dépôt est « un champ que rien ne renseigne ». **Celui-ci est l'inverse, et
> il est pire** : un champ vide se remarque, un champ rempli *a l'air d'une fonctionnalité*, et
> personne ne vérifie ce qui a l'air de marcher.

### ⚠️ Compter les lecteurs, pas relire le code

Trois fois dans la journée, c'est le comptage qui a trouvé ce que la demande ne disait pas :

- **le cinquième lecteur d'une jauge** — l'Ulanzi, qui écrivait la même règle sous un autre
  vocabulaire (`remplis >= total`), donc introuvable par recherche de texte ;
- **les six champs `current*`**, trouvés par un `grep` de lecteurs ;
- **l'absence de chemin d'écriture** des calendriers, qui expliquait pourquoi il n'en existait qu'un.

> *Une fonctionnalité inaccessible ressemble beaucoup à une fonctionnalité inutile.* Avant de
> conclure qu'une chose ne sert pas, vérifier qu'elle est atteignable.

### ⚠️ Séparer les rôles plutôt que factoriser

J'ai écrit la fabrique du nom de fichier **des deux côtés du pont** — puis je l'ai retirée. La
correction n'était pas de la mettre en commun : **le renderer produit l'identifiant, le processus
principal valide le chemin**, ce que lui seul peut faire.

> Quand la même règle apparaît des deux côtés d'une frontière, la question n'est pas « où la mettre
> en commun » mais **« laquelle des deux n'avait pas à exister »**.

---

## 3 · Le diagnostic sans rien demander

Inchangé, et il a de nouveau servi le 15 : **mesurer plutôt que déduire**.

- La boucle infinie a été **exécutée** dans un `node -e` avec un compteur avant d'écrire une ligne de
  garde — 50 millions de tours, constatés.
- L'an 56 d'Harptos a été **calculé** en rejouant `getFantasyDate` sur le vrai fichier, pas déduit du
  code.
- Les couleurs des jauges se vérifient **dans le SVG rendu**, parce que le câblage cran → pigment ne
  lève rien et ne rougit aucun test unitaire.

> *Ce qui se mesure en deux minutes ne se discute pas pendant une heure.*
