# Vérification du lot Rêve de Dragon — 26/10/2026

- **19 contrôles de données réussis** : trois archives Nexus, manifestes/SHA-256, médias embarqués, références, valeurs R0 recalculées, santé R2 réelle (blessures et coma), quinze nouveaux PJ et trois joueurs existants. Trois états rdd-tmr validés par le moteur, demi-rêves privés et remappage de clone.
- **14 tables Table-OS** : lecture par le vrai parseur ; les **1400 résultats d100** comparés au moteur, sans trou ni chevauchement, avec noms et forces. Ce contrôle porte sur les fichiers fournis ; l’import manuel des tables dans l’univers global de David reste à faire.
- **Carte officielle existante** : 189 cases, G4/H4 voisins, image 900 × 1000 vérifiée dans le vrai Hub ; référence SHA-256 vérifiée sur l’asset embarqué par GM-OS. Aucun exemplaire du livre ou de la carte recopié dans le paquet.
- **Import Electron natif isolé** : trois campagnes plus une sentinelle ; profils, avatars et trois anciens PJ fictifs conservés. Remplacement du laboratoire puis persistance de l’enquête vérifiés, 18 PJ au rechargement dont trois sentinelles.
- **Trois tablettes 360/768/1180 px** : choix des bons PJ, trois jets reçus au meneur, trois fiches HTML ouvertes, trois modules TMR ouverts et carte officielle décodée. Pas de débordement horizontal de la page observé ; la carte possède son défilement propre.
- **Trois montées réellement payées** : rêve 12 → 11, fatigue 0 → 1 pour chacun. Liseron se déplace ensuite de G4 à H4 : rêve 11, fatigue 2 ; deux reçus durables conservés au rechargement, sans nouveau débit. Une rencontre publiée au seul Liseron, terminée explicitement avant le déplacement. Préparations privées et demi-rêves d’autrui filtrés ; accès fermés après la séance.
- **36 SVG et trois WAV décodés hors ligne**, trois rendus et captures du module inspectés ; sons originaux synthétiques de quatre secondes. Storyboard et lumières sont des données préparées ; aucune validation de lampe réelle revendiquée.
- **GM-05 : ÉCHEC**, à distinguer des contrôles TMR réussis. Voir ANOMALIES-CONNUES.md.
- **69 essais humains livrés, NON TESTÉS par David.** Les rapports automatiques ne valident pas à sa place toutes les mécaniques ni la campagne jouée.

## Reproduire

`node outils/campagnes-de-recette/rdd.mjs`

`npx vitest run --config outils/campagnes-de-recette/vitest-rdd.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/reve-de-dragon/verification-archives.json`

`npm run build` puis `npx playwright test e2e/campagneDeRecetteRdd.spec.ts`

`node outils/campagnes-de-recette/verifier-visuels.mjs reve-de-dragon`, inspection puis `node outils/campagnes-de-recette/emballer-rdd.mjs`.

L’emballage refuse les rapports incomplets ou les empreintes d’une autre génération.
