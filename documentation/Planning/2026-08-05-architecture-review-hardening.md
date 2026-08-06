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
| 6 | Segment de sync `session` monolithique + médias en base64 | Moyenne | ⬜ À faire |
| 7 | `handleAction` — ~270 lignes de `if` en série | Moyenne | ✅ Fait |
| 8 | Couche de synchronisation non testée | Moyenne | ⬜ À faire |

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

## 6. Segment de sync `session` monolithique ⬜

Le segment `session` part d'un bloc, et les médias voyagent en base64 **dans le payload**.
Chaque petite modification retransmet donc tout. À découper en segments, et à remplacer
les médias embarqués par des références.

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
distincte du typage, et elle n'est pas traitée.

## 8. Couche de synchronisation non testée ⬜

Trois transports coexistent — `BroadcastChannel`, WebSocket, et l'événement `storage` —
entre des pairs dont aucun ne fait autorité. Aucun test ne couvre cet ensemble, alors que
c'est là que se logent les bugs de cohérence les plus coûteux en partie.

---

## Question de fond, à trancher un jour

Faire du **process principal Electron le seul propriétaire de l'état partagé**. Cela
supprimerait `CrossWindowEventService` et unifierait le transport, au prix d'une
refonte de la couche de synchronisation. C'est la réponse structurelle aux points 6 et 8.
