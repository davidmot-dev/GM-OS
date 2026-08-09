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

### Étape 4 — Les personas (deux requêtes enchaînées, une fois par système)

Prompts A et B en annexe (§ 8). **Enchaînés dans la même conversation** : B s'appuie sur la fiche de
voix que A vient de produire.

- A → une **fiche de voix** : vocabulaire de la table, registre, émotion visée, interdits. Enregistrée
  dans `docs/systems/<id>/personas/`.
- B → les **huit personas en JSON**, enregistrées dans **`docs/systems/<id>/gems.json`** — littéralement
  ce chemin. `AIService` lit `systems/<id>/gems.json` ; un fichier rangé dans `personas/` n'est jamais
  lu, **sans le moindre message d'erreur**. Le piège s'est produit deux fois ;
  `electron/systemPersonas.test.ts` verrouille désormais le contrat de bout en bout.

Trois contraintes façonnent ces prompts, et elles ne sont pas cosmétiques :

- `gems.json` **remplace** l'instruction de base, sans concaténation : chaque persona est autosuffisante.
- Le bloc générique — alias, « réponds en français », consigne de citation — est **ajouté après**. Le
  répéter serait du prefill payé à chaque question.
- **Une persona porte une voix, jamais des règles.** Le RAG fournit déjà les règles ; une persona qui les
  affirme finira par les contredire. Démontré au premier essai : le Stratège d'Alien v1 énonçait « la
  mort est toujours instantanée et inéluctable », que `sante-et-blessures.md`, tirée du même livre,
  contredit.

### Étape 5 — Vérification

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

### 5.1 Ce que contiennent réellement les index extraits, au 2026-08-10

Relevé sur les trois fichiers produits par David. **Les trois ne contiennent pas le même objet, et aucun
n'a le même format d'extraction** — à savoir avant de bâtir un résolveur dessus.

| Fichier | Objet | Format | Entrées lues |
|---|---|---|---|
| `ALIEN_Index.md` | **table des matières** | `\|TITRE<br>PAGE\|` en cellule | 97 (p. 9–370) |
| `Blade Runner_Index.md` | **table des matières** | `\|**TITRE**\|**PAGE**\|` + titres espacés lettre à lettre | 0 (format non couvert) |
| `Dune_Index.md` | **index alphabétique** | `Terme.......PAGE` à points de conduite | 122 (p. 10–237) |

**Les deux objets ne servent pas à la même chose, et il faut les deux :**

- La **table des matières** résout `sections:` → page. C'est le résolveur du gabarit v3.
- L'**index alphabétique** résout un *terme* → pages. C'est lui qui alimentera l'Oracle bibliothécaire
  (axe M) pour tout ce qu'aucune fiche ne couvre — et il porte sur le livre entier, pas sur les
  13 sujets.

**Recommandation de production** : extraire les deux objets par livre, dans deux fichiers distincts
(`<livre>_TOC.md` et `<livre>_Index.md`), plutôt qu'un fichier unique dont le contenu varie d'un livre
à l'autre.

### 5.2 La chaîne de résolution

```text
index/<Livre>_TOC.md · index/<Livre>_Index.md      (bruts, extraits du PDF)
        ↓  normalisation, une fois par livre
index/<livre>.index.json { toc: [{titre, page}], termes: [{terme, pages[]}] }
        ↓  résolution
fiche.sections[]  ──confrontation──>  pages vérifiées
                                  └─> sections introuvables = journal de revue
```

**La confrontation a deux issues, et la seconde vaut autant que la première.** Un titre trouvé donne une
page *vérifiée* — ce que NotebookLM ne savait pas produire. Un titre introuvable donne un *soupçon* :
soit le carnet a inventé le titre, soit la table est incomplète. **Rien d'autre, aujourd'hui, n'attrape
l'invention** — c'est le trou de l'axe O, partiellement comblé pour zéro coût de génération.

### 5.3 Trois obstacles au rapprochement, mesurés

1. **Ligatures perdues à l'extraction.** `confit` pour « conflit », `Diffculté` pour « Difficulté » : le
   `fi`/`fl` saute. Le défaut frappe les termes les plus structurants, donc **le rapprochement doit être
   tolérant, jamais une égalité de chaînes**.
