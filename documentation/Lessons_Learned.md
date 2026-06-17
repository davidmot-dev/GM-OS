# 🧠 Lessons Learned - GM-OS v5

Ce document consigne les défis techniques, les erreurs rencontrées et les solutions architecturales adoptées lors du développement de GM-OS v5 et v6.

---

## 🔄 Synchronisation d'État & Bridge (Architecture Bridge)

### 1. Synchronisation Multi-Fenêtres (Zustand Persist)
- **Défi** : Les stores Zustand (`persist`) ne se synchronisent pas automatiquement entre les fenêtres MJ et Player Hub.
- **Leçon** : L'utilisation d'événements `storage` couplée à une réhydratation manuelle est plus légère que des messages IPC constants.
- **Solution** : Écoute de `window.addEventListener('storage', ...)` et appel à `Store.persist.rehydrate()` lors de modifications clés (ex: dés, horloge).

### 2. Synchronisation de l'État Global (Deltas)
- **Défi** : Envoyer le store complet (>1Mo) à chaque seconde saturait le réseau.
- **Solution** : **Differential Sync (Deltas)**. Utilisation d'un utilitaire `isDeepEqual` pour ne diffuser que les propriétés modifiées. Réduction de 90% du trafic.

### 3. IPC Race Condition
- **Défi** : L'ordre de projection envoyé via IPC arrivait parfois avant que la fenêtre React cible ne soit initialisée.
- **Solution** : **Verrou IPC Définitif** (`ipcCount`). Le projecteur ignore les données de son store local dès qu'il reçoit son premier signal direct, garantissant que la volonté du MJ prime sur l'état persistant.
+
+### 4. Isolation des Flux de Messagerie (UI Filtering)
+- **Défi** : Mélanger les messages globaux (Broadcasting) et privés dans une même interface crée une pollution visuelle et rompt la confidentialité.
+- **Solution** : Implémentation d'un filtrage strict par `toId` dans `HubMessenger.tsx`. Le canal "Tous les Joueurs" est désormais le seul à accepter les messages sans destinataire précis ou marqués `all`.
+- **Leçon** : Toujours coupler l'isolation des canaux à un système de notifications ("Toasts") pour éviter que l'utilisateur ne manque des informations importantes situées dans un onglet non-actif.

### 4. Portabilité des Chemins (MCP & Python) (2026-04-22)
- **Défi** : Le bridge MCP utilisait des chemins codés en dur (`C:\Users\david...`), empêchant l'application de fonctionner sur une autre machine après compilation.
- **Solution** : Refonte du service `mcp_bridge.ts` pour utiliser `process.env.USERPROFILE` et `path.join`. Le script Python `run_mcp.py` a également été rendu portable.
- **Leçon** : Toujours utiliser des chemins relatifs ou basés sur les dossiers système standards (`AppData`, `UserProfile`) pour les services externes.

### 5. Pont Agnostique (Agnostic Bridge v3) (2026-04-23)
- **Défi** : Préparer la migration vers Tauri tout en conservant une version stable sous Electron, sans avoir à maintenir deux codes frontends différents.
- **Solution** : Création d'un **AppBridgeAdapter**. Au lieu d'appeler `window.appBridge` directement, le code React utilise un service unifié qui détecte l'environnement (`isTauri` ou `isElectron`) et route les appels vers le moteur approprié.
- **Leçon** : Toujours abstraire les appels au système derrière une interface unifiée. Cela permet de décommissionner un moteur (ex: Electron) ultérieurement sans aucun impact sur l'UI.

### 6. Protocole de Médias Natifs (Tauri asset://) (2026-04-23)
- **Défi** : Le chargement de fichiers volumineux (musiques 1h+, vidéos 4K) via des data URIs ou des Blobs consommait trop de mémoire vive.
- **Solution** : Utilisation du protocole `asset://` (Tauri v2) via `convertFileSrc`. Ce protocole permet au Webview de lire directement les fichiers sur le disque avec les performances d'un serveur local optimisé.
- **Leçon** : Ne pas chercher à "encapsuler" les fichiers dans JavaScript. Utiliser les protocoles natifs de la plateforme pour laisser le système d'exploitation gérer le streaming et le cache.

