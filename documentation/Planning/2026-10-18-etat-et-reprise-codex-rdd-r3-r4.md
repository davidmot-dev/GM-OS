# RdD — R3 ouvrages et R4 repos, 18/10/2026

David : **« Commence R3 et R4 »**, puis **« Non, GM-OS est fermé. »** avant les écritures
dans `src/`. Base : commit poussé `94e0aaed`, R0/R1/R2 et première boucle R8. Le texte
Nephilim de la sélection IDE n'est pas la demande active. Aucun nouveau commit demandé.

## Périmètre de cette tranche

R3 : carnet de tâches conservé dans la fiche d'un porteur, y compris pour un ouvrage
collectif. Objectif, difficulté, période, temps limite et seuil négatif décidés par le gardien ;
résultats de chaque participant versés ensemble au fonds commun. Scores négatifs conservés,
−1 durable par échec total, pause/reprise, périodes d'attente comptées dans le délai,
déclaration explicite d'un ouvrage perdu. Un résultat du panneau de jet peut être conservé
et employé une seule fois dans un ouvrage. Pas de copie du même ouvrage chez chaque PJ.
Un autre participant peut être déclaré dans le carnet du porteur ; cela ne crée pas de
droits d'écriture croisés entre les personnages. Limite : 50 ouvrages par carnet, pas d'effacement
automatique d'un ouvrage terminé.
Un participant absent de la période est déclaré comme tel, sans inventer un jet échoué.

R4 : activation explicite après R2, reprise des échéances des anciennes blessures soignées,
repos éveillé par multiples de cinq minutes, sommeil complet heure par heure (120 minutes).
Endurance puis fatigue, rêve si autorisé ; aucune récupération au chargement. DDR conservé
entre tirage et aperçu ; maîtrise d'un Rêve de Dragon arbitrée à la table, avec conséquences
queues/têtes/souffles en attente. Les effets sont marqués résolus seulement sur validation.
Pas de seconde réserve dans TMR ; quitter les TMR avant de déclarer l'heure de sommeil.

Le MJ prépare puis valide les repos et bilans ; la tablette du joueur en lit le suivi et les
échéances. Le carnet de tâches et la conservation d'un jet fonctionnent aussi sur sa tablette.
Chaque opération porte un aperçu, une empreinte de la fiche et un reçu non tronqué.
Un ancien aperçu est refusé ; une opération déjà reçue n'est pas appliquée une deuxième fois.
Les opérations nouvellement enregistrées alimentent le journal du MJ. Pas de minuterie réelle.

## Règles contrôlées dans le livre 2.3.1

Même PDF privé que R0, SHA-256
`a8713e6f71b6a602624f16a71de91181f29d411d78d566c9b7c2142a7b42df07`,
dans `scratch/reve-de-dragon-r0/sources/`, ignoré par Git.

- P. 84–85 : degrés +3/+2/+1/0/−2/−4, malus durable −1, ouvrage collectif et échéances.
  Les deux exemples du livre sont testés : passerelle, 6 points en quatre périodes de
  vingt minutes ; abri, 4 points en trois périodes collectives de dix minutes.
- P. 88–90 et 92 : fatigue par segments, 1 endurance/5 minutes sans dormir jusqu'à une
  demi-Endurance, toute l'endurance en une heure de sommeil, limites des graves/critiques
  et des PV manquants. Le plafond ne retire jamais une endurance déjà supérieure.
- P. 94 : l'exemple de Brucelin confirme le minimum des plafonds, pas leur soustraction :
  Endurance 28, grave et quatre PV perdus → plafond 14 ; après disparition de la grave,
  plafond 20. La récupération d'un PV rend aussi les deux endurance/fatigue associés.
- P. 93–94, 101–102 : aucun PV récupéré avant guérison de toutes les blessures, maladie
  et poison ; premier test au lendemain de la disparition. Décoction prise de Lyre à
  Araignée, meilleure seulement ; aucun malus général sur ces tests.
- Guérison : jours 2/4/6, jour des soins exclu. Échec normal/particulier : lendemain ;
  échec total : −1 PV et nouveau délai entier ; réussite : rétrogradation et délai de la
  nouvelle gravité. Bonus de soin et d'herbe valables une fois ; soins renouvelés possibles.
- P. 187 et 206–208 : DDR = d8 dont 8 vaut zéro, chaque 7 relancé et ajouté. Rêve récupéré
  au-dessous du seuil, excédent conservé ; maîtrise réussie rend un point de seuil seulement
  s'il est inférieur à RÊVE. Zéro rêve + Dragon = échec total automatique ; dépassement
  du triple du seuil = rêve zéro et souffle à résoudre. À Château Dormant, −1 rêve s'il
  reste supérieur au seuil, **après le stress**.

Rendus de contrôle dans `scratch/reve-de-dragon-r34/pdf-*.png` ; pages 92, 94 et 101
relues visuellement. Le corpus de synthèses n'est pas pris pour source de barèmes.

## Bilan de nuit et limites

La journée de suivi est **la journée en cours**, dont on valide la fin. Exemple : soins
pendant la journée de suivi 1 → légère testée à la fin de la journée 3, grave en fin de
journée 5. Un bilan fait ensuite avancer la journée d'une unité. Les nuits ont un nom/date
unique, conservé sans troncature ; pas de saut de plusieurs jours ni de liaison automatique
avec Clock-OS. Les anciennes échéances sont renseignées ; ne pas inventer la date des soins.

