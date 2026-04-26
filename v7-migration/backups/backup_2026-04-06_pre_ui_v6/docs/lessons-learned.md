# 📔 Lessons Learned : GM-OS v5 / v6

## 🛠️ Technique : Gestion des Médias dans IndexedDB

### Le défi des Orphelins
**Problème :** L'utilisation de `m-xxx` IDs rendait difficile la détection des fichiers inutilisés car ils sont dispersés dans plusieurs stores Zustand et bases de données locales.
**Solution :** L'implémentation d'un service centralisé (`MediaCleanupService`) collectant récursivement les IDs depuis tous les états globaux avant de comparer avec l'index physique.
**Apprentissage :** Pour des systèmes avec de nombreuses références croisées, il est plus sûr de construire une "whitelist" (Set) exhaustive au runtime plutôt que d'essayer de suivre chaque suppression.

---

## 🎨 UI/UX : Performance & Animations Vocales

### Styles Inline vs Variables CSS
**Problème :** Le linter rejette les styles inline, mais les animations (ex: `voiceLevel` ou barre de progression `NexusHUD`) nécessitent des mises à jour dynamiques fréquentes.
**Solution :** Utiliser des variables CSS (`--voice-scale`, `--progress-width`) injectées via le prop `style` de React. Les calculs sont faits côté JS, mais le rendu est géré par le moteur CSS via des classes utilitaires Tailwind (ex: `w-[var(--progress-width)]`).
**Apprentissage :** C'est le meilleur compromis entre "Zéro style inline" (standard de code v6) et performance. L'utilisation du cast `as React.CSSProperties` est nécessaire en TypeScript pour les variables personnalisées.

---

## 🧪 Testing : Mocking Global Audio & Stores

### Stabilisation des Tests System (AudioContext)
**Problème :** Les tests de services (ex: `NexusService`) importent souvent des stores qui initialisent des moteurs audio (`MusicEngine`), provoquant des erreurs `AudioContext is not a function` en environnement Node/Vitest.
**Solution :** Utiliser `vi.stubGlobal('AudioContext', ...)` au tout début du fichier de test pour simuler les méthodes `createMediaStreamDestination` et `createGain`. En complément, mocker les stores audio (`useMusicStore`, `useSoundStore`) pour court-circuiter l'initialisation des moteurs.
**Apprentissage :** Dans un projet hautement intégré (stores interdépendants), le mocking global des APIs natives du navigateur est indispensable même pour tester une logique métier pure (Import/Export).

---

## 📚 Documentation Continue

### Règle du "Dernier Pas"
**Problème :** La documentation est souvent oubliée après l'implémentation.
**Solution :** Ajout aux `instructions.md` imposant la mise à jour systématique du README, des guides techniques et de l'historique avant de clore une tâche.
**Apprentissage :** L'archivage systématique des walkthroughs dans `docs/history/` permet de garder une trace claire de l'évolution du projet sans polluer l'espace de travail actif.

---

## 🧩 Store & Reactivity : Synchronisation Deck-OS

### React Hooks & Early Returns
**Problème :** Dans `DeckPlayer.tsx`, l'utilisation de `useCallback` après un `if (!deck) return null` provoquait une erreur de violation des règles des Hooks.
**Solution :** Déplacer toute la logique de Hooks au tout début du composant, avant tout rendu conditionnel.
**Apprentissage :** Même si un composant ne "devrait pas" s'afficher sans données, ses Hooks doivent rester stables et enregistrés par React pour chaque rendu.

### Stratégie de "Cache-Busting" Logique (ID Unique)
**Problème :** Le retournement d'une carte ne déclenchait pas la mise à jour sur les Hubs distants.
**Solution :** Injection d'un `projectionId` basé sur un timestamp à chaque action utilisateur.
**Apprentissage :** Pour la synchronisation multi-fenêtres (Electron/Tauri), ne jamais se fier uniquement à l'identité des données métier.

---

## 🧠 Store & Reactivity : Édition de Drivers Système

### Fork-on-Edit pour Drivers Immuables
**Problème :** Les drivers intégrés sont immuables. Tentative de modification sans effet.
**Solution :** Logique "Fork-on-Edit" dans le `useSessionOSStore` — fork automatique si l'ID n'existe pas dans les `customGameDrivers`.
**Apprentissage :** Toujours prévoir un mécanisme de "Shadow Copy" ou "Fork" lors de l'édition de templates globaux.

### Réactivité des Sélecteurs Zustand
**Problème :** `useMemo` avec une fonction stable du store empêchait le re-render.
**Solution :** Utiliser un sélecteur Zustand explicite qui déstructure les dépendances directes.
**Apprentissage :** Dans Zustand, si une action de lecture (`getXXX`) utilise `get()` en interne, elle n'est pas réactive. Le sélecteur doit toucher aux propriétés de données pour déclencher une mise à jour.

---

## 📡 Réseau : Le Piège de la Synchronisation Filtrée

### Données de Forge manquantes
**Problème :** Sur le Tablet Hub, les personnages s'affichaient avec le template "Générique".
**Solution :** Inclure les `customSheetTemplates` et `customGameDrivers` dans le payload de synchronisation.
**Apprentissage :** Dans une architecture distribuée, l'UI "pure" ne peut fonctionner que si l'état inclut non seulement les données, mais aussi les règles de rendu.

