# Walkthrough : GM-OS v5 Stability Patch (28 Mars 2026)

Ce walkthrough récapitule les travaux effectués pour stabiliser le **Tablet Hub** et sécuriser les données du **Session-OS**.

## 🛡️ Correctifs Majeurs

### 1. Synchronisation des Médias (Tablet Hub)
**Problème :** Les tablettes distantes ne pouvaient pas résoudre les IDs `m-xxx` (Local MJ).
**Solution :**
- Ajout d'une pré-résolution exhaustive dans `App.tsx` (MJ).
- Mise à jour du `mediaResolver.ts` pour exporter les Blobs vers le proxy local `/temp`.
- Implémentation d'un `failsafe` dans `useMediaUrl.ts` (Tablette) pointant vers l'IP du MJ.

### 2. Isolation des Campagnes (Session Data Leakage)
**Problème :** Des indices ("Milo") d'autres campagnes apparaissaient dans le cockpit.
**Solution :**
- Filtrage systématique par `activeCampaignId` dans :
    - `SessionClueDeck.tsx` (Deck de Session).
    - `OraclePanel.tsx` (Contexte de l'IA).
    - `NpcDetail.tsx` (Détails PNJ).
    - `AtlasMapDetail.tsx` (Détails Carte).

## 🏗️ Architecture Technique

### Deep Sync Protocol (Nexus Bridge)
Le pont de synchronisation MJ <-> Tablette a été renforcé pour inclure non seulement les personnages, mais aussi tout le contexte visuel (Wallpapers, portraits, indices) pré-résolu en URLs réseau.

### Data Governance
L'herméticité entre les campagnes est désormais garantie par le filtrage à la source de l'état global. Chaque module (Session-OS, Image-OS) suit désormais le verrou d'ID de la campagne active.

## ✅ Statut de la Validation

- **Vérification du Code** : Audit de tous les sélecteurs Zustand pour confirmer l'isolation par ID.
- **Dépannage Réseau** : Le serveur proxy local sur le port 3001 est désormais le canal de confiance pour les ressources binaires.

---
*Fichier généré automatiquement via le workflow /doc.*
