# État et reprise — le 2026-09-22, **la trame devient un plan de scénario**

> **Base saine.** `tsc -b` propre, **5 845 essais Vitest** (454 fichiers, 1 ignoré), **14 E2E de
> graphe** sur un `dist/` frais, plus la traversée des 27 modules, la curation et l'ouverture de
> scène au vert. Branche `feature/tablet-hub-pwa`.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md).
>
> Il prend la suite de [`2026-09-21-etat-et-reprise.md`](./2026-09-21-etat-et-reprise.md).

---

## Ce que la journée a produit

| § | Chantier | Éprouvé ? |
| --- | --- | --- |
| **100** | Le rang d'une scène dans l'intrigue — principale, secondaire, optionnelle | ✅ **vu à l'écran** (capture) |
| **101** | Le graphe de la trame — actes, scènes, lieux, PNJ, indices, personnages, ambiances | ✅ **oui** (*« le graphe fonctionne bien »*) |
| **102** | Modifier la trame depuis le graphe — panneau, mode liaison, réorganisation | ✅ **oui** (*« ok c'est bien »*) |
| **103** | « Cette scène mène à celle-là » — embranchements avec condition | ✅ **oui** (*« ok c'est bon »*) |

⭐ **Les quatre n'étaient pas quatre fonctionnalités, mais une seule montée en puissance.** Chaque
demande est née de la précédente : classer les scènes a fait voir qu'on ne voyait pas la trame
d'ensemble ; le graphe a fait vouloir l'éditer ; l'éditer a fait manquer le seul lien que le modèle
ne portait pas — *celui qui dit où l'histoire peut aller.*

---

## Par quoi reprendre

1. **Rien n'est en suspens sur la trame.** Les quatre chantiers sont éprouvés à l'écran.
2. **Les quatre chantiers du 20-21/09 jamais vus** : l'essai d'une ambiance lumineuse (§ 92), le
   thème d'ambiance dans un moment (§ 94), le dosage des sources (§ 95) — **dont le curseur du
   soundboard de la tablette, réparé sans avoir été demandé** —, et la boucle d'une vidéo (§ 97).
3. **La refonte de l'interface** (§ 76) — toujours à l'arrêt, rien ne la bloque. Le premier geste
   reste **T0.1** : les captures de référence, une soirée, aucun pixel changé.
   ⭐ *Décidé le 22/09 en répondant à une question de David* : la phase 2 donnera à Stitch **une
   fiche de contraintes** à côté des captures — données hostiles (11 combattants, `148/155`), le
   `font-size: 85%` de `:root`, les quatre thèmes dont le clair, et le contrat de sortie (des
   **valeurs**, pas des composants). *La capture porte la structure, le prompt porte ce qu'une
   image ne montre pas.*
4. **La restauration** (§ 87) — dans `npm run repetition`, jamais sur le vrai profil.

---

## Ce qu'il ne faut pas repayer

### ⭐⭐ Une normalisation qui s'applique à la frappe empêche d'écrire

Le défaut de la journée, et le seul que David ait vu à l'écran : *« dans les conditions je ne peux
pas mettre d'espace entre les mots »* — capture à l'appui, « camérasurveillance ».

Le champ est **contrôlé** : chaque frappe repassait par un `trim()`. Taper « caméra » puis l'espace
écrivait `"caméra "`, aussitôt rendu `"caméra"`. *L'espace était mangé avant d'avoir existé.*

Le remède n'est pas de supprimer le nettoyage, c'est de **le déplacer** : on garde ce qui est tapé,
et l'affichage rogne. ⚠️ La borne de **longueur**, elle, reste à l'écriture — le champ la montre en
refusant la frappe suivante, ce qui s'explique de soi-même. Un rognage, non.

⛔ **Et trois de mes propres essais gardaient le défaut** : ils exigeaient qu'un libellé d'espaces
devienne vide *à la lecture*, ce qui supposait exactement le `trim()` fautif. *Ils passaient au vert
sur le code qui empêchait d'écrire.*

⛔ **L'essai de bout en bout ne pouvait pas le voir non plus** : `fill()` pose la valeur d'un seul
coup. Pour voir ce genre de défaut, il faut **`pressSequentially`**.

> Quatre autres champs rognent encore à la frappe — l'URL d'un fournisseur d'IA, l'identifiant de
> compte et de modèle Cloudflare, l'icône d'une scène Light-OS. **Aucun ne bloque une saisie
> légitime** : l'espace n'y a pas de sens. Laissés tels quels, sciemment.

### ⭐ Deux vérités sur la même question se préviennent par une règle, pas par un arbitrage

L'ordre des scènes dans un acte **était déjà** un enchaînement. Y ajouter des liens explicites
créait un second répondant — le motif que ce dépôt paie le plus souvent.

La règle : **l'ordre ne se dessine que là où le meneur n'a rien dit.** Elle n'interdit rien, elle
rend la contradiction impossible. Et chacune garde son rôle : l'ordre range le document,
l'enchaînement dit où l'histoire peut couler.

### ⭐ Une seconde porte n'est pas un second écrivain

Ma réserve du 21/09 — *« un sixième écrivain de la trame »* — ne disait pas « pas d'édition », elle
disait **comment**. Le graphe calcule ce qu'il faut écrire dans un module pur, puis appelle
`modifierScene` : celle des cases à cocher de la fiche. Le contrôle du rang est devenu un composant
**partagé** par les deux écrans, pour la même raison.

### ⚠️ Trois échecs d'essai qui n'étaient pas dans le code

Ils ont coûté plus que les défauts eux-mêmes :

1. **La toile s'ouvre à une échelle de 2** — 110 px d'écran valent 55 unités de graphe. L'échelle
   est désormais **mesurée au lancement** de l'essai, jamais inscrite en dur : *l'inscrire aurait
   rendu les essais faux le jour où la bibliothèque change son cadrage, sans les faire échouer pour
   la bonne raison.*
2. **Je glissais avant que React n'ait appliqué le mode liaison.** L'entrée dans le mode attend
   maintenant son bandeau.
3. **Je désignais un nœud par un clic au centre**, là où la simulation regroupe tout ce qui n'est
   pas épinglé. *Un essai qui désigne sa cible au hasard finit par échouer pour une raison qui n'a
   rien à voir.*

### ⛔ Une collision de positions, trouvée avant l'écran

Le graphe de trame et le Nexus social montrent **les mêmes PNJ**. Réemployer `nodePositions` aurait
fait que déplacer Kessler ici le déplaçait là-bas — *un défaut qu'on aurait mis sur le compte de
d3*. Trois champs à lui. ⭐ Ce qui **est** partagé, c'est la seule chose qui compte : `placerLeNoeud`,
la règle qui a corrigé le remélange du 03/09. *Les champs sont deux, la règle est une.*

---

## Ce que la journée a confirmé

⭐ **Le correctif du 2026-09-03 est ce qui a rendu l'édition du graphe possible.** Chaque écriture
reconstruit le graphe, donc remélangerait tout — sauf que `placerLeNoeud` sème les positions
connues. *Un correctif de confort, trois semaines plus tôt, est devenu la condition d'une
fonctionnalité.*

⭐ **Une idée de David a remplacé la mienne.** Sept cases à cocher font 128 vues possibles ; son
curseur de niveau fait une profondeur. *La densité se règle par un geste, pas par une négociation.*
