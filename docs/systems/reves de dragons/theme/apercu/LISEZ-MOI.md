# Aperçu — Rêve de Dragon

`planche-theme.png` contrôle les couleurs, la matière, les ornements et les douze icônes du paquet dans un navigateur isolé. Ce n’est ni une capture de GM-OS ni une fiche de personnage ; la disposition est un support de contrôle.

Le chargement de Google Fonts est bloqué dans l’environnement de génération (`ERR_NETWORK_ACCESS_DENIED`) : cette planche utilise Georgia en repli pour les titres et le corps. Le thème importe Fondamento et Source Serif 4 ; leur rendu doit être jugé dans GM-OS avec les polices disponibles. Courier New sert aux chiffres.

Les ornements sont montrés à leur taille de pose : coin à 28 × 28 px, séparateur à 240 × 16 px, dragon en filigrane à 40 % du panneau et 15 % d’opacité. Les icônes sont montrées à 16, 24 et 48 px. Les détails d’ornement sont aussi agrandis.

Le rapport joint provient de `npm run theme:valider -- "reves de dragons"` : thème accepté, zéro erreur et zéro avertissement. Le texte sur le papier et sous la patine reste au-dessus des seuils du contrat.
