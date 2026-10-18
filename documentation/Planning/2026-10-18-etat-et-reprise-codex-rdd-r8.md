# Rêve de Dragon — démarrage R8, 18/10/2026

> Cette note conserve la livraison 0.1.0. La suite 0.2.0, raccord récupérable aux fiches,
> est décrite dans [R8 — raccord](2026-10-18-etat-et-reprise-codex-rdd-r8-raccord.md).

Suite de [R2](2026-10-18-etat-et-reprise-codex-rdd-r2.md), registre § 141, ligne 76.
David : **« ok c'est bon suivont le plan et commence R8 »**, puis confirme
**« Non, GM-OS est fermé. »** avant les modifications applicatives. Aucun commit ni push demandé.

## Périmètre de cette première tranche

Module externe **`rdd-tmr` 0.1.0**, données v1, enregistré dans l'hôte commun. Carte des
189 terres, position individuelle, demandes de montée normale/accélérée, déplacement voisin,
attente et descente, arbitrage MJ et historique. Carnets individuels de sorts en réserve,
queues et souffles ; préparation de rencontre privée puis publication explicite au seul joueur.

**R8 n'est pas terminé.** Choix d'implémentation pour commencer : **mode assisté**. Les coûts
de base sont présentés, les jets et dépenses restent résolus sur la fiche ou à la table par
le MJ avant la validation du trajet. Le module ne copie ni `reve_pts` ni `fatigue` et n'écrit
dans aucune fiche. La case « Coûts, jets et conséquences résolus sur la fiche » est une
confirmation humaine, pas une preuve automatique de débit. Les rounds, les conditions de
concentration et les exceptions dues aux effets de Dragon restent à arbitrer.

Ce périmètre rend la carte et son partage utilisables avant d'implémenter le pont mécanique,
que le contrat existant ne fournit pas. Ne pas annoncer un lancer de sort ou une maîtrise
automatiques à partir de ce module. R3–R7 restent séparés.

## Code et invariants

- [`outils/reve-de-dragon/tmr/README.md`](../../outils/reve-de-dragon/tmr/README.md) : contrat,
  limites, commandes et recette. Moteur pur `moteur.mjs`, manifeste et déclarations TypeScript.
- `cases.mjs` : noms et genres adaptés des deux tableaux de Cyol/Kroc. Extraction reproductible
  `preparer-carte.mjs`, sans exécution du script tiers. Géométrie et rendu GM-OS originaux.
  Notices avec les sources et entrée **Crédits et licences** dans les deux vues.
- `src/modules/modulesDuJeu/tmr/` : carte tactile, pupitre et carnet joueur. Une liste de
  coordonnées accompagne le défilement horizontal sur téléphone. Pas d'images distantes,
  d'animations, de son ou de script tiers chargé.
- `catalogue.ts`, `EditeurDesModules.tsx`, `vuesDuRegistre.tsx`, registre serveur : raccordement
  explicite. Compatibilité par slug, sans renommer les dossiers historiques avec espaces.
- La référence reste **à sélectionner par David dans le pilote → Modules du jeu**.
  Aucun pilote existant n'est activé, réexporté ou réimporté automatiquement.
- Une seule demande par personnage, étape attendue et identité d'opération ; une ancienne
  demande est refusée, une validation ne déplace jamais deux fois. L'hôte persiste avant succès.
  Un échec disque laisse la position et sa demande intactes, sans acquittement.
- Le lecteur joueur reçoit son seul carnet, sans préparation MJ, roster ni positions des autres.
  Le contexte serveur détermine l'identité, jamais la charge du joueur.
- Fermeture générale, reprise et import interrompent voyages/demandes, en gardant positions,
  rencontres, réserves, effets et historique. Accès fermés au redémarrage. Une simple reconnexion
  reçoit l'état courant, sans création de trajet ni dépense.
- Limites : 256 personnages historiques, 60 notes et 60 arbitrages par personnage. Migration
  d'une copie validée ; versions futures conservées indisponibles par l'hôte.

## Sources et points à ne pas repayer

Édition complète **2.3.1**, SHA-256
`a8713e6f71b6a602624f16a71de91181f29d411d78d566c9b7c2142a7b42df07`.
Carte p. 180, demi-rêve p. 181, déplacements p. 182, rencontres p. 183, cases humides p. 187.
Pages PDF 181, 183, 184, 188 rendues et relues dans `scratch/reve-de-dragon-r8/`.
Les synthèses du corpus et les tables de résolution du site ne remplacent pas cette source.

