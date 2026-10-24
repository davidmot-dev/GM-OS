# Star Trek Adventures — audit contre le livre et améliorations livrées

Claude Code, **23 octobre 2026**, à la demande de David : « on va faire toute les améliorations de
Star Trek, le livre de base se trouve ici "Z:\Jeux de Rôle\03. Futur\1. Space Opera\Star Trek\Star Trek
Adventures\V2\star_trek_deuxieme_edition__livre_de_base_pdf.pdf", GM-OS est fermé » ; puis, en cours de
route : « Prend le style du module existant de star trek » (le module de bataille spatiale prend
l'habillage LCARS).

Les améliorations répertoriées le 20/10 ([synthèse](2026-10-20-ameliorations-tous-les-pilotes.md#star-trek-adventures))
étaient des pistes d'audit : P0 auditer l'export contre la deuxième édition, P1 la Menace initiale, P2 les
raccords mécaniques, P3 le suivi du vaisseau et les conflits spatiaux. Cet audit les instruit et les livre.

## Sources et preuves

- **Livre** : Livre de Base français de la deuxième édition (PDF de David, filigrané à son nom). Copie de
  lecture et texte extrait par `pdftotext` dans `scratch/star-trek-audit/` (non suivi par git). Pages citées
  : pages **imprimées** ; PDF = imprimée + 4. Lus : p. 86–96, 132, 166–178, 178–191, 226–228, 238–248,
  250–274, 275–313, 316–334, 346–368.
- **Export examiné** : `ST_driver_gmos_paiement.gmos-driver` du 22/10, repris de l'historique git
  (`41453319^`) — le dernier réimporté par David. Identifiant `custom-1787403136277`.

## Constats sur l'export du 22/10

| Sujet | Avant | Le livre |
| --- | --- | --- |
| Initiative | `initiativeFormula` vide, aucun ordre : le combat ne savait rien faire | Les camps alternent ; garder l'initiative 2 Impulsion, l'allié doit céder ensuite (p. 277) |
| Santé | Modèle générique « blessures » ; Stress en jauge sans règle | Stress = Forme, éviter une blessure par le Stress, épuisé, vaincu, mourant (p. 277–278, 290–292) |
| Menace de départ | 2 fixes | 2 par personnage joueur présent (p. 264) |
| Complication | Le 20 seul | Une marge de 1 à 5 (p. 258) ; repoussée pour 2 Menace |
| Aide | Aucune | Assistants (1d20 chacun, comptés si le personnage réussit, p. 255) ; le vaisseau (p. 178) |
| Opposition | Aucune | Le réactif fixe la difficulté ; l'échec de l'actif lui donne l'Impulsion manquante (p. 256) |
| Détermination | Une jauge | Occasion parfaite (un dé à 1) et Éclair d'inspiration (relancer), avec un idéal (p. 262) ; 1 à chaque séance |
| Réputation | Une jauge | Le jet de fin de mission, la Gloire et les Réprimandes (p. 169–175) ; la Réputation remplace une fonction (p. 169) |
| Vaisseau | LCARS met en scène, ne calcule rien | Systèmes, Résistance, Boucliers, énergie, dégâts, brèches, noyau (p. 178–191, 294–313) |
| Tâches étendues | Aucune | Jauge d'effort, impact, obstacle, avancées ; conséquences ; défis chronométrés (p. 268–273, 329–333) |

Le corpus `docs/systems/star-trek/rules/` répétait quatre erreurs (relevées ci-dessous, ST0).

## Livré le 23/10 — registre général § 167

| Lot | Ce qui est fait | Où |
| --- | --- | --- |
| ST0 · corpus | Dix fiches corrigées ; quatre passées à `relu: true` (résolution, critiques, santé, monnaie de table). Retirés, sans passage : une blessure « d'office létale » sur un vaincu, des « efforts conjugués », une Menace « visible de tous ». Corrigés : la Réputation qui « augmente » d'elle-même (elle se paie en Gloire), l'obstacle « jamais sous zéro » (minimum 1), la réussite mitigée (proposée par le meneur), le noyau (dégâts critiques et Moteurs détruits ; tâche étendue) | `docs/systems/star-trek/rules/` |
| ST1 · la tâche complète | Nature (attaques du livre), marge, opposition, assistants et coût, aide du vaisseau (lue dans le module), Occasion parfaite, difficulté 0 ; après : complication repoussée, réussite mitigée, Éclair d'inspiration, Viser, Impulsion du réactif, blessure infligée | `systemes/starTrekRegles.ts`, `StarTrekAuJet.tsx`, `PanneauDeJet.tsx` |
| ST2 · Menace et Détermination | « Nouveau scénario » : Menace à 2 par personnage, Impulsion à 0 ; « Début de séance » : Détermination à 1 | `RessourcesDeTable.departParPersonnage`, pilote |
| ST3 · Stress et blessures | Carte : Stress (Forme, épuisé, attribut bloqué, réductions), blessures (Protection, létale, vaincu, mourant, soins, intervention) | `StressEtBlessuresStarTrek` |
| ST4 · ordre du tour | Alternance des camps, rétention 2 Impulsion, deux tours d'affilée au plus ; Stress suivi au combat | pilote (`combat.initiative`) |
| ST5 · Réputation | Carte de fin de mission : les questions du livre, le jet, la Gloire, les Réprimandes gardées ; la Réputation au choix de la fonction | `ReputationStarTrek`, pilote (motif) |
| ST6 · création | Contrôle des bornes (12 et 5, un seul) et plafonds des jalons | `CreationStarTrek` |
| ST7 · bataille spatiale | Module du jeu `star-trek-operations`, habillage LCARS : vaisseaux et VNJ, Résistance, Boucliers, armes et bonus d'Armement, dégâts, secousses, brèches, systèmes détruits, dégâts critiques, noyau, recharge, nouvelle scène | `outils/star-trek/operations/`, `src/modules/modulesDuJeu/operationsStarTrek/` |
| ST8 · tâches étendues et défis | Dans le même module : jauges d'effort et d'achoppement, impact, avancées, défis à tâches clés et intervalles, visibles ou non des joueurs | idem |
| ST9 · manuel | Page `54-Jeu-Star-Trek.md`, guide 53, six captures | `documentation/User Guides/` |

**Pilote** : `outils/star-trek/finir_star_trek.py` → `Export Dirvers/corriges/ST_driver_gmos_finir.gmos-driver`,
**2.0.0**, zéro constat de la Forge (`outils/star-trek/pilote.test.ts`). Aucun identifiant de champ changé.

**Vérifié** : `npx tsc -b`, lint ciblé ; 20 essais de la logique, 11 du moteur du module (exemples du
livre : Résistance de l'Enterprise-D, Titan-A secoué, tâche de Reed, défi de la bombe), 4 d'écran du
pupitre, 6 du panneau, 2 des réserves, 2 de la Forge ; suite complète **9 003 essais verts** ; captures relues.

## Lectures retenues, à confirmer par David

1. **Les seuils des Boucliers se cumulent** (p. 309) : un coup qui les fait passer sous la moitié secoue ;
   sous le quart dans le même coup, une brèche ; à zéro, une de plus. Un coup de 18 à 0 donne donc
   « secoué » et deux brèches.
2. **La Détermination repart à 1 à chaque séance** (p. 168 : « vous commencez chaque session avec 1
   point »), même si le personnage en avait davantage.
3. **Ouvrir un round sur un PNJ** (1 Menace, p. 277) n'est pas tarifé par le panneau d'alternance : le
   meneur le paie à la main.

## Ce qui reste à la main

Les actions de poste de la bataille (éviter, se défendre, manœuvrer…) se lancent au panneau, leur effet se
règle au pupitre ; les talents ne sont pas interprétés ; les complications doublées d'une énergie redirigée ;
le Stress et les blessures des PNJ selon leur rang ; les différends sociaux. L'essai de LCARS sur les
tablettes physiques reste à faire (registre, ligne 71).
