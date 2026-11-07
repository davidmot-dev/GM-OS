# Les modules du jeu sur la tablette du meneur — plan

**07/11/2026.** David : *« peux-tu me faire le plan pour activer les modules de jeu dans la
tablette de Game Master »*, puis *« commence »* — les recommandations du § 4 sont prises.

**Avancement** : T0 à T6 livrés le 07/11 — maquette Stitch validée par David (*« je suis
d'accord avec la maquette continue »*), pupitre en plein écran sur la tablette. **Reste : l'essai
de David sur une vraie tablette** (Alien d'abord), et Rêve de Dragon ensuite.

**Ce qui a été fait, T2 à T6 :**

- **T2** — `canalMeneur.ts` (`CanalDesModulesMJ`, `GestesDuMeneur`) ; `PanneauDesModulesMJ.tsx`,
  commun au poste (`habillage="poste"`, écran d'avant inchangé, « Tout couper » passé du bandeau
  au panneau) et à la tablette. La vue MJ porte désormais `enSeance` et `personnages` : la
  tablette ne les reconstitue pas d'un autre flux.
- **T3** — onglet « Modules » (`RemoteModulesDuJeu.tsx`, neuvième entrée de `ONGLETS`, barre du
  bas en cinq colonnes dès 600 px) ; `useRemoteSync` ouvre un canal par socket et redemande la vue
  après l'inscription. `VueDeModule` reçoit `lieu` : sur la tablette, le raccord à la fiche des
  TMR et la Maison/Menace de Dune restent au poste, et le pupitre le dit.
- **T4** — poste et tablette partagent la même vue serveur ; un geste d'un côté se voit de
  l'autre (e2e).
- **T5** — `canalMeneur.test.ts` (7), `PanneauDesModulesMJ.test.tsx` (10, poste et tablette),
  `useRemoteSync.test.ts` (+1), `transport.test.ts` (+6). E2E
  `modulesDuJeuTabletteMeneur.spec.ts` (vrai Electron, tablette du meneur appairée + tablette de
  joueur) : ouvrir l'accès depuis la tablette, carte reçue par le joueur, pupitre MU/TH/UR,
  « Tout couper » ; portrait ; sans le secret, rien. Captures relues (`scratch/`).
- **T6** — guide 60 (§ 9 Modules, neuf onglets), contrat § 6.1, registre.

Les modules du jeu (MU/TH/UR, détecteur et combat spatial d'Alien ; TMR de Rêve de Dragon ;
LCARS et opérations de Star Trek ; conflits de Dune) se pilotent aujourd'hui **depuis le poste
MJ seulement** (cockpit › « Modules du jeu »), et s'affichent aux joueurs dans le Tablet Hub.
La tablette du meneur (`RemoteControl.tsx`, guide 60) a huit onglets — Pads, Dés, Sons,
Scénario, Combat, Tableau, Notes, Messages — et aucun module.

Le socle commun est décrit dans le [contrat v1](../Architecture/Contrat-des-modules-du-jeu.md) et
le [plan du 15/10](2026-10-15-modules-du-jeu-tablet-hub.md). Ce plan ne change ni le contrat ni
les moteurs : il ouvre au meneur, sur sa tablette, ce qu'il fait déjà au poste.

## 1 · Pourquoi la tablette du meneur ne voit rien aujourd'hui

Lu dans le code le 07/11, pas reproduit à l'écran.

| Ce qui manque | Où | Effet |
| --- | --- | --- |
| La tablette du meneur s'inscrit **sans personnage** | `SyncServer.handleRegister` → `identiteModules.personnageId = null` | `vueJoueur(null)` rend une liste vide : rien à afficher |
| Toute commande reçue par WebSocket est jouée **en rôle `joueur`** | `SyncServer.traiterCommandeDeModule` | Les commandes de meneur (préparer, répondre au nom de Maman, scanner…) sont refusées par le manifeste |
| Autoriser, Tout couper, Choisir la diffusion passent **par l'IPC seulement** | `ipcMain.handle('modules:…')` | Exprès : un essai vérifie que *« Tout couper est réservé au MJ natif »* (`transport.test.ts`) |
| La vue MJ n'est envoyée **qu'à la fenêtre principale** | `diffuserLesModules` → `webContents.send('modules:changement')` | Aucune socket ne la reçoit |
| Les médias privés en vue MJ visent **`127.0.0.1`**, servis au seul poste | `projeterRessources(…, mj = true)`, `traiterMediaPrive` | Une vidéo MU/TH/UR ne se lirait pas depuis la tablette |
| L'écran du poste appelle `window.appBridge` | `ModulesDuJeuMJ.tsx` | Inutilisable tel quel dans le navigateur de la tablette |

Ce qui existe déjà et qui sert : la tablette du meneur s'inscrit en rôle **`remote`**, accordé
**seulement avec le secret d'appairage** (`pairingManager.verify`, sinon rétrogradée en
`player`) ; le service des modules sérialise toutes les écritures et refuse une requête dont le
`contexte` a vieilli ; les vues MJ de chaque module (`VueDeModule role="mj"`) sont des composants
React qui ne dépendent pas d'Electron.

## 2 · Ce que la tablette du meneur saura faire

Un **neuvième onglet « Modules »**, qui reprend l'écran du poste :

- la liste des modules que propose le pilote de la campagne active, avec leur état (prêt, à
  adapter, absent, incompatible) ;
- pour chaque module : les **accès par personnage** (cases à cocher, actives en séance),
  « Fermer tous les accès et couper les effets », le choix de l'appareil qui joue le son ;
- **« Tout couper »** pour l'ensemble ;
- **« Ouvrir le pupitre »** : le pupitre MJ du module, le même qu'au poste, avec ses gestes
  propres (MU/TH/UR, radar, TMR, LCARS…).

Ce qui **reste au poste MJ**, sans exception : le contexte (campagne, séance, pilote,
personnages, poussé par `useHoteDesModules`), l'import d'une sauvegarde des modules,
l'acquittement des écritures de fiche (`acquitterFiche`, raccord des TMR) et la configuration du
pilote. La tablette commande ; le poste reste le seul à décider de quelle table il s'agit.

## 3 · Les lots

> ⛔ Avant toute écriture dans `src/` ou `electron/` : demander à David « GM-OS tourne-t-il ? ».

### T0 — L'écran d'abord, par Stitch

Consigne de David du 02/11 : un écran neuf se dessine dans Stitch, à partir du code et de
captures Playwright, avant d'être codé. Captures de l'onglet Pads de la tablette et de
l'écran « Modules du jeu » du poste ; prompt Stitch pour l'onglet « Modules » en **paysage
1024 × 768** et en portrait (sous 900 px, la navigation passe en bas). David choisit.

### T1 — Le transport du meneur sur la WebSocket (`electron/SyncServer.ts`)

- Une famille de messages **`modules:mj:*`** — `consulter`, `commander`, `autoriser`,
  `tout-couper`, `diffusion` — acceptée **seulement d'une socket appairée** (`ws.role` dans
  `PRIVILEGED_ROLES`), ignorée en silence ailleurs et journalisée comme les autres refus.
