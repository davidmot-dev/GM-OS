# 🧠 Lessons Learned : GM-OS v5 (Architecture Bridge & Sync)

Ce document répertorie les défis techniques, les erreurs commises et les solutions adoptées au cours de la refonte de GM-OS v5 vers une architecture moderne.

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

- **Stitch / Obsidian Nexus** : L'utilisation de Stitch pour générer une interface complète ("Obsidian Nexus") permet de gagner un temps considérable sur le design. Il a fallu adapter les icônes Material en Lucide-React pour rester cohérent avec le projet.
- **Workflow d'Ouverture** : Pour éviter l'auto-sélection du premier élément à l'ouverture d'un module, il est préférable de ne pas appeler d'action de sélection dans `setCurrentView` du store. Cela permet d'arriver sur une vue "Galerie" neutre.
- **Asymmetric Header** : Un design asymétrique avec des titres imposants et des lignes de soulignement néon renforce l'aspect "premium" et "tactique" de l'interface.

## 8. Harmonisation UI & Réutilisation de Composants (Cross-Modules)

### 8.1 Défi

Maintenir une expérience utilisateur cohérente entre des modules aux objectifs différents (NPC OS pour la création pure, Session OS pour la gestion de partie) sans dupliquer la logique complexe de génération d'image ou de navigation média.

### 8.2 Leçon

L'abstraction des overlays de service (AI, Media) permet une intégration rapide et sans bug dans de nouveaux contextes.

**Solution :** Standardisation des composants d'overlay (`AIPromptOverlay`, `MediaBrowser`). En s'assurant que ces composants sont indépendants du store spécifique au module (but branchés sur les stores de service globaux), they have been integrated into `NpcGallery.tsx` in a few lines, ensuring AI image generation works consistently throughout GM-OS.

## 9. Harmonisation Visuelle Post-Génération (Stitch Cleanup)

### 9.1 Défi

Les designs générés par IA (Stitch) peuvent parfois utiliser des tokens de couleur ou des polices orphelines (ex: `text-cyan-400` au lieu de `text-accent`) qui ne s'adaptent pas au thème global ou jurent avec les modules existants.

### 9.2 Leçon

Un design généré doit toujours passer par une phase de "refactoring de tokens" pour s'assurer qu'il respecte les variables CSS globales (`--accent`).

**Solution :** Centralisation des couleurs sémantiques. Au lieu d'utiliser des couleurs Tailwind brutes (cyan, emerald), l'application utilise systématiquement `text-accent` ou `bg-accent`. Cela garantit que si le MJ change de thème (Cyberpunk -> Fantasy), l'intégralité de la Galerie NPC s'adaptte sans retouche manuelle. L'utilisation de `font-display` assure également une continuité typographique entre les listes et les fiches de détail.

## 32. Protection des Données & Gestion des Orphelins (Media Persistence)

### 32.1 Défi

Le `MediaCleanupService` est conçu pour être agressif afin de limiter l'empreinte disque. Cependant, cela posait problème pour les assets "en attente" (ex: futurs boss, assets de lore non liés) qui étaient systématiquement supprimés car non référencés.

### 32.2 Leçon

Toute automatisation de suppression de données doit posséder un mécanisme de "dérogation utilisateur" (Override). 

**Solution :** Introduction du flag `isPersistent` dans le schéma IndexedDB (Migration v3). Ce flag agit comme une "Whitelist Individuelle" prioritaire sur l'analyse de dépendances des stores. L'UI a été mise à jour avec un bouton de verrouillage dans le `TacticalDetailPanel`, offrant une tranquillité d'esprit au MJ lors de l'import massif d'assets.

## 10. Visibilité Tactique : Filtrage de Données vs Masquage Physique

### 10.1 Défi

Gérer la visibilité sélective des pions (PJ vs PNJ) dans le brouillard de guerre via des filtres conditionnels dans le store (`projectedTokens`) devenait extrêmement complexe et sujet aux régressions lors de l'ajout de nouvelles couches (magie, zones de danger).

### 10.2 Leçon

