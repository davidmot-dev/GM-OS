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

### 7. Une sonde qui ne réveille pas le défaut ne prouve rien
- **Défi** : refaire la transposition de Voice-OS (chantier du 03/09). Premier jet des tests : sinusoïde
  à 200 Hz, transposée de −8 demi-tons, mesure de l'ondulation du niveau. **L'ANCIEN algorithme les
  passait tous** — 3 % d'ondulation, sous un seuil de 12 %.
- **Cause** : une sinusoïde retardée reste la même sinusoïde. Les deux têtes de lecture de l'ancien
  algorithme restaient donc **corrélées quoi qu'il arrive**, et son défaut ne pouvait pas se manifester.
  Sur une « voyelle » (fondamentale + douze harmoniques), le même algorithme ondule de **50 %**, et sur du
  bruit blanc de **39 %**.
- **Leçon** : *avant de croire un test vert, le passer sur le code qu'il est censé condamner.* Un test qui
  ne sait pas échouer ne mesure rien — et il est plus dangereux qu'un test absent, parce qu'il rassure.
  **Corollaire sur le choix du signal** : une sonde doit ressembler à ce que le module traite vraiment.
  Ici, la sonde idéale n'était pas la plus pure, c'était **la plus proche d'une voix**.
- **Et l'inverse est vrai aussi** : c'est la même mesure qui a montré qu'une fenêtre de corrélation plus
  courte qu'une période de voix (5,3 ms pour un 120 Hz qui en fait 8,3) **doublait** l'ondulation
  résiduelle. Le réglage n'a pas été deviné, il a été mesuré.

### 8. Un module WebAssembly n'est pas prêt parce qu'il est instancié
- **Défi** : piloter RNNoise sans sa glu Emscripten — elle réclame `TextDecoder` et `window`, dont aucun
  n'existe dans un AudioWorklet. Le wasm ne demandant que **trois imports** (`__assert_fail`,
  `emscripten_resize_heap`, `fd_write`), l'instancier soi-même paraissait direct.
- **Cause** : `rnnoise_create` partait aussitôt dans `__assert_fail`. Il manquait **deux appels
  d'amorçage** que la glu fait avant d'exposer quoi que ce soit : `emscripten_stack_init`, qui pose la
  pile, et `__wasm_call_ctors`, **qui remplit les tables du modèle**. Sans lui, le réseau existe et ses
  poids valent zéro.
- **Leçon** : *instancier n'est pas initialiser.* Devant un wasm qu'on pilote sans sa glu, lire ce que
  la glu fait **avant** le premier appel utile — c'est là que vivent les amorçages, et leur absence ne
  produit pas une erreur de chargement mais un comportement muet et faux.
- **Corollaire, qui a rendu le chantier mesurable** : trois imports triviaux, c'est aussi ce qui permet
  au même code de tourner **sous Node**. Le débruiteur a donc son banc (`electron/debruitage.test.ts`)
  et on sait chiffrer ce qu'il fait : −62 dB sur du bruit stationnaire.

### 9. Une norme se recopie, elle ne se réinvente pas
- **Défi** : mesurer la sonie des morceaux (EBU R 128) pour les aligner. Les filtres de pondération K
  sont deux biquads dont la norme publie les coefficients — mais seulement **pour 48 kHz**, alors que
  Music-OS suit la carte son.
- **Erreur** : les recalculer avec la forme classique des filtres audio (sinus/cosinus). Résultat :
  `b0 = 1,5293` au lieu de `1,5351`. Un écart de 0,03 dB — inaudible, et pourtant fatal au but
  recherché : la mesure n'aurait plus été **comparable** à celle de n'importe quel autre outil.
- **Solution** : la transformation bilinéaire en `tan` (celle de `libebur128`), qui retombe sur la table
  publiée à **9·10⁻¹⁶ près**, et un test qui compare aux cinq coefficients de la norme.
- **Leçon** : quand un calcul existe pour être comparé à celui des autres, la valeur de référence n'est
  pas « proche », elle est **exacte**. Et le test doit porter sur la table publiée, pas sur ce que le
  code produit.

### 10. Un harnais qui s'effondre accuse le code qu'il n'a pas exécuté
- **Défi** : `npx vitest run` a rendu **263 fichiers en échec** avec `Error: Vitest failed to find the
  current suite` pointant `src/test/setup.ts`. Un rouge parfaitement crédible.
- **Cause** : `setup 0ms`, `tests 0ms` — **aucune assertion n'avait tourné**. Ce sont les workers qui
  tombaient sous la charge des 263 environnements jsdom. La même suite passe avec
  **`npx vitest run --maxWorkers=4`** : 3 336 tests verts.
- **Leçon** : avant de croire un échec massif, **lire les compteurs, pas la couleur**. Un échec qui touche
  *tous* les fichiers, y compris ceux qu'aucune modification n'approche, accuse le harnais.
  ⚠️ L'étape 3 de `scripts/validate.ps1` appelle la commande **sans bride**.

---

## 🌉 Brancher deux modules sans les confondre (2026-09-04)

### 1. Le point de rencontre n'est pas celui qu'on croit
- **Défi** : Table-OS et Loot-OS parlaient tous deux de « tables » et n'avaient aucun lien. La
  demande était de les faire fonctionner ensemble « tout en maintenant la souplesse de Loot-OS ».
- **Ce qui a décidé du plan** : ils ne font pas le même geste. L'un *consulte* — un dé, une plage,
  un résultat qu'on lit — l'autre *compose* : plusieurs tirages, des imbrications, des quantités,
  puis une distribution. **On ne fusionne pas, on branche.**
- **Solution** : le point de rencontre est le **pool de butin**, jamais le personnage. Table-OS ne
  sait pas ce qu'est un objet ; il sait *verser*. Loot-OS distribue.
- **Le défaut que cela a révélé** : Table-OS court-circuitait Loot-OS et écrivait une ligne de
  prose dans `character.inventory` — **une zone de texte que l'onglet Inventaire de la tablette
  ne regarde même pas**, puisqu'il affiche `inventoryItems`. L'objet donné n'apparaissait nulle
  part où le joueur cherche ses affaires.
- **Leçon** : *deux modules qui portent le même mot ne font pas forcément le même geste — et
  celui qui les relie doit passer par ce que les deux savent manipuler, pas par le raccourci.*

### 2. Ce qui n'est pas déclaré ne se devine pas
- **Défi** : une entrée d'oracle dit en prose « Gagnez +1d100 Eurodollars et 1d4 munitions ».
  Aucun code ne peut en tirer des objets sans deviner.
- **Refusé** : lire `effect` à la regex. *Un contrôle qui se trompe est pire qu'un contrôle
  absent* — c'est la leçon de la Forge, et elle vaut ici mot pour mot.
- **Solution** : un champ `butin` **facultatif** sur l'entrée, et pour les tables qui n'en ont
  pas, un geste explicite — l'IA propose, le meneur relit dans le pool avant que ça compte.
- **Leçon** : quand une donnée n'existe pas sous forme exploitable, on l'ajoute **en option** ou
  on demande à l'humain. On ne la reconstitue pas par heuristique sur du texte libre.

### 3. Nommer une chose peut rendre visible un mensonge qui ne l'était pas
- **Défi** : une case à cocher « pondéré » faisait basculer le sens du champ voisin — poids
  relatif d'un côté, pourcentage de chance de l'autre — sans le dire. Elle a été remplacée par
  deux choix nommés, chacun avec sa phrase.
- **Erreur** : les deux boutons lisaient `table.rollMode || 'weighted'`. Or les tables
  enregistrées avant ce champ portent `isWeighted` — le générateur savait replier dessus, pas
  l'écran. La table « TEST » de Blade Runner, qui teste chaque ligne, s'affichait « un seul parmi
  la liste ». **L'ancienne case à cocher tombait juste par accident** (`rollMode === 'weighted'`
  est faux pour les deux raisons à la fois).
- **Leçon** : *un écran qui réimplémente la lecture d'un moteur finit toujours par en diverger.*
  `modeDeTirage()` et `tableImbriqueeDe()` sont sorties du générateur, exportées, et les écrans
  les appellent. **Rendre une valeur explicite oblige à la lire correctement** — ce qui était
  approximatif tant que c'était implicite devient faux dès que c'est écrit.

### 4. Un type partagé ne doit pas habiter chez celui qui s'en sert le plus
- **Défi** : donner un `voiceProfile` facultatif à l'entité de campagne.
- **Cause** : `entity.types.ts` s'est mis à importer `useVoiceStore` — et `window.d.ts` importe
  `VoiceState`, donc le même magasin. Le cycle a fait **disparaître l'augmentation globale de
  `Window`** : une centaine d'erreurs « `appBridge` n'existe pas sur `Window` », dans des fichiers
  que rien n'avait touchés.
- **Solution** : `voice/types.ts`, un module feuille qui n'importe rien, réexporté par le magasin.
- **Leçon** : un `declare global` est fragile aux cycles. *Les types partagés vivent dans une
  feuille* — et une erreur qui frappe des fichiers sans rapport avec la modification accuse la
  résolution de modules, pas le code.

### 5. Une vérification ne vaut que pour l'état sur lequel elle a tourné
- **Erreur** : avoir annoncé « `tsc -b` propre » dans un message de commit, alors que le typage
  avait tourné **avant** l'ajout du dernier test — suivi de `vitest` seul, qui ne type rien.
- **Ce qui l'a rattrapé** : le hook `pre-push`, qui a refusé l'envoi. Le message était déjà écrit
  et faux.
- **Leçon** : rejouer la vérification **après** la dernière écriture, ou ne pas l'affirmer. Un
  outil de vérification passé trop tôt donne un résultat vrai à propos de rien.

### 6. Chercher ce que l'utilisateur a vraiment, pas ce que le code permet
- **Question posée** : « est-ce que je dois reforger des choses ? », puis « est-ce que je peux
  faire des profils vocaux pour la galerie de PNJ ? »
- **Méthode qui a répondu aux deux** : ouvrir les **sauvegardes réelles** plutôt que le code seul.
  Elles ont dit : un seul pilote sur douze porte des tables de butin (et la Forge n'en a jamais
  produit) ; NPC-OS porte **un** PNJ quand la galerie en porte **123**.
- **Leçon** : *le code dit ce qui est possible, les données disent ce qui existe.* Les deux
  réponses — « rien à reforger » et « la fonctionnalité est câblée sur le mauvais écran » —
  venaient des données, et aucune ne se lisait dans le code.

---

## 📏 Une unité absolue n'obéit à rien de ce qui la contient (2026-09-06)

*Trois signalements de David en une journée, tous sur la même question — « comment j'agrandis ce
texte ? » — et **deux fois la même cause**, la seconde alors que je venais de la corriger ailleurs.*

### 1. Un réglage invisible à un moteur qui n'emploie pas nos classes

- **Défi** : capture à l'appui, un tableau d'article du wiki à 11,9 px. *« Les différents slicers ne
  semblent pas agrandir cela. »*
- **Cause** : les cinq réglages de taille redéfinissent les **jetons `--text-*` de Tailwind**, donc
  les classes `text-sm`, `text-base`… Les documents Markdown, eux, sont mis en page par le greffon
  typographique, qui écrit **ses propres tailles en dur**. Il n'emploie aucune de ces classes : les
  réglages lui étaient **invisibles**, sans qu'aucune erreur ne le signale.
- **Ce qui l'a rendu déroutant** : les *paragraphes* du wiki, eux, grossissaient — leur conteneur
  porte `prose-p:text-lg`, une vraie classe. **Un réglage qui agit sur la moitié d'un même bloc se
  lit comme un réglage en panne**, pas comme un réglage incomplet.
