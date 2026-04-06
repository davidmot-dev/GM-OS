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
- **[ ] Oracle IA Contextuel** : Intégration complète de l'historique de la chronique dans les prompts pour des réponses cohérentes avec la narration passée.
- **[ ] Nexus-OS v2 — Driver Export** : Exporter non seulement les campagnes, mais aussi les GameDrivers (systèmes de règles) comme bundles autonomes.
- **[ ] Nexus-OS v2 — Vérification des URLs distantes** : Avertir l'utilisateur des URLs HTTP non-portables dans le HUD (avec suggestion de migration vers le Media Hub).
- **[ ] UI Premium (Glassmorphism 2.0)** : Refonte visuelle complète des composants de Session-OS.

---

## ⚔️ Phase 2 : Combat & Mécaniques (Juin—Juillet 2026)

Refonte des systèmes de jeu pour une automatisation intelligente.

- **[ ] Character Sheet Calculation Engine** : Moteur de calcul intégré capable d'interpréter des formules complexes (ex: `1d20 + @StrMod + @Level`).
- **[ ] Tactical Combat Assistant** : Interface IA suggérant des actions de PNJ en fonction de la situation tactique sur l'Atlas.
- **[ ] Échanges d'objets (P2P)** : Permettre aux joueurs de se donner des objets via le Hub (nécessite validation MJ).
- **[ ] Notes Privées PJ** : Zone de prise de notes persistante côté serveur MJ.

---

## 🏺 Phase 3 : World Building & Forge (Août 2026+)

Extension des capacités de création et de partage.

- **[ ] Forge Social Integration** : Partage de templates de fiches et de drivers système entre utilisateurs.
- **[ ] Multimedia Narrative Engine** : Support natif pour les ambiances spatialisées et vidéos de fond synchronisées sur les Hubs.
- **[ ] Synchronisation P2P (Tauri)** : Migration du pont WebSocket vers Peer-to-Peer.
- **[ ] Timeline Interactive** : Visualisation chronologique des événements générés depuis le Wiki.
- **[ ] AI NPC Dialogue Prep** : Génération de répliques à la volée via l'Oracle pour les favoris.

---

## 🧹 Dette Technique en Cours

| Item | Priorité | Statut |
|---|---|---|
| Styles inline dans `NexusHUD.tsx` (barres de progression) | Faible | ✅ Complété |
| Styles inline dans `RemoteWhiteboardView.tsx` | Faible | ✅ Complété |
| Bouton sans `title` dans `CampaignDetails.tsx` | Faible | ✅ Complété |
| Tests Vitest pour `NexusService` (round-trip) | Moyenne | ✅ Complété |
| Migration URLs HTTP → Media Hub (campagne Anges de Feu) | Moyenne | ✅ En cours (Logs actifs) |

---
*Dernière mise à jour : 6 Avril 2026*
*Statut : Phase 0 terminée. Dette technique résorbée. Phase 1 — Nexus-Link opérationnel.*
