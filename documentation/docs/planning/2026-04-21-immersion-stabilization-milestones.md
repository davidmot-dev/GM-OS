# 🗺️ Roadmap & Jalons : Vague d'Immersion & Stabilisation (Avril 2026)

Ce document suit l'évolution des modules Immersion (Light-OS) et Social (Nexus) durant la phase de stabilisation v6.3.4.

## 🏁 Jalons Atteints (2026-04-21)

### 💡 Light-OS : Expansion Majeure
- [x] **21 Nouveaux Effets** : Implémentation de boucles logiques complexes (Lever de Soleil, Trou Noir, Cyberpunk...).
- [x] **Catégorisation UI** : Restructuration du sélecteur par thématiques (Nature, SF, Fantastique...).
- [x] **Optimisation Performance** : Découplage des boucles haute-fréquence de l'état React.
- [x] **Correction 'Aura Sacrée'** : Révision de la visibilité et de la vitesse de pulsation.

### 🔗 Nexus & Dice-OS : Stabilisation
- [x] **Réactivité Physique** : Pilotage dynamique de l'alpha D3 pour des réglages en temps réel.
- [x] **Sync P2P Robuste** : Correction de la diffusion des lancers de dés vers les Hubs.
- [x] **Fix Portraits** : Support complet des caractères spéciaux dans les chemins d'assets locaux.

### 📜 Atelier de Forge & Partage (2026-04-22)
- [x] **Partage de Fiches** : Transmission instantanée de règles markdown vers les tablettes joueurs via `session:display-rule`.
- [x] **HubRuleViewer** : Nouveau composant modal premium pour la lecture de lore et de règles sur Hub.
- [x] **Export Obsidian** : Intégration du service d'export vers le vault personnel du MJ.
- [x] **Persistence MD** : Lecture/Écriture robuste des fichiers de règles via le bridge Electron.

## 📋 Backlog Prioritaire (À venir)

### 🧪 Améliorations Prochaines
- [ ] **Light-OS & Storyboard** : Intégration des nouveaux effets dans l'orchestrateur global.
- [ ] **Nexus Relation Engine** : Ajout de types de relations personnalisés avec influence sur la physique du graphe.
- [ ] **Voice-OS Integration** : Couplage de l'intensité lumineuse avec le niveau sonore de l'entrée micro (Voice-to-Light).

## 📉 Dette Technique & Maintenance
- [ ] Migration finale de `/docs` vers `/documentation`.
- [ ] Audit complet des fichiers de traduction pour éviter les doublons entre modules.
