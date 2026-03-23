# 🧠 Lessons Learned : GM-OS v5 (Architecture Bridge & Sync)

Ce document répertorie les défis techniques, les erreurs commises et les solutions adoptées au cours de la refonte de GM-OS v5 vers une architecture moderne.

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

---
> [!TIP]
> **Règle d'or GM-OS :** Toute nouvelle fonctionnalité de synchronisation doit être testée avec un payload différentiel et un asset local pour garantir la fluidité sur les terminaux MJ et Joueurs. Toute donnée issue d'une IA doit passer par un validateur de type avant d'atteindre le DOM.
