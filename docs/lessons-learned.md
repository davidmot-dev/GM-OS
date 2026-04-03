# 📔 Lessons Learned : GM-OS v5

## 🛠️ Technique : Gestion des Médias dans IndexedDB

### Le défi des Orphelins
**Problème :** L'utilisation de `m-xxx` IDs rendait difficile la détection des fichiers inutilisés car ils sont dispersés dans plusieurs stores Zustand et bases de données locales.
**Solution :** L'implémentation d'un service centralisé (`MediaCleanupService`) collectant récursivement les IDs depuis tous les états globaux avant de comparer avec l'index physique. 
**Apprentissage :** Pour des systèmes avec de nombreuses références croisées, il est plus sûr de construire une "whitelist" (Set) exhaustive au runtime plutôt que d'essayer de suivre chaque suppression.

## 🎨 UI/UX : Performance & Animations Vocales

### Styles Inline vs Variables CSS
**Problème :** Le linter rejette les styles inline, mais les animations basées sur des niveaux sonores (`voiceLevel`) nécessitent des mises à jour à 60fps.
**Solution :** Utiliser des variables CSS (`--voice-scale`) injectées via le prop `style` de React. Les calculs sont faits côté JS, mais le rendu est géré par le moteur CSS via des classes utilitaires dans `index.css`.
**Apprentissage :** C'est le meilleur compromis entre "Zéro style inline" (standard de code) et performance (éviter les re-renders massifs de classes Tailwind).

## 📚 Documentation Continue

### Règle du "Dernier Pas"
**Problème :** La documentation est souvent oubliée après l'implémentation.
**Solution :** Nouvel ajout aux `instructions.md` imposant la mise à jour systématique du README, des guides techniques et de l'historique avant de clore une tâche.
**Apprentissage :** L'archivage systématique des walkthroughs dans `docs/history/` permet de garder une trace claire de l'évolution du projet sans polluer l'espace de travail actif.

## 🧩 Store & Reactivity : Synchronisation Deck-OS

### React Hooks & Early Returns
**Problème :** Dans `DeckPlayer.tsx`, l'utilisation de `useCallback` après un `if (!deck) return null` provoquait une erreur de violation des règles des Hooks (Hooks must be called in the exact same order).
**Solution :** Déplacer toute la logique de Hooks (déclarations de callbacks, memos, effets) au tout début du composant, avant tout rendu conditionnel ou sortie anticipée.
**Apprentissage :** Même si un composant ne "devrait pas" s'afficher sans données, ses Hooks doivent rester stables et enregistrés par React pour chaque rendu.

### Stratégie de "Cache-Busting" Logique (ID Unique)
**Problème :** Le retournement d'une carte (Flip) gardant parfois la même image (ou une structure d'objet identique) n'était pas détecté par les Hubs distants, empêchant le rafraîchissement visuel.
**Solution :** Injection d'un `projectionId` basé sur un timestamp (`Date.now()`) à chaque action utilisateur. Cela force une différence d'état au niveau du store, déclenchant l'envoi du signal IPC vers les Hubs.
**Apprentissage :** Pour la synchronisation multi-fenêtres (Electron/Tauri), ne jamais se fier uniquement à l'identité des données métier. Un ID de transaction/projection temporaire est indispensable pour garantir la réactivité.

## 🧠 Store & Reactivity : Édition de Drivers Système

### Fork-on-Edit pour Drivers Immuables
**Problème :** Les drivers intégrés (`blade-runner-v2`, `alien-yze`, etc.) sont immuables. Tenter de les modifier dans `RuleEngineEditor` ne produisait aucun effet car le store ne mettait à jour que les `customGameDrivers`.
**Solution :** Implémentation d'une logique "Fork-on-Edit" dans le `useSessionOSStore`. Si une mise à jour cible un ID inexistant dans les drivers personnalisés, le store crée automatiquement une copie (fork) du driver par défaut et y applique les changements.
**Apprentissage :** Toujours prévoir un mécanisme de "Shadow Copy" ou "Fork" lors de l'édition de templates globaux pour garantir la persistance sans corrompre les fichiers source.

### Réactivité des Sélecteurs Zustand
**Problème :** L'usage de `useMemo` avec une fonction stable du store (`getGameDriver`) empêchait le re-render. Le composant voyait toujours le même ID et la même fonction, ignorant que les données à l'intérieur du store avaient changé.
**Solution :** Utiliser un sélecteur Zustand explicite qui déstructure les dépendances directes (`customGameDrivers`) pour "forcer" l'abonnement du composant aux changements de données, et non juste à l'action.
**Apprentissage :** Dans Zustand, si une action de lecture (`getXXX`) utilise `get()` en interne, elle n'est pas réactive par nature. Le sélecteur du composant doit explicitement toucher aux propriétés de données (Data Props) pour déclencher une mise à jour de l'UI.

## 📡 Réseau : Le Piège de la Synchronisation Filtrée

### Données de Forge manquantes
**Problème :** Sur le Tablet Hub, les personnages s'affichaient avec le template "Générique" au lieu du template spécifique (ex: Cthulhu Hack), bien que les données soient correctes côté MJ.
**Solution :** Le pont WebSocket filtrait les données envoyées aux hubs pour optimiser la bande passante, oubliant les définitions de la Forge (`customSheetTemplates`, `customGameDrivers`). L'inclusion de ces métadonnées dans le payload de synchronisation a résolu le problème.
**Apprentissage :** Dans une architecture distribuée, l'UI "pure" (fonction de l'état) ne peut fonctionner que si l'état inclut non seulement les données (`characters`), mais aussi les règles de rendu (`templates`).