La complexité logicielle de visibilité peut souvent être remplacée par une hiérarchie de rendu (Z-index) robuste.

**Solution :** Basculement vers un **Masquage Physique**. En plaçant le calque de brouillard (`z-20`) au-dessus des pions (`z-16`) et de la magie (`z-18`), le moteur de rendu du navigateur gère nativement l'occultation. Cela élimine le besoin de calculs de collision entre tokens et polygones de brouillard dans le store, garantissant une performance maximale et une fiabilité absolue : si c'est sous le noir, c'est caché.

## 11. Projection Map-OS : Auto-Détection vs Store-Sync

### 11.1 Défi

L'utilisation de dimensions par défaut (2000x2000) dans le store global provoquait des barres noires (letterboxing) sur le Player Hub.

### 11.2 Leçon

La couche d'affichage (Renderer) doit être autonome pour ses calculs de mise à l'échelle pour garantir l'immersion ("Ambience").

**Solution :** Implémentation de l'**Auto-Détection Active** sur le Hub (`onLoadedMetadata`/`onLoad`). Le passage au mode **Cover** (`Math.max`) garantit une immersion totale sans barres noires, quitte à recadrer légèrement les bords si les ratios diffèrent.

## 12. UI/UX : Performance & Animations Vocales

### 12.1 Défi

Le linter rejette les styles inline, mais les animations basées sur des niveaux sonores (`voiceLevel`) nécessitent des mises à jour à 60fps.

### 12.2 Leçon

Le CSS natif est plus performant que React pour les micro-animations haute fréquence.

**Solution :** Utiliser des **variables CSS** (`--voice-scale`) injectées via le prop `style`. Les calculs sont faits côté JS, mais le rendu est géré par le moteur CSS, évitant les re-renders massifs de classes Tailwind.

## 13. Documentation Continue

### 13.1 Défi

La documentation devient vite obsolète après une phase d'implémentation intense.

### 13.2 Leçon

Appliquer la règle du "Dernier Pas".

**Solution :** Mise à jour systématique du README, des guides techniques et archivage des walkthroughs dans `documentation/walkthroughs/` avant de clore une tâche.

## 14. Navigation Deep-Link & Conflits de Store (UI State)

### 14.1 Défi

L'implémentation de liens directs depuis le Graphe Social vers la Galerie PNJ échouait car l'interface revenait systématiquement sur la liste (mosaïque) au lieu d'ouvrir la fiche détaillée, même si l'ID était correctement transmis.

### 14.2 Leçon

Les fonctions de navigation (ex: `setCurrentView`) ne doivent pas réinitialiser l'état de sélection s'il est utilisé pour piloter le mode d'affichage "Détail" d'un composant.

**Solution :** Suppression du reset automatique de `selectedEntityId` dans `setCurrentView('npc-gallery')`. Inversion de l'ordre d'appel dans l'UI (`setCurrentView` avant `setSelectedEntity`) pour garantir que le composant cible est monté avant de recevoir la sélection.

## 15. Rendu Canvas & Résolution des Médias (Media Hub)

### 15.1 Défi

Le rendu des portraits dans un canvas (via `react-force-graph`) échouait car les composants canvas ne peuvent pas utiliser directement les identifiants `m-xxxx` du Media Hub ou les chemins locaux bruts.

### 15.2 Leçon

Pour les rendus non-DOM (Canvas, WebGL), la résolution des médias doit être traitée en amont de la boucle de rendu.

**Solution :** Utilisation du hook `useMediaStore` pour convertir les IDs et chemins en ObjectURLs (`blob:`) ou URLs de protocole local (`gmos://`) avant de les injecter dans le cache d'images du canvas.

## 16. Attribution Tactique & Régression UI

### 16.1 Défi

La refonte visuelle massive d'un module (ex: Media Hub en mode plein écran) peut occulter des fonctionnalités métier critiques (ex: l'attribution de campagnes) si celles-ci n'ont pas de place dédiée dans le nouveau layout. Cela a conduit à une régression où les utilisateurs ne pouvaient plus lier d'assets à leurs campagnes.

