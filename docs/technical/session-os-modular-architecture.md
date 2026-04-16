# 📑 Spécification Technique : Architecture Modulaire de Session-OS

Ce document décrit l'architecture standard du module `Session-OS` après la refonte du 27 Mars 2026. Cette structure doit servir de modèle pour tous les autres OS du projet.

---

## 1. Gestion d'État (Store Zustand)

### Slicing Pattern

Le store est divisé en "tranches" (Slices) isolées par domaine métier. Chaque slice gère son propre état et ses actions.

- **Localisation** : `src/modules/session/store/`
- **Types** : `store/types.ts` centralise toutes les interfaces pour éviter les imports circulaires.
- **Assemblage** : `store/index.ts` utilise la fonction `create()` de Zustand pour combiner les slices.
- **Loot Integration** : Le `lootSlice` gère le pool d'objets partagés et l'historique de distribution, communiquant avec l' `entitySlice` pour l'assignation finale.

### Configuration du Store

- **Persistance** : Utilise le middleware `persist` avec la clé `gmos-v5-session-os-storage`.
- **Migration** : Gérée via la propriété `version` (actuelle : 10). Toute modification structurelle de l'état persistant DOIT incrémenter cette version.
- **Actions Cross-Domain** : Les fonctions nécessitant de modifier plusieurs slices (ex: `launchSession`) sont définies dans `store/index.ts`.

---

## 2. Architecture de l'Interface (UI)

### Registry Pattern

Le rendu des vues est délégué à un registre centralisé.

- **SessionHeader.tsx** : Composant de navigation fixe.
- **SessionViewRegistry.tsx** : Mappe l'état `currentView` vers le composant React correspondant. Gère les deux types de layout :
  1. **Full Layout** : Le composant occupe les 12 colonnes de la grille.
  2. **Split Layout** : Affiche le `CampaignCockpit` (3 cols) et le contenu (9 cols).

---

## 3. Standards de Code

- **Typage** : Aucun usage de `any`. Utiliser les interfaces de `types.ts`.
- **Logique Métier** : Doit être extraite dans des services ou interpréteurs (`logic/HealthInterpreter.ts`) pour être testable indépendamment de React.
- **Notifications** : Utiliser exclusivement `gmToast(message, type)` pour les feedbacks utilisateur.

---

## 4. AI Forge & Performance

### Proxy IA (Electron Main)

Les requêtes vers l'API Gemini transitent par un tunnel IPC sécurisé dans le processus principal d'Electron (`main.ts`).

- **Timeout** : Fixé à **300 secondes (5 minutes)** pour permettre l'analyse de documents PDF volumineux.
- **Payload Logging** : Les services (`ChronicleService`, `ForgeService`) loggent systématiquement la taille du payload envoyé en MB pour le monitoring de charge.

---

## 5. Hub Synchronization Engine (Nexus Bridge)

### Deep Sync Protocol

La synchronisation entre le Cockpit MJ et le Tablet Hub utilise un pont WebSocket bidirectionnel.

- **Broadcast Sélectif (Campagne & Visibilité)** : Le MJ n'envoie que les données nécessaires à la session active (`activeCampaignId`). De plus, pour les entités (PNJ, Monstres, Alliés), un second filtre `isVisibleByPlayers === true` garantit que seuls les éléments révélés sont transmis au Tablet Hub.
- **Sync Subscriptions (Zero-Latency)** : Pour garantir une mise à jour instantanée sans rafraîchissement manuel, le composant racine `App.tsx` s'abonne explicitement aux changements de plusieurs stores clés (`useFavoriteStore`, `useStoryboardStore`, `useCombatStore`). Cela déclenche un broadcast WebSockets immédiat dès qu'un objet est donné ou qu'un PV est modifié.
- **Forge Sync** : Depuis la v5.11, le payload inclut les `customSheetTemplates` et `customGameDrivers`. Cela garantit que la tablette peut effectuer des calculs de règles et un rendu d'UI identique au MJ sans accès direct à la base de données locale.
- **Trombinoscope Interface** : Le Tablet Hub consomme le flux filtré d'entités pour générer une galerie de reconnaissance en temps réel, synchronisée avec les actions de visibilité du MJ.