- Le lecteur des commandes est `{ role: 'mj', appareilId: <id de la tablette> }`. Mêmes gardes
  que les commandes de joueur : 30 commandes par 10 s, rejeu d'un `requeteId` refusé, 64 ko au
  plus, réponse `modules:mj:resultat` par requête.
- `diffuserLesModules` envoie aussi la vue MJ (`modules:mj:vue`) aux sockets appairées, **sans
  le champ `sauvegarde`** : il porte les données de toutes les campagnes, il n'a rien à faire sur
  le réseau. Une tablette appairée qui se (re)connecte reçoit la vue à son inscription.
- **Médias privés** : un jeton par socket appairée, comme pour les joueurs, et des URL relatives
  au serveur (pas `127.0.0.1`). Vérifier au passage que les URL prennent le `mediaPort`
  (SyncServer), pas le port de Vite en développement — voir la mémoire « les deux ports ».
- **À auditer avant** : les moteurs supposent-ils `appareilId === 'poste-mj'` pour le meneur ?
  Seuls les scripts de vérification de MU/TH/UR l'écrivent en dur, mais la diffusion du son
  (`diffusionActuelle`, `choisirDiffusion`) compare des appareils : à relire module par module.
- Essais (`electron/modulesDuJeu/transport.test.ts`, sans port ouvert) : une socket joueur ou
  non appairée ne reçoit jamais la vue MJ et ne peut rien envoyer en `modules:mj:*` ; la
  tablette appairée autorise, commande et coupe ; un `contexte` périmé est refusé ; la vue
  réseau ne contient jamais `sauvegarde` ; l'essai « Tout couper réservé au MJ natif » devient
  « réservé au meneur appairé ».

