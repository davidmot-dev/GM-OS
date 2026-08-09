# Procédure de constitution d'un corpus de règles avec NotebookLM

**Écrit le 2026-08-09**, après la production manuelle du corpus Dune par David (17 fiches, les 13
sujets du canevas couverts). Ce document consigne la procédure exacte, ce qu'il ne faut **pas**
demander au carnet, et ce que la Forge peut automatiser.

Plan de rattachement : `2026-08-08-corpus-de-regles.md` (le canevas, les gabarits v2, le modèle).
Ce document-ci est l'opératoire ; l'autre est la conception.

---

## 1. Le principe qui gouverne tout le reste

**On demande au carnet ce qu'il sait produire, on fabrique localement ce qui doit être exact.**

Cette ligne de partage a déjà été payée trois fois :

| Ce qu'on a demandé au carnet | Ce qui s'est passé | Où ça se fait maintenant |
|---|---|---|
| Du frontmatter YAML | Les `---` pris pour un séparateur, le bloc aplati en titre | Section `## Métadonnées`, conversion locale |
| Des numéros de page | Index internes du carnet, puis pages **fausses** | Titres de section, résolution locale sur `index/` |
| Un jugement socle / univers | Réponse par reconnaissance de marque, instable | Jamais demandé : le carnet ne connaît qu'un jeu |

Corollaire : **plus une information doit être exacte, moins elle doit passer par le modèle.**

---

## 2. Préalables

- **Un carnet par système**, contenant le livre de base et ses suppléments. Ne pas mélanger deux jeux :
  le carnet répondrait par ressemblance.
- **L'index du livre extrait en MD**, déposé dans `docs/systems/<id>/index/`. C'est la seule
  correspondance terme → page fiable dont on dispose (§ 5).
- Le **canevas des treize sujets** (§ 3 du plan de conception). Il est *fourni* au carnet, jamais
  demandé : si chaque carnet invente sa taxonomie, la comparaison entre jeux devient impossible.

---

## 3. La procédure, pas à pas

### Étape 1 — Inventaire (une requête, une fois par système)

Gabarit 1 (§ 4.2 du plan de conception). Produit un tableau : pour chacun des treize sujets, *traité /
partiellement / non traité*, la mécanique en deux lignes, et les sources. Plus une section **« Hors
catégories »** réservée aux mécaniques *centrales* qui n'entrent dans aucun sujet.

Enregistré en `docs/systems/<id>/rules/` avec `sujet: Inventaire des mécaniques`.

**À quoi il sert vraiment** : il borne le travail, il rend la couverture mesurable, et il engendre la
liste des requêtes de l'étape 2. Pour Dune, il a aussi révélé que *Poursuites* n'est pas couvert par le
livre de base — information qu'aucune fiche n'aurait donnée seule.

### Étape 2 — Une requête par sujet

Gabarit 2 (§ 4.3), rejoué **treize fois au minimum**, plus une fois par entrée « hors catégories ».

**Une seule requête pour toutes les fiches donne des paragraphes, pas des fiches.** C'est la première
correction apportée à la proposition initiale, et elle tient toujours.

Sections attendues : `## Métadonnées`, `## Règle`, `## Valeurs`, `## À la table`, `## Cas limites`,
`## Non couvert`.

Trois exigences dans le prompt, dans l'ordre de rentabilité :

1. **Interdiction d'inventer.** Sans elle, un sujet non couvert produit du générique plausible. C'est la
   ligne la plus rentable des deux gabarits.
2. **Une fiche même si le sujet n'est pas couvert** — avec `couverture` à *non couvert*. Sinon l'absence
   est invisible, et invisible vaut faux.
3. **Valeurs chiffrées en clair**, et **symboles en toutes lettres**. La v1 d'Alien avait perdu
   49 symboles de réussite rendus en glyphes.

### Étape 3 — Conversion locale (jamais dans le carnet)

Pour chaque fiche produite :