- **Leçon** : un mécanisme de réglage ne couvre que ce qui **le consomme**. Devant « le curseur ne
  fait rien », la première question n'est pas *le curseur écrit-il bien ?* mais **qui lit ce qu'il
  écrit** — et la réponse se vérifie dans la CSS construite, pas dans le composant.

### 2. Un `rem` se calcule sur la racine, jamais sur le bloc qui le contient

- **Défi** : une heure plus tard, la loupe de lecture livrée le matin. Capture à 230 % : *« le texte
  ne grossis pas »* — titres crevant l'écran, paragraphes intacts.
- **Cause** : la loupe posait une variable sur le bloc et laissait les tailles en `em` en hériter.
  Mais `prose-p:text-lg` pose une taille en **`rem`**, et *un `rem` se calcule sur la racine du
  document*. **Tout élément portant une classe `text-*` coupe la chaîne d'héritage** — et dans ce
  dépôt, ils sont légion. Les titres suivaient seulement parce que le greffon les écrit en `em`.
- **Leçon** : `em` et `rem` ne diffèrent pas par la commodité mais par **qui décide**. Un mécanisme
  fondé sur l'héritage ne survit pas à une seule unité absolue posée en chemin, et il échoue
  **partiellement** — donc de la façon la plus trompeuse. Quand le grossissement doit valoir pour
  *tout un sous-arbre quoi qu'il contienne*, `zoom` est la bonne réponse : il n'interroge pas la
  cascade, et la mise en page **se recasse** au lieu de déborder comme le ferait `transform: scale`.
- **Corollaire, valable au-delà du CSS** : *j'ai reproduit dans le correctif la cause exacte que je
  venais de diagnostiquer.* Comprendre un mécanisme ne protège pas de le refaire à trois lignes
  d'intervalle — seule la question « qu'est-ce qui, ici, ne dépend pas de ce que je pilote ? »
  l'aurait vu.

### 3. Un plafond nommé en dur dans un test

- **Défi** : ouvrir l'échelle de 130 à 200 %, demandé le même jour.
- **Cause** : le test de bornage attendait `1.3` — le plafond recopié à la main. Il serait tombé au
  changement **sans que rien ne soit cassé**.
- **Leçon** : une garde qui recopie la constante qu'elle surveille ne garde plus le comportement,
  elle garde une valeur. Elle lit maintenant `ECHELLE_MAX` — et une garde de plus vérifie que le
  dernier palier offert **est** ce plafond : *un plafond que l'interface ne sait pas offrir n'existe
  que dans le code.*

---

## ⏱️ Un minuteur retient ce qu'on lui a dit, pas ce qu'on veut (2026-09-07)

*Demande de David : un curseur de vitesse sur chaque tuile de Light-OS. Une fonctionnalité d'une
heure, qui a mis au jour deux défauts du moteur d'effets — dont un antérieur, et invisible.*

### 1. `setInterval` fige sa période au moment où on le pose

- **Défi** : rendre réglable la cadence de trente-neuf effets lumineux qui tournent en boucle.
- **Cause** : chaque effet posait `setInterval(loop, interval)` **une fois**, au démarrage. Écrire la
  nouvelle vitesse dans le magasin aurait suffi pour le prochain démarrage — et n'aurait **rien
  changé à ce qui tourne**, c'est-à-dire au seul cas où on se sert d'un curseur.
- **Leçon** : rendre réglable une valeur ne consiste pas à la stocker, mais à trouver **qui la lit,
  et quand**. Une valeur lue une seule fois, à la construction, n'est pas un réglage — c'est un
  paramètre de démarrage. La question à poser devant toute demande de réglage est *à quel moment
  cette valeur est-elle relue ?* ; si la réponse est « jamais », le réglage est à construire avant
  l'interface qui le montre.
- **Corollaire** : le remède est presque toujours de ramener les chemins à **une seule porte**. Ici,
  les deux familles d'effets — cadence fixe et cadence recalculée à chaque tour — avaient chacune
  leur planification, et la liste qui les départageait était **écrite deux fois** dans la même
  fonction.

### 2. Deux boucles peuvent se chevaucher derrière une attente réseau

- **Défi** : aucun — le défaut était là avant, et personne ne l'avait vu.
- **Cause** : une boucle d'effet attend la réponse du pont Hue **avant** de se replanifier. Si la
  scène change pendant cette attente, la boucle qui reprend appartient à l'effet **révolu** : elle
  réinstalle son minuteur par-dessus le nouveau, et la lampe reste sur la scène d'avant. Il faut un
  pont lent et un changement de scène pressé — *soit exactement une soirée de jeu*.
- **Leçon** : tout `await` au milieu d'une boucle est un endroit où le monde a pu changer. Vérifier
  que le minuteur existe encore ne suffit pas : il faut vérifier que **c'est toujours le nôtre**. Un
  numéro de génération par cible, incrémenté à chaque démarrage et à chaque arrêt, coûte quatre
  lignes et ferme la catégorie entière.
- **Où le chercher ailleurs** : partout où un `stop()` suivi d'un `start()` immédiat croise une
  boucle asynchrone — les effets lumineux, les fondus audio, les sondes de matériel.

### 3. Le seul réglage offert ne doit pas pouvoir noyer l'appareil

- **Défi** : jusqu'où laisser accélérer un effet ?
- **Cause potentielle** : chaque lampe en effet a **sa propre boucle**, et le pont Hue tient de
  l'ordre de dix commandes par seconde. Une scène de quatre lampes à 100 ms prend déjà tout le
  budget ; le curseur au maximum sur les cadences les plus courtes serait descendu à 25 ms.
- **Leçon** : quand on rend réglable ce qui parle à un appareil physique, la borne haute ne se
  choisit pas au confort d'usage mais **au budget de l'appareil**, et le plancher se prend sur ce que
  le code s'autorisait déjà — il est *mesuré*, pas inventé. Et une valeur absente, nulle ou abîmée
  doit retomber sur le comportement d'origine : *un réglage qu'on n'a pas su lire ne doit jamais
  arrêter ce qu'il réglait.*

---

## 🏠 Ce qui se passe quand tout s'arrête (2026-09-07)

*Deuxième demande de David le même jour : désigner l'éclairage normal de la pièce. Elle a mis au
jour un défaut plus ancien qu'elle — la lumière s'éteignait toute seule — et failli en créer un
autre, en alignant trois gestes qui ne veulent pas la même chose.*

### 1. Une demande de confort peut être un rapport de bogue

- **Défi** : *« comme ma lumière est aussi l'éclairage normal, je voudrais pouvoir définir un défaut
  vers lequel on revient. »* Une demande de fonctionnalité, en apparence.
- **Ce qu'elle a révélé** : le retour automatique des modules audio visait la « dernière scène
  choisie à la main ». Champ vide tant que le meneur n'avait cliqué aucune tuile — et le chemin de
  repli, dans ce cas, **éteignait**. Autrement dit : la fin du premier bruitage d'une soirée
  plongeait la pièce dans le noir. Personne ne l'avait signalé comme un défaut ; il était arrivé
  déguisé en souhait.
- **Leçon** : quand un utilisateur demande à **choisir** ce qui se passe dans un cas, la première
  question à poser au code est *que fait-il dans ce cas aujourd'hui ?* La réponse est souvent « la
  pire des options par défaut », et la demande est alors un rapport de bogue qui s'ignore.

### 2. Trois chemins qui se ressemblent ne veulent pas la même chose

- **Défi** : rendre le repli configurable sans écraser les différences entre les gestes qui l'utilisent.
- **Cause potentielle** : le retour automatique d'un module, le Stop All de la barre du haut et
  l'extinction d'urgence passaient par deux fonctions dont l'une appelait l'autre. La pente naturelle
  était de les faire toutes viser le nouveau défaut — et de perdre au passage **la seule porte vers
  le noir**, ainsi que la préférence pour la scène que le meneur avait choisie lui-même.
