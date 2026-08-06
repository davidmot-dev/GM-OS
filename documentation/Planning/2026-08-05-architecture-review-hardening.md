# Revue d'architecture — plan de durcissement

> Document de suivi vivant. Issu de la revue d'architecture complète du **2026-08-05**
> (branche `feature/tablet-hub-pwa`, HEAD `b15448f`). Mise à jour au fil de l'avancement.

## Tableau de bord

| # | Sujet | Gravité | État |
|---|-------|---------|------|
| 1 | `startRemoteServer()` fantôme + `electron/` hors du type-check | Bloquant | ✅ Fait — `90f8445` |
| 2 | Lecture de fichiers arbitraire depuis le LAN via le proxy média | Critique | ✅ Fait — `90f8445` |
| 3 | Aucune authentification WebSocket | Critique | ✅ Fait |
| 4 | `ignore-certificate-errors` global | Élevée | ✅ Fait |
| 5 | Store session en localStorage (plafond ~5-10 Mo) | Élevée | ✅ Fait |
| 6 | Segment de sync `session` monolithique + médias en base64 | Moyenne | ✅ Fait — 7 620 Ko → 305 Ko |
| 7 | `handleAction` — ~270 lignes de `if` en série | Moyenne | ✅ Fait |
| 8 | Couche de synchronisation non testée | Moyenne | ✅ Fait |
| 9 | Aucune autorisation par rôle sur les actions reçues | Élevée | ✅ Fait — validé en conditions réelles |

> Le point 9 ne vient pas de la revue initiale : il a été identifié en traitant les points
> 3 et 7, qui l'ont chacun approché sans le couvrir.

---

## 1. `startRemoteServer()` fantôme ✅

**Le problème.** `electron/main.ts` appelait `startRemoteServer()`, fonction définie nulle
part. Le `ReferenceError` (visible dans `crash.log`) interrompait le callback
`app.whenReady()` avant l'enregistrement des handlers `screen.on('display-added' | ...)`
juste en dessous : la détection d'écrans était donc morte en permanence.

L'appel était de surcroît redondant — `createWindow()` fait déjà `syncServer.start()`.

**Pourquoi personne ne l'a vu.** Le dossier `electron/` n'était référencé par aucun
tsconfig : `tsc -b` ne compilait que `src/` et `vite.config.ts`, et sortait en exit 0.

**Fait.**

- Suppression de l'appel mort.
- Ajout de `tsconfig.electron.json` (include `electron/`), référencé depuis `tsconfig.json`.
  Vérifié : réintroduire l'appel produit bien `error TS2304: Cannot find name 'startRemoteServer'`.
- Effet de bord du nouveau type-check : `IndexedFile.type` n'était jamais renseigné dans
  `RAGEngine.updateIndex()` — corrigé, dérivé de l'extension.

## 2. Proxy média non validé ✅

**Le problème.** `SyncServer` écoute sur `0.0.0.0` et servait `/media/<chemin absolu>` sans
la moindre validation : n'importe quelle machine du réseau local pouvait lire n'importe
quel fichier du disque. `/temp/` et le handler d'assets statiques laissaient par ailleurs
passer les traversées par `..` (`path.join` ne normalise pas ce que le client envoie).

**Décision (David).** Allowlist de racines **+ auto-enregistrement**, plutôt qu'une liste
figée ou un système de jetons opaques. Le compromis retenu privilégie le fait que les
médias du MJ vivent un peu partout sur le disque.

**Fait.** Nouveau `electron/MediaAccess.ts` :

- Racines de base : `temp-media`, `userData`, `public/`, `databases/`, `dist/`.
- Auto-enregistrement du dossier parent de tout fichier choisi via `sound:load-audios` et
  `npc:select-avatar`, persisté dans `media-roots.json` (userData).
- Résolution via `realpathSync` : un lien symbolique posé dans une racine autorisée ne peut
  pas servir de passerelle vers le reste du disque.
- `SyncServer` filtre désormais `/media/` (allowlist + liste blanche de types de fichiers),
  `/temp/` (confiné, sans sous-dossier) et les assets statiques (confinés à `dist/`).
- 12 tests dans `electron/MediaAccess.test.ts`.

**À savoir.** Un média posé hors des racines (Bureau, Téléchargements) et jamais
re-sélectionné via un dialogue renverra un 404 aux tablettes. Le log
`[MediaAccess] Accès refusé` nomme le chemin exact.

**Note d'outillage.** La config vitest est scindée en deux `projects` (`renderer` jsdom /
`electron` node) : `vite-plugin-electron-renderer` shimme les modules natifs et cassait
tout test du process principal.

## 3. Aucune authentification WebSocket ✅

**Le problème.** `handleRegister` prenait le `role` directement dans le payload du client.
Or `useNexusSynchronizer` diffuse le `diffPayload` **brut** aux rôles `remote` et `gm`, et
une copie caviardée (`notes.private`, `gmSecretInfo`, `roleplayingNotes`, feedbacks) aux
rôles `player` et `hub`. N'importe quelle machine du réseau ouvrait donc une WebSocket sur
le 3001, envoyait `{type:'remote:register', payload:{role:'gm'}}`, et recevait les secrets
du MJ en clair.

Le QR code existant n'encodait qu'une URL : il n'y avait aucun token à valider. Il a fallu
créer le mécanisme, pas seulement le brancher.

**Décisions (David).** Token exigé des seuls rôles privilégiés — les tablettes joueurs
restent libres et reçoivent le flux caviardé, donc zéro friction en partie. Secret
**persistant**, révocable à la demande.

**Fait.**

- `electron/PairingManager.ts` : secret de 32 octets persisté dans `pairing.json`
  (userData), régénéré si le fichier est absent ou corrompu. `verify()` compare en temps
  constant sur des empreintes SHA-256 — un `===` fuirait la longueur du préfixe correct,
  ce qui suffit à reconstruire le secret octet par octet.
- `SyncServer` : les rôles sont normalisés contre une liste blanche (tout rôle inconnu
  retombe sur `player`), et `gm`/`remote` exigent un token valide. En cas d'échec, la
  connexion est **rétrogradée en `player`** — elle reste fonctionnelle mais ne reçoit que
  le flux caviardé — et un `remote:error` de code `pairing_required` est renvoyé. Le rôle
  refusé n'est jamais mémorisé dans le registre de session.
- Le secret est encodé dans le QR de la télécommande MJ sous forme de **fragment**
  (`#token=…`), jamais de query string : un fragment n'est pas transmis au serveur, donc
  il ne finit ni dans les logs d'accès ni dans un `Referer`. Côté client, il est capturé
  au chargement, rangé en localStorage, et retiré de la barre d'adresse.
- Bouton « Révoquer les appairages » dans les réglages : régénère le secret et force
  chaque appareil à re-scanner.
- La télécommande affiche un bandeau ambre « appareil non appairé » quand elle est
  connectée mais rétrogradée.
- 21 tests (`PairingManager.test.ts`, `SyncServer.register.test.ts`).

**Corrigé au passage.** Le QR de la télécommande était généré par `api.qrserver.com`,
un service **externe** : l'URL — et donc le secret qu'on venait d'y mettre — serait partie
chez un tiers, en plus de lui révéler l'IP locale du poste MJ. Les deux QR des réglages
passent désormais par le rendu local `QRCodeSVG`, déjà utilisé par `NetworkQRCodeModal`.
Leur URL pointait par ailleurs sur le port `5173` codé en dur (le serveur de dev), donc
elle ne menait nulle part en production ; elle utilise maintenant le port réel.

**Reste ouvert, même famille.** `forwardToGM` relaie vers le renderer MJ **n'importe quel**
type d'action envoyé par **n'importe quel** client connecté, y compris non appairé. C'est
une surface de commande distincte de la fuite de données : elle se referme avec le
registre d'actions du point 7, où la liste des types recevables devient explicite.

## 4. Validation TLS désactivée ✅

**Correction de la prémisse.** La revue affirmait que le switch Chromium désactivait aussi
TLS pour les appels d'API portant des clés. C'est faux mécaniquement, et ça déplace la
cible : Chromium et le module `https` de Node sont deux piles distinctes. Les appels IA
partent tous par `window.appBridge.ai.proxyRequest` → `ai:proxy-request`, donc **par Node**,
qui posait son propre `rejectUnauthorized: false`. C'était **cette ligne** qui exposait les
clés, pas le switch.

