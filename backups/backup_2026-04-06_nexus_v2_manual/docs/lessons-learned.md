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

### Intégrité des Données

Le cycle de vie d'un bundle Nexus-OS suit un protocole de test strict appelé **Round-Trip Integration** :

- **Scrape** : Extraction des données locales (JSON + Assets).
- **Remap** : Transformation des chemins vers des tokens portables (`media://`).
- **Inject** : Restauration dans un environnement vierge.

Le succès de ce cycle est validé par la suite de tests `NexusService.test.ts`.

---

## 🎨 Design & UI (v6 Refactor)

### CSS Masking et Reflets Premium

L'utilisation de bordures "lumineuses" via `mask-composite` (style Bento Box) nécessite une attention particulière sur l'ordre des propriétés pour éviter les régressions visuelles dans Electron (Chromium v100+) :

- **Ordre des préfixes** : Toujours placer `-webkit-backdrop-filter` avant `backdrop-filter` pour garantir la compatibilité descendante.
- **Masquage Complexe** : Pour obtenir un liseré translucide interne (Glassmorphism 2.0), utiliser deux gradients dans le `mask` (un `content-box` et un `border-box`) avec `mask-composite: exclude` (standard) et `-webkit-mask-composite: xor` (Chromium).
- **Considération de PERFORMANCE** : Limiter l'usage de `backdrop-filter` aux conteneurs de premier niveau (panels, modales) pour éviter les lags de rendu lors des animations de scroll massif.

---

## 📚 Documentation Continue

### Règle du "Dernier Pas"

**Problème :** La documentation est souvent oubliée après l'implémentation.

**Solution :** Ajout aux `instructions.md` imposant la mise à jour systématique du README, des guides techniques et de l'historique avant de clore une tâche.

**Apprentissage :** L'archivage systématique des walkthroughs dans `docs/history/` permet de garder une trace claire de l'évolution du projet sans polluer l'espace de travail actif.

---

## 🧠 Store & Reactivity : Conscience de Session IA

### Accès aux Stores via `getState()` hors Hooks

**Problème :** Injecter le contexte vivant dans `AIService` (une classe TypeScript pure) ne peut pas se faire via les Hooks React standard (`useSessionOSStore()`).

**Solution :** Utilisation de `useSessionOSStore.getState()` pour une extraction atomique et performante du contexte lors de la génération du prompt, sans déclencher de re-renders inutiles dans l'UI.

**Apprentissage :** Pour les services de "collecte de contexte" (RAG, Oracle), l'accès direct à l'état via Zustand est préférable à l'injection de dépendances complexe via l'UI, simplifiant ainsi le découplage "Business Logic / UI".

### Stratégie de "Spoiler-Free AI"

**Problème :** L'IA connaît tous les indices (`clues`) de la campagne par défaut, risquant de révéler des secrets aux joueurs via ses réponses.

**Solution :** Filtrage algorithmique strict (`isRevealed === true`) au niveau du service de collecte (`getLiveSessionContext`).

**Apprentissage :** La sécurité des données dans un JdR distribué doit être gérée par l'émetteur du contexte, pas par le récepteur (IA).

---

## 📡 Réseau : Le Défi de la Confidentialité des Données Privées

### Sécurisation de l'Inventaire PJ (Secure Sync)

**Problème :** Envoi du store entier exposait les objets secrets des autres joueurs.

**Solution :** Filtrage pré-diffusion dans `App.tsx`, ciblé par `characterId`.

**Apprentissage :** La confiance ne doit pas reposer uniquement sur l'UI. Le filtrage doit se faire au niveau du canal de transmission.

---

## 📦 Nexus-OS : Validation Polymorphe de Manifestes

### Le piège de la validation rigide

**Problème :** Lors de l'extension de Nexus-OS aux **Drivers**, le validateur core échouait car il exigeait systématiquement des métadonnées de campagne (`campaignId`), absentes des paquets de règles isolés.

**Solution :**
1.  **Conscience du Type** : Utilisation du champ `bundleType` dans le manifeste pour embrancher la logique de validation.
2.  **Accès Défensif (TypeScript)** : Utilisation de l'accès par crochet `m['field']` sur les objets `Record<string, unknown>` pour éviter les erreurs de type strict sans sacrifier la flexibilité.

**Apprentissage :** Pour tout système de "Plugin" ou d'archive modulaire, la validation doit être décorréler du schéma global et être contextuelle au type d'objet transporté. Cela permet d'ajouter de nouveaux types de bundles (ex: Atlas-only, Sound-Pack) sans modifier le moteur de validation central.

---

## 📦 Nexus-OS v2 : Découplage Service/UI Interactif

### Le piège de la promesse orpheline

**Problème :** L'introduction d'une phase d'interaction MJ (Remote Check) dans le service a révélé un bug de couplage. Le service attendait une résolution via `interactionResolver`, mais certains composants UI (ex: `CampaignDetails`) affichaient le HUD sans passer le callback `onResolveInteraction`. Résultat : le bouton "Tout localiser" ne faisait rien (appel de `undefined`).

**Solution :** Standardisation de l'interface du `NexusHUD` et passage systématique du callback de résolution vers le singleton `NexusService`.

**Apprentissage :** Pour les services orchestrateurs qui nécessitent des pauses "UI-Blocking", il est crucial de valider la présence des ponts de communication (callbacks) dès l'initialisation de la phase pour éviter les états de "hang" (suspension infinie).

### Scan Récursif vs Performance

**Problème :** Scanner tout l'état d'une campagne pour des URLs distantes peut être coûteux si la profondeur de l'objet est grande.

**Solution :** Utilisation d'un pattern de "dry-run" récursif avec un cache `Set` pour éviter les cycles et limiter le scan aux chaînes de caractères commençant par `http`.

**Apprentissage :** Le découplage entre le "Scan" (identification) et la "Localisation" (action) est essentiel pour permettre au MJ de prendre une décision éclairée (HUD v2) avant de déclencher des opérations réseau lourdes.

---

Dernière mise à jour : 6 Avril 2026

Statut : Oracle IA Contextuel, Nexus-OS v2 (Remote Check) et Standards de Synchronisation documentés.
