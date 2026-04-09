# 🛣️ Roadmap : Transition vers GM-OS v6 (Next-Gen Hub)

Ce document trace les grandes orientations du projet suite à la stabilisation de la v5.15 et l'ouverture du cycle de développement v6.1.0-dev.

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

---

## ⚔️ Phase 2 : Combat & Mécaniques (Juin—Juillet 2026)

Refonte des systèmes de jeu pour une automatisation intelligente.

- **[x] Character Sheet Calculation Engine** : Moteur de calcul intégré capable d'interpréter des formules complexes (ex: `1d20 + @StrMod + @Level`). Support de la réactivité live et résolution par labels.
- **[ ] Tactical Combat Assistant** : Interface IA suggérant des actions de PNJ en fonction de la situation tactique sur l'Atlas.
- **[x] Échanges d'objets (P2P)** : Permettre aux joueurs de se donner des objets via le Hub avec validation MJ (v6.2.2-dev).
- **[x] Notes Privées PJ** : Zone de prise de notes persistante côté serveur MJ. (v6.2.1-dev)
- **[x] MapStore & Ambiance System** : Gestion de l'état de l'atlas (pions, brouillard, météo) intégrée au flux de synchronisation réactif. Système de moments de la journée avec filtres dynamiques (v6.1.0-dev).

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
| Synchronisation Ambiance & Blend-modes (Map-OS) | Haute | ✅ Résolu |
| Rendu Proxy Tablet Hub (m- prefix & protocol gmos://) | Haute | ✅ Résolu |
| Doublons d'entités (Spotlight vs Favorite) sur Hubs | Moyenne | ✅ Résolu |

---
*Dernière mise à jour : 9 Avril 2026 (11h15)*
*Statut : Navigation stabilisée. IA Agnostique, Notes Privées & Synchronisation Tablet Hub 100% opérationnels.*
