# Accélération et fiabilisation des intégrations IA

**Date :** 2026-08-07
**Branche :** `feature/tablet-hub-pwa`
**Statut :** plan validé pour arbitrage — aucun code applicatif écrit
**Révision :** réécriture complète après séance de conception. La première version visait la vitesse
seule ; celle-ci part du **budget de temps réel de chaque usage**, ce qui change l'ordre des travaux.

---

## 1. Résumé exécutif

Trois usages de l'IA coexistent dans GM-OS et **n'ont pas du tout le même budget de temps**. Les
traiter ensemble était l'erreur d'analyse initiale.

| Usage | Référence réelle | Budget | État mesuré |
|---|---|---|---|
| **Forge** | préparation hors séance | minutes, en tâche de fond | ~25 min, bloquant |
| **Oracle** | feuilleter un livre physique | **1 à 2 min** | ~19 min |
| **Cortex** | conseil sur le tour en cours | **30 à 60 s** | ~2 appels, dont un au contexte doublé |

Le budget de l'Oracle vient d'un constat de David : chercher une règle dans un livre papier prend
déjà une à deux minutes. Une réponse en 90 secondes n'est donc pas un échec. **Ce recadrage disqualifie
plusieurs optimisations envisagées** (§ 7) et concentre l'effort sur trois corrections.

Le Cortex est le cas le plus tendu, non parce qu'il est plus lent, mais parce que **son conseil se
périme** : un avis tactique qui arrive après que le joueur a agi ne vaut rien. La réponse de l'Oracle,
elle, reste valable.

**Trois causes expliquent l'essentiel de l'écart**, et deux sont des défauts qui dégradent aussi la
qualité :

| # | Cause | Nature | Effet |
|---|---|---|---|
| 1 | Le RAG envoie ~72 000 tokens sans tri ni plafond | **Bug** | ÷ 18 sur tous les appels |
| 2 | L'iGPU Intel Arc est détecté puis jeté par Ollama | Réglage | × 4,7 sur le prefill |
| 3 | Le bloc volatil précède le bloc stable dans le prompt | **Bug** | interdit toute réutilisation du cache |

Conséquence la plus grave : avec `OLLAMA_CONTEXT_LENGTH = 16384`, **77 % du contexte assemblé est jeté
en silence**. Une part de ce qui passe pour de la lenteur est en réalité une perte de données.

---

## 2. Banc de mesure

**Machine :** Intel Core Ultra 9 285H · iGPU Intel Arc 140T (17,9 Gio partagés) · 31,4 Gio RAM
**Ollama :** 0.32.6 · `OLLAMA_CONTEXT_LENGTH=16384` · `OLLAMA_KEEP_ALIVE=5m` ·
`OLLAMA_FLASH_ATTENTION=false` · `OLLAMA_VULKAN=true` · `OLLAMA_IGPU_ENABLE=` (vide)
**Modèle :** `gemma4:12b` (Q4_K_M, 11,9 B)

Méthode : second serveur Ollama sur le port 11500 avec `OLLAMA_IGPU_ENABLE=1`, pour comparer sans
toucher au serveur de l'application. Même modèle, même `num_ctx`, même prompt.

| Mesure | CPU seul | iGPU activé | Rapport |
|---|---|---|---|
| Décodage `gemma4:12b` | 5,5 tok/s | 6,1 tok/s | × 1,1 |
| Prefill `gemma4:12b` (10 953 tokens) | 15,3 tok/s | **71,9 tok/s** | **× 4,7** |
| Décodage `llama3.2:3b` | 15,2 tok/s | non mesuré | × 2,8 vs 12b |
| Chargement du modèle | 0,9 s (cache chaud) | 36,7 s (à froid) | — |

**Interprétation.** Le décodage est limité par la bande passante mémoire, que l'iGPU partage avec le
CPU : l'activer n'y change presque rien. Le prefill est limité par le calcul : l'iGPU y est presque
cinq fois plus rapide. **L'iGPU ne fait pas écrire plus vite, il fait lire beaucoup plus vite.**

