# COC 2.1.0 — COC-A1/A2/A3

Livraison du 04/11/2026. David confirme le 05/11/2026 : « c'est bon c'est testé, tu peux commit et pousse ». COC-A1 à COC-A6 sont validés ; commit et push autorisés sur production.

Réimporter avec **Remplacer**, selon le mode souhaité :

- [d20](../../Export%20Dirvers/corriges/coc/COC-2.1.0-d20.gmos-driver)
- [option 3d6](../../Export%20Dirvers/corriges/coc/COC-2.1.0-option-3d6.gmos-driver)

Les mêmes archives sont conservées dans `pilote/`. Génération depuis les pilotes 2.0 de
`output/campagnes-tests/coc/` par `outils/coc/ameliorer_coc.mjs` ; identifiants et anciens
champs conservés, trois types d’arme ajoutés. Deux pilotes contrôlés sans constat.

Ce qui change : DM d’arme + FOR selon type + critique fixe, transfert à la cible et RD
unique ; DEF effective et conséquences de santé confirmées, persistantes ; rôles PNJ,
Pulp explicite et bandes sans jet de DM. **Les DM de l’arme doivent exclure la FOR**,
ajoutée au contact/lancer/mains nues : vérifier les anciennes saisies.

[Manuel avec gestes et captures](../../documentation/User%20Guides/54-Jeu-COC.md),
[règles vérifiées, limites et recette humaine](../../documentation/Planning/2026-11-04-coc-a1-a3.md).
COC-A4/A5/A6 restent hors de cette livraison.

`verification-electron.json` décrit le parcours réel en profil jetable : 15 DM − RD2 =13,
DEF14→11 sans écraser la base, CON10/action perdue et rechargement sans rejeu, figurant
sans critique sur20, Pulp4/24, bande3 perdant un seul membre par touche, import/remplacement
3d6 puis retour au d20 avec les fiches conservées. Les règles Pulp12 et seuils6/12/18/24,
les durées et les autres cas sont aussi couverts par les tests unitaires.

La suite complète passe : **9 847 tests**, quatre ignorés, 830 fichiers réussis et un
ignoré. Types et construction passent ; lint sans erreur, un avertissement préexistant
hors COC. Les traces Electron sont du diagnostic local et ne font pas partie des archives.
