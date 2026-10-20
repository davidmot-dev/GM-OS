# Symbaroum — intention du thème

Un parchemin ivoire légèrement grenu, une encre presque noire et des titres rouge terre reprennent les pages du Livre de Base. Un cadre vert charbon, des doubles filets olive et des angles droits évoquent Davokar, les marges ornementées et les bandeaux de la fiche. Trois ornements originaux — angle à entrelacs, frise à losange, sceau de racines — et quinze icônes au trait donnent au poste du meneur une identité de chronique ancienne, sans halo ni verre lumineux.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — typographie.** Cinzel approche les capitales des intertitres ; Source Serif 4 approche le corps éditorial ; IBM Plex Mono garde les valeurs alignées. Ces polices libres ne sont pas identifiées comme celles des références. Le logo gothique n'est pas reproduit ; hors connexion, les replis Georgia et Courier New prennent le relais.
- **PARTIELLEMENT RÉALISABLE — cartouches.** Les doubles bordures et les ornements approchent les cadres à angles coupés. Le contrat ne permet pas de chanfreiner la géométrie des panneaux.
- **PARTIELLEMENT RÉALISABLE — matière.** Le grain SVG discret remplace les taches irrégulières du papier imprimé. Le cadre sombre évoque la couverture sans reprendre son illustration.
- **NON EXPRIMABLE — marges et composition.** Une frise continue sur toute la hauteur, les colonnes du livre et une typographie distincte pour chaque niveau de titre ne disposent pas de jetons dédiés. Les ornements restent aux trois emplacements prévus par GM-OS.

## Sources et utilisation

Références fournies : couverture `Symbaroum - Livre de Base_1.png`, pages `_12.png`, `_25.png`, `_32.png` et les deux pages de `Symbaroum - Fiche de Perso.pdf`. Le PDF sert de référence aux encadrements et aux bandes sombres ; le thème ne modifie pas les fiches de personnage.

Les formes, matières, états, ornements, icônes et couleurs du cadre s'appliquent avec les **personnalités** de GM-OS. Aucun changement du pilote ou des données de campagne n'est nécessaire dans ce paquet.

## Validation et aperçu

Contrôle du 20 octobre 2026 : `npm.cmd run theme:valider -- symbaroum` — **accepté, 0 erreur, 0 avertissement**. Les ratios ci-dessous sont ceux du validateur GM-OS ; la matière est mesurée à son pire point, avec une opacité de 0,09.

| Usage | Fond uni | Sous la matière |
| --- | --- | --- |
| Texte sur le fond | 11,26:1 | 9,24:1 |
| Texte sur un panneau | 12,47:1 | 10,21:1 |
| Texte secondaire sur le fond | 5,31:1 | 4,36:1 |
| Accent sur le fond | 5,07:1 | 4,16:1 |
| État le moins contrasté : alerte | 4,11:1 | 3,37:1 |

Le texte sur un bouton plein atteint 6,36:1. Le cadre sombre atteint 11,28:1 pour le texte et 8,10:1 pour l'accent. Tous les minimums du contrat sont respectés ; certaines paires restent sous le niveau recommandé, distinct du minimum obligatoire.

`apercu/planche-theme.png` montre les couleurs, la matière, les trois ornements et les quinze icônes à 16 et 24 px. C'est une démonstration graphique autonome, pas une capture de GM-OS ; elle affiche les polices de repli Georgia et Courier New, sans téléchargement de polices. L'apparence dans l'application et les polices importées restent à juger dans GM-OS.