- **Leçon** : avant de rendre un comportement configurable, énumérer **qui l'appelle et pourquoi**.
  Ce qui se ressemble dans le code (« on revient à l'état de repos ») recouvre souvent trois
  intentions distinctes, et un réglage unique les aplatit. Ici la règle commune — *prendre le premier
  candidat qui éclaire vraiment quelque chose* — a été isolée dans une fonction pure, et **la liste
  des candidats est restée propre à chaque appelant**.
- **Corollaire** : *un geste qui s'appelle « tout arrêter » ne peut pas n'arrêter que ce que sa cible
  mentionne.* Appliquer la scène de repli n'éteint que les effets des lampes qu'elle nomme ; il a
  fallu faire taire les autres explicitement.

---

## 🔌 Déclaré, écrit, livré — et pourtant absent de l'écran (2026-09-07/08)

*Une soirée entière sur Light-OS, et quatre fois la même forme de défaut : **quelque chose existe
dans le code et n'existe pas pour celui qui regarde.** Un drapeau lu dix fois et écrit par personne ;
un champ déclaré sans lecteur ; un réglage écrit mais peint dans une couleur qu'on ne distingue pas ;
un indicateur poussé hors de sa place par ses voisins. Les deux premiers ont été trouvés en relisant
le code, **les deux autres par David à l'écran, dans l'heure** — ce qui est exactement le partage
qu'on retrouve chaque semaine ici.*

### 1. Une promesse écrite dans un guide n'a aucun code derrière tant qu'on ne l'a pas ouvert

- **Défi** : rendre vrai ce que le guide de Light-OS annonçait. Trois promesses, trouvées en relisant
  le module pour tout autre chose.
- **Ce qu'il y avait** : `isSyncEnabled` lu **dix fois** dans trois modules, persisté, et **écrit par
  personne** — `true` à jamais, alors que le guide disait comment le couper. `keyCode` déclaré dans
  le type, **sans un seul lecteur ni écrivain** dans tout le dépôt. `updateSceneMetadata` capable de
  changer l'icône et la couleur, mais son unique appelant les repassant inchangées.
- ⛔ **Le pire des trois n'était pas l'absence, c'était l'homonyme.** Le seul interrupteur voisin
  s'appelait « Synchro Simulée » et bascule le pont Hue en **mode simulé**. Un meneur qui suivait le
  guide — *« désactivez le bouton Sync »* — débranchait donc son matériel en croyant reprendre la
  main. *Deux réglages dont l'un porte le nom de l'autre, c'est un piège, pas une étiquette
  maladroite.*
- **Leçon** : les trois avaient survécu à une revue des trente-huit guides, qui avait pourtant relu
  celui-ci — mais sur sa liste d'effets, où elle a trouvé ce qu'elle cherchait. **Une relecture trouve
  ce qu'elle est venue chercher.** Le seul contrôle qui attrape cette famille est mécanique :
  *chaque nom déclaré a-t-il un écrivain et un lecteur ?* Trois occurrences en un mois — `timeMultiplier`,
  `includeSounds`, et ces trois-ci.

### 2. Une garde partagée contraint la place des boutons d'un autre module

- **Défi** : mettre le bouton de « Key Learn » dans la fenêtre d'édition d'une tuile — l'endroit
  naturel, puisqu'on y règle déjà le nom, l'icône et la couleur.
- **Cause** : la garde clavier commune à Sound-OS, Music-OS et Light-OS écarte toute frappe pendant
  qu'un `role="dialog"` est ouvert — pour la bonne raison que taper « Taverne » dans un champ ne doit
  pas lancer les pastilles liées à T, A, V, E, R, N et E. Le mode d'apprentissage n'aurait donc
  **jamais reçu la frappe**.
- **Leçon** : une protection écrite pour un module devient une contrainte d'agencement pour les
  suivants, et **elle ne se lit pas dans la maquette** — seulement en essayant. Quand un geste
  dépend d'un mécanisme partagé, vérifier ce que ce mécanisme interdit **avant** de choisir où poser
  le bouton.

### 3. Exposer un réglage ne suffit pas : il lui faut un endroit où se voir

- **Défi** : l'éditeur de tuile venait d'être livré. *« Je ne sais pas donner de couleur à mes
  tuiles »* — signalé dans l'heure.
- **Cause** : l'éditeur écrivait bien. **La tuile ne lisait la couleur que sur la scène active** — on
  choisissait, on validait, et rien ne bougeait tant qu'on n'avait pas cliqué la tuile. Et la teinte
  que portaient les dix-huit depuis leur création, `#334155`, donnait sur le fond `#0f172a` un
  contraste d'environ **1,6** : quatre des cinq repères de couleur étaient perdus, dont un
  indicateur permanent invisible pour tout le monde depuis toujours.
- ⭐ **Le fond de l'affaire** : ce `#334155` ne voulait pas dire « gris ardoise », il voulait dire
  **« personne n'a choisi »**. Tant que rien ne permettait d'en changer, la distinction n'existait
  pas — *elle est née le jour où le réglage est apparu, et c'est ce jour-là qu'il fallait la faire.*
- **Leçon** : *un défaut qui signifie « rien n'est choisi » ne doit jamais traverser la même porte
  qu'une valeur choisie.* Et plus largement : livrer un réglage, c'est deux choses — l'écriture **et**
  un endroit visible où le résultat se lit. La première sans la seconde produit un réglage qui a
  l'air cassé, ce qui est pire qu'un réglage absent.

### 4. Un carré de taille fixe se remplit — ce qu'on y ajoute pousse ce qui y était

- **Défi** : *« les icônes se mélangent »*, capture à l'appui, une heure plus tard.
- **Cause** : trois ajouts en deux jours sur la même tuile — un curseur de vitesse, une maison, un
  badge de touche. La colonne centrée a grossi, le carré non, et le contenu est remonté dans la
  bande où les badges de coin sont posés en absolu. L'icône de la scène et l'indicateur d'effet se
  sont retrouvés côte à côte, lus comme **un seul glyphe**.
- **Leçon** : dans un conteneur de taille contrainte, chaque ajout est un **déménagement**, pas une
  addition. **Aucun des trois n'était fautif seul**, et c'est pour cela que rien ne l'a signalé : ni
  le typage, ni les tests, ni la relecture d'une de ces trois modifications. Le remède qui tient est
  de **séparer les bandes** — une marge qui réserve les coins — plutôt que d'espérer que le contenu
  reste petit.
- **Corollaire utile** : le meilleur emplacement pour l'indicateur d'effet n'était pas le coin mais
  la ligne de vitesse, *qui n'existe que sur les scènes à effet* — donc qui ne peut pas mentir. **Une
  collision est parfois le signe qu'un élément était mal placé dès le départ**, pas seulement qu'il
  manque de place.

### 5. Un contrôle mécanique se dégrade avant d'être cru

- **Défi** : écrire le test qui attrape la famille « déclaré, branché à rien » — trois occurrences en
  un mois, qu'aucun outil ne voyait.
- **Ce qui s'est passé** : le contrôle est **passé au vert trois fois de suite en n'examinant
  presque rien**. Il se lisait lui-même (les noms tolérés y sont écrits en toutes lettres, donc
  « employés ailleurs »). Son filtre de chemins ne reconnaissait aucun des quinze magasins d'un
  répertoire, parce que les fichiers voisins arrivent en `./x.ts` et non `../dossier/x.ts`. Et
  surtout **il ne lisait que la première `interface` de chaque fichier** — dans le magasin des
  lumières, un type accessoire, jamais l'état du magasin.
- **Ce qui l'a révélé** : un **champ fantôme** ajouté à la main dans un magasin, qui **n'a rien
  déclenché**. Sans ce geste, l'outil serait entré au dépôt en donnant le sentiment que tout est
  propre — *un contrôle qui n'examine rien passe au vert, et c'est la pire des façons d'échouer*. La
  récolte est passée de 9 noms à 19 après correction.
- **Leçon** : *un outil de détection doit être vu échouer sur un cas fabriqué avant d'être cru sur
  les cas réels.* Et deux gardes valent d'être écrites dans le contrôle lui-même : **le compte de ce
  qu'il examine** (il a attrapé le filtre de chemins) et **la péremption de ses propres exceptions**
  (une tolérance qui survit à sa cause devient un mensonge).

### 6. Deux défauts peuvent se protéger l'un l'autre

- **Défi** : brancher `setPadColor`, une action implémentée que personne n'appelait.
- **Ce qu'il y avait dessous** : la valeur qu'il aurait fallu remplacer **n'existait pas non plus**.
  Chaque pastille de son naissait avec `var(--electric-violet)`, une variable CSS **définie nulle
  part dans le dépôt** — une seule occurrence dans tout le projet, celle qui l'emploie. Les cinq
  endroits qui peignent une pastille pointaient donc vers rien, dont un `` `${color}15` `` qui
  produisait du CSS n'existant dans aucune grammaire.
- ⭐ **Le point** : sans bouton, la valeur morte ne changeait jamais ; sans valeur valide, un bouton
  n'aurait rien montré. **Chacun rendait l'autre invisible**, et corriger un seul des deux n'aurait
  rien donné à voir — ce qui aurait fait conclure que le correctif était mauvais.
- **Leçon** : quand un outil signale « personne n'appelle X », la question suivante n'est pas
  *faut-il brancher X ?* mais **que vaut ce que X écrit aujourd'hui ?** Un nom sans appelant est
  souvent le symptôme visible d'une chaîne qui n'a jamais tourné en entier.
- **Corollaire de rédaction** : *une concaténation suppose une forme, et rien ne l'impose.* Coller
  deux caractères au bout d'une valeur CSS ne marche que si elle est hexadécimale ; ni le typage ni
  le navigateur ne le disent.

### 7. Un nom sans appelant n'est pas une fonctionnalité manquante

- **Défi** : rendre compte des dix noms trouvés par le contrôle du § 33.
- **Ce que j'ai fait de travers** : j'ai écrit à David que « le calendrier actif ne se choisit pas »
  et que « le temps ne s'avance pas ». **Les deux étaient faux** : `selectCalendar` pose
  `activeCalendarId` et l'écran a sa liste déroulante ; le tableau de bord avance le temps par
  `setTimestamp`. Ces noms sont des **doublons inutilisés**, pas des portes manquantes.
- **Leçon** : le contrôle mesure une chose vraie — *ce nom n'est cité nulle part ailleurs* — et il
  est tentant de la traduire en *cette capacité n'existe pas*. **Ce n'est pas la même phrase.** Avant
  de rapporter un orphelin comme un manque, il faut chercher **le voisin qui fait déjà le travail** :
  ici, deux fois sur trois, il existait à quelques lignes.
- **Ce que ça coûte** : une liste de restes qui exagère envoie travailler sur ce qui marche déjà —
  exactement le défaut que la règle du 31/08 devait éteindre, sous une forme nouvelle.

---

## 🚪 Ce qui existe déjà porte souvent un autre nom (2026-09-09)

*Demande de David : « je voulais le MJ Focus, mais je veux aussi une possibilité d'en sortir au
besoin. » **La bonne réponse était de ne pas le construire.***

### 1. Un nom mort peut désigner une chose vivante, ailleurs

- **Défi** : brancher `isSessionMode`, « Mode MJ Focus (masque les outils d'édition) », écrit et lu
  par aucun écran.
- **Ce qu'il fallait voir** : le mode existait **déjà**, sous un autre nom et dans un autre module —
  le régime `aLaTable`, livré trois semaines plus tôt, qui densifie cinq modules et éloigne les
  actions destructives. Le brancher aurait donné **deux écrivains pour un même fait**.
- **Leçon** : devant un nom orphelin, la question n'est pas seulement *faut-il le brancher ?* mais
  **la chose qu'il nomme existe-t-elle ailleurs ?** Un vestige et une fonctionnalité vivante se
  ressemblent beaucoup vus depuis le magasin. *Chercher la chose, pas le nom* — c'est le pendant de
  la leçon du 07/09 sur les doublons de l'horloge, et la deuxième fois en trois jours.

### 2. Une règle appliquée d'un seul côté

- **Ce qui manquait vraiment** : le régime se **déduisait en silence**, sans rien pour le voir ni le
  contredire. Or l'axe voisin — le mode de contexte de l'IA — avait reçu les deux dès août, et son
  indicateur porte la règle écrite noir sur blanc : *« c'est la Forge qui doit le dire, avec le moyen
  de passer outre. »*
- **Leçon** : une règle formulée pour un axe ne se propage pas toute seule à ses voisins, même quand
  elle est écrite, même quand elle est bonne. **Deux axes livrés à un mois d'écart, une même règle,
  appliquée d'un seul côté** — et personne ne l'a vu, parce que chacun était complet vu de
  l'intérieur. *Un principe ne vaut que là où quelqu'un est allé le poser.*

### 3. Une porte de sortie ne peut pas faire partie de ce qu'elle referme

- **Le geste** : l'interrupteur du régime vit dans la barre du haut, jamais dans un des cinq modules
  que le régime replie.
- **Pourquoi c'est une règle et non un goût** : le 2026-08-23, le mode compact avait rendu **trois
  boutons introuvables** en héritant d'un style de survol que les originaux n'avaient pas. *Une porte
  de sortie qui disparaît avec le mode qu'elle doit quitter n'est pas une porte.*
- **Corollaire de rédaction** : l'indicateur montre **trois** raisons et non deux — séance ouverte,
  hors séance, **forcé**. *« Table parce qu'une séance est ouverte » n'est pas « Table parce que je
  l'ai demandé »* : sans la troisième, le meneur chercherait la séance qui n'existe pas.

---

## 🔍 Ce qu'une revue de code trouve, et ce qu'elle ne trouve qu'en corrigeant (2026-09-10/11)

*Revue demandée sur l'application entière, puis les cinq lots de correction qui en sont sortis. La
moitié des vrais défauts n'a pas été trouvée par la lecture : elle est apparue en écrivant le
correctif.*

### 1. Un outil rouge en permanence ne dit plus rien

`npm run lint` sortait **585 erreurs**, dont 468 pour la seule règle `no-explicit-any`. Un script qui
échoue toujours n'est plus lancé — et c'est pourtant lui qui portait les deux vrais bugs de la revue :
le `NaN` de la barre de vie (`no-constant-binary-expression`, **2 occurrences**) et les 27 crochets
conditionnels du hub (`rules-of-hooks`).

**La leçon** : *un signal noyé est un signal perdu.* Passer la règle bavarde en avertissement a ramené
la sortie à 71 erreurs, presque toutes réelles. Ce qui bloque doit désigner un défaut ; le reste
s'affiche sans arrêter.

⚠️ **Et l'ordre compte** : ce nettoyage se fait **après** les correctifs, pas avant. Les lots
précédents avaient déjà retiré une trentaine d'erreurs — trier ce qui va partir est du travail perdu.

### 2. Retirer du type vaut mieux que filtrer à l'usage

Deux fois dans la même semaine, le même levier a fait tout le travail.

- Fermer le pont générique : plutôt que d'écrire une liste blanche de canaux, **retirer `on`/`off`/`send`
  du type `AppBridge`**. `tsc` a alors énuméré les appelants — dont **trois que `grep` avait ratés** et
  un canal absent de mon relevé.
- Sortir les clés du renderer : plutôt que convenir de ne plus remplir `apiKey`, **retirer le champ du
  type**. `tsc` a listé les vingt-sept lecteurs.

**La leçon** : *une discipline s'oublie, un type refuse.* Et le compilateur est un inventaire
exhaustif là où la recherche textuelle est un sondage. Le mode d'échec d'une liste blanche incomplète
est le silence — la fonction cesse simplement de répondre, en séance.

### 3. Un `off` peut ne rien retirer, et personne ne le voit

Le pont enregistrait une fonction **enveloppe** anonyme dans `on`, et demandait à Electron de retirer
le `listener` d'origine dans `off`. Electron compare par référence : aucune correspondance, aucun
retrait. **Tout abonnement passé par ce pont était définitif.**

Rien ne le signalait : l'écran restait correct, la mémoire seule grossissait, et les charges utiles se
rejouaient autant de fois qu'il y avait eu de rendus.

**La leçon** : *une méthode d'abonnement doit rendre la fonction qui retire ce qu'elle a posé.* Elle
ferme alors sur le bon écouteur par construction, et l'appelant ne peut pas se tromper de référence.

Deux erreurs peuvent d'ailleurs **s'annuler à l'écran et s'ajouter en mémoire** : `map:ping` écoutait
un canal qu'aucun émetteur n'alimente, et son `off` visait une autre fonction que son `on`. Aucun des
deux défauts ne produisait de symptôme visible.

### 4. La rustine appliquée d'un seul côté — encore

Le motif revient, et il revient toujours entre **voisins immédiats** :

| Corrigé | Jamais reporté sur |
| --- | --- |
| `obsidian:read-note` (garde de chemin, avec dix lignes de commentaire) | `write-note` et `ensure-directory`, **vingt lignes plus bas**, qui écrivent |
| `broadcastUIAction` (le rôle destinataire, avec son commentaire) | `sendSync`, **une ligne plus haut** |
| `ulanzi:before-quit` (`removeAllListeners` contre le doublon `StrictMode`) | `backup:before-quit`, son jumeau — **celui qui porte la sauvegarde automatique** |

**La leçon** : *quand on écrit un commentaire pour expliquer une correction, la question suivante est
« qui d'autre a la même rustine à poser ? » — et la réponse est le plus souvent juste en dessous.*

### 5. Un contrôle qui ne peut pas être faux protège moins qu'il n'en a l'air

`startsWith(racine)` accepte le dossier **voisin** : `C:\Coffre-prive` passe quand le coffre est
`C:\Coffre`. Quatre implémentations de cette question cohabitaient, dont deux justes — et **les deux
justes ne disaient pas la même chose** sur la racine elle-même : l'une l'acceptait, l'autre non, en
silence.

C'est en unifiant, et donc en devant trancher ce désaccord, qu'est apparu le vrai défaut :
**`ai:delete-doc` avec un chemin vide supprimait le corpus entier** — `path.join(root, '')` rend
`root`, que le préfixe acceptait.

**La leçon** : *deux versions justes qui divergent sur un cas limite signalent un cas limite que
personne n'a tranché.* Un module partagé force la décision ; quatre copies la laissent implicite.

### 6. `Number()` ne rend jamais `null`

`Number(x) ?? repli` est du code mort : `Number()` rend **`NaN`**, jamais `null` ni `undefined`. Le
repli écrit pour le cas d'absence ne peut donc jamais se déclencher.

⚠️ Et la correction évidente est fausse aussi : `Number.isFinite(Number(x))` accepte `null` — parce que
**`Number(null)` vaut 0**, comme `Number('')`. Une jauge retomberait donc à zéro, c'est-à-dire à « mort »
pour un personnage, là où le repli disait 10. Il faut trier par **type** avant toute conversion.

### 7. Un contrôle ne vaut que dégradé

Chacun des cinq contrôles posés a été confronté au code d'origine **remis à l'identique** : 10 des 12
tests du composant de santé rougissent, 3 des 4 du hub, 3 des 4 du pont. *Un test qui reste vert sur le
bug qu'il prétend garder ne garde rien* — et deux fois cette semaine, la dégradation a appris quelque
chose que la lecture n'avait pas vu (`anatomy` levait, l'horodatage de repli était instable).

### 8. Un secret masqué reste un secret écrit

Le chemin Gemini journalisait la clé « masquée » — cinq caractères de tête, cinq de queue — dans
`main.log`. Et le message d'erreur du proxy écrivait **l'URL entière**, dans laquelle Gemini attend
précisément sa clé.

**La leçon** : *on ne protège pas un secret qu'on recopie dans un journal.* Après avoir retiré la clé
du chemin, le premier réflexe doit être de chercher qui l'écrit encore — un masque partiel est une
fuite partielle, pas une protection.

### 9. Un paramètre qui n'est qu'un drapeau déguisé

`listModels(apiKey)` ne se servait de son argument que pour tester sa présence. Un tel paramètre
**invite à le remplir avec la vraie valeur** — et c'est exactement ce que faisaient les quatre
appelants. Le retirer a supprimé quatre transports de clé sans changer un comportement.

### 10. Un champ de saisie contrôlé écrit à chaque frappe

`onChange` appelait `updateConfig`, qui appelait `saveSecret`. Taper une clé de quarante caractères
déposait donc **quarante versions tronquées** dans le coffre, dont trente-neuf fausses. Seule la
dernière était juste, et rien ne le disait.

**La leçon** : *une écriture persistante ne doit pas être une conséquence de la frappe.* Elle mérite un
geste — un bouton — et l'état intermédiaire vit en local.

### 11. Un correctif de course se déplace avec ce qu'il protégeait

`fusionnerEtatIA` existait pour qu'une clé relue du coffre survive à la réhydratation. Les clés parties,
le correctif semblait sans objet — mais **`clesPresentes` se remplit exactement de la même façon**,
depuis le coffre, de façon asynchrone. Sans la même précaution, toutes les mentions « configurée » se
seraient vidées quelques instants après l'ouverture, invitant à retaper des clés déjà présentes : *le
geste même qui a failli les perdre en août.*

**La leçon** : *quand on remplace une donnée par sa métadonnée, les défauts de la donnée suivent.*

### 12. ⛔ Résoudre un chemin système n'est pas le lire — c'est le verrouiller

`app.getPath('userData')` **fige** l'emplacement des données pour toute la vie du processus, d'après
le nom de l'application **au moment de l'appel**. Un appel trop tôt ne rend pas un mauvais chemin :
il en impose un, définitivement.

C'est ce qui est arrivé le lendemain du chantier des clés. Pour que le proxy IA lise le même coffre,
le `SecurityManager` est devenu une **instance de niveau module** — et son constructeur résolvait le
chemin. Les imports s'évaluant avant le corps du module, l'appel tombait **1 643 lignes avant** le
`app.name = 'gm-os-v5'` qui devait le précéder. Toutes les données ont basculé sur un profil vide, et
le meneur a trouvé une campagne de démonstration à la place de ses sept.

**Trois choses à retenir, et la troisième est la plus transférable :**

1. *Un singleton exporté est du code qui s'exécute à l'import.* Le `new` de niveau module est
   discret ; c'est le constructeur qu'il faut aller lire.
2. Un chemin système se résout au **premier besoin**, jamais à la construction — un accesseur
   paresseux coûte trois lignes.
3. ⚠️ **Le commentaire qui énonçait la règle vivait dans le fichier qui la respectait.** *Une règle
   écrite là où on la lit ne couvre pas là où on l'enfreint.* Elle est devenue un contrôle, qui la
   tient pour tous les modules importés par `main.ts`.

### 13. Une contradiction entre les traces et le témoignage est un indice

Le diagnostic a suivi cinq questions. Les quatre premières disaient : les sauvegardes ont les sept
campagnes, le magasin vivant a les données de démonstration, sa dernière écriture date de deux jours
**avant** le travail suspect, et le journal prouve que l'application n'a pas tourné depuis.

Cette quatrième réponse semblait innocenter le travail de la veille — et elle **contredisait** ce que
le meneur décrivait : *« j'ai relancé ce matin »*. C'est en cherchant à lever cette contradiction —
« alors où a-t-elle tourné ? » — qu'est apparu le vrai défaut : un second profil, écrit le matin même.

**La leçon** : *quand les traces et le témoignage divergent, c'est qu'on ne regarde pas au bon
endroit.* Le réflexe de conclure « les traces disent que ce n'est pas moi » aurait clos l'enquête sur
la bonne nouvelle et laissé le défaut en place.

### 14. Le premier geste d'un incident de données est une copie, pas un diagnostic

Avant de comprendre quoi que ce soit, trois sauvegardes ont été copiées hors du dossier soumis à
rotation. Ça coûte une seconde, ça ne détruit rien, et ça retire toute urgence au reste de l'enquête —
*on ne diagnostique pas bien quand chaque minute peut coûter la donnée qu'on cherche.*

Corollaire : **annoncer d'abord ce qui est sauf.** Le meneur a eu « tes sept campagnes sont là, voici
où » avant l'explication. L'analyse peut attendre ; l'angoisse, non.

---

## 🧭 Ce qu'on ne peut pas diagnostiquer, et ce qui rend un test complaisant (2026-09-12)

*Une journée de dix chantiers, née d'une séance ratée : une séquence de storyboard qui n'a pas joué,
un écran resté bloqué au démarrage, et des noms d'appareils perdus au rebranchement. Les trois
avaient la même forme — **quelque chose d'invisible**, et rien pour le voir.*

### 1. Un écran que personne n'a nommé ne peut pas être diagnostiqué

- **Défi** : le démarrage se bloquait parfois sur un écran d'attente. Ni le splash ni
  `LoadingOverlay` n'étaient en cause — c'était un troisième écran, « GM-OS BOOTING... », que
  **personne n'avait nommé** et qui n'apparaissait dans aucune discussion.
- **Ce qu'il fallait faire** : nommer les étapes du démarrage, les borner à quinze secondes, et
  poser `isSystemReady` **dans tous les cas**.
- **⛔ Le contrepoids, sans lequel le correctif serait pire que le défaut** : on échange un blocage
  contre un démarrage **amputé**. *Un démarrage dégradé vaut mieux qu'une absence de démarrage* —
  mais il faut alors que l'écran dise quelle étape a manqué, sinon on a remplacé une panne visible
  par une panne silencieuse.
- **⚠️ Piège** : **expirer n'est pas annuler.** Une promesse ne s'interrompt pas — on cesse de
  l'attendre. Ce qu'elle fera plus tard reste à sa charge, et doit être sans effet de bord.
- **Leçon** : *ce qui n'a pas de nom n'a pas de rapport de bogue.* La première réparation d'un état
  invisible est de lui donner un nom, avant même de le corriger.

### 2. Le défaut et l'impossibilité de le diagnostiquer peuvent être le même

- **Défi** : une séquence de storyboard s'est mal exécutée en pleine partie. L'écran qui l'aurait
  expliquée — le Master Storyboard — était **précisément celui qu'on ne pouvait pas ouvrir en
  séance** : classé « préparation », il renvoyait au cockpit à chaque tentative.
- **Leçon** : le storyboard est le seul écran de préparation **dont le contenu sert pendant qu'on
  joue**. Une classification qui vaut pour tous les autres le faisait disparaître au moment où il
  sert. *Une règle juste appliquée à un cas qu'elle n'avait pas prévu produit exactement l'inverse
  de son intention.*
- **⭐ Méthode** : le journal de l'application a tranché **avant toute hypothèse** — aucun `error`,
  aucun `warn`. *Regarder les traces coûte deux minutes et écarte la moitié des suppositions.*

### 3. Un lecteur et un écrivain qui n'emploient pas la même clé sont pires que deux écrivains

- **Défi** : David — *« est-il possible de garder les noms que j'attribue aux sorties audio et aux
  écrans quand je rebranche ? »* Les noms étaient **persistés**, mais rangés sous l'identifiant que
  le système réattribue à chaque branchement. *Le nom était toujours là ; GM-OS cherchait ailleurs.*
- **Solution** : une **signature stable** de l'appareil, et non son identifiant de session.
- **⚠️ Ce qu'on échange, exactement** : on n'échange pas un identifiant faux contre un identifiant
  vrai — **on échange un identifiant instable contre un identifiant stable.** La nuance compte :
  l'ancien n'était pas faux, il était périssable.
- **⛔ Et la moitié du correctif manquait** : l'écriture est passée à la nouvelle clé, **pas la
  lecture des champs de saisie**. Un champ contrôlé dont la valeur ne change jamais **refuse la
  frappe** — indiscernable d'un champ en lecture seule. *Deux écrivains divergent bruyamment ; un
  lecteur et un écrivain désaccordés ne font aucun bruit du tout.*
- **Corollaire d'essai** : trente-six tests avaient été écrits sur la signature, la migration et la
  résolution — **la mécanique**. Aucun ne faisait l'aller-retour du meneur : taper un nom, le
  relire. *C'est le seul qui aurait vu le défaut.*

### 4. Un jeu d'essai qui se dégrade laisse les tests verts

- **Défi** : figer une base de données témoin pour éprouver les migrations et le démarrage.
- **⛔ Le piège central** : `campaigns.length > 0` **n'est pas un signal d'hydratation**. Le magasin
  naît avec `INITIAL_DATA` — *une base neuve n'est jamais vide*, donc un profil vide affiche une
  campagne de démonstration, et une garde qui refuse tout ressemble à une garde qui marche.
- **⛔ La leçon qui vaut au-delà** : si le témoin cesse un jour de passer la porte qu'on croit tester
  — parce qu'un champ a changé de nom, parce qu'un chemin s'est déplacé — **les tests restent
  verts**. Un jeu d'essai doit donc porter sa propre garde : *un test qui ne peut plus échouer ne
  prouve plus rien, et rien ne le dit.*
- **⭐ Corollaire** : le **test de contrôle** compte autant que l'autre. Une seconde instance
  démarre **sans** semence, et vérifie qu'elle ne voit pas ce que la première voyait.
- **⭐ Et on ne fabrique pas une vieille base : on en gèle une jeune.** Fabriquer un format ancien,
  c'est écrire de mémoire ce qu'on croit qu'il était.

### 5. Sonder avant d'écrire — on ne devine ni un nom de champ, ni une unité, ni une forme

- **Défi** : écrire un test de bout en bout par module, sur une application dont chaque écran a son
  vocabulaire.
- **⭐ Cinq surprises de forme dans un seul lot, et toutes ont fait accuser le code avant le test** :
  `campagneId` en français au milieu de champs anglais · `autoFadeDuration` en **millisecondes** là
  où l'écran affiche « 5.0 s » · les scènes de Light-OS rangées en **objet indexé** et non en
  tableau · un libellé **en minuscules dans le DOM** et en majuscules à l'écran (c'est la CSS) · et
  une demande de nom qui ouvre un **modal interne**, pas une invite du navigateur.