Volume réellement assemblé par le RAG, simulation sur le corpus `docs/` :

```
fichiers indexés        : 49
fichiers « pertinents » : 48  (sur 49)
contexte assemblé       : 259 787 caractères  (~72 163 tokens)
plafond num_ctx 16384   : 77 % jeté silencieusement
```

> **Réserve à lever avant de figer le chiffrage.** Si le RAG a été repointé sur le coffre Obsidian
> (`RAGService.ts:36-39`), le volume diffère de cette simulation. Le défaut de structure est identique
> dans les deux cas. À vérifier en relevant la taille réelle du contexte dans la console.

---

## 3. Diagnostic

### 3.1 Le filtre du RAG ne filtre rien — `electron/RAGEngine.ts:109-127`

```ts
const isSystemRelevant   = segments.some(s => s.includes(sys))  || lowerPath.includes('systems');
const isCampaignRelevant = segments.some(s => s.includes(camp)) || lowerPath.includes('campaigns');
const score = (lowerPath.includes(sys) ? 2 : 0) + (lowerPath.includes(camp) ? 2 : 0);
return results.slice(0, 15).join('\n\n---\n\n'); // Limit to top 15 matches for token safety
```

1. `lowerPath.includes('systems')` fait matcher **tout fichier sous `docs/systems/`**, quel que soit le
   système actif. Comme tout le corpus y vit, le filtre laisse passer 48 fichiers sur 49.
2. **Le `score` est calculé puis jamais utilisé.** Aucun tri avant le `slice(0, 15)` : les 15 fichiers
   retenus le sont dans l'ordre d'itération de l'index, donc arbitrairement.
3. **Aucun plafond global.** Chaque fichier est plafonné à 50 000 caractères, mais 15 × 50 000 = 750 000
   caractères possibles. Le commentaire annonce une garantie que le code n'assure pas.

> Même schéma que le point 3 du chantier transport : *un commentaire qui énonce une garantie n'est pas
> une garantie.* Troisième occurrence dans ce dépôt.

### 3.2 L'ordre du prompt interdit la réutilisation du cache — `AIService.ts:722-726`

```
[persona — stable]  →  [CONTEXTE VIVANT — change à chaque tour]  →  [RAG — stable et volumineux]
```

Ollama réutilise le KV-cache tant que le **début** du prompt est identique. Le bloc volatil (PV, round,
tour en cours) est placé **avant** le bloc massif et stable : dès qu'un PJ perd un point de vie, tout le
cache du RAG est invalidé et le prefill refait intégralement.

**Inverser ces deux blocs ferait payer le prefill des règles une fois par séance au lieu d'une fois par
question.** Correction de quelques lignes, à valider au banc.

### 3.3 Le Cortex envoie son contexte en double — `useTacticalAIStore.ts:89-114`

Le Cortex lance deux appels. Le second construit son prompt système complet ligne 103 (RAG inclus),
puis le transmet à `generateJSON`, qui le repasse en `customContext` à `prepareSystemPrompt` — lequel
**y concatène à nouveau le contexte RAG** (`AIService.ts:726`). Le corpus part donc **deux fois dans le
même appel**.

Deux défauts s'y ajoutent :

- Le commentaire ligne 112 annonce une « exécution parallèle pour réduire considérablement le temps de
  réponse ». Le serveur est en `OLLAMA_NUM_PARALLEL: 1` : **les deux appels font la queue.** La
  parallélisation n'existe que face à un fournisseur cloud.
- Le Cortex ne passe **aucune `ragOptions`**, donc il charge tout le lore de campagne pour répondre à
  « attaquer ou se déplacer ? », alors que `TacticalNarrativeService.getSituationalReport` lui a déjà
  préparé un rapport de situation précis. Seules les règles de combat du système actif sont pertinentes.

### 3.4 Troncature silencieuse

