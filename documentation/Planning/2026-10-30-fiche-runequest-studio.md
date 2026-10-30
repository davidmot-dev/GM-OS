# RuneQuest — livraison de la fiche GM-OS Studio, 30/10/2026

Demande de David : « fais la fiche de personnage de Runequest, la feuille de personnage PDF est ici […] Runequest Reference ».

## Livré

- [HTML autonome](../../docs/fiches/RuneQuest/runequest-fiche-personnage-interactive.html), modèle **`runequest-fr`**, première version : **4 pages, 860 zones, 735 clés**. Aucune clé de fiche précédente retirée ou renommée ; aucun modèle RuneQuest n'était intégré au moteur lors de la création.
- Fonds originaux du PDF `[Runequest][7Ed.][FR] - Feuille de personnage.pdf`, empreinte SHA-256 `950cd0948b8a7e24c397662f4ba4394982aaba46525197767902adeb261ddc39`. Les trois premières pages mesurent 622,346 × 802,346 points ; la quatrième, 612 × 792 points.
- Personnage, caractéristiques, armure et sept localisations, bouclier, seize affinités runiques et expérience, passions, armes, cultes et magie ; toutes les compétences et lignes libres ; famille, propriétés, compagnon ; quatre entrées d'ascendance et événements historiques.
- Jauges cumulatives numériques pour PV, PM, points de Rune et PV du compagnon ; M/F exclusifs ; expérience, Mort·e et Tué·e indépendants. Les libellés Mort / Inc sont des états séparés, sans changer automatiquement les jauges. Aucun calcul de règles n'est inventé ; les valeurs répétées du PDF restent indépendantes.
- Navigation, zoom 20–400 %, Ajuster, raccourcis et Ctrl+molette, Zones, sauvegarde locale, JSON import/export, reset confirmé, aide et impression des quatre pages. Aucun portrait ajouté : le PDF n'en prévoit pas.

## Vérifications

`npm.cmd run fiche:valider -- RuneQuest` : **ACCEPTÉE, zéro erreur, deux avertissements d'intégration attendus** : nouveau gabarit absent de `builtinTemplates`, aucune correspondance avec le pilote. [Rapport JSON](../../output/fiches/runequest/validation.json).

`node outils/runequest/verifier-fiche.mjs` : **réussi**, zéro erreur JavaScript, zéro requête réseau. Les 735 clés ont fait l'objet d'un aller-retour JSON et d'un rechargement ; vrais clics sur les jauges et choix ; imports invalides rejetés sans perte ; reset annulé puis confirmé ; mobile 390 px sans débordement ; impression vérifiée en mémoire, quatre pages sans page blanche, aux dimensions du document (arrondi de Chromium inférieur à un point).

Import réel du manifeste dans `Character_Sheet_Manager.html`, création d'un personnage et retour de son export JSON v2 vers le HTML autonome, **dans un profil Chrome neuf et jetable**. Aucune bibliothèque réelle ni donnée Electron consultée. [Bilan](../../output/fiches/runequest/verification.json), [capture dans le moteur](../../output/fiches/runequest/moteur-page-1.png).

Les quatre pages ont été relues visuellement vierges, remplies et zones visibles. [Page 1 remplie](../../output/fiches/runequest/page-1-remplie.png), [page 2](../../output/fiches/runequest/page-2-remplie.png), [page 3](../../output/fiches/runequest/page-3-remplie.png), [page 4](../../output/fiches/runequest/page-4-remplie.png).

## Reproduire et intégrer

Recette : `node outils/runequest/construire-fiche.mjs` ; elle lit le PDF fourni sans le modifier et utilise Poppler installé dans le runtime Codex. `GMOS_PDFTOPPM` permet de donner un autre exécutable Poppler. Les CSS et le runtime propres à cette fiche sont dans `outils/runequest/fiche/` ; la livraison HTML intègre tout et n'en dépend pas à l'ouverture.

**Piège de rendu :** pdfjs avec `@napi-rs/canvas` assombrit anormalement les pages 3 et 4 (transparences). Les fonds livrés sont ceux de **Poppler**, qui les rend correctement sur blanc. Ne pas substituer les premiers essais de rendu aux fonds définitifs.

L'atelier fiche s'arrête à la livraison du HTML et à sa validation. Le raccordement prévu au contrat reste à faire par l'intégrateur : installer le gabarit dans `builtinTemplates`, augmenter `BUILTIN_VERSION`, écrire `docs/systems/runequest/fiche/correspondance.json` depuis le pilote courant, puis valider les échanges avec GM-OS. Cette livraison n'annonce pas de synchronisation avec le pilote.

Aucun fichier déjà modifié par l'autre session n'a été retouché, aucun changement dans `src/` ou `electron/`, aucun paquet installé ni service lancé, aucun commit. Le thème créé séparément dans `docs/systems/runequest/theme/` n'intervient pas dans cette fiche.
