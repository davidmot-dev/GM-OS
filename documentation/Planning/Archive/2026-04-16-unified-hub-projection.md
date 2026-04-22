# Journal Historique : Unification & Nettoyage Hub (v6.3.2)
**Date :** 16 Avril 2026

## 🎯 Contexte du Changement
Suite à l'introduction du "Mode Théâtre" (v6.3.1), l'interface des Hubs (Player / Tablet) était devenue trop complexe. La gestion de deux types d'affichage différents (vue portrait à gauche, détails à droite) générait des incohérences visuelles, notamment des doublons d'affichage pour une même entité projetée plusieurs fois.

## 🛠️ Actions Réalisées

### [ARCHITECT] Dénucléarisation du Mode Théâtre
- **Suppression** : Retrait complet de l'état `displayMode` et des drapeaux `isTheater` dans les stores et composants.
- **Simplification** : Les Hubs n'affichent plus que la "Réception Visuelle" (images et portraits), sans sidebar de détails.
- **Zéro Code Mort** : Purge des fichiers `HubTheaterOverlay.tsx` et des hooks associés.

### [UI] Unification visuelle (`HubProjectionCard`)
- Le composant `HubProjectionCard` est redimensionné pour être l'unique vecteur de projection.
- Ajout d'une gestion intelligente de grille (responsive grid) capable d'afficher simultanément des PNJs, des Lieux, des Objets et des Images de scène.

### [LOGIC] Système de Déduplication Multiniveau
Implémentation d'un algorithme de filtrage "Anti-Bruit" pour éviter les doublons :
1. **Priorité Spotlight** : L'entité activement projetée par le MJ (`liveEntity`) est reine.
2. **Filtrage des Favoris** : Si un PNJ présent dans les favoris synchronisés correspond à l'entité projetée (par ID ou Nom), il est masqué de la galerie des favoris.
3. **Optimisation Médias** : Si une image projetée (`liveImagePath`) correspond à l'avatar d'un PNJ déjà affiché, l'image seule est masquée pour préserver le contexte du personnage.

### [HOTFIX] Stabilité & Signal Vocal
- **Correctif d'Import** : Correction d'une `ReferenceError` sur `HubCombatTracker` dans le `PlayerHub`.
- **Feedback Vocal** : Restauration d'un signal visuel discret au bas de l'écran (`voiceLevel`) pour indiquer l'activité vocale du MJ sur tous les Hubs.

## ✅ Impact
- **Maintenance** : Réduction de la base de code UI Hub de ~25%.
- **UX Joueur** : Interface plus propre, centrée sur l'immersion visuelle.
- **Performance** : Charge CPU réduite grâce à la suppression des composants de sidebar et de la logique de switch de layout.

---
*Ce changement marque la fin du cycle de stabilisation "Next-Gen Hub" entamé en début de mois.*
