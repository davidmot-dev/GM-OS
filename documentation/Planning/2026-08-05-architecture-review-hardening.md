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
| 6 | Segment de sync `session` monolithique + médias en base64 | Moyenne | ✅ Fait — à valider avec une tablette |
| 7 | `handleAction` — ~270 lignes de `if` en série | Moyenne | ✅ Fait |
| 8 | Couche de synchronisation non testée | Moyenne | ✅ Fait |
| 9 | Aucune autorisation par rôle sur les actions reçues | Élevée | ✅ Fait |

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

**Réserve.** Les 11 tests du résolveur couvrent la logique, pas le rendu réel. Le passage
du base64 à la référence décide si les images s'affichent sur les tablettes : à vérifier
avec un vrai appareil connecté avant de considérer le point clos.

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