**Le switch était redondant.** Il avait été posé pour le pont Philips Hue, dont le
certificat est effectivement auto-signé. Mais dans l'app, Hue ne touche jamais la pile
réseau de Chromium : les trois points d'appel de `HueEngine` (`discoverBridge`, `pair`,
`request`) privilégient l'IPC `light:request`, qui fait un `https.request` côté Node. Les
`fetch()` de repli ne s'exécutent que si `window.appBridge` est absent — le PWA sur
tablette, un autre process, hors de portée du switch. Et `preload.ts` expose
`light.request` systématiquement. Le fait qu'il ait fallu ajouter `rejectUnauthorized:
false` à la main dans `light:request` le confirme : le switch ne couvrait pas ce cas.

**Décision.** David n'a pas pu confirmer s'il utilisait un endpoint IA local en HTTPS
auto-signé. L'inspection du store persistant a tranché : `ollama` pointe sur
`http://127.0.0.1:11434`, et un endpoint est configuré sur une adresse LAN privée
(`192.168.0.21`). D'où la règle retenue — validation stricte partout, tolérance accordée
hôte par hôte aux seules **adresses privées**.

**Fait.**

- `electron/netTrust.ts` : `isPrivateHost()` couvre boucle locale, RFC 1918, lien-local,
  ULA IPv6, IPv4 encapsulée et suffixes `.local` / `.home.arpa`. Le parsing IPv4 est
  strict, pour qu'un domaine du type `192.168.0.21.evil.com` ne récupère pas la tolérance.
- `ai:proxy-request` et `light:request` calculent `rejectUnauthorized` par URL. Les clés
  d'API partant vers Internet sont donc désormais protégées.
- `app.commandLine.appendSwitch('ignore-certificate-errors')` supprimé.
- 24 tests dans `electron/netTrust.test.ts`.

**Impact vérifié : nul sur Music-OS et Sound-OS.** `MusicEngine` lit des IDs `m-` (blob
IndexedDB), des chemins locaux convertis en `gmos://`, du `blob:`/`data:`, ou le proxy LAN
`http://<ip>:3001`. `SoundEngine` fait de même via `formatUrl()`. Aucun des deux ne parle
à un hôte au certificat invalide. Ailleurs : Web-OS ouvre ses liens via
`shell.openExternal` (navigateur système), les polices Google, le client Gradio et les
téléchargements d'assets Nexus visent des hôtes publics à certificat valide, et Ollama est
en HTTP sur la boucle locale.

## 5. Store session en localStorage ✅

**Le problème, au-delà du plafond.** `PersistenceService` ne passait pas de `storage` au
`persist` de Zustand, qui retombe donc sur `localStorage`. Or la liste `partialize` en mode
Electron contient toute la base de campagne — campagnes, sessions, entités, joueurs,
cartes, événements de chronologie, entrées de wiki, indices, gabarits, decks — sérialisée
en **une seule chaîne JSON**. Trois conséquences, dont une seule était identifiée :

- **L'écriture est intégrale.** Zustand réécrit la clé entière à chaque `set()`. Modifier
  les PV d'un PNJ re-sérialise l'intégralité de la base. Le coût dépend de ce qu'on
  possède, pas de ce qu'on change.
- **L'écriture est synchrone.** `localStorage.setItem` bloque le thread d'interface.
- **Le dépassement est brutal.** `setItem` lève, la sauvegarde échoue, sans dégradation
  progressive ni signal visible — en pleine partie.

Le contournement déjà en place (persistance réduite à six champs hors Electron) n'était pas
une optimisation mais un aveu : le quota avait déjà été crevé côté tablette. Le poste MJ
gardait tout et restait exposé.

**Fait, en trois temps.**

1. **Bug corrigé.** `store/index.ts` faisait `{ ...PersistenceService, onRehydrateStorage:
   ... }`. La clé définie après écrasait celle du spread : le `onRehydrateStorage` de
   `PersistenceService` ne s'exécutait **jamais**. Ni le nettoyage des URLs `blob:`
   périmées, ni la remise à zéro de `selectedDeckId`, ni `reconcileTemplates()`. Trois
   comportements écrits, commentés, et sans effet. L'override est supprimé ; la raison
   d'origine (ne pas appeler `sanitizeAllSessions`, qui bouclait) est notée à sa place.
2. **Mesure.** `storageDiagnostics.ts` mesure l'occupation par clé, journalise au démarrage
   et alerte à 4 Mio — seuil prudent, le quota réel dépendant de la build Chromium. Le
   chiffre est affiché dans Réglages → Système. La falaise silencieuse devient un signal.
3. **Migration.** `idbStorage.ts` fournit un `StateStorage` sur IndexedDB, branché via
   `createJSONStorage`. Les données déjà présentes dans localStorage sont reprises au
   premier accès, et la copie n'est effacée qu'**après relecture vérifiée** depuis
   IndexedDB — perdre une base de campagne pour libérer du quota serait un échange perdant.

**Le couplage avec la couche de sync.** La synchronisation entre fenêtres reposait sur
`window.addEventListener('storage')`. Cet événement est une propriété de localStorage :
IndexedDB n'a pas d'équivalent. Migrer sans plus aurait cassé ce transport en silence.
`idbStorage` émet donc lui-même une notification sur un `BroadcastChannel` à chaque
écriture, et `syncStorageAcrossWindows` s'y abonne.

Il fallait aussi répliquer une propriété non écrite de localStorage : réécrire une valeur
identique ne déclenchait pas d'événement `storage`. Sans cette garde, une fenêtre qui se
réhydrate réécrit aussitôt la même valeur, notifie les autres, et le cycle repart sans fin.
`idbStorage` mémorise donc la dernière valeur vue — en lecture comme en écriture — et
n'écrit ni ne notifie quand rien n'a changé.

**Second piège désamorcé.** `useSessionOSStore` n'était pas dans le gate de `useHydration`.
Inoffensif avec un localStorage synchrone, où le store est déjà peuplé à l'évaluation du
module ; fatal avec IndexedDB, où l'app se serait déclarée prête avec une base vide. Il y
est désormais.

**Validation.** Au-delà des 22 tests, la migration a été exercée le 2026-08-06 sur la base
de campagne réelle de David, après sauvegarde de `%APPDATA%\gm-os-v5` : reprise depuis
localStorage et campagnes intactes. C'était la seule partie que les tests ne pouvaient pas
couvrir.

## 6. Segment de sync `session` monolithique ✅

Traité avec le point 8, dont les tests ont servi de filet.

### 6a. Granularité du diff

`getDifferentialPayload` comparait au premier niveau seulement, et `session` agrège treize
champs — sessions, campagnes, joueurs, entités, lieux, indices, gabarits, favoris.
Renommer un personnage retransmettait donc tout le reste, médias résolus compris.

**Ce qui a rendu le correctif simple.** Le destinataire applique déjà ces champs
individuellement : `applySyncPayload` teste chacun (`if (session.sessions !== undefined)`).
Un segment `session` partiel était donc déjà correct côté réception — il n'était simplement
jamais produit. `getDifferentialPayload` accepte désormais `deepSegments`, et descend d'un
niveau pour les segments listés.

Deux cas retombent volontairement sur le segment entier : quand l'état précédent n'est pas
un objet simple, et quand la seule différence est un champ **disparu** — le diff fin ne
sait pas exprimer une suppression, et mieux vaut tout renvoyer que laisser le destinataire
sur une valeur périmée.

`useRemoteSync` fusionne maintenant `session` au lieu de le remplacer, comme il le faisait
déjà pour `combat`, `notes` et `whiteboard`.

### 6b. Médias par référence

`resolveToSendableUrl` transformait tout identifiant `m-` en **base64 dans le payload**.
Un avatar de 200 Ko en pèse 267 une fois encodé, et repartait à chaque diffusion.

L'infrastructure pour faire mieux existait déjà — l'IPC `remote:cache-media` et la route
HTTP `/temp/` — mais **n'avait jamais eu de client**. Pire, la déclaration de type de
`cacheMedia` dans `window.d.ts` inversait ses deux arguments par rapport à `preload.ts` :
le premier appelant à s'y fier aurait envoyé l'identifiant comme tampon. Corrigé.

