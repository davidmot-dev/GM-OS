# Accélération des intégrations IA (Forges, Oracle, Cortex)

**Date :** 2026-08-07
**Branche :** `feature/tablet-hub-pwa`
**Statut :** plan validé pour arbitrage — aucun code écrit
**Contexte :** les Forges sont trop lentes avec Ollama. Ce document mesure d'abord, puis propose.

---

## 1. Résumé exécutif

La lenteur n'est **pas** principalement due au modèle local. Trois causes distinctes s'additionnent,
et deux d'entre elles sont des défauts corrigeables qui dégradent aussi la **qualité** :

| # | Cause | Nature | Gain potentiel |
|---|---|---|---|
| 1 | Le RAG envoie ~72 000 tokens de contexte à chaque appel, sans tri ni plafond | **Bug** | ÷ 20 sur l'Oracle |
| 2 | L'iGPU Intel Arc est détecté puis **jeté** par Ollama | Réglage | × 4,7 sur le prefill |
| 3 | Les Forges demandent un seul énorme JSON en un seul appel | Conception | UX + fin des troncatures |

**Conséquence la plus grave, découverte en mesurant :** avec `OLLAMA_CONTEXT_LENGTH = 16384`, **77 %
du contexte assemblé est jeté silencieusement** avant d'atteindre le modèle. Une partie de ce qui est
perçu comme de la lenteur est en réalité une **perte de données sans erreur ni avertissement**.

---

## 2. Banc de mesure

**Machine :** Intel Core Ultra 9 285H · iGPU Intel Arc 140T (17,9 Gio partagés) · 31,4 Gio RAM
**Ollama :** 0.32.6 · `OLLAMA_CONTEXT_LENGTH=16384` · `OLLAMA_KEEP_ALIVE=5m` ·
`OLLAMA_FLASH_ATTENTION=false` · `OLLAMA_VULKAN=true` · `OLLAMA_IGPU_ENABLE=` (vide)
**Modèle de référence :** `gemma4:12b` (Q4_K_M, 11,9 B)

Méthode : second serveur Ollama sur le port 11500 avec `OLLAMA_IGPU_ENABLE=1`, pour comparer sans
toucher au serveur utilisé par l'application. Même modèle, même `num_ctx`, même prompt.

### 2.1 Débits mesurés

| Mesure | CPU seul | iGPU activé | Rapport |
|---|---|---|---|
| Décodage `gemma4:12b` | 5,5 tok/s | 6,1 tok/s | **× 1,1** |
| Prefill `gemma4:12b` (prompt de 10 953 tokens) | 15,3 tok/s | **71,9 tok/s** | **× 4,7** |
| Décodage `llama3.2:3b` | 15,2 tok/s | non mesuré | × 2,8 vs 12b |
| Chargement du modèle | 0,9 s (cache chaud) | 36,7 s (à froid) | — |

**Lecture de ce tableau.** Le décodage est limité par la bande passante mémoire, que l'iGPU partage
avec le CPU : l'activer n'y change quasi rien. Le prefill est limité par le calcul : l'iGPU y est
presque cinq fois plus rapide. Autrement dit, **l'iGPU ne fait pas écrire plus vite, il fait lire
beaucoup plus vite**.

Corollaire pour les modules qui *streament* (Oracle, Cortex) : la latence perçue est le temps avant
le premier mot, donc le prefill. **C'est exactement le cas où l'iGPU paie.** Les Forges, dont le coût
est majoritairement en écriture, en profitent moins.

### 2.2 Volume réellement envoyé par le RAG

Simulation de la logique de [`RAGEngine.getRelevantContext`](../../electron/RAGEngine.ts) sur le
corpus `docs/` :

```
fichiers indexés       : 49
fichiers « pertinents » : 48  (sur 49)
contexte envoyé        : 259 787 caractères  (~72 163 tokens)
plafond num_ctx 16384  : 77 % du contexte est jeté silencieusement
prefill à 15,3 tok/s   : 17,8 min avant le premier mot
```

> **Réserve à lever avant de chiffrer.** Si le RAG a été repointé sur le coffre Obsidian
> (`RAGService.ts:36-39` déclenche un réindexage sur `vaultPath`), le volume réel diffère de cette
> simulation. Le défaut de structure, lui, est identique dans les deux cas. **À vérifier en ouvrant
> l'application et en relevant la taille réelle du contexte dans la console.**

