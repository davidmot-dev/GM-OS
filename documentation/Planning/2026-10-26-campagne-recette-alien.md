# Campagnes de recette ALIEN — 26/10/2026

David : « tu peux faire une campagne Alien rattaché au même Joueurs, n’oublie pas de créer des
modules (détecteur, etc...) ». Suite de CH et NOC, registre § 180. Aucun changement du pilote
ou de l’application : données pour les trois modules existants, pilote ALIEN **1.9.0**.

## Livraison

`output/campagnes-tests/alien/Alien-Campagnes-de-recette.zip` ; trois archives Nexus :

- **01-La-derniere-releve.gmos** : enquête originale **La dernière relève d’Orphée**, Eli Voss
  pour Thomas D. `p-1`, Mara Chen pour Marie C. `p-2`, Samir Hale pour Lucas R. `p-3`.
- **02-Corps-Panique-et-Survie.gmos** : neuf personnages, Paniques réelles 7/10/13, synthétique
  et humain Brisés, réserves basses, Stress élevé, privations/radiations, progression Campagne.
- **03-M314-Terminal-et-Vaisseaux.gmos** : trois personnages, batterie 1, combat spatial
  engagé avec armement de laboratoire explicitement fictif sur les deux modèles du catalogue.

Enquête : 12 PNJ, 8 lieux, 12 indices, 16 scènes, 4 actes/séances, 3 rencontres, 9 pages Wiki,
8 lots de butin. **15 nouveaux PJ** au total aux mêmes joueurs, sans copier leurs anciens PJ.
36 SVG documentaires et 3 WAV originaux de quatre secondes ; Storyboard, sons, musique,
lumières non affectées à des appareils ; trois tables originales Table-OS à importer séparément.
Scénario, guide des modules, **74 cas manuels avec attendus**, CSV vierge et rapports dans le lot.

## Modules embarqués

- **MU/TH/UR 6000**, données v5 : trois opérateurs, mission, dossier à code CARGO-17, dossier
  administrateur privé, trois actes et neuf objectifs non remis, quatre protocoles, préréglage.
- **Détecteur M314**, v4 : huit zones métriques réciproques, sept pions, Eli porteur et batterie
  5 dans l’enquête. Pions statiques/non détectables/hors portée de contrôle. Trois Tours
  déterminés : Gaine, Coursive, Mess. Aucun scan ni effet sonore actif au chargement.
- **Combat spatial**, v2 : Iskra (CM-90S Corvus) et Vautour (Bison), équipages et postes, un
  préréglage. Vautour sans transpondeur, contact non identifié. Enquête civile non engagée ;
  laboratoire 03 engagé et armé pour éprouver les actions.

États préparés et validés par les moteurs existants ; UUID internes normalisés pour les
archives reproductibles. Aucun module privé inventé, aucune écriture dans le profil personnel.

## Vérifications réellement faites

**17 contrôles de données réussis** : manifestes, SHA-256/médias, liens, Santé/Force, Paniques,
validation des neuf états de modules, filtrage des objectifs et secrets, parcours M314 trois
Tours, spatial, remappage des clones, tables et cahier. Lint ciblé sans erreur. Construction
de production réussie avant l’essai natif.

**Electron en profil/corpus/sauvegardes/ports jetables** : import des trois archives, conservation
de profils/avatars et trois anciens PJ fictifs p-1/p-2/p-3 ; remplacement des laboratoires
sans modifier la fiche ni le terminal de l’enquête ; persistance des 18 PJ, dont sentinelles.
Trois vrais Hub **360/768/1180 px**, trois jets reçus au MJ, trois fiches HTML, neuf ouvertures
de modules ; READ mission, remise d’un objectif privé à Eli, scan M314 Gaine, ordre spatial de
verrouillage reçu. Préparations privées des modules filtrées ; accès révoqués après clôture.
36 SVG/3 WAV décodés hors ligne ; rendus et captures inspectés.

**Le test Electron finit en échec uniquement sur GM-05** : 12 chemins de `gmSecrets` de séance
reçus par les tablettes, défaut transversal déjà inscrit au registre § 1 bis. Le rapport et
l’assertion gardent cet échec visible ; aucune correction de `src/` ou `electron/` glissée ici.
**Les 74 essais humains restent NON TESTÉS**, ainsi que périphériques et matériel de David.

## Reproduire

Sources : `outils/campagnes-de-recette/alien{,-scenario,-modules,-recette}.mjs`, `alien.test.ts`,
`vitest-alien.config.mts`, `emballer-alien.mjs`. Test `e2e/campagneDeRecetteAlien.spec.ts`.

1. `node outils/campagnes-de-recette/alien.mjs`
2. `npx vitest run --config outils/campagnes-de-recette/vitest-alien.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/alien/verification-archives.json`
3. `npm run build` puis `npx playwright test e2e/campagneDeRecetteAlien.spec.ts`
4. `node outils/campagnes-de-recette/verifier-visuels.mjs alien` ; inspecter les rendus.
5. `node outils/campagnes-de-recette/emballer-alien.mjs`

L’emballage refuse un rapport incomplet ou portant une autre empreinte d’archive. Pièges du Hub :
le jet Alien possède trois sélecteurs (Attribut, Compétence, Stress) ; fermer la fiche par
`title="Fermer la fiche"` avant la navigation. Aucun commit/push demandé pour ces lots.
