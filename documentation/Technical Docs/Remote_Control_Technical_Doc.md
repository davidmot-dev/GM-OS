# ⚙️ Documentation Technique : GM Remote Control Architecture

Ce document détaille l'implémentation du système de contrôle déporté (Remote Control) pour GM-OS v5.

## 🏗️ Architecture Globale (Nexus Sync v6)

Le système repose sur une communication **Full-Duplex** via WebSockets et un serveur de médias hybride, orchestré par la classe `SyncServer`.

### 1. Nexus Sync Server (Main Process)
- **Fichier** : `electron/SyncServer.ts`
- **Rôle** : 
    - **WebSocket Server** : Gère les connexions entrantes des clients (Player Hub, Tablettes, Mobiles).
    - **Media Proxy** : Sert les fichiers locaux (`/media/`) et les assets temporaires (`/temp/`) via HTTP pour contourner les restrictions CORS/Security des navigateurs mobiles.
    - **Role Management** : Identifie les clients par leur rôle (`gm`, `player`, `remote`).
    - **P2P Relay** : Permet le transfert direct de messages entre clients (ex: Chats) sans traitement par le GM PC.

### 2. Pont de Communication (Preload)
- **Fichier** : `electron/preload.ts`
- **Bridge API** : `window.appBridge.nexus`
- **Méthodes** :
    - `getConnectionInfo()` : Récupère l'IP locale et le port du serveur de média.
    - `onSyncClients(callback)` : Liste des terminaux connectés en temps réel.

### 3. Orchestration Nexus (Renderer Process)
- **Fichier** : `src/modules/system/logic/NexusService.ts`
- **Rôle** : 
    - **Nexus Link** : Maintient le heartbeat et la reconnexion automatique.
    - **Delta Sync** : Calcule les différences d'état avant diffusion pour optimiser la bande passante.
    - **Biometric Signature** : Gère l'unicité de connexion par personnage via `character_taken`.


## 📡 Protocole de Communication

Les messages sont échangés au format **JSON**.

### Mobile ➔ PC (Actions)
```json
{
  "type": "remote:dice:roll",
  "payload": { "sides": 20, "count": 1, "modifier": 0, "mode": "standard" }
}
```

> ⛔ **Cette page listait cinq familles d'actions. Il y en a une quarantaine.** Corrigé le
> 2026-09-05 — et cette fois **sans recopier la liste** : une énumération dans un document
> se périme dès le commit suivant, et c'est exactement ce qui était arrivé ici.

**Ce qui fait foi** : `src/modules/remote/actions/index.ts` compose le registre, et
`KNOWN_ACTION_TYPES` en donne la liste à l'exécution. `registry.test.ts` vérifie que chaque type
déclaré a bien un handler.

Les familles, pour s'orienter : dés, audio, combat, session (messages, inventaire, transferts),
tableau blanc, scène, table (réserves), paquets de cartes, coffre Obsidian.

#### Qui a le droit de quoi

`electron/actionPolicy.ts` tranche, et **refuse par défaut** : tout type absent de
`PLAYER_ALLOWED_ACTIONS` est réservé aux rôles appairés (`gm`, `remote`). Pour les actions qu'un
joueur peut émettre, une seconde couche vérifie **qu'il agit sur son propre personnage** —
`OWNERSHIP_FIELD` dit quel champ du payload porte la cible.

*Conséquence à connaître : ajouter un type d'action le rend automatiquement privilégié.* C'est le
bon défaut — on ouvre un droit sciemment, on ne l'oublie pas fermé.

### 4. Specialized Trigger Logic (Main PC)
Pour garantir une expérience fluide, certaines actions ne sont pas de simples appels aux stores :
- **Sound-OS** : Les triggers distants utilisent `SoundController.togglePad()`. Cela garantit que si le tampon audio (buffer) n'était pas pré-chargé (onglet fermé), il est chargé dynamiquement avant la lecture. Cela gère aussi le déblocage forcé du contexte audio et la synchro Hue.
- **Ambient-OS** : Le trigger d'un thème (`loadTheme`) est suivi d'un auto-play de toutes les pistes actives (volume > 0). Appuyer à nouveau sur le même pad déclenche un `fadeOutAll()`, simulant un bouton On/Off physique.
- **Music-OS** : Les actions `playPad` forcent la résolution de l'ID MediaStore (`m-xxxx`) avant l'assignation à la platine.

### PC ➔ Mobile (Sync)