La carte compte 189 cases, avec colonnes impaires B/D/F/H/J/L à 14 cases, décalées d'une
demi-case vers le bas. Les autres colonnes ont 15 cases. G4 = sanctuaire Blanc, J4 = collines
d'Encre, D13 = cité Sordide ; six voisines pour les terres intérieures. Les quatorze terrains
se lisent sur la carte ; ne pas reconstruire la grille comme 13 × 15 cases complètes.

L'attribution **Cyol**, corrections **Kroc**, **CC BY 3.0 France**, et les adaptations exactes
sont dans `outils/reve-de-dragon/tmr/CREDITS.md`. Aucune illustration, bibliothèque ou fonction
Hexagon.js n'est reprise ; seule la donnée cartographique est adaptée. Les cinq originaux
et les 26 extraits de référence conservent leurs empreintes.

Les listes HTML enveloppées dans un label demandent un `aria-label` explicite, sinon le navigateur
inclut les options dans le nom accessible. Les cases d'accès MJ s'enregistrent de façon asynchrone :
dans Playwright, cliquer puis attendre `toBeChecked`, plutôt qu'un `check()` à vérification immédiate.

## Vérification et manuel

Validation finale : **149 tests ciblés réussis, 17 fichiers** (moteurs et hôte des modules,
vues, éditeur et manuel). **Recette complète réussie en 22 secondes** : MJ et deux sessions
Edge, montée puis déplacement G4 → H4 après arbitrage, rencontre révélée bloquant le trajet,
réserve privée, vérification des messages reçus par les deux joueurs, rechargement sans nouveau
trajet, retrait d'Aline sans fermer Boran. Contrôle à 820, 1 180 et 360 px ; pas de débordement
horizontal de la page téléphone. Les deux captures définitives du manuel et la vue téléphone
ont été relues visuellement. Le cadrage du manuel emploie la fenêtre visible après retour à
l'en-tête : une capture d'élément entier dans l'hôte défilant rognait l'image.

`npx.cmd tsc -b` et `npm.cmd run build` réussis. Lint global : **1 894 fichiers, zéro erreur**,
seul avertissement préexistant `src/components/hub/useSaisieDifferee.ts:46`, laissé intact.
`git diff --check` propre (avertissements CRLF habituels). Référence Cyol vérifiée inchangée
et régénération de la carte strictement identique. La suite complète R0–R2 n'a pas été rejouée
pour ce lot, dont aucun calcul ni magasin de santé/fatigue n'est modifié.

Recette `e2e/tmrVoyageur.spec.ts` : vrai Electron, deux sessions Edge, corpus/profils/sauvegardes
jetables ; aucune lecture des campagnes personnelles. Export R0 seulement lu comme fixture.
La page 54 RdD décrit l'activation et le mode assisté ; les captures sont issues de cette recette.
Le registre, la page 53 et la note des sources TMR portent les modifications d'un autre travail :
laissés intacts. Cette note fournit l'ancre de reprise en attendant leur mise à jour coordonnée.

Le pilote R0 reste inchangé, SHA-256
`66501921abd73c2bc98805dacc917867996b3a6c677db24b86dd3e5dd5a2e51a`.
Aucun nouvel export n'est requis. **23 fichiers concernés par R8, non commités et non poussés**,
dont la page 54 déjà enrichie lors de R0–R2. Les autres changements préexistants restent intacts.

## Prochaine tranche R8

Concevoir le **pont transactionnel fiche ↔ module**. Aujourd'hui les modules sont persistés dans
le processus principal, les fiches dans SessionOS : un accusé renderer après débit ne garantit
pas à lui seul l'atomicité. Définir une opération identifiée et récupérable, vérifier les ressources
réelles et la reprise R0/R1 au moment de l'application, refuser un aperçu périmé, et traiter une
panne entre les deux écritures sans nouvelle dépense. Ne pas simplement observer la position
pour déduire la fatigue : une réhydratation serait indistinguable d'un déplacement.

Ensuite seulement : rencontres/maîtrise et conséquences, perte de repères, lancer/réserve des sorts
et queues/souffles exécutables. Réutiliser les calculs RdD et R1/R2, conserver les clés du pilote
(notamment `onrios`, orthographe historique), et créditer toute nouvelle contribution adaptée.
