# Rêve de Dragon — finir le pilote contre le livre 2.3.1

Claude Code, **24 octobre 2026**, à la demande de David : « on va finir reve de dragons, le manuel est
ici \\CLOUDDAVID\Media\Jeux de Rôle\01. Passé\1. High Fantasy\Reve de Dragon\Rêve de Dragon - JdR\Rêve
de Dragon - Livres de Règles et univers gm-os est fermé ».

« Finir », c'est ce que la [synthèse des pilotes](2026-10-20-ameliorations-tous-les-pilotes.md#rêve-de-dragon)
laissait ouvert au 22/10 : P1 l'initiative et les sept phases du round ; P2 la famine et les
enchantements non permanents au Château Dormant ; P2 l'entraînement et l'apprentissage ; P3 le
Haut-Rêve (rencontres, maîtrises, sorts, réserves, queues et souffles) ; P3 les commandes R5–R7 des PNJ.

## Sources et preuves

- **Livre** : `Reve_de_Dragon_2.3.1.pdf` (Livre des Voyageurs et Livre du Haut-Rêve réunis) du dossier
  de David. Copie et texte extrait dans `scratch/rdd-finir/` (non suivi par git). Pages citées :
  pages **imprimées** ; PDF = imprimée + 1. Lus : p. 86–87, 110–111, 120–131, 138–139, 145–147,
  181–210, 268.
- **Tables relues en image** (`scratch/rdd-finir/rendre.mjs`), pas sur le texte extrait : la table
  des rencontres y mêlait ses colonnes (les plaines vont avec les **ponts**, pas avec les cités) ;
  maladresses, portées, queues, ombres, souffles et têtes vérifiées de même.
- **Export examiné** : `Export Dirvers/RDD_driver_gmos_1792659697679.gmos-driver` du 22/10 — le pilote
  relié au Livret du voyageur, 36 sections, 813 champs. Identifiant `custom-1777730495114`.

## Constats

| Sujet | Avant | Le livre |
| --- | --- | --- |
| Initiative | `initiativeFormula: "agilite"`, un tri | Sept phases ; tirs, lancers, mêlée ; facteur de l'arme (demi-caractéristique + niveau) + 1d6 + état général ; longueur d'arme à l'engagement ; mêlée inégale +N ; demi-surpris jamais l'initiative (p. 120–128) |
| Famine | « à résoudre à la table » | −1/−2/−3 d'endurance selon la part du seuil mangée, −3/−6/−12 pour l'eau ; fatigue associée, irrécupérable avant un repas normal ; plancher à demi-endurance (p. 111) |
| Enchantements | « à résoudre à la table » | Une potion perd un point de rêve à chaque fin de Château Dormant, et s'évapore au dernier (p. 268) |
| Entraînement | « arbitré par le MJ » | Une heure, deux fatigue au moins, 1d6 jets à ajustement final −1, XP sur particulière, maladresse sur échec total ; mêlée à deux (p. 146–147) |
| Apprentissage | « arbitré par le MJ » | 3 XP/semaine jusqu'à 0, 1/semaine jusqu'à +3, puis 1 toutes les (n−2) semaines ; jamais au-delà du maître (p. 145–146) |
| Haut-Rêve | Rencontres, maîtrises et sorts « à votre main » | Table des rencontres par genre, maîtrise sur le rêve actuel, dérobade, refoulement et test au d20 ; prisons ; cases humides ; lancer, coût, réserve, bonus de case ; JR ; queues, ombres, souffles, têtes (p. 181–210) |

Le corpus `docs/systems/reves de dragons/rules/` portait six erreurs, corrigées (D6 ci-dessous).

## Livré le 24/10 — registre général § 168

