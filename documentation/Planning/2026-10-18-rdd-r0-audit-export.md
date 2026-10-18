# Rêve de Dragon — R0, audit de l'export du 18/10/2026

> **Suite réalisée :** [consolidation R0 et export complet](2026-10-18-etat-et-reprise-codex-rdd-r0.md).
> Les copies partielles ci-dessous sont l'historique de l'audit, pas le dernier livrable.

Suite du registre § 141 et de la [reprise TMR](2026-10-18-etat-et-reprise-codex-tmr-sources.md).
David demande « on reprend ce qu'il faut faire sur Rêve de Dragon », confirme « Non, GM-OS
est fermé », puis indique avoir fait l'export. L'archive retrouvée est bien **Rêve de Dragon**.
**Édition de référence choisie par David le 18/10 : « Version 2.3.1 ».** Les synthèses
citant 2.2 servent de pistes de lecture ; les corrections doivent être vérifiées dans le livre 2.3.1.

## Source effectivement lue

- `Export Dirvers/RDD_driver_gmos_1792322034805.gmos-driver`, export du 18/10 à 11:13:54 UTC.
- SHA-256 : `fa8450cb35af77c9ec4422c40a0c50805f834700e5dc725386f4a44819ff2666`.
- Pilote : `custom-1777730495114` ; fiche : `tpl-1777730495195`.
- Archive contenant `manifest.json` et `state.json` ; aucune entité de campagne.
- Fiche : **16 sections, 117 zones, 106 identifiants uniques**.

Aucune lecture des magasins personnels, aucun lancement de GM-OS. La présence de cet export
remplace la limite « export absent » des analyses antérieures, qui restent historiques.

## Constats confirmés dans le code actuel

| Point | Export observé et effet vérifié | Traitement |
| --- | --- | --- |
| Vie au combat | `vie=11`, `vie_max=11`, mais `santeDeDepart="Taille + Constitution"`. Sans lien `max`, `santePrincipaleDeLaFiche` rend 11/22 pour Taille 9, Constitution 13. | Lier `combat.statsToTrack[0].max` à `vie_max`. Aucune formule de règle remplacée. |
| Plafonds des ressources | `endurance_max` et `reve_pts_max` existent, mais les ressources du pilote ne les citent pas. Les cartes peuvent utiliser les valeurs par défaut du modèle à leur place. | Lier les deux `statsToTrack.max` aux champs existants. |
| Difficulté inutilisée | La cible est `reves-de-dragons`, avec un second `jet.difficulte` 0–100 ignoré ; le panneau le masque quand `cible` existe. | Retirer uniquement le réglage mort, comme le recommande la Forge. |
| Doublons | 11 identifiants répétés ; `age` existe en texte et en nombre, `endurance` en nombre et en jauge. | Aucun champ supprimé ou renommé ; préparer une consolidation conservant les données. |
| Ressources parallèles | Vie : `vie` et `points_de_vie`. Rêve : `reve`, `reve_pts`, `reve_base`, `points_de_reve`. Chance : `chance` et `points_de_chance`. | Distinguer caractéristique, réserve actuelle et affichages. Ne pas supposer que des valeurs déjà saisies sont identiques. |
| Heure de naissance | `heure_de_naissance` est un `select` sans options, avec valeur initiale numérique 12 ; `heure_naissance` existe aussi en texte. | Définir les choix et le raccordement, sans renommer une clé déjà utilisée. |
| Valeurs dérivées | Mêlée, Tir, Lancer, Dérobée et les maxima sont des nombres manuels ; aucun champ `formula`. | Confirmer règles et arrondis dans le livre avant automatisation. |
| Initiative | `initiativeFormula="agilite"`, tri descendant ; aucun déroulement RdD dédié dans ce pilote. | À confronter à la procédure de l'édition retenue. |
| Difficulté du jet | Le panneau actuel propose un curseur −10 à +7 pour toutes les cibles calculées. Ce n'est pas `jet.difficulte`. | Établir la plage de difficulté voulue pour RdD avant de modifier l'interface commune, actuellement travaillée par Claude. |

Clés répétées : `age`, `taille`, `force`, `agilite`, `dexterite`, `vue`, `melee`, `tir`,
`lancer`, `derobee`, `endurance`. Ce sont des zones utilisant la même donnée, pas onze
réserves indépendantes. Les champs de ressources parallèles portent, eux, des clés différentes.
`tir_comp` est également une deuxième clé intitulée Tir : sa relation à `tir` reste à fixer.
La voie d'Oniros porte l'identifiant `onrios` : conserver cette clé lors d'une correction de libellé.

## Première copie préparée, historique, non intégrée

[Copie corrigée](../../Export%20Dirvers/corriges/RDD_driver_gmos_r0-plafonds.gmos-driver) :
`Export Dirvers/corriges/RDD_driver_gmos_r0-plafonds.gmos-driver`.

Elle applique **seulement quatre changements de configuration** :