### 16.2 Leçon

L'esthétique ne doit jamais primer sur la "découvrabilité" des fonctions récurrentes. Si une fonction est transverse (utilisée dans plusieurs modules), elle doit avoir un point d'entrée universel.

**Solution :** Introduction du **HUD Tactique (Side Panel)**. Au lieu de surcharger la grille de médias avec des contrôles complexes, l'utilisation d'un panneau latéral dédié permet de regrouper les actions d'indexation (Tags, Campagnes) dans un espace spacieux et ergonomique. La restauration a également permis d'implémenter la **Liaison Automatique**, réduisant la charge cognitive du MJ en session.

## 17. Workspace Persistence & Campagne Sync (Layout Manager)

### 17.1 Défi

Synchroniser l'état de l'interface (module, thèmes, panneaux) lors du changement de campagne sans provoquer de boucles infinies où le chargement d'un layout déclenche immédiatement sa propre sauvegarde (écrasant potentiellement les données avec des états transitoires).

### 17.2 Leçon

La synchronisation d'état bidirectionnelle nécessite un "gardien" de flux.

**Solution :** Utilisation d'un `isRestoring` ref dans le hook `useLayoutManager`. Ce drapeau bloque temporairement l'auto-save pendant que les actions du store (`setTheme`, `setActiveModule`) s'exécutent. Un court délai (`setTimeout`) assure que le cycle de rendu React est terminé avant de réactiver la surveillance des changements.

## 18. Refactoring de Modules Complexes (Media Hub)

### 18.1 Défi

Un composant monolithique (`MediaHub.tsx`) devient illisible et difficile à maintenir dès qu'il intègre des fonctionnalités transverses (Recherche, Grille, Détails Tactiques, Previews).

### 18.2 Leçon

L'extraction préventive de sous-composants spécialisés (`TacticalDetailPanel`, `MediaItemThumbnail`) améliore non seulement la lisibilité mais aussi la performance (moindre surface de re-render).

**Solution :** Découpage du Media Hub en une "Orchestration" (`MediaHub.tsx`) et des "Éléments de Structure" atomiques. Cela a permis d'implémenter le panneau latéral HUD Obsidian de manière isolée, sans risquer de casser la grille de navigation principale ou le moteur de recherche.

---

## 19. Robustesse des Stores (Optional Chaining)

### 19.1 Défi

L'introduction de services automatisés (ex: `MediaCleanupService`) interagissant avec plusieurs stores Zustand peut provoquer des plantages "Cannot read property of undefined" si un store est accédé avant son initialisation complète ou si une propriété attendue est absente.

### 19.2 Leçon

L'utilisation systématique du **Optional Chaining (`?.`)** et des valeurs par défaut est impérative pour les services de maintenance transverse.

**Solution :** Refactoring des accesseurs de store dans les boucles de nettoyage. Au lieu de `store.subStore.items`, l'utilisation de `store?.subStore?.items ?? []` garantit que le service ne casse jamais le thread principal de l'application, même en cas d'incohérence passagère des données.

## 20. Contexte Matériel & UX Adaptative (Workspace Sync v2)

### 20.1 Défi

Offrir une expérience utilisateur fluide sur des setups variés (un portable seul vs un bureau avec 3 écrans) sans forcer le MJ à redimensionner ses fenêtres manuellement à chaque changement de matériel.

### 20.2 Leçon

L'interface doit être une fonction de l'environnement matériel, pas seulement de l'état logique.

**Solution :** Branchement sur les événements `screen` d'Electron via le bridge. La connaissance du `displayCount` dans le store global permet de définir des **règles de priorité de rendu** (ex: auto-clôture des panneaux secondaires sur petit écran). Cela transforme GM-OS d'une application statique en un environnement "pro-actif" qui libère de la charge cognitive au MJ.

---

## 21. Refonte d'Éditeurs Modulaires (Obisidian Nexus)

### 21.1 Défi

L'ajout de nombreuses fonctionnalités (Auras, Mobilité, Sync Audio/Lumière) à un éditeur monolithique le rend illisible et difficile à utiliser, surtout sur des écrans chargés.