---

## 3. Diagnostic détaillé

### 3.1 Le filtre du RAG ne filtre rien — `electron/RAGEngine.ts:109-127`

```ts
const isSystemRelevant   = segments.some(s => s.includes(sys))  || lowerPath.includes('systems');
const isCampaignRelevant = segments.some(s => s.includes(camp)) || lowerPath.includes('campaigns');
...
const score = (lowerPath.includes(sys) ? 2 : 0) + (lowerPath.includes(camp) ? 2 : 0);
...
return results.slice(0, 15).join('\n\n---\n\n');
```

Trois défauts cumulés :

1. **`lowerPath.includes('systems')` fait matcher tout fichier situé sous `docs/systems/`**, quel que
   soit le système actif. Comme l'intégralité du corpus vit sous `systems/` ou `campaigns/`, le
   filtre laisse tout passer : 48 fichiers sur 49.
2. **Le `score` est calculé puis jamais utilisé.** Aucun tri n'est appliqué avant le `slice(0, 15)` :
   les 15 fichiers retenus le sont dans l'ordre d'itération de l'index, donc arbitrairement. Le
   document réellement pertinent peut ne pas y être.
3. **Aucun plafond global.** Chaque fichier est plafonné à 50 000 caractères
   (`RAGEngine.ts:152`), mais 15 × 50 000 = 750 000 caractères possibles. Le commentaire
   « Limit to top 15 matches for token safety » énonce une garantie que le code n'assure pas.

> Écho direct à la leçon du point 3 du chantier transport : *un commentaire qui énonce une garantie
> n'est pas une garantie.* Même schéma, autre module.

### 3.2 Troncature silencieuse

- `ForgeService.ts:42` — `MAX_TEXT_CHARS = 100000`, soit ~28 000 tokens.
- RAG — jusqu'à ~72 000 tokens.
- Serveur Ollama — `num_ctx = 16384`.

Ollama tronque sans rien signaler. La Forge croit analyser 100 000 caractères ; elle en analyse au
mieux 59 000, et l'Oracle travaille sur ~8 % d'un corpus choisi au hasard. **Augmenter `num_ctx`
n'est pas la solution** : à 15,3 tok/s, un contexte de 16 384 tokens coûte déjà 17,8 min de prefill.
Il faut **envoyer moins**, pas *pouvoir* envoyer plus.

### 3.3 Les Forges demandent le pire travail possible

`ForgeService.forgeSystem` et `ChronicleForgeService.forgeChronicle` envoient tout le corpus en un
appel et attendent **un seul gros JSON** (driver + template, ou campagne + entités + lieux + lore),
soit 2 000 à 4 000 tokens de sortie. À 5,5 tok/s : **6 à 12 minutes de décodage**, sans aucun retour
visuel, sans reprise possible en cas d'échec.

### 3.4 Défauts secondaires

| Constat | Emplacement | Effet |
|---|---|---|
| `ChronicleService` n'active pas le mode `lite` (contrairement à `ForgeService`) | `ChronicleService.ts:53` | empile RAG + contexte de session sur un prompt déjà saturé |
| Aucun `format` ni `options` transmis à Ollama | `OllamaService.ts:37-43` | pas de contrôle de `num_ctx`/`num_predict` ; JSON récupéré au regex avec réparation heuristique — chaque échec coûte une génération complète |
| `keep_alive` par défaut (5 min) | serveur | rechargement à froid entre deux usages espacés |
| `OLLAMA_FLASH_ATTENTION=false` | serveur | KV-cache plus lourd sur les longs contextes |

**Vérifié pendant l'étude :** Ollama 0.32.6 supporte les **sorties structurées natives par schéma
JSON**. Test concluant — la réponse est un objet conforme au schéma fourni, sans balises Markdown.
Cela permettrait de supprimer entièrement `extractStructuredJSON` et `sanitizeJSON`
(`AIService.ts:927-977`) pour la voie Ollama.

---

## 4. Axes de travail

### Axe A — Activer l'iGPU · *0 ligne de code · ~15 min*

Ollama détecte l'Arc 140T puis l'écarte volontairement :

