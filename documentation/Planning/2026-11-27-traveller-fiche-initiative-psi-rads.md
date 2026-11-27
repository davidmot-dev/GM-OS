# Traveller — fiche alignée partout (TRV-A3), initiative (TRV-A4), PSI et Rads (TRV-A5) — spécification, 27/11/2026

> Demande de David (27/11) : « Commit - pousse, commence TRV-A3 à TRV-A5 ».
> État : **livré le 27/11, à essayer par David (réimport du pilote 2.1.0)** — registre § 283.

## Le quoi

### Parcours

**TRV-A3 — une fiche modifiée ailleurs que dans l'éditeur du meneur reste juste.**

1. Sur sa tablette, un joueur passe la DEX de son Voyageur de 8 à 9 (progression).
2. Chez le meneur, la fiche reçoit 9, **et** son MD de DEX passe à +1, son total physique suit, sa
   « DEX sans blessure » monte à 9. L'initiative et les tests suivants lisent le bon MD.
3. Même chose quand la valeur arrive de la **fiche HTML** (« Fiche du jeu »), chez le meneur ou sur
   la tablette.
4. Un Voyageur **blessé** (DEX 6 sur 10) garde son maximum : seule une valeur au-dessus du maximum
   le relève.

**TRV-A4 — l'initiative suit le livre (p. 71).**

1. Le meneur clique « Jet système » dans Combat-OS.
2. Chaque Voyageur fait un test de **DEX ou d'INT** : 2D + le MD le plus haut des deux, contre 8 ;
   l'**Effet** est son Initiative pour tout le combat.
3. Avant le jet, le meneur peut noter, par camp, l'**Effet d'un test de Tactique** (ajouté à
   l'Initiative de tout le camp) et une **embuscade** (MD+6 au camp qui surprend, MD−6 à l'autre,
   au premier round seulement).

**TRV-A5 — PSI et Rads se lisent comme le livre les décrit.**

1. La PSI se **dépense** et revient d'un point par heure (p. 224-225) : la carte montre « PSI 4 / 7 »,
   le maximum étant la **PSI sans dépense** de la fiche ; le MD de PSI suit la PSI actuelle.
2. Les Rads sont une **dose cumulée**, sans plafond (p. 78) : la carte montre « 95 rads », la
   conséquence cumulée en cours (aucune, puis −1 à −4 END permanent) et le prochain seuil (151).

### Critères d'acceptation

- **C1** · Une modification de caractéristique venue de la tablette est alignée chez le meneur : MD,
  total physique, maximum relevé si dépassé — essai (`sessionActions`).
- **C2** · Même alignement pour une valeur venue de la fiche HTML chez le meneur — essai.
- **C3** · Le maximum d'un blessé n'est jamais abaissé ni relevé par une valeur sous lui — essai.
- **C4** · L'Initiative d'un Voyageur est l'Effet de 2D + max(MD DEX, MD INT) contre 8 — essai.
- **C5** · L'Effet de Tactique d'un camp s'ajoute à l'Initiative de chacun de ses membres — essai.
- **C6** · L'embuscade donne MD+6 au camp qui surprend et MD−6 à l'autre, retirés au début du round 2 (l'ordre se refait) — essai.
- **C7** · La jauge PSI se lit sur la « PSI sans dépense » ; le MD de PSI suit la PSI actuelle ;
  l'alignement relève le maximum dépassé — essai, puis à l'écran par David.
- **C8** · Les Rads s'affichent en dose, avec la conséquence cumulée et le prochain seuil du livre,
  sans « / 10 » — essai, puis à l'écran par David.
- **C9** · Un geste « Exposition » ajoute une dose, dit ses conséquences immédiates (dégâts à lancer, nausée) et, quand un seuil cumulé est franchi, propose la perte d'END permanente (p. 78) — essai, puis à l'écran par David.

### Hors champ

- Les pouvoirs psioniques eux-mêmes (talents, coûts, portées) : corpus et Oracle.
- La récupération automatique de la PSI au fil des heures (Clock-OS) : le meneur la rend à la main.
- Les médicaments anti-rads.
- Tactique (navale), combat spatial : TRV-M3.

### Ce que David garde

- TRV-A3 n'écrit que des champs déjà connus (MD, total, maxima) : sauvegarde et export inchangés.
- TRV-A4 : les Effets de Tactique et l'embuscade vivent dans le combat en cours (magasin de
  Combat-OS), comme l'initiative elle-même.
- TRV-A5 ajoute un champ à la fiche (`psi_max`) : **pilote 2.1.0 à réimporter avec « Remplacer »**.
  Un Voyageur existant reçoit sa PSI sans dépense égale à sa PSI au premier enregistrement.