### Résolution des Médias Distants (`m-` IDs)
**Problème :** Les clients distants (tablettes) recevaient des IDs internes `m-xxx` qu'ils ne pouvaient pas résoudre localement (pas d'accès direct à l'IndexedDB du MJ).
**Solution :** Double sécurité. 1) Le MJ pré-résout tous les médias en URLs absolues via son proxy local (`3001/temp/`) avant l'envoi du `sync`. 2) Le Hub dispose d'un `failsafe` dans `useMediaUrl` redirigeant vers l'IP réseau du MJ si un ID non résolu est détecté.
**Apprentissage :** Ne jamais exposer d'identifiants de stockage local à des systèmes distants. La résolution en URL "live" doit être la responsabilité de l'émetteur (Broadcast) ou d'un service de proxy transparent.

## 📱 UI/UX : Textareas & Flexibilité Mobile

### Saisie Narrative sur Tablette
**Problème :** L'édition de longs textes (Inventaire, Notes) sur mobile est complexe avec des inputs standards.
**Solution :** Utilisation de `textarea` avec un style "Glassmorphism" sans bordures rigides, déclenchant une synchronisation `onBlur` (perte de focus). Cela évite de saturer le réseau à chaque frappe tout en garantissant la persistance.
**Apprentissage :** Pour les interfaces tactiles, privilégier des zones de saisie larges et un feedback visuel de liaison active pour rassurer l'utilisateur sur la sauvegarde de ses données.

## 🧱 Architecture : Isolation Logicielle & Data Leakage

### Filtrage des Données par Campagne
**Problème :** Des indices d'une autre campagne (le cas "Milo") apparaissaient dans le Cockpit du MJ car la session ne vérifiait que l'état `isRevealed` et non l'appartenance à la campagne active.
**Solution :** Imposition d'un filtrage systématique par `activeCampaignId` dans tous les sélecteurs de données du Session-OS (Cockpit, Oracle AI, Détails entité).
**Apprentissage :** Dans un système multi-projets, "Filtrage par défaut" (Scope-by-Active) est plus sûr que "Filtrer au besoin". Chaque module doit être hermétique à l'ID de sa racine (Campagne/Projet).

## 📡 Réseau : Le Défi de la Confidentialité des Données Privées

### Sécurisation de l'Inventaire PJ (Secure Sync)
**Problème :** Envoyer tout le store des favoris aux tablettes permettrait à n'importe quel joueur de voir les objets secrets des autres en inspectant l'état local.
**Solution :** Implémentation d'un filtrage pré-diffusion dans `App.tsx`. Le MJ ne "broadcast" pas tout, il cible l'envoi en fonction du `characterId` du destinataire.
**Apprentissage :** La confiance ne doit pas reposer uniquement sur l'UI (masquage visuel). Le filtrage doit se faire au niveau du canal de transmission (MJ -> Réseau) pour garantir une isolation réelle.

## 📡 Réseau : Stratégies de Synchronisation de Haute Précision

### L'Importance de la Souscription Explicite
**Problème :** Donner un objet ou modifier des PV ne se reflétait pas instantanément sur Hub, exigeant un rafraîchissement manuel. Bien que le payload de sync soit prêt, le MJ ne "savait pas" qu'il devait broadcaster car il ne surveillait pas les bons stores.
**Solution :** Ajout d'abonnements au store (`store.subscribe()`) dans le module racine `App.tsx`. Toute modification du store des favoris, du combat ou du storyboard déclenche un broadcast immédiat.
**Apprentissage :** Dans un système de synchronisation "Push", ne jamais se fier aux cycles de rendu React pour l'émission de données. Une écoute directe sur les magasins d'état est indispensable pour une expérience sans latence.

### Résolution de Médias en Processus Amont
**Problème :** Envoyer un ID local (`m-xxx`) à un client distant est inutile sans résolution. Les failsafes "centraux" (côté Hub) sont complexes à maintenir pour chaque composant.
**Solution :** Centraliser la résolution de l'ID en URL diffusable directement dans les actions du store MJ (`projectSolo`, `projectUrl`). Le Hub reçoit alors une URL valide (HTTP Proxy ou Data URI) prête à l'emploi.
**Apprentissage :** La "Sendability" d'une donnée doit être garantie par l'émetteur. Plus le message est "prêt à consommer", plus l'UI cliente sera fluide et robuste.

### Segmentation de l'État par Usage UI (Live vs Sac)
**Problème :** Un flux continu d'objets (Items) dans le dashboard principal du Hub polluait l'ambiance narrative et rendait le défilement illisible.
**Solution :** Segmentation logique au niveau du rendu Hub. Filtrage strict du dashboard pour les types `npc/location` et déplacement automatique des `item` dans un onglet dédié.
**Apprentissage :** Même synchronisées, les données brutes ne doivent pas être "tout ou rien" au niveau de l'affichage. La hiérarchisation par type mime/nature de donnée est cruciale pour l'UX sur petit écran (tablette/mobile).

---
*Dernière mise à jour : 1 Avril 2026*
*Statut : Standards de Synchronisation v5.15 validés.*
