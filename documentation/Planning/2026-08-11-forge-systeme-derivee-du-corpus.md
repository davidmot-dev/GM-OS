# La Forge Système, dérivée du corpus — plan du 2026-08-11

Écrit pour être lu à froid. Fait suite à `2026-08-10-soiree-premiere-forge.md`, dont le § 1 quater
ouvrait le chantier des quatre murs. **Les quatre murs sont abattus** ; ce document traite de ce
qu'ils rendent possible, et de ce qu'ils rendent nécessaire.

Branche `feature/tablet-hub-pwa`. 890 tests verts, `tsc -b` propre, build vérifié.

---

## 0. Pourquoi ce chantier existe

David, le 2026-08-11 : *« avant de forger le système Alien, est-ce qu'on ne devrait pas revoir le
mécanisme de Forge Système ? »* — et il avait raison. Vérification faite, le prompt de
`getSystemForgePrompt` réclame `dice`, `combat.statsToTrack`, `initiativeFormula`,
`defaultHealthType`, `ui_config`, `aiInstructions`.

**Aucun des quatre champs que les murs ont ajoutés** : ni `jet`, ni `ressourcesDeTable`, ni
`combat.initiative`, ni `combat.tacheDeDefaite`.

Pire que l'absence : **l'exemple de sortie est faux**. C'est le seul modèle que le modèle ait sous
les yeux, et il code en dur ceci :

```json
"statsToTrack": [ { "fieldId": "hp", "label": "PV", "isMainHP": true } ],
"initiativeFormula": "dex",
"defaultHealthType": "hp"
```

Il enseigne donc que tout jeu a des points de vie et une Dextérité. C'est le même défaut que
`DEFAULT_GAME_DRIVERS` vide — pas d'étalon correct — sauf qu'ici l'étalon est **faux plutôt
qu'absent**, ce qui est pire : le modèle le copie.

---

## 1. L'idée qui structure le plan

**La Forge Système ne devrait pas lire le livre.** L'Atelier l'a déjà lu, a vérifié ses pages, et a
produit dix-sept fiches v3. Le pilote n'est pas une extraction du livre : c'est une **projection des
fiches** dans les champs que l'application consomme.

La correspondance est complète, et ce n'est pas un hasard — le canevas avait été dérivé de ce que le
code exploite :

| Champ du pilote | Sujet du canevas qui le porte |
|---|---|
| `dice`, `jet` | Résolution des jets, Degrés de réussite |
| `combat.initiative` | Initiative et déroulement du tour |
| `combat.tacheDeDefaite` | Santé et blessures |
| `ressourcesDeTable` | Monnaie de table |
| `statsToTrack`, `ui_config.gauges` | Jauges et ressources individuelles |
| `tactical.ranges` | Distances et portées |
| `template.sections[].fields[]` | **Composition de la fiche de personnage** (sujet 14) |

Ce que cela achète : une fiche pèse ~5 Ko contre 100 000 caractères de livre ; chaque valeur du
pilote devient traçable jusqu'à une page vérifiée ; et la règle déjà posée est respectée — *dériver
du corpus, pas produire en parallèle*, parce que deux productions indépendantes des mêmes faits
divergeront et que rien ne les comparera jamais.

---

## 1 bis. Le quatorzième sujet — **fait** (`5f66c1a`)

Relevé par David : *« ce que les fiches ne vont pas refléter, c'est la composition de la fiche de
personnage ou les éléments qui gèrent les compétences »*. Vérifié, et c'est exact.

Les treize sujets sont **tous des mécaniques de résolution**. Aucun ne dit ce que porte une fiche.
Or la Forge produit `driver` **et** `template`, et le second n'avait aucune source.

**Dune s'en est tiré par accident.** Ses cinq Compétences et cinq Principes sont apparus dans
`l-equation-statistique-duale-competence-plus-principe.md`, une fiche **hors canevas** que le carnet
a proposée de lui-même. Rien ne l'avait demandée. Alien n'a pas eu cette chance : ses trois hors
catégories parlent de vélocité d'approche, de synthétiques et de xénomorphes.

Nuance qui rend le sujet acceptable, écrite dans l'énoncé comme dans le gabarit : **on demande ce que
porte une fiche finie, pas comment on la remplit.** L'achat de points, les archétypes et les
historiques restent exclus — ce sont les chapitres les plus volumineux des livres, et c'est pour eux
que l'exclusion existe. Un inventaire, pas une procédure.

