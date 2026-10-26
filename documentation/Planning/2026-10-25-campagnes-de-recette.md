# Campagnes de recette — Cthulhu Hack, 25/10/2026

David demande de « générer une campagne complète » pour tester un pilote avec PNJ, lieux,
indices, loot et PJ pour **Thomas D., Marie C. et Lucas R.**, en commençant par Cthulhu Hack.
Il précise que les « modules externes » désignent **les outils GM-OS autour du pilote**.

## Livraison

Le dossier [output/campagnes-tests/cthulhu-hack](../../output/campagnes-tests/cthulhu-hack/)
contient le ZIP **Cthulhu-Hack-Campagnes-de-recette.zip**, le guide d’import, le cahier de
recette et le CSV des résultats. Les 59 cas manuels restent à essayer par David.

- **01-Port-Lenoir.gmos** : enquête originale, automne 1926, trois PJ (Adrien Delcourt,
  Claire Morel, Émile Roussel), 12 PNJ, huit lieux schématiques, 12 indices documentés,
  quatre actes dont un atelier hors fiction, 18 scènes, trois rencontres, quatre séances
  prévues, huit entrées de wiki, quatre événements, inventaires, huit lots de butin et une réserve.
- **02-Hors-Jeu-et-limites.gmos** : 15 PJ de laboratoire, dix résultats du D10 déjà tirés,
  Standard/Pulp en attente, d4/armure, d20, Fortune 2.
- **03-Chocs-et-Folies.gmos** : 12 PJ de laboratoire, un par résultat des deux tables D6,
  avec dés de durée à 2, produits par les fonctions réelles du moteur CH.

Les trois campagnes partagent les trois joueurs de recette, mais possèdent des identifiants
de campagne et de PJ distincts. L’import ajoute 30 PJ au total, sans écraser les PJ de l’enquête.
David précise le 25/10 : **« ils existent déjà »**, puis fournit
`Export Dirvers/RDD_campagne_gmos_1792944586235.gmos`. Seuls les noms et identifiants des joueurs
sont repris : Thomas D. **p-1**, Marie C. **p-2**, Lucas R. **p-3**. Le générateur les conserve
dans `cthulhu-hack-joueurs.json` avec la référence et l’empreinte de l’export. Nexus rattache
les nouveaux PJ aux entrées existantes, sans recopier les anciens PJ RDD dans les archives.
Cette version remplace le premier lot qui utilisait des identifiants propres à la recette.

Chaque archive embarque **38 médias originaux** : 35 SVG schématiques (cartes, cartouches et
documents) et trois WAV synthétiques. Quatre moments Storyboard, Sound-OS, Music-OS et trois
tuiles Light-OS sans lampe assignée sont prévus. Trois tables originales 1d6 s’importent
séparément dans Table-OS, par l’Atelier, sans modifier les tables de règles.

## Sources, format et périmètre

Pilote : `Export Dirvers/corriges/CH_driver_gmos_2026-10-23.gmos-driver`, version **1.1.0**.
Manuel : `documentation/User Guides/54-Jeu-Cthulhu-Hack.md`. Types Nexus et domaines réels du
dépôt ; aucun champ de fiche inventé pour simuler une fonction absente. Les PV et valeurs des
PJ sont choisis pour la recette, sans prétendre à une création par le livre.

Les archives incluent le pilote et le gabarit comme dépendances Nexus : ajoutés s’ils manquent,
conservés s’ils existent. Un pilote 1.0 existant doit être remplacé explicitement par l’archive
de pilote fournie. Les laboratoires se remettent à zéro en réimportant leur fichier avec
**Remplacer**. **Rejouer conserve les PJ**, donc ne sert pas de guérison générale.

Aucun module de jeu externe compatible CH n’est enregistré ; aucun état fictif n’est ajouté.
La sortie physique des lampes, les services IA/TTS, les réglages de carte, les calendriers et
la bibliothèque globale Image-OS ne sont pas déclarés configurés. La projection Storyboard
utilise une carte embarquée. L’exhaustivité de toutes les combinaisons n’est pas revendiquée.

## Vérifications et défaut découvert

**13 contrôles de données réussis** : manifestes, SHA-256 et médias, liens internes, santé,
pilote, joueurs partagés et PJ distincts, pertes/récupérations, durées, clone/rejeu et tables
Table-OS. Lint ciblé propre. Pas de nouvelle exécution globale nécessaire : aucun fichier
`src/` ou `electron/` n’est modifié.

La recette Electron utilise un **profil, corpus et sauvegardes jetables**. Trois imports natifs,
campagne sentinelle conservée, trois joueurs préexistants réutilisés avec leurs avatars et
trois anciens PJ fictifs conservés, remise à zéro isolée d’un laboratoire, rechargement, trois
tablettes (360/768/1180), trois Sauvegardes reçues par le MJ et fiches HTML fonctionnent.

**Le scénario e2e reste rouge sur GM-05** : les secrets de séance
`payload.session.sessions[*].gmSecrets` arrivent dans les trames des tablettes. Douze chemins
observés avec le marqueur fictif `SECRET_MJ_CH_RECETTE`. Le filtre
`src/modules/remote/logic/caviardageDesJoueurs.ts` ne traite pas `gmSecrets`. Constat rangé
au registre **§ 1 bis** ; aucun correctif applicatif glissé dans ce chantier de données.
`verification-electron.json`, `ANOMALIES-CONNUES.md` et `RAPPORT-DE-VERIFICATION.md` donnent
le bilan sans recopier les trames. **Ne pas annoncer la recette entièrement verte.**

## Reproduire et reprendre

Sources : `outils/campagnes-de-recette/`. Générer avec `node outils/campagnes-de-recette/cthulhu-hack.mjs`,
tester avec le `vitest.config.mts` de ce dossier et `--maxWorkers=4`, puis
`e2e/campagneDeRecetteCthulhuHack.spec.ts`. `verifier-visuels.mjs` vérifie les médias hors ligne ;
`emballer.mjs` exige les rapports avant de produire le ZIP. Les archives ont des dates ZIP fixées.

Les résultats de David sont à saisir dans `resultats.csv` ; les rapports automatiques restent
distincts. Pour une future réparation de GM-05, demander d’abord **« GM-OS tourne-t-il ? »**
avant toute modification dans `src/` ou `electron/`, puis refaire ce scénario sans affaiblir
son assertion. Aucun accès au profil personnel ni au dossier de sauvegardes de David.
Aucun commit ni push demandé pour ce nouveau chantier.
