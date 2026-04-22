# 🗺️ Roadmap : Évolution GM-OS v5

Ce document trace la trajectoire du projet, des jalons franchis aux futures innovations planifiées par la BMAD Team.

## 🏁 Jalons Franchis (V5 initial - Mars 2026)

- **[x] Refonte Modulaire du Session-OS** : Architecture par slices (store/index.ts) et déportation du cockpit.
- **[x] Hub Virtuel Joueur (Tablet Hub)** : Interface interactive synchronisée en temps réel.
- **[x] L'Oracle AI & Rule Engine** : Intégration de modèles d'IA pour l'aide à la maîtrise et l'interprétation des règles.
- **[x] Image-OS & Map-OS Cohesion** : Gestion fluide des projections de médias et de cartes tactiques.

## 🚀 Dernières Evolutions (Patch de Stabilité V5.1 — Mars 2026)

- **[x] Système d'Inventaire Privé** : Capacité pour le MJ de donner des objets à des joueurs spécifiques (Secure Sync).
- **[x] Pont Magique Wiki v2** : Support du Lore et liaison de campagne automatique.
- **[x] Optimisation Lobby & Session** : Amélioration de la visibilité des joueurs et de l'accessibilité.
- **[x] Refonte Deck-OS (Modular & Hooks)** : Architecture découplée et accessibilité (v5.Stability).

## 🛰️ Nexus-OS Phase 1 — Portabilité Totale (Avril 2026)

- **[x] Nexus-OS MVP** : Export/Import de campagnes complètes en `.gmos` (ZIP structuré, manifest SHA-256).
- **[x] Harvesting Médias** : Bundling des images et fichiers locaux (Media Hub `m-xxx` + chemins absolus).
- **[x] Streaming IPC** : Pattern anti-truncation `registerAsset` / `clearAssets` pour les gros payloads.
- **[x] Portabilité Audio** : Export/Import des atmosphères Sound Board et playlists Music locales.
- **[x] Nexus HUD** : Interface de progression en temps réel (Glassmorphism).
- **[x] Indicateur Nexus-Ready** : Badge de portabilité dans la bibliothèque de campagnes.
- **[x] Conflict Resolver** : Gestion interactive des doublons d'ID (Remplacer / Cloner / Annuler).

## 📅 Prochaines Étapes (Roadmap v6)

### Q2 2026 : Interaction Sociale & Échange

- **[ ] Échanges d'objets** : Permettre aux joueurs de se donner des objets via le Hub (nécessite validation MJ).
- **[ ] Notes Privées PJ** : Ajout d'une zone de prise de notes dans le Hub avec persistance côté serveur MJ.
- **[ ] Gestion de l'Encombrement** : Intégration optionnelle du poids et de la charge (selon le driver de jeu).
- **[ ] Nexus-OS v2 — Driver Export** : Exporter les GameDrivers (systèmes de règles) comme bundles autonomes.

### Q3 2026 : Immersion Tactique & Combat-OS

- **[x] Deck-OS Intégration** : Utilisation de cartes d'initiative et de pouvoirs directement depuis le Hub.
- **[ ] Brouillard de Guerre Interactif** : Révélation de zones de l'Atlas Map directement par les joueurs.

### Q4 2026 : Écosystème & Intelligence Narrative

- **[ ] AI NPC Dialogue Prep** : Génération de répliques et de traits de caractère à la volée via l'Oracle.
- **[ ] Timeline Interactive** : Visualisation chronologique des événements de campagne depuis le Wiki.

---

*Dernière mise à jour : 3 Avril 2026*
*Statut : Nexus-OS Phase 1 complétée. Portabilité totale validée.*
