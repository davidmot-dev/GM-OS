# Traveller — dépenses et durées assistées (TRV-A6) — spécification, 27/11/2026

> Demande de David (27/11) : « Commit - pousse, commence TRV-A6 ».
> Ligne de la synthèse : « consommation de munitions, coût des pouvoirs PSI, récupération et durée
> de neutralisation, avec confirmation et historique ».
> État : livré le 27/11, à essayer par David — registre § 284.

Règles relues dans le livre de règles v2.2 (page du PDF = imprimée + 1) :

- **Munitions** (p. 74-76) : « Chargeur » = coups tirés avant de recharger ; recharger coûte une
  action mineure ; une **rafale** consomme autant de munitions que le niveau Auto, l'**auto complet**
  trois fois le niveau Auto.
- **Pouvoirs PSI** (p. 225-229) : test de la compétence du talent + MD de PSI ; on dépense le coût
  du pouvoir **en cas de réussite, un point en cas d'échec** ; ce qui passe sous zéro s'applique
  **en dégâts** ; sans point de PSI, pas de tentative. Portée +1 zone = coût ×2, +2 zones = coût ×4.
- **Récupération de la PSI** (p. 224) : un point par heure, **à partir de trois heures après la
  dernière utilisation** d'un talent.
- **Neutralisation** (trait Incapacitante, p. 76) : dégâts sur l'END seule ; à 0 END, la cible ne
  peut rien faire pendant **dégâts − END** rounds ; ces dégâts guérissent entièrement après **une
  heure de repos**.
- **Inconscience** (p. 80) : un test d'END par minute ; un échec donne MD+1 cumulatif au suivant.

## Le quoi

### Parcours

1. **Une rafale au pistolet-mitrailleur.** Le Voyageur réussit son attaque ; la carte « Dégâts »
   montre « Munitions : 30 → 26 (rafale, Auto 4) » et un bouton **Décompter**. Un clic écrit 26 sur
   la fiche. Quand le chargeur est vide, la carte le dit ; **Recharger**, sur la carte de combat,
   remet la capacité du chargeur lue au catalogue.
2. **Une Suggestion télépathique.** Le joueur choisit Télépathie au panneau de jet ; une carte
   « Pouvoir psionique » propose les pouvoirs du talent (coût, difficulté, portée), et la portée
   allongée (×2, ×4). Après le jet : « Réussite — dépenser 3 PSI » ou « Échec — dépenser 1 PSI ».
   Un clic retire les points ; ce qui passe sous zéro part en dégâts par la porte des blessures.
3. **Trois heures plus tard.** Le meneur clique **Récupérer la PSI** sur la carte, indique les heures
   écoulées depuis la dernière utilisation : la PSI remonte d'un point par heure au-delà de trois,
   sans dépasser la « PSI sans dépense ».
4. **Un bâton incapacitant.** 9 dégâts incapacitants sur une END de 6 : END à 0, et l'état
   **« Neutralisé, 3 rounds »** apparaît sur la carte et décompte à chaque round. Après le combat,
   **Une heure de repos** rend les points incapacitants.
5. **Un Voyageur assommé.** Inconscient, il a un bouton **Test de réveil** : 2D + MD END contre 8,
   +1 par échec précédent ; la carte compte les minutes.

Chaque geste écrit **une ligne au journal de séance** (l'historique demandé).

### Critères d'acceptation

- C1 · Une attaque réussie propose le décompte : 1 coup en simple, Auto en rafale, 3 × Auto en auto
  complet ; rien ne s'écrit sans clic — essai
- C2 · « Recharger » remet la capacité du chargeur du catalogue ; sans arme connue du catalogue, le
  bouton se tait au lieu d'inventer — essai
- C3 · La carte « Pouvoir psionique » liste les pouvoirs du talent avec coût, difficulté et portée
  du livre ; la portée allongée double ou quadruple le coût — essai
- C4 · Après le jet : coût en cas de réussite, 1 en cas d'échec ; l'excédent sous zéro s'applique en
  dégâts ; à 0 PSI, la carte refuse la tentative — essai
- C5 · « Récupérer la PSI » : 1 point par heure au-delà de trois, plafonné à la PSI sans dépense — essai
- C6 · Un coup incapacitant qui met l'END à 0 pose « Neutralisé » pour dégâts − END rounds, décompté
  par round — essai
- C7 · « Une heure de repos » rend les dégâts incapacitants encaissés, et eux seuls — essai
- C8 · « Test de réveil » : 2D + MD END ≥ 8, MD+1 cumulatif par échec — essai
- C9 · Chaque dépense, recharge, récupération, neutralisation et réveil a sa ligne au journal — essai
- C10 · Tout se voit à la table et se comprend sans le livre — **à l'écran par David**

### Hors champ

- Les chargeurs de rechange et leur coût (inventaire) — sauf décision contraire de David.
- Les médicaments psi et inhibiteurs (p. 230), l'Animation suspendue et les pouvoirs à coût
  variable au-delà d'une saisie (Télékinésie « 1 par 10 kg », Robustesse « quantité d'Armure ») :
  le meneur saisit le coût.