| Lot | Ce qui est fait | Où |
| --- | --- | --- |
| D1 · round de combat | Mode `combat.initiative.mode: 'phases'` : panneau des phases dans Combat-OS — déclarations (action, arme de la fiche avec son facteur, ou « Autre arme… », état général, demi-surprise, charge, groupe), « Tirer l'initiative » qui range le plateau phase par phase, round d'engagement, round suivant ; aide-mémoire (difficulté libre, particulières, conditions, maladresses au 2d10, difficulté d'un tir) | `dice/systemes/roundDeReveDeDragon.ts`, `combat/components/PanneauDesPhases.tsx`, `combat/useRoundDuVoyageurStore.ts`, `combat/logic/armesDuVoyageur.ts` |
| D2 · famine et potions | Bilan du Château Dormant : famine et soif (case à cocher, décochée par défaut), endurance retenue, « Repas normal pris » ; potions et enchantements non permanents suivis jusqu'à l'évaporation | `session/logic/reposDuVoyageur.ts`, `PanneauReposVoyageur.tsx` |
| D3 · entraînement et apprentissage | Une heure d'entraînement (seul ou à deux, désir lancinant bloquant) ; apprentissage avec un maître, en semaines | `session/logic/progressionDuVoyageur.ts`, `PanneauProgressionVoyageur.tsx` |
| D4 · Haut-Rêve | Carte « Haut-Rêve, queues et souffles » : rencontres et choix, prisons, cases humides, lancer d'un sort du livret (bonus de case, réserve, rituel et astrologie), déclenchement, JR, refoulement, effets de Dragon à tirer (Château Dormant compris) et en cours ; compteur et queues recopiés dans le livret. Pupitre TMR : « Tirer le d7, la rencontre et sa force » | `dice/systemes/hautReve.ts`, `session/logic/hautReveDuVoyageur.ts`, `PanneauHautReveVoyageur.tsx`, `modulesDuJeu/tmr/VuesTMR.tsx` |
| D5 · pilote | `outils/reve-de-dragon/finir_reve_de_dragon.py` → `Export Dirvers/corriges/RDD_driver_gmos_finir.gmos-driver`, **2.0.0** : mode `phases`, formule retirée ; zéro constat de la Forge (`outils/reve-de-dragon/pilote.test.ts`). Aucun identifiant de champ changé | `outils/reve-de-dragon/` |
| D6 · corpus | Cinq fiches corrigées, quatre passées à `relu: true` : mêlée inégale (+N pour chacun, pas +1), égalité de mêlée (round nul, pas d'attaques simultanées), charge ; cases humides (souffle sur échec total seulement) ; rencontres (trois choix) ; queues (refoulables à leur prix, durées propres) et une « force augmentée en zone de Rêve de Dragon » retirée ; projectiles (dague, javelot, fouet s'esquivent) ; demi-surprise (déclaration commune) | `docs/systems/reves de dragons/rules/` |
| D7 · manuel | Page `54-Jeu-Reves-de-Dragons.md` et guide 53 ; cinq captures neuves relues (`e2e/finirReveDeDragon.spec.ts`) | `documentation/User Guides/` |

**Vérifié** : `npx tsc -b`, lint ciblé ; 10 essais du round, 8 des tables du Haut-Rêve, 14 des
opérations sur la fiche (exemples du livre : Nitouche et le Changeur de 9 à 26 %, le Tourbillon
blanc et ses trois cases de dérive, le Tympan à 68 %), 4 de la famine et des potions, 3 de
l'entraînement et de l'apprentissage (40 et 90 semaines retrouvées), 5 d'écran du round, 3 de la
carte Haut-Rêve ; recette réelle dans Electron (`e2e/finirReveDeDragon.spec.ts`) ; les cinq recettes
existantes du Voyageur rejouées sur le pilote R0 repris de l'historique, toutes vertes. Suite complète : **9 051 essais verts** (le magasin du round déclaré au registre des purges).

## Lectures retenues, à confirmer par David

1. **La charge rend aléatoire toute la mêlée d'engagement.** Le livre dit que la longueur ne joue pas
   pour le chargeur ; comparer une charge et une longueur n'a pas de règle, le panneau tire donc
   l'initiative pour tous et le dit.
2. **Les rounds de prison ne débitent pas la fatigue sur la fiche** : un point par round passé dans
   les TMR, déjà compté par le module (« Rester un round ») ou à la descente. Le rêve et la vie du
   Tourbillon, eux, s'écrivent.
3. **La famine se coche à chaque bilan** : décochée par défaut, pour qu'une feuille de route laissée à
   zéro ne déclenche jamais une famine totale (−3 et −12) sans que le meneur le veuille.
4. **L'apprentissage crédite les XP au rythme du niveau visé**, sans faire monter le niveau : l'augmentation
   reste le geste « Préparer l'augmentation d'un niveau ».

## Le calendrier de Clock-OS — même jour, registre § 169

David, ensuite : *« est-ce que tu peux construire un calendrier Reve de Dragon dans Clock-OS ? »* ;
choix : douze heures draconiques, saisons et quatre phases de lune. `databases/calendars/reve-de-dragon.json`
(douze mois lunaires de 28 jours, 336 jours ; douze heures de 120 minutes nommées ; fêtes des
saisons et de la lune), champ `nomsDesHeures` dans Clock-OS, minutes corrigées (une minute faisait
`minutesPerHour` secondes), afficheur Ulanzi, et « Caler le repère sur le calendrier » dans la carte
d'astrologie. Recette réelle : `e2e/calendrierReveDeDragon.spec.ts`.

## Ce qui reste à la main

Les effets narratifs des rencontres (Messager, Passeur, Changeur : où va le demi-rêve) et des
queues, souffles et têtes (le meneur les applique, la carte les garde en cours) ; la longueur des
armes absentes de la table ; les commandes R5–R7 des PNJ, écartées par David le 24/10 — le
Haut-Rêve, lui, est ajouté aux PNJ (fiche de PNJ et Combat-OS) ; la lecture des livres et des méthodes (p. 352–356). L'essai de David à l'écran.
