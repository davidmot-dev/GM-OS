---
name: finir-un-pilote
description: Le parcours complet pour contrôler, corriger ou « finir » un pilote de jeu de GM-OS (driver .gmos-driver) contre son livre — jet, corpus, pilote 2.0.0, fiche HTML, thème, manuel des jeux, captures, synthèse des pilotes et registre. À utiliser dès que David livre un nouveau pilote (« j'ai créé un nouveau driver… tu peux contrôler »), demande de finir, d'améliorer ou d'auditer le pilote d'un jeu (Torg, NOC, Dune, Barbarians…), signale qu'un jet « réussit tout » ou « se trompe », ou veut une nouvelle mécanique propre à un jeu — même s'il ne prononce pas le mot « pilote ».
---

# Finir un pilote

Douze jeux ont suivi ce parcours (Alien, Barbarians of Lemuria, Blade Runner, Crimes, Cthulhu
Hack, Dune, Nephilim, NOC, Rêve de Dragon, Star Trek, Symbaroum…). Ce skill est la **liste à
cocher** ; le détail vit dans les documents du dépôt, qu'il cite au lieu de les recopier — s'ils
divergent, **le document fait foi**, et ce skill est à corriger.

Le meilleur modèle à imiter est le pilote fini le plus récent : registre § 184 et
`outils/barbarian/` (Barbarians of Lemuria, 27/10/2026).

## 0 · Avant tout

- **Faire le point depuis le dépôt, pas de mémoire** : la section du jeu dans
  `documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md`, le § du registre
  (`2026-08-23-chantiers-gares.md`), la page `documentation/User Guides/54-Jeu-<Jeu>.md`. Vérifier
  dans le code avant d'annoncer qu'une chose reste à faire : on a déjà annoncé cinq chantiers
  déjà faits.
- ⛔ **Avant toute écriture dans `src/` ou `electron/`, demander à David « GM-OS tourne-t-il ? »
  et attendre sa réponse.** La garde `.claude/hooks/garde-gmos-tourne.mjs` refuse si Vite tourne
  et pose la question une fois par session, mais elle ne voit pas tout : la question se pose
  aussi dans la conversation. *« Fermé » vaut jusqu'au prochain essai de David.*
- Le pilote vit dans les **données de David**, pas dans le dépôt : on part toujours d'un **export
  frais** (`Export Dirvers/`), ou du dernier pilote corrigé qu'il a réimporté. `corriges/` est vidé
  après réimport : `git show 41453319^:"Export Dirvers/corriges/<fichier>"` rend l'ancien.
  ⛔ Ne jamais commiter `Export Dirvers/`.

## 1 · Contrôler ce que David a livré

1. **Thème** : `npm run theme:valider -- <jeu>` (contrat :
   `documentation/Architecture/Cahier-des-charges-theme-de-jeu.md`).
2. **Fiche HTML** : `npm run fiche:valider -- <Jeu>` ou `-- chemin/fiche.html`
   (`documentation/Architecture/Flux-des-constructeurs.md`).
3. **Pilote** : lire `state.json` dans l'archive (AdmZip), puis le passer à `controlerLePilote`
   (`src/modules/forge/rules/controlesDuPilote.ts`) **et préparer un vrai jet** avec
   `preparerLeJet` (`src/modules/dice/DescripteurDeJet.ts`) sur un cas témoin tiré du livre. Depuis
   un script hors de `src/`, importer `outils/campagnes-de-recette/charger-typescript.mjs` puis les
   modules TypeScript **dynamiquement** (Node 24 retire les types ; un import statique est lié
   avant le hook de résolution).

**Le jet d'abord, parce que c'est là que les pilotes forgés mentent en silence :**

- `reussitesRequises: 0`, ou un seuil comparé à chaque dé sur un jeu **à somme**
  (2d6 + modificateurs ≥ 9) : **tout réussit** (Barbarians, 27/10). Un jeu à somme n'a pas de forme
  générique dans `DescripteurDeJet` : il lui faut sa mécanique (`jet.barbarians`).
- Un d20 « sous ou égal » est pris pour une **Sauvegarde** et écrit « réussite critique » sur
  chaque 1 : effacer le critique de base (`sansCritiqueDeBase`) au panneau **et** dans
  `jetDepuisLaFiche.ts` (tablette) — Symbaroum.
- Une valeur reprise d'un autre livre (le plafond de deux D12 venait du SRD Year Zero, pas de
  Blade Runner) : la rendre réglable.
- Dire le constat à David **avant** de corriger, et lui laisser l'ordre (« tout, dans l'ordre »).

## 2 · Le livre fait foi

