# État et reprise — campagnes de recette, 26/10/2026

Suite de la [note CH/NOC du 25/10](2026-10-25-etat-et-reprise-codex-campagnes-recette.md).
David a demandé successivement ALIEN puis Rêve de Dragon, mêmes joueurs ; pour RdD, **« Les
deux »** signifie carte officielle TMR et rencontres dans Table-OS. Pas de délégation,
installation, changement de pilote, `src/` ou `electron/`, profil personnel, commit ou push.

## Livraisons

- [ALIEN](2026-10-26-campagne-recette-alien.md), registre **§ 180**, vue **116** :
  `output/campagnes-tests/alien/Alien-Campagnes-de-recette.zip`, trois `.gmos`, pilote 1.9.0,
  scénario Orphée, 15 nouveaux PJ, MU/TH/UR/M314/spatial préparés, 74 cas manuels.
- [Rêve de Dragon](2026-10-26-campagne-recette-rdd.md), **§ 181**, vue **117** :
  `output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-Campagnes-de-recette.zip`, trois `.gmos`,
  pilote 2.0.0, Moulin original, 15 nouveaux PJ, rdd-tmr v2, 14 tables et 69 cas manuels.

Thomas `p-1`, Marie `p-2`, Lucas `p-3` repris du seul relevé déjà autorisé de l’export RDD.
Pas de PJ ni de contenu de leur campagne personnelle recopié. Les tests sèment des avatars
et anciens PJ **fictifs** pour vérifier la fusion Nexus et leur conservation.

## Ce qui a été éprouvé

ALIEN : **17 contrôles de données**, imports/remplacements et persistance, trois jets et
fiches HTML, neuf ouvertures de modules aux largeurs 360/768/1180, READ mission, objectif
privé à Eli, scan Gaine et ordre spatial. Modules privés filtrés ; accès coupés en fin de séance.

RdD : **19 contrôles**, dont 1400 tirages des 14 tables comparés au moteur ; données R0/R2,
clones de demi-rêves, import/remplacement et persistance. Trois Hub/HTML/jets, carte officielle
900 × 1000, trois montées réellement payées, rencontre privée, G4→H4 et deux reçus durables.

36 SVG et 3 WAV par lot décodés hors ligne ; rendus et captures inspectés. Les deux tests
Electron **finissent en échec uniquement sur GM-05**, 12 chemins chacun ; anomalie du § 1 bis
reconfirmée. Ce n’est pas un échec du filtrage des modules. Ne pas maquiller la recette en verte.
Les 74/69 cas humains restent tous NON TESTÉS pour David. L’import global Table-OS et ses
appareils se testent sur son poste ; les tables ne voyagent pas dans Nexus.

## Sources et pièges payés

`outils/campagnes-de-recette/alien*.mjs`, `rdd*.mjs`, tests/configs dédiés ;
`e2e/campagneDeRecetteAlien.spec.ts` et `campagneDeRecetteRdd.spec.ts`. Le vérificateur de
médias accepte CH/NOC/alien/reve-de-dragon. Chaque emballage exige les empreintes des archives
réellement importées et tous les indicateurs natifs ; il garde GM-05 dans les rapports.

- Node 24 : importer les modules TypeScript applicatifs **dynamiquement après** le hook de
  résolution `charger-typescript.mjs`. Une importation statique est liée avant ce hook.
- PowerShell reconnaît l’apostrophe typographique comme un guillemet : ne pas l’insérer dans
  une chaîne simple. Pour écrire un script Node, here-string avec `$OutputEncoding` UTF-8.
- Hub : fermer l’overlay de fiche par `getByTitle('Fermer la fiche')` ; son nom accessible
  est « Retour ». Le jet ALIEN a trois sélecteurs, Stress compris ; RdD en a deux.
- Bibliothèque en mode Atelier pour les remplacements ; n’activer la séance qu’après les
  imports, sinon la navigation est renvoyée au cockpit.
- Tests Electron/Edge parfois impossibles en bac à sable Windows : demandes d’exécution
  escaladées ciblées, profils/corpus/sauvegardes/ports jetables et réseau externe bloqué.

Reprendre avec les cahiers ou GM-05 séparément (demander GM-OS fermé avant tout correctif).
La synthèse de tous les pilotes et le registre sont actualisés ; conserver les modifications
préexistantes des guides 53/54/62, des prompts Stitch et les autres exports/corpus locaux.

## Commit demandé le 26/10

David demande ensuite **« commit »** : regrouper les quatre lots de recette CH/NOC/ALIEN/RdD,
leurs générateurs, tests, livraisons et documentation. Les autres fichiers locaux, notamment
les tables importées dans les bases globales, restent hors de ce commit. Aucun push demandé.
Les validations et le défaut GM-05 restent tels que décrits ci-dessus.

