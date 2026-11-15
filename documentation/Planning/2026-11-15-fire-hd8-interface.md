# La Fire HD 8 comme interface de GM-OS — spécification, 15/11/2026

> Demande de David (15/11) : « j'ai une vieille Fire Tablet d'Amazon et j'aurais voulu savoir si tu
> pouvais la modifier pour servir d'interface pour mon GM-OS ? », puis : « je voudrais être capable de
> suivre combat-os, lancer des dés, lancer des tables, regarder la campagne active », et « Je voudrais
> être capable d'en faire 3 choses, aider le MJ (comme je viens de le décrire), 2. Piloter les modules
> externe (Alien par exemple) pour les joueurs, 3. Servir d'écran de table comme pour Ulanzi par
> exemple ».
> État : **spécifié, pas commencé** (T1 faite le 15/11, toutes les questions tranchées) — registre § 256.

## L'appareil

- **Amazon Fire HD 8, 7ᵉ génération (2017)**, Fire OS **5.7.1.0** (build 659664620) = **Android 5.1**
  (API 22). Écran 8 pouces, 1280 × 800.
- ⚠️ **Le point qui peut tout changer** : le moteur web de la tablette (Silk, et la WebView du
  système). Vite **7.3.1** compile sans cible déclarée (`vite.config.ts`), donc pour les navigateurs
  « largement disponibles » (Chrome 107 et plus). Si la Fire est en dessous, le Hub ne démarre pas :
  installer un navigateur plus récent, ou compiler aussi pour les vieux moteurs. **À mesurer par ADB**
  (T1) avant toute décision.
- Le Hub y est servi en `http://192.168.…` : contexte **non sûr**, sans `crypto.randomUUID` ni API
  `[SecureContext]` (mémoire du 11/11, le lancer de dés ne faisait rien sur une vraie tablette).
- ADB installé sur le PC le 15/11 à la demande de David : `%LOCALAPPDATA%\Android\platform-tools`
  (adb 1.0.41, binaire signé Google), ajouté au PATH du compte.
- **Mesuré par ADB le 15/11** (`G090ME08747708DD`, produit `douglas`, modèle `KFDOWI`, arm64) :
  Android **5.1.1**, API 22, écran 800 × 1280 à 213 dpi (1280 × 800 en paysage, ~960 × 600 px CSS).
  **Silk 108** (`com.amazon.cloud9` 108.18.4.5359.220.10) et **WebView Amazon 108**
  (`com.amazon.webview.chromium`) : Chromium 108, juste au-dessus de la cible de Vite (107).
  **Firefox 143.0** déjà installé (`org.mozilla.firefox`), moteur récent mais sans mise à jour à
  attendre sur Android 5.
- ⚠️ **Tailwind 4.2.1** vise officiellement Chrome 111 : `oklch()` et `color-mix()` n'existent qu'à
  partir de Chromium 111. La feuille construite en porte 174 et 1 798 ; Tailwind en enveloppe 885 dans
  `@supports (color:color-mix(in lab,red,red))` avec une valeur de repli devant, mais les autres
  n'ont peut-être pas de repli. Sur Silk 108, une déclaration non comprise est ignorée : **couleurs
  manquantes possibles**, pas de plantage. Firefox 143 n'a pas ce problème. À voir à l'écran (T1).

## Ce qui existe déjà (lu dans le code le 15/11)

