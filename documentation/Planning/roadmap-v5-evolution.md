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

## 🛠️ Stabilisation Temps Réel (V5.5 — Avril 2026)

### ✅ V5.5 : Stabilisation Temps Réel & Préparation V7 (Terminé)
- [x] **Authoritative Master Relay** : Suppression des boucles de relay esclaves (Snapback fix).
- [x] **Handshake `hub:ready`** : Initialisation atomique des projections.
- [x] **Universal Window Guard** : Détection robuste Master/Slave via URL Params.
- [x] **Documentation Migration** : Guide de simplification pour le passage sous Tauri.
- **[x] Synchronisation Environnementale** : Parité immédiate du climat (Météo/Temps/Magie) sur tous les écrans dès le chargement.
- **[x] Correction Snapback & Ping** : Résolution des boucles de relay saturant l'IPC.

### [v7.0.4] - Super-Stable Identity & UI Debug (2026-04-27)
- **Fix**: Découplage du `deviceId` du store principal. Utilisation d'une clé `localStorage` matérielle dédiée (`gmos-tablet-uuid`) pour une stabilité totale.
- **UI**: Affichage du `Device ID` dans le footer du Hub pour faciliter le diagnostic.

### [v7.0.3] - Robust Resumption & IP Fallback (2026-04-27)
- **Fix**: Stabilisation de l'initialisation du `deviceId` (lecture immédiate du localStorage) pour éviter les changements d'ID au refresh.
- **Feature**: Session Recovery par IP. Si le `deviceId` est perdu mais que l'IP match une session "ghost", le serveur autorise le takeover du personnage.

### [v7.0.2] - Session Resumption & Multi-Socket Stability (2026-04-26)
- **Feature**: Session Resumption via `deviceId`. Permet à un joueur de reprendre son personnage après une déconnexion accidentelle s'il utilise le même appareil.
- **Fix**: Multi-Socket Tracking. Le serveur ne passe plus une session en "ghost" si au moins un onglet/connexion reste actif pour l'appareil.
- **UX**: Nouveau bouton "Quitter la session" (logout) qui préserve l'identité matérielle tout en libérant le personnage.

### [v7.0.1] - Maintenance & Eject All (2026-04-26)

- **[x] Verrouillage de Personnage Robuste** : Correction du mismatch de clé `characterLocks` et gestion des collisions serveur (`remote:error`).
- **[x] Enregistrement Réactif** : Re-validation immédiate du WebSocket lors du changement de personnage dans le Lobby.
- **[x] Eject-All & Global Reset** : Bouton de réinitialisation complète des terminaux avec notification d'éjection et reset du store client.

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

*Dernière mise à jour : 26 Avril 2026*
*Statut : GM-OS v5.6 (Maintenance & Identité) complétée.*

