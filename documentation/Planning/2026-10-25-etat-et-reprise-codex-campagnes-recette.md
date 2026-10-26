# État et reprise — campagnes de recette, 25/10/2026

Lire le [bilan](2026-10-25-campagnes-de-recette.md) et le registre § 178.
David demande des données de test complètes, d’abord Cthulhu Hack, avec PJ pour Thomas D.,
Marie C. et Lucas R. Les « modules externes » sont les outils GM-OS autour du pilote.

Livraison dans `output/campagnes-tests/cthulhu-hack/` : trois `.gmos`, le pilote 1.1.0,
59 cas avec attendus, CSV vierge, trois tables, médias, rapports et ZIP complet. Sources
dans `outils/campagnes-de-recette/`, test Electron dédié dans `e2e/`.

13 contrôles de données et lint ciblé réussis ; import natif, trois joueurs partagés,
30 PJ, remise à zéro d’un laboratoire, persistance et trois tablettes vérifiés.
**La recette Electron ne passe pas entièrement** : secrets `gmSecrets` des séances transmis
aux tablettes. Rapport `verification-electron.json`, cas GM-05, registre § 1 bis.
Aucune correction de `src/`/`electron/` dans ce travail. Demander GM-OS fermé avant de corriger.

**Précision de David le 25/10 : les trois joueurs de test existent déjà.** Export fourni :
`Export Dirvers/RDD_campagne_gmos_1792944586235.gmos`. Identifiants uniquement : Thomas D.
`p-1`, Marie C. `p-2`, Lucas R. `p-3`, relevés dans `cthulhu-hack-joueurs.json` avec empreinte
de la source. Les trois archives sont régénérées avec ces joueurs ; aucun PJ RDD n’y est copié.
L’e2e sème des profils/anciens PJ entièrement fictifs portant ces identifiants et vérifie leur
conservation avant/après remplacement et rechargement. Le rapport Electron porte les SHA-256
des archives effectivement essayées ; l’emballage refuse un rapport périmé.

Pièges : AdmZip en jsdom requiert le même Uint8Array que les Buffer natifs ; le test local
l’explicite. Le corpus jetable doit inclure le moteur HTML et les correspondances ; router
le port standard des fiches vers le serveur jetable. Les jets CH sur tablette passent par
`data-jets-de-la-fiche`, et non `data-panneau-de-jet`. Les anciens JSON de logs PowerShell
peuvent être UTF-16 ; ne jamais imprimer les trames complètes en assertion.

Reprendre les essais humains avec le cahier, ou réparer GM-05 séparément. Ne pas confondre
les 59 cas livrés avec 59 cas validés. Aucun commit/push demandé. Conserver les modifications
préexistantes de prompts Stitch et du guide tablette 62, ainsi que les autres fichiers locaux.

## Suite du 25/10 — NOC, même joueurs et une Cabale

Demande de David après son import CH : campagne NOC et **« n’oublie pas de créer une cabale »**.
[Bilan NOC](2026-10-25-campagne-recette-noc.md), registre § 179. Lot dans
`output/campagnes-tests/noc/` : enquête **Le neuvième timbre**, Cabale **Les Veilleurs du Palier**
sur `Campaign.groupe`, trois Contacts/Faveurs, 3 PJ principaux, deux laboratoires (12+3 PJ),
62 cas manuels. Même rattachement p-1/p-2/p-3, aucun PJ RDD ou CH copié.

Sources `noc.mjs`, `noc-scenario.mjs`, `noc-recette.mjs`, `archives-de-recette.mjs`,
`noc.test.ts`, config Vitest NOC, `emballer-noc.mjs`, e2e dédié. L’outil `verifier-visuels.mjs`
accepte maintenant l’argument `noc`, garde CH par défaut. 14 contrôles de données réussis ;
36 SVG et trois WAV décodés hors ligne, trois rendus inspectés. Les recharges de Cabale sont
essayées dans le profil jetable, pas dans le profil personnel. Le paquet exige les rapports
natifs complets et les empreintes des archives. GM-05 transversal reste distinct et signalé.
Les modifications préexistantes du guide 53, apparues pendant cette suite, restent à leur auteur.

Recette NOC terminée : 3 jets, 3 pistes Vécu, 3 petites Faveurs reçus du vrai Hub ; recharge
Cabale 3/2/2, Contacts 2/2/2, Technique/Capital 3 et Menace 0 ; trois anciens PJ conservés au
rechargement. **Seule l’assertion GM-05 échoue** (12 chemins), comme CH. ZIP final : 72 entrées,
environ 1,17 Mo. Les 62 cas humains restent vierges. Aucun commit/push.

Piège payé dans la recette : NOC engage par défaut le plafond des dés ; le bouton « plus »
est donc parfois désactivé. Réduire via « moins » avant de demander un dé. Un 10 attend
« Garder ce résultat » ou un dé supplémentaire avant d’envoyer le résultat final au meneur.
Ne pas confondre ce choix en attente avec une panne de synchronisation. Le lancement Electron
exige la sortie du bac à sable Windows ; profils/sauvegardes/corpus restent jetables. Les
avertissements écrits sur stderr peuvent faire remonter une erreur PowerShell malgré une
construction Vite terminée ; le journal de build est dans `tmp/noc-recette-build.log`.
Les guides CH/Dune/RdD/Symbaroum apparus modifiés pendant cette suite n’ont pas été touchés.
