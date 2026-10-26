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
