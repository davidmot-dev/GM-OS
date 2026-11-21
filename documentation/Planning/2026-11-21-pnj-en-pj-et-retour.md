# Transformer un PNJ en personnage joueur, et l'inverse — spécification, 21/11/2026

> Demande de David (21/11) : « je voudrais pouvoir transformer un PNJ en Personnage Joueur, et
> vice-versa. Peux-tu prévoir les transformation et les gestes permettant de faire cela ? »
> État : **clos** — livré le 21/11, validé par David le jour même (« ca marche, commit et
> pousse »). Registre § 268.

## Ce qui existe — lu dans le code le 21/11

- **Deux listes séparées.** Un PNJ est une *entité* de la campagne (`Entity`, liste `entities`,
  identifiant `e-…`). Un PJ est un *personnage* rangé chez un joueur (`PlayerCharacter`, dans
  `players[].characters`, identifiant `pc-…`). Ils partagent l'essentiel : nom, image,
  `templateId`, `sheetData`, `healthSystem`, `relations`, `faction`, description, campagne.
- ⚠️ **Le faux ami : le bouton « Changer le type : PNJ, Monstre, Joueur »** de la fiche PNJ
  (`NpcDetail.tsx:369-383`). En position « Joueur », il ne fait que changer une étiquette
  (`Entity.type = 'pc'`). L'entité reste un PNJ : elle n'est rangée chez aucun joueur, aucune
  tablette ne peut la prendre, et elle n'entre pas dans le roster.
- **Le modèle à suivre : le transfert d'un PJ d'un joueur à l'autre** (14/09,
  `logic/transfertDePersonnage.ts`). Il **garde l'identifiant**, et tout ce qui vise le
  personnage le suit sans réécriture : fiche, séance du soir (`sessionEntityIds` mêle PJ et PNJ),
  cartes tenues (`porteur`), combattants. Le seul point qui ne suit pas est le verrou de la
  tablette, qui reflète les clients connectés : l'écran le **dit**.
- **Aucun code ne devine PJ ou PNJ à partir du préfixe** `pc-` / `e-` de l'identifiant
  (recherche de `startsWith('pc-' | 'e-')` : aucun résultat hors essais). Garder l'identifiant
  en changeant de liste est donc possible.
- **Ce qui désigne un personnage par son identifiant ET son genre** devra, en revanche, être
  réécrit :
  - les relations des autres personnages (`EntityRelation.targetType: 'pc' | 'npc'`) ;
  - les combattants du plateau (`isPlayer`, `sourcePlayerId` ou `sourceEntityId`) ;
  - les scènes de la trame (`entiteIds` pour les PNJ, `personnagesIds` pour les PJ) ;
  - les rencontres (`entiteId`) ;
  - les PNJ projetés ou épinglés dans la galerie.

## Le quoi

### Parcours

1. **Un PNJ rejoint le groupe, en séance.** Sur la fiche du PNJ, David clique **Faire un
   personnage joueur…** et choisit le joueur qui le jouera. Le personnage apparaît dans le roster
   de ce joueur, avec sa fiche, sa santé, ses relations et son image. Il disparaît de la galerie
   des PNJ. Le joueur peut le prendre sur sa tablette. S'il était dans une scène ou sur le plateau
   de combat, il y reste, désormais compté parmi les PJ.
2. **Un PJ devient un PNJ** : le joueur quitte la table, le personnage se retire ou passe à
   l'ennemi. Dans le roster, sur la carte du PJ, David clique **Faire un PNJ…** et choisit son
   rôle (allié, neutre, hostile). Le personnage passe dans la galerie des PNJ de la campagne et
   quitte le roster du joueur. Si une tablette le tient encore, l'écran le dit.
3. **L'aller-retour.** Un PJ devenu PNJ, puis redevenu PJ, retrouve ce qu'il avait. Dans
   l'autre sens aussi.

### Critères d'acceptation

- C1 · Après « Faire un personnage joueur », le personnage est dans le roster du joueur choisi
  et n'est plus dans la galerie des PNJ. Son nom, son image, sa fiche (`sheetData`, gabarit), sa
  santé, ses relations, sa faction et sa description sont intacts — essai.
- C2 · Après « Faire un PNJ », le personnage est dans la galerie des PNJ de sa campagne, avec le
  rôle choisi, et n'est plus chez son joueur. Mêmes données intactes que C1 — essai.
