# Campagnes de recette RuneQuest — 30/10/2026, Codex

## Ce que la session a produit

David : « utilise le plugin GM-OS Campagnes de test et Crée les campagnes de test de RuneQuest avec ce pilote et ces règles, pour les joueurs de mon export fourni ».

Plugin utilisé : [GM-OS Campagnes de test](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf), méthode locale dans `outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests/skills/campagnes-de-test/`.

- **Lot importé et éprouvé en instance isolée, avec anomalie GM-05** : [`RuneQuest-Campagnes-de-recette.zip`](../../output/campagnes-tests/runequest/RuneQuest-Campagnes-de-recette.zip). Trois Nexus : aventure originale **Les Bornes du gué**, laboratoire Aptitudes/Combat/Santé, laboratoire Runes/Passions/Magie. 3 + 9 + 9 nouveaux PJ, mêmes joueurs Thomas D. (`p-1`), Marie C. (`p-2`), Lucas R. (`p-3`). Seulement les noms/IDs autorisés sont repris de l’export ; aucune ancienne fiction, fiche ou note.
- Pilote fourni `Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver`, version **2.0.0**, ID `custom-1793114851695`, gabarit `tpl-1793114851695`, **313 champs**. Sources : 17 fichiers RuneQuest relus, manuel et correspondance `runequest-fr`. Empreintes dans `provenance.json`.
- 12 PNJ, 8 lieux, 12 indices, 16 scènes/4 actes, 4 séances prévues, 9 Wiki, 3 rencontres facultatives, inventaires/butin, Storyboard, trois sons synthétiques et tuiles lumineuses sans appareil. Plans/cartouches documentaires SVG originaux ; aucune illustration ou voix prétendue.
- **66 cas humains NON TESTÉS** : cahier, matrice, CSV vierge ; trois tables originales Table-OS séparées. Aucun module RuneQuest compatible au catalogue. Coûts magiques, blessures locales, progression, INT libre et conséquences restent à gérer à la table.
- Générateur et contrôles propres au lot : `outils/campagnes-de-recette/runequest{,-scenario,-recette,-visuels}.mjs`, `runequest.test.ts`, `vitest-runequest.config.mts`, `emballer-runequest.mjs` ; parcours `e2e/campagneDeRecetteRuneQuest.spec.ts`.
- **Vérifié** : génération ; 91 essais Vitest réussis, dont moteur RuneQuest existant ; validateurs Nexus/pilote réels, santé, références, seuils D100/opposition/résistance/localisations, réserves manuelles, 313 champs, clone et lecteur Table-OS ; utilitaire du plugin valide les trois archives ; 36 SVG et trois WAV décodés hors ligne ; neuf rendus examinés ; ZIP rouvert et empreintes des trois archives contrôlées. `npm.cmd run build` réussi (inclut `tsc -b`).
- **Essai applicatif exécuté après autorisation explicite** : « Oui, autoriser cette relance hors bac à sable » (David, 30/10), après le premier refus de la revue automatique pour accès potentiel élargi au profil utilisateur. Profils/corpus/sauvegardes jetables conservés, aucune donnée personnelle utilisée. Trois imports, remplacement isolé de 02, 24 PJ persistés dont trois anciens PJ sentinelles ; noms et avatars conservés. Trois Hub 360/768/1180 : trois jets, trois localisations avec PV, fiche HTML liée, PM saisis à 8/9/10 puis persistés au rechargement. Captures examinées.
- **GM-05 confirmé, ÉCHEC conservé** : douze chemins `payload.session.sessions.0…11.gmSecrets` contiennent les marqueurs privés fictifs sur les trames des Hub. Aucun correctif applicatif glissé dans ce lot. `verification-electron.json`, `ANOMALIES-CONNUES.md` et assertion finale E2E restent en échec explicite ; tous les contrôles antérieurs du parcours ont abouti.
- **Emballage final après essais** : 99 fichiers, 1 064 967 octets ; SHA-256 du ZIP `35389326103ccdcee9e635f5071b31d487646cc3575614275d956c7b83061a28`. Les empreintes des trois `.gmos` sont inchangées depuis les 91 contrôles. Revue de quatre captures Electron consignée avec empreintes du rapport, du test et des images ; noms et pourcentages des armes principales également contrôlés sur les trois fiches. Le guide d’import avertit dès son début de GM-05.
- **Avant la demande de commit** : aucune commande Git d’écriture, aucune modification `src/`/`electron/`, du pilote source, ni des données personnelles. David a ensuite demandé « commit et pousse » : le commit porte uniquement les huit sources de campagne, cette note et `output/campagnes-tests/runequest/`. Les autres chantiers, dont l’intégration du pilote RuneQuest et le plugin lui-même, restent séparés. Les générateurs et essais utilisent l’intégration RuneQuest du dépôt ; ce commit ne la remplace pas.

## Par quoi reprendre