2. **Titres espacés lettre à lettre** chez Blade Runner :
   `E T TO M B E N T L E S A N G E S E N F E U 0 0 7`. L'extracteur a éclaté les titres d'affichage ;
   à recoller avant tout rapprochement.
3. **Une entrée de table des matières donne la page où la section *commence***, pas celle du détail
   cité. Une référence résolue dit « section « Forcer le test », p. 60 » — exactement ce qu'il faut pour
   retrouver la règle dans le livre, mais **ne pas prétendre davantage**.

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
5. notebook_query(prompt A)     → fiche de voix
   notebook_query(prompt B)     → les huit personas, même conversation
   ai:write-doc                 → docs/systems/<id>/gems.json
6. contrôles                    → sujet présent, doublons, pagination, clés des gemmes
```

**L'étape 5 est la plus facile à automatiser et la plus vite rentable** : deux requêtes, un chemin de
sortie fixe, et un contrat déjà testé (`systemPersonas.test.ts`). Elle ne dépend d'aucune des autres.

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
- **Non fait** : la résolution titre → page contre l'index (§ 5.2), et le passage des gabarits v3 dans
  la Forge (§ 6). Ce sont les deux prochains travaux de ce chantier.
- **Prérequis à la résolution**, relevé le 2026-08-10 : les index extraits sont hétérogènes (§ 5.1).
  Avant d'écrire le résolveur, il faut une extraction uniforme — table des matières *et* index
  alphabétique, dans deux fichiers séparés, pour chaque livre.

---

## 8. Les gabarits, en toutes lettres

Quatre prompts : deux pour le corpus de règles, deux pour les personas. **Les prompts A et B sont ceux
de David, transcrits tels qu'il les emploie** — ils ont produit les personas d'Alien et de Dune. Les
gabarits 1 et 2 viennent du plan de conception (§ 4.2 et § 4.3).

**Les quatre demandent l'enregistrement dans le studio du carnet.** C'est l'archive : le carnet garde la
trace de ce qu'il a produit, indépendamment de ce qui atterrit dans `docs/`. Utile quand une fiche est
régénérée et qu'on veut comparer les deux versions — et c'est la seule mémoire du carnet, qui ne
conserve pas les conversations.

**Version 3, 2026-08-09.** Seul changement depuis la v2, et il porte sur trois lignes : **on ne demande
plus de numéros de page, on demande des titres de section** (§ 5). Le carnet rapporte fidèlement un
titre parce qu'il est dans le texte ; il fabrique les pages. La ligne d'origine est conservée en
commentaire sous chaque prompt concerné, pour que le changement reste traçable.

### Gabarit 1 — inventaire (une requête, une fois par système)

```text
Tu analyses UNIQUEMENT les sources de ce carnet. Ne complète jamais avec des
connaissances extérieures.

Génère un Markdown que tu sauveras dans le studio.

Pour chacun des sujets ci-dessous, indique si ce jeu le traite, et résume sa
mécanique en une à deux phrases maximum :

1. Résolution des jets (dés utilisés, lecture du résultat, réussite/échec)
2. Degrés de réussite et critiques
3. Jets opposés, aide et coopération
4. Initiative et déroulement du tour
5. Santé et blessures (échelle utilisée, incapacité, mort)
6. Dégâts et types de dégâts
7. États et conditions (comment on les subit, comment on en sort)
8. Monnaie de table ou ressource PARTAGÉE par toute la table (élan, menace, jetons…)
9. Jauges et ressources INDIVIDUELLES, tenues sur la fiche d'un personnage
   (stress, santé mentale, points de magie, fatigue, monnaie, réputation…)
10. Distances et portées en combat
11. Poursuites
12. Environnement et dangers (froid, vide, chute, feu, privation…)
13. Ton, registre et ambiance recherchés

Réponds par un TABLEAU MARKDOWN (avec des barres verticales), colonnes :
Sujet | Traité (oui/partiellement/non) | Mécanique | Sections.

