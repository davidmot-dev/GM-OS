# 🧠 Lessons Learned : GM-OS v5 (Architecture Bridge & Sync)

Ce document répertorie les défis techniques, les erreurs commises et les solutions adoptées au cours de la refonte de GM-OS v5 vers une architecture moderne.

## 1. Gestion des Médias & WebSocket

### Défi

Le transfert systématique d'images (avatars, fonds de carte) via WebSocket en Base64 saturait la bande passante du MJ PC et ralentissait le rendu sur tablette (parsing CPU intensif).

### Leçon

L'utilisation de **DataURIs massif** n'est pas viable pour une application temps-réel multi-client.

**Solution :** Mise en place d'un **Local Asset Middleware (HTTP Proxy)**. Les fichiers sont mis en cache dynamiquement sur le disque et servis par un port dédié. Les messages WebSocket ne contiennent plus que des URLs courtes.

## 2. Synchronisation de l'État Global

### Défi

Envoyer le store complet à chaque changement (Zustand subscribe) créait des "chocs" de données (payload > 1Mo) pour des modifications mineures (ex: une seconde de l'horloge).

### Leçon

La synchronisation brute ("Full Sync") est inefficace.

**Solution :** **Differential Sync (Deltas)**. Utilisation d'un utilitaire `isDeepEqual` pour ne diffuser que les propriétés ayant réellement changé. Réduction de l'usage réseau de plus de 90% dans 80% des cas d'usage.

## 3. Typage TypeScript & Bridge IPC

### Défi

L'utilisation de `any` ou `unknown` dans le bridge de communication (`appBridge`) rendait le code fragile et compliquait le passage d'Electron à Tauri.

### Leçon

Le typage strict n'est pas une option pour les couches d'interopérabilité.

**Solution :** Standardisation **AppBridge v2**. Toutes les interfaces (`DisplayInfo`, `RemoteAction`, `SyncPayload`) ont été centralisées dans `window.d.ts` avec des types stricts importés des stores.

## 4. Maintenance des Données (IndexedDB)

### Défi

L'accumulation de blobs (images IA, anciens PNJ) dans IndexedDB finissait par ralentir l'application et occuper plusieurs Go d'espace disque inutilement.

### Leçon

Un store client-side doit être auto-nettoyant.

**Solution :** **MediaCleanupService**. Un scan automatique au démarrage identifie les IDs orphelins (fichiers présents en base mais plus référencés dans aucun store de campagne) et les supprime.

## 5. Mixage Audio & Ducking Multi-Moteurs

### Défi

Réduire le volume de plusieurs moteurs audio indépendants (Music, Ambient) de manière synchronisée lors de la détection de voix sans créer de clics ou de sauts brusques.

### Leçon

L'orchestration centralisée via un store global est efficace, mais la transition doit être gérée au niveau de chaque moteur ("Physical Reaction").

**Solution :** Introduction d'un nœud `duckingGain` en bout de chaîne de chaque moteur, piloté par un abonnement au `isDucking` du store VoiceOS. Utilisation de `setTargetAtTime` avec une constante de temps dynamique (Attack/Fade) pour garantir des fondus mathématiquement parfaits sans artefact sonore.

## 6. Intégration d'IA Locale (Ollama) & Robustesse des Données

### Défi

Les modèles de langage locaux (LLM) peuvent renvoyer des structures de données imprévisibles (objets JSON imbriqués au lieu de chaînes simples) même avec des instructions strictes. Cela a provoqué un crash React ("Objects are not valid as a React child") lors du rendu des titres de PNJ.

### Leçon

On ne peut pas faire confiance aveuglément à la structure de sortie d'un LLM pour un usage direct dans l'UI.

**Solution :** Mise en place d'une couche d'**Assainissement des Données (Sanitizer)**. Avant d'être injectées dans le store global, toutes les réponses de l'IA sont filtrées, converties en chaînes de caractères et les structures imbriquées (ex: `{ enrichedValue: '...' }`) sont aplaties. La fonction d'extraction du nom (`getName`) a également été sécurisée pour garantir un retour de type `string` en toute circonstance.

## 7. Design & UX : Galerie NPC (v5.1)
- **Stitch / Obsidian Nexus** : L'utilisation de Stitch pour générer une interface complète ("Obsidian Nexus") permet de gagner un temps considérable sur le design. Il a fallu adapter les icônes Material en Lucide-React pour rester cohérent avec le projet.
- **Workflow d'Ouverture** : Pour éviter l'auto-sélection du premier élément à l'ouverture d'un module, il est préférable de ne pas appeler d'action de sélection dans `setCurrentView` du store. Cela permet d'arriver sur une vue "Galerie" neutre.
- **Asymmetric Header** : Un design asymétrique avec des titres imposants et des lignes de soulignement néon renforce l'aspect "premium" et "tactique" de l'interface.

## 8. Harmonisation UI & Réutilisation de Composants (Cross-Modules)

### Défi

Maintenir une expérience utilisateur cohérente entre des modules aux objectifs différents (NPC OS pour la création pure, Session OS pour la gestion de partie) sans dupliquer la logique complexe de génération d'image ou de navigation média.

### Leçon

L'abstraction des overlays de service (AI, Media) permet une intégration rapide et sans bug dans de nouveaux contextes.

**Solution :** Standardisation des composants d'overlay (`AIPromptOverlay`, `MediaBrowser`). En s'assurant que ces composants sont indépendants du store spécifique au module (but branchés sur les stores de service globaux), ils ont pu être intégrés dans `NpcGallery.tsx` en quelques lignes, garantissant que la génération d'image IA fonctionne de la même manière partout dans GM-OS.

## 9. Harmonisation Visuelle Post-Génération (Stitch Cleanup)

### Défi

Les designs générés par IA (Stitch) peuvent parfois utiliser des tokens de couleur ou des polices orphelines (ex: `text-cyan-400` au lieu de `text-accent`) qui ne s'adaptent pas au thème global ou jurent avec les modules existants.

### Leçon

Un design généré doit toujours passer par une phase de "refactoring de tokens" pour s'assurer qu'il respecte les variables CSS globales (`--accent`).

**Solution :** Centralisation des couleurs sémantiques. Au lieu d'utiliser des couleurs Tailwind brutes (cyan, emerald), l'application utilise systématiquement `text-accent` ou `bg-accent`. Cela garantit que si le MJ change de thème (Cyberpunk -> Fantasy), l'intégralité de la Galerie NPC s'adaptte sans retouche manuelle. L'utilisation de `font-display` assure également une continuité typographique entre les listes et les fiches de détail.

> [!TIP]
> **Règle d'or GM-OS :** Toute nouvelle fonctionnalité de synchronisation doit être testée avec un payload différentiel et un asset local pour garantir la fluidité sur les terminaux MJ et Joueurs. Toute donnée issue d'une IA doit passer par un validateur de type avant d'atteindre le DOM.

