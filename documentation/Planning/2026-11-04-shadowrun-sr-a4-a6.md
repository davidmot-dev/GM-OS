# Shadowrun Anarchy — SR-A4, SR-A5 et SR-A6 — 04/11/2026

David : « on va commencer SR-A4, SR-A5 et SR-A6 ». GM-OS confirmé fermé ; l’accord déjà
donné pour les essais Electron et services locaux en profils jetables est conservé.
**Pilote 2.2.0 livré et validé par David le 04/11/2026 : « c'est testé marque le ».**
Registre § 212. Cette confirmation porte sur SR-A4/A5/A6 ; SR-A1/A2/A3 étaient déjà validés.

## Référence et arbitrage

Livre `sran2_01anarchyv2_web_v1.pdf`, lu directement sur le NAS, sans écriture : pages
imprimées 64-69, 78, 81-82, 127, 230 et 233 ; PDF = imprimée +2.

**Décision de David le 04/11/2026 : « Tableau des blessures : 6/10/14 dans cet exemple ».**
Le pilote retient donc le tableau p. 69 : Structure + Blindage, 2 × Structure + Blindage,
3 × Structure + Blindage. Le renvoi du chapitre véhicules p. 230 au calcul normal aurait
donné 6/9/12 pour Structure 4, Blindage 2 ; ce renvoi n’est pas appliqué au véhicule.
Le choix est aussi cité dans `seuilsVehiculeShadowrun` et contrôlé dans la Forge.

La menace monte de **1 par utilisation d’Anarchy**, quel que soit le coût de cette
utilisation (p. 127). La formulation ambiguë du corpus `monnaie-de-table.md` est précisée
contre le livre. Elle ne monte qu’en narration partagée totale.

## Réalisation

- **SR-A4** — `tableDeShadowrun.ts`, `operationsDeShadowrun.ts` et carte Planification.
  Les succès obtenus en préparation se créditent après l’éventuelle relance ; une saisie
  manuelle permet de reprendre un test joué ailleurs. Temps limité : deux succès par point.
  Flashback décrit, coût 1–4, financement personnel ou collectif explicitement choisi,
  refus d’insuffisance, aperçu et confirmation du meneur. Les reçus persistent dans la
  campagne et empêchent de rejouer le même débit. Le mode totale, le tour de table,
  bonus PNJ, péripétie et désastre sont explicites. Le désastre exige Menace > Planification.
  Avantage/relance du panneau et flashback alimentent la menace une fois ; les autres
  utilisations ont un bouton dédié, sans achat de dés.
- **SR-A5** — `oppositionDeShadowrun.ts`, moteur existant et panneau. L’égalité générale
  ne produit ni vainqueur ni tag de réussite ; l’initiateur départage seulement si nécessaire.
  Tir : l’attaquant touche à égalité ; mêlée : idem contre une défense seule, égalité
  indécise si attaques simultanées. Premier rôle par succès saisis ; second rôle par
  arrondi(RDD/3) + RR +1 et avantage adverse inversé ; cinq profils à la volée.
  Le contexte opposé du lancer demeure celui de sa relance. Le résumé affiche son seuil,
  même si les menus changent ensuite. La variante alternative existante est éprouvée par
  import/remplacement et retour au standard, sans nouveau moteur de risque.
- **SR-A6** — `riggingDeShadowrun.ts`, flotte de campagne et carte Rigging. Équipement
  IND/CCV/CCR déclaré, capacité CCR, plongée unique, priorité plongée > capitaine > manuel
  > autonome. À niveau égal, premier ordre conservé, sauf l’autonome où le dernier ordre
  remplace le précédent. Un changement de mode par narration, sans coût d’action.
  Pilotage hot-sim en plongée : avantage, défense comprise. Autopilote seul en autonome,
  RR 0, sans spécialisation ni pénalités personnelles ; risque précautionneux sauf atout
  de débridage déclaré. Les blessures de l’appareil s’appliquent au jet.
  La VD finale remplit un moniteur distinct. Le biofeedback dépend de la case réellement
  ajoutée après aggravation : grave → légère mentale, incapacitante → grave mentale,
  uniquement en plongée ; cold-sim étourdissant, hot-sim létal, sans deuxième armure.
  La blessure atteint le contrôleur réel même si une autre fiche est affichée. Origine
  `biofeedback` et nature conservées dans le suivi du personnage.

