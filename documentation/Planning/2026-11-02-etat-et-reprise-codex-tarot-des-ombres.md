# Reprise Codex — Tarot des Ombres — 02/11/2026

## Produit et vérifié

David : **« peux-tu extraire les carte du fichier ici présent, la première page
représente le dos des cartes »**, avec le plugin Extracteur de cartes 1.1.0.
Départ choisi explicitement : **1**. Installation de PyMuPDF autorisée dans un
environnement temporaire dédié, sans modifier GM-OS.

- [ZIP livré](../../output/cartes/les-lames-du-cardinal/tarot-des-ombres.zip) :
  **78 faces `1.jpg` à `78.jpg` et un `back.jpg`**, plus trois aperçus, recette,
  manifeste, contrôle qualité et script de reproduction. 39 149 826 octets,
  SHA-256 `2fb93b5be22924a6bd75786ff3506df98ed862746b67669721abdbab9ddc11b0`.
- Source : *Le Tarot des Ombres - PrintPlay - LES LAMES DU CARDINAL  -.pdf*,
  14 pages A4, six cartes par page. Première page : six dos identiques, regroupés
  après inspection ; pages 2 à 14 : 78 faces conservées dans l'ordre de lecture.
  PDF fourni sur le NAS, préservé et exclu du ZIP et du commit.
- JPEG RGB, qualité 95, 4:4:4, rendu PDF à 300 dpi, 709 × 1334 ou 1335 pixels.
  Cadres et textes conservés ; pas de retouche ni d'agrandissement artificiel.
- Toutes les planches source et finales regardées ; 78 faces revues en grand sur
  treize planches de six cartes, dos et échantillons individuels ouverts en grand.
  Chiffres inversés des mineures conservés conformément au dessin d'origine.
- Signatures, format, dimensions et SHA-256 contrôlés pour les 79 JPEG. Second
  export : **79 fichiers identiques à l'octet près**. ZIP rouvert, intégrité et
  contenu comparés aux fichiers livrés : **88 fichiers**, sans PDF ni environnement.
- Recette version 2 : chaque région, rôle, rotation, source et départ documentés.
  PyMuPDF **2.0**, Pillow **12.1.1**, versions consignées dans le manifeste.

David demande ensuite **« commit et pousse »**. Le travail antérieur du plugin
GM-OS Campagnes de test 0.2.0 est enregistré séparément dans **`32dc88bf`** :
12 tests Python repassés, paquet de 13 fichiers reconstruit, empreinte inchangée.
Le commit des cartes accompagne la présente note. Le push déclenche la validation
complète du dépôt ; son résultat est communiqué après l'envoi.

## Reprendre

Les cartes sont prêtes : décompresser le ZIP et utiliser les 79 JPEG du sous-dossier
`tarot-des-ombres/`. Aucun import GM-OS n'a été effectué pour cette extraction.
Pour régénérer, suivre le README livré et fournir exactement le PDF dont la recette
conserve l'empreinte. La reproduction exige une sortie inexistante.

## Pièges et coexistence

- Le déplacement atomique du dossier temporaire échoue ici sous Windows (`WinError 5`).
  Le script livré adapte uniquement la publication : copie, contrôle SHA de chaque
  fichier, puis retrait du dossier temporaire créé par ce script. Le rendu reste celui
  du plugin ; les empreintes des deux scripts figurent au contrôle qualité. Plugin
  installé inchangé. Le rejeu confirme les mêmes 79 JPEG.
- L'environnement Python, les rendus d'inspection, les montages de revue et le rejeu
  restent dans `tmp/cartes-tarot-ombres/`, hors commit. Aucun accès aux données
  personnelles de GM-OS, aucune modification de `src/` ou `electron/`.
- Les changements du catalogue d'équipement, du corpus Alien, du registre et de la
  note générale de l'autre agent sont préservés. La synthèse des pilotes est indexée
  partiellement pour le seul paragraphe du plugin ; sa ligne équipement reste hors
  du commit Codex. Le registre déjà modifié par l'autre agent n'est pas réécrit.
  Fragment pour son écrivain : **Tarot des Ombres livré le 02/11, 78 faces + dos,
  recette et ZIP contrôlés, rejeu identique ; aucun reste d'extraction**. Le fragment
  du plugin est dans la note Codex du 01/11.