1. `vie.max` dans `statsToTrack` → `vie_max`.
2. `endurance.max` → `endurance_max`.
3. `reve_pts.max` → `reve_pts_max`.
4. Retrait de `jet.difficulte`.

Les identifiants du pilote et de la fiche sont conservés ; le modèle de fiche est strictement
identique, tous les champs compris. La formule `santeDeDepart` est conservée : le maximum
explicitement déclaré devient prioritaire. Si le champ maximal est absent d'un ancien personnage,
le repli sur la formule existe toujours ; sa correction attend la vérification dans le livre.
Cette copie ne constitue donc pas la clôture de R0.

**Après lecture du livre, utiliser la copie `RDD_driver_gmos_r0-231.gmos-driver` décrite
ci-dessous.** Le lien de rêve de cette première copie ne doit pas être pris pour une règle
de plafond : le livre distingue explicitement seuil de récupération et maximum.

SHA-256 du premier livrable :
`9fe87ec191b313ee5337b9618ee2f4722f126b0137d0ab52cafac8d8cd7322e3`.
Une régénération change les métadonnées d'export et son empreinte.

## Contrôles et reproduction

Le [script d'audit](../../outils/reve-de-dragon/auditer-pilote.mjs) appelle les fonctions réelles
de la Forge, du combat et du jet, sans lancer l'application. Il utilise les dépendances installées.

```powershell
node outils/reve-de-dragon/auditer-pilote.mjs "Export Dirvers/RDD_driver_gmos_1792322034805.gmos-driver"
```

Un deuxième argument crée une copie corrigée, en refusant d'écraser un fichier existant.
Le rapport machine est dans `scratch/reve-de-dragon-r0/audit-r0.json`, ignoré par Git.

Vérifications effectuées :

- Export original conservé, empreinte inchangée ; nouvelle archive relue intégralement.
- Modèle de fiche identique, identifiants stables, seules les quatre modifications prévues.
- Maximum de vie 11/22 avant, 11/11 après ; plafonds endurance 23 et rêve 15 pour les valeurs
  par défaut de l'export. Ce sont des valeurs d'essai, pas une modification de personnage.
- Agilité 12, Discrétion +3, difficulté 0 : **78 %**, sans avertissement du calculateur.
- Forge : **0 erreur, 1 avertissement** avant ; **aucun diagnostic** pour la copie corrigée.
  La Forge actuelle ne signale pas les doublons : zéro diagnostic ne valide pas toutes les règles.
- À la reprise précédant la lecture de cet export : **19 tests du moteur RdD réussis**,
  références Cyol vérifiées (5 originaux, 5 extraits, 26 fonctions inchangées, 74 indexées).

Piège payé : `adm-zip.updateFile` conservait le drapeau de descripteur ZIP de l'export, et
produisait ici une archive illisible. Le script réécrit les entrées dans une nouvelle archive,
puis relit et compare son contenu avant d'annoncer un résultat.

## Reprise

L'édition 2.3.1 est confirmée et les sources sont désormais accessibles (section suivante).
Poursuivre la consolidation de la fiche
et du traitement explicite des champs parallèles déjà remplis. Aucun personnage existant ne doit
perdre une valeur au profit d'une autre sans décision visible.

R1–R2 et R8 restent les suites recommandées : fatigue/blessures, puis première boucle TMR
reliée aux ressources de la fiche. Créditer Cyol/Kroc dans les adaptations et le futur module.

**Aucune modification de `src/`, `electron/`, du pilote installé ou des données personnelles.**
Le registre, la note TMR et plusieurs fichiers de code et guides étaient déjà modifiés par
l'autre travail : laissés intacts. Le manuel décrira le pilote corrigé après intégration vérifiée.
Script et note non commités ; aucun push, paquet installé ou service réseau lancé.

## Sources primaires fournies et lues le 18/10

David précise : « le 1_Livre des Voyageurs sont les règles et le 2_Livre du Haut Reve c'est
pour la magie ». Dossier fourni :

```text
Z:\Jeux de Rôle\01. Passé\1. High Fantasy\Reve de Dragon\Rêve de Dragon - JdR\Rêve de Dragon - Livres de Règles et univers
```

Le lecteur Z: est invisible dans le bac à sable, mais accessible avec l'autorisation d'exécution
hors bac à sable pour cette lecture. Trois copies sont dans `scratch/reve-de-dragon-r0/sources/`
(ignoré par Git), sans modification des originaux :

| Fichier | Pages PDF | SHA-256 |
| --- | ---: | --- |
| `1_Livre_des_Voyageurs_2.3.pdf` | 191 | `83000ebdac11b75330b61a71d8731309e238ad1601cfdb1db9c982cebfd96178` |
| `2_Livre_du_Haut_Reve_2.3.pdf` | 153 | `92278051ef5e6b5556fa2d6cdbf74de91a4cace7fcd938688206468d028f0311` |
| `Reve_de_Dragon_2.3.1.pdf` | 510 | `a8713e6f71b6a602624f16a71de91181f29d411d78d566c9b7c2142a7b42df07` |

La compilation **2.3.1** fait foi pour les vérifications ci-dessous. Le texte complet en pages
est extrait dans `scratch/reve-de-dragon-r0/livre-231-pages.json`. Pages PDF 20, 46, 52, 92 et
121 rendues en PNG avec PDF.js et relues visuellement pour les tables de seuils, fatigue et
phases du round. La page imprimée vaut ici le numéro PDF moins un.

| Règle confirmée | Pages imprimées (PDF) | Conséquence pour le chantier |
| --- | --- | --- |
| Mêlée = moyenne Force/Agilité ; Tir = moyenne Vue/Dextérité ; Lancer = moyenne Tir/Force ; Dérobée = moyenne Agilité/(21−Taille). Arrondis à l'inférieur. | 19–20, 42 (20–21, 43) | Établir les calculs et la migration sans écraser les saisies manuelles existantes. |
| Vie = moyenne Taille/Constitution, au supérieur. Endurance = le plus grand de Taille+Constitution et Vie+Volonté. | 44–45 (45–46) | La formule de repli actuelle de vie est fausse ; l'exemple de l'export donne bien 11 PV et 23 endurance. |
| SC, sustentation, bonus dommages : tables imprimées. Encombrement = moyenne Taille/Force sans arrondi. | 45 (46) | Utiliser ces tables et cet arrondi propre, pas une même moyenne partout. |
| Huit lignes de fatigue ; deux premières en trois segments, six suivantes en un segment ; total de cases = double de l'endurance. | 50–51 (51–52) | Table d'endurance 16–30 relue visuellement ; Endurance 23 donne 46 cases. |
| Le malus de fatigue commence dès la première case de la nouvelle ligne ; toute perte d'endurance augmente la fatigue d'autant. | 88 (89) | R1 doit distinguer le premier point d'une ligne et la ligne précédente remplie. |
| Perte simultanée d'au moins deux points d'endurance : jet 1d20 sous endurance actuelle ; 20 rate toujours, 1 donne aussi de l'XP Constitution. Sonné : reste du round courant et round suivant. | 91 (92) | La formule vague « deux rounds » des synthèses est insuffisante ; R2 doit conserver le contexte du round. |
| Sept phases ; magie avant tirs, lancers et mêlée. Initiative par arme : demi-caractéristique au plancher + compétence + 1d6 + état général. Au premier engagement, priorité à l'arme la plus longue, puis rapide. | 120–121 (121–122) | `agilite` seule ne suffit pas ; ne pas prétendre corriger le déroulement par une formule globale. |
| Le seuil de rêve est un seuil de récupération, dépassable. Le seuil peut différer de RÊVE. L'éclatement survient au-delà du triple du seuil. | 206–208 (207–209) | Ne pas borner les points courants à la caractéristique RÊVE ni appeler ce seuil un maximum strict. |

### Copie affinée après lecture du livre

[Copie R0 2.3.1](../../Export%20Dirvers/corriges/RDD_driver_gmos_r0-231.gmos-driver),
SHA-256 `ccfc9ec081910250494cb889676b5fb9423f049a6bf1bdd3d30f4852cef3566c`.

Par rapport à l'original, seulement :

- `combat.santeDeDepart = "(taille + constitution) / 2"` ; le moteur arrondit déjà au supérieur.
- Liens de maximum de vie et d'endurance vers `vie_max` et `endurance_max`.
- Retrait du réglage `jet.difficulte` inutilisé.
- **Pas de nouveau lien de maximum du rêve** dans cette variante : les champs de rêve restent
  à clarifier avec une migration qui distingue caractéristique, seuil de récupération et points courants.

Les 117 zones du modèle restent strictement identiques. Original inchangé, identifiants stables,
archive relue ; Forge sans diagnostic, 11/11 PV sur l'exemple. Cinq cas de calcul de vie vérifient
les sommes paires et impaires ; le repli sans `vie_max` vérifie Taille 10/Constitution 13 → 12 PV.
Cela corrige aussi les lecteurs qui utilisent directement la formule de santé de départ.
`editionValidee: false` dans le rapport signifie que **tout le pilote n'est pas encore validé**,
pas que le choix de version reste ouvert.

```powershell
node outils/reve-de-dragon/auditer-pilote.mjs "Export Dirvers/RDD_driver_gmos_1792322034805.gmos-driver" "Export Dirvers/corriges/RDD_driver_gmos_r0-231.gmos-driver" --regles-231
```

Cette commande refuse d'écraser le livrable existant : choisir un autre nom pour reproduire.
Ne pas réimporter l'ancienne copie « plafonds » en pensant disposer de la variante sourcée.
Toujours aucune intégration dans GM-OS ni modification de `src/` ou `electron/`.
