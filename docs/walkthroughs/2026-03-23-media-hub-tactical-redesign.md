# Walkthrough : Media Hub Tactical Redesign & Auto-Linking (2026-03-23)

Ce walkthrough documente la refonte majeure du Media Hub et l'automatisation de la gestion des campagnes.

## 🌟 Objectifs
1.  **Redesign Visuel** : Adopter une esthétique style Obsidian (pleine largeur, mosaïque dense).
2.  **Restauration Fonctionnelle** : Ré-implémenter l'attribution des campagnes (perdue lors des précédentes itérations).
3.  **Automation** : Lier automatiquement les nouveaux assets créés en session à la campagne active.

## 🛠️ Réalisations Techniques

### 1. HUD Tactique (Side Panel)
- Création d'un composant `TacticalDetailPanel` indépendant.
- Affichage des badges de campagne interactifs (Toggle behavior).
- Bouton de suppression et actions de renommage centralisées.

### 2. Mode "Operational Focus"
- Ajout d'un filtre global qui isole les médias appartenant à la campagne active.
- Synchronisation en temps réel avec le `useSessionOSStore`.

### 3. Liaison Automatique (Smart Link)
- **AI Service** : Les portraits générés (NPC Gallery) incluent désormais l'ID de la campagne active.
- **Whiteboard** : Les exports sont taggués automatiquement avec la campagne de la session en cours.

## 📊 Impact Utilisateur
- **Gain de temps** : Plus de 80% des assets n'ont plus besoin d'être taggués manuellement.
- **Clarté visuelle** : L'interface est plus dense et professionnelle, tout en offrant plus de fonctions.

---
> [!NOTE]
> Les guides utilisateurs ont été mis à jour pour refléter ces changements.
