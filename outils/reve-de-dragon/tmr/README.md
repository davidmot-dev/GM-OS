# Terres Médianes du Rêve — R8, carte et raccord aux fiches

Module externe `rdd-tmr`, contrat v1, implémentation 0.2.0, données v2.
David, 18/10/2026 : « ok c'est bon suivont le plan et commence R8 ».

## Ce qui fonctionne

Carte tactile des 189 terres, sélection par coordonnées, position persistante de chaque
demi-rêve, montée normale/accélérée, demande de déplacement voisin, attente et descente.
Le MJ valide ou refuse chaque demande ; le joueur ne peut agir que pour son personnage.
Chaque demande porte une identité et l'étape du voyage : un second appui ou un ancien
message ne déplace pas deux fois. Un seul trajet attend un arbitrage par personnage.

**Raccord aux fiches sur le poste MJ.** Chaque demande propose un aperçu du rêve et de la fatigue
R1. Après vérification des conditions et confirmation, le raccord GM-OS relit la fiche, refuse
un aperçu périmé, débite les coûts de base et inscrit un reçu dans la même écriture. La position
est validée après relecture du reçu dans IndexedDB. R0/R1 et un modèle `rdd-231` sont requis.
Rêve et fatigue restent uniquement dans la fiche. Le seuil de rêve ne plafonne pas la réserve.
À zéro rêve, le sommeil force la sortie ; à fatigue pleine, l'assommement force aussi la sortie.
Le panneau de jet RdD interdit d'agir à zéro rêve.

**Arbitrage manuel conservé.** Les coûts du raccord sont ceux de base de la p. 182. Le MJ gère
les exceptions dues aux effets, les rounds, la concentration, rencontres et maîtrises. Le bouton
historique « Valider le trajet » confirme des coûts déjà traités manuellement, sans les débiter.
Ne pas payer manuellement puis choisir le bouton de débit automatique du même trajet.
Cette tranche ne constitue pas le moteur automatique de magie de R8.

La préparation secrète d'une rencontre est séparée de son texte révélé. Une rencontre
publiée bloque les déplacements jusqu'à résolution ; la descente reste possible. Le MJ
consigne les sorts déjà mis en réserve, leur case, les queues et les souffles comme notes
individuelles, sans calcul ni déclenchement automatique. Soixante notes et soixante
arbitrages sont conservés par personnage ; 256 personnages historiques maximum.

## Raccordement

Moteur synchrone : `moteur.mjs`, déclarations `moteur.d.mts`. Vues React et styles isolés :
`src/modules/modulesDuJeu/tmr/`. Manifeste enregistré dans le catalogue, le registre serveur
et le registre des vues. Les corpus `reve-de-dragon` et `reves-de-dragons` sont compatibles ;
l'hôte compare le slug des anciens noms de dossiers sans les renommer.

La référence doit être sélectionnée explicitement dans **Pilote → Modules du jeu → Terres
Médianes du Rêve**. Aucun ancien pilote n'est activé ou réexporté silencieusement. Préparer
depuis le cockpit, puis ouvrir séparément les accès aux PJ pendant une séance.

L'hôte fournit stockage privé, file d'écriture, export/import de campagne, droits ciblés et
générations réseau. Une erreur disque conserve l'ancien trajet et son intention. Au redémarrage,
à l'import ou à la coupure générale, les voyages et demandes s'arrêtent, les positions, notes,
rencontres et historiques restent. Une écriture engagée est gardée pour rapprochement : reçu
présent, terminer sans repayer ; reçu absent après interruption, annuler sans payer. Le voyage
ne reprend pas automatiquement. Les accès restent fermés à la reprise.
Une version future reste conservée et indisponible. Le joueur ne reçoit ni préparation MJ,
ni liste des autres personnages, ni leurs positions, notes, demandes ou historiques.

## Commandes

| Commande | Rôle | Charge, en plus de `personnageId` pour le MJ |
| --- | --- | --- |
| `positionner` | MJ | `cible`, `etape` ; hors voyage et hors demande uniquement |
| `proposer` | MJ/PJ | `operationId`, `etape`, `action`, `cible`, `rythme` |
| `annuler` | MJ/PJ | `operationId` |
| `arbitrer` | MJ | `operationId`, `accepter`, `ficheTraitee`, `compteRendu` visible du seul PJ |
| `engager-trajet` | MJ | `operationId`, `transactionId`, `empreinte`, `compteRendu` ; conserve l'intention avant débit |
| `preparer-rencontre` | MJ | `texte` privé |
| `publier-rencontre` | MJ | `texte` révélé au seul PJ |
| `terminer-rencontre` | MJ | `etape` |
| `noter` | MJ | `note: {id,type,nom,caseId,texte}` ; types `reserve`, `queue`, `souffle` |
| `retirer-note` | MJ | `noteId` |

