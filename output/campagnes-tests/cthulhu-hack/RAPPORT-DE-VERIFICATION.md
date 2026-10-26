# Vérification du pack — 25/10/2026

- **13 contrôles de données réussis** : manifestes Nexus, sommes SHA-256 et présence des 38 médias par archive, liens internes, santé, pilote, trois joueurs existants réutilisés, 30 PJ distincts, conséquences/durées, copie/rejeu, tables Table-OS et cahier.
- **Import natif Electron exercé** dans un profil neuf et jetable : trois archives importées, campagne sentinelle conservée, trois joueurs préexistants (p-1/p-2/p-3), leurs avatars et trois anciens PJ fictifs conservés, 30 PJ de recette ajoutés sans doublon, réimport du laboratoire sans remise à zéro de l’enquête, puis persistance au rechargement.
- **Trois tablettes de recette : 360, 768 et 1180 px**. Trois Sauvegardes reçues par le meneur, pas de débordement horizontal, fiches HTML du jeu ouvertes.
- **GM-05 : ÉCHEC — gmSecrets reçu dans les données des tablettes ; voir ANOMALIES-CONNUES.md.** Les autres contrôles ci-dessus ont abouti ; le scénario e2e ne passe pas entièrement tant que cette anomalie subsiste.
- **59 cas manuels livrés**, encore NON TESTÉS par David dans resultats.csv. Le contrôle physique des éclairages et des sorties audio, les services externes et toutes les combinaisons possibles ne sont pas déclarés validés.

Commandes :

`node outils/campagnes-de-recette/cthulhu-hack.mjs`

`npx vitest run --config outils/campagnes-de-recette/vitest.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/cthulhu-hack/verification-archives.json`

`npx playwright test e2e/campagneDeRecetteCthulhuHack.spec.ts`

`node outils/campagnes-de-recette/emballer.mjs`

Les 35 SVG et trois WAV ont aussi été décodés dans Edge hors ligne, sans lecture sonore ni accès Internet. Trois rendus de documents/cartes ont été inspectés.
