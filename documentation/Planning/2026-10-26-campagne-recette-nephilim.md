# Campagnes de recette Nephilim — 26/10/2026

David : « tu peux faire une campagne de Nephilim rattaché au même Joueurs, n’oublie pas de
créer des modules si nécessaire ». Sixième lot après CH/NOC/ALIEN/RdD/Dune ; registre § 183,
vue 119. Aucun changement du pilote ou du code applicatif, aucun commit/push demandé.

## Livraison et import

`output/campagnes-tests/nephilim/Nephilim-Campagnes-de-recette.zip` contient trois archives :

- **01-Le-Meridien-de-verre.gmos** : enquête originale à Saint-Ambre, ville fictive.
  **Astérion / Thomas D. p-1**, Simulacre Adrien Veyre, Magie ; **Ismérie / Marie C. p-2**,
  Simulacre Mélanie Sorrel, Kabbale ; **Nahal / Lucas R. p-3**, Simulacre Julien Roussel,
  Alchimie. Pentacle **Les Veilleurs du Méridien**, décrit dans les relations et Wiki.
- **02-Sante-Chutes-et-Stase.gmos** : neuf PJ S01–S09 ; conséquences physiques/magiques,
  quatre interdits du Khaïba à 5, Ombre 8, Narcose 10, Chute déjà mise en jeu et PS de Chute.
- **03-Arts-et-Ressources.gmos** : trois PJ A01–A03 ; Sacrifice insuffisant, Grand Secret
  nommé, pacte à comparer, Œuvre au blanc/double Lune/MP insuffisantes et construct blanc
  ne permettant pas l’Œuvre rouge.

**15 nouveaux PJ**, mêmes joueurs existants ; aucun contenu de la campagne privée RDD recopié.
Seul le relevé noms/identifiants déjà autorisé est utilisé. Réinitialiser le laboratoire voulu
avec **Remplacer** ; préserver les changements de 01. Pilote Nephilim **2.0.0** embarqué et
fourni séparément, identifiant `custom-1792235906697` ; remplacement du pilote existant explicite.

Enquête : **12 PNJ (4 Nephilim, 8 humains), 8 lieux, 12 indices, 16 scènes / 4 actes,
3 rencontres préparées, 4 séances, 9 pages Wiki et 8 lots de butin**. Trois issues et preuves
essentielles accessibles sans magie obligatoire. Profils avancés aux valeurs choisies pour test,
sans budget de création novice revendiqué. Vécus passés/époques du référentiel existant ; pas
de descriptions du livre recopiées. Trois pouvoirs fictifs clairement marqués **RECETTE**,
créés pour vérifier les raccords degré/élément/consommation, sans prétendre à des règles officielles.

## Modules et outils

Le catalogue ne fournit **aucun module spécifique compatible Nephilim**. Les cartes natives
Santé/Chutes/Stase/Expérience et les outils transversaux suffisent ; aucun module d’un autre
jeu détourné ni nouvelle extension créée. Le Pentacle n’a pas de fiche collective chiffrée.

Atlas, Combat-OS, Trame, indices, Wiki, quatre moments Storyboard, sons/musique et trois
lumières sans appareil sont remplis. **36 SVG documentaires et trois WAV synthétiques de 4 s**.
Trois tables 1d6 originales séparées à importer dans Table-OS → Atelier → Ranger tel quel.
`PARCOURS-NEPHILIM.md` et huit propositions `CONTEXTE-DES-LIEUX.json` guident les réglages.
RK, lieu magique et conjonction se règlent **manuellement** au bandeau ; le déplacement Atlas
ne les applique pas. La Traque monte immédiatement au seuil RK selon le choix existant de David.

Combat-OS : six cases physiques génériques ; utiliser la carte Santé native pour l’absorption
par valeur, les cases de bonus du Ka-Terre et la piste magique complète. Les humains ont leur
métier et Ka-Soleil, sans Arts de Nephilim ; initiative/Menace à arbitrer explicitement.

## Vérifications et limites

**26 contrôles de données réussis** : manifestes, SHA, médias, liens de fiction, fiches typées,
santé en cases sans PV, trois rattachements et quinze identifiants uniques ; Vécus/époques,
sept pages HTML, réserves/contextes, clone et trois tables. Moteur réellement appelé sur les
personnages livrés : malus des conséquences avant le Ka, quatre interdits du Khaïba, alertes
8/10, mise en jeu unique, Sacrifice, assemblage insuffisant, consommation Eau 8 → 6 et
conservation sur critique, double Lune 4/manque 3, Stase, cible, progression et encaissement.
Lint ciblé sans erreur ; tous les médias décodés hors ligne, rendus/captures inspectés.

**Electron isolé**, build de production validé au push des quatre premiers lots : import des
trois archives, anciens profils/avatars et trois anciens PJ fictifs conservés, remplacement du
laboratoire Santé/Chutes sans toucher l’enquête ; 18 PJ persistés dont les trois sentinelles.
Trois Hub **360/768/1180 px**, trois jets reçus au meneur, fiches HTML avec identité et Simulacre,
écritures de Sapience **14/15/16** reçues puis retrouvées au rechargement. Quatre ajouts explicites
de Traque depuis les tablettes : **1 → 0, Intensité 1 → 2**, seuil RK 5, état persistant.
Le premier essai de test fermait la fiche avant d’utiliser ses réserves ; parcours de test corrigé,
sans modification applicative. Les réserves sont dans la fiche ouverte du joueur.

**GM-05 reste le seul échec**, douze chemins de secrets de séance dans les trames joueur.
Assertion E2E conservée en échec, rapports datés et SHA des archives effectivement importées.
Défaut transversal déjà au registre § 1 bis ; aucun correctif dans cette livraison de données.

**70 cas humains NON TESTÉS par David**, JSON/CSV vierges. Sept pages entièrement éditées,
Sciences occultes jouées de bout en bout, import global des tables et appareils physiques
restent à éprouver. Aucun profil personnel consulté, aucun `src/` ou `electron/` modifié.

## Reproduire

Sources `outils/campagnes-de-recette/nephilim{,-personnages,-scenario,-recette}.mjs`,
`nephilim.test.ts`, `vitest-nephilim.config.mts`, `emballer-nephilim.mjs` et
`e2e/campagneDeRecetteNephilim.spec.ts`.

1. `node outils/campagnes-de-recette/nephilim.mjs`
2. `npx vitest run --config outils/campagnes-de-recette/vitest-nephilim.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/nephilim/verification-archives.json`
3. `npm run build` puis `npx playwright test e2e/campagneDeRecetteNephilim.spec.ts`
4. `node outils/campagnes-de-recette/verifier-visuels.mjs nephilim` ; inspecter les rendus.
5. `node outils/campagnes-de-recette/emballer-nephilim.mjs`

L’emballage refuse des rapports incomplets ou portant les empreintes d’autres archives.
Manifestes datés du 25/10 : instant fixe commun des données de recette ; livraison le 26/10.