- `ForgeService.ts:42` — `MAX_TEXT_CHARS = 100000`, soit ~28 000 tokens.
- RAG — jusqu'à ~72 000 tokens.
- Serveur Ollama — `num_ctx = 16384`.

Ollama tronque sans rien signaler. **Augmenter `num_ctx` n'est pas la solution** : à 15,3 tok/s, un
contexte de 16 384 tokens coûte déjà 17,8 min de prefill. Il faut **envoyer moins**, pas pouvoir
envoyer plus.

### 3.5 Défauts secondaires

| Constat | Emplacement | Effet |
|---|---|---|
| `ChronicleService` n'active pas le mode `lite` | `ChronicleService.ts:53` | empile RAG + contexte de session |
| Aucun `format` ni `options` transmis à Ollama | `OllamaService.ts:37-43` | pas de contrôle de `num_ctx`/`num_predict` ; JSON extrait au regex, chaque échec coûte une génération complète |
| `keep_alive` à 5 min | serveur | rechargement à froid (37 s sur iGPU) |
| `OLLAMA_FLASH_ATTENTION=false` | serveur | KV-cache plus lourd sur les longs contextes |

**Vérifié :** Ollama 0.32.6 supporte les **sorties structurées natives par schéma JSON**. Test
concluant. Cela permettrait de supprimer `extractStructuredJSON` et `sanitizeJSON`
(`AIService.ts:927-977`) pour la voie Ollama.

**À noter :** vingt modules consomment `AIService` (voix, PNJ, butin, narration de carte, dossiers,
cartes de combat…). **La correction du RAG les sert tous**, pas seulement les trois traités ici.

---

## 4. Axes de travail

### Axe A — Activer l'iGPU · *0 ligne de code · ~15 min*

Ollama détecte l'Arc 140T puis l'écarte :

```
dropping integrated GPU; to enable, set OLLAMA_IGPU_ENABLE=1
   library=Vulkan  name="Intel(R) Arc(TM) 140T GPU (16GB)"
```

Variables d'environnement système, puis redémarrage du service :

```
OLLAMA_IGPU_ENABLE     = 1
OLLAMA_FLASH_ATTENTION = 1
OLLAMA_KEEP_ALIVE      = 30m
```

**Gain : × 4,7 sur le prefill.** Contre le budget de l'Oracle, cet axe est **porteur** : sans lui, même
le RAG réparé laisse l'Oracle à ~5 min, hors budget (§ 5).

**Risques :** ~8,4 Gio de mémoire partagée mobilisés ; chargement à froid de 1 s à 37 s, d'où
`keep_alive=30m`. Réversible en retirant la variable.
**À valider :** stabilité du pilote Vulkan Intel sur une séance complète, pas seulement sur un banc.

### Axe B — Réparer le RAG · *~3 h · le plus gros gain*

1. Supprimer les clauses fourre-tout `lowerPath.includes('systems')` / `('campaigns')`.
2. **Utiliser le `score` déjà calculé** pour trier avant de découper.
3. Introduire un **plafond global en tokens** (cible 4 000), non plus un nombre de fichiers.
4. **Journaliser ce qui est écarté** — la troncature ne doit plus être silencieuse.
5. Test de non-régression : contexte sous le plafond, et fichier du système actif toujours présent.

**Gain : ÷ 18 sur le contexte.** Corrige aussi une perte de **qualité** — l'Oracle cesse de répondre à
partir de documents tirés au hasard. Profite aux vingt modules consommateurs.

### Axe C — Ordre du prompt et contexte du Cortex · *~2 h*

1. **Inverser les blocs** dans `prepareSystemPrompt` : `[persona + RAG]` puis `[contexte vivant]` puis
   `[question]`, pour rendre le préfixe stable et réutilisable.
2. **Supprimer la double inclusion du RAG** dans le Cortex (§ 3.3) : soit le Cortex cesse d'appeler
   `prepareSystemPrompt` lui-même, soit `generateJSON` cesse de le rappeler.
