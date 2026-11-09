# Argyropée — livraison GM-OS Studio

Préparé le 08/11/2026 à partir de `docs/Reference/Argyropée/`.
Les six livrables sont produits. Leur activation dans le pilote et la correspondance avec ses champs ne sont pas réalisées.

## Les fichiers

| Élément | Fichier dans le dépôt | Résultat |
| --- | --- | --- |
| Table des matières | `docs/systems/argyropee/index/livre-de-base-2-table-des-matieres-flat.md` | 101 entrées, format plat |
| Index | `docs/systems/argyropee/index/livre-de-base-2-index-flat.md` | 430 entrées, format plat |
| Thème | `docs/systems/argyropee/theme/` | CSS, grain papier, trois ornements et quinze icônes |
| Bannière | `docs/systems/argyropee/Argyropée Band.jpg` | 2400 × 600 px, 337 959 octets |
| Identité des images | `output/gmos-studio/argyropee/identite-visuelle.txt` | Deux lignes STYLE / AVOID |
| Fiche de personnage | `docs/fiches/Argyropée/argyropee-fiche-interactive.html` | Deux pages, 326 zones, 128 clés |

`Argyropee-GM-OS-Studio.zip` rassemble ces six éléments sous leur arborescence de dépôt,
le présent guide, les clés de la fiche, le prompt et les contrôles. `Argyropee-theme.zip`
contient le dossier `theme/` avec ses chemins relatifs. Les PDF originaux ne sont pas copiés.

## Direction graphique

Les quatre captures présentent un dessin à la plume noire : hachures, aplats francs, traits irréguliers et détails gravés, avec une expressivité théâtrale. Ce style intérieur, commun aux quatre exemples, sert à l’identité des images. Le thème le traduit en papier gris ivoire, encre sombre, cadre noir, filets et volutes ; ses polices système Georgia et Times New Roman sont des approximations, non une identification des polices du livre. La couverture bleue constitue une référence distincte.

Bloc à copier dans les champs Style et À éviter du pilote :

```text
STYLE: traditional black ink book illustration, expressive pen strokes, dense crosshatching, bold black masses, crisp white paper, hand-drawn irregular contours, fine engraved details, restrained monochrome palette, directional shadows, lively slightly theatrical drawing, early modern European print sensibility
AVOID: photorealism, 3D rendering, smooth digital painting, neon colors, manga, readable text, glossy surfaces
```

## Utilisation

1. **Sommaire et index** : ouvrir les deux Markdown dans `docs/systems/argyropee/index/`.
   Les pages et listes de pages imprimées sont conservées. Les sous-entrées du sommaire
   sans page restent sans page. Dans l’index, **Désarmer**, **Désherbant** et **Poudre de mercenaire**
   n’ont pas de numéro imprimé : aucun n’a été inventé. Les astérisques renvoient à
   « Univers & Secrets », comme dans le document. Une plage imprimée est transcrite par un tiret.
2. **Thème** : conserver tout le dossier `theme/`, ses JSON et ses SVG ensemble.
   Choisir ce thème dans l’éditeur du pilote ; activer les personnalités pour voir formes,
   matières, ornements et icônes. Le thème n’est pas sélectionné à votre place.
3. **Bannière** : éditeur du pilote → **Bannière de l’en-tête** → choisir
   `docs/systems/argyropee/Argyropée Band.jpg`.
4. **Identité** : copier les deux valeurs ci-dessus dans les champs du pilote.
   Les quatre captures peuvent également servir de références de style pour un générateur compatible.
5. **Fiche** : ouvrir le HTML directement, ou importer ce HTML comme modèle dans le moteur
   de fiches. Le modèle se nomme **Argyropée — fiche de personnage**, identifiant `argyropee-fr`.
   L’import a été éprouvé dans un navigateur isolé ; le modèle n’est pas ajouté à la bibliothèque
   intégrée de GM-OS. La correspondance avec les champs du pilote sera une étape d’intégration.

## La fiche

