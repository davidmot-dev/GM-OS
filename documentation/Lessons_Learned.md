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

### 23. Architecture de Feedback de Session Confidentiel & Résilient (2026-06-17)
- **Défi** : Permettre aux joueurs de soumettre des évaluations (Fun, Histoire, Combat) et des remarques privées au MJ, sans que les autres joueurs puissent y accéder via le flux de synchronisation global, tout en préservant l'état de soumission côté client en cas de rafraîchissement.
- **Solution** :
  1. **Asymétrie Réseau** : Les feedbacks sont expédiés via WebSocket vers le MJ, enregistrés dans son store global, mais purgés (`feedbacks: undefined`) dans la fonction `useNexusSynchronizer.ts` avant que l'état ne soit re-diffusé aux autres tablettes.
  2. **Vérification Locale Décentralisée** : Le Tablet Hub stocke son état de soumission et ses brouillons directement dans le `localStorage` de l'appareil (clé unique `feedback:${campaignId}:${sessionId}:${characterId}`). Cela évite d'exposer les données des autres joueurs tout en conservant l'état d'envoi.
- **Leçon** : Pour les flux de données strictement confidentiels (PJ → MJ uniquement), combiner une désérialisation asymétrique côté serveur (assainissement des paquets de retour) et une persistance locale décentralisée (`localStorage`) pour offrir une expérience utilisateur fluide et sécurisée.

---

### 24. Synchronisation Locale Réseau & Sécurité de Combat-OS (2026-06-17)
- **Défi** : Le module Combat-OS ne se synchronisait pas en temps réel avec le Player Hub local dans l'application Electron en production (chargement `file://` sans WebSocket), et les changements de tour fuitaient des informations secrètes (notes MJ et infos secrètes) à tous les joueurs connectés.
- **Solution** :
  1. **BroadcastChannel & Clock/Combat** : Ajout de souscriptions explicites pour `useCombatStore` et `useClockStore` dans `CrossWindowEventService.ts` pour diffuser les mises à jour localement sur le même PC.
  2. **Relais IPC Local** : Ajout d'un écouteur IPC `remote:broadcast-sync` dans `main.ts` pour relayer les états de synchronisation globaux aux fenêtres locales de projection et de Hub.
  3. **Sécurisation de l'état** : Suppression du raccourci non sécurisé `syncFast('combat')` dans `useNexusSynchronizer.ts` au profit d'appels systématiques à `handleSync()`, garantissant l'anonymisation des notes MJ et la résolution des URLs d'avatars à chaque mise à jour.
- **Leçon** : Ne jamais bypasser les filtres d'assainissement de données (sanitizers) sous prétexte de vouloir optimiser les performances ("fast-paths") pour des modules non-critiques en fréquence.

---

### 25. Synchronisation Haute Fréquence & Disparition de Tracés (Whiteboard-OS) (2026-06-17)
- **Défi** : Lors du dessin sur le tableau blanc, les traits disparaissaient temporairement ou subissaient une forte latence sur le Player Hub au moment où le MJ relâchait la souris/le doigt.
- **Cause** :
  1. **Absence de chemins terminés dans le canal rapide** : La liste des chemins définitifs (`paths`) n'était diffusée que via `handleSync()`, qui subit une limitation (throttle) à 500ms et effectue des résolutions de médias lourdes.
  2. **Envoi immédiat de la fin de tracé** : Dès que le dessin s'arrêtait, l'état `activePath` passait à `null` et était diffusé immédiatement via le canal rapide (`syncFast`), effaçant le tracé temporaire sur le Player Hub avant que le message lourd contenant la liste `paths` mise à jour ne soit reçu, provoquant un clignotement/disparition.
  3. **Saturation réseau** : L'envoi des coordonnées à chaque mouvement de souris (60+ fps) saturait les canaux WebSockets et BroadcastChannel.
- **Solution** :
  1. **Throttling Réseau Intelligent** : Limitation de `syncFast('whiteboard')` à 50ms (20fps) pendant le dessin, mais court-circuit (bypass) du throttle dès que `activePath === null` pour propager l'état final instantanément.
  2. **Ajout des tracés dans le canal rapide** : Intégration de la propriété `paths` directement dans le payload rapide du Whiteboard, évitant d'attendre la synchronisation générale de 500ms pour restituer le tracé final.
  3. **Mise à jour BroadcastChannel** : Ajout de la propriété `paths` dans les messages `whiteboard` du canal BroadcastChannel local pour une mise à jour instantanée en multi-fenêtres sur le même PC.
- **Leçon** : Toujours coupler la fin d'une action haute fréquence (comme le relâchement d'un tracé ou d'un drag) à un envoi immédiat qui inclut à la fois l'état finalisé de la ressource et le nettoyage de l'état temporaire, pour éviter les désynchronisations visuelles transitoires.