3. **Restreindre le contexte du Cortex** aux règles de combat du système actif (`systemOnly`), le lore
   de campagne n'ayant aucune valeur pour un conseil de placement.
4. Corriger le commentaire mensonger ligne 112, ou rendre la parallélisation réelle en la réservant aux
   fournisseurs qui la supportent.

**Gain :** l'essentiel du bénéfice de l'axe A sur les questions successives, et le Cortex ramené dans
son budget.

### Axe D — Assainir la voie Ollama · *~2 h*

1. Étendre le pont `ollamaChat` / `ollamaChatStream` pour transmettre `format` et `options`
   (`num_ctx`, `num_predict`, `temperature`, `keep_alive`). Touche `preload.ts:95-96`,
   `window.d.ts:176-177`, `OllamaService.ts`.
2. Passer le **schéma JSON natif** pour les générations structurées ; retirer la voie regex pour Ollama.
3. Corriger `ChronicleService.ts:53` : activer `lite`.
4. **Borner la durée** : plafonner `num_predict` pour que le temps de réponse soit prévisible, et
   afficher une estimation plutôt qu'une animation indéterminée. *Le prévisible vaut mieux que le
   rapide : 90 s systématiques valent mieux que 30 s le plus souvent et 8 min parfois.*
5. Plafonner `MAX_TEXT_CHARS` sur le `num_ctx` réel, et **avertir dans l'UI** quand un document est écarté.

### Axe E — Inverser la chaîne NotebookLM des Forges · *~4 h*

Deux chaînes coexistent aujourd'hui, et elles font l'inverse l'une de l'autre.

**Chaîne A — l'Atelier de règles (fonctionne).** `notebook_query` fait distiller le document **chez
Google**, la fiche de 5 Ko revient et part dans `docs/systems/<id>/rules/`. Le livre ne transite jamais
par Ollama. C'est ce circuit qui a produit les fiches propres de Rêves de Dragons, NOC et Blade Runner.

**Chaîne B — Forges Système et Chronique (coince).** `ForgeDashboard.tsx:212` appelle
**`source_get_content`**, qui renvoie le **texte brut intégral**. Celui-ci part dans les 100 000
caractères de `forgeSystem`, puis se fait tronquer à 16 384 tokens. **NotebookLM n'y est qu'un
presse-papier** : on confie la digestion au composant qui en est le moins capable.

**Travail :** remplacer `source_get_content` par `notebook_query`, avec un gabarit de questions par type
de forge (dés / combat / fiche / ambiance, ou synopsis / PNJ / lieux / lore). Chaque requête rend 3 à
5 Ko ; Ollama ne fait plus que mettre en forme ~15 Ko en JSON.

**Sources dérivées.** `source_add` permet de réécrire chaque synthèse **dans le carnet** comme nouvelle
source, filtrable ensuite par `source_ids`. Le carnet se construit en couches : livres bruts en bas,
synthèses au-dessus. **Écriture double** — la synthèse part aussi dans `docs/` via `writeDoc`, pour que
le savoir distillé n'ait pas Google pour unique domicile. `writeDoc` déclenche déjà `updateIndex()`.

**Réserves :** `notebook_query` pilote un vrai navigateur (dizaines de secondes par requête, faillible,
exige le réseau et un compte Google) ; les réponses sont non déterministes ; **la forme des réponses est
instable** — `notebook_get` rend `sources` *à côté* de `notebook`, piège déjà rencontré le 2026-08-07.
Chaque étape doit être reprenable, pas tout ou rien.

### Axe F — L'Oracle bibliothécaire · *~6 h · chantier de fond*

Trois étages, du moins coûteux au plus coûteux :

1. **Recherche dans les fiches** (`docs/systems/*/rules/*.md`). Aucun modèle invoqué.
2. **À défaut, la référence dans le livre** : « Rêves de Dragons, p. 142, section Ivresse ». Ouverture
   du PDF **en secours ou sur demande explicite du MJ** — jamais dans le chemin critique.
