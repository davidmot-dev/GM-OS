# Livrables GM-OS Studio — 23 octobre 2026

David demande de committer les livrables restant sous la responsabilité de Codex.
Les améliorations Cthulhu Hack sont déjà committées et poussées (`88216b0a`, `a1355308`).
Ce lot conserve les deux fichiers ci-dessous ; il prépare leur intégration, sans reprendre
les modifications Nephilim de l'autre agent présentes dans le dépôt.

## Barbarian of Lemuria — sommaire

[Sommaire Markdown plat](../../output/sommaires/TOC_Barbarian_of_Lemuria-vf_table_des_matieres_flat.md),
extrait du PDF `TOC_Barbarian of Lemuria-vf.pdf` fourni par David : 71 entrées,
intitulés et pages conservés, sans hiérarchie ajoutée ni traduction.

## Nephilim Légende — retouche de la fiche existante

[HTML autonome livré](../../output/nephilim-retouche-2026-10-23/nephilim-legende-interactive.html),
à partir de `docs/fiches/Nephilim/nephilim-legende-interactive.html`.
Le fichier source est conservé à l'identique.

- Même gabarit `nephilim-legende-fr`, sept pages et mêmes images intégrées.
- Les 987 clés existantes (1 024 zones, hotspots compris) sont conservées :
  aucune suppression, aucun renommage, aucun changement de type, de page ou d'origine.
- Sur accord explicite de David, les 24 champs `alchemy.formulas.N.effect`
  gardent leur origine et leur hauteur ; seule leur largeur passe de 367 à 80 unités natives.
- Trente `select` facultatifs ajoutés : `falls.khaiba.form`, les 24
  `alchemy.formulas.N.element2` (N de 0 à 23), et les cinq
  `alchemy.constructs.<construct>.assembly`. Options exactes demandées et option vide.
- Aucun calcul ajouté ; scripts fonctionnels et calculs préexistants conservés.
- Toutes les coordonnées ajoutées sont listées dans l'aide du HTML, sous
  « Retouche : 30 nouveaux menus — clés et coordonnées ».

Vérifications effectuées : comparaison structurelle complète avant/après, limites des pages,
absence de chevauchement des nouveaux champs avec les champs conservés, relecture des pages
1, 6 et 7 remplies et en mode Zones. Recette dans un navigateur isolé : 30 menus testés,
966 valeurs saisissables d'un personnage fictif conservées, import/export et rechargement,
sept pages imprimables, aucun chargement réseau et aucune erreur JavaScript.

Le contrôle du HTML autonome ne produit aucune erreur. Le validateur d'intégration du dépôt
signale les **30 nouvelles clés non encore citées dans la correspondance Nephilim** (§ 7).
L'intégration doit donc compléter cette correspondance et actualiser le gabarit du moteur ;
ce lot est la livraison du constructeur, pas cette intégration.
