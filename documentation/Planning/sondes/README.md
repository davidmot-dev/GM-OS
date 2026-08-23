# Les sondes Ollama — mesurer une variante à la fois

Écrites dans la nuit du 2026-08-12 au 13, pendant la chasse aux JSON cassés de la Forge dérivée.
Elles sont conservées parce qu'elles ont **réfuté trois hypothèses** avant de trouver la bonne, et
qu'aucun raisonnement ne l'aurait fait à leur place.

## `sonde_plafond.py` — que fait Ollama quand l'invite déborde ?

Deux marqueurs encadrent un remplissage volontairement trop long ; le modèle ne peut nommer que
celui qu'il a réellement reçu.

**Ce qu'elle a établi** : le plafond n'est pas « la moitié du contexte », c'est la troncature de
llama.cpp — `n_keep` tokens de tête, puis la **dernière moitié** du contexte, soit
`4 + (16384-4)/2 = 8 194`. Reproduit sur des invites de 33 500 **et** 55 800 tokens : le même
8 195 dans les deux cas, donc une perte *fixe*. Et **c'est la fin de l'invite qui survit** — seul
le marqueur de queue est revenu.

## `sonde_alien.py` — pourquoi ce groupe rend-il un JSON cassé ?

Rejoue un groupe de la Forge sur les vraies fiches du corpus, en faisant varier **un seul** réglage.

**Ce qu'elle a établi**, dans l'ordre :

| Variante | Résultat |
|---|---|
| sans `think` | 349 s, 2 048 tokens de réflexion, **réponse vide** |
| `think: false` | 64 s, 116 tokens, JSON valide |
| `format: json`, température 1 | 2 048 tokens, une seule chaîne géante |
| `format: json`, température 0 | 353 tokens, valide |
| pénalité de répétition 1.1 **contre** désarmée | **aucune différence** — hypothèse réfutée |
| schéma « sections seules » | valide, mais champs **fourrés dans un `label`** |
| **schéma du gabarit entier** | **465 tokens, complet et valide** |

C'est l'avant-dernière ligne qui a tout expliqué : le modèle ne dégénérait pas, **il cherchait une
place** pour un contenu qu'on lui refusait.

## `sonde_cout_du_plafond.py` — que coûte un plafond RAG plus haut ?

Écrite le 2026-08-23, pour trancher `MAX_CONTEXT_TOKENS = 4000`. Elle mesure le **coût** ; son
pendant hors modèle, `electron/sondePlafondRag.test.ts` (sous `SONDE=1`), mesure ce qu'un palier
**achète**.

**Ce qu'elle a établi**, sur `gemma4:12b` à 100 % GPU, `n_ctx 16384` — deux passes concordantes :

| palier | invite traitée | prefill | TOTAL | surcoût |
| ---: | ---: | ---: | ---: | ---: |
| 4 000 | 3 850 tok | 35,2 s | 38,3 s | référence |
| 8 000 | 7 510 tok | 81,9 s | 89,3 s | **+51 s** |
| 12 000 | 11 411 tok | 130,1 s | 143,3 s | +105 s |

Le débit de prefill tient entre 106 et 115 tok/s à froid. **Le plafond n'est pas un réglage de
qualité, c'est un réglage de temps d'attente** — verdict et méthode complets dans
`2026-08-23-plafond-rag-mesure.md`.

Elle a aussi remesuré le cache de préfixe sans le vouloir : rejouer le même palier avec le même sel
rend **722 puis 1 331 tok/s**. D'où la règle 1 ci-dessous, qu'elle a fallu réapprendre — le sel est
maintenant tiré **par appel**, pas par exécution.

## Deux règles pour s'en servir

1. **Saler l'invite à chaque exécution.** Ollama répond depuis son cache de préfixe : une première
   sonde a rendu 7 722 tok/s de prefill, ce qui mesurait le cache et rien d'autre.
2. **Ne faire varier qu'une chose.** Les trois hypothèses fausses de la soirée venaient toutes de
   raisonnements sur des données, jamais d'une mesure.

Le journal `~/ollama_debug.log`, lui, est écrit par l'application elle-même
(`electron/OllamaService.ts`) : une ligne par requête, une par réponse. C'est lui qu'il faut lire
en premier quand la Forge se comporte mal — les `console.log` du processus principal ne vont
**jamais** dans les DevTools.
