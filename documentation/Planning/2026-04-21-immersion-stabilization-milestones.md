# 🗺️ Roadmap & Jalons : Vague d'Immersion & Stabilisation (Avril 2026)

Ce document suit l'évolution des modules Immersion (Light-OS) et Social (Nexus) durant la phase de stabilisation v6.3.4.

> ### 🗃️ Vérifié dans le code le 2026-08-31
>
> Ce document est un **jalon daté d'avril 2026**, pas une liste vivante. Ses cases restées vides ont
> été rouvertes une à une : ce qui était fait est coché avec son ancre, ce qui reste a rejoint la
> **section ⭐** de `2026-08-23-chantiers-gares.md`, seule liste qui fasse foi.


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
- [x] **Light-OS & Storyboard** ✅ **Fait** — un moment de storyboard applique sa scène lumineuse :
      `useStoryboardStore.ts:182` (`moment.lightSceneId` → `hueEngine.applyScene`).
- [ ] **Nexus Relation Engine** : types de relations personnalisés. → **retenu par David le 31/08**,
      section ⭐. `EntityRelation.type` est aujourd'hui une union **fermée** de huit valeurs
      (`src/types/entity.types.ts:54`).
- [ ] **Voice-OS Integration** (Voice-to-Light). → **retenu par David le 31/08**, section ⭐. Aucun lien
      du module `light` vers `voice` à ce jour.

## 📉 Dette Technique & Maintenance
- [x] ~~Migration finale de `/docs` vers `/documentation`.~~ ⛔ **CADUQUE, et devenue dangereuse.** En
      avril c'était du ménage ; depuis, **`docs/` est la racine du corpus** que l'Oracle indexe —
      systèmes, fiches, index des livres. *L'exécuter aujourd'hui casserait le RAG.* Ligne conservée
      barrée plutôt que supprimée : quelqu'un la reproposerait.
- [ ] Audit des fichiers de traduction. → **fondu dans le même reste que la « validation multi-langue »**
      ci-dessus : c'est une seule mesure, section ⭐. Compté le 31/08 : 8 libellés répétés plus de deux
      fois en `fr`, 5 en `en` — *le vrai défaut n'était pas les doublons, c'étaient les 32 clés absentes
      de l'anglais.*
