# Reprise Codex — COC-A1 à A6 — 05/11/2026

David confirme : **« c'est bon c'est testé, tu peux commit et pousse »**. Les six lots COC
sont validés, cochés et verts ; synthèse **16 acquis verts, zéro orange, zéro rouge**.
Publication autorisée sur `production`, avec les hooks du dépôt.

## Produit et vérifications

Pilote **2.2.0** : dégâts depuis l’arme/RD unique, conséquences de santé persistantes,
rôles PNJ/Pulp/bandes, héroïsme hors test/Légende, choc et séquelle, cinq capacités officielles
avec contexte explicite. Manuel53/54, corpus19/19 relu, captures, synthèse et registre §214/215
actualisés. Sources, limites et reçus dans les suivis [A1/A2/A3](2026-11-04-coc-a1-a3.md) et
[A4/A5/A6](2026-11-04-coc-a4-a6.md).

Vérifications avant commit : **9 871 tests réussis, 4 ignorés** ; types, lint sans erreur,
construction, deux parcours Electron finaux (dont Formulaire → Hub → vrai journal), neuf
images2.2 relues et 36 tests de cohérence du manuel. La validation de David est globale ;
aucun résultat humain individuel ajouté au cahier.

## Reprendre

Aucun essai de David restant pour COC-A1 à A6. Les autres capacités officielles et les
poursuites peuvent faire l’objet d’un futur chantier ; symptômes/thérapie des séquelles,
économie d’actions et arbitrages spéciaux restent à la table. Demander si GM-OS tourne
avant toute nouvelle modification source après cet essai.

Les pilotes à réimporter restent dans `Export Dirvers/corriges/coc/` ; les quatre archives
2.1/2.2 de ce dossier ne sont pas destinées au commit. Copies reproductibles dans
`output/coc-a1-a3/pilote/` et `output/coc-a4-a6/pilote/`. Inventaire combiné dans
`output/coc-a4-a6/fichiers-de-livraison.json`.

## Ne pas repayer

Lire les deux notes de reprise du04/11 : livre complet sur le NAS (le PDF local n’a que
trois pages), formules et contradictions documentées, import avant séance active,
sessionEntityIds pour proposer le PJ au Hub, sélecteurs personnalisés, source/page du jet
à conserver au journal. Table77 retenue pour le choc ; conversion Enragé3d6 et durée finale
d’un choc restent explicites et ajustables par le MJ.

Changements étrangers exclus : export RuneQuest, guides10/12, vieux exports et clips,
docs/Reference/, traces et tmp/. Aucun profil personnel utilisé, aucun paquet installé.
Commit du jour : `feat(coc): finaliser COC-A1 a COC-A6`, contenant cette note. Le push sur
`origin/production` exécute la validation complète du hook ; son résultat est rapporté à David.