### 7. Stockage Sécurisé (Rust Keyring)
- **Défi** : Stocker des clés API sensibles dans `localStorage` est risqué. Electron utilisait `safeStorage`, mais Tauri nécessite une approche différente.
- **Solution** : Abstraction via `AppBridge.security`. Sous Tauri, les secrets sont envoyés au backend Rust qui utilise la crate `keyring` (ou un stockage chiffré sur disque) au lieu de les exposer au frontend.

### 8. Propagation d'Arguments IPC (Array Spreading) (2026-04-23)
- **Défi** : Contrairement à Electron, `emit` de Tauri v2 n'accepte qu'un seul argument `payload`. Cela cassait les écouteurs React qui attendaient des arguments séparés (ex: `type`, `data`).
- **Solution** : Encapsulation systématique des arguments dans un tableau lors de l'envoi (`send`) et utilisation de l'opérateur spread (`...`) dans l'écouteur du Bridge pour "déballer" les données.
- **Leçon** : Ne jamais supposer que le transporteur d'événements préserve la structure des arguments. Toujours normaliser le format de transport.

### 9. Cycle de Vie des Fenêtres de Projection (2026-04-23)
- **Défi** : Un "Blackout" (coupure de projection) laissait des fenêtres noires vides ouvertes dans la barre des tâches, créant une pollution visuelle et consommant des ressources.
- **Solution** : Distinction entre Hub (Persistant) et Moniteur (Volatil). La commande blackout déclenche désormais un `window.close()` sur les moniteurs mais un simple nettoyage CSS/DOM sur les Hubs.
- **Leçon** : Le comportement "Blackout" doit être contextuel à la cible de projection pour respecter l'ergonomie système.

### 10. Résolution d'URLs pour Projecteurs (2026-04-23)
- **Défi** : Les projecteurs affichaient des icônes d'images brisées car les chemins de fichiers envoyés via IPC n'étaient pas résolus par `convertFileSrc` côté récepteur.
- **Solution** : Normalisation de la résolution d'URL au plus tôt dans la chaîne de transmission. Le récepteur traite désormais chaque chemin reçu comme une source potentiellement locale nécessitant une conversion de protocole.

### 11. Silence Audio sous WebView2 (Autoplay Policy) (2026-04-23)
- **Défi** : Au lancement sous Tauri (Windows WebView2), les moteurs audio (`AudioContext`) restaient dans l'état `suspended`, même si l'utilisateur avait interagi avec l'application.
- **Solution** : **Éveil Audio Global**. Ajout d'un déclencheur dans `App.tsx` qui appelle `resume()` sur tous les moteurs audio (`SoundEngine`, `MusicEngine`, `VoiceEngine`) dès la première interaction clavier ou souris détectée. Mise en place d'une "Route de Secours" (`Rescue Route`) dans le moteur de musique pour connecter directement les nœuds à `context.destination` si le `MediaStream` est bloqué par le navigateur.
- **Leçon** : Ne pas se fier à l'initialisation automatique des contextes audio. Toujours prévoir un mécanisme de "réveil" explicite déclenché par une action utilisateur réelle.

### 12. Saturation IPC par les Niveaux de Voix (Throttling) (2026-04-23)
- **Défi** : L'envoi du niveau de voix à 60 fps via l'IPC saturait le pont entre le MJ et les Hubs, créant des saccades dans l'interface et des retards dans les autres commandes (ex: changement d'image).
- **Solution** : **Throttling Intelligent**. Limitation de la synchronisation IPC à ~20 fps dans `VoiceEngine.ts`, tout en garantissant un envoi immédiat du niveau "0" dès que la parole s'arrête pour éviter que l'avatar ne reste "bloqué" en position ouverte.
- **Leçon** : Les données haute fréquence (VU-mètres, positions curseur) ne doivent jamais être transmises au taux de rafraîchissement de l'écran via l'IPC. Toujours appliquer un filtre de fréquence (throttle/debounce) adapté à la perception humaine (15-25 fps).

---

## 🏗️ Architecture, Build & Typage

### 1. Conflits ESM / CommonJS dans Electron
- **Défi** : Modules natifs (`ws`, `bufferutil`) incompatibles avec le bundle Vite ESM.
- **Solution** : Externalisation dans `vite.config.ts` et usage de `createRequire(import.meta.url)` dans `main.ts`.

