# Campagnes de recette — Shadowrun : Anarchy 2.0

David, 01/11/2026 : « GM-OS Campagnes de test pour le jeu Shadowrun Anarchy ».
Méthode du plugin, pilote réel 2.0.0 fini au § 197, corpus relu 19/19 et relevé joueurs
autorisé déjà fourni. Aucun nouveau pilote ou module applicatif fabriqué.

## Livraison et premier import

`output/campagnes-tests/shadowrun-anarchy/Shadowrun-Anarchy-Campagnes-de-recette.zip`,
**2 987 847 octets**, 88 fichiers, SHA-256
`f29a49004001d47cc1fda7fc8b7c3e5c78517f1a76ffecddbb987b3c31987ee3`.

Importer d’abord **01-La-Derniere-Couleur.gmos**. Mission originale : retrouver une coursière,
documenter un chantage aux identités médicales et détourner une vente sans couper la clinique.
Dialogue, copies autonomes, course, magie, Matrice et accès manuel offrent plusieurs voies.
Quatre actes/douze scènes, six lieux, neuf PNJ/neuf indices, trois rencontres optionnelles,
quatre séances prévues, outils de préparation et médias embarqués.

**02-Moniteur-et-Seuils.gmos** prépare neuf états de santé ; **03-Risque-Anarchy-et-Matrice.gmos**
prépare dix états de risque et d’Essence. Les trois PJ de mission et ces dix-neuf témoins sont
nouveaux : **22 au total**, répartis entre Thomas D. p-1, Marie C. p-2 et Lucas R. p-3.
Aucun ancien PJ, avatar, note ou secret privé recopié. Réimporter uniquement le laboratoire voulu
avec **Remplacer** pour le remettre à zéro. Pilote et moteur HTML ne sont pas mis à niveau
automatiquement par cet import ; lire le guide du lot.

## Vérifications et limites

- **72 tests ciblés passent**, vrais composants du moteur et Nexus ; trois archives acceptées
  par le contrôle structurel partiel du plugin. Types exacts des 125 champs, liens, santé,
  moniteur, RR, Essence, risque, relance, panneau et correspondance des 120 clés couverts.
- **28 SVG schématiques + un JPEG, trois WAV synthétiques** décodés hors ligne ; neuf rendus
  examinés. Quatre captures applicatives relues. Aucune écoute humaine annoncée.
- `npm run build` réussi, lint ciblé sans erreur ; configuration .mts ignorée par ESLint.
- Imports natifs, remplacement isolé de 02, conservation des sentinelles, reload ; trois Hub
  360/768/1180, trois jets reçus, dépense Anarchy, écriture HTML de Logique 3/4/5 et persistance.
- **GM-05 confirmé** : douze chemins de `gmSecrets` fictifs transmis aux joueurs. Le test E2E
  finit en échec sur son assertion stricte ; la réussite fonctionnelle ne blanchit pas ce défaut.

Les **64 cas humains restent NON TESTÉS**. Profils avancés, atouts/RR et matériel aux valeurs
choisies, pas de budget novice officiel revendiqué. Drain et interdiction de ses soins, durée
des légères, opposition à égalité, planification/menace, Matrice, rigging et progression restent
arbitrés. Aucun simulateur de Structure : le livre se contredit sur la résistance des véhicules.
Pas de module spécifique compatible, aucun état factice inventé. GM-06, partie complète,
matériel et impressions physiques restent à essayer. Réutilisation de la relecture du corpus
par Claude, pas de nouvelle lecture intégrale du livre du NAS par cet atelier.

## Reproduire

`REPRODUIRE.md` dans le lot donne les commandes : `shadowrun.mjs`, Vitest avec
`vitest-shadowrun.config.mts --maxWorkers=4`, vérificateur du plugin, vérificateur de médias,
build, `e2e/campagneDeRecetteShadowrun.spec.ts`, `emballer-shadowrun.mjs`.
Sources dans `outils/campagnes-de-recette/`. Date fixe **2026-11-01T12:00:00.000Z**.
L’emballeur refuse les preuves manquantes ou portant d’autres empreintes ; les trois archives
livrées sont exactement celles des essais. Traces Electron exclues du ZIP.

Essais locaux autorisés : **« Oui, lancer les essais isolés »**, David le 01/11. Helper jetable
`e2e/lancerGmOs.ts`, profils/corpus/coffre/sauvegardes temporaires, appareils désactivés et
réseau externe des Hub bloqué. Services fermés à la fin. Aucun profil personnel, aucun code
`src/` ou `electron/`, aucun paquet installé. Fichiers non commités.