- C3 · **Rien de ce qui le désignait ne se perd** : sa place dans la séance du soir, dans les
  scènes de la trame, sur le plateau de combat, et les relations des autres personnages vers lui
  le désignent toujours, avec le bon genre (PJ ou PNJ) — essai.
- C4 · Les données sans équivalent de l'autre côté restent en réserve sur le personnage et
  reviennent telles quelles au retour (décision Q3). Un aller-retour PNJ → PJ → PNJ, ou
  PJ → PNJ → PJ, rend un personnage identique à celui du départ, sauf le joueur choisi et le
  rôle choisi. Il porte **en plus** la réserve de la vie qu'il vient de quitter, pour la
  retrouver s'il repasse de l'autre côté ; un second aller-retour ne change plus rien
  (précisé le 21/11 en T1) — essai.
- C5 · Un geste qui ne peut pas aboutir le dit, sans rien changer :
  - aucun joueur pour recevoir le PNJ ;
  - un PJ sans campagne (un PNJ en exige une) ;
  Vérifié par un essai. Un PJ tenu par une tablette, lui, **se transforme**, et un message dit que
  la tablette le tient encore (décision Q4). La tablette affiche alors « ce personnage n'est plus
  un personnage joueur » au lieu d'une fiche vide.
- C6 · Une confirmation dit ce qui va changer avant d'agir, et un message dit ce qui a été
  fait — à l'écran par David.
- C7 · L'étiquette « Joueur » du bouton de type de la fiche PNJ ne fait plus croire à une
  transformation. Proposé : le cycle se réduit à « PNJ / Monstre » ; un PNJ déjà marqué
  « Joueur » garde son étiquette jusqu'au prochain clic (question de détail, à confirmer avec T8) —
  essai, puis à l'écran par David.
- C8 · La transformation survit au redémarrage, à l'export `.gmos` de la campagne et à la
  sauvegarde automatique — essai, puis à l'écran par David.

### Hors champ

- Changer de jeu ou de gabarit de fiche pendant la transformation : la fiche reste celle de son
  jeu.
- Transformer un PNJ du générateur (NPC-OS, le mémo) : il s'exporte d'abord en PNJ de campagne,
  ce qui existe déjà.
- Transformer depuis la tablette d'un joueur : le geste est réservé au meneur.
- Transformer un combattant fabriqué du plateau, sans fiche de campagne.

### Ce que David garde

- Le personnage transformé, avec sa fiche, sa santé, son inventaire, ses notes et ses relations,
  après redémarrage, export `.gmos` et sauvegarde automatique.
- Sa fiche HTML reliée (`ficheId`), gardée en réserve pendant qu'il est PNJ et rendue au retour.
- La réserve elle-même, après redémarrage et dans l'export `.gmos`.

## Décisions

- 21/11 — **Q1, David : « Déplacer »**. Le personnage change de liste et **garde son
  identifiant**, comme pour le transfert entre joueurs. Il n'y a jamais deux exemplaires du même
  personnage.
- 21/11 — **Q2, David : « Fiche PNJ + roster »**. « Faire un personnage joueur… » se trouve sur la
  fiche du PNJ, à côté de Projeter / Combat / Carte. « Faire un PNJ… » se trouve sur la carte du
  PJ dans le roster, à côté du transfert. Ni la carte de combat ni la tablette n'ont de geste.
- 21/11 — **Q3, David : « Gardées en réserve »**. Ce qui n'a pas d'équivalent reste rangé sur le
  personnage, invisible de l'autre côté, et revient au retour.
- 21/11 — **Q4, David : « Transformer et le dire »**. Un PJ tenu par une tablette se transforme,
  et un message le dit, comme pour le transfert.
