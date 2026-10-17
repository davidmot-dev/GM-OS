# Les Vécus de Nephilim — extraction depuis le carnet NotebookLM

Ouvert le 2026-10-17 (chantier : `documentation/Planning/2026-10-17-chantier-nephilim.md`).
Source : *Nephilim5 — Livre 0 — Quintessence*, chapitre « Les époques d'incarnation », p. 61 à
99 : **7 ères, 20 époques, 5 Vécus par époque** (un par Ka-élément), soit 100 Vécus.

## Contenu

- `extraire_vecus.py` — interroge le carnet « Nephilim »
  (`9389872e-c46b-4cf1-bd6c-18bfccae13b8`) époque par époque et range chaque réponse brute
  dans `bruts/NN.json`. **Il saute les fichiers déjà présents.**
- `bruts/` — les réponses du carnet, en JSON demandé (nom, Ka, description, page).
- `etendre_fiche_nephilim.py` — l'extension de la fiche GM-OS du pilote aux pages 3 à 7 de la
  fiche HTML (servie le 17/10 ; gardée pour une prochaine régénération).
- `relier_vecus.py` — relie les noms des Vécus à `vecus/index.json` (liste selon les
  incarnations) et les huit époques d'incarnation à `vecus/epoques.json`.
- `ranger_incarnations.py` — place la section « Incarnations » juste avant « Les Vécus » :
  on lit l'époque avant le Vécu qui en vient (18/10). Sans effet si c'est déjà fait.

## État au 17/10, 22 h 50 — terminé, sauf quatre époques

- **80 Vécus, 16 époques**, écrits par `ecrire_vecus.py` dans `docs/systems/nephilim/vecus/` :
  un Markdown par époque (2 600 à 4 000 caractères) et `index.json` (nom, Ka, ère, époque, page,
  fichier). Chaque époque est vérifiée : cinq Vécus, un par Ka-élément.
- **4 époques absentes des sources du carnet** — il le dit lui-même, sans rien inventer :
  *Le règne de Salomon* (p. 77), *La Syracuse des philosophes* (p. 79), *Al-Andalus* (p. 89),
  *L'An Mil* (p. 91). Elles figurent dans `index.json` sous `epoquesManquantes`.
- `hors-sujet/` garde les réponses où le carnet a décrit des lieux au lieu des Vécus (redemandées).

## Compléter les quatre époques manquantes

Le carnet n'a pas ces pages. Il faut leur texte — le PDF, ou une saisie — puis un fichier
`bruts/NN.json` de la même forme que les autres (`reponse` contenant le JSON des cinq Vécus), et :

```
python -I -X utf8 outils/nephilim-vecus/ecrire_vecus.py
```
