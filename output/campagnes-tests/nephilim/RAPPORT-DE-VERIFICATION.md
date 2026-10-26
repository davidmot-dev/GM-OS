# Vérification du lot Nephilim — 26/10/2026

- **26 contrôles de données réussis** : trois archives Nexus, manifestes/SHA-256 et 39 médias chacune ; références des scènes, indices et relations ; fiches typées, santé en cases sans PV ; quinze nouveaux PJ pour les trois joueurs existants. Vécus passés reliés aux époques du référentiel, sept pages HTML présentes et huit propositions de contextes.
- **Parcours du moteur sur les personnages livrés** : conséquences physiques et magiques retirées au Vécu avant le Ka, quatre interdits du Khaïba, alertes des Chutes 8/10, mise en jeu déjà utilisée refusée, Sacrifice insuffisant et Œuvre rouge refusée avec construct blanc. Consommation réelle des Materiae Eau 8 → 6, conservation sur critique, double Lune 4 avec manque 3. Stase, cible, progression et options d’encaissement ; clone, trois tables Table-OS et cahier vierge.
- **Import natif Electron isolé** : trois archives, anciennes fiches/avatars de trois joueurs fictifs conservés, remplacement du laboratoire Santé/Chutes sans changer l’enquête ; 18 PJ persistés dont trois sentinelles. Aucun profil personnel consulté.
- **Trois tablettes 360/768/1180 px** : trois jets reçus au meneur, trois fiches HTML, identité Nephilim et Simulacre lus, trois écritures de Sapience 14/15/16 reçues puis persistées. Quatre ajouts explicites de Traque depuis les tablettes font passer 1 à 0 et l’Intensité de 1 à 2 au seuil RK 5 ; état retrouvé au rechargement. Ces ajouts ne sont pas des jetons facturés automatiquement aux jets.
- **36 SVG et trois WAV décodés hors ligne**, rendus et captures inspectés ; sons originaux synthétiques de quatre secondes. Aucune nouvelle extension de jeu nécessaire ; cartes natives et outils existants utilisés.
- **GM-05 : ÉCHEC**, seul échec conservé à la fin de la recette Electron. Voir ANOMALIES-CONNUES.md.
- **70 cas humains livrés, NON TESTÉS par David.** Les sept pages entièrement éditées, les trois Sciences occultes jouées intégralement, les tables globales importées et les appareils physiques restent une recette humaine.

## Reproduire

1. node outils/campagnes-de-recette/nephilim.mjs
2. npx vitest run --config outils/campagnes-de-recette/vitest-nephilim.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/nephilim/verification-archives.json
3. npm run build puis npx playwright test e2e/campagneDeRecetteNephilim.spec.ts
4. node outils/campagnes-de-recette/verifier-visuels.mjs nephilim ; inspecter les rendus.
5. node outils/campagnes-de-recette/emballer-nephilim.mjs

L’emballage refuse des rapports incomplets ou portant les empreintes d’autres archives. Les dates du 25/10 dans les manifestes sont l’instant fixe commun des données de recette ; vérifications et livraison le 26/10.
