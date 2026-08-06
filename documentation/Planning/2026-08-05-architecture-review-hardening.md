# Revue d'architecture — plan de durcissement

> Document de suivi vivant. Issu de la revue d'architecture complète du **2026-08-05**
> (branche `feature/tablet-hub-pwa`, HEAD `b15448f`). Mise à jour au fil de l'avancement.

## Tableau de bord

| # | Sujet | Gravité | État |
|---|-------|---------|------|
| 1 | `startRemoteServer()` fantôme + `electron/` hors du type-check | Bloquant | ✅ Fait — `90f8445` |
| 2 | Lecture de fichiers arbitraire depuis le LAN via le proxy média | Critique | ✅ Fait — `90f8445` |
| 3 | Aucune authentification WebSocket | Critique | ⬜ À faire |
| 4 | `ignore-certificate-errors` global | Élevée | ⬜ À faire |
| 5 | Store session en localStorage (plafond ~5-10 Mo) | Élevée | ⬜ À faire |
| 6 | Segment de sync `session` monolithique + médias en base64 | Moyenne | ⬜ À faire |
| 7 | `handleAction` — ~270 lignes de `if` en série | Moyenne | ⬜ À faire |
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

## 3. Aucune authentification WebSocket ⬜

N'importe quel client du réseau local peut ouvrir une WebSocket, envoyer
`remote:register` avec `role: 'gm'` et recevoir le flux non sanitisé — c'est-à-dire les
secrets du MJ. Rien ne valide l'identité de l'émetteur.

Chantier lié : l'appairage réseau du Tablet Hub par QR code, resté en cours sur le commit
wip `84fa2e6`. C'est le token de ce QR qu'il faut valider à la connexion.

## 4. `ignore-certificate-errors` global ⬜

`app.commandLine.appendSwitch('ignore-certificate-errors')` a été posé pour dialoguer avec
le pont Philips Hue (certificat auto-signé). Ce switch est **global au process** : il
désactive la validation TLS pour toute l'application, y compris les appels aux API
externes qui transportent des clés.

À remplacer par une exception ciblée sur l'hôte du pont Hue.

## 5. Store session en localStorage ⬜

L'état de session est persisté dans `localStorage`, dont le plafond tourne autour de
5-10 Mo. Un contournement de `QuotaExceededError` est déjà en place, ce qui est le
symptôme que la limite est atteinte en usage réel. À migrer sur IndexedDB.

## 6. Segment de sync `session` monolithique ⬜

Le segment `session` part d'un bloc, et les médias voyagent en base64 **dans le payload**.
Chaque petite modification retransmet donc tout. À découper en segments, et à remplacer
les médias embarqués par des références.

## 7. `handleAction` — 270 lignes de `if` ⬜

Dans `App.tsx`, `handleAction` est une série d'environ 270 lignes de `if` successifs.
À extraire en registre d'actions (table `type` → handler).

## 8. Couche de synchronisation non testée ⬜

Trois transports coexistent — `BroadcastChannel`, WebSocket, et l'événement `storage` —
entre des pairs dont aucun ne fait autorité. Aucun test ne couvre cet ensemble, alors que
c'est là que se logent les bugs de cohérence les plus coûteux en partie.

---

## Question de fond, à trancher un jour

Faire du **process principal Electron le seul propriétaire de l'état partagé**. Cela
supprimerait `CrossWindowEventService` et unifierait le transport, au prix d'une
refonte de la couche de synchronisation. C'est la réponse structurelle aux points 6 et 8.
