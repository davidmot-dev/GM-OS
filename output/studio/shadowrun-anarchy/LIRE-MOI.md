# Shadowrun : Anarchy 2.0 — les quatre ateliers Studio

Livraison du 31/10/2026 : thème d’interface, fiche HTML autonome, bannière et identité d’images.
Le ZIP est un lot de fichiers à leurs chemins du dépôt, **pas une archive Nexus ni un pilote**.

**Révision du 31/10 :** le fichier courant
`output/identites/shadowrun-anarchy/identite-visuelle.md` renforce les couleurs cyberpunk
(cyan/magenta/ultraviolet, 43/14 mots). Le ZIP initial conserve le bloc précédent (42/15 mots).
Utiliser le fichier courant pour cette identité révisée. La variante de bannière cyberpunk/action
est disponible séparément à sa taille native dans `output/bannieres/shadowrun-anarchy/cyberpunk-action/` ;
son agrandissement attend encore l’accord demandé.

**Révision du 31/10 :** le fichier courant
`output/identites/shadowrun-anarchy/identite-visuelle.md` renforce les couleurs cyberpunk
(cyan/magenta/ultraviolet, 43/14 mots). Le ZIP initial conserve le bloc précédent (42/15 mots).
Utiliser le fichier courant pour cette identité révisée. La variante de bannière cyberpunk/action
est disponible séparément à sa taille native dans `output/bannieres/shadowrun-anarchy/cyberpunk-action/` ;
son agrandissement attend encore l’accord demandé.

## Utiliser les livrables

1. **Thème** : déjà déposé dans `docs/systems/shadowrun-anarchy/theme/`. Activer le thème du jeu
   dans une campagne du corpus `shadowrun-anarchy`, puis les **personnalités** dans les Paramètres
   pour matières, ornements et icônes. Le thème conserve la mise en page propre à GM-OS.
2. **Fiche** : ouvrir `docs/fiches/Shadowrun Anarchy/shadowrun-anarchy2-fiche-personnage-interactive.html`
   directement dans un navigateur. Pour la voir dans le moteur de fiches, l’importer comme modèle
   HTML et créer un personnage sous ce modèle. **L’intégration permanente dans l’application et la
   correspondance avec le pilote restent à faire par l’intégrateur** ; les saisies n’alimentent
   donc pas encore les jets/santé du pilote. L’import temporaire dans un moteur neuf a été vérifié.
3. **Bannière** : éditeur du pilote → **Bannière de l’en-tête**, sélectionner
   `docs/systems/shadowrun-anarchy/Shadowrun Anarchy Band.jpg`.
4. **Identité visuelle** : éditeur du pilote → **Identité visuelle**, copier les textes après
   STYLE: et AVOID: de `output/identites/shadowrun-anarchy/identite-visuelle.md` dans
   **Style / À éviter**. Identité de jeu, sans sujet imposé ni complément de campagne.

## Contrôles effectués

- Thème accepté **0 erreur / 0 avertissement**, vingt SVG décodés ; planches hors ligne
  1440/390 px examinées, sans erreur JS ni débordement. Polices de repli sur les planches ;
  aucun téléchargement de polices revendiqué. Texte sur texture : 12,48 / 14,23 ; secondaire
  5,35 / 6,10 ; accent sur fond texturé 5,41 ; cadre 9,17 / 5,89.
- Fiche acceptée **0 erreur / 2 avertissements d’intégration attendus**, une page native
  **600,945 × 779,528 points**, **146 zones / 121 clés**, 39 hotspots sur 14 pistes, portrait.
  Saisie des 121 clés, portrait/retrait confirmé, export/import/rechargement, refus sans perte,
  reset confirmé, zoom 20–400 %, clavier/molette, mobile, stockage indisponible, impression CSS,
  import temporaire dans le moteur et retour JSON v2 : vérifiés. Six captures examinées ;
  zéro requête réseau et zéro erreur JS. Pas de PDF paginé ou imprimante physique éprouvé.
- **51 tests de contrat passent** ; ESLint ciblé sans erreur. Aucun test de partie GM-OS,
  de Hub ou de mécanique de pilote annoncé par ces ateliers graphiques.
- Bannière JPEG opaque **2400 × 600 px / 375 284 octets**. Source native 2172 × 724, recadrage
  2172 × 543, agrandissement de **10,5 % autorisé** par David (« Oui, exporter à 2 400 × 600 »),
  sans détail ajouté. Image finale et deux simulations d’en-tête de 54 px examinées hors GM-OS.
- Identité : **42 mots STYLE / 15 mots AVOID**, validateur du plugin et relecture sémantique.

## Limites à garder visibles

Le thème approche les fontes de titrage et les textures du livre ; détails dans son intention.
La fiche conserve intégralement son fond PDF et reste indépendante du thème ; champs de saisie
en Arial/Courier New sans dépendance réseau. Portrait recadré dans une ellipse intérieure.
Les blessures sont trois pistes distinctes (légères 3, graves 2, incapacitante 1), y compris les
cercles pâles imprimés ; aucune capacité optionnelle ni aggravation automatique imposée.
Indice, attribut, RD et seuils restent saisissables : le manifeste ne propose pas d’addition
à deux sources, donc la formule imprimée n’est pas automatisée. Aucun audit des règles du corpus.

Les données personnelles, pilotes et campagnes installés n’ont pas été modifiés. Le moteur
permanent `Character_Sheet_Manager.html`, `src/` et `electron/` n’ont pas été écrits par cet atelier.
Les autres changements présents dans le dépôt ont été conservés. Aucun commit demandé.

## Reproduire

Avec les références originales et les dépendances déjà présentes dans le dépôt :

```text
python outils/shadowrun-anarchy/preparer-sources-fiche.py
node outils/shadowrun-anarchy/construire-fiche.mjs
node outils/shadowrun-anarchy/verifier-fiche.mjs
node outils/shadowrun-anarchy/construire-theme.mjs
node scripts/theme-valider.mjs shadowrun-anarchy
node docs/systems/shadowrun-anarchy/theme/apercu/rendre-apercu.mjs
```

Le Python embarqué de l’environnement peut remplacer `python`. `GMOS_PDFTOPPM` permet de préciser
Poppler. Aucun paquet ou service à installer. Pour la bannière, conserver `source.png` dans
`output/bannieres/shadowrun-anarchy/` ; le script `preparer-banniere.mjs` refuse l’écrasement des
JPEG existants. La génération d’image native est distincte du recadrage/compression ; invite
exacte dans `prompt-generation.md`. Une régénération exige de nouvelles mesures et revues.