- Le temps qui passe tout seul (Clock-OS) — sauf décision contraire de David.
- Les munitions des véhicules et des vaisseaux (TRV-M3).

### Ce que David garde

- Les munitions restantes, la PSI, les dégâts incapacitants : **sur la fiche du personnage**, donc
  dans l'export `.gmos` et la sauvegarde automatique.
- L'état « Neutralisé » et le compteur de réveil vivent dans le combat : ils disparaissent avec lui,
  comme les autres états.

## Décisions

- 27/11 — David : « Les cinq » → munitions, coût PSI, récupération PSI, neutralisation et réveil
  dans ce lot.
- 27/11 — David : « Écrire « 26/30 » » → le champ `arme_N_munitions` porte **restants/capacité**.
  Lecture : « 26/30 » = 26 sur 30 ; un nombre seul (« 30 », tel qu'écrit à la création) = chargeur
  plein ; vide = la capacité du catalogue, si l'arme y est. Décompter écrit « 26/30 » ; Recharger
  écrit « 30/30 ». Sans capacité lisible (ni dans le champ ni au catalogue), les boutons se taisent.
- 27/11 — David : « Heures saisies » → bouton « Récupérer la PSI » avec les heures écoulées ;
  Clock-OS n'écrit pas la fiche.
- 27/11 — David : « Oui, pilote 2.2.0 » → champ GM-OS `degats_incapacitants` (absent de la fiche
  HTML), écrit par la porte des dégâts, rendu par « Une heure de repos ».

## Le comment

### Fichiers et réutilisation

- `src/modules/dice/systemes/depensesDeTraveller.ts` (neuf, pur) : `munitionsConsommees(mode, auto)`,
  `depenseDePsi({ cout, portee, reussie, psi })` → `{ depense, degats }`, `psiRecuperee(heures, psi,
  max)`, `roundsDeNeutralisation(degats, end)`, `testDeReveil(des, mdEnd, echecs)`.
- `src/modules/dice/systemes/pouvoirsPsioniques.ts` (neuf) : la table des pouvoirs p. 225-229 (talent,
  nom, difficulté, portée, coût), relue en image.
- `DegatsDeTraveller.tsx` (TRV-A2) : ligne « Munitions » et bouton Décompter ; lit `arme_N_munitions`
  et `chargeur` au catalogue (`armesDeTraveller` gagne `munitions` et `chargeur`).
- `TravellerAuJet.tsx` : carte « Pouvoir psionique » quand la compétence est un talent psionique
  (lignes libres de la fiche nommées Télépathie, Clairvoyance, Télékinésie, Conscience, Téléportation).
- `CombatCard.tsx` : boutons Recharger, Récupérer la PSI, Une heure de repos, Test de réveil, dans
  une carte `RessourcesDeTraveller.tsx` (neuve), à côté de `DoseDeRadiations`.
- Porte des dégâts (`physiqueDeTraveller.ts`) : rend les rounds de neutralisation ; `useCombatStore`
  pose l'état « Neutralisé » (durée en rounds, `processStatusDurations` le décompte déjà).
- Écritures de la fiche : `ecrireLaFicheDuCombattant` (aligne MD et total, TRV-A3).
- Journal : `useJournalStore.addEvent({ type: 'COMBAT', … })`, comme la porte des dégâts.

### Données : qui lit, qui écrit

- `arme_N_munitions` : lu par la fiche HTML (`weapons.N.ammunition`), écrit par l'éditeur, la
  tablette, la fiche HTML et désormais Combat-OS — tous par les écrivains alignés de TRV-A3.
- `psi` : déjà écrit par les mêmes ; `psi_max` relevé par l'alignement (TRV-A5).
- Champ neuf éventuel `degats_incapacitants` : GM-OS seulement (pas de clé sur la fiche HTML), comme
  `psi_max`.
- État « Neutralisé » : `combatant.statuses`, déjà décompté et diffusé par Combat-OS.

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : les gestes sont chez le meneur ; la tablette ne fait que lancer.
- [x] Chemin de données : rien dans `electron/`.
- [x] Tablettes rechargées par Vite : aucun état propre à la tablette.
- [x] Deux ports : non concerné.
- [x] Textes : en dur et en français, comme les cartes de Traveller existantes.
- [x] Échap : aucune surcouche neuve.

### Écran : prompt Stitch

Pas d'écran neuf : des lignes et des boutons dans les cartes existantes, sur l'habillage de
`DoseDeRadiations` et `DegatsDeTraveller`.

### Essais

`npx vitest run --maxWorkers=4` sur les fichiers neufs et touchés ; `npx tsc -b` ; lint ; e2e des
captures de Traveller (une scène « Ressources »).

## Tâches

- [x] T1 · Table des pouvoirs relue au livre (p. 225-229, blocs à une colonne) — couvre C3 · essai : `depensesDeTraveller.test.ts` · touche src/ ⛔
- [x] T2 · Logique pure des dépenses et durées — couvre C1, C4, C5, C6, C8 · essai : `depensesDeTraveller.test.ts` · touche src/ ⛔
- [x] T3 · Munitions sur la carte Dégâts, Recharger — couvre C1, C2, C9 · essai : `RessourcesDeTraveller.test.tsx` (munitions) · touche src/ ⛔
- [x] T4 · Carte « Pouvoir psionique » et dépense — couvre C3, C4, C9 · essai : `PsioniqueTraveller.test.tsx` · touche src/ ⛔
- [x] T5 · Récupérer la PSI, Une heure de repos, Test de réveil — couvre C5, C7, C8, C9 · essai : `RessourcesDeTraveller.test.tsx` · touche src/ ⛔
- [x] T6 · État « Neutralisé » posé par la porte des dégâts — couvre C6, C9 · essai : `physiqueDeTraveller.test.ts`, `neutralisationDeTraveller.test.ts` · touche src/ ⛔
- [x] T7 · Pilote 2.2.0 si un champ neuf est décidé ; manuel 53/54, captures, synthèse, registre — couvre C10 · à essayer par David

## Analyse

- 27/11 — Chaque critère C1 à C9 a sa tâche et son essai ; C10 est à l'écran par David. Aucune
  tâche sans critère. Aucun fichier du plan n'est modifié par un autre agent (`git status`). Les
  quatre questions de périmètre sont tranchées (Décisions, 27/11) ; T7 fait le pilote 2.2.0.
- 27/11 — Écart trouvé en chemin, hors du chantier : le push de TRV-A3 à A5 a été refusé par
  `registreComplet.test.ts` (le magasin `useInitiativeDeTravellerStore` n'était déclaré dans aucun
  registre de purge) ; correction d'une ligne dans `HORS_PERIMETRE`, avant T1.

## Réalisation — 27/11/2026

- Fichiers neufs : `dice/systemes/depensesDeTraveller.ts` (+ essai), `dice/systemes/pouvoirsPsioniques.ts`,
  `combat/logic/munitionsDeTraveller.ts`, `combat/components/MunitionsDeTraveller.tsx`,
  `combat/components/RessourcesDeTraveller.tsx` (+ essai), `session/components/fields/PsioniqueTraveller.tsx`
  (+ essai), `combat/neutralisationDeTraveller.test.ts`.
- Touchés : `drivers.ts` (`physiqueTraveller.incapacitants`), `physiqueDeTraveller.ts` (dégâts
  incapacitants retenus), `attaqueDeTraveller.ts` (munitions et chargeur des armes), `DegatsDeTraveller.tsx`
  (ligne des munitions, aussi sur un tir manqué ou sans cible), `JetDuCombattant.tsx`, `PanneauDeJet.tsx`
  (surcouche des écritures de Traveller, carte psionique, dégâts de l'excédent), `CombatCard.tsx`,
  `useCombatStore.ts` (état « Neutralisé »), `CharacterSheetEditor.tsx` (écrivain du jet aligné),
  `controlesDuPilote.ts`, `finir_traveller.py` 2.2.0, `verifier_pilote.mjs`, e2e des captures.
- Écart de lecture laissé à David : la récupération de la PSI commence à la quatrième heure.
- Vérifié : `npx tsc -b` ; lint ; `npx vitest run src/modules/combat src/modules/dice/systemes
  src/modules/forge/rules src/modules/session src/modules/remote electron/manuelDesJeux.test.ts
  electron/correspondanceDesFiches.test.ts src/services/purge --maxWorkers=4` (471 fichiers, 4 775
  essais) ; `node outils/traveller/verifier_pilote.mjs` (zéro constat) ; e2e Traveller.