Le résolveur dépose désormais l'octet une fois dans le cache disque du poste MJ et ne
transmet qu'une URL. Un `Set` évite de redéposer le même média — les deux durées de vie
coïncident, `temp-media` étant vidé au démarrage. Repli sur le base64 sans réseau local
exploitable (poste isolé, pont applicatif absent) ou si le dépôt échoue.

### 6c. Validation en conditions réelles, et régression corrigée

Vérifié le 2026-08-06 contre l'application en fonctionnement, avec un client tablette
simulé (`fake-tablet.mjs`) empruntant les mêmes chemins qu'un vrai Tablet Hub — WebSocket,
`remote:register`, actions, récupération HTTP des médias — et confirmé en parallèle par
David sur un appareil réel.

**Régression trouvée et corrigée.** Le seul média passé par référence, l'ambiance visuelle
de campagne, ne s'affichait pas. `remote:get-connection-info` renvoie le port de **Vite**
(5173) en développement, ce qui est correct pour charger le PWA mais faux pour les médias :
le proxy est sur le port du SyncServer (3001). Vite répondait 200 avec son `index.html`,
soit 1 249 octets de HTML à la place d'une image.

La réponse ajoute un `mediaPort` distinct de `port`, toujours celui du SyncServer. Le
chemin `/media/` avait le même défaut latent, invisible parce qu'inexercé en développement.

**Découverte majeure : le point 6b ne couvre qu'un média sur cinquante.** Le payload mesuré
pèse **7,6 Mo**, dont 7,3 Mo de base64 que la conversion en références ne touche pas :

| Champ | Poids | Nombre |
|---|---|---|
| `session.atlasMaps[].fileUrl` | 4 911 Ko | 23 |
| `session.entities[].avatar` | 1 403 Ko | 21 |
| `session.favorites[].imageUrl` | 938 Ko | 1 |
| `session.players[].characters[].portraitUrl` | 61 Ko | 4 |

Ces médias sont stockés **directement en `data:` dans l'état de campagne**, pas sous forme
d'identifiants `m-`. `resolveToSendableUrl` les renvoie tels quels par sa garde d'entrée, et
la publication par référence ne s'applique jamais. Un seul champ — l'ambiance — était un
identifiant `m-`.

### 6d. La cause probable des base64 : une boucle de réécriture

En cherchant pourquoi un lieu de l'atlas portait une URL `/temp/` morte, un mécanisme bien
plus large est apparu — et il explique vraisemblablement les 7,3 Mo eux-mêmes.

**La boucle, tracée dans le code :**

1. La fenêtre MJ diffuse le payload avec les médias **résolus** (base64 ou URL absolues).
2. Le Player Hub — fenêtre Electron sur la machine du MJ, donc **même origine, même base
   IndexedDB** — reçoit ce payload et écrit `atlasMaps`, `entities`, `players`, `clues`
   dans `useSessionOSStore` (`useHubSync.applySyncPayload`).
3. `partialize` décidait de persister l'état **complet** dès que `window.appBridge`
   existait. Le Player Hub étant dans Electron, il réécrivait donc les données de campagne
   sous leur forme résolue.
4. La fenêtre MJ se réhydrate et récupère la version dégradée : les identifiants de
   médiathèque ont été remplacés par des base64, définitivement.

Le test répondait à la mauvaise question : « suis-je dans Electron ? » au lieu de « suis-je
propriétaire des données de campagne ? ».

**Fait.** `utils/windowRole.ts` définit le rôle de la fenêtre en un seul endroit, partagé
par `App.tsx` — dont la définition dupliquée disparaît — et par `PersistenceService`. Seule
la fenêtre MJ persiste les données de campagne ; le Player Hub, le projecteur et la
télécommande continuent de **lire** la base partagée et de recevoir la synchronisation, ils
cessent seulement d'y réécrire.

**Portée du correctif.** Il arrête la dégradation pour la suite ; il ne répare pas les
médias déjà convertis. David a corrigé le lieu concerné à la main en le reliant à la
médiathèque, ce qui a confirmé le diagnostic.

**Non prouvé.** Que les base64 existants viennent bien de cette boucle plutôt que d'imports
d'origine. Le chemin de code est sans ambiguïté, l'historique des données ne l'est pas.

### 6e. Reprise des médias inline — fait et mesuré

Des deux pistes possibles — publier les `data:` par référence à l'envoi, ou les ranger dans
la médiathèque — c'est la seconde qui a été retenue : elle traite la cause plutôt que le
symptôme, et rend la première inutile.

`modules/system/logic/InlinedMediaMigration.ts`, piloté depuis Réglages → Système, en deux
temps assumés : une analyse qui n'écrit rien et détaille ce qui serait repris, puis la
migration. Chaque image est écrite en médiathèque, **relue, comparée en taille**, et le
champ n'est remplacé qu'ensuite — une image qu'on ne saurait pas relire reste en base64.
Le décodage des `data:` est manuel plutôt que via `fetch`, pour qu'un base64 corrompu lève
au lieu de produire un blob vide, ce qui serait une perte silencieuse.

**Résultat mesuré le 2026-08-06**, sur la base de campagne réelle, sauvegarde faite à froid
au préalable. Les deux mesures viennent de chemins indépendants — l'analyse lit l'état
persisté, le harnais intercepte le trafic — et concordent au média près.

| | Avant | Après |
|---|---|---|
| Payload de synchronisation | 7 620 Ko | **305 Ko** |
| Blocs base64 | 49 | **0** |
| Références servies | 2 | **51** |

Facteur 25. Les 305 Ko restants sont le texte des campagnes : c'est le plancher.
Les images ne transitent plus qu'une fois par appareil, puis sont mises en cache par le
navigateur de la tablette.

Vérifié côté tablette réelle : les images s'affichent.

## 7. `handleAction` — 270 lignes de `if` ✅

**Le problème.** `handleAction` occupait les lignes 156 à 423 d'`App.tsx` en une suite de
`if` indépendants. Au-delà de la lisibilité, la liste de ce que l'application accepte
d'exécuter **sur ordre du réseau** n'était énoncée nulle part : il fallait la déduire en
lisant 270 lignes.

**Fait.** Registre `modules/remote/actions/`, un fichier par domaine — `diceActions`,
`audioActions`, `combatActions`, `sessionActions`, `whiteboardActions`, `sceneActions` —
regroupés dans `index.ts`. `App.tsx` passe de **482 à 235 lignes**, et huit imports de
stores devenus inutiles disparaissent : ils appartiennent aux handlers.

`dispatchRemoteAction` ignore et signale tout type absent du registre — c'est la liste
explicite promise au point 3. La recherche passe par `hasOwnProperty` : un accès direct
aurait laissé un client envoyer `type: "constructor"` et atteindre le prototype. Un handler
qui échoue est absorbé, sans emporter la boucle de réception.

**Équivalences vérifiées avant découpage.** Aucun type n'était traité par deux `if`
distincts, donc un handler unique par type est fidèle. Le cas des pads universels
paraissait devoir conserver son `return` anticipé : en réalité la branche synchronisait
puis sortait, et la sortie sautait la synchronisation finale — un seul envoi dans les deux
cas, exactement comme sans le `return`.

**Un écart assumé.** `remote:request-sync` déclenchait deux diffusions complètes, une dans
sa branche et une à la fin. Il n'en déclenche plus qu'une. La diffusion étant idempotente,
la seule différence est le trafic économisé.

**Corrigé au passage.** Le mock d'`AudioContext` de `src/test/setup.ts` ne couvrait pas
`createMediaStreamDestination`, ce qui faisait échouer tout test important `MusicEngine`
même indirectement. Le mock `idb` global n'exposait pas non plus les raccourcis
`get`/`put`/`delete`, utilisés directement par `idbStorage`.

**Reste ouvert : l'autorisation.** Le registre borne *ce qui* est exécutable, pas *par
qui*. `forwardToGM` relaie toujours vers le renderer les actions de n'importe quel client
connecté, appairé ou non : une tablette non appairée peut donc déclencher
`whiteboard:clear` ou `combat:next-turn`. C'est une question d'autorisation par rôle,
distincte du typage : elle a été traitée au **point 9**.

## 8. Couche de synchronisation non testée ✅

