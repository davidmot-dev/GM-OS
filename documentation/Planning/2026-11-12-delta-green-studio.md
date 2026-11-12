# Delta Green — préparation GM-OS Studio — 12/11/2026

David : « je suis en train de créé un pilote Delta Green, crée le theme, la bannière,
l'ambiance visuelle, la fiche de personnage ». Les références sont celles de
`docs/Reference/Delta Green/`, déjà fournies pour l’index et le sommaire.

## Livraison

- `docs/systems/delta-green/theme/` : thème clair de dossier administratif, cadre vert sombre,
  papier grisé, typographie étroite, trois ornements, une matière et quinze icônes originales.
  `theme.css` ne contient que les jetons du contrat ; les polices importées sont des approximations.
- `docs/systems/delta-green/Delta Green Band.jpg` : **2400 × 600 px, 247 261 octets**.
  Illustration peinte : bâtiment d’archives isolé, bois sombres, brouillard et route mouillée.
- `docs/systems/delta-green/identite-visuelle.txt` : bloc anglais STYLE / AVOID,
  respectivement **46 et 13 mots**. Peinture réaliste à l’huile et à la gouache, matière sèche,
  verts sourds, gris bleutés et ochres assourdis. Aucun sujet dans l’identité générique.
- `docs/fiches/Delta Green/delta-green-fiche-agent-interactive.html` : **deux pages, 239 zones,
  233 clés distinctes**, manifeste `delta-green-agent-fr`, fonds JPEG intégrés depuis le PDF
  fourni. Première version : toutes les clés sont nouvelles, aucune clé antérieure retirée.

Les fichiers de l’index et du sommaire sont décrits dans
[`2026-11-12-delta-green-index-et-sommaire.md`](2026-11-12-delta-green-index-et-sommaire.md).

## Fiche : contenu et calculs

Identité, six caractéristiques avec leurs valeurs ×5 et traits distinctifs, cinq Attaches avec
cases d’endommagement, santé et volonté, seuil de rupture, description et psychologie,
compétences imprimées avec cases d’expérience, cinq spécialités, six compétences libres,
sept armes à huit colonnes, matériel, blessures, notes, famille, six entraînements spéciaux,
officier responsable et signature textuelle. Il n’y a pas de zone de portrait sur le PDF.

Les deux pistes Violence / Impuissance utilisent des hotspots numériques à clé commune
(valeurs 1 à 3). Les trois choix du genre utilisent une clé commune et des valeurs textuelles.
Les cases d’expérience et les Attaches restent des cases indépendantes.

- Calculs ×5 dans le manifeste : `round-divide`, diviseur `0.2`.
- Maximum de Volonté : `copy` depuis Pouvoir ; les points actuels restent indépendants.
- Dans le HTML autonome : PV maximum = (FOR + CON)/2 et SAN maximum = 99 − Inconcevable,
  comme imprimé. Aucun arrondi non indiqué par la fiche n’est ajouté.
- **Limite du manifeste v1** : les deux dernières formules composées ne sont pas exprimables
  avec les opérations à une seule source. Les champs restent numériques éditables après import
  dans le moteur ; leur automatisation dans GM-OS attend le raccordement au pilote.

Fonctions autonomes : navigation, zoom 20–400 %, Ajuster, raccourcis Ctrl et molette,
mode Zones, sauvegarde locale isolée par identifiant, import/export JSON avec contrôle du modèle,
réinitialisation confirmée, impression de toutes les pages, sans ressource réseau.

## Contrôles réalisés

- `npm.cmd run theme:valider -- delta-green` : **accepté, zéro erreur, zéro avertissement**.
  Contrastes du validateur : texte/fond **11,96**, texte/surface **13,51**,
  secondaire/fond **4,94**, accent/fond **6,59**, texte sur accent **8,37**.
  Sous la matière : texte/fond **11,09**, secondaire/fond **4,58** ; tous les minimums sont respectés.
- `npm.cmd run fiche:valider -- "Delta Green"` : **acceptée, zéro erreur**. Deux avertissements
  attendus : nouveau modèle absent de la bibliothèque intégrée, aucune correspondance de pilote.
- `node outils/delta-green/verifier-studio.mjs` : essai dans Edge headless avec profil jetable,
  sans serveur et avec réseau bloqué. Saisie et calculs, cases et jauges, rechargement avec
  conservation des valeurs, export/import JSON, réinitialisation, navigation et zoom clavier
  vérifiés. Aucune erreur JavaScript, aucune requête réseau.
- Captures des deux pages en mode Zones et de la première page remplie : géométrie comparée
  visuellement au PDF fourni, champs alignés sur les cadres et nombres imprimés.
- Bannière examinée entière et en recadrage `cover` centré à **1188 × 54** et **600 × 54** :
  architecture centrale reconnaissable, côtés sombres, absence de texte dans l’illustration.
  Ces aperçus sont des simulations d’en-tête, pas des captures de GM-OS.
- Rendus et rapports : `tmp/delta-green-studio/`. La recette de la fiche et son HTML source,
  la préparation des assets et le contrôle autonome sont dans `outils/delta-green/`.

## Génération de la bannière

Outil natif `image_gen`, sans installation ni fournisseur ajouté. Source native **2172 × 724 px**.
David a explicitement accepté l’agrandissement léger vers **2400 × 600** (environ 10,5 % en
largeur après recadrage centré). Rééchantillonnage Lanczos et JPEG qualité 92 ; aucun détail
supplémentaire n’est revendiqué.

Invite anglaise utilisée :

> Create a high-resolution raster panoramic banner. Native canvas 3840 x 1280 pixels, horizontal
> 3:1, to be centrally cropped to a 4:1 banner of 3840 x 960 without upscaling. Theme: contemporary
> clandestine investigation and cosmic dread in rural America. Scene: a deserted low industrial
> archive facility beside dark pine woods, a chain-link perimeter disappearing into mist,
> rain-blackened concrete and an unlit access road; one understated olive utility vehicle small
> in the distant middle ground. All recognizable forms and interest concentrated in a very thin
> horizontal ribbon precisely through the vertical center; top and bottom thirds are simple dark
> fog, shadow and painterly grain. Leftmost 20 percent and rightmost 30 percent must be especially
> dark, low detail and calm for overlaid interface labels. Lighting and palette: low-key subdued
> blue green, charcoal black and tarnished ochre, dim overcast dusk, diffuse reflected light, no
> luminous spotlights. Style: realistic oil and gouache illustration, visible rough dry-brush
> textures, imperfect scumbled paint, gritty printed-paper grain, natural proportions, subtle
> photographic grounding but visibly painted, sober unsettling atmosphere, no spectacle.
> Exclusions: absolutely no text, lettering, signage, numbers, logos, watermark, signature,
> border, interface elements, close-up faces, foreground people, glowing monsters, neon, glossy
> CGI. This is an atmospheric continuous environment for a 54-pixel-high app header; prioritize
> a clear central horizon and quiet edges.

## État et suite

Assets construits et vérifiés ; choix visuel et essai de David à faire. Pendant le travail, un export
`Export Dirvers/Delta_Green_driver_gmos_1794500392536.gmos-driver` est apparu ; lecture seule :
pilote `custom-1794500163201`, version 1.0.0, gabarit `tpl-1794500163202`. Les compétences portent
encore les noms génériques `comp1` à `comp12` : ne pas inventer leur correspondance avec les
compétences imprimées. Le raccordement de la fiche attend la stabilisation de ces champs.
Aucun pilote ni modèle intégré au moteur n’est modifié.
Aucun changement dans le code de l’application ni dans les données de David, aucune écriture Git.
