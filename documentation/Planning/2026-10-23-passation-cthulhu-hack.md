# Passation Cthulhu Hack — 23 octobre 2026

Lire [AGENTS.md](../../AGENTS.md), la passation générale, puis
[l'audit et registre du chantier](2026-10-23-cthulhu-hack-ameliorations.md).
Branche `production`. David a confirmé GM-OS fermé avant les modifications, puis demandé le commit et le push après son essai du 23/10.

Les cinq améliorations de la synthèse commune sont **livrées et essayées par David le 23/10**.
Pilote validé : `Export Dirvers/corriges/CH_driver_gmos_2026-10-23.gmos-driver` (1.1.0), mêmes identifiants.
Pas de thème ni de fiche HTML à remplacer. Les quatre PA se règlent dans le nouveau suivi.

Ancres : `dice/systemes/cthulhuHack.ts`, `SuiviCthulhuHack.tsx`, `entitySlice.ts`,
`suitesDuJetDeFiche.ts`, `jetDepuisLaFiche.ts`, `ficheActions.ts`. Suivi structuré réservé
`_gmos_cthulhu_hack`, conservé par les sauvegardes et les anciennes fiches HTML.
Le mode Pulp est initialement désactivé ; ne jamais appliquer son activité à zéro aux autres jeux.

La recette de l'archive et le contrôle de Forge sont dans `outils/cthulhu-hack/`.
Les scénarios du manuel sont dans `e2e/capturesDesJeux.spec.ts`, branche Cthulhu Hack :
profil jetable, capture dirigée vers scratch, puis relecture avant copie dans le manuel.
Les résultats finaux et les limites sont dans l'audit lié.

Changements étrangers vus au départ : guide 62, `docs/Reference/`, index Barbarian,
références Crimes, fichiers `output/` et `tmp/`. Ne pas les attribuer à ce chantier.
