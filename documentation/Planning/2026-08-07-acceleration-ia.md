# Intégrations IA — préparation et partie

**Date :** 2026-08-07, consolidé le 2026-08-08
**Branche :** `feature/tablet-hub-pwa`
**Statut :** ~~plan de conception — aucun code applicatif écrit~~ · **référence vivante — le socle est posé
(A, B, C, D), le reste est ouvert.** Tableau d'état au § 4, à jour du 2026-08-22.
**Document jumeau :** `2026-08-07-fiabilite-cortex-combat.md` (fiabilité des entrées du Cortex)

**Historique des cadrages.** Première version : optimiser la vitesse de l'IA. Deuxième : partir du
budget de temps réel de chaque usage. **Celle-ci** part de la partition que David a formulée —
*« il y a une partie de l'application qui sert à la préparation, et une partie destinée à l'aide en
partie ; les temps de réponse n'ont pas le même impact dans l'un ou l'autre contexte »*. C'est le bon
cadre, et il réordonne tout le reste.

---

## 1. Le cadre : deux moments, pas trois modules

Les deux premières versions attachaient les budgets aux **modules** (Forge, Oracle, Cortex). C'était
faux : plusieurs modules servent dans les deux moments. Préparer une galerie de PNJ le samedi matin et
improviser un tavernier en pleine partie, c'est le même code et deux exigences opposées.

**Le budget appartient au moment, pas au module.**

| | **Préparation** | **En partie** |
|---|---|---|
| Ce qui compte | la qualité, la profondeur | la latence, la prévisibilité |
| Tolérance | minutes, si non bloquant | dizaines de secondes |
| Contexte | complet | allégé par défaut |
| Fournisseur | cloud autorisé, au choix | local |
| Image | diffusion locale acceptable | cloud uniquement |
| Délai d'abandon | large, **mais il en faut un** | strict, avec dégradation |
| Exécution | **file d'attente, non bloquante** | synchrone et bornée |

**Deux conséquences que les versions précédentes avaient manquées :**

**En préparation, le défaut n'est pas la durée mais le blocage.** Quinze minutes ne coûtent rien si l'on
peut préparer ses images pendant ce temps. Ce qui coûte, c'est la fenêtre modale qui immobilise. La file
d'attente en tâche de fond réglerait le problème de la Forge **sans rien accélérer** — c'était classé en
confort, c'est en réalité le cœur du sujet côté préparation.

**En partie, il vaut mieux dégrader qu'attendre.** Une réponse allégée en 60 s bat une réponse complète
en 6 min. Cela suppose que chaque appel sache produire une version réduite de lui-même — ce que
l'option `lite` permet déjà, et que presque personne n'utilise.

### 1.1 Les budgets, conséquences du moment

| Usage | Moment | Référence | Budget |
|---|---|---|---|
| Forge (système, chronique, règles) | préparation | — | minutes, en tâche de fond |
| Médiathèque, images, personas, templates | préparation | — | minutes, en tâche de fond |
| Oracle | partie | feuilleter un livre papier | **1 à 2 min** |
| Cortex | partie | le tour en cours | **30 à 60 s** |
| PNJ à la volée, butin, voix, narration | partie | l'attention des joueurs | **< 1 min** |
| Curation, chronique, traitement des lacunes | **après-partie** | — | aucune contrainte |

Le budget de l'Oracle vient d'un constat de David : chercher une règle dans un livre prend déjà une à
deux minutes, donc une réponse en 90 s n'est pas un échec. Le Cortex est plus serré, non parce qu'il est
plus lent, mais parce que **son conseil se périme** : un avis tactique arrivé après que le joueur a agi
ne vaut rien, alors qu'une réponse de règle reste valable.

### 1.2 Le signal de mode existe déjà et n'est pas consulté

`Campaign.activeSessionId` combiné à `status === 'active'` dit si une partie est en cours. Posé par
`SessionManager.ts:57-60`, clos depuis le cockpit (`CampaignCockpit.tsx:167-177`, bouton vert pulsant
avec confirmation). Lu par cinq composants d'interface — **jamais par `AIService`**. Aucune notion de
mode n'existe côté IA : ni `inSession`, ni `prepMode`.

Ce signal a les quatre propriétés qu'on demande à un mode :

| Propriété | Vérifiée |
|---|---|
| **Visible** | bouton vert pulsant dans le cockpit, impossible à manquer |
| **Explicite dans les deux sens** | démarrage et clôture par le MJ |
| **Unique globalement** | `SessionManager` rétrograde toute autre session active |
| **Déjà correctement gardé** | tous les lecteurs testent `&& s.status === 'active'` |

**Pourquoi « visible et contrôlé » est décisif.** Un mode implicite produirait la pire expérience
possible — *« pourquoi c'est lent aujourd'hui ? »*, sans rien pour l'expliquer. Un mode déclaré par le
MJ produit *« ah oui, ma session est ouverte »*. C'est cette visibilité qui autorise à lui faire porter
des décisions réelles ; sans elle, ce serait de l'action à distance.

**Corollaire : ne pas chercher à être malin.** D'autres signaux existent — combat en cours, Hub ouvert,
tablette connectée. Les mélanger serait une erreur : **toute la valeur du signal vient de ce qu'il est
déclaré, pas inféré.** Un mode mi-déclaré mi-deviné redevient imprévisible, donc indigne de confiance.
**Un seul signal, celui que le MJ contrôle.**

**Deux précautions :**

- **Le lire globalement, pas par campagne.** Les lecteurs actuels testent
  `activeCampaign.activeSessionId`. Or une seule session est active globalement : changer de campagne
  ferait passer l'indicateur à `null` et **éteindrait le mode sans que rien ne soit terminé**, débloquant
  silencieusement le cloud et le contexte complet.
- **Le mode donne des défauts, jamais un verrou** (§ 4.7).

### 1.3 Un troisième moment : l'après-partie

La partition en deux moments en oubliait un, **déjà à moitié implémenté** :
`useJournalStore.ts:234-235` résume la séance, `:286` la pousse dans NotebookLM via `source_add`, et
`ObsidianExportService` exporte la campagne.

C'est le moment où **la boucle se referme** : le journal des lacunes devient la file de la Forge, la
séance devient chronique, la chronique devient source. Ce document décrivait le journal des lacunes sans
jamais dire *quand* il est traité — la réponse est ici. Sans pression de temps, mais c'est le seul moment
où la mémoire est encore fraîche.

**Deux décisions de David y ont été prises** — résumer en deux étapes plutôt qu'en une, et structurer la
séance en actes et scènes — mais elles relèvent d'un modèle de données narratif plutôt que des
intégrations IA. Elles ont donc leur propre document :

> **`documentation/Planning/2026-08-08-trame-narrative-cycle-seance.md`**

**Ce qu'il faut en retenir ici :** la trame donne à l'Oracle et au Cortex un contexte **de la bonne
taille et de la bonne forme** — *« scène en cours : l'embuscade de l'entrepôt, les PJ cherchent le
manifeste »* remplace avantageusement les dix derniers événements bruts de `getLiveSessionContext`, pour
quelques dizaines de tokens. C'était la pièce manquante du Cortex, que l'axe C se contentait de couper
du lore.

**Et un bug y a été trouvé :** `AIService.summarizeSession` ne gère que Gemini et retourne sinon la
chaîne littérale `"Résumé non disponible pour ce fournisseur d'IA."` — le garde ligne 246 laisse passer
Ollama. **Les résumés de séance n'ont donc jamais fonctionné sur le fournisseur par défaut de David**, et
cette phrase a pu être poussée telle quelle dans NotebookLM. À vérifier sur les données enregistrées.

---

## 2. Banc de mesure

**Machine :** Intel Core Ultra 9 285H · iGPU Intel Arc 140T (17,9 Gio partagés) · 31,4 Gio RAM
**Ollama :** 0.32.6 · `OLLAMA_CONTEXT_LENGTH=16384` · `OLLAMA_KEEP_ALIVE=5m` ·
`OLLAMA_FLASH_ATTENTION=false` · `OLLAMA_VULKAN=true` · `OLLAMA_IGPU_ENABLE=` (vide)
**Modèle :** `gemma4:12b` (Q4_K_M, 11,9 B)

Méthode : second serveur Ollama sur le port 11500 avec `OLLAMA_IGPU_ENABLE=1`, pour comparer sans
toucher au serveur de l'application.

| Mesure | CPU seul | iGPU activé | Rapport |
|---|---|---|---|
| Décodage `gemma4:12b` | 5,5 tok/s | 6,1 tok/s | × 1,1 |
| Prefill `gemma4:12b` (10 953 tokens) | 15,3 tok/s | **71,9 tok/s** | **× 4,7** |
| **Charge CPU pendant l'inférence** (moyenne, modèle chaud) | **81 %** | **25 %** | **− 56 points** |
| Charge CPU en pointe | 88 % | 52 % | — |
| Génération complète de 120 tokens | ~19 s | ~11 s | × 1,7 |
| Décodage `llama3.2:3b` | 15,2 tok/s | non mesuré | × 2,8 vs 12b |
| Chargement du modèle | 0,9 s (cache chaud) | 36,7 s (à froid) | — |

**Interprétation en trois temps.**

