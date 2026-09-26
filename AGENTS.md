# AGENTS.md — consignes pour tout agent qui travaille dans ce dépôt

GM-OS est une application Electron de meneur de jeu de rôle, écrite et maintenue avec David (le
meneur, propriétaire du dépôt) et Claude Code. Ce fichier est lu automatiquement par les agents
qui le connaissent, comme Codex. Il dit surtout **ce qu'il ne faut pas faire**, et pourquoi. **En
cas de doute, demande à David avant d'agir.**

> Les thèmes de jeu ne sont **pas** construits ici : ils viennent de *RPG Theme Builder*, dans
> ChatGPT. Leur contrat est
> [`documentation/Architecture/Cahier-des-charges-theme-de-jeu.md`](documentation/Architecture/Cahier-des-charges-theme-de-jeu.md)
> et leur déroulé [`documentation/Architecture/Pipeline-des-themes.md`](documentation/Architecture/Pipeline-des-themes.md).

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

Claude Code travaille dans le même dépôt. **Un seul écrivain par fichier.** Si `git status` montre
des changements que tu n'as pas faits, ils ne sont pas à toi : n'y touche pas.

## Pièges de l'environnement

- Windows. Les essais se lancent avec `npx vitest run --maxWorkers=4` : **sans la bride, les 460
  fichiers échouent** sans qu'un seul test ait tourné.
- La vérification des types est `npx tsc -b`, **pas** `tsc --noEmit`, qui ne vérifie rien ici.
- `docs/` est le corpus que l'Oracle de GM-OS indexe : un `.md` posé dans `docs/` entre dans ses
  réponses, sauf s'il est exclu par un `.ragignore`.