1. Le lot s’utilise d’abord par `01-Les-Bornes-du-gue.gmos` → Bibliothèque → Importer un bundle Nexus → Importer telle quelle. Lire l’anomalie **GM-05** avant les essais avec des joueurs réels : les secrets ne sont pas correctement filtrés sur leurs trames. Pour réinitialiser un laboratoire, réimporter seulement 02 ou 03 avec Remplacer.
2. Le correctif GM-05 appartient à un chantier applicatif distinct : chercher le filtrage des `GameSession.gmSecrets` des messages de synchronisation. Ne pas étendre la présente création de campagnes à une modification de `src/` ou `electron/` sans demande et sans poser « GM-OS tourne-t-il ? ».
3. Les 66 cas restent NON TESTÉS par David. Essayer les cas souhaités et renseigner `resultats.csv` ; préserver l’échec de confidentialité tant qu’il est reproduit.
4. Pour reproduire automatiquement : compilation à jour, puis seul `e2e/campagneDeRecetteRuneQuest.spec.ts` dans les conditions autorisées ; utiliser le temporaire système normal du lanceur. Inspecter les captures et réemballer avec `node outils/campagnes-de-recette/emballer-runequest.mjs` après tout changement d’archive.
5. Le registre et la synthèse des pilotes étaient déjà modifiés par Claude ; **pas d’écriture concurrente**. Fragment de registre prêt ci-dessous. Aucun changement du pilote dans ce chantier : la synthèse RuneQuest peut simplement référencer ce lot, en distinguant préparation et import réel.

## À reporter dans le registre par son écrivain

Numéros à recalculer : le dernier § observé est 187, la première ligne de synthèse 123. Ne pas figer 188/124 si un autre chantier s’est ajouté.

> David : « utilise le plugin GM-OS Campagnes de test et Crée les campagnes de test de RuneQuest avec ce pilote et ces règles, pour les joueurs de mon export fourni ».
>
> - Trois archives importées et éprouvées dans `output/campagnes-tests/runequest/` : Les Bornes du gué, Aptitudes/Combat/Santé, Runes/Passions/Magie ; 21 nouveaux PJ rattachés aux trois joueurs de l’export, 66 cas humains NON TESTÉS ; pilote 2.0.0 et 313 champs.
> - Vérifié : 91 essais, utilitaire plugin, 39 médias embarqués par archive, neuf rendus examinés, compilation/types réussis, ZIP et SHA contrôlés. Générateur reproductible sous `outils/campagnes-de-recette/runequest.mjs`.
> - Import natif, remplacement isolé et trois Hub 360/768/1180 vérifiés ; jets/localisations, fiches HTML, PM et persistance aboutissent. David a explicitement autorisé la relance hors bac à sable après le refus initial ; toutes les données restent jetables.
> - Reste : GM-05 confirmé (12 champs gmSecrets transmis, échec E2E conservé), recette humaine et matériel. Reprise : `2026-10-30-etat-et-reprise-codex-campagnes-runequest.md` ; importer 01 et traiter le défaut de confidentialité dans son chantier propre.

## Ce qu’il ne faut pas repayer

- Ne pas changer `DATE_RECETTE` du helper partagé : ce lot a sa propre date fixe, `2026-10-30T12:00:00.000Z`, et cible GM-OS 6.5.0 ; le pilote garde son export historique intact.
- Le clonage des laboratoires doit renommer aussi les clés d’objets des pads et le préfixe `SCENE_…` des lumières ; les références des médias restent communes. Contrôlé dans les essais.
- Windows : utiliser `npm.cmd` et `npx.cmd`. Pas d’installation pour contourner le blocage PowerShell des `.ps1`. Python existant sous le cache codex-primary-runtime, mode `-B`.
- **Le temporaire de l’E2E doit rester hors du dépôt** : les sauvegardes dans l’installation sont refusées, à juste titre, par la garde de mars 2026. De plus, un fichier CommonJS `electron-log-preload.js` dans un profil sous ce dépôt hérite du `type: module` racine et échoue sur `require`. Le temporaire système du lanceur évite les deux problèmes ; ne pas changer le helper partagé.
- La réserve PM de la fiche RuneQuest est une série de **hotspots cliquables**, pas un champ à remplir : cliquer `[data-key="magic.current"][data-value="8"]`, puis vérifier réception et persistance côté MJ.
- Pour les scripts Node envoyés par PowerShell : définir `$OutputEncoding=[System.Text.UTF8Encoding]::new()` si le script contient des accents. Sinon des chaînes littérales peuvent être remplacées par `?` ; préférer `apply_patch` pour les fichiers sources.
- Ne pas marquer les 66 résultats humains PASSÉS parce que les essais automatisés réussissent. La localisation affichée ne retranche aucun PV ; un jet de magie ne facture aucun coût automatique avec ce pilote.
- Les rapports d’import n’existent pas tant que le parcours n’a pas atteint ses assertions. Le paquet peut être préparé sans ce rapport et le dit ; il refuse les empreintes périmées. Ne pas présenter le blocage d’environnement comme une anomalie de l’archive.
- Aucun essai E2E général : certains lisent des sauvegardes personnelles ou réécrivent des captures suivies. Ici seul le nouveau parcours est autorisé.
