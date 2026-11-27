# Traveller — GM-OS Studio

Livraison du 26 novembre 2026, construite à partir des quatre PDF de `docs/Reference/Traveller/`.

## Les quatre créations

- **Thème GM-OS** : `theme/`, avec ses jetons CSS, son intention, une matière SVG, trois ornements et quinze icônes. Palette ivoire et bleu nuit, accent ambre, angles droits et ombres mates. `Traveller-theme.html` est un aperçu HTML autonome et interactif ; ce n'est pas une capture de GM-OS. Ses polices de repli permettent de le consulter hors ligne.
- **Fiche HTML autonome** : `fiche/traveller-fiche-personnage-interactive.html`, deux pages paysage et **331 champs**, avec leurs clés stables dans `cles-du-modele.json`. Les pages 2 et 3 du PDF de fiche ont été tournées de 90° ; la couverture a été écartée. Fonds intégrés, 72 lignes de compétences dont cinq libres, spécialités, caractéristiques et MD, carrières, finances, armure, armes, augmentations, équipement, relations, blessures, passé et portrait.
- **Bannière finale** : `Traveller-Band.jpg`, **2 400 × 600 px**, 123 051 octets. Génération par l'outil natif d'images, puis recadrage centré et agrandissement de **10,5 % explicitement autorisé par David**. Le fichier `banniere-prompt.txt` contient l'invite anglaise utilisée ; le brut retenu est conservé. Le changement de taille n'ajoute pas de détails.
- **Identité visuelle** : `identite-visuelle.txt`, deux lignes prêtes à copier dans les champs Style et À éviter du pilote. Les illustrations fournies montrent une peinture numérique de science-fiction, des formes anguleuses fonctionnelles, des ombres bleu pétrole et des éclairages cuivre ou ambre.

## Utilisation

Les fichiers ont également été déposés dans le dépôt : thème sous `docs/systems/traveller/theme/`, fiche sous `docs/fiches/Traveller/`, bannière sous `docs/systems/traveller/Traveller Band.jpg`.

La fiche s'ouvre directement dans un navigateur, sans réseau. Elle propose sauvegarde locale, zoom de 20 à 400 %, Ajuster, navigation entre les deux pages, mode Zones, import/export JSON, réinitialisation avec confirmation, portrait et impression des deux pages. Le clic droit sur le portrait permet de le retirer ; la réinitialisation retire aussi le portrait. Si le stockage local est indisponible, un message invite à utiliser l'export JSON.

Le nom et l'espèce sont recopiés sur la deuxième page. Les MD, le profil universel, les dommages et les totaux restent manuels : aucun calcul de règles n'a été ajouté.

Dans l'éditeur du pilote, sélectionner `Traveller Band.jpg` dans **Bannière de l'en-tête**. Copier les deux lignes d'identité dans les champs correspondants. Aucun pilote ni campagne n'a été modifié pour activer ces choix.

**Intégration de la fiche à poursuivre dans GM-OS** : son manifeste `traveller-fr` est valide et importable comme modèle, mais le gabarit n'est pas ajouté aux modèles intégrés du moteur et aucune correspondance avec les champs du pilote n'est créée. La saisie autonome ne remonte donc pas encore dans GM-OS. Ces deux points sont les avertissements explicites du validateur, pas des erreurs du HTML livré.

## Contrôles réalisés

- Thème : **accepté, zéro erreur et zéro avertissement**, après ajout des quinze icônes. Texte/fond : **14,26** ; texte/surface : **16,06** ; texte sur le fond sous matière : **12,82**. Les autres rapports sont dans `controles/validation-theme.json`.
- Fiche : **acceptée, zéro erreur**, deux avertissements d'intégration détaillés ci-dessus ; deux pages, 331 champs et autant de clés uniques.
- **Treize contrôles fonctionnels** en navigateur Edge isolé, hors ligne : présence des champs et du manifeste, saisie, restauration après rechargement, copie entre pages, portrait, export, réinitialisation annulée puis confirmée, import, rejet d'un mauvais modèle, zoom, impression de deux pages A4 paysage, affichage tablette 768 px et absence de stockage local. Aucune erreur JavaScript ni requête réseau.
- Aperçu du thème : quinze icônes rendues, navigation et boutons de démonstration fonctionnels, aucune erreur JavaScript ni requête réseau.
- Identité : **42 mots STYLE, 13 mots AVOID**, structure et plafonds vérifiés ; contenu relu.
- Trois pages du PDF de fiche examinées avant construction ; deux pages HTML, contours, pages remplies et deux pages d'impression relues. Bannière examinée en entier et dans des en-têtes simulés de 1 188 × 54 et 600 × 54 px.
- Les captures sont des rendus de contrôle des fichiers autonomes. Aucun essai dans l'application Electron, aucun essai sur tablette physique ni activation du pilote n'est revendiqué.

## Limites visuelles

Rajdhani, Barlow et IBM Plex Mono sont des approximations, pas des polices identifiées du livre. Le thème GM-OS peut les charger depuis Google Fonts ; la fiche n'utilise aucune police distante. Les coins coupés et bandeaux verticaux propres aux composants du livre ne sont pas exprimables par le contrat de thème : leurs limites sont consignées dans `theme/intention.md`.

Les zones vierges des grands tableaux du PDF ne possèdent pas de lignes imprimées. Elles ont été réparties en lignes éditables : cinq carrières, quatre armures, six armes, quatre augmentations, seize équipements, quatre entrées par catégorie de relations et deux blessures.

## Identité à copier

```text
STYLE: painted science fiction illustration, visible digital brushwork, crisp angular silhouettes, functional industrial detail, deep navy and petrol shadows, warm amber and copper highlights, restrained cyan accents, soft atmospheric gradients, directional rim lighting, layered depth, tactile worn surfaces, realistic proportions, adventurous retrofuturist mood
AVOID: photorealism, anime, chibi, glossy plastic, neon overload, flat vector art, readable text, logos
```

Les recettes et vérifications de la fiche sont conservées sous `outils/traveller/`. Depuis la racine du dépôt, utiliser le Python disposant de pypdf, pdfplumber, pypdfium2 et Pillow pour lancer `outils/traveller/construire-fiche.py`. Les essais sont `node outils/traveller/verifier-fiche.mjs` et `node outils/traveller/verifier-theme.mjs`. Les validateurs du dépôt sont `npm.cmd run fiche:valider -- Traveller` et `npm.cmd run theme:valider -- traveller`. Aucun paquet n'a été installé.