Les charges inconnues, champs surnuméraires, identités injectées, textes trop longs et
versions incompatibles sont refusés. Une validation ne modifie jamais son argument.

L'acquittement `modules:acquitter-fiche` est une capacité **IPC du poste MJ seulement**, absente
du manifeste et du WebSocket joueur. Le registre fournit facultativement `terminerEcriture` ;
cela ne donne aucune écriture générique aux modules dans les fiches. Le module porte une intention
`ecriture`, pas une réserve de ressources. L'empreinte et cette intention sont privées au MJ ; le
joueur ne reçoit qu'un indicateur d'écriture en cours.

## Persistance et reprise

1. Le module persiste une intention identifiée ; ses autres commandes sur ce PJ sont bloquées.
2. `ressourcesDesTMR.ts`, domaine GM-OS, vérifie les ressources et produit les coûts R1.
3. La fiche reçoit les ressources et `__rddRecusTMR231` en une écriture. Les anciennes éditions
   de fiche ne peuvent pas retirer ces reçus. Ils ne sont pas tronqués : limite de 10 000, puis refus.
4. La barrière de persistance vide le tampon, attend les écritures puis relit le reçu sur disque.
   Elle refuse une fenêtre secondaire, une session non hydratée ou un reçu non persisté.
5. L'IPC natif fait persister la position. Un échec conserve l'intention pour reprise.

La reprise depuis un reçu ne recalcule pas le débit, même si la fiche a changé ensuite. Si le reçu
n'existe qu'en mémoire après une panne IndexedDB, une nouvelle tentative persiste la même écriture
absolue. L'annulation conditionnelle vérifie l'absence durable du reçu ; une opération déjà payée
est terminée et n'est pas remboursée. Une fiche supprimée doit être restaurée pour rapprocher son
intention. Réactiver le module dans son pilote si sa référence a été retirée. Les corrections
manuelles restent autorisées ; le reçu atteste un débit, sans annuler les corrections ultérieures.

Migration v1 → v2 : ajout d'une intention vide, sans changement des positions, notes, réserves et
historiques. La restauration interrompt le voyage, conserve les écritures à rapprocher et ne
modifie jamais sa copie d'entrée.

## Carte et attribution

Les [crédits](CREDITS.md), également accessibles dans les deux vues, détaillent l'adaptation
des données de **Cyol**, corrections **Kroc**, sous **CC BY 3.0 France**, et la provenance de
la **carte officielle en couleur** demandée par David le 18/10/2026. L'image est reprise sans
modification de `tmr/img/fondTMR.jpg` dans l'archive Scriptarium, avec les droits et crédits
de l'illustration distingués de ceux de l'aide informatique. Le rendu n'utilise aucune image
distante et ne charge aucun code du site tiers. Le JPG est importé avec `?inline`, afin de
suivre le module JavaScript dans le précache PWA même si celui-ci exclut les JPG séparés.
`preparer-carte.mjs` reconstitue
les 189 cases depuis les tableaux conservés, sans exécuter l'original. La géométrie est propre
à GM-OS. Le livre 2.3.1 p. 180 a été contrôlé visuellement ; G4, J4 et D13 sont des repères
de recette. Les barèmes de rencontres alternatifs et les outils R3/R5/R7 du site ne sont pas inclus.

## Vérifier

`npx.cmd vitest run electron/modulesDuJeu src/modules/modulesDuJeu --maxWorkers=4`, puis
`npx.cmd tsc -b` et `npm.cmd run build`. La recette
`npx.cmd playwright test e2e/tmrVoyageur.spec.ts e2e/raccordTmrVoyageur.spec.ts --workers=1 --reporter=list` utilise le pilote
R0, des personnages fictifs et des profils jetables. Les captures sortent dans
`scratch/reve-de-dragon-r8/captures/`. Aucun accès aux données de David.

## Tranches suivantes

Le raccord récupérable aux fiches est disponible. Continuer par les rencontres et maîtrises sourcées,
perte de repères, sorts/réserves exécutables et effets de Dragon. Le mode assisté reste utilisable
indépendamment de ces développements.