| Usage demandé | Ce que GM-OS a déjà | Ce qui manque |
| --- | --- | --- |
| **1 · Aider le MJ** : combat, dés, tables, campagne active | La **télécommande** `?window=remote` (`src/modules/remote/RemoteControl.tsx`), appairée par jeton : Pads, Dés (`RemoteDicePad`, dés du pilote), Sons, Scénario, Combat (`RemoteCombatTracker` : suivant, PV), Tableau, Notes (séance, trame, chroniques, Nexus Wiki, indices), Messages. Inventaire complet : [T0 meneur](2026-10-05-T0-tablette-meneur.md) | **Table-OS** : aucun onglet de tables. La campagne active se lit dans Scénario et Notes |
| **2 · Piloter les modules du jeu pour les joueurs** (Alien : MU/TH/UR, détecteur M314…) | `src/modules/modulesDuJeu/` : le meneur ouvre un module **à un personnage** ; la tablette du joueur l'ouvre dans l'onglet « Modules du jeu » (`HubModulesDuJeu.tsx`, rôle `joueur`). Le panneau du MJ liste « Poste MJ » et les `appareils` des personnages (`PanneauDesModulesMJ.tsx`) | Ouvrir un module **à la table** (un appareil commun, sans personnage) : n'existe pas — Q2 |
| **3 · Écran de table, comme l'Ulanzi** | L'afficheur Ulanzi (`src/modules/ulanzi/`) et sa doctrine : **quatre widgets** (jauge, compte à rebours, rang, icône d'état), public par construction, sans phrases ; le pilote dit ce qui mérite l'afficheur (`surLAfficheur`) — [plan](2026-08-23-afficheur-ulanzi.md) | Aucune vue « écran de table » dans un navigateur |

## Essai du 15/11 sur la Fire (T1)

Répétition jetable (`npm run repetition`, ports 4200/4201, profil effacé à la fermeture), Fire en Wi-Fi
sur `http://192.168.0.211:4200`, captures par `adb exec-out screencap` :

| | Silk 108 | Firefox 143 |
| --- | --- | --- |
| Hub joueur (`?window=tablet`) : démarre, se connecte, lobby « Qui es-tu ? » | ✅ | ✅ |
| Couleurs translucides (`color-mix`) | ❌ « Quitter la session » devient un pavé rose plein, texte invisible | ✅ |
| Télécommande appairée (`?window=remote&sync=4200#token=…`) : Pads, Dés, Modules | non essayé | ✅ pastille verte, onglets lisibles en portrait |

**Conclusion : la Fire tourne sous Firefox 143.** Silk est écarté pour GM-OS ; aucune compilation
« vieux moteurs » ni paquet supplémentaire. Combat et Modules étaient vides : la répétition n'avait
pas de campagne active, le parcours réel reste à voir avec une campagne (T13).

## Le quoi

### Parcours

1. **Allumer la Fire.** Elle est sur son chargeur secteur. Firefox s'ouvre sur GM-OS, dans le
   dernier rôle choisi. Un bouton discret « Changer de rôle » ramène à l'**accueil**, qui propose
   trois boutons : *Aide au MJ*, *Appareil de table*, *Écran de table*.
2. **Aide au MJ (en séance).** C'est la télécommande actuelle, avec un onglet de plus : **Tables**.
   David voit l'ordre du combat et passe au suivant, compose et lance un jet, relit la scène en cours
   (Scénario, Notes). Dans **Tables**, il voit les tables du jeu de la campagne active, en choisit une,
   règle un modificateur, tire. Le résultat n'apparaît que sur la Fire (et dans l'historique de
   Table-OS au PC). « Montrer aux joueurs » le partage comme le fait Table-OS au PC.
3. **Appareil de table.** La Fire est posée au centre. Au PC (ou depuis la télécommande d'une autre
   tablette), David ouvre un module **à la table** — le détecteur M314 d'Alien, MU/TH/UR — comme il
   l'ouvre aujourd'hui à un personnage. Le module s'affiche sur la Fire ; les joueurs le manipulent ;
   David le referme et l'écran revient à « Aucun module ouvert ».
4. **Écran de table.** La Fire, debout face aux joueurs, montre en grand les widgets que David a
   cochés pour elle, en séance, au tableau de bord de l'Ulanzi (une colonne « Écran de table ») :
   jauges, compte à rebours, qui joue et qui suit, icône d'état. Elle change seule ; personne n'y
   touche.

### Critères d'acceptation

- C1 · ✅ Firefox 143 sur la Fire affiche le Hub et la télécommande appairée — **vérifié le 15/11**
  (captures ADB). Silk : couleurs perdues, écarté.
- C2 · Depuis la Fire (aide au MJ), « Suivant » dans Combat fait avancer le tour chez le MJ — e2e
  existant `e2e/tabletteMeneurT0.spec.ts` + **à l'écran par David**, avec une campagne.
- C3 · Depuis la Fire, un jet lancé arrive chez le MJ avec le verdict du pilote — e2e existant +
  **à l'écran par David**.
- C4 · L'onglet Tables ne liste que les tables du jeu de la campagne active ; sans jeu ou sans
  dossier de tables, il le dit en une phrase — essai neuf.