1. `## Métadonnées` → frontmatter YAML, et le titre en `#`.
2. **Ramener `sujet` à la clé canonique.** Le carnet nomme librement : Dune a rendu « Monnaie de table
   ou ressource partagée » et « Ton, registre et ambiance recherchés ». **La clé de comparaison entre
   systèmes doit être identique au caractère près**, sinon on ne peut plus confronter deux jeux.
3. `systeme`, `hors_canevas`, `genere_par: notebooklm`, `relu: false`, et **`pages_fiables: false`**
   tant que la résolution du § 5 n'est pas en place.
4. Écrire dans `docs/systems/<id>/rules/<slug>.md`.

Le script de la séance est en annexe (`scratchpad`, non versionné) ; sa logique tient en trente lignes
et a vocation à passer dans la Forge (§ 6).

### Étape 4 — Vérification

- **Tous les fichiers de `rules/` portent un `sujet:`** — verrouillé par `electron/ragSelection.test.ts`.
  Sans frontmatter, une fiche soignée pèse autant qu'une décharge au classement du RAG.
- **Confronter les pages à la pagination réelle** (§ 5). Une citation au-delà de la dernière page du
  livre est un index de carnet déguisé.
- **Repérer les doublons** : deux fiches sur le même `sujet` avec fort recouvrement. NOC et Rêves de
  Dragons en avaient trois paires. Marquer `doublon_de:` et fusionner à la régénération, pas avant —
  les deux versions se complètent souvent.

---

## 4. Ce qu'il ne faut jamais demander au carnet

- **Du YAML.** Les `---` sont interprétés comme un séparateur.
- **Un classement socle / univers.** Le carnet ne contient qu'un jeu : il répond par reconnaissance de
  marque. Le même sujet a été classé différemment deux fois.
- **La liste des sujets.** Elle est fournie. « Et autres » fait dériver la taxonomie.
- **Des numéros de page** — voir ci-dessous. C'est la leçon nouvelle du 2026-08-09.

---

## 5. La pagination, et pourquoi l'index change la donne

**Constat de David, vérifié :** les numéros de page rendus par NotebookLM ne renvoient pas au livre.

Mesure du 2026-08-09, en confrontant les pages citées à la dernière page vue dans l'index extrait :

| Système | Dernière page de l'index | Fiches citant hors pagination |
|---|---|---|
| dune | 329 | **9 sur 17**, jusqu'à la page 1279 |
| alien | ~770 (seuil grossier) | 1 (le guide v1) |
| blade-runner | 222 | 0 |

**Le zéro de Blade Runner ne prouve rien** : le contrôle ne détecte qu'un dépassement. Une page fausse
mais dans la plage est indétectable. On traite donc **toute la pagination du corpus comme non fiable**,
d'où `pages_fiables: false` sur les 46 fiches qui citent des pages.

**Conséquence sur le comportement de l'Oracle**, appliquée le 2026-08-09 : la consigne de citation lui
interdit désormais de reprendre ces pages. *Une citation fausse coûte plus qu'une citation absente* — en
pleine partie, le MJ ouvre le livre et ne trouve rien.

### La correction, et pourquoi ce n'est pas « mettre l'index dans le carnet »

L'idée de David — ajouter l'index comme source du carnet pour qu'il s'y réfère — vise la bonne pièce :
**l'index est la seule vérité terrain sur la pagination**. Mais l'y mettre est la version faible :

- L'index associe des **titres** à des pages. Une fiche cite huit à quinze pages, dont la plupart ne
  correspondent à aucune entrée. La couverture serait partielle.
- **Rien n'oblige le modèle à préférer l'index** à son propre mécanisme de citation. Il mélangera — et un
  mélange est pire qu'une erreur uniforme, puisqu'on ne sait plus lesquelles croire.
- L'index d'Alien pèse 27 Ko de bruit OCR, ajouté à chaque récupération du carnet.