**Sur le débit brut.** Le décodage est limité par la bande passante mémoire, que l'iGPU partage avec le
CPU : l'activer n'y change presque rien (× 1,1). Le prefill est limité par le calcul : l'iGPU y est
presque cinq fois plus rapide. **L'iGPU ne fait pas écrire plus vite, il fait lire beaucoup plus vite.**

**× 1,1 est un plancher, pas le gain réel.** C'est le rapport en décodage pur. Toute génération réelle
mélange prefill et décodage, donc se situe **entre × 1,1 et × 4,7**, et penche d'autant plus vers le haut
que le contexte est long. Mesuré sur une génération complète à prompt court : × 1,7. Pour l'Oracle, dont
le contexte pèse des milliers de tokens, on s'approche du × 4,7.

**Et surtout — ce que le débit ne dit pas.** Remarque de David : le CPU gère aussi l'affichage et
l'application, l'iGPU ne ferait que l'IA. Mesure faite, **il a raison, et l'effet dépasse le gain de
débit** : l'inférence CPU consomme **81 % de la machine en moyenne, pendant toute la génération**.
Sur un prefill de 18 minutes, c'est dix-huit minutes à 81 % — pendant lesquelles le rendu React, la
synchronisation WebSocket vers la tablette, le tableau blanc et les fenêtres Hub et projecteur se
disputent ce qui reste. L'offload ramène cette charge à 25 %.

> **Réserve honnête.** L'Arc 140T pilote aussi l'affichage. Y déporter l'inférence la met en concurrence
> avec le compositeur de Chromium, alors que GM-OS emploie des effets coûteux (flous, halos, animations)
> sur trois fenêtres. Le compromis n'est donc pas « gratuit » : l'inférence CPU affame le JavaScript et
> le rendu, l'inférence iGPU dispute le compositing. **Le premier me paraît nettement pire** — le travail
> de GM-OS est surtout piloté par l'état, et un flou sur un panneau immobile n'est pas recomposé à chaque
> image. Mais **cela s'observe en séance réelle, pas au banc** (§ 8).

Volume assemblé par le RAG, simulation sur `docs/` :

```
fichiers indexés        : 49
fichiers « pertinents » : 48  (sur 49)
contexte assemblé       : 259 787 caractères  (~72 163 tokens)
plafond num_ctx 16384   : 77 % jeté silencieusement
```

> **Réserve à lever avant de figer le chiffrage.** Si le RAG a été repointé sur le coffre Obsidian
> (`RAGService.ts:36-39`), le volume diffère. Le défaut de structure est identique dans les deux cas.

**Autres vérifications par test réel :**

- Ollama 0.32.6 **supporte les sorties structurées natives par schéma JSON**. Concluant.
- `webContents.findInPage()` **fonctionne sur le lecteur PDF interne** (Electron 34.5.8 / Chrome 132),
  renvoie `matches` et `activeMatchOrdinal`, après ~3 s d'initialisation du greffon. `#page=N` fonctionne.
  Le fragment `#search=` charge sans erreur **mais rien ne prouve qu'il soit honoré** — ne pas s'en servir.

---

## 3. Diagnostic

### 3.1 Le filtre du RAG ne filtre rien — `electron/RAGEngine.ts:109-127`

```ts
const isSystemRelevant   = segments.some(s => s.includes(sys))  || lowerPath.includes('systems');
const isCampaignRelevant = segments.some(s => s.includes(camp)) || lowerPath.includes('campaigns');
const score = (lowerPath.includes(sys) ? 2 : 0) + (lowerPath.includes(camp) ? 2 : 0);
return results.slice(0, 15).join('\n\n---\n\n'); // Limit to top 15 matches for token safety
```

1. `lowerPath.includes('systems')` fait matcher **tout fichier sous `docs/systems/`**. Comme tout le
   corpus y vit, 48 fichiers sur 49 passent.
2. **Le `score` est calculé puis jamais utilisé.** Aucun tri avant le `slice(0, 15)` : les 15 fichiers
   retenus le sont dans l'ordre d'itération, donc arbitrairement.
3. **Aucun plafond global.** 15 × 50 000 caractères possibles. Le commentaire annonce une garantie que
   le code n'assure pas.

> Troisième occurrence dans ce dépôt de la même leçon : *un commentaire qui énonce une garantie n'est
> pas une garantie.*

**Portée du correctif : vingt modules consomment `AIService`.** Réparer le RAG les sert tous.

### 3.2 L'ordre du prompt interdit la réutilisation du cache — `AIService.ts:722-726`

```
[persona — stable]  →  [CONTEXTE VIVANT — change à chaque tour]  →  [RAG — stable et volumineux]
```

Ollama réutilise le KV-cache tant que le **début** du prompt est identique. Le bloc volatil (PV, round,
tour) précède le bloc massif et stable : dès qu'un PJ perd un point de vie, tout le cache du RAG est
invalidé. **Inverser ferait payer le prefill des règles une fois par séance au lieu d'une fois par
question.**

### 3.3 Rien n'est annulable, et un seul créneau existe

**Aucun `AbortController`, aucun `signal`, aucun verrou de concurrence dans toute la chaîne IA.**

- Le délai de 45 min (`AIService.ts:60` et `:821`) est un `Promise.race` : il rejette la promesse **mais
  la génération continue côté Ollama**.
- `OLLAMA_NUM_PARALLEL: 1` : cette génération **occupe l'unique créneau**.
- Fermer la fenêtre n'y change rien.

**Conséquence : une Forge lancée par erreur en séance bloque l'Oracle et le Cortex pour toute sa durée
réelle, quoi que fasse le MJ.** C'est le défaut le plus structurant du lot — il rend inopérant tout
plafond de temps, et il conditionne la pause de séance (§ 4.7).

Incohérence annexe : le MCP est plafonné à 10 min (`ForgeService.ts:341`), le modèle à 45.

### 3.4 Troncature silencieuse

`ForgeService.ts:42` — `MAX_TEXT_CHARS = 100000` (~28 000 tokens). RAG — jusqu'à ~72 000 tokens. Serveur
— `num_ctx = 16384`. Ollama tronque sans rien signaler.

**Augmenter `num_ctx` n'est pas la solution** : à 15,3 tok/s, 16 384 tokens coûtent déjà 17,8 min de
prefill. Il faut **envoyer moins**, pas pouvoir envoyer plus.

### 3.5 Le Cortex envoie son contexte en double — `useTacticalAIStore.ts:89-114`

Le second appel construit son prompt système complet (ligne 103, RAG inclus), puis le transmet à
`generateJSON`, qui le repasse en `customContext` à `prepareSystemPrompt` — lequel **y concatène à
nouveau le RAG** (`AIService.ts:726`).

- Le commentaire ligne 112 annonce une « exécution parallèle » : sous `NUM_PARALLEL=1`, **les deux
  appels font la queue**.
- Aucune `ragOptions` n'est passée : le Cortex charge **tout le lore de campagne** pour répondre à
  « attaquer ou se déplacer ? », alors que `TacticalNarrativeService` lui a déjà préparé un rapport
  de situation précis.

> **Périmètre.** Ce document ne traite que la **performance** du Cortex. Ses défauts de **fiabilité** —
> config tactique du système ignorée, faction devinée, lien jeton fragile — relèvent du document jumeau.
> **Accélérer un module dont les entrées sont fausses ne ferait que produire des conseils faux plus vite.**

### 3.6 Les usages en partie qui font un travail de préparation

Inventaire des vingt consommateurs d'`AIService`, côté partie :

| Module | Appel | Problème |
|---|---|---|
| **PNJ à la volée** | `useNPCStore.ts:150` puis `:167` | **deux appels texte portant chacun le RAG complet**, sans `lite` ni `ragOptions` — pour inventer un tavernier sans rapport avec le corpus de règles |
| **Portraits, cartes, PJ** | `useNPCStore.ts:231`, `crossDomainHelpers.ts:93,115,138` | voir ci-dessous |
| Carte de combat | `CombatCard.ts:135` | RAG complet |
| Narration de carte | `useNarrativeGenerator.ts:66` | RAG complet |
| Profils de voix | `useVoiceStore.ts:263` | RAG complet |
| Générateur de butin | `LootGeneratorPanel.tsx:62` | **fait déjà bien** — voir § 3.8 |

### 3.7 La génération d'image en partie choisit l'option la plus lente, sans délai d'abandon

`AIService.ts:324-338` : si le fournisseur actif est Ollama — le cas de David — la génération tente
**d'abord un modèle de diffusion local**, basculant sur `x/flux2-klein:latest` si le modèle courant est
un modèle texte. Ce modèle est installé (5,7 Go). Sur une machine mesurée à `size_vram: 0`, c'est de la
diffusion sur CPU.

**Et il n'existe aucun délai d'abandon** : ni dans `OllamaService.generateImage`, ni dans
`AIService.generateImage` — le plafond de 45 min ne couvre que `generateText`. Un portrait demandé à
table peut donc bloquer indéfiniment **avant même d'atteindre les replis cloud**, qui répondraient en
quelques secondes.

**C'est le correctif au meilleur rapport gain/effort du document** : quelques lignes contre un blocage
potentiellement illimité en pleine partie.

### 3.8 Ce qui fonctionne déjà, et qu'il faut généraliser plutôt que réinventer