- C5 · Un tirage depuis la Fire est fait **par le poste du MJ** (même moteur, même historique de
  Table-OS), son résultat revient **à la seule télécommande** ; aucune tablette de joueur ne le
  reçoit tant que David n'a pas touché « Montrer aux joueurs » — essai neuf.
- C6 · Un module ouvert « à la table » s'affiche sur la Fire en rôle *Appareil de table*, et sur
  aucune tablette de joueur qui n'y a pas accès ; refermé, il disparaît de la Fire — essai neuf
  (service des modules) + **à l'écran par David** (M314).
- C7 · Depuis l'appareil de table, un module ne peut **rien écrire sur une fiche de personnage** ;
  un geste qui le demanderait est refusé avec sa raison — essai neuf par module concerné.
- C8 · En rôle *Écran de table* ou *Appareil de table*, la Fire se connecte **sans privilège** : elle
  reçoit le flux caviardé des joueurs, jamais les notes, secrets ou PV cachés — essai neuf
  (`SyncServer`).
- C9 · L'écran de table n'affiche **que** les widgets cochés pour lui ; décocher un widget au PC le
  retire de la Fire sans geste sur la tablette — essai neuf + **à l'écran par David**.
- C10 · L'écran de table se met à jour sans geste quand une jauge, le round ou le combattant actif
  change — essai neuf + **à l'écran par David**.
- C11 · La Fire rouvre GM-OS dans son dernier rôle (stockage du navigateur, lu sous `try/catch`) ;
  sur son chargeur, elle ne se met pas en veille — **à l'écran par David**.
- C12 · Passer d'un rôle public (*Appareil de table*, *Écran de table*) à *Aide au MJ* demande le
  code à quatre chiffres choisi au PC ; un code faux laisse la Fire dans son rôle public, sans flux
  privilégié ; le code ne transite jamais du poste vers la Fire — essai neuf.

### Hors champ

- Rooter la tablette, ou y installer LineageOS ; Silk ; une application Android native.
- Corriger les couleurs pour les vieux moteurs (Chromium < 111) : noté au § 1 bis du registre pour
  les autres tablettes, pas traité ici.
