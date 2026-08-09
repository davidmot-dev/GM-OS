# État et reprise — séance du 2026-08-09 au 10

Écrit pour être lu à froid. **Où on en est, ce qui a changé cette nuit, et par quoi reprendre.**

Branche `feature/tablet-hub-pwa`, tout poussé jusqu'à `e59e61e`. 619 tests verts, typecheck propre.

---

## 1. Par quoi reprendre — le chemin critique

**Passer les gabarits v3 dans la Forge, puis régénérer les fiches avec `sections:`.**

Tout le reste attend ça. Le résolveur titre → page est écrit et testé, mais **son entrée n'existe pas** :
les fiches actuelles portent les treize sujets du canevas, pas des titres de chapitre. Tant que les
fiches ne citent pas de sections, la citation reste invérifiable.

Le travail se découpe ainsi, du moins cher au plus cher :

1. **La passe personas dans la Forge** — la plus rentable. Deux requêtes (prompts A et B), un chemin de
   sortie fixe (`docs/systems/<id>/gems.json`), un contrat déjà verrouillé par un test. Ne dépend de rien.
2. **Remplacer les deux prompts v0 de `ForgeService`** par les gabarits v3. `discoverCandidates`
   (`ForgeService.ts:275`) demande encore « 5 à 8 éléments intéressants » — exactement le « et autres »
   que le plan rejette. `forgeCard` (`:300`) demande « du Markdown riche », sans les six sections ni
   l'interdiction d'inventer. **C'est le seul vrai travail** : la boucle inventaire → fiche existe déjà.
3. **L'étape locale** : conversion des `## Métadonnées` en frontmatter, clé canonique, slug de fichier.
   La logique tient en trente lignes, elle a tourné cette nuit en script jetable.
4. **Piloter la boucle par le canevas** au lieu de laisser le carnet choisir ses sujets.
5. **Inverser `BrainstormOverlay.tsx:93`**, qui écrit la fiche avant de la montrer.

Deux réserves à ne pas oublier en implémentant : le plafond MCP est à 10 minutes pour une vingtaine de
requêtes — sans annulation ni reprise partielle, un échec à la quinzième fiche perd tout. Et renvoyer la
fiche dans le carnet par `source_add` crée une boucle : le carnet citerait ensuite ses propres
productions comme sources.

**Rien n'est demandé à David côté production** : les index sont complets pour les trois livres.

---

## 2. Ce qui a changé cette nuit

| Commit | Objet |
|---|---|
| `427da7c` | **Axe B** — cloisonnement du RAG par système, `.ragignore`, sélection par sujet |
| `13f2865` | Campagnes fantômes supprimées, les trois vraies rattachées |
| `5d5bced` | 15 fiches v1 normalisées |
| `a506f7d` | Corpus Dune intégré, index et personas sortis de `rules/` |
| `f0f8a84` | Pagination marquée non fiable, procédure NotebookLM écrite |
| `f4fd7fc` | Les quatre gabarits consignés en toutes lettres |
| `2ce8314` | Sauvegarde dans le studio, conception du résolveur |
| `1fee85c` | Correction d'un relevé d'index erroné |
| `ccd0bbb` | Index `.docx` intégrés |
| `e59e61e` | **Résolveur** titre de section → page |

### Le point marquant : l'axe B

Le filtre laissait passer les 83 fichiers de `docs/`. **La sélection était identique pour toutes les
campagnes** — en séance Alien l'Oracle recevait *Trinité Fatale* (CoC) et la *Vallée du Vent Glacé*
(D&D), zéro fiche du corpus, et ~93 000 tokens pour un `num_ctx` de 16 384. Ce n'était pas un mauvais
tri, c'était l'absence de tri : `.slice(0, 15)` sur l'ordre alphabétique du disque.

Après : ~4 000 tokens, cloisonné, et **la première source citée est la bonne fiche** sur toutes les
questions testées.