La colonne « Mécanique » doit contenir les éléments CONCRETS : dés employés et
leur taille, seuils chiffrés, nombre de niveaux d'une échelle. « On lance des
dés et on compare à un seuil » est une réponse inutile.

La colonne « Sections » donne les TITRES EXACTS des chapitres ou sections du
livre où se trouve la règle, tels qu'ils y sont écrits. N'indique aucun numéro
de page et aucun numéro de référence interne du carnet.

Si un sujet n'est pas couvert par les sources, écris « non couvert par les
sources » — n'invente rien, ne comble pas par analogie avec d'autres jeux.

Ajoute ensuite une section « Hors catégories » listant les mécaniques CENTRALES
de ce jeu qui n'entrent dans aucun des 13 sujets. Uniquement les mécaniques
centrales.

Écris tous les symboles en toutes lettres. Si le livre utilise une icône (par
exemple pour marquer une réussite), nomme-la au lieu de la reproduire.

N'aborde PAS : création de personnage, progression, équipement et matériel,
historique et background, bestiaire, scénarios inclus.
```

> *v2 disait* : « colonnes … | Pages. » et « La colonne « Pages » donne les numéros de page du livre.
> N'utilise jamais les numéros de référence internes du carnet. »

### Gabarit 2 — fiche détaillée (à rejouer par sujet)

```text
Tu rédiges une fiche de règle sur le sujet : « {SUJET} ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.

Format de sortie : Markdown, 3 000 à 5 000 caractères, structuré exactement
selon les six sections ci-dessous. N'emploie aucune ligne de tirets « --- » et
aucun bloc de métadonnées en en-tête : commence directement par la section
« Métadonnées ».

## Métadonnées
- sujet : {SUJET}
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres ou sections dont la règle est tirée

## Règle
L'énoncé de la règle telle que le livre la pose.

## Valeurs
Toutes les valeurs chiffrées en clair, sous forme de liste : seuils, échelles
ordonnées, durées, modificateurs, nombres de dés. Une échelle se donne dans
l'ordre, du meilleur état au pire.

## À la table
Comment cela se joue concrètement, tour par tour si pertinent.

## Cas limites
Ce que le livre précise sur les situations ambiguës.

## Non couvert
Ce que le sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même la fiche
  avec « couverture : absente » et explique en une phrase ce que tu as cherché.
  Ne renvoie jamais une réponse vide.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « Forcer le test ») ». N'indique JAMAIS de numéro de page, ni de
  numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône
  (par exemple pour marquer une réussite), nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Reste dans ton sujet. Si une règle appartient à un autre sujet de la liste,
  mentionne-la en une phrase et renvoie vers lui au lieu de la détailler.
- Si le sujet porte sur des jauges ou des ressources, traite CHAQUE jauge
  séparément et donne pour chacune : ce qu'elle mesure, sa valeur de départ,
  ses bornes minimale et maximale, si elle monte ou descend quand la situation
  empire, ce qui la fait bouger dans chaque sens, CE QUI SE PRODUIT À CHAQUE
  SEUIL, et si elle se dépense (on la consomme volontairement) ou si elle
  s'accumule (elle subit les événements).
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  exact du jeu.
```

> *v2 disait* : « - sources : titres exacts des sources utilisées, avec numéros de page » et « Cite tes
> sources par NUMÉRO DE PAGE dans le corps du texte, par exemple « (p. 72) ». »

### Prompt A — la fiche de voix (une fois par système)

```text
Tu analyses UNIQUEMENT les sources de ce carnet. N'invente rien.

Je cherche à décrire la VOIX de ce jeu, pas ses règles. Ignore complètement les
mécaniques chiffrées.

Génère un Markdown que tu sauveras dans le studio, avec ces sections :

## Vocabulaire de la table
- Comment le livre nomme le meneur de jeu (terme exact).
- Comment il nomme les joueurs et leurs personnages.
- Les dix à vingt termes propres au jeu qu'un meneur emploie à voix haute,
  avec en une ligne ce que chacun désigne. Mélange termes de mécanique et
  termes d'univers.
- Les termes génériques de jeu de rôle que ce jeu REMPLACE par les siens.

