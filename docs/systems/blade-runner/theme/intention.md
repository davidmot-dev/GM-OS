# Intention visuelle — Blade Runner

Interface néo-noir aux panneaux d’encre bleutée et de papier froid très légèrement grainé, aux angles francs et aux lueurs corail de ville nocturne rétrofuturiste. Les icônes évoquent les dossiers d’enquête, les instruments de contrôle et les lieux de la ville ; des coins techniques et un séparateur discret prolongent leur dessin rectiligne. Les couleurs, les polices approchées et les arrondis existants sont conservés ; seul le bleu d’information est légèrement renforcé pour se distinguer du vert de réussite.

## Application dans GM-OS

Contrat v1.7 : forme, relief, halos, verre, couleurs d’état, matières et icônes sont lus quand les **personnalités** sont allumées dans les Paramètres. Aucun jeton de ce paquet n’est en attente V2. Les icônes héritent de la couleur du texte ou de l’accent de leur emplacement par `currentColor`.

Les dix noms du contrat présents sont `pj`, `pnj`, `combat`, `des`, `indice`, `lieu`, `scene`, `sante`, `oracle` et `journal`. Les autres icônes gardent le repli de GM-OS.

David a choisi le 10/10/2026 **« ok avec ta proposition »** : papier froid très léger, coins techniques et séparateur discret. Le grain SVG remplace les lignes horizontales des panneaux, à l’opacité existante de 0,14 ; le fond reste sans texture. Le bruit est ramené à `SourceGraphic` en `currentColor`, sans inventer de couleur, afin que le validateur puisse mesurer son contraste.

`ornements.json` utilise uniquement `coin` et `separateur`, dans les emplacements du contrat. GM-OS colore ces dessins avec son accent et retourne le coin supérieur gauche pour les autres angles. Aucun en-tête décoratif ni filigrane ajouté.

## Limites

- **PARTIELLEMENT RÉALISABLE** — Barlow Condensed, Source Serif 4 et IBM Plex Mono sont des approximations libres de l’identité éditoriale, pas les polices originales. Le grain noir sur les panneaux très sombres reste volontairement discret ; il évoque la matière sans reproduire une photographie de papier.
- **NON EXPRIMABLE** — La mise en page éditoriale et la géométrie exacte des composants appartiennent à GM-OS ; les règles `.rpg-*` de la démonstration SDK n’y ont aucun effet. Les ornements ne changent pas cette géométrie : ils occupent les emplacements fixes du contrat.
- **NON EXPRIMABLE** — L’humanité et la promotion n’ont pas de nom dans la liste gelée `NOMS_D_ICONES`. Aucun nom inventé ni assimilation à une autre notion : une éventuelle extension du contrat doit être décidée par David.