- **Leçon** : chaque module demande une **sonde jetable** avant le premier test — lire les libellés,
  la forme des données, les unités. *Trente secondes de sonde évitent une demi-heure d'accusation.*
- **⛔ Et l'inverse est vrai aussi** : un test qui contredit le code n'a pas forcément raison.
- **⚠️ Ce qu'aucun de ces tests ne dira** : une instance d'essai n'a ni média, ni clé d'API, ni
  corpus. *Écrire des tests qui prétendraient les couvrir donnerait une couverture décorative.* Ce
  qui reste vaut pourtant : **un vide muet se lit comme une panne**, donc l'état vide se teste.

### 6. Tant qu'un service répond, une boucle fautive ne se voit pas

- **Défi** : GM-OS devenait inutilisable hors de chez soi. La cause : un cycle de découverte du pont
  Hue qui **s'arrête au premier succès** — donc, tant que le pont répond, personne ne voit qu'il
  n'a pas de porte de sortie.
- **⭐ Le remède, et sa moitié visible** : on s'arrête, **et on le dit**. Le meneur doit pouvoir
  distinguer *« je n'ai pas essayé »* de *« le pont ne répond pas »*.
- **⚠️ L'honnêteté du compte rendu** : il n'a **pas** été prouvé que cette boucle causait l'écran
  bloqué. Deux défauts trouvés le même jour dans la même zone ne sont pas forcément le même défaut.
  *Rapprocher deux symptômes est une hypothèse, pas une conclusion.*