Des transports multiples coexistent entre des pairs dont aucun ne fait autorité :
`BroadcastChannel` via `CrossWindowEventService` pour les fenêtres locales, WebSocket via
`SyncServer` pour les tablettes, et depuis le point 5 un second `BroadcastChannel` pour
notifier les écritures de persistance.

*(La description initiale mentionnait l'événement `storage` comme troisième transport. Il a
disparu au point 5, avec le passage à IndexedDB.)*

**Fait.** 27 tests posés avant de toucher au point 6, pour servir de filet :

- `syncUtils` (24) — la fonction qui décide *ce qui part sur le réseau*. Y compris ses
  limites assumées, écrites noir sur blanc : la disparition d'un segment n'est pas
  signalée, et le diff partage les références de l'état courant plutôt que de le copier.
- `CrossWindowEventService` (10) — protocole des verrous de jetons, expiration à cinq
  secondes d'un verrou étranger périmé, filtrage de ses propres messages, et garde
  anti-boucle `isSyncing` vérifiée *pendant* l'application d'une mise à jour distante.

**Bug trouvé par les tests.** `isDeepEqual` ne distinguait pas un tableau d'un objet :
`Object.keys(['x'])` vaut `['0']`, exactement comme `Object.keys({ 0: 'x' })`. Un champ
passant de `{}` à `[]` — ou l'inverse — était donc vu comme inchangé et **n'était jamais
diffusé**. Une garde `Array.isArray` a été ajoutée. La correction ne peut que faire
émettre davantage, jamais moins : le sens sûr.

## 9. Aucune autorisation par rôle sur les actions reçues ⬜

**Origine.** Point identifié en traitant les points 3 et 7, qui l'ont chacun approché sans
le couvrir. Le point 3 a authentifié *l'accès aux données* — qui a le droit de **recevoir**
le flux non caviardé. Le point 7 a borné *le vocabulaire* — quels types d'actions
l'application accepte d'**exécuter**. Il manque le croisement des deux : qui a le droit de
déclencher quoi.

**Le problème.** `SyncServer.forwardToGM` relaie vers le renderer du MJ toute action
envoyée par tout client connecté, sans regarder son rôle. Un appareil non appairé, donc
rétrogradé en `player`, peut aujourd'hui émettre `whiteboard:clear`, `combat:next-turn` ou
`remote:sound:stop-all`. Le registre du point 7 les reconnaît comme des types valides et
les exécute : rien dans la chaîne ne demande si l'émetteur avait le droit.

Le préjudice n'est pas une fuite de données mais une prise de contrôle : effacer le tableau
en pleine scène, faire avancer l'initiative, couper l'ambiance sonore.

**Le classement n'était pas un choix de goût.** Le document proposait initialement trois
familles à arbitrer selon la façon de mener les parties. Le relevé de ce que chaque client
émet réellement a rendu l'arbitrage inutile — la frontière était déjà tracée par l'usage :

- Les tablettes (`hub`) émettent **exactement quatre types**, tous dans `useHubSync` :
  `session:send-message`, `session:request-item-transfer`, `session:remove-inventory-item`,
  `session:submit-feedback`.
- Tout le reste — dés, son, combat, storyboard, pads, tableau blanc — vient de la
  télécommande MJ, déjà appairée depuis le point 3.
- `map:ping` ne transite pas par le réseau : il vient de `PlayerHub` par
  `window.dispatchEvent`, donc d'une fenêtre locale.

Un refus par défaut ne coûtait donc rien : aucun client légitime n'émet hors de son
périmètre.

**Décisions (David).** Périmètre strict limité aux quatre actions constatées. Refus ignoré
en silence côté émetteur mais journalisé côté MJ. Contrôle d'appartenance traité **dans le
même chantier** plutôt que reporté.

**Fait.** `electron/actionPolicy.ts`, appliqué par `SyncServer.forwardToGM` :

- Les rôles appairés (`gm`, `remote`) passent sans restriction.
- Les autres sont limités à `PLAYER_ALLOWED_ACTIONS`, refus par défaut pour le reste.
- **Appartenance** : pour les actions qui désignent un personnage, le champ concerné doit
  correspondre à celui du client dans le registre de session —
  `session:remove-inventory-item` → `characterId`, `session:request-item-transfer` →
  `fromCharId`, `session:send-message` → `fromId`. Un joueur ne peut donc plus vider
  l'inventaire d'un autre ni parler en son nom. Seul l'émetteur est contrôlé : être
  destinataire d'un transfert reste légitime.
- Un refus est journalisé avec le rôle, l'appareil et l'adresse ; l'émetteur n'apprend rien.
- Le contrôle précède **toute** la logique de `forwardToGM`, y compris la branche P2P qui
  rediffuse aux autres clients sans repasser par le renderer. C'était le piège : contrôler
  après aurait laissé passer les messages usurpés.
- Deux garde-fous de compatibilité : un champ d'appartenance absent, vide ou non textuel
  laisse passer — pour qu'une évolution du payload ne casse pas une action légitime — et
  `'GM'` est traité comme un interlocuteur, pas comme un personnage usurpé.

26 tests : `actionPolicy.test.ts` pour la politique, plus six cas dans
`SyncServer.register.test.ts` qui vérifient le câblage réel, dont le fait qu'un client
ayant réclamé `gm` sans token se voit refuser les actions correspondantes.

**Validation en conditions réelles (2026-08-06).** Contre l'application en fonctionnement,
avec un client tablette simulé : le rôle `hub` est accordé, une connexion réclamant `gm`
sans token est rétrogradée en `player` et reçoit un `remote:error` de code
`pairing_required`.

**Les refus n'étaient consignés nulle part.** Ils sortaient en `console.warn`, et rien ne
collecte la sortie standard du process principal : ni le terminal de développement, ni
`main.log`, qu'electron-log n'alimente qu'à partir des appels `log.*` — et le seul appelant
était le pont relayant les logs du renderer, muet depuis le 3 mai. Un refus sans trace ne
vaut rien : le lendemain d'une partie, impossible de savoir si quelqu'un a tenté quelque
chose. `electron/auditLog.ts` écrit désormais ces événements dans le fichier.

**Ce que le journal a immédiatement révélé.** Dès sa mise en service, une régression sur la
tablette réelle de David : `remote:request-sync` était refusée. Le Tablet Hub l'envoie juste
après son enregistrement (`useHubSync`), mais mon relevé initial l'avait manquée — je
cherchais `socketRef.current?.send` et celle-ci s'écrit `socket?.send`. L'action est
désormais autorisée : elle ne demande que la rediffusion d'un état auquel le client a déjà
droit, caviardé selon son rôle.

La leçon vaut au-delà du correctif : une liste blanche établie par relevé d'expressions
régulières a des angles morts, et c'est la journalisation qui les révèle — pas la relecture.

**Risque connexe, non traité.** `remote:request-sync` déclenche `handleSync(true)`, qui
contourne l'étranglement de 500 ms. Un client hostile peut donc forcer des diffusions
complètes en rafale — 7,6 Mo chacune tant que le point 6 n'est pas terminé. Une limitation
de débit par appareil serait à envisager ; l'urgence baissera d'elle-même quand le payload
sera réduit.

**Angle mort connu, assumé.** Les fenêtres locales — Player Hub, projecteur — n'empruntent
pas la WebSocket mais le `BroadcastChannel` de `CrossWindowEventService` : elles échappent
donc entièrement à ce contrôle. Le risque est moindre (ces fenêtres tournent sur la machine
du MJ, hors de portée du réseau), et la fermeture de cet angle mort est un bénéfice attendu
du chantier d'unification du transport, où elle est déjà notée.

---

## Question de fond — tranchée le 2026-08-06

La question posée par la revue était : faire du **process principal Electron le seul
propriétaire de l'état partagé**.

**Décision : non — on unifie le transport, l'état reste dans le renderer MJ.**

### Ce qui a motivé la décision

David a identifié son besoin comme la **robustesse en partie** : les bugs de cohérence
pendant une séance, pas une capacité nouvelle. Déplacer l'état ne sert pas cet objectif et
coûterait une réécriture de tous les stores, sur un logiciel utilisé en vrai.

### Le coût réel de l'architecture actuelle, mesuré

44 commits mentionnent la synchronisation, dont une vingtaine de correctifs. Le tableau
blanc a été recorrigé au moins quatre fois, la résolution des médias vers les tablettes
cinq fois de suite, plus le combat, le Player Hub et un `cross-window-sync-stabilization`
dédié. Ce sous-système ne converge pas.

