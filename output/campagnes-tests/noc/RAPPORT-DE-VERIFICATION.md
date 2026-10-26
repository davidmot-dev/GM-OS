# Vérification du lot NOC — 25/10/2026

- **14 contrôles de données réussis** : manifestes Nexus, SHA-256 et 39 médias par archive, liens, santé en dix cases sans PV, pilote, trois joueurs existants, 18 PJ distincts, Cabales complètes, réserves dérivées, Contacts/Faveurs, seuils, entraide, clone/rejeu, tables et cahier.
- **Import natif Electron** en profil/corpus/sauvegardes jetables : trois campagnes et leurs Cabales ; anciens profils/avatars et trois anciens PJ fictifs conservés. Remplacement du laboratoire sans toucher à l’enquête ; rechargement conservant 21 PJ (18 nouveaux et trois sentinelles fictives).
- **Cabale essayée** : feuille HTML, nom, Contacts ; Nouveau scénario du laboratoire recharge pistes 3/2/2, Contacts 2/2/2, Technique et Capital 3, Menace 0 ; périls 2/1/1/2 conservés et autre Cabale intacte.
- **Trois vrais parcours tablette** : Thomas/Soren 360 px, Marie/Daria 768 px, Lucas/Naël 1180 px. Trois jets reçus par la Loi ; trois pistes Vécu modifiées dans la fiche HTML ; trois petites Faveurs dépensées depuis la Cabale ; pas de débordement horizontal.
- **36 SVG et trois WAV décodés dans Edge hors ligne** ; trois rendus d’assets inspectés. Audio synthétique quatre secondes, sans lecture sonore. Sorties physiques des appareils non validées.
- **GM-05 : ÉCHEC**. Lire ANOMALIES-CONNUES.md. Ne pas déclarer l’E2E entièrement vert.
- **62 cas manuels livrés, NON TESTÉS par David**. Le CSV reste vierge de verdicts humains.

## Reproduire

`node outils/campagnes-de-recette/noc.mjs`

`npx vitest run --config outils/campagnes-de-recette/vitest-noc.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/noc/verification-archives.json`

`npm run build` puis `npx playwright test e2e/campagneDeRecetteNoc.spec.ts`

`node outils/campagnes-de-recette/verifier-visuels.mjs noc` puis `node outils/campagnes-de-recette/emballer-noc.mjs`

L’emballage refuse des rapports incomplets ou portant les empreintes d’anciennes archives.