- Questions de détail, avec la proposition qui sera appliquée sauf avis contraire de David :
  - **Q5** : le bouton de type de la fiche PNJ ne cycle plus que sur « PNJ / Monstre » (C7, T8).
  - **Le joueur qui reçoit un PNJ** : la liste montre tous les joueurs, ceux qui ont déjà un
    personnage dans la campagne en tête. Sans aucun joueur, le geste le dit et propose « Ajouter
    un joueur ».
  - **Le rôle d'un PJ devenu PNJ** : « Allié » par défaut, au choix dans la confirmation. Il est
    **visible des joueurs** et marqué « rencontré », puisqu'ils le connaissent, sauf si sa
    réserve dit autre chose.
  - **Les cartes tenues par un PJ devenu PNJ** (Deck-OS) reviennent au meneur, et la
    confirmation le dit. Un PNJ ne tient pas de main.
  - **Les rencontres préparées qui envoient un PNJ devenu PJ** ne sont pas modifiées. La
    confirmation les nomme (« il figure dans 2 rencontres préparées, qui ne l'enverront plus ») ;
    T5 vérifie ce que fait l'invocation d'un PNJ absent.

## Le comment

### Fichiers et réutilisation

- **Logique pure, neuve** — `src/modules/session/logic/transformationDuPersonnage.ts`, sur le
  modèle de `transfertDePersonnage.ts` (même forme de résultat, mêmes refus par motif, la liste
  d'origine rendue **par référence** en cas de refus) :
  - `pnjEnPersonnage(entite, campagnes, pilotes) → PlayerCharacter`, et `personnageEnPnj(pj, rôle)
    → Entity` : correspondance champ par champ, même `id`. `gmSecretInfo` ↔ `gmNotes`, `avatar` ↔
    `portraitUrl` ; `systemId` repris, sinon celui du pilote de la campagne
    (`piloteDuPersonnage`) ; `hp` et `maxHp` d'une entité, qui sont obligatoires, lus sur
    `healthSystem` quand le PJ ne les a pas.
  - **La réserve** : un champ facultatif `reserveDeTransformation?: { pj?: …; pnj?: … }` sur les
    deux types (`player.types.ts`, `entity.types.ts`).
    - Côté PJ : `inventoryItems`, `inventory`, `ficheId`, `playerNotes`, `hubOptions`,
      `tokenUrl`, `linkedDocumentIds`, `referenceDeFiche`, `classRace`, `donneesModifieesLe`.
    - Côté PNJ : `type`, `role`, `status`, `ac`, `speed`, `initiative`, `roleplayingNotes`,
      `voiceProfile`, `isVisibleByPlayers`, `vuParLesJoueurs`, `linkedMapIds`, `sourceRef`.
    - À chaque passage, on range ce qui n'a pas d'équivalent et on rend la réserve de l'autre
      côté.
  - `reecrireLesLiens(etat, id, versLeGenre)` : les relations de **tous** les PJ et PNJ qui le
    visent (`targetType`), et les scènes de la trame (`entiteIds` ↔ `personnagesIds`).
  - `refusDeLaTransformation` : PNJ ou PJ introuvable, joueur introuvable, PJ sans campagne.
- **Le magasin de séance** (`entitySlice.ts`) — deux actions, `transformerEnPersonnage(entiteId,
  joueurId)` et `transformerEnPnj(joueurId, personnageId, role)`. Chacune écrit en **un seul
  `set`** les entités, les joueurs et la trame, pour qu'une sauvegarde ne surprenne jamais le
  personnage dans les deux listes, ou dans aucune. Elles rendent le motif d'un refus.
  `trameSlice` est une tranche du même magasin : vérifier en T3 que son état est bien atteint par
  `get()`.
- **Le plateau de combat** (`combat/useCombatStore.ts`, `updateCombatant`) — le combattant dont
  `sourceEntityId` ou `sourcePlayerId` vise l'identifiant change de genre (`isPlayer`, l'un des
  deux liens). L'écriture est appelée **par l'écran**, après l'action de séance, comme le fait
  déjà le transfert pour la sélection. Le pont `plateauDeCombat()` de `entitySlice.ts` reste
  réservé à la santé.
- **Deck-OS** (`deckSlice`, `donnerLaCarte` / `porteur`) — les cartes tenues par un PJ devenu PNJ
  reviennent au meneur (`porteur: null`), par l'action existante.
- **Écrans** :
  - `NpcDetail.tsx` : bouton « Faire un personnage joueur… » dans la rangée Projeter / Combat /
    Carte (l. 479-481), qui ouvre une confirmation avec la liste des joueurs. Le cycle du type
    (l. 369-383) perd « Joueur ».
  - `CharacterGrid.tsx` : bouton « Faire un PNJ… » à côté du transfert, qui ouvre une
    confirmation avec le rôle, puis réutilise `leVerrouDeLAncienJoueur` pour le message sur la
    tablette.
  - `HubCharacterSheet.tsx:69` : un message au lieu du `return null` quand le personnage tenu a
    disparu.
- **Textes** : clés `modules:session.transformation.*` en français et en anglais
  (`src/locales/*/modules.json`).
- **Documentation** : le guide 10 (cockpit, roster) et le guide des PNJ, le registre.

### Données : qui lit, qui écrit

| Donnée | Écrivains aujourd'hui | Ce que le chantier ajoute | Lecteurs à vérifier |
| --- | --- | --- | --- |
| `entities` | `addEntity`, `updateEntity`, `deleteEntity`, Forge de campagne, import `.gmos` | `transformerEn…` (retire ou ajoute, même id) | galerie, fiche PNJ, Combat-OS, Oracle, export Obsidian, tablette (PNJ montrés) |
| `players[].characters` | `addCharacterToPlayer`, `transfererLePersonnage`, `remote…` (tablette, réservés au meneur) | idem | roster, tablette, Loot-OS, messagerie, Deck-OS |
| `relations[].targetType` | `addRelation`, `removeRelation` | réécrit pour l'identifiant transformé | Social Nexus, export |
| `scenes[].entiteIds` / `personnagesIds` | trame | l'identifiant passe d'une liste à l'autre | trame en cours, journal, Oracle (`AIService`), `etatDeLaTable` |
| combattant `isPlayer` / `source…Id` | `addCombatant`, `updateCombatant` | `updateCombatant` | carte de combat, `coc.ts`, santé (`refleterLaFiche`), Map-OS (`combattantDeLEntite`) |
| `sessionEntityIds` | séance | **rien** : la liste mêle PJ et PNJ | — |
| cartes `porteur` | Deck-OS | rendues au meneur (PJ → PNJ) | main de la tablette |

### Risques GM-OS (cochés)

- [x] **Fenêtres multiples** : les deux actions vivent dans le magasin de séance, que la garde
  `ecritureReserveeAuMJ` réserve au meneur. Les boutons ne s'affichent pas sur la tablette.
- [x] **Chemin de données** : rien dans `electron/`.
- [x] **Tablettes** : une tablette qui tient un PJ devenu PNJ affiche le message de C5. En
  `npm run dev`, une tablette rechargée par Vite ne garde rien en mémoire, et cela ne change rien
  ici.
- [x] **Les deux ports** : non concernés.
- [x] **Textes** : clés i18n vérifiées par l'essai des clés. Les boutons reprennent les classes
  de leurs voisins, ce qui couvre les deux régimes de taille.
- [x] **Échap et surcouches** : les confirmations passent par `gmCustom` ou `gmConfirm`, déjà
  inscrits au registre des surcouches. Le défaut du § 1 bis (une question de la médiathèque
  remplace le formulaire) ne joue pas : aucune médiathèque ici.
- [x] **Persistance** : une seule écriture par action (voir plus haut). Pas de champ neuf hors
  de `reserveDeTransformation`, que l'export emporte avec le reste du personnage.

### Écran : prompt Stitch

Pas d'écran ni de section neufs : deux boutons dans des rangées existantes, et deux
confirmations à une seule liste (joueur, rôle), sur le modèle du transfert entre joueurs. **Pas
de maquette Stitch**, sauf si David en demande une.

### Essais

- `transformationDuPersonnage.test.ts` :
  - correspondance des champs, dans les deux sens ;
  - aller-retour sans perte dans les deux sens (C4) ;
  - liens réécrits (C3) ;
  - refus, avec la liste rendue par référence (C5).
- `entitySlice.transformation.test.ts` : une seule écriture, le personnage dans une seule liste,
  la trame suivie.
- `NpcDetail.transformation.test.tsx`, `CharacterGrid.transformation.test.tsx` : le bouton, la
  confirmation, le message, le combattant changé de genre, les cartes rendues.
- `HubCharacterSheet` : le message au lieu de la fiche vide.
- L'export `.gmos` d'une campagne qui contient un personnage transformé, avec sa réserve (C8).
- `npx vitest run --maxWorkers=4 src/modules/session src/modules/combat src/components/hub`,
  `npx tsc -b`, eslint, `npm run build`, puis une capture e2e des deux gestes.

## Tâches

- [x] T1 · La correspondance des champs et la réserve, dans les deux sens —
      `logic/transformationDuPersonnage.ts`, `reserveDeTransformation` sur les deux types ·
      couvre C1, C2, C4 · essai : `transformationDuPersonnage.test.ts` (aller-retour sans perte)
      · touche src/ ⛔ — **fait le 21/11** (« non », GM-OS ne tournait pas). Type
      `src/types/transformation.types.ts` (listes `CHAMPS_PROPRES_AU_PJ` / `_AU_PNJ`, drapeau
      `sansPointsDeVie` pour un PJ sans points de vie : un PNJ en exige). Une note vide et une
      note absente se valent. Un ancien PJ n'est « visible, rencontré » que s'il n'a jamais été
      PNJ.
- [x] T2 · Les refus et la réécriture des liens (relations, scènes de la trame) — même fichier ·
      couvre C3, C5 · essai : même fichier · touche src/ ⛔ — **fait le 21/11** :
      `reecrireLesRelations`, `deplacerDansLesScenes`, `transformerEnPersonnage` /
      `transformerEnPnj`. Refus `introuvable`, `joueur-introuvable`, `sans-campagne` et
      `deja-present`, avec l'état d'origine rendu par référence. Vérifié :
      `npx vitest run --maxWorkers=4 src/modules/session/logic/transformationDuPersonnage.test.ts`
      (18 essais).
- [x] T3 · Les deux actions du magasin de séance, en une seule écriture — `entitySlice.ts` ·
      couvre C1 à C3 · essai : `entitySlice.transformation.test.ts` · touche src/ ⛔ — **fait
      le 21/11** : `transformerEnPersonnage(entiteId, joueurId)` résout le jeu par
      `piloteDuPersonnage`, ce qui donne `systemId` et le gabarit si le PNJ n'en a pas.
      `transformerEnPnj(joueurId, personnageId, role)`. Un abonné ne voit qu'**une** écriture,
      où le personnage figure une seule fois. Un refus n'écrit rien. Aller-retour par le
      magasin. Vérifié : 4 essais, puis `npx tsc -b`.
- [x] T4 · Le combattant du plateau change de genre · couvre C3 · touche src/ ⛔ — **fait le
      21/11**, autrement que prévu. Une action dédiée,
      `useCombatStore.changerLeGenreDuCombattant(id, versPersonnage, rôle)`, remplace
      `updateCombatant`, qui aurait renvoyé la santé vers la fiche (`syncCombatantToSession`)
      sans raison. La règle pure est dans `combat/logic/genreDuCombattant.ts` : `isPlayer`,
      `sourcePlayerId` ↔ `sourceEntityId`, et le camp (`player`, ou celui du rôle). Le camp
      d'après le rôle est **extrait** de `invocationDeRencontre.ts` (`campDuRole`), qui
      l'emploie aussi. Map-OS n'a rien à changer : ses jetons visent le combattant par son
      identifiant (`linkedCombatantId`), qui ne bouge pas. L'écran appelle l'action en T6 et
      T7. Vérifié : `genreDuCombattant.test.ts` (5) et les essais de l'invocation.
- [x] T5 · Les cartes tenues reviennent au meneur ; recensement des rencontres préparées qui
      envoient ce PNJ · couvre C3, C6 · touche src/ ⛔ — **fait le 21/11** :
      `suitesDeLaTransformation` donne les cartes tenues (PJ → PNJ) et les rencontres qui
      l'envoient (PNJ → PJ). **Vérifié dans le code** : invoquer une rencontre dont le PNJ a
      disparu le dit déjà (« Un PNJ de cette rencontre n'existe plus : il n'entre pas. »,
      `invocationDeRencontre.ts:219`). Ce n'est donc pas un retour muet ; la confirmation
      nomme ces rencontres d'avance. Vérifié : +3 essais (21 au total).
- [x] T6 · « Faire un personnage joueur… » sur la fiche PNJ : confirmation, choix du joueur,
      message · couvre C1, C5, C6 · touche src/ ⛔ — **fait le 21/11**. Composant
      `components/TransformationDuPersonnage.tsx` (`FaireUnPersonnageJoueur`), ajouté à la
      rangée Projeter / Combat / Carte de `NpcDetail`.
      - La confirmation se déplie sous le bouton : pas de fenêtre de plus, donc rien à inscrire
        au registre des surcouches.
      - La liste des joueurs met en tête ceux de la campagne. Les rencontres qui l'envoyaient
        sont nommées. Sans joueur, la confirmation le dit et « Transformer » est désactivé.
      - Après « Transformer » : magasin de séance, puis combattant, puis la fiche se relâche.
      - Textes `modules:session.transformation.*` en français et en anglais.

      Vérifié : `TransformationDuPersonnage.test.tsx` · **à essayer par David**.
- [x] T7 · « Faire un PNJ… » dans le roster : confirmation, rôle, message sur la tablette, et le
      message de la tablette au lieu d'une fiche vide · couvre C2, C5, C6 · touche src/ ⛔ —
      **fait le 21/11**.
      - `FaireUnPnj` est posé sous « Transférer vers… » sur la carte de `CharacterGrid`. Le rôle
        proposé est celui de la réserve, sinon « Allié ».
      - Les cartes tenues reviennent au meneur (`donnerLaCarte(…, null)`).
      - Si une tablette tient le personnage, la confirmation et le message le disent.
      - `HubCharacterSheet` affiche « Ce personnage n'est plus un personnage joueur… »
        **seulement si** le personnage tenu figure parmi les PNJ. Un personnage introuvable au
        démarrage, avant la synchronisation, garde l'écran vide d'avant.

      Vérifié : `TransformationDuPersonnage.test.tsx`, 10 essais pour T6 et T7 · **à essayer
      par David**.
- [x] T8 · Le cycle du type de la fiche PNJ perd « Joueur » · couvre C7 · touche src/ ⛔ —
      **fait le 21/11**. Le cycle va de PNJ à Monstre et revient ; un PNJ marqué « Joueur »
      repasse sur PNJ au prochain clic. L'info-bulle dit « Changer le type : PNJ ou Monstre ».
      Vérifié : `NpcDetail.transformation.test.tsx` (3) · **à essayer par David**.
- [x] T9 · Survie au redémarrage et à l'export `.gmos` · couvre C8 · touche src/ ⛔ (essai seul) —
      **fait le 21/11**.
      - Export puis import : `system/archive/transformationDansLArchive.test.ts` (2). La réserve
        part et revient, côté PNJ comme côté PJ.
      - Redémarrage : les schémas de sauvegarde sont en `.passthrough()` (`types/schemas.ts`),
        la réserve passe donc sans y être nommée.
      - Le clonage d'une campagne ne réécrit pas les liens de la réserve (`linkedMapIds`,
        `sceneId`), mais il ne les réécrit pas non plus sur un PNJ ordinaire : pas de cas
        nouveau.