---

## 🎞️ Ce qu'une fonctionnalité neuve apprend sur l'ancienne (2026-09-13/14)

*Deux demandes de David — « Échap ne ferme pas les Paramètres » et « créer des diaporamas avec un
fondu entre chaque image ». La première a rendu une famille de trente écrans ; la seconde a servi de
banc d'essai à du code livré depuis des mois, et en a sorti quatre défauts.*

### 1. Une famille de défauts se compte avant de se traiter — et le comptage trouve autre chose

- **Défi** : le défaut était signalé sur **un** écran, les Paramètres. La ligne avait été différée
  la veille avec un motif précis : *le nombre d'écrans dans ce cas n'a pas été compté.*
- **Ce que le comptage a rendu** : 40 fichiers en `fixed inset-0`, 12 parlant d'`Escape`, et la
  moitié de ces douze l'écoutaient sur un **champ de saisie**, pas sur la surcouche. Les Paramètres
  n'étaient pas un écran mais **une trentaine** — toutes servies par le même `ModalProvider`.
- **⛔ Et une seconde face que personne ne cherchait** : la garde du clavier partagée par Sound-OS,
  Music-OS et Light-OS repérait les « boîtes ouvertes » par `[role="dialog"]`, présent dans **deux**
  fichiers côté meneur. Médiathèque ou Forge ouvertes, une lettre frappée lançait encore la pastille
  de son et la scène de lumière, en pleine séance.
- **Leçon** : *une garde qui dépend d'un attribut qu'il faut penser à poser ne protège que les
  écrans dont l'auteur connaissait la garde.* Les deux faces se sont refermées avec une seule pièce
  — un registre des surcouches ouvertes — parce que les deux posaient la même question : **qu'est-ce
  qui est ouvert, et dans quel ordre ?**
- **Corollaire** : *un motif de renvoi qui dit ce qui manque est un motif qui se lève ; « plus
  tard » ne se lève jamais.*

### 2. Une fonctionnalité nouvelle est un banc d'essai pour l'ancienne

- **Ce qui s'est passé** : les diaporamas ont enchaîné des images toutes les six secondes. En deux
  jours ils ont révélé **quatre défauts antérieurs**, tous invisibles jusque-là :
  1. le fondu entre deux images **passait par le noir** des deux côtés — sortante démontée au
     projecteur, `mode="wait"` au Player Hub (trois secondes de noir) ;
  2. **Image-OS n'était dans aucune sauvegarde**, ni pads ni dossiers — quatrième fois que cette
     liste oublie un magasin ;
  3. le fondu **s'animait sur du vide** (voir § 3) ;
  4. une `<img>` sans `w-full h-full` **gardait sa taille naturelle** : `object-contain` ne décide
     rien sur une boîte sans dimension, et `max-w-[95%]` ne fait que plafonner.
- **Leçon** : *un meneur qui projette une image toutes les deux minutes ne peut voir aucun de ces
  défauts ; un diaporama les montre quatre-vingt fois par heure.* **Une cadence rend visible ce
  qu'un geste isolé dissimule.**
- **Corollaire de conception** : l'horloge du diaporama vit **dans la fenêtre du meneur** et
  n'envoie que des projections d'image ordinaires. *Le projecteur, le Hub, les tablettes, le pont
  IPC et la sauvegarde n'ont rien eu à apprendre* — une fonctionnalité greffée sur un chemin
  existant hérite de tout ce qui y marche déjà.

### 3. Une transition qui démarre avant son sujet joue à vide

- **Défi** : David, après essai — *« un temps mort, puis un saut »*, sur les deux écrans.
- **La cause** : **l'adresse d'une image arrive avant l'image.** `useMediaUrl` rend un `data:`
  base64 sorti d'IndexedDB, que le navigateur doit encore **décoder**. L'animation d'opacité partait
  à la seconde où l'adresse arrivait, donc sur un cadre vide : on voyait l'ancienne image immobile,
  puis la nouvelle apparaître d'un coup à mi-fondu.
- **Solution** : décoder d'abord, n'annoncer l'image qu'ensuite. *Le remède est de **retarder** le
  fondu, pas de l'allonger.*
- **⚠️ Piège** : `onload` ne suffit pas — il dit que les octets sont là, pas qu'il y a des pixels.
  C'est `decode()` qui attend la seconde étape, et c'est elle qui coûte.
- **Ce qu'on accepte en échange** : une image lourde s'affiche un instant plus tard — mais **en
  fondu**. *Le temps mort existait déjà ; il était pris sur le fondu au lieu d'être pris avant lui.*

### 4. L'ordre de deux couches superposées se dit, il ne se devine pas

- **Défi** : *« le fondu de la première image fonctionne, mais après je n'ai pas de fondu entre les
  images suivantes »*. Ce défaut-là venait du correctif de la veille, pas d'un code ancien.
- **La cause** : les deux couches portaient la même `relative z-10` sur leur image. Mais la couche
  **entrante anime son opacité**, ce qui lui **crée un contexte d'empilement** : son `z-10` y reste
  enfermé, et elle-même ne vaut que `z-auto`. La sortante n'anime rien, donc n'en crée aucun — *son
  `z-10` s'échappe et écrase le `0` de sa sœur.* **L'ancienne image passait par-dessus la nouvelle
  pendant tout le fondu**, qui jouait entier, caché.
- **Leçon** : un `z-index` implicite dépend de **qui crée un contexte d'empilement**, donc d'une
  animation, d'une opacité, d'un filtre — **des propriétés qu'on change pour des raisons visuelles,
  sans penser à l'ordre.** Les couches portent désormais `z-0` / `z-10` en toutes lettres, sur les
  deux écrans, y compris celui où le défaut n'existait pas encore.
- **⭐ Leçon de méthode** : *un défaut d'empilement se mesure, il ne se raisonne pas.* Quatre
  hypothèses ont été écartées par une seule mesure — `elementFromPoint` au centre du cadre, en plein
  fondu, dans le moteur de rendu d'Electron : `ancienne` sans les `z-index`, `nouvelle` avec.

### 5. Une garde qui lit des noms doit lire du code, pas des commentaires

- **Défi** : la garde écrite pour empêcher le retour d'un défaut de nommage **se validait sur sa
  propre documentation** — le commentaire qui explique le défaut citait la fonction qu'elle
  cherchait. Avec le défaut remis, elle restait verte.
- **Deuxième piège du même fichier** : elle cherchait la **forme** du code (le sélecteur Zustand) et
  ne voyait pas le composant qui déstructure le magasin. *Sa propre liste de dispenses l'a
  dénoncée : elle dispensait un fichier qu'elle ne trouvait même pas.*
- **Leçon** : troisième occurrence de ce motif après `nomsSansEcrivainNiLecteur`. **Une garde qui
  lit des noms ne peut pas lire des intentions — mais elle peut au moins ne lire que du code**, et
  chercher **le geste** plutôt que la manière de l'écrire.

### 6. Le meneur qui décrit ce qu'il voit désigne la cause