### Template Resolution Logic

La résolution de la fiche de personnage (`logic/templateResolver.ts`) suit une hiérarchie stricte pour garantir la cohérence visuelle :

- **Template Spécifique** : Si `character.templateId` est défini et valide.
- **Template Système** : Recherche un template correspondant au `gameSystem` de la campagne.
- **Template Générique** : Fallback sur le template par défaut de Session-OS.

---

## 6. Gouvernance des Données & Isolation (Scope-by-Active)

### Principe d'Herméticité

Pour éviter toute fuite de données entre projets ("Data Leakage"), Session-OS impose un filtrage strict à la source de l'UI.


- **activeCampaignId** : Chaque requête d'affichage (indices, PNJs, cartes) doit inclure une clause `campaignId === activeCampaignId`.
- **Composants Critiques** : `SessionClueDeck.tsx` (Deck MJ) et `OraclePanel.tsx` (Contexte IA) sont les gardiens de cette isolation.


---

## 7. Résolution Médias & Proxy Distant

### Protocole de Résolution Temps-Réel

La gestion des IDs `m-xxx` (Blob IDs stockés en local) nécessite une couche d'abstraction pour les clients distants.

- **Broadcast Resolution** : Avant l'envoi du signal `sync`, le MJ résout tous les médias en URLs absolues ou Data URIs via son proxy local (`http://[IP]:3001/temp/[ID]`). Le `useImageStore` assure cette résolution via `resolveToSendableUrl` avant chaque `syncHubData`.
- **Intégrité des Identifiants (m- prefix)** : Depuis la v6.1.2-dev, le MJ garantit la conservation du préfixe `m-` dans l'URL du proxy. Cela assure la correspondance directe avec les fichiers stockés dans le dossier `TEMP_MEDIA` du MJ, évitant les erreurs 404 sur les tablettes.
- **Pont de Protocoles (Custom Schemes)** : Le hook `useMediaUrl` détecte et traduit les schémas propriétaires MJ (ex: `gmos://media/`) en URLs HTTP valides pour le proxy Nexus Bridge. Cela permet aux tablettes distantes d'afficher des images stockées physiquement sur le PC du MJ.
- **Hub Failsafe** : Le hook `useMediaUrl` sur les tablettes redirige automatiquement vers l'IP du MJ si un identifiant non résolu est détecté dans le store synchronisé.
- **Deduplication Logic** : Le moteur de rendu des Hubs (Player/Tablet) déduplique dynamiquement les entités. Pour éviter la saturation visuelle (ex: afficher 3 fois le même PNJ), il suit une priorité stricte :
  1. `liveEntity` (Priorité Alpha) est affichée.
  2. Les `favorites` sont filtrés pour exclure tout ID ou Nom déjà présent dans `liveEntity`.
  3. `liveImagePath` est masqué si l'URL de l'image correspond à l'avatar d'une entité déjà affichée sur l'écran.
- **Persistence Cleanup** : Le store d'images utilise `onRehydrateStorage` pour purger automatiquement les projections orphelines (IDs de médias inexistants) au démarrage, évitant l'affichage de "ghost images" d'anciennes campagnes.

---

## 8. Standards d'Accessibilité (A11y) & Qualité

### Protocoles UI

Tous les composants de `Session-OS` doivent respecter les standards d'accessibilité WCAG (Niveau AA) :

- **ID & Labeling** : Utilisation stricte de `htmlFor` sur les labels et `id` uniques sur les inputs.
- **Rôle Sémantique** : Conversion des `div` cliquables en `button type="button"` pour assurer la navigabilité au clavier.
- **Feedback d'État** : Utilisation de `aria-checked` (chaîne "true"/"false") pour les éléments personnalisés.

