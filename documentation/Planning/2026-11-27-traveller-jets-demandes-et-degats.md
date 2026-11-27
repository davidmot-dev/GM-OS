# Traveller — jets demandés préparés (TRV-A1) et dégâts d'une attaque (TRV-A2) — spécification, 27/11/2026

> Demande de David (27/11) : « Commit - pousse, commence TRV-A1 et TRR-A2 » (TRV-A2), après la revue
> des améliorations de Traveller (synthèse des pilotes, section Traveller).
> État : **livré le 27/11, à essayer par David** — registre § 282.

## Le quoi

### Parcours

**TRV-A1 — le meneur demande un test préparé.**

1. Sur la fiche d'un Voyageur, onglet « Lancer un test », le meneur compose le test (Dextérité +
   Furtivité) et le prépare : Difficile (10+), Coup du sort, plus vite, une action simultanée, la
   chaîne reportée du test précédent, un autre MD.
2. Il clique « Demander à Kathya ».
3. Sur la tablette du joueur, « Lancer un test » s'ouvre déjà composé **et déjà préparé** : la même
   difficulté, le même Coup du sort, la même durée, les mêmes actions, la même chaîne, le même MD.
   Le joueur voit la cible et le MD total qu'aurait vus le meneur.
4. Le joueur lance ; le résultat (Effet, réussite) revient au meneur et clôt la demande, comme
   aujourd'hui.

Aujourd'hui, l'étape 3 retombe sur Moyenne (8+), sans Coup de pouce ni réglage : le test du joueur
n'est pas celui du meneur.

**TRV-A2 — une attaque inflige ses dégâts.**

1. Dans Combat-OS, le meneur clique « Attaquer » sur la carte d'un adversaire qui vise un Voyageur.
2. Le test d'attaque se compose comme un test Traveller (caractéristique + compétence de combat,
   difficulté, MD) ; le meneur lance.
3. Si l'attaque réussit, une carte « Dégâts » propose l'arme (portée, dés de dégâts, traits), lance
   ses dés, ajoute l'**Effet** du test et, en mêlée, le **MD de FOR** de l'attaquant ; elle retranche
   la **protection** de l'armure de la cible (moins le niveau **AP** de l'arme), avec **1 point au
   moins sur un Effet de 6+** ; une arme **destructrice** (DD) multiplie le total par 10.
4. Le meneur voit le calcul détaillé et clique « Appliquer à Kathya » : le montant net passe par la
   porte des dégâts déjà livrée (END, puis FOR ou DEX, MD recalculés ; Incapacitante sur l'END seule).
5. Une créature du bestiaire perd ses PdV de la même façon.

### Critères d'acceptation

- **C1** · Une demande de test Traveller transporte la difficulté, le Coup de pouce ou du sort, la
  durée, les actions simultanées, la chaîne et les autres MD — essai (`demandeDeJet.test.ts`).
- **C2** · Une demande relue du réseau n'accepte que des valeurs bornées (difficulté parmi celles du
  livre, Coup de pouce/sort −1, 0 ou +1, durée −1, 0 ou +1…) ; le reste est jeté — essai.
- **C3** · Sur la tablette, le panneau s'ouvre avec la préparation du meneur ; le joueur peut encore
  la changer (décision du 11/11 : « le joueur garde la main ») — essai de composant, puis **à
  l'écran par David** sur une vraie tablette.
- **C4** · Une demande d'un autre jeu est inchangée (pas de champ `traveller`) — essai.
- **C5** · Le calcul des dégâts suit p. 74-76 : dés de l'arme + Effet (+ MD FOR en mêlée) −
  (protection − AP, au plus à 0), minimum 1 sur Effet 6+, ×10 pour une arme DD — essai sur les
  exemples du livre (`degatsDeTraveller.test.ts`).
- **C6** · « Attaquer » est offert sur la carte d'un adversaire Traveller, et la carte « Dégâts »
  n'apparaît qu'après une attaque **réussie** — essai de composant.
- **C7** · « Appliquer à [cible] » écrit par la porte existante (`handleApplyImpact` → END/FOR/DEX) ;
  une arme Incapacitante reste sur l'END — essai.
- **C8** · L'arme et la protection sont proposées depuis les fiches (la **meilleure** armure de la
  cible), et **modifiables** avant d'appliquer — essai, puis **à l'écran par David**.
- **C9** · Sous le test réussi d'un Voyageur **chez le meneur** (pas sur la tablette), « Dégâts »
  propose une cible parmi les combattants de Combat-OS et le même calcul — essai de composant.
