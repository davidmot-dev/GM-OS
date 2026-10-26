# Campagnes de recette Rêve de Dragon — 26/10/2026

David : « tu peux faire une campagne Reve de Dragon rattaché au même Joueurs, n’oublie pas
de créer des modules so nécessaire et d’utiliser la table TMR ». À la question carte officielle
du module ou rencontres Table-OS, réponse : **« Les deux »**. Registre § 181.

## Livraison

`output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-Campagnes-de-recette.zip` :

- **01-Le-Moulin-des-heures-oubliees.gmos**, fiction originale : Liseron des Gués pour Thomas D.
  `p-1`, Ambre des Saules pour Marie C. `p-2`, Oriel Trois-Ponts pour Lucas R. `p-3`. Haut-rêvants
  avancés de recette, valeurs choisies et recalculées par R0 ; aucune prétention de budget novice.
- **02-Corps-Repos-et-Progression.gmos** : neuf personnages B01–B09, fatigue, Endurance nulle,
  blessure légère/grave/critique, coma, chance, moral, réserves basses et récupération.
- **03-Haut-Reve-et-TMR.gmos** : trois personnages T01 rêve 1, T02 refoulement 2, T03 rêve 20.
  Pas d’effet de Dragon, voyage ou opération de débit lancé au chargement.

Enquête : **12 PNJ, 8 lieux, 12 indices, 16 scènes et 4 actes, 3 rencontres préparées, 4 séances,
9 pages Wiki, 8 lots de butin** ; lettre, plans et témoins offrent des pistes redondantes. Trois
issues : accord, réparation ou retour à pied, sans passage magique obligatoire. Deux laboratoires
indépendants, **15 nouveaux PJ** au total aux mêmes joueurs existants ; leurs anciens PJ restent
dans leurs campagnes. Seuls noms/identifiants de l’export fourni ont été repris, aucun contenu
de la campagne RDD personnelle.

36 SVG documentaires et trois WAV synthétiques originaux de quatre secondes, quatre moments
Storyboard, trois sons et deux pistes, trois lumières sans appareil renseigné. Scénario du gardien,
**69 cas manuels avec attendus**, CSV vierge, parcours TMR, rapports et pilote **2.0.0** inclus.

## Les deux usages des TMR

**Le module existant `rdd-tmr` suffit** : données v2 dans chacune des trois archives, préparées
par ses commandes réelles. Demi-rêves principaux sur **G4 Sanctuaire Blanc**, **J4 Collines
d’Encre**, **D13 Cité Sordide**. Préparation MJ privée pour chacun ; aucun sort en réserve ni
effet fictif ajouté pour meubler le carnet. Révélation et arbitrage explicites au gardien.

La **carte officielle couleur 900 × 1000, 189 cases**, vient de l’asset existant du module
(`outils/reve-de-dragon/tmr/images/carte-officielle.jpg`, crédits dans `CREDITS.md`). Elle est
chargée par le vrai Hub ; elle n’est ni redessinée ni recopiée dans le paquet.

**Table-OS : 14 fichiers JSON**, un par terrain, générés depuis les bornes/noms/forces/effets
du moteur **`src/modules/dice/systemes/hautReve.ts`**, relu contre le livre 2.3.1 p. 183 le 24/10.
Sept colonnes pour quatorze terrains, couverture 1–100. D’abord d7 de rencontre, puis d100 et
force séparée. Les tables ne paient pas les ressources ni ne résolvent la maîtrise. Importer dans
un univers de recette via **Table-OS → Atelier → Ranger tel quel** ; elles ne voyagent pas dans
Nexus. Le module possède aussi son tirage privé existant ; aucun second moteur de règles créé.

`PARCOURS-TMR.md` guide la montée de Liseron (12→11 rêve, 0→1 fatigue), une rencontre Messager
sur d100 25 au sanctuaire, puis G4→H4 (rêve 11, fatigue 2), une sortie et les essais des autres PJ.
Le raccord aux fiches fait les débits ; la carte n’est pas une seconde réserve de ressources.

## Contrôles effectués et limites

**19 contrôles de données réussis** : trois manifestes et médias intègres, liens de fiction,
calculs R0, santé/blessures R2 et coma, états TMR, quinze PJ distincts, remappage des clones.
Les **1400 résultats des tables** ont été comparés au moteur via le vrai parseur Table-OS,
sans trou ni chevauchement. Le Messager de contrôle peut être laissé passer sans coût additionnel.
Lint ciblé sans erreur ; configuration Vitest ignorée par le lint conformément à son périmètre.

**Electron isolé** : import des trois archives, remplacement d’un laboratoire, conservation des
profils/avatars et trois anciens PJ fictifs ; enquête préservée, 18 PJ persistés dont sentinelles.
Trois tablettes **360/768/1180 px**, trois jets reçus au MJ, trois fiches HTML et trois ouvertures
de TMR ; image officielle décodée. Trois montées réellement payées via le pupitre ; Liseron
déplacé en H4 avec deux reçus conservés au rechargement et sans nouveau débit. Rencontre privée
publiée puis résolue avant déplacement ; aucune préparation MJ ni demi-rêve d’autrui reçu par
le joueur. Fermeture de séance coupe les accès et interrompt les voyages, positions conservées.
36 SVG et trois WAV décodés hors ligne, rendus et captures inspectés.

**Seule l’assertion GM-05 échoue** : douze chemins de secrets de séance dans les trames joueur,
défaut transversal connu (§ 1 bis). Pas de correction dans `src/` ou `electron/` dans ce chantier.
**Les 69 cas de David restent NON TESTÉS**, y compris les cinq pages complètes du livret,
l’ensemble des mécanismes, l’import global Table-OS et les périphériques physiques.

## Reproduire et reprendre

Sources : `outils/campagnes-de-recette/rdd{,-scenario,-modules,-recette}.mjs`, `rdd.test.ts`,
`vitest-rdd.config.mts`, `emballer-rdd.mjs` ; test `e2e/campagneDeRecetteRdd.spec.ts`.

1. `node outils/campagnes-de-recette/rdd.mjs`
2. `npx vitest run --config outils/campagnes-de-recette/vitest-rdd.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/reve-de-dragon/verification-archives.json`
3. `npm run build` puis `npx playwright test e2e/campagneDeRecetteRdd.spec.ts`
4. `node outils/campagnes-de-recette/verifier-visuels.mjs reve-de-dragon` ; inspection visuelle.
5. `node outils/campagnes-de-recette/emballer-rdd.mjs`

Le paquet refuse les rapports incomplets ou d’une autre empreinte. Aucun profil personnel
consulté, aucune installation, aucun commit/push demandé. Reprendre les essais humains avec
le cahier ; réparer GM-05 dans un chantier distinct, après confirmation que GM-OS est fermé.
