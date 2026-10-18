# Rêve de Dragon — R8, raccord aux fiches, 18/10/2026

Complément livré ensuite : [carte officielle en couleur](2026-10-18-etat-et-reprise-codex-rdd-r8-carte-couleur.md).

Suite de la [carte 0.1.0](2026-10-18-etat-et-reprise-codex-rdd-r8.md), registre § 141.
David : **« on continue »**, confirme **« Non, GM-OS est fermé. »**, puis **« continue »**
pendant la vérification. Développement autorisé ; aucun commit ou push demandé.

## Ce qui est livré dans cette tranche

**TMR reste un module externe**, hébergé par l'hôte commun. Implémentation **0.2.0**, données
**v2**, mêmes 189 cases et mêmes crédits Cyol/Kroc. Le module porte les positions, demandes,
rencontres et réserves. **Rêve et fatigue appartiennent à la seule fiche** ; le domaine GM-OS
calcule leurs coûts en réutilisant R1. Aucun nouveau pilote ou import de pilote requis.

Pour une demande, le pupitre natif présente **Prévisualiser le coût sur la fiche**. Le MJ voit
rêve/fatigue avant et après, confirme les conditions de concentration, le round et l'absence
d'exception aux coûts, puis choisit **Débiter la fiche et valider le trajet**. Une fiche R0/R1
et un modèle `reglesDeFiche: "rdd-231"` sont requis. Un aperçu périmé est refusé sans débit.
Le seuil de rêve ne plafonne jamais sa réserve. À zéro rêve, le sommeil force la sortie ;
une fatigue pleine force également la sortie. Le panneau de jet RdD bloque les actions à zéro
rêve. Aucun repos ou réveil automatique n'est ajouté.

**Les exceptions restent à la main.** Le bouton historique **Valider le trajet** atteste des
coûts déjà traités manuellement et ne débite rien. Ne pas payer manuellement puis choisir le
raccord automatique du même trajet. Rencontres, maîtrise, rounds, effets et sorts restent
arbitrés ; cette tranche ne termine pas l'ensemble R8.

## Protocole récupérable — deux stockages, une preuve

1. `engager-trajet`, commande MJ, persiste une intention privée dans le module. Les autres
   commandes pour ce PJ sont bloquées. Le joueur ne reçoit que le booléen d'écriture en cours.
2. Le raccord natif relit les ressources de la fiche et l'empreinte de l'aperçu. Le même `set`
   inscrit les coûts et un reçu `__rddRecusTMR231` dans `sheetData`.
3. `confirmerEcritureDeSession` vide le tampon, attend les écritures en vol, puis relit le reçu
   depuis IndexedDB. Une promesse résolue du stockage ne suffit pas : son ancienne API peut
   signaler une panne sans rejeter la promesse. Les gardes MJ + hydratation restent en place.
4. Un IPC natif réservé au poste MJ fait persister la nouvelle position, via la capacité
   facultative `terminerEcriture` du registre. Aucune commande réseau ou du manifeste ne peut
   produire cet acquittement. Le moteur externe n'accède pas aux magasins.

**Il ne s'agit pas d'une transaction atomique entre les deux stockages.** Une panne laisse une
intention à rapprocher. Si le reçu existe, la reprise termine le trajet sans recalculer le débit,
même si les ressources ont été corrigées ensuite. Si le reçu n'existe qu'en mémoire, la reprise
réessaie la persistance absolue des mêmes données, sans retrancher une seconde fois les coûts.

Au redémarrage, à l'import ou à la coupure générale, l'intention est conservée et marquée
interrompue. Reçu présent : confirmer le trajet en restant hors TMR. Reçu absent : annuler sans
nouvelle dépense. **Annuler si aucun débit n'a eu lieu** ne rembourse jamais un débit attesté :
ce bouton termine alors sa confirmation. Une fiche supprimée doit être restaurée pour rapprocher
l'opération ; réactiver la référence de module si elle a été retirée du pilote.

Les reçus sont conservés lors des écritures d'une ancienne fiche ou d'un ancien brouillon.
Ils ne sont pas tronqués : limite explicite de 10 000 reçus, puis refus de nouveaux débits.
Une correction manuelle reste une correction autorisée ; un reçu n'annule pas les saisies
ultérieures. Un verrou par opération évite les consommateurs simultanés dans le renderer.

## Code

- `outils/reve-de-dragon/tmr/moteur.mjs` et manifeste : v2, intention et interruption, migration
  v1 sans changement des positions/notes/historiques, acquittement pur absent des commandes publiques.
- `src/modules/session/logic/ressourcesDesTMR.ts`, `recusDesTMR.ts` : coût R1, conditions, empreinte,
  débit et reçu immuable. `ficheDeVoyageur.ts` conserve les preuves lors des écritures suivantes.
- `src/modules/modulesDuJeu/tmr/raccordDesTMR.ts` : protocole à ports injectés ;
  `raccordNatifDesTMR.ts` : connexion SessionOS, persistance et IPC ; `PupitreTMR.tsx` : aperçu et reprise.