Couverture partielle préexistante, à ne pas confondre : « Jauges et ressources INDIVIDUELLES » ramène
déjà le stress, la santé mentale, les points de magie. Ce sont **les jauges, pas la liste des
caractéristiques**.

**Conséquence : les trois inventaires existants sont périmés** et doivent être relancés (72 s
chacun). Ceux d'Alien et de Blade Runner portent de toute façon un `sujets_traites: 0 sur 13` faux,
hérité du parseur corrigé en `86a65ae`.

---

## 2. Les axes, dans l'ordre

### Axe 0 — Mesurer avant de toucher — **fait le 2026-08-11**

**Résultats, sur `gemma4:12b`, machine de David.**

| Mesure | Valeur |
|---|---|
| `num_ctx` déclaré par le Modelfile | **aucun** (seulement temperature, top_k, top_p) |
| Contexte alloué, annoncé par `/api/ps` | 16 384 |
| **Tokens réellement traités, prompt de ~55 800 tokens** | **8 195** |
| Prefill | **15,2 tok/s** (537 s pour 8 195 tokens) |
| Modèle en VRAM | **0 Go** sur 9,2 Go — iGPU inutilisé |
| Tokenisation du français | **2,92 caractères par token**, pas 4 |

**Le budget d'invite réel est donc d'environ 8 000 tokens, soit ~23 000
caractères** — la moitié de ce que `/api/ps` annonce. Contre `MAX_TEXT_CHARS =
100 000`, cela fait **77 % de l'invite jetés en silence**. Le défaut du RAG à
l'identique.

**Et la conclusion qui va plus loin que prévu :** envoyer tout le corpus ne
marche pas mieux que d'envoyer le livre (Dune : 100 837 caractères, 77 % jetés).
Seul le découpage par groupe de champs tient — deux fiches ≈ 11 000 caractères
≈ 3 800 tokens, soit la moitié du budget. **L'axe 2 n'est donc pas seulement
plus juste, il est la seule façon de tenir dans le contexte.**

Mais 3 800 tokens à 15,2 tok/s font **quatre minutes de prefill par groupe**, et
six groupes font vingt-cinq minutes. **L'iGPU cesse d'être un confort** : le plan
IA du 2026-08-07 mesurait × 4,7 sur le prefill, ce qui ramènerait un groupe à
cinquante secondes. C'est lui qui décide si la Forge dérivée est utilisable.

**Deux pièges de mesure rencontrés, à ne pas refaire.**

1. La première sonde a rendu **7 722 tok/s de prefill** — impossible. Une
   tentative précédente avait envoyé le *même* prompt : Ollama a répondu depuis
   son cache de préfixe. **Saler le prompt à chaque exécution**, sinon on mesure
   le cache.
2. `fetch` est inutilisable : undici coupe les en-têtes à cinq minutes, et un
   prefill de 8 195 tokens en prend neuf. Passer par `http` brut avec
   `setTimeout(0)`.

*Non mesuré, et qui compte pour la suite :* le débit de décodage réel, et le
fait que l'application n'envoie **pas non plus de `num_predict`** — la génération
est donc non bornée.

#### Le raisonnement d'origine

`electron/OllamaService.ts` n'envoie **aucun bloc `options`** dans sa requête : ni `num_ctx`, ni
`num_predict`, ni `temperature`. Le contexte effectif est donc celui du Modelfile, ou le défaut
d'Ollama. **Ce n'est pas une affirmation, c'est la première chose à mesurer** — elle décide de tout
le reste.

Ce qui rend la mesure urgente : `forgeSystem` consolide **jusqu'à 100 000 caractères** et les envoie
en **un seul prompt**. Si le contexte effectif est bas, l'essentiel du livre est jeté en silence
avant que le modèle ne commence. Ce serait le défaut du RAG à l'identique — ~93 000 tokens envoyés
pour un `num_ctx` de 16 384, *un problème de qualité déguisé en problème de vitesse*.

À relever, sur une forge réelle : le contexte annoncé par Ollama, les tokens réellement reçus, la
durée de prefill et de décodage. Le journal du pont (`~/mcp_bridge_debug.log`) est la meilleure
source — **ne jamais le lire en entier**, toujours extraire.

*Dix des douze défauts du 2026-08-10 ont été trouvés en regardant tourner, pas en lisant le code.*

