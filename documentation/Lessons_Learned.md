# 🧠 Lessons Learned - GM-OS v5

Ce document consigne les défis techniques, les erreurs rencontrées et les solutions architecturales adoptées lors du développement de GM-OS v5.

## 🌉 MCP & Communication Inter-Processus

### 1. Corruption de flux JSON-RPC (2026-04-18)
- **Défi** : Le serveur MCP Python renvoyait parfois des logs de debug (stdout) mélangés avec les réponses JSON, corrompant le parsing côté Electron.
- **Solution** : 
    - Rediriger tous les logs Python vers `stderr` ou un fichier log dédié.
    - Utiliser un wrapper (`run_mcp.py`) pour isoler l'environnement d'exécution.
    - Implémenter un buffer robuste dans `mcp_bridge.ts` pour accumuler les chunks de stdout jusqu'à obtenir un JSON complet.

### 2. Désencapsulage des résultats MCP (2026-04-18)
- **Défi** : Le protocole MCP enveloppe les retours d'outils dans un tableau `content`. Si le résultat est lui-même un JSON stringifié, l'UI doit faire plusieurs `JSON.parse`.
- **Solution** : Implémenter un "Intelligent Unwrapper" dans le bridge Electron qui détecte les patterns `{"status": "success", ...}` et renvoie l'objet métier directement. Cela simplifie considérablement le code des composants React.

### 3. Expiration de Session Silencieuse (RPC Error 16)
- **Défi** : NotebookLM (via l'API interne) invalide les sessions après un certain temps, renvoyant une erreur 16 opaque.
- **Solution** : Créer un mécanisme de "Self-Healing" dans le bridge qui intercepte ce code d'erreur spécifique, déclenche une ré-authentification automatique via un process CLI masqué, et redémarre le serveur MCP de manière transparente pour l'utilisateur.

## 🏗️ Architecture & Build

### 1. Conflits ESM / CommonJS dans Electron
- **Défi** : L'utilisation de dépendances natives (ex: `ws`, `bufferutil`) dans le `main process` d'Electron provoque des erreurs de bundle avec Vite si `type: "module"` est activé.
- **Solution** : 
    - Externaliser les modules natifs dans `vite.config.ts`.
    - Utiliser `createRequire(import.meta.url)` dans `main.ts` pour charger les modules CJS de manière sécurisée dans un environnement ESM.

### 2. Typage Strict "Zéro-Any"
- **Défi** : Les objets complexes provenant d'APIs externes (NotebookLM) sont difficiles à typer intégralement.
- **Solution** : Utiliser des interfaces TypeScript strictes même pour les réponses dynamiques. Si le type est inconnu, utiliser `unknown` avec un type guard au lieu de `any`.

### 3. Le Grimoire et le découplage UI
- **Découplage Forge/Grimoire** : La consultation des règles doit être isolée de l'interface de création (Forge) pour éviter toute confusion ou modification accidentelle. L'implémentation d'une vue `rulebook` dédiée (Grimoire) permet une expérience de lecture premium et sereine.
- **État Global de Navigation** : L'utilisation de l'état global pour synchroniser les onglets des dashboards (ex: `templateDashboardTab`) facilite une navigation contextuelle cohérente depuis plusieurs points d'entrée (Cockpit, Header).

### 4. Sensibilité aux Slashes dans les URLs (Ollama) (2026-04-18)
- **Défi** : Ollama renvoie une erreur 405 (Method Not Allowed) si l'URL de l'endpoint contient un slash final (ex: `http://127.0.0.1:11434/`), car la concaténation produit `//api/chat`.
- **Solution** : Implémenter une normalisation systématique dans le service de bridge (Electron) pour supprimer les slashes de fin (`replace(/\/$/, '')`) avant toute requête, rendant l'interface robuste aux erreurs de saisie utilisateur.

## 💡 Immersion & Performance (V6)

### 1. Boucles Logiques vs Rendu React (Light-OS) (2026-04-21)
- **Défi** : Mettre à jour l'état React 10 fois par seconde pour des effets lumineux (stroboscope, glitch) sature le bridge et provoque des lags UI.
- **Solution** : Exécuter les boucles d'effets directement dans une instance de service (`HueEngine.ts`) sans passer par le store global pour les étapes intermédiaires. Seul l'état de l'effet actif est stocké dans Zustand. Utiliser `setInterval`/`setTimeout` gérés manuellement dans le service.

### 2. Réactivité Physique du Graphe (Nexus Social) (2026-04-21)
- **Défi** : Les réglages physiques (gravité, collision) du graphe D3 semblaient "gelés" lors de la modification via les sliders.
- **Solution** : Pour que D3 réagisse immédiatement aux changements de paramètres, il faut forcer `simulation.alphaTarget(0.3).restart()` tant que l'utilisateur manipule les réglages. Sans cela, la simulation se stabilise trop vite et ne traite pas les nouvelles forces.

### 3. Synchronisation P2P des Dés (Dice-OS) (2026-04-21)
- **Défi** : Les lancers de dés projetés sur le hub ne s'affichaient pas de manière fiable.
- **Solution** : S'assurer que le rôle `hub` (projection) est explicitement inclus dans les cibles de broadcast `syncFast`. Synchroniser l'ID unique du déclencheur de projection (`projectionTrigger`) au lieu de se fier uniquement aux changements de données brutes.

## 📜 Gestion des Règles & Partage (2026-04-22)

### 1. Affichage Prioritaire des Règles (Hub Visibility)
- **Défi** : Le partage d'une règle markdown par le MJ ne déclenchait pas automatiquement l'ouverture de la vue sur les tablettes des joueurs.
- **Solution** : Utiliser une action distante dédiée `session:display-rule` via le bridge au lieu d'un simple message de chat. Côté Tablet Hub, le hook `useHubSync` intercepte cette action et met à jour un état `sharedRule` qui pilote l'affichage d'un modal `HubRuleViewer` à haute priorité (Z-index élevé).

### 2. Export Inter-App (Obsidian)
- **Défi** : Les MJ souhaitent conserver leurs règles forgées par l'IA dans leur coffre Obsidian personnel.
- **Solution** : Implémenter un `ObsidianExportService` qui utilise le bridge pour écrire directement dans le dossier du coffre (vault) configuré, en gérant la conversion des métadonnées en frontmatter YAML.
## 🎨 UI & Composants (2026-04-22)

### 1. Bug des Fenêtres Externes (Native Select)
- **Défi** : L'utilisation d'un élément `<select>` HTML natif dans l'interface Electron provoquait, sur certains systèmes, l'ouverture de la liste d'options dans une fenêtre OS séparée, hors du container GM-OS.
- **Solution** : Remplacer systématiquement les `<select>` natifs par un composant `Select` personnalisé (React/Framer Motion). Ce composant simule le comportement d'un menu déroulant via un overlay interne, garantissant que l'UI reste confinée et stable dans le shell de l'application.

### 2. Gestion de l'État "Nul" (Campagne Active)
- **Défi** : Désactiver une campagne sans laisser le système dans un état instable ou avec des chemins de fichiers (Obsidian) orphelins.
- **Solution** : Autoriser explicitement `null` pour `activeCampaignId` et synchroniser la mise à jour des chemins système (vault Obsidian) lors de cette transition. Cela permet un état de "repos" propre de l'application entre deux sessions ou campagnes.