### 2. Typage Strict "Zéro-Any" (Standard AppBridge v2)
- **Défi** : L'usage de `any` rendait le code fragile lors de la migration Electron -> Tauri.
- **Solution** : Centralisation des interfaces (`DisplayInfo`, `RemoteAction`) dans `window.d.ts` et interdiction stricte de `any`. Utilisation d'interfaces stricts même pour les retours d'IA (NotebookLM).

### 3. Découplage UI (Forge/Grimoire)
- **Défi** : Confusion entre l'interface de création de règles (Forge) et de consultation (Grimoire).
- **Solution** : Isolation stricte des vues. Le Grimoire est une vue de lecture premium, tandis que la Forge est un atelier de génération.

---

## 💡 Immersion & Performance

### 1. Gestion des Médias (HTTP Proxy vs WebSocket)
- **Défi** : Le transfert d'images en Base64 via WebSocket saturait la bande passante.
- **Solution** : **Local Asset Middleware**. Les fichiers sont servis par un proxy HTTP local. Le WebSocket ne transmet plus que des URLs courtes.

### 2. CSS vs React pour les micro-animations
- **Leçon** : Le CSS natif est plus performant pour les animations haute fréquence (vocal scales).
- **Solution** : Utilisation de variables CSS (`--voice-scale`) injectées via React pour laisser le moteur CSS gérer le rendu fluide sans re-renders massifs.

### 3. Mixage Audio & Ducking
- **Défi** : Réduire le volume de plusieurs moteurs audio (Music, Ambient) sans "clics" lors de la détection de voix.
- **Solution** : Nœud `duckingGain` piloté par le store VoiceOS avec `setTargetAtTime` pour des fondus parfaits.

---

## 🤖 IA, MCP & Forge

### 1. Corruption de flux JSON-RPC (MCP)
- **Défi** : Logs Python mélangés avec les réponses JSON.
- **Solution** : Redirection des logs vers `stderr` et buffering robuste dans le bridge pour accumuler les chunks JSON complets.

### 2. Assainissement des Données LLM (Sanitizer)
- **Défi** : Les LLM renvoient parfois des structures imbriquées imprévisibles au lieu de texte simple.
- **Solution** : Couche d'**Assainissement des Données** systématique avant injection dans le store global pour aplatir les objets et garantir des types `string`.

### 3. Expiration de Session (NotebookLM)
- **Défi** : Sessions API NotebookLM expirant silencieusement (RPC Error 16).
- **Solution** : Mécanisme de **Self-Healing** interceptant le code 16 et relançant une authentification automatique transparente.

---

## 🎨 UI & Composants (Stabilisation v6)

### 1. Bug des Fenêtres Externes (Native Select)
- **Défi** : Les `<select>` HTML natifs ouvraient parfois des fenêtres OS séparées dans Electron.
- **Solution** : Migration systématique vers un composant `Select` personnalisé (Framer Motion) confiné au shell de l'application.

### 2. Gestion de l'État "Repos" (Campagne Nulle)
- **Défi** : Instabilité lors de la désactivation d'une campagne.
- **Solution** : Support explicite de `null` pour `activeCampaignId` et synchronisation des chemins système (Obsidian vault) lors de la transition.

### 3. Masquage Physique (Brouillard de Guerre)
- **Leçon** : Remplacer la logique logicielle complexe par une hiérarchie de rendu simple.
- **Solution** : Calque de brouillard placé physiquement au-dessus (`z-20`) des pions (`z-16`), laissant le moteur de rendu gérer nativement l'occultation.

---

### 13. Synchronisation au Boot (BroadcastChannel vs Window Load) (2026-04-24)
- **Défi** : Le Moniteur s'ouvrait sur un écran noir car il ratait le message BroadcastChannel initial envoyé par le MJ (le chargement de la fenêtre est plus lent que la diffusion).
- **Solution** : Implémentation d'un **Handshake de Bienvenue** (`hub:ready`). Le projecteur émet un signal dès qu'il est prêt, et le MJ répond par un `broadcastFullState()` complet.
- **Leçon** : Ne jamais supposer qu'une fenêtre "esclave" a reçu l'état initial. Toujours prévoir un mécanisme de demande d'état (`pull`) au démarrage.