**Sept mécanismes distincts de suppression d'écho ou d'étranglement** coexistent :
`isApplyingRemoteUpdate` et son `isSyncing()` public ; le filtrage par `senderId` ; le
`relayTimer` et sa règle « ne jamais relayer le payload brut d'un esclave » ; le `lastSeen`
d'`idbStorage` ; le drapeau `isSystemSyncing` ; les consultations croisées de
`crossWindowSync.isSyncing()` ; et quatre étranglements temporels (33, 50, 100, 500 ms).

Aucun n'est du mauvais code. Chacun existe **parce qu'aucun pair ne fait autorité**.

Symptôme parlant : `lastBroadcastRef`, qui porte l'état différentiel des tablettes, est un
`useRef`. Recharger la fenêtre MJ le perd, et les tablettes reçoivent alors un état partiel
sans que rien ne le signale.

### Le constat qui rend le chantier cohérent

Au fil des neuf points, le process principal est **déjà devenu l'autorité** — identité
(`PairingManager`), autorisation (`actionPolicy`), accès aux fichiers (`MediaAccess`),
confiance TLS (`netTrust`). Toujours pour la même raison : c'est le seul endroit qui sait
quelque chose que les clients ne peuvent pas falsifier. Unifier le transport prolonge ce
mouvement sans le pousser jusqu'à l'état.

### Périmètre retenu

Le process principal devient le **seul relais**. Les fenêtres locales passent par lui comme
les tablettes. `CrossWindowEventService` disparaît. Bénéfices attendus :

- un seul chemin à tester au lieu de deux ;
- l'autorisation du point 9 s'applique partout — aujourd'hui les fenêtres locales la
  contournent entièrement ;
- la suppression d'écho devient triviale : le relais ne renvoie rien à l'émetteur, ce qui
  élimine quatre des sept mécanismes ;
- les verrous de jetons deviennent un état du process principal, donc autoritaire.

**Non-objectif explicite :** l'état reste dans le renderer MJ, qui reste maître. Les
tablettes restent des clients distants — ce sont des PWA, sans process principal — donc le
fan-out réseau et la réconciliation après reconnexion ne sont pas concernés.

### Risque identifié, à lever en premier

Passer par le process principal ajoute un saut IPC. Indolore sur la plupart des flux, mais
le glisser-déposer de jetons tourne à 30 fps et les tracés du tableau blanc à 20 — ce sont
les deux flux les plus sensibles à la latence, et aussi les plus souvent recorrigés.
Aujourd'hui ils vont de renderer à renderer, sans intermédiaire.

**Le chantier doit donc commencer par une mesure sur ces deux flux, pas par une
réécriture.** Si la latence passe, on unifie tout ; sinon on saura qu'il leur faut un
régime particulier, et ce sera décidé sur des chiffres.

---

## Chantier — unification du transport

### Étape 1 — mesure du saut IPC ✅ (2026-08-06)

**Le banc.** `scripts/ipc-bench/`, harnais autonome hors application : deux fenêtres de
même origine, `webPreferences` identiques à celles d'`electron/main.ts`, et un aller-retour
mesuré tantôt par `BroadcastChannel`, tantôt par `renderer → main → renderer`. Les deux
transports **alternent à chaque itération** plutôt que d'être mesurés à la suite : ils
subissent ainsi les mêmes conditions machine au même instant. Payloads calqués sur ce que
`CrossWindowEventService` diffuse réellement.

Les deux fenêtres tournent bien dans des **process de rendu distincts** — la comparaison
est donc honnête, `BroadcastChannel` n'est pas avantagé par un raccourci intra-process.

**Relevé, à la cadence réelle de chaque flux.** Aller-retour complet, p50 en millisecondes ;
le sens unique vaut environ la moitié.

| Flux | Taille | BroadcastChannel | Via le main | Écart |
|---|---|---|---|---|
| Jetons — 8 sur la carte | 1,5 Ko | 1,00 | 1,20 | +0,20 |
| Jetons — 30 sur la carte | 5,8 Ko | 1,20 | 1,60 | +0,40 |
| Tableau blanc — 6 tracés | 8,0 Ko | 1,40 | 3,00 | +1,60 |
| Tableau blanc — 40 tracés | 106,3 Ko | 4,70 | **23,70** | **+19,00** |
| Brouillard de guerre | 200,1 Ko | 2,80 | 3,30 | +0,50 |

**Le glisser-déposer de jetons est hors de cause.** +0,2 à +0,4 ms d'aller-retour contre un
budget de 33 ms par image : deux ordres de grandeur d'écart. Le risque identifié au moment
de cadrer le chantier ne se matérialise pas sur ce flux.

**Mais une anomalie contredisait la lecture naïve.** Le brouillard de 200 Ko passe en 3,3 ms
et le tableau blanc de 106 Ko en 23,7. Le coût ne suit donc pas les octets — sinon le plus
gros payload serait le plus lent, et c'est l'inverse.

### Étape 1 bis — ce qui coûte vraiment, et le correctif

Seconde passe, à taille en octets comparable et forme variable :

| Forme | Octets | Nœuds d'objet | BroadcastChannel | Via le main |
|---|---|---|---|---|
| Tableau blanc, points `{x, y}` | 106 Ko | 4 882 | 5,00 | **23,70** |
| Mêmes tracés, coordonnées à plat | 59 Ko | 82 | 2,90 | 7,40 |
| Une seule longue chaîne | 106 Ko | 1 | 2,00 | 2,10 |

**Le coût suit le nombre de nœuds d'objet, pas la taille.** À 106 Ko constants, passer de
4 882 nœuds à 1 fait tomber le surcoût de +19 ms à +0,1 ms. La sérialisation d'Electron est
nettement plus lente que le clone structuré de Blink **sur les graphes d'objets** ; sur une
chaîne, les deux se valent.

**Le correctif tient en une ligne : pré-sérialiser.** Même payload, transmis en chaîne JSON,
coût de `stringify` et de `parse` compté des deux côtés :

| Variante | p50 |
|---|---|
| BroadcastChannel, objet — *transport actuel* | 5,00 |
| Via le main, objet | 23,70 |
| Via le main, **JSON** | **4,10** |

L'écart ne se réduit pas : il s'inverse. Passer par le process principal en pré-sérialisant
est **plus rapide que le transport actuel**, sur le flux même qui devait être le point de
blocage. La raison est simple — le clone structuré paie le graphe d'objets deux fois, une
fois à l'émission et une fois à la réception, là où `JSON.stringify` produit une chaîne que
les deux piles traitent comme un bloc opaque.

### Conclusion

**Le risque est levé. L'unification peut se faire sans régression de latence**, à une
condition inscrite dès maintenant dans le périmètre : **le relais du process principal
transporte des chaînes, pas des objets.**

Ce n'est pas une contrainte gênante — c'est déjà ce que fait le `SyncServer` pour les
tablettes, qui envoie du JSON sur la WebSocket. Unifier le transport unifie donc aussi
l'encodage, au lieu de faire coexister deux formes.

**Trouvaille annexe, indépendante du transport.** Le tableau blanc rediffuse **tout** le
tableau — `paths: state.paths` — toutes les 50 ms pendant qu'on dessine, pas seulement le
tracé en cours. À 40 tracés cela fait 106 Ko vingt fois par seconde, soit 2 Mo/s, quel que
soit le transport. Le passage aux coordonnées à plat mesuré ci-dessus divise déjà les octets
par deux et les nœuds par soixante ; n'envoyer que le tracé actif diviserait bien davantage.
C'est un chantier distinct, à traiter pour lui-même.

**Limite assumée de la mesure.** Le banc mesure un écho synthétique, sans rendu React ni
charge applicative concurrente. Il compare deux transports toutes choses égales par
ailleurs — ce qui est exactement la question posée — mais il ne prédit pas la latence
ressentie en partie.

### Étape 2 — le relais, et le premier flux basculé ✅

**Le relais.** `electron/WindowRelay.ts`, branché dans `app.whenReady()`. Il diffuse un
message à toutes les fenêtres **sauf celle qui l'a émis** — c'est là que la suppression
d'écho devient gratuite plutôt que reconstruite dans chaque renderer.

