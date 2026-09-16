# État et reprise — 2026-09-15, au soir

> **Base saine.** `tsc -b` propre, **4 977 tests verts** (396 fichiers, 1 ignoré), **192 tests E2E**,
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
> ✅ **Les quatre premiers chantiers sont éprouvés en réel** — *« ça marche »*, *« ok ça
> marche »*, *« ok c'est bon ça fonctionne »*, *« ok ça marche »*.
> ⚠️ **Le miroir de `databases/` (§ 69) attend encore ton écran** — il est éprouvé par un E2E qui
> traverse le vrai disque, mais tu ne l'as pas vu.

---

## Ce que la journée du 15 a produit

| Quoi | Ce qui est entré |
| --- | --- |
| **Les jauges qui se vident** | ⭐ Le **sens** d'une jauge — monte / s'épuise — et l'**usure de fin de scène**. Le mécanisme de descente existait déjà : c'est l'intention qui manquait à tout ce qui l'entoure (§ 66) |
| **Le code couleur** | ⭐ Orange à mi-course, rouge au dernier quart, **en fractions** pour que 4 et 12 segments s'alarment au même endroit (§ 66) |
| **L'Atelier des calendriers** | ⭐ Composer une année sans écrire de JSON — et ⛔ **la garde qui empêche un calendrier de GELER GM-OS** (§ 67) |
| **L'image d'un indice** | ⭐ Le générateur branché sur les indices — registre « pièce à conviction ». ⛔ Et **les trois générateurs existants échouaient en silence** (§ 70) |
| **`databases/` sauvegardé** | ✅ Un miroir à part, déclenché **à chaque écriture et au démarrage** — la sauvegarde automatique ne se serait **jamais** réveillée pour ça (§ 69) |
| **Les jours de fête** | ⭐ Une fête **dans** un mois, et sur plusieurs jours ; annoncée à l'horloge, à la table et au journal. ⛔ Et la semaine que les jours hors calendrier **décalaient de six jours par an** (§ 68) |

⭐ **Le motif de la journée : trois demandes de fonctionnalité, trois défauts antérieurs trouvés en
comptant avant d'écrire.** L'alarme d'une jauge qui criait à la bonne nouvelle ; un cinquième lecteur
sur l'Ulanzi que la demande ne nommait pas ; un calendrier capable de figer l'application.

---

## 1 · Par quoi reprendre

### ⛔ EN TÊTE : « je n'arrive pas à taper dans un champ » (§ 71)

**Signalé par David le 2026-09-16, et NON CORRIGÉ.** Un champ de texte refuse la saisie pendant
30 s à 1 min, puis se débloque tout seul. Plusieurs modules, boîtes de dialogue comprises. ⚠️
**Antérieur à la journée du 15**, donc aucun de ses chantiers n'est en cause.

⭐ **Le fait qui élimine la moitié des hypothèses** : pendant le blocage, **le reste de l'écran
répond normalement**. Le fil d'affichage n'est donc pas bloqué.

**Une sonde est posée** (`sondeDeLaFrappe.ts`, montée dans `main.tsx`). À la prochaine occurrence :
ouvrir le journal de débogage — icône **Terminal** de la barre latérale — et lire la ligne. Elle
dira `hors-champ` (le focus a été volé) ou `frappe-refusee` (avec `preventDefault`, `disabled`, ou
aucune cause visible, ce qui désignerait alors le rendu).

⚠️ **Un journal VIDE pendant un blocage serait aussi une réponse** : la touche n'atteindrait pas la
fenêtre, et il faudrait regarder du côté d'Electron.


### ✅ `databases/` est dans un filet — CLOS le soir même (§ 69)

Écarté d'abord pour garder la portée, rouvert par David dans la foulée. Miroir à part sous
`userData/backups/databases/`, **arborescence conservée** — restaurer, c'est recopier un dossier.

⚠️ **Ce qui reste** : l'espace ne redescend jamais tout seul (conséquence assumée du « garde
tout »). À 1,3 Mo c'est théorique, mais **un geste de nettoyage explicite reste à écrire** — il est
garé depuis le 29/08 pour le miroir des médias, où il pèse autrement plus lourd.

### ⚠️ Deux chemins d'IA jamais empruntés pour de vrai

| Chemin | État |
| --- | --- |
| **Une photo de page de manuel** (§ 65) | Le fil, la lecture des capacités et la garde sont posés. **Aucune image n'est jamais partie vers un modèle depuis ce dépôt.** À essayer avec `gemma4:12b` |
| **Composer un calendrier** (§ 67) | Le schéma et le contrôle en aval sont éprouvés. *Personne n'a vu un calendrier sortir d'une phrase* |
| **L'image d'un indice** (§ 70) | L'invite et la garde sont posées. *Personne n'a vu sortir une pièce à conviction* |
| **Ranger une table par l'IA** (§ 63) | Jamais lancé contre un vrai modèle |

⚠️ **Un vrai PDF de manuel** n'a jamais traversé l'Atelier non plus. C'est là que « Ranger par l'IA »
cessera d'être optionnel : un manuel rend souvent un texte désordonné.

### ✅ Le jour de la semaine — CLOS le soir même

Il ignorait les jours hors calendrier, qui décalaient la semaine de six jours par an à Harptos. David
a demandé les jours de fête dans la foulée (§ 68), et la règle est désormais **déclarée par
calendrier**.

⚠️ **Le jour de semaine affiché pour une date d'Harptos a changé.** Il était faux ; c'est à
constater à l'écran, pas un défaut.

### ✅ Les jours de fête — éprouvés en réel

Le § 68 a été vérifié à l'écran le soir même. **Les quatre chantiers du 15 sont donc clos et
éprouvés.**

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