**✅ T1 livré le 07/11.** `SyncServer.traiterCommandeDuMeneur` et `rendreLaVueDuMeneur` ;
`electron/modulesDuJeu/demandesDuMeneur.ts` lit chaque charge (une clé de trop la refuse).
Messages : `modules:mj:consulter | commander | autoriser | tout-couper | diffusion` envoyés,
`modules:mj:vue | resultat | fermes` reçus. Les commandes se jouent **au nom du poste**
(`poste-mj`) : la tablette pilote les effets du poste et n'en joue aucun. L'audit des moteurs
l'a confirmé : MU/TH/UR et LCARS comparent `appareilId` pour la diffusion du son, ce qui reste
juste puisque la tablette agit comme le poste. Seul LCARS sert des **médias privés** ; les
vidéos de MU/TH/UR sont des fichiers de l'application, sans jeton. Six essais dans
`transport.test.ts` : vue sans `sauvegarde` et refusée sans le secret ; autoriser, commander et
tout couper depuis la tablette, le joueur voit l'effet ; un joueur qui imite le meneur n'obtient
ni effet ni réponse ; contexte périmé, clé de trop et rejeu refusés ; réinscription sans le
secret → `modules:mj:fermes` ; jeton de médias propre à chaque socket, adresse relative.
170 essais (`electron/modulesDuJeu`, `electron/SyncServer`), `tsc -b`, eslint.

### T2 — Le canal et l'écran partagé (`src/modules/modulesDuJeu/`)

- **`CanalDesModulesMJ`**, sur le modèle de `CanalDesModulesJoueur` : chaque commande attend sa
  confirmation, 10 s au plus, **sans rejeu** ; un changement de contexte annule les attentes ; une
  révision plus ancienne est ignorée.
- **Extraire le corps de `ModulesDuJeuMJ.tsx`** en un panneau qui reçoit un « pont »
  (`lire`, `commander`, `autoriser`, `toutCouper`, `choisirDiffusion`, `surChangement`) au lieu
  d'appeler `window.appBridge`. Le poste lui passe l'IPC, la tablette le canal. *Deux copies du
  même écran finiraient par diverger* — c'est déjà arrivé aux onglets de la tablette.
- La campagne, la séance et les personnages viennent, sur la tablette, du flux de session
  qu'elle reçoit déjà (`syncData.session`) ; le pilote, de la vue MJ.

### T3 — L'onglet « Modules » de la tablette (`src/modules/remote/`)

- Neuvième entrée de `ONGLETS` (icône `Blocks`, comme au poste), le panneau de T2 branché sur
  `useRemoteSync`. Toujours visible ; sans module, il dit *« Aucun module proposé par ce
  pilote »*.