---

### 26. Anti-Pattern Canvas : Couplage Resize/Redraw et Mutations Non-Atomiques (2026-06-17)
- **Défi** : Les traits du Whiteboard-OS clignotaient et disparaissaient, **même sans projection réseau**, lors du dessin sur le canvas du MJ.
- **Causes** :
  1. **Destruction du canvas à chaque frame** : L'effet `useEffect` de redimensionnement dépendait de `[redraw]`, un `useCallback` avec 11 dépendances volatiles (`paths`, `isDrawing`, `currentPoints`, `activePath`...). À chaque mouvement de souris, `canvas.width = parent.clientWidth` était appelé — même si la taille n'avait pas changé — ce qui **efface tout le contenu du canvas** et réinitialise le contexte 2D, forçant un redraw complet du GPU à ~60fps.
  2. **Race condition de synchronisation** : `stopDrawing()` appelait deux mutations Zustand séparées (`setActivePath(null)` puis `addPath(newPath)`), générant deux broadcasts réseau. Le premier envoyait `activePath: null` avec l'ancienne liste `paths`, causant un flash de disparition sur le Player Hub.
  3. **Données volatiles dans `localStorage`** : `activePath`, `activeDrawerId`, `laserPointer` étaient inclus dans le `partialize` de `zustand/persist`, causant des écritures localStorage haute fréquence pendant le dessin.
  4. **Rehydratation parasite** : Les listeners `storage` events appelant `persist.rehydrate()` écrasaient l'état en mémoire avec des versions périmées du localStorage.
- **Solutions** :
  1. **ResizeObserver monté une seule fois** : Remplacement de l'effet `[redraw]` par un `ResizeObserver` avec dépendance `[]` (mount-only), utilisant une `ref` stable (`redrawRef`) pour accéder à la dernière version de `redraw` sans recréer l'observateur. Le canvas n'est redimensionné que si la taille a réellement changé (`canvas.width !== w`).
  2. **Mutation atomique `finishDrawing()`** : Fusion de `setActivePath(null)` + `addPath(path)` en une seule action Zustand, garantissant un seul trigger de subscriber et un seul message de sync contenant l'état final correct.
  3. **Nettoyage de `partialize`** : Retrait de toutes les données volatiles temps réel du persist.
  4. **Suppression de `persist.rehydrate()`** : La synchronisation temps réel via BroadcastChannel/IPC est suffisante.
- **Leçons** :
  - Ne jamais coupler un effet de redimensionnement (`canvas.width = ...`) aux données de dessin via les dépendances d'effet React — utiliser un `ResizeObserver` isolé.
  - Les mutations Zustand de fin d'action interactive (stop drawing, drop token) doivent être **atomiques** : une seule `set()` contenant à la fois l'état finalisé et le nettoyage de l'état transitoire.
  - Ne pas persister dans `localStorage` les données qui changent à chaque frame (coordonnées, tracés actifs, pointeur laser).

---

## 🔐 Persistance & Perte de Données (2026-08-07)

### 1. Une charge partielle sous la même clé détruit l'état complet
- **Défi** : Toutes les campagnes ont disparu, remplacées par les données de démonstration.
- **Cause** : `PersistenceService.partialize` faisait persister aux fenêtres **secondaires** une charge réduite à six champs de sélection, **sans `campaigns`**, sous la même clé IndexedDB et dans la même origine que l'état complet du MJ.
- **Pourquoi ça ne se voyait pas** : le dégât ne se matérialise qu'au **démarrage à froid suivant**. Le store s'initialise sur les mocks, lit une charge sans `campaigns`, et la fusion superficielle de Zustand laisse les mocks en place — que le MJ persiste alors par-dessus les vraies données. Sur le moment, la fenêtre MJ garde tout en mémoire : rien ne paraît.
- **Solution** : l'interdiction d'écriture est posée **au seul point qui écrit** (`gmOnlyStateStorage`), pas dans `partialize`. `getItem` reste ouvert à toutes les fenêtres.
- **Leçons** :
  - **Une charge réduite reste une charge.** Garder la branche « partialize secondaire » comme filet de sécurité, c'est conserver l'arme.
  - Plusieurs fenêtres sur la même origine partagent la même base. Toute écriture concurrente sous une clé unique est un écrasement en puissance — `useCombatStore` (`gmos-combat-storage`) est dans la même configuration.
  - Un bug de persistance à effet différé ne se détecte pas à l'usage. Il faut un test qui simule le cycle complet : écriture secondaire, puis démarrage à froid.