`LootGeneratorPanel.tsx:16,62` expose un basculement `useFullContext`, **par défaut en mode allégé**,
transmis en `{ lite: !useFullContext }`. C'est le seul endroit où le choix de contexte est conscient et
offert au MJ. **C'est le motif à généraliser.**

De même, `RAGEngine.ts:249-270` (`writeDoc`) déclenche `updateIndex()` après écriture : une fiche forgée
est immédiatement visible de l'Oracle. Et `:255` confine délibérément les écritures à `docs/`.

### 3.9 Défauts secondaires

| Constat | Emplacement | Effet |
|---|---|---|
| `ChronicleService` n'active pas `lite` | `ChronicleService.ts:53` | empile RAG + contexte de session |
| Aucun `format` ni `options` transmis à Ollama | `OllamaService.ts:37-43` | pas de contrôle de `num_ctx`/`num_predict` ; JSON extrait au regex, chaque échec coûte une génération complète |
| `keep_alive` à 5 min | serveur | rechargement à froid (37 s sur iGPU) |
| `OLLAMA_FLASH_ATTENTION=false` | serveur | KV-cache plus lourd sur les longs contextes |
| `.jsonl` non indexés | `RAGEngine.ts:142` | 600 Ko déjà chunkés avec métadonnées, ignorés |

### 3.10 État du corpus

**Trois générations d'approche coexistent.**

| Génération | Exemple | Taille |
|---|---|---|
| 1 — décharges brutes | `_source_extracted.txt`, `Dune.txt` | 0,9 à 1,8 Mo |
| 2 — extractions thématiques | `combat_and_panic.md`, `core_mechanics.md` | 20 à 120 Ko |
| 3 — **fiches par sujet** | `rules/jet-ethylisme.md` | 5 à 6 Ko |

**La génération 3 est la bonne forme, et elle existe déjà** — produite par l'Atelier de règles
(`BrainstormOverlay.tsx:66-99`). Elle ne couvre que 3 systèmes sur 9 :

| blade-runner | noc | rêves de dragons | alien, coc7, cthulhu hack, dnd-5e, dune, nephilim |
|---|---|---|---|
| 4 fiches | 4 | 7 | **0** |

**Redondance :** le livre Alien existe en **quatre copies recouvrantes** (~4,9 Mo), Cthulhu Hack en trois
(~1,5 Mo). Quatre copies, c'est trois chances sur quatre de servir le même passage et d'en manquer un
autre. **Dédupliquer avant d'optimiser la récupération.**

### 3.11 Les deux chaînes NotebookLM font l'inverse l'une de l'autre

**Chaîne A — l'Atelier de règles (fonctionne).** `notebook_query` fait distiller le document **chez
Google** ; la fiche de 5 Ko revient et part dans `docs/systems/<id>/rules/`. Le livre ne transite jamais
par Ollama.

**Chaîne B — Forges Système et Chronique (coince).** `ForgeDashboard.tsx:212` appelle
**`source_get_content`**, qui renvoie le **texte brut intégral**, lequel part dans les 100 000 caractères
de `forgeSystem` puis se fait tronquer. **NotebookLM n'y est qu'un presse-papier** : on confie la
digestion au composant qui en est le moins capable.

---

## 4. Axes de travail

### État des axes — vérifié dans le code le 2026-08-22

> ⚠️ **CE TABLEAU EST DATÉ, ET IL NE SE MET PLUS À JOUR.** Il est le compte rendu de la relecture du
> 2026-08-22, et rien d'autre. **L'état vivant des axes restants — et l'ordre — vivent dans
> `2026-08-22-acceleration-ce-qui-reste.md`, et là seulement.**
>
> *Un reste vit à un seul endroit, et les autres y renvoient.* Deux tableaux d'état sur le même sujet
> divergeraient en une semaine, et c'est exactement ce que la réconciliation du 19/08 a coûté à
> reconstituer.

