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

## 🎨 UI/UX : Défis du Rendu Multi-Calques & Projection (Map-OS)

### Synchronisation des Calques Dynamiques

**Problème :** Certains calques (ex: `AmbianceLayer`) reçoivent des états différents (Master/Projecté). Si le composant ne différencie pas l'origine de l'état, l'écran des joueurs (Hub) n'affiche pas les changements faits par le MJ.

**Solution :** Utilisation d'une prop `isProjectedView` systématique pour les calques d'effet. Le composant commute alors sa souscription Zustand entre l'état local et l'état de projection.

**Apprentissage :** Dans un workflow multi-écrans (GM-OS), les composants de rendu doivent vivre dans deux "modes" distincts. Le passage explicite par prop est plus robuste que la détection automatique de l'environnement (ex: checking window titles).

### Conflits de Blend-Modes (Multiply vs Backdrop-Filter)

**Problème :** L'application de `mix-blend-mode: multiply` sur un conteneur principal (`div`) qui a la propriété `pointer-events: none` peut rendre les filtres (`backdrop-filter`) de ses enfants invisibles dans Chromium si un parent possède une transformation CSS (zoom/pan).

**Solution :** Déplacer le `mix-blend-mode` à l'intérieur du conteneur, directement sur l'élément qui porte la couleur de fond et les filtres. 

**Apprentissage :** Le groupement des propriétés de mélange (blending) et de filtrage sur le même élément évite de créer des contextes d'empilement (stacking contexts) contradictoires.

---

## 🧠 Intelligence Artificielle Locale : Souveraineté & Défis

### Extraction JSON vs Native Schema Support

**Problème :** Contrairement aux APIs Cloud (Gemini, OpenAI), les modèles locaux via Ollama (comme Gemma 4) ne supportent pas toujours le mode "JSON strict" de manière native et fiable. Ils ont tendance à "préambuler" la réponse (ex: "Voici le JSON demandé...") ce qui casse le `JSON.parse`.

**Solution :** Implémentation d'un service d'IA agnostique doté d'un extracteur Regex `/{[\s\S]*}/` robuste. Cela permet de "pêcher" l'objet JSON au milieu d'une réponse verbeuse.

**Apprentissage :** Pour une architecture local-first, le code doit être "tolérant au bruit" des LLM locaux. La validation du schéma (Zod/Interfaces) doit intervenir après l'extraction et non pendant la requête.

### Dilemme du Contexte Multimodal

**Problème :** Gemma 4 26B MoE est exceptionnel pour le texte, mais aveugle aux images/PDF (contrairement à Gemini 1.5 Flash).

**Solution :** Utilisation d'une architecture hybride. NotebookLM (Cloud) sert de processeur de vision/document pour extraire la "vérité textuelle", qui est ensuite injectée dans le contexte local de Gemma 4 pour la génération narrative finale.

**Apprentissage :** L'agence IA locale ne signifie pas l'abandon du Cloud, mais sa relégation à des fonctions "sensorielles" (Vision/OCR), laissant le "cerveau créatif" en local pour la confidentialité.

---

## 📡 Réseau : Stabilisation Electron vs Windows (Ollama)

### Le Piège de la pile réseau Node.js

**Problème :** L'appel de services locaux (`localhost`) via la pile réseau native de Node.js (`fetch`) échoue souvent sur Windows à cause d'une résolution prioritaire vers IPv6 (`::1`), alors que de nombreux serveurs locaux (dont Ollama) n'écoutent que sur IPv4 (`127.0.0.1`). Cela génère des erreurs `fetch failed` ou `ERR_CONNECTION_REFUSED` intermittentes.

**Solution :**
1.  **Migration vers `net.fetch` (Electron)** : Utilisation de la pile réseau de Chromium (Chrome), plus robuste et mieux intégrée au système de certificats et de pare-feu Windows.
2.  **Forçage IP Littérale** : Abandon de `localhost` au profit de `127.0.0.1` dans les configurations de service.
3.  **DNS Priority Swap** : Utilisation de `dns.setDefaultResultOrder('ipv4first')` dans le processus principal pour garantir que l'application privilégie systématiquement l'IPv4.

**Apprentissage :** Dans un environnement Electron sur Windows, ne jamais faire confiance à la pile réseau de Node.js pour les communications inter-services locales critiques. Passer par le pont natif d'Electron est la seule garantie de stabilité 100%.

---

---

## 📡 Réseau & Sync : Le Piège de la Boucle de Nettoyage (Cleanup Loop)

### État Local vs État Store (La Boucle des Notes Privées)

**Problème :** Lors de l'implémentation des notes privées sur tablette (v6.2.1-dev), l'utilisation d'un `useEffect` pour sauvegarder au démontage a créé un bug critique. L'effet dépendait de `localNotes`, déclenchant son nettoyage à chaque changement d'état. Le nettoyage appelait `remoteUpdateCharacterNarrative`, qui mettait à jour le store MJ, qui renvoyait un signal `sync` à la tablette, qui mettait à jour `localNotes`, et ainsi de suite à chaque touche pressée.

**Solution :**
1.  **Isolation de la Dépendance** : Retirer `localNotes` du tableau de dépendances de l'effet de nettoyage.
2.  **Utilisation de Refs** : Utiliser un `notesRef` mis à jour de manière synchrone à chaque touche, mais consommé uniquement dans le nettoyage (cleanup) ou le délai de sauvegarde (debounce).
3.  **Filtrage par Echo** : Comparer la valeur reçue du store avec la dernière valeur envoyée avant de mettre à jour l'état local (guard clause).

**Apprentissage :** Dans un système distribué à haute réactivité (Sync WebSockets), le nettoyage d'un `useEffect` ne doit jamais dépendre d'une donnée qui change fréquemment si ce nettoyage émet lui-même un signal réseau modifiant cette donnée. Les `refs` sont indispensables pour capturer la "dernière volonté" de l'utilisateur sans polluer le cycle de rendu.

## 📡 Réseau & Sync : Échanges P2P & Validation MJ

### L'importance du Nettoyage d'État (Atomic Transfer)

**Problème :** Lors d'un don d'objet (v6.2.2-dev), l'objet était transféré avec son statut `pending`. S'il n'était pas nettoyé au moment de l'injection chez le destinataire, l'objet restait grisé et "gelé", rendant l'échange caduc.

**Solution :** Nettoyage explicite des drapeaux temporaires (`delete item.status`) dans le store MJ juste avant l'appel à `addInventoryItem` pour le destinataire.

**Apprentissage :** Dans un transfert d'entité entre domaines (ex: Joueur A -> Joueur B), l'objet doit être "réinitialisé" à un état pur pour garantir son intégration sans effets de bord hérités de son ancien contexte.

### Piège de la Portée des Imports (Global React Scope)

**Problème :** L'usage de `React.useRef` ou `React.useEffect` dans un fichier n'importe que les hooks nommés (`import { useRef } from 'react'`) provoque une erreur `ReferenceError: React is not defined`. 

**Solution :** Toujours privilégier les imports nommés directs (`useRef()`) pour la cohérence ou assurer l'import du défaut (`import React from 'react'`) si l'on souhaite utiliser l'espace de noms.

**Apprentissage :** Ne jamais copier-coller des patterns utilisant l'espace de noms `React.` dans des fichiers utilisant des imports destructurés sans vérifier l'import de base.

---

Dernière mise à jour : 8 Avril 2026

Statut : Stabilisation réseau Windows, intégration Gemma 4 et système d'échange P2P documentés.