### 14. Guardes de Synchronisation & Paramètres URL (2026-04-24)
- **Défi** : Un clic sur le Moniteur (Ping) écrasait la carte par un écran noir sur toutes les fenêtres.
- **Cause** : La fonction `syncToPlayers()` du store possédait une garde vérifiant `?mode=hub`. Or, le Moniteur utilisait `?window=projector`. La garde ne s'activait pas, et le Moniteur (esclave) tentait de synchroniser son état vide vers les autres, écrasant la carte réelle.
- **Solution** : Normalisation des gardes pour vérifier tous les types de fenêtres esclaves (`hub`, `projector`, `tablet`) dans tous les paramètres URL possibles (`mode` et `window`).
- **Leçon** : La détection du rôle d'une fenêtre (Master vs Slave) doit être extrêmement robuste pour éviter qu'un esclave ne devienne "Source de Vérité" par erreur.

### 15. Boucles de Relay & "Snapback" de Token (2026-04-24)
- **Défi** : Lors du déplacement d'un pion depuis un Hub, le pion revenait brutalement à sa position initiale après 50ms.
- **Cause** : Le Master recevait la nouvelle position, l'appliquait, puis **relayait immédiatement le payload brut** reçu aux autres fenêtres. Ce payload contenait souvent des données partielles ou des références temporelles que le Master interprétait mal, déclenchant un rebroadcast de sa propre position (périmée) vers l'esclave.
- **Solution** : **Authoritative Relay Only**. Le Master ne relaie plus jamais le payload brut d'un esclave. Il applique l'update localement, puis déclenche son propre broadcast complet et cohérent (`broadcastFullState`).
- **Leçon** : Le Master doit agir comme un filtre. Tout ce qui sort du Master vers les esclaves doit provenir de son propre store (source de vérité) et non être un simple rebond de messages tiers.

---

### 16. Dépendances Circulaires & Vite Resolver (2026-04-24)
- **Défi** : L'application refusait de charger le module `MapDashboard.tsx` avec une erreur `ERR_CONNECTION_REFUSED` dans la console de développement, sans erreur explicite dans les logs Vite.
- **Cause** : Dépendance circulaire entre `useMapStore.ts` (importait `MapService`) et `MapService.ts` (importait `useMapStore`). En mode développement, le résolveur de modules de Vite peut entrer en deadlock ou échouer silencieusement à servir les fichiers impactés par un cycle complexe, surtout lorsqu'ils sont chargés via `lazy`.
- **Solution** : Utilisation d'**imports dynamiques (`import()`)** à l'intérieur des fonctions d'action du store pour retarder le chargement du service. Cela brise le cycle au niveau du top-level import.
- **Leçon** : Éviter absolument les imports circulaires au niveau global. Si un store doit appeler un service qui lui-même manipule le store, utiliser des imports dynamiques ou un système d'événements/listeners découplés.

### 17. Découplage des Stores pour le Hub (Migration V7)
Pour éviter les dépendances circulaires qui bloquent le build Vite (ex: Session -> Journal -> Session), les hooks de synchronisation (comme `useHubSync`) ne doivent plus importer les stores statiquement. Ils doivent utiliser un **Global Window Bridge** (`window.useXStore`) pour accéder aux stores dynamiquement. Cela garantit une architecture "Bridge-Agnostic" compatible Tauri/Electron.

### 18. Enregistrement Réactif pour le Verrouillage des Personnages (2026-04-25)
- **Défi** : Le Tablet Hub ne détectait plus le verrouillage des personnages, permettant à deux joueurs de sélectionner le même profil.
- **Cause** : L'enregistrement initial au WebSocket ne contenait pas le `characterId` (puisque le joueur n'avait pas encore choisi). Une fois le personnage sélectionné, le store `useClientStore` était mis à jour, mais le WebSocket restait sur l'ancienne session de communication "anonyme".
- **Solution** : Ajout d'un `useEffect` réactif dans `useHubSync.ts` qui renvoie un message `remote:register` dès que l'identité (pseudo, characterId) change.
- **Leçon** : L'identité d'un client WebSocket peut évoluer au cours d'une session (onboarding). Tout changement d'état d'identification doit déclencher une re-validation immédiate auprès du serveur MJ pour mettre à jour les verrous globaux.

---

### 19. Réinitialisation Complète & Éjection des Clients (2026-04-26)
- **Défi** : En cas de désynchronisation majeure ou de changement de joueurs en cours de partie, il était difficile de "nettoyer" les verrous de personnages sans redémarrer le serveur.
- **Solution** : Implémentation d'un **Protocole d'Éjection Bidirectionnel**. 
    1. Le MJ envoie un signal `remote:eject-all` via IPC. 
    2. Le serveur ferme physiquement toutes les sockets après avoir notifié les clients. 
    3. Les clients (Hubs) reçoivent `remote:ejected`, appellent `resetIdentity()` pour effacer leur état local (Onboarding) et affichent un message informatif.
