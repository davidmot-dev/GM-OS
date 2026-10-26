# Vérification du lot Dune — 26/10/2026

- **21 contrôles de données réussis** : trois archives Nexus, manifestes et SHA-256, 39 médias chacune, références, valeurs 4–8, défaite réelle sans PV, maximes correctement réparties selon les principes (trois maximes par PJ principal), spécialisations lisibles par la correspondance HTML, quinze nouveaux PJ pour les trois joueurs existants.
- **Trois Maisons et trois états du module validés** : cinq zones, six atouts, liens réciproques, propriétaires locaux ; reflet de la fiche de Maison identique au module. Types mineure/Grande Maison et réserves indépendants, armoiries embarquées.
- **Parcours du moteur** : désir de Nalia 4/6 après le premier succès puis révélé au second (8/6), secrets filtrés, saut sans lien refusé, tangible récupéré et temporaire retiré en nouvelle scène, cinq arènes/deux modes acceptés. Achats et récupération de principe réels sur les personnages du laboratoire ; clone valide ; trois tables Table-OS et cahier vierge.
- **Import natif Electron isolé** : trois archives, anciennes fiches/avatars de trois joueurs fictifs conservés, remplacement des deux laboratoires sans changer l’enquête ; Maison et fiches indépendantes, 18 PJ persistés dont trois sentinelles. Aucun profil personnel consulté.
- **Trois tablettes 360/768/1180 px** : trois jets finalisés reçus au meneur, trois fiches PJ HTML et trois fiches Maison ; maximes affichées et trois écritures de progression reçues du HTML. Plateau ouvert aux trois joueurs, pas de débordement horizontal de la page observé.
- **Module partagé** : Maison Vaëlan mineure, Menace fixée explicitement à 3 pour trois présents ; deux enquêtes de succès reporté par le MJ révèlent le désir de Nalia, puis Copie du registre déplacée vers elle. Ces gestes ne prétendent pas constituer deux jets aléatoires tirés. État retrouvé au rechargement, accès coupés après clôture.
- **36 SVG et trois WAV décodés hors ligne**, rendus et captures inspectés ; sons originaux synthétiques de quatre secondes, pas de média commercial ni service externe.
- **GM-05 : ÉCHEC**, seul échec conservé à la fin de la recette Electron ; distinct de la confidentialité du module. Voir ANOMALIES-CONNUES.md.
- **66 cas humains livrés, NON TESTÉS par David.** Table-OS global, talents, appareils physiques et tous les conflits complets restent à éprouver ; aucune validation exhaustive universelle revendiquée.

## Reproduire

`node outils/campagnes-de-recette/dune.mjs`

`npx vitest run --config outils/campagnes-de-recette/vitest-dune.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/dune/verification-archives.json`

`npm run build` puis `npx playwright test e2e/campagneDeRecetteDune.spec.ts`

`node outils/campagnes-de-recette/verifier-visuels.mjs dune`, inspection puis `node outils/campagnes-de-recette/emballer-dune.mjs`.

L’emballage refuse des rapports incomplets ou portant les empreintes d’autres archives. Les dates du 25/10 dans les manifestes sont l’instant fixe commun des données de recette ; vérifications et livraison le 26/10.