Une diffusion périodique, **freinée à 500 ms** (`useNexusSynchronizer`), qui porte l'état complet.

**Ce qui fait foi** : l'interface `RemoteSyncData` dans `src/modules/remote/types/remote.types.ts`.
Elle compte une quinzaine de segments — pads, sons, combat, horloge, tableau, dés, carte, messages,
lecture du meneur, session.

> ⛔ **Le piège de ce transport, payé trois fois.** Un segment construit dans un **littéral anonyme**
> au milieu du synchroniseur n'oblige à rien : `whiteboard` déclarait sept champs et n'en envoyait
> **quatre**, pendant des mois. La tablette recopiait les trois manquants dans chaque tracé qu'elle
> émettait — *tout ce qui était dessiné depuis une tablette partait en crayon blanc, gomme
> comprise.*
>
> **Le remède est le type de retour, pas un test** : `segmentDuTableau` et `segmentDeLecture`
> promettent leur type, donc un champ oublié **ne compile plus**. Vérifié en dégradant le code —
> `TS2741`. *Une asymétrie entre celui qui écrit et celui qui lit est indétectable par construction
> tant qu'ils ne partagent pas le type.*

#### Question / réponse — hors du flux périodique

Tout ne peut pas voyager deux fois par seconde. Le **coffre Obsidian** compte plus de deux mille
notes : la tablette **demande** (`remote:obsidian:lister`, `remote:obsidian:lire`), le meneur
**répond** par `broadcastUIAction`.

> 🔒 **La réponse vise le rôle `'remote'`.** `SyncServer.broadcastAction` accepte un rôle
> destinataire depuis toujours ; **le pont l'avalait** jusqu'au 2026-09-05, et tout partait à tout
> le monde. Sans ce correctif, le carnet privé du meneur se déposait sur l'appareil de chaque
> joueur. *C'est la règle de `mainsPourLaTable` : un secret caviardé à l'affichage a déjà voyagé.*

#### Ce qui est caviardé à la source

Le même message part à tous les clients d'un rôle : **ce qu'on ne veut pas montrer ne doit pas
partir.** Trois exemples en place :

| Quoi | Ce qui est retiré | Où |
| :--- | :--- | :--- |
| Cartes en main | l'index de toute carte face cachée, il ne reste que le compte | `mainsPourLaTable` |
| Jauges de tension | celles que le meneur garde secrètes | `jaugesVuesParLesJoueurs` |
| Wiki de campagne | les images — coût réseau, pas secret | `segmentDeLecture` |

## 🛠️ Optimisations et Sécurité

1.  **Lazy Loading** : Le composant `RemoteControl` est chargé via `React.lazy`. Cela garantit que le navigateur mobile ne tente jamais d'importer des modules qui utiliseraient des API Node.js ou Electron, ce qui provoquerait un crash immédiat.
2.  **Robustesse Réseau** : Le serveur Vite est configuré avec `host: '0.0.0.0'` pour être accessible sur toutes les interfaces réseau du PC hôte.
3.  **Haptic Feedback** : Utilisation de `navigator.vibrate` sur les actions critiques pour améliorer l'expérience tactile.
4.  **Détection IP** : Le script de détection d'IP dans `main.ts` filtre les interfaces internes (loopback) et privilégie les adresses IPv4 valides pour la génération du QR Code.

---

## 🛑 Limites connues
- Nécessite d'être sur le même sous-réseau (WiFi).
- Pas de support HTTPS natif en local (peut poser problème avec certaines API de navigateur mobile
  comme la vibration si non servi via localhost ou HTTPS).
- **L'appairage est un jeton dans le fragment du QR code** (`#token=…`). Recopier l'adresse sans lui
  connecte l'appareil en **simple joueur** : le serveur rétrograde le rôle demandé, et la tablette
  l'affiche dans son bandeau. Voir `pairingToken.ts` et `remote:registered`.
- **Le coffre Obsidian n'est lisible que si son chemin est réglé sur le PC.** Le chemin demandé par
  la tablette est résolu sous la racine du coffre côté Electron (`obsidian_bridge.ts`) — durci le
  2026-09-05, quand ce chemin a cessé de venir uniquement de l'écran du meneur.

---

*Document remis d'aplomb le 2026-09-05. Il décrivait cinq familles d'actions sur une quarantaine et
un flux de cinq clés sur une quinzaine. **Les énumérations ont été remplacées par des renvois au
code qui fait foi** — c'est ce qui avait vieilli, et ce qui vieillira encore.*