| Axe | État | |
| --- | --- | --- |
| **A** — iGPU | ✅ 12/08 | `OLLAMA_IGPU_ENABLE=1`, mesures au § 2 |
| **B** — réparer le RAG | ✅ 09/08 | bilan dans `2026-08-08-corpus-de-regles.md`, § 5 |
| **C** — ordre du prompt + Cortex | ✅ 21/08 | `4a17b4d`. Le point 2 était déjà fait ; le point 4 a retiré un **commentaire mensonger** — voir ci-dessous |
| **D** — annulation, verrou, plafonds | ✅ 21/08 | `9069da3` puis `e2d50dc` (D.4, D.5). **Aucun plafond n'était réel avant** |
| **E** — assainir la voie Ollama | 🟠 **E.1 ✅ 21/08** (`859fd48`) · E.2 ✅ pour Ollama (schéma natif transmis) · **E.3 ⛔ caduc** (`ChronicleService` n'existe plus) · **E.4 ❌** | `MAX_TEXT_CHARS = 100000` est toujours en dur dans `ForgeService.ts:144`, sans lien avec le `num_ctx` réel et sans avertissement à l'écran |
| **F** — brancher le mode | 🟠 **F.3 ✅ 21/08** ; F.1, F.2, F.4, F.5 ❌ | Les **trois appels en partie** ne portent plus le RAG complet : `useVoiceStore` l'était déjà, `CombatCard` passe en `{ systemOnly: true }` + `lite`, `useNarrativeGenerator` en `lite` seul — *on ne fait pas payer à la narration le budget des règles*. `useNPCStore` n'est pas touché : l'enrichissement de PNJ relève de la préparation. D.5 a branché le moment de jeu sur les **plafonds**, mais le contexte, le fournisseur et le moteur d'image ne le consultent toujours pas |
| **G** — pause de séance | ❌ | Sa seconde raison d'être — « couper à la reprise » suppose des passes — est **levée** : l'axe K est fait |
| **H** — les canevas | ✅ **déjà fait**, découvert le 22/08 | `rules/canevas.ts` porte les quatorze sujets, `campagne/canevasDeCampagne.ts` ceux de la campagne, l'état de couverture vit dans le frontmatter (`couverture: complète/partielle/absente`) et **les invites en sont dérivées** (`GroupesDeChamps`). Les trois bénéfices annoncés sont acquis : couverture mesurable, lacunes bornées, prompts engendrés |
| **I** — inverser la chaîne NotebookLM | ✅ **déjà fait** | `notebook_query` a remplacé `source_get_content` (`ForgeService.ts:512`), et `source_add` écrit les synthèses dans le carnet (`useJournalStore.ts:480`). L'écriture double vers `docs/` est le fonctionnement normal de l'Atelier |
| **J** — sélecteur de moteur par Forge | ❌ | Rien dans le code |
| **K** — découper les Forges | ✅ **déjà fait** | Huit groupes forgés **dans l'ordre de leurs dépendances**, chacun recevant le vocabulaire produit par les précédents (`vocabulaireAcquis`) — c'est exactement « la cohérence des identifiants devient structurelle ». Barre de progression (`ForgeProgress`) et reprise (`reprendreLAtelier`) comprises |
| **L** — index des livres | ✅ **déjà fait**, et amélioré le 21/08 | `electron/bookIndex.ts` résout titre de section → page, localement et sans modèle ; son parseur a gagné deux formes et un seuil de densité mesuré |
| **M** — Oracle bibliothécaire | ❌ | S'appuyait sur L, H et O : les deux premiers sont faits |
| **N** — régimes d'interface | ❌ | Le plus visible, le moins urgent — inchangé |
| **O** — boucle de revue | ❌ **et c'est le plus mûr** | Voir ci-dessous |

### Ce que la relecture du 2026-08-22 a trouvé

**Quatre axes chiffrés à dix-huit heures étaient déjà faits** — H, I, K et L — par les chantiers de Forge
Système, de Forge de campagne et de corpus. Aucun n'a jamais été rapporté à ce plan : *deux plans qui
avancent sans se regarder finissent par se croire en retard l'un sur l'autre.* Le reste chiffré passe
d'environ 40 h à **environ 26 h**, et l'ordre change entièrement puisque H conditionnait I, L et M.

**Et l'axe O est le plus mûr de tous, pour une raison que le plan ne pouvait pas prévoir : sa donnée
existe déjà.** `relu: false` est écrit par trois endroits — `conversion.ts:260`, `inventaire.ts:294`,
`ServiceDeCampagne.ts:394` — et **il est lu par personne**. Compté le 22/08 : **194 fiches** le portent.

> **C'est le motif corrigé trois fois cette semaine, mais à l'échelle du corpus entier** : le libellé des
> portées, l'unité de distance, le champ `moteur` d'un `corpus.json`. *Un champ rempli que rien ne lit
> est un champ qui finira faux sans qu'on le sache* — sauf qu'ici il ne finira pas faux, **il est déjà
> sans effet** : l'Oracle cite une fiche jamais relue exactement comme une fiche vérifiée.
>
> La question était pourtant tranchée dès le 07/08, au § 9 : *« Comment l'Oracle signale une fiche non
> relue ? — Mention discrète, toujours visible. »* La décision existe, la donnée existe, le lecteur
> manque.

**Ce que l'axe C a mesuré, et qui vaut au-delà de lui.** Le § 3.5 promettait *« exécution parallèle pour
réduire considérablement le temps de réponse »*. **Sous `NUM_PARALLEL=1`, qui est le défaut d'Ollama, les
deux appels du Cortex font la queue** : on attend la somme, pas le plus long. Le `Promise.all` reste — il
est juste, et il gagne sur le cloud ; c'est la promesse qui est partie. *Une optimisation annoncée qui
n'a pas lieu fait chercher le temps perdu ailleurs.* Cela donne un argument mesuré à la troisième question
du document jumeau : **fusionner les deux appels du Cortex en un seul.**

**Note sur l'axe L (index des livres).** Il n'a pas été traité comme tel, mais l'Atelier lit déjà des index
déposés dans `docs/systems/<id>/index/`, et **son parseur a reçu deux formes de plus le 21/08** — un index
alphabétique non balisé et un sommaire nu —, plus un **seuil de densité mesuré** (quarante → cent) qui
empêche un livre entier de se faire passer pour un index. Le principe du § L tient toujours : *aucun numéro
de page ne vient jamais d'un modèle.*

### Bloc I — Le socle *(débloque les budgets)*

#### Axe A — Activer l'iGPU · *0 ligne de code · ~15 min*

Ollama détecte l'Arc 140T puis l'écarte : `dropping integrated GPU; to enable, set OLLAMA_IGPU_ENABLE=1`.

```
OLLAMA_IGPU_ENABLE     = 1
OLLAMA_FLASH_ATTENTION = 1
OLLAMA_KEEP_ALIVE      = 30m
```

**Porteur, pas confortable** : sans lui, même le RAG réparé laisse l'Oracle à ~5 min, hors budget (§ 5).

**Deux bénéfices, pas un.** Le prefill × 4,7, et surtout **la charge CPU qui tombe de 81 % à 25 %**
pendant toute l'inférence (§ 2). Le second ne se voit dans aucune mesure de débit, mais c'est lui qui
détermine si l'application reste utilisable pendant qu'elle réfléchit — donc si l'on peut préparer une
image ou consulter l'Atlas pendant qu'une Forge tourne. **Il conditionne la file d'attente non bloquante
du § 1**, qui n'aurait aucun intérêt si le reste de l'application était inutilisable pendant ce temps.

**Risques :** ~8,4 Gio de mémoire partagée ; chargement à froid de 1 s à 37 s, d'où `keep_alive` ; et la
concurrence avec le compositeur d'affichage (§ 2). Réversible en retirant la variable.
**À éprouver sur une séance complète**, pas seulement au banc — en observant la fluidité de l'interface,
pas seulement la stabilité du pilote.

#### Axe B — Réparer le RAG · *~3 h · le plus gros gain*

1. Supprimer les clauses fourre-tout `includes('systems')` / `('campaigns')`.
2. **Utiliser le `score` déjà calculé** pour trier avant de découper.
3. **Plafond global en tokens** (cible 4 000), non plus un nombre de fichiers.
4. **Journaliser ce qui est écarté.**
5. Indexer les `.jsonl` (`RAGEngine.ts:142`), déjà chunkés avec métadonnées.
6. **Ajouter un mécanisme d'exclusion** — `getAllFiles` (`RAGEngine.ts:130-148`) n'en a **aucun** et
   prend tout `.md`/`.txt`/`.pdf` récursivement. Nécessaire pour sortir de l'index les décharges brutes
   du § 3.10 (quatre copies d'Alien, trois de Cthulhu Hack) sans les supprimer.
7. Test de non-régression : contexte sous le plafond, fichier du système actif toujours présent.

**÷ 18 sur le contexte**, et correction d'un défaut de **qualité** — l'Oracle cesse de répondre à partir
de documents tirés au hasard. Profite aux vingt consommateurs.

##### ✅ Réalisé le 2026-08-09

**Ce que le filtre envoyait vraiment, simulé sur le `docs/` réel avant correction** : 11 des 15 fichiers
venaient des campagnes — dont *Trinité Fatale* (CoC), *Aux Portes de l'Horreur* (PDF CoC), la *Vallée du
Vent Glacé* (D&D) — les 4 autres étaient des décharges brutes d'Alien tranchées à 50 000 caractères, et
**aucune des fiches du corpus n'y figurait**. Soit ~93 000 tokens pour un `num_ctx` de 16 384. Les deux
clauses fourre-tout laissant passer les 83 fichiers, **la sélection était identique pour toutes les
campagnes** : en séance Dune, l'Oracle recevait des décharges Alien et zéro Dune. Ce n'était pas un
mauvais tri, c'était l'absence de tri — `.slice(0, 15)` sur l'ordre alphabétique du disque.

**Point 8, ajouté en cours de route et c'est le plus rentable : la question sert enfin à choisir.**
`prepareSystemPrompt(_prompt, …)` recevait la question de l'utilisateur et la jetait — le souligné le
disait. Le moteur ne pouvait donc sélectionner que par système, jamais par sujet. La question descend
maintenant jusqu'à `selectContext`, où le champ `sujet:` du frontmatter la reçoit. **Le rapprochement du
titre pèse quatre fois le rapprochement du corps** : le sujet dit de quoi un document *traite*, le corps
seulement ce qu'il *mentionne*.

**Deuxième chaîne morte réparée au passage.** `campaign.systemPath` et `campaign.campaignPath` sont
saisissables dans la fiche de campagne (« Chemin des Règles », « Chemin des Notes ») et enregistrés
depuis toujours ; leur unique lecteur, `getContextFromExplicitPaths`, **était resté en commentaire**.
Encore un cas de « le cadre déclare, le moteur ignore ». Ils sont désormais le périmètre prioritaire,
et priment sur la déduction par nom de dossier — nécessaire, puisque les dossiers de `docs/campaigns/`
ne portent pas les noms des campagnes de David (« Agents de Dune » contre `Agents_of_Dune.md`).

Réalisation :

- **Périmètre dur** : système actif, campagne active, ou `docs/commun/`. Le reste est écarté, pas
  déclassé. Le rapprochement se fait sur un slug avec frontière de segment, jamais par `includes` libre.
- **Rangs** : fiche du corpus (100) > document de campagne (60) > autre document du système (40) >
  fonds commun (30). L'écart entre deux rangs excède le bonus de pertinence maximal, donc **la question
  départage à rang égal sans jamais renverser les rangs**.
- **Budget de 4 000 tokens**, en-têtes et séparateurs compris, avec plafond de 1 200 par fichier **pour
  les seules décharges**. Une fiche passe **entière ou pas du tout** : la tronquer couperait une règle en
  deux, et la place revient à la suivante.
- **`.ragignore`** par dossier, modèle gitignore (`!` réintègre, `/` final vise les dossiers, dernière
  règle applicable gagnante). **Il ne retire que de l'index de l'Oracle** : `ai:list-docs`, `ai:read-doc`
  et `ai:extract-pdf` lisent le disque directement, donc les Forges gardent les livres bruts en entier.
  Posés sur `systems/alien` (4 copies du livre), `systems/cthulhu hack` (3 copies) et `systems/dune`
  (1 décharge). Un quatrième visait le PDF de 28,9 Mo de `campaigns/coc7` ; il est devenu sans objet
  le jour même, le dossier ayant été supprimé au nettoyage des campagnes fantômes (plus bas).
- `.jsonl` indexés ; l'index purge les entrées disparues, sans quoi un `.ragignore` n'aurait pris effet
  qu'au redémarrage suivant.
- **Journal de ce qui est écarté**, avec la raison, et **avertissement quand une campagne n'a aucun
  document rattaché** — sinon l'absence resterait indiscernable d'une absence de fichier, ce qui est
  exactement ce qui a laissé ce filtre vivre des mois.

**Mesuré après (`docs/` réel, hors PDF).** Question « un xénomorphe me charge, combien de dés je lance
pour tirer ? » → `regles-affrontement-xenomorphes.md`, `combat-spatial.md`, puis le bestiaire tronqué,
3 998 tokens. « Mon personnage tombe à zéro en santé ? » → `sante-et-blessures.md` en tête.
Blade Runner, « comment fonctionne l'initiative ? » → `initiative-et-tour.md` en tête. **Le premier
document retenu est le bon dans les trois cas, et c'est toujours une fiche.** De ~93 000 à ~4 000 tokens,
soit **÷ 23** — davantage que les ÷ 18 prévus, parce que le plan n'avait pas anticipé le tri par sujet.

Tests : `electron/ragIgnore.test.ts` (12) et `electron/ragSelection.test.ts` (30, dont une passe de
non-régression sur le corpus réel). **Trois défauts trouvés par ces tests, pas par la relecture** : la
marque de troncature était posée *après* le découpage et faisait dépasser le plafond ; les en-têtes
`[Source: …]` n'étaient pas comptés dans le budget ; et une règle `raw/` n'excluait pas les fichiers
sous `raw/`, ce que la marche du disque masquait en élaguant le dossier en amont.

**Reste à faire ici** : `docs/commun/` est reconnu mais n'existe pas encore sur disque ; le plafond de
4 000 tokens ne laisse passer que **deux fiches entières** (elles pèsent 5 800 caractères en moyenne),
à réévaluer une fois l'axe A en place.

##### Nettoyage des campagnes fantômes, 2026-08-09

Le cloisonnement a rendu visible ce que le filtre fourre-tout masquait : **un seul des sept dossiers de
`docs/campaigns/` correspondait à une campagne réelle** (`dune/Agents_of_Dune.md` → « Agents de Dune »).
Deux étaient des échantillons de démonstration livrés avec l'application — « Le Mystère du Phare
d'Arkham » et « La Vallée du Vent Glacé », même gabarit, lore public générique — et quatre du matériel
de scénario sans campagne : *Last Day of Hope*, *Trinité Fatale*, *Aux Portes de l'Horreur* (PDF de
28,9 Mo), *Cthulhu Hack Scenarios*. **Les six sont supprimés sur arbitrage de David**, et restent
récupérables : tous étaient suivis par git.

**Le miroir du problème comptait autant** : « Anges de Feu » et « A la claire fontaine » n'avaient
**aucun** document sur disque — ce n'était pas seulement un problème de dossiers orphelins. Leurs
dossiers existent désormais, avec le chemin exact à coller dans « Chemin des Notes ».

**Reste à faire côté application**, pour les trois campagnes : renseigner « Chemin des Notes » avec
`campaigns/anges-de-feu`, `campaigns/a-la-claire-fontaine` et `campaigns/dune`. Tant que ce n'est pas
fait, l'Oracle continue de signaler « aucun document rattaché » — ce qui est exact.

#### Axe C — Ordre du prompt et contexte du Cortex · *~2 h*

1. **Inverser les blocs** : `[persona + RAG]` → `[contexte vivant]` → `[question]`.
2. **Supprimer la double inclusion du RAG** dans le Cortex (§ 3.5).
3. **Restreindre le contexte du Cortex** aux règles de combat du système actif.
4. Corriger le commentaire mensonger ligne 112.

### Bloc II — Maîtrise de l'exécution

#### Axe D — Annulation, verrou, plafonds · *~4 h · conditionne le reste*

**C'est l'axe qui rend les autres possibles.** Sans annulation, aucun plafond n'est réel (§ 3.3).

1. **`AbortController` transmis par le pont jusqu'au `net.fetch`** d'`OllamaService`, pour les appels
   texte **et image**.
2. **Délai d'abandon sur la génération d'image**, aujourd'hui totalement absent (§ 3.7) — à traiter en
   premier dans cet axe.
3. **Verrou de concurrence visible.** Savoir qu'une opération tourne vaut mieux que l'empêcher :
   *« Forge en cours — l'Oracle attendra ~12 min »* est actionnable ; un bouton grisé ne l'est pas.
4. **Plafonds par moment** : large en préparation, ~5 min en partie, **avec dégradation plutôt
   qu'échec**. Aligner le plafond MCP (10 min) et le plafond modèle (45 min), aujourd'hui incohérents.
5. **Borner la durée** : plafonner `num_predict` et afficher une estimation plutôt qu'une animation
   indéterminée. *Le prévisible vaut mieux que le rapide : 90 s systématiques valent mieux que 30 s le
   plus souvent et 8 min parfois.*

#### Axe E — Assainir la voie Ollama · *~2 h* · 🟠 **E.1 faite le 21/08, E.4 ouverte, E.3 caduque**

> **Ce que E.1 a trouvé, et que le plan ne prévoyait pas.** Il ne s'agissait pas d'« étendre »
> `ollamaChatStream` : **il fabriquait son propre corps de requête** et n'avait donc reçu **aucune** des
> corrections apportées à `chat` depuis deux mois — pas même `think: false`, dont ce fichier mesure le
> prix trois lignes plus haut (349 s et un contenu vide, contre 64 s). *Et c'est ce chemin que l'Oracle
> emprunte.* Il n'y a plus qu'un corps de requête, et un test vérifie que les deux chemins le partagent.
>
> **Et `keep_alive` est un champ de PREMIER NIVEAU.** Rangé dans `options`, il est accepté sans effet et
> sans un mot — le genre de réglage qu'on croit avoir posé pendant des semaines. Il vaut 30 min ; sans lui
> le modèle se déchargeait après cinq minutes d'inactivité **et emportait le cache d'invite avec lui, ce
> qui annulait l'axe C**.

1. Étendre `ollamaChat` / `ollamaChatStream` pour transmettre `format` et `options` (`num_ctx`,
   `num_predict`, `temperature`, `keep_alive`). Touche `preload.ts:95-96`, `window.d.ts:176-177`,
   `OllamaService.ts`.
2. Passer le **schéma JSON natif** ; retirer `extractStructuredJSON` et `sanitizeJSON` pour Ollama.
3. Corriger `ChronicleService.ts:53` : activer `lite`.
4. Plafonner `MAX_TEXT_CHARS` sur le `num_ctx` réel, et **avertir dans l'UI** quand un document est écarté.

#### Axe F — Brancher le mode · *~3 h*

1. `AIService` lit l'état de session **globalement** (§ 1.2) et en dérive ses défauts : contexte,
   fournisseur, moteur d'image, plafond.
2. **Généraliser le motif du générateur de butin** (§ 3.8) : le choix de contexte visible et
   surchargeable, pas caché.
3. **Corriger les appels en partie qui portent le RAG complet** : `useNPCStore.ts:150,167`,
   `CombatCard.ts:135`, `useNarrativeGenerator.ts:66`, `useVoiceStore.ts:263`.
4. **Jamais de diffusion locale en partie** — cloud direct pour les images (§ 3.7).
5. **Afficher le mode là où il agit**, pas seulement dans le cockpit : si la Forge se comporte
   différemment parce qu'une session est ouverte, c'est la Forge qui doit le dire, avec le moyen de
   passer outre. Sinon on recrée l'action à distance qu'on cherche à éviter.

#### Axe G — Pause de séance · *~2 h*

Un bouton « pause » avec chronomètre. La pause **lève les plafonds de partie** et autorise le travail
long ; la reprise **récupère l'IA**.

- **Implémentation : un `pausedAt?: number` sur la session, pas un quatrième statut.** Les statuts sont
  `'planned' | 'active' | 'done'` et **cinq composants testent `status === 'active'`** — un statut
  `paused` les ferait tous considérer la session comme absente, alors que le Hub reste affiché et la
  projection en cours. Un champ séparé laisse les cinq lecteurs intacts.
- **À la reprise : finir la passe en cours, abandonner la file, prévenir.** Couper net à la onzième
  minute sur douze serait punitif et dissuaderait de rien lancer. Cela suppose le découpage en passes
  (axe K) — **c'est la seconde raison d'être de cet axe**, et ce qui le fait remonter dans l'ordre.
- **Plafonner par le temps de pause restant** plutôt que par une constante : *« pause de 15 min : cette
  Forge en demande 4, on y va »*.
- Le chronomètre **vaut le coup indépendamment de l'IA** — savoir que la pause dure depuis 18 minutes
  est utile en soi. Et il ferme le risque d'oubli, comme l'indicateur de session ouverte.

### Bloc III — Déplacer le travail

#### Axe H — Les canevas · *~5 h · conditionne I, L et M*

> Répond à la question *qui décide du découpage en sujets ?* Décision de David : **ni le MJ seul, ni
> NotebookLM — un canevas partagé, avec des règles minimales.**

Point de départ : **un système ne couvre pas toutes les règles d'un jeu.** GM-OS n'a pas besoin de
connaître Rêves de Dragons, mais **la part qu'il exploite** — déterminable en lisant ce que le code
consomme.

**Deux canevas, pas un** — les deux Forges n'ont ni le même but ni les mêmes exclusions :

| | Canevas **Système** | Canevas **Scénario / Campagne** |
|---|---|---|
| Sujets | dés et résolution, initiative, stats suivies, portées, états, dégâts, oppositions, ton | synopsis et enjeux, factions, PNJ majeurs et relations, lieux, indices et rumeurs, accroches, actes |
| Exclusions | création de personnage, progression, équipement, historique de l'univers | **les règles**, qui relèvent de l'autre canevas |
| Alimente | `ForgeDashboard` → `forgeSystem` | `ChronicleForge` → `forgeChronicle` |

Les exclusions comptent autant que les sujets : **ce sont les chapitres les plus volumineux des livres**,
et les écarter d'entrée retire l'essentiel du bruit avant même de distiller.

**Structure :** par canevas, une liste de sujets partagée, plus un **état de couverture** par système ou
campagne — fiche / index seul / absent / hors périmètre.

**Trois bénéfices :** la couverture devient mesurable (« Alien : 3 sujets sur 12 ») ; le journal des
lacunes est **borné** (une question hors canevas n'est pas une fiche manquante) ; et **le canevas
engendre les prompts**, exclusions comprises.

#### Axe I — Inverser la chaîne NotebookLM · *~4 h*

Remplacer `source_get_content` par `notebook_query`, avec les gabarits de questions issus des canevas
(axe H). Chaque requête rend 3 à 5 Ko ; Ollama ne fait plus que mettre en forme ~15 Ko en JSON.

**Sources dérivées.** `source_add` permet de réécrire chaque synthèse **dans le carnet** comme nouvelle
source, filtrable par `source_ids`. Le carnet se construit en couches : livres bruts en bas, synthèses
au-dessus. **Écriture double** — la synthèse part aussi dans `docs/` via `writeDoc`, pour que le savoir
distillé n'ait pas Google pour unique domicile.

**Usage de nettoyage :** mettre les quatre copies d'Alien dans un même carnet et demander **une**
synthèse consolidée par sujet. NotebookLM sait réconcilier des sources redondantes — c'est le moyen de
convertir la génération 1 en génération 3 pour les deux systèmes qui restent sales (§ 3.10).

**Réserves :** `notebook_query` pilote un vrai navigateur (dizaines de secondes, faillible, exige réseau
et compte Google) ; réponses non déterministes ; **forme des réponses instable** — `notebook_get` rend
`sources` *à côté* de `notebook`, piège rencontré le 2026-08-07. Chaque étape doit être reprenable.

#### Axe J — Sélecteur de moteur par Forge · *~4 h*

Arbitrage de David : **cloud accepté pour les Forges, choix explicite à chaque lancement**, jamais de
bascule automatique.

1. `provider?: AIProvider` sur `generateJSON` / `generateText`, court-circuitant `activeProvider`
   **sans le modifier globalement**.
2. Le badge moteur de `ChronicleForge.tsx:366-369` devient un sélecteur, avec estimation de durée.
3. **Idem dans `ForgeDashboard.tsx`** — voir la mise en garde du § 8 sur la plomberie partagée.
4. Mémoriser le dernier choix par Forge, mais **toujours l'afficher**.

**L'Oracle et le Cortex n'en ont pas besoin** : après les axes A à C, le local tient leur budget (§ 5).

#### Axe K — Découper les Forges · *~4 h · remonté*

- **`forgeSystem`** : passe 1 → `driver` ; passe 2 → `template`, *en lui fournissant les `statsToTrack`
  de la passe 1*. La cohérence des identifiants, aujourd'hui demandée en prose
  (`ForgeService.ts:89-97`), devient **structurelle**. *Une contrainte qu'on peut faire respecter par
  construction ne devrait jamais être une consigne au modèle.*
- **`forgeChronicle`** : une passe par section, en chaîne.
- Barre de progression réelle, **reprise à la passe échouée**.

**Pourquoi il remonte :** classé en dernier tant qu'il n'apportait que le confort. **La pause de séance
(axe G) lui donne une seconde raison d'exister** — sans passes, « couper à la reprise » ne peut signifier
que « tout jeter ». Il conditionne aussi la file d'attente non bloquante du § 1.

### Bloc IV — Le savoir

#### Axe L — Index des livres · *~5 h*

**Deux couches, deux producteurs — et aucun numéro de page ne vient jamais d'un modèle.** Les LLM sont
notoirement mauvais avec les pages, et la page imprimée « 142 » est rarement la 142ᵉ page du PDF. Une
référence fausse à table est **pire que pas de référence**.

1. **Couche mécanique, locale, déterministe.** `pdf-parse` est déjà en dépendance (`RAGEngine.ts:9`) et
   rend le texte page par page : pages exactes, offset, recherche plein texte. **C'est la méthode qui a
   produit le `.jsonl` de Cthulhu Hack** (210 chunks avec `page_start`, `source_pdf`).
2. **Couche thématique, NotebookLM.** Répond à « où parle-t-on de l'ivresse ? », ce qu'aucun sommaire ne
   couvre.
3. **Croisement** : le sujet vient de NotebookLM, **la page sort du PDF**.

**Format**, dans `docs/systems/<id>/index/<livre>.md` :

```markdown
---
book: rdd-livre-de-base
title: Rêves de Dragons — Livre de base
file: \\NAS\JDR\Reves de Dragons\RdD-Livre-de-base.pdf
pages: 320
pageOffset: 4          # page imprimée 1 = page PDF 5
---

| Sujet | Page PDF | Page imprimée | Mots-clés |
|---|---|---|---|
| Jet d'éthylisme | 146 | 142 | ivresse, alcool, endurance |
```

**Chemins des livres** — les PDF sont sur un disque réseau. À stocker au niveau **système** (règles) et
**campagne** (scénarios) ; le motif existe déjà (`campaign.types.ts:62-68`). **Une liste, pas un chemin
unique** — dès qu'il y a un supplément, « p. 142 » est ambigu. **En UNC (`\\NAS\...`), pas en lettre de
lecteur** : une lettre mappée dépend de la session Windows et disparaît sur la tablette.

**Contraintes réseau :**

- **L'index reste toujours local dans `docs/`.** Seule l'ouverture du PDF exige le réseau. Dégradation
  utile : « Rêves de Dragons, p. 142 — disque non joignable ».
- **Jamais d'indexation à la volée.** Opération explicite, hors séance.
- **La sécurité est à concevoir, pas à contourner.** `RAGEngine.ts:255` confine les écritures à `docs/` ;
  lire un PDF ailleurs demande un second chemin, explicitement autorisé, en lecture seule.
- Sur un chemin UNC, l'URL devient `file://///NAS/...` — cinq barres obliques.

**Ouverture du PDF : `findInPage`, pas `#search=`** (§ 2). **Et `matches` est un signal de vérification :**
si l'index annonce la page 146 et que `findInPage` renvoie `matches = 0`, quelque chose cloche — offset
erroné, extraction ratée, mauvais livre. **Le moteur du lecteur devient un contrôleur de l'index plutôt
qu'un concurrent**, et cela se journalise comme les lacunes.

**Stratégie :** un index coûte *une* requête NotebookLM par livre, bien moins que forger trente fiches.
**Indexer tous les systèmes d'abord, forger les fiches ensuite, au fil des lacunes.**

#### Axe M — L'Oracle bibliothécaire · *~6 h · chantier de fond*

Quatre étages, du moins coûteux au plus coûteux :

1. **Recherche dans les fiches** (`docs/systems/*/rules/*.md`). Aucun modèle invoqué.
2. **À défaut, la référence dans le livre** : « Rêves de Dragons, p. 142, section Ivresse ». Ouverture du
   PDF **en secours ou sur demande explicite du MJ** — jamais dans le chemin critique.
3. **À défaut, un jugement de table** (*ruling*) — décision de David : une proposition **en deux
   lignes**, annoncée comme n'étant pas la règle officielle. Quatre exigences :
   - **Deux lignes maximum.** La longueur est le signal : une réponse courte se lit comme une
     proposition, une longue comme une autorité.
   - **L'étiquette avant le contenu**, jamais après — placée après, elle arrive quand le MJ a déjà
     adopté la réponse.
   - **Aucune citation, aucun numéro de page.** Un ruling qui cite a l'apparence d'une règle ;
     l'absence de source *est* l'information.
   - **Versé au journal des lacunes.** Un ruling est par définition une fiche manquante.

   Deux lignes font ~60 tokens, soit ~10 s : **l'étage le plus incertain est aussi le plus rapide**.
4. **Journal des lacunes** : chaque question note ce que la recherche a atteint (fiche / index / ruling /
   rien). Les trois dernières catégories **sont la file de travail de la Forge**, bornée par les canevas.

**Ce que ça change :** l'Oracle devient un **bibliothécaire** — il trouve, il cite, et il sait dire « je
n'ai pas, mais c'est là ». La valeur de l'étage 1 n'est pas la milliseconde, c'est **la traçabilité**.

**Le journal des lacunes est la meilleure idée du lot** : les sujets à forger cessent d'être choisis à
l'intuition, **l'usage réel en séance les désigne**. Deux points de conception : **pas de pouces
haut/bas** (friction à table, jamais cliqués — le journal se remplit sans intervention, et une question
reformulée dans la minute est un signal gratuit) ; et **regrouper avant de forger**, sinon dix questions
sur l'ivresse produisent dix fiches au lieu d'une.

**Transparence obligatoire :** afficher *quelle* fiche a répondu. L'étage 1 peut matcher la mauvaise.

**Couverture actuelle : 15 fiches, 3 systèmes sur 9** (§ 3.10). L'Oracle vivra donc longtemps à
l'étage 2 — c'est le régime nominal d'un système qui apprend, mais l'étage 2 doit être bon.

#### Axe O — La boucle de revue · *~5 h · maillon porteur*

**Définition : l'étape entre « l'IA a produit quelque chose » et « le système le tient pour vrai ».**

Où les sorties IA deviennent durables aujourd'hui :

| Producteur | Écrit | Revue avant écriture ? | Relève de cet axe ? |
|---|---|---|---|
| **Atelier de règles** | une fiche `.md` dans `docs/`, **indexée et citée par l'Oracle** | **aucune** | **oui — c'est le cas central** |
| Forge Système | driver + template | oui — `handleForgeSave` | partiellement (§ gros artefacts) |
| Forge Chronique | campagne, entités, lieux, lore | oui — `handleCommit` | partiellement |
| Après-partie | résumé → journal + NotebookLM | l'envoi est déjà une action séparée | **non — voir ci-dessous** |

> **Le journal de séance n'a pas besoin de ce dispositif.** Sa revue existe déjà : c'est la curation en
> deux étapes du document trame (§ 4.1). Le MJ revoit scène par scène — c'est la revue de l'*entrée* —
> puis le résumé est court et il vient d'en écrire la matière. **La différence tient à qui consomme
> l'artefact** : une fiche de règle est citée des mois plus tard, à froid, par l'Oracle, d'où le besoin
> d'une provenance persistante ; un résumé de séance est relu immédiatement, par son auteur, en
> connaissance de cause. Y ajouter un état « relu » serait une cérémonie de plus pour rien.
>
> Le journal a en revanche **trois défauts propres**, traités dans le document trame :
> le résumé est stocké **comme un événement du journal** (donc typé `SYSTEM`, donc écarté par le filtre
> trace/récit — et surtout **réinjecté dans la génération suivante**, puisque `summarizeSession` prend
> `journal.events`) ; `syncToNotebook` **retrouve le résumé par son titre traduit**, donc un changement
> de langue casse le lien ; et `summarizeSession` **retourne** sa chaîne d'excuse au lieu de lever, si
> bien que la panne emprunte le chemin nominal jusqu'à NotebookLM.

**L'asymétrie saute aux yeux : les artefacts qui portent le plus d'autorité sont ceux qui en ont le
moins.** `BrainstormOverlay.tsx:93` écrit la fiche **avant** de la montrer — l'affichage à l'étape
`completed` arrive après l'écriture. La refuser demanderait de supprimer le fichier à la main.

Or tout l'axe M repose sur cette phrase : *« la réponse vient d'une fiche que tu as validée, pas d'un
modèle qui improvise »*. **Aujourd'hui ce mot, « validée », est une fiction.**

**Pourquoi c'est porteur :**

> **Le journal des lacunes attrape ce qui manque. Rien n'attrape ce qui est faux.**

Une fiche erronée produit une recherche *réussie*, une citation confiante, et **aucun signal**. Pire :
la citation renforce la confiance. L'erreur ne se corrige jamais, elle se consolide — et elle se propage,
puisque les fiches nourrissent aussi les Forges suivantes.

**La question qui commande tout : quand relit-on ?**

Forger une fiche prend une minute ; **la relire vraiment en prend trois à cinq**. Dix fiches forgées
créent donc trois quarts d'heure de lecture, qui ne seront pas faits. Toute conception qui ignore ce
calcul produit un rituel non tenu.

**Arbitrage de David : relecture à la première utilisation.** La fiche vient de répondre à une question,
le MJ a la question sous les yeux — le seul contexte qui permette de juger. L'Oracle affiche déjà quelle
fiche a répondu (exigence de transparence de l'axe M) ; le geste se greffe là, sans écran nouveau. On ne
relit jamais ce qui ne sert pas, et on juge au moment où l'on peut juger.

> **Conséquence : le « brouillon avant publication » est abandonné.** Une version antérieure de cet axe
> proposait un état non indexé promu après relecture. **Cela contredit la relecture à l'usage** : une
> fiche doit être utilisable pour être jugée. La bonne forme est plus simple — **indexée dès sa
> création, marquée, relue à l'usage.**
>
> (Un mécanisme d'exclusion du RAG reste nécessaire par ailleurs — `getAllFiles` d'`RAGEngine.ts:130-148`
> n'en a **aucun** — mais pour sortir de l'index les décharges brutes du § 3.10, pas pour la revue.)

**Contenu retenu :**

1. **La fiche est indexée dès sa création**, marquée *générée, non relue*.
2. **L'Oracle l'indique par une mention discrète mais toujours visible** à côté du nom de la source —
   arbitrage de David. Honnête sans être alarmiste, et présente à chaque citation, donc les fiches qui
   reviennent souvent finissent par être validées d'elles-mêmes.
3. **Un signalement depuis la réponse** — le symétrique du journal des lacunes, et le mécanisme central
   de cet axe. **Il ne supprime jamais rien** : à table, un clic malheureux ne peut pas coûter une bonne
   fiche, et le MJ n'a pas le temps de bricoler. Il marque comme suspect, l'Oracle continue de citer
   **en le disant**, et la fiche entre dans la file de forge. La correction est une action
   d'après-partie.
4. **La provenance se déduit, elle ne se déclare pas.** Trois états — *générée / relue / corrigée* — dont
   le troisième n'est jamais demandé : si le contenu diffère de l'empreinte enregistrée à la génération,
   c'est que le MJ a édité.
5. **La même empreinte protège de l'écrasement.** À la reforge d'un sujet déjà couvert, empreinte
   différente = contenu retouché, donc **montrer un écart au lieu d'écraser**. Sans quoi le MJ cesse de
   corriger. **S'applique aussi à la trame narrative** (document jumeau, § 6.4).

**Ce que cet axe ne couvre pas, et il faut le dire.** Une fiche de 5 Ko se relit ; un
`ChronicleForgeResult` complet — entités, lieux, lore — représente des heures. **Les gros artefacts ne
se relisent pas**, ils s'adoptent progressivement à l'usage, ce que la trame permet déjà puisque le MJ
retravaille la séance à venir. Prétendre le contraire fabriquerait un rituel de plus.

> ⚠️ **Le vrai danger n'est pas l'absence de revue, c'est la revue de complaisance.** Si relire devient
> une corvée, le MJ cliquera « relu » sans lire, et **un drapeau accordé machinalement est pire que pas
> de drapeau** : il fabrique la confiance fausse que le dispositif devait empêcher. D'où deux règles
> fermes — **jamais de bouton « tout marquer comme relu »**, et un « générée, jamais relue » assumé vaut
> mieux qu'une cérémonie non tenue.

### Bloc V — L'interface

#### Axe N — Deux régimes d'interface · *~6 h*

La partition existe **déjà de fait** dans `CurrentView` (`campaign.types.ts:23-44`), et David l'a même
déjà appliquée à un module : `session-prep` / `session-focus`.

| Préparation | En partie | Les deux |
|---|---|---|
| `forge`, `rule-workshop`, `template-editor`, `driver-editor`, `templates`, `library`, `campaign-editor`, `session-prep`, `storyboard`, `deck-library` | `session-focus`, `deck-player`, `rulebook` | `npc-gallery`, `world-atlas`, `social-graph`, `timeline-wiki`, `players`, `cockpit` |

**Trois temps de coût croissant :**

1. **Classer les vues** par affinité — quelques lignes, sert immédiatement la navigation et les
   avertissements.
2. **Dédoubler `LayoutConfig`** par mode. Il porte déjà `activeModule`, `isAIPanelOpen`,
   `isTacticalPanelOpen`, et il est **persisté par campagne** : deux dispositions livrent l'essentiel du
   bénéfice pour très peu de code. On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa
   table telle qu'on l'a laissée le samedi soir.
3. **Deux vues seulement là où c'est justifié** — combat, carte, PNJ, Oracle, journal. Pas 24 modules.

**Ce qui change vraiment entre les deux modes** n'est pas la liste des boutons : la **densité** (à table
on regarde de loin, parfois debout, souvent en parlant), les **valeurs par défaut** (en préparation on
veut choisir, en séance on veut que ce soit déjà choisi), et **ce qui est à portée de main** (aucune
action destructive ni monopolisante près de ce qu'on touche en partie).

> ⚠️ **Garde-fou impératif : toute vue dédoublée partage ses composants, jamais son implémentation.**
> Sans quoi on refabrique en série la duplication de plomberie des deux Forges (§ 8).

---

## 5. Chiffrage

**Oracle** — réponse de 200 à 400 tokens, soit 35 à 65 s de rédaction incompressibles.

| Configuration | Prefill | Rédaction | Total | Budget 1-2 min |
|---|---|---|---|---|
| Aujourd'hui (16 384 tok après troncature, CPU) | 17,8 min | ~50 s | **~19 min** | ❌ |
| + Axe B seul (4 000 tok, CPU) | 4,4 min | ~50 s | **~5 min** | ❌ |
| + Axe A (iGPU) | 56 s | ~50 s | **~1,8 min** | ✓ |
| + Axe C, questions suivantes | ~7 s | ~50 s | **~1 min** | ✓✓ |

**L'axe A est porteur, pas confortable**, et **le local suffit** — pas de cloud pour l'Oracle ni le Cortex.

**Cortex** — deux appels séquentiels, dont un au contexte doublé.

| Configuration | Total | Budget 30-60 s |
|---|---|---|
| Aujourd'hui | ~36 min | ❌ |
| Axes A + B | ~4 min | ❌ |
| + Axe C | **~1 min** | ~ |

Reste le point le plus tendu. Levier non évalué : **fusionner ses deux appels en un seul** (document
jumeau).

**Forge complète :**

| Configuration | Durée |
|---|---|
| Aujourd'hui (CPU) | ~24 à 30 min |
| + Axes A et E | ~9 à 15 min |
| + Axe I (NotebookLM distille) | **~2 à 5 min**, sans troncature |
| Gemini Flash (axe J) | **~30 s** |

**Convergence notable :** à 25 minutes, une Forge ne rentre dans aucune pause honnête. À 2-5 minutes,
elle rentre confortablement dans une pause de quinze. **L'axe I ne fait pas qu'accélérer la Forge : il la
rend compatible avec le mode pause de l'axe G.**

---

## 6. Ordre recommandé

> **Les cinq premières lignes sont faites au 2026-08-21** — c'est-à-dire tout ce que le § 6 appelait
> « moins de 6 h qui ramènent les trois usages dans leur budget ». **Le reste n'a pas été relu depuis**,
> et il le mérite : cet ordre date d'avant la Forge Système, la Forge de campagne et le journal, et
> l'axe E.3 est caduc. *Ne pas reprendre les lignes 7 à 16 sans les réordonner d'abord.*

| # | Axe | Effort | Pourquoi ici |
|---|---|---|---|
| ~~1~~ | ✅ **A — iGPU** *(12/08)* | 15 min | Aucun code, réversible, porteur |
| ~~2~~ | ✅ **D.2 — délai d'abandon sur les images** | ~30 min | Meilleur rapport gain/effort : quelques lignes contre un blocage illimité en partie |
| ~~3~~ | ✅ **B — RAG** *(09/08)* | ~3 h | Meilleur gain global, corrige la **qualité**, sert 20 modules |
| ~~4~~ | ✅ **C — ordre du prompt + Cortex** *(21/08)* | ~2 h | Débloque le dernier usage hors budget |
| ~~5~~ | ✅ **D — annulation, verrou, plafonds** *(21/08)* | ~3,5 h | Conditionne les plafonds et la pause |
| 6 | 🟠 **E — voie Ollama** *(E.1 faite le 21/08, E.4 ouverte)* | ~2 h | Petit, sans risque, fin des troncatures muettes |
| 7 | **F — brancher le mode** | ~3 h | Rend la partition opérante |
| 8 | **H — canevas** | ~5 h | Borne le périmètre, engendre les prompts : conditionne I, L, M |
| 9 | **I — inversion NotebookLM** | ~4 h | Déplace le poids hors de la machine ; rend la Forge compatible avec la pause |
| 10 | **K — découpage des Forges** | ~4 h | Prérequis de la reprise après pause et de la file non bloquante |
| 11 | **G — pause de séance** | ~2 h | S'appuie sur D et K |
| 12 | **L — index des livres** | ~5 h | Prérequis de l'étage 2 de M |
| 13 | **O — boucle de revue** | ~5 h | Doit précéder M : sans elle, « fiche validée » est une fiction |
| 14 | **M — Oracle bibliothécaire** | ~6 h | Chantier de fond ; s'appuie sur L, H et O |
| 15 | **J — sélecteur de moteur** | ~4 h | Après B et I, pour que l'estimation affichée soit juste |
| 16 | **N — régimes d'interface** | ~6 h | Le plus visible, le moins urgent |

**Total : ~55 h.** Les quatre premières lignes — **moins de 6 h** — ramènent les trois usages dans leur
budget et suppriment le pire blocage en partie. Tout le reste sert la justesse, la traçabilité et le
confort, plus la vitesse.

---

## 7. Écarté, et pourquoi

- **Router les questions simples sur `llama3.2:3b`.** Le gain ne rachète pas la perte de qualité dès lors
  que 60 s sont acceptables.
- **Récupération en deux appels** (index des sujets puis contenu). Complexité mal payée : visait à
  réduire un contexte que l'axe B ramène déjà à 4 000 tokens.
- **Embeddings vectoriels.** Amélioreraient la *pertinence*, pas la vitesse. À reconsidérer si le RAG
  réparé sélectionne mal — pas avant.
- **Augmenter `num_ctx`.** Rendrait la lenteur pire (§ 3.4).
- **Quantification plus agressive.** Coûte de la qualité, alors que le gaspillage est ailleurs.
- **NotebookLM comme générateur de JSON.** Selenium, lent, non déterministe. Sa place est en
  **distillateur** (axes I et L).
- **Obsidian comme accélérateur.** Ne fait aucune inférence.
- **La recherche du lecteur PDF comme mécanisme principal.** Exige le PDF ouvert et le réseau, cherche
  dans un seul document sans classement, et ne sait pas dire « ce sujet n'existe nulle part » — donc
  n'alimente pas le journal. Conservée en second temps, pour le surlignage et la vérification.
- **Corroborer le mode par d'autres signaux** (combat en cours, Hub ouvert, tablette connectée). Toute la
  valeur du signal vient de ce qu'il est **déclaré** ; y mêler de l'inféré le rendrait imprévisible.
- **Bloquer des actions pendant une session.** Écarté au profit d'avertir + rendre annulable, pour deux
  raisons : bloquer réduit la probabilité de l'accident sans en supprimer la conséquence (§ 3.3) ; et
  **un garde-fou qui interdit ne doit jamais être le seul chemin de sortie de l'erreur qu'il protège** —
  bloquer le changement de campagne rendrait irrécupérable une session démarrée sur la mauvaise. À table,
  une interface qui refuse est pire qu'une interface qui prévient. Seul le **destructif** justifie un
  blocage, indépendamment de la session.
- **Changer de machine.** Les axes A à C ramènent tout dans les budgets sans dépense.

---

## 8. Points de vigilance

- **Lever la réserve du § 2** avant de figer le chiffrage de l'axe B.
- **L'axe A n'a été validé qu'au banc.** Éprouver le pilote Vulkan Intel sur une séance complète, en
  observant **deux choses distinctes** : sa stabilité dans la durée, et la **fluidité de l'interface**
  pendant une inférence — puisque l'iGPU pilote aussi l'affichage (§ 2). Si le compositing en souffre,
  la contrepartie reste de garder l'inférence sur CPU en limitant son nombre de threads, ce qui
  échangerait du débit contre de la réactivité.
- **Les deux Forges ne sont pas des doublons — rectification du 2026-08-08.** Une version antérieure les
  décrivait comme « des jumeaux quasi identiques » et en tirait la mauvaise conclusion (les fusionner).
  Ce sont **deux fonctionnalités légitimement distinctes** :

  | | `ForgeDashboard` | `ChronicleForge` |
  |---|---|---|
  | Service | `forgeService.forgeSystem` | `chronicleForgeService.forgeChronicle` |
  | Sortie | `driver` + `template` | `campaign` + `entities` + `locations` + `lore` |
  | Prompt de base | `getSystemForgePrompt` | `getChroniclePrompt` |

  Les prompts sont **déjà correctement séparés**. Ce qui est dupliqué, c'est la **plomberie d'acquisition
  de sources NotebookLM** — `handleOpenNotebookLM`, `handleNotebookSelect`, `handleSourceImport`,
  `handleFileUpload`, soit ~180 lignes par fichier (~25 % de chacun). **Correction recommandée :
  extraire un sélecteur de sources partagé, et surtout pas fusionner.** C'est là que vivait le bug de la
  migration Gemini Notebook du 2026-08-07 : une préoccupation partagée corrigée dans un seul de ses deux
  exemplaires.

  *Leçon de méthode : deux fichiers de taille voisine qui se ressemblent à la lecture ne sont pas
  forcément des doublons. Comparer ce qu'ils appellent et ce qu'ils produisent avant de conclure.*

- **Les citations `[1]`, `[2]` des fiches existantes sont mortes** : `forgeCard` n'a pas conservé la table
  de correspondance NotebookLM. À capturer en frontmatter lors des prochaines forges — l'étage 2
  deviendrait gratuit même pour les sujets couverts, et le MJ pourrait vérifier au lieu de croire.
- **Dédupliquer le corpus avant d'optimiser la récupération** (§ 3.10).
- `docs/` est le corpus indexé par le RAG : **n'y déposer aucune documentation technique.**
- Piège d'environnement : le harnais définit `ELECTRON_RUN_AS_NODE=1`, ce qui fait démarrer Electron en
  simple Node. Pour lancer une vraie fenêtre :
  `env -u ELECTRON_RUN_AS_NODE node_modules/electron/dist/electron.exe <dossier>`.

---

## 9. Questions tranchées

| Question | Arbitrage | Où |
|---|---|---|
| Que faire quand l'Oracle ne trouve rien ? | **Jugement de table en deux lignes**, annoncé comme non officiel | axe M, étage 3 |
| Qui décide du découpage en sujets ? | **Un canevas partagé**, en deux versions | axe H |
| Le Cortex mérite-t-il une étude à part ? | **Oui** — sa fiabilité, pas sa vitesse | document jumeau |
| Faut-il bloquer des actions en session ? | **Non — avertir et rendre annulable** | § 7, axe D |
| Faut-il des interfaces distinctes par mode ? | **Pas deux implémentations : deux compositions** | axe N |
| Plafond court ou pause déclarée ? | **Les deux, ce sont des couches** | axe D et axe G |
| Comment résumer une séance ? | **En deux étapes : curer, puis résumer** | document trame, § 4.1 |
| Où vit la structure narrative ? | **Campagne → Actes → Scènes**, pas d'objet scénario | document trame, § 2 |
| La Forge doit-elle générer la trame ? | **Oui, en proposition entièrement modifiable** | document trame, § 6 |
| Les décès dans le résumé de combat ? | **Non — événements narratifs autonomes** | document trame, § 5.3 |
| Quand relire une fiche forgée ? | **À la première utilisation**, pas après la forge | axe O |
| Comment l'Oracle signale une fiche non relue ? | **Mention discrète, toujours visible** | axe O |

---

## 10. Reste à défricher

- **Fusionner les deux appels du Cortex en un seul** — non évalué, peut-être son vrai levier de
  performance. Traité dans le document jumeau.
- **Comportement quand les entrées du Cortex ne sont pas fiables** : refuser de conseiller, ou restreindre
  explicitement le propos au non-spatial ? Document jumeau.
- **Un mode « hors carte » assumé** pour le Cortex : beaucoup de combats se jouent sans carte, et il y est
  aujourd'hui dégradé par accident plutôt que conçu pour.