- **Les trois retours de David, dans l'ordre** : *« cela marche, à part le fondu »*, puis *« un
  temps mort puis un saut »*, puis *« la première image fond, les suivantes non »*.
- **Ce qu'ils valaient** : le premier a séparé le livrable du défaut ; le deuxième a nommé le
  décodage ; **le troisième a nommé la couche qui n'existe pas au premier tour** — sans rien savoir
  du code. *Un symptôme qui distingue le premier cas de tous les autres désigne ce qui manque au
  premier tour.*
- **Leçon** : quatre mille tests n'ont vu aucun des trois. *Tous les défauts d'affichage de ce dépôt
  ont été trouvés à l'écran, aucun par relecture* — et la formulation du meneur vaut mieux qu'une
  pile d'appels, à condition de la lire comme un indice et non comme une plainte.

## 🔌 Ce qui accueille sans répondre, et les règles qui ne protègent que leur fichier (2026-09-14, au soir)

*Trois signalements de David dans la même soirée, tous formulés comme des surprises d'écran :
« la tablette pointe vers Eternal Quest », « les cartes restent visibles », « je voudrais échanger un
PJ ». Les deux premiers étaient des défauts qu'aucune relecture n'aurait trouvés, et le troisième a
surtout appris pourquoi il n'y avait presque rien à écrire.*

### 1. Un refus se voit ; un silence poli ne se voit pas

- **Défi** : la tablette affichait « The Eternal Quest », une campagne de démonstration, au lieu de
  celle du soir. Le symptôme ressortait **à l'autre bout de l'application** — dans le nom d'une
  campagne — alors que la cause était un port.
- **La cause** : le QR-code écrivait le port **applicatif** (celui de Vite en développement) et non
  celui du `SyncServer`. La tablette ouvrait sa WebSocket sur le serveur de rechargement à chaud.
- **⭐ Mesuré avant d'être annoncé**, une WebSocket ouverte sur chacun des deux ports :
  `ws://…:3001` répond `remote:registered` aussitôt ; `ws://…:5173` **reste ouverte et ne dit rien
  en quatre secondes**.
- **Leçon** : *Vite accepte la connexion et ne répond jamais.* Une connexion **refusée** aurait mis
  la tablette en reconnexion toutes les cinq secondes, icône barrée, et David aurait su quoi
  signaler. Accueillie et ignorée, elle s'affichait **connectée** et n'avait rien à dire.
  **Entre un refus et un silence, c'est le silence qui coûte cher.**
- **⛔ Corollaire de diagnostic, à garder** : *« The Eternal Quest » sur un écran veut dire qu'il n'a
  jamais reçu l'état du meneur.* C'est `INITIAL_DATA`, que porte tout magasin neuf. On cherche alors
  le **transport**, jamais les campagnes — une base neuve n'est jamais vide.

### 2. Une déduction juste dans un régime et muette dans l'autre est pire qu'une valeur absente

- **Ce qui était écrit**, et qui était vrai : *« la tablette charge l'application depuis le
  SyncServer lui-même, donc son `window.location.port` EST le port de synchronisation. »*
- **Vrai en production, faux dès que Vite sert la page** — et le QR-code l'y envoyait exprès, pour
  garder le rechargement à chaud.
- **Leçon** : une valeur absente se rattrape par un repli ; **une valeur fausse et plausible ne se
  rattrape pas**, parce que rien ne la signale. *Quand une valeur ne peut pas être déduite dans tous
  les régimes, on la **dit*** — d'où l'adresse qui porte désormais ses deux ports.
- **⚠️ Et on l'écrit même là où elle est redondante** : en production les deux ports sont le même
  nombre. *Rendre le paramètre conditionnel n'aurait fait qu'ajouter un cas où il peut manquer.*

### 3. Une règle énoncée dans un commentaire ne protège que le fichier qui la porte

- **Défi** : c'était la **troisième** fois que `port` et `mediaPort` étaient confondus — après le
  proxy des médias, puis le pont des boutons de l'afficheur (12/09, trouvé par David le lendemain).
- **⛔ Et la phrase qui l'interdisait était déjà écrite**, depuis la veille, à trois lignes de là :
  *« la seule défense est de ne composer cette adresse qu'ici »*. Elle était juste. Deux autres
  écrans composaient la leur à la main, deux dossiers plus loin.
- **Leçon** : un commentaire documente une décision ; il n'en étend pas la portée. **Ce qui porte
  une règle au-delà de son fichier, c'est une garde** — ici, un balayage du dépôt qui refuse tout
  `?window=tablet|remote` écrit en toutes lettres.
- **⭐ Et elle a mordu à sa première exécution**, sur un fichier que je venais de corriger à moitié
  en y laissant l'ancienne adresse comme repli. *Une garde écrite après coup trouve d'abord les
  oublis de son propre auteur.*

### 4. Deux lecteurs d'une même liste, dont un seul connaît la règle

- **Défi** : David — *« j'ai désactivé les cartes pour Blade Runner mais elles restent visibles dans
  la tablette »*. Il avait sorti un paquet du jeu.
- **La cause** : la bibliothèque du meneur filtrait par **jeu**, la tablette seulement par
  **ouverture aux joueurs**. Le paquet quittait donc le seul écran où l'on aurait pu le voir
  disparaître.
- **Leçon** : *le défaut n'était pas une règle fausse — c'était une règle que le second lecteur ne
  connaissait pas.* Deuxième occurrence dans Deck-OS après la liste « Donner à », qui ignorait la
  campagne **et** la connexion.
- **⛔ Ce que cela change pour la garde** : vérifier que la fonction est juste n'aurait rien
  protégé. **Ce qu'il faut interdire, c'est le second filtrage écrit à la main.**
- **⚠️ Un piège de nommage, à connaître** : le champ s'appelle **`system` sur la campagne** et
  **`systemId` sur le paquet**. Deux noms pour la même chose, et c'est exactement ce qui fait écrire
  une comparaison avec `undefined` — toujours fausse, donc une liste vide que personne ne sait
  expliquer.
- **⭐ Et on filtre ce qu'on propose, pas ce qu'on transporte** : le meneur continue de diffuser
  tous les paquets, sans quoi une carte tenue dont le paquet a changé de jeu n'aurait plus d'image.

### 5. Ce qui ne porte pas de clé étrangère n'a rien à réécrire

- **Défi** : faire passer un personnage d'un joueur à un autre.
- **⭐ Ce que le modèle a rendu** : un `PlayerCharacter` **ne porte aucun `playerId`**. Il appartient
  à celui dans la liste de qui il se trouve. Déplacer l'entrée suffit — et comme son identifiant ne
  bouge pas, la fiche, les notes privées, l'inventaire, sa place dans la séance (`sessionEntityIds`
  contient des ids de **personnages**) et les cartes qu'il tient (`porteur`) suivent seuls.
- **Leçon** : *un transfert qui renumérote a tout à réécrire ; celui qui garde l'identifiant n'a
  rien à réécrire.* La conception ne consistait pas à ajouter du code, mais à **reconnaître qu'il
  n'y en avait pas à ajouter** — et à l'écrire, sinon quelqu'un « complétera » un jour ce qui n'a
  rien d'incomplet.
- **⚠️ Le seul fil qui ne suit pas, et pourquoi aucune écriture ne le règle** : le verrou
  d'appareil n'est pas un champ, c'est le **reflet** des clients connectés, recalculé à chaque
  changement de la liste. *On ne défait pas un reflet ; on le dit.* Choix de David : prévenir, sans
  éjecter.

### 6. Lire les données du meneur remplace trois hypothèses

- **Ce qui s'est passé** : les deux défauts ont été compris **avant** d'ouvrir un écran, dans la
  sauvegarde automatique du soir — la campagne active y était nommée, ses sept sœurs aussi, et le
  paquet resté ouvert y portait l'identifiant du pilote Blade Runner alors qu'il s'appelle
  « Torg Action ».
- **Leçon** : *deux minutes de lecture de données écartent la moitié des suppositions* — c'est le
  même geste que « regarder les traces avant de formuler une hypothèse », appliqué à l'état plutôt
  qu'au journal. La sauvegarde automatique, écrite pour le filet, sert aussi de **sonde**.
- **⚠️ Et elle dit aussi ce qu'elle ne contient pas** : `activeCampaignName` n'y est pas — il n'est
  pas persisté. Un champ absent d'une sauvegarde est un champ qui ne survit pas au redémarrage, et
  la sauvegarde est le seul endroit où cela se lit d'un coup d'œil.

## ⏳ Ce qu'un instrument raconte quand personne ne lui a dit dans quel sens le lire (2026-09-15)

*Chantier : le § 66 du registre — une jauge de Clock-OS qui se vide.*

### 1. Le mécanisme était là ; c'est le SENS qui manquait

David demandait « une jauge qui diminue ». **Descendre une jauge était possible depuis toujours** :
shift-clic et clic droit font `−1`, et un bouton « remplir d'un coup » avait même été posé deux
semaines plus tôt *« pour un instrument qui se vide »*.

Ce qui manquait n'était pas un geste, c'était que **rien autour de la jauge ne savait qu'elle se lit
à l'envers** : elle naissait vide, son alarme se déclenchait au plein, son clic facile allait dans le
mauvais sens, et le compte rendu la relisait à contresens.

- **Leçon** : *quand une demande porte sur un comportement qui existe déjà à moitié, ce n'est pas la
  fonction qui manque — c'est l'intention, et elle manque à TOUT ce qui entoure la fonction.* La
  bonne question n'était pas « comment faire descendre une jauge » mais « qu'est-ce qui, dans
  l'application, croit savoir ce que cette jauge raconte ? »

### 2. Un instrument qui crie au mauvais moment est pire qu'un instrument muet

Sur des provisions, l'écran teintait en rouge, faisait pulser le compte et échapper un cercle
**quand elles étaient pleines** — c'est-à-dire à la bonne nouvelle. Et au zéro, le seul moment qui
compte, il ne disait rien.

- **Leçon** : *une alarme fausse ne se corrige pas toute seule dans la tête de celui qui la regarde ;
  il apprend à ne plus la regarder.* Une alarme silencieuse coûte une information, une alarme
  inversée coûte l'instrument.

### 3. Le comptage des lecteurs a trouvé un cinquième que la demande ne nommait pas

Quatre écrans dessinent une jauge, un cinquième la relit dans le compte rendu. Le compte les a tous
sortis — et le cinquième, l'afficheur Ulanzi, portait **sa propre** comparaison, `remplis >= total`,
sous une autre orthographe que celle du rendu React. Des rations à zéro seraient restées orange au
milieu de la table pendant que l'écran du meneur criait — **et personne ne l'aurait rapproché du
premier défaut**, puisqu'il aurait été corrigé.

- **Leçon** : *une même règle écrite sous deux vocabulaires ne se trouve pas par recherche de texte
  — elle se trouve en comptant les lecteurs.* C'est la sixième fois que « qui d'autre lit ça ? »
  rapporte plus que la lecture du code concerné.
- **Le corollaire, posé en garde du dépôt** : la comparaison ne s'écrit plus qu'à un endroit. ✅ La
  garde a fait ses preuves **dans l'heure** — elle a pointé le rendu React avant que je l'aie
  corrigé.

### 4. ⛔ Un commentaire qui énonce un fait sur le reste du système se périme sans prévenir

En cherchant où brancher l'usure de fin de scène, j'ai trouvé un bouton « Fin de scène » écrit le
2026-08-15 sous ce commentaire :

> *« Rien dans l'application ne sait quand une scène se termine : c'est le meneur qui le décide. »*

