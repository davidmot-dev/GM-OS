# Publication Codex — GM-05 et RuneQuest — 01/11/2026

David : **« ok c'est bien, c'est testé. Commit et pousse »**. RQ-A1 est maintenant coché/vert,
comme GM-05 et RQ-A2. La validation humaine globale reste distincte des résultats individuels :
le ZIP éprouvé et le CSV initial ne sont pas réécrits. Confirmation sous
[VALIDATION-DAVID.md](../../output/campagnes-tests/runequest/VALIDATION-DAVID.md).

## Commits de cette publication sur production

- **973e3a17** — filtre GM-05, régressions, E2E et preuves sur quatre jeux/douze Hub, guide 62.
- **fb9d7a88** — PV de la cible RuneQuest (RQ-A2), tests, captures et manuels 53/54.
- Le **commit contenant cette note**, `feat(recette): aligner les campagnes RuneQuest sur le pilote 2.1.0` :
  RQ-A1, sources et lot 2.1.0/320 champs, 78 cas, historique conservé, analyse des quatre
  nouveaux pilotes, plan à cocher et registre actualisés. Voir git log pour son identifiant.

L'index de chaque commit a été contrôlé contre une liste explicite de fichiers. Les exports
Shadowrun non suivis, docs/Reference, traces des autres recettes et fichiers tmp restent hors
publication. Aucun src/ ou electron/ modifié pendant la préparation des commits après les
essais de David ; les deux correctifs déjà essayés sont seulement indexés et commités.

## Vérifications et reprise

Les lots conservent leurs vérifications détaillées : GM-05 (70 tests ciblés, quatre E2E),
RQ-A2 (89 tests ciblés et capture), RQ-A1 (96 tests, import du pilote et des trois archives,
coups/soins/persistance, trois Hub), compilation/types, lint et relecture des captures.
Indicateurs de synthèse et liens contrôlés après la validation : RuneQuest **10 verts,
0 orange, 4 rouges**. Les améliorations RQ-A3 à A6 restent à choisir et développer.

Le hook post-commit a **synchronisé les trois guides 53/54/62 dans NotebookLM** ; le second
passage confirme le carnet à jour. Le push demandé exécute les contrôles complets habituels
du dépôt (types, lint global, tests avec maxWorkers=4, build), sans les contourner. Leur
résultat dans la sortie du push et les références Git font foi pour l'état publié.

Première reprise : vérifier git status et git log avant toute intervention, puis choisir un
lot restant dans la synthèse. Les preuves et notes précédentes gardent leur état initial
avec renvois datés ; ne pas interpréter un ancien « non commité » comme l'état courant.
