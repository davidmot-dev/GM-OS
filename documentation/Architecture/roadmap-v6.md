# 🛣️ Roadmap : Transition vers GM-OS v6 (Next-Gen Hub)

> ## ⚠️ DOCUMENT PÉRIMÉ — ne pas s'en servir pour savoir quoi faire
>
> **Dernière mise à jour réelle : 16 avril 2026.** Tout ce qui a été conçu, décidé et livré depuis vit
> dans `documentation/Planning/`. Quatre mois de chantiers — la Forge Système, la Forge de campagne, la
> trame narrative, le journal de séance, l'accélération IA, le durcissement de l'architecture — n'y
> figurent pas.
>
> *Une roadmap fausse coûte plus qu'une roadmap absente* : celle-ci décrit des orientations qui ont été
> soit dépassées, soit abandonnées, soit accomplies autrement.
>
> **Où regarder à la place :**
>
> - **L'état du jour et le geste de reprise** → le `etat-et-reprise` le plus récent de
>   `documentation/Planning/` (au 2026-08-22 : `2026-08-22-etat-et-reprise.md`).
> - **La liste consolidée des restes, et le seul endroit où elle vit** →
>   `documentation/Planning/2026-08-19-reconciliation-plans-aout.md`, § 5.
> - **Quel document fait autorité sur quoi** → le § 1 du même document.
>
> Conservé pour l'histoire : il dit ce qu'on visait au printemps 2026, et c'est sa seule valeur.

Ce document trace les grandes orientations du projet suite à la stabilisation de la v6.2.0.

---

## ✅ Phase 0 : Portabilité & Nexus-OS (Mars—Avril 2026)

> *Complétée le 3 Avril 2026.*

- **[x] Nexus-OS MVP** : Export/Import de campagnes complètes en `.gmos` (ZIP structuré).
- **[x] Harvesting Médias** : Bundling des images (Media Hub `m-xxx`) et fichiers locaux.
- **[x] Streaming IPC** : Pattern anti-truncation pour contourner la limite de sérialisation Electron.
- **[x] Portabilité Audio** : Export/Import des atmosphères Sound Board et des playlists Music.
- **[x] Nexus HUD** : Interface de progression en temps réel (Glassmorphism), indicateur "Nexus-Ready".
- **[x] Conflict Resolver** : Gestion interactive des doublons d'ID (Remplacer / Cloner / Annuler).
- **[x] Import Nexus Bundle** : Bouton intégré dans la bibliothèque de campagnes.
- **[x] Round-Trip Validé** : Test export → reset → import avec restauration complète de l'état.

---

## 🏁 Phase 1 : Consolidation & Ponts (Avril—Mai 2026)

L'objectif est d'assurer une étanchéité parfaite des données tout en simplifiant le flux du MJ.

- **[x] Nexus-Link — Remote MJ Feedback loop** : Synchronisation réactive des jets de dés (local/remote) vers tous les MJ connectés.
- **[x] UI Premium (Glassmorphism 2.0)** : Refonte visuelle complète des composants de Session-OS.
- **[x] Map-OS Projection Restoration** : Restauration du flux de synchronisation atlas vers Hub/Moniteurs.
- **[x] Oracle IA Contextuel** : Intelligence "Session-Aware" injectant personnages, indices et historique dans les prompts.
- **[x] Nexus-OS v2 — Driver Export** : Exporter non seulement les campagnes, mais aussi les GameDrivers (systèmes de règles) comme bundles autonomes.
- **[x] Nexus-OS v2 — Vérification & Localisation des URLs distantes** : Détection automatique des URLs HTTP non-portables avec téléchargement interactif vers le Media Hub.
- **[x] Agnostic AI Core & Local Stability** : Intégration de Gemma 4 26B MoE via Ollama avec stabilisation réseau (`net.fetch`) et forçage DNS IPv4 pour Windows.
- **[x] Tablet Hub Media Proxy & Protocol Sync** : Résolution des erreurs 404 (préfixe m-) et support des protocoles gmos:// pour tablettes distantes.
- **[x] Session-OS Module Extraction & i18n** : Modularisation de la logique (PNJ, Indices, Notes) dans des hooks réutilisables et localisation complète (Fr/En).
- **[x] Nexus-OS v2 Core — Security & Manifest** : Validation proactive des chemins d'importation et assainissement des manifestes de campagne contre les injections de chemins malveillants.
- **[x] Global I18n Standardization** : Mise en œuvre du standard de nesting de niveau 2 pour les nouveaux modules i18next afin d'éviter les collisions de namespaces.

---

## ⚔️ Phase 2 : Combat & Mécaniques (Juin—Juillet 2026)

Refonte des systèmes de jeu pour une automatisation intelligente.

