# État et reprise — le 2026-09-22, **la trame devient un plan de scénario**

> **Base saine.** `tsc -b` propre, **5 905 essais Vitest** (460 fichiers, 1 ignoré), **14 E2E de
> graphe** sur un `dist/` frais, plus la traversée des 27 modules, Sound-OS, la curation et
> l'ouverture de scène au vert. Branche `feature/tablet-hub-pwa`.
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
| **104** | Le son sur la tablette — trois voies, et où elles sortent | ✅ **la moitié** : le curseur des bruitages *« fonctionne bien »*, le reste à essayer |
| **105** | Les deux silences de la projection — *« la vidéo ne se lance pas »* | ✅ **symptôme levé**, les deux messages restent à voir |
| **106** | Les fausses erreurs de Music-OS — un démontage qui criait à la panne | ⚠️ non |
| **107** | La cadence d'Ambient-OS — *« le son est saccadé »* | ⚠️ non |
| **108** | La lumière d'un moment, écrasée par les scènes liées à ses sons | ⚠️ non |
| **109** | La source d'ambiance qui traîne entre deux séquences | ⚠️ non |
| **110** | Cent allers-retours IPC par seconde — *« la vidéo aussi lag »* | ⚠️ non |
| **111** | Le détour de sortie — et **deux enceintes Bluetooth** | ✅ **oui** (*« j'ai testé avec le câble ça fonctionne »*) — ⚠️ les deux réparations ensemble |

⭐ **Les quatre premières n'étaient pas quatre fonctionnalités, mais une seule montée en puissance.** Chaque
demande est née de la précédente : classer les scènes a fait voir qu'on ne voyait pas la trame
d'ensemble ; le graphe a fait vouloir l'éditer ; l'éditer a fait manquer le seul lien que le modèle
ne portait pas — *celui qui dit où l'histoire peut aller.*

⭐ **Et le cinquième est né d'une vérification.** David a enfin essayé le curseur de bruitages de sa
tablette — réparé le 20/09 sans avoir été demandé —, a constaté qu'il marchait, **et a vu du même
coup ce qui manquait à côté**. *Éprouver une chose fait trouver la suivante ; c'est la meilleure
raison de tenir une liste de ce qui n'a jamais été vu à l'écran.*

---

## Par quoi reprendre

1. **Rien n'est en suspens sur la trame.** Les quatre chantiers sont éprouvés à l'écran.
2. **Le son de la tablette** (§ 104) — les deux lignes de l'onglet **Pads**, et les trois choix de
   sortie. ⚠️ Il faut **rafraîchir la page de la tablette** : elle lit `dist/`, et le bloc `audio`
   a remplacé `masterVolume` dans le pont.
3. ⚠️ **Le compresseur d'Ambient-OS — la question restée ouverte.** Il est le **seul** des trois
   moteurs à en porter un, réglé en limiteur : seuil − 24 dB, **ratio 12:1**, attaque 3 ms, relâche
   250 ms — et on lui envoie huit pistes sommées, amplifiées de 30 % avant. Il écrase donc en
   permanence et relâche toutes les 250 ms : du **pompage**. *Le corriger change le son de toutes
   les ambiances*, donc la décision appartient à David. ⭐ Même forme d'asymétrie que les 48 kHz du
   § 107 — et c'est elle qui avait désigné le coupable.
4. **Les six correctifs du soir** (§§ 106 à 111) — changer de morceau sans voir de bulle rouge,
   écouter une ambiance, et jouer un moment qui porte **à la fois** une lumière et un son lié.
   ⭐ **Et le câble vers la petite enceinte** (§ 111, décidé par David) : une sortie filaire est un
   **autre appareil Windows**, donc un autre `deviceId`. À reprendre dans cet ordre — la sortie
   d'Ambient-OS, celle de Sound-OS, puis **vider** le champ de sortie des moments et des pads pour
   qu'ils suivent celle du module. ⚠️ Le carnet des signatures ne rattrape **pas** ce cas : il
   retrouve un appareil revenu sous un nouveau numéro, pas un appareil remplacé par un autre.
   ⚠️ Et la latence tombe d'environ 200 ms à quelques millisecondes : **l'ambiance et les bruitages
   seront désormais en avance sur la musique** restée en Bluetooth.
5. **Les deux messages d'écran du § 105** — ils ne se montrent que le jour où un moniteur change
   d'identifiant. Rien à provoquer exprès : c'est un filet, pas une fonctionnalité.
6. **Les trois chantiers du 20-21/09 jamais vus** : l'essai d'une ambiance lumineuse (§ 92), le
   thème d'ambiance dans un moment (§ 94), et la boucle d'une vidéo (§ 97).
7. **La refonte de l'interface** (§ 76) — toujours à l'arrêt, rien ne la bloque. Le premier geste
   reste **T0.1** : les captures de référence, une soirée, aucun pixel changé.
   ⭐ *Décidé le 22/09 en répondant à une question de David* : la phase 2 donnera à Stitch **une
   fiche de contraintes** à côté des captures — données hostiles (11 combattants, `148/155`), le
   `font-size: 85%` de `:root`, les quatre thèmes dont le clair, et le contrat de sortie (des
   **valeurs**, pas des composants). *La capture porte la structure, le prompt porte ce qu'une
   image ne montre pas.*
8. **La restauration** (§ 87) — dans `npm run repetition`, jamais sur le vrai profil.

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

### ⭐⭐ Quand l'audio ET la vidéo souffrent ensemble, c'est le fil principal

La phrase qui a tout débloqué, lâchée par David alors que je cherchais encore dans le graphe audio :
*« la vidéo aussi lag »*. Deux symptômes dans deux domaines sans rapport ne désignent ni l'un ni
l'autre — ils désignent **ce qu'ils partagent**. J'ai changé de piste sur-le-champ et trouvé en
trois minutes : cent allers-retours IPC par seconde (§ 110).

⚠️ **Et l'état de la machine fait partie du diagnostic.** Sa RAM était à **84 %** avec 4,9 Go
libres sur 31, allumée depuis **4 jours et 11 heures**, et Windows avait mis en route sa compression
mémoire. À ce niveau, le système pagine en arrière-plan — cause classique de saccades audio et
vidéo simultanées. *Un correctif logiciel ne répare pas une machine qui étouffe, et l'inverse est
vrai aussi : les deux comptaient.*

⭐ Le réflexe à garder : **`Get-CimInstance Win32_OperatingSystem`** avant de chercher longtemps.

### ⭐ La méthode a servi deux fois dans la soirée

Le défaut de la lumière (§ 108) avait la même forme que celui de la vidéo (§ 105) : *« ça marche
depuis le module, pas depuis le storyboard »*. La seconde fois, je n'ai pas relu trois fois — j'ai
comparé les deux appels, constaté qu'ils étaient équivalents, **puis demandé à David ce qui
différait à l'œil**. Deux réponses (*les couleurs* ; *rejouer la tuile répare*) ont désigné le
coupable en une minute : quelque chose écrit **après**.

⭐ *Une question précise au meneur vaut trois relectures du code — lui seul voit le symptôme.*

### ⭐⭐ Quand deux chemins produisent le même ordre et un résultat différent, l'erreur est autour

Le défaut du soir : *« la vidéo ne se lance pas à partir du Master Storyboard »*, alors qu'elle part
d'Image-OS. J'ai relu **trois fois** toute la chaîne sans rien voir — parce qu'il n'y avait rien à
voir. Une reproduction **côte à côte**, dix lignes, a tranché :

```
IMAGE-OS   launchDisplay = [["m-1757000000"], "moniteur-2"]
MOMENT     launchDisplay = [["m-1757000000"], "moniteur-2"]
```

⭐ *Lire le code ne pouvait pas le trouver ; exécuter les deux gestes l'a montré tout de suite.* Le
défaut n'était nulle part dans le chemin — il était dans **ce que personne ne disait** : un repli
silencieux sur le hub, et un ordre jeté dans une console. Voir § 105.

⚠️ **Et j'ai signalé un troisième défaut qui n'en était pas** — le titre vide qu'un moment émet.
Le code disait pourquoi, et il avait raison : *un titre vide retire celui qui est affiché.* Lire le
commentaire avant d'annoncer aurait suffi.

### ⭐ Une liste plausible et fausse coûte plus cher qu'une liste absente

La tablette ne peut pas énumérer les sorties audio : `enumerateDevices()` y rend **les siennes**. Le
meneur aurait choisi « écouteurs Bluetooth » et rien n'aurait bougé sur son PC. La liste vient donc
de chez lui, avec **les noms qu'il a donnés** — `useHardwareStore` les tenait déjà.

⚠️ Et `?? 1` n'aurait pas suffi pour les volumes : un magasin peut porter `NaN`, et `NaN ?? 1` vaut
`NaN`. *Le même piège que `valeur || undefined` qui avale un zéro légitime, pris par l'autre bout.*

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
