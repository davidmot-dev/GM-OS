# Degenesis — bannière et identité visuelle, 30/10/2026

## Livrables

- **Bannière finale** : `docs/systems/degenesis/Degenesis Band.jpg` dans le dépôt, JPEG opaque **2400 × 600 px**, **245 783 octets**, qualité JPEG 93. SHA-256 `95d9c81f98fa32711758571419276444833347cdd8dff837fb8d53a2314286b9`.
- **Identité à copier** : `output/identites/degenesis/identite-visuelle.md`, exactement deux lignes STYLE / AVOID, respectivement **50 / 14 mots**, validées par le script de GM-OS Studio. L’analyse des quatre références est dans `sources-et-intention.md` du même dossier.
- **Invite réellement utilisée** : `prompt-generation.md` dans ce dossier. Illustration originale créée par l’outil **image_gen natif**, sans API ni fournisseur configuré dans GM-OS.

Le panorama montre une station de béton abandonnée reprise par la forêt, avec des valeurs de charbon, de cendre et de rouille. Le décor est propre à cette bannière et ne figure pas dans l’identité générique, qui reste utilisable pour tout sujet.

## Dimensions réelles et accord de David

La demande au générateur visait une grande définition, de préférence 3840 × 1280. Sa sortie réelle est **2172 × 724 px**, mesurée après copie dans le dépôt (`source.png`). Le recadrage **x=0, y=0, largeur=2172, hauteur=543** place le haut des arches dans la bande centrale de l’en-tête ; il ne déforme pas l’image.

Une version native **2172 × 543**, sans agrandissement, est conservée dans `banniere-native.jpg`. Après examen des aperçus, David a explicitement répondu **« Oui, exporter à 2 400 × 600 »** à la question sur l’agrandissement de **10,5 %**, sans ajout de détails. Cette opération a produit le JPEG final : aucune augmentation de détail ou génération plus grande n’est revendiquée.

## Vérifications

Image complète et simulations `cover` centrées de **1188 × 54** et **700 × 54 px** examinées, pour les versions native et finale. Les arches et la charpente restent reconnaissables ; les côtés restent calmes et le titre / les commandes de démonstration lisibles. Aucun texte parasite, logo, cadre ou personnage au premier plan dans l’image elle-même. Les simulations appliquent un voile sombre de contrôle : elles ne garantissent pas les couleurs du thème réel et **ne sont pas des captures GM-OS**.

Dimensions, poids, source, recadrage, facteur d’agrandissement, accord et empreintes des captures sont dans `verification-finale.json`. L’illustration source et les versions natives restent conservées ; aucun fichier existant n’a été écrasé.

## Utiliser dans GM-OS

Éditeur du pilote → **Bannière de l’en-tête** → sélectionner `Degenesis Band.jpg`. Copier séparément les contenus STYLE et AVOID dans les champs **Style** et **À éviter** de l’identité visuelle du jeu. Rien n’a été écrit dans un pilote ou une campagne ; l’activation et l’essai dans l’application restent à faire.

La bannière et l’identité ne remplacent ni le thème CSS ni la fiche de personnage, déjà livrés séparément. Aucun code applicatif, aucune donnée personnelle, aucun service réseau ni installation dans cette production.

## Reproduire l’export technique

Depuis la racine : `node outils/degenesis/preparer-banniere.mjs` conserve les pixels natifs ; `--2400` exécute l’agrandissement **déjà autorisé pour cette illustration**. Le script refuse d’écraser un fichier existant. Une autre source ou une nouvelle bannière doit avoir sa propre vérification et un nom versionné si nécessaire.