### Axe 1 — Le canevas du pilote

Fermé, ne contenant **que ce que l'application consomme**.

- Retirer `aiInstructions` : vérifié le 2026-08-10, il n'atteint aucun modèle. `AIService` construit
  son invite depuis les instructions de la gemme, le `gems.json` du corpus et les `aiPersonas` du
  gabarit.
- Retirer `critRange` : aucun lecteur.
- Ajouter les quatre champs des murs.
- **Remplacer l'exemple de sortie par le pilote Dune de référence**, qui n'a pas de points de vie.
  Un exemple juste plutôt qu'un exemple de D&D.

*Une forge qui remplit des champs morts est invérifiable.*

### Axe 2 — Dériver du corpus

La Forge Système lit les fiches v3 du corpus désigné, pas le livre. **Un appel par groupe de champs**
plutôt qu'un appel géant : c'est la scission qui a fait passer les fiches de l'échec à 60 secondes
par moitié, et il n'y a aucune raison que la leçon ne vaille pas ici.

Le `template` sort du sujet 14 ; le `driver` sort des six autres correspondances du tableau du § 1.

### Axe 3 — NotebookLM pour ce qui manque seulement

Le corpus ne couvre pas tout. Quand un champ n'a pas de source, interroger le carnet par
`notebook_query` — la chaîne qui **marche** — au lieu de rapatrier du texte brut par
`source_get_content` pour le faire lire à Ollama.

C'est l'inversion déjà inscrite au plan IA du 2026-08-07 : *les deux chaînes NotebookLM font
l'inverse l'une de l'autre*. Elle vaut ici plus qu'ailleurs, puisqu'une réponse de
`source_get_content` fait 2,7 Mo sur une seule ligne.

**Cet axe ne se justifie qu'une fois qu'on sait ce que le corpus ne couvre pas** — donc après
l'axe 2, jamais avant.

### Axe 4 — Le pilote se vérifie

Les tests des quatre murs existent déjà, mais seulement pour Dune (`src/data/duneReference.test.ts`).
Les généraliser en contrôles applicables à **tout pilote forgé** :

- chaque `fieldId` de `statsToTrack` et des jauges pointe un champ réel de la fiche ;
- chaque `sectionId` du descripteur de jet et de la tâche de défaite existe ;
- la réserve qui paie les dés supplémentaires est déclarée dans `ressourcesDeTable` ;
- la formule d'initiative n'invoque que des champs réels.

Le défaut que cela attrape est toujours le même : `CombatCard` va chercher une valeur **par son
identifiant** en pleine séance ; un `fieldId` qui ne correspond à rien affiche une jauge à zéro. Pas
d'erreur, pas de champ en rouge — une jauge à zéro, *qui ressemble à un personnage en pleine forme*.

---

## 3. Ce qui reste à trancher

**Le sort de `analyzeRulebookText`.** Une seconde chaîne, plus ancienne, lit un texte de règles brut.
Si la Forge dérive du corpus, elle fait doublon — mais elle sert peut-être un cas non repéré. Ne pas
la supprimer sans avoir cherché son appelant.

**Le moment du pilote d'Alien.** On peut le forger dès l'axe 2 fini, ou attendre l'axe 4 pour qu'il
naisse vérifié. **Recommandation : attendre.** Alien a un corpus propre et aucun pilote — c'est le
cas d'essai idéal, et le forger avant les contrôles reviendrait à ne pas savoir si le résultat est
bon.

---

## 4. Les règles à ne pas défaire

- **L'outil suit l'état, il n'arbitre pas.** Encoder les règles de chaque jeu est le piège où meurent
  les projets de ce genre.
- **Ne rien refuser sans motif écrit.** Une réserve trop basse avertit, une rétention interdite
  affiche sa raison. Un bouton grisé sans explication est une énigme.
- **Vérifier sur la charge réelle, jamais sur un exemple qu'on a écrit soi-même.** Le test de la
  tablette fabriquait une forme que l'application ne produit nulle part ; il passait au vert pendant
  que l'écran restait muet.
- **Ne pas tenir un corpus vivant par un nombre gelé.** Un test qui échoue *parce qu'on avance* finit
  par être recalé sans être lu.
- **`tsc --noEmit -p tsconfig.json` ne vérifie rien** — la racine a `"files": []`. Le vrai contrôle
  est `tsc -b`, et c'est ce que `npm run build` exécute.