Le PDF et son errata, que David fournit — **jamais** le carnet NotebookLM, qui a déjà inventé des
règles (Nephilim, Symbaroum). Relire le corpus `docs/systems/<jeu>/rules/` contre le livre :
suivre le skill **`relire-un-corpus`** (couches de texte doublées, décalage des pages, tables à
lire en image, budget de l'invite de la Forge).

## 3 · Le code

- Logique pure dans `src/modules/dice/systemes/<jeu>.ts` ou `<jeu>Regles.ts`, avec son essai ;
  cartes du panneau de jet dans `<Jeu>AuJet.tsx`. **Chercher la règle commune avant d'en écrire
  une** (`circonstancesDuSeuil.ts`, `jet.modificateurDuSeuil`, `paiementAuChoix`, `franchissements`
  — la synthèse, § « Améliorations communes », dit ce qui existe).
- Code et commentaires **en français** ; un commentaire dit *pourquoi*, avec la date et la
  demande de David citée. Imiter le fichier qu'on touche.
- ⛔ Un sélecteur zustand qui fabrique un tableau (`s => s.players.flatMap(...)`) fait boucler
  React : sélectionner `s.players`, dériver avec `useMemo`.
- Un nouveau module de jeu prend l'habillage du module existant du jeu (LCARS pour Star Trek).

## 4 · Le pilote 2.0.0

- Un script `outils/<jeu>/finir_<jeu>.py` (ou `.mjs`) part de l'export, **garde l'identifiant**
  du pilote et de son modèle de fiche, passe la version à `2.0.0`, écrit dans
  `Export Dirvers/corriges/`. Son en-tête dit, règle par règle, ce qui change et la page du livre.
- `controlerLePilote` : **zéro constat**. Puis David réimporte avec **« Remplacer »**.
- Un personnage créé sur l'ancienne fiche forgée garde ses anciennes valeurs : le dire à David.

## 5 · La fiche HTML reliée

- Intégrer le gabarit au moteur `docs/fiches/Character_Sheet_Manager.html` par un script
  `outils/<jeu>/integrer_au_moteur.mjs`, qui **monte `BUILTIN_VERSION` de un** (sans cela, une
  bibliothèque déjà garnie ne reçoit jamais le gabarit) et ajoute son commentaire daté.
- La correspondance des clés : `docs/systems/<jeu>/fiche/correspondance.json` ; la fiche GM-OS
  reprend les clés de la fiche HTML. Chercher ce que la fiche porte déjà avant d'ajouter un champ.
- `npm run fiche:valider` à nouveau ; une saisie GM-OS ne part vers la fiche HTML qu'après
  « Sauvegarder ».

## 6 · Vérifier

| Quoi | Commande | Le piège |
| --- | --- | --- |
| Essais ciblés | `npx vitest run <fichiers> --maxWorkers=4` | ⛔ sans la bride, tout échoue sans qu'un essai ait tourné |
| Corpus touché | `npx vitest run src/modules/forge/rules/corpusDerivable.test.ts --maxWorkers=4` | chaque groupe de fiches est borné (~21 000 caractères) |
| Types | `npx tsc -b` | ⛔ `tsc --noEmit` ne vérifie rien ici |
| Lint | `npx eslint <fichiers>` | |
| Manuel | `npx vitest run electron/manuelDesJeux.test.ts --maxWorkers=4` | refuse une mécanique du code sans sa ligne au 53 |
| e2e | `npm run build` **puis** `npx playwright test e2e/<x>.spec.ts --reporter=list` | un e2e lance `dist/` : sans build, il essaie le code d'hier. Sous Bash : `unset ELECTRON_RUN_AS_NODE` |
| Captures du jeu | `GMOS_PILOTES_DES_JEUX=<dossier ne contenant que ce pilote> npx playwright test e2e/capturesDesJeux.spec.ts --grep "<nom du pilote>"` | **relire les images** ; masquer les cartes qui gonflent la prise du panneau |

⛔ Ne jamais lancer `vitrine`, `vitrineDuSocle`, `campagnesEtThemes`, `profilageDesRendus` (ils
lisent les sauvegardes de David). Les e2e qui capturent réécrivent les images suivies de
`documentation/Planning/` : copier `documentation/` avant.

Un essai sauté n'est pas un essai passé : les e2e du Voyageur (Rêve de Dragon) se sautent en
silence sans le pilote R0 de `41453319^`.

## 7 · Documenter dans la même livraison

C'est une consigne de David (13/10 et 20/10), pas une option :

1. **Manuel des jeux** : la page `54-Jeu-<Jeu>.md` et sa ligne **« Pilote décrit »** ; la
   mécanique dans `53-Les-jeux-et-leurs-mecaniques.md` ; les captures.
2. **Synthèse des pilotes** (`2026-10-20-ameliorations-tous-les-pilotes.md`) : la section du jeu
   (acquis, reste, sujets à auditer, cas témoin) **et** sa ligne de la vue d'ensemble ; indicateurs
   🔴 → 🟠 à la livraison, 🟠 → 🟢 seulement quand David a essayé ; recompter « Avancement ».
   Un nouveau pilote reçoit sa section et sa ligne. Distinguer « livré » et « essai de David
   attendu ». La règle complète est en fin de document (« Mise à jour obligatoire »).
3. **Registre** : un nouveau § et une ligne de « La vue d'un coup d'œil » — voir le skill
   **`clore-la-session`** pour la numérotation et la forme.

## 8 · Rendre la main

- Le dernier reste est presque toujours **l'essai de David** : dire quel fichier réimporter
  (avec « Remplacer ») et quels trois gestes essayer (un jet, une ressource, la fiche du jeu).
- Ne pas commiter sans demande : « X fichiers modifiés, non commités ». Sur demande, un commit
  par sujet, message en français (`feat(<jeu>): …`), signé de Claude.
