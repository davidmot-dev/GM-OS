# Recette v2 — JPEG et numérotation par paquet

`inspect` inventorie les pages, génère les aperçus et regroupe les pages identiques. Il ne détecte ni dos ni contours automatiquement. L'agent construit la recette après inspection visuelle.

## Structure

```json
{
  "schema_version": 2,
  "dpi": 300,
  "start_indices": {"paquet": 10},
  "numbering_confirmed": true,
  "sources": [
    {"id": "s0", "filename": "cartes.pdf", "sha256": "REMPLACER_PAR_LE_SHA256_REEL_DE_L_INVENTAIRE"}
  ],
  "cards": [
    {"source": "s0", "page": 1, "deck": "paquet", "role": "face", "bbox": [0, 0, 1, 1], "rotate_cw": 90, "orientation_verified": true, "evidence": "Texte principal lisible après rotation horaire de 90 degrés."},
    {"source": "s0", "page": 2, "deck": "paquet", "role": "back", "bbox": [0, 0, 1, 1], "rotate_cw": 0, "orientation_verified": true, "evidence": "Logo du dos à l'endroit, comparé aux autres dos du paquet."}
  ]
}
```

Remplacer toutes les valeurs par celles réellement constatées. `filename` est un nom de fichier simple. `--source ID CHEMIN` retrouve une source ailleurs sans changer son empreinte. Les sources ne sont pas copiées dans le ZIP.

## Format et choix des numéros

Exporter les cartes en JPEG RGB haute qualité, qualité 95 et sous-échantillonnage 4:4:4 (`subsampling=0`). Les sorties sont `back.jpg`, puis `N.jpg`, `N+1.jpg`, etc. Une extension .jpg doit correspondre à un véritable fichier JPEG. Les aperçus finaux sont également des JPEG; les PNG d’inspection sont internes et temporaires.

Avant l’export d’un document, demander le numéro initial de chaque type ou série de paquet détecté, sauf si l’utilisateur l’a déjà indiqué pour ce document. Ne pas reprendre automatiquement les valeurs d’un autre document. Regrouper les questions en une liste et attendre les valeurs manquantes. Un choix global explicitement applicable à toutes les séries suffit; une réponse à 0 est valable.

`start_indices` est un objet obligatoire contenant exactement les noms de paquets concernés, chacun associé à un entier positif ou nul. Exemple : `{"action": 40, "destin": 60, "cosm-aysle": 10}`. Chaque compteur est indépendant. Il n’existe pas de départ implicite. Ne pas employer le champ global `start_index` de recettes locales antérieures.

`numbering_confirmed` doit valoir `true` uniquement après une réponse utilisateur applicable à tous les paquets. Le script vérifie ce champ et la présence de tous les nombres, mais l’agent reste responsable de les avoir réellement demandés ou reçus. Ne pas cocher cette valeur pour contourner une réponse absente.

Les anciennes recettes de version 1 sont refusées. Pour les convertir, conserver les sources, régions, rôles, ordre et rotations, demander les départs manquants, passer à `schema_version: 2`, puis ajouter `start_indices` et `numbering_confirmed`. Un ancien départ automatique à 0 ne constitue pas une réponse de l’utilisateur. Revoir les sorties JPEG avant livraison.

## Géométrie

- `page` commence à 1 et désigne le rendu visible du PDF, sa rotation PDF déjà appliquée, ou la frame d'une image. L'orientation EXIF est corrigée avant mesure.
- Toutes les coordonnées sont normalisées dans [0,1] sur l'aperçu, AVANT la rotation `rotate_cw`.
- `bbox: [x0,y0,x1,y1]` = haut-gauche et bas-droite. Diviser les coordonnées mesurées par la largeur/hauteur de l'aperçu. `[0,0,1,1]` signifie pleine page.
- `quad: [[xHG,yHG],[xHD,yHD],[xBD,yBD],[xBG,yBG]]` = quatre coins du contour physique, en ordre horaire dans l'image source. Commencer par le coin haut-gauche, puis haut-droit, bas-droit et bas-gauche. Le script redresse la perspective puis applique `rotate_cw`. Ne pas combiner quad et bbox.
- Les dimensions de sortie d'un quad sont les longueurs maximales des arêtes opposées en pixels. Le ratio commercial n'est pas imposé. Une photo très oblique peut nécessiter le ratio réel fourni par l'utilisateur; ne pas affirmer une précision physique inconnue.
- `rotate_cw` = 0, 90, 180 ou 270 degrés horaires. Aucun miroir.

## Rôles et ordre

- `face` exporte le prochain entier depuis `start_indices[deck]`, puis incrémente ce compteur uniquement pour les faces de ce paquet. L’ordre de `cards` est déterminant; les dos ne consomment aucun numéro.
- `back` exporte l'unique `back.jpg` du paquet.
- `duplicate-back` consigne une répétition vérifiée du même dos, sans export. Donner le même deck et une justification de comparaison. Ne jamais l'utiliser pour supprimer une face répétée.
- `ignore` consigne une page/région sans carte, avec source, page et reason.
- `deck` est un nom simple, en minuscules, chiffres et tirets. Une famille indépendante a sa numérotation et son dos.
- `orientation_verified` vaut true uniquement après vérification réelle. `evidence` décrit l'observation appuyant rôle et orientation.

Plusieurs cartes sur une page nécessitent plusieurs entrées avec régions distinctes. Toutes les pages doivent avoir une décision; cela ne prouve pas qu'aucune carte d'une planche n'a été oubliée. Vérifier les aperçus. Associer faces et dos avant de déclarer le paquet complet.

## Validation

Le script contrôle les valeurs explicites de départ, l’attestation de réponse, la correspondance exacte des paquets, les empreintes, limites de pages, rôles, régions, quads convexes, rotations, noms de dossiers, doublons de régions, unicité du dos et présence de faces. Il refuse les sorties déjà existantes. L'attestation d'inspection ne prouve pas à elle seule la justesse de l'analyse visuelle.

Le manifeste contient origine, dimensions, SHA-256, région et rotation de chaque JPEG ainsi que les dos regroupés, exclusions et versions PyMuPDF/Pillow. Les champs `start_index` et `end_index` de chaque paquet dans le manifeste indiquent la plage réellement exportée. Le manifeste consigne aussi le format JPEG et les paramètres de compression. La recette permet de rejouer le rendu. Utiliser les mêmes versions pour une comparaison stricte des pixels. Les sources restent séparées du ZIP.