- **Leçon** : Le serveur ne doit pas se contenter de "supprimer" les sessions de sa mémoire ; il doit activement notifier les clients pour qu'ils nettoient leur propre `localStorage` (via `resetIdentity`), évitant ainsi des reconnexions automatiques immédiates avec des données périmées.

---
### 20. Stabilisation des Mocks Globaux dans Vitest (2026-06-17)
- **Défi** : Durant l'exécution des tests de synchronisation à distance (`useRemoteSync.test.ts`), le test entrait dans des boucles de reconnexion inattendues et échouait sur les assertions de temporisation (backoff) avec 3 appels au lieu de 2.
- **Cause** : Le mock du store client (`useClientStore`) retournait une nouvelle référence d'objet ainsi qu'une nouvelle fonction `vi.fn()` à chaque appel du hook dans les tests. En conséquence, les dépendances de la fonction de reconnexion (`connect`) changeaient à chaque cycle de rendu, provoquant le nettoyage récurrent de l'effet (`useEffect`) et déclenchant des appels de connexion supplémentaires hors des timers prévus.
- **Solution** : Stabiliser le mock en renvoyant une instance statique unique pour le store mocké (`const mockClientStore = { deviceId, pseudo, setStatus: mockSetStatus }`) à chaque appel de `useClientStore()`.
- **Leçon** : Toujours veiller à ce que les mocks de stores Zustand ou autres hooks d'état globaux utilisés dans les tests renvoient des références stables pour leurs propriétés et actions, afin d'éviter d'invalider les hooks de cycle de vie et de créer des effets de bord asynchrones.

---
### 21. Résolution de l'import dynamique asynchrone (Vitest EnvironmentTeardownError) (2026-06-17)
- **Défi** : Plusieurs tests unitaires audio (ex: `AmbientEngine.test.ts`) échouaient lors du démontage de l'environnement de test jsdom de Vitest avec des erreurs de type `EnvironmentTeardownError: Cannot load '/node_modules/zustand/esm/middleware.mjs' ... after the environment was torn down`.
- **Cause** : Le constructeur de la classe testée (`AmbientEngine`) importait dynamiquement des stores Zustand (`useAudioMasterStore`, `useVoiceStore`) via `await import(...)`. Ces importations asynchrones n'étaient pas résolues au moment où Vitest fermait l'environnement de test, ce qui provoquait une levée d'exception par le chargeur de modules.
- **Solution** : Déclarer explicitement des mocks pour ces stores importés via `vi.mock(...)` en tête du fichier de test. Cela force Vitest à charger et mettre en cache ces modules de manière synchrone avant le lancement des tests.
- **Leçon** : Pré-mocker systématiquement toute dépendance importée de manière asynchrone (dynamic imports) dans le code de production instancié durant les tests (comme des Singletons) afin d'éviter des fuites de chargement asynchrone après la clôture de l'environnement JSDOM.

---
### 22. Résolution des Timeouts avec IndexedDB / idb dans Vitest (2026-06-17)
- **Défi** : Les tests unitaires de carte et de brouillard (`MapFogRegistry.test.ts`) se figeaient et tombaient systématiquement en timeout après 5000ms.
- **Cause** : Un mock partiel et inerte de l'API globale `indexedDB` retournait des requêtes sans jamais appeler leurs fonctions de retour asynchrones (`onsuccess`), bloquant ainsi indéfiniment la résolution des promesses du wrapper IndexedDB (`fogDB.getItem`).
- **Solution** : Mocker directement à plus haut niveau le module de service `src/utils/indexedDB` (FogDB) avec une implémentation in-memory simple et synchrone utilisant une structure `Map`.
- **Leçon** : Pour tester des modules reposant sur du stockage IndexedDB, il est préférable de mocker le service d'accès aux données lui-même avec un dictionnaire en mémoire plutôt que de stubber les couches bas niveau `indexedDB` du navigateur, pour garantir la rapidité et la robustesse des tests.

---

*Dernière mise à jour : 17 Juin 2026 - GM-OS v6.5.0 - Stabilisation complète de la suite de tests et de la persistance IndexedDB.*
