---
name: clore-la-session
description: Clore une session de travail sur GM-OS pour que David, Claude Code ou Codex puissent reprendre — note du jour « état et reprise », registre des chantiers (nouveau § et ligne de la vue d'ensemble), synthèse des pilotes, état des fichiers non commités. À utiliser quand David dit qu'on s'arrête, qu'il faut faire le point, consigner, mettre à jour le registre ou « la doc », préparer la passation à Codex, ou quand un chantier vient d'être livré ou garé — et aussi, sans qu'il le demande, avant de rendre la main après une livraison.
---

# Clore la session

Claude Code et Codex travaillent dans le même dépôt et ne partagent **que lui** : la mémoire
privée de Claude, Codex ne la lit pas. Ce qui n'est pas écrit dans le dépôt est perdu pour
l'autre agent — et pour David. Le protocole complet est au § 4 de
`documentation/Planning/2026-10-04-passation-claude-codex.md` ; ce skill en est la liste.

## 1 · La note du jour

`documentation/Planning/AAAA-MM-JJ-etat-et-reprise.md` (si elle existe déjà ce jour-là, la
compléter par une section « Suite du … » plutôt que d'en créer une autre ; Codex suffixe la
sienne, `…-etat-et-reprise-codex-<sujet>.md`). Trois choses, dans cet ordre :

1. **Ce que la session a produit**, avec les commits s'il y en a, et les fichiers clés.
2. **Par quoi reprendre** : le premier geste concret, pas un thème.
3. **Ce qu'il ne faut pas repayer** : les pièges payés pendant la session, avec leur remède.

## 2 · Le registre

`documentation/Planning/2026-08-23-chantiers-gares.md` est **le** registre. Un chantier livré,
ouvert ou garé y a deux traces :

- **Une section numérotée** `### <n> · <Titre> — JJ/MM/AAAA`, placée **juste avant**
  `## La vue d'un coup d'œil`. Pour le numéro, lire le dernier :
  `grep -n "^### [0-9]" documentation/Planning/2026-08-23-chantiers-gares.md | tail -3`
  (ne pas se fier au numéro « prochain » cité ailleurs, qui vieillit). Elle s'ouvre sur **la
  demande de David, citée entre guillemets**, puis des puces : ce qui a été fait, avec les
  ancres (fichiers, fonctions, commits), **Vérifié** (les commandes réellement lancées), **Reste**.
- **Une ligne en tête du tableau** `## La vue d'un coup d'œil` (les plus récentes en haut) :
  `| <m> | **<Chantier>** | § <n> ; <état> — JJ/MM | <le premier geste> | <bloqué par> |`.
  Le numéro de ligne suit la dernière ligne du tableau, pas celui du §.
- **Un défaut trouvé en chemin, hors du chantier** : au **§ 1 bis** (« Constaté, pas encore
  traité »), jamais glissé dans un correctif d'un autre sujet.
- **Une décision de David** : avec ses mots et sa date, là où elle s'applique — c'est ce qui
  empêche l'autre agent de la rouvrir.

## 3 · Les documents liés

- **Un pilote touché** : la section du jeu et la vue d'ensemble de
  `2026-10-20-ameliorations-tous-les-pilotes.md`, la page `54-Jeu-<Jeu>.md`, la mécanique au 53
  (consigne de David des 13 et 20/10 ; détail dans le skill **`finir-un-pilote`**).
- **Un chantier qui a son propre document** (bilan, audit, chantier Nephilim…) : le mettre à jour
  aussi, et le citer depuis le §.
- Distinguer partout **livré** et **essayé par David** : un essai attendu reste écrit comme tel.

## 4 · Vérifier avant d'écrire « reste »

Un reste annoncé se vérifie **dans le code** et dans le registre (§ ⭐), pas de mémoire : le 31/08,
cinq chantiers « à faire » étaient déjà faits. Citer l'ancre (fichier, fonction) de ce qui manque.

## 5 · Rendre la main

- `git status` ; ne rien toucher de ce qui n'est pas à soi (un seul écrivain par fichier).
- ⛔ **Pas de commit sans demande de David** (la garde `.claude/hooks/garde-git.mjs` le fait
  confirmer). Sans demande, le dire : **« X fichiers modifiés, non commités »**, en les nommant.
- Sur demande : un commit par sujet, message en français sans accents dans le titre,
  `type(portée): ce qui change`, le corps dit pourquoi et cite David ; signé
  `Co-Authored-By: Claude …`. Le `git push` lance la validation complète (4 à 5 minutes) : en
  arrière-plan, sans délai ni arrêt, et rien édité dans `src/` pendant.
- Une leçon qui doit survivre va dans la note du jour ou au § 8 de la passation — pas seulement
  dans la mémoire de Claude.