3. **Journal des lacunes** : toute question note ce que la recherche a atteint (fiche / index seul /
   rien). Les deux dernières catégories **sont la file de travail de la Forge**.

**Ce que ça change :** l'Oracle cesse d'être un agent conversationnel avec du RAG pour devenir un
**bibliothécaire** — il trouve, il cite, et il sait dire « je n'ai pas, mais c'est là ». La valeur de
l'étage 1 n'est pas la milliseconde, c'est **la traçabilité** : la réponse vient d'une fiche validée,
pas d'un modèle qui improvise.

**Le journal des lacunes est la meilleure idée du lot** : aujourd'hui les sujets à forger sont choisis à
l'intuition ; là, **l'usage réel en séance les désigne**. Deux points de conception : pas de pouces
haut/bas (friction à table, jamais cliqués — le journal se remplit sans intervention), et **regrouper
avant de forger**, sinon dix questions sur l'ivresse produisent dix fiches au lieu d'une.

**Transparence obligatoire :** afficher *quelle* fiche a répondu. L'étage 1 peut matcher la mauvaise.

**Couverture actuelle — 15 fiches sur 9 systèmes :**

| blade-runner | noc | rêves de dragons | alien, coc7, cthulhu hack, dnd-5e, dune, nephilim |
|---|---|---|---|
| 4 | 4 | 7 | **0** |

L'Oracle vivra donc longtemps à l'étage 2. Ce n'est pas un défaut, c'est le régime nominal d'un système
qui apprend — mais l'étage 2 doit être bon.

### Axe G — Index des livres · *~5 h*

**Deux couches, deux producteurs — et aucun numéro de page ne vient jamais d'un modèle.**

Les LLM sont notoirement mauvais avec les numéros de page, et la page imprimée « 142 » est rarement la
142ᵉ page du PDF. Une référence fausse à table est **pire que pas de référence**.

1. **Couche mécanique, locale, déterministe.** `pdf-parse` est déjà en dépendance
   (`RAGEngine.ts:9`) et rend le texte page par page. Donne les pages exactes, l'offset entre pagination
   imprimée et pagination PDF, et une recherche plein texte. **C'est la méthode qui a produit le
   `.jsonl` de Cthulhu Hack** — 210 chunks avec `page_start`, `page_end`, `source_pdf`.
2. **Couche thématique, NotebookLM.** Sa valeur n'est pas le sommaire, que le PDF contient déjà, mais
   de répondre à « où parle-t-on de l'ivresse ? » — ce qu'aucune table des matières ne couvre.
3. **Croisement** : le sujet vient de NotebookLM, on le cherche dans l'index mécanique, **la page sort
   du PDF**.

**Format du fichier d'index**, dans `docs/systems/<id>/index/<livre>.md` :

```markdown
---
book: rdd-livre-de-base
title: Rêves de Dragons — Livre de base
file: \\NAS\JDR\Reves de Dragons\RdD-Livre-de-base.pdf
pages: 320
pageOffset: 4          # page imprimée 1 = page PDF 5
generatedAt: 2026-08-07
---

| Sujet | Page PDF | Page imprimée | Mots-clés |
|---|---|---|---|
| Jet d'éthylisme | 146 | 142 | ivresse, alcool, endurance |
```

Lisible par le MJ, indexé par le RAG comme simple texte, analysable pour le saut de page.

**Chemins des livres.** À stocker au niveau **système** (livres de règles, plusieurs par système) et
**campagne** (scénarios). Le motif existe déjà : `Campaign` porte `ragPath`, `notebookUrl`,
`systemPath`, `campaignPath`, `obsidianPath` (`campaign.types.ts:62-68`) ; `GameDriver` a `ragPath` et
`defaultNotebookUrl`. **Une liste, pas un chemin unique** — dès qu'il y a un supplément, « p. 142 » est
ambigu. **En UNC (`\\NAS\...`), pas en lettre de lecteur** : une lettre mappée dépend de la session
Windows et disparaît sur la tablette.