```
dropping integrated GPU; to enable, set OLLAMA_IGPU_ENABLE=1
   library=Vulkan  name="Intel(R) Arc(TM) 140T GPU (16GB)"
```

Réglages à poser en variables d'environnement système, puis redémarrage du service Ollama :

```
OLLAMA_IGPU_ENABLE   = 1
OLLAMA_FLASH_ATTENTION = 1
OLLAMA_KEEP_ALIVE    = 30m
```

**Gain : × 4,7 sur le prefill**, donc sur la latence perçue de l'Oracle et des Cortex.
**Risques :** le modèle occupe alors ~8,4 Gio de mémoire partagée, prise sur les 31,4 Gio du système ;
le chargement à froid passe de 1 s à ~37 s (d'où `keep_alive=30m`). Réversible en retirant la variable.
**À valider :** stabilité du pilote Vulkan Intel sur plusieurs heures de session réelle.

### Axe B — Réparer le RAG · *~3 h · le plus gros gain*

1. Supprimer les clauses fourre-tout `lowerPath.includes('systems')` / `('campaigns')`.
2. **Utiliser le `score` déjà calculé** : trier par pertinence décroissante avant de découper.
3. Introduire un **plafond global en tokens** (cible : 4 000), et non plus un simple nombre de fichiers.
4. **Journaliser ce qui est écarté** — la troncature ne doit plus être silencieuse.
5. Test de non-régression : sur un corpus témoin, vérifier que le contexte reste sous le plafond et
   que le fichier du système actif est toujours présent.

**Gain : ÷ 20 sur le contexte** (72 000 → ~4 000 tokens). Bénéficie à *tous* les modules, cloud compris
(moins de jetons facturés, moins de 429). Corrige aussi une perte de **qualité** : l'Oracle cessera de
répondre à partir de documents tirés au hasard.

### Axe C — Sélecteur de moteur par Forge · *~4 h · choix retenu par David*

Décision prise : **le cloud est accepté pour les Forges, mais le choix reste explicite à chaque
lancement** — pas de bascule automatique.

1. Ajouter un paramètre `provider?: AIProvider` à `AIService.generateJSON` / `generateText`, qui
   court-circuite `useAIStore.activeProvider` **sans le modifier globalement**.
2. Transformer le badge moteur de `ChronicleForge.tsx:366-369` (aujourd'hui en lecture seule) en
   **sélecteur**, affichant une estimation de durée par option :
   - `Local — gemma4:12b — ~10 à 15 min`
   - `Gemini Flash — ~30 s`
3. **Faire de même dans `ForgeDashboard.tsx`.** ⚠️ Ces deux composants sont des jumeaux quasi
   identiques portant le même titre traduit : corriger l'un sans l'autre ne se voit pas. Piège déjà
   rencontré lors de la migration MCP du 2026-08-07.
4. Mémoriser le dernier choix par type de Forge, mais **toujours l'afficher** — jamais de défaut muet.
5. Clés i18n `fr` et `en`.

### Axe D — Assainir la voie Ollama · *~2 h*

1. Étendre le pont `ollamaChat` / `ollamaChatStream` pour transmettre `format` et `options`
   (`num_ctx`, `num_predict`, `temperature`, `keep_alive`). Touche `preload.ts:95-96`,
   `window.d.ts:176-177`, `OllamaService.ts`.
2. Passer le **schéma JSON natif** pour toutes les générations structurées ; retirer la voie
   regex + `sanitizeJSON` pour Ollama.
3. Corriger `ChronicleService.ts:53` : activer `lite`, comme `ForgeService`.
4. Plafonner `MAX_TEXT_CHARS` sur le `num_ctx` réel du modèle, et **avertir dans l'UI** quand un
   document est écarté.

**Gain :** supprime les échecs de parsing (qui coûtent une génération complète chacun) et met fin
aux troncatures silencieuses.

### Axe E — Découper les Forges · *~4 h · à faire en dernier*

Remplacer l'appel monolithique par des passes courtes et enchaînées :

- **`forgeSystem`** : passe 1 → `driver` ; passe 2 → `template`, *en lui fournissant les
  `statsToTrack` de la passe 1*. La cohérence des identifiants, aujourd'hui demandée au modèle sous
  forme de « RÈGLES CRITIQUES », devient **structurelle**.
- **`forgeChronicle`** : une passe par section (campagne, entités, lieux, lore).
- Barre de progression réelle, et **reprise à la passe échouée** plutôt que tout refaire.

**Honnêteté sur le gain :** le découpage ne réduit pas beaucoup le temps *total* en local — le
document est lu une fois, la sortie totale reste comparable. Ce qu'il apporte est la **progression
visible**, la **reprise après échec** et la **fin des troncatures**. Le gain de temps brut vient des
axes A et B, pas de celui-ci.

---

## 5. Chiffrage

Estimations pour l'Oracle, avec `gemma4:12b`. Le « premier mot » est ce que l'utilisateur perçoit.

| Configuration | Contexte | Prefill (premier mot) |
|---|---|---|
| Aujourd'hui (CPU, RAG cassé) | 16 384 tok (77 % jeté) | **~17,8 min** |
| + Axe A (iGPU) | 16 384 tok | ~3,8 min |
| + Axe B (RAG réparé) | ~4 000 tok | **~55 s** |
| + question simple routée sur `llama3.2:3b` | ~4 000 tok | quelques secondes |

Pour une Forge complète :

| Configuration | Durée estimée |
|---|---|
| Aujourd'hui (CPU) | ~24 à 30 min |
| + Axes A et D | ~9 à 15 min |
| + Axe E | ~8 à 12 min, mais avec progression et reprise |
| Gemini Flash (Axe C) | **~30 s, sans troncature** |

## 6. Ordre recommandé

| Ordre | Axe | Effort | Pourquoi ici |
|---|---|---|---|
| 1 | **A — iGPU** | 15 min | Aucun code, réversible, × 4,7 immédiat. À valider en séance réelle avant d'aller plus loin. |
| 2 | **B — RAG** | ~3 h | Meilleur rapport gain/effort, et corrige un défaut de **qualité**, pas seulement de vitesse. Profite à tous les moteurs. |
| 3 | **D — voie Ollama** | ~2 h | Petit, sans risque, met fin aux troncatures silencieuses. |
| 4 | **C — sélecteur** | ~4 h | Le choix de David ; à faire après B pour que l'estimation affichée soit juste. |
| 5 | **E — découpage** | ~4 h | Le plus structurant, le moins urgent une fois A et B en place. |

**Total : ~13 h**, dont les 3 h 15 des deux premiers axes apportent l'essentiel du gain.

---

## 7. Écarté, et pourquoi

- **NotebookLM comme générateur.** C'est du Selenium piloté dans un navigateur : lent, fragile, sans
  garantie de JSON structuré. En revanche il reste pertinent pour ce que le code anticipe déjà
  (« utilisez NotebookLM pour extraire le texte au préalable ») : **pré-digérer de gros PDF en texte
  condensé**, ce qui sert directement l'axe B.
- **Obsidian.** Ne fait aucune inférence — c'est un puits de notes. Aucun gain de vitesse à en attendre.
  Sa seule contribution possible est de fournir un corpus mieux structuré au RAG.
- **Augmenter `num_ctx`.** Rendrait la lenteur *pire*, pas meilleure (§ 3.2).
- **Changer de machine ou viser un GPU dédié.** Hors sujet : les axes A à D ramènent l'Oracle sous la
  minute sans dépense.
- **Quantification plus agressive de `gemma4:12b`.** Gain de vitesse réel mais au prix de la qualité,
  alors que le vrai gaspillage est ailleurs (72 000 tokens de contexte inutile). À reconsidérer
  seulement une fois l'axe B en place.

---

## 8. Points de vigilance

- **Vérifier la réserve du § 2.2** avant de chiffrer définitivement l'axe B : relever la taille réelle
  du contexte dans la console de l'application, selon que le RAG pointe sur `docs/` ou sur le coffre
  Obsidian.
- L'axe A n'a été validé que sur un banc de quelques minutes. **Stabilité du pilote Vulkan Intel à
  éprouver sur une séance complète** avant d'en faire le réglage par défaut.
- `ChronicleForge.tsx` et `ForgeDashboard.tsx` sont des jumeaux : **toute modification de l'un doit
  être portée sur l'autre**.
- `docs/` est le corpus indexé par le RAG : **n'y déposer aucune documentation technique**, sous peine
  de polluer les réponses de l'Oracle. Ce document vit donc dans `documentation/Planning/`.