### Modularité par Hooks

La logique métier complexe ne doit jamais résider dans le composant UI. Elle doit être extraite dans un custom hook spécialisé (ex: `useDeckPlayer`) et validée via des tests unitaires **Vitest**.

---

## 9. Design System : Glassmorphism 2.0 & Bento Style

Depuis la v6.1.0-dev, Session-OS utilise un standard visuel avancé basé sur le "Glassmorphism 2.0".

### Utilitaire `.glass-bento`

- **Structure** : Utilise un `backdrop-filter: blur(20px)` combiné à une saturation de 180% pour une profondeur maximale.
- **Bordures Lumineuses** : Implémentées via un pseudo-élément `::before` utilisant un masque CSS combiné (`mask-composite: exclude`). Cela crée un liseré de gradient interne ultra-fin qui réagit à la lumière.
- **Micro-animations** : Intégration systématique de `framer-motion` pour les entrées en cascade (`staggerChildren`) et les transitions de vues fluides.

### Adaptabilité Thématique (Variables CSS)

Le design system repose sur trois jetons heritables par thème (`:root[data-theme]`) :

- `--glass-bg` : Couleur de fond semi-transparente.
- `--glass-border` : Couleur de la bordure externe.
- `--glass-highlight` : Couleur de l'éclat interne (halo).

---

---

## 10. Navigation Patterns & Atomic State Transitions

### Principe d'Atomicité de Navigation

Depuis la v6.1.1-dev (6 Avril 2026), Session-OS utilise un pattern de transition d'état atomique pour éviter les conditions de course (Race Conditions) lors de la navigation entre modules (ex: du Cockpit vers l'Atlas Map).

- **Problème** : Changer la vue (`currentView`) et l'entité sélectionnée (`selectedAtlasMapId`) via deux appels séparés au store provoquait un rendu intermédiaire où l'une des deux données était nulle, causant des plantages UI ou des réinitialisations de sélection.
- **Solution** : Utilisation d'actions atomiques regroupées dans le store racine (`store/index.ts`).
  - `navigateToAtlasMap(id)` : Change la vue vers `world-atlas` ET fixe le `selectedAtlasMapId` dans un seul appel `set()`.
  - `navigateToNpcDetail(id)` : Change la vue vers `npc-gallery` ET fixe le `selectedEntityId` de manière atomique.

### Standard d'Interaction (Cross-Domain)

Toute navigation déclenchée depuis le Cockpit (Lieux Épinglés, PNJs Actifs) DOIT passer par ces actions atomiques pour garantir que le composant de destination reçoit l'état complet dès son premier cycle de rendu.

---

## 11. Unified & Agnostic AI Core (Gemma 4 & Stability)

Depuis la v6.2.0-dev (7 Avril 2026), Session-OS intègre un moteur d'IA agnostique capable de basculer dynamiquement entre Cloud et Local-First, avec une pile réseau optimisée pour Windows.

### Orchestration Réseau & Stabilité (Electron Native Bridge)

Pour résoudre les instabilités réseau chroniques de Windows (erreurs `fetch failed` dues à la résolution IPv6 de Node.js), GM-OS utilise désormais trois piliers de stabilité :

- **Electron `net.fetch`** : Dans `OllamaService.ts`, nous avons migré du `fetch` natif de Node.js vers le module `net` d'Electron. Ce module utilise la pile réseau de Chromium (Chrome), qui est nativement plus performante pour franchir les pare-feu Windows et gérer les DNS locaux.
- **Forçage DNS IPv4 (`127.0.0.1`)** : Utilisation systématique de l'adresse `127.0.0.1` au lieu de `localhost` pour éviter toute tentative de résolution IPv6 (`::1`) par le système, souvent rejetée par Ollama.
- **Priorité DNS Globale** : Injection de `dns.setDefaultResultOrder('ipv4first')` dans le processus principal (`main.ts`).