### 2. Récupération : les clichés Windows avant l'archéologie
- **Défi** : Après la perte, déterminer ce qui restait récupérable.
- **Erreur commise** : avoir conclu « non récupérable localement » après une longue analyse des fichiers leveldb, **avant** d'avoir pensé aux clichés instantanés. Un cliché de la veille contenait tout.
- **Leçons de méthode** (dans cet ordre) :
  1. **Sauvegarder l'état sinistré** avant tout diagnostic, application fermée.
  2. **Tenter les clichés instantanés** (`vssadmin list shadows`, *Versions précédentes*) — la piste la moins coûteuse et la plus complète.
  3. **Copier, ne pas restaurer.** Le bouton `Restaurer` écrit en place et détruit le point de comparaison. `Ouvrir` puis copie vers un dossier neuf, vérification, et seulement ensuite bascule.
- **Pièges d'analyse leveldb, vérifiés** :
  - Les fichiers `.ldb` sont **compressés en snappy** : l'absence de résultat au `grep` n'y prouve rien. Seul le `.log`, non compressé, est lisible en octets bruts.
  - Le journal est **append-only** : l'ordre des offsets est l'ordre du temps. C'est ce qui permet de dater une bascule.
  - Chrome stocke les valeurs de `localStorage` en **UTF-16** dès qu'elles contiennent un accent — une recherche en octets bruts passe à côté des données en français.
  - Les valeurs IndexedDB volumineuses sont **externalisées en fichiers blob** (marqueur `application/vnd.blink-idb-value-wrapper`). Ne pas conclure à l'absence d'une donnée sur la seule lecture du journal. Un répertoire de blobs vide est au contraire le signe le plus net d'une perte.

---

## 🔀 Transport entre Fenêtres Locales (2026-08-07)

### 1. Un commentaire qui énonce une garantie n'en est pas une
- **Défi** : `CrossWindowEventService` portait depuis toujours : *« Never relay raw slave payload to other slaves. »*
- **Réalité** : le relais livrait à **toutes** les fenêtres sauf l'émetteur. Le projecteur recevait donc le payload brut du Player Hub et l'adoptait, cible de projection comprise.
- **Conséquence** : le bug de l'étape 6 (projection qui s'éteint toute seule) était resté vivant côté projecteur, **masqué** par la rediffusion complète du MJ qui réparait 50 ms plus tard.
- **Solution** : `relayAudience` (`electron/relayPolicy.ts`) n'adresse plus l'état d'une fenêtre secondaire qu'au MJ, qui l'assainit et réémet la version faisant autorité. Les verrous de jetons restent ouverts à tous — ils ne portent aucun état partagé.
- **Leçons** :
  - Deux bugs majeurs de cette session étaient exactement ce motif : un commentaire décrivant fidèlement une intention que **rien n'appliquait** (`partialize` et le relais). Devant une garantie énoncée en commentaire, chercher le code qui l'applique.
  - Une rustine qui répare en différé **cache** le défaut qu'elle compense. Avant d'alléger une réparation, vérifier ce qu'elle répare — sinon on rallume la panne.

### 2. Contrôler par type est gratuit, par champ ne l'est pas
- **Défi** : Appliquer une politique de rôle au relais, qui transporte une chaîne déjà sérialisée.
- **Solution** : le **type** voyage en argument IPC séparé — le process principal arbitre sans ouvrir le JSON. Le contrôle par **champ** resterait dans le renderer (`stripProjectionTarget`), mais s'appuie désormais sur le rôle **estampillé par le relais**, que l'émetteur ne peut pas forger.
- **Leçon** : contrôler un champ imposerait `JSON.parse` + re-sérialisation sur le flux le plus chaud, soit les +19 ms que le passage à la chaîne avait fait gagner. Déplacer un contrôle a un coût de transport : le mesurer avant de le déplacer.

### 3. Refus par défaut, mais liste établie sur l'observé
- **Défi** : La première liste d'autorisations, bâtie sur lecture du code, excluait `combat` des flux d'une fenêtre secondaire.
- **Réalité** : 92 refus en une minute d'essai. Ce n'étaient pas des gestes mais des **échos** — une fenêtre secondaire applique l'état du MJ, sa souscription de store repart, et elle republie. `isApplyingRemoteUpdate` ne couvre que le temps synchrone de l'application.
- **Leçon** : c'est la **journalisation** qui a corrigé la liste en une minute, pas la relecture. Toute politique de refus par défaut doit journaliser ses refus dès le premier jour.

### 4. Un minuteur partagé fait taire le flux le moins bavard
- **Défi** : Une rafale de dessin annulait la rediffusion de carte en attente, et réciproquement.
- **Solution** : un minuteur **par flux**.
- **Leçon** : un débounce partagé entre deux sources indépendantes n'est pas un débounce, c'est une famine.

