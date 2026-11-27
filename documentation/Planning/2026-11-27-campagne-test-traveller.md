# Traveller — La Part des absents

Demande de David du 27/11/2026 : « Traveller », via **GM-OS Campagnes de test**.

## Livraison

**LOT PRÉPARÉ**, sans recette humaine ni import dans la fenêtre Electron.

**Testé par David le 27/11/2026** : « la campagne de test aussi est testée » (registre général § 279).
Les limites ci-dessous décrivent l'état à la livraison.

- [ZIP complet](../../output/campagnes-tests/traveller/Traveller-La-Part-des-Absents-Campagne-de-test.zip), contenant **un seul `.gmos`** et le pilote 2.0.0 séparé.
- [Campagne à importer](../../output/campagnes-tests/traveller/01-Traveller-La-Part-des-Absents.gmos).
- [Guide d’import](../../output/campagnes-tests/traveller/LIRE-MOI.md), [campagne du meneur](../../output/campagnes-tests/traveller/CAMPAGNE-DU-MENEUR.md), [62 cas](../../output/campagnes-tests/traveller/CAHIER-DE-RECETTE.md), [états de référence](../../output/campagnes-tests/traveller/ETATS-DE-REFERENCE.md).
- [Rapport](../../output/campagnes-tests/traveller/RAPPORT-DE-VERIFICATION.md), [limites](../../output/campagnes-tests/traveller/ANOMALIES-CONNUES.md), [preuve d’emballage](../../output/campagnes-tests/traveller/verification-emballage.json).

L’équipage du Noctule livre des filtres à des habitats déclarés évacués mais toujours occupés.
L’enquête porte sur une fraude aux livraisons et aux droits d’amarrage, avec des moyens de secours,
des contrats et des témoins à protéger. Traverse de Sel, lieux et intrigue sont originaux, sans
position canonique imposée ni scénario publié repris.

Douze séances prévues, quatre actes de 36 scènes, dix ateliers séparés ; trois héros nouveaux pour
Thomas D. `p-1`, Marie C. `p-2`, Lucas R. `p-3`, et trois profils `[RECETTE]`. Douze dossiers de PNJ,
un opposant narratif et deux cibles d’essai ; dix lieux, 26 indices, cinq pages Wiki, deux rencontres,
quatre fins et les séances 4/5 jouables dans les deux ordres. Les profils sont aux valeurs choisies,
pas des créations novices certifiées. 49 médias embarqués : 46 SVG schématiques originaux, la bannière
Traveller et deux signaux WAV synthétiques. Les cartouches ne sont pas des portraits illustrés.

## Import et ateliers

Vérifier d’abord le pilote **Traveller 2.0.0**, identifiant `custom-1795725795907`, gabarit
`tpl-1795725795907`. Le pilote joint est identique à
[`Export Dirvers/corriges/Traveller-2.0.0.gmos-driver`](../../Export%20Dirvers/corriges/Traveller-2.0.0.gmos-driver).
Un remplacement d’un pilote plus ancien reste une action explicite du meneur, puis il importe
l’unique campagne. Les anciens PJ et avatars ne sont pas recopiés.

Dans la Trame, ouvrir **ATELIERS DE RECETTE — hors fiction** : jets ; difficultés/Effet ; santé ;
combat/bestiaire ; fiche/finances ; saut ; commerce/mondes ; PSI/dangers ; progression ; import/secrets.
Les ateliers ne sont pas des passages obligatoires de l’histoire. Chaque cas donne son profil, son
repère et ses valeurs. Restaurer les seuls champs d’essai ; **Nexus Remplacer réimporte toute la
campagne**, pas un atelier. Les témoins de fiction et DEX 10 de Nora sont conservés par l’essai local.

## Vérifications réalisées

`node outils/campagnes-de-recette/traveller-executer-tests.mjs` : **121 contrôles ciblés réussis**
(quatre fichiers, `--maxWorkers=4`), liés au SHA du `.gmos` :

- manifeste natif, dépendances inchangées, 333 champs, santé/MD et inventaires construits par les fonctions réelles ;
- jets depuis les champs du pilote, compétences vides/0, Polyvalent, spécialités/Profession, six Effets, chaîne, dés gardés, durée et simultanéité ;
- coups, soins et incapacitante par `handleApplyImpact` du magasin : après 10 dégâts, END/FOR/DEX 0/3/8 et Physique 11 ; soin de 4 → 2/5/8 et Physique 15 ; créature à PdV 6→4→5 ;
- correspondance HTML pure aller-retour de 328 clés, champs internes conservés ;
- injection Nexus **en mémoire** : une seule campagne ajoutée, anciens PJ/avatars sentinelles fictifs conservés, sauvegarde construite validée ;
- restauration Cash JET 1000→750→1000 et sérialisation, note narrative et Nora conservées ;
- GM-05 et indices : projections pures, marqueurs fictifs retirés, partage du seul indice de recette ; pas une preuve de transport réseau.

`node outils/campagnes-de-recette/traveller-verifier.mjs` : structure partielle du plugin acceptée,
49 médias aux SHA vérifiés, 47 images rendues, zéro débordement SVG, deux WAV décodés de quatre secondes.
Six planches et les rendus complets du saut, du relais et de la route relus ; fiction et fins relues.
Le corpus existant **relu 21/21** est réutilisé ; aucune nouvelle relecture intégrale du PDF annoncée.

`node outils/campagnes-de-recette/traveller-livrer.mjs` : ZIP relu, **une campagne**, 41 fichiers et
40 empreintes de contenu vérifiées. Le SHA du `.gmos` est
`cea275bada5294581da97f31d9bdbc76d1a1907ff60fd23dca2d9167c3cc0689`.

## Limites et reprise

**Non exécutés** : import/sauvegarde/rechargement Electron, fiche HTML dans Electron, Hub
360/768/1180, transport des jets, droits visibles, tablettes physiques, matériel, IA/TTS, écoute
humaine et partie. **62 cas humains NON TESTÉS**. Aucun service réseau ni paquet installé,
aucun profil personnel consulté, aucun fichier `src/` ou `electron/` modifié.

Le calcul des dégâts d’attaque reste au MJ ; saut, commerce, codes de mondes, dangers, progression
et dépenses PSI sont manuels selon la matrice. Aucun module compatible Traveller dans le catalogue.
Le dossier Noctule 200 t/saut 1 est un exemple technique, pas une fiche de bataille spatiale complète :
préparer celle-ci avec le livre si cette option facultative est choisie. Les codes UWP sont des
choix de fiction explicités, pas un tirage certifié. Les maxima PSI/Rads du pilote restent le sujet
déjà signalé au § 278, sans correctif ici.

Reprendre par l’import du fichier unique dans une instance jetable autorisée, puis JET-01,
SAN-01, FIC-01 et PER-01. Les recettes de génération et de vérification sont dans
`outils/campagnes-de-recette/traveller*.mjs`, `traveller.test.ts` et `vitest-traveller.config.mts` ;
elles sont aussi jointes sous `reproduction/`. Toute régénération invalide les preuves liées au SHA
précédent. David a demandé le **commit de ce lot le 27/11/2026**, après sa livraison. Le commit
précédent `52d3620f` ne couvrait que la livraison GM-OS Studio du 26 novembre.
