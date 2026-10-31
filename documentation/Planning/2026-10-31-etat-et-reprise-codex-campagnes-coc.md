# COC2 — reprise des campagnes de recette, 31/10/2026

## Produit

Trois `.gmos`, ZIP du lot, 24 nouveaux PJ pour les joueurs p-1/p-2/p-3 de l’export fourni,
enquête originale **Les Minutes de Verre**, laboratoires Santé/états et Héros/Blues/tests.
**70 cas humains vierges** ; **71 tests automatiques passent**, contrôle plugin et neuf rendus
hors ligne examinés ; build et types réussis. Pilote standard COC2 **2.0.0 au d20** de Claude
Code, gabarit 162 champs, fiche coc2-fr intégrée au moteur 22 ; variante 3d6 distinctement fournie.

Voir [bilan et reproduction](2026-10-31-campagne-recette-coc.md), rapports liés aux empreintes
dans `output/campagnes-tests/coc/`. Trois imports, remplacement isolé, trois Hub simulés,
trois jets, dépenses Héros et fiches HTML réussis, rechargement et sentinelles préservés.
Quatre captures applicatives examinées ; **GM-05 seul échec**, douze chemins gmSecrets reçus.
Sources neuves `outils/campagnes-de-recette/coc*`, `vitest-coc.config.mts`, `emballer-coc.mjs`,
et `e2e/campagneDeRecetteCoc.spec.ts`. Aucun fichier applicatif écrit ; aucun commit demandé.

## Premier geste

Importer 01-Les-Minutes-de-Verre.gmos et suivre le cahier. Les soixante-dix cas humains et les
Voies officielles sont encore à compléter/jouer par David. La partie complète n’est pas validée.
Pour un rejeu technique : parcours `e2e/campagneDeRecetteCoc.spec.ts`, profils/corpus/sauvegardes
temporaires du helper `lancerGmOs`, sans lire les données personnelles. Build à refaire si les
sources ont changé. Ne jamais utiliser les e2e de vitrine ou les profils réels.

GM-05 **confirmé** : le test garde son assertion stricte zéro fuite, marqueurs fictifs uniquement.
Le parcours fonctionnel aboutit, puis l’assertion finale échoue. Ne pas corriger le logiciel en
passant. Le ZIP inclut les rapports et captures revus, liés aux mêmes archives inchangées.

## Pièges à conserver

- Source standard : `Export Dirvers/corriges/coc/COC_driver_gmos_finir.gmos-driver` ; la variante
  3d6 partage son ID, elle ne coexiste pas automatiquement avec lui.
- L’ancien export complet RDD a été retiré du dépôt : utiliser le relevé minimal autorisé,
  pas de recherche dans le profil de David pour le retrouver.
- `preparerLeJet` reçoit le **descripteur**, les valeurs puis `{champs:{caracteristique:…}}`,
  pas le pilote entier. La préparation COC spécialisée est ensuite `preparerCoc`.
- Santé en **cases subies**, sans faux `hp/maxHp`. Initialisation par `casesAligneesSurLaFiche`.
- Fiche : santé `tracks.health`, évolution **tracks.scale** sur la seconde page ; sélectionner
  `#pageSelect` valeur `1` avant de cliquer ses hotspots. AGI est une entrée numérique.
- Profils sans Voies officielles préremplies ; V01 explicitement NON CANONIQUE pour le test
  de saisie. Ne pas annoncer une création novice ou une partie complète réglementaire.
- Les sources actuelles comprennent le travail non commité de Claude ; ne pas les remplacer.
  Leurs empreintes sont contrôlées à l’emballage pour repérer une modification concurrente.
- L’essai Electron dans le bac à sable a échoué EPERM sur le composant technique et GPU. La
  revue automatique a refusé l’escalade initiale ; David a ensuite explicitement autorisé
  « Oui, autoriser cette relance hors bac à sable », après « Oui, lancer les essais isolés ».
  Autorisation et historique conservés dans verification-lancement.json ; pas de nouvel accord
  à redemander pour le même protocole déjà autorisé.