### 5. `isTokenLocked` : l'expiration change la valeur sans message
- **Défi** : Rendre réactif un état qui vit hors de React.
- **Solution** : abonnement dans le service + `useTokenLock` par `useSyncExternalStore`.
- **Leçon** : le cas non trivial n'est pas le message, c'est le **temps**. Un verrou meurt au bout de cinq secondes sans que personne n'émette rien : il faut programmer le réveil correspondant. À noter que seul l'**affichage** était en cause — `requestLock` protégeait déjà.

---

## 🔁 Freins & Cadences (2026-08-07)

### 1. Un frein qui abandonne perd la dernière valeur
- **Défi** : La bascule de projection du combat ne s'appliquait jamais, alors que l'horloge, le tableau et la carte fonctionnaient.
- **Cause** : `handleSync` faisait un `return` sec sur tout appel survenant moins de 500 ms après le précédent — sans report ni reprise. Le combat est le **seul** flux dont la bascule emprunte cette voie ; les autres passent par `syncFast`, qui ne freine ni l'horloge ni les dés.
- **Solution** : le frein **reporte** au lieu d'abandonner (trailing edge).
- **Leçon** : un throttle sans bord de fuite perd silencieusement le dernier état d'une rafale — c'est-à-dire précisément celui qui compte.

### 2. Confondre « rafraîchir » et « démarrer »
- **Défi** : « Tour Suivant » en combat projetait la carte.
- **Cause** : `syncToPlayers` faisait `projectionTarget: state.projectionTarget || 'hub'` sans condition, donc tout rafraîchissement **allumait** la projection. `App.tsx` resynchronise la carte à chaque changement de la liste des combattants, et `nextTurn` reconstruit ce tableau.
- **Indice révélateur** : les **26 appels internes** du store se gardaient déjà tous par `if (get().projectionTarget)`. Le contrat voulu était donc bien « rafraîchir » ; un seul appelant avait oublié la garde.
- **Solution** : la règle vit dans `syncToPlayers`, et le démarrage devient explicite (`{ start: true }`).
- **Leçon** : quand tous les appelants sauf un répètent la même garde, la garde est au mauvais endroit. Ne pas en ajouter une de plus — la déplacer.

### 3. Borner ce qui est déclenché par le réseau
- **Défi** : `remote:request-sync` déclenchait une synchronisation complète non freinée, à chaque connexion de socket et sur simple message d'une tablette.
- **Solution** : plancher d'une seconde entre synchronisations forcées, qui **reporte** au lieu de refuser.
- **Leçon** : le coût n'était pas le poids du payload (305 Ko) mais le **travail de le construire** — résolution de tous les médias. Mesurer le coût de production, pas seulement celui de transmission.

---

## 🖥️ Rendu & Fuites d'Information (2026-08-07)

### 1. Une garde d'affichage absente ne se voit pas
- **Défi** : Le bouton de projection du combat semblait sans effet sur le Player Hub, alors qu'il fonctionnait sur la tablette.
- **Cause** : `HubCombatTracker` était rendu **sans garde** dans `PlayerHub` ; `hasCombatants` n'y servait qu'à une classe de mise en page. La tablette, elle, conditionne bien son rendu.
- **Ce qui a désigné la cause** : l'**écart entre deux vues** affichant le même état depuis la même source. Ni le store, ni le transport, ni la synchronisation n'étaient en cause.
- **Leçon** : devant « ça marche ici mais pas là », comparer les deux rendus **avant** de remonter la chaîne de données. J'ai perdu du temps sur trois hypothèses de transport.

### 2. Les jumeaux `ChronicleForge` / `ForgeDashboard`
- **Défi** : Corrigé la sélection de carnet dans un panneau, annoncé le problème réglé — l'utilisateur employait l'autre.
- **Leçon** : ces deux composants portent le **même titre traduit** et une logique quasi identique. Tout changement touchant la Forge doit chercher les deux. Plus généralement : après un correctif dans un composant, chercher les autres appelants du même outil **avant** d'annoncer que c'est réglé.

### 3. Le Hub est un écran partagé
- **Décision** : le suivi de combat du Hub n'affiche plus les points de vie — ni le compte exact, ni la barre miniature, qui dit la même chose en moins précis.
- **Conservé** : les jauges des systèmes de santé alternatifs (blessures, horloge, stress). Une horloge de progression est souvent publique à la table et n'est pas un compte de PV.
- **Leçon** : une fuite d'information de ce genre ne se voit pas en relisant le code — elle se constate en partie, trop tard. D'où un test qui vérifie l'**absence** de PV dans le rendu.

---

## 🤖 MCP & Dépendances Externes (2026-08-07)

