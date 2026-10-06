# Tablettes des joueurs — maquettes retenues

**David, le 2026-10-05 : « je suis satisfait continue »**, après présentation de la
[galerie T3](../../tablettes/T3-propositions/index.html) et demande de choisir ou retoucher
l'accueil « Qui es-tu ? » et Direct. Les deux écrans et leurs déclinaisons sont retenus.
Le code de l'application attend T4 ; l'HTML sert de référence, pas de code à coller.

| Écran | Téléphone | iPad paysage | Ce qu'on garde |
| --- | --- | --- | --- |
| Accueil « Qui es-tu ? » | [HTML](accueil/telephone.html), [390 px](accueil/telephone-390.png), [360 px](accueil/telephone-360.png) | [HTML](accueil/paysage.html), [1180 px](accueil/paysage-1180.png) | Cartes compactes sur téléphone, trois cartes côte à côte en paysage ; sortie séparée avec confirmation ; personnages et pied accessibles. |
| Direct | [HTML](direct/telephone.html), [390 px](direct/telephone-390.png), [360 px](direct/telephone-360.png) | [HTML](direct/paysage.html), [1180 px](direct/paysage-1180.png) | Campagne et horloge séparées ; projection libre ; dix destinations nommées ; téléphone : deux rangées de trois onglets et une rangée de quatre actions. |

Les variantes portrait à 820 px sont également conservées dans les dossiers des deux écrans.
Provenance Stitch, corrections locales et mesures :
[relevé des propositions](../../tablettes/T3-propositions/README.md),
[identifiants](../../tablettes/T3-propositions/ecrans.json).

La validation porte sur les **propositions corrigées de la galerie**, pas sur les diagnostics
fictifs et les suggestions supplémentaires des exports bruts de Stitch. La grammaire retenue
de Direct remplace pour T4 la navigation sur une ligne choisie à apparence constante en T2.
Les jetons et polices de GM-OS s'appliqueront lors de l'intégration ; le thème Cyberpunk du
dessin reste une référence.

**David, le 06/10 : « ok c'est bon pour moi, est-ce que t3 est fini ? ».** Son accord est
consigné sur l’ensemble présenté J1/J2/M1/M2. Les neuf écrans joueurs sont maintenant
retenus ; **T3 est terminé**. La demande antérieure « commit J2 » archivait seulement
les propositions ; la validation est celle du 06/10.

Les copies complètes des propositions corrigées sont conservées à la racine de ce dossier,
avec les assets, les rendus et les contrôles. Les dossiers `accueil/` et `direct/` restent
les premières références choisies le 05/10.

| Écran | Téléphone | Paysage |
| --- | --- | --- |
| Inventaire | [HTML](inventaire-telephone.html) | [HTML](inventaire-paysage.html) |
| Cartes | [HTML](cartes-telephone.html) | [HTML](cartes-paysage.html) |
| Archives | [HTML](archives-telephone.html) | [HTML](archives-paysage.html) |
| PNJ | [HTML](pnj-telephone.html) | [HTML](pnj-paysage.html) |
| Lieux | [HTML](lieux-telephone.html) | [HTML](lieux-paysage.html) |
| Messages | [HTML](messages-telephone.html) | [HTML](messages-paysage.html) |
| Notifications | [HTML](notifications-telephone.html) | [HTML](notifications-paysage.html) |

Les rendus 360, 390, 820 et 1180 px sont dans `rendus/`. Les chemins de requêtes et d’exports
bruts de `ecrans.json` se rapportent au dossier de production `tablettes/T3-propositions/`.
Identité des copies : [manifeste SHA-256](../../tablettes/T3-references-retenues.json).