- La télécommande elle-même (onglets existants) : réutilisée telle quelle, sauf l'onglet Tables.
- Le dessin de l'Ulanzi : l'écran de table lit la même librairie, il ne change pas l'afficheur.
- Le mode kiosque verrouillé (épingler l'application) : seulement si l'essai en séance le réclame.

### Ce que David garde

- Rien ne s'écrit sur la Fire qui ne soit déjà chez le meneur : elle n'écrit pas les magasins
  (`gmOnlyStateStorage`, garde `ecritureReserveeAuMJ`). Elle garde dans Firefox le jeton
  d'appairage et le dernier rôle choisi.
- Le tirage fait depuis la Fire entre dans l'historique de Table-OS (persisté chez le MJ, 50 derniers)
  et, s'il est montré, dans le journal — comme un tirage fait au PC.
- Les widgets cochés pour l'écran de table : avec ceux de l'Ulanzi, dans le magasin de l'Ulanzi
  (persisté chez le MJ), par jeu.
- L'accès « table » d'un module : avec les autres accès du service des modules, le temps de la séance
  (même durée de vie que l'accès d'un personnage).

## Décisions

- 15/11 — David : « installe ADB » → fait (voir L'appareil).
- 15/11 — Q1, David : « Un rôle à la fois » → un écran d'accueil à trois boutons sur la Fire ; elle
  garde son rôle jusqu'à ce qu'on en change.
- 15/11 — Q2, David : « Appareil commun du groupe » → la Fire, posée au milieu de la table, devient un
  **appareil de table** non lié à un personnage ; le meneur y ouvre un module (détecteur M314,
  MU/TH/UR…), les joueurs le manipulent. Nouveau dans `modulesDuJeu` : aujourd'hui un module ne
  s'ouvre qu'à un personnage.
- 15/11 — Q3, David : « Widgets choisis à la volée » → le meneur choisit depuis le PC, en séance, ce
  que l'écran de table affiche (parmi les widgets de l'Ulanzi). Reste public par construction.
- 15/11 — Q4, David : « Jeu actif, résultat au MJ » → seules les tables du jeu de la campagne active ;
  le résultat n'est vu que du meneur, avec un bouton « Montrer aux joueurs ».
- 15/11 — Q7, David : « Le M314 d'abord » → seul le détecteur M314 sert l'appareil de table dans
  cette version ; les six autres modules sont dits « pas encore pour la table » au panneau du MJ et
  viendront un par un.
- 15/11 — Q8, David : « Orienter si tu la désignes » → « La table » s'ajoute aux choix de « Joueur qui
  oriente le M314 » ; désignée, la Fire oriente le détecteur comme le porteur.
- 15/11 — **« Montrer aux joueurs », lu dans le code** : au PC, « partager » un tirage n'écrit qu'au
  journal, que les joueurs ne voient pas. Le bouton de la Fire fera donc **journal + annonce sur les
  tablettes** (`addHubNotification`, comme l'annonce du butin). Interprétation de Claude, à
  confirmer par David à l'essai.
- 15/11 — T1 mesurée, David : « vas y » (répétition) → **Firefox 143**, pas de compilation pour les
  vieux moteurs.
- 15/11 — Q5, David : « Une sélection à lui » → une colonne « Écran de table » à côté de celle de
  l'Ulanzi, dans le tableau de bord de l'Ulanzi ; l'Ulanzi garde sa propre sélection.
- 15/11 — Q6, David : « Code à 4 chiffres » → choisi au PC, demandé seulement pour passer d'un rôle
  public à *Aide au MJ*. Le code reste au poste du MJ et c'est le serveur qui le compare : il ne
  part jamais vers la Fire.

## Le comment

### Fichiers et réutilisation

**Commun — l'accueil des rôles** (⛔ `src/`)

- `src/App.tsx` (aiguillage des `?window=`) : une entrée `?window=accueil`.
- Nouveau `src/components/AccueilDeLaTablette.tsx` : trois boutons ; mémorise le rôle (stockage du
  navigateur sous `try/catch`) ; ouvre `?window=remote`, `?window=appareil-de-table` ou
  `?window=ecran-de-table`. Les vues publiques portent le bouton « Changer de rôle ».
- Le verrou (Q6) : le code est réglé dans les Paramètres du PC, gardé au poste à côté du secret
  d'appairage (`electron/PairingManager.ts`), comparé par le `SyncServer` (message `verrou:ouvrir`,
  essais limités) ; tant que la Fire n'a pas ouvert le verrou, la télécommande ne s'inscrit pas en
  rôle `remote`. Réutilise `CadreDeTablette`, `Bouton cibleTactile`.

**Rôle 1 — l'onglet Tables de la télécommande** (⛔ `src/`)

- Nouveau `src/modules/tables/logic/universDuJeu.ts` (pur) : le dossier de `databases/tables/` du jeu
  actif, par comparaison du nom du pilote sans casse ni accents (« Rêve de Dragon » → `Reves de
  Dragon`) ; aucun dossier → `null`.
- `src/modules/tables/useTableStore.ts` : une action `tirerSur(univers, table, modificateur)` qui
  charge par le pont, tire avec `TableEngine`, **écrit l'historique** et rend le `TableResult`.
  Le magasin reste le seul écrivain de l'historique ; `roll` du tableau de bord n'est pas modifié.
- Nouveau `src/modules/remote/actions/tablesOSActions.ts` : `tables:lister` et `tables:tirer`,
  réservés aux rôles appairés (`electron/actionPolicy.ts`, à côté des actions du meneur) ;
  `tables:montrer` appelle le geste de partage existant de Table-OS (`sendToSession`, à relire en T6).
  Enregistré dans `actions/index.ts`.
- Le résultat revient par le flux de la seule télécommande, comme le dernier jet (`useDernierJet`,
  `useNexusSynchronizer`), jamais par la diffusion aux joueurs.
- Nouveau `src/modules/remote/components/RemoteTables.tsx` + onglet dans `RemoteControl.tsx`.

**Rôle 2 — l'appareil de table** (⛔ `src/` et `electron/`)

- `electron/SyncServer.ts` : un rôle `table` dans `ALLOWED_ROLES`, **non privilégié** (flux caviardé
  comme `player`/`hub`), sans personnage ; une seule Fire à la fois en rôle `table` (la seconde est
  refusée avec un message, comme `character_taken`).
- `electron/modulesDuJeu/service.ts` : un lecteur `{ role: 'table', appareilId }` ; l'accès réservé
  `@table` dans `acces` ; `vueJoueur` → `vueTable`. Les commandes depuis la table sont acceptées si le
  module est ouvert à `@table` et une séance est ouverte ; **toute écriture de fiche est refusée**
  (`acquitterFiche`, `terminerEcriture` exigent un vrai personnage).
- Les moteurs (`electron/modulesDuJeu/registre.ts` et ceux de `src/modules/modulesDuJeu/*`) : chaque
  `vuePour` reçoit `role: 'table'` ; audit module par module (M314, MU/TH/UR, combat spatial, Dune,
  TMR, LCARS, Opérations) — un moteur qui ne sait pas servir la table est **indisponible pour elle**,
  dit au panneau du MJ, plutôt que de mal afficher.
- `src/modules/modulesDuJeu/PanneauDesModulesMJ.tsx` : « Table » dans la liste des accès quand une
  Fire est connectée en rôle `table`.
- Nouveau `src/components/AppareilDeTable.tsx` : réutilise `VueDeModule` (comme `HubModulesDuJeu`),
  plein écran, un module à la fois.

**Rôle 3 — l'écran de table** (⛔ `src/`)

- `src/modules/ulanzi/useUlanziStore.ts` et `widgets/librairie.ts` : une sélection par jeu pour
  l'écran de table, à côté de `selection` (Q5) ; `widgetsActifs` sert les deux.
- `src/modules/ulanzi/TableauDeBordUlanzi.tsx` : une colonne de cases « Écran de table ».
- **Un widget de plus, « Ordre du tour »** (type `rang` de la doctrine, lu le 15/11 : la librairie a
  les quarts, le jour, l'heure, les horloges, le minuteur, les réserves et le signal VK, pas
  l'initiative). Il lit le combat **projeté** (`isCombatProjected`) : le combattant actif et les
  deux suivants, avec les règles de visibilité du suivi de combat des tablettes. Proposé à l'écran
  de table ; à l'Ulanzi seulement si David le demande.
- Le flux public (`useNexusSynchronizer`, diffusion au rôle `hub`) porte les widgets **déjà composés
  en données** (valeur, maximum, couleur, libellé court) — `MondeDesWidgets` ; la Fire ne recalcule
  rien et ne lit aucun magasin du MJ.
- Nouveau `src/components/EcranDeTable.tsx` (`?window=ecran-de-table`, rôle `hub`) : les quatre
  formes en grand, en paysage 1280 × 800.

**La Fire elle-même** (pas de `src/`)

- Nouveau `outils/fire/preparer-la-fire.ps1` : par ADB, rester allumée sur secteur
  (`svc power stayon ac`), délai d'écran, Wi-Fi jamais en veille, ouvrir Firefox sur l'accueil ; idempotent,
  affiche l'état avant/après. Raccourci « GM-OS » sur l'écran d'accueil de la Fire par Firefox (geste
  de David).

### Données : qui lit, qui écrit

| Donnée | Écrivain | Lecteurs |
| --- | --- | --- |
| Historique de Table-OS (`useTableStore.history`) | `roll` (PC) et `tirerSur` (action de la télécommande), même magasin, au poste du MJ | `TableDashboard`, `reinjecter` |
| Journal (`useJournalStore`) | `sendToSession` seul, inchangé | journal, Oracle |
| Accès des modules (`acces`, dont `@table`) | `autoriser` du service des modules (poste MJ) | `vueTable`, `commander`, panneau MJ |
| Sélection de l'écran de table | actions du magasin de l'Ulanzi (poste MJ) | composition des widgets → flux `hub` |
| Rôle de la Fire, jeton | Firefox de la Fire | l'accueil, l'inscription au `SyncServer` |

### Risques GM-OS (cochés)

- [x] **Fenêtres multiples** : la Fire n'écrit aucun magasin ; tout passe par des actions exécutées au
  poste du MJ (`ecritureReserveeAuMJ` reste intacte).
- [x] **Chemin de données** : aucun `app.getPath('userData')` nouveau ; le service des modules garde
  son stockage.
- [x] **Tablette rechargée par Vite** : en `npm run dev`, la Fire se recharge si sa connexion tombe ;
  le rôle étant mémorisé, elle revient au bon écran ; aucun état propre à perdre. En séance, servir
  par le `SyncServer` (build), comme les autres tablettes.
- [x] **Les deux ports** : l'accueil construit ses liens sur l'origine de la page (port applicatif) ;
  les médias des modules restent sur `mediaPort`.
- [x] **Contexte non sûr** (`http://192.168…`) : pas de `crypto.randomUUID` ni d'API sécurisée dans le
  code neuf ; Firefox 143 l'a confirmé pour l'existant (identifiant d'appareil créé).
- [x] **Le jeton dans une tablette que les joueurs manipulent** : rôles publics sans privilège (C8),
  retour au rôle MJ protégé (Q6).
- [x] **Textes** : clés i18n présentes ou textes en dur comme le reste du Hub ; tailles du régime
  *table*.
- [x] **Échap et surcouches** : la vue appareil de table et l'écran de table n'ont pas de surcouche ;
  l'onglet Tables réutilise le registre si une surcouche apparaît.
- [x] **Écran de 8 pouces** : 960 × 600 px CSS en paysage, cibles tactiles ≥ 44 px.

### Écran : prompt Stitch

Trois écrans neufs (accueil, appareil de table, écran de table) et un onglet (Tables) : prompts Stitch
écrits **depuis le code** (`CadreDeTablette`, jetons du thème, télécommande actuelle) avec les
captures ADB du 15/11 comme point de départ ; David choisit le dessin **avant** T4 (consigne du
02/11).

### Essais

- `npx vitest run --maxWorkers=4` sur `universDuJeu.test.ts`, `tablesActions.test.ts`,
  `useTableStore` (tirerSur), `electron/modulesDuJeu/service.test.ts` (rôle table),
  `electron/SyncServer*.test.ts` (rôle table caviardé), `librairie.test.ts` (sélection de l'écran).
- `npx tsc -b`.
- e2e : prolonger `e2e/tabletteMeneurT0.spec.ts` (onglet Tables) ; nouveau
  `e2e/appareilDeTable.spec.ts` (module ouvert à la table, refermé) et écran de table (widget coché
  puis décoché).
- Sur la Fire : captures ADB, puis essai en séance par David.

## Tâches

- [x] T1 · Mesurer la Fire par ADB et essayer Hub et télécommande en répétition — couvre C1 · fait le
      15/11 (Firefox 143 retenu) · pas de `src/`.
- [x] T2 · `outils/fire/preparer-la-fire.ps1` (veille, Wi-Fi, épinglage, ouverture de Firefox) —
      couvre C11 (partie veille) · fait le 15/11 : `stay_on_while_plugged_in` 0 → 3 (secteur ou
      USB), `wifi_sleep_policy` déjà à 2, `lock_to_app_enabled` → 1 ; second passage sans
      changement ; `-Retablir` remet l'usine · pas de `src/` · **à essayer par David** : raccourci
      Firefox sur l'écran d'accueil, épingle dans la vue des applications récentes, chargeur
      secteur (batterie à 6 %, « chargeur basse tension » sur l'USB du PC). L'écran de
      verrouillage porte les publicités d'Amazon (« Offres spéciales », retirables seulement
      en payant, sur le compte Amazon) ; tant que la Fire est branchée, il ne revient plus.
- [x] T3 · Prompts Stitch des trois écrans et de l'onglet Tables ; David choisit — couvre C4, C6, C9,
      C12 (forme) · pas de `src/` · **15/11 : cinq maquettes générées et relues**
      ([prompts](2026-11-15-fire-hd8-prompts-stitch.md),
      [maquettes et relecture](visuels/fire-hd8-2026-11-15/README.md)) · **validées par David le
      15/11** (« vas-y, je suis d'accord avec les maquettes »), avec les retraits de la relecture.
- [x] T4 · `universDuJeu` (pur) — couvre C4 · essai : `universDuJeu.test.ts` (accents, casse, absent) ·
      touche src/ ⛔ · **fait le 15/11** : d'abord les `{ univers, table }` cités par le pilote, puis le
      nom (sans accents, casse ni pluriel, tête avant « : »/« , »), jamais `generique` ; 7 essais ;
      sur les 19 pilotes de David, les six jeux à tables trouvent leur dossier, aucun faux positif.
- [x] T5 · `tirerSur` dans `useTableStore` — couvre C5 · essai : test du magasin (historique écrit,
      journal non touché) · touche src/ ⛔ · **fait le 15/11** : `tirerSur` et `journaliserUnTirage`
      (seul écrivain des tirages au journal, `sendToSession` passe par lui) ; `tirerSur.test.ts`,
      4 essais ; Table-OS 139/139.
- [x] T6 · Actions `tables:lister`, `tables:tirer`, `tables:montrer` + politique + retour à la seule
      télécommande — couvre C4, C5 · essai : `tablesOSActions.test.ts`, test de `actionPolicy`
      (joueur refusé) · touche src/ et electron/ ⛔ · **fait le 15/11** :
      `src/modules/remote/actions/tablesOSActions.ts` (nommé ainsi pour ne pas se confondre avec
      `tableActions.ts`, les réserves de table ; dossier recalculé au poste, table du jeu exigée,
      modificateur entier borné à ±100, « montrer » par l'horodatage d'un tirage de l'historique,
      réponses au rôle `remote` seul) ; aucune ligne à changer dans `actionPolicy.ts` (type absent
      de la liste des joueurs = réservé) ; 7 essais + 2 de politique ; remote et Table-OS 435/435,
      `actionPolicy` 39/39, `tsc -b` et eslint propres.
- [ ] T7 · Onglet Tables de la télécommande — couvre C4, C5 · essai : e2e T0 prolongé · touche src/
      ⛔ · **à essayer par David** · **codé le 15/11** : `RemoteTables.tsx` (maquette validée, sans les
      inventions de Stitch), onglet après Dés dans `RemoteControl.tsx`, état `tables` et trois gestes
      dans `useRemoteSync.ts` ; `RemoteTables.test.tsx`, 5 essais ; suite complète 10 535 réussis,
      `tsc -b` et eslint propres. **Essayé sur la Fire le 15/11** (répétition recompilée, campagne
      Dune, Firefox 143, captures `visuels/fire-hd8-2026-11-15/essai-t7-*.png`) : dossier `Dune`
      trouvé, trois tables, tirage « 2 · Une citerne bloque le quai » fait au poste et revenu à la
      seule Fire, « Montrer aux joueurs » → badge « Montré aux joueurs », bouton grisé. Défaut vu et
      corrigé : titre « Tables » en double. Restent l'e2e et l'essai de David en séance.
- [x] T8 · Rôle `table` au `SyncServer` (non privilégié, une seule Fire) — couvre C8 · essai : test du
      serveur (flux caviardé, second appareil refusé) · touche electron/ ⛔ · **fait le 15/11** : rôle
      `table` (`SyncServer.ts`, `SessionManager.ts`, `src/types/shared.ts`), sans personnage même
      annoncé, second appareil refusé (`table_prise`). ⚠️ **Trou existant fermé au passage** : le
      caviardage ne visait que `player` et `hub` ; **une socket jamais inscrite recevait telle quelle
      toute diffusion sans rôle cible** (le combat). La règle devient « tout ce qui n'est pas appairé
      est caviardé ». 4 essais neufs (`SyncServer.relais.test.ts`) ; `electron` 1 724/1 724, `tsc -b`
      et eslint propres.
- [x] T9 · Lecteur `table` et accès « La table » au service des modules ; écriture de fiche refusée —
      couvre C6, C7 · touche electron/ ⛔ · **fait le 15/11** : identité `APPAREIL_DE_TABLE` =
      `table:commune` (pas `@table` : le M314 valide son porteur avec la règle des identifiants de
      personnage), dans `protocole.ts` ; le service ajoute « La table » aux lecteurs des seuls moteurs
      `servirLaTable`, garde son accès quand les personnages changent, refuse un personnage qui
      porterait cet identifiant et tout accusé de fiche pour elle ; le serveur donne cette identité au
      rôle `table` et la retire à un joueur qui l'annoncerait. `electron/modulesDuJeu/appareilDeTable.test.ts`,
      8 essais ; 2 de plus au serveur.
- [x] T10 · Audit des moteurs pour la table — couvre C7 · touche electron/ ⛔ · **fait le 15/11,
      réduit par Q7** : le M314 seul (`servirLaTable: true` dans `registre.ts`) ; il ne lit la liste
      des personnages que pour « joueur qui oriente » et son contrôle, donc aucune ligne du moteur
      ne change. Les six autres refusent la table (essai sur MU/TH/UR) et le panneau le dit.
- [ ] T11 · « La table » au panneau des modules du MJ + `AppareilDeTable.tsx` — couvre C6 · essai :
      `e2e/appareilDeTable.spec.ts` · touche src/ ⛔ · **à essayer par David** (M314 sur la Fire) ·
      **codé le 15/11** : case « La table » (`PanneauDesModulesMJ.tsx`), `useAppareilDeTable.ts`
      (WebSocket en rôle `table`, `CanalDesModulesJoueur` réutilisé), `AppareilDeTable.tsx`
      (`?window=appareil-de-table`, bandeau de 40 px de la maquette), route dans `App.tsx`.
      ⚠️ `getWindowRole()` prenait toute fenêtre inconnue pour celle du MJ : les trois fenêtres de la
      Fire y sont classées tablettes. Essais : panneau +2, écran 4, `windowRole` +1. Le bouton
      « Changer de rôle » attend l'accueil (T14). Suite complète 10 555 réussis. **e2e
      `e2e/appareilDeTable.spec.ts` réussi** (campagne Alien fictive, Fire émulée à 960 × 600) :
      « La table » cochée → M314 sur la Fire ; non désignée → pas de boutons d'orientation ;
      désignée → la table tourne le M314 (cap lu au poste) ; décochée → « Aucun module ouvert ».
      Sur la vraie Fire : connexion en rôle `table` vue (« Aucun module ouvert à la table ») ; le M314
      n'a pas pu y être ouvert, la répétition n'ayant pas le pilote Alien (import manuel raté
      par David). ⚠️ **Reste** : en paysage, la vue joueur du M314 s'empile (radar à faire défiler) ;
      la maquette mettait le radar à gauche — dessin du module, à reprendre à part.
- [ ] T12 · Sélection de l'écran de table (magasin, librairie, tableau de bord de l'Ulanzi), widget
      « Ordre du tour », widgets composés dans le flux `hub` — couvre C9, C10 · essai :
      `librairie.test.ts` (dont l'ordre du tour : combat non projeté → rien), test du flux · touche
      src/ ⛔.
- [ ] T13 · `EcranDeTable.tsx` — couvre C9, C10 · essai : e2e (cocher, décocher, jauge qui bouge) ·
      touche src/ ⛔ · **à essayer par David**.
- [ ] T14 · Accueil des rôles, rôle mémorisé, code à quatre chiffres (réglage au PC, comparaison au
      serveur) — couvre C11, C12 · essai : test du composant (stockage indisponible compris), test du
      serveur (code faux, essais limités), e2e · touche src/ et electron/ ⛔ · **à essayer par David**.
- [ ] T15 · Essai complet sur la Fire avec une campagne (Alien) : C2, C3, C6, C10, C11 ; manuel
      (`documentation/User Guides/`, page des tablettes) — **à essayer par David**.

## Analyse

- 15/11 — relecture croisée :
  1. Chaque critère a sa tâche : C1 T1 ; C2, C3 T15 (existant) ; C4 T4, T6, T7 ; C5 T5, T6, T7 ;
     C6 T9, T11 ; C7 T9, T10 ; C8 T8 ; C9, C10 T12, T13 ; C11 T2, T14 ; C12 T14.
  2. Aucune tâche sans critère (T3, le dessin, sert C4 à C12).
  3. Pas de contradiction avec les décisions : tablettes au thème du PC, Stitch avant de coder,
     un écrivain par donnée, pas de branche.
  4. Aucune question ouverte : Q5 et Q6 tranchées par David le 15/11.
  5. `git status` : aucun fichier du plan n'est modifié par un autre agent (seuls `Export Dirvers/`
     et `tmp/` sont en cours, hors du plan).
- Taille : **12 critères, 15 tâches** dont 11 touchent `src/` ou `electron/` ; David essaie T2, T7,
  T11, T13, T14 et T15.