### 1. Deux pannes empilées : vérifier l'environnement avant le code
- **Panne 1** : `SessionNotCreatedException` — ChromeDriver attendait Chrome 151, le navigateur exécutait 150. Une mise à jour **téléchargée attendait un redémarrage complet** de Chrome ; le pilote, lui, se cale sur la version *installée*.
- **Leçon** : devant un `SessionNotCreatedException`, vérifier `chrome://settings/help` **avant** toute autre chose. Ça se reproduira à chaque version majeure laissée ouverte plusieurs jours.
- **Panne 2, masquée par la première** : Google a migré NotebookLM vers **Gemini Notebook** sur `notebook.google.com`. Le paquet `notebooklm-mcp` était figé sur l'ancien domaine — son test de connexion cherchait `notebooklm.google.com` dans l'URL courante, condition devenue **impossible à satisfaire**. L'authentification expirait indéfiniment, quel que soit le nombre de reconnexions.
- **Leçon** : quand une ré-authentification répétée ne change rien, ce n'est pas la session qui est en cause mais le **test** de la session.

### 2. Un échec silencieux coûte des heures
- **Défi** : Le bouton de ré-authentification lançait un processus qui attendait une action humaine — mais en `detached` avec `stdio: 'ignore'`, et renvoyait toujours `{ success: true }`.
- **Conséquence** : le message « Please log in » n'a jamais atteint un écran. La panne a tenu des mois, et deux allers-retours de diagnostic.
- **Solution** : le pont capture désormais la sortie et détecte une mort précoce du processus.
- **Leçon** : ne jamais renvoyer un succès sur la seule création d'un processus. Au minimum, détecter l'échec instantané et journaliser la sortie.

### 3. Les noms d'outils survivent, la forme des réponses change
- **Défi** : Après migration vers `notebooklm-mcp-cli`, les carnets s'affichaient mais **jamais leurs sources**, sans la moindre erreur.
- **Cause** : le nouveau client renvoie `{ notebook: {...}, sources: [...] }` — les sources **à côté** du carnet, non dedans. Le code lisait `.sources` sur le seul objet `notebook`.
- **Leçon** : c'est le pire cas de migration — rien ne casse bruyamment, la liste est simplement vide. Après un changement de dépendance, vérifier la **forme** des réponses de chaque outil réellement utilisé, pas seulement les noms.

### 4. Sur Windows, `python` du PATH n'est pas l'interpréteur des paquets
- **Défi** : `PYTHON_EXE = 'python'` résolvait vers `WindowsApps\python.exe`, le relais du Microsoft Store, où rien n'est installé.
- **Solution** : résolution explicite dans `mcp_bridge.ts` (variable `GMOS_PYTHON`, puis installations sous `%LOCALAPPDATA%\Python`, puis PATH).
- **Leçon** : sur Windows, ne jamais se fier à `python` nu pour lancer un service dont les dépendances sont installées ailleurs.

### 5. Le process principal ne se recharge pas à chaud
- **Défi** : Après modification du protocole IPC, tous les flux sont tombés d'un coup — deux signalements de bugs inexistants.
- **Cause** : Vite recharge le **renderer**, jamais le process principal. Le renderer envoyait la nouvelle signature, le main lisait l'ancienne.
- **Leçon** : toute modification de `electron/` exige un **redémarrage complet** de l'application. Signature d'un décalage de version : plusieurs flux indépendants tombent **simultanément** — c'est une panne de transport, pas quatre bugs.

---

## 🧵 Plusieurs écrivains pour une même vérité (2026-08-08 → 2026-08-22)

**C'est le motif dominant de la quinzaine.** Il a produit à lui seul une dizaine de défauts, et **aucun
n'a été trouvé à la lecture du code** : ils sont tous sortis d'une séance jouée ou de la relecture d'une
partie jouée.

### 1. La forme du défaut, et le remède qui ne marche pas
- **Défi** : trois listes de ce qu'est une session · deux portes vers une scène dont une seule faisait
  entrer les PJ · un onzième lecteur dissident du module de santé · trois hauteurs CSS pour une seule
  carte, qui rognait ses propres boutons · deux chemins vers Ollama dont un seul était entretenu · trois
  plafonds de temps qui ne s'accordaient sur rien.
- **Cause** : à chaque fois, plusieurs endroits ayant chacun leur idée de la même chose, et qui ont
  divergé sans qu'aucun ne se plaigne.
- **Leçon** : *le remède n'est jamais d'ajouter le champ manquant aux listes fautives — c'est de n'en
  avoir qu'une.* Corollaire vérifié le 21/08 : **un écrivain de MOINS produit le même dégât** — sur les
  trois portes par lesquelles un objet entre dans un inventaire, la troisième n'écrivait rien au journal.