**Version retenue, même instinct :** demander au carnet les **titres de section** dont la règle est
tirée — ça, il le rapporte fidèlement, c'est littéralement dans le texte — puis **résoudre titre → page
localement** contre `index/`. Déterministe, vérifiable, et l'index sert du même coup de contrôleur.

C'est exactement la ligne de partage du § 1.

---

## 6. Ce que la Forge peut automatiser

**Réponse courte : toute la séquence, et sans nouvelle intégration.** Les primitives sont déjà câblées
et éprouvées en réel.

| Étape | Outil | Déjà utilisé par |
|---|---|---|
| Choisir le carnet | `notebook_list` | `ForgeDashboard.tsx:111` |
| Lister ses sources | `notebook_get` | `ForgeDashboard.tsx:144` |
| Interroger le carnet | `notebook_query` | `ForgeService.ts:280`, `:307` |
| Réécrire dans le carnet | `source_add` | `useJournalStore.ts:286`, `useObsidianStore.ts:96` |
| Écrire dans GM-OS | `ai:write-doc` | `BrainstormOverlay.tsx:93` |

**Mieux : la boucle existe déjà.** `ForgeService.discoverCandidates` (inventaire) puis `forgeCard`
(une fiche par élément), toutes deux via `notebook_query` avec filtrage `source_ids`, sont
structurellement la séquence de David. Ce qui manque n'est pas de la plomberie :

1. **Les prompts sont restés en v0.** `discoverCandidates` demande « 5 à 8 éléments intéressants à
   formaliser » — c'est précisément le « et autres » que le § 4.1 rejette : la liste doit être *fournie*.
   `forgeCard` demande « du Markdown riche, structuré », sans les six sections, sans l'interdiction
   d'inventer, sans l'exigence de valeurs en clair. **Remplacer ces deux prompts par les gabarits v2
   est le seul vrai travail.**
2. **L'étape locale n'existe pas** : conversion des métadonnées en frontmatter, clé canonique, slug de
   fichier, `pages_fiables`.
3. **La boucle n'est pas pilotée par le canevas** : il faut itérer sur les treize sujets plus les
   « hors catégories » de l'inventaire, au lieu de laisser le carnet choisir.
4. **`BrainstormOverlay.tsx:93` écrit la fiche avant de la montrer.** À inverser : les artefacts qui
   portent le plus d'autorité sont ceux qui ont le moins de revue (axe O).

### Séquence cible

```
1. notebook_list                → choix du carnet
2. notebook_get                 → sources, filtrage éventuel
3. notebook_query(gabarit 1)    → inventaire des 13 sujets + hors catégories
4. pour chaque sujet :
     notebook_query(gabarit 2)  → une fiche
     conversion locale          → frontmatter, clé canonique, slug
     revue avant écriture       → l'humain valide (axe O)
     ai:write-doc               → docs/systems/<id>/rules/<slug>.md
     source_add (optionnel)     → la fiche retourne dans le carnet
5. contrôles                    → sujet présent, doublons, pagination
```

**Réserves à tenir en tête.** Le plafond MCP est à 10 minutes et une génération complète fait une
vingtaine de requêtes : il faut de l'annulation et une reprise sur échec partiel (axe D), sinon un
timeout à la quinzième fiche perd tout. Et **remettre la fiche dans le carnet (`source_add`) crée une
boucle** : le carnet contiendra ses propres productions, qu'il citera ensuite comme des sources. À
n'activer qu'en connaissance de cause, ou sur un carnet distinct.

---

## 7. État au 2026-08-09

- Corpus : **dune 17 fiches (13 sujets couverts)**, alien 17, blade-runner 13, noc 4, rêves de dragons 7.
- Index de livre extraits pour **alien, blade-runner, dune**, rangés dans `index/`.
- Personas par système : **alien et dune**.
- `pages_fiables: false` sur les 46 fiches citant des pages ; consigne de citation de l'Oracle corrigée.
- **Non fait** : la résolution titre → page contre l'index (§ 5), et le passage des gabarits v2 dans la
  Forge (§ 6). Ce sont les deux prochains travaux de ce chantier.