**Contraintes réseau :**

- **L'index reste toujours local dans `docs/`.** Seule l'ouverture du PDF exige le réseau. Dégradation
  utile : « Rêves de Dragons, p. 142 — disque non joignable ».
- **Jamais d'indexation à la volée.** Opération explicite, hors séance.
- **La sécurité est à concevoir, pas à contourner.** `RAGEngine.ts:255` confine délibérément les
  écritures à `docs/` ; lire un PDF ailleurs demande un second chemin, explicitement autorisé, en
  lecture seule.

**Stratégie de déploiement :** un index coûte *une* requête NotebookLM par livre, bien moins que forger
trente fiches. **Indexer tous les systèmes d'abord, forger les fiches ensuite, au fil des lacunes.**

**Ouverture du PDF — vérifié par test réel** (Electron 34.5.8 / Chrome 132, sur un PDF du corpus) :

- `webContents.findInPage("terme")` **fonctionne sur le lecteur PDF interne** — renvoie `matches` et
  `activeMatchOrdinal`. Le greffon met ~3 s à s'initialiser : attendre `did-finish-load` puis réessayer.
- `#page=N` fonctionne.
- Le fragment `#search=` charge sans erreur, **mais rien ne prouve qu'il soit honoré** — un fragment
  inconnu est ignoré en silence. Ne pas s'appuyer dessus.
- Sur un chemin UNC, l'URL devient `file://///NAS/...` — cinq barres obliques.

**Bénéfice inattendu du test : `matches` est un signal de vérification.** Si l'index annonce la page 146
et que `findInPage` renvoie `matches = 0`, quelque chose cloche — offset erroné, extraction ratée,
mauvais livre. **Le moteur du lecteur devient un contrôleur de l'index plutôt qu'un concurrent**, et ça
se journalise comme les lacunes. Vu la fragilité des numéros de page, c'est le filet qui manquait.

### Axe H — Sélecteur de moteur par Forge · *~4 h*

Arbitrage retenu par David : **cloud accepté pour les Forges, mais choix explicite à chaque
lancement** — jamais de bascule automatique.

1. Ajouter `provider?: AIProvider` à `generateJSON` / `generateText`, court-circuitant
   `useAIStore.activeProvider` **sans le modifier globalement**.