### 2. Un défaut qui ne se plaint de rien est le plus cher
- **Défi** : `slice(-10)` sur un journal qui empile en tête envoyait à l'Oracle **les dix plus anciens**
  événements sous un intitulé annonçant la fin ; un seuil de réussite pris pour une réserve faisait
  lancer **seize dés au lieu de sept**, sur le pupitre *et* sur la tablette des joueurs ; un combattant
  nommé « Ajouter un Combattant » est entré dans le résumé de séance.
- **Cause** : ni erreur, ni vide, ni incohérence visible. Le résultat reste **plausible**.
- **Leçon** : ces défauts ne se trouvent qu'en **jouant**, et la trace écrite est le seul filet — le
  dernier a été trouvé dans `ollama_debug.log`, en cherchant tout autre chose. *Un jet faux ne se voit
  jamais en séance ; un récit faux se relit six mois plus tard.*

### 3. Le geste qui rassure n'est pas le geste qui vérifie
- **Défi** : « Session chargée et vérifiée 📂 » sur un chargement qui n'avait rien chargé ;
  `generateAISummary` annonçant un succès sur un résumé inexistant.
- **Cause** : un repli qui **rend un objet valide** au lieu de lever — `FullSessionSchema.parse({})`.
- **Leçon** : un repli silencieux transforme une panne en donnée. **Lever, ou dire.** Et sur un schéma :
  *un champ absent laisse le store tranquille, un `.default([])` l'écrase.*

### 4. Une consigne noyée est une consigne perdue — et l'ordre compte autant que le texte
- **Défi** : la Forge a dérivé six Sauvegardes additionnées (Cthulhu Hack), puis **douze composantes de
  jet « Compétence 1 » à « Compétence 12 »** (Rêves de Dragons), alors que la consigne l'interdisait dans
  les deux cas. Et les titres de section étaient **reformulés au lieu d'être recopiés**.
- **Cause** : la consigne juste arrivait **après** celle qu'elle corrige, ou tenait en une ligne au milieu
  d'une liste de métadonnées.
- **Leçon** : **ce qui décide du COMPTE doit s'énoncer avant ce qui décide du CONTENU.** Et une consigne
  mord davantage quand elle dit **qu'elle sera vérifiée** — « ces titres sont confrontés à l'index » — avec
  un repli qui ne coûte rien : *si tu ne retrouves pas le titre exact, omets-le.*

### 5. Un contrôle qui se trompe est pire qu'un contrôle absent
- **Défi** : un contrôle de dérivation a crié **vingt fois** sur un seul défaut, une fois par mot d'une
  phrase prise pour une formule — envoyant chercher un champ nommé « une ». Ailleurs, un seuil de densité
  d'index avec **deux unités de marge** laissait un livre entier se faire passer pour un index.
- **Leçon** : un contrôle se teste sur son **cas limite**, pas sur les cas qui marchent. Et un seuil se
  **mesure** : quarante → cent, parce que les rendements observés vont de 2 à 38 pour du bruit et de 265 à
  279 pour de vrais index. *L'écart est net, cent tombe au milieu du vide.*

### 6. Vérifier qu'une chose a disparu n'est pas vérifier que son travail n'a pas été fait
- **Défi** : une étape déclarée « à faire » l'était depuis cinq jours. J'avais vérifié que la Forge de
  chronique était *retirée*, et j'en avais déduit que ses idées restaient à reprendre.
- **Cause** : statut lu dans un **plan**, pas dans le **code** — et un commentaire périmé, qui citait au
  présent un défaut corrigé, m'y a confirmé.
- **Leçon** : *un statut se vérifie avant d'être écrit.* Trois règles en découlent, posées le 19/08 :
  un document **déclare sa nature** (référence vivante, récit clos, instantané daté) · **un reste ne se
  recopie pas** d'un document à l'autre, sinon il survit à sa correction · **un statut se vérifie**.

### 7. Lire le code prouve qu'une section existe, pas qu'elle porte quelque chose
- **Défi** : « l'étape 10 fonctionne, et je ne vois pas le nom de la scène ». Le journal disait le modèle,
  les options et la réponse — **jamais le contexte**.
- **Leçon** : même impasse que le 12/08 pour la contrainte JSON, même remède — **un fichier se relit après
  coup, par n'importe qui**. Journaliser les **titres ET leur poids** : une section vide et une section
  pleine portent le même titre.

### 8. Le chemin s'arrête avant le moteur
- **Défi** : trois fois le même motif sur le pupitre de dés — le sens du comptage (16/08), le sélecteur
  `>=` / `<=` affiché et ignoré, puis les dés d'équipement d'Alien (21/08).
