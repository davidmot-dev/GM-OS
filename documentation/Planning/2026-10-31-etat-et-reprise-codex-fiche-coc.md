# État et reprise — Codex, fiche COC2 — 31/10/2026

## Produit

À la demande de David via **GM-OS Studio**, fiche de Chroniques Oubliées Contemporain 2 créée
depuis les **deux pages** du PDF fourni. Modèle `coc2-fr`,
`docs/fiches/COC/coc2-fiche-personnage-interactive.html` ; **189 zones / 151 clés**, trente cases
de capacités et deux pistes de vingt hotspots. [Bilan](2026-10-31-fiche-coc-studio.md).

Validateur : zéro erreur, deux avertissements d’intégration. **40 tests passent** et recette
navigateur hors ligne aboutie : HTML autonome, moteur isolé, échanges JSON, sauvegarde,
impression CSS et mobile. Captures examinées, aucune requête réseau ou erreur JS.

Registre § 191, synthèse et manuel complétés. Fichiers non commités ; pas de modification du
PDF, du thème, de l’export de pilote, du moteur permanent, de `src/` ou d’`electron/`.

## Reprendre

Ouvrir le HTML ou l’importer comme modèle dans un moteur de fiches isolé pour le juger.
L’intégrateur doit ensuite ajouter le gabarit à `builtinTemplates`, monter `BUILTIN_VERSION`,
créer la correspondance avec le pilote `coc`, puis faire les essais GM-OS/Hub. Ne pas confondre
le succès de l’import en navigateur neuf avec une installation dans la bibliothèque de David.
Avant tout changement `src/` ou `electron/`, demander « GM-OS tourne-t-il ? ».

## Ne pas repayer

- **COC2 = Chroniques Oubliées Contemporain**, pas L’Appel de Cthulhu. La source de fiche est le
  PDF contenant « Fiche PJ », pas l’extrait du livre de règles (trois autres pages).
- Dimensions **473,386 × 609,449 points**, pas A4 ; rendu Poppler à 144 dpi, coordonnées relevées
  sur les PNG puis divisées par deux. La CSS d’impression convertit les points en pixels CSS
  sans changer le format. Fonds intégrés et source PDF identifiés par empreinte.
- Pas d’AcroForm ou de widget ; toutes les zones sont des overlays. Aucun portrait imprimé.
- Santé : 5/10/15/20 sont des cellules élargies avec intitulés d’état ; garder une clé numérique
  unique `tracks.health`. Deuxième page : `tracks.scale`, rôle non imposé. Reclique = zéro.
- Les trente cases « Rang n » appartiennent à trente capacités distinctes : booléens indépendants,
  pas une série numérique par Voie. Chaque capacité a aussi son nom et sa description.
- Le champ Équipement est réparti sur deux lignes pour préserver son cartouche ; les notes des
  armes commencent après « Notes/portée ». Les bonus numériques se placent après « 1D20 + ».
- Le reset de fond en mode impression doit **préserver les cases cochées** ; une règle print
  spécifique le garantit. Le mode Zones est retiré pour l’impression.
- Le moteur crée les deux `.sheet` dans le DOM : les sélecteurs de contrôle doivent viser
  `.sheet:visible`, sinon Playwright échoue en mode strict. Aucune correction applicative requise.
- Les rapports dans `output/fiches/coc/` portent les mêmes SHA-256 que le HTML revu. Refaire
  les contrôles et regarder les captures après une régénération.

Les modifications préexistantes des autres documents, exports et références restent hors de
ce travail ; conserver aussi les fichiers du thème COC livrés au tour précédent.