## Décisions

- 26/11 — David : report automatique des dégâts ; la porte des dégâts aligne déjà la fiche (§ 278).
- Règles relues dans le livre le 27/11 (page imprimée) : initiative, forces opposées, embuscade et
  Tactique (p. 71) ; radiations et table des conséquences (p. 78) ; points PSI, récupération et MD
  sur le total actuel (p. 224-225).
- 27/11 — David, Q1 : « Tactique + embuscade » → C5, C6 ; pas de « forces opposées ».
- 27/11 — David, Q2 : « Dose + geste Exposition » → C8, C9.
- 27/11 — David, Q3 : « Oui, pilote 2.1.0 » → C7 ; réimport « Remplacer ».
- Camps : les Voyageurs (joueurs et alliés) contre les adversaires ; un neutre ne reçoit ni Tactique
  ni embuscade. Un animal sans DEX ni INT fait son test sans MD (le livre n'en donne pas).

## Le comment

### Fichiers et réutilisation (lus dans le code le 27/11)

**TRV-A3**
- Écrivains de `sheetData` qui n'alignent pas aujourd'hui : `remote/actions/sessionActions.ts`
  (`updateCharacterSheetData`, la tablette) et `CharacterSheetEditor.tsx` (`appliquerLeRapprochement`,
  la fiche HTML chez le meneur). Ceux qui alignent : `useCharacterEditor.ts`, la porte des dégâts.
- Choix : un seul point, `alignerLaFicheDeTraveller` (`combat/logic/physiqueDeTraveller.ts`), appelé
  par une aide commune `ficheAlignee(pilote, sheetData)` aux deux écrivains manquants ; le pilote du
  personnage par `piloteDuPersonnage`.

**TRV-A4**
- `useCombatStore.rollAutoInitiative` a déjà des règles propres (Degenesis, COC). Ajouter Traveller :
  `initiativeDeTraveller(fiche, bonusDuCamp)` dans `dice/systemes/traveller.ts` ou
  `combat/logic/initiativeDeTraveller.ts` ; les MD lus sur la fiche (`dexterite_md`, `intellect_md`),
  sinon recalculés.
- Un petit panneau « Initiative de Traveller » dans Combat-OS (sur le modèle de `PanneauDeCoc` /
  `PanneauDuRoundDeDegenesis`) : Effet de Tactique par camp, embuscade.

**TRV-A5**
- `outils/traveller/finir_traveller.py` : champ `psi_max` (« PSI sans dépense »), `statsToTrack` PSI
  `max: psi_max`, `physiqueTraveller`… ou une règle à part ; absent motivé dans la correspondance
  (la fiche imprimée n'a pas de case) ; version 2.1.0.
- Rads : déclaration dans le pilote (`statsToTrack` : une dose sans maximum, avec ses seuils) et
  lecture dans `CombatCard.tsx` (jauges de ressources) et `CharacterSheetEditor.tsx` (jauges de la
  fiche). **Lecteurs de `statsToTrack` à recenser avant d'écrire** (la mémoire en compte cinq).
- `alignerLaFicheDeTraveller` : `psi_max` relevé comme les maxima physiques.

### Données : qui lit, qui écrit

- `sheetData` d'un Voyageur : quatre écrivains (éditeur, porte des dégâts, tablette, fiche HTML) ;
  après TRV-A3, tous alignent par la même fonction.
- Initiative : `rollAutoInitiative` seul écrit `init` ; les bonus de camp sont un état de Combat-OS.
- `statsToTrack` : lu par la carte de combat, la fiche du meneur, la tablette, la Forge.

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : l'alignement se fait chez le meneur seul (`sessionActions` y tourne).
- [x] Chemin de données : rien dans `electron/`.
- [x] Tablettes : aucun calcul neuf côté tablette ; elle reçoit la fiche alignée.
- [x] Textes en dur, en français, comme les autres cartes de Traveller.
- [x] Pilote : nouvelle version → réimport « Remplacer » ; personnages existants complétés à
  l'enregistrement, jamais écrasés.

### Écran : prompt Stitch

Le panneau d'initiative est une petite carte dans Combat-OS, au format de `PanneauDeCoc` : pas d'écran
neuf. L'affichage des Rads change une jauge existante. Pas de prompt Stitch, sauf avis de David.

### Essais

Essais purs (initiative, alignement, seuils des Rads), essais de composant (panneau d'initiative,
jauges), `sessionActions` ; `npx tsc -b`, lint ; `verifier_pilote.mjs` et `controlerLePilote` sur le
2.1.0 ; e2e des captures de Traveller.

## Tâches

- [x] T1 · Une seule aide d'alignement, appelée par la tablette (`sessionActions`) et la fiche HTML
      du meneur (`appliquerLeRapprochement`) ; la PSI sans dépense relevée comme les maxima physiques
      couvre C1, C2, C3, C7 · essais : `physiqueDeTraveller.test.ts`, `sessionActions` · touche src/ ⛔
- [x] T2 · L'initiative de Traveller : 2D + max(MD DEX, MD INT) − 8, + Tactique du camp, ± embuscade ;
      l'embuscade retirée au round 2 — `initiativeDeTraveller.ts`, `useInitiativeDeTravellerStore`,
      `useCombatStore` · couvre C4, C5, C6 · essais purs et du magasin · touche src/ ⛔
- [x] T3 · Le panneau « Initiative de Traveller » dans Combat-OS (Tactique par camp, embuscade)
      couvre C5, C6 · essai de composant · touche src/ ⛔
- [x] T4 · Les radiations, pures : conséquences immédiates et cumulées (table p. 78), seuil franchi
      couvre C8, C9 · essai : `radiationsDeTraveller.test.ts` · touche src/ ⛔
- [x] T5 · La dose de Rads sur la carte de combat, avec « Exposition » (dégâts à lancer et appliquer,
      END permanente proposée) — `DoseDeRadiations.tsx`, `CombatCard.tsx`
      couvre C8, C9 · essai de composant · touche src/ ⛔ · à l'écran par David
- [x] T6 · Pilote 2.1.0 : `psi_max`, jauge PSI sur `psi_max`, `combat.radiationsTraveller`, absent
      motivé de la correspondance ; types et contrôles du pilote — couvre C7, C8 ·
      essais : `verifier_pilote.mjs`, `controlerLePilote`, manuel · touche src/ ⛔
- [x] T7 · Vérifier et documenter : `tsc -b`, lint, essais, e2e des captures, manuel 53/54, synthèse,
      registre — à essayer par David (réimport 2.1.0)

## Analyse

- 27/11 — relecture croisée : chaque critère a sa tâche et son essai (C1-C3 T1 ; C4-C6 T2-T3 ; C7 T1,
  T6 ; C8-C9 T4-T6) ; aucune tâche sans critère (T7 = vérification et documentation) ; pas de
  contradiction avec les décisions du 26/11 (la porte des dégâts reste l'unique chemin des blessures,
  l'Exposition y passe) ; aucun point de périmètre ouvert ; `git status` : aucun fichier de `src/` en
  cours chez un autre agent.
- **Résumé** : 9 critères, 7 tâches ; T1 à T6 touchent `src/` ; David réimporte le 2.1.0 et essaie.

## Réalisation — 27/11/2026

- T1 · `ficheDeTravellerAlignee` (`physiqueDeTraveller.ts`) appelée par `sessionActions.ts`,
  `CharacterSheetEditor.tsx` (rapprochement) et, trouvé en chemin, `ecrireLaFicheDuCombattant`
  (clics sur les jauges de la carte, END permanente des radiations) — essais :
  `physiqueDeTraveller.test.ts` (4 cas neufs), `sessionActions.test.ts` (1) : vert.
- T2 · `logic/initiativeDeTraveller.ts`, `useInitiativeDeTravellerStore.ts`, `useCombatStore.ts`
  (branche de `rollAutoInitiative`, fin de l'embuscade dans `nextTurn`), `types.ts`
  (`bonusDEmbuscade`) — `initiativeDeTraveller.test.ts` (5) : vert.
- T3 · `PreparationDInitiativeTraveller.tsx` dans `CombatControls.tsx` — essai de composant (1) : vert.
- T4 · `systemes/radiationsDeTraveller.ts` — essais (4) : vert.
- T5 · `DoseDeRadiations.tsx` dans `CombatCard.tsx` (les deux boucles de jauges) — essais (3) : vert.
- T6 · `finir_traveller.py` 2.1.0, `drivers.ts` (`physiqueTraveller.psi`, `radiationsTraveller`),
  `controlesDuPilote.ts`, `verifier_pilote.mjs` ; correspondance régénérée — zéro constat.
- T7 · `npx tsc -b`, lint ; `npx vitest run src/modules/combat src/modules/dice src/modules/session
  src/modules/remote src/modules/forge src/modules/fiches src/components/hub electron --maxWorkers=4` :
  632 fichiers, 7 377 essais (le manuel a demandé la ligne `radiationsTraveller` au 53, ajoutée) ;
  `npm run build` puis e2e des captures `--grep "Traveller"` : vert, captures relues ; manuel 53/54,
  synthèse, registre.
- **À essayer par David** : C3 et C1 sur une vraie tablette ; C7 et C8 à l'écran ; l'ensemble après
  réimport du 2.1.0.