- **Leçon** : un champ affiché à l'écran doit être **suivi jusqu'au moteur**, et le correctif se pose
  **dans le moteur** — c'est ce qui a corrigé la tablette des joueurs du même coup. **Règle** : *un seuil
  et un nombre de dés ne partagent jamais un `??`.*
- **Septième fois, le 2026-09-03** : le mode échelonné choisi à la main au pupitre était lu, puis
  **recouvert par le pilote actif** — deux D12 lançaient des d6. *Un jet faux ne se voit jamais en
  séance : personne ne recompte un résultat qui a l'air normal.* Les deux questions qui trouvent ces
  défauts : **« qui d'autre lance ce jet ? »** et, depuis ce jour, **« qui d'autre a la même rustine à
  poser ? »** — la seconde a découvert que la tablette n'avait jamais reçu le pilote du tout.

### 9. Une optimisation annoncée qui n'a pas lieu fait chercher le temps perdu ailleurs
- **Défi** : un commentaire promettait une « exécution parallèle » du Cortex. Sous `NUM_PARALLEL=1`, le
  défaut d'Ollama, **les deux appels font la queue**. Ailleurs, `keep_alive` posé dans `options` est
  accepté **sans effet et sans un mot**.
- **Leçon** : une promesse de performance non mesurée est une dette de diagnostic. Et *ça se mesure, ça ne
  s'intuite pas* — la règle vaut pour le plafond RAG comme pour tout le reste.

---

## 🕳️ Ce qui ne rend aucune erreur (2026-09-02 → 2026-09-03)

*Les sept chantiers de ces deux jours viennent **tous** d'un signalement de David à l'écran, aucun d'une
relecture de code. Ce n'est pas un hasard : **aucun des cinq défauts ci-dessous ne produit d'erreur**.*

### 1. Une classe qui n'existe pas ne prévient pas
- **Défi** : le fondu d'entrée du titre projeté ne se voyait pas. La classe était bien là, dans le JSX.
- **Cause** : `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-*` sont fournies par le greffon
  **`tailwindcss-animate`, qui n'avait jamais été installé**. Écrites **125 fois dans 76 fichiers**, elles
  ne produisaient **aucune règle CSS** depuis toujours.
- **Leçon** : une classe utilitaire absente ne casse rien, **il ne se passe simplement rien** — et
  personne ne cherche un effet qu'il n'a jamais vu. Devant une animation qui « ne marche pas », vérifier
  d'abord que la classe **existe dans la sortie CSS**, avant de soupçonner le composant.
- **Corollaire** : rétablir le greffon a réveillé 125 animations d'un coup. *Réparer une brique morte
  n'est pas un correctif local : c'est un changement de comportement partout où elle était citée.*

### 2. Un message émis avant que le destinataire n'écoute est perdu, pas en retard
- **Défi** : « le texte du Titre n'apparaît parfois pas tout de suite » — en réalité seulement quand la
  séquence **crée** la fenêtre de projection (moniteur éteint).
- **Cause** : le titre partait dans la seconde qui suivait, vers un rendu qui n'avait pas encore posé son
  écouteur. L'image ne connaissait pas ce défaut : elle attendait `did-finish-load`.
- **Leçon** : rien ne rejoue un événement manqué. Deux remèdes possibles, et **le bon est le second** :
  retarder l'envoi (l'émetteur doit alors savoir quelles fenêtres existent), ou **laisser le récepteur
  réclamer l'état courant en arrivant**. Le processus principal retient l'état vivant, le rendu le
  demande — et un écran ouvert au milieu d'une séquence rattrape ce qu'il a raté.

### 3. Un champ déclaré des deux côtés et rempli par personne rend `undefined`
- **Défi** : la carte « Système actif » du pad de dés ne s'était **jamais** affichée sur les tablettes.
- **Cause** : `session.activeDiceConfig` était déclaré dans le contrat de synchronisation et lu par la
  tablette — **et aucun émetteur ne l'écrivait**. Conséquence invisible : tout jet parti d'une tablette
  était un jet manuel, pendant des mois.
- **Leçon** : le typage garantit la **forme** d'un champ, jamais qu'il soit **rempli**. Un contrat de
  synchronisation se vérifie **des deux côtés** — *et une carte qui ne s'affiche pas ne se signale pas.*

### 4. Rendre un inconnu à une simulation, c'est la laisser inventer
- **Défi** : « dès que je libère les positions, tout se remélange » (Social Nexus).
- **Cause** : `x/y` est un **point de départ**, `fx/fy` une **contrainte**. Un nœud rendu à D3 sans
  coordonnées est reposé sur une spirale : ce n'était pas la simulation qui remélangeait.
- **Leçon** : distinguer **la capture et la décision**. `nodePositions` est un instantané pris en bloc au
  verrouillage, une épingle est un geste isolé du MJ ; les confondre ferait qu'un déverrouillage épingle
  tout le graphe — *c'est-à-dire remette le verrou qu'on vient de lever.*