### Résolution des Médias Distants (`m-` IDs)
**Problème :** Les clients distants recevaient des IDs internes `m-xxx` qu'ils ne pouvaient pas résoudre localement.
**Solution :** Double sécurité — pré-résolution en URL absolues + failsafe dans `useMediaUrl`.
**Apprentissage :** Ne jamais poser d'identifiants de stockage local à des systèmes distants.

---

## 🚨 IPC Electron : Limites de Taille et Sérialisation Silencieuse

### Le Piège du contextBridge pour les Gros Payloads
**Problème :** L'export Nexus résolvait correctement 57 blobs (log "57/57 Media Hub IDs résolus") mais le ZIP résultant ne contenait que `manifest.json` et `state.json`, sans aucun asset.
**Cause racine :** Le `preload.ts` exposait `exportBundle` avec **seulement 5 paramètres** — le 6ème (`inlineAssets`) avait été omis lors de l'écriture initiale du pont IPC. Les données étaient silencieusement abandonnées avant même d'atteindre le main process.
**Solution :** Pattern **Streaming IPC** — les assets sont envoyés un par un via `nexus.registerAsset(id, dataUrl)` dans un cache mémoire (`Map<string, string>`) côté main process. `exportBundle` lit depuis ce cache au lieu de recevoir les données en paramètre.
**Apprentissage :** 
- **Toujours vérifier le preload après modification des signatures IPC.** Le preload est "l'avocat du diable" entre le renderer et le main process — une signature manquante ne génère aucune erreur TypeScript côté renderer car les types sont définis séparément dans `window.d.ts`.
- **Ne jamais passer un objet de > 10 Mo en un seul `ipcRenderer.invoke`.** Même si Electron n'a pas de limite officielle documentée, la sérialisation via le structured clone algorithm peut tronquer, bloquer ou échouer silencieusement sur de très gros payloads.
- **Les logs de progression côté renderer ne prouvent pas que les données sont arrivées dans le main process.** Toujours ajouter des logs de confirmation dans les handlers IPC.

---

## 📱 UI/UX : Textareas & Flexibilité Mobile

### Saisie Narrative sur Tablette
**Problème :** L'édition de longs textes sur mobile est complexe avec des inputs standards.
**Solution :** `textarea` avec style Glassmorphism, synchronisation `onBlur`.
**Apprentissage :** Pour les interfaces tactiles, privilégier des zones de saisie larges et un feedback visuel de liaison active.

---

## 🧱 Architecture : Isolation Logicielle & Data Leakage

### Filtrage des Données par Campagne
**Problème :** Des indices ou personnages d'une autre campagne apparaissaient dans le Cockpit ou le Hub.
**Solution :** Filtrage systématique par `activeCampaignId` dans tous les sélecteurs. Attention particulière à la comparaison d'IDs (`String(a) === String(b)`) pour éviter les faux-négatifs dus au typage mixte (string vs number).
**Apprentissage :** "Filtrage par défaut" (Scope-by-Active) est plus sûr que "Filtrer au besoin". La conversion explicite en String dans les `useMemo` garantit une réactivité fiable même après une restauration de base de données.

---

## 🎨 UI/UX : Overlays Immersifs (Theater Mode)

### Gestion des Priorités Visuelles
**Problème :** Les résultats de dés étaient difficiles à lire sur mobile car noyés dans l'interface standard.
**Solution :** Implémentation du "Theater Mode" utilisant un overlay plein écran (`fixed inset-0`) avec un `z-index` très élevé (`z-[100]`) et un flou prononcé sur le reste de l'application.
**Apprentissage :** Pour les événements de haute importance (dés, notifications critiques), un changement radical de contexte visuel (Theater Mode) est plus efficace qu'un simple widget flottant. L'utilisation de `AnimatePresence` de Framer Motion est indispensable pour gérer les transitions d'entrée/sortie fluides sans "flash" visuel.

---

## 📡 Réseau : Le Défi de la Confidentialité des Données Privées

### Sécurisation de l'Inventaire PJ (Secure Sync)
**Problème :** Envoi du store entier exposait les objets secrets des autres joueurs.
**Solution :** Filtrage pré-diffusion dans `App.tsx`, ciblé par `characterId`.
**Apprentissage :** La confiance ne doit pas reposer uniquement sur l'UI. Le filtrage doit se faire au niveau du canal de transmission.

---

## 📡 Réseau : Stratégies de Synchronisation de Haute Précision

### L'Importance de la Souscription Explicite
**Problème :** Les modifications de store ne déclenchaient pas de broadcast automatique.
**Solution :** Abonnements `store.subscribe()` dans `App.tsx`.
**Apprentissage :** Dans un système Push, ne pas se fier aux cycles de rendu React pour l'émission.

### Résolution de Médias en Processus Amont
**Problème :** Envoyer un ID local (`m-xxx`) à un client distant est inutile sans résolution.
**Solution :** Centraliser la résolution directement dans les actions du store MJ.
**Apprentissage :** La "Sendability" d'une donnée doit être garantie par l'émetteur.

---

*Dernière mise à jour : 6 Avril 2026*
*Statut : Standards de Portabilité Nexus-OS v1.1 validés. Tests d'intégration et Refactoring CSS documentés.*
