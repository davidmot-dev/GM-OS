# COC2 — bannière et identité d’images, reprise du 31/10/2026

Demande de David : « GM-OS Studio fais la bannière et l’identité visuelle de COC ».
Jeu confirmé : Chroniques Oubliées Contemporain, deuxième édition, corpus `coc` ;
aucun audit mécanique dans ces ateliers. Registre § 192 et synthèse du pilote actualisés.

## Livré et vérifié

- `docs/systems/coc/COC Band.jpg` : JPEG opaque, **2 400 × 600 px**, **264 716 octets**,
  qualité 93, SHA-256 `c52bd9b42293944055888c5622c4484f9f8a953b6c653cc923b598feb4682146`.
  Canal urbain original au crépuscule, pont métallique, violets et bleu pétrole, reflets ambre ;
  aucune inscription ou marque. Génération par l’outil d’images natif.
- Source `output/bannieres/coc/source.png` : **2 172 × 724 px**, recadrage x=0, y=90,
  largeur=2 172, hauteur=543. La demande de grande définition n’a pas été obtenue nativement.
  David a ensuite autorisé explicitement le 31/10 : **« Oui, exporter à 2 400 × 600 »**,
  après explication de l’agrandissement de **10,5 %**. Aucun détail supplémentaire revendiqué.
  Source originale du cache conservée, version native JPEG également conservée.
- JPEG final et simulations d’en-tête **1188 × 54 / 700 × 54 px** examinés : pont central
  reconnaissable, bords calmes et commandes lisibles sous le voile de démonstration.
  Ce sont des simulations hors GM-OS, pas des captures de l’application.
- `output/identites/coc/identite-visuelle.md` : exactement deux lignes en anglais,
  **STYLE 43 mots / AVOID 13 mots**. Validateur du plugin accepté, sens relu : médium,
  formes, palette et lumière, sans décor imposé, artiste, marque ou personnage.
  Références : les trois `Screenshot 2026-10-31 102732/102808/102843.png` fournis dans
  `docs/Reference/COC/`. Pas de copie de ces illustrations dans la bannière.

Invite exacte, source, aperçus et rapports avec empreintes : `output/bannieres/coc/`.
Intention et validation de l’identité : `output/identites/coc/`.
Export technique reproductible : `outils/coc/preparer-banniere.mjs` ; il refuse l’écrasement.
Les limites de définition et l’accord concernent cette source COC2 précisément.

## Reprendre

Dans l’éditeur du pilote, sélectionner **COC Band.jpg** sous **Bannière de l’en-tête**.
Dans **Identité visuelle**, copier les textes après les préfixes STYLE: et AVOID: dans
**Style / À éviter**. Le bloc est une identité de jeu, pas un complément de campagne.
David doit encore juger les visuels en situation dans GM-OS.

Aucun pilote, campagne, profil personnel, thème, fiche, `src/` ou `electron/` modifié par
ces deux ateliers. Aucun service lancé ou paquet installé ; aucun commit demandé.
Les autres changements du dépôt, dont les ateliers COC précédents, restent distincts.