### 5. On réécrit les déclarations, jamais le fichier
- **Défi** : régler les 22 jetons d'un thème de jeu depuis l'application, sans abîmer le `theme.css`.
- **Cause potentielle** : un `theme.css` porte les jetons **et trois cents lignes de règles `.rpg-*`**
  écrites à la main, que les fiches de personnage consomment. Régénérer le fichier depuis les jetons les
  effacerait — **et rien ne le dirait** : la casse se verrait en ouvrant une fiche, un autre jour.
- **Leçon** : quand on édite un fichier que d'autres écrivent, remplacer **la valeur de chaque
  déclaration, à sa place**. Le contrôle qui le prouve est **l'idempotence** — réécrire un thème avec ses
  propres valeurs doit rendre le fichier identique, octet pour octet —, et il doit tourner sur les
  **vrais fichiers du dépôt**, pas sur une imitation.

### 6. Deux voies vers la même sortie s'additionnent — et un `abs()` mange un signe
- **Défi** : « le son se coupe ou sature trop facilement » (Voice-OS). Aucun message d'erreur, aucun
  test rouge, et un soupçon légitime porté sur la bibliothèque — *alors qu'il n'y en a pas une seule* :
  tout est en Web Audio et un worklet écrit à la main.
- **Causes, quatre, toutes muettes** : `monitorGain` et `liveGain` étaient tous deux à 1,0 **sur le même
  nœud de sortie** (retour casque + diffusion = **+6 dB**) · le gain du formant était calculé avec
  `Math.abs()`, donc les presets graves posaient **+16 dB à 100 Hz** au lieu de creuser · la
  réverbération sommait `1 − mix/2` et `mix`, soit **1,5 ×** le signal à fond · et l'écrêtage final était
  **dur**, ce qui fabrique le grain qu'on entend comme « ça sature ».
- **Et pour les coupures** : la porte n'avait **ni hystérésis ni maintien** (un seul seuil, franchi des
  dizaines de fois par phrase), elle mesurait **après** le compresseur et le gain de sortie — *baisser le
  volume fermait donc la porte* —, sur une mesure en **huit bits** où tout ce qui est sous −42 dB tient
  dans un pas ; et la boucle qui décide tournait en `requestAnimationFrame`, que Chromium ralentit dès
  que la fenêtre passe derrière celle de projection.
- **Leçon** : *un gain de 1,0 n'est pas un interrupteur — deux fois « ouvert » sur un même nœud font
  « deux fois plus fort ».* Et une décision se prend sur le signal qu'elle prétend juger : la porte du
  micro se mesure sur la voix, jamais sur ce que la chaîne en a fait. **Corollaire pour ce projet** :
  quand une boucle DÉCIDE quelque chose (porte, ducking, lumière qui suit la voix), elle ne doit pas
  dépendre du rendu d'une fenêtre — `backgroundThrottling: false`, ou mieux, le fil audio.

### 7. Un harnais qui s'effondre accuse le code qu'il n'a pas exécuté
- **Défi** : `npx vitest run` a rendu **263 fichiers en échec** avec `Error: Vitest failed to find the
  current suite` pointant `src/test/setup.ts`. Un rouge parfaitement crédible.
- **Cause** : `setup 0ms`, `tests 0ms` — **aucune assertion n'avait tourné**. Ce sont les workers qui
  tombaient sous la charge des 263 environnements jsdom. La même suite passe avec
  **`npx vitest run --maxWorkers=4`** : 3 336 tests verts.
- **Leçon** : avant de croire un échec massif, **lire les compteurs, pas la couleur**. Un échec qui touche
  *tous* les fichiers, y compris ceux qu'aucune modification n'approche, accuse le harnais.
  ⚠️ L'étape 3 de `scripts/validate.ps1` appelle la commande **sans bride**.

---

*Dernière mise à jour : 3 Septembre 2026 — révision de Voice-OS (sélecteur de micro, porte à hystérésis,
quatre sources de saturation), storyboard (le son d'une séquence, le titre projeté), greffon
`tailwindcss-animate` rétabli, dés échelonnés au pupitre et sur tablette, atelier de thème, épingles du
Social Nexus.*

*Mise à jour précédente : 22 Août 2026 — trame narrative et journal de séance (plan du 08/08 clos), socle
du plan d'accélération IA (axes A à D), Forge Système et Forge de campagne éprouvées en réel.*

*Mise à jour précédente : 7 Août 2026 - GM-OS v6.5.0 - Session de durcissement : récupération des campagnes, unification du transport (points 1 à 5 clos), migration MCP vers Gemini Notebook.*
