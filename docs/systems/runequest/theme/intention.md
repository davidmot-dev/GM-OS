# RuneQuest — intention du thème

Papier calcaire clair et légèrement grenu, encre charbon, cinabre des titres et bronze patiné : les pages de règles fournies fixent la palette, les illustrations apportent l'âge du bronze et la dimension mythique de Glorantha.
Le cadre vert-de-gris, les angles droits, les méandres et un sceau solaire donnent un relief gravé, mat et sans halo.
Les trois ornements sont présents, accompagnés de quinze icônes au trait évoquant tablettes, casque, lance, sanctuaire et offrandes.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — typographie.** Grenze et Source Serif 4 sont des approximations libres des titres gravés et du texte du livre, sans identification certaine des polices originales. Import autorisé Google Fonts ; repli Georgia hors ligne, Courier New puis Consolas pour les chiffres.
- **PARTIELLEMENT RÉALISABLE — papier et pierre.** Un grain vectoriel monochrome remplace les marbrures et irrégularités photographiques. Les ombres courtes suggèrent un support matériel.
- **PARTIELLEMENT RÉALISABLE — frises et runes.** Méandres de coin, séparateur géométrique et sceau solaire sont des dessins vectoriels originaux inspirés du vocabulaire des références ; ils ne reproduisent ni les frises illustrées ni un emblème officiel. Leur couleur suit l'accent cinabre, imposé par GM-OS ; le vert-de-gris passe par le cadre.
- **PARTIELLEMENT RÉALISABLE — palette des états.** Le danger mûre se distingue de l'accent cinabre ; jade, ocre et lapis identifient les autres états. Ce choix fonctionnel adapte la palette du livre.
- **NON EXPRIMABLE — composition éditoriale.** Le contrat ne place ni les colonnes du livre, ni ses lettrines, ni les cartouches rouges à décrochements, ni ses bordures sculptées sur toute la hauteur. Les emplacements du contrat reçoivent les ornements, sans modification de la disposition des modules.
- **NON EXPRIMABLE — iconographie des règles.** Le contrat ne fournit pas de noms pour les six éléments ou chaque Rune ; les quinze icônes livrées correspondent uniquement aux noms reconnus par GM-OS.

## Références et livraison

Créé le 30/10/2026 avec l'atelier thème de GM-OS Studio, depuis les six PNG du dossier `Runequest Reference` (suffixes 5, 6, 13, 15, 21, 26), en particulier les cadres et symboles de la page imprimée 14 et les encadrés de la page 25.
Ce dossier contient uniquement le thème d'interface ; l'activation et la recette dans une campagne restent à vérifier dans GM-OS.

## Vérifications du 30/10/2026

- `npm.cmd run theme:valider -- runequest` : **ACCEPTÉ, zéro erreur, zéro avertissement**. Rapport complet dans `apercu/validation.txt`.
- Texte sur fond : **11,07:1** ; sur panneau : **12,71:1** ; au pire point du fond texturé : **10,05:1**. Secondaire sur fond texturé : **4,55:1** ; accent sur fond texturé : **6,05:1** ; texte sur accent : **8,37:1**.
- Tous les états passent le minimum de 3:1, y compris sous texture. L'ocre d'alerte atteint **3,93:1** sous texture : accepté, inférieur au recommandé de 4,5:1.
- `apercu/theme-runequest.png` : planche graphique contrôlée visuellement, trois ornements et quinze icônes, celles-ci montrées à 24 et 16 px. Aperçu hors ligne en Georgia / Consolas, explicitement distinct d'une capture de GM-OS ; les polices web finales n'y ont pas été chargées.
- Aucune modification de `src/`, `electron/`, des références ou des données personnelles ; aucun démarrage de GM-OS. Fichiers non commités.

### Correction de la pile monospace — 30/10/2026

Courier New devient la première famille système des chiffres ; Consolas reste un repli local. Ce choix conserve une police à chasse fixe sans nouvel import web et satisfait le contrôle des familles déclarées/importées. L’aperçu précédent était rendu en Consolas et reste une référence de palette et d’ornements, pas une preuve de cette nouvelle pile typographique.
