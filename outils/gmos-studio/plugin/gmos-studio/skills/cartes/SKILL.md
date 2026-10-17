---
name: cartes
description: "Atelier cartes de GM-OS Studio : extraire les dos et faces depuis
  PDF, photos ou scans, conserver les cartes entières, orienter correctement,
  demander les départs par paquet puis exporter en vrais JPEG et ZIP
  reproductible. Ne pas utiliser imagegen."
---

# Atelier Extracteur de cartes — GM-OS Studio

Appliquer cette méthode uniquement à l’atelier choisi. Pour changer de tâche ou afficher le menu, lire [l’accueil](../accueil/SKILL.md). Les formats et interdits de cet atelier ne s’appliquent pas aux autres ateliers.

## Références incluses

- [recipe.md](<references/recipe.md>)

Les noms de fichiers cités sans chemin dans la méthode ci-dessous désignent ces références. Dans le dépôt GM-OS, les contrats actuels du dépôt restent prioritaires.

## Méthode de l’atelier

# Extraction reproductible de cartes

Utiliser Python et `scripts/cards.py` dans l'environnement d'exécution, sans créer de serveur. Annoncer ce skill à sa première utilisation. Répondre en français sauf demande contraire. L'analyse visuelle décide des régions, rôles et rotations; le script rejoue ces décisions de manière déterministe.

## Contrat de sortie

- Exporter les cartes en véritables JPEG haute qualité : `back.jpg` pour le dos et `N.jpg`, `N+1.jpg`, etc. pour les faces, sans zéros initiaux. Employer une qualité JPEG de 95 et un sous-échantillonnage 4:4:4 pour préserver le texte et les couleurs. Ne pas simplement renommer un PNG. Les PNG internes d’inspection restent temporaires.
- Si plusieurs dos distincts existent, créer un dossier par famille de cartes. Utiliser le numéro initial choisi pour chaque famille; ne pas le remettre automatiquement à 0. Annoncer les familles détectées. Ne jamais écraser plusieurs dos sous le même nom.
- Garder l'ordre des sources fournies, puis des pages, puis de lecture sur chaque planche (haut en bas, gauche à droite). Consigner l'ordre dans la recette. Ne pas trier selon le numéro imprimé.
- Conserver les faces répétées : plusieurs exemplaires peuvent être nécessaires au jeu. Regrouper uniquement les répétitions vérifiées des dos.
- Extraire la carte complète, texte et illustration compris. Préserver le graphisme, le cadre et les mentions imprimées, y compris celles du propriétaire présentes dans la carte. Ne pas redessiner, retoucher, traduire ni utiliser imagegen.
- Respecter le format portrait ou paysage du graphisme. Orienter le texte principal et le logo normalement, sans miroir. Ne pas imposer portrait à toutes les cartes.
- Livrer un ZIP des cartes avec `recipe.json`, `manifest.json` et les aperçus. Donner les comptes et toute limite réellement constatée.

## 1. Inspecter

1. Utiliser les pièces jointes déjà disponibles localement; sinon résoudre les fichiers avec les outils disponibles. Préserver les sources.
2. Lire le skill PDF pour les PDF et le skill Library pour sauvegarder les livrables, si ces skills sont disponibles.
3. Vérifier Python, PyMuPDF (`import fitz`) et Pillow. Au besoin installer `PyMuPDF` et `Pillow` avec le gestionnaire de paquets disponible. Signaler une dépendance bloquante sans prétendre avoir extrait les cartes.
4. Depuis le dossier du skill, exécuter :

   ```bash
   python scripts/cards.py inspect /chemin/source.pdf /chemin/autre-image.jpg --out /chemin/inspection-neuve
   ```

5. Lire `inventory.json`, regarder TOUTES les planches `contact-*.jpg`, puis ouvrir les cas ambigus en grand. Les aperçus PDF sont à 144 dpi. Les images ont déjà leur orientation EXIF corrigée. Les pages du script commencent à 1.
6. Identifier faces, dos et éléments sans carte. `identical_page_groups` fournit un indice, pas une classification. Un dos peut comporter du texte et une face peut n'en comporter aucun. Ne pas supposer que les pages paires sont des dos.

## 2. Demander la numérotation de chaque paquet

1. Après l’inspection, identifier et nommer chaque type ou série réellement présent (par exemple Action, Destin, Cosm Aysle, Cosm Empire du Nil). Une série ayant son propre dos constitue un paquet distinct.
2. Pour chaque nouvelle extraction, demander à l’utilisateur à partir de quel numéro commencer CHAQUE paquet. Regrouper les demandes dans une seule question avec une ligne par paquet. Exemple : « À quel numéro commencer pour Action, Destin et Cosm Aysle ? » Ne pas poser ces questions avant de savoir quels paquets sont présents.
3. Si l’utilisateur a déjà indiqué les numéros pour le document en cours, les reprendre sans les redemander. Un numéro explicitement donné pour toutes les séries s’applique à toutes. S’il manque des réponses, demander uniquement les séries manquantes et attendre ces réponses avant l’export final. Poser la question dans une réponse à l’utilisateur et suspendre l’export dépendant; ce sont des paramètres de la tâche, pas une demande d’autorisation.
4. Ne pas inventer 0, 10 ou un autre départ. Ne pas déduire le départ d’un numéro imprimé, d’un autre document ou d’une extraction antérieure. Les anciens prompts du plugin mentionnant « 0.png » ne constituent pas un choix de numérotation pour le fichier actuel et ne changent pas le format JPEG.
5. Exiger des entiers positifs ou nuls. Une réponse à zéro est valable. Consigner les valeurs dans `start_indices`, une clé par paquet, et mettre `numbering_confirmed: true` uniquement lorsque toutes les valeurs proviennent d’une réponse applicable de l’utilisateur. La recette et le manifeste conserveront ces choix.
6. Pendant l’attente, poursuivre l’analyse des régions et orientations qui ne dépend pas de ces nombres. Ne pas publier de cartes numérotées provisoirement.