- La liste des fenêtres est **relue à chaque message** plutôt que tenue dans un registre :
  le Player Hub et le projecteur vont et viennent, et un registre se désynchroniserait.
- Une fenêtre fermée entre la vérification et l'envoi ne prive pas les autres du message.
- **Le relais refuse tout ce qui n'est pas une chaîne.** Sérialiser à la place de
  l'appelant aurait masqué la régression de performance que l'étape 1 vient de mesurer ;
  la contrainte est donc inscrite dans le code, pas seulement dans ce document.

**L'aiguillage.** `src/services/windowTransport.ts` porte les deux chemins et choisit par
type de message. `CrossWindowEventService` ne connaît plus le transport : sa logique
— verrous, maître/esclave, rediffusion d'état complet — est inchangée, seul son canal
d'émission et de réception a bougé.

Hors Electron — tablette en PWA, navigateur de développement — le relais n'existe pas et
tout retombe sur le `BroadcastChannel`.

**Le premier flux : `clock`.** Choisi pour être le plus simple : diffusion pure, sans le
traitement maître/esclave que `map` et `whiteboard` reçoivent dans `handleMessage`, et à
fréquence basse — une régression y serait visible sans être gênante en partie.

**Condition d'entrée vérifiée avant de le basculer.** Le `BroadcastChannel` utilise le
clone structuré, qui préserve `Map`, `Set`, `Date` et les clés valant explicitement
`undefined` ; `JSON` ne préserve rien de cela. Le payload de `clock` a été relu champ par
champ : tous requis, tous primitifs ou tableaux d'objets plats. L'aller-retour JSON ne
change donc rien. `RELAYED_TYPES` porte cette exigence en commentaire, et un test échoue
délibérément à chaque ajout dans la liste — pour que la vérification soit refaite plutôt
que supposée.

25 tests : `WindowRelay.test.ts` (10) pour le relais, `windowTransport.test.ts` (15) pour
l'aiguillage. Les 10 tests de `CrossWindowEventService` posés au point 8 passent inchangés,
ce qui est le résultat recherché : la bascule ne devait rien changer au comportement.

**Suite complète au vert** (432 tests), type-check et build Electron compris.

**Validé en conditions réelles le 2026-08-06** par David, entre les vraies fenêtres de
l'application. C'était la seule partie que ni les tests ni le build ne pouvaient couvrir.

### Un meilleur critère de bascule, trouvé en préparant le flux suivant

Relire un payload champ par champ pour s'assurer qu'il survit à un aller-retour JSON — ce
qui avait été fait pour `clock` — est laborieux et faillible : `HealthSystem.data` est typé
`Record<string, unknown>`, et aucune lecture de type ne dit ce qu'il contient à l'exécution.

Il existe une garantie plus forte. **Un store déjà persisté en JSON est par construction
JSON-compatible.** Zustand `persist` passe par `createJSONStorage`, donc tout état persisté
subit déjà l'aller-retour à chaque sauvegarde et à chaque réhydratation. Une valeur qui n'y
survivrait pas serait déjà corrompue aujourd'hui, indépendamment du transport.

Le critère devient donc vérifiable d'un coup d'œil : **le payload diffusé est-il inclus dans
le `partialize` du store ?** Si oui, la bascule est sûre.

- `clock` : persisté. La relecture champ par champ concluait déjà, mais n'était pas
  nécessaire.
- `combat` : le `partialize` est **exactement** les quatre champs diffusés — `combatants`,
  `round`, `currentTurnIdx`, `isCombatProjected`.

### Étape 3 — bascule de `combat` 🟡

Même profil que `clock` : diffusion pure, sans le traitement maître/esclave que `map` et
`whiteboard` reçoivent dans `handleMessage`. Sûreté JSON acquise par le critère ci-dessus.

Aucun code de transport n'a changé — seul le contenu de `RELAYED_TYPES`. C'est le résultat
recherché à l'étape 2 : basculer un flux doit être une ligne, pas un chantier.

**À exercer en conditions réelles**, comme `clock`.

### Étape 4 — verrous de jetons ✅

**La contrainte qui a cadré la solution.** `requestLock` est appelé **synchronement** dans
`handlePointerDown`, et son résultat conditionne le `stopPropagation()` juste après. Après
un aller-retour IPC, l'événement aurait déjà atteint le canvas de brouillard en dessous : un
verrou pleinement autoritaire ne peut donc pas remplacer l'appel tel quel.

`ipcRenderer.sendSync` aurait préservé la signature synchrone, et à moins d'une milliseconde
le blocage serait passé inaperçu — sauf que ce process principal fait de l'indexation RAG et
des appels Ollama. Un gel du renderer en plein glisser-déposer serait pire que le défaut
corrigé. Écarté.

**Décision (David).** Relais **plus** libération à la fermeture, plutôt qu'un arbitrage
complet de l'octroi. Le partage retenu :

- **L'octroi reste local et optimiste**, inchangé, là où l'événement DOM l'exige. Le risque
  qu'il laisse ouvert — deux fenêtres saisissant le même jeton au même instant — demande
  deux mains, ce qui n'arrive pas avec un seul MJ.
- **La libération à la fermeture passe au process principal**, seul point qui voit une
  fenêtre disparaître. C'est la seule partie du problème qui exige réellement une vue
  globale : un renderer ne peut pas distinguer une fenêtre fermée d'une fenêtre lente.

**Fait.** `electron/TokenLockRegistry.ts` observe le flux relayé — il ne le filtre pas — et
retient quelle fenêtre détient quel jeton. À la fermeture d'une fenêtre, le process principal
diffuse lui-même le déverrouillage de ce qu'elle détenait.

Le message de nettoyage reproduit **exactement** l'enveloppe qu'aurait émise le détenteur,
`senderId` compris. C'était le piège : les renderers filtrent les messages portant leur
propre `senderId`, et emprunter celui de la fenêtre fermée garantit que le déverrouillage
atteint tout le monde, puisqu'il n'appartient plus à personne.

L'expiration de cinq secondes reste en place côté renderer, en filet.

Auparavant, un Player Hub fermé en plein glisser-déposer immobilisait le jeton pendant cinq
secondes. La libération est désormais immédiate et exacte.

