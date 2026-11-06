---
name: auditer-un-parcours
description: Auditer un parcours d'écran de GM-OS bouton par bouton — ce que chaque action de magasin zustand écrit et remet à zéro, l'ordre des appels de chaque bouton, les retours silencieux, les verrous jamais rendus, les réponses qui arrivent après qu'on est parti. À utiliser quand David dit « rien ne se passe », « le bouton ne fait rien », « ça s'ouvre sans résultat », qu'un écran se fige, ou après une refonte qui touche un magasin partagé — même si les essais passent et que chaque fonction, prise seule, marche.
---

# Auditer un parcours d'écran

Repris le 06/11/2026 de l'idée `click-path-audit` d'ECC, à la demande de David, et réécrit pour
GM-OS. **Ce qu'il cherche** : les défauts que la lecture d'une fonction ne montre pas, parce que
chaque fonction marche seule — c'est leur **suite** qui échoue. Le motif revient sans cesse ici
(mémoire : « plusieurs écrivains pour une même donnée ») :

- le sujet libre de l'atelier, écarté sans un mot parce qu'il était déjà dans la liste (06/11) ;
- le « X » de l'atelier qui remettait l'affichage à zéro en gardant le verrou du carnet ;
- le hub et le projecteur qui écrasaient sept magasins du meneur ;
- la note `*Relu le …*` prise pour un sujet par un lecteur qui « marchait ».

**Lecture seule.** L'audit ne corrige rien : il rend une liste de défauts. ⛔ Avant de corriger
dans `src/` ou `electron/`, demander à David « GM-OS tourne-t-il ? » et attendre sa réponse.

## 1 · Délimiter le parcours

Un parcours = ce que David fait, avec ses mots : « taper un sujet libre, Analyser, cliquer la
carte, relire, publier ». Lister les composants traversés et les magasins (`use…Store`) qu'ils
lisent ou écrivent. Un parcours de plus de six gestes se coupe en deux audits.

## 2 · La carte des magasins — d'abord

Pour chaque magasin du parcours, chaque action :

```
useBrainstormStore
  startDiscovery()   → écrit {step, candidates: [], inventaireBrut: null, error: null…}
                       REMET À ZÉRO candidates, activeCard  ← qui d'autre les lit ?
  setSupplementCible → écrit {supplementCible} REMET À ZÉRO candidates, inventaireBrut, activeCard
```

Noter à part :
- **les remises à zéro d'un champ qu'une autre action possède** (le cas « Nouveau courriel » d'ECC :
  `selectThread` remettait `composeMode` à faux, le bouton ne faisait rien) ;
- **les verrous et drapeaux hors magasin** (variables de module comme `carnetOccupe`, fichiers de
  réponse) : qui les pose, qui les rend, sur **tous** les chemins (succès, erreur, abandon) ;
- **les effets** (`useEffect`) qui réécrivent le magasin : leurs dépendances, et ce qui les relance.

## 3 · Chaque geste, appel par appel

Pour chaque bouton, saisie ou touche du parcours :

```
GESTE : « Analyser » (ForgeDashboard.tsx:L…)
  1. setNotebook(id)          écrit {notebookId}
  2. startDiscovery()         écrit {step:'discovery'}, remet candidates à []
  → effet BrainstormOverlay:L… (candidates vides) → reprendreInventaire() → construireCandidats()
ATTENDU (ce que le libellé promet) : la liste, avec le sujet tapé
OBTENU : …
VERDICT : conforme | DÉFAUT — …
```

Les six questions, à chaque geste :

1. **Retour muet** : une condition de garde (`if (!x) return;`, `if (gen === null) return;`) peut-elle
   arrêter le geste **sans message** ? Un geste qui ne fait rien doit le dire.
2. **Défaire** : un appel plus loin remet-il à zéro ce qu'un appel précédent vient d'écrire ?
3. **État final** : l'écran final correspond-il au libellé du bouton ?
4. **Verrou rendu** : chaque verrou pris est-il rendu sur le chemin de l'erreur et de l'abandon ?
5. **Réponse tardive** : une réponse asynchrone qui arrive après un abandon, une fermeture ou un
   autre geste écrit-elle encore dans le magasin ? (Le motif `generationCourante()` de l'atelier.)
6. **Doublon silencieux** : une donnée déjà présente est-elle écartée sans le dire ?

## 4 · Vérifier avant d'annoncer

Un défaut supposé se **prouve** : un essai qui le reproduit (rendu du composant avec le magasin
préparé, comme `BrainstormOverlay.test.tsx`), ou la ligne exacte qui le cause. Sinon, il est noté
« à vérifier », pas « défaut ». On a déjà annoncé des défauts et des restes qui n'existaient pas.

## 5 · Rendre l'audit

Une liste, du plus grave au moins grave : le geste, ce que David voit, la cause (fichier:ligne),
la correction proposée. Puis, avec l'accord de David et après « GM-OS tourne-t-il ? », corriger
**un défaut à la fois, avec l'essai qui l'aurait attrapé** — et le noter au registre (skill
`clore-la-session`).
