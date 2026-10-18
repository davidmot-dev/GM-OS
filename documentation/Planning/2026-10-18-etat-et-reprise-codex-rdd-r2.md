# Rêve de Dragon — R2 encaissement, blessures et états, 18/10/2026

Suite de [R1](2026-10-18-etat-et-reprise-codex-rdd-r1.md), registre § 141.
David : **« fait R2, GM-OS est fermé »**. Développement autorisé, sans commit ni push.

## Livré

**Aucun nouvel export à importer.** Le pilote `RDD_driver_gmos_r0-consolide.gmos-driver`
reste inchangé (SHA-256 `66501921abd73c2bc98805dacc917867996b3a6c677db24b86dd3e5dd5a2e51a`).
Les modèles `reglesDeFiche: "rdd-231"` reçoivent le panneau de santé après reprise R0.
Après activation R1, **Activer le suivi des blessures** déclare les blessures déjà présentes,
leurs soins, répit restant et bonus ; vie et endurance ne sont pas modifiées rétroactivement.
La première copie est gardée dans `__rddAvantSante231`.

- **Encaisser** : 2d10 + dommages − protection ; table normale ou coups non mortels ;
  perte d’endurance tirée selon la gravité, vie, promotion des blessures et localisation narrative.
  Un aperçu conserve les dés avant une écriture absolue de toutes les conséquences.
- Cinq légères maximum, deux graves maximum, puis critique. Une seconde critique tue.
  Après une critique, les pertes d’endurance des encaissements suivants deviennent des pertes de vie.
- Endurance nulle, perte de vie associée, inconscience ; héroïsme optionnel pour une perte
  chiffrée amenant exactement à zéro dans le SC. La fatigue du dernier point héroïque est conservée.
- Jet d’endurance au d20, pertes cumulées du round, 20 toujours échoué, 01 réussi et XP Constitution
  à reporter ; sonné jusqu’à la fin du round suivant. Le jet de résolution garde son pourcentage,
  mais applique le degré effectif : particulière → significative ; normale → échec ; en offensive,
  échec normal ou particulier → total. Le degré brut reste dans le contexte du résultat.
- Coma de zéro à −SC inclus ; décès au-dessous, au 20 du jet de vie ou à la seconde critique.
  La projection du socle conserve les PV négatifs. Le coma n’émet pas de faux décès au journal.
- Phase santé explicite : hémorragie grave, échéances de jets de vie, répit du 01 hors coma,
  répit des premiers soins et durée de sonné. Pas de minuterie réelle ni de dépense à la lecture.
- Premiers soins : points de tâche, échec total, changement d’opérant, excédent et arrêt du
  décompte dans le round où ils s’achèvent. Soins complets : bonus de guérison, ou rechute sur
  échec total. Les ressources de soin et le jet du soignant restent à résoudre à la table.
- Même suivi pour le MJ, sa tablette et le bouton **Encaisser / soins RdD** dans la fiche du
  combattant ; PJ, PNJ de campagne et adversaire autonome ont chacun leur porteur de données.
  L’observateur du MJ reflète les écritures et consigne les opérations reçues des tablettes.

## Sources et décisions de lecture

Livre complet `Reve_de_Dragon_2.3.1.pdf`, empreinte
`a8713e6f71b6a602624f16a71de91181f29d411d78d566c9b7c2142a7b42df07`.
Copie privée de lecture dans `scratch/reve-de-dragon-r0/sources/`, ignorée par Git.
Pages imprimées 78 (round ≈ 6 s), 91–93 (endurance, sonné, vie), 95–97 (encaissement,
escalade, héroïsme, critique), 98–99 (soins), 120 (phase santé). Pages PDF 92, 96–98 et 100
rendues puis relues visuellement dans `scratch/reve-de-dragon-r2/`.

**Points à ne pas refaire :**

- L’exemple imprimé p. 97 enlève **6 PV sur une critique à 22**, pas 7. Le zéro d’endurance
  est déjà compris dans la perte des lignes de table « endurance à 0 », y compris le coup non
  mortel à 20+. En dehors de ces lignes, l’arrivée à zéro ajoute bien la perte de vie.
- Le jet de vie est celui du blessé, pas un jet supplémentaire pour chaque plaie présente.
  Une échéance traite les plaies concernées ensemble ; la critique garde son rythme propre.
- SC heures signifie **SC × 120 minutes**, et non SC × 60 minutes.
- Une reprise de soins déjà donnés n’ouvre pas un nouveau répit complet : on saisit le
  **répit restant**, zéro par défaut, ainsi que le bonus déjà acquis aux soins complets.
- Le compteur **round de santé** est persistant et distinct de l’ordre d’initiative.
  Son bouton représente la validation de la phase santé, une fois par round. Le temps déclaré
  utilise la convention de six secondes et s’arrête à la prochaine obligation, sans sauter
  une hémorragie exigeant encore un traitement round par round.

