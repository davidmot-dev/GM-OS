# Campagnes de recette NOC — 25/10/2026

David demande, après le lot Cthulhu Hack : **« tu peux faire une campagne NOC rattaché au même
Joueurs, n’oublie pas de créer une cabale »**. Les joueurs existent déjà : Thomas D. `p-1`,
Marie C. `p-2`, Lucas R. `p-3`, identifiants relevés dans l’export RDD fourni par David pour
la recette précédente. Aucun PJ RDD ni Cthulhu Hack n’est recopié.

## Livraison

Dans `output/campagnes-tests/noc/`, ZIP **NOC-Campagnes-de-recette.zip**, trois archives natives,
pilote 2.0.0, guide d’import, scénario de la Loi, cahier de **62 cas**, CSV de résultats vierge,
trois tables originales de Table-OS, médias et rapports. Sources dans
`outils/campagnes-de-recette/noc*.mjs` ; outils communs de fabrication dans
`archives-de-recette.mjs`, test Electron `e2e/campagneDeRecetteNoc.spec.ts`.

- **01-Le-neuvieme-timbre.gmos** : enquête originale dans le Bloc Vesper, inventé pour les
  essais. Soren Vale (Thomas), Daria Orlov (Marie), Naël Senn (Lucas), douze PNJ/Rouages,
  huit lieux schématiques, douze indices documentés, quatre actes et seize scènes dont quatre
  ateliers hors fiction, trois rencontres, quatre séances prévues, neuf entrées de Wiki,
  quatre repères chronologiques relatifs, inventaires, huit lots de butin et une réserve.
- **02-Seuils-et-Sequelles.gmos** : douze Héros à 4/7/9 sur les quatre jauges de péril,
  avant les seuils 5/8/10. Santé Blessures en dix cases, **aucun PV/Endurance inventé**.
- **03-Repos-Auras-et-Cabale.gmos** : trois Héros avec Soupçon 5/8/10, Extase et Lumière
  différentes, Ferveur 4, Fatigue/Bouleversement et réserves épuisées.

**Les Veilleurs du Palier** est une vraie **fiche de groupe `Campaign.groupe`**, pas un PJ
ajouté à un joueur. Sept Domaines, 28 Atouts renseignés dont une Faille à −1, sept pistes,
identité, refuge et couverture. Trois Contacts de Réseau : Nora Kelm (2 Faveurs), Vassil Dorn
(1), Mina Sel (2). Chaque laboratoire a sa propre copie indépendante de la Cabale, ses
identifiants de campagne/PJ et ses satellites. Les trois archives ajoutent **18 PJ aux trois
joueurs existants**. Leurs profils et personnages des autres campagnes sont conservés à l’import.

Les valeurs sont choisies pour la recette : ce n’est pas une procédure complète de création
par le livre. Le scénario propose trois voies vers le dénouement, un accès de rechange aux
preuves, une pression narrative et plusieurs épilogues, sans imposer un jet pour avancer.

## Outils GM-OS et limites

**39 médias originaux embarqués** par archive : 36 SVG schématiques et trois WAV synthétiques
de quatre secondes. Quatre moments Storyboard, trois pads Sound-OS, deux pads Music-OS,
trois tuiles Light-OS sans lampe assignée. Les tables de rumeurs/incidents/objets s’importent
séparément dans **Table-OS → Atelier → Ranger tel quel**.

Pas de nouveau module externe ; « modules externes » désigne les outils GM-OS autour du
pilote, selon la précision précédente de David. Bibliothèques globales, calendriers,
brouillard des cartes, sorties physiques, comptes IA/TTS et appareils restent à configurer
sur le poste. Les Auras sont appréciées par la Loi, pas mesurées sur les plans schématiques.

Pilote : `Export Dirvers/corriges/NOC_driver_gmos_2.0.0.gmos-driver`, identifiants conservés.
Le guide décrit l’ajout des dépendances manquantes et le remplacement explicite d’un ancien
pilote. Références mécaniques : [manuel NOC](../User%20Guides/54-Jeu-NOC.md),
[audit et réalisation](2026-10-25-noc-finir.md), livre de base p. 220, 231–234, 248.
Les Faveurs de Réseau suivent **Diffractions obsidionales p. 134**, source distincte.

## Vérifications

**14 contrôles de données réussis** : manifestes, empreintes, médias, renvois internes,
santé, pilote, joueurs/PJ, Cabales complètes, réserves dérivées, Faveurs et recharges,
laboratoires de seuils/entraide, clone/rejeu, trois tables et 62 cas non cochés. Lint ciblé
propre. Les 36 SVG et trois WAV sont décodés dans Edge hors ligne ; trois rendus inspectés.

Le test Electron utilise un profil, corpus, sauvegardes et ports de recette isolés. Il vérifie
l’import natif, trois joueurs préexistants avec avatars et anciens PJ fictifs conservés,
la remise à zéro isolée d’un laboratoire, la Cabale HTML, Nouveau scénario, trois tablettes,
les jets, les pistes, les Faveurs et la persistance. Le rapport d’emballage exige ces contrôles
et les empreintes des archives effectivement essayées.
Ces contrôles ont abouti : trois jets reçus, trois pistes Vécu et trois petites Faveurs écrites
depuis les tablettes (360/768/1180), 21 PJ persistés dont trois sentinelles fictives. Douze
chemins de `gmSecrets` sont encore reçus ; **l’unique assertion E2E en échec est GM-05**.

**GM-05 reste une anomalie de l’application** : `GameSession.gmSecrets` est transmis aux
tablettes, déjà constaté dans le lot Cthulhu Hack (§ 1 bis du registre). Le marqueur NOC est
fictif ; le rapport conserve seulement les chemins. Le scénario E2E ne doit pas être présenté
comme entièrement vert. Aucun correctif `src/` ou `electron/` dans cette livraison.

Les essais humains de David et le matériel physique restent à faire ; les **62 cas livrés
ne sont pas 62 cas validés**. Pour une correction applicative, demander d’abord si GM-OS tourne.

## Reproduire et reprendre

`node outils/campagnes-de-recette/noc.mjs`, puis Vitest avec
`outils/campagnes-de-recette/vitest-noc.config.mts` et `--maxWorkers=4`. Construire puis
lancer `e2e/campagneDeRecetteNoc.spec.ts` ; vérifier les médias avec
`node outils/campagnes-de-recette/verifier-visuels.mjs noc`, puis
`node outils/campagnes-de-recette/emballer-noc.mjs`.

Importer **01 → Importer telle quelle**. Les laboratoires sont facultatifs ; pour repartir de
leur état initial, réimporter seulement leur archive avec **Remplacer**. Rejouer conserve les
PJ et ne sert pas de guérison générale. Aucun import automatique dans l’application de David.
La première ouverture de la Cabale peut proposer **Créer une fiche pour Cabale** : le bouton
lie la feuille HTML aux valeurs de groupe déjà présentes ; il ne faut pas recréer ses scores.
Les modifications restent non commitées : aucun commit/push demandé pour ce lot.
