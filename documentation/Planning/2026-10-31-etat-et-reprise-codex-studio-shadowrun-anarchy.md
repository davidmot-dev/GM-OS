# Shadowrun : Anarchy 2.0 — quatre ateliers Studio, 31/10/2026

David : « fais le thème, la fiche de personnage, la bannière et l’identité visuelle de
Shadowrun Anarchy […] Fais l’ensemble de actions ». Sources dans
`docs/Reference/Shadowrun Anarchy/`, dossier réel du corpus `docs/systems/shadowrun-anarchy/`.

## Produit et vérifié

- **Thème** `docs/systems/shadowrun-anarchy/theme/` : papier blanc usé, cadre jaune, titres
  bruns, deux matières, trois ornements originaux, quinze icônes. Contrat accepté **0/0**,
  vingt SVG décodés, planches hors ligne 1440/390 examinées sans débordement ou erreur JS.
  Texte sur matières 12,48/14,23 ; secondaire 5,35/6,10 ; accent 5,41 ; cadre 9,17/5,89.
  Rethink Sans identifiée dans le PDF ; Barlow Condensed approche Stolzl Display, replis système
  sur les aperçus. Le thème ne modifie pas les géométries de GM-OS.
- **Fiche** `docs/fiches/Shadowrun Anarchy/shadowrun-anarchy2-fiche-personnage-interactive.html`,
  modèle **shadowrun-anarchy2-fr**, schéma 2 : une page 600,945 × 779,528 points,
  **146 zones / 121 clés**, portrait, onze compétences et onze atouts, cinq mots-clés,
  comportements/répliques, connaissances/Essence, armes/sorts, équipement, armures et seuils.
  **39 hotspots / 14 pistes** : onze RR et trois degrés de blessure 3/2/1, pas une jauge de six PV.
  Fond du PDF intégré sans recoloration. Tous les contrôles autonomes et l’import du modèle dans
  un moteur de navigateur neuf sont passés, avec retour JSON v2. Six captures examinées,
  zéro requête réseau/erreur JS ; impression **CSS seulement**. Validateur accepté **0 erreur /
  2 avertissements d’intégration**. Reconstruction reproduite octet pour octet.
- **Bannière** `docs/systems/shadowrun-anarchy/Shadowrun Anarchy Band.jpg` : **2400 × 600 px,
  375 284 octets**, opaque, JPEG qualité 93 ; génération d’image native originale. Source
  2172 × 724, recadrage 2172 × 543, agrandissement 10,5 % autorisé le 31/10 :
  **« Oui, exporter à 2 400 × 600 »**, sans détail ajouté. JPEG final et aperçus 54 px examinés.
  La petite silhouette fantastique n’est pas lisible dans l’en-tête étroit ; la ville reste
  identifiable. Source et invite conservées dans `output/bannieres/shadowrun-anarchy/`.
- **Identité d’images** : `output/identites/shadowrun-anarchy/identite-visuelle.md`, peinture
  numérique semi-réaliste et matières peintes, ombres bleues et reflets cyan/ambre ;
  exactement deux lignes, **42 / 15 mots**, validateur et sens relus. Sans sujet, marque ou artiste.
- **51 tests de contrat** passent ; ESLint ciblé sans erreur. Sources neuves et recettes
  `outils/shadowrun-anarchy/`, contrôles `output/fiches/shadowrun-anarchy/` et `theme/apercu/`.
  Lot ZIP et guide dans `output/studio/shadowrun-anarchy/` ; § 196 et synthèse mis à jour.

## Premier geste pour reprendre

Activer thème/personnalités, choisir la bannière, copier Style / À éviter dans le pilote.
La fiche s’utilise seule ou comme modèle importé : l’intégrateur doit encore l’ajouter aux
`builtinTemplates`, monter la version du moteur et écrire sa correspondance (§ 7–8 du cahier).
Ce travail n’a pas été effectué sous couvert d’un atelier graphique ; aucun pilote exporté
Shadowrun Anarchy n’a été utilisé pour fabriquer un faux raccord. Jugement de David attendu.

