# Walkthrough - V5 Stability Patch (28 Mars 2026)

Ce patch se concentre sur la robustesse du Tablet Hub, l'isolation des données par campagne et la maintenance du système de sessions.

## Changements Majeurs

### 1. Résolution des Médias (Tablet Hub)
**Problème :** Les tablettes distantes ne parvenaient pas à charger les images locales du MJ.
**Solution :**
- Nouveau protocole de résolution d'URL dans `SessionWorkspace.tsx`.
- Passage par l'URL absolue du MJ (`appBridge.getMediaUrl`) pour les clients distants.
- Implémentation d'un `failsafe` dans `useMediaUrl.ts` (Tablette) pointant vers l'IP du MJ.

### 2. Isolation des Campagnes (Session Data Leakage)
**Problème :** Des indices d'autres campagnes apparaissaient dans le cockpit.
**Solution :**
- Filtrage systématique par `activeCampaignId` dans :
    - `SessionClueDeck.tsx` (Deck de Session).
    - `OraclePanel.tsx` (Contexte de l'IA).
    - `NpcDetail.tsx` (Détails PNJ).
    - `AtlasMapDetail.tsx` (Détails Carte).

### 3. Gestion des Sessions
- **Suppression** : Ajout d'une fonctionnalité de suppression de session dans le `Session Prep`.
- **Sécurité** : Intégration de `gmConfirm` pour prévenir les suppressions accidentelles.
- **Feedback** : Confirmation par toast après suppression réussie.

## Documentation & NotebookLM
- Mise à jour de `docs/dev/Lessons_Learned_Archive.md` avec les nouveaux protocoles média.
- Synchronisation complète du compagnon **NotebookLM** (`GM-OS v5.9 Documentation Base`) avec les dernières spécifications techniques.
- L'IA Oracle dispose désormais d'un contexte à jour pour assister le MJ.

## Vérification
- [x] Test de filtrage des indices (Campagnes isolées).
- [x] Test de résolution média (Accès distant OK).
- [x] Test de suppression de session (Modale + Toast OK).
- [x] Synchronisation NotebookLM validée.

## ✅ Statut de la Validation

- **Vérification du Code** : Audit de tous les sélecteurs Zustand pour confirmer l'isolation par ID.
- **Dépannage Réseau** : Le serveur proxy local sur le port 3001 est désormais le canal de confiance pour les ressources binaires.
- **Data Governance** : Chaque module (Session-OS, Image-OS) suit désormais le verrou d'ID de la campagne active.

---
*Fichier généré automatiquement via le workflow /doc.*