- **C10** · Une créature du bestiaire posée en combat a « Attaquer » : test de Mêlée (naturelles),
  attaque lue dans « Attaques : Morsure (4D) », dégâts par la même carte ; sa propre « Armure (+N) »
  compte quand elle est la cible — essai.
- **C11** · Une arme Auto offre « Rafale » : + niveau Auto aux dégâts (p. 76), et le rappel des
  munitions consommées (autant que le niveau Auto) — essai.

### Hors champ

- Auto complet (plusieurs attaques), Explosion (plusieurs cibles, plonger à couvert), Rayonnement
  (rads), Reflec/Ablat face aux lasers, Encombrante : le calcul les **rappelle**, le meneur les règle
  à la main.
- Le décompte réel des munitions sur la fiche : TRV-A6 (la rafale le rappelle seulement).
- Les dégâts appliqués depuis la **tablette** d'un joueur : le meneur seul écrit les fiches.
- Véhicules et vaisseaux (blindage, coque, critiques) : module TRV-M3.
- Munitions consommées : TRV-A6.
- Initiative et Tactique : TRV-A4.

### Ce que David garde

- Rien de neuf n'est enregistré par TRV-A1 : la demande vit dans le fil existant des demandes.
- TRV-A2 écrit les caractéristiques de la cible par la porte existante — sauvegarde automatique et
  export `.gmos` déjà couverts. La dernière attaque d'un adversaire se retient comme dans les autres
  jeux (`derniereAttaque`).

## Décisions

- 11/11 — David (jets demandés) : « c'est le joueur qui lance » ; la demande ne porte que la
  composition, jamais un résultat ; le joueur garde la main sur ce qui est prérempli. → TRV-A1
  préremplit, ne verrouille pas.
- 26/11 — David : report automatique des dégâts END → FOR/DEX (porte des dégâts, § 278). → TRV-A2
  ne fait que calculer le montant net, puis passe par cette porte.
- 27/11 — David, Q1 : « Adversaires et joueurs » → « Attaquer » dans Combat-OS **et** « Dégâts » sous
  le test réussi d'un Voyageur chez le meneur (C9).
- 27/11 — David, Q2 : créatures « Oui, dans ce lot » → C10.
- 27/11 — David, Q3 : « La meilleure, modifiable » → la plus haute protection des armures de la
  fiche, que le meneur change avant d'appliquer (C8).
- 27/11 — David, Q4 : « Aussi Auto (rafale) » → AP, DD, Incapacitante **et** la rafale (+ niveau Auto,
  p. 76 relue dans le livre le 27/11) ; le reste rappelé (C11).
- Règles relues dans le livre le 27/11 (PDF = imprimée + 1) : MD de FOR ajouté en mêlée « en plus de
  l'Effet » (p. 74) ; armure, minimum 1 sur Effet 6+, AP (p. 75) ; rafale (p. 76).

## Le comment

### Fichiers et réutilisation (lus dans le code le 27/11)

**TRV-A1**
- `src/modules/dice/demandeDeJet.ts` — `CompositionDemandee` gagne `traveller?: ChoixDeTraveller` ;
  `compositionValable` le garde ; `lireLaDemande` le relit borné (C2). Réutilise `CHOIX_DE_TRAVELLER`
  et `DIFFICULTES_DE_TRAVELLER` (`systemes/traveller.ts`).
- `src/modules/session/components/fields/PanneauDeJet.tsx` — l'état `choixTraveller` part de
  `compositionInitiale.traveller` ; `BoutonDemanderA` envoie `traveller: choixTraveller` quand la
  règle Traveller est active.
- `src/components/hub/HubCharacterSheet.tsx` — rien : il passe déjà `compositionValable(…)` au
  panneau. `src/modules/dice/filDesDemandes.ts` — rien : il relit par `lireLaDemande`.

**TRV-A2**
- `src/modules/dice/systemes/degatsDeTraveller.ts` (nouveau) — calcul pur : dés de l'arme (« 3D-3 »,
  « 1DD », « 2D+2 »), Effet, MD FOR en mêlée, protection, AP, minimum, ×10.
- `src/modules/combat/logic/jetDuCombattant.ts` — entrée « Traveller » dans `JEUX_DU_COMBAT`
  (`geste: 'attaquer'`, `degats: 'porte-du-jeu'`) et ce qu'il faut vérifier dans
  `jetDuCombattantPossible`.