C'était **juste, honnête, et documenté**. La trame est arrivée **deux jours plus tard**, avec un vrai
passage de fin de scène. Depuis un mois, l'application sait — et ce bouton ne l'écoute pas.

- **Leçon** : *un commentaire qui décrit son propre fichier vieillit avec lui ; un commentaire qui
  affirme quelque chose sur le RESTE du système devient faux sans que son fichier bouge.* Rien ne
  l'aurait signalé : il a fallu qu'une fonctionnalité nouvelle vienne chercher exactement ce fait.
- **Et le réflexe qui va avec** : quand on trouve un geste manuel justifié par « l'application ne
  sait pas », **vérifier la date** et redemander si c'est encore vrai.

### 5. Un automatisme muet est indistinguable d'un bogue

L'usure de fin de scène est la seule chose du logiciel qui fasse bouger une jauge **sans que
personne n'ait cliqué dessus**. Sans annonce, le meneur retrouverait ses rations à trois sans savoir
quand elles sont passées de cinq — et chercherait un défaut.

- **Leçon** : *tout état qui change sans geste doit dire qu'il a changé, et pourquoi.* Le coût est
  d'une ligne ; l'économie est une soirée de soupçon.

### 6. Deux gestes idempotents ne composent pas en un geste idempotent

Fermer une scène est idempotent — une scène déjà close se rend telle quelle. L'usure, elle, ne l'est
pas. Les brancher naïvement aurait fait manger **une seconde ration** à chaque reclic sur
« Terminer », en silence.

- **Leçon** : *l'idempotence ne se propage pas à l'effet de bord qu'on accroche à une action
  idempotente* — c'est à la couture de vérifier que la transition a vraiment eu lieu, pas à
  l'action de le promettre.

### 7. ⚠️ Un `dist/` périmé rend sept essais verts sur le code d'hier

J'ai lancé `npx playwright test` au lieu de `npm run test:e2e`. **Sept essais sont passés au vert** —
sur le paquet de la veille — et les trois nouveaux ont échoué en cherchant un bouton qui existait
bel et bien dans les sources. Le piège est **écrit noir sur blanc** dans `lancerGmOs.ts` : *« un
`dist/` périmé ferait passer des tests sur du code d'hier »*.

- **Leçon** : *un avertissement lu n'est pas un avertissement appliqué.* Et le mode d'échec est le
  pire : **des verts faux**, qui ne signalent rien.
- **Le réflexe** : pour les E2E, toujours `npm run test:e2e`, jamais `npx playwright test` seul.

---

## 🧊 Le gel — le seul mode d'échec qu'aucun garde-fou d'exécution ne rattrape (2026-09-15, au soir)

*Chantier : le § 67 du registre — l'Atelier des calendriers.*

### 1. ⛔ Une boucle synchrone ne se laisse pas interrompre — pas même par un `timeout`

Un calendrier sans mois mettait `getFantasyDate` en boucle infinie. J'ai posé la garde, écrit les
tests avec un `timeout: 3_000` sur chacun, puis **dégradé la garde pour vérifier qu'ils rougissaient**.

Ils n'ont pas rougi : **ils ont pendu.** Il a fallu tuer vitest de l'extérieur après deux minutes.

- **Leçon** : *le délai d'un test ne protège de rien face à une boucle synchrone.* Elle ne rend pas
  la main à l'ordonnanceur, donc rien ne peut l'interrompre — ni vitest, ni un navigateur, ni un
  superviseur. **Un gel n'est pas une lenteur** : c'est le seul mode d'échec qui échappe à tous les
  garde-fous d'exécution. On ne peut que l'empêcher d'entrer.
- **Et le corollaire de conception** : quand un défaut peut geler, **le contrôle cesse d'être le
  confort du module et en devient la condition**. C'est ce qui a décidé de l'ordre des choses — le
  socle pur et sa garde d'abord, l'écran ensuite.
- ⚠️ **J'avais écrit l'inverse dans le test** (« le délai transforme le gel en échec lisible »).
  C'est la dégradation qui m'a détrompé, pas la relecture. *Un commentaire qui explique pourquoi une
  précaution marche est une hypothèse tant qu'on ne l'a pas cassée exprès.*

### 2. Une fonctionnalité absente et une fonctionnalité inaccessible se ressemblent beaucoup

**Un seul calendrier existait** dans le dépôt, livré d'usine, après un mois de construction. La
tentation était d'en conclure que David ne se servait pas des calendriers. Le comptage disait autre
chose : **il n'existait aucun chemin d'écriture.** Deux canaux IPC, `list` et `load`, et rien d'autre.

- **Leçon** : *avant de conclure qu'une fonctionnalité ne sert pas, vérifier qu'elle est atteignable.*
  Un usage à zéro mesure parfois le coût d'entrée, pas l'intérêt. C'est le même constat que pour les
  46 tables tapées à la main la veille.

### 3. ⛔ Un champ renseigné que rien ne lit est un mensonge patient

`harptos.json` déclare `currentYear: 1492`. **Aucun lecteur dans tout le dépôt** : la date venait de
l'horloge système, et choisir Harptos affichait **l'an 56**. Pareil pour `daysPerWeek`, *requis par
le type et absent du seul fichier qui existe*.

- **Leçon** : le motif habituel est « un champ que rien ne renseigne » ; **celui-ci est l'inverse, et
  il est pire.** Un champ vide se remarque ; un champ rempli **a l'air d'une fonctionnalité**, et
  personne ne vérifie ce qui a l'air de marcher.
- **Ce qui le trouve** : compter les lecteurs, pas lire le fichier. `grep currentYear` a suffi.

### 4. ⭐ Un registre de ce qui ne sert à rien vaut surtout par le moment où il se vide

`nomsSansEcrivainNiLecteur` tient la liste des noms déclarés dans les magasins que personne ne lit.
Il a **rougi tout seul** à la fin du chantier : cinq de ses tolérances — `daysOfWeek`, `hoursPerDay`,
`minutesPerHour`, `daysPerWeek`, `loadCalendar` — étaient devenues inutiles, et il demandait qu'on
les retire.

- **Leçon** : *un test qui énumère le mort n'est pas une dette, c'est un capteur.* Il ne dit pas
  seulement « ceci ne sert à rien » ; il dit aussi, sans qu'on le lui demande, **« ceci vient de
  servir »** — et il nomme exactement ce que le chantier a fait vivre.

### 5. Deux règles de nommage aux deux bouts d'un pont

J'ai écrit la fabrique du nom de fichier **deux fois** : côté renderer pour l'afficher, côté principal
pour écrire. Les deux copies étaient identiques à la lettre le jour même — et c'est exactement le
motif que je passe mes journées à dénoncer.

- **La correction n'est pas « factoriser », c'est SÉPARER LES RÔLES** : le renderer **produit**
  l'identifiant, le processus principal **valide** le chemin — ce que lui seul peut faire, et ce que
  le renderer ne doit surtout pas refaire. *Chacun garde ce qu'il est seul à pouvoir garder.*
- **Leçon** : quand la même règle apparaît des deux côtés d'une frontière, la question n'est pas
  « où la mettre en commun » mais **« laquelle des deux n'avait pas à exister »**.

---

## 🎉 Ce qu'on attache à quoi, et les sélecteurs qui se cassent en silence (2026-09-15, tard)

*Chantier : le § 68 du registre — les jours de fête.*

### 1. ⭐ Attacher à l'objet plutôt qu'à son index

Le premier réflexe était de poser les fêtes sur le calendrier, avec un index de mois. **Un index se
désynchronise dès qu'on déplace un mois** — et l'Atelier a justement des flèches pour ça : les fêtes
de Hammer se seraient retrouvées dans Alturiak, **sans que rien ne le signale**.

Attachées au mois lui-même, elles le suivent quand il bouge et disparaissent avec lui.

- **Leçon** : *quand une donnée désigne une autre par sa POSITION, toute opération qui réordonne
  devient une source de corruption muette.* La bonne question n'est pas « comment garder les index
  à jour » mais **« qu'est-ce qui, attaché au bon endroit, rendrait la question inutile »**. C'est
  le même geste que le dé choisi dans une liste : *rendre le défaut impossible à écrire plutôt que
  de le signaler.*

### 2. Deux choses qui se ressemblent ne sont pas deux façons d'écrire la même chose

Un mois hors calendrier d'un jour et une fête déclarée dans un mois **ont l'air d'un doublon**. Ils ne
le sont pas : l'un n'a ni numéro de jour ni jour de semaine, l'autre a les deux.

- **Leçon** : la tentation est de fusionner. *Le test qui tranche n'est pas « est-ce que ça se
  ressemble » mais « est-ce que ça se comporte pareil partout »* — et ici la réponse était non sur
  deux points. On les garde distincts, et **on signale quand l'auteur les mélange** plutôt que de
  choisir à sa place.

### 3. ⛔ `null` comme réponse, pas comme échec

Un jour hors calendrier **n'a aucun jour de semaine**. Le calcul en inventait un ; il rend désormais
`null`, et l'écran omet la mention.

- **Leçon** : *une fonction qui doit toujours répondre quelque chose finit par répondre n'importe
  quoi.* Quand la question n'a pas de sens pour certaines entrées, le type doit le dire — sinon
  c'est l'appelant qui hérite d'un mensonge plausible.

### 4. ⛔ `getByRole(role, { name })` cherche une SOUS-CHAÎNE

Le bouton des mois s'appelle « Ajouter ». J'ai ajouté un bouton « Ajouter une fête au mois 1 ».
**Quatre essais E2E sont tombés d'un coup** sur une violation du mode strict — le premier sélecteur
en trouvait deux.

- **Leçon** : *un sélecteur par nom se casse quand un AUTRE nom commence pareil*, et rien ne le dit
  avant l'exécution. Le réflexe : `exact: true` dès qu'un libellé est un préfixe plausible.
- **Et le symptôme trompe** : l'erreur pointe l'essai qui échoue, pas le libellé qu'on vient
  d'ajouter ailleurs.

### 5. ⚠️ Une `<option>` dans un `<select>` fermé n'est jamais « visible »

`waitFor()` attend l'état *visible* par défaut. Il a tourné trente secondes sur un élément bel et
bien présent dans le DOM.

- **Leçon** : pour ce qui existe sans être affiché, c'est `{ state: 'attached' }` — ou
  `toBeAttached()`, que l'essai voisin utilisait déjà correctement. *J'avais le bon motif sous les
  yeux et j'en ai écrit un autre.*

---

## 🪢 Un filet qui ne se déclenche pas (2026-09-15, tard)

*Chantier : le § 69 du registre — `databases/` dans une sauvegarde.*

### 1. ⛔ La question n'est pas « où ranger la copie » mais « qui la déclenche »

Le réflexe était d'ajouter `databases/` à la sauvegarde automatique. **Elle ne serait jamais
partie** : elle se déclenche deux minutes après un changement d'**état de session**, or écrire une
table passe par l'IPC et ne touche aucun magasin.

- **Leçon** : *un filet qui ne se déclenche pas est pire qu'un filet absent — on croit l'avoir.*
  Avant de choisir le format d'une sauvegarde, vérifier **ce qui la réveille**, et si cet événement
  se produit vraiment quand la donnée change.
- **Et le corollaire** : il a fallu **deux** déclencheurs, parce qu'il y a deux façons d'écrire dans
  ce dossier — par l'application, et **à la main**, qui est la seule qui ait existé pendant des mois.
  *Compter les écrivains avant de brancher le déclencheur, comme on compte les lecteurs avant de
  changer une règle.*

### 2. Un dossier en lecture seule n'a pas besoin de filet — jusqu'au jour où si