**Deux chaînes mortes réparées au passage**, du même type que `driver.aiPersonas` :
`prepareSystemPrompt` recevait la question sous le nom `_prompt` et la jetait ; et
`campaign.systemPath` / `campaign.campaignPath` étaient saisis, enregistrés, et lus par une fonction
restée en commentaire.

---

## 3. Ce qui reste ouvert, et qui n'est pas dans le chemin critique

- **`docs/commun/`** est reconnu par le moteur mais n'existe pas sur disque.
- **Le plafond de 4 000 tokens ne laisse passer que deux fiches entières** (5 800 caractères de moyenne).
  À réévaluer une fois l'axe A (iGPU) en place. C'est une constante dans `ragSelection.ts`.
- **« Chemin des Règles » est vide** pour les trois campagnes, et elles utilisent toutes des systèmes
  **personnalisés** (`custom-…`). Le rattachement aux règles repose donc sur le repli par nom affiché.
  Ça devrait tenir pour Dune et Blade Runner ; **« A la claire fontaine » est douteux**, parce que
  « Rêve de Dragon » au singulier ne correspond pas au dossier `reves de dragons` au pluriel. À remplir
  dans la fiche de campagne : `systems/dune`, `systems/blade-runner`, `systems/reves de dragons`.
- **Régénérer les 15 fiches v1** (Blade Runner ×4, NOC ×4, Rêves de Dragons ×7) avec les gabarits v3.
  Elles portent `a_regenerer: true`, la file est interrogeable au `grep`.
- **Trois paires de doublons** marquées `doublon_de:`, à fusionner à la régénération et pas avant.
- **Couverture réelle** : dune 13 sujets sur 13, alien 11, blade-runner 12, **noc 2, rêves de dragons 3**.

---

## 4. État du corpus

| Système | Fiches (avec `sujet:`) | Index | Personas |
|---|---|---|---|
| dune | 17 + inventaire | TOC `.docx` (736 entrées) + index `.md` | ✓ |
| alien | 17 + 1 guide v1 | `.md` (220 entrées) | ✓ |
| blade-runner | 13 | `.md` (63 entrées) | — |
| reves de dragons | 7 (toutes v1) | — | — |
| noc | 4 (toutes v1) | — | — |
| coc7, cthulhu hack, nephilim, dnd-5e | — | — | — |

**Toute la pagination du corpus est marquée non fiable** (`pages_fiables: false` sur 46 fiches) et
l'Oracle a interdiction de reprendre une page. Les pages restent dans le corps des fiches comme
indication d'ordre de grandeur pour un lecteur humain.

---

## 5. Trois choses à ne pas redécouvrir

- **Le journal du process principal doit passer par `electron-log`**, jamais par `console`. Rien ne
  collecte la sortie standard du main. `auditLog.ts` le documentait déjà — et je suis quand même tombé
  dedans en écrivant le journal du RAG.
- **Le meilleur format d'index dépend du livre, pas du type de fichier.** Le `.docx` de Dune donne 614
  paires titre/page contre 122 pour son `.md` ; ceux d'Alien et de Blade Runner en donnent **zéro**,
  leur conversion Word ayant atomisé les titres lettre par lettre.
- **Sonder un format d'extraction sur tout le fichier avant de conclure sur son contenu.** Mon premier
  relevé s'arrêtait à la première moitié et m'a fait annoncer que deux fichiers ne contenaient qu'un
  seul objet, alors qu'ils en contiennent deux.

---

## 6. Les documents de référence

| Document | Contenu |
|---|---|
| `2026-08-08-corpus-de-regles.md` | La **conception** : canevas des 13 sujets, modèle, test de socle |
| `2026-08-09-procedure-corpus-notebooklm.md` | L'**opératoire** : procédure pas à pas, interdits, les quatre gabarits en toutes lettres (§ 8), résolveur (§ 5) |
| `2026-08-07-acceleration-ia.md` | Les **axes A à O**, dont le bilan de l'axe B |
| `Lessons_Learned.md` | Les pièges techniques durables |