**Persistance et droits.** Flotte, profils, narration et reçus vivent dans
`Campaign.suiviShadowrun`, donc dans l’export natif de campagne ; les valeurs restent dans
les réserves natives existantes. Aucun nouveau store local. Les confirmations des nouvelles
cartes sont réservées au poste meneur ; les droits des jauges restent inchangés.
Le message joueur `shadowrun:utilisation` ne peut viser que son personnage, passe par
l’autorité meneur et conserve son reçu contre les renvois. Il ne permet ni d’imposer le
mode totale ni d’ajuster arbitrairement la menace.

## Stitch et interface

MCP Stitch utilisé à la demande de David, avec le skill `enhance-prompt` et la grammaire
`stitch/grammaire/DESIGN.md` : projet
[`4980125564784271447`](https://stitch.withgoogle.com/projects/4980125564784271447),
écran `07c66ddada454698b79083752623c447`.
La planche à trois cartes a été générée et examinée. Sa hiérarchie (réserves, aperçu,
confirmation, conséquence) est adaptée aux `CarteDuJeu` et jetons du thème GM-OS, sans
recopier le chrome ni les erreurs de règle de la maquette. Références archivées dans
`output/shadowrun-sr-a4-a6/stitch-reference.json`.

## Pilote à réimporter

[`Export Dirvers/corriges/Shadowrun-Anarchy-2.2.0.gmos-driver`](../../Export%20Dirvers/corriges/Shadowrun-Anarchy-2.2.0.gmos-driver)
est construit par `outils/shadowrun-anarchy/etendre_shadowrun.mjs` depuis la 2.1.0.
Il conserve les identifiants du pilote et de la fiche, tous les champs et leurs valeurs
par défaut ; seuls la version et les trois déclarations `table`, `opposition`, `rigging`
sont ajoutés. Les réserves sont reliées par leurs ID exacts, jamais par leurs libellés.
Réimporter avec **Remplacer**. Aucun champ de personnage à convertir depuis la 2.1.0.

## Vérifications

Résultats sur la dernière construction ; journaux, empreinte et preuve
`verification-electron.json` dans `output/shadowrun-sr-a4-a6/`.

- **Suite complète : 9 827 tests passent, 4 ignorés ; 827 fichiers passent, un ignoré**
  (491,69 s). Elle couvre notamment les règles, les services à vrais magasins, les cartes,
  la relance opposée, le contrôleur/générateur, le manuel et les droits réseau.
- **Types et construction passent** (`npm.cmd run build`, qui exécute `tsc -b`).
  Lint global : **0 erreur / 1 avertissement préexistant** dans `useSaisieDifferee.ts`,
  laissé hors sujet. `git diff --check` ne trouve aucun défaut d’espacement.
- **Trois parcours Electron passent**, sans saut : SR-A1/A2/A3 (19,2 s), SR-A4/A5/A6
  (26,3 s), captures du seul pilote 2.2.0 (30,4 s). Les deux premiers passent ensemble ;
  les captures sont rejouées séparément avec le délai porté à 120 s. Le premier essai des
  captures avait atteint 30 s pendant l’ouverture de la fiche HTML ; aucun contrôle
  d’identité de fiche n’a été supprimé ni assoupli.

- Parcours Electron SR-A4/A5/A6 sur profil jetable : crédit 4, flashback 2 → réserve 2,
  refus du second clic, +1 menace, dépassement puis désastre confirmé ; égalité 4/4 et
  moyenne 5 ; plongée hot-sim, seuils 6/10/14, trois VD 7 → grave véhicule et légère
  mentale létale au rigger ; rechargement ; vraie connexion WebSocket, refus d’autrui
  et d’ajustement de Menace, renvoi du même reçu, reconnexion avec jeton de reprise ;
  import alternatif, jet et retour standard sans perdre la fiche.
- Contrôleur du pilote : zéro constat ; conservation des ID et du modèle de fiche,
  référence de réserve absente et mauvaise règle de résistance détectées.
- **Quatorze captures relues** : trois métier pour le manuel et onze génériques dans
  `captures-generiques/`. Trois images métier et six communes intégrées au manuel ;
  les cinq images génériques de cartes/choix restent dans les preuves. La planche de
  contrôle est conservée ; aucune capture d’un autre jeu écrasée.
- Pilote livré et copie de recette identiques, SHA-256 :
  `6be6034ee24a8f534784beee911821e40dd6bea648740238928869a416ac7215`.

## Essai de David — validé le 04/11/2026

David : « c'est testé marque le ». Aucun résultat individuel supplémentaire inventé ;
les gestes ci-dessous sont conservés pour reproduction. Un clip Playwright des nouveautés
est demandé le même jour, inspiré du clip RuneQuest.
Scénario : `e2e/clipShadowrunAnarchy.spec.ts` ; vidéo dans
`output/clips/shadowrun-anarchy-nouveautes.mp4` (**3 min 12**, H.264, 1440 × 900),
légendes françaises et six chapitres ; tournage WebM aussi conservé.
La fiche est fictive et les dés préparés ; le film montre les vrais gestes, sans accès
aux données de David. Rapport et images de contrôle dans `output/clips/shadowrun-anarchy/`.
Parcours Playwright passé sans saut ; lint du scénario et de l’exporteur propre. Sept
images de scènes et huit images extraites du MP4 final relues, début et fin compris.
Le chargement initial est retiré du MP4 par `outils/clips/exporter_clip.mjs` ; FFmpeg déjà
installé utilisé, aucune installation ni modification du produit.

1. Réimporter la 2.2.0 avec **Remplacer**. Dans Lancer un test, créditer une préparation,
   payer un flashback une seule fois ; en narration totale, dépasser la planification
   puis confirmer le désastre.
2. Choisir Opposé, saisir les succès adverses ; comparer une égalité générale et un tir,
   puis vérifier la moyenne d’un second rôle. Faire la relance avant le crédit de préparation.
3. Ajouter un véhicule aux caractéristiques connues, déclarer l’équipement, choisir la
   plongée hot-sim et un jet de Pilotage. Infliger une VD sur une copie d’essai ; vérifier
   le moniteur séparé et le biofeedback, puis fermer/rouvrir.

## Limites et reproduction

Le contenu du flashback, l’interprétation du désastre et les atouts ouverts appartiennent
au meneur. Les autres bénéfices du plan utilisent la jauge native et leur utilisation doit
être signalée pour la menace. Ne pas créditer le même test par les deux portes distinctes
(résultat et saisie manuelle). Les reçus protègent le renvoi d’une opération ; ils ne rendent
pas transactionnelle une coupure brutale entre les écritures des magasins natifs.

Les actions de capitaine/manuelles et le pilotage gratuit en plongée sont rappelés,
pas consommés par un automate. Collisions, VD finale d’une attaque, réparation réussie
et fin de malus léger restent confirmées à la table. Le profil d’équipement est déclaratif :
libérer ses appareils avant de retirer une CCV/CCR. La flotte se suit depuis la fiche
d’un PJ existant ; pas de panneau autonome pour une campagne sans personnage.
Les variantes « plus sombre », protection active et dommages détaillés du cyberdeck
restent hors périmètre. Les minima de DIEU sous risque alternatif conservent le blocage
documenté dans SR-A3.

```powershell
node outils/shadowrun-anarchy/etendre_shadowrun.mjs "Export Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver" "Export Dirvers/corriges/Shadowrun-Anarchy-2.2.0.gmos-driver"
npx.cmd vitest run --maxWorkers=4
npm.cmd run build
$env:ELECTRON_RUN_AS_NODE=$null
npx.cmd playwright test e2e/shadowrunExtensions.spec.ts --reporter=list
```

Les tests du générateur reconstruisent 2.1 puis 2.2 dans un dossier jetable depuis la copie
2.0 de recette, sans dépendre du contenu personnel d’Export Dirvers. Aucun paquet installé,
aucune donnée personnelle consultée, aucune commande Git d’écriture pour ce lot.