## Code et conservation

- `src/modules/session/logic/santeDuVoyageur.ts` : fonctions pures, dés injectés, lecture stricte
  de `__rddSante231`, propositions, soins et projection de santé.
- `PanneauSanteVoyageur.tsx` : activation, dés GM-OS ou physiques, aperçu et confirmation,
  arbitrage de soins et historique des trente dernières opérations.
- `__rddSante231` contient blessures, état, échéances, cumul du round et dernier UUID.
  `__rddHistoriqueSante231` garde les conséquences et les dés. `__rddOperationFatigue` porte
  le même identifiant pour ne pas appliquer une deuxième fois le coût R1.
- `ficheDeVoyageur`, `entitySlice` : écriture atomique, fatigue/endurance et zéro d’endurance
  cohérents ; maintien des PV négatifs pour RdD. Le chemin des PNJ passe par la même normalisation.
- `PanneauJetVoyageur`, `PanneauJetDeFiche` : sonné et incapacité d’agir. La fatigue pleine
  empêche également une action ; une récupération d’endurance sans plaie grave non soignée
  permet de reprendre conscience, sans effacer la fatigue.
- `SanteDuCombattantVoyageur`, `CombatCard`, `FicheDuCombattant` : accès spécialisé depuis
  Combat-OS ; le bouton remplace les dégâts HP génériques sur ces cartes.
- `SanteDuCombattant`, `DecesAuJournal` : distinguent coma/inconscience et mort pour RdD,
  sans changer les autres systèmes ; l’étiquette de décès posée par le MJ reste respectée.
- `useSuiviSanteVoyageur`, monté dans `App` une seule fois côté MJ après démarrage : observe
  les changements réellement enregistrés, reflète le plateau et écrit les traces. Aucune
  trace à l’hydratation ni pour le rejeu du même UUID. Couvre aussi un combattant autonome.

Un aperçu dont la fiche a changé est refusé. Les saisies MJ doivent être sauvegardées avant
une opération. R2 s’appuie sur le suivi de fatigue : son retour au mode manuel est masqué tant
que le suivi de blessures est actif. Les anciennes notes et champs hors modèle restent conservés.

## Vérification

- Suite complète : **8 198 tests réussis, 4 ignorés, 677 fichiers réussis et 1 ignoré**.
  Après les derniers garde-fous : **90 tests ciblés réussis sur 9 fichiers**.
  Dernier contrôle du magasin après le maintien du statut indemne des PNJ : **6 tests réussis**.
- `npx.cmd tsc -b`, `npm.cmd run build` réussis.
- Lint global : **1 886 fichiers, zéro erreur** ; seul avertissement préexistant dans
  `useSaisieDifferee.ts:46`, fichier laissé intact.
- E2E R2 : **réussi en 28 secondes**. Reprise, exemple 18 → grave, jet d’endurance raté,
  deux rounds de sonné, hémorragie, premiers soins et soins complets ; critique à 22 depuis
  Edge sur tablette, vie 12 → 6, endurance → 0, journal MJ avec exactement deux encaissements ;
  rechargement sans nouvelle perte, accès Combat-OS, coma à zéro sans événement de décès.
  Adversaire autonome : activation, contusion, endurance 28 → 26, trace unique au journal,
  conservation de sa fiche locale après rechargement. PNJ de campagne : test du vrai magasin,
  activation indemne conservée, perte d’endurance et coma distinct de la mort.
- Régressions E2E R0, R1 et pipeline des captures RdD : **3 tests réussis en 54 secondes**.
- Affichage contrôlé à **820 px et 360 px**, captures relues visuellement. Les trois nouvelles
  images du manuel sont `jeu-reves-de-dragons-blessures.jpg`, `…-critique.jpg`, `…-sante-combat.jpg`.

Les rapports, captures et sources restent dans `scratch/reve-de-dragon-r2/`.
Tous les E2E utilisent `lancerGmOs`, profils, corpus et sauvegardes jetables. Les données de David
ne sont pas ouvertes. Aucun paquet installé, aucun commit ni push.

Le registre, la page 53 et les fichiers Nephilim portent des changements d’un autre travail :
laissés intacts. Cette note assure la passation ; la page 54 RdD est actualisée avec les captures.

## Suite

**R2 santé est livré.** La récupération d’endurance, la guérison différée et le Château Dormant
relèvent du lot R4. Les sept phases du combat et l’initiative par arme ne sont pas automatisées
par cette livraison ; le tri actuel du pilote reste celui décrit en R0. R3 points de tâche et
R8 TMR restent séparés. Aucun déplacement de demi-rêve ni consommation de sort n’est ajouté.
