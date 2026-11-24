# Anomalies et limites — Crimes2

## CRI-A01 — confidentialité des loyautés : échec de conformité constaté

Le filtre pur `caviarderPourLesJoueurs` conserve `contacts_0_rating` et `contacts_0_appels` dans les fiches de la charge joueur. Dans l’essai fictif, la loyauté3 et les appels0 sont encore présents après filtrage, alors que la carte Contacts est réservée au meneur (livre p.430). Assertion négative conservée en échec, preuve-cri-a01.json liée au SHA de cette archive.

L’émetteur et le serveur courant appellent ce filtre ; aucun transport réseau ni tablette réelle n’a été lancé ici. Le constat porte sur les données rendues par le filtre, pas sur un écran de tablette observé. La garantie de confidentialité de ces champs n’est donc pas validée. Les contacts du lot sont fictifs. Aucun correctif de l’application n’est inclus. Cas POR-04 à reprendre après correction éventuelle.

## Avertissement natif de Forge

Le contrôle du pilote renvoie un avertissement sur combat.statsToTrack : pas de isMainHP. Il est conservé dans verification-pilote.json. Crimes lit son Physique actuel par ses Potentiels et atteintes ; les tests de ce chemin passent. Ce warning générique n’est pas transformé en défaut d’écriture observé, ni effacé en modifiant le pilote.

## Périmètre

- Nexus et sauvegarde validée en mémoire ; pas d’import via la fenêtre Electron, pas de rechargement réel. La restauration locale utilise updateCharacter puis une sérialisation ; ce n’est pas un bouton de reset d’atelier.
- La fonction de caviardage retire les marqueurs fictifs MJ et les indices non révélés, filtre les indices connus d’un seul. Cela ne vaut pas validation générale de confidentialité : CRI-A01 reste en échec.
- Réseau Hub360/768/1180, réception réelle de jets, droits à l’écran, HTML dans Electron, appareil physique, IA et son : NON EXÉCUTÉS. Aucun service lancé pour cette fabrication.
- Les 58 cas humains sont NON TESTÉS. Les 133 contrôles automatiques ont leurs résultats séparés :132 réussis,1 échec nommé. Pas de promesse de partie testée.
- Pas de module Crimes externe ; rivalités de styles, poursuites, Fortune commune et déchéance détaillée restent au meneur. Seuil de Fortune10 = choix du pilote ; Névrose à moitié ou zéro = variantes contradictoires du livre.
- Les budgets de Potentiels/compétences/spécialisations des trois héros passent le contrôle natif partiel. Contacts, convictions, matériel et totalité de la création novice ne sont pas certifiés.

Archive : 01-Crimes-Les-Heures-rayees.gmos
SHA-256 : c0af90ecc55ebf57da14d9b5601bd3ab90ba97f0f645a1bd01cd3eeded8c231c