- [x] T10 · Livraison — **faite le 21/11**.
      - `npx vitest run --maxWorkers=4 src/modules/session src/modules/combat src/components
        src/modules/system/archive src/locales src/stores src/types` : 367 fichiers, 3 171
        essais réussis.
      - `npx tsc -b`, eslint sur les fichiers touchés, `guidesDuManuel` et `manuelDesJeux`.
      - `npm run build`, puis e2e `e2e/transformationDuPersonnage.spec.ts` (2 réussis, campagne
        de démonstration, instance jetable). Le Superviseur Hale devient le PJ de Mathis ; Idris
        Koa devient un PNJ hostile. Quatre images relues, rangées hors du dépôt.
      - Guides : 10 (§ « Faire d'un personnage joueur un PNJ, et l'inverse ») et 20 (« Faire un
        personnage joueur… », bouton du type).
      - Registre § 268.

      **À essayer par David** : un PNJ allié qui rejoint un joueur, puis l'inverse sur un PJ
      tenu par une tablette.

## Analyse

- 21/11 — relecture croisée :
  1. **Couverture** : C1 → T1, T3, T6 ; C2 → T1, T3, T7 ; C3 → T2 à T5 ; C4 → T1 ; C5 → T2, T6,
     T7 ; C6 → T5 à T7, T10 ; C7 → T8 ; C8 → T9, T10. Chaque critère a sa tâche et son essai, ou
     son « à essayer par David ».
  2. **Aucune tâche sans critère.** Le message de la tablette (T7) vient de la décision Q4 et
     de C5.
  3. **Décisions et AGENTS.md** : le transfert entre joueurs (14/09) garde l'identifiant, et ce
     chantier aussi. Pas de branche, rien dans `electron/`, « GM-OS tourne-t-il ? » avant T1.
  4. **Aucun `[À TRANCHER]` de périmètre restant.** Cinq questions de détail portent une
     proposition (section Décisions) : David peut en changer une sans toucher au plan.
  5. **`git status`** : `NpcDetail.tsx`, `CharacterGrid.tsx`, `entitySlice.ts`,
     `HubCharacterSheet.tsx` et `useCombatStore.ts` ne sont pas modifiés en ce moment. Les
     seules modifications de `src/` en cours sont mes fichiers de la médiathèque (§ 266), hors
     du plan.
- **Écart trouvé** : le bouton « Joueur » existant (C7) n'était pas dans la demande. Il entre
  au chantier parce qu'il promet déjà ce que ce chantier fait vraiment ; le laisser tel quel
  ferait deux gestes pour une même idée, dont un faux.