- `src/modules/combat/logic/attaqueDeTraveller.ts` (nouveau, plutôt que le grand fichier commun) — `armesDeTraveller(valeurs, catalogue)` :
  lignes `arme_N`, `arme_N_degats`, `arme_N_portee` de la fiche, traits retrouvés au catalogue
  du pilote par le nom.
- `src/modules/combat/components/DegatsDeTraveller.tsx` (nouveau) — la carte « Dégâts », sur le
  modèle de `DegatsDArgyropee.tsx` ; branchée dans `JetDuCombattant.tsx`.
- Lecture de la protection de la cible : `armure_N_protection` (fiche) ; « Armure (+N) » des
  particularités d'une créature ; `logic/protectionDeLaCible.ts` à relire avant d'écrire.
- **Joueurs (C9)** : `SuitesTraveller` (`TravellerAuJet.tsx`) affiche la carte des dégâts quand le
  panneau n'est pas celui des joueurs ; la cible se choisit dans `useCombatStore` (lecture seule).
- **Créatures (C10)** : la créature n'a que des compétences ; son test se compose sur sa fiche de
  plateau (`melee-naturelles`), son attaque se lit dans ses notes (`notesDeLaCreature` les écrit
  depuis `particularites`). Règle du test d'une créature **à relire dans le livre** avant T8.
- L'Effet vient du résultat : `RollResult.traveller.effet` (`resoudreTraveller`), déjà rendu par
  `surLeResultat` à Combat-OS.

### Données : qui lit, qui écrit

- `CompositionDemandee` : écrite par le panneau du meneur ; lue par `lireLaDemande` (tablette et fil
  du meneur), `compositionValable` (tablette, Combat-OS), `PanneauJetVoyageur` (Rêve de Dragon, ne lit
  que `champs` et l'ajustement : inchangé), `JetDuCombattant` (ne passe que `champs` et `difficulte` :
  inchangé).
- Fiche de la cible : un seul écrivain, la porte des dégâts (`handleApplyImpact` →
  `physiqueDeTravellerSelonLeJeu`). TRV-A2 n'écrit rien d'autre.
- `derniereAttaque` du combattant : `retenirLAttaque` (existant).

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : rien d'écrit depuis le hub ni le projecteur ; la tablette ne fait que lire
  la demande.
- [x] Chemin de données : aucun module `electron/` touché.
- [x] Tablettes : contexte non sûr (`http://192.168…`) — pas de `crypto.randomUUID` côté tablette ;
  la demande est composée chez le meneur.
- [x] Les deux ports : pas de nouveau message réseau, le champ voyage dans la demande existante.
- [x] Textes : en dur et en français, comme `TravellerAuJet.tsx` (pas de clé i18n neuve).
- [x] Échap et surcouches : aucune surcouche neuve.

### Écran : prompt Stitch

La carte « Dégâts » est une carte de plus sous le jet, au format des cartes existantes
(`DegatsDArgyropee`, `DommagesDuVoyageur`) : pas d'écran ni de section neuve, pas de prompt Stitch
(consigne du 02/11 réservée aux écrans neufs). À confirmer avec David s'il en veut un.

### Essais

`npx vitest run --maxWorkers=4 src/modules/dice/demandeDeJet.test.ts
src/modules/dice/systemes/degatsDeTraveller.test.ts src/modules/combat/components/JetDuCombattant.traveller.test.tsx`
et les essais existants du panneau et de Combat-OS ; `npx tsc -b` ; lint ; e2e des captures de
Traveller (une scène « Attaquer » ajoutée) après `npm run build`.

## Tâches

- [x] T1 · La demande transporte la préparation Traveller, relue bornée — `demandeDeJet.ts`
      couvre C1, C2, C4 · essai : `demandeDeJet.test.ts` (cas neufs) · touche src/ ⛔
- [x] T2 · Le panneau part de la préparation reçue et l'envoie avec « Demander à » — `PanneauDeJet.tsx`
      couvre C3 · essai : test de composant du panneau Traveller · touche src/ ⛔ · puis à essayer
      par David sur une tablette
- [x] T3 · Le calcul pur des dégâts (dés « 3D-3 », « 1D+2 », « 1DD », Effet, FOR en mêlée,
      protection − AP, minimum, ×10, rafale) — `systemes/degatsDeTraveller.ts` (nouveau)
      couvre C5, C11 · essai : `degatsDeTraveller.test.ts` sur la Dague 1D+2 et le Fusil 3D du
      tableau p. 75 · touche src/ ⛔
