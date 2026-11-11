# Jets demandés et jets cachés — idées reprises de GM Codex — spécification, 11/11/2026

> Demande de David (10/11) : « peux-tu examiner cette application et me dire s'il y a des
> éléments intéressants à reprendre dans GM-OS ? » (`C:\Projet_David\gm-codex.exe`), puis
> (11/11) : « fais-moi un plan et vois si les propositions peuvent être généralisées à
> d'autres drivers ».
> État : **livré, à essayer par David** — T1 à T10 faits le 11/11 ; reste l'essai à l'écran (meneur, pupitre) et sur tablette physique, et la capture de la bannière. Registre § 243. Registre : à inscrire (voir Analyse).

## Origine

*GM Codex* (alpha 0.377, Tauri, polonais) est un compagnon de meneur pour *Alien*. Son
interface a été extraite de l'exécutable sans le lancer (`tmp` de session) ; son journal des
versions (340 entrées) et son aide intégrée ont été lus. Six idées retenues le 10/11 ; ce
document les rapporte aux **dix-sept pilotes** de GM-OS et en spécifie le premier lot.

**On reprend des idées, jamais des contenus** : les tables (matrices D66 du mode solo,
missions, rencontres) appartiennent au livre d'*Alien* ou à l'auteur du Codex.

## Les six idées, rapportées aux pilotes

| # | Idée (GM Codex) | Ce que GM-OS a déjà (lu dans le code le 11/11) | Généralisable ? | Suite |
| --- | --- | --- | --- | --- |
| 1 | **Le meneur transmet un jet à un joueur** : le jet part sur la tablette, le joueur lance | La tablette lance depuis sa fiche (`PanneauDeJet`, onglet « Lancer un test », **tous les jeux** depuis le 22/10, registre § 147) et le résultat remonte (`fiche:resultat`). Cthulhu Hack : la tablette *demande* et le meneur résout (`fiche:jet`). **Le sens meneur → joueur n'existe pas** | **Oui, aux 17 pilotes** : la demande porte la composition du `DescripteurDeJet` (`choix` des composantes, difficulté, modificateur du seuil), que chaque pilote décrit déjà. Trois familles à éprouver séparément : jets à seuil composé (Dune, Symbaroum, COC, Crimes, Argyropée, Barbarians, RuneQuest, Shadowrun, Nephilim, Torg, NOC, Star Trek), jets à réserve (Alien, Degenesis, Blade Runner), cible calculée (Rêve de Dragon) ; Cthulhu Hack passe par ses Sauvegardes | **Lot 1** |
| 2 | **Jet caché** : seul le meneur voit le résultat | Rien : tout jet posé dans `lastRoll` part aux tablettes (`segmentDesDes`) et le magasin des dés est persisté en entier dans le `localStorage` que partagent Hub et projecteur | **Oui, aux 17 pilotes** : le pupitre et le panneau de jet du meneur sont communs. Aucun jeu n'a besoin d'une règle à lui ; c'est une pratique de meneur | **Lot 1** |
| 3 | **Rappel d'un jet dû** : bandeau qui pulse et signal de MU/TH/UR quand le temps a passé | Clock-OS : jauges (`TensionClock`) cachables (`vueParLesJoueurs`), qui avancent à la scène (`pasParScene`) ; minuteur avec sonnerie de fin. **Aucune jauge ne dit « quand je suis pleine, lance ceci »** | **Oui** : les jauges sont communes. Usages repérés : Alien (Stress, horloges de menace), Torg (Conflit), Blade Runner (enquête), Degenesis, Dune (Menace), et toute jauge de tension posée à la main | Lot 2, à spécifier après le lot 1 |
| 4 | **Les onglets suivent l'équipement** : le détecteur n'apparaît que si le personnage en porte un | Modules du jeu remis **par le meneur** à un personnage (`autoriser(moduleId, personnages)`) ; catalogue d'équipement relié à la fiche (§ 203) | **Partiellement** : il faut à la fois un module et un catalogue. Aujourd'hui seul **Alien** a les deux (détecteur, MU/TH/UR) ; Star Trek a des modules sans catalogue. Les autres jeux n'ont pas de module à ouvrir | Lot 3, Alien d'abord, quand le catalogue s'étendra |
| 5 | **Groupe de survivants mené par une jauge** (sept états, dés en renfort, éclaté en PNJ au combat) | Hordes de Torg (`HordeDuCombattant`), sbires (`SbiresDuVilain`), exemplaires (`nombreDExemplaires`) | **Non comme chantier commun** : chaque jeu a sa propre règle de groupe, déjà servie là où elle existe. Pour Alien, la règle citée par le Codex (« Last Survivor », p. 304-305) **reste à trouver dans le livre français** | Garé : vérifier d'abord dans le livre (skill `relire-un-corpus`) |
| 6 | **Polices locales** (Defender prenait un lien externe + script local pour de l'hameçonnage) | 16 thèmes sur 17 et `index.css` chargent Google Fonts ; liste close `HOTES_DE_POLICES` | Oui techniquement (tous les thèmes) | **Écarté** — David, 11/11 : on ne joue jamais sans Internet |

## Le quoi — lot 1

### Parcours

1. **Le meneur demande un jet, à la table.** Sur la fiche d'un personnage joueur (onglet
   « Lancer un test » du meneur), David compose le jet comme d'habitude — « Agilité +
   Mobilité », difficulté — et choisit **« Demander à Wilson »** au lieu de « Lancer ».
   Sur la tablette de Wilson, une bannière s'affiche : *« Le meneur te demande : Agilité +
   Mobilité »*. Un appui ouvre « Lancer un test » **déjà composé**. Le joueur ajoute ce que
   son jeu lui permet (dés achetés, Panache, avantage, cartes…), lance ; le résultat remonte
   au pupitre et au journal comme aujourd'hui, **marqué comme réponse à la demande**. Chez
   le meneur, la demande passe de « en attente » à « lancé ».
