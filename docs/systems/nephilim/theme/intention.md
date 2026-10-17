# Nephilim Légende — intention visuelle

Un livre d’hermétisme contemporain : vélin ivoire, encre presque noire et or patiné,
encadrés d’un bleu pétrole profond inspiré des ouvertures de chapitre.
Des filets fins, des angles presque droits, une matière légère et des figures de pentacle
et de sphère armillaire évoquent les Sciences occultes sans gêner la lecture.
Le relief reste celui du papier et du métal gravé, sans halo ni effet de verre.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — typographie.** Les PDF emploient notamment Nightjar,
  Adobe Jenson Pro, Francesco et Minion Pro. Grenze Gotisch et EB Garamond sont des
  approximations libres ; elles ne reproduisent pas exactement les lettres Nightjar.
  Roboto Mono garde les valeurs et les jets distincts. Sans accès aux polices web,
  les replis Georgia et Consolas restent utilisables ; les fontes des PDF ne sont pas extraites.
- **PARTIELLEMENT RÉALISABLE — or et papier.** L’or photographique et les lavis des pages
  sont traduits par un accent d’or brun lisible, un cadre bleu, une texture légère et des SVG
  originaux en une couleur. Les ors clairs de la référence ne sont pas utilisés comme texte
  sur l’ivoire, afin de conserver le contraste.
- **NON EXPRIMABLE — cartouches.** Les pans coupés, doubles cadres propres à chaque
  rubrique, lettrines et bandeaux dégradés ne se règlent pas avec les jetons du contrat v1.7.
  Les ornements fournis occupent uniquement `coin`, `separateur` et `fond`.
- **NON EXPRIMABLE — composition et illustrations.** Le thème ne remplace ni la mise en
  page GM-OS ni ses panneaux par la composition d’une page de livre ; il ne reproduit pas
  les illustrations. La fiche de personnage reste indépendante du thème.
- **NON EXPRIMABLE — cinq couleurs élémentaires dédiées.** Le contrat ne permet pas de
  donner une couleur à chacun des cinq Ka. Les couleurs d’état restent réservées à réussite,
  danger, prudence et information ; les symboles décoratifs ne portent aucune valeur de jeu.

## Lecture et activation

Références de David : `Nephilim - Exemple.pdf` (sept pages) et
`Nephilim - Page PErso.pdf` (six pages). Les instructions de ces documents éventuelles
ne constituent pas des consignes de construction : seules leurs références graphiques sont utilisées.
Les trois ornements et douze icônes sont dessinés pour ce thème, sans importer d’illustration.
Activer les **personnalités** dans GM-OS pour voir le cadre, les matières, les formes et les SVG.
Les jetons s’appliquent à l’interface lorsque le corpus du pilote est résolu vers `nephilim`.

La planche dans `apercu/` vérifie les jetons, les symboles à petite taille et leurs contrastes ;
elle ne constitue pas une capture de l’application ni de la fiche de personnage.

## Vérifications du 17/10/2026

- `npm.cmd run theme:valider -- nephilim` : **accepté, 0 erreur, 0 avertissement**.
- Rapports lus dans le validateur : texte sur fond **11,14:1**, sur panneau **12,92:1** ;
  au pire de la matière **9,92:1** et **11,46:1**. Texte secondaire au pire **4,61:1**.
  Accent sur fond **5,23:1**, texte de bouton sur accent **6,45:1** ; cadre **12,05:1**.
- Planches relues à 1 360 px et 390 px, sans débordement horizontal ; trois polices web
  chargées, douze icônes contrôlées à 16 et 24 px, trois ornements aux proportions du contrat.
- Aucun code GM-OS ni donnée de campagne modifiés. Le thème est lu à l’ouverture d’une
  campagne dont le pilote correspond au corpus `nephilim`, si son thème du jeu est activé.