`databases/` n'était dans aucune sauvegarde, et ça n'avait jamais posé de problème : c'était du
contenu livré, qu'un `git checkout` rendait. **Les deux Ateliers ont changé sa nature en deux jours**,
sans que rien ne signale que sa couverture venait de disparaître.

- **Leçon** : *ajouter une écriture à un endroit qui n'en avait pas, c'est créer un trou de
  sauvegarde le jour même.* Le réflexe manquant : quand on branche une écriture sur un dossier,
  demander **tout de suite** qui le sauvegarde.

### 3. ⚠️ Comparer le contenu, jamais les dates

Un miroir incrémental doit décider ce qui a changé. La date de modification est le réflexe — et
c'est un piège : elle se perd à la copie, se décale d'un système de fichiers à l'autre, et **remonte
le temps** quand on restaure un fichier plus ancien.

- **Leçon** : *un miroir qui se fie aux dates finit par croire à jour ce qui ne l'est pas —
  silencieusement.* Comparer les octets quand le volume le permet ; ici 1,3 Mo, et la taille écarte
  presque tout avant qu'on lise un octet.

### 4. ⛔ Une dégradation lancée sur un seul essai ne prouve rien

J'ai débranché le miroir et relancé **l'essai concerné seul**, avec `-g`. Il a rougi — mais pour la
mauvaise raison : l'essai qui écrit le calendrier ne tournait pas non plus, donc **rien n'avait été
écrit du tout**. L'absence de miroir ne prouvait rien.

- **Leçon** : *une dégradation doit être rejouée dans le même contexte que le vert qu'elle
  conteste.* Relancé sur le fichier entier : l'essai d'écriture vert, celui du miroir rouge — là,
  ça dit quelque chose.
- ⚠️ C'est la **deuxième fois de la journée** qu'une dégradation manque de me tromper : la
  précédente n'avait pas rougi, elle avait pendu.

---

## 🖼️ Brancher un quatrième chemin fait relire les trois autres (2026-09-16, nuit)

*Chantier : le § 70 du registre — le générateur d'image sur les indices.*

### 1. ⭐ Ajouter le quatrième, c'est l'occasion de compter les trois premiers

La demande était simple : brancher le générateur sur les indices. En regardant où le brancher, j'ai
trouvé **trois chemins déjà branchés qui échouaient tous en silence** — `console.error` et rien
d'autre, alors que `gmToast` était importé vingt lignes plus haut et servait dans le même fichier.

- **Leçon** : *le moment où l'on ajoute le N-ième exemplaire d'un motif est le seul moment où l'on
  regarde les N−1 autres ensemble.* C'est là qu'une divergence saute aux yeux — et c'est pour ça
  qu'il faut lire les frères avant d'écrire le nouveau, jamais après.
- **Et la correction change de forme** : ce n'était plus « ajouter un toast au quatrième » mais
  **« faire passer les quatre par une couture unique »**. La quadruple copie du `try/catch/finally`
  disparaît au passage — ce n'était pas le but, c'est ce qui rend la correction durable.

### 2. Deux copies de la même donnée, dont une seule reçoit l'écriture

Le formulaire des indices garde l'indice en **état local** ; la génération écrit dans le **magasin**.
Sans resynchronisation, l'image serait bien arrivée — sur l'indice enregistré — **mais le meneur ne
l'aurait pas vue**, et il l'aurait crue perdue.

- **Leçon** : ce dépôt trouve d'ordinaire *plusieurs écrivains pour une même donnée*. **Voici la
  variante symétrique** : *deux copies de la même donnée, dont une seule reçoit l'écriture.* Le
  symptôme est le pire qui soit — *ça a marché, et l'écran dit le contraire.*
- **Ce qui l'attrape** : avant de brancher une action sur un formulaire, demander **où vit la
  vérité pendant que le formulaire est ouvert**.

### 3. ⚠️ Un registre visuel est un choix d'auteur, pas un détail de prompt

Les trois générateurs existants demandent une *illustration*. Un indice est **un objet qu'on pose
devant un joueur** : une scène illustrée montre *où* on l'a trouvé, une pièce à conviction montre
*l'indice*.

- **Leçon** : *une invite qui décide de ce que l'utilisateur va voir mérite de vivre dans un module
  pur et éprouvé*, pas noyée dans un gabarit de chaîne au milieu d'un gestionnaire. Elle se relit,
  elle se discute, et **on peut écrire un test qui dit « pas un portrait »**.

### 4. ⛔ Le heredoc Python et les barres obliques inverses — la QUATRIÈME fois

`
` dans un heredoc `<<'PY'` est ressorti en **vrai saut de ligne** dans le fichier TypeScript, pour
la quatrième fois de la session. Il a cassé un `replace(/
/g, ' ')` et fait échouer un motif de
remplacement que je croyais exact.

- **La règle, maintenant sans exception** : *dès qu'un contenu porte une barre oblique inverse, il
  passe par l'outil d'édition, jamais par un heredoc.* Quatre répétitions suffisent à établir que ce
  n'est pas de l'inattention mais l'environnement.

---

---

*Dernière mise à jour : 16 Septembre 2026, nuit — le générateur d'image sur les indices : ⭐
**ajouter le quatrième exemplaire d'un motif est le seul moment où l'on regarde les trois autres
ensemble** (et ils échouaient tous en silence), deux copies de la même donnée dont une seule reçoit
l'écriture, et un registre visuel qui est un choix d'auteur et non un détail de prompt.*

*Mise à jour de la veille : 15 Septembre 2026, très tard — `databases/` dans un filet : ⛔ **la question
n'est pas où ranger la copie mais QUI la déclenche** (la sauvegarde automatique ne serait jamais
partie), un dossier en lecture seule dont deux Ateliers ont changé la nature en deux jours, comparer
le contenu et jamais les dates, et ⛔ **une dégradation lancée sur un seul essai ne prouve rien**.*

*Mise à jour du même jour : 15 Septembre 2026, tard — les jours de fête : ⭐ **attacher à l'objet
plutôt qu'à son index** (un index se désynchronise dès qu'on réordonne), deux choses qui se
ressemblent sans se comporter pareil, `null` comme réponse et non comme échec, et ⛔ **`getByRole`
qui cherche une sous-chaîne** — quatre essais tombés parce qu'un libellé en commençait un autre.*

*Mise à jour du même jour : 15 Septembre 2026, au soir — l'Atelier des calendriers : ⛔ **une boucle
synchrone ne se laisse interrompre par aucun délai** (la dégradation n'a pas rougi, elle a pendu),
une fonctionnalité inaccessible qui ressemblait à une fonctionnalité inutile, `currentYear: 1492`
lu par personne, et le registre du mort qui **signale tout seul ce qui vient de servir**.*

*Mise à jour du même jour : 15 Septembre 2026 — les jauges qui se vident : **le mécanisme existait,
c'est le sens qui manquait** ; l'alarme qui criait à la bonne nouvelle ; le cinquième lecteur trouvé
par comptage et non par recherche ; ⛔ **un commentaire vrai le jour de son écriture et faux deux
jours plus tard** ; et un `dist/` périmé qui rend sept essais verts sur le code d'hier.*

*Mise à jour précédente : 14 Septembre 2026, au soir — le QR-code qui envoyait la tablette parler à
Vite (**qui accueille la connexion et ne répond jamais**, d'où un écran qui se croit connecté et
reste sur la campagne de démonstration), la tablette qui offrait les paquets d'un autre jeu, et le
transfert d'un PJ entre joueurs — qui a surtout appris **pourquoi il n'y avait presque rien à
écrire**.*

*Mise à jour du même jour : 14 Septembre 2026 — Échap ferme les surcouches (une famille de trente
écrans derrière un défaut signalé sur un seul, et la garde du clavier qui n'attrapait presque
rien), les diaporamas d'Image-OS et les **quatre défauts antérieurs** qu'ils ont révélés — le
fondu qui passait par le noir, Image-OS absent de toute sauvegarde, le fondu qui s'animait avant le
décodage, les images qui gardaient leur taille naturelle — puis l'empilement des deux couches,
mesuré et non déduit.*

*Mise à jour du même jour : 12 Septembre 2026 — l'écran de démarrage que personne n'avait nommé,
le Master Storyboard inatteignable **en séance** alors que c'est lui qui aurait expliqué la
séquence ratée, les noms du matériel rangés sous une clé périssable, la donnée gelée pour les
tests et les cinq surprises de forme du premier lot E2E. ⚠️ Le détail chantier par chantier vit
aux §§ 42 à 51 du registre ; **seules les leçons réemployables sont ici**.*

*Mise à jour précédente : 11 Septembre 2026 — revue de code de l'application entière et les cinq lots de
correction qui en sont sortis (le `NaN` de la barre de vie et les trois branches qui levaient, une
seule comparaison de chemins, les 27 crochets conditionnels du hub, le lint rendu lisible), puis la
fermeture du pont générique — dont le `off` ne retirait jamais rien — et la garde des clés d'API, que
le renderer ne détient plus du tout. **Et le lendemain matin, la régression que ce dernier chantier a
introduite** : un `app.getPath` à l'import qui a fait basculer tout le profil de données, la
sauvegarde automatique qui a tenu pour sa première mise à l'épreuve réelle, et les deux leçons de
méthode que l'enquête a laissées.*

*Mise à jour précédente : 9 Septembre 2026 — le MJ Focus, qui existait déjà sous le nom de régime
« table », et la porte de sortie qui lui manquait.*

*Mise à jour précédente : 8 Septembre 2026 — la couleur d'une pastille de son, qui n'a jamais rien
coloré, et deux défauts qui se protégeaient l'un l'autre.*

*Mise à jour précédente : 7 Septembre 2026 — curseur de vitesse des effets de Light-OS et les deux
défauts du moteur d'effets qu'il a mis au jour ; éclairage normal de la pièce, et le noir qui tombait
tout seul à la fin du premier bruitage d'une soirée ; puis les trois promesses du guide que rien ne
tenait — dont un interrupteur qui débranchait le pont sous le nom d'un autre ; la couleur de
tuile qui ne se voyait nulle part, et les icônes qui se télescopaient ; enfin **le contrôle
mécanique** qui attrape cette famille, et les dix-neuf noms qu'il a trouvés.*

*Mise à jour précédente : 6 Septembre 2026 — les documents Markdown rattachés aux réglages de taille,
loupe de lecture sur les quatre lecteurs, tailles nommées jusqu'à 200 %.*

*Mise à jour précédente : 4 Septembre 2026 — Loot-OS revu (pont Table-OS ↔ Loot-OS, butin de séance
persisté et rattaché à une campagne, vocabulaire du butin pris dans le pilote) et voix des PNJ de
campagne (profil enregistré sur la fiche, reposé en priorité).*

*Mise à jour précédente : 3 Septembre 2026 — débruitage neuronal (RNNoise) et alignement des niveaux
(EBU R 128), révision de Voice-OS (sélecteur de micro, porte à hystérésis,
quatre sources de saturation), transposition refaite en WSOLA et compression rendue réglable, storyboard (le son d'une séquence, le titre projeté), greffon
`tailwindcss-animate` rétabli, dés échelonnés au pupitre et sur tablette, atelier de thème, épingles du
Social Nexus.*

*Mise à jour précédente : 22 Août 2026 — trame narrative et journal de séance (plan du 08/08 clos), socle
du plan d'accélération IA (axes A à D), Forge Système et Forge de campagne éprouvées en réel.*

*Mise à jour précédente : 7 Août 2026 - GM-OS v6.5.0 - Session de durcissement : récupération des campagnes, unification du transport (points 1 à 5 clos), migration MCP vers Gemini Notebook.*