- **Les sept pupitres à la taille d'une tablette** : chacun a été dessiné pour le poste. Les
  ouvrir en 1024 × 768 et en portrait, corriger les débordements dans le style propre au module
  (LCARS reste LCARS, MU/TH/UR reste vert sur noir). Vérifier que les feuilles de style des
  modules, chargées par `vuesDuRegistre.tsx`, ne débordent pas sur les autres onglets.
- Le résultat d'une commande refusée se dit à l'écran (*« La table a changé. Réessaie depuis la
  vue actuelle. »*), jamais en silence.

### T4 — Le poste et la tablette ensemble

- Les deux voient la même vue ; le service sérialise. Un geste au poste met la tablette à jour
  (et l'inverse) sans rechargement.
- **Une écriture de fiche lancée depuis la tablette** (TMR de Rêve de Dragon) est acquittée par
  le raccord du poste : essai dédié.
- Une tablette rechargée (veille de l'iPad, Vite en `npm run dev`) retrouve la vue au retour,
  sans rejouer de commande.

### T5 — Vérifier

- `npx vitest run electron/modulesDuJeu src/modules/modulesDuJeu src/modules/remote --maxWorkers=4`,
  `npx tsc -b`, eslint.
- `npm run build` puis un e2e à deux contextes (poste + tablette du meneur appairée + une
  tablette de joueur), sur le modèle de `modulesDuJeuAlien.spec.ts` : ouvrir le pupitre depuis
  la tablette, autoriser un PJ, voir la carte arriver chez le joueur, tout couper, voir la carte
  partir. Captures à relire.
- **Essai de David sur une vraie tablette**, en séance de test : un jeu (voir § 4).

### T6 — Documenter dans la même livraison

Guide [60 — Tablette du meneur](../User%20Guides/60-Tablette-du-meneur.md) (l'onglet et ses
gestes) ; [contrat v1](../Architecture/Contrat-des-modules-du-jeu.md), partie transport (le
meneur appairé) ; registre des chantiers (nouveau § et ligne de la vue d'ensemble) ; les pages
54 des jeux concernés si un pupitre change.

## 4 · Ce que David décide

| Question | Recommandation |
| --- | --- |
| **Périmètre** : tout le pupitre de chaque module, ou seulement les accès et « Tout couper » ? | **Tout le pupitre.** Les accès seuls obligent à retourner au poste pour chaque geste de jeu. |
| **« Tout couper » et les accès depuis la tablette** — aujourd'hui réservés au poste, exprès. | **Les ouvrir à la tablette appairée**, jamais à un joueur. Le secret d'appairage donne déjà le flux non caviardé (notes privées, secrets du meneur) : c'est le même niveau de confiance. |
| **Le son d'un module** (alarme MU/TH/UR) : la tablette du meneur comme appareil de diffusion ? | **Non, dans un premier temps** : poste MJ ou tablette d'un joueur, comme aujourd'hui. |
| **Les vidéos privées** de MU/TH/UR sur la tablette du meneur ? | **Oui**, par un jeton propre à la socket (T1). |
| **Le premier jeu à essayer** | **Alien** (MU/TH/UR + détecteur) : trois modules, le son, les vidéos et une recette déjà écrite. Rêve de Dragon ensuite, pour l'écriture de fiche des TMR. |

## 5 · Les pièges connus

- La vue MJ contient **`sauvegarde`**, toutes campagnes confondues : à retirer avant le réseau
  (T1), et à vérifier par un essai.
- En `npm run dev`, une tablette qui perd sa connexion **se recharge seule** : tout état en
  mémoire disparaît. Le pupitre ne doit rien garder d'important hors de la vue du serveur.
- **Un message émis avant que la tablette écoute est perdu** : la vue MJ part à l'inscription,
  et la tablette la redemande (`modules:mj:consulter`) une fois son canal monté.
- Les e2e qui capturent réécrivent des images de `documentation/Planning/` : copier
  `documentation/` avant. Ne jamais lancer `vitrine`, `vitrineDuSocle`, `campagnesEtThemes`,
  `profilageDesRendus`.