### 21.2 Leçon

Le découpage en **sous-composants métier** (`TacticalSwitch`, `ObsidianSelect`) et une architecture par colonnes améliore radicalement l'expérience utilisateur.

**Solution :** Refonte de l'Éditeur de Danger en style **Obsidian Nexus**. L'interface a été scindée en trois zones claires : Sélection (liste latérale), Configuration Visuelle (nom/couleur), et Configuration Tactique/Audio (toggles et dropdowns). L'adoption du **Glassmorphism** et du mode **Large Modal (6xl)** permet de présenter toutes les options complexes sans aucun défilement nécessaire sur la plupart des résolutions.

## 22. Recherche Transverse & Clavier Global (Spotlight)

### 22.1 Défi

Permettre une recherche rapide à travers plusieurs stores Zustand indépendants (Session, Music, Ambient, Sound) sans créer de dépendances circulaires ou de surcharges de rendu massives lors de la saisie de texte.

### 22.2 Leçon

Le calcul des résultats doit être centralisé dans un hook dédié et les actions d'exécution doivent être injectées dynamiquement pour rester découplé des modules.

**Solution :** Implémentation du hook `useSpotlight`. Il agrège les données de 4 stores différents via un `useMemo` optimisé qui ne recalcule que si la `query` ou les listes sources changent. Le raccourci clavier est géré par un `useEffect` sur `window` au niveau racine, garantissant une disponibilité permanente (`z-index: 9999`).

## 23. Résolution d'Avatars & Performance (Social Nexus v2)

### 23.1 Défi

Le rendu d'un graphe social contenant des dizaines d'entités provoquait des saccades car chaque nœud tentait de résoudre son avatar (URL locale vs web vs blob) simultanément, surchargeant le thread principal.

### 23.2 Leçon

La résolution de média doit être asynchrone et bénéficier d'une couche de cache dédiée (Memoization).

**Solution :** Création du service **`useAvatarResolver`**. Ce hook encapsule la logique complexe de priorité des images (Portrait > Token > Fallback) et utilise un cache interne pour éviter de recalculer les URLs à chaque frame du canvas. Le résultat est une fluidité de 60fps constante sur le Social Nexus, même avec des campagnes massives.

## 24. Persistance des Workspaces (Layout Manager)

### 24.1 Défi

Restaurer la configuration précise des fenêtres lors du changement de campagne sans écraser les données par mégarde.

### 24.2 Leçon

Il est crucial de distinguer les changements d'état initiés par l'utilisateur de ceux initiés par le système de restauration.

**Solution :** Utilisation d'un flag `isRestoring` dans le `LayoutManager`. Cela empêche l'auto-save d'enregistrer des états intermédiaires pendant la phase de chargement, garantissant l'intégrité de la configuration visuelle de chaque campagne.

---

## 25. Dépendances de Nettoyage Cross-Stores (Media Cleanup)

### 25.1 Défi

L'introduction de nouveaux modules (Music OS, Ambient OS) a créé une faille dans le service de nettoyage automatique. Le script de nettoyage ne scannait que les stores "historiques", ignorant les nouvelles playlists et thèmes. Cela a conduit à la suppression massive de fichiers audio actifs, perçus à tort comme orphelins.

### 25.2 Leçon

Toute nouvelle structure de données utilisant des IDs du MediaStore (`m-xxxx`) **doit** obligatoirement être enregistrée dans la whitelist du `MediaCleanupService`.

**Solution :** Refactoring du service pour inclure l'interrogation systématique de `useMusicStore` (playlists/pads) et `useAmbientStore` (presets/tracks). La robustesse du nettoyage est désormais liée à l'exhaustivité de la collecte des références.

## 26. Activation Audio Distante & Autoplay Policy

### 26.1 Défi

Les navigateurs bloquent le son tant qu'une interaction utilisateur n'a pas eu lieu sur la page. Lors d'un contrôle via **Remote Pad**, l'interaction a lieu sur le mobile, pas sur le PC. Le son restait donc "suspendu" sur le PC hôte, même si l'ordre de lecture était bien reçu.