**Puis push explicitement demandé et terminé** : `96ef674e` sur `origin/production`.
Hook réussi : types, lint (un avertissement préexistant), 9 150 tests réussis / quatre ignorés,
construction de production. Les autres fichiers locaux restent hors commit.

## Suite du 26/10 — Dune, Maison et conflits

Nouvelle demande : campagne Dune, mêmes joueurs, modules si nécessaire. [Bilan Dune](2026-10-26-campagne-recette-dune.md),
registre **§ 182**, vue **118**. **Le Sceau de Néréide**, Tarek/Thomas, Lysa/Marie, Kaël/Lucas,
Maison Vaëlan mineure ; deux laboratoires (principes/défaite/progression, puis cinq arènes avec
variante Grande Maison), 15 nouveaux PJ, 66 cas manuels, trois tables originales et 39 médias.
Module **dune-conflits existant**, trois états embarqués, pas de nouveau module nécessaire.
Lot `output/campagnes-tests/dune/Dune-Campagnes-de-recette.zip`, sources `dune*.mjs`, tests/config
dédiés, `emballer-dune.mjs`, e2e `campagneDeRecetteDune.spec.ts`.

**21 contrôles de données réussis**, lint ciblé sans erreur, 36 SVG/3 WAV décodés hors ligne,
rendus/captures inspectés. Import natif/remplacement des deux laboratoires et persistance,
anciens profils/avatars/PJ fictifs conservés ; trois Hub, jets, fiches PJ/Maison et écritures
de progression HTML 1/2/3 persistées. Menace 3 explicitement fixée, désir de Nalia révélé au
second succès d’enquête reporté, atout déplacé, accès fermés après clôture. **Seul GM-05
échoue** (12 chemins), sans correctif applicatif. Les 66 cas humains restent NON TESTÉS.

Piège payé par la relecture des captures : le sélecteur de la fiche Maison accepte **Mineure**,
pas « Maison mineure » ; le champ Haine d’un ennemi est numérique. Données corrigées en
Mineure et 2, contrôle de types/options des 40 champs ajouté et parcours natif rejoué sur
les SHA corrigées. Ne pas changer les clés ou la fiche HTML pour accommoder des données fausses.
La fiche Maison fait foi ; aligner le reflet du module à la génération avec `maisonDepuisLaFiche`.

Talents non préconfigurés pour isoler le socle ; aucun talent improvisé ni PV ajoutés. Atouts
personnels et partagés sont des représentations distinctes. Les cinq arènes passent le moteur,
leurs conflits joués intégralement restent une recette humaine. Aucun commit/push demandé
pour ce nouveau lot ; aucun changement de `src/`/`electron/`, aucun profil personnel consulté.

## Suite du 26/10 — Nephilim et Sciences occultes

Nouvelle demande : campagne Nephilim, mêmes joueurs et modules si nécessaire. [Bilan Nephilim](2026-10-26-campagne-recette-nephilim.md), registre **§ 183**, vue **119**. Le Méridien de verre :
Astérion/Thomas (Magie), Ismérie/Marie (Kabbale), Nahal/Lucas (Alchimie), trois Simulacres et
Pentacle descriptif. Deux laboratoires, quinze nouveaux PJ, 70 cas manuels, trois tables
originales et 39 médias. Aucun module spécifique compatible dans le catalogue : cartes natives
et outils transversaux préparés, aucune extension supplémentaire créée.

**26 contrôles de données réussis**, lint ciblé sans erreur, 36 SVG/3 WAV décodés hors ligne,
rendus/captures inspectés. Import natif et remplacement de 02, anciens profils/avatars/PJ
fictifs conservés ; trois Hub/HTML/jets, Sapience 14/15/16 persistée et Traque 1 → 0/Intensité
1 → 2 après quatre ajouts explicites à RK 5. **GM-05 seul échec (12 chemins)** ; aucun correctif
applicatif. Les réserves joueur sont dans la fiche ouverte : ne pas la fermer avant leurs gestes.

Les Vécus/époques viennent du référentiel ; trois pouvoirs originaux sont marqués RECETTE,
profils avancés sans budget novice revendiqué. Six cases Combat-OS ne remplacent pas la carte
Santé complète ; contextes occultes manuels au bandeau. 70 cas humains NON TESTÉS, sept pages
entièrement éditées et matériel à éprouver. ZIP output/campagnes-tests/nephilim/, sources
nephilim*.mjs, tests/config dédiés, emballer-nephilim.mjs, e2e campagneDeRecetteNephilim.spec.ts.
Aucun src/electron ou profil personnel touché ; Dune et Nephilim non commités/non poussés.

## Commit et push demandés — Dune et Nephilim

David demande « commit et poussse » le 26/10 : regrouper les deux nouveaux lots Dune/Nephilim,
leurs générateurs, tests, livraisons et documentation sur production. Les autres fichiers locaux
restent hors commit. Les validations ciblées et le défaut GM-05 restent décrits ci-dessus ;
le hook de push effectue la validation globale du dépôt.