### Orchestration Agnostique (`AIService.ts`)

Le coeur de l'intelligence ne dépend plus d'une API spécifique. Il utilise une interface unifiée :
- **Routage Dynamique** : Bascule entre `gemini` et `ollama` selon la configuration du `useAIStore`.
- **Génération JSON Robuste** : Utilisation d'extracteurs Regex pour garantir la validité des schémas JSON produits par les modèles locaux (ex: Gemma 4), qui incluent souvent des préambules explicatifs.

### Stratégie "Local-First" & Fallback

- **Souveraineté des Données** : Les calculs narratifs et résumés de session sont prioritairement routés vers **Gemma 4 26B MoE** via Ollama.
- **Support Multimodal (Cloud-Bridge)** : En l'absence de vision locale performante, le système utilise **NotebookLM** ou **Gemini** comme pont d'extraction avant de confier la narration textuelle au modèle local.

---

## 12. AI NPC Dialogue Prep (Neural Liaison Expansion)

Depuis la v6.1.2-dev, le système "Neural Liaison" a été étendu pour inclure les profiles complets des PNJs favoris (épinglés dans la session) dans le contexte de l'IA.

- **Extraction Automatique** : Le `getLiveSessionContext` de `AIService.ts` agrège dynamiquement les noms, rôles et descriptions de toutes les entités actives (`status: 'alive'`).
- **Synergie avec le Persona "L'Acteur"** : Ce persona (`id: 'actor'`) est optimisé pour utiliser ces données injectées afin de générer des répliques, des motivations et des accents spécifiques aux PNJs présents, sans saisie manuelle du MJ.
- **Architecture Data-Driven** : Comme ce contexte est "injecté" au moment de la requête, l'Oracle reste parfaitement à jour même si le MJ modifie un PNJ "à la volée" juste avant de poser une question.
- **Neural Dialogue Preparation** : Depuis la v6.1.3-dev, le persona "Acteur" peut être invoqué spécifiquement pour préparer des répliques. Il combine les `favoriteNPCs` de la session avec le contexte de l'article Wiki sélectionné pour offrir des options de dialogue prêtes à l'emploi.

---

## 14. Wiki-Timeline Bridge (Virtual Projection)

Depuis la v6.1.3-dev, le Wiki et la Chronologie sont synchronisés via un pattern de "Projection Virtuelle".

- **Temporal Pivot (`eventDate`)** : Le champ `eventDate` ajouté à `WikiEntry` sert d'identifiant temporel pour le moteur de fusion.
- **Pattern de Fusion à l'Exécution** : Le composant `TimelineView.tsx` ne duplique pas les données. Il effectue une fusion (`merge`) au moment du rendu entre les événements manuels (`timelineEvents`) et les articles Wiki datés. Cela garantit que toute modification dans le Wiki est immédiatement répercutée dans la Timeline sans risque de corruption de données ou de désynchronisation.
- **Deep-Linking & Navigation** : L'état `selectedWikiEntryId` et l'action `setWikiTab` sont utilisés pour permettre une navigation instantanée depuis un événement de la Timeline vers l'archive source dans le Wiki.

---

## 13. Narrative Synchronization & Player Private Notes

Depuis la v6.2.1-dev, Session-OS intègre un système de prise de notes privées persistantes pour les joueurs, synchronisé en temps réel avec le serveur MJ.

### Protocole de Synchronisation (`useHubSync.ts`)

La synchronisation repose sur trois piliers pour garantir la stabilité et éviter les boucles de rendu :