- `PersistenceService.ts` : attend les écritures réelles puis relit, sans contourner les gardes
  historiques. Aucun changement de clé, de version ou de format de la persistance SessionOS.
- `protocole.ts`, `registre.ts`, `service.ts`, `preload.ts`, `SyncServer.ts` : acquittement natif
  borné, réservé à la fenêtre MJ, avec validation et persistance avant publication.
- `PanneauJetVoyageur.tsx` : sommeil à zéro rêve ; aucun changement du calcul des dés.
- `src/types/donneesDeFiche.ts`, `schemas.ts` : les champs imprimés restent scalaires, les clés
  réservées `__rdd…` acceptent du JSON structuré borné, sans suppression silencieuse.

## Défaut révélé par la reprise froide

`PlayerCharacterSchema.sheetData` n'acceptait que `string | number | boolean`. Une sauvegarde
contenant les métadonnées structurées RdD (R0, R2 ou reçus R8), ou le marqueur de fatigue à
`null`, était donc refusée lors du chargement. Une réhydratation IndexedDB seule ne révélait
pas ce défaut, car elle ne passait pas par le validateur d'import. Le correctif permet la
relecture des seules métadonnées réservées RdD ; il garde le contrat scalaire des autres champs.
Le JSON est borné en profondeur, nombre de nœuds et taille ; aucune donnée n'est tronquée.

Le test froid doit attendre **l'import de la semence**, pas seulement `persist.hasHydrated()` :
l'hydratation termine avant le chargement asynchrone de la sauvegarde fictive. `validateSession`
est désormais appelé aussi avant de lancer la semence de reprise de la recette R8.

## Sources et essais

Livre 2.3.1 déjà copié et rendu dans `scratch/reve-de-dragon-r0/` / `r8/` : p. 182 (montée,
accéléré et fatigue), p. 88–90 (piste R1), p. 208 (sommeil à zéro rêve). Aucun calcul de résolution
du site Cyol n'a remplacé le moteur RdD. Aucun code tiers supplémentaire ni illustration repris.

Suite complète : **8 232 tests réussis, 4 ignorés ; 682 fichiers réussis, 1 ignoré**.
Après séparation explicite entre barème d'affichage du module et calcul autoritaire GM-OS,
**26 tests ciblés réussis** ; une vérification croisée empêche la divergence des huit cas
(quatre actions × deux rythmes). Types et construction finale réussis. Lint global :
**1 904 fichiers, zéro erreur**, seul avertissement préexistant dans `useSaisieDifferee.ts:46`.

**Cinq parcours E2E réussis en environ deux minutes** : R0, R1, R2, carte privée et raccord. Le parcours du
raccord vérifie un aperçu périmé refusé, annulation sans coût, montée et déplacement depuis
Edge, une écriture unique des ressources/reçus, rechargement, puis démarrage à froid à partir
d'une sauvegarde fictive représentant la panne après reçu durable mais avant acquittement.
La reprise garde rêve 11 et fatigue 5, trois reçus, position H4 et personnage hors TMR.
Après la dernière séparation du calcul autoritaire, le parcours de raccord est de nouveau
réussi sur le paquet final (**33 secondes**), avec les mêmes contrôles de sauvegarde froide.
Le cas interrompu sans reçu est couvert par le protocole unitaire, sans dépense.

Les tests couvrent les pannes avant écriture, après échec disque et après reçu durable mais
accusé perdu, l'annulation conditionnelle, le refus d'un aperçu périmé, le filtrage joueur,
la migration et la relecture des reçus dans une vraie sauvegarde.

La capture `jeu-reves-de-dragons-tmr-raccord.jpg` et les vues de carte/pupitre sont relues
visuellement puis copiées dans le manuel. Les sources Cyol et l'export R0 restent inchangés.
`git diff --check` ne relève pas d'erreur, hors avertissements habituels de fins de ligne.

Les captures sortent dans `scratch/reve-de-dragon-r8/raccord/`, les rapports et logs dans
`scratch/reve-de-dragon-r8/`. Les E2E emploient uniquement profils, corpus et sauvegardes jetables.
Le pilote R0 est inchangé (`66501921abd73c2bc98805dacc917867996b3a6c677db24b86dd3e5dd5a2e51a`).
**47 fichiers concernés par R8 au total**, carte initiale comprise, non commités et non poussés.
Le registre, la page 53 et les fichiers Nephilim d'un autre travail restent intacts ; la page 54,
le contrat des modules et le README sont actualisés. Aucun paquet installé, aucun commit ou push.

## Suite R8

Rencontres et maîtrise sourcées, perte de repères, lancer/réserve exécutable des sorts,
queues/souffles exécutables. Réutiliser ce protocole pour leurs conséquences, en étendant
explicitement les données de l'opération ; ne pas observer une position pour en déduire un coût.
Les règles et coûts de base vivent dans GM-OS, le module externe transmet les choix, la fiche
garde les ressources. Conserver notamment la clé historique `onrios` et les crédits des apports.
