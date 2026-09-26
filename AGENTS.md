# AGENTS.md — consignes pour Codex dans le dépôt GM-OS

GM-OS est une application Electron de meneur de jeu de rôle, écrite et maintenue avec David (le
meneur, propriétaire du dépôt) et Claude Code. Ce fichier dit ce que tu peux faire ici, et surtout
ce que tu ne dois pas faire. **En cas de doute, demande à David avant d'agir.**

## Ta mission : construire les thèmes de jeu

1. **Lis d'abord** [`documentation/Architecture/Cahier-des-charges-theme-de-jeu.md`](documentation/Architecture/Cahier-des-charges-theme-de-jeu.md).
   C'est la **source de vérité** : ce qui n'y figure pas n'a aucun effet dans GM-OS.
2. Le déroulé du travail est dans [`documentation/Architecture/Pipeline-des-themes.md`](documentation/Architecture/Pipeline-des-themes.md).
3. Un thème vit dans `docs/systems/<jeu>/theme/` : `theme.css` et `intention.md`, obligatoires,
   plus, au besoin, `matieres/`, `ornements.json`, `ornements/` et `apercu/`.
4. **Valide avant de livrer.** Le validateur `npm run theme:valider -- <jeu>` est **en
   construction** ; tant qu'il n'existe pas, applique la liste de contrôle du § 13 du cahier et
   calcule toi-même les contrastes du § 6. Dès qu'il existe, **ne livre jamais un thème qu'il
   refuse**, et lis ses contrastes au lieu de les recalculer.
5. **Signale plutôt que contourner.** Ce que le contrat ne permet pas va dans les limites
   d'`intention.md`, avec sa classe. Jamais de règle CSS pour régler l'interface : GM-OS ne la lit
   pas, et David croirait l'effet présent.

## Où tu peux écrire

- ✅ `docs/systems/<jeu>/theme/`, pour le jeu que David t'a désigné.
- ⛔ **Partout ailleurs, seulement si David te le demande explicitement.** En particulier :
  `src/`, `electron/`, `e2e/`, `scripts/`, `package.json`, les fichiers de configuration, et les
  documents de `documentation/` — le cahier des charges compris. Si le contrat te semble devoir
  évoluer, **propose-le à David** ; ne le modifie pas.

## Ce qui est interdit, et pourquoi

- ⛔ **Aucune commande git qui écrit** : `commit`, `push`, `stash`, `checkout`, `reset`, `rebase`,
  `worktree`, `clean`. David et Claude Code s'en chargent. *Une première version de la sauvegarde
  automatique exécutait `git stash` et `git checkout` dans ce dépôt, et a **vidé l'application**.*
  La lecture (`status`, `diff`, `log`) est permise.
- ⛔ **Ne modifie rien dans `src/` ni `electron/` pendant que GM-OS tourne**, même sur demande,
  sans avoir demandé à David « GM-OS tourne-t-il ? » et attendu sa réponse. Le rechargement à chaud
  a déjà fait **perdre ses campagnes** à David, deux fois.
- ⛔ Ne touche jamais aux données de David : `%APPDATA%\gm-os-v5\`,
  `C:\Projet_David\Security_Backup_GMOS\`.
- ⛔ N'installe aucun paquet et ne lance aucun service réseau.
- ⛔ Ne livre pas `theme.original.css` (c'est GM-OS qui le crée) ni `icones.json` (réservé).

## Travailler à côté de Claude Code

Claude Code travaille dans le même dépôt. **Un seul écrivain par fichier** : ne modifie pas un
fichier qu'il est en train de changer, et ne défais pas ses modifications. Si `git status` montre
des changements que tu n'as pas faits, ils ne sont pas à toi : n'y touche pas.

## Pièges de l'environnement

- Windows. Les essais se lancent avec `npx vitest run --maxWorkers=4` : **sans la bride, les 460
  fichiers échouent** sans qu'un seul test ait tourné.
- La vérification des types est `npx tsc -b`, **pas** `tsc --noEmit`, qui ne vérifie rien ici.
- `docs/` est le corpus que l'Oracle de GM-OS indexe : un `.md` posé dans `docs/` entre dans ses
  réponses, sauf s'il est exclu par un `.ragignore`. Les dossiers `theme/` le sont.
