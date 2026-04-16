# 🧠 Lessons Learned : GM-OS v6 (Architecture Bridge & Sync)

Ce document répertorie les défis techniques, les erreurs commises et les solutions adoptées au cours de la refonte de GM-OS v5 vers une architecture moderne v6.

## 🔄 Synchronisation d'État Multi-Fenêtres (Zustand Persist)

### Défi
Lors de l'utilisation de plusieurs fenêtres Electron (MJ + Player Hub), les stores Zustand (`persist`) ne se synchronisent pas automatiquement entre les processus, car chaque fenêtre possède sa propre instance mémoire.

### Leçon
L'utilisation d'événements `storage` couplée à une réhydratation manuelle est plus légère que des messages IPC constants pour les données persistantes.

**Solution :**
1. Utilisation du middleware `persist` (stockage `localStorage`).
2. Écoute de `window.addEventListener('storage', ...)` dans les fenêtres secondaires.
3. Appel à `Store.persist.rehydrate()` lorsqu'une clé de store spécifique est modifiée.
   - *Exemple* : Synchronisation instantanée des dés et de l'horloge entre les fenêtres.

## 1. Gestion des Médias & WebSocket

### 1.1 Défi
Le transfert systématique d'images (avatars, fonds de carte) via WebSocket en Base64 saturait la bande passante du MJ PC et ralentissait le rendu sur tablette (parsing CPU intensif).

### 1.2 Leçon
L'utilisation de **DataURIs massif** n'est pas viable pour une application temps-réel multi-client.

**Solution :** Mise en place d'un **Local Asset Middleware (HTTP Proxy)**. Les fichiers sont mis en cache dynamiquement sur le disque et servis par un port dédié. Les messages WebSocket ne contiennent plus que des URLs courtes.

## 2. Synchronisation de l'État Global