## 3. Définir découpe et orientation

1. Repérer CHAQUE carte, y compris plusieurs sur une page. Délimiter séparément les cartes d'une planche; exclure espaces et repères d'impression extérieurs. Ne pas simplement extraire les objets image du PDF : une carte peut être composée de texte, vecteurs et plusieurs images.
2. Lire [le format de recette](references/recipe.md). Employer `bbox` pour une carte droite ou `quad` pour une photo en perspective. Conserver la page entière si elle est déjà au format fini. Ne pas rogner une bordure noire faisant partie du graphisme.
3. Vérifier le sens de lecture de chaque carte. Le texte principal prime sur un petit copyright ou un texte volontairement inversé. Choisir `rotate_cw` parmi 0, 90, 180 et 270. Pour les autres inclinaisons, utiliser `quad`. La seule largeur/hauteur ne prouve pas l'orientation.
4. Identifier chaque famille de dos visuellement et y associer les faces. Ouvrir chaque dos de référence en grand et comparer toutes ses répétitions. Utiliser `back` pour le premier, `duplicate-back` pour les répétitions vérifiées. Deux dos différents impliquent des familles distinctes, sauf demande précise contraire.
5. Si un dos manque, ne pas l'inventer. Préparer les extractions certaines puis demander uniquement l'élément manquant avant de déclarer le paquet complet. Si une association dos/faces reste ambiguë, montrer les régions concernées et poser une question ciblée; poursuivre les autres paquets certains.

## 4. Écrire et rejouer la recette

1. Créer une recette de version 2 avec les SHA-256 de l'inventaire, 300 dpi pour les PDF et une entrée par carte/région dans l'ordre retenu : source, page, paquet, rôle, bbox/quad, rotation et justification. Inclure les numéros de départ convenus dans `start_indices` et `numbering_confirmed: true`. Documenter les exclusions avec leur raison. Toutes les pages doivent avoir une décision.
2. Réserver `orientation_verified: true` aux cartes effectivement regardées. OCR et heuristiques peuvent aider mais ne remplacent pas l'inspection visuelle. Ne pas transférer une recette à un nouveau document sans nouvelle inspection; le script contrôle les empreintes.
3. Exécuter vers un dossier inexistant :

   ```bash
   python scripts/cards.py extract /chemin/recipe.json --source s0 /chemin/source.pdf --out /chemin/cartes-extraites
   ```

   Ajouter `--source IDENTIFIANT CHEMIN` pour chaque autre source. Le script crée le dossier et un ZIP voisin. Les chemins peuvent changer, les octets des sources doivent correspondre aux empreintes.
4. Ne pas agrandir artificiellement les images d'entrée. Le rendu des PDF à 300 dpi conserve textes et vecteurs; il ne restaure pas les détails raster perdus. Signaler une source floue.

## 5. Contrôler et livrer

1. Vérifier le manifeste : un dos JPEG par paquet, faces JPEG numérotées sans trou depuis le départ choisi pour ce paquet, comptes cohérents et aucune page oubliée. Vérifier les signatures JPEG et le format déclaré par Pillow, pas seulement les extensions. Une page couverte ne garantit pas que toutes ses cartes sont couvertes : comparer aux aperçus. Inspecter le ZIP final et exclure les fichiers source privés et temporaires.
2. Regarder TOUTES les planches `preview-*.jpg` finales. Ouvrir en grand au moins une face et chaque dos, ainsi que chaque carte recadrée, tournée, redressée ou ambiguë. Vérifier le texte à l'endroit, le cadre complet et l'absence de morceau voisin.
3. Corriger la recette puis réexporter dans un autre dossier si nécessaire. Ne pas modifier les JPEG finaux à la main : chaque correction doit être reproductible.
4. Si la reproductibilité est en cause, rejouer une extraction puis comparer les SHA-256 des JPEG. Les versions PyMuPDF/Pillow sont inscrites au manifeste; changer de moteur peut changer les pixels du rendu PDF.
5. Sauvegarder le ZIP avec le mécanisme de fichiers disponible, notamment Library lorsqu'il existe. Donner le lien et les comptes par famille. Ne pas imposer de confirmation pour une extraction ordinaire déjà demandée.

## Portée

Prendre en charge PDF et images lisibles par Pillow (PNG, JPEG, WebP, TIFF multiframe, etc.). Corriger EXIF, quarts de tour et perspective plane. Ne pas prétendre restaurer une zone cachée, une carte courbée ou une image illisible. Ne pas déclarer complet un paquet sans dos disponible ou dont l'association demeure indécidable.

