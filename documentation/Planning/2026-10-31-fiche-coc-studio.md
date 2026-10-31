# Fiche COC2 — atelier GM-OS Studio — 31/10/2026

David : « GM-OS Studio fais la fiches de personnage de COC, le fichiers de référence est ici
C:\Projet_David\GM-OS-v5\docs\Reference\COC ».

## Livré

[Fiche HTML autonome](../../docs/fiches/COC/coc2-fiche-personnage-interactive.html), modèle
**`coc2-fr`**, schéma 2. Source : `COC2_01_Livre_de_Regles_Fiche PJ.pdf`, deux pages,
SHA-256 `633ba29927a6bd152a45bb3d4530dbd857fb8267da7f7f9c87143a3e2fc86e9a`.
Fonds PNG intégrés, dimensions natives **473,386 × 609,449 points**, aucune recoloration.

**189 zones / 151 clés** : identité, sept caractéristiques et leurs notes, combat, description,
trois avantages/désavantages, équipement, trois armes et notes/portées, protection, séquelles ;
six Voies de cinq capacités (nom, texte, acquis), deux pistes numériques indépendantes de 0 à 20.
Trente cases indépendantes, quarante hotspots. Aucun portrait imprimé, donc aucun ajouté.

Les cellules larges de la santé restent les valeurs 5/10/15/20, avec leurs intitulés imprimés.
La seconde piste garde la clé générique `tracks.scale`, sans interprétation de règle non fournie.
Les cases de capacités ne constituent pas une jauge cumulative : elles sont propres à chaque
capacité. BDM et DM sont des textes libres ; aucun calcul, automatisme de santé, malus ou
prérequis de Voie n’est inventé. Les préfixes « 1D20 + » restent sur le fond du PDF.

Navigation, zoom 20–400 %, clavier/molette, Zones, sauvegarde locale, export/import JSON,
réinitialisation confirmée et impression des deux pages sont disponibles hors ligne.

Sources reproductibles : `outils/coc/construire-fiche.mjs`, `verifier-fiche.mjs`,
`fiche/champs.css`, `interface.css`, `runtime.js`. Preuves et rendus dans `output/fiches/coc/`.

## Vérifié

- Validateur : **zéro erreur, deux avertissements attendus** (modèle nouveau absent du moteur
  permanent et sans correspondance). **40 tests passent** : validateur, fiches et constructeur.
- HTML autonome sous Edge neuf hors ligne : 151 clés saisies/importées/exportées et restaurées,
  valeurs numériques négatives, deux pistes indépendantes et zéro, cases acquises indépendantes,
  imports refusés sans perte, reset confirmé, navigation, zoom et mobile à 390 px.
- Mode impression CSS : deux pages visibles, dimensions et sauts vérifiés ; Zones retirées et
  cases acquises visibles. Pas d’imprimante physique ni de génération de PDF paginé annoncée.
- Moteur de fiches en contexte neuf : import du HTML, navigation entre les deux pages, nom,
  arme, deux pistes et dernière capacité de Voie ; JSON v2 réimporté dans le HTML autonome.
  Aucune bibliothèque personnelle utilisée. Zéro requête réseau, zéro erreur JavaScript.
- Fonds intégrés identiques aux PNG source ; captures des deux pages en mode Zones et remplies,
  impression, mobile et moteur examinées. Les champs respectent les emplacements imprimés.

## Intégration et suite

**Ni `builtinTemplates`, ni `BUILTIN_VERSION`, ni correspondance du pilote modifiés** : le
constructeur reste dans le périmètre de son contrat (§ 7–8). Le gabarit doit encore être intégré
et ses 151 clés reliées au pilote COC ; l’import dans le moteur jetable ne prouve pas cette
installation dans GM-OS. Captures réelles du Hub et essai de David encore à faire après cela.

Nouvelle fiche : aucune clé précédente à préserver, aucune clé retirée. Le PDF et le thème COC
restent inchangés. Aucun `src/`, `electron/`, service local ou donnée personnelle utilisé pour
ce chantier ; aucun commit demandé.