### 2.1 Défi
Envoyer le store complet à chaque changement (Zustand subscribe) créait des "chocs" de données (payload > 1Mo) pour des modifications mineures (ex: une seconde de l'horloge).

### 2.2 Leçon
La synchronisation brute ("Full Sync") est inefficace.

**Solution :** **Differential Sync (Deltas)**. Utilisation d'un utilitaire `isDeepEqual` pour ne diffuser que les propriétés ayant réellement changé. Réduction de l'usage réseau de plus de 90% dans 80% des cas d'usage.

## 3. Typage TypeScript & Bridge IPC

### 3.1 Défi
L'utilisation de `any` ou `unknown` dans le bridge de communication (`appBridge`) rendait le code fragile et compliquait le passage d'Electron à Tauri.

### 3.2 Leçon
Le typage strict n'est pas une option pour les couches d'interopérabilité.

**Solution :** Standardisation **AppBridge v2**. Toutes les interfaces (`DisplayInfo`, `RemoteAction`, `SyncPayload`) ont été centralisées dans `window.d.ts` avec des types stricts importés des stores.

## 4. Maintenance des Données (Media Cleanup)

### Défi
L'accumulation de blobs (images IA, anciens PNJ) dans IndexedDB finissait par ralentir l'application. La détection des fichiers inutilisés est complexe car les IDs `m-xxx` sont dispersés dans plusieurs stores Zustand et bases de données.

### Leçon
La gestion par "diff" est risquée. Il est plus sûr de construire une "whitelist" exhaustive au runtime.

**Solution :** **MediaCleanupService**. Un scan automatique au démarrage collecte récursivement tous les IDs référencés dans tous les magasins de données actifs (Campagnes, PNJ, Favoris). Ce Set global est comparé à l'index physique du MediaStore pour identifier et supprimer les orphelins.

## 5. Mixage Audio & Ducking Multi-Moteurs

### 5.1 Défi
Réduire le volume de plusieurs moteurs audio indépendants (Music, Ambient) de manière synchronisée lors de la détection de voix sans créer de clics ou de sauts brusques.

### 5.2 Leçon
L'orchestration centralisée via un store global est efficace, mais la transition doit être gérée au niveau de chaque moteur ("Physical Reaction").

**Solution :** Introduction d'un nœud `duckingGain` en bout de chaîne de chaque moteur, piloté par un abonnement au `isDucking` du store VoiceOS. Utilisation de `setTargetAtTime` avec une constante de temps dynamique (Attack/Fade) pour garantir des fondus mathématiquement parfaits sans artefact sonore.

## 6. Intégration d'IA Locale (Ollama) & Robustesse des Données

### 6.1 Défi
Les modèles de langage locaux (LLM) peuvent renvoyer des structures de données imprévisibles (objets JSON imbriqués au lieu de chaînes simples) même avec des instructions strictes. Cela a provoqué un crash React ("Objects are not valid as a React child") lors du rendu des titres de PNJ.

### 6.2 Leçon
On ne peut pas faire confiance aveuglément à la structure de sortie d'un LLM pour un usage direct dans l'UI.

**Solution :** Mise en place d'une couche d'**Assainissement des Données (Sanitizer)**. Avant d'être injectées dans le store global, toutes les réponses de l'IA sont filtrées, converties en chaînes de caractères et les structures imbriquées (ex: `{ enrichedValue: '...' }`) sont aplaties. La fonction d'extraction du nom (`getName`) a également été sécurisée pour garantir un retour de type `string` en toute circonstance.

## 7. Design & UX : Galerie NPC (v5.1)

- **Stitch / Obsidian Nexus** : L'utilisation de Stitch pour générer une interface complète permet de gagner un temps considérable sur le design. Il a fallu adapter les icônes Material en Lucide-React pour rester cohérent avec le projet.
- **Workflow d'Ouverture** : Pour éviter l'auto-sélection du premier élément à l'ouverture d'un module, il est préférable de ne pas appeler d'action de sélection dans `setCurrentView` du store. Cela permet d'arriver sur une vue "Galerie" neutre.
- **Asymmetric Header** : Un design asymétrique avec des titres imposants et des lignes de soulignement néon renforce l'aspect "premium" et "tactique" de l'interface.

## 8. Harmonisation UI & Réutilisation de Composants (Cross-Modules)

### 8.1 Défi
Maintenir une expérience utilisateur cohérente entre des modules aux objectifs différents (NPC OS pour la création pure, Session OS pour la gestion de partie) sans dupliquer la logique complexe de génération d'image ou de navigation média.

### 8.2 Leçon
L'abstraction des overlays de service (AI, Media) permet une intégration rapide et sans bug dans de nouveaux contextes.

**Solution :** Standardisation des composants d'overlay (`AIPromptOverlay`, `MediaBrowser`). En s'assurant que ces composants sont indépendants du store spécifique au module (but branchés sur les stores de service globaux), ils ont été intégrés dans `NpcGallery.tsx` en quelques lignes.

## 9. Harmonisation Visuelle Post-Génération (Stitch Cleanup)

### 9.1 Défi
Les designs générés par IA (Stitch) peuvent parfois utiliser des tokens de couleur ou des polices orphelines (ex: `text-cyan-400` au lieu de `text-accent`) qui ne s'adaptent pas au thème global ou jurent avec les modules existants.

### 9.2 Leçon
Un design généré doit toujours passer par une phase de "refactoring de tokens" pour s'assurer qu'il respecte les variables CSS globales (`--accent`).

**Solution :** Centralisation des couleurs sémantiques. Au lieu d'utiliser des couleurs Tailwind brutes (cyan, emerald), l'application utilise systématiquement `text-accent` ou `bg-accent`. Cela garantit que si le MJ change de thème, l'intégralité de la Galerie NPC s'adapte sans retouche manuelle.

## 10. Visibilité Tactique : Filtrage de Données vs Masquage Physique

### 10.1 Défi
Gérer la visibilité sélective des pions (PJ vs PNJ) dans le brouillard de guerre via des filtres conditionnels dans le store devenait extrêmement complexe.

### 10.2 Leçon
La complexité logicielle de visibilité peut souvent être remplacée par une hiérarchie de rendu (Z-index) robuste.

**Solution :** Basculement vers un **Masquage Physique**. En plaçant le calque de brouillard (`z-20`) au-dessus des pions (`z-16`) et de la magie (`z-18`), le moteur de rendu du navigateur gère nativement l'occultation.

## 11. Projection Map-OS : Auto-Détection vs Store-Sync

### Leçon
La couche d'affichage (Renderer) doit être autonome pour ses calculs de mise à l'échelle pour garantir l'immersion.
**Solution :** Implémentation de l'**Auto-Détection Active** sur le Hub. Le passage au mode **Cover** (`Math.max`) garantit une immersion totale sans barres noires.

## 12. UI/UX : Performance & Animations Vocales (Variables CSS)

### Leçon
Le CSS natif est plus performant que React pour les micro-animations haute fréquence.
**Solution :** Utiliser des **variables CSS** (`--voice-scale`) injectées via le prop `style`. Les calculs sont faits côté JS, mais le rendu est géré par le moteur CSS, évitant les re-renders massifs.

## 13. Documentation Continue : Règle du Dernier Pas

Appliquer systématiquement la mise à jour du README et archivage des walkthroughs avant de clore une tâche. C'est la base de la pérennité d'un projet agentique.

## 39. IA & Orchestration : Optimisation de la Latence (Cortex Parallel)

**Problème :** L'utilisation de modèles lourds introduisait un délai de plus de 20s en raison de l'exécution séquentielle des tâches (Narration puis Conseils JSON).

**Solution :** Implémentation d'une exécution concurrente via `Promise.all` dans le `useTacticalAIStore`. La narration (streaming) et les conseils (JSON) sont calculés simultanément.

**Apprentissage :** Pour les assistants complexes, la latence perçue est le facteur #1 d'adoption.

## 40. Build & Typing : Stabilisation v6 (Strict Mode)

**Problème :** L'introduction de `verbatimModuleSyntax` et de types stricts pour les entités (NPC/Joueurs) a provoqué des régressions massives.

**Solution :** Standardisation des types `GameDriver` et injection systématique des URLs d'avatar/portrait obligatoires dans les mocks de test.

## 43. Testing : Round-Trip Integration (Nexus-OS)

Le cycle de vie d'un bundle Nexus-OS suit un protocole de test strict : Scrape -> Remap -> Inject. Le succès est validé par la suite de tests `NexusService.test.ts`.

## 47. Réseau & Sync : Le Piège de la Boucle de Nettoyage (Cleanup Loop)

**Problème :** Lors de l'implémentation des notes privées sur tablette, l'utilisation d'un `useEffect` pour sauvegarder au démontage a créé un bug critique de boucle infinie.

**Solution : Isolation de la Dépendance**. Retirer la donnée du tableau de dépendances de l'effet de nettoyage et utiliser des Refs pour une mise à jour synchrone.

## 48. Internationalisation (I18n) : Nesting Collision & Accents

**Problème :** Collision de clés JSON lors d'imbrications profondes et corruption des accents lors des transferts multi-agents.

**Solution :**
1. **Nesting Level 2** : Tout nouveau module doit être déclaré à la racine de son namespace parent.
2. **Encodage Strict** : Utilisation d'un script de réparation Node.js automatisé pour mapper les séquences corrompues.

## 14. Hub UX : Dénucléarisation du Mode "Théâtre" (Minimalisme Narratif)

### 14.1 Défi
L'introduction d'un mode "Théâtre" (vue splitée avec détails techniques à droite) complexifiait inutilement le flux de synchronisation MJ-Hub et surchargeait visuellement l'écran des joueurs avec des données peu pertinentes pour l'immersion (listes d'attributs, jauges secondaires).

### 14.2 Leçon
**Moins c'est plus.** Pour les écrans de projection (Hubs), l'image est le vecteur principal d'immersion. Toute donnée textuelle non-essentielle doit être masquée par défaut.

**Solution :**
1. **Purge du code mort** : Suppression des états `isTheater` et `displayMode`.
2. **Grille Unifiée** : Utilisation d'une grille intelligente d'entités (`HubProjectionCard`) qui s'adapte au nombre d'éléments projetés.
3. **Déduplication Native** : Filtrage automatique pour garantir qu'un PNJ n'apparaît qu'une seule fois, simplifiant ainsi la logique de rendu et évitant les bugs de redondance visuelle ("Visual Noise").

## 15. Projections & IPC Race Condition (Multi-Fenêtres)

### 15.1 Défi
Lors de l'ouverture d'un projecteur, l'ordre de projection est souvent envoyé via IPC avant que la fenêtre React cible ne soit totalement initialisée. De plus, le Store global (Zustand) injecté au démarrage peut contenir des données obsolètes qui écrasent l'ordre IPC reçu.

### 15.2 Leçon
Le signal direct (IPC) doit primer sur l'état persistant une fois la connexion établie.

**Solution :** Implémentation d'un **Verrou IPC Définitif** (`ipcCount`). Dès que le projecteur reçoit son premier message direct, il incrémente un compteur et ignore définitivement toutes les mises à jour provenant de son Store local (Zustand). Cela garantit que seule la volonté en temps réel du MJ est affichée.

## 16. Hydratation & Validation de Données (ID vs Path)

### 16.1 Défi
Le système de nettoyage automatique (Cleanup) au démarrage du Store tentait de valider les projections en comparant des **Chemins de média** (`m-127...`) avec des **UUID technico-fonctionnels**. Cette erreur de type provoquait l'effacement systématique des images projetées au démarrage.

### 16.2 Leçon
La validation de l'état persistant doit utiliser la même source de vérité que celle stockée (le `Path` pour les projections).

**Solution :** Correction du middleware de réhydratation pour valider les clés via un Set de `media.path`.

## 17. Optimisation React : Clés de Rendu Complexes

### 17.1 Défi
L'utilisation de chaînes Base64 massives (plusieurs Mo) comme `key` dans React provoque un ralentissement extrême, voire un crash du moteur de rendu Chrome, car React tente de comparer ces chaînes géantes à chaque cycle.

### 17.2 Leçon
Une `key` React doit rester courte et performante.

**Solution :** Utilisation systématique de l'ID média (`m-xxx`) au lieu de l'URL résolue pour les propriétés `key`.

---
*Dernière mise à jour : 16 Avril 2026 - GM-OS v6.3.2 - Stabilization Wave & IPC Security.*
