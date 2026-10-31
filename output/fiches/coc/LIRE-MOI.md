# Fiche COC2 — livraison GM-OS Studio du 31/10/2026

Fichier à ouvrir dans un navigateur ou à importer comme modèle HTML :
`docs/fiches/COC/coc2-fiche-personnage-interactive.html`.

**Chroniques Oubliées Contemporain, deuxième édition** — les deux pages du PDF fourni sont
conservées comme fonds intégrés, aux dimensions natives **473,386 × 609,449 points**. Aucune
recoloration selon le thème d’interface, aucune modification du PDF, aucune ressource distante.

Le modèle `coc2-fr` porte **189 zones, 151 clés de données** :

- première page : identité, sept caractéristiques et notes, description, trois avantages ou
  désavantages, deux lignes d’équipement, valeurs de combat, trois armes, une protection,
  séquelles et échelle de santé ;
- seconde page : six Voies, trente capacités avec chacune nom, description et case acquise,
  puis une échelle indépendante ;
- les deux échelles utilisent chacune vingt hotspots sous une clé numérique, valeur 0 à 20 ;
  recliquer la valeur courante revient à zéro. Les trente capacités sont des cases indépendantes.

Zoom 20–400 %, Ajuster, clavier et Ctrl+molette, navigation, Zones, sauvegarde locale,
export/import JSON, réinitialisation confirmée, aide et impression des deux pages. Aucun portrait
n’est ajouté, car le PDF n’en prévoit pas. Aucun calcul de règle n’est ajouté ; BDM et DM restent
des textes libres. Le rôle de l’« Échelle » de la seconde page reste générique, comme son libellé
imprimé. Une saisie très longue peut défiler et doit être relue à l’impression.

## Vérifications exécutées

- Validateur GM-OS : **acceptée, zéro erreur**. Les **deux avertissements** sont ceux d’un modèle
  nouveau : absent du moteur permanent et sans correspondance de pilote. Ils ne sont pas masqués.
- **40 tests** réussis sur le validateur, les fiches du dépôt et les ressources du constructeur.
- Contrôle autonome sous Edge hors ligne : saisie et sauvegarde des 151 clés, import/export,
  rechargement, jauges cumulatives et zéro, cases indépendantes, refus d’import sans perte,
  confirmations de remplacement/réinitialisation, navigation et zoom. Zéro erreur JS, zéro
  requête réseau. Vue mobile à 390 px sans débordement horizontal.
- Impression CSS vérifiée : les deux pages apparaissent, leurs dimensions et le saut de page
  sont conservés, les zones de contrôle sont retirées et les cases cochées restent visibles.
  Aucun essai sur imprimante physique ou PDF paginé n’est annoncé.
- Import du HTML dans une bibliothèque de navigateur neuve du moteur de fiches : deux pages,
  saisies des deux pistes et d’une capacité de Voie, puis export JSON v2 réimporté dans le HTML.
  Ce n’est ni une installation dans le profil de David ni un essai des tablettes GM-OS.
- Captures vierges, Zones, remplies, impression CSS, mobile et moteur relues ; fonds intégrés
  identiques aux rendus PNG du PDF. Les coordonnées et clés sont inspectables dans `champs.json`.

## Intégration restante

Le constructeur livre le HTML et ses sources. Conformément au § 7–8 du cahier des fiches,
l’intégrateur doit ajouter le gabarit à `builtinTemplates`, monter `BUILTIN_VERSION`, puis
écrire la correspondance de ses 151 clés avec le pilote COC. Ces étapes n’ont pas été effectuées.
Les valeurs saisies dans cette fiche ne sont donc pas encore annoncées comme reliées aux jets
ou à Combat-OS. Aucun `src/`, `electron/`, moteur permanent ou export du pilote modifié.

## Reproduire

```text
node outils/coc/construire-fiche.mjs
npm.cmd run fiche:valider -- COC
node outils/coc/verifier-fiche.mjs
npx.cmd vitest run src/modules/fiches/validationDeLaFiche.test.ts electron/fichesDuDepot.test.ts electron/constructeurDeFiches.test.ts --maxWorkers=4
```

Les scripts utilisent les dépendances déjà présentes et Poppler ; `GMOS_PDFTOPPM` peut préciser
son chemin. Une régénération exige de refaire les vérifications et la revue des images. Source
PDF et HTML sont identifiés par SHA-256 dans `construction.json`, résultats dans `verification.json`
et les rapports de validation. Aucun commit ou push demandé pour cette livraison.
