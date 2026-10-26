# Vérification du lot ALIEN — 26/10/2026

- **17 contrôles de données réussis** : manifestes, SHA-256 et 39 médias par archive, liens, Santé/Force, Paniques préparées par le moteur, joueurs existants et 15 PJ distincts ; validation réelle des trois modules, objectifs privés, parcours M314 trois Tours, spatial préparé/engagé, clone, tables et cahier.
- **Import natif Electron** dans un profil/corpus/sauvegardes/ports jetables : trois archives, neuf états de modules, anciens profils/avatars et trois anciens PJ fictifs conservés. Remplacement des laboratoires sans modifier la fiche ni le terminal de l’enquête.
- **Trois tablettes : 360/768/1180 px**, pour Eli/Thomas, Mara/Marie, Samir/Lucas. Trois jets reçus par Maman et trois fiches HTML ouvertes.
- **Neuf ouvertures de modules sur le vrai Hub** : les trois instruments pour les trois joueurs. READ mission fonctionne ; un objectif privé remis à Eli ; scan M314 donnant Gaine de maintenance, un écho ; Vautour présenté comme contact non identifié ; ordre de verrouillage d’Iskra reçu depuis Eli. Pas de débordement horizontal observé.
- **Données privées des modules filtrées** : absence du marqueur SECRET_MODULE_ALIEN et des objectifs d’autrui dans les messages reçus. Après fermeture du contexte de séance, accès fermés ; dialogues et préparation retrouvés après rechargement. 18 PJ persistés, dont trois sentinelles fictives.
- **36 SVG et trois WAV décodés hors ligne**. Rendus de trois assets et captures des pupitres/Hub inspectés ; quatre secondes par WAV synthétique. Aucun film ou son commercial copié.
- **GM-05 : ÉCHEC**, à distinguer des contrôles de modules réussis. Voir ANOMALIES-CONNUES.md.
- **74 cas manuels livrés, NON TESTÉS par David** ; jeu complet, périphériques physiques, toutes combinaisons de règles et services externes ne sont pas déclarés validés.

## Reproduire

`node outils/campagnes-de-recette/alien.mjs`

`npx vitest run --config outils/campagnes-de-recette/vitest-alien.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/alien/verification-archives.json`

`npm run build` puis `npx playwright test e2e/campagneDeRecetteAlien.spec.ts`

`node outils/campagnes-de-recette/verifier-visuels.mjs alien` puis `node outils/campagnes-de-recette/emballer-alien.mjs`

L’emballage refuse des rapports incomplets ou portant les empreintes d’anciennes archives.
