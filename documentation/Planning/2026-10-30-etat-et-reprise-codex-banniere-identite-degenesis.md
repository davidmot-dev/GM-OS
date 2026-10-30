# Degenesis — bannière et identité, 30/10/2026, GM-OS Studio / Codex

## Ce que la session a produit

David : « fais la bannière et l’identité visuelle de Degenesis ».

- **Bannière finale** : [`docs/systems/degenesis/Degenesis Band.jpg`](../../docs/systems/degenesis/Degenesis%20Band.jpg), **2400 × 600 px**, **245 783 octets**, JPEG opaque. Panorama de station de béton ruinée et de forêt, sans texte, logotype ou figure au premier plan. Outil **image_gen natif**, invite exacte et image source conservées sous `output/bannieres/degenesis/`.
- **Source réelle 2172 × 724**, malgré la demande de grande définition. Recadrage 2172 × 543, puis agrandissement technique de **10,5 % expressément autorisé** par David : **« Oui, exporter à 2 400 × 600 »**. Aucun détail supplémentaire revendiqué ; version native conservée.
- **Identité** : [`output/identites/degenesis/identite-visuelle.md`](../../output/identites/degenesis/identite-visuelle.md), deux lignes STYLE / AVOID en anglais, **50 / 14 mots**. Groupes de mots sans sujet, artiste, marque ou nom d’œuvre. Références illustrées Katharsys **7, 11, 23 et 35** examinées : peinture rugueuse, encre irrégulière, grands noirs, éclats crayeux et couleurs de cendre / terre, touches de mousse et rouille.
- **Vérifié** : dimensions/poids et décodage du JPEG, ratio 4:1 et borne 500 000 octets ; image entière et simulations d’en-tête **1188 × 54 / 700 × 54** examinées en natif puis en final ; sujet central reconnaissable, texte de contrôle lisible et bords calmes. Identité validée par `valider-identite.mjs`, sens et absence de sujet vérifiés manuellement. Les simulations ne sont pas des captures de GM-OS.
- Rapports : `output/bannieres/degenesis/verification-{native,finale}.json`, empreintes et accord ; `output/identites/degenesis/validation.json`, analyse séparée ; guide `output/bannieres/degenesis/LIRE-MOI.md`. Recette technique : `outils/degenesis/preparer-banniere.mjs`.
- **À la livraison, avant demande de commit : 16 fichiers nouveaux non commités** : une bannière sous `docs/systems/degenesis/`, dix fichiers sous `output/bannieres/degenesis/`, trois sous `output/identites/degenesis/`, un script et cette note. David a ensuite demandé **« commit et pousse »** : commit de ces livrables, séparé du thème et de la fiche. Aucun pilote, campagne, thème, fiche, `src/` ou `electron/` modifié ; aucune donnée personnelle touchée. Aucun service GM-OS lancé ni paquet installé.

## Par quoi reprendre

1. Éditeur du pilote Degenesis → **Bannière de l’en-tête** → sélectionner le JPEG livré. L’activation et l’observation dans GM-OS restent à faire ; aucun pilote n’a été réécrit.
2. Coller les deux lignes de l’identité dans **Style** et **À éviter**. Le décor de la bannière ne doit pas être ajouté au bloc générique. Les quatre références peuvent servir de guide visuel si le générateur cible les accepte ; cela ne remplace pas le texte.
3. Reprendre depuis le source PNG et l’invite si David demande une retouche ; ne pas écraser le JPEG accepté sans demande. Le script technique refuse l’écrasement et distingue la source native de l’export agrandi.
4. Le registre est déjà modifié par l’autre agent : **pas d’écriture concurrente**. Fragment de reprise ci-dessous. Ce travail ne modifie aucun pilote, donc ne revendique aucune intégration des mécaniques Degenesis dans la synthèse des pilotes.

## Fragment pour l’écrivain du registre

> David : « fais la bannière et l’identité visuelle de Degenesis ».
>
> - Illustration originale et identité livrées : `docs/systems/degenesis/Degenesis Band.jpg`, JPEG 2400 × 600 / 245 783 octets ; bloc anglais STYLE / AVOID sous `output/identites/degenesis/`.
> - Source du générateur 2172 × 724, recadrée puis agrandie de 10,5 % avec accord explicite de David ; version native conservée. Image et deux simulations d’en-tête examinées, bloc 50 / 14 mots validé.
> - Reste : choix de la bannière et saisie de l’identité dans le pilote, observation dans GM-OS et jugement de David. Aucun pilote ou campagne modifié ; thème et fiche indépendants.
> - Reprise : `2026-10-30-etat-et-reprise-codex-banniere-identite-degenesis.md`.

## Ce qu’il ne faut pas repayer

- Une demande de 3840 pixels au générateur ne prouve pas sa résolution : mesurer le fichier réel. Ne pas appliquer au nouveau jeu l’accord d’agrandissement donné à une autre illustration ; ici David a fourni un accord propre à Degenesis.
- La station doit rester lisible dans le **ruban central de 54 px**. Le recadrage haut `y=0` maintient arches et charpente dans ce ruban ; un recadrage vertical centré sur toute la source descendrait le ruban vers les bases des piliers.
- Les caractères du titre dans les aperçus sont des surimpressions de contrôle ; ils ne sont pas gravés dans le JPEG. La bannière livrée reste sans texte.
- L’identité décrit le rendu, pas des sujets ou un catalogue de Cultes. Conserver le bloc exact à deux lignes ; son fichier séparé évite de copier les commentaires français dans les champs du générateur.
- Génération native puis copie du résultat dans le dépôt ; recadrage/compression séparés, sans clé API, fournisseur ou service GM-OS. Le chemin du cache d’images n’est pas une dépendance de la livraison.
