# Registre des améliorations de Crimes

**Ouvert le 19/10/2026**, à la demande de David : « consigne cela dans un registre
d'amélioration de Crime ».

Ce registre porte les états, priorités, dépendances et décisions des améliorations du pilote.
L'[audit du 19/10](2026-10-19-crimes-propositions.md) conserve les preuves techniques,
les références au livre et les consultations de NotebookLM. L'avancement se met à jour **ici**.

**État général (23/10/2026) : C0 livré (corpus relu en entier) ; C1, C2, C3, C5 et C6 livrés et essayés par David ; C4, C7 et C8 à planifier.**
Les priorités et l'ordre ci-dessous sont proposés par Codex ; David a choisi C0 et C1, puis C2 et C3, puis C5 et C6, le 22/10.

## Référence et acquis

Référence de l'audit : dépôt `b2437ed8` et export corrigé
`Export Dirvers/corriges/Crime_driver_gmos_relie.gmos-driver`, identique à l'état JSON voisin.
Sources : *Crimes 2 - Manuel de l'Enquêteur* fourni sur CLOUDDAVID et deux consultations du
[carnet NotebookLM Crimes](https://notebooklm.google.com/notebook/d0f433f5-7b16-46c3-acf4-4c88c5b5ac2c),
limitées à ce manuel. Les réponses ont été confrontées au PDF ; les ambiguïtés ne sont pas
des règles acquises. Chemins, pages et preuves figurent dans l'audit.

La fiche HTML `crimes-fr` est déjà intégrée au gestionnaire v13 et raccordée au pilote.
David a validé son fonctionnement. Sa validation technique passe sans erreur ni avertissement.
Le pilote corrigé comporte 12 sections et 203 champs : compétences, spécialisations,
styles, indices, contacts et jauges. Thème, bannière et identité d'images existent aussi.
Depuis le 22/10, l'export de travail est `Export Dirvers/Crime_driver_gmos_1792659707276.gmos-driver`
(même fiche : 12 sections, 203 champs), corrigé en `corriges/Crime_driver_gmos_garde.gmos-driver`.
Ces acquis sont à préserver ; la présence d'un champ ne signifie pas que sa règle est automatisée.

## Lots et états

| Lot | Priorité proposée | Amélioration et résultat attendu | État |
| --- | --- | --- | --- |
| **C0** | 0 - préalable | **Corpus fiable** : relire les 19 fiches de règles, corriger les contradictions et retirer les traces d'outils ; distinguer règles, options et arbitrages du MJ. | **Livré le 23/10** (registre général § 160, [trace](2026-10-23-relecture-corpus-crimes.md)) : les 19 fiches relues contre le livre et corrigées, `relu: true` ; options rendues aux options ; mort à −2 sourcée comme consigne au meneur (p. 393) ; contradictions du livre exposées. |
| **C1** | 0 | **Potentiel GARDE Compétence** : lancer les d10, choisir les dés conservés, garder les 1 obligatoires, appliquer les spécialisations et restituer les quatre bilans, dont la réussite mitigée. Depuis le 22/10, la revue de la Forge signale la difficulté de 9 réussites sur une réserve de 0 dé (registre général § 148). | **Livré le 22/10** (§ 157) : moteur `potentielGarde.ts`, panneau (fiche et tablette), Forge, pilote `Crime_driver_gmos_garde`, page du manuel ; l'exemple p. 385 vérifié. **Essai de David validé le 22/10** |
| **C2** | 1 | **Potentiels et atteintes** : distinguer base/actuel, fatigue/épuisement/blessures ; relier les valeurs actuelles aux jets, aux récupérations et aux soins. | **Livré le 22/10** (registre général § 158) : Potentiel actuel au jet, carte des atteintes avec la règle de remplacement (p. 395), Fin de scène et Bonne nuit, compteurs sur la fiche HTML. Restent les dégâts du combat (C6). **Essai de David validé le 22/10** |
| **C3** | 1 | **Dépassement** : conserver des réussites supplémentaires obtenues, appliquer leur coût en fatigue et suivre l'usage par scène et les conditions narratives. | **Livré le 22/10** (§ 158) : annonce avant le jet (p. 385, choix documenté face aux exemples p. 407), réussites restées dehors gardées contre une fatigue chacune, un seul par scène. La passion se juge par le meneur ; les tests psychotiques (C4) restent à exclure. **Essai de David validé le 22/10** |
| **C4** | 1 | **Psychologie** : relier seuils et événements d'Angoisse, Névrose, Psychose et Innocence ; préparer les tests psychotiques et les conséquences à valider. | À planifier |
| **C5** | 1 | **Dossier d'enquête** : suivre les cinq styles par affaire, scènes, indices, témoins, preuves et seuils ; gérer les informations cachées/découvertes/partagées. | **Livré le 22/10** (registre général § 159) : points par style sur le compteur de la fiche, seuils et gains des indices, révélation à un seul (sa seule tablette) puis partage, origine gardée, « Nouvelle affaire ». Restent les scènes et témoins rattachés à l'affaire, et la Névrose des rivalités (C4). **Essai de David validé le 22/10** |
| **C6** | 2 | **Combat et armes** : compléter initiative et oppositions, relier portées, protections, munitions, incidents et blessures ; corriger les tranches tactiques incohérentes. | **Livré le 22/10** (§ 159) : armes du livre, opposition par réussites adverses, dégâts du livre écrits en marques sur la cible, portée utile/maximale, incidents rappelés, tranches tactiques corrigées. Restent la carte de combat sur le Physique actuel, localisations et manœuvres, tir multiple et munitions décomptées, initiative narrative. **Essai de David validé le 22/10** |
| **C7** | 2 | **Contacts et fortune** : distinguer influence/loyauté, base/actuel, services et relations ; relier niveau/piste de fortune et suivi d'équipe aux règles vérifiées. | À planifier |
| **C8** | 2 | **Création et progression** : assister budgets, âge, rangs, spécialisations, seuils et dépenses de développement ; vérifier les bornes selon le contexte. | À planifier |

## Ordre proposé et dépendances

**C0 → C1 → C2/C3 → C4 → C5**, puis C6-C8.

C0 fiabilise les règles utilisées par tous les lots. C1 demande un mode de conservation
des dés dans le moteur partagé : changer seulement l'export JSON ne suffit pas. C2 alimente
les jets avec le potentiel actuel ; C3 dépend de C1 et C2 pour sélectionner les réussites
et appliquer la fatigue. C4 utilise notamment les jets de C1. C6 réutilise C1, C2 et les
conséquences psychologiques pertinentes. C7-C8 réutilisent les mêmes valeurs et événements.

Le dossier C5 peut être conçu plus tôt, mais ses automatismes doivent partir des règles
relues. Il apporte le suivi le plus spécifique à Crimes. Les déductions restent aux joueurs
et les révélations au MJ.

## Cas d'acceptation

| Lot | Vérification attendue |
| --- | --- |
| **C0** | Les 19 fiches ont une relecture tracée et des références vérifiées. Les points d'enquête ne deviennent pas une monnaie générique, la mort à -2 n'est pas inventée, les bilans respectent les 1 et les traces d'outils sont retirées. |
| **C1** | L'exemple p. 385, `[1,3,4,6,8]`, compétence 2, seuil 8, garde `[1,8]` et donne une réussite mitigée. Zéro réussite reste un échec. Sélection, spécialisations et 1 obligatoires sont cohérents sur les écrans et dans le journal. |
| **C2** | Une fatigue diminue le prochain jet sans changer la base. La fin de scène retire la fatigue sans effacer les blessures ; le repos traite l'épuisement selon ses règles. Les valeurs existantes sont préservées. |
| **C3** | Seules les réussites supplémentaires réellement obtenues sont proposées ; chacune coûte une fatigue dans le potentiel utilisé. L'usage par scène et les exceptions de combat sont suivis. |
| **C4** | Le seuil de Névrose déclenche la proposition correcte, sans double application ; le test psychotique utilise son seuil propre et interdit le dépassement. Les effets narratifs sont validés par le MJ. |
| **C5** | Une action utile crédite le bon style. Un seuil signale l'indice au MJ sans le révéler au mauvais public. Le partage conserve l'origine de la pièce ; aucune hypothèse n'est automatiquement validée par l'outil. |
| **C6** | L'arme détermine sa portée et ses conséquences. Les oppositions et protections suivent les règles relues ; l'initiative narrative et les égalités restent possibles. |
| **C7** | Solliciter un contact modifie sa loyauté actuelle sans effacer sa base ; la fin de scénario restaure ce qui doit l'être. Une mise en relation ponctuelle ne crée pas un contact permanent. Niveau et piste de fortune restent distincts. |
| **C8** | Les budgets et achats sont expliqués, validés et historisés une seule fois. Les bornes distinguent création, progression et effets de l'Innocence ; l'assistant préserve les personnages existants. |

Points à trancher dans les lots concernés : procédure sans compétence et excès de 1 sur le
quota (C1), annonce du dépassement avant/après les dés selon les passages du manuel (C3),
seuil de fortune (C7), limites des potentiels et sens des compteurs imprimés (C8).
Ne pas résoudre ces points par une extrapolation de NotebookLM.

À chaque réalisation : mettre à jour ce registre, citer les fichiers et éventuels commits,
indiquer les vérifications et distinguer contrôle technique et essai de David. Documenter
les fonctions réellement livrées dans le manuel des jeux et la future page `54-Jeu-Crimes`,
avec les captures prévues par `e2e/capturesDesJeux.spec.ts`. Couvrir les vues MJ et joueur,
y compris les tablettes, pour les gestes exposés sur plusieurs écrans.

## Historique et reprise

| Date | Auteur | Décision ou événement |
| --- | --- | --- |
| 19/10/2026 | David | Demande d'analyse du pilote Crimes avec le manuel sur CLOUDDAVID et NotebookLM. |
| 19/10/2026 | Codex | Audit consigné, propositions C0-C8 et défaut du moteur reproduit en lecture seule. Aucun code applicatif modifié. |
| 19/10/2026 | David | « consigne cela dans un registre d'amélioration de Crime » : création du présent registre ; aucun lot de développement choisi. |
| 22/10/2026 | David | « oui on va sur crime C0, C1 » ; périmètre accepté : C0 limité aux trois contradictions et aux traces d'outils, C1 complet hors dépassement, oppositions et pupitre. |
| 22/10/2026 | Claude Code | C0 ciblé et C1 livrés (registre général § 157) ; Névrose dite, pas écrite (C4). Réimport et essai de David attendus. |
| 22/10/2026 | David | « on peut quand même faire c2 ? », puis « Ok commence et si possible fais aussi c3 ». |
| 22/10/2026 | Claude Code | C2 et C3 livrés (§ 158) ; fiche HTML retouchée (neuf compteurs, moteur de fiches version 15) ; pilote `Crime_driver_gmos_c2-c3`. |
| 22/10/2026 | David | « On peut faire c5 et c6 […] ? Si oui vas y » ; choix : indice à l'enquêteur seul puis partage, points sur le compteur de la fiche, combat « armes, dégâts, portée ». |
| 22/10/2026 | Claude Code | C5 et C6 livrés (§ 159) ; pilote `Crime_driver_gmos_c5-c6`. |
| 22/10/2026 | David | « ok C1 à C6 est testé » : essai validé de C1, C2, C3, C5 et C6. |
| 23/10/2026 | David | « on va commencer par C0 ». |
| 23/10/2026 | Claude Code | C0 livré : 19 fiches relues et corrigées, trace dans `2026-10-23-relecture-corpus-crimes.md` (§ 160). |
| 23/10/2026 | David | « J'ai relu ce rapport, c'est bien » : C0 validé ; les corrections proposées sont reportées dans la synthèse des pilotes (C0.1 à C0.4) ; « je voudrais finir complètement Crime aujourd'hui ». |

Avant une reprise, vérifier l'export courant et les acquis depuis cet audit. Appliquer
AGENTS.md, notamment la question « GM-OS tourne-t-il ? » avant toute édition de `src/`
ou `electron/`. La consignation n'engage aucun développement.

Le registre général est déjà modifié par un autre travail : il reste intact pour respecter
l'écrivain unique. Le présent fichier fait référence pour l'avancement des améliorations
de Crimes ; son lien pourra être ajouté au registre général après coordination.
