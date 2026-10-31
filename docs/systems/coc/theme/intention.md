# Chroniques Oubliées Contemporain — intention

Papier ivoire légèrement grainé, encre presque noire et titres prune, dans un cadre violet profond ponctué d’orange chaud. Les panneaux restent plats et presque carrés ; des lignes brisées et des facettes discrètes reprennent la géométrie éditoriale des références. La lumière est mate, sans halo ni verre flouté, pour un contemporain cinématographique qui laisse toute sa place à la lecture.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — typographie.** Les PDF fournis déclarent NatomPro-TitleBold et HypatiaSansPro. Exo 2 et Source Sans 3 sont des approximations importées depuis Google Fonts, avec Arial en repli ; aucune police du PDF n’est extraite ou distribuée. Les chiffres utilisent Courier New. La planche hors ligne montre les replis système, pas une preuve du chargement des polices distantes.
- **PARTIELLEMENT RÉALISABLE — titres prune et filets orange.** Un seul accent colore le contenu et les masques d’ornements. Le prune est retenu ; l’orange apparaît comme accent du cadre, sans promettre des soulignements orange indépendants sous chaque titre.
- **PARTIELLEMENT RÉALISABLE — papier et facettes.** Deux SVG répétables sobres approchent la matière imprimée ; ils ne reproduisent ni les images ni les textures originales du livre.
- **NON EXPRIMABLE — composition éditoriale.** Colonnes, lettrines, frises courant sur les marges, numéros de page et cartouches de chapitre restent hors du contrat des thèmes. Aucun sélecteur CSS ne tente de déplacer les composants de GM-OS.
- **NON EXPRIMABLE — illustrations.** Les scènes médicales, fantastiques et d’action des références ne sont pas des fonds d’interface. Aucune illustration, couverture, bannière ou fiche de personnage n’est produite par cet atelier.

## Application et contrôles

Dossier du jeu : `coc`, confirmé par le pilote fourni `custom-1793122664880`, version 1.0.0. Activer le thème de jeu dans la campagne et les **personnalités** dans les Paramètres pour la forme, le cadre, les matières, les trois ornements et les quinze icônes.

Sources : les trois captures et `COC2_TOC.png` du dossier `docs/Reference/COC/`, complétées par les trois pages du PDF de références et les polices déclarées par les deux PDF. La fiche PDF est consultée pour la typographie uniquement, sans retouche. Les fichiers sources restent inchangés.

Validation : `npm.cmd run theme:valider -- coc`. Rapport détaillé et planches dans `apercu/` ; les planches sont des démonstrations hors ligne, **pas des captures de GM-OS**. L’activation dans une campagne et le jugement en situation restent à faire par David.