- [x] T4 · Les lecteurs : armes de la fiche (traits retrouvés au catalogue par le nom, mêlée par la
      portée), meilleure armure de la fiche, « Armure (+N) » d'une créature — `attaqueDeLAdversaire.ts`
      couvre C8 · essai : cas neufs · touche src/ ⛔
- [x] T5 · Traveller dans `JEUX_DU_COMBAT` (« Attaquer » sur un PNJ à fiche de Voyageur)
      couvre C6 · essai : `JetDuCombattant.traveller.test.tsx` (nouveau) · touche src/ ⛔
- [x] T6 · La carte « Dégâts » (arme, protection modifiable, rafale, calcul détaillé, « Appliquer à
      [cible] » par `handleApplyImpact`, type Incapacitante transmis) — `DegatsDeTraveller.tsx`
      (nouveau), branchée dans `JetDuCombattant.tsx`
      couvre C5, C7, C8, C11 · essai : même fichier de test · touche src/ ⛔
- [x] T7 · « Dégâts » sous le test réussi d'un Voyageur chez le meneur, cible choisie parmi les
      combattants — `TravellerAuJet.tsx`
      couvre C9 · essai : test de composant · touche src/ ⛔
- [x] T8 · L'attaque d'une créature : relire la règle dans le livre, puis test de Mêlée (naturelles)
      et attaque lue dans ses notes, mêmes dégâts — couvre C10 · essai : test de composant · touche src/ ⛔
- [x] T9 · Vérifier et documenter : `tsc -b`, lint, essais ciblés, e2e des captures (scène
      « Attaquer »), manuel 53/54, synthèse, registre — à essayer par David

## Analyse

- 27/11 — relecture croisée :
  1. Chaque critère a sa tâche et son essai : C1-C2-C4 (T1), C3 (T2, plus l'écran de David), C5 et
     C11 (T3, T6), C6 (T5), C7 (T6), C8 (T4, T6, plus l'écran), C9 (T7), C10 (T8).
  2. Aucune tâche sans critère (T9 = vérification et documentation, exigées par AGENTS.md).
  3. Pas de contradiction : la demande préremplit sans verrouiller (11/11) ; les dégâts passent par la
     porte du 26/11 ; aucune écriture depuis la tablette.
  4. Aucun point de périmètre ouvert. Reste un point de **règle**, pas de périmètre : le test d'une
     créature (T8), à relire dans le livre avant d'écrire.
  5. `git status` du 27/11 : aucun fichier de `src/` ni d'`electron/` en cours chez un autre agent.
- **Résumé** : 11 critères, 9 tâches ; T1 à T8 touchent `src/` ; David essaiera la tablette (C3), la
  carte des dégâts (C8) et l'ensemble (T9).

## Réalisation — 27/11/2026

- T1 · `demandeDeJet.ts` + `lireLeChoixDeTraveller` (`systemes/traveller.ts`) — `npx vitest run src/modules/dice/demandeDeJet.test.ts --maxWorkers=4` : vert.
- T2 · `PanneauDeJet.tsx` — `PanneauDeJet.demande.test.tsx` (3 cas neufs) : vert.
- T3 · `systemes/degatsDeTraveller.ts` — `degatsDeTraveller.test.ts` (21 cas) : vert. Le ×10 d'une arme
  DD porte sur les dés obtenus et le bonus de l'arme, avant l'Effet (« multiplie le total des dégâts
  obtenus par 10 », p. 75).
- T4 · `combat/logic/attaqueDeTraveller.ts` — `attaqueDeTraveller.test.ts` (10 cas) : vert.
- T5 à T8 · `jetDuCombattant.ts`, `JetDuCombattant.tsx`, `DegatsDeTraveller.tsx`,
  `AttaqueDAnimalTraveller.tsx`, `FicheDuCombattant.tsx`, `PanneauDeJet.tsx` —
  `JetDuCombattant.traveller.test.tsx` (9 cas) : vert. Le test d'un animal : 2D + sa compétence, que
  le livre donne « avec son MD » (p. 81).
- T9 · `npx tsc -b`, `npx eslint` (fichiers touchés) ; `npx vitest run src/modules/dice src/modules/combat
  src/modules/session/components/fields electron/manuelDesJeux.test.ts src/components/hub --maxWorkers=4` :
  254 fichiers, 2 574 essais ; `npm run build` puis e2e des captures `--grep "Traveller"` : vert,
  `jeu-traveller-degats.jpg` relue ; manuel 54, synthèse, registre § 282.
- **À essayer par David** : C3 (tablette réelle), C8 (la carte à l'écran), l'ensemble.