- **Action Distante** : L'action `session:update-character-narrative` est utilisée pour envoyer les mises à jour depuis la tablette vers le MJ.
- **Debounce & Buffer** : Le composant `PlayerPrivateNotes` utilise un délai de 1.5s (debounce) avant d'émettre une mise à jour, limitant la charge réseau.
- **Stabilité par Ref (`lastSyncRef`)** : Pour éviter que le retour du serveur (écho) n'écrase la saisie en cours du joueur, le composant utilise un `lastSyncRef`. Si la note reçue du serveur correspond à la dernière note envoyée par le client, la mise à jour de l'état local est ignorée.
- **WebSocket Lifecycle Foundation** : Depuis la v6.2.4-dev, le Tablet Hub implémente un pattern de gestion stricte du cycle de vie des sockets. Un `useEffect` avec fonction de nettoyage (`socket.close()`) et un flag de garde `isActive` empêchent les doublons d'écouteurs et les fuites mémoire lors des reconnexions ou changements de personnage.

### Architecture du Store MJ

Côté MJ, la mise à jour est interceptée par le `RemoteListener` qui appelle `updateCharacterNarrative` dans l' `entitySlice`. Les données sont stockées dans le champ `playerNotes` de l'objet `PlayerCharacter`, garantissant la persistance dans le bundle de campagne `.gmos`.

---

## 15. Loot System & Session Pool

Depuis la v6.2.5-dev, Session-OS dispose d'un moteur de distribution de butin.

- **Isolation du Pool** : Le `lootPool` est stocké séparément des inventaires joueurs, permettant au MJ de préparer le butin avant sa distribution.
- **Distribution Atomique** : L'action `assignLootToCharacter` effectue le transfert de propriété de manière atomique : retrait du pool MJ et injection immédiate dans l'inventaire filtré du joueur cible.
- **Historisation** : Chaque distribution génère un `LootHistoryEntry` persistant, garantissant la traçabilité des échanges de richesses.

---

## 16. Extraction de Logique Métier (Hooks Spécialisés)

Depuis la v6.2.6-dev (11 Avril 2026), Session-OS a finalisé l'extraction de sa logique métier des composants UI vers des hooks spécialisés.

- **useSessionNPCs** : Gère le filtrage, la visibilité et l'état des PNJs de la session active. Centralise la logique de "Status Toggle" (Vivant/Mort) et de "Visibility Toggle" pour le Hub.
- **useSessionClues** : Orchestre le "Clue Deck", gérant les états de découverte (Hidden/Revealed) et la projection vers le Player Hub.
- **useSessionNotes** : Encapsule la persistance et la synchronisation des notes de session du MJ, incluant le support de l'auto-save et du multilingue.

Ce pattern permet :
1. **Tests Unitaires** : Validation de la logique via Vitest sans dépendance au DOM.
2. **Réutilisabilité** : Partage de la même logique entre le Cockpit, le Wiki et les vues détaillées.
3. **Lisibilité** : Réduction de la taille des composants UI de ~40%.

---

## 17. Standard d'Internationalisation (I18n) & Localisation

Le projet GM-OS utilise `i18next` pour le support multilingue. Suite à la découverte de collisions de namespaces (Nesting Pitfall), un standard strict est imposé :

### Standard de Nesting (Indentation)

- **Namespace Unique** : Chaque module majeur utilise son propre namespace (ex: `modules`, `common`).
- **Nesting de Niveau 2** : Les nouveaux sous-modules ne doivent jamais être imbriqués dans des objets existants partagés (comme `map`). Ils doivent être déclarés au premier niveau sous leur module parent dans le JSON.
- **Exemple Correct** : `modules:session.notes` est correct. `modules:map.session_notes` est interdit.

### Encodage & Sécurité

- **UTF-8 Strict** : Tous les fichiers `.json` de locales doivent être encodés en UTF-8 (sans BOM). L'utilisation de caractères double-encodés (ex: `Ã‰`) est proscrite et doit être corrigée immédiatement via le script de réparation d'encodage.

---

*Dernière mise à jour : 11 Avril 2026 - GM-OS v6.2.6-dev : Logic Extraction (Hooks), I18n Standardization & encoding fix.*
