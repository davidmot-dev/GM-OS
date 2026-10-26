# Campagnes de recette Dune — 26/10/2026

David : « tu peux faire une campagne de Dune rattaché au même Joueurs, n’oublie pas de créer
des modules si nécessaire ». Suite des quatre lots CH/NOC/ALIEN/RdD, commités et poussés sur
`production` au commit `96ef674e`. Ce cinquième lot reste non commité, sans demande de commit/push.
Registre § 182. Aucun changement de pilote ou de code applicatif.

## Livraison et import

`output/campagnes-tests/dune/Dune-Campagnes-de-recette.zip`, trois archives Nexus :

- **01-Le-Sceau-de-Nereide.gmos** : campagne originale, **Tarek Senn / Thomas D. p-1**,
  **Lysa Vaëlan / Marie C. p-2**, **Kaël Rovan / Lucas R. p-3**. Monde Néréide et Maison
  Vaëlan fictifs ; concession détournée, preuves redondantes et trois issues : expertise,
  accord ou remise en service. Pas d’intervention d’un personnage canonique imposée.
- **02-Principes-Defaite-et-Progression.gmos** : neuf PJ P01–P09, Détermination 0/3,
  principe bafoué/récupéré, vaincus mineur/notable et points pour la progression.
- **03-Conflits-et-Maison.gmos** : trois PJ C01–C03, plateau physique abstrait, équipe
  militaire et variante Grande Maison ; Impulsion 6, Menace 9. Même module, arènes/modes
  choisis explicitement par le MJ selon l’essai.

**15 nouveaux PJ** ajoutés aux mêmes joueurs existants ; seuls les noms/identifiants du relevé
déjà autorisé de l’export RDD sont repris. Pas de campagne personnelle recopiée, aucun accès
au profil personnel. Réinitialiser le laboratoire avec **Remplacer**, sans réinitialiser 01.

Enquête : **12 PNJ, 8 lieux, 12 indices, 16 scènes / 4 actes, 3 rencontres préparées, 4 séances,
9 pages Wiki, 8 lots de butin** ; scénario du MJ et **66 cas manuels avec attendus**, CSV vierge.
36 SVG documentaires, trois WAV synthétiques originaux de 4 s, quatre moments Storyboard,
sons/musique et trois lumières sans appareil. Trois tables 1d6 originales séparées, import via
**Table-OS → Atelier → Ranger tel quel** dans un univers de recette.

## Maison et module

**Maison Vaëlan** déjà remplie sur `Campaign.groupe.sheetData` : type **Mineure**, monde,
devise, domaines, armoiries SVG, rôles, ennemi Sareth et **Haine numérique 2**, valeur de recette.
La fiche HTML fait foi, conformément à la décision du 25/10. Le module tient le reflet de
nom/monde/type/domaines/rôles/ennemis ; alliés et atouts de Maison restent au module.

Le module existant **`dune-conflits`**, données v1, suffit : cinq zones, six atouts, liens
réciproques, dispositions et désirs privés, une zone et un atout cachés. 01 est préparé en
**Intrigue/Architecte**, 03 en **Escarmouche/Agent** sur des lieux physiques de laboratoire.
`MODULES-ET-MAISON.md` guide aussi Duel, Espionnage et Guerre, sans prétendre à cinq conflits
intégralement joués. Les joueurs consultent le plateau ; seul le MJ commande.

Début de séance : Maison mineure × trois présents = Menace 3 ; variante Grande Maison = 9.
Saisir le nombre effectivement présent : le formulaire du module peut ouvrir sur quatre.
L’ouverture du pupitre ne doit pas remettre les réserves à zéro.

PJ : compétences/principes 4–8, trois maximes aux principes 6+, spécialisations et atouts
personnels. Talents volontairement non préconfigurés pour isoler le socle, à ajouter après
vérification du livre/prérequis. Défaite en horloge réelle du moteur, sans PV ou mort automatique.
Profils et états choisis pour recette, sans revendication d’un budget de création novice.

## Vérifications

**21 contrôles de données réussis** : manifestes et médias intègres, liens, fiches et défaite
sans PV, types/options des **40 champs de Maison** compatibles avec la fiche HTML, maximes
et spécialisations, trois modules valides et alignés avec la Maison. Désir de Nalia : 4/6 après
le premier succès d’Analyse 6, révélé au second (8/6). Projection joueur filtrée, déplacement
adjacent, temporaire retiré en nouvelle scène, tangible récupéré. Cinq arènes/deux modes
acceptés par le moteur ; achats/récupération réels sur le laboratoire ; clone et tables valides.
Lint ciblé sans erreur ; 36 SVG et trois WAV décodés hors ligne, rendus inspectés.

**Recette Electron isolée**, sur le build de production validé lors du push précédent : import
des trois archives, conservation des profils/avatars et trois anciens PJ fictifs, remplacement
des deux laboratoires, persistance de l’enquête. Trois Hub **360/768/1180 px**, trois jets
finalisés reçus au meneur, trois fiches PJ et trois fiches Maison ; maximes visibles et trois
écritures de progression depuis HTML. La relecture visuelle a décelé le mauvais libellé
« Maison mineure » (le sélecteur attend **Mineure**) et une Haine en texte (champ numérique) :
données corrigées, contrôle des 40 champs ajouté, recette native rejouée sur les nouvelles SHA.

La recette vérifie aussi la Menace 3, la confidentialité des marqueurs du plateau, la révélation
du désir après deux enquêtes **reportées explicitement comme réussies**, un atout déplacé,
les valeurs de progression 1/2/3 persistées et les accès révoqués en clôturant la séance.
**GM-05 reste le seul échec** : douze chemins de secrets de séance dans les messages joueur,
comme les quatre autres lots ; l’assertion demeure en échec. Le rapport joint est la preuve
datée des contrôles et porte les SHA des archives effectivement importées.

**Les 66 cas humains restent NON TESTÉS par David**, ainsi que les appareils et conflits
complets. Aucun correctif de `src/`/`electron/`, aucun module supplémentaire créé.

## Reproduire

Sources `outils/campagnes-de-recette/dune{,-scenario,-modules,-recette}.mjs`, `dune.test.ts`,
`vitest-dune.config.mts`, `emballer-dune.mjs` ; `e2e/campagneDeRecetteDune.spec.ts`.

1. `node outils/campagnes-de-recette/dune.mjs`
2. `npx vitest run --config outils/campagnes-de-recette/vitest-dune.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/dune/verification-archives.json`
3. `npm run build` puis `npx playwright test e2e/campagneDeRecetteDune.spec.ts`
4. `node outils/campagnes-de-recette/verifier-visuels.mjs dune` ; relire les images.
5. `node outils/campagnes-de-recette/emballer-dune.mjs`

L’emballage refuse un rapport incomplet ou portant les SHA d’une autre génération. Les dates
du 25/10 des manifestes sont l’instant fixe commun des données de recette ; livraison le 26/10.
