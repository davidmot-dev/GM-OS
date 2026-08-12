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

## Deux règles pour s'en servir

1. **Saler l'invite à chaque exécution.** Ollama répond depuis son cache de préfixe : une première
   sonde a rendu 7 722 tok/s de prefill, ce qui mesurait le cache et rien d'autre.
2. **Ne faire varier qu'une chose.** Les trois hypothèses fausses de la soirée venaient toutes de
   raisonnements sur des données, jamais d'une mesure.

Le journal `~/ollama_debug.log`, lui, est écrit par l'application elle-même
(`electron/OllamaService.ts`) : une ligne par requête, une par réponse. C'est lui qu'il faut lire
en premier quand la Forge se comporte mal — les `console.log` du processus principal ne vont
**jamais** dans les DevTools.