L'assistant rappelle les étapes du livre p. 87. **Stress, famine, moral, chance et enchantements
restent manuels dans cette tranche**, à confirmer explicitement, sans implémenter R5/R6/R7
en chemin. Stress et famine se traitent avant l'aperçu ; contrôler moral, chance et enchantements
dans l'ordre du bilan après les guérisons. L'éligibilité PV à la première nuit se déclare à
l'activation ; elle n'est pas supposée acquise pour une atteinte qui vient juste de disparaître.
Les maladies/poisons et exceptions magiques ne sont pas un moteur médical ajouté en cachette.
Coma et hémorragies doivent être arbitrés/résolus avant un repos ordinaire.
Cette première tranche se commande depuis les fiches PJ. Les panneaux de repos et d'ouvrage
ne sont pas encore montés dans la fiche des PNJ/adversaires autonomes de Combat-OS.
La maîtrise d'un Rêve de Dragon reste un jet arbitré à la table, avec le nouvel état après
repos à prendre en compte ; le panneau n'automatise pas son jet ni les tables d'effets.

## Code

- `logic/tachesDuVoyageur.ts`, `reposDuVoyageur.ts`, `operationsDeVoyageur.ts` : fonctions pures.
- `PanneauTachesVoyageur`, `PanneauReposVoyageur`, `ValidationOperationVoyageur` : vues.
- `useOperationDeVoyageur` : aperçu et validation ; `useSuiviOuvragesEtRepos` : journal central.
- `PanneauJetVoyageur` conserve sur demande le degré effectif du résultat (sonné compris).
- `santeDuVoyageur` : échéance additionnelle lors des soins complets, retrait après rechute.
  Les anciennes blessures restent lisibles sans cette échéance jusqu'à activation R4.
- `ficheDeVoyageur` conserve les reçus et carnets inconnus d'une ancienne fiche.

Clés nouvelles réservées : `__rddTaches231`, `__rddRepos231`, `__rddJetPourTache231`,
`__rddOperationsR34231`, `__rddHistoriqueR34231`. Aucun identifiant de pilote, modèle ou
champ imprimé modifié. Les reçus et jets utilisés sont limités explicitement à 10 000 ;
historique affiché limité à 60, sans retirer les preuves de validation.

## Vérifications

Suite complète : **8 249 tests réussis, 4 ignorés ; 685 fichiers réussis, un ignoré**.
Après les derniers garde-fous (absence d'un participant, éligibilité PV à la première nuit,
ressources avant/après détaillées, paramètres verrouillés pendant aperçu, échéance longue
indépendante de la borne du score) : **55 tests ciblés réussis sur six fichiers**. La suite
complète n'est pas relancée après ces modifications ciblées.

**Six parcours E2E réussis en 2,4 minutes**, profils isolés : R0, R1, R2, R3/R4, carte TMR
et raccord avec reprise froide. R3/R4 passe en 21,7 secondes ; le parcours vérifie carnet
collectif, malus permanent après échec total, sélections réinitialisées, jet conservé depuis
la tablette et refus de sa réutilisation, validation MJ du repos, guérison, attente d'un jour
avant PV, et reçus/journal sans double application après rechargement PC/tablette.
Après la dernière correction de validation des échéances longues, construction de nouveau
réussie et **parcours R3/R4 rejoué sur le paquet final : 22,2 secondes, réussi**.

Types et construction réussis. Lint global : **1 916 fichiers, zéro erreur**, unique avertissement
préexistant dans `useSaisieDifferee.ts:46`. Aucun nettoyage de ce fichier hors chantier.
`git diff --check` sans erreur, hors avertissements habituels de fins de ligne.

Recette `e2e/ouvragesEtReposVoyageur.spec.ts`, semences et profils jetables ; toutes les instances
de test sont fermées. Captures relues sur PC, tablette 820 et téléphone 360 ; trois images
copiées au manuel : `jeu-reves-de-dragons-taches.jpg`, `…-repos.jpg`, `…-chateau-dormant.jpg`.
Sorties et logs dans `scratch/reve-de-dragon-r34/`.

R0 consolidé et son export restent inchangés, aucun réimport requis. Les nouvelles métadonnées
passent par le schéma JSON réservé RdD déjà livré dans R8. Les feuilles imprimées ne changent pas.

Après les commits de Claude (`73484fc4` notamment), registre et page 53 sont redevenus
propres : seules les lignes RdD sont alors actualisées avec ce lot. Aucun fichier Nephilim
modifié. Aucun paquet installé, aucun accès aux données personnelles, aucun commit ni push.

## Suite et essais de David

Dans une fiche PJ R0 reprise : **Ouvrages et points de tâche**, puis **Repos et Château Dormant**
après activation R2. Première tranche utilisable, non commitée/non poussée. Vérifier en partie
le porteur du carnet collectif et le bilan manuel des étapes R5/R6/R7 ; étendre ensuite le
raccord aux PNJ/combattants autonomes et aux opérations encore manuelles si David le choisit.
R8 garde la même frontière : moteur/réserves dans GM-OS, carte et carnet dans le module externe.

**Demande suivante de David, 18/10/2026 : « ok ca marche commit ».** Après les indications
d'activation du module, David confirme le fonctionnement de **TMR**. Cette confirmation ne
prétend pas valider manuellement tous les cas R3/R4. Le commit local R3/R4 est demandé ;
aucun nouveau push demandé. Les mentions « non commitée » ci-dessus décrivent l'état avant
cette demande ; le journal Git fait foi après le commit.
