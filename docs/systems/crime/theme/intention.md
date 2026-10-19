# Crimes — intention du thème

Un dossier d'enquête de la Belle Époque : papier ivoire grisé, encre vert noir, doubles filets et volutes inspirées des encadrés du livre. Le cadre sombre et les accents verts viennent de l'illustration parisienne ; le rouge sang reste réservé au danger, avec des ombres mates et un grain discret. L'empreinte en filigrane et les icônes de dossier, de montre et de réverbère prolongent les détails de la fiche.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — typographie.** Bodoni Moda approche les pleins et déliés des titres, Source Serif 4 le texte imprimé et Courier Prime les annotations de dossier ; ces polices libres ne sont pas les polices originales. Les titres condensés usés et la calligraphie des bandeaux ne disposent pas de rôles séparés dans le contrat. Les imports nécessitent leur disponibilité en ligne ; Georgia et Courier New prennent le relais hors ligne.
- **PARTIELLEMENT RÉALISABLE — papier et encadrements.** Le grain est un motif SVG original, léger et répétable ; les ornements sont redessinés, adaptés à leurs emplacements et non des fragments copiés des pages. La déchirure des feuilles, les taches complexes, le ruban adhésif et les trombones ne sont pas reproduits littéralement.
- **NON EXPRIMABLE — composition des références.** La bande latérale déchirée, les cadres inclinés, la disposition en colonnes et une illustration de couverture occupant le fond ne se pilotent pas avec les jetons de thème. Le thème conserve la géométrie des modules de GM-OS.

## Références et choix

Création le 19 octobre 2026 avec l'atelier Thème de GM-OS Studio, à la demande de David : « fais moi le thème de Crime à partir des ces fichiers ».

- `Crime6.jpg` : papier clair, double filet, volutes aux coins.
- `Crime5.jpg` : noir d'imprimerie, titres verticaux, corps à empattements.
- `Crime2.jpg` : vert noir, brume verte et rouge sang.
- `Crime - PJ Sheet.pdf`, deux pages : papier de dossier, ombres, empreinte et annotations.

Le paquet fournit trois ornements, une matière SVG et quinze icônes. Il utilise uniquement les jetons du contrat v1.7 ; les ornements, matières et formes s'appliquent avec les personnalités de GM-OS.

L'aperçu dans `apercu/` est une planche des éléments du thème, pas une capture de GM-OS. La validation technique ne vaut pas revue du rendu dans l'application.

## Vérification du 19 octobre 2026

`npm.cmd run theme:valider -- crime` : **accepté, zéro erreur et zéro avertissement**. Le rapport complet est conservé dans `apercu/validation.txt`.

Contrastes mesurés par le validateur : texte/fond **11,97:1**, texte/panneau **13,59:1**, accent/fond **6,50:1**, texte sur bouton **7,71:1**. Au pire point des matières, texte/fond **10,07:1**, texte/panneau **11,40:1**, secondaire/fond **4,31:1** et accent/fond **5,47:1** ; toutes les paires respectent leurs minimums.

La palette et les quinze icônes sont contrôlées sur la planche, avec les icônes montrées à 32 et à 16 pixels. Les trois ornements ont été rendus et inspectés ; le coin est montré à 28 pixels et le séparateur à 240 × 16 pixels. L'application GM-OS n'a pas été lancée pour cette vérification.