- **[x] Character Sheet Calculation Engine** : Moteur de calcul intégré capable d'interpréter des formules complexes (ex: `1d20 + @StrMod + @Level`). Support de la réactivité live et résolution par labels.
- **[x] Tactical Combat Assistant** : Interface IA suggérant des actions de PNJ en fonction de la situation tactique sur l'Atlas. (v6.2.3-dev - 9 Avril 2026)
- **[x] Raffinement Inventaire Tablette** : Ajout du bouton "Jeter", confirmations de suppression et synchronisation MJ-PJ optimiste. (v6.2.4-dev - 9 Avril 2026)
- **[x] Module de Loot de Session** : Gestion d'un pool de butin partagé, distribution aux joueurs et historique de loot. (v6.2.5-dev - 9 Avril 2026)
- **[x] Échanges d'objets (P2P)** : Permettre aux joueurs de se donner des objets via le Hub avec validation MJ (v6.2.2-dev).
- **[x] Notes Privées PJ** : Zone de prise de notes persistante côté serveur MJ. (v6.2.1-dev)
- **[x] MapStore & Ambiance System** : Gestion de l'état de l'atlas (pions, brouillard, météo) intégrée au flux de synchronisation réactif. Système de moments de la journée avec filtres dynamiques (v6.1.0-dev).
- **[x] Moteur de Rendu 3D Dice-OS** : Intégration de Three.js, support géométrique d4-d20, logique d100 et esthétique "Crystal" stabilisée. (v6.3.0-dev - 16 Avril 2026)

---

## 🏺 Phase 3 : World Building & Forge (Août 2026+)

Extension des capacités de création et de partage.

- **[ ] Synchronisation P2P (Tauri)** : Migration du pont WebSocket vers Peer-to-Peer.
- **[x] Timeline Interactive** : Visualisation chronologique des événements générés depuis le Wiki.
- **[x] AI NPC Dialogue Prep** : Génération de répliques à la volée via l'Oracle pour les favoris. (v6.1.2-dev)

---

## 📅 Prochainement (En Attente)

Ces fonctionnalités sont prévues mais temporairement mises de côté pour prioriser les mécaniques de jeu core.

- **[ ] Forge Social Integration** : Partage de templates de fiches et de drivers système entre utilisateurs.
- **[ ] Multimedia Narrative Engine** : Support natif pour les ambiances spatialisées et vidéos de fond synchronisées sur les Hubs.

---

## 🧹 Dette Technique en Cours

| Item | Priorité | Statut |
|---|---|---|
| Styles inline dans `NexusHUD.tsx` (barres de progression) | Faible | ✅ Complété |
| Styles inline dans `RemoteWhiteboardView.tsx` | Faible | ✅ Complété |
| Bouton sans `title` dans `CampaignDetails.tsx` | Faible | ✅ Complété |
| Tests Vitest pour `NexusService` (round-trip) | Moyenne | ✅ Complété |
| Cycle de rendu infini dans `MapCanvas` (zoom bounce) | Haute | ✅ Résolu |
| Projection Map-OS rompue sur clients distants | Haute | ✅ Résolu |
| Conscience de session pour l'Oracle IA (PJ/Indices) | Moyenne | ✅ Complété |
| Validation polymorphe pour imports partiels Nexus-OS | Haute | ✅ Résolu |
| Migration URLs HTTP → Media Hub (campagne Anges de Feu) | Moyenne | ✅ Complété (Auto-Migration v2) |
| Rendu Proxy Tablet Hub (m- prefix & protocol gmos://) | Haute | ✅ Résolu |
| Doublons d'entités (Spotlight vs Favorite) sur Hubs | Haute | ✅ Résolu (v6.3.2) |
| Optimisation Latence Cortex (Parallel Execution) | Haute | ✅ Complété |
| Stabilisation Build v6 (TS Strict & verbatrimModuleSyntax) | Haute | ✅ Résolu |
| Fuite de connexions WebSocket (Double notifications Hub) | Haute | ✅ Résolu |
| Densité visuelle Tablet Hub (Optimisation échelle UI)  | Moyenne | ✅ Complété |
| Incohérence des accents dans le Calculateur de Dégâts (Encodage) | Haute | ✅ Résolu (v6.2.6-dev) |
| Nesting I18n conflict (Map vs Module) | Haute | ✅ Résolu |
| Intégration High-Fidelity 3D Dice | Moyenne | ✅ Complété |
| Bug Syntax 500 dans DiceBox3D | Haute | ✅ Corrigé |
| Précision géométrique d10 (Manual Modeling) | Moyenne | ✅ Validé |

---
*Dernière mise à jour : 16 Avril 2026 (09h40)*
*Statut : Version 6.3.2 - Unification & Nettoyage Hub Complet.*

### [v6.3.1-dev] - Player Hub Stabilization & Premium Refactoring
- [x] **Architecture Hub** : Migration du `PlayerHub` vers le hook unifié `useHubSync`.
- [x] **Modularisation** : Extraction des widgets (`HubCombatTracker`, `HubClockWidgets`).
- [x] **Premium Visuals** : Ajout des scanlines v6, transitions Framer Motion et effets de grain cinématique.
- [x] **Bridge Isolation** : Suppression des dépendances directes à `appBridge` dans l'UI du Hub.

### [v6.3.2-dev] - Unification & Déduplication Hub
- [x] **Purger le mode Théâtre** : Suppression complète de `displayMode` et des boutons "Agrandir/Réduire".
- [x] **Unification visuelle** : `HubProjectionCard` devient le seul vecteur de rendu.
- [x] **Système Anti-Doublon** : Filtrage intelligent par ID, Nom et URL d'image sur Player et Tablet Hub.
- [x] **Correction Critique** : Fix `ReferenceError` sur `HubCombatTracker` et restauration du signal vocal.
