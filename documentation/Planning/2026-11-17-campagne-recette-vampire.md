# Vampire V5 — Le registre des absents — 17/11/2026

Demande de David : **GM-OS Campagnes de test pour Vampire**. Registre § 260, ligne 196.
Méthode du plugin `gmos-campagnes-tests` 0.2.0 et procédure locale `campagne-de-recette`.

**Lot préparé ; conformité globale non acquise, import réel et recette humaine non exécutés.**

## Livraison

- [Lot ZIP complet](../../output/campagnes-tests/vampire/Vampire-Le-registre-des-absents-Recette.zip), 3 008 071 octets, une seule campagne.
- [Campagne à importer](../../output/campagnes-tests/vampire/01-Vampire-Le-registre-des-absents.gmos).
- [Lire-moi et ordre d'import](../../output/campagnes-tests/vampire/LIRE-MOI.md).
- [Guide du meneur](../../output/campagnes-tests/vampire/CAMPAGNE-DU-MENEUR.md), [cahier des 53 cas](../../output/campagnes-tests/vampire/CAHIER-DE-RECETTE.md), [états de référence](../../output/campagnes-tests/vampire/ETATS-DE-REFERENCE.md), [rapport](../../output/campagnes-tests/vampire/RAPPORT-DE-VERIFICATION.md).
- Pilote inchangé : [Vampire-2.0.0.gmos-driver](../../Export%20Dirvers/corriges/Vampire-2.0.0.gmos-driver), également fourni séparément dans le ZIP. Le lot ne remplace pas automatiquement un ancien pilote.

La chronique originale se déroule à Valombre : des identités administratives sont effacées pour
transformer la protection en dette. Douze séances prévues, quatre actes de fiction, trente-six
scènes, indices par plusieurs voies, réactions adverses, conséquences et trois familles de fins.
Le Registre est un système de fichiers et de faveurs fictif, sans pouvoir magique ajouté aux règles.

Trois nouveaux PJ rejoignent les joueurs autorisés Thomas D. (`p-1`), Marie C. (`p-2`) et Lucas R.
(`p-3`) : Nadir Bellamy, Alma Delcourt et Sacha Morel. Trois autres profils sont réservés aux essais.
Les valeurs sont des profils avancés de préparation, pas des créations novices certifiées ; choix
des pouvoirs et de prédation à finaliser au livre. Dix PNJ de fiction et un opposant de recette.
Aucun ancien personnage ni avatar personnel recopié.

Un cinquième acte **ATELIERS DE RECETTE — hors fiction** ouvre directement six ateliers : jets,
Volonté, Sang, corps, morale et liaisons. Les 53 cas sont tous **NON TESTÉ** dans le CSV de départ.
Restaurer les seuls champs du profil de recette selon les états fournis : **Nexus Remplacer agit
sur toute la campagne**, pas sur un atelier.

Les 33 médias embarqués comprennent douze plans schématiques sans échelle, douze documents,
six cartouches typographiques de PJ, la bannière du pilote et deux signaux WAV synthétiques de
quatre secondes. Les cartouches ne sont pas des portraits illustrés. Aucun module Vampire
spécialisé compatible ; aucun module fictif créé.

## Vérifications et anomalie

**105 contrôles automatisés : 104 réussites, un échec de conformité VAM-A01 conservé.**
Le rapport Vitest reste en échec ; le vérificateur d'emballage autorise uniquement ce constat
nommé et refuse tout autre échec. Le code applicatif n'a pas été corrigé dans ce chantier.

VAM-A01 : avec `defaultHealthType=boxes`, sans `casesDeSante`, `naissanceDansLeJeu` appelle
`HealthInterpreter.createDefault` et crée **cinq cases génériques**. Pour CORPS, Vigueur 3,
`santeDeDepart` et le livre exigent **six**. L'archive conserve exactement la naissance native,
avec Santé 6 dans la fiche, et expose l'écart au cas COR-02 et dans l'assertion dédiée.
Cela s'ajoute au suivi V5 superficiel/aggravé `/ X` encore manuel.

Contrôles exécutés sur l'archive livrée : manifeste natif, empreintes et références de tous les
médias, liens, types et bornes des 137 champs ; fonctions réelles de jets, relances, Exaltation
et Compulsions ; correspondance HTML de 135 champs ; caviardage ; injection Nexus en mémoire
avec conservation d'anciens PJ et avatars sentinelles ; restauration locale sérialisée sans
changer le héros ni la note de scène témoin. Utilitaire portable du plugin accepté, validation
structurelle partielle. Les 31 images et deux WAV se décodent hors ligne ; rendus relus, aucune
écoute humaine revendiquée.

**Non exécutés** : import Electron, sauvegarde/rechargement réel, Hub réseau aux trois tailles,
réception et droits réels des jets, matériel, IA et TTS. Aucun service lancé, aucune donnée privée
lue. Ces contrôles en mémoire ne constituent pas une validation de la persistance réelle.
Remords, frénésie, prédation, régénération, liens et progression restent arbitrés à la table.

## Reproduction et empreintes

Depuis la racine du dépôt, sans installer de paquet ni lancer GM-OS :

```powershell
node outils/campagnes-de-recette/vampire.mjs
node outils/campagnes-de-recette/vampire-executer-tests.mjs
node outils/campagnes-de-recette/vampire-verifier.mjs
```

Le dernier emballage exige une relecture consignée pour la même empreinte d'archive. Sources,
configuration et vérificateur portable sont aussi dans `reproduction/` du ZIP. Le test de
conformité ne fait pas partie de la suite générale du produit : configuration ciblée dédiée.

- Campagne SHA-256 : `a674890257e6e86789ebffca640ac7fa2b3908dce7a3c1131a8e26d6dcc2db85`.
- Pilote SHA-256 : `623e7dec0b94aac576005d568247af462379a13bb802dedf4397b7861f42fc0b`.
- ZIP SHA-256 : `61e3ddb9d3ee8b9e5f801eea1fac105b0e874a288e47f6c88f7330ed18b19efc`.

Sources de reproduction sous `outils/campagnes-de-recette/vampire*`. Aucun changement dans
`src/` ou `electron/`, aucun commit ou push demandé pour ce nouveau lot. Travaux Alien/Delta Green
et exports préexistants laissés intacts.