15 tests (`TokenLockRegistry.test.ts` et l'aiguillage des deux types de verrous).
Suite complète au vert (446).

**Limite connue, inchangée.** `isTokenLocked` est lu pendant le rendu de `MapTokenNode` sans
être réactif : un verrou qui change n'entraîne pas de re-rendu, l'état est constaté au rendu
suivant. C'était déjà le cas avec le `BroadcastChannel` — la bascule ne l'aggrave pas, mais
ne le corrige pas non plus.

**Validé en conditions réelles le 2026-08-06** : Player Hub fermé en plein déplacement d'un
jeton, qui redevient saisissable immédiatement.

### Étape 5 — bascule de `map` ✅

C'est le flux le plus sollicité — 30 fps pendant un glisser-déposer — et celui dont l'étape 1
avait mesuré qu'il ne posait pas de problème : +0,2 à +0,4 ms d'aller-retour contre un budget
de 33 ms.

**Le critère du `partialize` ne s'appliquait pas ici.** Les champs `projected*` sont
explicitement exclus de la persistance de `useMapStore` — « Projections are NOT persisted to
avoid massive performance drops during real-time movement ». La garantie acquise pour `clock`
et `combat` tombait donc, et il a fallu revenir à la vérification champ par champ :

- `projectedTokens` et `projectedDangerZones` dérivent de `tokens` et `dangerZones`,
  eux persistés — la garantie leur est transitive.
- `projectedFogDataUrl` est `string | null`. Le `null` compte : effacer le brouillard se
  transmet en envoyant `null`, et `null` survit à JSON là où `undefined` disparaîtrait.
  Un test le fixe.
- `MapPing` et `MagicEffect` n'ont que des primitives, et aucun `Date`, `Map` ni `Set`
  n'apparaît dans `modules/map/types.ts`.

Ce que cela dit du critère : il est commode quand il s'applique, mais ce n'est pas une
dispense générale. Un store peut très bien exclure de sa persistance exactement les champs
qu'il diffuse — c'est le cas ici, et pour une bonne raison.

**Le traitement maître/esclave est inchangé.** `applyRemoteUpdate` mute le payload reçu
(fusion protectrice pendant un glisser local, report des positions vers `tokens` côté
maître). C'était sûr avec le clone structuré, qui livre un objet neuf ; ça l'est tout autant
avec `JSON.parse`, pour la même raison.

Suite complète au vert (448), build compris.

**Validé en conditions réelles le 2026-08-06** : jeton déplacé depuis la fenêtre MJ, suivi
par le Player Hub et le projecteur.

### Étape 6 — bascule du tableau blanc ✅

C'est le flux qui avait justifié toute la mesure de l'étape 1 : le seul réellement pénalisé
par le saut IPC, à **+19 ms** d'aller-retour sous sa forme objet — 106 Ko répartis en 4 882
nœuds. C'est exactement l'écart que la pré-sérialisation du relais annule : 4,1 ms contre
5,0 pour le `BroadcastChannel`. Le flux qui menaçait le chantier en sort plus rapide qu'avant.

`paths` étant dans le `partialize` de `useWhiteboardStore`, la sûreté JSON est acquise par le
critère. Les champs volatils qu'il exclut sont soit du même type — `activePath` est un
`DrawingPath`, comme les éléments de `paths` — soit des primitives.

Suite complète au vert (449), build compris.

**Annulée le 2026-08-06 (`79610ac`).** Le tableau blanc cessait de fonctionner sur le Player
Hub. Retour à l'ancien transport pour rendre la fonction avant d'avoir compris — laisser une
fonction cassée en place le temps du diagnostic serait le mauvais ordre. Un test verrouille
le retour en arrière, pour qu'une rebascule soit un geste délibéré.

**La causalité est établie, la cause non.** Le revert ne portait que sur `whiteboard` ;
`map` est resté sur le relais et le tableau blanc remarche. C'est donc bien cette bascule-là,
et pas celle de la carte.

Trois pistes écartées avec certitude :

- **Pas la compatibilité JSON.** `paths` est dans le `partialize` de `useWhiteboardStore`,
  donc déjà soumis à l'aller-retour à chaque sauvegarde.
- **Pas le relais.** `map` emprunte le même chemin et a été validé en conditions réelles.
- **Pas un second consommateur.** Personne n'écoute `gmos-cross-window-sync` en dehors de
  `WindowTransport`.

**Ce qui distingue ce flux des autres**, et où chercher :

- C'est le seul flux basculé dont le Player Hub est aussi **émetteur** — `PlayerDrawingCanvas`
  publie via `setActivePath` et `setLaserPointer`. Pour tous les autres, le hub ne fait que
  recevoir. La topologie « la même fenêtre émet et reçoit » n'avait donc jamais été exercée
  sur le relais.
- Le payload transporte `projectionTarget`, et le destinataire le **fusionne**. Une fenêtre
  qui réémet sa propre vue peut donc écraser la cible de projection d'une autre — un chemin
  d'auto-extinction qui existe déjà, mais que la bascule a pu réveiller.
- C'est le seul flux dont l'étranglement (50 ms) **abandonne** la mise à jour au lieu de la
  reprogrammer : la carte a un `setTimeout` de rattrapage, pas lui.

**Cause trouvée par reproduction, et rebasculé le 2026-08-06.**

Le harnais — `CrossWindowEventService.relay.test.ts` — monte deux fenêtres, chacune avec son
**propre graphe de modules** donc ses propres stores Zustand, reliées par le vrai
`relayToOthers` du process principal. Il a fallu deux passes : la première version ne
reproduisait rien, parce qu'elle n'appelait jamais `notifyReady()` et n'attendait pas les
50 ms du `relayTimer`. Ces deux angles morts couvraient précisément le chemin en cause.

**Le mécanisme.** Le maître **adopte en bloc** le payload d'une fenêtre secondaire,
`projectionTarget` compris. Quand le Player Hub s'ouvre, sa réhydratation déclenche une
diffusion de son propre état — projection à `null`, tableau vide — que le maître adopte, puis
rediffuse à tout le monde. La projection s'éteignait elle-même.

**Ce que la bascule avait réellement fait.** Rien créé. Le chemin existait déjà sur le
`BroadcastChannel` ; elle a seulement inversé l'ordre d'arrivée, `hub:ready` restant sur le
canal rapide pendant que l'état passait par l'IPC. C'est ce qui a rendu visible un défaut
resté invisible des mois durant. La leçon rejoint celle du point 9 : ce sont les changements
d'ordonnancement qui révèlent les dépendances implicites, pas la relecture.

**Deux gardes, pour deux problèmes distincts :**

- **La cible de projection appartient au MJ.** Elle est décidée dans
  `WhiteboardProjectionModal`, qui ne vit que dans sa fenêtre. Une fenêtre secondaire n'en est
  jamais la source légitime — elle en diffuse pourtant une copie à chaque mise à jour.
- **Une fenêtre secondaire n'émet rien avant d'avoir reçu l'état partagé.** Avant cela, elle
  ne connaît que sa valeur initiale ou sa réhydratation. Les verrous en sont exemptés : ils ne
  portent pas d'état partagé, et les retenir laisserait un jeton saisissable deux fois pendant
  les premières secondes d'une fenêtre.

Les deux gardes valent au-delà du tableau blanc : `map` était exposé au même écrasement.

**Vérifié dans les deux sens** — le harnais échoue sans les gardes, passe avec. Un test qui
passe dans les deux cas ne prouverait rien.

**Piège du harnais, corrigé.** Les services d'un test précédent restent vivants, et le
`relayTimer` de 50 ms du maître se déclenchait pendant le test suivant en y publiant l'état
d'avant. Une génération rend les anciens ponts inertes. La persistance a dû être neutralisée
pour la même raison : les deux graphes partagent le `localStorage` de jsdom, donc la même clé.

Suite complète au vert (464), build compris.

**Validé en conditions réelles le 2026-08-07**, y compris le cas exact que les gardes
corrigent : ouvrir le Player Hub alors que le tableau est déjà projeté.

### Étape 6 bis — volume du payload ✅

Le tableau blanc rediffusait **tout** le tableau à chaque mise à jour, soit 2 Mo/s à 40
tracés. C'est un défaut indépendant du transport.

**Décision (David) : après validation du transport, pas en même temps.** Le tableau blanc est
le flux le plus souvent recorrigé du projet — au moins quatre fois d'après le relevé des 44
commits de synchronisation. Empiler deux changements dessus avant d'en avoir validé un seul
priverait du moyen de savoir lequel accuser. Transport validé en réel, l'étape a été ouverte
le 2026-08-07.

**Le critère prévu au plan était trop étroit.** Il consistait à omettre `paths` pendant qu'un
tracé est en cours (`activePath !== null`). En relisant le canevas avant d'écrire le
correctif, un chemin bien pire est apparu — et ce critère ne l'aurait pas couvert :

- L'outil laser appelle `setLaserPointer` à **chaque `mousemove`**, bouton relâché compris.
- `activePath` vaut alors `null`, donc `isDrawingEnd` est vrai, donc **l'étranglement de
  50 ms ne s'applique pas** : la condition qui le déclenche est `!isDrawingEnd`.
- Le tableau entier repartait donc à la cadence de la souris, pas à 20 Hz.

**Le critère retenu est exact plutôt qu'approché : n'envoyer `paths` que s'il a changé.** La
comparaison est par référence, ce que Zustand rend fiable — toute mutation de `paths` produit
un nouveau tableau, une mise à jour qui n'y touche pas conserve le même. C'est déjà la
technique du flux carte pour ses champs lourds. Omettre est sûr parce que le destinataire
fusionne (`{ ...prev, ...payload }`) : sans `paths`, il garde le sien — le même mécanisme qui
avait rendu le point 6a simple.

Ce critère couvre le laser, et il fait disparaître la réserve du plan initial : un changement
de `paths` survenu pendant un tracé — effacement automatique du laser au bout de deux
secondes, annulation — n'attend plus le tracé suivant, il part à la mise à jour qui vient.

**Le piège, et pourquoi `broadcast` retourne désormais un booléen.** Tenir une trace de ce
qu'on a envoyé n'est juste que si l'envoi a bien eu lieu. Or la garde de démarrage de l'étape 6
retient les messages d'une fenêtre secondaire tant qu'elle n'a pas reçu l'état partagé : noter
ces tracés comme envoyés les aurait fait **manquer définitivement** une fois la garde levée.
`broadcast` signale donc sa retenue, et la trace n'est mise à jour qu'après une diffusion
réelle. Un test le fixe, et échoue avec la version naïve.

`broadcastFullState()` continue d'envoyer les tracés sans condition : c'est le chemin de
resynchronisation, dont le destinataire n'a précisément rien à fusionner.

5 tests ajoutés. Suite complète au vert (470), type-check et build compris. **Vérifié dans les
deux sens** : la sonde qui envoie `paths` inconditionnellement fait tomber le test d'omission,
celle qui note l'envoi sans regarder la retenue fait tomber le test de la garde.

**Validé en conditions réelles le 2026-08-07** : dessin, laser promené sur le tableau,
effacement et annulation, le Player Hub suivant dans chaque cas.

**Reste, plus petit.** Quand une fenêtre secondaire dessine, le maître reprogramme un
`broadcastFullState()` 50 ms après le dernier message reçu, lequel renvoie les tracés
entiers — et aussi tout le payload carte. La temporisation est glissante, donc elle ne se
déclenche qu'en fin de rafale, mais ce chemin-là n'est pas couvert par l'étape.

### Étape 7 — bascule de `hub:ready` ✅

`hub:ready`, dernier type encore sur le `BroadcastChannel`. Il ne porte pas de payload, mais
il déclenche `broadcastFullState()` côté maître — c'est le chemin de synchronisation initiale
quand le Player Hub s'ouvre, donc pas un cas anodin malgré sa forme.

**La question de compatibilité JSON ne se pose pas** : l'enveloppe se réduit à
`{ type, senderId }`, deux chaînes. Ni le critère du `partialize` ni la relecture champ par
champ n'avaient à s'appliquer.

**Le vrai bénéfice est l'ordre d'arrivée, pas la performance.** Tant que ce signal restait
sur le `BroadcastChannel` pendant que l'état passait par l'IPC, les deux canaux se
doublaient — et c'est exactement cette inversion qui avait rendu visible la panne du tableau
blanc de l'étape 6. Tous les flux étant désormais sur le même chemin, l'annonce ne peut plus
dépasser l'état qu'elle déclenche. La bascule ferme donc la classe de défauts que l'étape 6
avait dû diagnostiquer, au lieu de simplement finir une liste.

**Ce que les tests sont devenus.** Aucun type de l'application n'emprunte plus l'ancien
chemin sur le poste MJ : le test qui vérifiait le repli s'exerçait sur `hub:ready`, il porte
maintenant sur un type inconnu — l'aiguillage reste gardé, sans dépendre d'un flux qui n'existe
plus de ce côté. Le test du cas hors Electron a été renforcé au passage : il constatait qu'une
publication ne levait pas, il vérifie désormais que le message **arrive** sur le
`BroadcastChannel`. C'est le cas de la tablette en PWA, qui émet `hub:ready` comme les autres
fenêtres secondaires.

**Commentaire du harnais corrigé.** `CrossWindowEventService.relay.test.ts` annonçait forcer
`whiteboard` dans `RELAYED_TYPES` — vrai pendant le revert, faux depuis la rebascule. Sa
sous-classe de transport reste néanmoins nécessaire, pour une autre raison : les deux graphes
de modules partagent le `window` de jsdom, donc le même `window.appBridge`. Le vrai
`WindowTransport` relit ce pont à chaque publication, si bien qu'après le chargement de la
seconde fenêtre la première publierait sous l'identité de la seconde — et le relais ne
l'exclurait plus. La sous-classe fige le pont au chargement, ce qu'un process de rendu
distinct fait naturellement en production.

Suite complète au vert (465), type-check et build compris.

**Validé en conditions réelles le 2026-08-07** : Player Hub et projecteur ouverts alors que la
carte et le tableau étaient déjà projetés — c'est ce que `hub:ready` sert à rattraper.

**Nuance sur la disparition annoncée du `BroadcastChannel`.** Il ne peut pas disparaître tout
à fait : `WindowTransport` s'en sert de repli hors Electron, où aucun process principal
n'existe. Sur tablette en PWA il n'y a de toute façon qu'une fenêtre, donc rien à
synchroniser — mais le code doit rester exécutable. Ce qui disparaît, c'est son usage dans
l'application de bureau, et avec lui le second chemin à tester.

---

## Bilan du chantier — 2026-08-07

Le transport est unifié : tous les flux entre fenêtres locales — `clock`, `combat`, `map`,
les deux types de verrous, `whiteboard`, `hub:ready` — passent par `electron/WindowRelay.ts`.
Le `BroadcastChannel` ne subsiste que comme repli hors Electron. Validé en conditions réelles,
sauf `combat` (étape 3), qui n'a jamais été exercé pour lui-même.

Le périmètre annonçait quatre bénéfices. Deux sont encaissés, deux ne le sont pas — et le
dire vaut mieux que laisser croire le chantier clos.

**Encaissé — un seul chemin à tester.** Sur le poste MJ, plus aucun flux applicatif
n'emprunte le `BroadcastChannel`. La classe de défauts liée à deux canaux de vitesses
différentes est fermée par construction depuis l'étape 7, et c'est elle qui avait produit la
panne de l'étape 6.

**Encaissé, partiellement et volontairement — les verrous de jetons.** Le process principal
tient le registre et libère à la fermeture d'une fenêtre, ce qu'aucun renderer ne peut faire.
L'octroi reste local et optimiste, pour la raison écrite à l'étape 4 : `requestLock` est
synchrone par nécessité. C'est un partage assumé, pas un reste à faire.

**Non encaissé — l'autorisation du point 9 ne s'applique toujours pas aux fenêtres locales.**
`installWindowRelay` diffuse sans consulter `electron/actionPolicy.ts`. L'angle mort noté au
point 9 est donc toujours ouvert : le chantier l'a rendu *adressable* — il y a désormais un
point de passage unique où poser le contrôle — il ne l'a pas refermé. C'est le premier reste
à faire, et le moins coûteux.

**Non encaissé — la suppression d'écho n'a pas été simplifiée.** Le périmètre annonçait que
le relais éliminerait « quatre des sept mécanismes ». Le relevé après coup ne le confirme
pas : un seul l'est réellement, le filtrage par `senderId`, et seulement sur les flux relayés
— on le garde pour le repli hors Electron. Les autres survivent parce qu'ils ne traitaient
pas le problème qu'on croyait :

- `isApplyingRemoteUpdate` garde la boucle **interne** à une fenêtre — appliquer une mise à
  jour réveille l'abonné du store, qui rediffuserait. Que le relais épargne l'émetteur n'y
  change rien.
- Le `relayTimer` et la règle « ne jamais relayer le payload brut d'un esclave » sont une
  décision maître/esclave, pas une suppression d'écho.
- Les quatre étranglements temporels traitent le volume, pas l'écho.
- Le `lastSeen` d'`idbStorage`, `isSystemSyncing` et les consultations croisées
  d'`isSyncing()` appartiennent à la persistance et à la synchronisation réseau, que le
  chantier n'a pas touchées.

Le chantier a par ailleurs **ajouté** deux gardes à l'étape 6 — `hasReceivedSharedState` et
`stripProjectionTarget`. Elles corrigent un défaut antérieur au transport, mais le compte net
va dans l'autre sens que celui annoncé.

La prévision était optimiste parce qu'elle confondait deux échos : celui qui traverse les
fenêtres, que le relais supprime, et celui qui reboucle à l'intérieur d'une fenêtre, qu'il ne
voit même pas. C'est le second que la plupart de ces mécanismes traitent.

### Restes à faire, par ordre d'intérêt

1. **Appliquer `actionPolicy` au relais** — referme l'angle mort du point 9.
2. **Exercer `combat` en conditions réelles** — seul flux basculé jamais vérifié pour lui-même.
3. **La rediffusion complète du maître** — 50 ms après le dernier message d'une fenêtre
   secondaire, il renvoie tracés et payload carte entiers. Temporisation glissante, donc en
   fin de rafale seulement, mais l'étape 6 bis ne couvre pas ce chemin.
4. **`isTokenLocked` n'est pas réactif** (étape 5) — antérieur au chantier, inchangé par lui.
5. **Limiter le débit de `remote:request-sync`** (point 9) — l'urgence a baissé avec le
   payload passé à 305 Ko, elle n'a pas disparu.
