# COC 2.2.0 — COC-A4/A5/A6

Réalisation du 04/11/2026, clôture technique le 05/11. David confirme le 05/11/2026 : « c'est bon c'est testé, tu peux commit et pousse ». COC-A1 à COC-A6 sont validés ; commit et push autorisés sur production.

Réimporter avec **Remplacer**, selon le mode souhaité :

- [d20](../../Export%20Dirvers/corriges/coc/COC-2.2.0-d20.gmos-driver)
- [option 3d6](../../Export%20Dirvers/corriges/coc/COC-2.2.0-option-3d6.gmos-driver)

Copies identiques dans `pilote/`. Le générateur `outils/coc/etendre_coc.mjs` part des deux
versions 2.1 conservées dans `output/coc-a1-a3/pilote/`. Identifiants et anciennes clés
conservés ; six références de Voies ajoutées au Formulaire. Contrôleur : zéro constat.

Ce qui change : héroïsme hors test et Légende, choc/séquelle persistants sans seconde jauge,
premier ensemble de cinq capacités officielles : Amateur, Furtif, Vigilant, Fin limier et
Spécialiste. Rang acquis, référence et choix de contexte sont nécessaires pour chaque test.
Le même choix de capacité fonctionne au Hub, avec source/page dans le journal du meneur.

[Manuel et captures](../../documentation/User%20Guides/54-Jeu-COC.md),
[règles, limites et recette de David](../../documentation/Planning/2026-11-04-coc-a4-a6.md).
Les autres capacités, les symptômes/thérapies et l’économie d’actions restent à la table.
La durée finale d’un choc est confirmée par le MJ ; le +3 d’Enragé en 3d6 reste ajustable,
le livre ne donnant pas de conversion chiffrée.

Suite complète : **9 871 tests réussis**, quatre ignorés. Types et construction passent ;
lint zéro erreur, un avertissement préexistant. Deux parcours Electron réussis en profil
jetable : scénario dédié et captures communes ; neuf images 2.2 relues et livrées au manuel.
Les rapports JSON donnent les contrôles et empreintes des archives. L’inventaire couvre
les changements livrés de COC-A1 à A6 ; les archives d’Export Dirvers sont remises à
David, leurs copies `output/` servent à la reproductibilité. Traces et `tmp/` restent locaux.
