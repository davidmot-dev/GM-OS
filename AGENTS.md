# AGENTS.md — consignes pour tout agent qui travaille dans ce dépôt

GM-OS est une application Electron de meneur de jeu de rôle, écrite et maintenue avec David (le
meneur, propriétaire du dépôt) et Claude Code. Ce fichier est lu automatiquement par les agents
qui le connaissent, comme Codex. Il dit surtout **ce qu'il ne faut pas faire**, et pourquoi. **En
cas de doute, demande à David avant d'agir.**

> 🔁 **Reprendre le travail de l'autre agent** (Claude Code ↔ Codex) : lire d'abord
> [`documentation/Planning/2026-10-04-passation-claude-codex.md`](documentation/Planning/2026-10-04-passation-claude-codex.md)
> — l'ordre de lecture, le protocole de passation, les commandes et les pièges. L'état des
> chantiers vit dans le registre
> [`documentation/Planning/2026-08-23-chantiers-gares.md`](documentation/Planning/2026-08-23-chantiers-gares.md).

> Les thèmes de jeu ne sont **pas** construits ici : ils viennent de *RPG Theme Builder*, dans
> ChatGPT. Leur contrat est
> [`documentation/Architecture/Cahier-des-charges-theme-de-jeu.md`](documentation/Architecture/Cahier-des-charges-theme-de-jeu.md)
> et leur déroulé [`documentation/Architecture/Pipeline-des-themes.md`](documentation/Architecture/Pipeline-des-themes.md).
> Les fiches de personnage suivent la même boucle, avec *Character Sheet HTML Studio* :
> [`documentation/Architecture/Flux-des-constructeurs.md`](documentation/Architecture/Flux-des-constructeurs.md).
> Les sources des deux constructeurs sont dans `outils/`.

> Ce que chaque jeu change à l'écran est décrit dans le **manuel des jeux** :
> [`documentation/User Guides/53-Les-jeux-et-leurs-mecaniques.md`](documentation/User%20Guides/53-Les-jeux-et-leurs-mecaniques.md)
> et une page `54-Jeu-….md` par jeu. **Un pilote nouveau ou amélioré s'y reporte**, captures
> comprises (`e2e/capturesDesJeux.spec.ts`) — voir la passation, § 4.

> **Synthèse des améliorations des pilotes — document vivant :**
> [`documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md`](documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md).
> **À chaque amélioration mise en place, actualiser la section du pilote et la vue d'ensemble
> dans la même livraison** : acquis, travaux restants, date, références et vérifications ;
> distinguer réalisation et essai restant à faire. **À chaque nouveau pilote, ajouter sa
> section et sa ligne de synthèse**, avec ses acquis, améliorations possibles et sujets à
> auditer. Tenir aussi à jour les registres détaillés liés. Consigne de David du 20/10/2026.

## Ce qui est interdit, et pourquoi

- ⛔ **Aucune commande git qui écrit** (`commit`, `push`, `stash`, `checkout`, `reset`, `rebase`,
  `worktree`, `clean`) sans demande explicite de David. *Une première version de la sauvegarde
  automatique exécutait `git stash` et `git checkout` dans ce dépôt, et a **vidé l'application**.*
  La lecture (`status`, `diff`, `log`) est permise.
- ⛔ **Avant toute modification dans `src/` ou `electron/`, demande à David « GM-OS tourne-t-il ? »
  et attends sa réponse.** Le rechargement à chaud a déjà fait **perdre ses campagnes** à David,
  deux fois.
- ⛔ Ne touche jamais aux données de David : `%APPDATA%\gm-os-v5\`,
  `C:\Projet_David\Security_Backup_GMOS\`.
- ⛔ N'installe aucun paquet et ne lance aucun service réseau sans demande.

## Travailler à côté de Claude Code

**Branche de travail : `production`** (depuis le 22/10/2026, décision de David).
`feature/tablet-hub-pwa` est gelée comme repère : n'y commite plus. Ne crée pas de branche par
chantier — Claude Code travaille dans le même dossier.

Claude Code travaille dans le même dépôt. **Un seul écrivain par fichier.** Si `git status` montre
des changements que tu n'as pas faits, ils ne sont pas à toi : n'y touche pas.

## Pièges de l'environnement

- Windows. Les essais se lancent avec `npx vitest run --maxWorkers=4` : **sans la bride, les 460
  fichiers échouent** sans qu'un seul test ait tourné.
- La vérification des types est `npx tsc -b`, **pas** `tsc --noEmit`, qui ne vérifie rien ici.
- `docs/` est le corpus que l'Oracle de GM-OS indexe : un `.md` posé dans `docs/` entre dans ses
  réponses, sauf s'il est exclu par un `.ragignore`.
