# COC2 — vérifications du 31/10/2026

État : **IMPORTÉ ET ÉPROUVÉ EN INSTANCE JETABLE, AVEC ÉCHEC DE CONFIDENTIALITÉ GM-05**.

- **71 tests Vitest passent**, zéro échec dans cette suite : Nexus réel, pilote 2.0.0, types des 162 champs dont cases booléennes et modèle d’évolution, liens de fiction, portées des outils, 24 nouveaux PJ, vraies cases de santé, RD et seuils par la porte réelle des dégâts, bonus Héros, Blues, variante 3d6, 151 clés HTML et exemples du moteur/panneau COC. Les tests du logiciel et ceux des archives sont distincts des 70 cas humains.
- Les trois archives passent gmos_bundle.py verify du plugin : contrôle structurel partiel, pas une preuve de partie. Rapports liés aux mêmes SHA-256 que les fichiers livrés.
- **36 SVG + 1 JPEG, 3 WAV** décodés hors ligne ; neuf rendus examinés. Plans et cartouches lisibles, bannière embarquée. WAV synthétiques de 4 secondes ; aucune voix ou écoute humaine revendiquée.
- Import natif des trois archives ; remplacement isolé de 02 ; trois anciens PJ et avatars fictifs conservés ; rechargement, 27 PJ dont 24 du lot, note de 01 et échelons 8/9/10 persistants.
- Trois Hub simulés à 360/768/1180 px : trois jets reçus par le MJ, dépense Héros −1 sur chaque PJ, fiche HTML liée (nom, AGI, arme) puis échelle d’évolution saisie et sauvegardée. Quatre captures examinées.
- GM-05 : ÉCHEC conservé ; chemins dans verification-electron.json. Aucune correction de logiciel dans ce lot.

Génération fixe 2026-10-31T12:00:00.000Z ; version GM-OS, sources et empreintes dans provenance.json. Les essais unitaires utilisent --maxWorkers=4. Aucune installation de paquet, aucun code src/ ou electron/ écrit, aucun profil ni sauvegarde personnel utilisé.

Essais applicatifs autorisés par David, dans les chemins jetables du helper e2e/lancerGmOs.ts ; réseau externe des Hub bloqué, appareils désactivés, clés vides.

Le moteur HTML 22 et le raccord coc2-fr font partie de l’application construite, pas d’une mise à jour automatique par les campagnes. Toutes les limites et règles manuelles restent dans MODULES-ET-LIMITES.md et ANOMALIES-CONNUES.md.
