---
name: mes-skills
description: Présenter à David tous ses skills GM-OS (.claude/skills/) — ce que fait chacun, quand l'appeler, comment l'appeler, en lisant les fichiers à l'instant (jamais de mémoire). À utiliser quand David tape /mes-skills, demande « quels sont mes skills », « qu'est-ce que je peux appeler », « rappelle-moi mes procédures », « à quoi sert tel skill ». Avec l'argument « tout », ajoute les skills installés sur la machine (~/.claude/skills).
---

# Mes skills

Lecture seule. La liste se **lit dans les fichiers à chaque appel** : un skill ajouté demain y
apparaît sans toucher à celui-ci.

## 1 · Lire

```bash
node .claude/skills/mes-skills/lister.mjs        # skills du projet
node .claude/skills/mes-skills/lister.mjs tout   # + skills installés sur la machine
```

Passer `tout` seulement si David l'a demandé (argument « tout », « tous », « même les
plugins »). Si David nomme un skill précis, lire en plus son `SKILL.md` en entier et l'expliquer
en détail plutôt que la liste.

## 2 · Présenter à David, en français

Un tableau, un skill par ligne, dans cet ordre de colonnes :

| Appel | À quoi ça sert | Quand l'appeler |
|---|---|---|
| `/nom` | une phrase, tirée de la description | les déclencheurs, **avec les mots de David** cités dans la description |

- Résumer, ne pas recopier la description : une phrase pour « à quoi », une pour « quand ».
- Sous le tableau, une ligne : **on peut aussi ne rien taper** — Claude charge le skill seul
  quand la demande correspond ; `/nom` sert à le forcer.
- Pour `tout` : un second tableau plus court (appel + une phrase) pour les skills de la
  machine, séparé du premier — ce ne sont pas des procédures GM-OS.
- Si le script signale que **AGENTS.md ne cite pas** un skill, le dire en une ligne et
  proposer de l'ajouter (AGENTS.md est ce que Codex lit ; sans la ligne, il ignore le skill).

Rien d'autre : pas de conseil, pas de liste de ce qui reste à faire.
