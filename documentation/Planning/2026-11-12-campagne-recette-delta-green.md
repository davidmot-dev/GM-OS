# Delta Green — Les dossiers de la pluie

Demande de David : « GM-OS Campagnes de test pour Delta Green », le 12/11/2026.
Méthode du plugin 0.2.0, une campagne complète et ses ateliers dans un seul `.gmos`.

**PRÉPARÉE — import natif Electron et Hub réseau NON EXÉCUTÉS.**

- [ZIP complet](../../output/campagnes-tests/delta-green/Delta-Green-Les-dossiers-de-la-pluie-Recette.zip).
- [Campagne unique](../../output/campagnes-tests/delta-green/01-Delta-Green-Les-dossiers-de-la-pluie.gmos).
- [Guide d’import](../../output/campagnes-tests/delta-green/LIRE-MOI.md), [cahier des 36 cas](../../output/campagnes-tests/delta-green/CAHIER-DE-RECETTE.md), [états de référence](../../output/campagnes-tests/delta-green/ETATS-DE-REFERENCE.md).

Pilote **2.0.1** conservé à l’identique : `custom-1794500163201`, fiche
`tpl-1794500163202`, 164 champs. Original dans
[`Export Dirvers/corriges/Delta-Green-2.0.1.gmos-driver`](../../Export%20Dirvers/corriges/Delta-Green-2.0.1.gmos-driver).
Vérifier/remplacer explicitement un ancien pilote, puis importer le seul `.gmos` en **Tel quel**.

## Histoire et ateliers

Fiction originale : des archives impossibles conduisent à un centre de conservation dont les
enregistrements imitent les morts. Protéger les témoins, garder des preuves et contenir les copies
offre trois fins : confinement surveillé, destruction avec mémoire expurgée, repli et suivi.
Douze séances préparées, quatre actes, 36 scènes de fiction, réactions et conséquences ouvertes.

Nouveaux héros : Nora Bell à Thomas D. `p-1`, Sarah Vann à Marie C. `p-2`, Eli Mercer à Lucas R.
`p-3`. Trois profils aux valeurs choisies, aucune création novice certifiée. Trois `[RECETTE]`
distincts et réservés aux ateliers ; dix PNJ originaux, douze lieux et douze pièces documentaires.
Les seuls noms et IDs du relevé autorisé sont réutilisés, aucun ancien PJ ou avatar copié.

Dans Trame → **ATELIERS DE RECETTE — hors fiction** : R1 jets/critiques, R2 PV/combat,
R3 VOL/SAN/Attaches, R4 fiche/restauration locale, R5 import/médias/liaison. Les 36 cas et le CSV
restent **NON TESTÉS**. La matrice distingue natif, manuel, absent et à vérifier.
Restauration **manuelle des seuls champs d’essai** ; Nexus Remplacer concerne toute la campagne.

## Vérifications et limites

59 essais Vitest réussis : manifeste natif, liens, types, vrais jets du personnage, arrondi PV,
fonctions du moteur, pupitre, caviardage GM-05 complet/partiel et injection Nexus en mémoire sur
sentinelles fictives (anciens PJ/avatars conservés, une seule campagne ajoutée). Restauration
locale par `updateCharacter`, note de fiction et SAN du héros conservées après sérialisation en
mémoire ; aucun rechargement sur disque revendiqué.

Structure acceptée par l’outil portable. 25 images et un WAV de quatre secondes décodés hors
ligne dans Edge headless jetable ; planches des douze plans et douze pièces, document en pleine
taille et bannière examinés. Plans sans échelle et signal synthétique, aucune écoute humaine
revendiquée. Les médias sont embarqués. Le lien NotebookLM du pilote source est conservé,
sans téléchargement et sans dépendance pour les médias de campagne.

Les 18 fiches du corpus restent `relu: false` : pas de nouvelle relecture intégrale du livre.
Le cahier reprend les pages vérifiées lors du pilote pour les jets et attributs dérivés ; il
signale les règles manuelles à confirmer. Aucun module spécialisé compatible, aucune extension
inventée. L’inconscience à 2 PV reste une limite de l’affichage générique, à constater au cas
SAN-03. SAN, rupture, Attaches, accoutumance, létalité, soins et progression sont arbitrés.

Import natif, rechargement réel, trois Hub 360/768/1180 px, matériel et recette humaine
**NON EXÉCUTÉS**. Aucun service démarré, paquet installé, profil privé utilisé ou fichier
`src/`/`electron/` modifié. Aucune commande git d’écriture pour cette demande.

## Reproduction

Sources : `outils/campagnes-de-recette/delta-green*.mjs`, `delta-green.test.ts`, configuration
`vitest-delta-green.config.mts`. Générer, lancer Vitest avec `--maxWorkers=4`, vérifier les médias,
examiner les rendus et consigner leurs SHA avant `delta-green-verifier.mjs --emballer`.
Le ZIP contient le générateur et le vérificateur ; le rapport et la provenance portent sur le
SHA du `.gmos` effectivement livré.