## Registre
Le ton du livre lui-même : son rythme, son niveau de langue, ce qu'il montre et
ce qu'il tait. Cite deux ou trois formulations caractéristiques du texte.

## Ce que le jeu veut faire ressentir
En trois phrases : l'émotion visée à la table, et par quels moyens le livre dit
qu'on l'obtient.

## Interdits
Ce qu'un meneur de ce jeu ne fait jamais — de ton, de posture ou de traitement
des personnages. Uniquement ce que les sources affirment ou impliquent
clairement.

## Non couvert
Ce que tu n'as pas trouvé dans les sources. Écris « rien » si tout est couvert.

Cite tes sources par titre de section, jamais par numéro de page. Écris les
symboles en toutes lettres. N'échappe pas la ponctuation. N'emploie aucune
ligne de tirets « --- ».
```

> *La version de David disait* : « Cite tes sources par numéro de page. » Seule ligne modifiée, pour la
> raison du § 5. Tout le reste est son texte.

### Prompt B — les huit personas (à enchaîner dans la même conversation)

```text
À partir de la fiche de voix que tu viens de produire et des sources du carnet,
rédige HUIT personas d'assistant IA spécialisées pour ce jeu.

Chaque persona sera placée en tête du prompt d'un assistant. Elle doit donc :

- être AUTOSUFFISANTE : énoncer le rôle de l'assistant ET la voix du jeu, car
  elle remplace intégralement l'instruction générique ;
- faire entre 400 et 700 caractères. Pas davantage : elle est envoyée à chaque
  question, sa longueur se paie à chaque fois ;
- porter du VOCABULAIRE et de la POSTURE, jamais des règles chiffrées. Aucun
  seuil, aucune formule, aucune table : les règles sont fournies séparément à
  l'assistant, et une persona qui les répète finira par les contredire ;
- employer le terme exact par lequel ce jeu désigne le meneur de jeu ;
- inclure une interdiction concrète, tirée de la section « Interdits ».
- L'interdit doit porter sur ce que L'ASSISTANT ne doit pas faire dans son rôle
  précis, et non sur ce que le livre interdit au meneur de jeu. Inspire-t'en,
  mais transpose : un assistant qui résume des séances passées ne peut pas se
  voir interdire d'en planifier la fin.
- N'énonce AUCUNE règle chiffrée ni aucun fait de règle, même en passant, même
  sous forme d'ambiance ("la mort est toujours instantanée"). Les règles sont
  fournies séparément et une persona qui les affirme finira par les contredire.

Ne dis pas « réponds en français » ni « cite tes sources » : ces consignes sont
déjà ajoutées ailleurs.

Les huit rôles :
- sage : les règles, les statistiques, la mécanique. Précis et technique.
- scribe : consigner l'histoire, résumer les séances, organiser les notes.
- oracle : improvisation narrative, ambiance, rebondissements dramatiques.
- bard : enrichir l'univers, lore, détails et textes d'ambiance.
- alchemist : génération technique d'objets et de caractéristiques de PNJ.
- actor : interpréter les PNJ — voix, tics de langage, motivations, dialogues.
- cartographer : décrire les lieux, les paysages, l'architecture.
- strategist : analyser une situation de combat et suggérer des manœuvres.

Réponds UNIQUEMENT par un objet JSON valide, sans commentaire ni bloc de code
autour, exactement de cette forme :

{
  "sage": "…",
  "scribe": "…",
  "oracle": "…",
  "bard": "…",
  "alchemist": "…",
  "actor": "…",
  "cartographer": "…",
  "strategist": "…"
}

Génère le fichier JSON dans le studio sous le nom "gems.json"
```

> Texte de David, non modifié. Les deux clauses les plus chèrement acquises sont les deux dernières
> puces : **transposer l'interdit sur le rôle de l'assistant**, et **aucun fait de règle même en
> passant**. Elles corrigent les deux défauts du premier essai Alien.

**Les huit clés ne sont pas négociables** : `AIService` indexe par `gemId`, et une clé inconnue est du
travail perdu. Elles sont définies dans `src/stores/useGemStore.ts` — Sage, Scribe, Oracle, Barde,
Alchimiste, Acteur, Cartographe, Stratège.