2. **Le meneur annule une demande** restée sans réponse (le joueur est parti chercher à
   boire) : la bannière disparaît de la tablette.
3. **La tablette se recharge** pendant qu'une demande attend (Vite en `npm run dev`, Wi-Fi
   coupé) : la demande revient à la reconnexion.
4. **Le meneur lance en caché.** Même onglet, même composition, interrupteur
   **« Jet caché »**. Le résultat s'affiche **chez le meneur seulement** (pupitre, journal
   marqué caché). Tablettes, écran de table, Player Hub et projecteur continuent d'afficher
   le jet visible précédent : **rien ne dit qu'un jet a eu lieu**.
5. **Un jet caché depuis le pupitre de dés** (sans fiche : « 1d100 pour savoir si la
   patrouille passe ») : même interrupteur, même effet.

### Critères d'acceptation

- **C1** · Une demande composée chez le meneur arrive sur la tablette **du seul personnage
  visé** ; aucune autre tablette ne la reçoit (lue au serveur, pas cachée à l'affichage) —
  essai.
- **C2** · La tablette ouvre « Lancer un test » avec la composition demandée : composantes,
  difficulté, modificateur du seuil — pour **chacune des trois familles de jet** (seuil
  composé, réserve, cible calculée) et pour les Sauvegardes de Cthulhu Hack — essai.
- **C3** · Le joueur peut encore ajouter ce que son jeu propose avant de lancer (décision du
  11/11) ; il ne peut pas changer de personnage — essai.
- **C4** · Le résultat d'une demande remonte par `fiche:resultat`, porte l'identifiant de la
  demande, et la demande passe à « lancé » chez le meneur ; un résultat qui ne correspond à
  aucune demande ouverte s'inscrit comme aujourd'hui — essai.
- **C5** · Une demande annulée disparaît de la tablette ; une demande déjà lancée ne se
  relance pas — essai.
- **C6** · Une tablette rechargée retrouve la demande ouverte qui la vise — essai (e2e) +
  à l'écran par David sur tablette physique.
- **C7** · Un jet caché n'atteint **ni** `lastRoll`, **ni** le segment des dés envoyé aux
  tablettes, **ni** le `localStorage` partagé avec le Hub et le projecteur — essai.
- **C8** · Un jet caché s'inscrit au journal **marqué caché**, et ce marquage le tient hors
  de tout ce qui part vers les joueurs (résumés publics, Hub) — essai.
- **C9** · Le pupitre du meneur montre le jet caché, distinctement (étiquette « caché ») —
  à l'écran par David.
- **C10** · Les dix-sept pilotes (Within excepté, retiré) produisent une demande valide depuis
  leur descripteur réel — essai sur les pilotes de recette (`GMOS_PILOTES_DES_JEUX`).
- **C11** · La page 53 du manuel des jeux décrit la demande et le jet caché, captures
  comprises — à l'écran par David.

### Hors champ

- Le rappel de jet dû (idée 3), les modules ouverts par l'équipement (idée 4) : lots 2 et 3.
- Les jets **sans fiche demandés à un joueur** (« lance 1d6 ») : le joueur n'a pas de pupitre
  libre sur sa tablette, seulement son panneau de fiche.
- Une demande adressée à **plusieurs** joueurs d'un coup (jet de groupe) : à reconsidérer
  après l'essai du lot 1.
- Le jet caché **lancé par le joueur** (le Codex le fait pour ses « jets du monde ») : chez
  GM-OS, la tablette calcule le jet elle-même ; un résultat caché au joueur doit donc être
  lancé par le meneur — c'est le parcours 4.
- Les idées 5 (garée) et 6 (écartée).

### Ce que David garde

- Les **demandes** voyagent dans le **fil des messages** de la campagne (choix de T3, 11/11) :
  elles en suivent le sort — gardées avec le fil, rendues à une tablette qui se reconnecte,
  et donc **encore ouvertes après un redémarrage de GM-OS** tant que le meneur ne les a pas
  annulées ni reçu leur jet. *Corrige la première version de ce paragraphe* (« perdue au
  redémarrage ») : le fil fait mieux, sans rien à garder de plus.
- Les **jets cachés** vivent dans le journal de séance (persisté, exporté avec la campagne)
  avec leur marque ; ils ne vivent **pas** dans l'historique persisté des dés.

## Décisions

- 11/11 — David : premier lot = **demande de jet + jet caché** ; le rappel de jauge et les
  modules ouverts par l'équipement suivent en lots séparés.
- 11/11 — David : un jet caché **n'affiche rien** sur la tablette (ni « le meneur a lancé »).
- 11/11 — David : à une demande, **le joueur lance**, sur un jet prérempli qu'il peut
  compléter de ce que son jeu permet.
- 11/11 — David : **on ne joue jamais sans Internet** → idée 6 écartée.
- 11/11 — Choix de réalisation (T3) : la demande et sa clôture sont **deux messages privés
  du meneur**, l'état se déduit du fil (`filDesDemandes.ts`). Aucun canal neuf ; le serveur
  retire ces champs des messages de joueur.
- 11/11 — David (« Ok pour les 3 questions ») : les **trois maquettes Stitch sont adoptées**
  (`stitch/jets-demandes/`), codées avec les composants et le thème du jeu, sans les
  inventions relevées dans `prompts.md` ; le bouton s'appelle **« Demander à (personnage) »** ;
  les messages de clôture (« ✓ Jet reçu : … », « Demande annulée : … ») **restent visibles**
  dans la messagerie du joueur.

## Le comment

### Fichiers et réutilisation (lus le 11/11)

- **Composer** : `src/modules/session/components/fields/PanneauDeJet.tsx` tient la
  composition dans `choix` (composante → champ), `difficulte`, `modificateurDuSeuil` (l. 201
  à 221). La demande **est** cet état, sérialisé ; le panneau reçoit une composition initiale
  facultative. Appelants : `CharacterSheetEditor.tsx` (meneur), `HubCharacterSheet.tsx`
  (tablette), `PanneauJetDeFiche.tsx`, `PanneauDeCoc.tsx`.
- **Acheminer** : `electron/destinatairesDesMessages.ts` porte déjà la règle « à qui est ce
  message », lue au serveur, avec le fil rendu à une tablette qui se reconnecte. La demande
  voyage sur ce chemin (C1, C6) plutôt que sur un canal neuf.
- **Autoriser** : `electron/actionPolicy.ts` refuse déjà qu'un joueur parle pour un personnage
  qui n'est pas le sien ; la réponse à une demande y passe.
- **Remonter** : `src/modules/remote/actions/ficheActions.ts` (`fiche:resultat`) et
  `src/modules/dice/resultatVenuDeLaTablette.ts` (relecture champ par champ) — on y ajoute
  l'identifiant de demande, relu comme le reste.
- **Cacher** : `src/stores/useDiceStore.ts` (`setLastRoll`, persisté **sans `partialize`**),
  `src/modules/remote/segmentDesDes.ts` (seul point d'envoi des dés aux tablettes),
  `src/modules/journal/consignerLeJet.ts` (journal). Le jet caché prend un chemin à part :
  pupitre du meneur (état **non persisté**) + journal marqué, **jamais** `setLastRoll`.
- **Cthulhu Hack** : `src/components/hub/JetsDeLaFiche.tsx` et `src/modules/dice/jetDepuisLaFiche.ts`
  — la demande d'une Sauvegarde ouvre le bouton correspondant.

### Données : qui lit, qui écrit

| Donnée | Écrivain | Lecteurs | Garde |
| --- | --- | --- | --- |
| Demandes ouvertes | fenêtre du meneur seule | serveur (acheminement), tablette visée, pupitre | `ecritureReserveeAuMJ` si un magasin zustand la porte ; sinon état du serveur, non persisté |
| Réponse à une demande | tablette visée | meneur (`fiche:resultat`) | `actionPolicy` |
| Jet caché | fenêtre du meneur seule | pupitre du meneur, journal | hors `useDiceStore` persisté ; hors `segmentDesDes` |
| Journal (événement marqué caché) | `consignerLeJet` | journal, résumés, Oracle | vérifié en T5 : aucun lecteur ne part vers les joueurs ; nature `trace` → hors du récit résumé |

### Risques GM-OS (cochés)

- [x] **Fenêtres multiples** : Hub et projecteur partagent le `localStorage` de
  `gmos-dice-storage` ; d'où le chemin à part du jet caché (C7).
- [x] **Chemin de données** : rien de neuf n'appelle `app.getPath('userData')`.
- [x] **Tablettes rechargées par Vite** : la demande doit survivre → fil des messages rendu à
  la reconnexion (C6).
- [x] **Les deux ports** : le serveur de synchronisation (`mediaPort`) porte la demande ; rien
  ne passe par Vite.
- [x] **Textes** : clés i18n à créer réellement (fr, en) ; bannière de tablette en cible de
  48 px ; tailles relues dans les deux régimes.
- [x] **Échap et surcouches** : la bannière n'est pas une surcouche modale ; si elle le
  devient, passer par le registre unique.
- [x] **Secrets** : le jet caché rejoint la famille GM-05 (secrets filtrés au serveur, pas à
  l'affichage) — même principe, même essai.

### Écran : prompt Stitch (avant T6 et T9)

Deux éléments neufs, à dessiner d'abord (consigne du 02/11), captures Playwright de départ :

1. **Tablette — bannière de demande** : sous l'en-tête de la fiche, une bande à l'accent du
   thème : « Le meneur te demande : *Agilité + Mobilité* · difficulté 1 », bouton « Lancer »
   (48 px), état « envoyé ». Thème du jeu (jetons `--app-*`), régime table.
2. **Meneur — onglet « Lancer un test »** : à côté de « Lancer », un bouton « Demander à
   (personnage) » et un interrupteur « Jet caché » ; une ligne d'état des demandes ouvertes
   (en attente / lancé / annuler).

### Essais

- `npx vitest run --maxWorkers=4 <fichiers touchés>` à chaque tâche ; `npx tsc -b`.
- Un essai de serveur pour l'acheminement (C1, C6) sur le modèle de
  `destinatairesDesMessages`.
- Un e2e « demande → tablette → résultat » sur la vraie porte WebSocket, à la manière des
  parcours NP-C3 (`e2e/reprisesEtVariantesDesPilotes.spec.ts`).
- C10 : un essai qui parcourt les pilotes de recette (`GMOS_PILOTES_DES_JEUX`).

## Tâches

- [x] **T1** · La demande de jet comme donnée : type `DemandeDeJet` (personnage, composition =
      `choix` + difficulté + modificateur du seuil, ou Sauvegarde Cthulhu Hack), construite
      depuis l'état du panneau et relue champ par champ à l'arrivée — `src/modules/dice/demandeDeJet.ts`
      (neuf) · couvre C2, C10 · essai : `demandeDeJet.test.ts` + parcours des 17 pilotes ·
      touche src/ ⛔
      **Fait le 11/11** (GM-OS fermé). Le module porte aussi `composantesARetenir` et
      `champsProposes`, les règles du panneau écrites une fois (le panneau les reprend en T2).
      Constat : Alien, Degenesis et Shadowrun 2.x n'ont pas de `seuil` — leurs composantes sont
      dans la réserve ; le même `choix` les couvre. Essais :
      `npx vitest run --maxWorkers=4 src/modules/dice/demandeDeJet` → 48 réussis (règle, familles,
      relecture réseau, pilote Dune du code, **20 pilotes exportés** de `Export Dirvers/`) ;
      `npx tsc -b` et eslint propres. ⚠️ **C10 partiel** : les exports du dépôt couvrent 9 jeux
      (Alien, Argyropée, Barbarians, COC, Degenesis, RuneQuest, Shadowrun, Torg, Within) + Dune ;
      les 8 autres (Symbaroum, Crimes, Cthulhu Hack, Nephilim, NOC, Rêve de Dragon, Star Trek,
      Blade Runner) se vérifient en exportant leurs pilotes dans un dossier passé par
      `GMOS_PILOTES_DES_JEUX`. L'essai lit les zip par `process.getBuiltinModule` (le projet
      `renderer` réécrit `node:fs` et `adm-zip` y rend un texte vide ; côté `electron`, le
      descripteur entraîne toute l'application dans la vérification de types).
- [x] **T2** · `PanneauDeJet` accepte une composition initiale facultative et ne la perd pas
      au premier rendu ; le personnage reste verrouillé — `PanneauDeJet.tsx` · couvre C2, C3 ·
      essai : rendu par famille (seuil, réserve, cible) · touche src/ ⛔
      **Fait le 11/11.** Prop `compositionInitiale`, lue au montage (l'appelant changera la
      `key` à chaque demande, T8) ; le panneau prend désormais `composantesARetenir` et
      `champsProposes` dans `demandeDeJet` (une règle, deux lecteurs). `PanneauJetVoyageur`
      (Rêve de Dragon) reçoit la même prop ; sa difficulté est l'`ajustementDeDifficulte`.
      Essais : `PanneauDeJet.demande.test.tsx` (seuil + modificateur, réserve + difficulté,
      retouche par le joueur, panneau sans demande) ; les **31 fichiers** `PanneauDeJet*`
      → 283 réussis, dont les 27 anciens, inchangés ; `npx tsc -b`, eslint propres.
- [x] **T3** · Acheminement : la demande et son annulation voyagent au seul personnage visé et
      reviennent à la reconnexion — `electron/destinatairesDesMessages.ts`, `electron/SyncServer.ts`,
      `electron/actionPolicy.ts` · couvre C1, C5, C6 · essai : test du serveur · touche
      electron/ ⛔
      **Fait le 11/11.** La demande voyage dans un message privé du meneur (`SessionMessage`
      gagne `demandeDeJet` et `suiteDeDemande`) : acheminement au seul destinataire et fil
      rendu à la reconnexion **existaient déjà** (12/10). Neuf : `src/modules/dice/filDesDemandes.ts`
      (messages, `demandesOuvertes` — ne croit que `GM`), gestes `demanderUnJet` /
      `cloreLaDemande` dans `uiSlice.ts`, et `sansLesChampsDuMeneur` au serveur, appliqué dans
      `SyncServer.forwardToGM` avant tout relais d'un message de joueur. Essais :
      `filDesDemandes.test.ts` (9), `electron/destinatairesDesMessages.test.ts` (+4 : remise au
      seul visé, fil rendu, nettoyage).
- [x] **T4** · Réponse : `fiche:resultat` porte l'identifiant de demande ; la demande passe à
      « lancé », une demande close ne se rouvre pas — `ficheActions.ts`,
      `resultatVenuDeLaTablette.ts` · couvre C4, C5 · essai : cas « demande ouverte / close /
      inconnue » · touche src/ ⛔
      **Fait le 11/11.** Les six envois de `fiche:resultat` (cinq dans `PanneauDeJet`, un dans
      `PanneauJetVoyageur`) passent par `joindreLaDemande(demandeId)` ; nouvelle prop
      `demandeId` sur les deux panneaux. Chez le meneur, `ficheActions` clôt la demande ouverte
      **de ce personnage** (résultat de tablette, et Sauvegarde de Cthulhu Hack par `fiche:jet`) ;
      un identifiant inconnu, déjà clos ou d'un autre personnage ne change rien, le jet
      s'inscrit comme avant. Essais : `ficheActions.test.ts` (+5), `resultatVenuDeLaTablette.test.ts`
      (+2). Passe large : `npx vitest run --maxWorkers=4 src/modules/session src/modules/dice
      src/modules/remote src/components/hub electron` → **409 fichiers, 4 925 réussis**, 4 sautés
      (antérieurs) ; `npx tsc -b`, eslint propres.
- [x] **T5** · Jet caché : chemin à part (pupitre non persisté + journal marqué), jamais
      `setLastRoll` ; inventaire des lecteurs du journal qui partent vers les joueurs, et
      filtre — `useDiceStore.ts` ou magasin neuf, `consignerLeJet.ts`, `segmentDesDes.ts` ·
      couvre C7, C8 · essai : un jet caché n'apparaît ni dans le segment, ni dans le
      `localStorage`, ni dans un résumé public · touche src/ ⛔
      **Fait le 11/11** (GM-OS fermé). Magasin neuf `src/modules/dice/jetsCaches.ts` :
      `useJetsCachesStore` (20 derniers jets, **en mémoire seulement** : ni `persist`, ni
      `exposerMagasinDuHub`, ni `CrossWindowEventService`) et `garderLeJetCache(jet, seuil?)`,
      qui remplace `setLastRoll` pour un jet caché. `consignerLeJet` gagne `cache` : titre
      « Jet caché : … », `metadata.cache`, nature **toujours `trace`** (une réussite
      particulière cachée ne monte pas au récit) ; `estUnJetCache(evenement)` pour les
      lecteurs. **Inventaire des lecteurs du journal** (lu le 11/11) : **aucun ne part vers
      une tablette** — le journal n'est dans aucun segment de `useNexusSynchronizer`, ni
      dans `CrossWindowEventService` ; il est persisté (`journal-os-storage-v2`), ce que veut
      « Ce que David garde ». Le seul chemin indirect est le **résumé IA** (`resumeIA`, nourri
      par `leRecitAResumer`, qui ne prend que le récit) que David pourrait recopier à la main
      dans le résumé public (`publicSummary`, écrit seulement à la main, envoyé aux
      tablettes) : la nature `trace` l'en tient hors ; le promouvoir à la revue reste le
      geste de David. Le panneau de fiche du meneur ne passe déjà pas par `setLastRoll` : en
      T7, son jet caché appellera `consignerLeJet({ …, cache: true })`. Essais :
      `jetsCaches.test.ts` (6 : `lastRoll`, historique et segment inchangés ;
      `gmos-dice-storage` écrit **mais** sans le jet caché, vérifié après
      `viderLesEcrituresDifferees` ; borne de 20 ; marque ; nature `trace`). Passe :
      `npx vitest run --maxWorkers=4 src/modules/journal src/modules/dice src/modules/remote
      src/stores` → 132 fichiers, 1 658 réussis ; `npx tsc -b`, eslint propres.
- [x] **T6** · Prompt Stitch des deux éléments, captures de départ, choix de David — aucun
      code · couvre C9 (préparation)
      **En cours le 11/11.** Trois prompts écrits depuis le code (tablette, onglet du meneur,
      pupitre — le pupitre s'ajoute aux deux prévus, T7 le touche) avec leurs captures de
      départ : `documentation/Planning/stitch/jets-demandes/prompts.md`. Projet Stitch créé
      (`projects/4411473442520563995`). Premier envoi arrêté sans écran ; renvoyé à la demande
      de David : **les trois écrans ont abouti**, rendus et rangés avec ce que Stitch a inventé
      (`1-tablette-banniere.png`, `2-meneur-lancer-un-test.png`, `3-pupitre-jet-cache.png`).
      Reste : le choix de David.
- [x] **T7** · Meneur : boutons « Demander à… » et « Jet caché » dans « Lancer un test », ligne
      des demandes ouvertes ; « Jet caché » au pupitre de dés — `CharacterSheetEditor.tsx`,
      `PanneauDeJet.tsx`, pupitre · couvre C9 · essai de rendu · touche src/ ⛔ · **à essayer
      par David**
      **Codé le 11/11** (GM-OS fermé), d'après les maquettes 2 et 3. Neuf :
      `fields/CommandesDuMeneur.tsx` (`InterrupteurJetCache`, `BoutonDemanderA`,
      `DemandesEnCours`) et `suiviDesDemandes` dans `filDesDemandes.ts` (état de chaque demande
      lu dans le fil ; `demandesOuvertes` en dérive). **Panneau commun** : prop
      `nomDuPersonnage` (passée par `CharacterSheetEditor`) ; ses cinq consignations du meneur
      passent par `consignerIci`, qui consigne en caché quand l'interrupteur est allumé ;
      « Demander à » compose avec `composerLaDemande` et se refuse en caché ou sur un jet
      incomplet ; la liste montre les demandes en attente (« Annuler ») puis les trois
      dernières closes. **Panneau du Voyageur** (Rêve de Dragon) : les mêmes trois pièces.
      **Pupitre** : interrupteur dans la barre, « Lancer en caché » en pointillés, jets
      rapides compris ; panneau « Jets cachés » entre le dernier jet et l'historique, sans
      « Projeter » ; `jetsCaches.ts` garde désormais un `JetCache` léger (titre, total, degré),
      alimenté par les deux portes. Clés i18n `dice.agencement.hidden_*` (fr, en).
      **Limites voulues** : un dé de ressource (Cthulhu Hack) ne se lance pas en caché au
      pupitre — il s'écrit sur la fiche que lit la tablette ; un jet caché de fiche qui
      dépense ou crédite une réserve de table la modifie quand même (la réserve est commune).
      Inventions de Stitch non reprises (`stitch/jets-demandes/prompts.md`). Essais :
      `PanneauDeJet.meneur.test.tsx` (7), `jetCacheAuPupitre.test.tsx` (4). Passe :
      `npx vitest run --maxWorkers=4 src/modules/session src/modules/dice src/modules/remote
      src/modules/journal src/components/hub src/stores electron` → **435 fichiers, 5 186
      réussis**, 4 sautés (antérieurs) ; `src/locales/deuxLangues.test.ts` et voisins
      (5 fichiers) ; `npx tsc -b`, eslint propres.
- [x] **T8** · Tablette : bannière de demande, ouverture de « Lancer un test » composé ;
      Sauvegarde Cthulhu Hack — `HubCharacterSheet.tsx`, `JetsDeLaFiche.tsx` · couvre C2, C3 ·
      essai de rendu · touche src/ ⛔ · **à essayer par David**
      **Codé le 11/11** (GM-OS fermé), d'après la maquette 1. Neuf :
      `src/modules/dice/demandesDeLaTablette.ts` (demandes **à lancer** = ouvertes dans le fil
      et pas encore envoyées ; envois notés sur `fiche:resultat` et `fiche:jet` porteurs d'un
      `demandeId`, en mémoire ; « Jet envoyé au meneur » 6 s ; `precisionsDeLaDemande`) et
      `src/components/hub/BanniereDeDemande.tsx`. **Deux places** : dans la fiche, entre
      l'en-tête et les onglets ; et, fiche fermée, en haut du Hub de la tablette
      (`TabletHub.tsx`, `z-[140]`, sous les surcouches) — « Lancer » y ouvre la fiche **sur**
      la demande (`demandeAOuvrir`). Dans la fiche, « Lancer » choisit l'onglet « Lancer un
      test » : le panneau est remonté (`key` = la demande) avec `compositionInitiale` **relue
      contre la fiche de la tablette** (`compositionValable`) et `demandeId` ; pour une
      Sauvegarde, `JetsDeLaFiche` reçoit `demande` : son bouton se signale (« demandée »),
      l'avantage part de celui demandé, et seul ce bouton porte le `demandeId`.
      **Constat en chemin, corrigé côté meneur** : un jeu à Sauvegarde n'a pas de « Lancer
      un test » sur la tablette (règle `estUneSauvegarde(decrireLeJetDuPilote(pilote))` de
      `HubCharacterSheet`) ; « Demander à » composait un test qu'elle n'aurait pas su ouvrir.
      `composerPourLaTablette` (`demandeDeJet.ts`) applique **la même règle** et compose une
      demande de Sauvegarde (champ retenu, avantage du panneau) ; les deux panneaux du meneur
      l'emploient. Le message de la demande fait aussi paraître la notification de message
      existante de la tablette (« Maître du Jeu »). Essais : `BanniereDeDemande.test.tsx` (8),
      `HubCharacterSheet.demande.test.tsx` (2 : fiche ouverte sur la demande → onglet composé →
      jet → `demandeId` et seuil 58 dans `fiche:resultat` ; bannière dans la fiche),
      `JetsDeLaFiche.test.tsx` (+2), `PanneauDeJet.meneur.test.tsx` (+1, Sauvegarde). Passe :
      `npx vitest run --maxWorkers=4 src/modules/session src/modules/dice src/modules/remote
      src/modules/journal src/components src/stores src/locales electron` → **459 fichiers,
      5 400 réussis**, 4 sautés (antérieurs) ; `npx tsc -b`, eslint propres.
- [x] **T9** · e2e : demande → tablette → résultat → « lancé », et rechargement de la tablette
      en attente — `e2e/` · couvre C1, C4, C6
      **Fait le 11/11.** `e2e/jetsDemandesEtCaches.spec.ts`, deux parcours sur la vraie fenêtre
      du meneur (profil jetable de `lancerGmOs`) et deux tablettes WebSocket sur la vraie porte
      du serveur, comme NP-C3 : (1) « Demander à Wilson » depuis « Lancer un test » → remise à
      la seule tablette visée (C1) → `fiche:resultat` avec `demandeId` → « lancé » chez le
      meneur et suite reçue par la tablette (C4) ; un second jet ne clôt pas deux fois (C5) ;
      tablette fermée, seconde demande, reconnexion → la demande revient dans le fil (C6) ;
      « Annuler » → suite « annulée » transmise (C5) ; l'autre tablette n'a rien reçu. (2) Au
      pupitre, un jet visible arrive dans le segment des dés de la tablette (témoin), puis un
      jet caché ne change ni `lastRoll`, ni l'historique, ni ce que la tablette reçoit (C7).
      Piège payé : une tablette qui se reconnecte doit présenter son **jeton de reprise**
      (`repriseModules`), sinon le serveur répond `reprise_refusee` — le client d'essai le garde
      comme une vraie tablette. Le rendu de la bannière sur une page de tablette n'est pas
      couvert ici (aucun navigateur Playwright installé à la bonne version) : il l'est par
      `HubCharacterSheet.demande.test.tsx`, et reste **à essayer par David** sur tablette.
      Commandes : `npm run build`, puis `env -u ELECTRON_RUN_AS_NODE npx playwright test
      e2e/jetsDemandesEtCaches.spec.ts` → **2 réussis** (19 s). Captures et bilans dans
      `output/verification-jets-demandes/`.
- [x] **T10** · Manuel page 53 et captures, synthèse des pilotes (ligne commune), registre —
      couvre C11 · **à essayer par David** sur tablette physique (C6)
      **Fait le 11/11** (registre ouvert par David : « Oui vas y »). Manuel : page 53, sous-section
      « Demander un jet au joueur, lancer en caché » dans « Le jet », capture
      `captures/jet-demande-au-joueur.jpg` ; page 34 (Dice-OS), « Le jet caché », capture
      `captures/jets-caches-au-pupitre.jpg` ; page 61 (tablette), « Le meneur te demande un jet »
      — **sa capture manque** (bannière à photographier sur tablette). Captures prises par l'e2e
      de T9, pas par `capturesDesJeux` : la fonction est commune, pas propre à un jeu. Synthèse
      des pilotes : ligne 🟠 dans « Améliorations communes ». Registre : **§ 243** et ligne **179**
      de la vue d'un coup d'œil, ajoutées sans toucher la ligne du § 242 déjà modifiée hors de
      cette session. Essais : `electron/guidesDuManuel.test.ts`, `electron/manuelDesJeux.test.ts`
      et voisin → 3 fichiers, 48 réussis.

## Lots suivants (à spécifier chacun à son tour)

- **Lot 2 — Rappel d'un jet dû.** Une jauge Clock-OS peut porter « quand je suis pleine (ou à
  chaque pas), rappeler ce jet » ; le rappel s'allume au cockpit du meneur, discret, et
  s'éteint au jet. Commun à tous les jeux ; à relier au lot 1 (le rappel peut ouvrir une
  demande). Questions à poser alors : son, place du rappel, jauges cachées seulement ?
- **Lot 3 — Modules ouverts par l'équipement.** ⏸️ **Mis de côté par David le 11/11** (« on ne va pas
  faire le lot 3, on va le mettre de côté »). Un objet du catalogue déclare le module qu'il
  donne (détecteur, MU/TH/UR) ; quand une fiche le porte, GM-OS **propose** au meneur de
  remettre le module au personnage. Alien seul tant que le catalogue n'a pas gagné d'autres
  jeux (« Reste : les autres jeux », § 203).
- **Lot 2 — fait** le 11/11 (§ 244) ; **lots 1 et 2 validés par David le 11/11.**

## Second examen, 11/11 — le détecteur de mouvement et les autres outils (⏸️ mis de côté)

> Question de David (11/11) : « Si tu prends gm-codex.exe, est-ce qu'il y a quelque chose sur les
> détecteurs d'Alien ou autres ? » — puis « tu as noté toutes ces idées ? ». **Rien n'est
> décidé : idées consignées, aucun chantier ouvert.** On reprend des idées, jamais des contenus.

**Comment on l'a lu.** L'exécutable n'a pas été lancé. GM Codex est une application Tauri : ses
18 fichiers d'interface sont rangés dans une table de l'exécutable (nom → contenu compressé en
Brotli). Script de lecture : relever chaque nom (`/index.html`, `/dane/aplikacja.js`,
`/js/nostromo-bundle.js`, 21 Mo…), retrouver son entrée dans la table (pointeur et longueur du nom,
puis pointeur et longueur du contenu, 32 octets par entrée), décompresser. Extraction faite dans le
dossier temporaire de la session, **non conservée** — à refaire si besoin (deux minutes). Le
journal des versions y compte **56 entrées sur le détecteur** (1er octobre–9 novembre 2026), en
polonais, anglais et allemand.

**La différence de fond.** Le détecteur de GM Codex **lit le jeu** : une carte tactique en cases de
2,5 m, des PNJ qui vivent selon un emploi du temps, et le détecteur qui voit ce qui bouge vraiment.
Celui de GM-OS (§ 163, A8, page 54 Alien) est un **accessoire de mise en scène** — contacts tirés au
hasard dans une proximité choisie, faux écho, bips, préréglages — avec un **mode discret** (plan de
zones, pions cachés, batterie du M314). La plupart des idées ci-dessous se brancheraient sur ce mode
discret.

**Le détecteur, de la plus rentable à la plus coûteuse :**

1. **Ce qu'il ne voit pas** : les morts, les endormis, les inconscients, ceux qui guettent ; et
   surtout le **xénomorphe immobile**, qui se fond dans la ruche ou attend en embuscade — dès qu'il
   bouge pour chasser, il paraît. Pour GM-OS : un état « immobile » sur un pion caché du mode discret.
2. **Un cône à orienter** : il ne voit que dans son champ, autour d'un cap que le joueur tourne.
   Sur téléphone, le cap suit le **gyroscope** — GM Codex sert pour cela la page des joueurs en
   **HTTPS** (certificat créé une fois, adresse `http` gardée « sans gyroscope »). ⚠️ C'est la même
   limite de **contexte non sûr** qui bloquait le LANCER de la tablette le 11/11 (§ 243,
   `randomUUIDHorsContexteSur.ts`) : le gyroscope, comme `randomUUID`, est réservé au contexte sûr.
3. **Des modèles différents** — portée, angle, autonomie, écran (secteur vert avec voyants de charge ;
   arc bleu avec la distance de l'écho le plus proche en chiffres rouges ; grille d'un appareil
   bricolé), son, montage sous le canon. ⚠️ **À recouper avec les appareils du livre** (skill
   `relire-un-corpus`) avant d'en reprendre un seul : plusieurs modèles du Codex peuvent être des
   inventions de son auteur.
4. **Le détecteur bricolé** : l'écho tombe jusqu'à 3 cases à côté du vrai point, différent à chaque
   onde ; la distance ment ; il vide sa batterie vite.
5. **Brouillage et tempête magnétique, en cinq niveaux** : parasites à l'écran → écho décalé de ±1 à
   ±3 cases → portée réduite (×¾, ×½) → échos fantômes → taches au lieu de points. Un appareil
   **blindé** compte deux niveaux de moins. Dans la zone d'un brouilleur : plus de retour, parasites
   sur tout l'écran, un grésillement au lieu du ton.
6. **Un anneau de huit segments** (module « tout autour ») : il s'allume dans la direction d'un
   mouvement **hors du champ**, sans point ni distance — il faut tourner l'appareil pour voir.
7. **Le son** : une onde à chaque balayage ; un ton plus aigu quand la cible approche ; des ondes qui
   s'accélèrent dès qu'une cible est à portée. **Aucune étiquette** sur les points, même chez le
   meneur : on voit l'écho, pas le nom de ce qui bouge.
8. **La batterie** : un jet de charge à chaque tour de combat, et toutes les 10 minutes de séance hors
   combat (comme une lampe) ; le « moment de calme » remet le compteur.
9. **L'écho qui erre** : un être dans une pièce n'est pas immobile ; son écho glisse d'une case à
   l'autre à chaque onde, sans sauter.

**Les autres outils du meneur relevés :**

- **La voix et la radio** : la voix ne traverse pas les murs (parler, chuchoter : même pièce ; crier :
  la pièce voisine) ; la radio demande un appareil de communication ; un message diffusé sur un canal
  n'a pas de destinataire — c'est ainsi qu'on joue l'écoute de deux PNJ.
- **L'alarme des PNJ qui se propage** : par un cri dans la pièce, par la radio vers les pièces
  voisines si le PNJ en porte une (les xénomorphes n'en ont pas besoin).
- **Les objets bricolés**, à la manière d'*Alien: Isolation* : recettes faites de l'équipement du
  personnage, un test par fabrication.
- **Le radar spatial** à écran circulaire (balayage, anneaux de portée, rémanence), ombres radar
  derrière les gros objets, faux échos dans une nébuleuse ; le lien tactique entre vaisseaux alliés.
- **Les autres jeux** : Cyberpunk Red, Delta Green, Twilight: 2000, Tales from the Loop, Vaesen sont
  annoncés mais marqués « bientôt » ; seul Alien est servi.

**Si l'on reprend un jour** : les idées 1 et 2 d'abord (les plus rentables), par le skill
`specifier-un-chantier`, Alien seul ; le gyroscope impose de servir le Hub en HTTPS, ce qui touche
`electron/SyncServer.ts` et le certificat — un chantier à part entière.

## Analyse

- 11/11 — relecture croisée :
  1. C1 à C11 couverts : C1 (T3, T9), C2 (T1, T2, T8), C3 (T2, T8), C4 (T4, T9), C5 (T3, T4),
     C6 (T3, T9, T10 sur tablette), C7 et C8 (T5), C9 (T6, T7, à l'écran), C10 (T1),
     C11 (T10). **Aucun critère sans tâche.**
  2. Aucune tâche sans critère.
  3. Aucune contradiction trouvée avec AGENTS.md (pas de branche, pas de git qui écrit, pas
     de paquet) ni avec les décisions du registre lues (§ 147 onglet « Lancer un test »,
     § 151–153 secrets filtrés au serveur, décision du 12/10 sur les messages privés). La
     demande réutilise le chemin des messages privés **sans** en changer la règle.
  4. Aucun `[À TRANCHER]` de périmètre ; reste un libellé (détail).
  5. `git status` du 11/11 : aucun fichier de `src/` ni `electron/` du plan n'est modifié.
     **Le registre `2026-08-23-chantiers-gares.md` porte des modifications non commitées
     qui ne sont pas de cette séance** : l'inscription au registre (étape 6) attend que son
     écrivain les ait livrées.
- **Écart relevé, hors chantier** : 16 thèmes sur 17 chargent des polices en ligne — sans
  conséquence puisque David joue toujours connecté (idée 6 écartée), à rouvrir si cela change.