Les deux pages du PDF sont intégrées au HTML, sans ressource distante. Identité,
deux tempéraments et domaines, cinq métiers, 33 pistes de compétences de sept cercles,
cinq armes, trois protections, quinze lignes de magie, description, relations, possessions,
équipement et charges sont éditables. Une compétence est librement nommable.
Cliquer un cercle pose le niveau et remplit les précédents ; recliquer le dernier sélectionné remet à zéro.
Le dessin d’œil « Châtiment vermeil » reste une illustration ; aucune interaction n’est inventée.
Les formules imprimées d’initiative, de santé et de charge restent saisies manuellement.

Navigation entre pages, zoom 20–400 %, Ajuster, Ctrl+molette, Ctrl++, Ctrl+−, Ctrl+0,
Zones, sauvegarde locale, import/export JSON, réinitialisation confirmée et impression
des deux pages sont présents. Pour conserver plusieurs personnages, exporter chaque JSON.
La sauvegarde locale concerne ce navigateur et ce modèle.

Fiche nouvelle : 128 clés créées, aucune clé retirée ; inventaire dans `cles-du-modele.json`.
Le validateur accepte la fiche, avec les deux avertissements attendus : modèle nouveau
absent de la bibliothèque intégrée, et correspondance de pilote absente.

## Contrôles

- **Thème : accepté, zéro erreur, zéro avertissement.** Texte/fond 12,96 ; texte/panneau 15,21 ;
  texte secondaire/fond 5,39 ; accent/fond 12,23 ; texte sur accent 15,41.
  Les contrôles au pire point du grain passent également.
- **Fiche : acceptée, zéro erreur.** Géométries sans chevauchement, saisie sur deux pages,
  pistes cumulatives et remise à zéro, sauvegarde/rechargement, aller-retour JSON,
  refus d’un import incompatible, confirmation de réinitialisation, zoom/raccourcis,
  émulation tactile et import dans le moteur avec retour JSON : contrôlés.
  Aucune requête réseau ni erreur JavaScript observée. Impression vérifiée sur deux pages A4.
- **Bannière :** génération native `image_gen`, puis recadrage centré, rééchantillonnage et compression.
  Le générateur a fourni 2172 × 724 px malgré la résolution demandée ; David a autorisé
  l’agrandissement de 10,5 % le 08/11/2026 (« Oui, livrer en 2400 × 600 »).
  Aucun détail nouveau n’est créé par cet agrandissement. Prompt exact dans `prompt-banniere.txt`.
  Le brut retenu est conservé à part dans le dossier de sortie.
- **Identité :** 36 mots pour STYLE, 13 pour AVOID, structure validée.
- **Extraction :** les deux pages de chaque document ont été relues visuellement,
  toutes les colonnes conservées, sans correction éditoriale des intitulés.

Les captures `controles/fiche-*.png`, `moteur-page-1.png`, `tablette-768.png`,
`impression-1.png`, `impression-2.png`, `theme.png` et `banniere-entetes.png` ont été examinées.
`theme.png` et `banniere-entetes.png` sont des **simulations de contrôle**, pas des captures de GM-OS.
L’émulation tablette ne remplace pas une vérification sur un appareil physique.

## Reproduction

Python existant, sans installation : `pypdfium2` et `Pillow`.
`outils/argyropee/preparer-studio.py` extrait les textes et construit le thème et la fiche.
Le script réutilise le runtime autonome de la fiche Torg, sans modifier ce dernier.
`outils/argyropee/finaliser-banniere.py` indique la source générée et le traitement accepté.

```text
node scripts/theme-valider.mjs argyropee
node scripts/fiche-valider.mjs "docs/fiches/Argyropée/argyropee-fiche-interactive.html"
node outils/argyropee/verifier-studio.mjs
node outils/argyropee/apercu-theme.mjs
```

Les rapports sont dans `controles/`. Les fichiers de références sont restés intacts.
Le fichier appelé `livre_de_base_2_regles_et_bestiaire.pdf` dans ce dossier est un extrait
de quatre pages : cette livraison n’est pas un audit du livre complet ni du pilote de jeu.