### 26.2 Leçon

La réception d'un signal WebSocket distant doit être considérée comme une interaction utilisateur valide pour forcer la reprise du contexte audio.

**Solution :** Ajout systématique de `context.resume()` dans les méthodes `play()` de tous les moteurs audio (`Music`, `Sound`, `Ambient`). De plus, pour les thèmes Ambient, le trigger distant force désormais l'état de lecture (`isPlaying: true`) pour contourner le comportement par défaut de simple chargement passif.

---
27. Débogage du Lancement Electron (Windows AppLocker/WDAC)

### 27.1 Défi

L'application refuse de démarrer avec une erreur `spawn UNKNOWN` (errno -4094) lors du lancement d'Electron via `vite-plugin-electron`. L'erreur persiste même en essayant de lancer le binaire `electron.exe` manuellement.

### 27.2 Leçon

Sur certains systèmes Windows (particulièrement en environnement pro ou sécurisé), les **politiques de contrôle d'application (AppLocker ou WDAC)** bloquent l'exécution de tout binaire non autorisé situé dans le dossier `node_modules`.

**Solution :** 
1. Identifier la source du blocage via l'Observateur d'Événements Windows (Journaux Microsoft-Windows-AppLocker).
2. Ajouter une **exclusion** dans la Sécurité Windows (Windows Defender) pour le dossier complet du projet ou autoriser spécifiquement le binaire : `node_modules\electron\dist\electron.exe`.
3. Le "déblocage" de fichier simple (`Unblock-File`) est souvent insuffisant face à une politique WDAC stricte.

---

29. Isolation des Données (Git Branch Isolation)

### 29.1 Défi
La branche de sauvegarde `data-sync` était "polluée" par l'intégralité du code source du projet, ce qui alourdissait les synchronisations et augmentait les risques de conflits lors des opérations de `stash`.

### 29.2 Leçon
Une branche de données doit être structurellement isolée du code pour garantir des performances optimales et une clarté totale sur l'historique des sauvegardes.

**Solution :** 
1. **Orphan Branches** : Utilisation de `git checkout --orphan` pour créer une branche sans parenté avec le code source.
2. **Nettoyage de l'Index (`--cached`)** : Utilisation de `git rm -r --cached .` lors du switch de branche. Cela permet de "vider" virtuellement la branche de tout fichier de code tout en les conservant physiquement sur le disque pour le switch retour vers `master`. Le résultat final sur GitHub est une branche contenant **uniquement** le dossier `backups/`.

## 30. Rendu Canvas & Cycle de Vie React

### 30.1 Défi
Lors du chargement d'une carte, le brouillard de guerre disparaissait ou ne s'appliquait pas correctement au premier rendu, car le redimensionnement du composant (basé sur la résolution de l'image) se heurtait à l'initialisation du moteur de brouillard.

### 30.2 Leçon
Toute modification de `canvas.width` ou `canvas.height` **efface instantanément le contenu du canvas** (buffer clearing). 

**Solution :** Dans un workflow React, l'initialisation et le redimensionnement du moteur de rendu Canvas doivent être atomiques. Il faut impérativement re-charger l'état (`loadFromDataUrl`) ou re-remplir (`fillBlack`) immédiatement après un changement de dimension déclenché par l'état (useEffect).

## 31. Registres d'État par Asset (Map Persistence)

### 31.1 Défi
Le brouillard de guerre était auparavant global. Changer de carte écrasait le brouillard précédent, empêchant le MJ de préparer plusieurs scènes tactiques à l'avance ou de revenir sur une carte explorée.

### 31.2 Leçon
L'état d'un module ne doit pas être une variable simple unique mais un **Registre indexé par l'Asset ID/URL**.

**Solution :** Utilisation d'un `FogRegistry` (`Record<string, string>`). En liant l'exploration à l'URL de l'image, la persistance devient "invisible" pour l'utilisateur. Le changement de carte devient alors une simple opération de lecture dans le registre, garantissant une expérience fluide et sans perte de données.
