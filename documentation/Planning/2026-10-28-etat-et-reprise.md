# État et reprise — 28/10/2026 (Claude Code)

## Ce que la session a produit

Gardes et skills de Claude Code, registre **§ 186** (ligne 122). Rien dans `src/` ni `electron/`,
aucun commit.

- `.claude/hooks/garde-git.mjs` : toute commande git qui écrit demande confirmation à David.
- `.claude/hooks/garde-gmos-tourne.mjs` : refus d'écrire dans `src/`/`electron/` si Vite répond sur
  5173 ; sinon « GM-OS tourne-t-il ? » une fois par session.
- `.claude/hooks/gardes.test.mjs` : 8 essais, `node --test .claude/hooks/gardes.test.mjs`.
- `.claude/settings.json` : les trois branchements (`PreToolUse` shell et édition, `PostToolUse`).
- `.claude/skills/` : `finir-un-pilote`, `relire-un-corpus`, `campagne-de-recette`,
  `clore-la-session`.
- `AGENTS.md` et la passation (§ 6) pointent vers les gardes et les skills.

## Par quoi reprendre

À la prochaine écriture dans `src/` : vérifier que la fenêtre de la garde s'ouvre, avec son
message, et qu'elle ne revient pas aux écritures suivantes. Au prochain pilote : laisser le skill
`finir-un-pilote` se déclencher et noter ce qu'il oublie.

## Ce qu'il ne faut pas repayer

- Sous Windows, `node --test <dossier>` échoue (« Cannot find module ») : nommer le fichier.
- Sous Git Bash, `echo` et `printf` cassent un JSON qui contient `\\` : faire fabriquer l'entrée
  d'essai d'un hook par `node -e "…JSON.stringify(…)"`.
- Un hook lancé directement compare `process.argv[1]` au fichier du module : sous Windows, mêler
  `/` et `\` ou la casse du lecteur fait échouer la comparaison, et le hook se tait sans erreur.
  Comparer des chemins résolus, en minuscules.
- ⛔ Ne jamais recalculer l'`empreinte` d'une fiche de règles corrigée : c'est l'écart avec le corps
  qui la marque « corrigée » et la protège d'une reforge (`empreinteDeLaFiche.ts`).