2. Transformer le badge moteur de `ChronicleForge.tsx:366-369` (aujourd'hui en lecture seule) en
   sélecteur, avec estimation de durée par option.
3. **Faire de même dans `ForgeDashboard.tsx`.** ⚠️ Ces deux composants sont des jumeaux quasi identiques
   portant le même titre traduit : corriger l'un sans l'autre ne se voit pas. Piège déjà rencontré lors
   de la migration MCP du 2026-08-07.
4. Mémoriser le dernier choix par type de Forge, mais **toujours l'afficher**.
5. Clés i18n `fr` et `en`.

**Note :** l'Oracle et le Cortex n'ont pas besoin de ce sélecteur — après les axes A à C, le local tient
leur budget (§ 5).

### Axe I — Découper les Forges · *~4 h · en dernier*

- **`forgeSystem`** : passe 1 → `driver` ; passe 2 → `template`, *en lui fournissant les `statsToTrack`
  de la passe 1*. La cohérence des identifiants, aujourd'hui demandée au modèle en prose
  (`ForgeService.ts:89-97`, « RÈGLES DE COHÉRENCE CRITIQUES »), devient **structurelle**. *Une
  contrainte qu'on peut faire respecter par construction ne devrait jamais être une consigne au modèle.*
- **`forgeChronicle`** : une passe par section, en chaîne (les entités ont besoin du synopsis, le lore
  des entités).
- Barre de progression réelle, **reprise à la passe échouée** plutôt que tout refaire.

**Honnêteté sur le gain :** le découpage ne réduit pas beaucoup le temps *total* en local. Il apporte la
progression visible, la reprise après échec et la fin des troncatures. Le gain de temps brut vient des
axes A, B et E.

---

## 5. Chiffrage

**Oracle** — réponse de 200 à 400 tokens, soit 35 à 65 s de rédaction incompressibles. Tout se joue
donc sur le prefill.

| Configuration | Prefill | Rédaction | Total | Budget 1-2 min |
|---|---|---|---|---|
| Aujourd'hui (16 384 tok après troncature, CPU) | 17,8 min | ~50 s | **~19 min** | ❌ |
| + Axe B seul (4 000 tok, CPU) | 4,4 min | ~50 s | **~5 min** | ❌ |
| + Axe A (iGPU) | 56 s | ~50 s | **~1,8 min** | ✓ |
| + Axe C, questions suivantes | ~7 s | ~50 s | **~1 min** | ✓✓ |

**Deux conclusions.** L'axe A est **porteur, pas confortable** : sans lui, même le RAG réparé laisse
l'Oracle hors budget. Et **le local suffit** — pas de cloud nécessaire pour l'Oracle ni le Cortex.

**Cortex** — deux appels séquentiels (`NUM_PARALLEL=1`), dont un au contexte doublé.

| Configuration | Total | Budget 30-60 s |
|---|---|---|
| Aujourd'hui | ~36 min | ❌ |
| Axes A + B | ~4 min | ❌ |
| + Axe C (double RAG supprimé, préfixe réutilisé, contexte restreint aux règles de combat) | **~1 min** | ~ |

Le Cortex reste le point le plus tendu. Si la minute s'avère trop longue en séance, les leviers
restants sont de réduire encore son contexte ou de fusionner ses deux appels en un.

**Forge complète :**

| Configuration | Durée |
|---|---|
| Aujourd'hui (CPU) | ~24 à 30 min |
| + Axes A et D | ~9 à 15 min |
| + Axe E (NotebookLM distille) | **~2 à 5 min**, sans troncature |
| Gemini Flash (Axe H) | **~30 s** |

---

## 6. Ordre recommandé

| Ordre | Axe | Effort | Pourquoi ici |
|---|---|---|---|
| 1 | **A — iGPU** | 15 min | Aucun code, réversible, et porteur : sans lui l'Oracle reste hors budget |
| 2 | **B — RAG** | ~3 h | Meilleur rapport gain/effort, corrige la **qualité**, profite aux 20 modules |
| 3 | **C — ordre du prompt + Cortex** | ~2 h | Débloque le seul usage encore hors budget après A et B |
| 4 | **D — voie Ollama** | ~2 h | Petit, sans risque, met fin aux troncatures muettes et borne les durées |
| 5 | **E — inversion NotebookLM** | ~4 h | Déplace le poids des Forges hors de la machine |
| 6 | **G — index des livres** | ~5 h | Prérequis de l'étage 2 de l'axe F |
| 7 | **F — Oracle bibliothécaire** | ~6 h | Le chantier de fond ; s'appuie sur G |
| 8 | **H — sélecteur de moteur** | ~4 h | Après B et E, pour que l'estimation affichée soit juste |
| 9 | **I — découpage des Forges** | ~4 h | Le plus structurant, le moins urgent |

**Total : ~30 h.** Les trois premiers axes — **5 h 15** — ramènent les trois usages dans leur budget.
Tout le reste sert la justesse, la traçabilité et le confort, plus la vitesse.

---

## 7. Écarté, et pourquoi

Le recadrage sur le budget réel a disqualifié plusieurs pistes envisagées en séance :

- **Router les questions simples sur `llama3.2:3b`.** Le gain de vitesse ne rachète pas la perte de
  qualité dès lors que 60 s sont acceptables.
- **Récupération en deux appels** (index des sujets, puis contenu ciblé). Complexité mal payée : elle
  visait à réduire un contexte que l'axe B ramène déjà à 4 000 tokens.
- **Embeddings vectoriels** (`nomic-embed-text`). Amélioreraient la *pertinence*, pas la vitesse. À
  reconsidérer si le RAG réparé sélectionne mal — pas avant.
- **Augmenter `num_ctx`.** Rendrait la lenteur pire, pas meilleure (§ 3.4).
- **Quantification plus agressive de `gemma4:12b`.** Coûte de la qualité, alors que le vrai gaspillage
  est ailleurs.
- **NotebookLM comme générateur de JSON.** Selenium, lent, non déterministe, sans garantie de format.
  Sa place est en **distillateur** (axes E et G).
- **Obsidian comme accélérateur.** Ne fait aucune inférence. Sa seule contribution possible est de
  fournir un corpus mieux structuré au RAG.
- **La recherche du lecteur PDF comme mécanisme principal.** Exige le PDF ouvert et le réseau, cherche
  dans un seul document sans classement, et ne sait pas dire « ce sujet n'existe nulle part » — donc
  n'alimente pas le journal des lacunes. Conservée en **second temps**, pour le surlignage et la
  vérification (axe G).
- **Changer de machine.** Les axes A à C ramènent tout dans les budgets sans dépense.

---

## 8. Points de vigilance

- **Lever la réserve du § 2.2** avant de figer le chiffrage de l'axe B : relever la taille réelle du
  contexte selon que le RAG pointe sur `docs/` ou sur le coffre Obsidian.
- **L'axe A n'a été validé que sur un banc de quelques minutes.** Éprouver la stabilité du pilote
  Vulkan Intel sur une séance complète avant d'en faire le réglage par défaut.
- `ChronicleForge.tsx` et `ForgeDashboard.tsx` sont des **jumeaux** : toute modification de l'un doit
  être portée sur l'autre.
- **Les citations `[1]`, `[2]` des fiches existantes sont mortes** : `forgeCard` n'a pas conservé la
  table de correspondance NotebookLM. À capturer en frontmatter lors des prochaines forges — l'étage 2
  deviendrait alors gratuit même pour les sujets couverts, et le MJ pourrait vérifier au lieu de croire.
- **Les `.jsonl` ne sont pas indexés** (`RAGEngine.ts:142` : `.md`, `.txt`, `.pdf` seulement), alors
  qu'ils sont déjà chunkés avec métadonnées. 600 Ko de données idéales ignorées.
- **Le corpus contient trois générations d'approche.** Le livre Alien existe en **quatre copies
  recouvrantes** (~4,9 Mo), Cthulhu Hack en trois (~1,5 Mo). Dédupliquer avant d'optimiser la
  récupération : quatre copies, c'est trois chances sur quatre de servir le même passage et d'en manquer
  un autre.
- `docs/` est le corpus indexé par le RAG : **n'y déposer aucune documentation technique**. Ce document
  vit donc dans `documentation/Planning/`.
- Piège d'environnement relevé pendant l'étude : le harnais définit `ELECTRON_RUN_AS_NODE=1`, ce qui
  fait démarrer Electron en simple Node. Pour lancer une vraie fenêtre :
  `env -u ELECTRON_RUN_AS_NODE node_modules/electron/dist/electron.exe <dossier>`.

---

## 9. Reste à défricher

- **Comportement quand les trois étages de l'axe F échouent** : silence honnête, ou génération libre
  clairement signalée comme improvisation ? Le second est tentant, mais c'est ainsi que naissent les
  règles inventées qu'on applique à table sans s'en apercevoir. *Non tranché.*
- **Qui décide du découpage en sujets** des Forges : le MJ à la main, NotebookLM en pré-vol, ou une
  convention par système inscrite dans le driver ? *Non tranché.*
- **Le Cortex mérite peut-être une étude à part.** Il n'a été examiné qu'en fin de séance ; son budget
  est le plus tendu, son conseil est le seul qui se **périme**, et la fusion de ses deux appels en un
  seul n'a pas été évaluée.