## Pièges à ne pas repayer

- La fiche et le thème sont indépendants. Les couleurs et textures PDF ne se remplacent pas.
- Aucun modèle HTML Shadowrun Anarchy précédent trouvé : 121 nouvelles clés, aucune retirée.
- La colonne RD affiche une addition sur le PDF, mais les dérivations du manifeste ont une seule
  source ; la valeur est donc saisissable, sans calcul différent entre autonome et moteur.
- Les blessures ont trois degrés : les cercles gris optionnels restent cliquables ; aucun
  changement de capacité de blessure ni transfert automatique entre degrés n’est imposé.
- Le portrait occupe l’ellipse intérieure et laisse visible le bord irrégulier imprimé.
- L’agrandissement autorisé concerne cette bannière précise ; le script refuse de remplacer
  une image existante. Les aperçus sont des simulations hors GM-OS.

Aucun `src/`, `electron/`, moteur permanent, donnée personnelle, pilote ou campagne installé
modifié. Aucun paquet ou service ajouté ; fichiers non commités. Les changements antérieurs
de COC et le corpus Shadowrun Anarchy préexistant sont conservés.

## Suite du 31/10 — bannière cyberpunk et action

David : « je voudrais une bannière dans une ambiance plus cyberpunk et action ».
Nouvelle variante générée par l’outil natif, puis nettoyage ciblé des signes des enseignes :
poursuite moto/véhicule blindé, deux drones, pluie et néons cyan/magenta. Source, JPEG natif,
invites et contrôles dans `output/bannieres/shadowrun-anarchy/cyberpunk-action/` ; recette
`outils/shadowrun-anarchy/preparer-banniere-cyberpunk.mjs`. Aucun des quatre livrables initiaux
n’a été remplacé ; le ZIP Studio initial conserve sa version 1.

JPEG sélectionné `banniere-native-nettoyee.jpg` : **2172 × 543 px, 379 367 octets** ;
source éditée 2172 × 724, recadrage central x=0/y=90. Image et deux simulations d’en-tête
1188/700 × 54 examinées ; moto/arrière du véhicule identifiables, bords sombres ; haut de
l’action partiellement coupé. Aucun texte lisible constaté après nettoyage.

**Attente :** accord demandé pour agrandissement 10,5 % à 2400 × 600, propre à cette nouvelle
source. Ne pas réutiliser l’accord qui concernait la première bannière. Après réponse positive,
exporter avec `--2400 --accord-cyberpunk-action`, vérifier JPEG et deux aperçus, consigner l’accord
et livrer `docs/systems/shadowrun-anarchy/Shadowrun Anarchy Band-v2.jpg`. Sans cet accord, le
JPEG natif reste disponible mais n’atteint pas les dimensions minimales du contrat.

## Suite du 31/10 — identité cyberpunk plus colorée

David demande aussi une identité visuelle plus marquée par les couleurs cyberpunk.
`output/identites/shadowrun-anarchy/identite-visuelle.md` est révisé : cyan électrique,
magenta vif, ultraviolet et accents jaune acide, ombres indigo, contours néon et reflets
colorés superposés. Peinture semi-réaliste, touches visibles et grain conservés ; palettes
ternes, monochromes et pastel écartées. Aucun sujet, artiste, marque ou titre dans le bloc.

Validateur du plugin accepté : **43 mots STYLE / 14 mots AVOID**, exactement deux lignes ;
sens relu, empreinte et demande consignés dans `validation.json`. Aucun aperçu généré pour
cette révision de texte ; essai d’image et jugement de David restent à faire. Copier le bloc
courant dans l’éditeur du pilote : aucun pilote personnel n’a été modifié. Le ZIP Studio
initial garde son identité précédente (42/15 mots) ; il n’a pas été réemballé.
L’accord d’agrandissement de la variante de bannière reste en attente, indépendamment.
